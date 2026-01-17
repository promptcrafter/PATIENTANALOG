/**
 * Living Effects - ULTRA HDR Animated background effects for Patient Analog
 * Include this script and call: LivingEffects.init('theme-name')
 * Themes: cyan, green, gold, purple, red, teal, orange
 */

// Z-INDEX ISOLATION WRAPPER - Effects visible but below nav AND above ticker
const __particleContainer = document.createElement('div');
__particleContainer.id = 'isolated-particles-container';
__particleContainer.style.cssText = `
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: calc(100% - 120px) !important;
  bottom: 120px !important;
  z-index: 0 !important;
  pointer-events: none !important;
  overflow: hidden !important;
`;
document.body.appendChild(__particleContainer);

// REDIRECT: All particle creation goes here, not body
const __originalAppendChild = Element.prototype.appendChild;
Element.prototype.appendChild = function(element) {
  if (element.classList &&
      (element.classList.contains('deep-particles') ||
       element.classList.contains('space-nebula') ||
       element.classList.contains('space-stars') ||
       element.classList.contains('deep-particle') ||
       element.classList.contains('living-effects-container') ||
       element.classList.contains('global-hdr-overlay'))) {
    return __particleContainer.appendChild(element);
  }
  return __originalAppendChild.call(this, element);
};

