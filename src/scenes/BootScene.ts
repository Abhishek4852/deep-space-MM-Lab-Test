import { BaseScene } from './BaseScene';
import { SceneKeys } from '@/core/SceneKeys';

export class BootScene extends BaseScene {
  constructor() {
    super(SceneKeys.BOOT);
  }

  preload(): void {
    // Minimal configurations / core assets required by the preloader can be loaded here
  }

  create(): void {
    // Instantly transition to Preload Scene
    this.scene.start(SceneKeys.PRELOAD);
  }
}
