import Phaser from 'phaser';
import { PowerUp } from '@/entities/PowerUp';
import {
  PowerUpType,
  POWER_UP_CONFIGS,
  LOOT_SETTINGS,
  PowerUpConfig
} from '@/config/PowerUpConfig';
import { GAME_EVENTS } from '@/core/Constants';
import { Player } from '@/entities/Player';
import { WeaponSystem } from './WeaponSystem';
import { PowerUpNotification } from '@/ui/PowerUpNotification';

export interface ActiveBuff {
  type: PowerUpType;
  name: string;
  durationRemaining: number; // in milliseconds
  color: string;
}

export type PhysicsObject =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile;

export class PowerUpSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private weaponSystem: WeaponSystem;
  private powerUpGroup: Phaser.Physics.Arcade.Group;

  // Centralized active buff tracking map
  private activeBuffs: Map<PowerUpType, ActiveBuff> = new Map();

  constructor(scene: Phaser.Scene, player: Player, weaponSystem: WeaponSystem) {
    this.scene = scene;
    this.player = player;
    this.weaponSystem = weaponSystem;

    // 1. Create pooled group for items
    this.powerUpGroup = scene.physics.add.group({
      classType: PowerUp,
      maxSize: LOOT_SETTINGS.POOL_SIZE,
      runChildUpdate: false // Update manually inside systems loop
    });

    // 2. Pre-create items in pool
    this.powerUpGroup.createMultiple({
      active: false,
      visible: false,
      key: POWER_UP_CONFIGS[PowerUpType.HEALTH_PACK].textureKey,
      repeat: LOOT_SETTINGS.POOL_SIZE - 1
    });

    // 3. Register overlaps with the player ship
    scene.physics.add.overlap(player, this.powerUpGroup, this.handlePlayerPickup, undefined, this);

    // 4. Bind event bus listeners
    this.setupEventListeners();

    // 5. Clean up on shutdown
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  private setupEventListeners(): void {
    const events = this.scene.events;

    events.on(GAME_EVENTS.POWERUP_SPAWN_REQUEST, this.handleSpawnRequest, this);
    events.on(GAME_EVENTS.GAME_RESTARTED, this.handleGameRestarted, this);
  }

  /**
   * Spawns a pooled power-up item at coordinates.
   */
  private handleSpawnRequest(data: { x: number; y: number; type: PowerUpType }): void {
    const powerUp = this.powerUpGroup.get(data.x, data.y) as PowerUp | null;
    if (powerUp) {
      powerUp.spawn(data.x, data.y, data.type);

      // Emit notification to allow tracking
      this.scene.events.emit(GAME_EVENTS.POWERUP_SPAWNED, powerUp);
    }
  }

  /**
   * Processes ticking countdown on active buffs and drives physics float updates.
   */
  public update(time: number, delta: number): void {
    // 1. Update active power-ups drifting in space
    this.powerUpGroup.getChildren().forEach((child) => {
      const powerUp = child as PowerUp;
      if (powerUp.active) {
        powerUp.update(time, delta);
      }
    });

    // 2. Count down duration remaining on temporary buffs
    const expiredTypes: PowerUpType[] = [];

    this.activeBuffs.forEach((buff) => {
      buff.durationRemaining -= delta;
      if (buff.durationRemaining <= 0) {
        expiredTypes.push(buff.type);
      }
    });

    // Handle expirations
    expiredTypes.forEach((type) => {
      this.deactivateBuff(type);
    });

    // Emit live list on event bus to coordinate HUD render syncs
    this.scene.events.emit(GAME_EVENTS.BUFFS_UPDATED, Array.from(this.activeBuffs.values()));
  }

  /**
   * Handles player colliding with power-up items, applying corresponding effects immediately.
   */
  private handlePlayerPickup(_playerObj: PhysicsObject, powerUpObj: PhysicsObject): void {
    const powerUp = powerUpObj as PowerUp;
    if (!powerUp.active) return;

    const type = powerUp.getType();
    const config = POWER_UP_CONFIGS[type];

    // Recycle sprite back to pool
    powerUp.despawn();

    // Spawn pickup text notification
    new PowerUpNotification(
      this.scene,
      this.player.x,
      this.player.y - 40,
      config.name,
      config.color
    );

    // Apply player size pulse pickup animation placeholder
    this.scene.tweens.add({
      targets: this.player,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut'
    });

    // Apply specific effect
    switch (type) {
      case PowerUpType.HEALTH_PACK:
        this.player.heal(25);
        this.scene.events.emit(GAME_EVENTS.PLAYER_HEALED, 25);
        break;

      case PowerUpType.SHIELD:
        this.player.setShieldCharges(this.player.getShieldCharges() + 3);
        break;

      case PowerUpType.SPEED_BOOST:
      case PowerUpType.RAPID_FIRE:
      case PowerUpType.DAMAGE_BOOST:
        this.activateBuff(config);
        break;
    }

    this.scene.events.emit(GAME_EVENTS.POWERUP_COLLECTED, type);
  }

  /**
   * Activates or refreshes a temporary statistic boost.
   */
  private activateBuff(config: PowerUpConfig): void {
    const existing = this.activeBuffs.get(config.type);

    if (existing) {
      existing.durationRemaining = config.duration;
    } else {
      const buff: ActiveBuff = {
        type: config.type,
        name: config.name,
        durationRemaining: config.duration,
        color: config.color
      };

      this.activeBuffs.set(config.type, buff);

      // Apply modifiers immediately
      if (config.type === PowerUpType.SPEED_BOOST) {
        this.player.setSpeedMultiplier(1.25);
      } else if (config.type === PowerUpType.RAPID_FIRE) {
        this.weaponSystem.setCooldownMultiplier(0.7); // 30% reduction
      } else if (config.type === PowerUpType.DAMAGE_BOOST) {
        this.weaponSystem.setDamageMultiplier(2.0); // 2x double damage
      }

      this.scene.events.emit(GAME_EVENTS.BUFF_STARTED, config.type, config.duration);
    }
  }

  /**
   * Cleans up and reverts modifier multipliers when a buff expires.
   */
  private deactivateBuff(type: PowerUpType): void {
    if (!this.activeBuffs.has(type)) return;

    this.activeBuffs.delete(type);

    // Revert modifiers immediately
    if (type === PowerUpType.SPEED_BOOST) {
      this.player.setSpeedMultiplier(1.0);
    } else if (type === PowerUpType.RAPID_FIRE) {
      this.weaponSystem.setCooldownMultiplier(1.0);
    } else if (type === PowerUpType.DAMAGE_BOOST) {
      this.weaponSystem.setDamageMultiplier(1.0);
    }

    this.scene.events.emit(GAME_EVENTS.BUFF_EXPIRED, type);
  }

  /**
   * Clears active buffs and despawns items on game restarts.
   */
  private handleGameRestarted(): void {
    // Revert modifiers on all active buffs
    this.activeBuffs.forEach((buff) => {
      this.deactivateBuff(buff.type);
    });

    this.activeBuffs.clear();

    // Return active items to pool
    this.powerUpGroup.getChildren().forEach((child) => {
      (child as PowerUp).despawn();
    });
  }

  private shutdown(): void {
    const events = this.scene.events;
    events.off(GAME_EVENTS.POWERUP_SPAWN_REQUEST, this.handleSpawnRequest, this);
    events.off(GAME_EVENTS.GAME_RESTARTED, this.handleGameRestarted, this);
  }

  /* --- DATA ACCESSORS --- */

  public getActiveCount(): number {
    return this.powerUpGroup.countActive(true);
  }

  public getPoolSize(): number {
    return this.powerUpGroup.maxSize;
  }

  public getActiveBuffs(): ActiveBuff[] {
    return Array.from(this.activeBuffs.values());
  }
}
