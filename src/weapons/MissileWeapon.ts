import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { WeaponType } from './WeaponType';
import { Bullet } from '@/entities/Bullet';
import { AssetKeys } from '@/core/AssetKeys';
import { GAME_EVENTS } from '@/core/Constants';
import { audioManager } from '@/audio/AudioManager';

export class MissileWeapon extends BaseWeapon {
  private alternateSide: number = 1;

  constructor(scene: Phaser.Scene, sharedBulletGroup: Phaser.Physics.Arcade.Group) {
    super(scene, WeaponType.MISSILE, sharedBulletGroup);
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

    // Wing offset perpendicular to forward direction
    this.alternateSide = -this.alternateSide;
    const perpAngle = angle + Math.PI / 2;
    const spawnX = muzzlePos.x + Math.cos(perpAngle) * (14 * this.alternateSide);
    const spawnY = muzzlePos.y + Math.sin(perpAngle) * (14 * this.alternateSide);

    const missile = this.bulletGroup.get(spawnX, spawnY) as Bullet | null;
    if (missile) {
      const dmg = this.getEffectiveDamage(this.metadata.damage);

      // Launch with slight outward cant
      const launchAngle = angle + this.alternateSide * 0.15;

      missile.fire(spawnX, spawnY, launchAngle, time, dmg, {
        speed: 400, // Starts at moderate speed, accelerates via homing logic
        lifetime: 2800,
        textureKey: AssetKeys.PROJECTILE_MISSILE,
        isHoming: true,
        isExplosive: true,
        scaleX: 1.2,
        scaleY: 1.2
      });

      this.mutableNextFireTime = time + this.getEffectiveCooldown();
      this.mutableShotsFired++;
      audioManager.playMissileFire();
      scene.events.emit(GAME_EVENTS.SHOTS_FIRED, this.mutableShotsFired);
      return true;
    }

    return false;
  }
}

