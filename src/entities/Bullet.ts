import Phaser from 'phaser';
import { AssetKeys } from '@/core/AssetKeys';
import { WEAPONS } from '@/core/Constants';
import { Explosion } from '@/effects/Explosion';
import { audioManager } from '@/audio/AudioManager';

export interface BulletFireOptions {
  speed?: number;
  lifetime?: number;
  textureKey?: string;
  isPiercing?: boolean;
  maxPierces?: number;
  isExplosive?: boolean;
  isHoming?: boolean;
  isLightning?: boolean;
  scaleX?: number;
  scaleY?: number;
}

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  private birthTime: number = 0;
  private maxLifetime: number = WEAPONS.DEFAULT.LIFETIME;
  private damage: number = WEAPONS.DEFAULT.DAMAGE;
  private currentSpeed: number = WEAPONS.DEFAULT.SPEED;

  // Vector direction representing bullet velocity axis
  private direction: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  // Status flags
  private isPiercing: boolean = false;
  private maxPierces: number = 1;
  private hitTargets: Set<unknown> = new Set();

  private isExplosive: boolean = false;
  private isHoming: boolean = false;
  private isLightning: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture?: string) {
    super(scene, x, y, texture || AssetKeys.BULLET);
  }

  /**
   * Fires the bullet from a specific coordinates point and heading.
   * Optionally overrides damage and sets specialized weapon traits.
   */
  public fire(
    x: number,
    y: number,
    angle: number,
    spawnTime: number,
    damage?: number,
    options?: BulletFireOptions
  ): void {
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    this.setRotation(angle);

    // Reset hit tracker
    this.hitTargets.clear();

    // Set texture if custom
    if (options?.textureKey && this.texture.key !== options.textureKey) {
      this.setTexture(options.textureKey);
    } else if (!options?.textureKey && this.texture.key !== AssetKeys.BULLET) {
      this.setTexture(AssetKeys.BULLET);
    }

    this.birthTime = spawnTime;
    this.maxLifetime = options?.lifetime ?? WEAPONS.DEFAULT.LIFETIME;
    this.currentSpeed = options?.speed ?? WEAPONS.DEFAULT.SPEED;
    this.damage = damage !== undefined ? damage : WEAPONS.DEFAULT.DAMAGE;

    // Apply special flags
    this.isPiercing = options?.isPiercing ?? false;
    this.maxPierces = options?.maxPierces ?? (this.isPiercing ? 4 : 1);
    this.isExplosive = options?.isExplosive ?? false;
    this.isHoming = options?.isHoming ?? false;
    this.isLightning = options?.isLightning ?? false;

    // Direction vector
    this.direction.set(Math.cos(angle), Math.sin(angle));

    // Configure physics body
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setEnable(true);
      body.setVelocity(this.direction.x * this.currentSpeed, this.direction.y * this.currentSpeed);
    }

    // Scaling
    const sx = options?.scaleX ?? 1.5;
    const sy = options?.scaleY ?? 0.85;
    this.setScale(sx, sy);
  }

  /**
   * Disables visual rendering and physics movement for the entity.
   */
  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.hitTargets.clear();

    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setEnable(false);
      body.setVelocity(0, 0);
      body.setAcceleration(0, 0);
    }
  }

  /**
   * Lifecycle tick update called by weapon system.
   */
  public update(time: number, delta: number): void {
    if (!this.active) return;

    // Deactivate if the bullet exceeds its maximum lifetime
    if (time - this.birthTime >= this.maxLifetime) {
      this.deactivate();
      return;
    }

    // Deactivate if the bullet leaves world boundaries
    const worldBounds = this.scene.physics.world.bounds;
    if (this.x < 0 || this.x > worldBounds.width || this.y < 0 || this.y > worldBounds.height) {
      this.deactivate();
      return;
    }

    // Homing Steering Logic
    if (this.isHoming && this.body) {
      this.updateHomingMovement(delta);
    }
  }

  /**
   * Steers homing missile smoothly towards the nearest living enemy or boss.
   */
  private updateHomingMovement(delta: number): void {
    const target = this.findNearestTarget();
    if (!target) return;

    const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    const turnRate = 0.006 * delta; // Smooth turn rate proportional to delta time
    const newAngle = Phaser.Math.Angle.RotateTo(this.rotation, angleToTarget, turnRate);

    this.setRotation(newAngle);
    this.direction.set(Math.cos(newAngle), Math.sin(newAngle));

    // Accelerate missile slightly over time
    this.currentSpeed = Math.min(this.currentSpeed + 0.3 * delta, 820);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.direction.x * this.currentSpeed, this.direction.y * this.currentSpeed);
  }

  /**
   * Locates the closest active enemy or boss in range.
   */
  private findNearestTarget(): { x: number; y: number } | null {
    const sceneAny = this.scene as unknown as {
      enemySystem?: { getGroup: () => Phaser.Physics.Arcade.Group };
      bossSystem?: { getActiveBoss: () => { x: number; y: number; getIsDead: () => boolean } | null };
    };

    let closest: { x: number; y: number } | null = null;
    let minDist = 1200; // Search range

    // Check boss first
    const boss = sceneAny.bossSystem?.getActiveBoss();
    if (boss && !boss.getIsDead()) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, boss.x, boss.y);
      if (dist < minDist) {
        minDist = dist;
        closest = boss;
      }
    }

    // Check regular enemies
    const enemyGroup = sceneAny.enemySystem?.getGroup();
    if (enemyGroup) {
      enemyGroup.getChildren().forEach((child) => {
        const enemy = child as Phaser.Physics.Arcade.Sprite;
        if (enemy.active) {
          const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
          if (dist < minDist) {
            minDist = dist;
            closest = enemy;
          }
        }
      });
    }

    return closest;
  }

  /**
   * Handles collision event with target enemy or boss.
   * Returns true if hit registered, false if already hit (piercing rejection).
   */
  public handleHit(target: unknown): boolean {
    if (!this.active) return false;

    // Piercing checks: don't hit the same target twice
    if (this.isPiercing) {
      if (this.hitTargets.has(target)) {
        return false;
      }
      this.hitTargets.add(target);

      if (this.hitTargets.size >= this.maxPierces) {
        this.deactivate();
      }
      return true;
    }

    // Explosive AOE Detonation (Homing Missiles)
    if (this.isExplosive) {
      this.detonateExplosive();
      this.deactivate();
      return true;
    }

    // Chain Lightning Arc (EMP Weapon)
    if (this.isLightning) {
      this.triggerLightningChain(target);
      this.deactivate();
      return true;
    }

    // Default: Single impact projectile
    this.deactivate();
    return true;
  }

  /**
   * Triggers explosive blast damaging all nearby enemies.
   */
  private detonateExplosive(): void {
    new Explosion(this.scene, this.x, this.y);
    audioManager.playExplosion('small');

    const sceneAny = this.scene as unknown as {
      enemySystem?: { getGroup: () => Phaser.Physics.Arcade.Group };
    };

    const enemyGroup = sceneAny.enemySystem?.getGroup();
    if (enemyGroup) {
      const aoeRadius = 90;
      const aoeDamage = this.damage * 0.7;

      enemyGroup.getChildren().forEach((child) => {
        const enemy = child as unknown as { active: boolean; x: number; y: number; takeDamage: (dmg: number) => void };
        if (enemy.active) {
          const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
          if (dist <= aoeRadius) {
            enemy.takeDamage(aoeDamage);
          }
        }
      });
    }
  }

  /**
   * Discharges electrical arcs connecting to up to 3 nearby enemies.
   */
  private triggerLightningChain(primaryTarget: unknown): void {
    const sceneAny = this.scene as unknown as {
      enemySystem?: { getGroup: () => Phaser.Physics.Arcade.Group };
    };

    const enemyGroup = sceneAny.enemySystem?.getGroup();
    if (!enemyGroup) return;

    const chainRadius = 260;
    const chainDamage = this.damage * 0.65;
    const candidates: Array<{ x: number; y: number; takeDamage: (dmg: number) => void }> = [];

    enemyGroup.getChildren().forEach((child) => {
      const enemy = child as unknown as { active: boolean; x: number; y: number; takeDamage: (dmg: number) => void };
      if (enemy.active && enemy !== primaryTarget) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
        if (dist <= chainRadius) {
          candidates.push(enemy);
        }
      }
    });

    // Select up to 3 nearby targets
    candidates.sort((a, b) => {
      const distA = Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y);
      const distB = Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y);
      return distA - distB;
    });

    const hitChain = candidates.slice(0, 3);
    if (hitChain.length === 0) return;

    // Draw visual electric arc graphics
    const arcG = this.scene.add.graphics();
    arcG.setDepth(15);

    hitChain.forEach((enemy) => {
      enemy.takeDamage(chainDamage);

      // Draw jagged lightning line
      arcG.lineStyle(2, 0x38bdf8, 0.9);
      arcG.beginPath();
      arcG.moveTo(this.x, this.y);

      // Add a jagged midpoint
      const midX = (this.x + enemy.x) / 2 + (Math.random() - 0.5) * 30;
      const midY = (this.y + enemy.y) / 2 + (Math.random() - 0.5) * 30;
      arcG.lineTo(midX, midY);
      arcG.lineTo(enemy.x, enemy.y);
      arcG.strokePath();

      // Inner white core
      arcG.lineStyle(1, 0xffffff, 1.0);
      arcG.beginPath();
      arcG.moveTo(this.x, this.y);
      arcG.lineTo(midX, midY);
      arcG.lineTo(enemy.x, enemy.y);
      arcG.strokePath();
    });

    // Fade out lightning arc
    this.scene.tweens.add({
      targets: arcG,
      alpha: 0,
      duration: 160,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        arcG.destroy();
      }
    });
  }

  /* --- DATA ACCESSORS --- */

  public setDamage(damage: number): void {
    this.damage = damage;
  }

  public getDamage(): number {
    return this.damage;
  }

  public setPiercing(piercing: boolean): void {
    this.isPiercing = piercing;
  }

  public getIsPiercing(): boolean {
    return this.isPiercing;
  }

  public setExplosive(explosive: boolean): void {
    this.isExplosive = explosive;
  }

  public getIsExplosive(): boolean {
    return this.isExplosive;
  }

  public setHoming(homing: boolean): void {
    this.isHoming = homing;
  }

  public getIsHoming(): boolean {
    return this.isHoming;
  }

  public getDirection(): Phaser.Math.Vector2 {
    return this.direction;
  }
}