const LivingEffects = {
  // Track created elements for cleanup
  _container: null,
  _hdrOverlay: null,
  _styleElement: null,
  _initialized: false,

  themes: {
    cyan: {
      primary: 'rgba(0,255,255,',
      secondary: 'rgba(0,255,200,',
      accent: 'rgba(255,180,40,',
      glow: '#00ffff',
      hdr: 'rgba(100,220,255,'
    },
    green: {
      primary: 'rgba(0,255,136,',
      secondary: 'rgba(100,255,100,',
      accent: 'rgba(180,255,0,',
      glow: '#00ff88',
      hdr: 'rgba(120,255,150,'
    },
    gold: {
      primary: 'rgba(255,200,50,',
      secondary: 'rgba(255,220,100,',
      accent: 'rgba(255,120,0,',
      glow: '#ffc832',
      hdr: 'rgba(255,230,100,'
    },
    purple: {
      primary: 'rgba(200,120,255,',
      secondary: 'rgba(160,100,220,',
      accent: 'rgba(255,120,220,',
      glow: '#c878ff',
      hdr: 'rgba(220,150,255,'
    },
    red: {
      primary: 'rgba(255,100,100,',
      secondary: 'rgba(255,80,80,',
      accent: 'rgba(255,180,80,',
      glow: '#ff6464',
      hdr: 'rgba(255,130,130,'
    },
    teal: {
      primary: 'rgba(0,220,220,',
      secondary: 'rgba(0,180,180,',
      accent: 'rgba(0,255,220,',
      glow: '#00dcdc',
      hdr: 'rgba(80,240,240,'
    },
    orange: {
      primary: 'rgba(255,160,0,',
      secondary: 'rgba(255,120,60,',
      accent: 'rgba(255,220,0,',
      glow: '#ffa000',
      hdr: 'rgba(255,200,80,'
    }
  },

  init: function(themeName, targetSelector) {
    // Prevent duplicate initialization - cleanup first if already initialized
    if (this._initialized) {
      this.destroy();
    }

    const theme = this.themes[themeName] || this.themes.cyan;
    const target = document.querySelector(targetSelector || 'main') || document.body;

    // Create effects container - stops above ticker (120px from bottom for compact 3-row ticker)
    const container = document.createElement('div');
    container.className = 'living-effects-container';
    container.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:120px;pointer-events:none;z-index:0;overflow:hidden;';

    // Add all effect layers
    container.innerHTML = this.createEffects(theme, themeName);

    // Insert at beginning of target
    if (target.firstChild) {
      target.insertBefore(container, target.firstChild);
    } else {
      target.appendChild(container);
    }

    // Track container for cleanup
    this._container = container;

    // Add keyframe animations
    this.addAnimations(themeName);

    // Add floating particles
    this.addParticles(container, theme);

    // Add HDR bloom effect to body
    this.addHDRBloom(theme);

    this._initialized = true;
  },

  createEffects: function(theme, themeName) {
    return `
      <!-- ULTRA HDR Base Glow -->
      <div class="le-hdr-base le-${themeName}" style="position:absolute;inset:0;
        background:radial-gradient(ellipse 120% 80% at 50% 20%, ${theme.hdr}0.2) 0%, ${theme.primary}0.1) 40%, transparent 70%);
        mix-blend-mode:screen;
        animation:leHDRPulse-${themeName} 5s ease-in-out infinite;"></div>

      <!-- Digital Grid - INTENSE -->
      <div class="le-grid le-${themeName}" style="position:absolute;inset:0;
        background-image:
          linear-gradient(${theme.primary}0.25) 1px, transparent 1px),
          linear-gradient(90deg, ${theme.primary}0.25) 1px, transparent 1px);
        background-size:50px 50px;
        opacity:0.5;
        animation:leGridPulse-${themeName} 6s ease-in-out infinite;"></div>

      <!-- HDR Radial Glow - BRIGHT -->
      <div class="le-glow le-${themeName}" style="position:absolute;inset:0;
        background:radial-gradient(ellipse 100% 60% at 50% 25%, ${theme.hdr}0.25) 0%, ${theme.primary}0.15) 35%, transparent 65%);
        mix-blend-mode:screen;
        animation:leGlowPulse-${themeName} 4s ease-in-out infinite;"></div>

      <!-- Ultra Shimmer - VIVID -->
      <div class="le-shimmer le-${themeName}" style="position:absolute;inset:0;
        background:
          radial-gradient(circle at 85% 15%, ${theme.accent}0.4) 0%, transparent 25%),
          radial-gradient(circle at 15% 85%, ${theme.accent}0.35) 0%, transparent 20%),
          radial-gradient(circle at 70% 70%, ${theme.secondary}0.25) 0%, transparent 30%),
          radial-gradient(circle at 30% 30%, ${theme.hdr}0.2) 0%, transparent 35%);
        mix-blend-mode:screen;
        animation:leShimmer-${themeName} 7s ease-in-out infinite;"></div>

      <!-- HDR Color Waves -->
      <div class="le-waves le-${themeName}" style="position:absolute;inset:0;
        background:linear-gradient(180deg, ${theme.hdr}0.15) 0%, transparent 20%, transparent 80%, ${theme.accent}0.1) 100%);
        animation:leWaves-${themeName} 8s ease-in-out infinite;"></div>

      <!-- Scan Line - BRIGHT -->
      <div class="le-scanline le-${themeName}" style="position:absolute;inset:0;overflow:hidden;">
        <div style="position:absolute;width:100%;height:3px;
          background:linear-gradient(90deg, transparent 0%, ${theme.hdr}0.9) 50%, transparent 100%);
          box-shadow:0 0 30px ${theme.glow}, 0 0 60px ${theme.glow}80, 0 0 90px ${theme.glow}40;
          animation:leScanLine-${themeName} 8s linear infinite;"></div>
      </div>

      <!-- Corner Accents - VIVID -->
      <div class="le-corners le-${themeName}" style="position:absolute;inset:0;
        background:
          radial-gradient(circle at 0% 0%, ${theme.hdr}0.2) 0%, transparent 25%),
          radial-gradient(circle at 100% 0%, ${theme.secondary}0.15) 0%, transparent 20%),
          radial-gradient(circle at 100% 100%, ${theme.hdr}0.2) 0%, transparent 25%),
          radial-gradient(circle at 0% 100%, ${theme.accent}0.15) 0%, transparent 20%);
        animation:leCorners-${themeName} 10s ease-in-out infinite;"></div>

      <!-- HDR Edge Bloom -->
      <div class="le-edge-bloom le-${themeName}" style="position:absolute;inset:0;
        box-shadow:inset 0 0 100px ${theme.primary}0.15), inset 0 0 200px ${theme.hdr}0.1);
        animation:leEdgeBloom-${themeName} 6s ease-in-out infinite;"></div>

      <!-- Soft Vignette -->
      <div class="le-vignette" style="position:absolute;inset:0;
        background:radial-gradient(ellipse 75% 55% at 50% 50%, transparent 0%, rgba(5,8,16,0.35) 100%);"></div>
    `;
  },

  addAnimations: function(themeName) {
    // Remove existing style if present
    const existingStyle = document.getElementById(`le-animations-${themeName}`);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = `le-animations-${themeName}`;
    this._styleElement = style;
    style.textContent = `
      @keyframes leHDRPulse-${themeName} {
        0%, 100% { opacity: 0.7; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.03); }
      }
      @keyframes leGridPulse-${themeName} {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.7; }
      }
      @keyframes leGlowPulse-${themeName} {
        0%, 100% { opacity: 0.9; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.04); }
      }
      @keyframes leShimmer-${themeName} {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      @keyframes leWaves-${themeName} {
        0%, 100% { opacity: 0.5; transform: translateY(0); }
        50% { opacity: 0.8; transform: translateY(-10px); }
      }
      @keyframes leScanLine-${themeName} {
        0% { top: -5px; opacity: 0; }
        5% { opacity: 1; }
        95% { opacity: 1; }
        100% { top: 100%; opacity: 0; }
      }
      @keyframes leCorners-${themeName} {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
      @keyframes leEdgeBloom-${themeName} {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      @keyframes leFloat {
        0%, 100% { transform: translateY(0) translateX(0); }
        25% { transform: translateY(-15px) translateX(8px); }
        50% { transform: translateY(-8px) translateX(-8px); }
        75% { transform: translateY(-20px) translateX(5px); }
      }
      @keyframes leHDRBodyPulse {
        0%, 100% { filter: brightness(1) saturate(1); }
        50% { filter: brightness(1.05) saturate(1.1); }
      }

      /* HDR enhancement for page content */
      body.hdr-enhanced main,
      body.hdr-enhanced .main-content {
        filter: contrast(1.05) saturate(1.1);
      }

      /* Reduce effects on mobile */
      @media (max-width: 768px) {
        .living-effects-container {
          opacity: 0.4 !important;
        }
        .le-scanline, .le-shimmer, .le-waves {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  },

  addParticles: function(container, theme) {
    const particleCount = window.innerWidth > 768 ? 20 : 8;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 5 + 3;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const duration = Math.random() * 8 + 8;
      const delay = Math.random() * 5;
      const color = Math.random() > 0.3 ? theme.hdr : theme.accent;

      particle.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color}0.9);
        border-radius: 50%;
        box-shadow: 0 0 ${size * 3}px ${color}0.8), 0 0 ${size * 6}px ${color}0.4);
        animation: leFloat ${duration}s ease-in-out ${delay}s infinite;
        pointer-events: none;
      `;
      container.appendChild(particle);
    }
  },

  addHDRBloom: function(theme) {
    // Remove existing overlay if present
    const existingOverlay = document.querySelector('.global-hdr-overlay');
    if (existingOverlay) existingOverlay.remove();

    // Add HDR class to body
    document.body.classList.add('hdr-enhanced');

    // Add global HDR overlay - stops above ticker (120px for compact 3-row ticker)
    const hdrOverlay = document.createElement('div');
    hdrOverlay.className = 'global-hdr-overlay';
    hdrOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 120px;
      pointer-events: none;
      z-index: -1;
      background: radial-gradient(ellipse 100% 60% at 50% 0%, ${theme.hdr}0.08) 0%, transparent 60%),
                  radial-gradient(ellipse 100% 60% at 50% 100%, ${theme.accent}0.05) 0%, transparent 60%);
      mix-blend-mode: screen;
      animation: leHDRBodyPulse 8s ease-in-out infinite;
    `;
    document.body.appendChild(hdrOverlay);
    this._hdrOverlay = hdrOverlay;
  },

  // Cleanup/destroy method to prevent memory leaks
  destroy: function() {
    // Remove effects container and all particles
    if (this._container) {
      this._container.remove();
      this._container = null;
    }

    // Remove HDR overlay
    if (this._hdrOverlay) {
      this._hdrOverlay.remove();
      this._hdrOverlay = null;
    }

    // Also query and remove in case references were lost
    const container = document.querySelector('.living-effects-container');
    if (container) container.remove();

    const overlay = document.querySelector('.global-hdr-overlay');
    if (overlay) overlay.remove();

    // Remove style elements
    if (this._styleElement) {
      this._styleElement.remove();
      this._styleElement = null;
    }

    // Remove all theme animation styles
    document.querySelectorAll('[id^="le-animations-"]').forEach(el => el.remove());

    // Remove HDR class from body
    document.body.classList.remove('hdr-enhanced');

    this._initialized = false;
    console.log('[LivingEffects] Destroyed and cleaned up');
  },

  // Quick init based on page path
  autoInit: function() {
    const path = window.location.pathname.toLowerCase();
    let theme = 'cyan';

    if (path.includes('game') || path.includes('biolab') || path.includes('simulation')) {
      theme = 'green';
    } else if (path.includes('news')) {
      theme = 'orange';
    } else if (path.includes('science') || path.includes('research')) {
      theme = 'purple';
    } else if (path.includes('tech')) {
      theme = 'cyan';
    } else if (path.includes('compan')) {
      theme = 'teal';
    } else if (path.includes('regulat') || path.includes('fda')) {
      theme = 'red';
    } else if (path.includes('market') || path.includes('portfolio')) {
      theme = 'gold';
    } else if (path.includes('glossary') || path.includes('platform')) {
      theme = 'purple';
    }

    this.init(theme);
  }
};

// Auto-initialize on DOM ready if data attribute present
document.addEventListener('DOMContentLoaded', function() {
  const autoInit = document.querySelector('[data-living-effects]');
  if (autoInit) {
    const theme = autoInit.getAttribute('data-living-effects') || 'auto';
    if (theme === 'auto') {
      LivingEffects.autoInit();
    } else {
      LivingEffects.init(theme);
    }
  }
});

// Cleanup on page unload to prevent memory leaks
window.addEventListener('beforeunload', function() {
  LivingEffects.destroy();
});
window.addEventListener('pagehide', function() {
  LivingEffects.destroy();
});
