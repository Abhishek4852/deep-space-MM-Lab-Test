import Phaser from 'phaser';
import { SpaceObject } from './SpaceObject';
import { PlanetDefinition } from './PlanetDefinitions';
import { PlanetLabel } from './PlanetLabel';
import { PLANET } from '@/core/PlanetConstants';

export class Planet extends SpaceObject {
  private definition: PlanetDefinition;
  private glowSprite: Phaser.GameObjects.Image;
  private surfaceSprite: Phaser.GameObjects.Image;
  private cloudsSprite: Phaser.GameObjects.Image | null = null;
  private ringsSprite: Phaser.GameObjects.Image | null = null;
  private shadowSprite: Phaser.GameObjects.Image;
  private label: PlanetLabel;

  private discovered = false;

  constructor(scene: Phaser.Scene, def: PlanetDefinition) {
    // Planets render at environment depth layer (default -20)
    super(scene, def.x, def.y, def.id, def.name, def.radius);
    this.definition = def;

    const R = def.radius;

    // 1. Atmosphere Glow Layer (Z-index bottom)
    this.glowSprite = scene.add.image(0, 0, `planet_glow_${def.id}`);
    this.add(this.glowSprite);

    // 2. Rings Layer (Saturn specific, fits below surface shadow but above base body)
    if (def.hasRing) {
      this.ringsSprite = scene.add.image(0, 0, `planet_ring_${def.id}`);
      this.ringsSprite.setRotation(Math.PI / 8); // Tilted 2.5D ring plane
      this.add(this.ringsSprite);
    }

    // 3. Surface Layer (Baked surface texture)
    this.surfaceSprite = scene.add.image(0, 0, `planet_surface_${def.id}`);
    this.add(this.surfaceSprite);

    // 4. Clouds Layer (Rotates independently)
    if (def.hasClouds) {
      this.cloudsSprite = scene.add.image(0, 0, `planet_clouds_${def.id}`);
      this.add(this.cloudsSprite);
    }

    // 5. Shadow Overlay (Locks directional sunlight illumination in place)
    this.shadowSprite = scene.add.image(0, 0, `planet_shadow_${def.id}`);
    this.add(this.shadowSprite);

    // 6. Floating descriptive Label
    // Position below the planet (radius + padding)
    const labelY = R + 45 + (def.hasRing ? R * 0.35 : 0);
    this.label = new PlanetLabel(scene, 0, labelY, def);
    this.add(this.label);

    // Apply fixed depth
    this.setDepth(-20);
  }

  public update(playerX: number, playerY: number, delta: number): void {
    const d = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);

    // 1. Distance Culling
    if (d > PLANET.MAX_RENDER_DISTANCE) {
      this.setCull(true);
      return;
    }

    this.setCull(false);

    // 2. Dynamic Discovery Banner Trigger
    if (d < PLANET.LABEL_DISTANCE && !this.discovered) {
      this.discovered = true;
      this.scene.events.emit('planet-discovered', this.definition);
    }

    // 3. Ambient Animations (subtle rotations and glows)
    const dt = delta / 1000; // Delta in seconds

    // Surface rotation
    this.surfaceSprite.rotation += this.definition.rotationSpeed * dt;

    // Cloud rotation (independent slow drifting clouds)
    if (this.cloudsSprite) {
      const cloudSpeed = this.definition.id === 'venus' ? -0.001 : 0.002;
      this.cloudsSprite.rotation += cloudSpeed * dt;
    }

    // Ring rotation (Saturn specific)
    if (this.ringsSprite) {
      this.ringsSprite.rotation += 0.0004 * dt;
    }

    // Ambient planetary atmosphere effects
    const time = this.scene.time.now;
    if (this.definition.id === 'mars') {
      // Dust storm pulsing glow alpha
      const pulse = PLANET.GLOW_ALPHA + Math.sin(time * 0.0025) * 0.08;
      this.glowSprite.setAlpha(pulse);
    } else if (this.definition.id === 'jupiter') {
      // Differential band movement illusion (rotate cloud and surface in opposite directions)
      this.surfaceSprite.rotation += 0.0003 * dt;
    }

    // 4. Update Label Proximity fading
    this.label.updateProximity(d);
  }

  public getDefinition(): PlanetDefinition {
    return this.definition;
  }
}
