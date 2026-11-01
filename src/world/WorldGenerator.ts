import Phaser from 'phaser';
import { Nebula } from './Nebula';
import { StarCluster } from './StarCluster';
import { SpaceDust } from './SpaceDust';

export class WorldGenerator {
  private stars: StarCluster;

  constructor(scene: Phaser.Scene) {
    // 1. Nebula clouds: Z-depth -40, scroll factor 0.12
    new Nebula(scene);

    // 2. Stars: Z-depth -35/-30/-25, scroll factor 0.15/0.35/0.60
    this.stars = new StarCluster(scene);

    // 3. Space Dust: Z-depth -22, scroll factor 0.75
    new SpaceDust(scene);
  }

  public update(time: number, delta: number): void {
    // Update twinkling stars & shooting comets animation loop
    this.stars.update(time, delta);
  }
}
