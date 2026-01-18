// Home page specific animations only
// Heavy effects moved to main.js or disabled for performance

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Patient Analog] Home page loaded');

  // QuantumCursor - now loaded in main.js for all pages
  // SelfReplicatingBackground - DISABLED for performance
  // SimpleStars - loaded in main.js

  // Initialize hero animations only
  initHeroAnimations();
});

function initHeroAnimations() {
  const heroContent = document.querySelector('.hero-content');
  if (!heroContent) return;

  // Fade in hero content
  heroContent.style.opacity = '0';
  heroContent.style.transform = 'translateY(30px)';

  requestAnimationFrame(() => {
    heroContent.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
    heroContent.style.opacity = '1';
    heroContent.style.transform = 'translateY(0)';
  });
}
// v20260117-FULL
