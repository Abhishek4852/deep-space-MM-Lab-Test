import { EnemyType } from './EnemyTypes';

export interface EnemyStats {
  type: EnemyType;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  textureKey: string;
  scoreValue: number;
}

export const ENEMY_DEFINITIONS: Record<EnemyType, EnemyStats> = {
  [EnemyType.SCOUT]: {
    type: EnemyType.SCOUT,
    name: 'Scout',
    hp: 20,
    speed: 120,
    damage: 10,
    textureKey: 'enemy_scout',
    scoreValue: 100
  },
  [EnemyType.INTERCEPTOR]: {
    type: EnemyType.INTERCEPTOR,
    name: 'Interceptor',
    hp: 40,
    speed: 220,
    damage: 15,
    textureKey: 'enemy_interceptor',
    scoreValue: 200
  },
  [EnemyType.BOMBER]: {
    type: EnemyType.BOMBER,
    name: 'Bomber',
    hp: 75,
    speed: 80,
    damage: 20,
    textureKey: 'enemy_bomber',
    scoreValue: 300
  },
  [EnemyType.KAMIKAZE]: {
    type: EnemyType.KAMIKAZE,
    name: 'Kamikaze',
    hp: 15,
    speed: 240,
    damage: 30,
    textureKey: 'enemy_kamikaze',
    scoreValue: 150
  },
  [EnemyType.SNIPER]: {
    type: EnemyType.SNIPER,
    name: 'Sniper Drone',
    hp: 35,
    speed: 90,
    damage: 25,
    textureKey: 'enemy_sniper',
    scoreValue: 250
  },
  [EnemyType.SWARM]: {
    type: EnemyType.SWARM,
    name: 'Swarm Drone',
    hp: 8,
    speed: 160,
    damage: 6,
    textureKey: 'enemy_swarm',
    scoreValue: 50
  },
  [EnemyType.SHIELD]: {
    type: EnemyType.SHIELD,
    name: 'Shield Drone',
    hp: 50,
    speed: 100,
    damage: 5,
    textureKey: 'enemy_shield',
    scoreValue: 250
  }
};
