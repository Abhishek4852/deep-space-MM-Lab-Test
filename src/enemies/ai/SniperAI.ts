import { Enemy } from '../Enemy';
import { EnemyAI } from './EnemyAI';
import Phaser from 'phaser';

type SniperState = 'POSITIONING' | 'CHARGING' | 'COOLDOWN';

export class SniperAI implements EnemyAI {
  private state: SniperState = 'POSITIONING';
  private stateTimer = 0;
  private targetDist = 420;
  
  // Warning laser visual lines
  private warningGraphic: Phaser.GameObjects.Graphics | null = null;
  private laserChargeDuration = 1000; // 1 second guide warning
  private cooldownDuration = 1500;    // 1.5 seconds relocation cooldown

  public update(enemy: Enemy, player: { x: number; y: number }, delta: number): void {
    if (!enemy.body) {
      this.cleanup();
      return;
    }

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);

    // Keep rotation facing the player
    enemy.rotation = angle;

    // Initialize warning graphics container once
    if (!this.warningGraphic && enemy.active) {
      this.warningGraphic = enemy.scene.add.graphics().setDepth(-5);
    }

    this.stateTimer += delta;

    if (this.state === 'POSITIONING') {
      this.cleanup(); // Make sure no line is drawn while positioning

      if (dist > this.targetDist + 40) {
        // Fly closer
        enemy.scene.physics.velocityFromRotation(angle, enemy.getSpeed(), body.velocity);
      } else if (dist < this.targetDist - 40) {
        // Fly backwards
        enemy.scene.physics.velocityFromRotation(angle + Math.PI, enemy.getSpeed(), body.velocity);
      } else {
        // In range: stop and start charging laser
        body.setVelocity(0, 0);
        this.state = 'CHARGING';
        this.stateTimer = 0;
      }
    } else if (this.state === 'CHARGING') {
      body.setVelocity(0, 0);

      // Draw warning laser targeting line
      if (this.warningGraphic) {
        this.warningGraphic.clear();
        
        // Progressively color/pulsate line as charge finishes
        const pct = Math.min(1.0, this.stateTimer / this.laserChargeDuration);
        const color = pct > 0.8 ? 0xef4444 : 0x06b6d4; // Red when about to shoot, otherwise cyan
        const alpha = 0.3 + pct * 0.6;
        const width = 1.0 + pct * 1.5;

        this.warningGraphic.lineStyle(width, color, alpha);
        this.warningGraphic.lineBetween(enemy.x, enemy.y, player.x, player.y);
      }

      if (this.stateTimer >= this.laserChargeDuration) {
        this.fireLaser(enemy, player);
        this.state = 'COOLDOWN';
        this.stateTimer = 0;
      }
    } else if (this.state === 'COOLDOWN') {
      this.cleanup();

      // Relocate: drift sideways/flank during cooldown
      const flankAngle = angle + Math.PI / 2;
      enemy.scene.physics.velocityFromRotation(flankAngle, enemy.getSpeed() * 0.8, body.velocity);

      if (this.stateTimer >= this.cooldownDuration) {
        this.state = 'POSITIONING';
        this.stateTimer = 0;
      }
    }
  }

  private fireLaser(enemy: Enemy, player: { x: number; y: number }): void {
    this.cleanup();

    // Trigger projectile spawn request
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
    enemy.scene.events.emit('enemy-laser-fired', {
      x: enemy.x + Math.cos(angle) * 20,
      y: enemy.y + Math.sin(angle) * 20,
      angle: angle,
      speed: 450,
      damage: enemy.getDamageValue() * 1.5 // Snipers deal high damage
    });
  }

  private cleanup(): void {
    if (this.warningGraphic) {
      this.warningGraphic.clear();
    }
  }

  public destroy(): void {
    if (this.warningGraphic) {
      this.warningGraphic.destroy();
      this.warningGraphic = null;
    }
  }
}
