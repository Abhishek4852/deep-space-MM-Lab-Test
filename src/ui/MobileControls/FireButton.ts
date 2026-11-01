import Phaser from 'phaser';
import { UIConstants } from '@/theme/UIConstants';
import { Colors } from '@/theme/Colors';

/**
 * FireButton — right-side touch button for continuous firing.
 *
 * Architecture:
 * - Tracks its own pointer ID independently from VirtualJoystick
 * - isFiring is true while ANY pointer is held within the right half
 * - Provides a visual pulse animation while held
 */
export class FireButton {
  private scene: Phaser.Scene;
  private graphic: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;

  private centerX: number;
  private centerY: number;
  private RADIUS: number;

  private activePointerId: number | null = null;
  private _isFiring = false;

  private pulseTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, radius: number) {
    this.scene = scene;
    this.centerX = x;
    this.centerY = y;
    this.RADIUS = radius;

    this.graphic = scene.add.graphics();
    this.drawIdle();
    this.graphic.setScrollFactor(0).setDepth(UIConstants.depth.mobileControls).setAlpha(0.7);

    this.label = scene.add
      .text(x, y, '🔥', {
        fontSize: '28px',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(UIConstants.depth.mobileControls + 1)
      .setAlpha(0.9);

    this.bindEvents();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------

  private drawIdle(): void {
    this.graphic.clear();
    // Outer ring
    this.graphic.lineStyle(3, Colors.hex.danger, 1);
    this.graphic.strokeCircle(this.centerX, this.centerY, this.RADIUS);
    // Inner fill
    this.graphic.fillStyle(Colors.hex.bgCard, 1);
    this.graphic.fillCircle(this.centerX, this.centerY, this.RADIUS);
  }

  private drawActive(): void {
    this.graphic.clear();
    // Bright fill when held
    this.graphic.fillStyle(Colors.hex.danger, 0.3);
    this.graphic.fillCircle(this.centerX, this.centerY, this.RADIUS);
    this.graphic.lineStyle(4, Colors.hex.danger, 1);
    this.graphic.strokeCircle(this.centerX, this.centerY, this.RADIUS);
  }

  // ---------------------------------------------------------------------------
  // Touch events — only claims RIGHT half pointers
  // ---------------------------------------------------------------------------

  private bindEvents(): void {
    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    this.scene.input.on(Phaser.Input.Events.POINTER_OUT, this.onPointerUp, this);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.activePointerId !== null) return;

    // Do not capture input when game is paused or game over
    const sceneAny = this.scene as unknown as { gameStateManager?: { getState: () => string } };
    const state = sceneAny.gameStateManager?.getState();
    if (state === 'paused' || state === 'game_over') return;

    // Only claim right-half pointers
    if (pointer.x < this.scene.scale.gameSize.width * 0.5) return;

    this.activePointerId = pointer.id;
    this._isFiring = true;
    this.drawActive();
    this.graphic.setAlpha(1.0);
    this.label.setAlpha(1.0);
    this.startPulse();

    // Haptic feedback hook — vibrate on fire start
    HapticFeedback.tap();
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointerId) return;
    this.activePointerId = null;
    this._isFiring = false;
    this.drawIdle();
    this.graphic.setAlpha(0.7);
    this.label.setAlpha(0.9);
    this.stopPulse();
  }

  private startPulse(): void {
    this.stopPulse();
    this.pulseTween = this.scene.tweens.add({
      targets: this.graphic,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopPulse(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = undefined;
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  public get isFiring(): boolean {
    return this._isFiring;
  }

  public setPosition(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
    this.drawIdle();
    this.label.setPosition(x, y);
  }

  public updateLayout(x: number, y: number, radius: number): void {
    this.centerX = x;
    this.centerY = y;
    this.RADIUS = radius;
    this.drawIdle();
    this.label.setPosition(x, y);
  }

  public destroy(): void {
    this.shutdown();
    this.graphic.destroy();
    this.label.destroy();
  }

  private shutdown(): void {
    this.stopPulse();
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_OUT, this.onPointerUp, this);
  }
}

// ---------------------------------------------------------------------------
// Haptic Feedback Hooks
// ---------------------------------------------------------------------------

/**
 * HapticFeedback — thin wrapper over the navigator.vibrate API.
 * Provides semantic named hooks for different game events.
 * Falls back gracefully when vibration is not supported.
 */
export const HapticFeedback = {
  /** Short tap — fire button press */
  tap: (): void => {
    navigator.vibrate?.(20);
  },

  /** Medium pulse — enemy hit, pickup collected */
  medium: (): void => {
    navigator.vibrate?.(40);
  },

  /** Heavy shake — player damaged */
  heavy: (): void => {
    navigator.vibrate?.(80);
  },

  /** Double pulse — power-up collected */
  powerup: (): void => {
    navigator.vibrate?.([30, 50, 30]);
  },

  /** Boss defeated — long rumble (future) */
  bossDefeated: (): void => {
    navigator.vibrate?.([100, 50, 100, 50, 200]);
  },
};
