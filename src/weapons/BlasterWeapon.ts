import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { WeaponType } from './WeaponType';
import { Bullet } from '@/entities/Bullet';
import { AssetKeys } from '@/core/AssetKeys';
import { GAME_EVENTS } from '@/core/Constants';
import { audioManager } from '@/audio/AudioManager';

export class BlasterWeapon extends BaseWeapon {
  constructor(scene: Phaser.Scene, sharedBulletGroup: Phaser.Physics.Arcade.Group) {
    super(scene, WeaponType.BLASTER, sharedBulletGroup);
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

    const bullet = this.bulletGroup.get(muzzlePos.x, muzzlePos.y) as Bullet | null;
    if (bullet) {
      const dmg = this.getEffectiveDamage(this.metadata.damage);
      bullet.fire(muzzlePos.x, muzzlePos.y, angle, time, dmg, {
        speed: 850,
        lifetime: 2000,
        textureKey: AssetKeys.PROJECTILE_BLASTER,
        scaleX: 1.5,
        scaleY: 0.85
      });

      this.mutableNextFireTime = time + this.getEffectiveCooldown();
      this.mutableShotsFired++;
      audioManager.playBlasterFire();
      scene.events.emit(GAME_EVENTS.SHOTS_FIRED, this.mutableShotsFired);
      return true;
    }

    return false;
  }
}

