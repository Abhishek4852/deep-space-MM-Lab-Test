import Phaser from 'phaser';

export type ScreenId = 'hud' | 'pause' | 'settings' | 'gameover' | 'none';

export interface Screen {
  show(): void;
  hide(): void;
}

/**
 * ScreenManager — ensures only one overlay is active at a time.
 *
 * Screens register themselves via register(). GameScene calls
 * screenManager.show('pause') instead of directly touching overlay classes.
 */
export class ScreenManager {

  private screens: Map<ScreenId, Screen> = new Map();
  private activeScreen: ScreenId = 'none';

  constructor(scene: Phaser.Scene) {

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  /**
   * Registers a named screen instance.
   */
  public register(id: ScreenId, screen: Screen): void {
    this.screens.set(id, screen);
  }

  /**
   * Shows the given screen, hiding the currently active one.
   */
  public show(id: ScreenId): void {
    if (this.activeScreen === id) return;

    // Hide current
    if (this.activeScreen !== 'none') {
      this.screens.get(this.activeScreen)?.hide();
    }

    this.activeScreen = id;

    if (id !== 'none') {
      this.screens.get(id)?.show();
    }
  }

  /**
   * Hides all overlays and returns to game view.
   */
  public hideAll(): void {
    this.screens.forEach((screen) => screen.hide());
    this.activeScreen = 'none';
  }

  public getActive(): ScreenId {
    return this.activeScreen;
  }

  private shutdown(): void {
    this.screens.clear();
  }
}
