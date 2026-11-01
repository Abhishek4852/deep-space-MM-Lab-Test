import Phaser from 'phaser';
import { GAME_EVENTS } from '@/core/Constants';
import { SceneKeys } from '@/core/SceneKeys';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';
import { UIText } from '@/theme/UIText';
import { UIAnimator } from '@/ui/UIAnimator';
import { Screen } from '@/ui/ScreenManager';
import { audioManager } from '@/audio/AudioManager';

interface GameOverButton {
  x: number;
  y: number;
  width: number;
  height: number;
  textObj: Phaser.GameObjects.Text;
  onClick: () => void;
}

/**
 * GameOverOverlay — displayed when the player dies.
 * Features high-contrast stat breakdown, Restart Mission, and Quit to Menu buttons
 * with bulletproof screen-space click handling across all resolutions.
 */
export class GameOverOverlay extends Phaser.GameObjects.Container implements Screen {
  private titleText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private killsText: Phaser.GameObjects.Text;
  private accuracyText: Phaser.GameObjects.Text;
  private timeText: Phaser.GameObjects.Text;
  private watermarkText: Phaser.GameObjects.Text;
  private animator: UIAnimator;

  private bg: Phaser.GameObjects.Graphics;
  private panel: Phaser.GameObjects.Graphics;
  private divider: Phaser.GameObjects.Graphics;

  private buttons: Phaser.GameObjects.Text[] = [];
  private buttonActions: GameOverButton[] = [];

  private enterKey: Phaser.Input.Keyboard.Key | null = null;
  private isShown = false;

  private latestStats = { score: 0, kills: 0, accuracy: 0, time: 0 };

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.animator = new UIAnimator(scene);

    // Backdrop
    this.bg = scene.add.graphics();
    this.add(this.bg);

    // Panel
    this.panel = scene.add.graphics();
    this.add(this.panel);

    // Title
    this.titleText = scene.add
      .text(0, 0, UIText.gameOver, {
        fontFamily: Typography.fontMono,
        fontSize: Typography.size['3xl'],
        color: Colors.danger,
        fontStyle: Typography.weight.bold,
        stroke: Colors.dangerDark,
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5);
    this.add(this.titleText);

    // Divider
    this.divider = scene.add.graphics();
    this.add(this.divider);

    // Stats texts
    const statsStyle = {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.lg,
      color: Colors.textPrimary,
      align: 'center' as const,
    };

    this.scoreText = scene.add.text(0, 0, UIText.finalScore(0), statsStyle).setOrigin(0.5);
    this.killsText = scene.add.text(0, 0, UIText.finalKills(0), statsStyle).setOrigin(0.5);
    this.accuracyText = scene.add.text(0, 0, UIText.finalAccuracy(0), statsStyle).setOrigin(0.5);
    this.timeText = scene.add.text(0, 0, UIText.timeSurvived('00', '00'), statsStyle).setOrigin(0.5);
    this.add([this.scoreText, this.killsText, this.accuracyText, this.timeText]);

    // Watermark
    this.watermarkText = scene.add
      .text(0, 0, 'Created by Abhishek Yaduwanshi 2026', {
        fontFamily: Typography.fontMono,
        fontSize: '11px',
        color: Colors.textMuted,
        align: 'center',
      })
      .setOrigin(0.5);
    this.add(this.watermarkText);

    this.setScrollFactor(0).setDepth(UIConstants.depth.overlay);
    this.setVisible(false).setAlpha(0);

    // Initial Layout build
    this.rebuildMenu();

    // Direct screen-space pointer listener to guarantee clicks work on mobile & desktop
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleScreenPointerDown, this);

    scene.events.on(GAME_EVENTS.GAME_OVER, this.show, this);
    scene.events.on('layout-updated', this.rebuildMenu, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    scene.add.existing(this);
  }

