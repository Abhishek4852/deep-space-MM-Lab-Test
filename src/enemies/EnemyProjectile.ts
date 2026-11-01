import Phaser from 'phaser';

export enum ProjectileType {
  MINE = 'MINE',
  LASER = 'LASER',
  MISSILE = 'MISSILE'
}

export class EnemyProjectile extends Phaser.Physics.Arcade.Sprite {
  private projectileType: ProjectileType = ProjectileType.LASER;
  private damage = 0;
  private birthTime = 0;
  private lifetime = 3000; // Default lifetime in ms

  private target: { x: number; y: number } | null = null;
  private smokeEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  
  // Homing rotation speed for missiles (rad/s)
  private homingTurnSpeed = 1.8;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Initial placeholder texture, overridden on spawn
    super(scene, x, y, 'enemy_laser_bullet');
  }

  public spawn(
    x: number,
    y: number,
    angle: number,
    type: ProjectileType,
    damage: number,
    target: { x: number; y: number } | null = null
  ): void {
    this.projectileType = type;
    this.damage = damage;
    this.birthTime = this.scene.time.now;
    this.target = target;

    this.setPosition(x, y);
    this.setRotation(angle);
    this.clearTint();
    this.setActive(true);
    this.setVisible(true);

    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setEnable(true);
      body.reset(x, y);
    }

    // Configure properties based on projectile class
    switch (type) {
      case ProjectileType.MINE:
        this.setTexture('enemy_mine');
        this.lifetime = 2000; // Explode after 2 seconds
        this.setScale(1.0);
        if (this.body) {
          (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        }
        break;

      case ProjectileType.LASER:
        this.setTexture('enemy_laser_bullet');
        this.lifetime = 3000;
        this.setScale(1.2, 1.0);
        if (this.body) {
          const body = this.body as Phaser.Physics.Arcade.Body;
          this.scene.physics.velocityFromRotation(angle, 450, body.velocity);
        }
        break;

      case ProjectileType.MISSILE:
        // Reuse laser texture colored red/orange for missiles
        this.setTexture('enemy_laser_bullet');
        this.setTint(0xf97316); // Bright orange tint
        this.lifetime = 4500;
        this.setScale(1.5, 1.2);
        
        if (this.body) {
          const body = this.body as Phaser.Physics.Arcade.Body;
          this.scene.physics.velocityFromRotation(angle, 250, body.velocity);
        }

        // Setup trailing smoke emitter
        this.setupSmokeEmitter();
        break;
    }
  }

  public update(time: number, delta: number): void {
    if (!this.active) return;

    const elapsed = time - this.birthTime;

    if (elapsed >= this.lifetime) {
      this.detonate();
      return;
    }

    const dt = delta / 1000;

    switch (this.projectileType) {
      case ProjectileType.MINE:
        // Pulse scaling and flashing red/purple
        const pulse = 1.0 + Math.sin(time * 0.015) * 0.15;
        this.setScale(pulse);
        if (elapsed > this.lifetime * 0.75) {
          this.setTint(0xef4444); // Flash bright red right before detonate
        }
        break;

      case ProjectileType.LASER:
        // Moves straight (handled by physics body)
        break;

      case ProjectileType.MISSILE:
        // Homing steering towards player
        if (this.target && this.body) {
          const body = this.body as Phaser.Physics.Arcade.Body;
          const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
          
          // Slowly rotate velocity towards target angle
          this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, targetAngle, this.homingTurnSpeed * dt);
          this.scene.physics.velocityFromRotation(this.rotation, 260, body.velocity);
        }

        // Keep smoke trail positioned at tail of missile
        if (this.smokeEmitter) {
          this.smokeEmitter.setPosition(this.x, this.y);
        }
        break;
    }
  }

  public detonate(): void {
    if (!this.active) return;

    // 1. Spawns visual blast effects
    if (this.projectileType === ProjectileType.MINE || this.projectileType === ProjectileType.MISSILE) {
      const radius = this.projectileType === ProjectileType.MINE ? 150 : 80;
      
      // Perform damage evaluation within radius coordinates
      const player = (this.scene as any).player;
      if (player && !player.getIsDead()) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (dist <= radius) {
          player.takeDamage(this.damage);
          this.scene.events.emit('player-hit-custom');
        }
      }

      // Draw expanding visual blast ring
      const blast = this.scene.add.graphics();
      blast.lineStyle(2, 0xff5500, 0.8);
      blast.strokeCircle(this.x, this.y, 10);
      
      this.scene.tweens.add({
        targets: blast,
        alpha: 0,
        scaleX: radius / 10,
        scaleY: radius / 10,
        duration: 350,
        onComplete: () => blast.destroy()
      });

      this.scene.events.emit('enemy-explosion', this.x, this.y);
    }

    this.deactivate();
  }

  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.clearTint();

    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setEnable(false);
      body.setVelocity(0, 0);
    }

    if (this.smokeEmitter) {
      this.smokeEmitter.stop();
      const emitterRef = this.smokeEmitter;
      this.smokeEmitter = null;
      this.scene.time.delayedCall(400, () => emitterRef.destroy());
    }
  }

  public getDamage(): number {
    return this.damage;
  }

  private setupSmokeEmitter(): void {
    const scene = this.scene;
    this.smokeEmitter = scene.add.particles(this.x, this.y, 'comet_particle', {
      speed: 10,
      scale: { start: 0.8, end: 0.1 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 300,
      frequency: 40,
      blendMode: 'ADD'
    });
    this.smokeEmitter.setDepth(-18);
  }
}
