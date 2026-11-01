import { Enemy } from '../Enemy';
import { EnemyAI } from './EnemyAI';
import { EnemyType } from '../EnemyTypes';
import Phaser from 'phaser';

export class ShieldAI implements EnemyAI {
  private target: Enemy | null = null;
  private linkGraphic: Phaser.GameObjects.Graphics | null = null;

  public update(enemy: Enemy, player: { x: number; y: number }, _delta: number): void {
    if (!enemy.body) {
      this.cleanup();
      return;
    }

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const speed = enemy.getSpeed();
    const scene = enemy.scene;

    // 1. Locate closest active ally (excluding other shield drones)
    const activeEnemies = ((scene as any).enemySystem?.getGroup()?.getChildren() || []) as Enemy[];
    let closestAlly: Enemy | null = null;
    let minDist = Infinity;

    activeEnemies.forEach((otherObj: any) => {
      const other = otherObj as Enemy;
      if (!other || other === enemy || !other.active || other.getType() === EnemyType.SHIELD) return;

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y);
      if (dist < minDist) {
        minDist = dist;
        closestAlly = other;
      }
    });

    // 2. Manage target linking
    if (closestAlly !== null) {
      const ally = closestAlly as Enemy;
      // Clear old target if changed
      if (this.target && this.target !== ally) {
        this.target.setInvulnerable(false);
      }
      this.target = ally;
      this.target.setInvulnerable(true);

      // Navigate to hover near the ally
      const angleToAlly = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.target.x, this.target.y);
      enemy.rotation = angleToAlly;

      if (minDist > 90) {
        scene.physics.velocityFromRotation(angleToAlly, speed, body.velocity);
      } else {
        // Soft hover drag
        body.setVelocity(body.velocity.x * 0.9, body.velocity.y * 0.9);
      }

      // Draw linked forcefield graphic
      if (!this.linkGraphic && enemy.active) {
        this.linkGraphic = scene.add.graphics().setDepth(-5);
      }
      if (this.linkGraphic) {
        this.linkGraphic.clear();
        const pulseAlpha = 0.4 + Math.sin(scene.time.now * 0.012) * 0.25;
        this.linkGraphic.lineStyle(2.0, 0x38bdf8, pulseAlpha); // sky blue linked stream
        this.linkGraphic.lineBetween(enemy.x, enemy.y, this.target.x, this.target.y);
      }
    } else {
      // No allies: flee from player
      this.cleanup();
      const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
      enemy.rotation = angleToPlayer;
      scene.physics.velocityFromRotation(angleToPlayer + Math.PI, speed * 0.9, body.velocity);
    }
  }

  public cleanup(): void {
    if (this.target && this.target.active) {
      this.target.setInvulnerable(false);
    }
    this.target = null;
    if (this.linkGraphic) {
      this.linkGraphic.clear();
    }
  }

  public destroy(): void {
    this.cleanup();
    if (this.linkGraphic) {
      this.linkGraphic.destroy();
      this.linkGraphic = null;
    }
  }
}
