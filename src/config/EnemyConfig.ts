export enum EnemyType {
  SCOUT = 'SCOUT',
  FIGHTER = 'FIGHTER',
  TANK = 'TANK',
  SNIPER = 'SNIPER',
  KAMIKAZE = 'KAMIKAZE'
}

export interface EnemyStats {
  name: string;
  hp: number;
  speed: number;
  damage: number;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyStats> = {
  [EnemyType.SCOUT]: {
    name: 'Scout',
    hp: 20,
    speed: 120,
    damage: 10
  },
  [EnemyType.FIGHTER]: {
    name: 'Fighter',
    hp: 40,
    speed: 100,
    damage: 15
  },
  [EnemyType.TANK]: {
    name: 'Tank',
    hp: 100,
    speed: 60,
    damage: 25
  },
  [EnemyType.SNIPER]: {
    name: 'Sniper',
    hp: 30,
    speed: 80,
    damage: 20
  },
  [EnemyType.KAMIKAZE]: {
    name: 'Kamikaze',
    hp: 15,
    speed: 200,
    damage: 30
  }
};
