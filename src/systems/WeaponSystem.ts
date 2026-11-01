import Phaser from 'phaser';
import { BaseWeapon } from '@/weapons/BaseWeapon';
import { WeaponType, WeaponMetadata } from '@/weapons/WeaponType';
import { BlasterWeapon } from '@/weapons/BlasterWeapon';
import { ShotgunWeapon } from '@/weapons/ShotgunWeapon';
import { MissileWeapon } from '@/weapons/MissileWeapon';
import { LaserBeamWeapon } from '@/weapons/LaserBeamWeapon';
import { LightningWeapon } from '@/weapons/LightningWeapon';
import { Bullet } from '@/entities/Bullet';
import { Player } from '@/entities/Player';
import { PlayerInputState } from '@/managers/InputManager';
import { AssetKeys } from '@/core/AssetKeys';
import { audioManager } from '@/audio/AudioManager';

export class WeaponSystem {
  private scene: Phaser.Scene;
  private bulletGroup: Phaser.Physics.Arcade.Group;
  private weapons: BaseWeapon[] = [];
  private activeWeaponIndex: number = 0;

  private currentCooldownMultiplier: number = 1.0;
  private currentDamageMultiplier: number = 1.0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Single unified physics group for all player projectiles
    this.bulletGroup = scene.physics.add.group({
      classType: Bullet,
      maxSize: 350,
      runChildUpdate: false
    });

    this.bulletGroup.createMultiple({
      active: false,
      visible: false,
      key: AssetKeys.BULLET,
      repeat: 349
    });

    // Initialize all 5 weapon systems
    this.weapons = [
      new BlasterWeapon(scene, this.bulletGroup),
      new ShotgunWeapon(scene, this.bulletGroup),
      new MissileWeapon(scene, this.bulletGroup),
      new LaserBeamWeapon(scene, this.bulletGroup),
      new LightningWeapon(scene, this.bulletGroup),
    ];
  }

  /**
   * Tracks active firing and projectile movement updates.
   */
  public update(time: number, delta: number, player: Player, inputState: PlayerInputState): void {
    // 1. Update all active projectiles in flight
    this.bulletGroup.getChildren().forEach((child) => {
      child.update(time, delta);
    });

    // 2. Process fire requests
    if (inputState.isFiring && player.active) {
      const activeWeapon = this.getActiveWeapon();
      const muzzlePos = player.getWeaponMuzzlePosition();
      activeWeapon.fire(this.scene, muzzlePos, player.rotation, time);
    }
  }

  // ---------------------------------------------------------------------------
  // 🔄 Weapon Switching
  // ---------------------------------------------------------------------------

  public switchWeapon(index: number): boolean {
    if (index < 0 || index >= this.weapons.length || index === this.activeWeaponIndex) {
      return false;
    }

    this.activeWeaponIndex = index;
    const active = this.getActiveWeapon();

    // Ensure active buffs carry over to newly equipped weapon
    active.setCooldownMultiplier(this.currentCooldownMultiplier);
    active.setDamageMultiplier(this.currentDamageMultiplier);

    // Play switch SFX
    audioManager.playWeaponSwitch();

    // Notify scene & UI
    this.scene.events.emit('weapon-switched', active, active.metadata);
    return true;
  }

  public nextWeapon(): void {
    const nextIndex = (this.activeWeaponIndex + 1) % this.weapons.length;
    this.switchWeapon(nextIndex);
  }

  public previousWeapon(): void {
    const prevIndex = (this.activeWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
    this.switchWeapon(prevIndex);
  }

  public switchToType(type: WeaponType): boolean {
    const idx = this.weapons.findIndex((w) => w.type === type);
    if (idx !== -1) {
      return this.switchWeapon(idx);
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Data Accessors
  // ---------------------------------------------------------------------------

  public getActiveWeapon(): BaseWeapon {
    return this.weapons[this.activeWeaponIndex];
  }

  public getActiveWeaponType(): WeaponType {
    return this.getActiveWeapon().type;
  }

  public getActiveWeaponMetadata(): WeaponMetadata {
    return this.getActiveWeapon().metadata;
  }

  public getAllWeapons(): BaseWeapon[] {
    return this.weapons;
  }

  public getWeaponName(): string {
    return this.getActiveWeapon().name;
  }

  public getCooldownRemaining(time: number): number {
    return Math.max(0, this.getActiveWeapon().nextFireTime - time);
  }

  public getActiveBullets(): number {
    return this.bulletGroup.countActive(true);
  }

  public getPoolSize(): number {
    return this.bulletGroup.maxSize;
  }

  public getShotsFired(): number {
    return this.getActiveWeapon().shotsFired;
  }

  public getFireRate(): number {
    return this.getActiveWeapon().fireRate;
  }

  public getProjectileGroup(): Phaser.Physics.Arcade.Group {
    return this.bulletGroup;
  }

  public reset(): void {
    this.activeWeaponIndex = 0;
    this.currentCooldownMultiplier = 1.0;
    this.currentDamageMultiplier = 1.0;

    this.weapons.forEach((w) => w.reset());

    // Deactivate all projectiles in pool
    this.bulletGroup.getChildren().forEach((child) => {
      (child as Bullet).deactivate();
    });
  }

  // ---------------------------------------------------------------------------
  // Stat Modifiers (Power-ups & Buffs)
  // ---------------------------------------------------------------------------

  public setCooldownMultiplier(multiplier: number): void {
    this.currentCooldownMultiplier = multiplier;
    this.weapons.forEach((w) => w.setCooldownMultiplier(multiplier));
  }

  public setDamageMultiplier(multiplier: number): void {
    this.currentDamageMultiplier = multiplier;
    this.weapons.forEach((w) => w.setDamageMultiplier(multiplier));
  }
}
