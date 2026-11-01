import { Enemy } from '../Enemy';
import { EnemyAI } from './EnemyAI';
import Phaser from 'phaser';

export class BomberAI implements EnemyAI {
  private mineTimer = 0;
  private mineInterval = 2500; // Drop a mine every 2.5 seconds
  private retreatDist = 280;

  public update(enemy: Enemy, player: { x: number; y: number }, delta: number): void {
    if (!enemy.body) return;

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);

    // Keep rotation facing player
    enemy.rotation = angle;

    // 1. Maintain range: flee if too close, else hover/drift sideways
    if (dist < this.retreatDist) {
      // Fly backwards away from player
      enemy.scene.physics.velocityFromRotation(angle + Math.PI, enemy.getSpeed(), body.velocity);
    } else {
      // Drift perpendicular/sideways
      const flankAngle = angle + Math.PI / 2;
      enemy.scene.physics.velocityFromRotation(flankAngle, enemy.getSpeed() * 0.7, body.velocity);
    }

    // 2. Drop timed mines periodically
    this.mineTimer += delta;
    if (this.mineTimer >= this.mineInterval) {
      this.mineTimer = 0;
      this.dropMine(enemy);
    }
  }

  private dropMine(enemy: Enemy): void {
    // Offset slightly behind the bomber
    const backAngle = enemy.rotation + Math.PI;
    const dropX = enemy.x + Math.cos(backAngle) * 20;
    const dropY = enemy.y + Math.sin(backAngle) * 20;

    enemy.scene.events.emit('enemy-mine-dropped', {
      x: dropX,
      y: dropY,
      damage: enemy.getDamageValue() * 1.2
    });
  }
}
