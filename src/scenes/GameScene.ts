import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SceneKeys } from '@/core/SceneKeys';
import { AssetKeys } from '@/core/AssetKeys';
import { WORLD, GAME_EVENTS, COLORS, ENEMY } from '@/core/Constants';
import { Player } from '@/entities/Player';
import { Enemy } from '@/enemies/Enemy';
import { EnemyFactory } from '@/enemies/EnemyFactory';
import { EnemySpawner } from '@/enemies/EnemySpawner';
import { BossSystem } from '@/systems/BossSystem';
import { EnemyProjectile, ProjectileType } from '@/enemies/EnemyProjectile';
import { InputManager, PlayerInputState } from '@/managers/InputManager';
import { WeaponSystem } from '@/systems/WeaponSystem';
import { EnemySystem } from '@/systems/EnemySystem';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { Explosion } from '@/effects/Explosion';
import { DamageNumber } from '@/effects/DamageNumber';
import { GameStateManager } from '@/managers/GameStateManager';
import { CameraManager } from '@/managers/CameraManager';
import { GameState } from '@/types/GameState';
import { WaveSystem } from '@/systems/WaveSystem';
import { LootSystem } from '@/systems/LootSystem';
import { PowerUpSystem } from '@/systems/PowerUpSystem';

import { HUD } from '@/ui/HUD/HUD';
import { UILayoutManager, UILayout } from '@/ui/UILayoutManager';
import { ScreenManager } from '@/ui/ScreenManager';
import { NotificationManager } from '@/ui/NotificationManager';
import { PauseMenu } from '@/ui/PauseMenu';
import { SettingsOverlay } from '@/ui/SettingsOverlay';
import { GameOverOverlay } from '@/ui/GameOverOverlay';
import { WaveBanner } from '@/ui/WaveBanner';
import { MobileControls } from '@/ui/MobileControls/MobileControls';
import { HapticFeedback } from '@/ui/MobileControls/FireButton';
import { EnvironmentSystem } from '@/systems/EnvironmentSystem';
import { audioManager } from '@/audio/AudioManager';
import { WeaponMetadata } from '@/weapons/WeaponType';

export class GameScene extends BaseScene {
  public player!: Player;
  public environmentSystem!: EnvironmentSystem;
  public inputManager!: InputManager;
  public weaponSystem!: WeaponSystem;
  public enemySystem!: EnemySystem;
  public bossSystem!: BossSystem;
  private enemyProjectileGroup!: Phaser.Physics.Arcade.Group;

  private gameStateManager!: GameStateManager;
  private cameraManager!: CameraManager;
  private waveSystem!: WaveSystem;
  private powerUpSystem!: PowerUpSystem;

  // UI layer
  private layoutManager!: UILayoutManager;
  private screenManager!: ScreenManager;
  private hud!: HUD;
  private mobileControls?: MobileControls;

  private debugText?: Phaser.GameObjects.Text;
  private debugBg?: Phaser.GameObjects.Graphics;
  private escKey?: Phaser.Input.Keyboard.Key;
  private bulletHits = 0;

  constructor() {
    super(SceneKeys.GAME);
  }

