import Phaser from 'phaser';
import { BG_COLOR } from '@/core/Constants';
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { MenuScene } from '@/scenes/MenuScene';
import { GameScene } from '@/scenes/GameScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',

  backgroundColor: BG_COLOR,

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: false,
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },

  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    roundPixels: false,
    powerPreference: 'high-performance',
  },

  fps: {
    target: 60,
    forceSetTimeOut: true,
  },

  // Enable multi-touch input
  input: {
    activePointers: 4,
  },

  scene: [BootScene, PreloadScene, MenuScene, GameScene],
};
