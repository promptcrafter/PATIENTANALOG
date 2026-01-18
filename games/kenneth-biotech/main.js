/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - Main Entry Point (FIXED)
 * Fixed: setupGlobalEvents defined, proper initialization order
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

window.KennethGame = window.KennethGame || {};

(function() {
    const $ = KennethGame.Utils?.$  || ((id) => document.getElementById(id));
    
    let initialized = false;
    
    // ═══════════════════════════════════════════════════════════════════════
    // LOADING SIMULATION
    // ═══════════════════════════════════════════════════════════════════════
    
    const loadingSteps = [
        { percent: 10, text: 'Loading bio-modules...' },
        { percent: 25, text: 'Preparing laboratory...' },
        { percent: 40, text: 'Connecting systems...' },
        { percent: 55, text: 'Calibrating sensors...' },
        { percent: 70, text: 'Initializing audio...' },
        { percent: 85, text: 'Powering up particles...' },
        { percent: 95, text: 'Almost ready...' },
        { percent: 100, text: 'Welcome!' }
    ];
    
    async function simulateLoading() {
        for (const step of loadingSteps) {
            KennethGame.UI?.updateLoadingProgress?.(step.percent, step.text);
            await sleep(200 + Math.random() * 200);
        }
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL EVENTS - FIXED: This was missing!
    // ═══════════════════════════════════════════════════════════════════════
    
    function setupGlobalEvents() {
        console.log('🌐 Setting up global events...');
        
        // Resume audio on first user interaction
        const resumeAudio = () => {
            KennethGame.Audio?.resume?.();
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
        };
        
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const currentScreen = KennethGame.UI?.getCurrentScreen?.();
            
            if (e.key === 'Escape') {
                if (currentScreen === 'game') {
                    KennethGame.GameLogic?.pause?.();
                } else {
                    KennethGame.UI?.hideAllModals?.();
                }
            }
            
            // Tutorial navigation
            if (currentScreen === 'tutorial') {
                if (e.key === 'ArrowRight' || e.key === ' ') {
                    KennethGame.Tutorial?.next?.();
                } else if (e.key === 'ArrowLeft') {
                    KennethGame.Tutorial?.previous?.();
                }
            }
        });
        
        // Prevent context menu in game
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('#game-screen')) {
                e.preventDefault();
            }
        });
        
        // Handle visibility changes (pause when tab hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && KennethGame.UI?.getCurrentScreen?.() === 'game') {
                KennethGame.GameLogic?.pause?.();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', KennethGame.Utils?.debounce?.(() => {
            KennethGame.Renderer?.handleResize?.();
            KennethGame.Particles?.handleResize?.();
        }, 250));
        
        console.log('✅ Global events ready!');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // APPLY SETTINGS
    // ═══════════════════════════════════════════════════════════════════════
    
    function applySettings() {
        const settings = KennethGame.State?.getSettings?.() || {};
        
        // High contrast mode
        if (settings.highContrast) {
            document.documentElement.setAttribute('data-high-contrast', 'true');
        }
        
        // Reduced motion
        if (settings.reducedMotion) {
            document.documentElement.setAttribute('data-reduced-motion', 'true');
        }
        
        // Audio
        if (settings.soundEnabled === false) {
            KennethGame.Audio?.setMasterVolume?.(0);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    async function initialize() {
        if (initialized) return;
        
        console.log('🧬 Starting Kenneth\'s AMAZING Biotech Adventure!');
        console.log('═══════════════════════════════════════════════════════');
        
        try {
            // Initialize UI first (for loading screen)
            KennethGame.UI?.init?.();
            
            // Start loading animation
            const loadingPromise = simulateLoading();
            
            // Initialize all systems
            KennethGame.Audio?.init?.();
            KennethGame.Particles?.init?.();
            KennethGame.Renderer?.init?.();
            KennethGame.GameLogic?.init?.();
            
            // Setup global events
            setupGlobalEvents();
            
            // Apply saved settings
            applySettings();
            
            // Wait for loading animation
            await loadingPromise;
            
            // Update name in loading screen
            const playerName = KennethGame.State?.getPlayerName?.() || 'Kenneth';
            const loadingNameEl = $('loading-name');
            if (loadingNameEl) {
                loadingNameEl.textContent = `${playerName}'s`;
            }
            
            // Short delay for effect
            await sleep(500);
            
            // Check if this is first time (need name entry)
            const hasName = KennethGame.State?.hasPlayerName?.();
            
            if (!hasName) {
                // Show name entry modal
                KennethGame.UI?.showScreen?.('menu');
                KennethGame.UI?.showNameEntry?.();
            } else {
                // Check if tutorial completed
                const tutorialCompleted = KennethGame.State?.getSetting?.('tutorialCompleted');
                
                if (!tutorialCompleted) {
                    KennethGame.UI?.showScreen?.('tutorial');
                    KennethGame.Tutorial?.start?.();
                } else {
                    KennethGame.UI?.showScreen?.('menu');
                }
            }
            
            initialized = true;
            console.log('═══════════════════════════════════════════════════════');
            console.log('✅ Game ready! Let\'s do science!');
            
            // Play welcome sound
            KennethGame.Audio?.playMotif?.();
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            // Show error message
            const loadingText = $('loading-text');
            if (loadingText) {
                loadingText.textContent = 'Oops! Something went wrong. Please refresh.';
                loadingText.style.color = '#ff4466';
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // START THE GAME!
    // ═══════════════════════════════════════════════════════════════════════
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();

console.log('🚀 Main module loaded!');
// v20260117-FULL
