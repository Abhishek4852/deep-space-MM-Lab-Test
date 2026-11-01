import Phaser from 'phaser';

export abstract class BaseScene extends Phaser.Scene {
  protected fpsText?: Phaser.GameObjects.Text;

  constructor(key: string) {
    super(key);
  }

  /**
   * Reusable camera fade-in helper
   */
  protected fadeIn(duration = 500): void {
    this.cameras.main.fadeIn(duration, 2, 6, 23); // #020617 in RGB (2, 6, 23)
  }

  /**
   * Reusable camera fade-out helper and scene transition
   */
  protected transitionTo(targetScene: string, duration = 500): void {
    this.cameras.main.fadeOut(duration, 2, 6, 23);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(targetScene);
    });
  }

  /**
   * Initialize a development-only FPS counter
   */
  protected createFpsCounter(x = 10, y = 10): void {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      this.fpsText = this.add.text(x, y, 'FPS: --', {
        fontFamily: 'Courier, monospace',
        fontSize: '14px',
        color: '#10b981', // Neon emerald green
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        padding: { x: 6, y: 4 }
      });
      this.fpsText.setScrollFactor(0);
      this.fpsText.setDepth(9999);
    }
  }

  /**
   * Update the FPS counter display
   */
  protected updateFpsCounter(): void {
    if (this.fpsText) {
      const fps = Math.round(this.game.loop.actualFps);
      this.fpsText.setText(`FPS: ${fps}`);
    }
  }
}
