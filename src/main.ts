import './style.css';
import { Game } from '@/core/Game';

// Start the game once resources load
window.addEventListener('load', () => {
  new Game();
});
