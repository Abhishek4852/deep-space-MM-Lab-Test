import Phaser from 'phaser';
import { UIConstants } from '@/theme/UIConstants';
import { Colors } from '@/theme/Colors';

export interface JoystickState {
  /** Normalized X direction: -1 to 1 */
  x: number;
  /** Normalized Y direction: -1 to 1 */
  y: number;
  /** True if the joystick is currently active */
  active: boolean;
}

/**
 * VirtualJoystick — left-side touch joystick for mobile movement.
 *
 * Architecture:
 * - Renders on the Phaser canvas as a fixed UI element (scrollFactor 0)
 * - Tracks pointer ID so it never conflicts with the FireButton
 * - Outputs a normalized direction vector with deadzone
 */
export class VirtualJoystick {
  private scene: Phaser.Scene;
  private baseGraphic: Phaser.GameObjects.Graphics;
  private thumbGraphic: Phaser.GameObjects.Graphics;

  private baseX: number;
  private baseY: number;

  private BASE_RADIUS: number;
  private THUMB_RADIUS: number;
  private readonly DEADZONE = UIConstants.joystick.deadzone;

  private activePointerId: number | null = null;
  private state: JoystickState = { x: 0, y: 0, active: false };

  constructor(scene: Phaser.Scene, x: number, y: number, baseRadius: number, thumbRadius: number) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.BASE_RADIUS = baseRadius;
    this.THUMB_RADIUS = thumbRadius;

    // Base ring (static)
    this.baseGraphic = scene.add.graphics();
    this.drawBase();
    this.baseGraphic.setScrollFactor(0).setDepth(UIConstants.depth.mobileControls).setAlpha(0.45);

    // Thumb knob (moves with finger)
    this.thumbGraphic = scene.add.graphics();
    this.drawThumb(0, 0);
    this.thumbGraphic.setScrollFactor(0).setDepth(UIConstants.depth.mobileControls).setAlpha(0.8);

    this.bindEvents();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------

  private drawBase(): void {
    this.baseGraphic.clear();
    // Outer ring
    this.baseGraphic.lineStyle(3, Colors.hex.primary, 1);
    this.baseGraphic.strokeCircle(this.baseX, this.baseY, this.BASE_RADIUS);
    // Inner fill
    this.baseGraphic.fillStyle(Colors.hex.bgCard, 1);
    this.baseGraphic.fillCircle(this.baseX, this.baseY, this.BASE_RADIUS);
  }

  private drawThumb(offsetX: number, offsetY: number): void {
    this.thumbGraphic.clear();
    this.thumbGraphic.fillStyle(Colors.hex.primary, 1);
    this.thumbGraphic.fillCircle(this.baseX + offsetX, this.baseY + offsetY, this.THUMB_RADIUS);
  }

  // ---------------------------------------------------------------------------
  // Touch events
  // ---------------------------------------------------------------------------

  private bindEvents(): void {
    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.activePointerId !== null) return;

    // Do not capture input when game is paused or game over
    const sceneAny = this.scene as unknown as { gameStateManager?: { getState: () => string } };
    const state = sceneAny.gameStateManager?.getState();
    if (state === 'paused' || state === 'game_over') return;

    // Do not capture input over the bottom-left weapon card / weapon switch controls
    const screenH = this.scene.scale.height;
    if (pointer.x < 320 && pointer.y > screenH - 220) {
      return;
    }

    // Only claim this pointer if it's in the LEFT half and no pointer is already assigned
    if (pointer.x > this.scene.scale.gameSize.width * 0.5) return;

    this.activePointerId = pointer.id;
    this.updateFromPointer(pointer);
    this.baseGraphic.setAlpha(0.7);
    this.thumbGraphic.setAlpha(1.0);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointerId) return;
    this.updateFromPointer(pointer);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointerId) return;
    this.activePointerId = null;
    this.state = { x: 0, y: 0, active: false };
    this.drawThumb(0, 0);
    this.baseGraphic.setAlpha(0.45);
    this.thumbGraphic.setAlpha(0.8);
  }

  private updateFromPointer(pointer: Phaser.Input.Pointer): void {
    // Use raw screen coords relative to the base position
    const dx = pointer.x - this.baseX;
    const dy = pointer.y - this.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(distance, this.BASE_RADIUS - this.THUMB_RADIUS);

    // Apply deadzone
    if (distance < this.DEADZONE) {
      this.state = { x: 0, y: 0, active: true };
      this.drawThumb(0, 0);
      return;
    }

    const angle = Math.atan2(dy, dx);
    const thumbX = Math.cos(angle) * clamped;
    const thumbY = Math.sin(angle) * clamped;

    // Normalize to -1..1 range
    const maxRange = this.BASE_RADIUS - this.THUMB_RADIUS;
    this.state = {
      x: thumbX / maxRange,
      y: thumbY / maxRange,
      active: true,
    };

    this.drawThumb(thumbX, thumbY);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  public getState(): JoystickState {
    return this.state;
  }

  public setPosition(x: number, y: number): void {
    this.baseX = x;
    this.baseY = y;
    this.drawBase();
    this.drawThumb(0, 0);
  }

  public updateLayout(x: number, y: number, baseRadius: number, thumbRadius: number): void {
    this.baseX = x;
    this.baseY = y;
    this.BASE_RADIUS = baseRadius;
    this.THUMB_RADIUS = thumbRadius;
    this.drawBase();
    this.drawThumb(0, 0);
  }

  public destroy(): void {
    this.shutdown();
    this.baseGraphic.destroy();
    this.thumbGraphic.destroy();
  }

  private shutdown(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
  }
}
