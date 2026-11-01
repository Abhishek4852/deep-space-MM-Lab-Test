import Phaser from 'phaser';
import { GAME_EVENTS } from '@/core/Constants';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';
import { Spacing } from '@/theme/Spacing';
import { UIText } from '@/theme/UIText';
import { PowerUpType, POWER_UP_CONFIGS } from '@/config/PowerUpConfig';
import { UILayoutManager } from '@/ui/UILayoutManager';

interface ToastNotification {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
}

/**
 * NotificationManager — animated slide-in/fade-out toast system.
 *
 * Portrait: Notifications appear top-center, stacking downward.
 * Desktop: Notifications appear bottom-right, stacking upward.
 */
export class NotificationManager {
  private scene: Phaser.Scene;
  private layoutMgr: UILayoutManager;
  private queue: ToastNotification[] = [];

  constructor(scene: Phaser.Scene, layoutMgr: UILayoutManager) {
    this.scene = scene;
    this.layoutMgr = layoutMgr;

    // Bind to gameplay events
    scene.events.on(GAME_EVENTS.POWERUP_COLLECTED, this.onPowerupCollected, this);
    scene.events.on(GAME_EVENTS.PLAYER_HEALED, this.onPlayerHealed, this);
    scene.events.on(GAME_EVENTS.SCORE_CHANGED, this.onScoreChanged, this);
    scene.events.on(GAME_EVENTS.SHIELD_HIT, this.onShieldHit, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private onPowerupCollected(type: PowerUpType): void {
    const config = POWER_UP_CONFIGS[type];
    this.show(`${UIText.pickupPrefix} ${config.name}`, config.color);
  }

  private onPlayerHealed(amount: number): void {
    this.show(`${UIText.pickupPrefix} ${UIText.healthRestored} (+${amount})`, Colors.success);
  }

  private onShieldHit(remainingCharges: number): void {
    this.show(`🛡 Shield Absorbed! (${remainingCharges} left)`, Colors.buffShield);
  }

  private _lastScore = 0;
  private onScoreChanged(newScore: number): void {
    const delta = newScore - this._lastScore;
    this._lastScore = newScore;
    if (delta > 0) {
      this.show(`${UIText.scorePrefix}${delta} ${UIText.enemyEliminated}`, Colors.warning);
    }
  }

  // ---------------------------------------------------------------------------
  // Core display logic
  // ---------------------------------------------------------------------------

  public show(message: string, color: string = Colors.textPrimary): void {
    if (this.queue.length >= UIConstants.notification.maxVisible) {
      const oldest = this.queue.shift();
      if (oldest) this.destroyNotification(oldest);
    }

    const l = this.layoutMgr.get();
    const W = Math.min(Spacing.notificationWidth, l.width - l.margin * 2);
    const H = 38;
    const gap = Spacing.notificationGap;

    const timerTopY = l.isPortrait
      ? (l.fireButtonPosition.y - (l.fireButtonSize / 2) - l.gap - 30 - 35)
      : (l.anchors.bottomRight.y - 30);

    const targetX = l.anchors.bottomRight.x - W;
    const startX = targetX + W + 20;
    const baseY = timerTopY - gap - H - this.queue.length * (H + gap);

    const container = this.scene.add.container(startX, baseY);
    container.setScrollFactor(0).setDepth(UIConstants.depth.notification).setAlpha(0);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Colors.hex.bgCard, 0.9);
    bg.fillRoundedRect(0, 0, W, H, UIConstants.radius.md);
    bg.lineStyle(1, Colors.hex.bgCardBorder, 0.6);
    bg.strokeRoundedRect(0, 0, W, H, UIConstants.radius.md);
    container.add(bg);

    // Accent left bar
    const accent = this.scene.add.graphics();
    const accentHex = parseInt(color.replace('#', ''), 16);
    accent.fillStyle(accentHex, 1);
    accent.fillRoundedRect(0, 0, 4, H, UIConstants.radius.sm);
    container.add(accent);

    const text = this.scene.add
      .text(14, H / 2, message, {
        fontFamily: Typography.fontMono,
        fontSize: Typography.size.sm,
        color,
        fontStyle: Typography.weight.bold,
      })
      .setOrigin(0, 0.5);
    container.add(text);

    const notification: ToastNotification = { container, bg, text };
    this.queue.push(notification);

    // Slide in from right and fade in
    this.scene.tweens.add({
      targets: container,
      x: targetX,
      alpha: 1,
      duration: UIConstants.duration.normal,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(UIConstants.notification.lifetime, () => {
          this.scene.tweens.add({
            targets: container,
            alpha: 0,
            y: baseY - 20,
            duration: UIConstants.duration.normal,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              this.queue = this.queue.filter((n) => n !== notification);
              this.destroyNotification(notification);
            },
          });
        });
      },
    });
  }

  private destroyNotification(n: ToastNotification): void {
    n.container.scene?.tweens?.killTweensOf(n.container);
    n.container.destroy(true);
  }

  private shutdown(): void {
    this.scene.events.off(GAME_EVENTS.POWERUP_COLLECTED, this.onPowerupCollected, this);
    this.scene.events.off(GAME_EVENTS.PLAYER_HEALED, this.onPlayerHealed, this);
    this.scene.events.off(GAME_EVENTS.SCORE_CHANGED, this.onScoreChanged, this);
    this.scene.events.off(GAME_EVENTS.SHIELD_HIT, this.onShieldHit, this);
    this.queue.forEach((n) => this.destroyNotification(n));
    this.queue = [];
  }
}
