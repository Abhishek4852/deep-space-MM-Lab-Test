import Phaser from 'phaser';
import { WorldGenerator } from '@/world/WorldGenerator';
import { PlanetSystem, EnvironmentDebugInfo } from '@/world/PlanetSystem';
import { Comet } from '@/world/Comet';
import { PlanetFactory } from '@/world/PlanetFactory';
import { PLANET_DATABASE } from '@/world/PlanetDefinitions';

export class EnvironmentSystem {
  private scene: Phaser.Scene;
  private generator: WorldGenerator;
  private planets: PlanetSystem;
  private comets: Comet[] = [];
  private nextCometTime = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 1. Pre-bake all planet textures before creating Sprites
    PLANET_DATABASE.forEach(def => {
      PlanetFactory.generatePlanetTextures(scene, def);
    });

    // 2. Instantiate layered backgrounds
    this.generator = new WorldGenerator(scene);

    // 3. Instantiate planet & asteroid structures
    this.planets = new PlanetSystem(scene);

    // 4. Queue initial comet spawning
    this.queueNextComet();
  }

  public update(time: number, delta: number, playerX: number, playerY: number): void {
    // 1. Update star clusters, nebulas, and space dust
    this.generator.update(time, delta);

    // 2. Update planets and asteroid field culling/rotations
    this.planets.update(playerX, playerY, delta);

    // 3. Spawns periodic shooting comets
    if (time >= this.nextCometTime) {
      this.comets.push(new Comet(this.scene));
      this.queueNextComet();
    }

    // 4. Update comets lifecycle
    this.comets = this.comets.filter(comet => {
      if (comet.getIsDestroyed()) return false;
      comet.update(delta);
      return !comet.getIsDestroyed();
    });
  }

  /**
   * Helper to fetch nearest planet coordinates and display information for the Debug HUD.
   */
  public getDebugInfo(playerX: number, playerY: number): EnvironmentDebugInfo {
    const info = this.planets.getDebugInfo(playerX, playerY);
    // Add comet objects count to loaded count
    info.loadedObjectsCount += this.comets.length;
    return info;
  }

  public getPlanetSystem(): PlanetSystem {
    return this.planets;
  }

  private queueNextComet(): void {
    // Spawns a comet every 60 to 120 seconds
    const interval = 60000 + Math.random() * 60000;
    this.nextCometTime = this.scene.time.now + interval;
  }
}
