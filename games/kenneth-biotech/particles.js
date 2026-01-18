/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - Particles System
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

KennethGame.Particles = (function() {
    let canvas = null;
    let ctx = null;
    let particles = [];
    let animationId = null;
    let isRunning = false;
    
    const CONSTANTS = KennethGame.CONSTANTS;
    
    function init() {
        console.log('✨ Initializing particles...');
        
        canvas = document.getElementById('particle-canvas');
        if (!canvas) return;
        
        ctx = canvas.getContext('2d');
        resize();
        
        window.addEventListener('resize', resize);
        
        // Start ambient particles
        createAmbientParticles();
        start();
        
        console.log('✅ Particles initialized!');
    }
    
    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    function start() {
        if (isRunning) return;
        isRunning = true;
        animate();
    }
    
    function stop() {
        isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
    
    function animate() {
        if (!isRunning || !ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Update lifetime
            if (p.lifetime !== undefined) {
                p.lifetime--;
                if (p.lifetime <= 0) {
                    particles.splice(i, 1);
                    continue;
                }
                p.alpha = p.lifetime / p.maxLifetime;
            }
            
            // Ambient particles wrap around
            if (p.ambient) {
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
            }
            
            // Draw
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color.replace(')', `, ${p.alpha || 0.5})`).replace('rgb', 'rgba');
            ctx.fill();
            
            // Glow effect
            if (p.glow) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
        
        animationId = requestAnimationFrame(animate);
    }
    
    function createAmbientParticles() {
        const config = CONSTANTS?.PARTICLES?.AMBIENT || {
            count: 50,
            size: { min: 2, max: 6 },
            speed: { min: 0.1, max: 0.5 },
            colors: ['#00f5ff', '#ff00ff', '#00ff88', '#ffd700'],
            opacity: { min: 0.2, max: 0.6 }
        };
        
        for (let i = 0; i < config.count; i++) {
            particles.push({
                x: Math.random() * (canvas?.width || window.innerWidth),
                y: Math.random() * (canvas?.height || window.innerHeight),
                vx: (Math.random() - 0.5) * config.speed.max,
                vy: (Math.random() - 0.5) * config.speed.max,
                size: config.size.min + Math.random() * (config.size.max - config.size.min),
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                alpha: config.opacity.min + Math.random() * (config.opacity.max - config.opacity.min),
                ambient: true,
                glow: true
            });
        }
    }
    
    function emit(x, y, options = {}) {
        const count = options.count || 10;
        const colors = options.colors || ['#00f5ff', '#ffffff'];
        const size = options.size || { min: 4, max: 8 };
        const speed = options.speed || { min: 2, max: 5 };
        const lifetime = options.lifetime || 500;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = speed.min + Math.random() * (speed.max - speed.min);
            
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: size.min + Math.random() * (size.max - size.min),
                color: colors[Math.floor(Math.random() * colors.length)],
                lifetime: lifetime / 16,
                maxLifetime: lifetime / 16,
                alpha: 1,
                glow: true
            });
        }
    }
    
    function emitPlacement(x, y) {
        emit(x, y, CONSTANTS?.PARTICLES?.PLACEMENT || {
            count: 15,
            colors: ['#00f5ff', '#ffffff'],
            size: { min: 4, max: 8 },
            speed: { min: 2, max: 5 },
            lifetime: 600
        });
    }
    
    function emitConnection(x, y, options = {}) {
        emit(x, y, {
            ...(CONSTANTS?.PARTICLES?.CONNECTION || {}),
            colors: options.color ? [options.color, '#ffffff'] : ['#00ff88', '#ffffff']
        });
    }
    
    function emitSynergy(x, y) {
        emit(x, y, CONSTANTS?.PARTICLES?.SYNERGY || {
            count: 40,
            colors: ['#ffd700', '#ff00ff', '#00f5ff'],
            size: { min: 5, max: 12 },
            speed: { min: 4, max: 10 },
            lifetime: 800
        });
    }
    
    function emitConfetti(x, y) {
        emit(x, y, CONSTANTS?.PARTICLES?.CONFETTI || {
            count: 100,
            colors: ['#ff4466', '#ffd700', '#00f5ff', '#ff00ff', '#00ff88'],
            size: { min: 8, max: 15 },
            speed: { min: 2, max: 8 },
            lifetime: 2000
        });
    }
    
    function emitCombo(x, y, level) {
        emit(x, y, {
            count: 20 + level * 5,
            colors: ['#ff8c00', '#ffd700', '#ff4466'],
            size: { min: 4, max: 10 },
            speed: { min: 3, max: 8 },
            lifetime: 400
        });
    }
    
    function emitScore(x, y, points) {
        // Score particles just use the regular emit
        emit(x, y, {
            count: 8,
            colors: ['#ffd700'],
            size: { min: 3, max: 6 },
            speed: { min: 1, max: 3 },
            lifetime: 500
        });
    }
    
    function flash(color, duration) {
        KennethGame.Utils?.flashScreen?.(color, duration);
    }
    
    function shake(intensity, duration) {
        KennethGame.Utils?.shakeScreen?.(intensity, duration);
    }
    
    function handleResize() {
        resize();
    }
    
    return {
        init,
        start,
        stop,
        emit,
        emitPlacement,
        emitConnection,
        emitSynergy,
        emitConfetti,
        emitCombo,
        emitScore,
        flash,
        shake,
        handleResize
    };
})();

console.log('✨ Particles system loaded!');
// v20260117-FULL
