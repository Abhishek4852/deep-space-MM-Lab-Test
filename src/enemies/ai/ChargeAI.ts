import { Enemy } from '../Enemy';
import { EnemyAI } from './EnemyAI';
import Phaser from 'phaser';

export class ChargeAI implements EnemyAI {
  private isExploding = false;

  public update(enemy: Enemy, player: { x: number; y: number }, _delta: number): void {
    if (!enemy.body || this.isExploding) return;

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);

    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
    enemy.rotation = angle;

    // Rushes player at accelerated speed
    enemy.scene.physics.velocityFromRotation(angle, enemy.getSpeed() * 1.3, body.velocity);

    // Self-destruct proximity trigger
    if (dist < 90) {
      this.triggerExplosion(enemy, player);
    }
  }

  private triggerExplosion(enemy: Enemy, player: { x: number; y: number }): void {
    this.isExploding = true;

    // Visual warning glow before instant detonate
    enemy.setTint(0xff5500);

    enemy.scene.time.delayedCall(120, () => {
      if (!enemy.active) return;

      const currentDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
      // Large explosion damage radius (120px)
      if (currentDist <= 120) {
        const playerObj = player as unknown as { takeDamage: (d: number) => void };
        if (playerObj.takeDamage) {
          playerObj.takeDamage(enemy.getDamageValue());
          enemy.scene.events.emit('player-hit-custom'); // hooks effects
        }
      }

      // Draw custom self-destruct graphics or trigger explosion
      enemy.die();
    });
  }
}
