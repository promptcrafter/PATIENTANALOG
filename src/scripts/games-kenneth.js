import { KennethGame } from '../games/kenneth/KennethGame.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('kenneth-game-container');
  if (container) {
    // Remove loading state
    container.innerHTML = '';

    // Initialize game
    const game = new KennethGame(container);
    window.kennethGame = game;
  }
});