  create(): void {
    this.cameraManager = new CameraManager(this);
    this.cameraManager.fadeIn(600);

    // --- Infrastructure ---
    this.layoutManager = new UILayoutManager(this);
    this.screenManager = new ScreenManager(this);
    this.inputManager = new InputManager(this);

    // Bake all procedural enemy textures on scene creation
    EnemyFactory.generateAllTextures(this);

    // --- World & Entities ---
    this.createWorld();
    this.weaponSystem = new WeaponSystem(this);
    this.createPlayer();

    this.enemySystem = new EnemySystem(this);
    void new EnemySpawner(this, this.enemySystem.getGroup());
    this.bossSystem = new BossSystem(this, this.weaponSystem.getProjectileGroup());
    this.gameStateManager = new GameStateManager(this);
    this.waveSystem = new WaveSystem(this);
    // LootSystem is self-managing via events, no need to store reference
    new LootSystem(this);
    this.powerUpSystem = new PowerUpSystem(this, this.player, this.weaponSystem);

    // --- UI Layer (GameScene orchestrates, not InputManager) ---
    this.hud = new HUD(this, this.layoutManager);
    this.hud.setWeaponName(this.weaponSystem.getWeaponName());

    new NotificationManager(this, this.layoutManager);

    const waveBanner = new WaveBanner(this);
    void waveBanner; // self-managing via events

    // Mobile controls — only spawn on touch devices
    if (this.sys.game.device.input.touch) {
      this.mobileControls = new MobileControls(this, this.layoutManager);
    }

    // --- Overlays (registered with ScreenManager) ---
    const gameOverOverlay = new GameOverOverlay(this);
    this.screenManager.register('gameover', gameOverOverlay);

    const pauseMenu = new PauseMenu(
      this,
      () => this.resumeGame(),
      () => this.screenManager.show('settings'),
      () => this.transitionTo(SceneKeys.MENU, 400)
    );
    this.screenManager.register('pause', pauseMenu);

    const settingsOverlay = new SettingsOverlay(this, this.layoutManager, () => this.screenManager.show('pause'));
    this.screenManager.register('settings', settingsOverlay);

    // --- Physics & Collision ---
    new CollisionSystem(
      this,
      this.player,
      this.weaponSystem.getProjectileGroup(),
      this.enemySystem.getGroup()
    );

    // Pooled group for all enemy projectiles (Mines, Lasers, Homing Missiles)
    this.enemyProjectileGroup = this.physics.add.group({
      classType: EnemyProjectile,
      maxSize: 80,
      runChildUpdate: true
    });

    this.physics.add.overlap(
      this.player,
      this.enemyProjectileGroup,
      this.handlePlayerProjectileOverlap as any,
      () => !this.player.getIsDead(),
      this
    );

    this.setupEventListeners();
    this.setupWeaponSwitchControls();
    this.setupPauseKey();
    this.createCamera();
    this.createDebugUI();

    // Start ambient deep-space cosmic sound
    audioManager.startAmbientSpaceMusic();
  }

  update(time: number, delta: number): void {
    const currentState = this.gameStateManager.getState();

    if (currentState === GameState.PAUSED || currentState === GameState.GAME_OVER) {
      if (import.meta.env.DEV) {
        this.updateDebugUI(this.inputManager.getInputState());
      }
      return;
    }

    // Inject mobile state into InputManager before reading
    if (this.mobileControls) {
      this.inputManager.setMobileState(this.mobileControls.getState());
    }

    const inputState = this.inputManager.getInputState();

    // Update planetary physics, comets, asteroid culling, and twinkling starfields
    this.environmentSystem.update(time, delta, this.player.x, this.player.y);

    // Update Boss System
    this.bossSystem.update(time, delta, this.player.x, this.player.y);

    // Zoom camera dynamically near large planets or active bosses (smooth linear interpolation over 300ms)
    const debugInfo = this.environmentSystem.getDebugInfo(this.player.x, this.player.y);
    const l = this.layoutManager.get();
    const baseZoom = l.cameraZoom;
    const isBossActive = !!this.bossSystem.getActiveBoss();
    const targetZoomScale = isBossActive ? 0.82 : (debugInfo.nearestPlanetDistance < 1200 ? 0.92 : 1.0);
    const targetZoom = baseZoom * targetZoomScale;
    const currentZoom = this.cameras.main.zoom;
    this.cameras.main.zoom = Phaser.Math.Linear(currentZoom, targetZoom, 0.08);

    this.player.update(inputState);
    this.weaponSystem.update(time, delta, this.player, inputState);
    this.enemySystem.update(time, delta);
    this.waveSystem.update(time, delta);
    this.powerUpSystem.update(time, delta);

    if (import.meta.env.DEV) {
      this.updateDebugUI(inputState);
    }
  }

  // ---------------------------------------------------------------------------
  // Pause / Resume
  // ---------------------------------------------------------------------------

