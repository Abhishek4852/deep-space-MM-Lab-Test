import Phaser from 'phaser';
import { Weapon } from '@/systems/Weapon';
import { WeaponType, WeaponMetadata, WEAPON_REGISTRY } from './WeaponType';

export abstract class BaseWeapon implements Weapon {
  public readonly type: WeaponType;
  public readonly metadata: WeaponMetadata;
  public readonly name: string;
  public readonly fireRate: number;
  public readonly poolSize: number;

  protected bulletGroup: Phaser.Physics.Arcade.Group;
  protected mutableShotsFired: number = 0;
  protected mutableNextFireTime: number = 0;

  protected cooldownMultiplier: number = 1.0;
  protected damageMultiplier: number = 1.0;

  public get shotsFired(): number {
    return this.mutableShotsFired;
  }

  public get nextFireTime(): number {
    return this.mutableNextFireTime;
  }

  constructor(_scene: Phaser.Scene, type: WeaponType, sharedBulletGroup: Phaser.Physics.Arcade.Group) {
    this.type = type;
    this.metadata = WEAPON_REGISTRY[type];
    this.name = this.metadata.name;
    this.fireRate = this.metadata.fireRate;
    this.bulletGroup = sharedBulletGroup;
    this.poolSize = sharedBulletGroup.maxSize;
  }

  public abstract fire(
    scene: Phaser.Scene,
    muzzlePos: Phaser.Math.Vector2,
    angle: number,
    time: number
  ): boolean;

  public update(_time: number, _delta: number): void {
    // Projectiles in shared bullet group are updated collectively by WeaponSystem
  }

  public getActiveBulletsCount(): number {
    return this.bulletGroup.countActive(true);
  }

  public getProjectileGroup(): Phaser.Physics.Arcade.Group {
    return this.bulletGroup;
  }

  public reset(): void {
    this.mutableShotsFired = 0;
    this.mutableNextFireTime = 0;
    this.cooldownMultiplier = 1.0;
    this.damageMultiplier = 1.0;
  }

  public setCooldownMultiplier(multiplier: number): void {
    this.cooldownMultiplier = multiplier;
  }

  public setDamageMultiplier(multiplier: number): void {
    this.damageMultiplier = multiplier;
  }

  protected getEffectiveCooldown(): number {
    return this.fireRate * this.cooldownMultiplier;
  }

  protected getEffectiveDamage(baseDamage: number): number {
    return baseDamage * this.damageMultiplier;
  }
}
