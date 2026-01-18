/**
 * PatientAnalog.com - Museum-Grade Simulation Engine
 * Core foundation for all AAA scientific simulation modules
 * 
 * @version 2.0.0
 * @description High-fidelity scientific simulation framework with:
 *   - Mechanistic biological/chemical models
 *   - Stochastic behavior and emergent outcomes
 *   - Multi-tier performance optimization
 *   - Real-time state visualization
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // PERFORMANCE TIER DETECTION & CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const PerformanceDetector = {
        profile: null,

        detect: function() {
            if (this.profile) return this.profile;

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const deviceMemory = navigator.deviceMemory || 4;
            const cores = navigator.hardwareConcurrency || 4;
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            let hasWebGL2 = false;
            try {
                const canvas = document.createElement('canvas');
                hasWebGL2 = !!canvas.getContext('webgl2');
            } catch (e) {}

            // Calculate tier
            let tier = 'medium';
            if (prefersReducedMotion) {
                tier = 'low';
            } else if (isMobile && deviceMemory < 4) {
                tier = 'low';
            } else if (!isMobile && deviceMemory >= 8 && cores >= 8 && hasWebGL2) {
                tier = 'high';
            } else if (isMobile || deviceMemory < 4) {
                tier = 'low';
            }

            this.profile = {
                tier: tier,
                isMobile: isMobile,
                deviceMemory: deviceMemory,
                cores: cores,
                hasWebGL2: hasWebGL2,
                prefersReducedMotion: prefersReducedMotion,
                config: this.getConfig(tier)
            };

            console.log('[MGEngine] Performance tier:', tier, this.profile);
            return this.profile;
        },

        getConfig: function(tier) {
            const configs = {
                high: {
                    particleCount: 1000,
                    simulationSteps: 60,
                    renderFPS: 60,
                    enablePostProcessing: true,
                    enableParticles: true,
                    textureResolution: 1024,
                    shadowMapSize: 2048,
                    antialias: true,
                    stochasticResolution: 100
                },
                medium: {
                    particleCount: 400,
                    simulationSteps: 30,
                    renderFPS: 30,
                    enablePostProcessing: false,
                    enableParticles: true,
                    textureResolution: 512,
                    shadowMapSize: 1024,
                    antialias: true,
                    stochasticResolution: 50
                },
                low: {
                    particleCount: 100,
                    simulationSteps: 15,
                    renderFPS: 20,
                    enablePostProcessing: false,
                    enableParticles: false,
                    textureResolution: 256,
                    shadowMapSize: 512,
                    antialias: false,
                    stochasticResolution: 20
                }
            };
            return configs[tier] || configs.medium;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STOCHASTIC & MATHEMATICAL UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    const MathUtils = {
        // Box-Muller transform for normal distribution
        gaussianRandom: function(mean = 0, stdDev = 1) {
            let u1, u2;
            do {
                u1 = Math.random();
                u2 = Math.random();
            } while (u1 === 0);
            
            const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            return z0 * stdDev + mean;
        },

        // Log-normal distribution (common in biology)
        logNormalRandom: function(mean, cv) {
            const sigma = Math.sqrt(Math.log(1 + cv * cv));
            const mu = Math.log(mean) - sigma * sigma / 2;
            return Math.exp(this.gaussianRandom(mu, sigma));
        },

        // Sigmoid function (Hill equation base)
        sigmoid: function(x, ec50, hillCoef) {
            const xn = Math.pow(x, hillCoef);
            const ec50n = Math.pow(ec50, hillCoef);
            return xn / (xn + ec50n);
        },

        // Hill equation for dose-response
        hillEquation: function(concentration, emax, ec50, hillCoef) {
            return emax * this.sigmoid(concentration, ec50, hillCoef);
        },

        // First-order kinetics
        firstOrderDecay: function(initial, rate, time) {
            return initial * Math.exp(-rate * time);
        },

        // Michaelis-Menten kinetics
        michaelisMenten: function(substrate, vmax, km) {
            return (vmax * substrate) / (km + substrate);
        },

        // Two-compartment PK
        twoCompartmentPK: function(dose, time, params) {
            const { ka, ke, k12, k21, V1 } = params;
            // Simplified bi-exponential
            const alpha = (ka + ke + k12 + k21 + Math.sqrt(Math.pow(ka + ke + k12 + k21, 2) - 4 * ke * k21)) / 2;
            const beta = (ka + ke + k12 + k21 - Math.sqrt(Math.pow(ka + ke + k12 + k21, 2) - 4 * ke * k21)) / 2;
            
            const A = (ka * dose / V1) * (alpha - ka) / ((alpha - beta) * (ka - alpha));
            const B = (ka * dose / V1) * (beta - ka) / ((beta - alpha) * (ka - beta));
            
            return A * Math.exp(-alpha * time) + B * Math.exp(-beta * time);
        },

        // Clamp value between min and max
        clamp: function(value, min, max) {
            return Math.max(min, Math.min(max, value));
        },

        // Linear interpolation
        lerp: function(a, b, t) {
            return a + (b - a) * t;
        },

        // Smooth step (for animations)
        smoothstep: function(edge0, edge1, x) {
            const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
            return t * t * (3 - 2 * t);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT SYSTEM
    // ═══════════════════════════════════════════════════════════════════════

    class StateManager {
        constructor(initialState = {}) {
            this.state = JSON.parse(JSON.stringify(initialState));
            this.history = [];
            this.maxHistory = 1000;
            this.listeners = new Map();
            this.initialState = JSON.parse(JSON.stringify(initialState));
        }

        get(key) {
            return key ? this.state[key] : this.state;
        }

        set(key, value, recordHistory = true) {
            if (recordHistory) {
                this.history.push({
                    timestamp: Date.now(),
                    key: key,
                    oldValue: this.state[key],
                    newValue: value
                });
                if (this.history.length > this.maxHistory) {
                    this.history.shift();
                }
            }

            this.state[key] = value;
            this.notifyListeners(key, value);
        }

        update(key, updater) {
            const newValue = updater(this.state[key]);
            this.set(key, newValue);
        }

        subscribe(key, callback) {
            if (!this.listeners.has(key)) {
                this.listeners.set(key, []);
            }
            this.listeners.get(key).push(callback);
            return () => {
                const callbacks = this.listeners.get(key);
                const index = callbacks.indexOf(callback);
                if (index > -1) callbacks.splice(index, 1);
            };
        }

        notifyListeners(key, value) {
            const callbacks = this.listeners.get(key) || [];
            callbacks.forEach(cb => cb(value, key));
            
            // Also notify wildcard listeners
            const wildcardCallbacks = this.listeners.get('*') || [];
            wildcardCallbacks.forEach(cb => cb(value, key));
        }

        reset() {
            this.state = JSON.parse(JSON.stringify(this.initialState));
            this.history = [];
            this.notifyListeners('*', this.state);
        }

        getTimeSeries(key, duration) {
            const now = Date.now();
            return this.history
                .filter(h => h.key === key && (now - h.timestamp) <= duration)
                .map(h => ({ time: h.timestamp, value: h.newValue }));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SIMULATION TIME CONTROLLER
    // ═══════════════════════════════════════════════════════════════════════

    class SimulationClock {
        constructor(options = {}) {
            this.timeScale = options.timeScale || 1; // 1 = real-time, >1 = faster
            this.simulationTime = 0; // In simulation seconds
            this.realStartTime = null;
            this.running = false;
            this.paused = false;
            this.stepCallbacks = [];
            this.lastStepTime = 0;
            this.stepInterval = 1000 / (options.stepsPerSecond || 60);
            this.animationFrameId = null;
        }

        start() {
            if (this.running) return;
            this.running = true;
            this.paused = false;
            this.realStartTime = performance.now();
            this.lastStepTime = this.realStartTime;
            this.tick();
        }

        pause() {
            this.paused = true;
        }

        resume() {
            if (!this.running) return this.start();
            this.paused = false;
            this.lastStepTime = performance.now();
        }

        stop() {
            this.running = false;
            this.paused = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
        }

        reset() {
            this.stop();
            this.simulationTime = 0;
        }

        tick() {
            if (!this.running) return;

            const now = performance.now();
            
            if (!this.paused) {
                const realDelta = now - this.lastStepTime;
                const simDelta = (realDelta / 1000) * this.timeScale;
                
                this.simulationTime += simDelta;
                
                // Notify all step callbacks
                this.stepCallbacks.forEach(cb => {
                    try {
                        cb(simDelta, this.simulationTime);
                    } catch (e) {
                        console.error('[SimClock] Step callback error:', e);
                    }
                });
            }

            this.lastStepTime = now;
            this.animationFrameId = requestAnimationFrame(() => this.tick());
        }

        onStep(callback) {
            this.stepCallbacks.push(callback);
            return () => {
                const idx = this.stepCallbacks.indexOf(callback);
                if (idx > -1) this.stepCallbacks.splice(idx, 1);
            };
        }

        setTimeScale(scale) {
            this.timeScale = Math.max(0.1, Math.min(100, scale));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COMPARTMENTAL MODEL BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class CompartmentalModel {
        constructor(compartments = []) {
            this.compartments = new Map();
            this.flows = [];
            
            compartments.forEach(c => {
                this.compartments.set(c.name, {
                    name: c.name,
                    volume: c.volume || 1,
                    concentrations: c.concentrations || {},
                    parameters: c.parameters || {}
                });
            });
        }

        addCompartment(name, options = {}) {
            this.compartments.set(name, {
                name: name,
                volume: options.volume || 1,
                concentrations: options.concentrations || {},
                parameters: options.parameters || {}
            });
        }

        addFlow(from, to, rateFunction) {
            this.flows.push({ from, to, rateFunction });
        }

        getConcentration(compartment, species) {
            const comp = this.compartments.get(compartment);
            return comp ? (comp.concentrations[species] || 0) : 0;
        }

        setConcentration(compartment, species, value) {
            const comp = this.compartments.get(compartment);
            if (comp) {
                comp.concentrations[species] = Math.max(0, value);
            }
        }

        step(dt) {
            // Calculate all flows
            const deltaConcentrations = new Map();
            
            this.compartments.forEach((comp, name) => {
                deltaConcentrations.set(name, {});
                Object.keys(comp.concentrations).forEach(species => {
                    deltaConcentrations.get(name)[species] = 0;
                });
            });

            // Process flows
            this.flows.forEach(flow => {
                const fromComp = this.compartments.get(flow.from);
                const toComp = this.compartments.get(flow.to);
                
                if (fromComp && toComp) {
                    Object.keys(fromComp.concentrations).forEach(species => {
                        const rate = flow.rateFunction(fromComp, toComp, species, dt);
                        const amount = rate * dt;
                        
                        if (deltaConcentrations.has(flow.from)) {
                            deltaConcentrations.get(flow.from)[species] -= amount / fromComp.volume;
                        }
                        if (deltaConcentrations.has(flow.to)) {
                            deltaConcentrations.get(flow.to)[species] = 
                                (deltaConcentrations.get(flow.to)[species] || 0) + amount / toComp.volume;
                        }
                    });
                }
            });

            // Apply deltas
            this.compartments.forEach((comp, name) => {
                const deltas = deltaConcentrations.get(name);
                Object.keys(deltas).forEach(species => {
                    comp.concentrations[species] = Math.max(0, 
                        comp.concentrations[species] + deltas[species]);
                });
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VISUALIZATION CONTROLLER
    // ═══════════════════════════════════════════════════════════════════════

    class VisualizationController {
        constructor(containerId, options = {}) {
            this.containerId = containerId;
            this.container = null;
            this.options = options;
            this.charts = new Map();
            this.threejsScene = null;
            this.updateQueue = [];
            this.lastRenderTime = 0;
            this.renderInterval = 1000 / (PerformanceDetector.detect().config.renderFPS);
        }

        init() {
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                console.error('[VisController] Container not found:', this.containerId);
                return false;
            }
            return true;
        }

        // Create a real-time line chart for time series data
        createTimeSeriesChart(elementId, options = {}) {
            const canvas = document.getElementById(elementId);
            if (!canvas) return null;

            const ctx = canvas.getContext('2d');
            const chart = {
                canvas: canvas,
                ctx: ctx,
                data: [],
                maxPoints: options.maxPoints || 200,
                yMin: options.yMin || 0,
                yMax: options.yMax || 100,
                color: options.color || '#0055ff',
                label: options.label || '',
                thresholds: options.thresholds || []
            };

            this.charts.set(elementId, chart);
            return chart;
        }

        updateChart(elementId, value, timestamp) {
            const chart = this.charts.get(elementId);
            if (!chart) return;

            chart.data.push({ value, timestamp: timestamp || Date.now() });
            if (chart.data.length > chart.maxPoints) {
                chart.data.shift();
            }

            this.queueRender(elementId);
        }

        queueRender(elementId) {
            if (!this.updateQueue.includes(elementId)) {
                this.updateQueue.push(elementId);
            }

            const now = performance.now();
            if (now - this.lastRenderTime >= this.renderInterval) {
                this.processRenderQueue();
                this.lastRenderTime = now;
            }
        }

        processRenderQueue() {
            this.updateQueue.forEach(elementId => {
                const chart = this.charts.get(elementId);
                if (chart) {
                    this.renderChart(chart);
                }
            });
            this.updateQueue = [];
        }

        renderChart(chart) {
            const { canvas, ctx, data, yMin, yMax, color, thresholds, label } = chart;
            const width = canvas.width;
            const height = canvas.height;
            const padding = { top: 20, right: 10, bottom: 25, left: 45 };

            // Clear
            ctx.fillStyle = 'rgba(0, 10, 30, 0.95)';
            ctx.fillRect(0, 0, width, height);

            // Draw grid
            ctx.strokeStyle = 'rgba(0, 85, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = padding.top + (height - padding.top - padding.bottom) * (i / 4);
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
            }

            // Draw thresholds
            thresholds.forEach(threshold => {
                const y = this.valueToY(threshold.value, yMin, yMax, height, padding);
                ctx.strokeStyle = threshold.color || '#FF0033';
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.fillStyle = threshold.color || '#FF0033';
                ctx.font = '10px Orbitron, monospace';
                ctx.fillText(threshold.label || '', width - padding.right - 50, y - 3);
            });

            // Draw data line
            if (data.length > 1) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();

                const chartWidth = width - padding.left - padding.right;
                
                data.forEach((point, i) => {
                    const x = padding.left + (i / (data.length - 1)) * chartWidth;
                    const y = this.valueToY(point.value, yMin, yMax, height, padding);
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                ctx.stroke();

                // Draw glow effect
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.globalAlpha = 0.3;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Draw current value
            if (data.length > 0) {
                const currentValue = data[data.length - 1].value;
                ctx.fillStyle = color;
                ctx.font = 'bold 14px Orbitron, monospace';
                ctx.textAlign = 'right';
                ctx.fillText(currentValue.toFixed(1), width - padding.right, padding.top - 5);
            }

            // Draw label
            if (label) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '11px Orbitron, monospace';
                ctx.textAlign = 'left';
                ctx.fillText(label, padding.left, padding.top - 5);
            }

            // Y-axis labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '9px monospace';
            ctx.textAlign = 'right';
            for (let i = 0; i <= 4; i++) {
                const value = yMax - (yMax - yMin) * (i / 4);
                const y = padding.top + (height - padding.top - padding.bottom) * (i / 4);
                ctx.fillText(value.toFixed(0), padding.left - 5, y + 3);
            }
        }

        valueToY(value, yMin, yMax, height, padding) {
            const chartHeight = height - padding.top - padding.bottom;
            const normalized = (value - yMin) / (yMax - yMin);
            return padding.top + chartHeight * (1 - normalized);
        }

        // Create indicator gauge
        createGauge(elementId, options = {}) {
            const element = document.getElementById(elementId);
            if (!element) return null;

            element.innerHTML = `
                <div class="mg-gauge" style="position: relative; width: 100%; height: 100%;">
                    <svg viewBox="0 0 100 60" style="width: 100%; height: 100%;">
                        <defs>
                            <linearGradient id="gaugeGrad-${elementId}" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#FF0033"/>
                                <stop offset="50%" style="stop-color:#FFD700"/>
                                <stop offset="100%" style="stop-color:#00FF88"/>
                            </linearGradient>
                        </defs>
                        <path d="M 10 50 A 40 40 0 0 1 90 50" 
                              fill="none" 
                              stroke="rgba(255,255,255,0.1)" 
                              stroke-width="8"
                              stroke-linecap="round"/>
                        <path id="gaugeArc-${elementId}"
                              d="M 10 50 A 40 40 0 0 1 90 50" 
                              fill="none" 
                              stroke="url(#gaugeGrad-${elementId})" 
                              stroke-width="8"
                              stroke-linecap="round"
                              stroke-dasharray="0 126"/>
                        <text id="gaugeValue-${elementId}" x="50" y="45" 
                              text-anchor="middle" 
                              fill="#fff" 
                              font-family="Orbitron, monospace"
                              font-size="14"
                              font-weight="bold">0</text>
                        <text x="50" y="55" 
                              text-anchor="middle" 
                              fill="rgba(255,255,255,0.5)" 
                              font-family="Orbitron, monospace"
                              font-size="6">${options.unit || ''}</text>
                    </svg>
                </div>
            `;

            return { elementId, min: options.min || 0, max: options.max || 100 };
        }

        updateGauge(elementId, value) {
            const arc = document.getElementById(`gaugeArc-${elementId}`);
            const valueText = document.getElementById(`gaugeValue-${elementId}`);
            
            if (arc && valueText) {
                const gauge = { min: 0, max: 100 }; // Default, should be stored
                const normalized = MathUtils.clamp((value - gauge.min) / (gauge.max - gauge.min), 0, 1);
                const dashLength = normalized * 126; // Arc length
                
                arc.setAttribute('stroke-dasharray', `${dashLength} 126`);
                valueText.textContent = value.toFixed(1);
            }
        }

        destroy() {
            this.charts.clear();
            if (this.container) {
                this.container.innerHTML = '';
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AUDIO FEEDBACK SYSTEM
    // ═══════════════════════════════════════════════════════════════════════

    const AudioFeedback = {
        context: null,
        masterGain: null,
        initialized: false,
        muted: false,

        init: function() {
            if (this.initialized) return true;
            try {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
                this.masterGain = this.context.createGain();
                this.masterGain.connect(this.context.destination);
                this.masterGain.gain.value = 0.3;
                this.initialized = true;
                return true;
            } catch (e) {
                console.warn('[AudioFeedback] Web Audio not available');
                return false;
            }
        },

        resume: function() {
            if (this.context && this.context.state === 'suspended') {
                this.context.resume();
            }
        },

        // Mechanically meaningful sounds only
        playStateChange: function(type, intensity = 0.5) {
            if (!this.initialized || this.muted) return;
            this.resume();

            const sounds = {
                warning: { freq: 440, duration: 0.15, type: 'sine', count: 2 },
                critical: { freq: 880, duration: 0.1, type: 'sawtooth', count: 3 },
                success: { freq: [523, 659, 784], duration: 0.15, type: 'sine' },
                failure: { freq: [392, 349, 311], duration: 0.2, type: 'triangle' },
                tick: { freq: 1200, duration: 0.02, type: 'sine', count: 1 },
                levelUp: { freq: [523, 659, 784, 1047], duration: 0.12, type: 'sine' }
            };

            const sound = sounds[type];
            if (!sound) return;

            if (Array.isArray(sound.freq)) {
                sound.freq.forEach((f, i) => {
                    setTimeout(() => this.playTone(f, sound.duration, sound.type, intensity), i * 100);
                });
            } else {
                const count = sound.count || 1;
                for (let i = 0; i < count; i++) {
                    setTimeout(() => this.playTone(sound.freq, sound.duration, sound.type, intensity), i * 150);
                }
            }
        },

        playTone: function(freq, duration, type, volume) {
            if (!this.initialized || this.muted) return;
            
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, this.context.currentTime);
            
            gain.gain.setValueAtTime(volume * 0.3, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.context.currentTime + duration);
        },

        toggleMute: function() {
            this.muted = !this.muted;
            return this.muted;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class SimulationModule {
        constructor(containerId, options = {}) {
            this.containerId = containerId;
            this.options = options;
            this.state = new StateManager(this.getInitialState());
            this.clock = new SimulationClock({ 
                timeScale: options.timeScale || 1,
                stepsPerSecond: PerformanceDetector.detect().config.simulationSteps
            });
            this.visualization = new VisualizationController(containerId);
            this.isInitialized = false;
            this.isRunning = false;
        }

        // Override in subclass
        getInitialState() {
            return {};
        }

        // Override in subclass
        createUI() {
            // Build module UI
        }

        // Override in subclass - main simulation step
        simulationStep(dt, totalTime) {
            // Implement simulation logic
        }

        // Override in subclass
        updateVisualization() {
            // Update visual elements based on state
        }

        init() {
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.error(`[${this.constructor.name}] Container not found:`, this.containerId);
                return false;
            }

            // Initialize systems
            this.visualization.init();
            this.createUI();

            // Register simulation step
            this.clock.onStep((dt, totalTime) => {
                this.simulationStep(dt, totalTime);
                this.updateVisualization();
            });

            // State change logging
            this.state.subscribe('*', (value, key) => {
                // Could trigger audio feedback for critical state changes
            });

            this.isInitialized = true;
            console.log(`[${this.constructor.name}] Initialized`);
            return true;
        }

        start() {
            if (!this.isInitialized) {
                if (!this.init()) return false;
            }
            this.isRunning = true;
            this.clock.start();
            AudioFeedback.init();
            return true;
        }

        pause() {
            this.clock.pause();
        }

        resume() {
            this.clock.resume();
        }

        stop() {
            this.isRunning = false;
            this.clock.stop();
        }

        reset() {
            this.stop();
            this.state.reset();
            this.clock.reset();
            this.updateVisualization();
        }

        destroy() {
            this.stop();
            this.visualization.destroy();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT TO GLOBAL SCOPE
    // ═══════════════════════════════════════════════════════════════════════

    window.MuseumGradeEngine = {
        PerformanceDetector,
        MathUtils,
        StateManager,
        SimulationClock,
        CompartmentalModel,
        VisualizationController,
        AudioFeedback,
        SimulationModule,
        version: '2.0.0'
    };

    console.log('[MuseumGradeEngine] Core engine loaded v2.0.0');

})();
// v20260117-FULL
