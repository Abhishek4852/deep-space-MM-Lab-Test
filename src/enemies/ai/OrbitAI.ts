import { Enemy } from '../Enemy';
import { EnemyAI } from './EnemyAI';
import Phaser from 'phaser';

export class OrbitAI implements EnemyAI {
  private orbitRadius = 220;
  private angleOffset = 0;
  private direction = 1; // 1: CW, -1: CCW

  constructor() {
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.angleOffset = Math.random() * Math.PI * 2;
  }

  public update(enemy: Enemy, player: { x: number; y: number }, delta: number): void {
    if (!enemy.body) return;

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);

    // Face player
    const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
    enemy.rotation = angleToPlayer;

    if (dist > this.orbitRadius + 50) {
      // Close distance
      enemy.scene.physics.velocityFromRotation(angleToPlayer, enemy.getSpeed(), body.velocity);
    } else {
      // Circle player on orbit arc
      const dt = delta / 1000;
      const angularSpeed = (enemy.getSpeed() / this.orbitRadius) * this.direction;
      this.angleOffset += angularSpeed * dt;

      const targetX = player.x + Math.cos(this.angleOffset) * this.orbitRadius;
      const targetY = player.y + Math.sin(this.angleOffset) * this.orbitRadius;

      const angleToTarget = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
      enemy.scene.physics.velocityFromRotation(angleToTarget, enemy.getSpeed(), body.velocity);
    }
  }
}
