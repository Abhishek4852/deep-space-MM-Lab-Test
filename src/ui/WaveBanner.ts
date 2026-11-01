import Phaser from 'phaser';
import { GAME_EVENTS } from '@/core/Constants';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';

/**
 * WaveBanner — animated announcement banner shown at start / complete of waves.
 *
 * Appears at top-center, slides + fades in, displays for 2 seconds, then fades out.
 * Reads scene.scale.width/height at runtime — never hardcoded positions.
 */
export class WaveBanner extends Phaser.GameObjects.Container {
  private topLine: Phaser.GameObjects.Text;
  private bannerText: Phaser.GameObjects.Text;
  private bottomLine: Phaser.GameObjects.Text;

  private activeTween: Phaser.Tweens.Tween | null = null;
  private activeDelay: Phaser.Time.TimerEvent | null = null;

  private readonly slideDistance = 30;

  constructor(scene: Phaser.Scene) {
    super(scene, scene.scale.width / 2, scene.scale.height * 0.18);

    // Determine if this is a small screen (portrait mobile)
    const isSmall = scene.scale.height > scene.scale.width;

    const borderStyle = {
      fontFamily: Typography.fontMono,
      fontSize: isSmall ? Typography.size.md : Typography.size.lg,
      color: Colors.primary,
      fontStyle: Typography.weight.bold,
    };

    // 1. Top border line
    this.topLine = scene.add.text(0, -35, '══════════════════', borderStyle).setOrigin(0.5);
    this.add(this.topLine);

    // 2. Banner text
    this.bannerText = scene.add.text(0, 0, 'WAVE 1', {
      fontFamily: Typography.fontMono,
      fontSize: isSmall ? Typography.size['2xl'] : Typography.size['3xl'],
      color: Colors.textPrimary,
      fontStyle: Typography.weight.bold,
    }).setOrigin(0.5);
    this.add(this.bannerText);

    // 3. Bottom border line
    this.bottomLine = scene.add.text(0, 35, '══════════════════', borderStyle).setOrigin(0.5);
    this.add(this.bottomLine);

    this.setScrollFactor(0).setDepth(UIConstants.depth.waveBanner as number);
    this.setVisible(false).setAlpha(0);

    // Event bus connections
    scene.events.on(GAME_EVENTS.WAVE_STARTED, this.announceWaveStarted, this);
    scene.events.on(GAME_EVENTS.WAVE_COMPLETED, this.announceWaveCompleted, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);

    // Reposition on resize
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);

    scene.add.existing(this);
  }

  private onResize(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const isSmall = h > w;

    // Update position — top center, below health bar area
    this.setPosition(w / 2, h * 0.18);

    // Scale down text on mobile
    this.bannerText.setFontSize(isSmall ? Typography.size['2xl'] : Typography.size['3xl']);
    this.topLine.setFontSize(isSmall ? Typography.size.md : Typography.size.lg);
    this.bottomLine.setFontSize(isSmall ? Typography.size.md : Typography.size.lg);
  }

  private announceWaveStarted(waveNumber: number): void {
    this.bannerText.setText(`WAVE ${waveNumber}`);
    this.bannerText.setColor(Colors.textPrimary);
    this.topLine.setColor(Colors.primary);
    this.bottomLine.setColor(Colors.primary);
    this.playSlideAnimation();
  }

  private announceWaveCompleted(): void {
    this.bannerText.setText('WAVE COMPLETE');
    this.bannerText.setColor(Colors.warning);
    this.topLine.setColor(Colors.warning);
    this.bottomLine.setColor(Colors.warning);
    this.playSlideAnimation();
  }

  /**
   * Slides in from above, pauses on screen, then fades out.
   * Total animation lifecycle: ~2.0 seconds.
   */
  private playSlideAnimation(): void {
    this.stopAnimations();

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const targetY = h * 0.18;

    this.setVisible(true);
    this.setAlpha(0);
    this.setPosition(w / 2, targetY - this.slideDistance);

    // 1. Slide + Fade In (300ms)
    this.activeTween = this.scene.tweens.add({
      targets: this,
      y: targetY,
      alpha: 1,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // 2. Display on screen (1400ms)
        this.activeDelay = this.scene.time.delayedCall(1400, () => {
          // 3. Fade Out (300ms)
          this.activeTween = this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 300,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              this.setVisible(false);
              this.activeTween = null;
            }
          });
        });
      }
    });
  }

  private stopAnimations(): void {
    if (this.activeTween) {
      this.activeTween.stop();
      this.activeTween = null;
    }
    if (this.activeDelay) {
      this.activeDelay.destroy();
      this.activeDelay = null;
    }
  }

  private cleanup(): void {
    this.scene.events.off(GAME_EVENTS.WAVE_STARTED, this.announceWaveStarted, this);
    this.scene.events.off(GAME_EVENTS.WAVE_COMPLETED, this.announceWaveCompleted, this);
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.stopAnimations();
  }
}
