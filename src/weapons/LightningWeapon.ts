import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { WeaponType } from './WeaponType';
import { Bullet } from '@/entities/Bullet';
import { AssetKeys } from '@/core/AssetKeys';
import { GAME_EVENTS } from '@/core/Constants';
import { audioManager } from '@/audio/AudioManager';

export class LightningWeapon extends BaseWeapon {
  constructor(scene: Phaser.Scene, sharedBulletGroup: Phaser.Physics.Arcade.Group) {
    super(scene, WeaponType.LIGHTNING, sharedBulletGroup);
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

    const orb = this.bulletGroup.get(muzzlePos.x, muzzlePos.y) as Bullet | null;
    if (orb) {
      const dmg = this.getEffectiveDamage(this.metadata.damage);

      orb.fire(muzzlePos.x, muzzlePos.y, angle, time, dmg, {
        speed: 950,
        lifetime: 1600,
        textureKey: AssetKeys.PROJECTILE_LIGHTNING,
        isLightning: true,
        scaleX: 1.2,
        scaleY: 1.2
      });

      this.mutableNextFireTime = time + this.getEffectiveCooldown();
      this.mutableShotsFired++;
      audioManager.playLightningFire();
      scene.events.emit(GAME_EVENTS.SHOTS_FIRED, this.mutableShotsFired);
      return true;
    }

    return false;
  }
}

