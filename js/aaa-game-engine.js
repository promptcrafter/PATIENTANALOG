/**
 * PatientAnalog.com - AAA Game Engine
 * High-quality 3D visualizations, particle systems, and sound design
 * 
 * @version 1.0.0
 * @description ADDITIVE enhancement layer - does not replace existing functionality
 * 
 * Features:
 * - 3D particle systems (GPU-optimized)
 * - Sound manager with per-game themes
 * - Mobile detection and fallback modes
 * - Shared shader library
 * - Win animation system
 */

(function() {
    'use strict';

    console.log('[AAA-Engine] Initializing AAA Game Engine...');

    // ═══════════════════════════════════════════════════════════
    // DEVICE DETECTION & CAPABILITY ASSESSMENT
    // ═══════════════════════════════════════════════════════════
    
    const DeviceCapabilities = {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isTouch: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
        hasWebGL: (function() {
            try {
                const canvas = document.createElement('canvas');
                return !!(window.WebGLRenderingContext && 
                    (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
            } catch(e) { return false; }
        })(),
        hasWebGL2: (function() {
            try {
                const canvas = document.createElement('canvas');
                return !!canvas.getContext('webgl2');
            } catch(e) { return false; }
        })(),
        deviceMemory: navigator.deviceMemory || 4,
        hardwareConcurrency: navigator.hardwareConcurrency || 4,
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        
        // Performance tier: 'high', 'medium', 'low'
        getPerformanceTier: function() {
            if (this.prefersReducedMotion) return 'low';
            if (this.isMobile && this.deviceMemory < 4) return 'low';
            if (this.isMobile) return 'medium';
            if (this.deviceMemory >= 8 && this.hardwareConcurrency >= 8) return 'high';
            if (this.deviceMemory >= 4) return 'medium';
            return 'low';
        }
    };
    
    const perfTier = DeviceCapabilities.getPerformanceTier();
    console.log('[AAA-Engine] Device tier:', perfTier, '| Mobile:', DeviceCapabilities.isMobile);

    // ═══════════════════════════════════════════════════════════
    // CONFIGURATION BY PERFORMANCE TIER
    // ═══════════════════════════════════════════════════════════
    
    const TierConfig = {
        high: {
            maxParticles: 1000,
            shadowQuality: 2048,
            antialias: true,
            targetFPS: 60,
            shaderComplexity: 'full',
            textureSize: 1024,
            enablePostProcessing: true
        },
        medium: {
            maxParticles: 500,
            shadowQuality: 1024,
            antialias: true,
            targetFPS: 45,
            shaderComplexity: 'medium',
            textureSize: 512,
            enablePostProcessing: false
        },
        low: {
            maxParticles: 200,
            shadowQuality: 512,
            antialias: false,
            targetFPS: 30,
            shaderComplexity: 'simple',
            textureSize: 256,
            enablePostProcessing: false
        }
    };
    
    const Config = TierConfig[perfTier];

    // ═══════════════════════════════════════════════════════════
    // COLOR PALETTE (Domain-aligned)
    // ═══════════════════════════════════════════════════════════
    
    const Palette = {
        neonCyan: 0x00FFFF,
        electricPurple: 0x9D00FF,
        infraredRed: 0xFF0033,
        quantumGold: 0xFFD700,
        darkMatterBlue: 0x0A0F2C,
        bioGreen: 0x00FF88,
        plasmaRed: 0xFF6B6B,
        deepSpace: 0x050510,
        
        // CSS versions
        css: {
            neonCyan: '#0055ff',
            electricPurple: '#9D00FF',
            infraredRed: '#FF0033',
            quantumGold: '#FFD700',
            darkMatterBlue: '#0A0F2C',
            bioGreen: '#00FF88'
        }
    };

    // ═══════════════════════════════════════════════════════════
    // SOUND MANAGER (Web Audio API)
    // ═══════════════════════════════════════════════════════════
    
    const SoundManager = {
        context: null,
        masterGain: null,
        muted: false,
        initialized: false,
        sounds: {},

        init: function() {
            if (this.initialized) return;
            try {
                // Use AudioManager's context if available, otherwise create own
                if (window.AudioManager && window.AudioManager.getContext) {
                    this.context = window.AudioManager.getContext();
                    this.masterGain = this.context.createGain();
                    this.masterGain.connect(window.AudioManager.getMasterGain() || this.context.destination);
                    // Sync muted state with global AudioManager
                    this.muted = !window.AudioManager.isEnabled();
                    // Subscribe to global sound toggle changes
                    window.AudioManager.subscribe((enabled) => {
                        this.muted = !enabled;
                        if (this.masterGain) {
                            this.masterGain.gain.setValueAtTime(enabled ? 0.5 : 0, this.context.currentTime);
                        }
                        console.log('[AAA-Sound] Synced with AudioManager:', enabled ? 'unmuted' : 'muted');
                    });
                } else {
                    this.context = new (window.AudioContext || window.webkitAudioContext)();
                    this.masterGain = this.context.createGain();
                    this.masterGain.connect(this.context.destination);
                }
                this.masterGain.gain.value = this.muted ? 0 : 0.5;
                this.initialized = true;
                console.log('[AAA-Sound] Audio context initialized (AudioManager:', window.AudioManager ? 'connected' : 'standalone', ')');
            } catch(e) {
                console.warn('[AAA-Sound] Web Audio not available:', e);
            }
        },

        // Set muted state (called by AudioManager integration)
        setMuted: function(muted) {
            this.muted = muted;
            if (this.masterGain && this.context) {
                this.masterGain.gain.setValueAtTime(muted ? 0 : 0.5, this.context.currentTime);
            }
        },
        
        // Resume context (required after user interaction on mobile)
        resume: function() {
            if (this.context && this.context.state === 'suspended') {
                this.context.resume();
            }
        },
        
        // Generate procedural sounds
        playTone: function(freq, duration, type, volume) {
            if (!this.initialized || this.muted) return;
            this.resume();
            
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, this.context.currentTime);
            
            gain.gain.setValueAtTime((volume || 0.3), this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + (duration || 0.3));
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.context.currentTime + (duration || 0.3));
        },
        
        // Pre-defined sound effects
        effects: {
            success: function() {
                SoundManager.playTone(523.25, 0.1, 'sine', 0.3); // C5
                setTimeout(() => SoundManager.playTone(659.25, 0.1, 'sine', 0.3), 100); // E5
                setTimeout(() => SoundManager.playTone(783.99, 0.2, 'sine', 0.4), 200); // G5
            },
            
            error: function() {
                SoundManager.playTone(200, 0.2, 'sawtooth', 0.2);
                setTimeout(() => SoundManager.playTone(150, 0.3, 'sawtooth', 0.15), 150);
            },
            
            click: function() {
                SoundManager.playTone(800, 0.05, 'square', 0.1);
            },
            
            levelUp: function() {
                const notes = [523, 659, 784, 1047];
                notes.forEach((f, i) => {
                    setTimeout(() => SoundManager.playTone(f, 0.15, 'sine', 0.3), i * 100);
                });
            },
            
            victory: function() {
                const melody = [523, 659, 784, 659, 784, 1047];
                melody.forEach((f, i) => {
                    setTimeout(() => SoundManager.playTone(f, 0.2, 'sine', 0.35), i * 150);
                });
            },
            
            heartbeat: function() {
                SoundManager.playTone(80, 0.1, 'sine', 0.4);
                setTimeout(() => SoundManager.playTone(60, 0.15, 'sine', 0.3), 120);
            },
            
            bioBlip: function() {
                SoundManager.playTone(1200 + Math.random() * 400, 0.08, 'sine', 0.15);
            },
            
            whoosh: function() {
                if (!SoundManager.initialized || SoundManager.muted) return;
                SoundManager.resume();
                const osc = SoundManager.context.createOscillator();
                const gain = SoundManager.context.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, SoundManager.context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, SoundManager.context.currentTime + 0.3);
                gain.gain.setValueAtTime(0.2, SoundManager.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, SoundManager.context.currentTime + 0.3);
                osc.connect(gain);
                gain.connect(SoundManager.masterGain);
                osc.start();
                osc.stop(SoundManager.context.currentTime + 0.3);
            },

            // === NEW ENHANCED SOUND EFFECTS ===

            // Neuron fire - layered synth for SYNAPSE game
            neuronFire: function(frequency) {
                if (!SoundManager.initialized || SoundManager.muted) return;
                SoundManager.resume();
                const ctx = SoundManager.context;
                const now = ctx.currentTime;
                const freq = frequency || 440;

                // Base oscillator
                const osc1 = ctx.createOscillator();
                osc1.type = 'sine';
                osc1.frequency.value = freq;

                // Harmonic layer for richness
                const osc2 = ctx.createOscillator();
                osc2.type = 'triangle';
                osc2.frequency.value = freq * 1.5;

                // Sub bass for depth
                const osc3 = ctx.createOscillator();
                osc3.type = 'sine';
                osc3.frequency.value = freq * 0.5;

                // Envelope
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

                const gain2 = ctx.createGain();
                gain2.gain.value = 0.15;

                const gain3 = ctx.createGain();
                gain3.gain.value = 0.1;

                osc1.connect(gain);
                osc2.connect(gain2);
                gain2.connect(gain);
                osc3.connect(gain3);
                gain3.connect(gain);
                gain.connect(SoundManager.masterGain);

                osc1.start(now);
                osc2.start(now);
                osc3.start(now);
                osc1.stop(now + 0.4);
                osc2.stop(now + 0.4);
                osc3.stop(now + 0.4);
            },

            // Bond formation - FM synthesis sweep for Quantum game
            bondForm: function() {
                if (!SoundManager.initialized || SoundManager.muted) return;
                SoundManager.resume();
                const ctx = SoundManager.context;
                const now = ctx.currentTime;

                // Carrier oscillator
                const carrier = ctx.createOscillator();
                carrier.type = 'sine';
                carrier.frequency.setValueAtTime(300, now);
                carrier.frequency.exponentialRampToValueAtTime(600, now + 0.15);

                // Modulator for FM effect
                const modulator = ctx.createOscillator();
                modulator.type = 'sine';
                modulator.frequency.value = 150;

                const modGain = ctx.createGain();
                modGain.gain.value = 100;

                const mainGain = ctx.createGain();
                mainGain.gain.setValueAtTime(0.3, now);
                mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

                modulator.connect(modGain);
                modGain.connect(carrier.frequency);
                carrier.connect(mainGain);
                mainGain.connect(SoundManager.masterGain);

                carrier.start(now);
                modulator.start(now);
                carrier.stop(now + 0.25);
                modulator.stop(now + 0.25);
            },

            // Enzyme tick - short noise burst for biological processes
            enzymeTick: function() {
                if (!SoundManager.initialized || SoundManager.muted) return;
                SoundManager.resume();
                const ctx = SoundManager.context;
                const now = ctx.currentTime;

                // Create noise
                const bufferSize = ctx.sampleRate * 0.05;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * 0.5;
                }

                const noise = ctx.createBufferSource();
                noise.buffer = buffer;

                // Filter for character
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 2000;
                filter.Q.value = 5;

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(SoundManager.masterGain);

                noise.start(now);
                noise.stop(now + 0.05);
            },

            // Cell divide - rising pitch with split effect
            cellDivide: function() {
                if (!SoundManager.initialized || SoundManager.muted) return;
                SoundManager.resume();
                const ctx = SoundManager.context;
                const now = ctx.currentTime;

                // Rising tone
                const osc1 = ctx.createOscillator();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(200, now);
                osc1.frequency.exponentialRampToValueAtTime(400, now + 0.2);

                // Split tone (diverges at end)
                const osc2 = ctx.createOscillator();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(200, now);
                osc2.frequency.exponentialRampToValueAtTime(600, now + 0.3);

                const gain1 = ctx.createGain();
                gain1.gain.setValueAtTime(0.25, now);
                gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

                const gain2 = ctx.createGain();
                gain2.gain.setValueAtTime(0, now);
                gain2.gain.linearRampToValueAtTime(0.2, now + 0.15);
                gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

                osc1.connect(gain1);
                osc2.connect(gain2);
                gain1.connect(SoundManager.masterGain);
                gain2.connect(SoundManager.masterGain);

                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.3);
                osc2.stop(now + 0.4);
            },

            // RNA fold - bell-like FM tone for base pairing
            rnaFold: function(isStrong) {
                if (!SoundManager.initialized || SoundManager.muted) return;
                SoundManager.resume();
                const ctx = SoundManager.context;
                const now = ctx.currentTime;
                const baseFreq = isStrong ? 880 : 660;

                // Bell-like FM synthesis
                const carrier = ctx.createOscillator();
                carrier.type = 'sine';
                carrier.frequency.value = baseFreq;

                const modulator = ctx.createOscillator();
                modulator.type = 'sine';
                modulator.frequency.value = baseFreq * 2.4;

                const modGain = ctx.createGain();
                modGain.gain.setValueAtTime(baseFreq * 0.5, now);
                modGain.gain.exponentialRampToValueAtTime(1, now + 0.4);

                const mainGain = ctx.createGain();
                mainGain.gain.setValueAtTime(0.25, now);
                mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

                modulator.connect(modGain);
                modGain.connect(carrier.frequency);
                carrier.connect(mainGain);
                mainGain.connect(SoundManager.masterGain);

                carrier.start(now);
                modulator.start(now);
                carrier.stop(now + 0.5);
                modulator.stop(now + 0.5);
            },

            // Crisis warning - low pulse alarm
            crisisWarning: function() {
                if (!SoundManager.initialized || SoundManager.muted) return;
                SoundManager.resume();
                const ctx = SoundManager.context;
                const now = ctx.currentTime;

                for (let i = 0; i < 3; i++) {
                    const osc = ctx.createOscillator();
                    osc.type = 'sawtooth';
                    osc.frequency.value = 120;

                    const gain = ctx.createGain();
                    const startTime = now + i * 0.2;
                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
                    gain.gain.linearRampToValueAtTime(0, startTime + 0.15);

                    osc.connect(gain);
                    gain.connect(SoundManager.masterGain);

                    osc.start(startTime);
                    osc.stop(startTime + 0.15);
                }
            },

            // Discovery chime - for achievements/unlocks
            discovery: function() {
                if (!SoundManager.initialized || SoundManager.muted) return;
                SoundManager.resume();
                const ctx = SoundManager.context;
                const now = ctx.currentTime;
                const notes = [523, 659, 784, 1047, 1319];

                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = freq;

                    const gain = ctx.createGain();
                    const startTime = now + i * 0.08;
                    gain.gain.setValueAtTime(0.2 - i * 0.03, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

                    osc.connect(gain);
                    gain.connect(SoundManager.masterGain);

                    osc.start(startTime);
                    osc.stop(startTime + 0.4);
                });
            },

            // Spatial sound with panning
            spatialBlip: function(pan) {
                if (!SoundManager.initialized || SoundManager.muted) return;
                SoundManager.resume();
                const ctx = SoundManager.context;
                const now = ctx.currentTime;

                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = 1000 + Math.random() * 500;

                const panner = ctx.createStereoPanner();
                panner.pan.value = Math.max(-1, Math.min(1, pan || 0));

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

                osc.connect(gain);
                gain.connect(panner);
                panner.connect(SoundManager.masterGain);

                osc.start(now);
                osc.stop(now + 0.1);
            }
        },
        
        toggleMute: function() {
            this.muted = !this.muted;
            if (this.masterGain) {
                this.masterGain.gain.value = this.muted ? 0 : 0.5;
            }
            return this.muted;
        }
    };

    // ═══════════════════════════════════════════════════════════
    // CANVAS 2D EFFECTS SYSTEM (For non-Three.js games)
    // ═══════════════════════════════════════════════════════════

    const Canvas2DEffects = {
        // Active particle systems
        particles: [],
        trails: [],

        // Create gradient-filled circle with glow
        drawGlowCircle: function(ctx, x, y, radius, color, glowSize) {
            const glow = glowSize || radius * 0.8;

            // Outer glow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius + glow);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.5, color.replace(')', ', 0.5)').replace('rgb', 'rgba').replace('#', 'rgba(').replace(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i, (m, r, g, b) => `${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)}`));
            gradient.addColorStop(1, 'transparent');

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius + glow, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Core
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        },

        // Create neuron-style node with pulsing glow
        drawNeuronNode: function(ctx, x, y, radius, color, pulsePhase) {
            const pulse = 0.8 + Math.sin(pulsePhase || 0) * 0.2;
            const glowRadius = radius * 2 * pulse;

            // Outer glow layers
            for (let i = 3; i >= 1; i--) {
                const alpha = 0.15 / i;
                ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
                ctx.beginPath();
                ctx.arc(x, y, glowRadius * (i / 2), 0, Math.PI * 2);
                ctx.fill();
            }

            // Core gradient
            const coreGrad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
            coreGrad.addColorStop(0, '#ffffff');
            coreGrad.addColorStop(0.3, color);
            coreGrad.addColorStop(1, color.replace(')', ', 0.8)').replace('rgb', 'rgba'));

            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Inner highlight
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        },

        // Particle burst effect (2D)
        burst2D: function(ctx, x, y, color, count, options) {
            const opts = Object.assign({
                speed: 3,
                lifetime: 1000,
                size: 4,
                gravity: 0.1,
                spread: Math.PI * 2
            }, options);

            const particles = [];
            const startAngle = opts.spread === Math.PI * 2 ? 0 : -opts.spread / 2;

            for (let i = 0; i < (count || 12); i++) {
                const angle = startAngle + (opts.spread * i / count);
                const speed = opts.speed * (0.5 + Math.random() * 0.5);
                particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    decay: 1 / (opts.lifetime / 16),
                    size: opts.size * (0.5 + Math.random() * 0.5),
                    color: color,
                    gravity: opts.gravity
                });
            }

            this.particles.push(...particles);
            return particles;
        },

        // Update and render all 2D particles
        updateParticles: function(ctx) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];

                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.life -= p.decay;

                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }

                // Draw particle with fade
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        },

        // Trail effect for moving objects
        addTrailPoint: function(id, x, y, color, maxLength) {
            if (!this.trails[id]) {
                this.trails[id] = { points: [], color: color, maxLength: maxLength || 20 };
            }
            this.trails[id].points.push({ x, y, alpha: 1 });
            if (this.trails[id].points.length > this.trails[id].maxLength) {
                this.trails[id].points.shift();
            }
        },

        // Render trails
        renderTrails: function(ctx) {
            for (const id in this.trails) {
                const trail = this.trails[id];
                const points = trail.points;
                if (points.length < 2) continue;

                ctx.save();
                ctx.strokeStyle = trail.color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';

                for (let i = 1; i < points.length; i++) {
                    const alpha = i / points.length;
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(points[i - 1].x, points[i - 1].y);
                    ctx.lineTo(points[i].x, points[i].y);
                    ctx.stroke();
                }
                ctx.restore();
            }
        },

        // Screen shake effect
        shake: function(canvas, intensity, duration) {
            const originalTransform = canvas.style.transform;
            const startTime = performance.now();

            const animate = () => {
                const elapsed = performance.now() - startTime;
                if (elapsed >= duration) {
                    canvas.style.transform = originalTransform;
                    return;
                }

                const decay = 1 - elapsed / duration;
                const dx = (Math.random() - 0.5) * intensity * decay;
                const dy = (Math.random() - 0.5) * intensity * decay;
                canvas.style.transform = `translate(${dx}px, ${dy}px)`;
                requestAnimationFrame(animate);
            };
            animate();
        },

        // Ripple effect at position
        ripple: function(ctx, x, y, color, maxRadius) {
            const ripples = [];
            const max = maxRadius || 100;

            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    let radius = 0;
                    const animate = () => {
                        radius += 4;
                        const alpha = 1 - radius / max;
                        if (alpha <= 0) return;

                        ctx.save();
                        ctx.globalAlpha = alpha * 0.5;
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();

                        requestAnimationFrame(animate);
                    };
                    animate();
                }, i * 100);
            }
        },

        // Animated score counter
        animateScore: function(element, startValue, endValue, duration) {
            const start = performance.now();
            const diff = endValue - startValue;

            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(startValue + diff * eased);

                element.textContent = current.toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        },

        // Draw connection line with glow
        drawGlowLine: function(ctx, x1, y1, x2, y2, color, width) {
            ctx.save();

            // Glow layers
            for (let i = 3; i >= 1; i--) {
                ctx.globalAlpha = 0.2 / i;
                ctx.strokeStyle = color;
                ctx.lineWidth = (width || 2) + i * 4;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            // Core line
            ctx.globalAlpha = 1;
            ctx.strokeStyle = color;
            ctx.lineWidth = width || 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.restore();
        },

        // Animated background grid
        drawAnimatedGrid: function(ctx, width, height, time, color) {
            const spacing = 40;
            const alpha = 0.1 + Math.sin(time * 0.001) * 0.05;

            ctx.save();
            ctx.strokeStyle = color || '#0055ff';
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 1;

            // Vertical lines
            for (let x = 0; x < width; x += spacing) {
                const offset = Math.sin(time * 0.002 + x * 0.01) * 2;
                ctx.beginPath();
                ctx.moveTo(x, offset);
                ctx.lineTo(x, height + offset);
                ctx.stroke();
            }

            // Horizontal lines
            for (let y = 0; y < height; y += spacing) {
                const offset = Math.sin(time * 0.002 + y * 0.01) * 2;
                ctx.beginPath();
                ctx.moveTo(offset, y);
                ctx.lineTo(width + offset, y);
                ctx.stroke();
            }

            ctx.restore();
        },

        // Clear all effects
        clear: function() {
            this.particles = [];
            this.trails = {};
        }
    };

    // ═══════════════════════════════════════════════════════════
    // PARTICLE SYSTEM (Three.js based)
    // ═══════════════════════════════════════════════════════════

    const ParticleSystem = {
        systems: [],
        
        create: function(scene, options) {
            if (typeof THREE === 'undefined') {
                console.warn('[AAA-Particles] THREE.js not loaded');
                return null;
            }
            
            const opts = Object.assign({
                count: Math.min(options.count || 100, Config.maxParticles),
                color: Palette.neonCyan,
                size: 0.05,
                spread: 5,
                speed: 0.02,
                lifetime: 2000,
                emitter: new THREE.Vector3(0, 0, 0)
            }, options);
            
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(opts.count * 3);
            const velocities = new Float32Array(opts.count * 3);
            const lifetimes = new Float32Array(opts.count);
            
            for (let i = 0; i < opts.count; i++) {
                const i3 = i * 3;
                positions[i3] = opts.emitter.x + (Math.random() - 0.5) * opts.spread;
                positions[i3 + 1] = opts.emitter.y + (Math.random() - 0.5) * opts.spread;
                positions[i3 + 2] = opts.emitter.z + (Math.random() - 0.5) * opts.spread;
                
                velocities[i3] = (Math.random() - 0.5) * opts.speed;
                velocities[i3 + 1] = (Math.random() - 0.5) * opts.speed;
                velocities[i3 + 2] = (Math.random() - 0.5) * opts.speed;
                
                lifetimes[i] = Math.random();
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const material = new THREE.PointsMaterial({
                color: opts.color,
                size: opts.size,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            const particles = new THREE.Points(geometry, material);
            particles.userData = { velocities, lifetimes, opts };
            
            if (scene) scene.add(particles);
            this.systems.push(particles);
            
            return particles;
        },
        
        update: function(particles, delta) {
            if (!particles || !particles.geometry) return;
            
            const positions = particles.geometry.attributes.position.array;
            const { velocities, lifetimes, opts } = particles.userData;
            
            for (let i = 0; i < positions.length / 3; i++) {
                const i3 = i * 3;
                
                positions[i3] += velocities[i3] * delta;
                positions[i3 + 1] += velocities[i3 + 1] * delta;
                positions[i3 + 2] += velocities[i3 + 2] * delta;
                
                lifetimes[i] += delta * 0.001;
                
                if (lifetimes[i] > 1) {
                    lifetimes[i] = 0;
                    positions[i3] = opts.emitter.x + (Math.random() - 0.5) * opts.spread;
                    positions[i3 + 1] = opts.emitter.y + (Math.random() - 0.5) * opts.spread;
                    positions[i3 + 2] = opts.emitter.z + (Math.random() - 0.5) * opts.spread;
                }
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
        },
        
        burst: function(scene, position, options) {
            const opts = Object.assign({
                count: Math.min(50, Config.maxParticles / 4),
                color: Palette.quantumGold,
                size: 0.1,
                duration: 1000
            }, options);
            
            const particles = this.create(scene, {
                count: opts.count,
                color: opts.color,
                size: opts.size,
                spread: 0.5,
                speed: 0.1,
                emitter: position
            });
            
            if (particles) {
                setTimeout(() => {
                    scene.remove(particles);
                    particles.geometry.dispose();
                    particles.material.dispose();
                }, opts.duration);
            }
            
            return particles;
        }
    };

    // ═══════════════════════════════════════════════════════════
    // WIN ANIMATION SYSTEM
    // ═══════════════════════════════════════════════════════════
    
    const WinAnimations = {
        // CSS-based celebration overlay
        celebrate: function(containerId, options) {
            const opts = Object.assign({
                duration: 3000,
                particleCount: 50,
                colors: [Palette.css.neonCyan, Palette.css.quantumGold, Palette.css.electricPurple],
                message: '🎉 Victory!',
                sound: true
            }, options);
            
            const container = document.getElementById(containerId);
            if (!container) return;
            
            // Play victory sound
            if (opts.sound) {
                SoundManager.effects.victory();
            }
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'aaa-win-overlay';
            overlay.innerHTML = `
                <div class="aaa-win-content">
                    <div class="aaa-win-message">${opts.message}</div>
                    <div class="aaa-win-particles"></div>
                </div>
            `;
            
            // Apply styles
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100;
                animation: aaaFadeIn 0.5s ease-out;
                pointer-events: none;
            `;
            
            const messageEl = overlay.querySelector('.aaa-win-message');
            messageEl.style.cssText = `
                font-family: 'Orbitron', sans-serif;
                font-size: 36px;
                color: ${opts.colors[1]};
                text-shadow: 0 0 30px ${opts.colors[0]}, 0 0 60px ${opts.colors[2]};
                animation: aaaPulse 0.5s ease-out;
            `;
            
            // Add confetti particles
            const particleContainer = overlay.querySelector('.aaa-win-particles');
            for (let i = 0; i < opts.particleCount; i++) {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: ${opts.colors[i % opts.colors.length]};
                    border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                    left: ${50 + (Math.random() - 0.5) * 100}%;
                    top: 50%;
                    opacity: 1;
                    animation: aaaConfetti ${1 + Math.random()}s ease-out forwards;
                    animation-delay: ${Math.random() * 0.5}s;
                `;
                particleContainer.appendChild(particle);
            }
            
            container.style.position = 'relative';
            container.appendChild(overlay);
            
            // Remove after duration
            setTimeout(() => {
                overlay.style.animation = 'aaaFadeOut 0.5s ease-out forwards';
                setTimeout(() => overlay.remove(), 500);
            }, opts.duration);
        },
        
        // Quick flash effect
        flash: function(element, color) {
            if (!element) return;
            const original = element.style.boxShadow;
            element.style.boxShadow = `0 0 50px ${color || Palette.css.neonCyan}`;
            element.style.transition = 'box-shadow 0.3s ease-out';
            setTimeout(() => {
                element.style.boxShadow = original;
            }, 300);
        },
        
        // Score popup
        scorePopup: function(element, points, color) {
            const popup = document.createElement('div');
            popup.textContent = `+${points}`;
            popup.style.cssText = `
                position: absolute;
                font-family: 'Orbitron', sans-serif;
                font-size: 24px;
                color: ${color || Palette.css.quantumGold};
                text-shadow: 0 0 10px ${color || Palette.css.quantumGold};
                pointer-events: none;
                animation: aaaPopup 1s ease-out forwards;
                z-index: 1000;
            `;
            
            const rect = element.getBoundingClientRect();
            popup.style.left = rect.left + rect.width / 2 + 'px';
            popup.style.top = rect.top + 'px';
            
            document.body.appendChild(popup);
            setTimeout(() => popup.remove(), 1000);
            
            SoundManager.effects.bioBlip();
        }
    };

    // ═══════════════════════════════════════════════════════════
    // INJECT REQUIRED CSS ANIMATIONS
    // ═══════════════════════════════════════════════════════════
    
    const injectStyles = function() {
        if (document.getElementById('aaa-engine-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'aaa-engine-styles';
        style.textContent = `
            @keyframes aaaFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes aaaFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes aaaPulse {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes aaaConfetti {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(-200px) rotate(720deg); opacity: 0; }
            }
            @keyframes aaaPopup {
                0% { transform: translateY(0) scale(1); opacity: 1; }
                100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
            }
            @keyframes aaaGlow {
                0%, 100% { box-shadow: 0 0 20px rgba(0, 85, 255, 0.5); }
                50% { box-shadow: 0 0 40px rgba(0, 85, 255, 0.8), 0 0 60px rgba(157, 0, 255, 0.4); }
            }
            .aaa-glow { animation: aaaGlow 2s ease-in-out infinite; }
            .aaa-particles-bg {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                pointer-events: none;
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    };

    // ═══════════════════════════════════════════════════════════
    // GAME ENHANCEMENT WRAPPERS
    // ═══════════════════════════════════════════════════════════
    
    const GameEnhancer = {
        // Wrap existing game start functions to add sound
        enhanceStart: function(gameObj, gameName) {
            if (!gameObj || !gameObj.start) return;
            
            const originalStart = gameObj.start.bind(gameObj);
            gameObj.start = function() {
                SoundManager.init();
                SoundManager.resume();
                SoundManager.effects.click();
                return originalStart.apply(this, arguments);
            };
            
            console.log('[AAA-Engine] Enhanced start for:', gameName);
        },
        
        // Add win celebration to games
        addWinHandler: function(gameObj, containerId, gameName) {
            gameObj.celebrateWin = function(message, points) {
                WinAnimations.celebrate(containerId, {
                    message: message || '🎉 ' + gameName + ' Complete!',
                    particleCount: 30
                });
                if (points) {
                    const container = document.getElementById(containerId);
                    if (container) WinAnimations.scorePopup(container, points);
                }
            };
        },
        
        // Enhance existing game with AAA features
        enhance: function(gameObj, containerId, gameName) {
            if (!gameObj) return;
            
            this.enhanceStart(gameObj, gameName);
            this.addWinHandler(gameObj, containerId, gameName);
            
            // Add sound effects object
            gameObj.sounds = SoundManager.effects;
            
            console.log('[AAA-Engine] Fully enhanced:', gameName);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // 3D HELPER UTILITIES
    // ═══════════════════════════════════════════════════════════
    
    const ThreeHelpers = {
        // Create basic scene setup
        createScene: function(containerId, options) {
            if (typeof THREE === 'undefined') {
                console.warn('[AAA-3D] THREE.js not available');
                return null;
            }
            
            const container = document.getElementById(containerId);
            if (!container) return null;
            
            const opts = Object.assign({
                antialias: Config.antialias,
                alpha: true,
                clearColor: 0x000000,
                clearAlpha: 0
            }, options);
            
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(
                60,
                container.clientWidth / container.clientHeight,
                0.1,
                1000
            );
            camera.position.z = 5;
            
            const renderer = new THREE.WebGLRenderer({
                antialias: opts.antialias,
                alpha: opts.alpha
            });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setClearColor(opts.clearColor, opts.clearAlpha);
            
            container.appendChild(renderer.domElement);
            
            // Basic lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);
            
            return { scene, camera, renderer, container };
        },
        
        // Create glowing material
        createGlowMaterial: function(color, emissiveIntensity) {
            return new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: emissiveIntensity || 0.3,
                metalness: 0.5,
                roughness: 0.3,
                transparent: true,
                opacity: 0.9
            });
        },
        
        // Create neon line
        createNeonLine: function(points, color) {
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: color,
                linewidth: 2,
                transparent: true,
                opacity: 0.8
            });
            return new THREE.Line(geometry, material);
        },
        
        // Dispose scene properly
        disposeScene: function(setup) {
            if (!setup) return;
            
            setup.scene.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
            
            setup.renderer.dispose();
            if (setup.container && setup.renderer.domElement) {
                setup.container.removeChild(setup.renderer.domElement);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════
    
    function init() {
        injectStyles();
        
        // Initialize sound on first user interaction
        document.addEventListener('click', function initSound() {
            SoundManager.init();
            document.removeEventListener('click', initSound);
        }, { once: true });
        
        document.addEventListener('touchstart', function initSoundTouch() {
            SoundManager.init();
            document.removeEventListener('touchstart', initSoundTouch);
        }, { once: true });
        
        console.log('[AAA-Engine] Ready | Tier:', perfTier);
    }
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT TO GLOBAL
    // ═══════════════════════════════════════════════════════════
    
    window.AAAEngine = {
        version: '2.0.0',
        Device: DeviceCapabilities,
        Config: Config,
        Palette: Palette,
        Sound: SoundManager,
        Particles: ParticleSystem,
        Canvas2D: Canvas2DEffects,
        Win: WinAnimations,
        Enhance: GameEnhancer,
        Three: ThreeHelpers,

        // Quick access methods
        playSound: function(name, param) {
            if (SoundManager.effects[name]) {
                SoundManager.effects[name](param);
            }
        },
        celebrate: function(containerId, message) {
            WinAnimations.celebrate(containerId, { message: message });
        },
        flash: function(element, color) {
            WinAnimations.flash(element, color);
        },
        shake: function(element, intensity, duration) {
            Canvas2DEffects.shake(element, intensity || 10, duration || 300);
        },
        burst: function(ctx, x, y, color, count) {
            Canvas2DEffects.burst2D(ctx, x, y, color, count || 12);
        }
    };
    
    console.log('[AAA-Engine] Exported to window.AAAEngine');

})();
