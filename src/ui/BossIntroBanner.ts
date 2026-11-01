import Phaser from 'phaser';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';

export class BossIntroBanner extends Phaser.GameObjects.Container {
  private darkBg: Phaser.GameObjects.Graphics;
  private warningText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private alertText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, bossName: string, onComplete?: () => void) {
    const w = scene.scale.width;
    const h = scene.scale.height;
    super(scene, w / 2, h / 2);

    // 1. Fullscreen dark vignette layer
    this.darkBg = scene.add.graphics();
    this.darkBg.fillStyle(0x000000, 0.65);
    this.darkBg.fillRect(0, 0, w, h);
    this.darkBg.setScrollFactor(0).setDepth(UIConstants.depth.overlay - 2);

    // Fade dark background in
    this.darkBg.setAlpha(0);
    scene.tweens.add({
      targets: this.darkBg,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 2200,
      onComplete: () => {
        this.darkBg.destroy();
      }
    });

    // 2. Alert warning headers (flashing red alert style)
    this.warningText = scene.add.text(0, -60, '⚠️ WARNING ⚠️', {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.xl,
      color: '#ef4444', // Red-500
      fontStyle: Typography.weight.bold,
    }).setOrigin(0.5);
    this.add(this.warningText);

    // 3. Boss Name
    this.nameText = scene.add.text(0, 0, bossName.toUpperCase(), {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size['3xl'],
      color: Colors.textPrimary,
      fontStyle: Typography.weight.bold,
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);
    this.add(this.nameText);

    // 4. Detected footer
    this.alertText = scene.add.text(0, 50, 'HOSTILE BATTESTATION DETECTED', {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.xs,
      color: Colors.textSecondary,
      fontStyle: Typography.weight.bold,
    }).setOrigin(0.5);
    this.add(this.alertText);

    // Set layout parameters
    this.setScrollFactor(0);
    this.setDepth(UIConstants.depth.overlay - 1);
    this.setAlpha(0);
    this.setScale(1.3);

    scene.add.existing(this);

    // 5. Flashing text colors
    scene.tweens.add({
      targets: this.warningText,
      alpha: 0.2,
      duration: 250,
      yoyo: true,
      repeat: 8
    });

    // 6. slide + fade in, stay, slide out
    scene.tweens.add({
      targets: this,
      alpha: 1,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Trigger camera shake warning
        scene.cameras.main.shake(12, 1000);
        
        scene.time.delayedCall(2000, () => {
          scene.tweens.add({
            targets: this,
            alpha: 0,
            y: h / 2 - 80,
            duration: 350,
            ease: 'Quad.easeIn',
            onComplete: () => {
              if (onComplete) onComplete();
              this.destroy();
            }
          });
        });
      }
    });
  }
}
