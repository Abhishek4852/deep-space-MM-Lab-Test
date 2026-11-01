export const SceneKeys = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  GAME: 'GameScene'
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
