import Phaser from 'phaser';
import { gameConfig } from '@/config/gameConfig';

export class Game extends Phaser.Game {
  constructor() {
    super(gameConfig);
    (window as unknown as { game: Game }).game = this;
  }
}
