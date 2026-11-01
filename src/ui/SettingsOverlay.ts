import Phaser from 'phaser';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';
import { UIText } from '@/theme/UIText';
import { UIAnimator } from '@/ui/UIAnimator';
import { Screen } from '@/ui/ScreenManager';
import { UILayoutManager } from '@/ui/UILayoutManager';
import { audioManager } from '@/audio/AudioManager';

interface SettingsClickAction {
  x: number;
  y: number;
  width: number;
  height: number;
  onClick: () => void;
}

/**
 * SettingsOverlay — accessible from PauseMenu.
 * Fully responsive portrait/landscape settings menu with screen-space click handling.
 */
export class SettingsOverlay extends Phaser.GameObjects.Container implements Screen {
  private animator: UIAnimator;
  private layoutMgr: UILayoutManager;
  private onCloseCallback?: () => void;

  private bg: Phaser.GameObjects.Graphics;
  private panel: Phaser.GameObjects.Graphics;
  private divider: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private closeBtn?: Phaser.GameObjects.Text;

  private menuItems: Phaser.GameObjects.GameObject[] = [];
  private clickActions: SettingsClickAction[] = [];

  constructor(scene: Phaser.Scene, layoutMgr: UILayoutManager, onClose?: () => void) {
    super(scene, 0, 0);
    this.animator = new UIAnimator(scene);
    this.layoutMgr = layoutMgr;
    this.onCloseCallback = onClose;

    // Initial graphic objects
    this.bg = scene.add.graphics();
    this.add(this.bg);

    this.panel = scene.add.graphics();
    this.add(this.panel);

    this.divider = scene.add.graphics();
    this.add(this.divider);

    this.title = scene.add.text(0, 0, UIText.settingsTitle, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.xl,
      color: Colors.primary,
      fontStyle: Typography.weight.bold,
    }).setOrigin(0.5);
    this.add(this.title);

    this.setScrollFactor(0).setDepth(UIConstants.depth.overlay);
    this.setVisible(false).setAlpha(0);
    scene.add.existing(this);

    // Initial layout build
    this.rebuildMenu();

    // Screen-space pointer listener for 100% reliable clicks across touch and desktop
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

    const panelW = isPortrait ? Math.min(w - 32, 400) : 480;
    const panelH = isPortrait ? Math.min(h - 40, 480) : 410;

    // Position container at exact screen center
    this.setPosition(cx, cy);

    // 1. Dark backdrop
    this.bg.clear();
    this.bg.fillStyle(Colors.hex.bgDeep, 0.9);
    this.bg.fillRect(-cx - 100, -cy - 100, w + 200, h + 200);

