/**
 * UI text strings — localization-ready tokens.
 * Replace values here to support other languages.
 * Never hardcode display strings directly in UI components.
 */
export const UIText = {
  // --- Menu ---
  gameTitle:    '★ DEEP SPACE ★',
  pressStart:   'Press ENTER to Start',
  tapStart:     'Tap to Start',
  version:      'v0.1.0',

  // --- HUD Labels ---
  health:       'HEALTH',
  shield:       'SHIELD',
  wave:         'WAVE',
  enemies:      'ENEMIES',
  score:        'SCORE',
  kills:        'KILLS',
  weapon:       'WEAPON',
  timer:        'TIME',
  fps:          'FPS',

  // --- Wave Messages ---
  waveLabel:    (n: number) => `WAVE ${n}`,
  waveComplete: 'WAVE COMPLETE',
  nextWave:     (s: string) => `Next Wave: ${s}`,
  enemiesLeft:  (n: number) => `Enemies: ${n}`,

  // --- Power-up Notifications ---
  pickupPrefix: '+',
  healthRestored: 'Health Restored',
  shieldActivated: 'Shield Active',

  // --- Score / Kill Events ---
  enemyEliminated: 'Enemy Eliminated',
  scorePrefix:    '+',

  // --- Game Over ---
  gameOver:     'GAME OVER',
  finalScore:   (n: number) => `Score: ${n}`,
  finalKills:   (n: number) => `Kills: ${n}`,
  finalAccuracy:(n: number) => `Accuracy: ${n}%`,
  timeSurvived: (mm: string, ss: string) => `Time: ${mm}:${ss}`,
  pressRestart: 'Press ENTER to Restart',
  tapRestart:   'Tap to Restart',

  // --- Pause Menu ---
  paused:       'PAUSED',
  resume:       'RESUME',
  settings:     'SETTINGS',
  quitToMenu:   'QUIT TO MENU',

  // --- Settings ---
  settingsTitle:    'SETTINGS',
  musicVolume:      'Music Volume',
  sfxVolume:        'SFX Volume',
  showFps:          'Show FPS',
  showDebug:        'Show Debug',
  fullscreen:       'Fullscreen',
  controlScheme:    'Controls',
  controlKeyboard:  'Keyboard + Mouse',
  controlTouch:     'Touch',
  controlGamepad:   'Gamepad',
  close:            'CLOSE',

  // --- Settings (Phase 9 additions) ---
  hudScale:         'HUD Scale',
  controlSize:      'Control Size',
  cameraZoom:       'Camera Zoom',
  debug:            'Debug',
  small:            'SMALL',
  medium:           'MEDIUM',
  large:            'LARGE',
  auto:             'AUTO',

  // --- Debug ---
  debugTitle:    'DEBUG',
} as const;
