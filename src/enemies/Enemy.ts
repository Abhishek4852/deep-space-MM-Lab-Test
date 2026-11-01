import Phaser from 'phaser';
import { EnemyType } from './EnemyTypes';
import { EnemyStats } from './EnemyDefinitions';
import { EnemyAI } from './ai/EnemyAI';
import { ChaseAI } from './ai/ChaseAI';
import { OrbitAI } from './ai/OrbitAI';
import { ChargeAI } from './ai/ChargeAI';
import { SniperAI } from './ai/SniperAI';
import { SwarmAI } from './ai/SwarmAI';
import { ShieldAI } from './ai/ShieldAI';
import { BomberAI } from './ai/BomberAI';
import { COLORS, GAME_EVENTS, ENEMY } from '@/core/Constants';

export enum EnemyState {
  INACTIVE,
  ALIVE,
  DYING
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private enemyType: EnemyType = EnemyType.SCOUT;
  private currentState: EnemyState = EnemyState.INACTIVE;
  private health = 0;
  private maxHealth = 0;
  private speed = 0;
  private damage = 0;
  private scoreValue = 0;

  // Invulnerability link (Shield Drone protection)
  private invulnerable = false;
  private isElite = false;

  // AI strategy decisions
  private aiStrategy: EnemyAI | null = null;

