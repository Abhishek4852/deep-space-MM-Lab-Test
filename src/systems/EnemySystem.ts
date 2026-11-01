import Phaser from 'phaser';
import { Enemy } from '@/enemies/Enemy';
import { ENEMY, GAME_EVENTS } from '@/core/Constants';

export class EnemySystem {
  private scene: Phaser.Scene;
  private enemyGroup: Phaser.Physics.Arcade.Group;

  // Bookkeeping stats counters
  private enemiesSpawnedCount = 0;
  private enemiesDestroyedCount = 0;

  constructor(scene: Phaser.Scene, _player?: unknown) {
    this.scene = scene;

    // Instantiate pooled Arcade Physics group
    this.enemyGroup = scene.physics.add.group({
      classType: Enemy,
      maxSize: ENEMY.POOL_SIZE,
      runChildUpdate: false
    });

    // Pre-create full pool with scout textures
    this.enemyGroup.createMultiple({
      active: false,
      visible: false,
      key: 'enemy_scout',
      repeat: ENEMY.POOL_SIZE - 1
    });

    // Listen to events to drive stats tracking
    this.scene.events.on(GAME_EVENTS.ENEMY_DIED, this.handleEnemyDied, this);
    this.scene.events.on(GAME_EVENTS.ENEMY_SPAWNED, this.handleEnemySpawned, this);

    // Clean up event listeners when the scene shuts down
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.events.off(GAME_EVENTS.ENEMY_DIED, this.handleEnemyDied, this);
      this.scene.events.off(GAME_EVENTS.ENEMY_SPAWNED, this.handleEnemySpawned, this);
    });
  }

  /**
   * Drives updates on active enemies.
   */
  public update(time: number, delta: number): void {
    // Drive updates on active enemies
    this.enemyGroup.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (enemy.active) {
        enemy.update(time, delta);
      }
    });
  }

  private handleEnemySpawned(): void {
    this.enemiesSpawnedCount++;
  }

  private handleEnemyDied(): void {
    this.enemiesDestroyedCount++;
  }

  /* --- HUD & DIAGNOSTICS ACCESSORS --- */

  public getGroup(): Phaser.Physics.Arcade.Group {
    return this.enemyGroup;
  }

  public getActiveCount(): number {
    return this.enemyGroup.countActive(true);
  }

  public getPoolSize(): number {
    return this.enemyGroup.maxSize;
  }

  public getSpawnedCount(): number {
    return this.enemiesSpawnedCount;
  }

  public getDestroyedCount(): number {
    return this.enemiesDestroyedCount;
  }

  /**
   * Resets counts and returns all active enemies back to the pool.
   */
  public reset(): void {
    this.enemiesSpawnedCount = 0;
    this.enemiesDestroyedCount = 0;
    this.enemyGroup.getChildren().forEach((child) => {
      (child as Enemy).despawn();
    });
  }
}
