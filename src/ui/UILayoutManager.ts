import Phaser from 'phaser';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface UILayout {
  // Screen dimensions
  width: number;
  height: number;
  device: DeviceType;
  orientation: Orientation;
  isPortrait: boolean;
  isTouch: boolean;
  safeArea: SafeArea;

  // Margins
  margin: number;
  gap: number;

  // Anchors — all safe-area adjusted
  anchors: {
    topLeft: Phaser.Math.Vector2;
    topCenter: Phaser.Math.Vector2;
    topRight: Phaser.Math.Vector2;
    middleLeft: Phaser.Math.Vector2;
    center: Phaser.Math.Vector2;
    middleRight: Phaser.Math.Vector2;
    bottomLeft: Phaser.Math.Vector2;
    bottomCenter: Phaser.Math.Vector2;
    bottomRight: Phaser.Math.Vector2;
  };

  // Camera
  cameraZoom: number;
  cameraDeadzone: { x: number; y: number };

  // Controls
  joystickVisible: boolean;
  joystickBaseSize: number;
  joystickThumbSize: number;
  joystickPosition: Phaser.Math.Vector2;
  fireButtonSize: number;
  fireButtonPosition: Phaser.Math.Vector2;

  // HUD
  healthBarWidth: number;
  healthBarHeight: number;
  scoreCardWidth: number;
  weaponCardWidth: number;
  hudScale: number;

  // Debug
  debugVisible: boolean;
}

export class UILayoutManager {
  private scene: Phaser.Scene;
  private _layout: UILayout;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this._layout = this.compute();

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  public get layout(): UILayout { return this._layout; }
  public get(): UILayout { return this._layout; }

  // Convenience getters
  public isPortrait(): boolean { return this._layout.isPortrait; }
  public isTouch(): boolean { return this._layout.isTouch; }
  public device(): DeviceType { return this._layout.device; }

  public recompute(): void {
    this._layout = this.compute();
    this.scene.events.emit('layout-updated', this._layout);
  }

  private compute(): UILayout {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const isPortrait = h > w;
    const isTouch = this.scene.sys.game.device.input.touch;

    // Read Settings from localStorage with default fallbacks
    const savedHudScale = localStorage.getItem('deep_space_hud_scale') || 'auto';
    const savedControlSize = localStorage.getItem('deep_space_control_size') || 'medium';
    const savedCameraZoom = localStorage.getItem('deep_space_camera_zoom') || '100%';
    
    // Default debug: ON for desktop DEV builds, OFF otherwise
    const isDev = true; // Vite dev mode default check
    const defaultDebug = (!isTouch && isDev) ? 'on' : 'off';
    const savedDebug = localStorage.getItem('deep_space_debug') || defaultDebug;

    let hudScale = 1.0;
    if (savedHudScale === 'small') hudScale = 0.8;
    else if (savedHudScale === 'large') hudScale = 1.2;

    let controlScale = 1.0;
    if (savedControlSize === 'small') controlScale = 0.8;
    else if (savedControlSize === 'large') controlScale = 1.2;

    let zoomScale = 1.0;
    if (savedCameraZoom === '80%') zoomScale = 0.8;
    else if (savedCameraZoom === '120%') zoomScale = 1.2;

    // Device detection
    let device: DeviceType;
    const maxDim = Math.max(w, h);
    if (maxDim < 900 && isTouch) {
      device = 'mobile';
    } else if (maxDim < 1200 && isTouch) {
      device = 'tablet';
    } else {
      device = 'desktop';
    }

    const orientation: Orientation = isPortrait ? 'portrait' : 'landscape';

    // Safe area — read from CSS env() if available
    const safeArea = this.getSafeArea();

    // Margins - Phase 10 alignment specs
    const margin = device === 'mobile' ? 16 : device === 'tablet' ? 20 : 24;
    const gap = 8;

    // Effective bounds
    const left = safeArea.left + margin;
    const right = w - safeArea.right - margin;
    const top = safeArea.top + margin;
    const bottom = h - safeArea.bottom - margin;

    // Anchors
    const anchors = {
      topLeft:      new Phaser.Math.Vector2(left, top),
      topCenter:    new Phaser.Math.Vector2(w / 2, top),
      topRight:     new Phaser.Math.Vector2(right, top),
      middleLeft:   new Phaser.Math.Vector2(left, h / 2),
      center:       new Phaser.Math.Vector2(w / 2, h / 2),
      middleRight:  new Phaser.Math.Vector2(right, h / 2),
      bottomLeft:   new Phaser.Math.Vector2(left, bottom),
      bottomCenter: new Phaser.Math.Vector2(w / 2, bottom),
      bottomRight:  new Phaser.Math.Vector2(right, bottom),
    };

    // Camera
    const cameraZoom = (isPortrait ? 1.25 : 1.0) * zoomScale;
    const cameraDeadzone = isPortrait ? { x: 40, y: 60 } : { x: 100, y: 100 };

    // Controls
    const joystickVisible = isTouch;
    const controlMargin = (device === 'mobile' ? 24 : 32) * controlScale;
    const controlBottom = (device === 'mobile' ? 32 : 40) * controlScale;
    const joystickBaseSize = (device === 'mobile' ? 140 : 160) * controlScale;
    const joystickThumbSize = (device === 'mobile' ? 60 : 70) * controlScale;
    const fireButtonSize = (device === 'mobile' ? 120 : 140) * controlScale;

    const joystickPosition = new Phaser.Math.Vector2(
      safeArea.left + controlMargin + joystickBaseSize / 2,
      h - safeArea.bottom - controlBottom - joystickBaseSize / 2
    );
    const fireButtonPosition = new Phaser.Math.Vector2(
      w - safeArea.right - controlMargin - fireButtonSize / 2,
      h - safeArea.bottom - controlBottom - fireButtonSize / 2
    );

    // HUD sizes
    const healthBarWidth = (isPortrait ? Math.round(w * 0.80) : 280) * hudScale;
    const healthBarHeight = 20;
    const scoreCardWidth = (isPortrait ? Math.round(w * 0.40) : 220) * hudScale;
    const weaponCardWidth = (isPortrait ? Math.min(180, Math.round(w * 0.45)) : 240) * hudScale;

    // Debug
    const debugVisible = savedDebug === 'on';

    return {
      width: w, height: h, device, orientation, isPortrait, isTouch, safeArea,
      margin, gap, anchors,
      cameraZoom, cameraDeadzone,
      joystickVisible, joystickBaseSize, joystickThumbSize, joystickPosition,
      fireButtonSize, fireButtonPosition,
      healthBarWidth, healthBarHeight, scoreCardWidth, weaponCardWidth, hudScale,
      debugVisible,
    };
  }

  private getSafeArea(): SafeArea {
    // Try to read CSS env() values via a probe element
    if (typeof document !== 'undefined') {
      const style = getComputedStyle(document.documentElement);
      const parse = (prop: string) => {
        const val = style.getPropertyValue(prop);
        return val ? parseInt(val, 10) || 0 : 0;
      };
      return {
        top:    parse('--sat') || 0,
        right:  parse('--sar') || 0,
        bottom: parse('--sab') || 0,
        left:   parse('--sal') || 0,
      };
    }
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  private onResize(): void {
    this._layout = this.compute();
    this.scene.events.emit('layout-updated', this._layout);
  }

  private shutdown(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
  }
}
