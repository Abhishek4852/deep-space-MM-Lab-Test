import Phaser from 'phaser';
import { GAME_EVENTS } from '@/core/Constants';
import { POWER_UP_LIST } from '@/config/PowerUpConfig';

export abstract class Boss extends Phaser.GameObjects.Container {
  protected bossId: string;
  protected bossName: string;
  protected health = 1000;
  protected maxHealth = 1000;
  protected speed = 60;
  protected activePhase = 1;
  protected target: { x: number; y: number } | null = null;
  protected isDead = false;

  private flashTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, id: string, name: string, maxHp: number) {
    super(scene, x, y);
    this.bossId = id;
    this.bossName = name;
    this.health = maxHp;
    this.maxHealth = maxHp;

    // Enable Arcade physics on this container
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    (scene.add as unknown as { existing: (go: unknown) => void }).existing(this);
  }

  public setTarget(target: { x: number; y: number } | null): void {
    this.target = target;
  }

  public takeDamage(amount: number): void {
    if (this.isDead) return;

    this.health = Math.max(0, this.health - amount);

    // Apply hit flash to container children (e.g. core sprite)
    this.flashContainer();

    // Fire state update triggers for phase thresholds
    this.checkPhaseThresholds();

    if (this.health <= 0) {
      this.die();
    }
  }

  protected flashContainer(): void {
    // Flash all image/sprite children white
    this.list.forEach((child) => {
      const img = child as unknown as { setTint: (t: number) => void; clearTint: () => void };
      if (img.setTint) {
        img.setTint(0xffffff);
      }
    });

    if (this.flashTimer) this.flashTimer.destroy();

    this.flashTimer = this.scene.time.delayedCall(100, () => {
      this.list.forEach((child) => {
        const img = child as unknown as { clearTint: () => void };
        if (img.clearTint) img.clearTint();
      });
      // Call restore tints in subclasses if custom colors are used
      this.restoreOriginalColors();
    });
  }

  protected abstract restoreOriginalColors(): void;
  protected abstract checkPhaseThresholds(): void;

  public die(): void {
    if (this.isDead) return;
    this.isDead = true;

    // Trigger boss-death hooks
    this.scene.events.emit(GAME_EVENTS.ENEMY_DIED, this); // wave system hooks
    this.scene.events.emit('boss-death', this);

    // Spawn massive loot drops
    this.dropRewards();

    this.destroy();
  }

  public dropRewards(): void {
    const x = this.x;
    const y = this.y;

    // 1. Drop 3-5 random powerups
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const rx = x + (Math.random() - 0.5) * 80;
      const ry = y + (Math.random() - 0.5) * 80;
      const chosenType = POWER_UP_LIST[Math.floor(Math.random() * POWER_UP_LIST.length)];
      
      this.scene.events.emit(GAME_EVENTS.POWERUP_SPAWN_REQUEST, {
        x: rx,
        y: ry,
        type: chosenType
      });
    }

    // 2. Drop guaranteed shield refill & health packs
    // Spawn score bonus event directly
    this.scene.events.emit('boss-loot-rewards', { x, y });
  }

  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public getBossName(): string {
    return this.bossName;
  }

  public getActivePhase(): number {
    return this.activePhase;
  }
  
  public getIsDead(): boolean {
    return this.isDead;
  }
}
