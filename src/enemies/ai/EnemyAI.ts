import { Enemy } from '../Enemy';

export interface EnemyAI {
  update(enemy: Enemy, player: { x: number; y: number }, delta: number): void;
}
