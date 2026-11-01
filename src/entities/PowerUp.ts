import Phaser from 'phaser';
import { PowerUpType, POWER_UP_CONFIGS, LOOT_SETTINGS } from '@/config/PowerUpConfig';

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  private powerUpType: PowerUpType = PowerUpType.HEALTH_PACK;
  private lifetimeRemaining = 0;
  private floatTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, POWER_UP_CONFIGS[PowerUpType.HEALTH_PACK].textureKey);
  }

  /**
   * Spawns a power-up item at coordinates, applying slow movement drifts and angular velocity spins.
   */
  public spawn(x: number, y: number, type: PowerUpType): void {
    this.powerUpType = type;
    this.lifetimeRemaining = LOOT_SETTINGS.DESPAWN_TIME;
    this.floatTimer = Math.random() * Math.PI * 2; // Randomize wave phase offset

    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    this.setAlpha(1.0);
    this.setTexture(POWER_UP_CONFIGS[type].textureKey);

    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setEnable(true);

      // Apply initial gentle angular spin
      body.setAngularVelocity(40);
    }
  }

  /**
   * Ticks down the despawn timer, applying floating motions and warning flash indicators.
   */
  public update(_time: number, delta: number): void {
    if (!this.active) return;

    this.lifetimeRemaining -= delta;
    this.floatTimer += delta * 0.002; // Slow frequency increment

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body && body.enable) {
      // Float slowly in space using sine wave coordinates
      body.setVelocityY(Math.sin(this.floatTimer) * 15);
      body.setVelocityX(Math.cos(this.floatTimer) * 8);
    }

    // Flash during the final 2 seconds
    if (this.lifetimeRemaining <= LOOT_SETTINGS.FLASH_TIME) {
      // Alternate transparency rapidly
      this.setAlpha(Math.floor(this.lifetimeRemaining / 100) % 2 === 0 ? 0.3 : 1.0);
    }

    // Despawn on expiry
    if (this.lifetimeRemaining <= 0) {
      this.despawn();
    }
  }

  /**
   * Recycles the item back to the inactive pool.
   */
  public despawn(): void {
    this.setActive(false);
    this.setVisible(false);

    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setEnable(false);
      body.setVelocity(0, 0);
      body.setAngularVelocity(0);
    }
  }

  /* --- DATA ACCESSORS --- */

  public getType(): PowerUpType {
    return this.powerUpType;
  }
}
