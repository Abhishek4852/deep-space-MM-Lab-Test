import Phaser from 'phaser';
import { TopLeftHUD } from './TopLeftHUD';
import { TopRightHUD } from './TopRightHUD';
import { BottomLeftHUD } from './BottomLeftHUD';
import { BottomRightHUD } from './BottomRightHUD';
import { UILayoutManager, UILayout } from '@/ui/UILayoutManager';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';

export class HUD {
  private bottomLeft: BottomLeftHUD;
  private watermarkText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, layout: UILayoutManager) {
    new TopLeftHUD(scene, layout);
    new TopRightHUD(scene, layout);
    this.bottomLeft = new BottomLeftHUD(scene, layout);
    new BottomRightHUD(scene, layout);

    // Subtle in-game footer watermark
    this.watermarkText = scene.add
      .text(scene.scale.width / 2, scene.scale.height - 8, 'Created by Abhishek Yaduwanshi 2026', {
        fontFamily: Typography.fontMono,
        fontSize: '11px',
        color: '#64748b',
        fontStyle: Typography.weight.normal,
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(UIConstants.depth.hud as number)
      .setAlpha(0.5);

    scene.events.on('layout-updated', (newLayout: UILayout) => {
      this.watermarkText.setPosition(newLayout.width / 2, newLayout.height - 8);
    });
  }

  public setWeaponName(name: string): void {
    this.bottomLeft.setWeaponName(name);
  }
}
