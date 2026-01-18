/**
 * PATIENT ANALOG - MOTION SYSTEM
 * Version 1.0 - Cinematic Animation Orchestration
 *
 * Features:
 * - Scroll-driven reveal animations
 * - Staggered element animations
 * - Scroll progress tracking
 * - Performance-optimized with RAF
 * - Reduced motion support
 */

const PAMotionSystem = (function() {
  'use strict';

  // Configuration
  const CONFIG = {
    revealThreshold: 0.1,
    revealRootMargin: '0px 0px -50px 0px',
    staggerDelay: 75,
    scrollProgressUpdateRate: 16, // ~60fps
  };

  // State
  let state = {
    initialized: false,
    reducedMotion: false,
    observers: [],
    scrollProgressElements: [],
    rafId: null,
    lastScrollY: 0,
  };

  /**
   * Check if user prefers reduced motion
   */
  function checkReducedMotion() {
    state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      state.reducedMotion = e.matches;
      if (state.reducedMotion) {
        revealAllImmediately();
      }
    });
  }

  /**
   * Reveal all elements immediately (for reduced motion)
   */
  function revealAllImmediately() {
    document.querySelectorAll('[data-reveal]').forEach(el => {
      el.classList.add('pa-revealed');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  /**
   * Initialize scroll reveal animations
   */
  function initScrollReveal() {
    if (state.reducedMotion) {
      revealAllImmediately();
      return;
    }

    // Create IntersectionObserver for reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.revealDelay || 0;

          setTimeout(() => {
            el.classList.add('pa-revealed');
          }, parseInt(delay, 10));

          // Stop observing once revealed
          revealObserver.unobserve(el);
        }
      });
    }, {
      threshold: CONFIG.revealThreshold,
      rootMargin: CONFIG.revealRootMargin
    });

    // Observe all reveal elements
    document.querySelectorAll('[data-reveal]').forEach(el => {
      // Set initial hidden state
      el.classList.add('pa-reveal');
      revealObserver.observe(el);
    });

    state.observers.push(revealObserver);
  }

  /**
   * Initialize staggered animations for grids
   */
  function initStaggeredAnimations() {
    if (state.reducedMotion) return;

    const staggerContainers = document.querySelectorAll('[data-stagger]');

    staggerContainers.forEach(container => {
      const children = container.children;
      const baseDelay = parseInt(container.dataset.staggerDelay || CONFIG.staggerDelay, 10);

      Array.from(children).forEach((child, index) => {
        child.style.transitionDelay = `${index * baseDelay}ms`;
        child.dataset.revealDelay = index * baseDelay;
      });
    });
  }

  /**
   * Initialize scroll progress tracking
   */
  function initScrollProgress() {
    state.scrollProgressElements = document.querySelectorAll('[data-scroll-progress]');

    if (state.scrollProgressElements.length === 0) return;

    // Throttled scroll handler
    let ticking = false;

    function updateScrollProgress() {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollY / docHeight, 1);

      state.scrollProgressElements.forEach(el => {
        const type = el.dataset.scrollProgress;

        switch (type) {
          case 'bar':
            el.style.transform = `scaleX(${progress})`;
            break;
          case 'percentage':
            el.textContent = `${Math.round(progress * 100)}%`;
            break;
          case 'opacity':
            el.style.opacity = progress;
            break;
          case 'parallax':
            const speed = parseFloat(el.dataset.parallaxSpeed) || 0.5;
            el.style.transform = `translateY(${scrollY * speed}px)`;
            break;
          default:
            el.style.setProperty('--scroll-progress', progress);
        }
      });

      state.lastScrollY = scrollY;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        state.rafId = requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Initial update
    updateScrollProgress();
  }

  /**
   * Animate elements in with stagger
   * @param {NodeList|Array} elements - Elements to animate
   * @param {Object} options - Animation options
   */
  function staggerIn(elements, options = {}) {
    const {
      delay = 0,
      stagger = CONFIG.staggerDelay,
      duration = 600,
      easing = 'cubic-bezier(0.16, 1, 0.3, 1)'
    } = options;

    if (state.reducedMotion) {
      elements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    elements.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;
      el.style.transitionDelay = `${delay + (index * stagger)}ms`;

      // Trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
      });
    });
  }

  /**
   * Animate a single element
   * @param {Element} element - Element to animate
   * @param {Object} options - Animation options
   */
  function animate(element, options = {}) {
    const {
      from = { opacity: 0, transform: 'translateY(20px)' },
      to = { opacity: 1, transform: 'translateY(0)' },
      duration = 600,
      delay = 0,
      easing = 'cubic-bezier(0.16, 1, 0.3, 1)',
      onComplete = null
    } = options;

    if (state.reducedMotion) {
      Object.assign(element.style, to);
      if (onComplete) onComplete();
      return;
    }

    // Set initial state
    Object.assign(element.style, from);
    element.style.transition = `all ${duration}ms ${easing}`;
    element.style.transitionDelay = `${delay}ms`;

    // Trigger animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        Object.assign(element.style, to);

        if (onComplete) {
          setTimeout(onComplete, duration + delay);
        }
      });
    });
  }

  /**
   * Create a parallax effect on element
   * @param {Element} element - Element to apply parallax to
   * @param {number} speed - Parallax speed (0.1 to 1)
   */
  function applyParallax(element, speed = 0.5) {
    if (state.reducedMotion) return;

    element.dataset.scrollProgress = 'parallax';
    element.dataset.parallaxSpeed = speed.toString();
    element.style.willChange = 'transform';
  }

  /**
   * Observe an element for visibility
   * @param {Element} element - Element to observe
   * @param {Function} callback - Callback when visible
   * @param {Object} options - Observer options
   */
  function onVisible(element, callback, options = {}) {
    const {
      threshold = 0.1,
      once = true
    } = options;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
          if (once) {
            observer.unobserve(entry.target);
          }
        }
      });
    }, { threshold });

    observer.observe(element);
    state.observers.push(observer);

    return () => observer.unobserve(element);
  }

  /**
   * Clean up and destroy
   */
  function destroy() {
    // Cancel any pending RAF
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }

    // Disconnect all observers
    state.observers.forEach(observer => observer.disconnect());
    state.observers = [];

    // Reset state
    state.initialized = false;
  }

  /**
   * Initialize the motion system
   */
  function init() {
    if (state.initialized) return;

    // Check for reduced motion preference
    checkReducedMotion();

    // Initialize features
    initScrollReveal();
    initStaggeredAnimations();
    initScrollProgress();

    state.initialized = true;

    console.log('[PAMotionSystem] Initialized', {
      reducedMotion: state.reducedMotion,
      revealElements: document.querySelectorAll('[data-reveal]').length,
      staggerContainers: document.querySelectorAll('[data-stagger]').length
    });
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    init,
    destroy,
    staggerIn,
    animate,
    applyParallax,
    onVisible,
    isReducedMotion: () => state.reducedMotion
  };

})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PAMotionSystem;
}
// v20260117-FULL
