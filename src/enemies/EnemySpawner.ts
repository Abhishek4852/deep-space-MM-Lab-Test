import Phaser from 'phaser';
import { EnemyType } from './EnemyTypes';
import { ENEMY_DEFINITIONS } from './EnemyDefinitions';
import { getWaveComposition, WaveComposition } from './WaveDefinitions';
import { EliteSystem } from '@/systems/EliteSystem';
import { Enemy } from './Enemy';
import { ENEMY, WORLD, GAME_EVENTS } from '@/core/Constants';

export class EnemySpawner {
  private scene: Phaser.Scene;
  private enemyGroup: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.enemyGroup = enemyGroup;

    // Listen to enemy spawn requests
    this.scene.events.on(GAME_EVENTS.ENEMY_SPAWN_REQUEST, this.handleSpawnRequest, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  /**
   * Spawns an enemy off-screen based on data-driven wave configurations and elite modifier rolls.
   */
  private handleSpawnRequest(data: { 
    waveNumber: number; 
    hpMultiplier: number; 
    speedMultiplier: number;
    // Optional specific coordinates for boss helper drone spawns
    x?: number;
    y?: number;
    stats?: any;
  }): void {
    const player = (this.scene as any).player;
    if (!player || player.getIsDead()) return;

    // 1. Determine spawn position coordinates
    let spawnX = 0;
    let spawnY = 0;

    if (data.x !== undefined && data.y !== undefined) {
      spawnX = data.x;
      spawnY = data.y;
    } else {
      // Off-screen radial placement relative to player position
      const angle = Math.random() * Math.PI * 2;
      const distance = ENEMY.SPAWN_MIN_DIST + Math.random() * (ENEMY.SPAWN_MAX_DIST - ENEMY.SPAWN_MIN_DIST);
      
      spawnX = player.x + Math.cos(angle) * distance;
      spawnY = player.y + Math.sin(angle) * distance;

      // Clamp coordinates inside world bounds with 60px boundary safe zones
      const margin = 60;
      spawnX = Phaser.Math.Clamp(spawnX, margin, WORLD.WIDTH - margin);
      spawnY = Phaser.Math.Clamp(spawnY, margin, WORLD.HEIGHT - margin);
    }

    // 2. Fetch inactive enemy from physics object pool
    const enemy = this.enemyGroup.get(spawnX, spawnY) as Enemy | null;
    if (!enemy) return;

    // 3. Roll/Choose enemy type configuration deterministically
    let targetStats = data.stats;
    let rollElite = false;

    if (!targetStats) {
      const composition = getWaveComposition(data.waveNumber);
      const chosenType = this.selectEnemyTypeWeighted(composition);
      targetStats = ENEMY_DEFINITIONS[chosenType];

      // Roll for Elite variant (starts Wave 5+)
      rollElite = EliteSystem.rollForElite(data.waveNumber, composition);
    }

    // 4. Spawn the entity
    enemy.spawn(
      spawnX,
      spawnY,
      targetStats,
      rollElite,
      data.hpMultiplier,
      data.speedMultiplier
    );

    // Notify listeners
    this.scene.events.emit(GAME_EVENTS.ENEMY_SPAWNED, enemy);
    
    if (rollElite) {
      this.scene.events.emit('elite-spawn', enemy);
    }
  }

  /**
   * Helper to perform a cumulative weighted random choice for enemy type selections.
   */
  private selectEnemyTypeWeighted(composition: WaveComposition): EnemyType {
    const weights = composition.weights;
    
    // Calculate total weight sum
    let totalWeight = 0;
    for (const type in weights) {
      totalWeight += weights[type as EnemyType];
    }

    if (totalWeight <= 0) {
      return EnemyType.SCOUT; // Fallback
    }

    // Roll random threshold
    let roll = Math.random() * totalWeight;
    for (const type in weights) {
      const weight = weights[type as EnemyType];
      if (roll < weight) {
        return type as EnemyType;
      }
      roll -= weight;
    }

    return EnemyType.SCOUT;
  }

  private shutdown(): void {
    this.scene.events.off(GAME_EVENTS.ENEMY_SPAWN_REQUEST, this.handleSpawnRequest, this);
  }
}
