import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { WeaponType } from './WeaponType';
import { Bullet } from '@/entities/Bullet';
import { AssetKeys } from '@/core/AssetKeys';
import { GAME_EVENTS } from '@/core/Constants';
import { audioManager } from '@/audio/AudioManager';

export class ShotgunWeapon extends BaseWeapon {
  private spreadAngles = [-0.26, -0.13, 0, 0.13, 0.26]; // ~15 degree cone spread

  constructor(scene: Phaser.Scene, sharedBulletGroup: Phaser.Physics.Arcade.Group) {
    super(scene, WeaponType.SHOTGUN, sharedBulletGroup);
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

    const dmgPerPellet = this.getEffectiveDamage(this.metadata.damage);
    let firedCount = 0;

    // Fire 5 spread pellets
    this.spreadAngles.forEach((offset) => {
      const pellet = this.bulletGroup.get(muzzlePos.x, muzzlePos.y) as Bullet | null;
      if (pellet) {
        const pelletAngle = angle + offset + (Math.random() - 0.5) * 0.05;
        const speed = 760 + (Math.random() - 0.5) * 60;

        pellet.fire(muzzlePos.x, muzzlePos.y, pelletAngle, time, dmgPerPellet, {
          speed,
          lifetime: 850, // Rapid dispersion at range
          textureKey: AssetKeys.PROJECTILE_SHOTGUN,
          scaleX: 1.1,
          scaleY: 1.1
        });
        firedCount++;
      }
    });

    if (firedCount > 0) {
      this.mutableNextFireTime = time + this.getEffectiveCooldown();
      this.mutableShotsFired += firedCount;
      audioManager.playShotgunFire();
      scene.events.emit(GAME_EVENTS.SHOTS_FIRED, this.mutableShotsFired);
      return true;
    }

    return false;
  }
}

