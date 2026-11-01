export interface WaveDifficulty {
  waveNumber: number;
  enemyCount: number;
  spawnInterval: number; // in milliseconds
  maxActive: number;
  hpMultiplier: number;
  speedMultiplier: number;
}

export const WAVE_SETTINGS = {
  BASE_ENEMY_COUNT: 10,
  ENEMY_COUNT_INCREMENT: 5,
  BASE_SPAWN_INTERVAL: 2000, // ms
  SPAWN_INTERVAL_DECREMENT: 150, // ms decrement per wave
  MIN_SPAWN_INTERVAL: 600, // floor spawn interval
  BASE_MAX_ACTIVE: 6,
  MAX_ACTIVE_INCREMENT: 2,
  MAX_ACTIVE_LIMIT: 25,
  REST_DURATION: 3, // seconds rest between waves

  // Difficulty scaling coefficients per wave step (wave - 1)
  HP_SCALING: 0.15, // +15% HP per wave
  SPEED_SCALING: 0.08 // +8% Speed per wave
} as const;

/**
 * Computes difficulty configuration values for a given wave number.
 */
export function getWaveConfig(waveNumber: number): WaveDifficulty {
  const step = waveNumber - 1;
  const enemyCount = WAVE_SETTINGS.BASE_ENEMY_COUNT + step * WAVE_SETTINGS.ENEMY_COUNT_INCREMENT;
  const spawnInterval = Math.max(
    WAVE_SETTINGS.MIN_SPAWN_INTERVAL,
    WAVE_SETTINGS.BASE_SPAWN_INTERVAL - step * WAVE_SETTINGS.SPAWN_INTERVAL_DECREMENT
  );
  const maxActive = Math.min(
    WAVE_SETTINGS.MAX_ACTIVE_LIMIT,
    WAVE_SETTINGS.BASE_MAX_ACTIVE + step * WAVE_SETTINGS.MAX_ACTIVE_INCREMENT
  );
  const hpMultiplier = 1.0 + step * WAVE_SETTINGS.HP_SCALING;
  const speedMultiplier = 1.0 + step * WAVE_SETTINGS.SPEED_SCALING;

  return {
    waveNumber,
    enemyCount,
    spawnInterval,
    maxActive,
    hpMultiplier,
    speedMultiplier
  };
}