  private setupPauseKey(): void {
    if (this.input.keyboard) {
      this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.escKey.on('down', this.togglePause, this);
    }
  }

  private togglePause(): void {
    const state = this.gameStateManager.getState();
    if (state === GameState.PLAYING) {
      this.pauseGame();
    } else if (state === GameState.PAUSED) {
      this.resumeGame();
    }
  }

  private pauseGame(): void {
    this.gameStateManager.setState(GameState.PAUSED);
    this.physics.world.pause();
    this.screenManager.show('pause');
  }

  private resumeGame(): void {
    this.gameStateManager.setState(GameState.PLAYING);
    this.physics.world.resume();
    this.screenManager.show('none');
  }

  // ---------------------------------------------------------------------------
  // Weapon Switching Controls
  // ---------------------------------------------------------------------------

  private setupWeaponSwitchControls(): void {
    if (!this.input.keyboard) return;

    const kb = this.input.keyboard;
    const key1 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    const key2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    const key3 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    const key4 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    const key5 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);
    const keyQ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    const keyE = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    key1.on('down', () => this.weaponSystem.switchWeapon(0));
    key2.on('down', () => this.weaponSystem.switchWeapon(1));
    key3.on('down', () => this.weaponSystem.switchWeapon(2));
    key4.on('down', () => this.weaponSystem.switchWeapon(3));
    key5.on('down', () => this.weaponSystem.switchWeapon(4));
    keyQ.on('down', () => this.weaponSystem.previousWeapon());
    keyE.on('down', () => this.weaponSystem.nextWeapon());

