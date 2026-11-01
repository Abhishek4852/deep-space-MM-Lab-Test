import Phaser from 'phaser';
import { Boss } from './Boss';
import { ProjectileType } from '@/enemies/EnemyProjectile';

export class Dreadnought extends Boss {
  private shootTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Dreadnought: ID 'dreadnought', Name, HP 7500
    super(scene, x, y, 'dreadnought', 'DREADNOUGHT CLASS', 7500);

    const coreSprite = scene.add.image(0, 0, 'boss_dreadnought');
    this.add(coreSprite);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(160, 110);
    body.setOffset(-80, -55);

    this.setDepth(-10);
  }

  public update(_time: number, delta: number): void {
    if (this.isDead) return;

    // Slow drift tracking
    if (this.target && this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
      this.rotation = angle;

      this.scene.physics.velocityFromRotation(angle, this.speed, body.velocity);
    }

    // Placeholder simple attacks (missile spreads)
    this.shootTimer += delta;
    if (this.shootTimer >= 4000) {
      this.shootTimer = 0;
      this.firePlaceholderMissiles();
    }
  }

  protected restoreOriginalColors(): void {
    // Placeholder clean
  }

  protected checkPhaseThresholds(): void {
    const pct = this.health / this.maxHealth;
    if (pct <= 0.5 && this.activePhase < 2) {
      this.activePhase = 2;
      this.scene.events.emit('boss-phase-change', 2, this);
    }
  }

  private firePlaceholderMissiles(): void {
    if (!this.target) return;

    // Fire 2 parallel missiles
    const sideOffset = 40;
    const angle = this.rotation;

    const leftX = this.x + Math.cos(angle + Math.PI/2) * sideOffset;
    const leftY = this.y + Math.sin(angle + Math.PI/2) * sideOffset;

    const rightX = this.x + Math.cos(angle - Math.PI/2) * sideOffset;
    const rightY = this.y + Math.sin(angle - Math.PI/2) * sideOffset;

    const spawnList = [
      { x: leftX, y: leftY },
      { x: rightX, y: rightY }
    ];

    spawnList.forEach((pos) => {
      this.scene.events.emit('enemy-projectile-spawn', {
        x: pos.x,
        y: pos.y,
        angle: angle,
        type: ProjectileType.MISSILE,
        damage: 30,
        target: this.target
      });
    });
  }
}
