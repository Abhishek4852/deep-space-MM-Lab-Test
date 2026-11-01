import { Enemy } from '../Enemy';
import { EnemyAI } from './EnemyAI';
import { EnemyType } from '../EnemyTypes';
import Phaser from 'phaser';

export class SwarmAI implements EnemyAI {
  public update(enemy: Enemy, player: { x: number; y: number }, _delta: number): void {
    if (!enemy.body) return;

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const speed = enemy.getSpeed();

    // 1. Base vector pointing to player
    const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
    let vx = Math.cos(angleToPlayer) * speed;
    let vy = Math.sin(angleToPlayer) * speed;

    // 2. Query nearby swarm drones to apply flocking cohesion & separation
    // Get sibling enemies from active enemy group
    const scene = enemy.scene;
    // We can access the enemy group from the scene or from the parent context,
    const activeEnemies = ((scene as any).enemySystem?.getGroup()?.getChildren() || []) as Enemy[];

    let separationX = 0;
    let separationY = 0;
    let cohesionX = 0;
    let cohesionY = 0;
    let flockCount = 0;

    activeEnemies.forEach((otherObj: any) => {
      const other = otherObj as Enemy;
      if (!other || other === enemy || !other.active || other.getType() !== EnemyType.SWARM) return;

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y);
      if (dist < 150) {
        flockCount++;
        
        // Cohesion: pull towards other swarm drones
        cohesionX += other.x;
        cohesionY += other.y;

        // Separation: push away if too tight (less than 35px)
        if (dist < 35 && dist > 0) {
          const force = (35 - dist) / 35;
          const repAngle = Phaser.Math.Angle.Between(other.x, other.y, enemy.x, enemy.y);
          separationX += Math.cos(repAngle) * force * speed * 1.5;
          separationY += Math.sin(repAngle) * force * speed * 1.5;
        }
      }
    });

    if (flockCount > 0) {
      // Average center of mass of neighbors
      const avgCohesionX = cohesionX / flockCount;
      const avgCohesionY = cohesionY / flockCount;
      const angleToCohesion = Phaser.Math.Angle.Between(enemy.x, enemy.y, avgCohesionX, avgCohesionY);

      // Blend vectors: 60% Player Chase, 20% Cohesion, 20% Separation
      vx = vx * 0.6 + Math.cos(angleToCohesion) * speed * 0.2 + separationX * 0.2;
      vy = vy * 0.6 + Math.sin(angleToCohesion) * speed * 0.2 + separationY * 0.2;
    }

    // Set heading rotation
    const moveAngle = Math.atan2(vy, vx);
    enemy.rotation = moveAngle;

    // Apply velocities
    body.setVelocity(vx, vy);
  }
}