    // Mouse wheel cycling
    this.input.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      if (deltaY > 0) {
        this.weaponSystem.nextWeapon();
      } else if (deltaY < 0) {
        this.weaponSystem.previousWeapon();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Event Listeners
  // ---------------------------------------------------------------------------

  private setupEventListeners(): void {
    this.events.on(GAME_EVENTS.ENEMY_DIED, (enemy: Enemy) => {
      new Explosion(this, enemy.x, enemy.y);
      audioManager.playExplosion('small');
    }, this);

    this.events.on(GAME_EVENTS.PLAYER_HIT, (player: Player, enemy: Enemy) => {
      player.setTint(COLORS.PLAYER_DAMAGE).setTintMode(Phaser.TintModes.FILL);
      this.time.delayedCall(ENEMY.PLAYER_HIT_FLASH, () => {
        if (player.active) player.clearTint();
      });
      new DamageNumber(this, player.x, player.y - 30, enemy.getDamageValue());

      // Audio & camera shake on player hit
      audioManager.playPlayerHit();
      this.cameraManager.shake(6, 200);
      HapticFeedback.heavy();
    }, this);

    this.events.on(GAME_EVENTS.SHIELD_HIT, () => {
      audioManager.playShieldHit();
    }, this);

    this.events.on(GAME_EVENTS.BULLET_HIT, () => {
      this.bulletHits++;
    }, this);

    this.events.on(GAME_EVENTS.GAME_OVER, () => {
      this.physics.world.pause();
      this.screenManager.show('gameover');
    }, this);

    this.events.on(GAME_EVENTS.REQUEST_RESTART, () => {
      this.gameStateManager.reset();
    }, this);

    this.events.on(GAME_EVENTS.GAME_RESTARTED, () => {
      this.physics.world.resume();
      this.screenManager.hideAll();
      this.player.respawn(WORLD.WIDTH / 2, WORLD.HEIGHT / 2);
      this.weaponSystem.reset();
      this.enemySystem.reset();
      this.bossSystem.reset();
      this.enemyProjectileGroup.clear(true, true);
      this.bulletHits = 0;
    }, this);

    this.events.on(GAME_EVENTS.POWERUP_COLLECTED, () => {
      HapticFeedback.powerup();
      audioManager.playPowerUp();
    }, this);

    this.events.on('request-boss-spawn', (bossType: 'GUARDIAN' | 'DREADNOUGHT' | 'CORE') => {
      this.bossSystem.triggerBossSpawn(bossType);
      audioManager.playBossAlert();
    }, this);

    this.events.on('boss-death', () => {
      audioManager.playExplosion('large');
    }, this);

    this.events.on('weapon-switched', (_weapon: unknown, meta: WeaponMetadata) => {
      this.hud.setWeaponName(meta.name);
    }, this);

    this.events.on('request-weapon-cycle', () => {
      this.weaponSystem.nextWeapon();
    }, this);

    this.events.on('enemy-projectile-spawn', (data: any) => {
      const proj = this.enemyProjectileGroup.get(data.x, data.y) as EnemyProjectile | null;
      if (proj) {
        proj.spawn(data.x, data.y, data.angle, data.type, data.damage, data.target);
      }
    }, this);

    this.events.on('enemy-mine-dropped', (data: any) => {
      const proj = this.enemyProjectileGroup.get(data.x, data.y) as EnemyProjectile | null;
      if (proj) {
        proj.spawn(data.x, data.y, 0, ProjectileType.MINE, data.damage);
      }
    }, this);

    this.events.on('enemy-laser-fired', (data: any) => {
      const proj = this.enemyProjectileGroup.get(data.x, data.y) as EnemyProjectile | null;
      if (proj) {
        proj.spawn(data.x, data.y, data.angle, ProjectileType.LASER, data.damage);
      }
    }, this);

    this.events.on('boss-loot-rewards', (data: any) => {
      this.events.emit(GAME_EVENTS.POWERUP_SPAWN_REQUEST, { x: data.x - 30, y: data.y, type: 'HEALTH_PACK' });
      this.events.emit(GAME_EVENTS.POWERUP_SPAWN_REQUEST, { x: data.x + 30, y: data.y, type: 'SHIELD' });
    }, this);

    this.events.on('layout-updated', (l: UILayout) => {
      this.cameraManager.setResponsiveZoom(l.cameraZoom, l.cameraDeadzone.x, l.cameraDeadzone.y);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(GAME_EVENTS.ENEMY_DIED);
      this.events.off(GAME_EVENTS.PLAYER_HIT);
      this.events.off(GAME_EVENTS.BULLET_HIT);
      this.events.off(GAME_EVENTS.GAME_OVER);
      this.events.off(GAME_EVENTS.REQUEST_RESTART);
      this.events.off(GAME_EVENTS.GAME_RESTARTED);
      this.events.off(GAME_EVENTS.POWERUP_COLLECTED);
      this.events.off('request-boss-spawn');
      this.events.off('enemy-projectile-spawn');
      this.events.off('enemy-mine-dropped');
      this.events.off('enemy-laser-fired');
      this.events.off('boss-loot-rewards');
      this.events.off('layout-updated');
      this.events.off('weapon-switched');
      this.events.off('request-weapon-cycle');
      this.escKey?.off('down');
    });
  }

  // ---------------------------------------------------------------------------
  // World / Camera / Debug
  // ---------------------------------------------------------------------------

  private createWorld(): void {
    this.physics.world.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    this.environmentSystem = new EnvironmentSystem(this);
  }

  private createPlayer(): void {
    this.player = new Player(this, WORLD.WIDTH / 2, WORLD.HEIGHT / 2, AssetKeys.PLAYER);
    // Name the player so InputManager can find it for aim calculation
    this.player.setName('Player');
  }

  private handlePlayerProjectileOverlap(player: Player, proj: EnemyProjectile): void {
    if (player.getIsDead() || !proj.active) return;
    proj.detonate();
  }

  private createCamera(): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    cam.startFollow(this.player, true, 0.08, 0.08);
    const l = this.layoutManager.get();
    cam.setZoom(l.cameraZoom);
    cam.setDeadzone(l.cameraDeadzone.x, l.cameraDeadzone.y);
  }

  private createDebugUI(): void {
    // Background graphic for debug panel
    this.debugBg = this.add.graphics();
    this.debugBg.setScrollFactor(0).setDepth(9998);

    // Text label with monospace font
    this.debugText = this.add
      .text(0, 0, '', {
        fontFamily: '\'JetBrains Mono\', \'Courier New\', Courier, monospace',
        fontSize: '12px',
        color: '#60a5fa', // Muted blue
        lineSpacing: 4,
      })
      .setScrollFactor(0)
      .setDepth(9999);
  }

