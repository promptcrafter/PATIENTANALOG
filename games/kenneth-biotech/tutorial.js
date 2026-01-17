/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - Tutorial System (FIXED)
 * Fixed: onClick event binding in createElement
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

KennethGame.Tutorial = (function() {
    const Utils = KennethGame.Utils || {};
    const $ = Utils.$ || function(id) { return document.getElementById(id); };
    
    // Tutorial steps
    const STEPS = [
        {
            title: '👋 Welcome, Scientist!',
            content: `
                <p>Welcome to your AMAZING Biotech Laboratory!</p>
                <p>In this game, you'll build incredible bio-systems by connecting organs, organoids, and high-tech components!</p>
                <p>Are you ready to become a Bio-Scientist? Let's learn how!</p>
            `,
            image: '🧬'
        },
        {
            title: '🧩 Bio-Modules',
            content: `
                <p>These are <strong>Bio-Modules</strong> - the building blocks of your systems!</p>
                <p>Each module represents something from biology:</p>
                <ul>
                    <li>🫀 <strong>Organs</strong> - Real body parts like hearts and brains</li>
                    <li>🧫 <strong>Organoids</strong> - Mini organs grown in labs</li>
                    <li>🔬 <strong>MPS</strong> - High-tech organ-on-chip systems</li>
                    <li>🔗 <strong>Connectors</strong> - Link other modules together</li>
                </ul>
            `,
            image: '🧩'
        },
        {
            title: '🔌 Connection Ports',
            content: `
                <p>Every module has <strong>Connection Ports</strong> - the colored dots on each side!</p>
                <p>Port colors mean different things:</p>
                <ul>
                    <li>🟣 <strong>Neural</strong> - Brain signals</li>
                    <li>🔴 <strong>Vascular</strong> - Blood flow</li>
                    <li>🔵 <strong>Data</strong> - Digital information</li>
                    <li>🟢 <strong>Fluid</strong> - Water and nutrients</li>
                    <li>🟡 <strong>Energy</strong> - Power supply</li>
                    <li>⚪ <strong>Universal</strong> - Connects to ANYTHING!</li>
                </ul>
            `,
            image: '🔌'
        },
        {
            title: '📍 Placing Modules',
            content: `
                <p>To build your system:</p>
                <ol>
                    <li><strong>Click or drag</strong> a module from the tray at the bottom</li>
                    <li>Move it to an <strong>empty cell</strong> on the grid</li>
                    <li>The cell will <strong>glow green</strong> if it's a valid spot</li>
                    <li><strong>Drop it</strong> to place the module!</li>
                </ol>
                <p>Try to place modules so their ports line up with neighbors!</p>
            `,
            image: '📍'
        },
        {
            title: '🔗 Making Connections',
            content: `
                <p>When two adjacent modules have <strong>compatible ports</strong>, they automatically connect!</p>
                <p><strong>Matching colors = BONUS POINTS!</strong></p>
                <p>Connections create glowing lines between modules showing the flow of:</p>
                <ul>
                    <li>Blood through vessels 🩸</li>
                    <li>Signals through nerves ⚡</li>
                    <li>Data through computers 💻</li>
                </ul>
            `,
            image: '🔗'
        },
        {
            title: '✨ Synergies',
            content: `
                <p><strong>Synergies</strong> are special combos when certain modules work together!</p>
                <p>For example:</p>
                <ul>
                    <li>❤️ Heart + 🫁 Lungs + 🩸 Blood Vessel = <strong>Cardiovascular System!</strong></li>
                    <li>🧠 Brain + ⚡ Nerves + 👁️ Eyes = <strong>Nervous System!</strong></li>
                </ul>
                <p>Synergies give you <strong>HUGE bonus points</strong> and cool effects!</p>
            `,
            image: '✨'
        },
        {
            title: '🔥 Combos',
            content: `
                <p>Place modules <strong>quickly</strong> to build up your <strong>COMBO</strong> multiplier!</p>
                <p>The combo starts at 1x and can go up to <strong>5x!</strong></p>
                <p>Every point you earn is multiplied by your combo!</p>
                <p>⚠️ But be careful - if you wait too long, your combo resets!</p>
            `,
            image: '🔥'
        },
        {
            title: '⚡ Power-Ups',
            content: `
                <p>Use <strong>Power-Ups</strong> when you need help!</p>
                <ul>
                    <li>💡 <strong>Hint</strong> - Shows the best spot for your next module</li>
                    <li>↩️ <strong>Undo</strong> - Take back your last move</li>
                    <li>🚀 <strong>Boost</strong> - Next placement gives 3x points!</li>
                    <li>⏰ <strong>Extra Time</strong> - Adds 30 seconds to the clock</li>
                </ul>
            `,
            image: '⚡'
        },
        {
            title: '⭐ Stars & Progression',
            content: `
                <p>Complete levels to earn <strong>STARS!</strong></p>
                <ul>
                    <li>⭐ 1 Star - You finished the level!</li>
                    <li>⭐⭐ 2 Stars - Great score!</li>
                    <li>⭐⭐⭐ 3 Stars - PERFECT performance!</li>
                </ul>
                <p>Earn <strong>XP</strong> to level up and unlock:</p>
                <ul>
                    <li>🆕 New modules</li>
                    <li>🗺️ New eras with harder challenges</li>
                    <li>🎖️ Cool titles!</li>
                </ul>
            `,
            image: '⭐'
        },
        {
            title: '🎮 You\'re Ready!',
            content: `
                <p><strong>That's everything you need to know!</strong></p>
                <p>Remember:</p>
                <ul>
                    <li>🎯 Connect modules with matching ports</li>
                    <li>✨ Look for synergies</li>
                    <li>🔥 Keep your combo going</li>
                    <li>⭐ Aim for 3 stars!</li>
                </ul>
                <p><strong>Most importantly: HAVE FUN!</strong></p>
                <p>You're going to be an AMAZING Bio-Scientist! 🧬🚀</p>
            `,
            image: '🎉'
        }
    ];
    
    let currentStep = 0;
    let isActive = false;
    
    function start() {
        currentStep = 0;
        isActive = true;
        render();
        updateNavigation();
    }
    
    function stop() {
        isActive = false;
    }
    
    function goToStep(step) {
        if (step < 0 || step >= STEPS.length) return;
        currentStep = step;
        render();
        updateNavigation();
        KennethGame.Audio?.playClick?.();
    }
    
    function next() {
        if (currentStep < STEPS.length - 1) {
            goToStep(currentStep + 1);
        } else {
            finish();
        }
    }
    
    function previous() {
        if (currentStep > 0) {
            goToStep(currentStep - 1);
        }
    }
    
    function finish() {
        stop();
        KennethGame.State?.setSetting?.('tutorialCompleted', true);
        KennethGame.UI?.showScreen?.('menu');
        KennethGame.Utils?.showToast?.('You\'re ready to be a Bio-Scientist! 🧬', 'success');
    }
    
    function render() {
        const content = $('tutorial-content');
        if (!content) return;
        
        const step = STEPS[currentStep];
        const playerName = KennethGame.State?.getPlayerName?.() || 'Scientist';
        
        // Replace "Kenneth" with player name
        let stepContent = step.content.replace(/Kenneth/gi, playerName);
        let stepTitle = step.title.replace(/Kenneth/gi, playerName);
        
        content.innerHTML = `
            <div class="tutorial-step">
                <div class="tutorial-image">${step.image}</div>
                <h2>${stepTitle}</h2>
                <div class="tutorial-text">${stepContent}</div>
            </div>
        `;
        
        renderDots();
    }
    
    // FIXED: Properly render dots with event listeners
    function renderDots() {
        const dotsContainer = $('tutorial-dots');
        if (!dotsContainer) return;
        
        // Clear existing dots
        dotsContainer.innerHTML = '';
        
        for (let i = 0; i < STEPS.length; i++) {
            const dot = document.createElement('div');
            dot.className = `tutorial-dot ${i === currentStep ? 'active' : ''}`;
            
            // FIXED: Proper event listener binding
            const stepIndex = i;
            dot.addEventListener('click', () => goToStep(stepIndex));
            
            dotsContainer.appendChild(dot);
        }
    }
    
    function updateNavigation() {
        const prevBtn = $('tutorial-prev');
        const nextBtn = $('tutorial-next');
        
        if (prevBtn) {
            prevBtn.disabled = currentStep === 0;
            prevBtn.onclick = previous;
        }
        
        if (nextBtn) {
            nextBtn.textContent = currentStep === STEPS.length - 1 ? 'Start Playing! 🚀' : 'Next →';
            nextBtn.onclick = next;
        }
    }
    
    function isRunning() {
        return isActive;
    }
    
    function getCurrentStep() {
        return currentStep;
    }
    
    return {
        start,
        stop,
        next,
        previous,
        goToStep,
        finish,
        isRunning,
        getCurrentStep
    };
})();

console.log('📖 Tutorial system loaded!');