  private rebuildMenu(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const cx = w / 2;
    const cy = h / 2;
    const isPortrait = h > w;

    const panelW = isPortrait ? Math.min(w - 32, 380) : 480;
    const panelH = isPortrait ? Math.min(h - 40, 460) : 430;

    // Position container at exact screen center
    this.setPosition(cx, cy);

    // 1. Fullscreen Backdrop
    this.bg.clear();
    this.bg.fillStyle(Colors.hex.bgDeep, 0.9);
    this.bg.fillRect(-cx - 100, -cy - 100, w + 200, h + 200);

    // 2. Panel card
    this.panel.clear();
    const cardBgHex = parseInt(Colors.bgPanel.replace('#', ''), 16);
    this.panel.fillStyle(cardBgHex, 1);
    this.panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, UIConstants.radius.lg);
    const borderHex = parseInt(Colors.hex.danger ? '0xef4444' : Colors.danger.replace('#', ''), 16);
    this.panel.lineStyle(2, borderHex, 0.7);
    this.panel.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, UIConstants.radius.lg);

    // 3. Title position
    this.titleText.setPosition(0, -panelH / 2 + 42);

    // 4. Divider position
    this.divider.clear();
    const borderLineHex = parseInt(Colors.bgCardBorder.replace('#', ''), 16);
    this.divider.lineStyle(1, borderLineHex, 0.6);
    this.divider.lineBetween(-panelW / 2 + 30, -panelH / 2 + 76, panelW / 2 - 30, -panelH / 2 + 76);

    // 5. Stats positions
    const step = isPortrait ? 32 : 36;
    let statY = -panelH / 2 + 110;

    this.scoreText.setPosition(0, statY);
    statY += step;
    this.killsText.setPosition(0, statY);
    statY += step;
    this.accuracyText.setPosition(0, statY);
    statY += step;
    this.timeText.setPosition(0, statY);

    // Update stats texts with current cached values
    this.scoreText.setText(UIText.finalScore(this.latestStats.score));
    this.killsText.setText(UIText.finalKills(this.latestStats.kills));
    this.accuracyText.setText(UIText.finalAccuracy(this.latestStats.accuracy));
    const mm = String(Math.floor(this.latestStats.time / 60)).padStart(2, '0');
    const ss = String(this.latestStats.time % 60).padStart(2, '0');
    this.timeText.setText(UIText.timeSurvived(mm, ss));

    // 6. Interactive Action Buttons
    this.buttons.forEach((b) => b.destroy());
    this.buttons = [];
    this.buttonActions = [];

    const btnW = panelW - 60;
    const btnH = 46;
    const btnYStart = statY + 48;

    // Restart Button
    this.makeButton(0, btnYStart, btnW, btnH, '🔄  RESTART MISSION', Colors.primary, () => {
      this.triggerRestart();
    });

    // Quit to Home Button
    this.makeButton(0, btnYStart + 56, btnW, btnH, '🏠  QUIT TO MENU', Colors.textMuted, () => {
      this.triggerQuit();
    });

    this.watermarkText.setPosition(0, panelH / 2 - 16);
  }

  private makeButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: string,
    onClick: () => void
  ): void {
    const btn = this.scene.add
      .text(x, y, label, {
        fontFamily: Typography.fontMono,
        fontSize: Typography.size.md,
        color,
        fontStyle: Typography.weight.bold,
        backgroundColor: 'rgba(255,255,255,0.06)',
        padding: { x: 16, y: 10 },
        align: 'center',
        fixedWidth: width,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setScale(1.04);
      btn.setStyle({ backgroundColor: 'rgba(56,189,248,0.18)' });
    });
    btn.on('pointerout', () => {
      btn.setScale(1.0);
      btn.setStyle({ backgroundColor: 'rgba(255,255,255,0.06)' });
    });
    btn.on('pointerdown', () => {
      this.animator.bounce(btn);
      onClick();
    });

    this.add(btn);
    this.buttons.push(btn);

    this.buttonActions.push({
      x,
      y,
      width,
      height,
      textObj: btn,
      onClick,
    });
  }

  private handleScreenPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.visible || this.alpha < 0.2 || !this.isShown) return;

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const cx = w / 2;
    const cy = h / 2;

    for (const action of this.buttonActions) {
      const btnScreenX = cx + action.x;
      const btnScreenY = cy + action.y;
      const halfW = action.width / 2;
      const halfH = action.height / 2;

      if (
        pointer.x >= btnScreenX - halfW &&
        pointer.x <= btnScreenX + halfW &&
        pointer.y >= btnScreenY - halfH &&
        pointer.y <= btnScreenY + halfH
      ) {
        this.animator.bounce(action.textObj);
        action.onClick();
        return;
      }
    }
  }

  public show(
    stats?: { score: number; kills: number; accuracy: number; time: number }
  ): void {
    if (this.isShown) return;
    this.isShown = true;

    if (stats) {
      this.latestStats = stats;
    }

    this.rebuildMenu();

    this.setVisible(true);
    this.setAlpha(0);
    this.setScale(0.85);

    this.animator.fadeIn(this, UIConstants.duration.normal as number);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: UIConstants.duration.normal as number,
      ease: 'Back.easeOut',
      onComplete: () => this.bindKeyboardInput(),
    });
  }

  public hide(): void {
    if (!this.isShown) return;
    this.isShown = false;
    this.unbindKeyboardInput();
    this.animator.fadeOut(this, UIConstants.duration.fast as number, () => {
      this.setVisible(false);
      this.setScale(1.0);
    });
  }

  private bindKeyboardInput(): void {
    if (this.scene.input.keyboard) {
      this.enterKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.enterKey.once('down', this.triggerRestart, this);
    }
  }

  private unbindKeyboardInput(): void {
    if (this.enterKey) {
      this.enterKey.off('down', this.triggerRestart, this);
      this.enterKey = null;
    }
  }

  private triggerRestart(): void {
    audioManager.playWeaponSwitch();
    this.scene.events.emit(GAME_EVENTS.REQUEST_RESTART);
  }

  private triggerQuit(): void {
    audioManager.playWeaponSwitch();
    this.hide();
    (this.scene as unknown as { transitionTo: (scene: string, dur: number) => void }).transitionTo(SceneKeys.MENU, 400);
  }

  private cleanup(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleScreenPointerDown, this);
    this.unbindKeyboardInput();
    this.scene.events.off(GAME_EVENTS.GAME_OVER, this.show, this);
    this.scene.events.off('layout-updated', this.rebuildMenu, this);
    this.destroy(true);
  }
}