  private updateDebugUI(inputState: PlayerInputState): void {
    if (!this.debugText || !this.player?.body || !this.debugBg) return;

    const l = this.layoutManager.get();
    if (!l.debugVisible) {
      this.debugText.setVisible(false);
      this.debugBg.setVisible(false);
      return;
    }

    this.debugText.setVisible(true);
    this.debugBg.setVisible(true);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    void GameState[this.gameStateManager.getState()]; // suppress unused warning
    const currentWave = this.waveSystem.getWaveNumber();
    const waveState = this.waveSystem.getWaveState();
    const activeBuffsList = this.powerUpSystem
      .getActiveBuffs()
      .map((b) => `${b.name} (${Math.ceil(b.durationRemaining / 1000)}s)`)
      .join(', ');

    const envInfo = this.environmentSystem.getDebugInfo(this.player.x, this.player.y);
    const isBossActive = !!this.bossSystem.getActiveBoss();

    this.debugText.setText(
      `FPS: ${Math.round(this.game.loop.actualFps)} | Env FPS: ${Math.round(this.game.loop.actualFps)}\n` +
      `Region: ${envInfo.currentRegion} | Nearest: ${envInfo.nearestPlanetName} (${envInfo.nearestPlanetDistance}px)\n` +
      `Visible Planets: ${envInfo.visiblePlanetsCount} | Loaded Objects: ${envInfo.loadedObjectsCount}\n` +
      `Wave: ${currentWave} (${waveState}) | Boss: ${isBossActive ? 'ACTIVE' : 'NONE'}\n` +
      `HP: ${this.gameStateManager.getHealth()} | Score: ${this.gameStateManager.getScore()} | Kills: ${this.gameStateManager.getKills()}\n` +
      `Pos: ${Math.round(this.player.x)},${Math.round(this.player.y)} | Speed: ${Math.round(body.velocity.length())}px/s\n` +
      `Spawned/Killed: ${this.gameStateManager.getEnemiesSpawned()}/${this.gameStateManager.getKills()} | Elites/Bosses: ${this.gameStateManager.getEliteKills()}/${this.gameStateManager.getBossKills()}\n` +
      `Damage Dealt: ${this.gameStateManager.getDamageDealt()} | Damage Taken: ${this.gameStateManager.getDamageTaken()}\n` +
      `Combo: ${this.gameStateManager.getHighestCombo()} (highest) | Survival: ${this.gameStateManager.getSurvivalTime()}s (record: ${this.gameStateManager.getLongestSurvival()}s)\n` +
      `Enemies Active: ${this.enemySystem.getActiveCount()}/${this.enemySystem.getPoolSize()} | Projectiles: ${this.enemyProjectileGroup.countActive(true)}\n` +
      `Buffs: ${activeBuffsList || 'NONE'}\n` +
      `Shield: ${this.player.getShieldCharges()} | Input: ${inputState.inputSource}\n` +
      `Gamepad: ${this.inputManager.isGamepadConnected() ? this.inputManager.getGamepadId().slice(0, 28) : 'none'}`
    );

    // Position debug text dynamically below HUD
    const startX = l.anchors.topLeft.x;
    const startY = l.anchors.topLeft.y + (l.isPortrait ? l.healthBarHeight + 20 : 120);
    this.debugText.setPosition(startX + 10, startY + 10);

    const bounds = this.debugText.getBounds();
    this.debugBg.clear();
    // Background: rgba(0,0,0,0.45)
    this.debugBg.fillStyle(0x000000, 0.45);
    this.debugBg.fillRoundedRect(startX, startY, bounds.width + 20, bounds.height + 20, 8);
    // Border outline in muted dark blue
    this.debugBg.lineStyle(1.5, 0x1e3a8a, 0.4);
    this.debugBg.strokeRoundedRect(startX, startY, bounds.width + 20, bounds.height + 20, 8);
  }
}
