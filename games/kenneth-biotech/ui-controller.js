/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - UI Controller (FIXED)
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

KennethGame.UI = (function() {
    const Utils = KennethGame.Utils;
    const $ = Utils.$;
    
    let currentScreen = 'loading';
    
    // ═══════════════════════════════════════════════════════════════════════
    // SCREEN MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    function showScreen(screenId) {
        console.log(`📺 Switching to: ${screenId}`);
        
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const target = $(`${screenId}-screen`);
        if (target) {
            target.classList.add('active');
            currentScreen = screenId;
            
            // Screen-specific setup
            if (screenId === 'menu') {
                updateMenuUI();
            }
        }
        
        // Hide loading screen permanently once we leave it
        if (screenId !== 'loading') {
            const loading = $('loading-screen');
            if (loading) {
                loading.style.display = 'none';
            }
        }
        
        KennethGame.Audio?.playClick?.();
    }
    
    function getCurrentScreen() {
        return currentScreen;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // MENU UI
    // ═══════════════════════════════════════════════════════════════════════
    
    function updateMenuUI() {
        const name = KennethGame.State?.getPlayerName?.() || 'Kenneth';
        const level = KennethGame.State?.getLevel?.() || 1;
        const title = KennethGame.State?.getTitle?.() || { title: 'Lab Assistant', emoji: '🔬' };
        
        // Update name displays
        const menuName = $('menu-name');
        if (menuName) menuName.textContent = `${name}'s`;
        
        const displayName = $('player-display-name');
        if (displayName) displayName.textContent = `${title.emoji} ${name}`;
        
        const levelBadge = $('menu-level-badge');
        if (levelBadge) levelBadge.textContent = level;
        
        const playerTitle = $('menu-player-title');
        if (playerTitle) playerTitle.textContent = title.title;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // MODALS
    // ═══════════════════════════════════════════════════════════════════════
    
    function showModal(modalId) {
        const modal = $(modalId);
        if (modal) {
            modal.classList.add('active');
            KennethGame.Audio?.playClick?.();
        }
    }
    
    function hideModal(modalId) {
        const modal = $(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    function hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // NAME ENTRY
    // ═══════════════════════════════════════════════════════════════════════
    
    function showNameEntry() {
        showModal('name-modal');
        const input = $('player-name-input');
        if (input) {
            input.value = '';
            input.focus();
        }
    }
    
    function submitName() {
        const input = $('player-name-input');
        if (!input) return;
        
        let name = input.value.trim();
        if (name.length === 0) {
            name = 'Kenneth';
        }
        
        KennethGame.State?.setPlayerName?.(name);
        hideModal('name-modal');
        
        // Update all name displays
        updateAllNameDisplays(name);
        
        // Check if tutorial needed
        const tutorialCompleted = KennethGame.State?.getSetting?.('tutorialCompleted');
        if (!tutorialCompleted) {
            showScreen('tutorial');
            KennethGame.Tutorial?.start?.();
        } else {
            showScreen('menu');
        }
        
        KennethGame.Audio?.playMotif?.();
    }
    
    function updateAllNameDisplays(name) {
        // Loading screen
        const loadingName = $('loading-name');
        if (loadingName) loadingName.textContent = `${name}'s`;
        
        // Menu screen
        const menuName = $('menu-name');
        if (menuName) menuName.textContent = `${name}'s`;
        
        const displayName = $('player-display-name');
        if (displayName) {
            const title = KennethGame.State?.getTitle?.() || { emoji: '🔬' };
            displayName.textContent = `${title.emoji} ${name}`;
        }
        
        // Game title
        document.title = `🧬 ${name}'s AMAZING Biotech Adventure! 🚀`;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // LEVEL COMPLETE
    // ═══════════════════════════════════════════════════════════════════════
    
    function showLevelComplete(result) {
        const { score, stars, timeBonus, connections, xpGained, leveledUp, newLevel } = result;
        
        // Update modal content
        const scoreEl = $('final-score');
        if (scoreEl) scoreEl.textContent = Utils.formatNumber(score);
        
        const timeBonusEl = $('final-time-bonus');
        if (timeBonusEl) timeBonusEl.textContent = `+${timeBonus}`;
        
        const connectionsEl = $('final-connections');
        if (connectionsEl) connectionsEl.textContent = connections;
        
        const xpEl = $('xp-earned');
        if (xpEl) xpEl.textContent = `+${xpGained} XP`;
        
        // Animate stars
        const starsDisplay = $('stars-display');
        if (starsDisplay) {
            const starEls = starsDisplay.querySelectorAll('.star');
            starEls.forEach((star, i) => {
                star.classList.remove('earned');
                if (i < stars) {
                    setTimeout(() => {
                        star.classList.add('earned');
                        KennethGame.Audio?.playStar?.();
                    }, 300 + i * 400);
                }
            });
        }
        
        // Set message
        const messageEl = $('complete-message');
        if (messageEl) {
            const messages = KennethGame.CONSTANTS?.ENCOURAGEMENT?.[stars === 3 ? 'onThreeStars' : 'onLevelComplete'] || ['Great job!'];
            messageEl.textContent = Utils.randomItem(messages);
        }
        
        showModal('complete-modal');
        
        KennethGame.Audio?.playSuccess?.();
        KennethGame.Particles?.emitConfetti?.(window.innerWidth / 2, window.innerHeight / 2);
        window.bobCelebrate?.();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // GAME OVER
    // ═══════════════════════════════════════════════════════════════════════
    
    function showGameOver(score, target) {
        const scoreEl = $('gameover-score');
        if (scoreEl) scoreEl.textContent = Utils.formatNumber(score);
        
        const targetEl = $('gameover-target');
        if (targetEl) targetEl.textContent = Utils.formatNumber(target);
        
        const tipEl = $('gameover-tip');
        if (tipEl) tipEl.textContent = `💡 Tip: ${Utils.getRandomTip()}`;
        
        showModal('gameover-modal');
        KennethGame.Audio?.playTimeUp?.();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PAUSE
    // ═══════════════════════════════════════════════════════════════════════
    
    function showPause(score, timeRemaining) {
        const scoreEl = $('pause-score');
        if (scoreEl) scoreEl.textContent = Utils.formatNumber(score);
        
        const timeEl = $('pause-time');
        if (timeEl) timeEl.textContent = Utils.formatTime(timeRemaining);
        
        showModal('pause-modal');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // LOADING PROGRESS
    // ═══════════════════════════════════════════════════════════════════════
    
    function updateLoadingProgress(percent, text) {
        const bar = $('loading-progress');
        if (bar) bar.style.width = `${percent}%`;
        
        const textEl = $('loading-text');
        if (textEl) textEl.textContent = text;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    function init() {
        console.log('🎨 Initializing UI...');
        
        // Menu buttons
        $('btn-play')?.addEventListener('click', () => {
            KennethGame.GameLogic?.startLevel?.('1-1');
            showScreen('game');
        });
        
        $('btn-tutorial')?.addEventListener('click', () => {
            showScreen('tutorial');
            KennethGame.Tutorial?.start?.();
        });
        
        $('btn-sandbox')?.addEventListener('click', () => {
            KennethGame.GameLogic?.startSandbox?.();
            showScreen('game');
        });
        
        // Name entry
        $('submit-name')?.addEventListener('click', submitName);
        $('player-name-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitName();
        });
        
        // Pause modal
        $('btn-pause')?.addEventListener('click', () => {
            KennethGame.GameLogic?.pause?.();
        });
        
        $('pause-resume')?.addEventListener('click', () => {
            hideModal('pause-modal');
            KennethGame.GameLogic?.resume?.();
        });
        
        $('pause-restart')?.addEventListener('click', () => {
            hideModal('pause-modal');
            KennethGame.GameLogic?.restartLevel?.();
        });
        
        $('pause-quit')?.addEventListener('click', () => {
            hideModal('pause-modal');
            KennethGame.GameLogic?.quitToMenu?.();
            showScreen('menu');
        });
        
        // Complete modal
        $('complete-next')?.addEventListener('click', () => {
            hideModal('complete-modal');
            KennethGame.GameLogic?.nextLevel?.();
        });
        
        $('complete-retry')?.addEventListener('click', () => {
            hideModal('complete-modal');
            KennethGame.GameLogic?.restartLevel?.();
        });
        
        $('complete-menu')?.addEventListener('click', () => {
            hideModal('complete-modal');
            showScreen('menu');
        });
        
        // Game over modal
        $('gameover-retry')?.addEventListener('click', () => {
            hideModal('gameover-modal');
            KennethGame.GameLogic?.restartLevel?.();
        });
        
        $('gameover-menu')?.addEventListener('click', () => {
            hideModal('gameover-modal');
            showScreen('menu');
        });
        
        // Power-up buttons
        document.querySelectorAll('.power-up-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const power = btn.dataset.power;
                KennethGame.GameLogic?.usePowerUp?.(power);
            });
        });
        
        console.log('✅ UI initialized!');
    }
    
    return {
        init,
        showScreen,
        getCurrentScreen,
        showModal,
        hideModal,
        hideAllModals,
        showNameEntry,
        submitName,
        updateAllNameDisplays,
        updateMenuUI,
        showLevelComplete,
        showGameOver,
        showPause,
        updateLoadingProgress
    };
})();

console.log('🎨 UI Controller loaded!');
