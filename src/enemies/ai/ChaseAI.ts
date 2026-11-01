import { Enemy } from '../Enemy';
import { EnemyAI } from './EnemyAI';
import Phaser from 'phaser';

export class ChaseAI implements EnemyAI {
  public update(enemy: Enemy, player: { x: number; y: number }, _delta: number): void {
    if (!enemy.body) return;

    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
    enemy.rotation = angle;

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    enemy.scene.physics.velocityFromRotation(angle, enemy.getSpeed(), body.velocity);
  }
}
