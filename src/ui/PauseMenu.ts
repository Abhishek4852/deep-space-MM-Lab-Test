import Phaser from 'phaser';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';
import { UIText } from '@/theme/UIText';
import { UIAnimator } from '@/ui/UIAnimator';
import { Screen } from '@/ui/ScreenManager';
import { audioManager } from '@/audio/AudioManager';

interface ButtonAction {
  x: number;
  y: number;
  width: number;
  height: number;
  textObj: Phaser.GameObjects.Text;
  onClick: () => void;
}

/**
 * PauseMenu — shown when the player presses ESC or the pause button.
 * Uses screen-space hit testing to guarantee 100% reliable clicks on both mobile and desktop.
 */
export class PauseMenu extends Phaser.GameObjects.Container implements Screen {
  private animator: UIAnimator;

  private onResumeCallback?: () => void;
  private onSettingsCallback?: () => void;
  private onQuitCallback?: () => void;

  private bg: Phaser.GameObjects.Graphics;
  private panel: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private watermarkText: Phaser.GameObjects.Text;
  private buttons: Phaser.GameObjects.Text[] = [];
  private buttonActions: ButtonAction[] = [];

  constructor(
    scene: Phaser.Scene,
    onResume?: () => void,
    onSettings?: () => void,
    onQuit?: () => void
  ) {
    super(scene, 0, 0);
    this.animator = new UIAnimator(scene);
    this.onResumeCallback = onResume;
    this.onSettingsCallback = onSettings;
    this.onQuitCallback = onQuit;

    // Background Graphic
    this.bg = scene.add.graphics();
    this.add(this.bg);

    // Panel Graphic
    this.panel = scene.add.graphics();
    this.add(this.panel);

    // Title Text
    this.title = scene.add.text(0, 0, UIText.paused, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.xl,
      color: Colors.primary,
      fontStyle: Typography.weight.bold,
      stroke: Colors.primaryDark,
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5);
    this.add(this.title);

    // Watermark
    this.watermarkText = scene.add.text(0, 0, 'Created by Abhishek Yaduwanshi 2026', {
      fontFamily: Typography.fontMono,
      fontSize: '11px',
      color: Colors.textMuted,
      align: 'center',
    }).setOrigin(0.5);
    this.add(this.watermarkText);

    this.setScrollFactor(0).setDepth(UIConstants.depth.overlay);
    this.setVisible(false).setAlpha(0);
    scene.add.existing(this);

    // Initial Layout build
    this.rebuildMenu();

    // Direct screen-space pointer listener for 100% reliable click/touch response
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleScreenPointerDown, this);

    scene.events.on('layout-updated', this.rebuildMenu, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  private rebuildMenu(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const cx = w / 2;
    const cy = h / 2;
    const isPortrait = h > w;

    const panelW = isPortrait ? Math.min(w - 32, 340) : 380;
    const panelH = 320;

    // Position container at exact screen center
    this.setPosition(cx, cy);

    // 1. Dark Backdrop
    this.bg.clear();
    this.bg.fillStyle(Colors.hex.bgDeep, 0.88);
    this.bg.fillRect(-cx - 100, -cy - 100, w + 200, h + 200);

    // 2. Main Dialog Panel
    this.panel.clear();
    const cardBgHex = parseInt(Colors.bgPanel.replace('#', ''), 16);
    this.panel.fillStyle(cardBgHex, 1);
    this.panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, UIConstants.radius.lg);
    const borderHex = parseInt(Colors.hex.primary ? '0x38bdf8' : Colors.primary.replace('#', ''), 16);
    this.panel.lineStyle(2, borderHex, 0.8);
    this.panel.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, UIConstants.radius.lg);

    // 3. Title position
    this.title.setPosition(0, -115);

    // 4. Clean up old buttons
    this.buttons.forEach((btn) => btn.destroy());
    this.buttons = [];
    this.buttonActions = [];

    // Create 3 primary buttons with generous hit areas
    const btnW = panelW - 60;
    const btnH = 44;

    this.makeButton(0, -45, btnW, btnH, '▶  RESUME', Colors.primary, () => {
      audioManager.playWeaponSwitch();
      this.onResumeCallback?.();
    });

    this.makeButton(0, 15, btnW, btnH, '⚙  SETTINGS', Colors.textPrimary, () => {
      audioManager.playWeaponSwitch();
      this.onSettingsCallback?.();
    });

    this.makeButton(0, 75, btnW, btnH, '✕  QUIT TO MENU', Colors.danger, () => {
      audioManager.playWeaponSwitch();
      this.onQuitCallback?.();
    });

    this.watermarkText.setPosition(0, panelH / 2 - 18);
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
        fontSize: Typography.size.lg,
        color,
        fontStyle: Typography.weight.bold,
        backgroundColor: 'rgba(255,255,255,0.06)',
        padding: { x: 20, y: 10 },
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

  /**
   * Direct screen-space pointer listener that converts screen coordinates (pointer.x, pointer.y)
   * to guarantee clicks work across any camera zoom, resolution, or touch browser.
   */
  private handleScreenPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.visible || this.alpha < 0.2) return;

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

  public show(): void {
    this.setVisible(true);
    this.rebuildMenu();
    this.animator.fadeIn(this);
  }

  public hide(): void {
    this.animator.fadeOut(this, UIConstants.duration.fast as number, () => this.setVisible(false));
  }

  private cleanup(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleScreenPointerDown, this);
    this.scene.events.off('layout-updated', this.rebuildMenu, this);
    this.destroy(true);
  }
}
