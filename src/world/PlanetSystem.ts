import Phaser from 'phaser';
import { Planet } from './Planet';
import { PLANET_DATABASE, PlanetDefinition } from './PlanetDefinitions';
import { AsteroidField } from './AsteroidField';
import { PlanetDiscoveryBanner } from '@/ui/PlanetDiscoveryBanner';

export interface EnvironmentDebugInfo {
  currentRegion: string;
  nearestPlanetName: string;
  nearestPlanetDistance: number;
  visiblePlanetsCount: number;
  loadedObjectsCount: number;
}

export class PlanetSystem {
  private scene: Phaser.Scene;
  private planets: Planet[] = [];
  private asteroidFields: AsteroidField[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 1. Instantiate all Planets from DB
    PLANET_DATABASE.forEach((def) => {
      // Bake textures on load/init
      // Note: we can import PlanetFactory in Planet.ts or here.
      // We will ensure that textures are created here or inside Planet's constructor
      const planet = new Planet(scene, def);
      this.planets.push(planet);
    });

    // 2. Instantiate Interplanetary Asteroid Fields (between orbits)
    // Field 1: Between Earth & Mars
    this.asteroidFields.push(new AsteroidField(scene, 4300, 3550, 45, 380));
    // Field 2: Between Mars & Jupiter
    this.asteroidFields.push(new AsteroidField(scene, 6200, 4550, 65, 450));
    // Field 3: Between Jupiter & Saturn
    this.asteroidFields.push(new AsteroidField(scene, 8250, 5900, 95, 600));
    // Field 4: Between Saturn & Uranus
    this.asteroidFields.push(new AsteroidField(scene, 9800, 8050, 80, 500));

    // 3. Listen to Discovery Event to spawn banners
    scene.events.on('planet-discovered', this.handlePlanetDiscovered, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  public update(playerX: number, playerY: number, delta: number): void {
    // 1. Update Planets
    this.planets.forEach((p) => p.update(playerX, playerY, delta));

    // 2. Update Asteroid Fields
    this.asteroidFields.forEach((f) => f.update(playerX, playerY, delta));
  }

  /**
   * Helper to fetch nearest planet coordinates and display information for the Debug HUD.
   */
  public getDebugInfo(playerX: number, playerY: number): EnvironmentDebugInfo {
    let nearestPlanet: Planet | null = null;
    let minDistance = Infinity;
    let visibleCount = 0;

    this.planets.forEach((p) => {
      if (p.active && p.visible) {
        visibleCount++;
      }
      const dist = Phaser.Math.Distance.Between(playerX, playerY, p.x, p.y);
      if (dist < minDistance) {
        minDistance = dist;
        nearestPlanet = p;
      }
    });

    // Calculate current region quadrant names
    // Division into 3x3 quadrant grid of the 12000x12000 map
    const gridX = Math.min(2, Math.floor(playerX / 4000));
    const gridY = Math.min(2, Math.floor(playerY / 4000));
    
    const rows = ['Inner', 'Mid', 'Outer'];
    const cols = ['Sector-Alpha', 'Sector-Beta', 'Sector-Gamma'];
    const regionName = `${rows[gridY]} ${cols[gridX]}`;

    // Total entities loaded: planets (9) + asteroid fields containing rocks (45+65+95+80 = 285) = 294
    const totalLoaded = 9 + 45 + 65 + 95 + 80;

    return {
      currentRegion: regionName,
      nearestPlanetName: nearestPlanet ? (nearestPlanet as Planet).getName() : 'Unknown',
      nearestPlanetDistance: Math.round(minDistance),
      visiblePlanetsCount: visibleCount,
      loadedObjectsCount: totalLoaded
    };
  }

  public getPlanets(): Planet[] {
    return this.planets;
  }

  private handlePlanetDiscovered(def: PlanetDefinition): void {
    // Spawn Planet Discovery banner!
    new PlanetDiscoveryBanner(this.scene, def);
  }

  private shutdown(): void {
    this.scene.events.off('planet-discovered', this.handlePlanetDiscovered, this);
  }
}
