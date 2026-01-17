import { BioForgeGame } from '../games/bioforge/BioForgeGame.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('bioforge-game-container');
  if (container) {
    // Remove loading state
    container.innerHTML = '';

    // Initialize game
    const game = new BioForgeGame(container);
    window.bioforgeGame = game;
  }

  // Update progress tracker
  updateProgressTracker();
});

function updateProgressTracker() {
  const tracker = document.getElementById('progress-tracker');
  if (!tracker) return;

  const progress = JSON.parse(localStorage.getItem('bioforge_progress') || '{}');
  const labs = ['crispr', 'protein', 'drug', 'cart', 'stem', 'epidemic'];
  const completed = labs.filter(id => progress[id]?.completed).length;

  tracker.innerHTML = `
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${(completed / labs.length) * 100}%"></div>
    </div>
    <p class="text-secondary">${completed} of ${labs.length} labs completed</p>
  `;
}
