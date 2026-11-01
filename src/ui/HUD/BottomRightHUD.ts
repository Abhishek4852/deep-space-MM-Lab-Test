import Phaser from 'phaser';
import { GAME_EVENTS } from '@/core/Constants';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';
import { Spacing } from '@/theme/Spacing';
import { UILayoutManager, UILayout } from '@/ui/UILayoutManager';

/**
 * BottomRightHUD — clean, isolated survival timer.
 *
 * Positioned exactly in the bottom-right corner.
 * Displays only the time.
 */
export class BottomRightHUD extends Phaser.GameObjects.Container {
  private timerValue: Phaser.GameObjects.Text;
  private bgPanel: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, layoutMgr: UILayoutManager) {
    const l = layoutMgr.get();
    super(scene, l.anchors.bottomRight.x, l.anchors.bottomRight.y);

    this.bgPanel = scene.add.graphics();
    this.add(this.bgPanel);

    // Render only the timer value (no labels) right-and-bottom aligned
    this.timerValue = scene.add
      .text(0, 0, '00:00', {
        fontFamily: Typography.fontMono,
        fontSize: Typography.size.lg, // medium / values size
        color: Colors.textPrimary,
        fontStyle: Typography.weight.bold,
      })
      .setOrigin(1, 1);
    this.add(this.timerValue);

    this.setScrollFactor(0).setDepth(UIConstants.depth.hud as number);
    (scene.add as unknown as { existing: (go: unknown) => void }).existing(this);

    this.updateLayout(l);

    scene.events.on(GAME_EVENTS.TIMER_TICK, this.onTimerTick, this);
    scene.events.on(GAME_EVENTS.GAME_RESTARTED, this.onRestart, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

    // Responsive repositioning
    scene.events.on('layout-updated', (newLayout: UILayout) => {
      this.updateLayout(newLayout);
    });
  }

  private updateLayout(l: UILayout): void {
    if (l.isPortrait) {
      const posY = l.fireButtonPosition.y - (l.fireButtonSize / 2) - l.gap - 30;
      this.setPosition(l.anchors.bottomRight.x, posY);
      this.timerValue.setFontSize(parseInt(Typography.size.xl, 10) || 20);
      
      this.bgPanel.clear();
      const bgHex = parseInt(Colors.bgPanel.replace('#', ''), 16);
      this.bgPanel.fillStyle(bgHex, 0.5);
      // Box width ~80, height ~35. Let's draw it based on the text size.
      // Since origin is (1,1), the box should go from -80 to 0 in X, and -40 to 0 in Y.
      this.bgPanel.fillRoundedRect(-90, -40, 90, 40, Spacing.borderRadius);
    } else {
      this.setPosition(l.anchors.bottomRight.x, l.anchors.bottomRight.y);
      this.timerValue.setFontSize(parseInt(Typography.size.lg, 10) || 18);
      this.bgPanel.clear(); // No panel on desktop
    }
  }

  private onTimerTick(seconds: number): void {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    this.timerValue.setText(
      `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    );
  }

  private onRestart(): void {
    this.timerValue.setText('00:00');
  }

  private onShutdown(): void {
    this.scene.events.off(GAME_EVENTS.TIMER_TICK, this.onTimerTick, this);
    this.scene.events.off(GAME_EVENTS.GAME_RESTARTED, this.onRestart, this);
  }
}
