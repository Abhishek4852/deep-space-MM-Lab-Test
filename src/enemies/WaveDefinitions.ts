import { EnemyType } from './EnemyTypes';

export interface WaveComposition {
  weights: Record<EnemyType, number>;
  totalCount: number;
  spawnInterval: number; // in ms
  maxActive: number;
  eliteChance: number;   // 0.0 to 1.0
  isBossWave?: boolean;
  bossType?: 'GUARDIAN' | 'DREADNOUGHT' | 'CORE';
}

export const WAVE_DEFINITIONS: Record<number, WaveComposition> = {
  1: {
    weights: {
      [EnemyType.SCOUT]: 80,
      [EnemyType.SWARM]: 20,
      [EnemyType.INTERCEPTOR]: 0,
      [EnemyType.BOMBER]: 0,
      [EnemyType.KAMIKAZE]: 0,
      [EnemyType.SNIPER]: 0,
      [EnemyType.SHIELD]: 0
    },
    totalCount: 10,
    spawnInterval: 2000,
    maxActive: 6,
    eliteChance: 0.0
  },
  2: {
    weights: {
      [EnemyType.SCOUT]: 60,
      [EnemyType.SWARM]: 40,
      [EnemyType.INTERCEPTOR]: 0,
      [EnemyType.BOMBER]: 0,
      [EnemyType.KAMIKAZE]: 0,
      [EnemyType.SNIPER]: 0,
      [EnemyType.SHIELD]: 0
    },
    totalCount: 15,
    spawnInterval: 1800,
    maxActive: 7,
    eliteChance: 0.0
  },
  3: {
    weights: {
      [EnemyType.SCOUT]: 50,
      [EnemyType.SWARM]: 30,
      [EnemyType.KAMIKAZE]: 20,
      [EnemyType.INTERCEPTOR]: 0,
      [EnemyType.BOMBER]: 0,
      [EnemyType.SNIPER]: 0,
      [EnemyType.SHIELD]: 0
    },
    totalCount: 20,
    spawnInterval: 1600,
    maxActive: 8,
    eliteChance: 0.0
  },
  4: {
    weights: {
      [EnemyType.SCOUT]: 40,
      [EnemyType.SWARM]: 20,
      [EnemyType.KAMIKAZE]: 20,
      [EnemyType.BOMBER]: 20,
      [EnemyType.INTERCEPTOR]: 0,
      [EnemyType.SNIPER]: 0,
      [EnemyType.SHIELD]: 0
    },
    totalCount: 25,
    spawnInterval: 1400,
    maxActive: 9,
    eliteChance: 0.0
  },
  5: {
    // Boss wave: Planet Guardian
    weights: {
      [EnemyType.SCOUT]: 0,
      [EnemyType.SWARM]: 0,
      [EnemyType.INTERCEPTOR]: 0,
      [EnemyType.BOMBER]: 0,
      [EnemyType.KAMIKAZE]: 0,
      [EnemyType.SNIPER]: 0,
      [EnemyType.SHIELD]: 0
    },
    totalCount: 1,
    spawnInterval: 5000,
    maxActive: 1,
    eliteChance: 0.0,
    isBossWave: true,
    bossType: 'GUARDIAN'
  },
  6: {
    weights: {
      [EnemyType.SCOUT]: 30,
      [EnemyType.SWARM]: 30,
      [EnemyType.BOMBER]: 20,
      [EnemyType.INTERCEPTOR]: 20,
      [EnemyType.KAMIKAZE]: 0,
      [EnemyType.SNIPER]: 0,
      [EnemyType.SHIELD]: 0
    },
    totalCount: 30,
    spawnInterval: 1300,
    maxActive: 10,
    eliteChance: 0.15
  },
  7: {
    weights: {
      [EnemyType.SCOUT]: 20,
      [EnemyType.SWARM]: 20,
      [EnemyType.BOMBER]: 20,
      [EnemyType.INTERCEPTOR]: 30,
      [EnemyType.SNIPER]: 10,
      [EnemyType.KAMIKAZE]: 0,
      [EnemyType.SHIELD]: 0
    },
    totalCount: 35,
    spawnInterval: 1200,
    maxActive: 12,
    eliteChance: 0.15
  },
  8: {
    weights: {
      [EnemyType.SCOUT]: 10,
      [EnemyType.SWARM]: 10,
      [EnemyType.BOMBER]: 20,
      [EnemyType.INTERCEPTOR]: 30,
      [EnemyType.SNIPER]: 20,
      [EnemyType.SHIELD]: 10,
      [EnemyType.KAMIKAZE]: 0
    },
    totalCount: 40,
    spawnInterval: 1100,
    maxActive: 14,
    eliteChance: 0.20
  },
  9: {
    weights: {
      [EnemyType.SWARM]: 10,
      [EnemyType.BOMBER]: 20,
      [EnemyType.INTERCEPTOR]: 20,
      [EnemyType.SNIPER]: 20,
      [EnemyType.SHIELD]: 10,
      [EnemyType.KAMIKAZE]: 20,
      [EnemyType.SCOUT]: 0
    },
    totalCount: 45,
    spawnInterval: 1000,
    maxActive: 15,
    eliteChance: 0.20
  },
  10: {
    // Boss wave: Dreadnought
    weights: {
      [EnemyType.SCOUT]: 0,
      [EnemyType.SWARM]: 0,
      [EnemyType.INTERCEPTOR]: 0,
      [EnemyType.BOMBER]: 0,
      [EnemyType.KAMIKAZE]: 0,
      [EnemyType.SNIPER]: 0,
      [EnemyType.SHIELD]: 0
    },
    totalCount: 1,
    spawnInterval: 5000,
    maxActive: 1,
    eliteChance: 0.0,
    isBossWave: true,
    bossType: 'DREADNOUGHT'
  },
  11: {
    weights: {
      [EnemyType.SCOUT]: 10,
      [EnemyType.SWARM]: 10,
      [EnemyType.BOMBER]: 15,
      [EnemyType.INTERCEPTOR]: 25,
      [EnemyType.SNIPER]: 20,
      [EnemyType.SHIELD]: 10,
      [EnemyType.KAMIKAZE]: 10
    },
    totalCount: 50,
    spawnInterval: 900,
    maxActive: 16,
    eliteChance: 0.25
  },
  12: {
    weights: {
      [EnemyType.SCOUT]: 5,
      [EnemyType.SWARM]: 15,
      [EnemyType.BOMBER]: 15,
      [EnemyType.INTERCEPTOR]: 25,
      [EnemyType.SNIPER]: 20,
      [EnemyType.SHIELD]: 10,
      [EnemyType.KAMIKAZE]: 10
    },
    totalCount: 55,
    spawnInterval: 800,
    maxActive: 18,
    eliteChance: 0.25
  },
  13: {
    weights: {
      [EnemyType.SWARM]: 20,
      [EnemyType.BOMBER]: 15,
      [EnemyType.INTERCEPTOR]: 25,
      [EnemyType.SNIPER]: 20,
      [EnemyType.SHIELD]: 10,
      [EnemyType.KAMIKAZE]: 10,
      [EnemyType.SCOUT]: 0
    },
    totalCount: 60,
    spawnInterval: 750,
    maxActive: 20,
    eliteChance: 0.30
  },
  14: {
    weights: {
      [EnemyType.SWARM]: 20,
      [EnemyType.BOMBER]: 10,
      [EnemyType.INTERCEPTOR]: 20,
      [EnemyType.SNIPER]: 20,
      [EnemyType.SHIELD]: 10,
      [EnemyType.KAMIKAZE]: 20,
      [EnemyType.SCOUT]: 0
    },
    totalCount: 65,
    spawnInterval: 700,
    maxActive: 22,
    eliteChance: 0.30
  },
  15: {
    // Boss wave: Ancient Core
    weights: {
      [EnemyType.SCOUT]: 0,
      [EnemyType.SWARM]: 0,
      [EnemyType.INTERCEPTOR]: 0,
      [EnemyType.BOMBER]: 0,
      [EnemyType.KAMIKAZE]: 0,
      [EnemyType.SNIPER]: 0,
      [EnemyType.SHIELD]: 0
    },
    totalCount: 1,
    spawnInterval: 5000,
    maxActive: 1,
    eliteChance: 0.0,
    isBossWave: true,
    bossType: 'CORE'
  }
};

export function getWaveComposition(waveNumber: number): WaveComposition {
  // If waveNumber > 15, scale infinitely by combining weights of wave 14 with rising count and elite chance
  if (waveNumber in WAVE_DEFINITIONS) {
    return WAVE_DEFINITIONS[waveNumber];
  }

  const base = WAVE_DEFINITIONS[14];
  const step = waveNumber - 14;
  return {
    weights: base.weights,
    totalCount: base.totalCount + step * 5,
    spawnInterval: Math.max(500, base.spawnInterval - step * 25),
    maxActive: Math.min(25, base.maxActive + step),
    eliteChance: Math.min(0.5, base.eliteChance + step * 0.02)
  };
}
