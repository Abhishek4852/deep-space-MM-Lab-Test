import Phaser from 'phaser';
import { POWER_UP_LIST, LOOT_SETTINGS } from '@/config/PowerUpConfig';
import { GAME_EVENTS } from '@/core/Constants';
import { Enemy } from '@/enemies/Enemy';

export class LootSystem {
  private scene: Phaser.Scene;

  // Track total loot drops requested
  private totalDropsCount = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Listen to enemy deaths to calculate drop rolls
    this.scene.events.on(GAME_EVENTS.ENEMY_DIED, this.handleEnemyDied, this);

    // Clean up on scene shutdown
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  /**
   * Rolls a drop rate chance when an enemy dies. If successful, requests a power-up spawn.
   */
  private handleEnemyDied(enemy: Enemy): void {
    if (Math.random() <= LOOT_SETTINGS.DROP_CHANCE) {
      // Pick random type
      const randomIndex = Math.floor(Math.random() * POWER_UP_LIST.length);
      const chosenType = POWER_UP_LIST[randomIndex];

      this.totalDropsCount++;

      // Dispatch spawn request event carrying position and type details
      this.scene.events.emit(GAME_EVENTS.POWERUP_SPAWN_REQUEST, {
        x: enemy.x,
        y: enemy.y,
        type: chosenType
      });
    }
  }

  private shutdown(): void {
    this.scene.events.off(GAME_EVENTS.ENEMY_DIED, this.handleEnemyDied, this);
  }

  /* --- DATA ACCESSORS --- */

  public getDropsCount(): number {
    return this.totalDropsCount;
  }
}
