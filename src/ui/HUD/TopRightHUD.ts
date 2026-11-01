import Phaser from 'phaser';
import { GAME_EVENTS } from '@/core/Constants';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';
import { Spacing } from '@/theme/Spacing';
import { UIText } from '@/theme/UIText';
import { UILayoutManager, UILayout } from '@/ui/UILayoutManager';

/**
 * TopRightHUD — Score & Stat Card.
 *
 * Displays Score (prominent, with animated pulse), Kills, and Accuracy.
 * Everything is cleanly right-aligned inside an arcade-style card.
 */
export class TopRightHUD extends Phaser.GameObjects.Container {
  private cardBg: Phaser.GameObjects.Graphics;
  
  private scoreLabel: Phaser.GameObjects.Text;
  private scoreValue: Phaser.GameObjects.Text;
  private killsText: Phaser.GameObjects.Text;
  private accuracyText: Phaser.GameObjects.Text;

  private shotsFired = 0;
  private shotsHit = 0;

  private cardWidth = 220;
  private cardHeight = 100;

  constructor(scene: Phaser.Scene, layoutMgr: UILayoutManager) {
    const l = layoutMgr.get();
    // Card origin is at its top-left corner, so subtract cardWidth to right-align
    super(scene, l.anchors.topRight.x - l.scoreCardWidth, l.anchors.topRight.y);

    this.cardWidth = l.scoreCardWidth;

    // 1. Card Background
    this.cardBg = scene.add.graphics();
    this.add(this.cardBg);

    // 2. Score Section
    this.scoreLabel = scene.add.text(this.cardWidth - Spacing.internalPadding, Spacing.internalPadding, UIText.score, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.xs,
      color: Colors.textSecondary,
      fontStyle: Typography.weight.bold,
    }).setOrigin(1, 0);

    this.scoreValue = scene.add.text(this.cardWidth - Spacing.internalPadding, Spacing.internalPadding + 14, '0000000', {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size['2xl'],
      color: Colors.primary,
      fontStyle: Typography.weight.bold,
    }).setOrigin(1, 0);

    this.add([this.scoreLabel, this.scoreValue]);

    // 3. Kills & Accuracy Rows
    const statsY = Spacing.internalPadding + 48;

    this.killsText = scene.add.text(this.cardWidth - Spacing.internalPadding, statsY, `${UIText.kills}: 0`, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.sm,
      color: Colors.textPrimary,
      fontStyle: Typography.weight.bold,
    }).setOrigin(1, 0);

    this.accuracyText = scene.add.text(this.cardWidth - Spacing.internalPadding, statsY + 18, `${UIText.finalAccuracy(0)}`, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.sm,
      color: Colors.textSecondary,
      fontStyle: Typography.weight.bold,
    }).setOrigin(1, 0);

    this.add([this.killsText, this.accuracyText]);

    this.setScrollFactor(0).setDepth(UIConstants.depth.hud as number);
    (scene.add as unknown as { existing: (go: unknown) => void }).existing(this);

    this.updateLayout(l);

    // Bind event bus listeners
    scene.events.on(GAME_EVENTS.SCORE_CHANGED, this.onScoreChanged, this);
    scene.events.on(GAME_EVENTS.KILLS_CHANGED, this.onKillsChanged, this);
    scene.events.on(GAME_EVENTS.BULLET_HIT, this.onBulletHit, this);
    scene.events.on(GAME_EVENTS.SHOTS_FIRED, this.onShotsFired, this);
    scene.events.on(GAME_EVENTS.GAME_RESTARTED, this.onRestart, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

    // Responsive repositioning
    scene.events.on('layout-updated', (newLayout: UILayout) => {
      this.updateLayout(newLayout);
    });
  }

  private updateLayout(l: UILayout): void {
    this.cardWidth = l.scoreCardWidth;
    this.setPosition(l.anchors.topRight.x - this.cardWidth, l.anchors.topRight.y);
    
    if (l.isPortrait) {
      this.cardHeight = 65; // More compact
      this.scoreLabel.setVisible(false); // Hide label to save space
      this.scoreValue.setFontSize(parseInt(Typography.size['3xl'], 10) || 32);
      this.scoreValue.setPosition(this.cardWidth - Spacing.sm, Spacing.sm);
      
      this.killsText.setFontSize(parseInt(Typography.size.xs, 10) || 12);
      this.killsText.setPosition(this.cardWidth - Spacing.sm, Spacing.sm + 36);
      
      this.accuracyText.setVisible(false); // Hide accuracy to save space
    } else {
      this.cardHeight = 100;
      this.scoreLabel.setVisible(true);
      this.scoreLabel.setPosition(this.cardWidth - Spacing.internalPadding, Spacing.internalPadding);
      this.scoreValue.setFontSize(parseInt(Typography.size['2xl'], 10) || 24);
      this.scoreValue.setPosition(this.cardWidth - Spacing.internalPadding, Spacing.internalPadding + 14);
      
      this.killsText.setFontSize(parseInt(Typography.size.sm, 10) || 14);
      this.killsText.setPosition(this.cardWidth - Spacing.internalPadding, Spacing.internalPadding + 48);
      
      this.accuracyText.setVisible(true);
      this.accuracyText.setPosition(this.cardWidth - Spacing.internalPadding, Spacing.internalPadding + 66);
    }
    
    this.drawCard();
  }

  private drawCard(): void {
    this.cardBg.clear();
    // Inner fill (rgba slate-900)
    const cardBgHex = parseInt(Colors.bgPanel.replace('#', ''), 16);
    this.cardBg.fillStyle(cardBgHex, 0.75);
    this.cardBg.fillRoundedRect(0, 0, this.cardWidth, this.cardHeight, Spacing.borderRadius);
    
    // Outer border outline
    const cardBorderHex = parseInt(Colors.bgCardBorder.replace('#', ''), 16);
    this.cardBg.lineStyle(1.5, cardBorderHex, 0.5);
    this.cardBg.strokeRoundedRect(0, 0, this.cardWidth, this.cardHeight, Spacing.borderRadius);
  }

  private onScoreChanged(value: number): void {
    this.scoreValue.setText(String(value).padStart(7, '0'));

    // Bounce tween on score value
    this.scene.tweens.killTweensOf(this.scoreValue);
    this.scoreValue.setScale(1.0);
    this.scene.tweens.add({
      targets: this.scoreValue,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  private onKillsChanged(value: number): void {
    this.killsText.setText(`${UIText.kills}: ${value}`);
  }

  private onBulletHit(): void {
    this.shotsHit++;
    this.updateAccuracy();
  }

  private onShotsFired(totalShots: number): void {
    this.shotsFired = totalShots;
    this.updateAccuracy();
  }

  private updateAccuracy(): void {
    const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
    this.accuracyText.setText(`${UIText.finalAccuracy(accuracy)}`);
  }

  private onRestart(): void {
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.scoreValue.setText('0000000');
    this.killsText.setText(`${UIText.kills}: 0`);
    this.accuracyText.setText(`${UIText.finalAccuracy(0)}`);
  }

  private onShutdown(): void {
    this.scene.events.off(GAME_EVENTS.SCORE_CHANGED, this.onScoreChanged, this);
    this.scene.events.off(GAME_EVENTS.KILLS_CHANGED, this.onKillsChanged, this);
    this.scene.events.off(GAME_EVENTS.BULLET_HIT, this.onBulletHit, this);
    this.scene.events.off(GAME_EVENTS.SHOTS_FIRED, this.onShotsFired, this);
    this.scene.events.off(GAME_EVENTS.GAME_RESTARTED, this.onRestart, this);
  }
}
