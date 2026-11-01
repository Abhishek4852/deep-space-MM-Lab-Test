import Phaser from 'phaser';
import { PlanetDefinition } from './PlanetDefinitions';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';

export class PlanetLabel extends Phaser.GameObjects.Container {
  private nameText: Phaser.GameObjects.Text;
  private infoText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, def: PlanetDefinition) {
    super(scene, x, y);

    // 1. Planet Name (Primary Accent)
    this.nameText = scene.add.text(0, 0, def.name, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.md,
      color: Colors.primary,
      fontStyle: Typography.weight.bold,
    }).setOrigin(0.5, 0.5);
    this.add(this.nameText);

    // 2. Planet Info Block (Radius & Tagline)
    const infoString = `Radius: ${def.radius * 30} km\n${def.tagline.toUpperCase()}`;
    this.infoText = scene.add.text(0, 20, infoString, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.xs,
      color: Colors.textSecondary,
      align: 'center',
    }).setOrigin(0.5, 0);
    this.add(this.infoText);

    // Initial opacity is hidden
    this.setAlpha(0);

    scene.add.existing(this);
  }

  /**
   * Dynamically fades label opacity based on player proximity.
   * Fade in starts at 800px and reaches 100% visibility at 400px.
   */
  public updateProximity(distance: number): void {
    if (distance <= 400) {
      this.setAlpha(1);
    } else if (distance >= 800) {
      this.setAlpha(0);
    } else {
      // Interpolate alpha from 0 to 1 between 800px and 400px
      const ratio = 1 - (distance - 400) / 400;
      this.setAlpha(ratio);
    }
  }
}
