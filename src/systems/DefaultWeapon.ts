import Phaser from 'phaser';
import { Weapon } from './Weapon';
import { Bullet } from '@/entities/Bullet';
import { WEAPONS, GAME_EVENTS } from '@/core/Constants';
import { AssetKeys } from '@/core/AssetKeys';

export class DefaultWeapon implements Weapon {
  public readonly name = WEAPONS.DEFAULT.NAME;
  public readonly fireRate = WEAPONS.DEFAULT.FIRE_RATE;
  public readonly poolSize = WEAPONS.DEFAULT.POOL_SIZE;

  private bulletGroup: Phaser.Physics.Arcade.Group;
  private mutableShotsFired = 0;
  private mutableNextFireTime = 0;

  // Phase 7 Buff fields
  private cooldownMultiplier = 1.0;
  private damageMultiplier = 1.0;

  public get shotsFired(): number {
    return this.mutableShotsFired;
  }

  public get nextFireTime(): number {
    return this.mutableNextFireTime;
  }

  constructor(scene: Phaser.Scene) {
    // Configure bullet physics group
    this.bulletGroup = scene.physics.add.group({
      classType: Bullet,
      maxSize: this.poolSize,
      runChildUpdate: false // Handled manually inside our update loop for safety
    });

    // Pre-create the entire pool to eliminate allocations during game ticks
    this.bulletGroup.createMultiple({
      active: false,
      visible: false,
      key: AssetKeys.BULLET,
      repeat: this.poolSize - 1
    });
  }

  /**
   * Spawns and fires a bullet from the group if the fire rate cooldown has elapsed.
   */
  public fire(
    _scene: Phaser.Scene,
    muzzlePos: Phaser.Math.Vector2,
    angle: number,
    time: number
  ): boolean {
    const effectiveCooldown = this.fireRate * this.cooldownMultiplier;

    if (time < this.mutableNextFireTime) {
      return false; // Cooldown not yet elapsed
    }

    // Retrieve the first available inactive bullet from our pool
    const bullet = this.bulletGroup.get(muzzlePos.x, muzzlePos.y) as Bullet | null;
    if (bullet) {
      const damageValue = WEAPONS.DEFAULT.DAMAGE * this.damageMultiplier;
      bullet.fire(muzzlePos.x, muzzlePos.y, angle, time, damageValue);

      this.mutableNextFireTime = time + effectiveCooldown;
      this.mutableShotsFired++;
      _scene.events.emit(GAME_EVENTS.SHOTS_FIRED, this.mutableShotsFired);
      return true;
    }

    return false; // Pool exhausted
  }

  /**
   * Manually runs update cycles on all active bullet sprites.
   */
  public update(time: number, delta: number): void {
    this.bulletGroup.getChildren().forEach((child) => {
      child.update(time, delta);
    });
  }

  /**
   * Returns the count of active bullets currently flying.
   */
  public getActiveBulletsCount(): number {
    return this.bulletGroup.countActive(true);
  }

  /**
   * Returns the underlying bullet physics group.
   */
  public getProjectileGroup(): Phaser.Physics.Arcade.Group {
    return this.bulletGroup;
  }

  /**
   * Resets weapon shots and deactivates all active projectile children.
   */
  public reset(): void {
    this.mutableShotsFired = 0;
    this.mutableNextFireTime = 0;
    this.cooldownMultiplier = 1.0;
    this.damageMultiplier = 1.0;

    this.bulletGroup.getChildren().forEach((child) => {
      (child as Bullet).deactivate();
    });
  }

  /* --- STAT MODIFIERS --- */

  public setCooldownMultiplier(multiplier: number): void {
    this.cooldownMultiplier = multiplier;
  }

  public setDamageMultiplier(multiplier: number): void {
    this.damageMultiplier = multiplier;
  }
}
