import Phaser from 'phaser';

/**
 * CameraManager — centralized camera effects.
 *
 * All camera operations (shake, flash, zoom, slow-motion) go through
 * this class instead of calling scene.cameras.main directly in game code.
 * This keeps camera logic decoupled from gameplay and UI systems.
 */
export class CameraManager {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;

  // Slow-motion state
  private defaultTimeScale = 1.0;
  private slowMoTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  // ---------------------------------------------------------------------------
  // Shake
  // ---------------------------------------------------------------------------

  /**
   * Quick impact shake — used for player hit, explosion, etc.
   * @param intensity  Shake magnitude in pixels (default 6)
   * @param duration   Duration in ms (default 200)
   */
  shake(intensity = 6, duration = 200): void {
    this.camera.shake(duration, intensity / 1000);
  }

  /**
   * Heavy shake — boss attacks, major events.
   */
  heavyShake(): void {
    this.shake(14, 350);
  }

  /**
   * Light rumble — continuous background shake.
   */
  rumble(duration = 500): void {
    this.shake(3, duration);
  }

  // ---------------------------------------------------------------------------
  // Flash
  // ---------------------------------------------------------------------------

  /**
   * Flash to white — used for bullet impacts or bright events.
   */
  flashWhite(duration = 120): void {
    this.camera.flash(duration, 255, 255, 255, false);
  }

  /**
   * Flash to red — used for player taking damage.
   */
  flashRed(duration = 180): void {
    this.camera.flash(duration, 255, 30, 30, false);
  }

  /**
   * Flash to custom color.
   */
  flash(duration: number, r: number, g: number, b: number): void {
    this.camera.flash(duration, r, g, b, false);
  }

  // ---------------------------------------------------------------------------
  // Zoom
  // ---------------------------------------------------------------------------

  /**
   * Smoothly zoom to a target zoom level.
   */
  zoomTo(targetZoom: number, duration = 400, ease = 'Power2'): void {
    this.scene.tweens.add({
      targets: this.camera,
      zoom: targetZoom,
      duration,
      ease,
    });
  }

  /**
   * Reset zoom to 1.0.
   */
  resetZoom(duration = 400): void {
    this.zoomTo(1.0, duration);
  }

  /**
   * Set responsive zoom and camera deadzone.
   */
  setResponsiveZoom(targetZoom: number, deadzoneX: number, deadzoneY: number, duration = 600): void {
    this.zoomTo(targetZoom, duration);
    this.camera.setDeadzone(deadzoneX, deadzoneY);
  }

  // ---------------------------------------------------------------------------
  // Slow-motion
  // ---------------------------------------------------------------------------

  /**
   * Applies temporary slow-motion time scale.
   * @param scale      Time scale (0.3 = 30% speed)
   * @param duration   How long to stay in slow-mo (ms)
   */
  slowMotion(scale = 0.3, duration = 600): void {
    this.scene.time.timeScale = scale;
    this.scene.physics.world.timeScale = 1 / scale;

    if (this.slowMoTimer) {
      this.slowMoTimer.destroy();
    }

    this.slowMoTimer = this.scene.time.delayedCall(duration * scale, () => {
      this.restoreTimeScale();
    });
  }

  /**
   * Restores time scale to normal.
   */
  restoreTimeScale(): void {
    this.scene.time.timeScale = this.defaultTimeScale;
    this.scene.physics.world.timeScale = 1.0;
    this.slowMoTimer = null;
  }

  // ---------------------------------------------------------------------------
  // Cinematic helpers
  // ---------------------------------------------------------------------------

  /**
   * Fade the camera in from black.
   */
  fadeIn(duration = 500): void {
    this.camera.fadeIn(duration, 2, 6, 23);
  }

  /**
   * Fade the camera out to black and call an optional callback.
   */
  fadeOut(duration = 500, onComplete?: () => void): void {
    this.camera.fadeOut(duration, 2, 6, 23);
    if (onComplete) {
      this.camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, onComplete);
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private shutdown(): void {
    if (this.slowMoTimer) {
      this.slowMoTimer.destroy();
      this.slowMoTimer = null;
    }
    this.restoreTimeScale();
  }
}
