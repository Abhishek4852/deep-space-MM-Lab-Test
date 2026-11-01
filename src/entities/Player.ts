import Phaser from 'phaser';
import { PlayerInputState } from '@/managers/InputManager';
import { PLAYER, GAME_EVENTS } from '@/core/Constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private health: number = PLAYER.MAX_HEALTH;
  private isDead: boolean = false;
  private engineFlame: Phaser.GameObjects.Image | null = null;

  // Phase 7 Buff fields
  private speedMultiplier = 1.0;
  private shieldCharges = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);

    // Register inside the scene updates and physics instances
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Instantiate dynamic engine flame
    this.engineFlame = scene.add.image(x, y, 'engine_flame');
    this.engineFlame.setDepth(this.depth - 1);

    // Configure Phaser Arcade Physics Body settings
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true);
      body.setMaxVelocity(PLAYER.MAX_SPEED, PLAYER.MAX_SPEED);
      body.setDrag(PLAYER.DRAG, PLAYER.DRAG);
      // Retain the original collision size of 64x48 to satisfy visual-only scaling
      body.setSize(64, 48, true);
    }
  }

  public update(inputState: PlayerInputState): void {
    if (this.isDead || !this.body) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    // 1. Movement Calculations
    let moveX = inputState.moveX;
    let moveY = inputState.moveY;

    // Normalize diagonal vectors to prevent high velocity speeds
    if (moveX !== 0 && moveY !== 0) {
      const length = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= length;
      moveY /= length;
    }

    // Apply movement acceleration forces with speed multipliers
    const speedScale = this.speedMultiplier;
    if (moveX !== 0 || moveY !== 0) {
      body.setAcceleration(
        moveX * PLAYER.ACCELERATION * speedScale,
        moveY * PLAYER.ACCELERATION * speedScale
      );
    } else {
      body.setAcceleration(0, 0);
    }

    // 2. Aim Rotation Calculations
    const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, inputState.aimX, inputState.aimY);
    this.rotation = targetAngle;

    // 3. Animate and Position Engine Flame
    if (this.engineFlame) {
      const offset = -35; // Position exactly behind the exhaust nozzle
      const flameX = this.x + Math.cos(this.rotation) * offset;
      const flameY = this.y + Math.sin(this.rotation) * offset;
      this.engineFlame.setPosition(flameX, flameY);
      this.engineFlame.setRotation(this.rotation);
      this.engineFlame.setDepth(this.depth - 1);
      this.engineFlame.setVisible(this.visible && !this.isDead);

      // Pulse animation using sin wave
      const time = this.scene.time.now;
      const pulse = 1.0 + Math.sin(time * 0.035) * 0.15;

      if (inputState.isFiring) {
        this.engineFlame.setScale(1.7 * pulse, 1.3);
        this.engineFlame.setTint(0xff7700); // Bright orange-red firing
      } else if (moveX !== 0 || moveY !== 0) {
        this.engineFlame.setScale(1.3 * pulse, 1.0);
        this.engineFlame.setTint(0xffaa00); // Regular orange moving
      } else {
        this.engineFlame.setScale(0.8 * pulse, 0.7);
        this.engineFlame.setTint(0xff4400); // Small dim idle flame
      }
    }
  }

  /**
   * Returns the exact coordinates of the player's front muzzle mount.
   */
  public getWeaponMuzzlePosition(): Phaser.Math.Vector2 {
    const offset = 34; // Adjusted for visual nose length change (34px from center of 80px body)
    return new Phaser.Math.Vector2(
      this.x + Math.cos(this.rotation) * offset,
      this.y + Math.sin(this.rotation) * offset
    );
  }

  /* --- STAT MODIFIERS --- */

  /**
   * Apply damage to the player ship health. If shield charges are active, ignores damage and consumes a charge.
   */
  public takeDamage(amount: number): void {
    if (this.isDead) return;

    // Check if shield absorbs the damage hit
    if (this.shieldCharges > 0) {
      this.setShieldCharges(this.shieldCharges - 1);
      this.scene.events.emit(GAME_EVENTS.SHIELD_HIT, this.shieldCharges);
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.scene.events.emit(GAME_EVENTS.HEALTH_CHANGED, this.health);
    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * Add health back to the ship.
   */
  public heal(amount: number): void {
    if (this.isDead) return;
    this.health = Math.min(PLAYER.MAX_HEALTH, this.health + amount);
    this.scene.events.emit(GAME_EVENTS.HEALTH_CHANGED, this.health);
  }

  /**
   * Destroy player and clean up physics body.
   */
  public die(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.setVisible(false);
    if (this.engineFlame) {
      this.engineFlame.setVisible(false);
    }
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setEnable(false);
    }
  }

  public respawn(x: number, y: number): void {
    this.isDead = false;
    this.health = PLAYER.MAX_HEALTH;

    // Flush temporary buff indicators on respawn
    this.setShieldCharges(0);
    this.setSpeedMultiplier(1.0);

    this.setVisible(true);
    if (this.engineFlame) {
      this.engineFlame.setVisible(true);
      this.engineFlame.setPosition(x, y);
    }
    this.setPosition(x, y);
    this.scene.events.emit(GAME_EVENTS.HEALTH_CHANGED, this.health);
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setEnable(true);
      body.reset(x, y);
    }
  }

  public destroy(fromScene?: boolean): void {
    if (this.engineFlame) {
      this.engineFlame.destroy();
      this.engineFlame = null;
    }
    super.destroy(fromScene);
  }

  /* --- BUFF ACCESSORS --- */

  public setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      const newMax = PLAYER.MAX_SPEED * multiplier;
      body.setMaxVelocity(newMax, newMax);
    }
  }

  public getShieldCharges(): number {
    return this.shieldCharges;
  }

  public setShieldCharges(charges: number): void {
    this.shieldCharges = Math.max(0, charges);
    this.scene.events.emit(GAME_EVENTS.SHIELD_CHANGED, this.shieldCharges);
  }

  /* --- DATA ACCESSORS --- */

  public getHealth(): number {
    return this.health;
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
