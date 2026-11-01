import Phaser from 'phaser';
import { VirtualJoystick } from './VirtualJoystick';
import { FireButton } from './FireButton';
import { UILayoutManager, UILayout } from '@/ui/UILayoutManager';

export interface MobileInputState {
  moveX: number;
  moveY: number;
  isFiring: boolean;
}

/**
 * MobileControls — orchestrator for VirtualJoystick + FireButton.
 *
 * GameScene owns this object. InputManager reads from it.
 * Positions and sizes are driven entirely by UILayoutManager.
 *
 * Visible on touch devices in both portrait and landscape.
 */
export class MobileControls {
  private joystick: VirtualJoystick;
  private fireButton: FireButton;

  constructor(scene: Phaser.Scene, layoutMgr: UILayoutManager) {
    const l = layoutMgr.get();

    this.joystick = new VirtualJoystick(
      scene,
      l.joystickPosition.x,
      l.joystickPosition.y,
      l.joystickBaseSize / 2,
      l.joystickThumbSize / 2
    );

    this.fireButton = new FireButton(
      scene,
      l.fireButtonPosition.x,
      l.fireButtonPosition.y,
      l.fireButtonSize / 2
    );

    // Reposition controls on layout change (resize / orientation change)
    scene.events.on('layout-updated', (newLayout: UILayout) => {
      this.joystick.updateLayout(
        newLayout.joystickPosition.x,
        newLayout.joystickPosition.y,
        newLayout.joystickBaseSize / 2,
        newLayout.joystickThumbSize / 2
      );
      this.fireButton.updateLayout(
        newLayout.fireButtonPosition.x,
        newLayout.fireButtonPosition.y,
        newLayout.fireButtonSize / 2
      );
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown.bind(this));
  }

  /**
   * Returns the current combined mobile input state.
   * InputManager merges this with keyboard/gamepad state.
   */
  public getState(): MobileInputState {
    const js = this.joystick.getState();
    return {
      moveX: js.x,
      moveY: js.y,
      isFiring: this.fireButton.isFiring,
    };
  }

  private shutdown(): void {
    this.joystick.destroy();
    this.fireButton.destroy();
  }
}
