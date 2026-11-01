import Phaser from 'phaser';
import { MobileInputState } from '@/ui/MobileControls/MobileControls';

export interface PlayerInputState {
  moveX: number;        // -1 to 1
  moveY: number;        // -1 to 1
  aimX: number;         // World X coordinate to aim at
  aimY: number;         // World Y coordinate to aim at
  activeKeys: string[]; // Debug: list of active input labels
  isFiring: boolean;    // True while fire is held
  inputSource: 'keyboard' | 'gamepad' | 'touch'; // Active input device
}

/**
 * InputManager — translates ALL input sources into a single PlayerInputState.
 *
 * Supported devices:
 * - Keyboard (WASD / Arrow keys) + Mouse aim
 * - Gamepad (Xbox / PS / XInput / Steam Deck)
 * - Touch (via MobileControls — injected externally, not owned here)
 *
 * Player is always decoupled: it only reads PlayerInputState.
 * MobileControls is owned by GameScene and injected via setMobileControls().
 */
export class InputManager {
  private scene: Phaser.Scene;
  private mobileState: MobileInputState | null = null;

  // Keyboard bindings
  private keys: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  } | null = null;

  // Gamepad state cache
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Keyboard setup (optional — touch devices may not have one)
    if (scene.input.keyboard) {
      const kb = scene.input.keyboard;
      this.keys = {
        w:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        a:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        s:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        d:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        up:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        down:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      };
    }

    // Gamepad connection listeners
    if (scene.input.gamepad) {
      scene.input.gamepad.on(
        Phaser.Input.Gamepad.Events.CONNECTED,
        (pad: Phaser.Input.Gamepad.Gamepad) => {
          this.gamepad = pad;
        }
      );
      scene.input.gamepad.on(
        Phaser.Input.Gamepad.Events.DISCONNECTED,
        () => {
          this.gamepad = null;
        }
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Mobile state injection — called by GameScene, not by Player
  // ---------------------------------------------------------------------------

  /**
   * Injects the mobile input state from MobileControls.
   * Called once per frame by GameScene before getInputState().
   */
  public setMobileState(state: MobileInputState): void {
    this.mobileState = state;
  }

  // ---------------------------------------------------------------------------
  // Core input aggregation
  // ---------------------------------------------------------------------------

  /**
   * Returns the unified PlayerInputState from all active input sources.
   * Priority: Gamepad > Keyboard+Mouse > Touch
   */
  public getInputState(): PlayerInputState {
    // 1. Try gamepad first
    if (this.gamepad?.connected) {
      return this.readGamepad();
    }

    // 2. Try keyboard (non-zero keys or mouse click)
    const kbState = this.readKeyboard();
    if (kbState.moveX !== 0 || kbState.moveY !== 0 || kbState.isFiring) {
      return kbState;
    }

    // 3. Fall back to mouse aim + fire even with no movement keys
    // If touch is active, use that
    if (this.mobileState && (this.mobileState.moveX !== 0 || this.mobileState.moveY !== 0 || this.mobileState.isFiring)) {
      return this.readTouch();
    }

    // 4. Default — include mouse pointer even when idle
    return kbState;
  }

  // ---------------------------------------------------------------------------
  // Keyboard + Mouse
  // ---------------------------------------------------------------------------

  private readKeyboard(): PlayerInputState {
    const keys = this.keys;
    let moveX = 0;
    let moveY = 0;
    const activeKeys: string[] = [];

    if (keys) {
      if (keys.w.isDown || keys.up.isDown)    { moveY = -1; if (keys.w.isDown) activeKeys.push('W'); if (keys.up.isDown) activeKeys.push('▲'); }
      else if (keys.s.isDown || keys.down.isDown) { moveY = 1; if (keys.s.isDown) activeKeys.push('S'); if (keys.down.isDown) activeKeys.push('▼'); }

      if (keys.a.isDown || keys.left.isDown)  { moveX = -1; if (keys.a.isDown) activeKeys.push('A'); if (keys.left.isDown) activeKeys.push('◀'); }
      else if (keys.d.isDown || keys.right.isDown) { moveX = 1; if (keys.d.isDown) activeKeys.push('D'); if (keys.right.isDown) activeKeys.push('▶'); }

      if (keys.space.isDown) activeKeys.push('SPACE');
    }

    const pointer = this.scene.input.activePointer;
    const isFiring = pointer.isDown || (keys?.space.isDown ?? false);

    return {
      moveX,
      moveY,
      aimX: pointer.worldX,
      aimY: pointer.worldY,
      activeKeys,
      isFiring,
      inputSource: 'keyboard',
    };
  }

  // ---------------------------------------------------------------------------
  // Touch / Mobile
  // ---------------------------------------------------------------------------

  private readTouch(): PlayerInputState {
    const ms = this.mobileState!;

    // On mobile, aim direction follows the movement vector
    // (The ship faces where the joystick points)
    const player = this.scene.children.getByName('Player');
    let aimX = 0;
    let aimY = 0;

    if (player && 'x' in player && 'y' in player) {
      const px = (player as { x: number }).x;
      const py = (player as { y: number }).y;
      // Aim 100 units ahead in the joystick direction
      aimX = px + ms.moveX * 100;
      aimY = py + ms.moveY * 100;
    }

    return {
      moveX: ms.moveX,
      moveY: ms.moveY,
      aimX,
      aimY,
      activeKeys: ['TOUCH'],
      isFiring: ms.isFiring,
      inputSource: 'touch',
    };
  }

  // ---------------------------------------------------------------------------
  // Gamepad (Xbox / PS / XInput / Steam Deck)
  // ---------------------------------------------------------------------------

  private readGamepad(): PlayerInputState {
    const pad = this.gamepad!;

    // Left stick: movement
    const moveX = this.applyDeadzone(pad.leftStick.x);
    const moveY = this.applyDeadzone(pad.leftStick.y);

    // Right stick: aim direction
    const aimStickX = this.applyDeadzone(pad.rightStick.x);
    const aimStickY = this.applyDeadzone(pad.rightStick.y);

    // Calculate aim position using right stick direction from player
    const player = this.scene.children.getByName('Player');
    let aimX = 0;
    let aimY = 0;

    if (player && 'x' in player && 'y' in player) {
      const px = (player as { x: number }).x;
      const py = (player as { y: number }).y;
      if (Math.abs(aimStickX) > 0 || Math.abs(aimStickY) > 0) {
        aimX = px + aimStickX * 200;
        aimY = py + aimStickY * 200;
      } else {
        // Default aim to movement direction if right stick is idle
        aimX = px + moveX * 200;
        aimY = py + moveY * 200;
      }
    }

    // RT / R2 = fire (button index 7), or A/Cross = fire (button index 0)
    const isFiring = pad.buttons[7]?.value > 0.1 || pad.buttons[0]?.value > 0;

    const activeKeys: string[] = ['GAMEPAD'];
    if (pad.id) activeKeys.push(pad.id.slice(0, 20));

    return {
      moveX,
      moveY,
      aimX,
      aimY,
      activeKeys,
      isFiring,
      inputSource: 'gamepad',
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private applyDeadzone(value: number, deadzone = 0.15): number {
    if (Math.abs(value) < deadzone) return 0;
    // Rescale to maintain full range outside deadzone
    return (value - Math.sign(value) * deadzone) / (1 - deadzone);
  }

  public isGamepadConnected(): boolean {
    return this.gamepad?.connected ?? false;
  }

  public getGamepadId(): string {
    return this.gamepad?.id ?? '';
  }
}
