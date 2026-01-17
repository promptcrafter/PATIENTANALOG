/**
 * BIOMETRIC VISUALIZATION SYSTEM (HUD)
 * PatientAnalog.com - Premium Visual Component
 * 
 * Creates a "Heads Up Display" bar with live medical data visualizations:
 * - EKG (heartbeat)
 * - Pulse waves
 * - Brain activity (EEG)
 * - Respiratory rate
 * 
 * USAGE:
 * 1. Add <div id="biometric-hud"></div> to your HTML
 * 2. Include this script
 * 3. Call BiometricHUD.init() or let it auto-initialize
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        height: 80,                     // HUD height in pixels
        backgroundColor: 'rgba(0, 8, 20, 0.95)',
        borderColor: 'rgba(0, 85, 255, 0.3)',
        gridColor: 'rgba(0, 85, 255, 0.1)',
        
        // EKG settings
        ekg: {
            color: '#00ffc8',
            glowColor: 'rgba(0, 255, 200, 0.5)',
            speed: 2,
            amplitude: 25,
            frequency: 0.8
        },
        
        // Pulse wave settings
        pulse: {
            color: '#ffaa00',
            glowColor: 'rgba(255, 170, 0, 0.5)',
            speed: 1.5,
            amplitude: 15
        },
        
        // Brain activity (EEG) settings
        brain: {
            color: '#0055ff',
            glowColor: 'rgba(0, 85, 255, 0.5)',
            speed: 3,
            amplitude: 12
        },
        
        // Respiratory settings
        respiratory: {
            color: '#ffc300',
            glowColor: 'rgba(255, 195, 0, 0.5)',
            speed: 0.5,
            amplitude: 18
        }
    };

    class BiometricHUD {
        constructor(containerId = 'biometric-hud') {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                this.createContainer(containerId);
            }
            
            this.canvas = null;
            this.ctx = null;
            this.animationId = null;
            this.time = 0;
            this.isVisible = true;
            this.dataPoints = {
                ekg: [],
                pulse: [],
                brain: [],
                respiratory: []
            };
            
            this.init();
        }

        createContainer(id) {
            this.container = document.createElement('div');
            this.container.id = id;
            
            // Insert after trust bar or at top of body
            const trustBar = document.querySelector('.trust-bar');
            if (trustBar && trustBar.nextSibling) {
                trustBar.parentNode.insertBefore(this.container, trustBar.nextSibling);
            } else {
                document.body.insertBefore(this.container, document.body.firstChild);
            }
        }

        init() {
            this.setupStyles();
            this.createCanvas();
            this.createLabels();
            this.createControls();
            this.setupResizeHandler();
            this.start();
        }

        setupStyles() {
            this.container.style.cssText = `
                position: fixed;
                top: 60px;
                left: 0;
                right: 0;
                height: ${CONFIG.height}px;
                background: ${CONFIG.backgroundColor};
                border-bottom: 1px solid ${CONFIG.borderColor};
                z-index: 998;
                display: flex;
                align-items: center;
                overflow: hidden;
                backdrop-filter: blur(10px);
                transition: transform 0.3s ease, opacity 0.3s ease;
            `;
            
            // Add glow effect
            const glowBar = document.createElement('div');
            glowBar.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, 
                    transparent, 
                    rgba(0, 85, 255, 0.5), 
                    rgba(255, 170, 0, 0.5), 
                    rgba(0, 255, 200, 0.5),
                    transparent
                );
                animation: hudGlow 3s ease-in-out infinite;
            `;
            this.container.appendChild(glowBar);
            
            // Add keyframe animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes hudGlow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                
                #biometric-hud.hidden {
                    transform: translateY(-100%);
                    opacity: 0;
                }
                
                .hud-label {
                    position: absolute;
                    font-family: 'Orbitron', monospace;
                    font-size: 8px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 2px;
                    pointer-events: none;
                }
                
                .hud-value {
                    font-family: 'Rajdhani', monospace;
                    font-size: 14px;
                    font-weight: 600;
                    margin-left: 8px;
                }
                
                .hud-toggle {
                    position: absolute;
                    right: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(0, 85, 255, 0.1);
                    border: 1px solid rgba(0, 85, 255, 0.3);
                    color: rgba(0, 85, 255, 0.8);
                    padding: 4px 10px;
                    font-family: 'Orbitron', monospace;
                    font-size: 8px;
                    cursor: pointer;
                    border-radius: 3px;
                    transition: all 0.2s ease;
                    z-index: 10;
                }
                
                .hud-toggle:hover {
                    background: rgba(0, 85, 255, 0.2);
                    border-color: rgba(0, 85, 255, 0.6);
                }
                
                /* Adjust body padding when HUD is visible */
                body.hud-active {
                    padding-top: 140px;
                }
                
                body.hud-active .sticky-nav {
                    top: ${60 + CONFIG.height}px;
                }
            `;
            document.head.appendChild(style);
        }

        createCanvas() {
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            `;
            this.container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
        }

        createLabels() {
            const labels = [
                { name: 'EKG', color: CONFIG.ekg.color, left: '5%', value: '72 BPM' },
                { name: 'PULSE', color: CONFIG.pulse.color, left: '28%', value: '98%' },
                { name: 'EEG', color: CONFIG.brain.color, left: '52%', value: 'α 10Hz' },
                { name: 'RESP', color: CONFIG.respiratory.color, left: '76%', value: '16/min' }
            ];
            
            labels.forEach(label => {
                const el = document.createElement('div');
                el.className = 'hud-label';
                el.style.cssText = `
                    left: ${label.left};
                    top: 8px;
                    color: ${label.color};
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid ${label.color}33;
                `;
                el.innerHTML = `${label.name}<span class="hud-value" style="color: ${label.color}">${label.value}</span>`;
                el.dataset.type = label.name.toLowerCase();
                this.container.appendChild(el);
            });
        }

        createControls() {
            const toggle = document.createElement('button');
            toggle.className = 'hud-toggle';
            toggle.textContent = 'HIDE HUD';
            toggle.addEventListener('click', () => this.toggle());
            this.container.appendChild(toggle);
            this.toggleBtn = toggle;
        }

        resizeCanvas() {
            const rect = this.container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            this.ctx.scale(dpr, dpr);
            this.width = rect.width;
            this.height = rect.height;
        }

        setupResizeHandler() {
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => this.resizeCanvas(), 100);
            });
        }

        // Generate EKG waveform (PQRST complex)
        generateEKG(t) {
            const period = 1 / CONFIG.ekg.frequency;
            const phase = (t % period) / period;
            
            // PQRST complex simulation
            if (phase < 0.1) {
                // P wave
                return Math.sin(phase * Math.PI / 0.1) * 0.2;
            } else if (phase < 0.15) {
                // PR segment
                return 0;
            } else if (phase < 0.18) {
                // Q wave
                return -0.1;
            } else if (phase < 0.22) {
                // R wave (main spike)
                const rPhase = (phase - 0.18) / 0.04;
                return rPhase < 0.5 ? rPhase * 2 : (1 - rPhase) * 2;
            } else if (phase < 0.26) {
                // S wave
                return -0.15 * (1 - (phase - 0.22) / 0.04);
            } else if (phase < 0.4) {
                // ST segment
                return 0;
            } else if (phase < 0.6) {
                // T wave
                return Math.sin((phase - 0.4) * Math.PI / 0.2) * 0.3;
            } else {
                // Baseline
                return 0;
            }
        }

        // Generate pulse wave
        generatePulse(t) {
            const freq = CONFIG.pulse.speed;
            const phase = (t * freq) % 1;
            
            // Dicrotic notch simulation
            if (phase < 0.3) {
                return Math.sin(phase * Math.PI / 0.3);
            } else if (phase < 0.4) {
                return 0.3 + Math.sin((phase - 0.3) * Math.PI / 0.1) * 0.2;
            } else {
                return 0.5 * Math.exp(-(phase - 0.4) * 5);
            }
        }

        // Generate brain waves (alpha rhythm with noise)
        generateBrain(t) {
            const alpha = Math.sin(t * 20) * 0.6;  // 10 Hz alpha
            const beta = Math.sin(t * 40) * 0.2;   // 20 Hz beta
            const noise = (Math.random() - 0.5) * 0.2;
            return alpha + beta + noise;
        }

        // Generate respiratory wave
        generateRespiratory(t) {
            return Math.sin(t * CONFIG.respiratory.speed * Math.PI * 2);
        }

        drawGrid() {
            const ctx = this.ctx;
            ctx.strokeStyle = CONFIG.gridColor;
            ctx.lineWidth = 0.5;
            
            // Vertical lines
            const vSpacing = 40;
            for (let x = 0; x < this.width; x += vSpacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.height);
                ctx.stroke();
            }
            
            // Horizontal center line
            ctx.beginPath();
            ctx.moveTo(0, this.height / 2);
            ctx.lineTo(this.width, this.height / 2);
            ctx.stroke();
        }

        drawWaveform(points, color, glowColor, sectionStart, sectionWidth) {
            const ctx = this.ctx;
            const centerY = this.height / 2;
            
            if (points.length < 2) return;
            
            // Glow effect
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            points.forEach((point, i) => {
                const x = sectionStart + (i / points.length) * sectionWidth;
                const y = centerY - point;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
            
            // Reset shadow
            ctx.shadowBlur = 0;
        }

        updateValues() {
            // Simulate varying values
            const labels = this.container.querySelectorAll('.hud-label');
            labels.forEach(label => {
                const valueEl = label.querySelector('.hud-value');
                const type = label.dataset.type;
                
                switch(type) {
                    case 'ekg':
                        valueEl.textContent = `${Math.floor(68 + Math.random() * 8)} BPM`;
                        break;
                    case 'pulse':
                        valueEl.textContent = `${Math.floor(96 + Math.random() * 4)}%`;
                        break;
                    case 'eeg':
                        valueEl.textContent = `α ${(9.5 + Math.random()).toFixed(1)}Hz`;
                        break;
                    case 'resp':
                        valueEl.textContent = `${Math.floor(14 + Math.random() * 4)}/min`;
                        break;
                }
            });
        }

        animate() {
            const ctx = this.ctx;
            const sectionWidth = this.width / 4;
            const maxPoints = 150;
            
            // Clear canvas
            ctx.fillStyle = CONFIG.backgroundColor;
            ctx.fillRect(0, 0, this.width, this.height);
            
            // Draw grid
            this.drawGrid();
            
            // Update time
            this.time += 0.016; // ~60fps
            
            // Generate new data points
            this.dataPoints.ekg.push(this.generateEKG(this.time) * CONFIG.ekg.amplitude);
            this.dataPoints.pulse.push(this.generatePulse(this.time) * CONFIG.pulse.amplitude);
            this.dataPoints.brain.push(this.generateBrain(this.time) * CONFIG.brain.amplitude);
            this.dataPoints.respiratory.push(this.generateRespiratory(this.time) * CONFIG.respiratory.amplitude);
            
            // Trim arrays
            Object.keys(this.dataPoints).forEach(key => {
                if (this.dataPoints[key].length > maxPoints) {
                    this.dataPoints[key].shift();
                }
            });
            
            // Draw waveforms
            this.drawWaveform(
                this.dataPoints.ekg, 
                CONFIG.ekg.color, 
                CONFIG.ekg.glowColor,
                0, sectionWidth
            );
            
            this.drawWaveform(
                this.dataPoints.pulse, 
                CONFIG.pulse.color, 
                CONFIG.pulse.glowColor,
                sectionWidth, sectionWidth
            );
            
            this.drawWaveform(
                this.dataPoints.brain, 
                CONFIG.brain.color, 
                CONFIG.brain.glowColor,
                sectionWidth * 2, sectionWidth
            );
            
            this.drawWaveform(
                this.dataPoints.respiratory, 
                CONFIG.respiratory.color, 
                CONFIG.respiratory.glowColor,
                sectionWidth * 3, sectionWidth
            );
            
            // Update numeric values occasionally
            if (Math.random() < 0.02) {
                this.updateValues();
            }
            
            // Continue animation
            if (this.isVisible) {
                this.animationId = requestAnimationFrame(() => this.animate());
            }
        }

        start() {
            document.body.classList.add('hud-active');
            this.isVisible = true;
            this.container.classList.remove('hidden');
            this.animate();
        }

        stop() {
            this.isVisible = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }

        toggle() {
            if (this.isVisible) {
                this.stop();
                this.container.classList.add('hidden');
                document.body.classList.remove('hud-active');
                this.toggleBtn.textContent = 'SHOW HUD';
            } else {
                this.start();
                this.toggleBtn.textContent = 'HIDE HUD';
            }
        }

        destroy() {
            this.stop();
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
            document.body.classList.remove('hud-active');
        }
    }

    // Auto-initialize and expose globally
    let hudInstance = null;

    window.BiometricHUD = {
        init: (containerId) => {
            if (!hudInstance) {
                hudInstance = new BiometricHUD(containerId);
            }
            return hudInstance;
        },
        toggle: () => hudInstance && hudInstance.toggle(),
        show: () => hudInstance && hudInstance.start(),
        hide: () => hudInstance && hudInstance.stop(),
        destroy: () => {
            if (hudInstance) {
                hudInstance.destroy();
                hudInstance = null;
            }
        }
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Check if user has a preference set
            const savedState = localStorage.getItem('biometricHudVisible');
            if (savedState !== 'false') {
                window.BiometricHUD.init();
            }
        });
    } else {
        const savedState = localStorage.getItem('biometricHudVisible');
        if (savedState !== 'false') {
            window.BiometricHUD.init();
        }
    }

})();

/*
 * ============================================================
 * INSTALLATION
 * ============================================================
 * 
 * Add to your HTML:
 * <script src="js/biometric-hud.js"></script>
 * 
 * Or with container:
 * <div id="biometric-hud"></div>
 * <script src="js/biometric-hud.js"></script>
 * 
 * ============================================================
 * API
 * ============================================================
 * 
 * BiometricHUD.init()     - Initialize the HUD
 * BiometricHUD.toggle()   - Show/hide the HUD
 * BiometricHUD.show()     - Show the HUD
 * BiometricHUD.hide()     - Hide the HUD
 * BiometricHUD.destroy()  - Remove the HUD completely
 * 
 */
