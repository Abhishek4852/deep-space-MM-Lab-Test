import Phaser from 'phaser';
import { PlanetDefinition } from '@/world/PlanetDefinitions';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';
import { Spacing } from '@/theme/Spacing';

export class PlanetDiscoveryBanner extends Phaser.GameObjects.Container {
  private borderTop: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private taglineText: Phaser.GameObjects.Text;
  private borderBottom: Phaser.GameObjects.Text;
  private bgPanel: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, def: PlanetDefinition) {
    const w = scene.scale.width;
    // Spawn at top-center, initially offset upwards for slide-in animation
    const targetY = 120;
    super(scene, w / 2, targetY - 40);

    // 1. Draw subtle background panel
    this.bgPanel = scene.add.graphics();
    const panelW = 420;
    const panelH = 110;
    const panelHex = parseInt(Colors.bgPanel.replace('#', ''), 16);
    this.bgPanel.fillStyle(panelHex, 0.85);
    this.bgPanel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, Spacing.borderRadius);
    this.bgPanel.lineStyle(1.5, parseInt(Colors.bgCardBorder.replace('#', ''), 16), 0.5);
    this.bgPanel.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, Spacing.borderRadius);
    this.add(this.bgPanel);

    // Style for horizontal decorative borders
    const borderStyle = {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.sm,
      color: Colors.primary,
      fontStyle: Typography.weight.bold
    };

    // 2. Top Border Line
    this.borderTop = scene.add.text(0, -38, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━', borderStyle).setOrigin(0.5);
    this.add(this.borderTop);

    // 3. Planet Name text
    this.nameText = scene.add.text(0, -10, def.name, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size['2xl'],
      color: Colors.textPrimary,
      fontStyle: Typography.weight.bold,
      stroke: Colors.primaryDark,
      strokeThickness: 2
    }).setOrigin(0.5);
    this.add(this.nameText);

    // 4. Tagline text
    this.taglineText = scene.add.text(0, 18, `"${def.tagline.toUpperCase()}"`, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.xs,
      color: Colors.textSecondary,
      fontStyle: Typography.weight.bold
    }).setOrigin(0.5);
    this.add(this.taglineText);

    // 5. Bottom Border Line
    this.borderBottom = scene.add.text(0, 36, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━', borderStyle).setOrigin(0.5);
    this.add(this.borderBottom);

    // 6. Layer properties
    this.setScrollFactor(0);
    this.setDepth(UIConstants.depth.waveBanner + 5); // Just above wave banner
    this.setAlpha(0);

    scene.add.existing(this);

    // 7. Play Entry Slide + Fade Animation
    scene.tweens.add({
      targets: this,
      y: targetY,
      alpha: 1,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Display for 2 seconds, then slide away
        scene.time.delayedCall(2000, () => {
          scene.tweens.add({
            targets: this,
            y: targetY - 40,
            alpha: 0,
            duration: 400,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              this.destroy();
            }
          });
        });
      }
    });
  }
}