  // Visual sub-objects
  private shadowImage: Phaser.GameObjects.Image | null = null;
  private engineFlame: Phaser.GameObjects.Image | null = null;
  private eliteAura: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  private flashTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Spawn scouts by default, changed dynamically on spawn()
    super(scene, x, y, 'enemy_scout');
  }

  /**
   * Spawns/Initializes pooled enemy configurations.
   */
  public spawn(
    x: number,
    y: number,
    stats: EnemyStats,
    isElite = false,
    hpMultiplier = 1.0,
    speedMultiplier = 1.0
  ): void {
    this.enemyType = stats.type;
    this.currentState = EnemyState.ALIVE;
    this.isElite = isElite;
    this.invulnerable = false;

    // Apply baseline stats
    const baseHp = stats.hp * (isElite ? 2.0 : 1.0);
    const baseSpeed = stats.speed * (isElite ? 1.5 : 1.0);
    const baseScore = stats.scoreValue * (isElite ? 2.0 : 1.0);

    this.health = Math.round(baseHp * hpMultiplier);
    this.maxHealth = this.health;
    this.speed = baseSpeed * speedMultiplier;
    this.damage = stats.damage;
    this.scoreValue = baseScore;

    // Set texture
    this.setTexture(stats.textureKey);
    this.setRotation(0);
    this.clearTint();

    // Enable physics properties
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);

    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setEnable(true);
      body.reset(x, y);
    }

    // Assign modular AI behavior
    this.setAIStrategy(stats.type);

    // Setup visual components
    this.setupVisuals(x, y, stats.textureKey);

    // Apply elite visual color palette
    if (this.isElite) {
      this.setTint(0xffb703); // Golden overlay
    }
  }

  /**
   * Sets invulnerability state (invoked by Shield Drones).
   */
  public setInvulnerable(invulnerable: boolean): void {
    if (this.invulnerable === invulnerable) return;
    this.invulnerable = invulnerable;

    if (invulnerable) {
      this.setTint(0x38bdf8); // Sky blue glowing link tint
    } else {
      this.clearTint();
      if (this.isElite) {
        this.setTint(0xffb703);
      }
    }
  }

  public isShielded(): boolean {
    return this.invulnerable;
  }

  public isEliteEnemy(): boolean {
    return this.isElite;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getType(): EnemyType {
    return this.enemyType;
  }

  public getDamageValue(): number {
    return this.damage;
  }

  public getScoreValue(): number {
    return this.scoreValue;
  }

  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public getCurrentState(): EnemyState {
    return this.currentState;
  }

  public takeDamage(amount: number): void {
    if (this.currentState !== EnemyState.ALIVE) return;

    // If shielded by a Shield Drone, ignore all damage
    if (this.invulnerable) {
      // Draw shield deflection flash
      this.scene.tweens.add({
        targets: this,
        scaleX: this.scaleX * 1.15,
        scaleY: this.scaleY * 1.15,
        duration: 80,
        yoyo: true
      });
      return;
    }

    this.health = Math.max(0, this.health - amount);

    // Flash hit feedback
    this.setTint(COLORS.ENEMY_DAMAGE).setTintMode(Phaser.TintModes.FILL);
    if (this.flashTimer) {
      this.flashTimer.destroy();
    }
    this.flashTimer = this.scene.time.delayedCall(ENEMY.HIT_FLASH_DURATION, () => {
      if (this.active) {
        this.clearTint();
        if (this.isElite) {
          this.setTint(0xffb703);
        } else if (this.invulnerable) {
          this.setTint(0x38bdf8);
        }
      }
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  public die(): void {
    if (this.currentState !== EnemyState.ALIVE) return;
    this.currentState = EnemyState.DYING;

    this.scene.events.emit(GAME_EVENTS.ENEMY_DIED, this);
    this.despawn();
  }

  public despawn(): void {
    this.currentState = EnemyState.INACTIVE;
    this.setActive(false);
    this.setVisible(false);

    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setEnable(false);
      body.setVelocity(0, 0);
    }

    if (this.flashTimer) {
      this.flashTimer.destroy();
      this.flashTimer = null;
    }

    // Clean up modular AI instances
    if (this.aiStrategy && (this.aiStrategy as any).destroy) {
      (this.aiStrategy as any).destroy();
    }
    this.aiStrategy = null;

    // Destroy visual components
    this.cleanupVisuals();
  }

  public update(_time: number, delta: number): void {
    if (this.currentState !== EnemyState.ALIVE) return;

    // Drive modular AI updates
    const player = (this.scene as any).player;
    if (player && this.aiStrategy) {
      this.aiStrategy.update(this, player, delta);
    }

    // Update visuals positions
    this.updateVisualPositions();
  }

  private setAIStrategy(type: EnemyType): void {
    switch (type) {
      case EnemyType.SCOUT:
        this.aiStrategy = new ChaseAI();
        break;
      case EnemyType.INTERCEPTOR:
        this.aiStrategy = new OrbitAI();
        break;
      case EnemyType.KAMIKAZE:
        this.aiStrategy = new ChargeAI();
        break;
      case EnemyType.SNIPER:
        this.aiStrategy = new SniperAI();
        break;
      case EnemyType.SWARM:
        this.aiStrategy = new SwarmAI();
        break;
      case EnemyType.SHIELD:
        this.aiStrategy = new ShieldAI();
        break;
      case EnemyType.BOMBER:
        this.aiStrategy = new BomberAI();
        break;
      default:
        this.aiStrategy = new ChaseAI();
    }
  }

  private setupVisuals(x: number, y: number, textureKey: string): void {
    const scene = this.scene;

    // 1. Shadow overlay
    this.shadowImage = scene.add.image(x, y, textureKey);
    this.shadowImage.setTint(0x000000).setAlpha(0.25).setDepth(-19);

    // 2. Engine flame
    this.engineFlame = scene.add.image(x, y, 'engine_flame');
    // Scale flame down for small swarm drones
    const scale = this.enemyType === EnemyType.SWARM ? 0.4 : 0.75;
    this.engineFlame.setScale(scale).setDepth(-18);

    // 3. Elite Aura particles
    if (this.isElite) {
      this.eliteAura = scene.add.particles(x, y, 'comet_particle', {
        speed: 15,
        scale: { start: 0.7, end: 0.1 },
        alpha: { start: 0.65, end: 0 },
        lifespan: 500,
        frequency: 60,
        blendMode: 'ADD'
      });
      this.eliteAura.setDepth(-18);
    }
  }

  private updateVisualPositions(): void {
    const r = this.rotation;
    const sizeOffset = this.width / 2;

    // Position shadow (offset down-right by 12px)
    if (this.shadowImage) {
      this.shadowImage.setPosition(this.x + 10, this.y + 10);
      this.shadowImage.setRotation(r);
      this.shadowImage.setVisible(this.visible);
    }

    // Position engine flame trailing behind nozzle
    if (this.engineFlame) {
      const fx = this.x - Math.cos(r) * sizeOffset;
      const fy = this.y - Math.sin(r) * sizeOffset;
      this.engineFlame.setPosition(fx, fy);
      this.engineFlame.setRotation(r);
      this.engineFlame.setVisible(this.visible);

      // Flickering animation speed
      this.engineFlame.setScale(
        (this.enemyType === EnemyType.SWARM ? 0.4 : 0.75) * (0.85 + Math.random() * 0.3)
      );
    }

    // Track Elite Aura
    if (this.eliteAura) {
      this.eliteAura.setPosition(this.x, this.y);
    }
  }

  private cleanupVisuals(): void {
    if (this.shadowImage) {
      this.shadowImage.destroy();
      this.shadowImage = null;
    }
    if (this.engineFlame) {
      this.engineFlame.destroy();
      this.engineFlame = null;
    }
    if (this.eliteAura) {
      this.eliteAura.stop();
      const auraRef = this.eliteAura;
      this.eliteAura = null;
      this.scene.time.delayedCall(600, () => {
        auraRef.destroy();
      });
    }
  }
}
