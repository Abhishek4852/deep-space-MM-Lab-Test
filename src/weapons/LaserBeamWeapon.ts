import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { WeaponType } from './WeaponType';
import { Bullet } from '@/entities/Bullet';
import { AssetKeys } from '@/core/AssetKeys';
import { GAME_EVENTS } from '@/core/Constants';
import { audioManager } from '@/audio/AudioManager';

export class LaserBeamWeapon extends BaseWeapon {
  constructor(scene: Phaser.Scene, sharedBulletGroup: Phaser.Physics.Arcade.Group) {
    super(scene, WeaponType.LASER, sharedBulletGroup);
  }

  public fire(
    scene: Phaser.Scene,
    muzzlePos: Phaser.Math.Vector2,
    angle: number,
    time: number
  ): boolean {
    if (time < this.mutableNextFireTime) {
      return false;
    }

    const beam = this.bulletGroup.get(muzzlePos.x, muzzlePos.y) as Bullet | null;
    if (beam) {
      const dmg = this.getEffectiveDamage(this.metadata.damage);

      beam.fire(muzzlePos.x, muzzlePos.y, angle, time, dmg, {
        speed: 1750, // Ultra-fast piercing beam pulse
        lifetime: 1400,
        textureKey: AssetKeys.PROJECTILE_LASER,
        isPiercing: true,
        maxPierces: 5, // Pierces through up to 5 enemies in a line
        scaleX: 1.6,
        scaleY: 1.0
      });

      this.mutableNextFireTime = time + this.getEffectiveCooldown();
      this.mutableShotsFired++;
      audioManager.playLaserBeamFire();
      scene.events.emit(GAME_EVENTS.SHOTS_FIRED, this.mutableShotsFired);
      return true;
    }

    return false;
  }
}