    // 2. Main panel
    this.panel.clear();
    const cardBgHex = parseInt(Colors.bgPanel.replace('#', ''), 16);
    this.panel.fillStyle(cardBgHex, 1);
    this.panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, UIConstants.radius.lg);
    const borderHex = parseInt(Colors.hex.primaryDark ? '0x0284c7' : Colors.primaryDark.replace('#', ''), 16);
    this.panel.lineStyle(2, borderHex, 0.6);
    this.panel.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, UIConstants.radius.lg);

    // 3. Title position
    this.title.setPosition(0, -panelH / 2 + 30);

    // 4. Divider position
    this.divider.clear();
    const borderLineHex = parseInt(Colors.bgCardBorder.replace('#', ''), 16);
    this.divider.lineStyle(1, borderLineHex, 0.6);
    this.divider.lineBetween(-panelW / 2 + 20, -panelH / 2 + 58, panelW / 2 - 20, -panelH / 2 + 58);

    // 5. Clean up old interactive menu rows
    this.menuItems.forEach((item) => item.destroy());
    this.menuItems = [];
    this.clickActions = [];

    // 6. Draw settings options
    let rowY = -panelH / 2 + 90;
    const rowStep = isPortrait ? 40 : 44;
    const labelX = -panelW / 2 + 28;
    const valX = panelW / 2 - 28;

    const l = this.layoutMgr.get();
    const currentHudScale = localStorage.getItem('deep_space_hud_scale') || 'auto';
    const currentControlSize = localStorage.getItem('deep_space_control_size') || 'medium';
    const currentCameraZoom = localStorage.getItem('deep_space_camera_zoom') || '100%';
    const currentDebug = localStorage.getItem('deep_space_debug') || (l.isTouch ? 'off' : 'on');

    // Sound & Music Master Toggle
    const isMuted = audioManager.getIsMuted();
    this.addToggle(labelX, valX, rowY, 'Sound & Music', !isMuted, (_enabled) => {
      audioManager.toggleMute();
      audioManager.playWeaponSwitch();
    });
    rowY += rowStep;

    // SFX Volume Selectable
    this.addMultiToggle(labelX, valX, rowY, 'SFX Volume', ['30%', '60%', '100%'], '60%', (val) => {
      const vol = val === '30%' ? 0.3 : val === '60%' ? 0.6 : 1.0;
      audioManager.setSfxVolume(vol);
      audioManager.playBlasterFire();
    });
    rowY += rowStep;

    // HUD Scale Selectable Toggle
    this.addMultiToggle(labelX, valX, rowY, 'HUD Scale', ['small', 'medium', 'large', 'auto'], currentHudScale, (val) => {
      localStorage.setItem('deep_space_hud_scale', val);
      this.layoutMgr.recompute();
    });
    rowY += rowStep;

    // Control Size Selectable Toggle (touch screen only)
    if (l.isTouch) {
      this.addMultiToggle(labelX, valX, rowY, 'Control Size', ['small', 'medium', 'large'], currentControlSize, (val) => {
        localStorage.setItem('deep_space_control_size', val);
        this.layoutMgr.recompute();
      });
      rowY += rowStep;
    }

    // Camera Zoom Selectable Toggle
    this.addMultiToggle(labelX, valX, rowY, 'Camera Zoom', ['80%', '100%', '120%'], currentCameraZoom, (val) => {
      localStorage.setItem('deep_space_camera_zoom', val);
      this.layoutMgr.recompute();
    });
    rowY += rowStep;

    // Debug Toggle
    this.addToggle(labelX, valX, rowY, 'Debug UI', currentDebug === 'on', (enabled) => {
      localStorage.setItem('deep_space_debug', enabled ? 'on' : 'off');
      this.layoutMgr.recompute();
    });
    rowY += rowStep;

    // Fullscreen Toggle
    this.addToggle(labelX, valX, rowY, UIText.fullscreen, false, (enabled) => {
      if (enabled) {
        this.scene.scale.startFullscreen();
      } else {
        this.scene.scale.stopFullscreen();
      }
    });

    // Close Button
    if (this.closeBtn) this.closeBtn.destroy();
    const closeY = panelH / 2 - 32;
    this.closeBtn = this.scene.add
      .text(0, closeY, '✕  CLOSE', {
        fontFamily: Typography.fontMono,
        fontSize: Typography.size.md,
        color: Colors.primary,
        fontStyle: Typography.weight.bold,
        backgroundColor: 'rgba(56,189,248,0.12)',
        padding: { x: 28, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.closeBtn.on('pointerover', () => this.closeBtn?.setScale(1.05));
    this.closeBtn.on('pointerout', () => this.closeBtn?.setScale(1.0));
    this.closeBtn.on('pointerdown', () => {
      audioManager.playWeaponSwitch();
      this.onCloseCallback?.();
    });
    this.add(this.closeBtn);

    this.clickActions.push({
      x: 0,
      y: closeY,
      width: 140,
      height: 44,
      onClick: () => {
        audioManager.playWeaponSwitch();
        this.onCloseCallback?.();
      },
    });
  }

  private addToggle(
    lx: number,
    rx: number,
    y: number,
    label: string,
    initial: boolean,
    onChange: (enabled: boolean) => void
  ): void {
    const labelText = this.scene.add.text(lx, y, label, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.sm,
      color: Colors.textPrimary,
    }).setOrigin(0, 0.5);
    this.add(labelText);
    this.menuItems.push(labelText);

    let enabled = initial;
    const toggle = this.scene.add
      .text(rx, y, enabled ? '[ ON ]' : '[ OFF ]', {
        fontFamily: Typography.fontMono,
        fontSize: Typography.size.sm,
        color: enabled ? Colors.success : Colors.textMuted,
        fontStyle: Typography.weight.bold,
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    const toggleAction = () => {
      enabled = !enabled;
      toggle.setText(enabled ? '[ ON ]' : '[ OFF ]');
      toggle.setColor(enabled ? Colors.success : Colors.textMuted);
      onChange(enabled);
    };

    toggle.on('pointerdown', toggleAction);
    toggle.on('pointerover', () => toggle.setScale(1.05));
    toggle.on('pointerout', () => toggle.setScale(1.0));

    this.add(toggle);
    this.menuItems.push(toggle);

    this.clickActions.push({
      x: rx - 40,
      y,
      width: 100,
      height: 36,
      onClick: toggleAction,
    });
  }

  private addMultiToggle(
    lx: number,
    rx: number,
    y: number,
    label: string,
    options: string[],
    currentValue: string,
    onChange: (value: string) => void
  ): void {
    const labelText = this.scene.add.text(lx, y, label, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.sm,
      color: Colors.textPrimary,
    }).setOrigin(0, 0.5);
    this.add(labelText);
    this.menuItems.push(labelText);

    let index = options.indexOf(currentValue);
    if (index === -1) index = 0;

    const toggle = this.scene.add
      .text(rx, y, `[ ${options[index].toUpperCase()} ]`, {
        fontFamily: Typography.fontMono,
        fontSize: Typography.size.sm,
        color: Colors.primary,
        fontStyle: Typography.weight.bold,
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    const toggleAction = () => {
      index = (index + 1) % options.length;
      const nextVal = options[index];
      toggle.setText(`[ ${nextVal.toUpperCase()} ]`);
      onChange(nextVal);
    };

    toggle.on('pointerdown', toggleAction);
    toggle.on('pointerover', () => toggle.setScale(1.05));
    toggle.on('pointerout', () => toggle.setScale(1.0));

    this.add(toggle);
    this.menuItems.push(toggle);

    this.clickActions.push({
      x: rx - 50,
      y,
      width: 130,
      height: 36,
      onClick: toggleAction,
    });
  }

  private handleScreenPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.visible || this.alpha < 0.2) return;

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const cx = w / 2;
    const cy = h / 2;

    for (const action of this.clickActions) {
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
