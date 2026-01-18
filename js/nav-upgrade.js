/**
 * Premium Navigation Scroll Handler
 * PatientAnalog.com - Enterprise Biotech Navigation System
 */

(function() {
    'use strict';

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', initNavScroll);

    function initNavScroll() {
        const nav = document.querySelector('.sticky-nav');
        const trustBar = document.querySelector('.trust-bar');
        
        if (!nav) return;

        let lastScrollY = 0;
        let ticking = false;

        function updateNavState() {
            const scrollY = window.scrollY || window.pageYOffset;
            
            if (scrollY > 0) {
                nav.classList.add('nav-scrolled');
                document.body.classList.add('scrolled');
            } else {
                nav.classList.remove('nav-scrolled');
                document.body.classList.remove('scrolled');
            }
            
            lastScrollY = scrollY;
            ticking = false;
        }

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(updateNavState);
                ticking = true;
            }
        }

        // Attach scroll listener
        window.addEventListener('scroll', onScroll, { passive: true });

        // Initial state check
        updateNavState();
    }
})();
// v20260117-FULL
