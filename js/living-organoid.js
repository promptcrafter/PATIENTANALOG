/**
 * Living Organoid Visualization
 * Premium cerebral organoid animation with autonomous behavior
 * Vanilla JS Canvas 2D implementation for Patient Analog
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // ORGANOID MIND - Autonomous consciousness system
    // ═══════════════════════════════════════════════════════════════

    class OrganoidMind {
        constructor() {
            this.neurons = [];
            this.synapses = [];
            this.pulseWaves = [];
            this.consciousness = 0.5;
            this.mood = { curiosity: 0.5, activity: 0.5, growth: 0.5, dreaming: 0.3 };
            this.time = 0;
        }

        think(deltaTime) {
            this.time += deltaTime;
            const t = this.time * 0.001;

            // Autonomous mood oscillations
            this.mood.curiosity = 0.5 + 0.3 * Math.sin(t * 0.15) + 0.15 * Math.sin(t * 0.47);
            this.mood.activity = 0.5 + 0.35 * Math.sin(t * 0.23 + 1) * Math.cos(t * 0.11);
            this.mood.growth = 0.5 + 0.25 * Math.sin(t * 0.08 + 2);
            this.mood.dreaming = 0.3 + 0.4 * Math.pow(Math.sin(t * 0.05), 2);

            // Consciousness emerges from neural activity
            const activeNeurons = this.neurons.filter(n => n.firing).length;
            this.consciousness = Math.min(1, activeNeurons / Math.max(1, this.neurons.length) * 2 + 0.3);

            // Spontaneous neural cascades
            if (Math.random() < 0.003 * this.mood.activity) {
                this.initiateThought();
            }

            // Clean old pulse waves
            this.pulseWaves = this.pulseWaves.filter(w => w.intensity > 0.01);
            this.pulseWaves.forEach(w => {
                w.radius += w.speed * deltaTime * 0.08;
                w.intensity *= 0.992;
            });
        }

        initiateThought() {
            const startNeurons = this.neurons
                .sort(() => Math.random() - 0.5)
                .slice(0, Math.floor(2 + Math.random() * 4));

            startNeurons.forEach(n => {
                n.firing = true;
                n.energy = 1;
                n.pulsePhase = 0;
            });

            if (startNeurons.length > 0) {
                this.pulseWaves.push({
                    origin: { ...startNeurons[0].position },
                    radius: 0,
                    intensity: 0.8 + Math.random() * 0.2,
                    speed: 0.4 + Math.random() * 0.4,
                    hue: Math.random()
                });
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CELLULAR PARTICLE
    // ═══════════════════════════════════════════════════════════════

    class CellularParticle {
        constructor(x, y, z, type) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.type = type;
            this.vx = (Math.random() - 0.5) * 0.08;
            this.vy = (Math.random() - 0.5) * 0.08;
            this.vz = (Math.random() - 0.5) * 0.08;
            this.phase = Math.random() * Math.PI * 2;
            this.size = this.getSize();
            this.color = this.getColor();
        }

        getSize() {
            const sizes = { nucleus: 6, mitochondria: 2.5, vesicle: 1.2, membrane: 1.8 };
            return (sizes[this.type] || 2) + Math.random() * 2;
        }

        getColor() {
            const colors = {
                nucleus: { h: 280, s: 75, l: 55 },
                mitochondria: { h: 340, s: 80, l: 55 },
                vesicle: { h: 190, s: 65, l: 60 },
                membrane: { h: 210, s: 50, l: 65 }
            };
            return colors[this.type] || { h: 200, s: 60, l: 60 };
        }

        update(time, mind) {
            const activity = mind.mood.activity;
            this.phase += 0.015 * activity;

            // Brownian motion
            this.vx += (Math.random() - 0.5) * 0.015 * activity;
            this.vy += (Math.random() - 0.5) * 0.015 * activity;
            this.vz += (Math.random() - 0.5) * 0.015 * activity;

            // Damping
            this.vx *= 0.97;
            this.vy *= 0.97;
            this.vz *= 0.97;

            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;

            // Contain within bounds
            const dist = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
            const maxDist = 100;
            if (dist > maxDist) {
                const scale = maxDist / dist * 0.95;
                this.x *= scale;
                this.y *= scale;
                this.z *= scale;
                this.vx *= -0.5;
                this.vy *= -0.5;
                this.vz *= -0.5;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // NEURON
    // ═══════════════════════════════════════════════════════════════

    class Neuron {
        constructor(id, x, y, z) {
            this.id = id;
            this.position = { x, y, z };
            this.connections = [];
            this.firing = false;
            this.energy = 0;
            this.pulsePhase = 0;
            this.restingPotential = -70 + Math.random() * 10;
            this.threshold = -55 + Math.random() * 5;
            this.potential = this.restingPotential;
        }

        update(deltaTime, mind) {
            if (this.firing) {
                this.pulsePhase += deltaTime * 0.008;
                this.energy = Math.max(0, this.energy - deltaTime * 0.0008);

                if (this.pulsePhase > Math.PI) {
                    this.firing = false;
                    this.pulsePhase = 0;
                    this.potential = this.restingPotential - 10;
                }

                // Propagate to connected neurons
                if (this.pulsePhase > Math.PI * 0.3 && this.pulsePhase < Math.PI * 0.5) {
                    this.connections.forEach(conn => {
                        if (!conn.target.firing && Math.random() < 0.25 * mind.mood.activity) {
                            conn.target.potential += 18 * conn.strength;
                            if (conn.target.potential > conn.target.threshold) {
                                conn.target.firing = true;
                                conn.target.energy = 1;
                                conn.target.pulsePhase = 0;
                            }
                        }
                    });
                }
            } else {
                this.potential += (this.restingPotential - this.potential) * 0.008;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // BUBBLE
    // ═══════════════════════════════════════════════════════════════

    class Bubble {
        constructor(width, height) {
            this.x = (Math.random() - 0.5) * width * 0.7;
            this.y = height / 2 + Math.random() * 20;
            this.size = 1 + Math.random() * 2.5;
            this.speed = 0.15 + Math.random() * 0.25;
            this.wobble = Math.random() * Math.PI * 2;
            this.wobbleSpeed = 0.015 + Math.random() * 0.015;
            this.height = height;
        }

        update() {
            this.y -= this.speed;
            this.wobble += this.wobbleSpeed;
            this.x += Math.sin(this.wobble) * 0.25;
            if (this.y < -this.height / 2) {
                this.y = this.height / 2;
                this.x = (Math.random() - 0.5) * 300;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // MAIN VISUALIZATION
    // ═══════════════════════════════════════════════════════════════

    class LivingOrganoid {
        constructor(containerId, options = {}) {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.warn('[LivingOrganoid] Container not found:', containerId);
                return;
            }

            this.options = {
                particleCount: options.particleCount || 150,
                neuronCount: options.neuronCount || 45,
                bubbleCount: options.bubbleCount || 20,
                showHUD: options.showHUD !== false,
                ...options
            };

            this.canvas = null;
            this.ctx = null;
            this.mind = new OrganoidMind();
            this.particles = [];
            this.neurons = [];
            this.synapses = [];
            this.bubbles = [];
            this.animationId = null;
            this.lastTime = 0;
            this.initialized = false;
            this.paused = false;
            this.visibilityObserver = null;

            this.init();
        }

        init() {
            // Create canvas
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = 'width:100%;height:100%;display:block;';
            this.container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            // Create HUD if enabled
            if (this.options.showHUD) {
                this.createHUD();
            }

            this.resize();
            
            // Debounced resize handler
            let resizeTimeout;
            const debouncedResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => this.resize(), 100);
            };
            
            window.addEventListener('resize', debouncedResize);
            
            // Handle fullscreen changes
            document.addEventListener('fullscreenchange', () => {
                setTimeout(() => this.resize(), 200);
            });
            document.addEventListener('webkitfullscreenchange', () => {
                setTimeout(() => this.resize(), 200);
            });
            
            // ResizeObserver for container size changes
            if (typeof ResizeObserver !== 'undefined') {
                const observer = new ResizeObserver(() => {
                    setTimeout(() => this.resize(), 50);
                });
                observer.observe(this.container);
            }

            this.initializeSimulation();
            this.setupVisibilityObserver();
            this.animate(0);
        }

        resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
            const rect = this.canvas.getBoundingClientRect();

            // Set canvas resolution for crisp rendering on high-DPI displays
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;

            // Reset transform before applying new scale (prevents cumulative scaling)
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(dpr, dpr);

            // Store logical dimensions
            this.width = rect.width;
            this.height = rect.height;
            this.dpr = dpr;

            // Recalculate organoid radius based on screen size
            this.organoidRadius = Math.min(this.width, this.height) * 0.28;
        }

        createHUD() {
            const hud = document.createElement('div');
            hud.className = 'organoid-hud';
            hud.innerHTML = `
                <div class="organoid-hud-top-left">
                    <div class="organoid-hud-label">MICROFLUIDIC CHAMBER</div>
                    <div class="organoid-hud-title">Human Cerebral Organoid</div>
                    <div class="organoid-hud-meta">Day 127 &bull; 2.4mm diameter</div>
                </div>
                <div class="organoid-hud-top-right">
                    <div class="organoid-hud-status"><span class="organoid-status-dot"></span> LIVE IMAGING</div>
                    <div class="organoid-hud-meta">37.0&deg;C &bull; pH 7.4 &bull; 5% CO&sub2;</div>
                </div>
                <div class="organoid-hud-bottom-left">
                    <div class="organoid-metric">
                        <span class="organoid-metric-label">Consciousness</span>
                        <div class="organoid-metric-bar"><div class="organoid-metric-fill consciousness-bar"></div></div>
                        <span class="organoid-metric-value consciousness-value">50%</span>
                    </div>
                    <div class="organoid-metric">
                        <span class="organoid-metric-label">Neural Activity</span>
                        <div class="organoid-metric-bar"><div class="organoid-metric-fill activity-bar"></div></div>
                        <span class="organoid-metric-value activity-value">50%</span>
                    </div>
                    <div class="organoid-metric">
                        <span class="organoid-metric-label">Growth Rate</span>
                        <div class="organoid-metric-bar"><div class="organoid-metric-fill growth-bar"></div></div>
                        <span class="organoid-metric-value growth-value">50%</span>
                    </div>
                </div>
                <div class="organoid-hud-bottom-right">
                    <div class="organoid-hud-meta">FDA Modernization Act 2.0 Compliant</div>
                    <div class="organoid-hud-brand">Patient Analog&trade; Technology</div>
                </div>
                <div class="organoid-corner organoid-corner-tl"></div>
                <div class="organoid-corner organoid-corner-tr"></div>
                <div class="organoid-corner organoid-corner-bl"></div>
                <div class="organoid-corner organoid-corner-br"></div>
            `;
            this.container.appendChild(hud);
            this.hud = hud;
        }

        updateHUD() {
            if (!this.hud) return;
            const c = this.mind.consciousness * 100;
            const a = this.mind.mood.activity * 100;
            const g = this.mind.mood.growth * 100;

            this.hud.querySelector('.consciousness-bar').style.width = c + '%';
            this.hud.querySelector('.consciousness-value').textContent = c.toFixed(1) + '%';
            this.hud.querySelector('.activity-bar').style.width = a + '%';
            this.hud.querySelector('.activity-value').textContent = a.toFixed(1) + '%';
            this.hud.querySelector('.growth-bar').style.width = g + '%';
            this.hud.querySelector('.growth-value').textContent = g.toFixed(1) + '%';
        }

        initializeSimulation() {
            // Create particles
            const types = ['nucleus', 'mitochondria', 'vesicle', 'membrane'];
            const counts = { nucleus: 12, mitochondria: 35, vesicle: 60, membrane: 43 };

            types.forEach(type => {
                for (let i = 0; i < counts[type]; i++) {
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const r = Math.random() * 80 * (type === 'membrane' ? 1.1 : 0.85);

                    const x = r * Math.sin(phi) * Math.cos(theta);
                    const y = r * Math.sin(phi) * Math.sin(theta);
                    const z = r * Math.cos(phi);

                    this.particles.push(new CellularParticle(x, y, z, type));
                }
            });

            // Create neural network
            for (let i = 0; i < this.options.neuronCount; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = 25 + Math.random() * 60;

                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.sin(phi) * Math.sin(theta);
                const z = r * Math.cos(phi);

                const neuron = new Neuron(i, x, y, z);
                this.neurons.push(neuron);
                this.mind.neurons.push(neuron);
            }

            // Create synaptic connections
            this.neurons.forEach(neuron => {
                const nearby = this.neurons
                    .filter(n => n.id !== neuron.id)
                    .map(n => ({
                        neuron: n,
                        dist: Math.sqrt(
                            Math.pow(n.position.x - neuron.position.x, 2) +
                            Math.pow(n.position.y - neuron.position.y, 2) +
                            Math.pow(n.position.z - neuron.position.z, 2)
                        )
                    }))
                    .sort((a, b) => a.dist - b.dist)
                    .slice(0, 2 + Math.floor(Math.random() * 3));

                nearby.forEach(({ neuron: target, dist }) => {
                    const synapse = {
                        source: neuron,
                        target: target,
                        strength: Math.max(0.1, 1 - dist / 120)
                    };
                    neuron.connections.push(synapse);
                    this.synapses.push(synapse);
                    this.mind.synapses.push(synapse);
                });
            });

            // Create bubbles
            for (let i = 0; i < this.options.bubbleCount; i++) {
                this.bubbles.push(new Bubble(this.width, this.height));
            }

            this.initialized = true;
        }

        animate(currentTime) {
            // Don't run animation if paused (not visible)
            if (this.paused) {
                this.animationId = requestAnimationFrame(t => this.animate(t));
                return;
            }

            const deltaTime = this.lastTime ? currentTime - this.lastTime : 16;
            this.lastTime = currentTime;

            if (this.initialized) {
                this.mind.think(deltaTime);
                this.update(deltaTime);
                this.render();
                this.updateHUD();
            }

            this.animationId = requestAnimationFrame(t => this.animate(t));
        }

        // Pause/resume for visibility optimization
        pause() {
            this.paused = true;
        }

        resume() {
            this.paused = false;
            this.lastTime = null; // Reset time to avoid large delta jumps
        }

        setupVisibilityObserver() {
            if (!this.container || typeof IntersectionObserver === 'undefined') return;

            this.visibilityObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.resume();
                    } else {
                        this.pause();
                    }
                });
            }, {
                threshold: 0.1 // Pause when less than 10% visible
            });

            this.visibilityObserver.observe(this.container);
        }

        update(deltaTime) {
            this.particles.forEach(p => p.update(this.mind.time, this.mind));
            this.neurons.forEach(n => n.update(deltaTime, this.mind));
            this.bubbles.forEach(b => b.update());
        }

        render() {
            const ctx = this.ctx;
            const cx = this.width / 2;
            const cy = this.height / 2;

            // Clear with gradient background
            const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.height * 0.8);
            bgGrad.addColorStop(0, '#080810');
            bgGrad.addColorStop(0.5, '#040408');
            bgGrad.addColorStop(1, '#000002');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, this.width, this.height);

            // Draw chamber
            this.drawChamber(ctx, cx, cy);

            // Draw nutrient channels
            this.drawNutrientChannels(ctx, cx, cy);

            // Draw bubbles
            this.bubbles.forEach(b => this.drawBubble(ctx, cx + b.x, cy + b.y, b.size));

            // Draw organoid glow
            this.drawOrganoidGlow(ctx, cx, cy);

            // Draw particles (sorted by z)
            const sortedParticles = [...this.particles].sort((a, b) => a.z - b.z);
            sortedParticles.forEach(p => this.drawParticle(ctx, cx, cy, p));

            // Draw synapses
            this.synapses.forEach(s => this.drawSynapse(ctx, cx, cy, s));

            // Draw neurons
            const sortedNeurons = [...this.neurons].sort((a, b) => a.position.z - b.position.z);
            sortedNeurons.forEach(n => this.drawNeuron(ctx, cx, cy, n));

            // Draw pulse waves
            this.mind.pulseWaves.forEach(w => this.drawPulseWave(ctx, cx, cy, w));

            // Draw membrane shimmer
            this.drawMembraneShimmer(ctx, cx, cy);

            // Draw vignette
            this.drawVignette(ctx);
        }

        drawChamber(ctx, cx, cy) {
            // Responsive chamber size - scales with viewport
            const cw = this.width * 0.85;
            const ch = this.height * 0.75;

            ctx.save();

            // Outer glow
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.04)';
            ctx.lineWidth = 15;
            ctx.strokeRect(cx - cw/2, cy - ch/2, cw, ch);

            // Glass edge
            ctx.strokeStyle = 'rgba(150, 220, 255, 0.12)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cx - cw/2, cy - ch/2, cw, ch);

            // Corners
            const cs = 18;
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.25)';
            ctx.lineWidth = 2;

            [[cx - cw/2, cy - ch/2, 1, 1], [cx + cw/2, cy - ch/2, -1, 1],
             [cx - cw/2, cy + ch/2, 1, -1], [cx + cw/2, cy + ch/2, -1, -1]].forEach(([x, y, dx, dy]) => {
                ctx.beginPath();
                ctx.moveTo(x, y + cs * dy);
                ctx.lineTo(x, y);
                ctx.lineTo(x + cs * dx, y);
                ctx.stroke();
            });

            ctx.restore();
        }

        drawNutrientChannels(ctx, cx, cy) {
            const cw = Math.min(this.width * 0.85, 500);
            const t = this.mind.time * 0.001;

            ctx.save();

            [-1, 1].forEach(dir => {
                const x = cx + dir * (cw/2 + 25);
                const gradient = ctx.createLinearGradient(x, cy - 100, x, cy + 100);
                const hue = 280 + Math.sin(t * 0.5) * 20;
                const offset = (t * 0.5) % 1;

                for (let i = 0; i < 4; i++) {
                    const pos = ((i / 4) + offset) % 1;
                    gradient.addColorStop(Math.max(0, pos - 0.1), `hsla(${hue}, 80%, 50%, 0)`);
                    gradient.addColorStop(pos, `hsla(${hue}, 80%, 60%, ${0.25 * this.mind.mood.growth})`);
                    gradient.addColorStop(Math.min(1, pos + 0.1), `hsla(${hue}, 80%, 50%, 0)`);
                }

                ctx.fillStyle = gradient;
                ctx.fillRect(x - 6, cy - 100, 12, 200);
            });

            ctx.restore();
        }

        drawBubble(ctx, x, y, size) {
            ctx.save();
            const gradient = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
            gradient.addColorStop(0.5, 'rgba(200, 230, 255, 0.08)');
            gradient.addColorStop(1, 'rgba(150, 200, 255, 0.03)');

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();

            ctx.restore();
        }

        drawOrganoidGlow(ctx, cx, cy) {
            ctx.save();

            const layers = [
                { r: 150, h: 200 + this.mind.mood.curiosity * 40, a: 0.02 },
                { r: 120, h: 260 + this.mind.mood.activity * 30, a: 0.04 },
                { r: 95, h: 300 + this.mind.mood.growth * 20, a: 0.06 },
                { r: 75, h: 340, a: 0.08 }
            ];

            layers.forEach(l => {
                const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, l.r);
                gradient.addColorStop(0, `hsla(${l.h}, 70%, 50%, ${l.a * this.mind.consciousness})`);
                gradient.addColorStop(1, 'transparent');

                ctx.beginPath();
                ctx.arc(cx, cy, l.r, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            });

            // Core pulse
            const t = this.mind.time * 0.001;
            const pulse = 0.3 + 0.2 * Math.sin(t * 2) * this.mind.mood.activity;
            const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 65);
            coreGrad.addColorStop(0, `hsla(280, 80%, 60%, ${pulse * 0.15})`);
            coreGrad.addColorStop(0.5, `hsla(320, 70%, 50%, ${pulse * 0.08})`);
            coreGrad.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.arc(cx, cy, 65, 0, Math.PI * 2);
            ctx.fillStyle = coreGrad;
            ctx.fill();

            ctx.restore();
        }

        drawParticle(ctx, cx, cy, p) {
            const scale = 1 + p.z / 180;
            const screenX = cx + p.x * scale;
            const screenY = cy + p.y * scale;
            const size = p.size * scale;
            const alpha = 0.3 + 0.35 * (1 + p.z / 140);

            ctx.save();

            const t = this.mind.time * 0.001;
            const hueShift = Math.sin(t + p.phase) * 10;
            const lightShift = Math.sin(t * 2 + p.phase) * 8 * this.mind.mood.activity;

            const gradient = ctx.createRadialGradient(
                screenX - size * 0.2, screenY - size * 0.2, 0, screenX, screenY, size
            );

            const h = p.color.h + hueShift;
            const s = p.color.s;
            const l = p.color.l + lightShift;

            gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l + 18}%, ${alpha})`);
            gradient.addColorStop(0.6, `hsla(${h}, ${s}%, ${l}%, ${alpha * 0.55})`);
            gradient.addColorStop(1, `hsla(${h}, ${s}%, ${l - 10}%, 0)`);

            ctx.beginPath();
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Inner glow for nuclei
            if (p.type === 'nucleus') {
                const innerGlow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size * 0.55);
                innerGlow.addColorStop(0, `hsla(${h + 30}, ${s}%, ${l + 28}%, ${alpha * 0.35})`);
                innerGlow.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(screenX, screenY, size * 0.55, 0, Math.PI * 2);
                ctx.fillStyle = innerGlow;
                ctx.fill();
            }

            ctx.restore();
        }

        drawSynapse(ctx, cx, cy, synapse) {
            const sScale = 1 + synapse.source.position.z / 180;
            const tScale = 1 + synapse.target.position.z / 180;

            const x1 = cx + synapse.source.position.x * sScale;
            const y1 = cy + synapse.source.position.y * sScale;
            const x2 = cx + synapse.target.position.x * tScale;
            const y2 = cy + synapse.target.position.y * tScale;

            const isActive = synapse.source.firing || synapse.target.firing;
            const baseAlpha = 0.04 + synapse.strength * 0.08;
            const alpha = isActive ? baseAlpha * 2.5 : baseAlpha;

            ctx.save();

            const hue = 200 + (synapse.source.firing ? 55 : 0);
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, ${alpha * (synapse.source.firing ? 1.8 : 1)})`);
            gradient.addColorStop(0.5, `hsla(${hue + 20}, 60%, 50%, ${alpha * 0.45})`);
            gradient.addColorStop(1, `hsla(${hue}, 70%, 60%, ${alpha * (synapse.target.firing ? 1.8 : 1)})`);

            const t = this.mind.time * 0.001;
            const midX = (x1 + x2) / 2 + Math.sin(t + synapse.strength * 10) * 8;
            const midY = (y1 + y2) / 2 + Math.cos(t + synapse.strength * 10) * 8;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(midX, midY, x2, y2);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = isActive ? 1.5 : 0.5;
            ctx.stroke();

            // Signal pulse
            if (synapse.source.firing && synapse.source.pulsePhase > 0.3 && synapse.source.pulsePhase < 0.8) {
                const prog = (synapse.source.pulsePhase - 0.3) / 0.5;
                const px = x1 + (x2 - x1) * prog;
                const py = y1 + (y2 - y1) * prog;

                const pulseGrad = ctx.createRadialGradient(px, py, 0, px, py, 5);
                pulseGrad.addColorStop(0, 'hsla(55, 100%, 70%, 0.75)');
                pulseGrad.addColorStop(1, 'hsla(55, 100%, 50%, 0)');

                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fillStyle = pulseGrad;
                ctx.fill();
            }

            ctx.restore();
        }

        drawNeuron(ctx, cx, cy, neuron) {
            const scale = 1 + neuron.position.z / 180;
            const screenX = cx + neuron.position.x * scale;
            const screenY = cy + neuron.position.y * scale;

            const baseSize = 3.5;
            const size = baseSize * scale * (neuron.firing ? 1.4 : 1);
            const alpha = 0.35 + 0.28 * (1 + neuron.position.z / 140);

            ctx.save();

            const hue = neuron.firing ? 50 : 200;
            const sat = neuron.firing ? 100 : 60;
            const light = neuron.firing ? 68 : 50;

            if (neuron.firing) {
                const glowSize = size * 2.8 * (1 + Math.sin(neuron.pulsePhase) * 0.45);
                const glowGrad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowSize);
                glowGrad.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${0.35 * neuron.energy})`);
                glowGrad.addColorStop(0.5, `hsla(${hue}, ${sat}%, ${light}%, ${0.18 * neuron.energy})`);
                glowGrad.addColorStop(1, 'transparent');

                ctx.beginPath();
                ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
                ctx.fillStyle = glowGrad;
                ctx.fill();
            }

            const gradient = ctx.createRadialGradient(
                screenX - size * 0.3, screenY - size * 0.3, 0, screenX, screenY, size
            );
            gradient.addColorStop(0, `hsla(${hue}, ${sat}%, ${light + 18}%, ${alpha})`);
            gradient.addColorStop(0.7, `hsla(${hue}, ${sat}%, ${light}%, ${alpha * 0.75})`);
            gradient.addColorStop(1, `hsla(${hue}, ${sat - 20}%, ${light - 10}%, ${alpha * 0.35})`);

            ctx.beginPath();
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.restore();
        }

        drawPulseWave(ctx, cx, cy, wave) {
            const scale = 1 + wave.origin.z / 180;
            const screenX = cx + wave.origin.x * scale;
            const screenY = cy + wave.origin.y * scale;

            ctx.save();
            ctx.beginPath();
            ctx.arc(screenX, screenY, wave.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${200 + wave.hue * 40}, 80%, 60%, ${wave.intensity * 0.25})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        drawMembraneShimmer(ctx, cx, cy) {
            ctx.save();

            const points = 50;
            const baseRadius = 110;
            const t = this.mind.time * 0.001;

            ctx.beginPath();
            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const wobble = Math.sin(angle * 5 + t * 2) * 4 * this.mind.mood.activity;
                const r = baseRadius + wobble;

                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();

            const shimmer = ctx.createRadialGradient(cx, cy, baseRadius - 18, cx, cy, baseRadius + 18);
            shimmer.addColorStop(0, 'transparent');
            shimmer.addColorStop(0.5, `hsla(${200 + this.mind.mood.curiosity * 55}, 50%, 60%, ${0.08 * this.mind.consciousness})`);
            shimmer.addColorStop(1, 'transparent');

            ctx.strokeStyle = shimmer;
            ctx.lineWidth = 6;
            ctx.stroke();

            ctx.restore();
        }

        drawVignette(ctx) {
            ctx.save();
            const vignette = ctx.createRadialGradient(
                this.width / 2, this.height / 2, this.height * 0.28,
                this.width / 2, this.height / 2, this.height * 0.75
            );
            vignette.addColorStop(0, 'transparent');
            vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.18)');
            vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');

            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        }

        destroy() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            if (this.visibilityObserver) {
                this.visibilityObserver.disconnect();
            }
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
            if (this.hud && this.hud.parentNode) {
                this.hud.parentNode.removeChild(this.hud);
            }
            // Clean up arrays to help garbage collection
            this.particles = [];
            this.neurons = [];
            this.synapses = [];
            this.bubbles = [];
            this.mind = null;
        }
    }

    // Expose to global scope
    window.LivingOrganoid = LivingOrganoid;

    // Auto-initialize if container exists
    document.addEventListener('DOMContentLoaded', function() {
        const container = document.getElementById('living-organoid-container');
        if (container) {
            window.livingOrganoidInstance = new LivingOrganoid('living-organoid-container');
        }
    });

    console.log('[LivingOrganoid] Module loaded v1.0.0');
})();
// v20260117-FULL
