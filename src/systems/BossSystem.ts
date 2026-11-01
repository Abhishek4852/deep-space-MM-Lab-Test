import Phaser from 'phaser';
import { Boss } from '@/bosses/Boss';
import { PlanetGuardian } from '@/bosses/PlanetGuardian';
import { Dreadnought } from '@/bosses/Dreadnought';
import { AncientCore } from '@/bosses/AncientCore';
import { BossIntroBanner } from '@/ui/BossIntroBanner';
import { BossHealthBar } from '@/ui/BossHealthBar';
import { Bullet } from '@/entities/Bullet';
import { GAME_EVENTS, WORLD } from '@/core/Constants';
import { audioManager } from '@/audio/AudioManager';

export class BossSystem {
  private scene: Phaser.Scene;
  private bulletGroup: Phaser.Physics.Arcade.Group;

  private activeBoss: Boss | null = null;
  private healthBar: BossHealthBar | null = null;
  private bulletOverlapCollider: Phaser.Physics.Arcade.Collider | null = null;

  constructor(scene: Phaser.Scene, bulletGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.bulletGroup = bulletGroup;

    // Listen to custom boss triggers
    scene.events.on('boss-phase-change', this.handlePhaseChange, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  /**
   * Spawns a boss, triggers red alert intro warnings, and updates HUDs.
   */
  public triggerBossSpawn(bossType: 'GUARDIAN' | 'DREADNOUGHT' | 'CORE'): void {
    const player = (this.scene as any).player;
    if (!player || player.getIsDead()) return;

    let bossName = 'BOSS';
    if (bossType === 'GUARDIAN') bossName = 'Planet Guardian';
    else if (bossType === 'DREADNOUGHT') bossName = 'Dreadnought';
    else bossName = 'Ancient Core';

    // Play intro warnings, spawn boss on complete
    new BossIntroBanner(this.scene, bossName, () => {
      this.spawnBoss(bossType, player.x, player.y);
    });
  }

  public update(time: number, delta: number, playerX: number, playerY: number): void {
    if (this.activeBoss && !this.activeBoss.getIsDead()) {
      this.activeBoss.setTarget({ x: playerX, y: playerY });
      this.activeBoss.update(time, delta);

      // Keep health bar updated
      if (this.healthBar) {
        this.healthBar.updateHealth(this.activeBoss.getHealth(), this.activeBoss.getMaxHealth());
      }
    }
  }

  public getActiveBoss(): Boss | null {
    return this.activeBoss;
  }

  public reset(): void {
    if (this.activeBoss) {
      this.activeBoss.destroy();
      this.activeBoss = null;
    }
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }
    if (this.bulletOverlapCollider) {
      this.bulletOverlapCollider.destroy();
      this.bulletOverlapCollider = null;
    }
  }

  private spawnBoss(bossType: 'GUARDIAN' | 'DREADNOUGHT' | 'CORE', px: number, py: number): void {
    // Spawn boss 450px above player, clamped inside world bounds
    let bx = px;
    let by = py - 450;
    
    bx = Phaser.Math.Clamp(bx, 200, WORLD.WIDTH - 200);
    by = Phaser.Math.Clamp(by, 200, WORLD.HEIGHT - 200);

    let boss: Boss;
    if (bossType === 'GUARDIAN') {
      boss = new PlanetGuardian(this.scene, bx, by);
    } else if (bossType === 'DREADNOUGHT') {
      boss = new Dreadnought(this.scene, bx, by);
    } else {
      boss = new AncientCore(this.scene, bx, by);
    }

    this.activeBoss = boss;

    // Create HP bar overlay
    this.healthBar = new BossHealthBar(this.scene, boss.getBossName(), boss.getMaxHealth());

    // Register overlap collision physics with player bullets
    this.bulletOverlapCollider = this.scene.physics.add.overlap(
      this.bulletGroup,
      this.activeBoss,
      this.handleBulletBossOverlap as any,
      undefined,
      this
    );

    // Register death listener on boss destruction
    this.activeBoss.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.handleBossDeath();
    });

    this.scene.events.emit(GAME_EVENTS.WAVE_COMPLETED_CHECK_PAUSE); // Notify spawner that a boss is alive
    this.scene.events.emit('boss-spawn', boss);
  }

  private handleBulletBossOverlap(bullet: Bullet, boss: Boss): void {
    if (!bullet.active || boss.getIsDead()) return;

    // Process weapon hit mechanics
    const hitRegistered = bullet.handleHit(boss);
    if (!hitRegistered) return;

    // Inflict damage (check angle if PlanetGuardian)
    if (boss instanceof PlanetGuardian) {
      // Pass bullet's rotation angle to evaluate shield blocks
      boss.takeDamageWithAngle(bullet.getDamage(), bullet.rotation);
    } else {
      boss.takeDamage(bullet.getDamage());
    }

    // Play hit sound
    audioManager.playEnemyHit();

    // Spawn hit flash effect
    this.scene.events.emit(GAME_EVENTS.BULLET_HIT, bullet, boss);
  }

  private handlePhaseChange(phase: number, boss: Boss): void {
    if (this.activeBoss === boss && this.healthBar) {
      this.healthBar.updatePhase(phase);
      
      // Phase transition visual effects: flash screen, shake camera
      this.scene.cameras.main.flash(400, 255, 0, 0); // Alert red flash
      this.scene.cameras.main.shake(8, 400);
      this.scene.events.emit('boss-phase-change-hook');
    }
  }

  private handleBossDeath(): void {
    if (this.healthBar) {
      this.healthBar.deactivate();
      this.healthBar = null;
    }
    if (this.bulletOverlapCollider) {
      this.bulletOverlapCollider.destroy();
      this.bulletOverlapCollider = null;
    }
    
    // Smoothly restore camera zoom
    this.activeBoss = null;
  }

  private shutdown(): void {
    this.scene.events.off('boss-phase-change', this.handlePhaseChange, this);
    this.reset();
  }
}
