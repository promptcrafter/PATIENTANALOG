/**
 * MOMENTUM SCROLLING - Lenis.js Integration
 * PatientAnalog.com - Premium Visual Component
 * 
 * Adds luxurious, physics-based smooth scrolling that makes the site
 * feel like a high-end mobile app. The scroll has "weight" and momentum,
 * gliding smoothly rather than stopping abruptly.
 * 
 * USAGE:
 * 1. Include Lenis.js from CDN
 * 2. Include this script
 * 3. Smooth scrolling is automatically enabled
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Scroll smoothness (0.05 = very smooth, 0.15 = snappier)
        lerp: 0.08,
        
        // Duration of scroll animations (in seconds)
        duration: 1.2,
        
        // Easing function for scroll animations
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        
        // Wheel multiplier (higher = faster scroll)
        wheelMultiplier: 1,
        
        // Touch multiplier for mobile
        touchMultiplier: 2,
        
        // Infinite scroll (loop back to top)
        infinite: false,
        
        // Scroll orientation
        orientation: 'vertical',
        
        // Gesture orientation
        gestureOrientation: 'vertical',
        
        // Smooth scroll on anchor clicks
        smoothWheel: true,
        
        // Normalize wheel across browsers
        normalizeWheel: true,
        
        // Auto-start
        autoStart: true
    };

    // Custom styles for smooth scroll enhancements
    const SCROLL_STYLES = `
        /* Smooth scroll base styles */
        html.lenis {
            height: auto;
        }
        
        html.lenis, 
        html.lenis body {
            height: auto;
        }
        
        .lenis.lenis-smooth {
            scroll-behavior: auto;
        }
        
        .lenis.lenis-smooth [data-lenis-prevent] {
            overscroll-behavior: contain;
        }
        
        .lenis.lenis-stopped {
            overflow: hidden;
        }
        
        .lenis.lenis-scrolling iframe {
            pointer-events: none;
        }
        
        /* Scroll progress indicator */
        .scroll-progress {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: rgba(0, 8, 20, 0.8);
            z-index: 10000;
            pointer-events: none;
        }
        
        .scroll-progress-bar {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, 
                #0055ff 0%, 
                #00ffc8 50%, 
                #ffaa00 100%
            );
            transition: width 0.1s ease-out;
            box-shadow: 0 0 10px rgba(0, 85, 255, 0.5);
        }
        
        /* Scroll velocity indicator (optional) */
        .scroll-velocity {
            position: fixed;
            right: 20px;
            bottom: 100px;
            width: 4px;
            height: 60px;
            background: rgba(0, 85, 255, 0.1);
            border-radius: 2px;
            z-index: 9999;
            overflow: hidden;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .scroll-velocity.active {
            opacity: 1;
        }
        
        .scroll-velocity-bar {
            position: absolute;
            bottom: 50%;
            left: 0;
            width: 100%;
            height: 0;
            background: linear-gradient(0deg, #0055ff, #00ffc8);
            border-radius: 2px;
            transform-origin: bottom center;
            transition: height 0.1s ease-out;
        }
        
        .scroll-velocity-bar.up {
            bottom: auto;
            top: 50%;
            transform-origin: top center;
            background: linear-gradient(180deg, #ffaa00, #ff6eb4);
        }
        
        /* Parallax sections enhancement */
        [data-scroll-speed] {
            will-change: transform;
        }
        
        /* Reveal animations */
        .scroll-reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        .scroll-reveal.revealed {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Stagger animation for grids */
        .scroll-reveal-stagger > * {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .scroll-reveal-stagger.revealed > *:nth-child(1) { transition-delay: 0s; }
        .scroll-reveal-stagger.revealed > *:nth-child(2) { transition-delay: 0.1s; }
        .scroll-reveal-stagger.revealed > *:nth-child(3) { transition-delay: 0.2s; }
        .scroll-reveal-stagger.revealed > *:nth-child(4) { transition-delay: 0.3s; }
        .scroll-reveal-stagger.revealed > *:nth-child(5) { transition-delay: 0.4s; }
        .scroll-reveal-stagger.revealed > *:nth-child(6) { transition-delay: 0.5s; }
        .scroll-reveal-stagger.revealed > *:nth-child(7) { transition-delay: 0.6s; }
        .scroll-reveal-stagger.revealed > *:nth-child(8) { transition-delay: 0.7s; }
        
        .scroll-reveal-stagger.revealed > * {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            .scroll-reveal,
            .scroll-reveal-stagger > * {
                opacity: 1;
                transform: none;
                transition: none;
            }
            
            html.lenis {
                scroll-behavior: auto;
            }
        }
    `;

    class SmoothScroll {
        constructor() {
            this.lenis = null;
            this.progressBar = null;
            this.velocityIndicator = null;
            this.rafId = null;
            this.isInitialized = false;
            this.scrollCallbacks = [];
        }

        init() {
            // Check for reduced motion preference
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                console.log('Reduced motion preferred. Smooth scrolling disabled.');
                return;
            }

            // Check if Lenis is available
            if (typeof Lenis === 'undefined') {
                console.warn('Lenis not loaded. Attempting to load from CDN...');
                this.loadLenis().then(() => this.setup());
                return;
            }

            this.setup();
        }

        async loadLenis() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/lenis@1.1.13/dist/lenis.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        setup() {
            this.injectStyles();
            this.createProgressBar();
            this.createVelocityIndicator();
            this.initLenis();
            this.setupScrollReveal();
            this.setupAnchorLinks();
            this.isInitialized = true;
            
            console.log('✨ Smooth scrolling initialized');
        }

        injectStyles() {
            const style = document.createElement('style');
            style.id = 'smooth-scroll-styles';
            style.textContent = SCROLL_STYLES;
            document.head.appendChild(style);
        }

        createProgressBar() {
            const progress = document.createElement('div');
            progress.className = 'scroll-progress';
            progress.innerHTML = '<div class="scroll-progress-bar"></div>';
            document.body.appendChild(progress);
            this.progressBar = progress.querySelector('.scroll-progress-bar');
        }

        createVelocityIndicator() {
            const velocity = document.createElement('div');
            velocity.className = 'scroll-velocity';
            velocity.innerHTML = '<div class="scroll-velocity-bar"></div>';
            document.body.appendChild(velocity);
            this.velocityIndicator = velocity;
            this.velocityBar = velocity.querySelector('.scroll-velocity-bar');
        }

        initLenis() {
            this.lenis = new Lenis({
                lerp: CONFIG.lerp,
                duration: CONFIG.duration,
                easing: CONFIG.easing,
                orientation: CONFIG.orientation,
                gestureOrientation: CONFIG.gestureOrientation,
                smoothWheel: CONFIG.smoothWheel,
                normalizeWheel: CONFIG.normalizeWheel,
                wheelMultiplier: CONFIG.wheelMultiplier,
                touchMultiplier: CONFIG.touchMultiplier,
                infinite: CONFIG.infinite
            });

            // Handle scroll events
            this.lenis.on('scroll', (e) => {
                this.onScroll(e);
            });

            // Animation loop
            const raf = (time) => {
                this.lenis.raf(time);
                this.rafId = requestAnimationFrame(raf);
            };
            this.rafId = requestAnimationFrame(raf);
        }

        onScroll(e) {
            const { scroll, limit, velocity, direction, progress } = e;
            
            // Update progress bar
            if (this.progressBar) {
                this.progressBar.style.width = `${progress * 100}%`;
            }
            
            // Update velocity indicator
            if (this.velocityIndicator) {
                const absVelocity = Math.abs(velocity);
                if (absVelocity > 0.1) {
                    this.velocityIndicator.classList.add('active');
                    const height = Math.min(absVelocity * 20, 50);
                    this.velocityBar.style.height = `${height}%`;
                    this.velocityBar.classList.toggle('up', direction === -1);
                } else {
                    this.velocityIndicator.classList.remove('active');
                }
            }
            
            // Call registered callbacks
            this.scrollCallbacks.forEach(cb => cb(e));
        }

        setupScrollReveal() {
            // Add scroll-reveal class to sections
            const sections = document.querySelectorAll('.section:not(.scroll-reveal-initialized)');
            sections.forEach(section => {
                section.classList.add('scroll-reveal', 'scroll-reveal-initialized');
            });
            
            // Add stagger effect to grids
            const grids = document.querySelectorAll('.domain-grid:not(.scroll-reveal-initialized), .programs-grid:not(.scroll-reveal-initialized)');
            grids.forEach(grid => {
                grid.classList.add('scroll-reveal-stagger', 'scroll-reveal-initialized');
            });
            
            // Intersection observer for reveals
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
            
            document.querySelectorAll('.scroll-reveal, .scroll-reveal-stagger').forEach(el => {
                observer.observe(el);
            });
        }

        setupAnchorLinks() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const href = anchor.getAttribute('href');
                    if (href === '#') return;

                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        this.scrollTo(target);
                    }
                });
            });
        }

        // Public API methods
        scrollTo(target, options = {}) {
            // FALLBACK: If Lenis isn't loaded, use native scroll
            if (!this.lenis) {
                const element = typeof target === 'string' ? document.querySelector(target) : target;
                if (element) {
                    const offset = 160; // Match CSS scroll-padding-top
                    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                }
                return;
            }

            const defaults = {
                offset: -160, // Fixed: was -100, should match CSS scroll-padding-top
                duration: CONFIG.duration,
                easing: CONFIG.easing,
                immediate: false
            };

            this.lenis.scrollTo(target, { ...defaults, ...options });
        }

        scrollToTop(options = {}) {
            this.scrollTo(0, options);
        }

        scrollToBottom(options = {}) {
            this.scrollTo('bottom', options);
        }

        stop() {
            if (this.lenis) {
                this.lenis.stop();
            }
        }

        start() {
            if (this.lenis) {
                this.lenis.start();
            }
        }

        destroy() {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
            }
            if (this.lenis) {
                this.lenis.destroy();
            }
            // Remove elements
            document.querySelector('.scroll-progress')?.remove();
            document.querySelector('.scroll-velocity')?.remove();
            document.getElementById('smooth-scroll-styles')?.remove();
            
            this.isInitialized = false;
        }

        onScrollCallback(callback) {
            this.scrollCallbacks.push(callback);
            return () => {
                this.scrollCallbacks = this.scrollCallbacks.filter(cb => cb !== callback);
            };
        }

        // Get current scroll info
        getScroll() {
            if (!this.lenis) return { scroll: 0, progress: 0 };
            return {
                scroll: this.lenis.scroll,
                progress: this.lenis.progress,
                velocity: this.lenis.velocity,
                direction: this.lenis.direction,
                isScrolling: this.lenis.isScrolling
            };
        }
    }

    // Create singleton instance
    const smoothScroll = new SmoothScroll();

    // Expose globally
    window.SmoothScroll = {
        init: () => smoothScroll.init(),
        scrollTo: (target, options) => smoothScroll.scrollTo(target, options),
        scrollToTop: (options) => smoothScroll.scrollToTop(options),
        scrollToBottom: (options) => smoothScroll.scrollToBottom(options),
        stop: () => smoothScroll.stop(),
        start: () => smoothScroll.start(),
        destroy: () => smoothScroll.destroy(),
        onScroll: (cb) => smoothScroll.onScrollCallback(cb),
        getScroll: () => smoothScroll.getScroll(),
        get lenis() { return smoothScroll.lenis; }
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => smoothScroll.init());
    } else {
        smoothScroll.init();
    }

})();

/*
 * ============================================================
 * INSTALLATION
 * ============================================================
 * 
 * Add to your HTML (before </body>):
 * 
 * <!-- Lenis Smooth Scroll -->
 * <script src="https://unpkg.com/lenis@1.1.13/dist/lenis.min.js"></script>
 * <script src="js/smooth-scroll.js"></script>
 * 
 * ============================================================
 * API
 * ============================================================
 * 
 * SmoothScroll.scrollTo('#section')     - Scroll to element
 * SmoothScroll.scrollTo(500)            - Scroll to pixel position
 * SmoothScroll.scrollToTop()            - Scroll to top
 * SmoothScroll.scrollToBottom()         - Scroll to bottom
 * SmoothScroll.stop()                   - Pause scrolling
 * SmoothScroll.start()                  - Resume scrolling
 * SmoothScroll.destroy()                - Remove smooth scroll
 * SmoothScroll.getScroll()              - Get current scroll state
 * 
 * // Callback on scroll
 * const unsubscribe = SmoothScroll.onScroll((e) => {
 *     console.log(e.scroll, e.progress, e.velocity);
 * });
 * unsubscribe(); // Remove callback
 * 
 * ============================================================
 * DATA ATTRIBUTES
 * ============================================================
 * 
 * [data-lenis-prevent]     - Disable smooth scroll on element
 * [data-lenis-prevent-wheel] - Disable wheel smooth scroll
 * [data-lenis-prevent-touch] - Disable touch smooth scroll
 * 
 * ============================================================
 * CSS CLASSES
 * ============================================================
 * 
 * .scroll-reveal           - Fade in on scroll
 * .scroll-reveal-stagger   - Stagger children fade in
 * 
 */
// v20260117-FULL
