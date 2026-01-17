/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - Utilities (FIXED)
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

KennethGame.Utils = (function() {
    
    function $(id) {
        return document.getElementById(id);
    }
    
    function $$(selector, parent = document) {
        return parent.querySelector(selector);
    }
    
    function $$$(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    }
    
    function createElement(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'textContent') {
                el.textContent = value;
            } else if (key === 'innerHTML') {
                el.innerHTML = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(el.style, value);
            } else if (key.startsWith('data-')) {
                el.setAttribute(key, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                // FIXED: Properly attach event listeners
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof Element) {
                el.appendChild(child);
            }
        });
        
        return el;
    }
    
    function createSVG(tag, attrs = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.entries(attrs).forEach(([key, value]) => {
            el.setAttribute(key, value);
        });
        return el;
    }
    
    function clearElement(element) {
        while (element && element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    function formatNumber(num, abbreviate = false) {
        if (abbreviate) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    }
    
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    function randomItem(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    }
    
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    function randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    function lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    function easeOutQuad(t) {
        return t * (2 - t);
    }
    
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    function getAdjacentCells(col, row) {
        return [
            { col: col, row: row - 1, direction: 'top' },
            { col: col + 1, row: row, direction: 'right' },
            { col: col, row: row + 1, direction: 'bottom' },
            { col: col - 1, row: row, direction: 'left' }
        ];
    }
    
    function getOppositePort(direction) {
        const opposites = {
            'top': 'bottom',
            'right': 'left',
            'bottom': 'top',
            'left': 'right'
        };
        return opposites[direction];
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function throttle(func, limit) {
        let lastFunc, lastRan;
        return function(...args) {
            if (!lastRan) {
                func(...args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func(...args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }
    
    // Toast notifications
    function showToast(message, type = 'info', duration = 3500) {
        const container = $('toast-container');
        if (!container) return;
        
        const toast = createElement('div', {
            className: `toast ${type}`,
            textContent: message
        });
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    // Encouragement messages
    function getEncouragement(type) {
        const messages = KennethGame.CONSTANTS?.ENCOURAGEMENT?.[type];
        if (!messages || messages.length === 0) return 'Great job!';
        return randomItem(messages);
    }
    
    // Tips
    function getRandomTip() {
        const tips = KennethGame.CONSTANTS?.TIPS;
        if (!tips || tips.length === 0) return 'Have fun!';
        return randomItem(tips);
    }
    
    // Screen shake effect
    function shakeScreen(intensity = 5, duration = 300) {
        const gameScreen = $('game-screen');
        if (!gameScreen) return;
        
        const startTime = Date.now();
        
        function shake() {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const decay = 1 - elapsed / duration;
                const x = (Math.random() - 0.5) * intensity * decay;
                const y = (Math.random() - 0.5) * intensity * decay;
                gameScreen.style.transform = `translate(${x}px, ${y}px)`;
                requestAnimationFrame(shake);
            } else {
                gameScreen.style.transform = '';
            }
        }
        
        requestAnimationFrame(shake);
    }
    
    // Flash effect
    function flashScreen(color = '#00f5ff', duration = 150) {
        const flash = createElement('div', {
            style: {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                background: color,
                opacity: '0.3',
                pointerEvents: 'none',
                zIndex: '9999'
            }
        });
        
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.style.transition = 'opacity 0.2s';
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 200);
        }, duration);
    }
    
    return {
        $,
        $$,
        $$$,
        createElement,
        createSVG,
        clearElement,
        formatTime,
        formatNumber,
        clamp,
        randomItem,
        randomInt,
        randomFloat,
        lerp,
        easeOutQuad,
        easeInOutQuad,
        getAdjacentCells,
        getOppositePort,
        debounce,
        throttle,
        showToast,
        getEncouragement,
        getRandomTip,
        shakeScreen,
        flashScreen
    };
})();

console.log('🛠️ Utils loaded!');
