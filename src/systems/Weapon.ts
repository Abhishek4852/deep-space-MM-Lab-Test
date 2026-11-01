import Phaser from 'phaser';

export interface Weapon {
  readonly name: string;
  readonly fireRate: number;
  readonly poolSize: number;
  readonly shotsFired: number;
  readonly nextFireTime: number;

  /**
   * Fires a projectile from a specific coordinates point and heading.
   */
  fire(_scene: Phaser.Scene, muzzlePos: Phaser.Math.Vector2, angle: number, time: number): boolean;

  /**
   * Updates all active projectiles.
   */
  update(time: number, delta: number): void;

  /**
   * Returns the count of currently active projectiles.
   */
  getActiveBulletsCount(): number;

  /**
   * Returns the underlying physics arcade group for collision checking.
   */
  getProjectileGroup(): Phaser.Physics.Arcade.Group;

  /**
   * Resets all internal weapon statistics and recycles active bullets.
   */
  reset(): void;

  /* --- STAT MODIFIERS --- */

  setCooldownMultiplier(multiplier: number): void;
  setDamageMultiplier(multiplier: number): void;
}
