export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const BG_COLOR = '#020617';

export const COLORS = {
  PLAYER_DAMAGE: 0xff0000,
  ENEMY_DAMAGE: 0xffffff
} as const;

export const GAME_EVENTS = {
  ENEMY_SPAWNED: 'enemy-spawned',
  ENEMY_DIED: 'enemy-died',
  PLAYER_HIT: 'player-hit',
  PLAYER_DIED: 'player-died',
  BULLET_HIT: 'bullet-hit',

  // Phase 5 events
  SHOTS_FIRED: 'shots-fired',
  STATE_CHANGED: 'state-changed',
  SCORE_CHANGED: 'score-changed',
  HEALTH_CHANGED: 'health-changed',
  KILLS_CHANGED: 'kills-changed',
  TIMER_TICK: 'timer-tick',
  GAME_OVER: 'game-over',
  GAME_RESTARTED: 'game-restarted',
  REQUEST_RESTART: 'request-restart',

  // Phase 6 Wave System events
  WAVE_STARTED: 'wave-started',
  WAVE_COMPLETED: 'wave-completed',
  WAVE_COUNTDOWN_STARTED: 'wave-countdown-started',
  WAVE_COUNTDOWN_TICK: 'wave-countdown-tick',
  WAVE_COUNTDOWN_FINISHED: 'wave-countdown-finished',
  ENEMY_SPAWN_REQUEST: 'enemy-spawn-request',

  // Phase 7 Loot and Power-up events
  POWERUP_SPAWN_REQUEST: 'powerup-spawn-request',
  POWERUP_SPAWNED: 'powerup-spawned',
  POWERUP_COLLECTED: 'powerup-collected',
  BUFF_STARTED: 'buff-started',
  BUFF_EXPIRED: 'buff-expired',
  PLAYER_HEALED: 'player-healed',
  SHIELD_CHANGED: 'shield-changed',
  SHIELD_HIT: 'shield-hit',
  BUFFS_UPDATED: 'buffs-updated',

  // Phase 12 Boss events
  WAVE_COMPLETED_CHECK_PAUSE: 'wave-completed-check-pause'
} as const;

export const WORLD = {
  WIDTH: 12000,
  HEIGHT: 12000
} as const;

export const PLAYER = {
  MAX_SPEED: 400,
  ACCELERATION: 1600,
  DRAG: 1000,
  MAX_HEALTH: 100,
  MUZZLE_OFFSET: 30
} as const;

export const WEAPONS = {
  DEFAULT: {
    NAME: 'Default Blaster',
    FIRE_RATE: 200,
    SPEED: 800,
    DAMAGE: 10,
    LIFETIME: 2000,
    POOL_SIZE: 200
  }
} as const;

export const ENEMY = {
  SPAWN_INTERVAL: 2000,
  MAX_ACTIVE: 15,
  POOL_SIZE: 100,
  SPAWN_MIN_DIST: 600,
  SPAWN_MAX_DIST: 900,
  HIT_FLASH_DURATION: 50,
  PLAYER_HIT_FLASH: 100
} as const;
