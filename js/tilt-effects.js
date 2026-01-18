/**
 * 3D TILT EFFECTS - VanillaTilt.js Integration
 * PatientAnalog.com - Premium Visual Component
 * 
 * USAGE: 
 * 1. Include VanillaTilt.js from CDN (see bottom of file)
 * 2. Include this script after VanillaTilt.js
 * 3. Add class "tilt-card" to any element you want to tilt
 * 
 * The script auto-initializes on DOM ready and applies premium
 * 3D tilt effects to domain cards, program cards, and any
 * element with the "tilt-card" class.
 */

(function() {
    'use strict';

    // Configuration presets for different card types
    const TILT_PRESETS = {
        // Premium domain cards - dramatic tilt with glare
        domainCard: {
            max: 15,                    // Max tilt rotation (degrees)
            speed: 400,                 // Speed of enter/exit transition
            glare: true,                // Enable glare effect
            "max-glare": 0.3,           // Max glare opacity
            scale: 1.05,                // Scale on hover
            perspective: 1000,          // Transform perspective
            transition: true,           // Smooth transition on enter/leave
            axis: null,                 // Both axes
            reset: true,                // Reset on mouse leave
            easing: "cubic-bezier(.03,.98,.52,.99)",
            gyroscope: true,            // Enable on mobile
            gyroscopeMinAngleX: -45,
            gyroscopeMaxAngleX: 45,
            gyroscopeMinAngleY: -45,
            gyroscopeMaxAngleY: 45
        },
        
        // Program cards - subtle tilt
        programCard: {
            max: 10,
            speed: 500,
            glare: true,
            "max-glare": 0.2,
            scale: 1.03,
            perspective: 1200,
            transition: true,
            reset: true,
            easing: "cubic-bezier(.03,.98,.52,.99)"
        },
        
        // Hero elements - very subtle
        heroElement: {
            max: 5,
            speed: 800,
            glare: false,
            scale: 1.02,
            perspective: 1500,
            transition: true,
            reset: true
        },
        
        // Stats cards - medium effect
        statsCard: {
            max: 12,
            speed: 400,
            glare: true,
            "max-glare": 0.25,
            scale: 1.04,
            perspective: 1100,
            transition: true,
            reset: true
        }
    };

    // Custom CSS for tilt cards
    const TILT_STYLES = `
        /* Base tilt card styles */
        .tilt-card {
            transform-style: preserve-3d;
            will-change: transform;
        }
        
        /* Inner content transform for parallax depth */
        .tilt-card .tilt-inner {
            transform: translateZ(30px);
            transition: transform 0.3s ease;
        }
        
        .tilt-card:hover .tilt-inner {
            transform: translateZ(50px);
        }
        
        /* Domain card specific enhancements */
        .domain-card.tilt-card {
            transition: box-shadow 0.3s ease;
        }
        
        .domain-card.tilt-card:hover {
            box-shadow: 
                0 25px 50px rgba(0,0,0,0.3),
                0 0 30px rgba(0,212,255,0.2),
                inset 0 0 30px rgba(0,212,255,0.05);
        }
        
        /* Glare customization */
        .js-tilt-glare {
            border-radius: inherit;
        }
        
        .js-tilt-glare-inner {
            background: linear-gradient(
                135deg,
                rgba(255,255,255,0.4) 0%,
                rgba(255,255,255,0.1) 40%,
                rgba(0,212,255,0.1) 60%,
                transparent 100%
            ) !important;
        }
        
        /* Program card glare */
        .program-card .js-tilt-glare-inner {
            background: linear-gradient(
                135deg,
                rgba(0,212,255,0.3) 0%,
                rgba(255,255,255,0.1) 50%,
                transparent 100%
            ) !important;
        }
        
        /* Card content depth layers */
        .tilt-card .card-category {
            transform: translateZ(20px);
        }
        
        .tilt-card .card-domain {
            transform: translateZ(40px);
        }
        
        .tilt-card .card-description {
            transform: translateZ(25px);
        }
        
        .tilt-card .card-cta {
            transform: translateZ(50px);
        }
        
        /* Floating badge effect */
        .tilt-card .value-badge {
            transform: translateZ(60px);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .tilt-card:hover .value-badge {
            box-shadow: 0 10px 20px rgba(0,212,255,0.3);
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            .tilt-card,
            .tilt-card * {
                transform: none !important;
                transition: none !important;
            }
        }
    `;

    // Inject styles
    function injectStyles() {
        const styleEl = document.createElement('style');
        styleEl.id = 'tilt-effects-styles';
        styleEl.textContent = TILT_STYLES;
        document.head.appendChild(styleEl);
    }

    // Initialize tilt on specific elements
    function initTiltEffects() {
        // Check if VanillaTilt is loaded
        if (typeof VanillaTilt === 'undefined') {
            console.warn('VanillaTilt.js not loaded. 3D tilt effects disabled.');
            return;
        }

        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            console.log('Reduced motion preferred. Tilt effects disabled.');
            return;
        }

        // Initialize domain cards
        const domainCards = document.querySelectorAll('.domain-card:not(.tilt-initialized)');
        domainCards.forEach(card => {
            card.classList.add('tilt-card', 'tilt-initialized');
            VanillaTilt.init(card, TILT_PRESETS.domainCard);
        });
        console.log(`Initialized tilt on ${domainCards.length} domain cards`);

        // Initialize program cards
        const programCards = document.querySelectorAll('.program-card:not(.tilt-initialized)');
        programCards.forEach(card => {
            card.classList.add('tilt-card', 'tilt-initialized');
            VanillaTilt.init(card, TILT_PRESETS.programCard);
        });
        console.log(`Initialized tilt on ${programCards.length} program cards`);

        // Initialize stats items
        const statsItems = document.querySelectorAll('.stat-item:not(.tilt-initialized)');
        statsItems.forEach(item => {
            item.classList.add('tilt-card', 'tilt-initialized');
            VanillaTilt.init(item, TILT_PRESETS.statsCard);
        });

        // Initialize any element with tilt-card class
        const customTiltCards = document.querySelectorAll('.tilt-card:not(.tilt-initialized)');
        customTiltCards.forEach(card => {
            card.classList.add('tilt-initialized');
            // Determine preset based on data attribute or default
            const preset = card.dataset.tiltPreset || 'domainCard';
            VanillaTilt.init(card, TILT_PRESETS[preset] || TILT_PRESETS.domainCard);
        });

        // Initialize glossary items
        const glossaryItems = document.querySelectorAll('.glossary-item:not(.tilt-initialized)');
        glossaryItems.forEach(item => {
            item.classList.add('tilt-card', 'tilt-initialized');
            VanillaTilt.init(item, TILT_PRESETS.programCard);
        });
    }

    // Refresh tilt effects (useful after dynamic content loads)
    function refreshTiltEffects() {
        initTiltEffects();
    }

    // Destroy all tilt effects
    function destroyTiltEffects() {
        const tiltElements = document.querySelectorAll('.tilt-initialized');
        tiltElements.forEach(el => {
            if (el.vanillaTilt) {
                el.vanillaTilt.destroy();
            }
            el.classList.remove('tilt-card', 'tilt-initialized');
        });
    }

    // Initialize on DOM ready
    function init() {
        injectStyles();
        
        // Wait for VanillaTilt to be available
        if (typeof VanillaTilt !== 'undefined') {
            initTiltEffects();
        } else {
            // Retry after a short delay (in case script loads async)
            setTimeout(() => {
                if (typeof VanillaTilt !== 'undefined') {
                    initTiltEffects();
                }
            }, 500);
        }

        // Re-initialize on dynamic content changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    setTimeout(refreshTiltEffects, 100);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Expose functions globally
    window.TiltEffects = {
        init: initTiltEffects,
        refresh: refreshTiltEffects,
        destroy: destroyTiltEffects,
        presets: TILT_PRESETS
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

/*
 * ============================================================
 * INSTALLATION INSTRUCTIONS
 * ============================================================
 * 
 * Add these script tags to your HTML (before </body>):
 * 
 * <!-- VanillaTilt.js CDN -->
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.8.1/vanilla-tilt.min.js"></script>
 * 
 * <!-- This file -->
 * <script src="js/tilt-effects.js"></script>
 * 
 * ============================================================
 * USAGE
 * ============================================================
 * 
 * Auto-applied to:
 * - .domain-card
 * - .program-card
 * - .stat-item
 * - .glossary-item
 * - Any element with .tilt-card class
 * 
 * Custom presets via data attribute:
 * <div class="tilt-card" data-tilt-preset="heroElement">...</div>
 * 
 * Available presets: domainCard, programCard, heroElement, statsCard
 * 
 * Manual control:
 * TiltEffects.refresh()  - Reinitialize after adding new cards
 * TiltEffects.destroy()  - Remove all tilt effects
 * 
 */
// v20260117-FULL
