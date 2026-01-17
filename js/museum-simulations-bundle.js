/**
 * PatientAnalog.com - Museum-Grade Scientific Simulations Bundle
 * Self-contained, no external dependencies
 * ALL 15 MODULES - 4 COMPLETE, 11 PENDING
 * 
 * @version 4.0.0 - RNA Structure Lab NOW COMPLETE
 */

(function() {
    'use strict';

    console.log('[MuseumSims] Loading v4.0.0 - 4/15 modules complete...');

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function gaussian() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    function formatNumber(n, decimals = 1) {
        return Number(n).toFixed(decimals);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULES 1-3: COMPLETE (Lung, PK, Kidney)
    // ═══════════════════════════════════════════════════════════════════════

// MODULE 1: LUNG-ON-CHIP SIMULATOR
    // ═══════════════════════════════════════════════════════════════════════

    function initLungChipSimulator(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[LungChip] Container not found:', containerId);
            return;
        }

        let state = {
            pO2: 100,           // Partial pressure O2 (mmHg)
            pCO2: 40,           // Partial pressure CO2 (mmHg)
            surfactant: 100,    // Surfactant level (%)
            barrier: 100,       // Barrier integrity (%)
            inflammation: 0,    // Inflammation level (0-100)
            breathRate: 15,     // Breaths per minute
            tidalVolume: 500,   // mL
            peep: 5,            // Positive end-expiratory pressure
            fio2: 21,           // Fraction inspired O2 (%)
            drugConc: 0,        // Drug concentration
            running: false,
            time: 0,
            breathPhase: 0      // 0-1 cycle
        };

        container.innerHTML = `
            <div style="width:100%;height:100%;background:linear-gradient(135deg,#050510,#0a0a20);border-radius:12px;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;color:#e0f2fe;display:flex;flex-direction:column;">
                <div style="padding:12px 16px;background:linear-gradient(90deg,rgba(0,150,255,0.15),rgba(255,100,150,0.1));border-bottom:1px solid rgba(0,200,255,0.2);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:15px;color:#00d4ff;">🫁 Lung-on-Chip Simulator</h3>
                            <p style="margin:2px 0 0;font-size:10px;color:rgba(255,255,255,0.5);">Alveolar Gas Exchange Model</p>
                        </div>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <span id="lung-status-${containerId}" style="padding:3px 10px;background:rgba(0,255,136,0.2);border:1px solid #00ff88;border-radius:10px;font-size:9px;color:#00ff88;">READY</span>
                            <span id="lung-time-${containerId}" style="font-size:11px;color:#ffd700;">0:00</span>
                        </div>
                    </div>
                </div>
                <div style="flex:1;display:grid;grid-template-columns:1fr 200px;gap:10px;padding:10px;overflow:hidden;">
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <canvas id="lung-canvas-${containerId}" style="flex:1;background:#030308;border-radius:8px;border:1px solid rgba(0,200,255,0.2);"></canvas>
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
                            <div style="text-align:center;padding:8px;background:rgba(0,200,255,0.1);border-radius:6px;border:1px solid rgba(0,200,255,0.2);">
                                <div style="font-size:18px;color:#00d4ff;" id="lung-po2-${containerId}">100</div>
                                <div style="font-size:9px;color:rgba(255,255,255,0.5);">PaO₂ mmHg</div>
                            </div>
                            <div style="text-align:center;padding:8px;background:rgba(255,100,100,0.1);border-radius:6px;border:1px solid rgba(255,100,100,0.2);">
                                <div style="font-size:18px;color:#ff6b6b;" id="lung-pco2-${containerId}">40</div>
                                <div style="font-size:9px;color:rgba(255,255,255,0.5);">PaCO₂ mmHg</div>
                            </div>
                            <div style="text-align:center;padding:8px;background:rgba(255,200,0,0.1);border-radius:6px;border:1px solid rgba(255,200,0,0.2);">
                                <div style="font-size:18px;color:#ffd700;" id="lung-surf-${containerId}">100</div>
                                <div style="font-size:9px;color:rgba(255,255,255,0.5);">Surfactant %</div>
                            </div>
                            <div style="text-align:center;padding:8px;background:rgba(255,0,100,0.1);border-radius:6px;border:1px solid rgba(255,0,100,0.2);">
                                <div style="font-size:18px;color:#ff0066;" id="lung-infl-${containerId}">0</div>
                                <div style="font-size:9px;color:rgba(255,255,255,0.5);">Inflam %</div>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;overflow-y:auto;">
                        <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                            <div style="font-size:10px;color:#00ff88;margin-bottom:8px;">⚙️ Ventilator Settings</div>
                            <div style="margin-bottom:8px;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;"><span>Breath Rate</span><span id="lung-br-val-${containerId}">15/min</span></div>
                                <input type="range" id="lung-br-${containerId}" min="8" max="30" value="15" style="width:100%;accent-color:#00ff88;">
                            </div>
                            <div style="margin-bottom:8px;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;"><span>Tidal Volume</span><span id="lung-tv-val-${containerId}">500mL</span></div>
                                <input type="range" id="lung-tv-${containerId}" min="200" max="800" value="500" style="width:100%;accent-color:#00ff88;">
                            </div>
                            <div style="margin-bottom:8px;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;"><span>FiO₂</span><span id="lung-fio2-val-${containerId}">21%</span></div>
                                <input type="range" id="lung-fio2-${containerId}" min="21" max="100" value="21" style="width:100%;accent-color:#00d4ff;">
                            </div>
                            <div>
                                <div style="display:flex;justify-content:space-between;font-size:9px;"><span>PEEP</span><span id="lung-peep-val-${containerId}">5 cmH₂O</span></div>
                                <input type="range" id="lung-peep-${containerId}" min="0" max="20" value="5" style="width:100%;accent-color:#ffd700;">
                            </div>
                        </div>
                        <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                            <div style="font-size:10px;color:#ff6b9d;margin-bottom:8px;">💊 Interventions</div>
                            <button id="lung-surfactant-${containerId}" style="width:100%;padding:6px;margin-bottom:5px;background:rgba(255,200,0,0.2);border:1px solid #ffd700;border-radius:4px;color:#ffd700;font-size:9px;cursor:pointer;">Administer Surfactant</button>
                            <button id="lung-steroid-${containerId}" style="width:100%;padding:6px;margin-bottom:5px;background:rgba(157,0,255,0.2);border:1px solid #9d00ff;border-radius:4px;color:#9d00ff;font-size:9px;cursor:pointer;">Anti-inflammatory</button>
                            <button id="lung-injury-${containerId}" style="width:100%;padding:6px;background:rgba(255,0,50,0.2);border:1px solid #ff0033;border-radius:4px;color:#ff0033;font-size:9px;cursor:pointer;">⚠️ Induce ARDS</button>
                        </div>
                        <div style="display:flex;gap:5px;margin-top:auto;">
                            <button id="lung-start-${containerId}" style="flex:1;padding:8px;background:rgba(0,255,136,0.3);border:1px solid #00ff88;border-radius:6px;color:#00ff88;font-size:11px;cursor:pointer;">▶ Start</button>
                            <button id="lung-reset-${containerId}" style="flex:1;padding:8px;background:rgba(255,100,100,0.2);border:1px solid #ff6b6b;border-radius:6px;color:#ff6b6b;font-size:11px;cursor:pointer;">↺ Reset</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const canvas = document.getElementById(`lung-canvas-${containerId}`);
        const ctx = canvas.getContext('2d');
        let animationId = null;

        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * (window.devicePixelRatio || 1);
            canvas.height = rect.height * (window.devicePixelRatio || 1);
            ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Bind controls
        document.getElementById(`lung-br-${containerId}`).addEventListener('input', function() {
            state.breathRate = parseInt(this.value);
            document.getElementById(`lung-br-val-${containerId}`).textContent = this.value + '/min';
        });
        document.getElementById(`lung-tv-${containerId}`).addEventListener('input', function() {
            state.tidalVolume = parseInt(this.value);
            document.getElementById(`lung-tv-val-${containerId}`).textContent = this.value + 'mL';
        });
        document.getElementById(`lung-fio2-${containerId}`).addEventListener('input', function() {
            state.fio2 = parseInt(this.value);
            document.getElementById(`lung-fio2-val-${containerId}`).textContent = this.value + '%';
        });
        document.getElementById(`lung-peep-${containerId}`).addEventListener('input', function() {
            state.peep = parseInt(this.value);
            document.getElementById(`lung-peep-val-${containerId}`).textContent = this.value + ' cmH₂O';
        });

        document.getElementById(`lung-surfactant-${containerId}`).addEventListener('click', function() {
            state.surfactant = Math.min(100, state.surfactant + 30);
        });
        document.getElementById(`lung-steroid-${containerId}`).addEventListener('click', function() {
            state.inflammation = Math.max(0, state.inflammation - 20);
            state.drugConc = 50;
        });
        document.getElementById(`lung-injury-${containerId}`).addEventListener('click', function() {
            state.inflammation = Math.min(100, state.inflammation + 40);
            state.surfactant = Math.max(20, state.surfactant - 30);
            state.barrier = Math.max(30, state.barrier - 25);
        });

        document.getElementById(`lung-start-${containerId}`).addEventListener('click', function() {
            state.running = !state.running;
            this.textContent = state.running ? '⏸ Pause' : '▶ Start';
            this.style.background = state.running ? 'rgba(255,200,0,0.3)' : 'rgba(0,255,136,0.3)';
            this.style.borderColor = state.running ? '#ffd700' : '#00ff88';
            this.style.color = state.running ? '#ffd700' : '#00ff88';
            document.getElementById(`lung-status-${containerId}`).textContent = state.running ? 'RUNNING' : 'PAUSED';
            document.getElementById(`lung-status-${containerId}`).style.background = state.running ? 'rgba(255,200,0,0.2)' : 'rgba(0,255,136,0.2)';
            document.getElementById(`lung-status-${containerId}`).style.borderColor = state.running ? '#ffd700' : '#00ff88';
            document.getElementById(`lung-status-${containerId}`).style.color = state.running ? '#ffd700' : '#00ff88';
        });

        document.getElementById(`lung-reset-${containerId}`).addEventListener('click', function() {
            state = {
                pO2: 100, pCO2: 40, surfactant: 100, barrier: 100, inflammation: 0,
                breathRate: 15, tidalVolume: 500, peep: 5, fio2: 21, drugConc: 0,
                running: false, time: 0, breathPhase: 0
            };
            document.getElementById(`lung-start-${containerId}`).textContent = '▶ Start';
            document.getElementById(`lung-status-${containerId}`).textContent = 'READY';
            updateDisplay();
        });

        function simulate(dt) {
            if (!state.running) return;

            state.time += dt;
            state.breathPhase = (state.breathPhase + dt * state.breathRate / 60) % 1;

            // Gas exchange based on FiO2 and barrier integrity
            const targetPO2 = state.fio2 * 0.95 * (state.barrier / 100) * (state.surfactant / 100);
            state.pO2 = lerp(state.pO2, targetPO2 + gaussian() * 2, 0.02);
            state.pO2 = clamp(state.pO2, 40, 150);

            // CO2 clearance
            const ventilation = (state.tidalVolume * state.breathRate) / 1000;
            const targetPCO2 = 40 + (1 - ventilation / 10) * 20 + state.inflammation * 0.3;
            state.pCO2 = lerp(state.pCO2, targetPCO2 + gaussian() * 1, 0.02);
            state.pCO2 = clamp(state.pCO2, 20, 80);

            // Surfactant depletion with high tidal volumes
            if (state.tidalVolume > 600) {
                state.surfactant = Math.max(20, state.surfactant - dt * 0.5);
            } else {
                state.surfactant = Math.min(100, state.surfactant + dt * 0.1);
            }

            // Inflammation affects barrier
            if (state.inflammation > 30) {
                state.barrier = Math.max(30, state.barrier - dt * 0.2);
            } else {
                state.barrier = Math.min(100, state.barrier + dt * 0.1);
            }

            // Drug decay
            state.drugConc = Math.max(0, state.drugConc - dt * 2);
            if (state.drugConc > 10) {
                state.inflammation = Math.max(0, state.inflammation - dt * 0.5);
            }
        }

        function updateDisplay() {
            document.getElementById(`lung-po2-${containerId}`).textContent = Math.round(state.pO2);
            document.getElementById(`lung-pco2-${containerId}`).textContent = Math.round(state.pCO2);
            document.getElementById(`lung-surf-${containerId}`).textContent = Math.round(state.surfactant);
            document.getElementById(`lung-infl-${containerId}`).textContent = Math.round(state.inflammation);
            
            const mins = Math.floor(state.time / 60);
            const secs = Math.floor(state.time % 60);
            document.getElementById(`lung-time-${containerId}`).textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

            // Color coding for pO2
            const po2El = document.getElementById(`lung-po2-${containerId}`);
            if (state.pO2 < 60) po2El.style.color = '#ff0033';
            else if (state.pO2 < 80) po2El.style.color = '#ffd700';
            else po2El.style.color = '#00d4ff';
        }

        function render() {
            const w = canvas.width / (window.devicePixelRatio || 1);
            const h = canvas.height / (window.devicePixelRatio || 1);
            
            ctx.fillStyle = '#030308';
            ctx.fillRect(0, 0, w, h);

            const centerX = w / 2;
            const centerY = h / 2;
            
            // Draw alveoli (breathing animation)
            const breathScale = 0.8 + 0.2 * Math.sin(state.breathPhase * Math.PI * 2);
            const baseRadius = Math.min(w, h) * 0.15;
            
            // Multiple alveoli
            const positions = [
                { x: centerX - baseRadius * 1.5, y: centerY - baseRadius * 0.5 },
                { x: centerX + baseRadius * 1.5, y: centerY - baseRadius * 0.5 },
                { x: centerX, y: centerY + baseRadius },
                { x: centerX - baseRadius * 0.8, y: centerY - baseRadius * 1.5 },
                { x: centerX + baseRadius * 0.8, y: centerY - baseRadius * 1.5 }
            ];

            positions.forEach((pos, i) => {
                const r = baseRadius * (0.7 + i * 0.1) * breathScale;
                
                // Glow based on oxygenation
                const oxyColor = state.pO2 > 80 ? `rgba(0,200,255,${0.3 * state.pO2/100})` : `rgba(255,100,100,${0.3})`;
                const gradient = ctx.createRadialGradient(pos.x, pos.y, r * 0.3, pos.x, pos.y, r);
                gradient.addColorStop(0, oxyColor);
                gradient.addColorStop(0.7, 'rgba(255,150,150,0.1)');
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
                ctx.fill();

                // Alveolus wall
                ctx.strokeStyle = state.barrier > 70 ? 'rgba(0,255,200,0.4)' : 'rgba(255,100,100,0.4)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
                ctx.stroke();

                // Surfactant coating (inner ring)
                if (state.surfactant > 50) {
                    ctx.strokeStyle = `rgba(255,200,0,${state.surfactant / 200})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, r * 0.85, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });

            // O2 particles flowing in
            ctx.fillStyle = 'rgba(0,200,255,0.8)';
            for (let i = 0; i < 10; i++) {
                const t = (state.time * 2 + i * 0.3) % 3;
                const x = centerX + Math.sin(i) * 30 + (t < 1.5 ? -w/3 + t * w/2 : 0);
                const y = centerY - 20 + Math.cos(i * 2) * 15;
                if (t < 1.5) {
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // CO2 particles flowing out
            ctx.fillStyle = 'rgba(255,100,100,0.8)';
            for (let i = 0; i < 8; i++) {
                const t = (state.time * 1.5 + i * 0.4) % 3;
                const x = centerX + Math.sin(i + 5) * 30 + (t < 1.5 ? t * w/2 : 0);
                const y = centerY + 20 + Math.cos(i * 2 + 3) * 15;
                if (t < 1.5 && t > 0.5) {
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Inflammation overlay
            if (state.inflammation > 20) {
                ctx.fillStyle = `rgba(255,50,50,${state.inflammation / 400})`;
                ctx.fillRect(0, 0, w, h);
            }

            // Labels
            ctx.fillStyle = '#fff';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('O₂ →', 30, centerY - 15);
            ctx.fillText('← CO₂', w - 30, centerY + 25);
        }

        function gameLoop() {
            simulate(1/30);
            updateDisplay();
            render();
            animationId = requestAnimationFrame(gameLoop);
        }

        gameLoop();
        console.log('[LungChip] Initialized:', containerId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE 2: PK DIGITAL TWIN
    // ═══════════════════════════════════════════════════════════════════════

    function initPKDigitalTwin(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[PKTwin] Container not found:', containerId);
            return;
        }

        let state = {
            dose: 100,              // mg
            interval: 12,           // hours
            clearance: 5,           // L/h
            volume: 70,             // L (volume of distribution)
            bioavailability: 0.8,
            halfLife: 0,
            concentrations: [],     // Time series
            time: 0,
            running: false,
            lastDose: 0,
            cMax: 0,
            cMin: 0,
            auc: 0,
            therapeuticMin: 5,
            therapeuticMax: 20,
            toxicLevel: 30
        };

        // Calculate half-life
        state.halfLife = (0.693 * state.volume) / state.clearance;

        container.innerHTML = `
            <div style="width:100%;height:100%;background:linear-gradient(135deg,#0a0515,#150520);border-radius:12px;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;color:#e0f2fe;display:flex;flex-direction:column;">
                <div style="padding:12px 16px;background:linear-gradient(90deg,rgba(157,0,255,0.15),rgba(0,200,255,0.1));border-bottom:1px solid rgba(157,0,255,0.2);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:15px;color:#9d00ff;">💊 PK Digital Twin</h3>
                            <p style="margin:2px 0 0;font-size:10px;color:rgba(255,255,255,0.5);">Multi-Compartment Pharmacokinetics</p>
                        </div>
                        <span id="pk-time-${containerId}" style="font-size:11px;color:#ffd700;">Hour 0</span>
                    </div>
                </div>
                <div style="flex:1;display:grid;grid-template-columns:1fr 180px;gap:10px;padding:10px;overflow:hidden;">
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <canvas id="pk-canvas-${containerId}" style="flex:1;background:#030308;border-radius:8px;border:1px solid rgba(157,0,255,0.2);"></canvas>
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
                            <div style="text-align:center;padding:8px;background:rgba(0,255,136,0.1);border-radius:6px;">
                                <div style="font-size:16px;color:#00ff88;" id="pk-cmax-${containerId}">0</div>
                                <div style="font-size:9px;color:rgba(255,255,255,0.5);">Cmax μg/mL</div>
                            </div>
                            <div style="text-align:center;padding:8px;background:rgba(255,200,0,0.1);border-radius:6px;">
                                <div style="font-size:16px;color:#ffd700;" id="pk-cmin-${containerId}">0</div>
                                <div style="font-size:9px;color:rgba(255,255,255,0.5);">Cmin μg/mL</div>
                            </div>
                            <div style="text-align:center;padding:8px;background:rgba(0,200,255,0.1);border-radius:6px;">
                                <div style="font-size:16px;color:#00d4ff;" id="pk-auc-${containerId}">0</div>
                                <div style="font-size:9px;color:rgba(255,255,255,0.5);">AUC</div>
                            </div>
                            <div style="text-align:center;padding:8px;background:rgba(157,0,255,0.1);border-radius:6px;">
                                <div style="font-size:16px;color:#9d00ff;" id="pk-half-${containerId}">0</div>
                                <div style="font-size:9px;color:rgba(255,255,255,0.5);">t½ hours</div>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;overflow-y:auto;">
                        <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                            <div style="font-size:10px;color:#00ff88;margin-bottom:8px;">💉 Dosing</div>
                            <div style="margin-bottom:8px;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;"><span>Dose</span><span id="pk-dose-val-${containerId}">100 mg</span></div>
                                <input type="range" id="pk-dose-${containerId}" min="25" max="500" value="100" style="width:100%;accent-color:#00ff88;">
                            </div>
                            <div style="margin-bottom:8px;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;"><span>Interval</span><span id="pk-int-val-${containerId}">12 h</span></div>
                                <input type="range" id="pk-int-${containerId}" min="4" max="24" value="12" style="width:100%;accent-color:#ffd700;">
                            </div>
                        </div>
                        <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                            <div style="font-size:10px;color:#9d00ff;margin-bottom:8px;">🧬 Patient Parameters</div>
                            <div style="margin-bottom:8px;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;"><span>Clearance</span><span id="pk-cl-val-${containerId}">5 L/h</span></div>
                                <input type="range" id="pk-cl-${containerId}" min="1" max="15" value="5" style="width:100%;accent-color:#9d00ff;">
                            </div>
                            <div>
                                <div style="display:flex;justify-content:space-between;font-size:9px;"><span>Volume</span><span id="pk-vol-val-${containerId}">70 L</span></div>
                                <input type="range" id="pk-vol-${containerId}" min="30" max="150" value="70" style="width:100%;accent-color:#00d4ff;">
                            </div>
                        </div>
                        <button id="pk-dose-btn-${containerId}" style="padding:10px;background:rgba(0,255,136,0.3);border:1px solid #00ff88;border-radius:6px;color:#00ff88;font-size:11px;cursor:pointer;">💊 Administer Dose</button>
                        <div style="display:flex;gap:5px;margin-top:auto;">
                            <button id="pk-start-${containerId}" style="flex:1;padding:8px;background:rgba(157,0,255,0.3);border:1px solid #9d00ff;border-radius:6px;color:#9d00ff;font-size:11px;cursor:pointer;">▶ Start</button>
                            <button id="pk-reset-${containerId}" style="flex:1;padding:8px;background:rgba(255,100,100,0.2);border:1px solid #ff6b6b;border-radius:6px;color:#ff6b6b;font-size:11px;cursor:pointer;">↺ Reset</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const canvas = document.getElementById(`pk-canvas-${containerId}`);
        const ctx = canvas.getContext('2d');
        let animationId = null;

        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * (window.devicePixelRatio || 1);
            canvas.height = rect.height * (window.devicePixelRatio || 1);
            ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        function updateHalfLife() {
            state.halfLife = (0.693 * state.volume) / state.clearance;
            document.getElementById(`pk-half-${containerId}`).textContent = formatNumber(state.halfLife, 1);
        }

        // Bind controls
        document.getElementById(`pk-dose-${containerId}`).addEventListener('input', function() {
            state.dose = parseInt(this.value);
            document.getElementById(`pk-dose-val-${containerId}`).textContent = this.value + ' mg';
        });
        document.getElementById(`pk-int-${containerId}`).addEventListener('input', function() {
            state.interval = parseInt(this.value);
            document.getElementById(`pk-int-val-${containerId}`).textContent = this.value + ' h';
        });
        document.getElementById(`pk-cl-${containerId}`).addEventListener('input', function() {
            state.clearance = parseInt(this.value);
            document.getElementById(`pk-cl-val-${containerId}`).textContent = this.value + ' L/h';
            updateHalfLife();
        });
        document.getElementById(`pk-vol-${containerId}`).addEventListener('input', function() {
            state.volume = parseInt(this.value);
            document.getElementById(`pk-vol-val-${containerId}`).textContent = this.value + ' L';
            updateHalfLife();
        });

        document.getElementById(`pk-dose-btn-${containerId}`).addEventListener('click', function() {
            state.lastDose = state.time;
            const peakConc = (state.dose * state.bioavailability) / state.volume;
            if (state.concentrations.length > 0) {
                const current = state.concentrations[state.concentrations.length - 1].c;
                state.concentrations.push({ t: state.time, c: current + peakConc });
            } else {
                state.concentrations.push({ t: state.time, c: peakConc });
            }
        });

        document.getElementById(`pk-start-${containerId}`).addEventListener('click', function() {
            state.running = !state.running;
            this.textContent = state.running ? '⏸ Pause' : '▶ Start';
        });

        document.getElementById(`pk-reset-${containerId}`).addEventListener('click', function() {
            state.concentrations = [];
            state.time = 0;
            state.running = false;
            state.cMax = 0;
            state.cMin = 0;
            state.auc = 0;
            document.getElementById(`pk-start-${containerId}`).textContent = '▶ Start';
        });

        function simulate(dt) {
            if (!state.running) return;

            state.time += dt;

            // Calculate current concentration with exponential decay
            if (state.concentrations.length > 0) {
                const lastConc = state.concentrations[state.concentrations.length - 1];
                const ke = state.clearance / state.volume; // elimination rate constant
                const newConc = lastConc.c * Math.exp(-ke * dt);
                state.concentrations.push({ t: state.time, c: newConc + gaussian() * 0.1 });

                // Keep only last 200 points
                if (state.concentrations.length > 200) {
                    state.concentrations = state.concentrations.slice(-200);
                }

                // Update stats
                const concs = state.concentrations.map(p => p.c);
                state.cMax = Math.max(...concs);
                state.cMin = Math.min(...concs.filter(c => c > 0.1));
                state.auc += newConc * dt;
            }

            // Auto-dose at intervals
            if (state.time - state.lastDose >= state.interval && state.lastDose > 0) {
                document.getElementById(`pk-dose-btn-${containerId}`).click();
            }
        }

        function render() {
            const w = canvas.width / (window.devicePixelRatio || 1);
            const h = canvas.height / (window.devicePixelRatio || 1);
            
            ctx.fillStyle = '#030308';
            ctx.fillRect(0, 0, w, h);

            // Draw grid
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const y = h * i / 5;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            // Draw therapeutic window
            const maxConc = 40;
            const minY = h - (state.therapeuticMin / maxConc) * h;
            const maxY = h - (state.therapeuticMax / maxConc) * h;
            const toxY = h - (state.toxicLevel / maxConc) * h;

            ctx.fillStyle = 'rgba(0,255,136,0.1)';
            ctx.fillRect(0, maxY, w, minY - maxY);

            ctx.fillStyle = 'rgba(255,0,50,0.1)';
            ctx.fillRect(0, 0, w, toxY);

            // Draw labels
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '9px sans-serif';
            ctx.fillText('Toxic', 5, toxY + 12);
            ctx.fillStyle = 'rgba(0,255,136,0.7)';
            ctx.fillText('Therapeutic', 5, (minY + maxY) / 2);

            // Draw concentration curve
            if (state.concentrations.length > 1) {
                ctx.strokeStyle = '#9d00ff';
                ctx.lineWidth = 2;
                ctx.beginPath();

                const startTime = state.concentrations[0].t;
                const timeRange = Math.max(24, state.time - startTime);

                state.concentrations.forEach((point, i) => {
                    const x = ((point.t - startTime) / timeRange) * w;
                    const y = h - (point.c / maxConc) * h;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();

                // Glow effect
                ctx.strokeStyle = 'rgba(157,0,255,0.3)';
                ctx.lineWidth = 6;
                ctx.stroke();
            }

            // Current concentration marker
            if (state.concentrations.length > 0) {
                const current = state.concentrations[state.concentrations.length - 1];
                const y = h - (current.c / maxConc) * h;
                
                ctx.fillStyle = current.c > state.toxicLevel ? '#ff0033' : 
                               current.c > state.therapeuticMin ? '#00ff88' : '#ffd700';
                ctx.beginPath();
                ctx.arc(w - 10, y, 6, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(formatNumber(current.c, 1) + ' μg/mL', w - 20, y + 4);
            }

            // Time axis
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Time (hours)', w / 2, h - 5);
        }

        function updateDisplay() {
            document.getElementById(`pk-time-${containerId}`).textContent = 'Hour ' + Math.floor(state.time);
            document.getElementById(`pk-cmax-${containerId}`).textContent = formatNumber(state.cMax, 1);
            document.getElementById(`pk-cmin-${containerId}`).textContent = formatNumber(state.cMin || 0, 1);
            document.getElementById(`pk-auc-${containerId}`).textContent = formatNumber(state.auc, 0);
        }

        function gameLoop() {
            simulate(0.1); // 0.1 hour per frame = 6 min
            updateDisplay();
            render();
            animationId = requestAnimationFrame(gameLoop);
        }

        updateHalfLife();
        gameLoop();
        console.log('[PKTwin] Initialized:', containerId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE 3: KIDNEY NEPHRON SIMULATOR
    // ═══════════════════════════════════════════════════════════════════════

    function initKidneySimulator(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[Kidney] Container not found:', containerId);
            return;
        }

        let state = {
            gfr: 120,               // mL/min (normal 90-120)
            bun: 15,                // mg/dL (normal 7-20)
            creatinine: 1.0,        // mg/dL (normal 0.7-1.3)
            sodium: 140,            // mEq/L (normal 136-145)
            potassium: 4.0,         // mEq/L (normal 3.5-5.0)
            urine: 1500,            // mL/day
            reabsorption: 99,       // %
            bloodPressure: 120,
            running: false,
            time: 0,
            injury: 0,              // 0-5 AKI stage
            diuretic: null
        };

        container.innerHTML = `
            <div style="width:100%;height:100%;background:linear-gradient(135deg,#100508,#200a10);border-radius:12px;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;color:#e0f2fe;display:flex;flex-direction:column;">
                <div style="padding:12px 16px;background:linear-gradient(90deg,rgba(255,100,100,0.15),rgba(255,200,100,0.1));border-bottom:1px solid rgba(255,100,100,0.2);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:15px;color:#ff6b6b;">🫘 Kidney Nephron Simulator</h3>
                            <p style="margin:2px 0 0;font-size:10px;color:rgba(255,255,255,0.5);">Glomerular Filtration & Tubular Function</p>
                        </div>
                        <div id="kidney-aki-${containerId}" style="padding:3px 10px;background:rgba(0,255,136,0.2);border:1px solid #00ff88;border-radius:10px;font-size:9px;color:#00ff88;">NORMAL</div>
                    </div>
                </div>
                <div style="flex:1;display:grid;grid-template-columns:1fr 180px;gap:10px;padding:10px;overflow:hidden;">
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <canvas id="kidney-canvas-${containerId}" style="flex:1;background:#030308;border-radius:8px;border:1px solid rgba(255,100,100,0.2);"></canvas>
                        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">
                            <div style="text-align:center;padding:6px;background:rgba(0,200,255,0.1);border-radius:6px;">
                                <div style="font-size:14px;color:#00d4ff;" id="kidney-gfr-${containerId}">120</div>
                                <div style="font-size:8px;color:rgba(255,255,255,0.5);">GFR</div>
                            </div>
                            <div style="text-align:center;padding:6px;background:rgba(255,200,0,0.1);border-radius:6px;">
                                <div style="font-size:14px;color:#ffd700;" id="kidney-bun-${containerId}">15</div>
                                <div style="font-size:8px;color:rgba(255,255,255,0.5);">BUN</div>
                            </div>
                            <div style="text-align:center;padding:6px;background:rgba(255,100,100,0.1);border-radius:6px;">
                                <div style="font-size:14px;color:#ff6b6b;" id="kidney-cr-${containerId}">1.0</div>
                                <div style="font-size:8px;color:rgba(255,255,255,0.5);">Cr</div>
                            </div>
                            <div style="text-align:center;padding:6px;background:rgba(0,255,136,0.1);border-radius:6px;">
                                <div style="font-size:14px;color:#00ff88;" id="kidney-na-${containerId}">140</div>
                                <div style="font-size:8px;color:rgba(255,255,255,0.5);">Na+</div>
                            </div>
                            <div style="text-align:center;padding:6px;background:rgba(157,0,255,0.1);border-radius:6px;">
                                <div style="font-size:14px;color:#9d00ff;" id="kidney-k-${containerId}">4.0</div>
                                <div style="font-size:8px;color:rgba(255,255,255,0.5);">K+</div>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;overflow-y:auto;">
                        <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                            <div style="font-size:10px;color:#00d4ff;margin-bottom:8px;">🩸 Hemodynamics</div>
                            <div style="margin-bottom:8px;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;"><span>Blood Pressure</span><span id="kidney-bp-val-${containerId}">120 mmHg</span></div>
                                <input type="range" id="kidney-bp-${containerId}" min="60" max="180" value="120" style="width:100%;accent-color:#ff6b6b;">
                            </div>
                        </div>
                        <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                            <div style="font-size:10px;color:#ffd700;margin-bottom:8px;">💊 Diuretics</div>
                            <button id="kidney-furo-${containerId}" style="width:100%;padding:5px;margin-bottom:4px;background:rgba(0,200,255,0.2);border:1px solid #00d4ff;border-radius:4px;color:#00d4ff;font-size:9px;cursor:pointer;">Furosemide (Loop)</button>
                            <button id="kidney-thia-${containerId}" style="width:100%;padding:5px;margin-bottom:4px;background:rgba(0,255,136,0.2);border:1px solid #00ff88;border-radius:4px;color:#00ff88;font-size:9px;cursor:pointer;">Thiazide (DCT)</button>
                            <button id="kidney-spiro-${containerId}" style="width:100%;padding:5px;background:rgba(157,0,255,0.2);border:1px solid #9d00ff;border-radius:4px;color:#9d00ff;font-size:9px;cursor:pointer;">Spironolactone (CD)</button>
                        </div>
                        <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                            <div style="font-size:10px;color:#ff0033;margin-bottom:8px;">⚠️ Nephrotoxins</div>
                            <button id="kidney-nsaid-${containerId}" style="width:100%;padding:5px;margin-bottom:4px;background:rgba(255,100,0,0.2);border:1px solid #ff6600;border-radius:4px;color:#ff6600;font-size:9px;cursor:pointer;">NSAIDs</button>
                            <button id="kidney-contrast-${containerId}" style="width:100%;padding:5px;background:rgba(255,0,50,0.2);border:1px solid #ff0033;border-radius:4px;color:#ff0033;font-size:9px;cursor:pointer;">IV Contrast</button>
                        </div>
                        <div style="display:flex;gap:5px;margin-top:auto;">
                            <button id="kidney-start-${containerId}" style="flex:1;padding:8px;background:rgba(0,255,136,0.3);border:1px solid #00ff88;border-radius:6px;color:#00ff88;font-size:11px;cursor:pointer;">▶ Start</button>
                            <button id="kidney-reset-${containerId}" style="flex:1;padding:8px;background:rgba(255,100,100,0.2);border:1px solid #ff6b6b;border-radius:6px;color:#ff6b6b;font-size:11px;cursor:pointer;">↺ Reset</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const canvas = document.getElementById(`kidney-canvas-${containerId}`);
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * (window.devicePixelRatio || 1);
            canvas.height = rect.height * (window.devicePixelRatio || 1);
            ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Bind controls
        document.getElementById(`kidney-bp-${containerId}`).addEventListener('input', function() {
            state.bloodPressure = parseInt(this.value);
            document.getElementById(`kidney-bp-val-${containerId}`).textContent = this.value + ' mmHg';
        });

        document.getElementById(`kidney-furo-${containerId}`).addEventListener('click', function() {
            state.diuretic = 'furosemide';
            state.reabsorption = Math.max(85, state.reabsorption - 10);
            state.potassium = Math.max(2.5, state.potassium - 0.5);
        });
        document.getElementById(`kidney-thia-${containerId}`).addEventListener('click', function() {
            state.diuretic = 'thiazide';
            state.reabsorption = Math.max(90, state.reabsorption - 5);
            state.sodium = Math.max(130, state.sodium - 3);
        });
        document.getElementById(`kidney-spiro-${containerId}`).addEventListener('click', function() {
            state.diuretic = 'spironolactone';
            state.potassium = Math.min(6.0, state.potassium + 0.3);
        });
        document.getElementById(`kidney-nsaid-${containerId}`).addEventListener('click', function() {
            state.gfr = Math.max(30, state.gfr - 20);
            state.injury = Math.min(3, state.injury + 1);
        });
        document.getElementById(`kidney-contrast-${containerId}`).addEventListener('click', function() {
            state.gfr = Math.max(15, state.gfr - 35);
            state.injury = Math.min(4, state.injury + 2);
        });

        document.getElementById(`kidney-start-${containerId}`).addEventListener('click', function() {
            state.running = !state.running;
            this.textContent = state.running ? '⏸ Pause' : '▶ Start';
        });

        document.getElementById(`kidney-reset-${containerId}`).addEventListener('click', function() {
            state = {
                gfr: 120, bun: 15, creatinine: 1.0, sodium: 140, potassium: 4.0,
                urine: 1500, reabsorption: 99, bloodPressure: 120, running: false,
                time: 0, injury: 0, diuretic: null
            };
            document.getElementById(`kidney-start-${containerId}`).textContent = '▶ Start';
        });

        function simulate(dt) {
            if (!state.running) return;

            state.time += dt;

            // GFR autoregulation
            if (state.bloodPressure > 80 && state.bloodPressure < 180) {
                const targetGFR = 120 - state.injury * 20;
                state.gfr = lerp(state.gfr, targetGFR, 0.01);
            } else if (state.bloodPressure <= 80) {
                state.gfr = Math.max(10, state.gfr - dt * 5);
            }

            // Creatinine inversely related to GFR
            const targetCr = 120 / state.gfr;
            state.creatinine = lerp(state.creatinine, targetCr, 0.02);

            // BUN affected by GFR
            state.bun = lerp(state.bun, 15 * (120 / state.gfr), 0.01);

            // Urine output
            state.urine = state.gfr * (100 - state.reabsorption) * 1.44;

            // Recovery
            if (state.injury > 0 && Math.random() < 0.001) {
                state.injury = Math.max(0, state.injury - 0.5);
            }

            // Electrolyte normalization
            state.sodium = lerp(state.sodium, 140, 0.005);
            state.potassium = lerp(state.potassium, 4.0, 0.005);
            state.reabsorption = lerp(state.reabsorption, 99, 0.002);
        }

        function updateDisplay() {
            document.getElementById(`kidney-gfr-${containerId}`).textContent = Math.round(state.gfr);
            document.getElementById(`kidney-bun-${containerId}`).textContent = Math.round(state.bun);
            document.getElementById(`kidney-cr-${containerId}`).textContent = formatNumber(state.creatinine, 1);
            document.getElementById(`kidney-na-${containerId}`).textContent = Math.round(state.sodium);
            document.getElementById(`kidney-k-${containerId}`).textContent = formatNumber(state.potassium, 1);

            // AKI staging
            const akiEl = document.getElementById(`kidney-aki-${containerId}`);
            if (state.gfr >= 90) {
                akiEl.textContent = 'NORMAL';
                akiEl.style.background = 'rgba(0,255,136,0.2)';
                akiEl.style.borderColor = '#00ff88';
                akiEl.style.color = '#00ff88';
            } else if (state.gfr >= 60) {
                akiEl.textContent = 'AKI Stage 1';
                akiEl.style.background = 'rgba(255,200,0,0.2)';
                akiEl.style.borderColor = '#ffd700';
                akiEl.style.color = '#ffd700';
            } else if (state.gfr >= 30) {
                akiEl.textContent = 'AKI Stage 2';
                akiEl.style.background = 'rgba(255,150,0,0.2)';
                akiEl.style.borderColor = '#ff9900';
                akiEl.style.color = '#ff9900';
            } else {
                akiEl.textContent = 'AKI Stage 3';
                akiEl.style.background = 'rgba(255,0,50,0.2)';
                akiEl.style.borderColor = '#ff0033';
                akiEl.style.color = '#ff0033';
            }
        }

        function render() {
            const w = canvas.width / (window.devicePixelRatio || 1);
            const h = canvas.height / (window.devicePixelRatio || 1);
            
            ctx.fillStyle = '#030308';
            ctx.fillRect(0, 0, w, h);

            const centerX = w / 2;
            const centerY = h / 2;

            // Draw simplified nephron
            ctx.strokeStyle = 'rgba(255,100,100,0.6)';
            ctx.lineWidth = 3;
            
            // Glomerulus
            const glomX = centerX - 60;
            const glomY = centerY - 50;
            const glomSize = 25 * (state.gfr / 120);
            
            ctx.fillStyle = `rgba(255,100,100,${0.3 + state.gfr/300})`;
            ctx.beginPath();
            ctx.arc(glomX, glomY, glomSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Bowman's capsule
            ctx.strokeStyle = 'rgba(200,150,100,0.5)';
            ctx.beginPath();
            ctx.arc(glomX, glomY, glomSize + 10, 0, Math.PI * 2);
            ctx.stroke();

            // PCT
            ctx.strokeStyle = 'rgba(0,200,255,0.5)';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(glomX + 35, glomY);
            ctx.quadraticCurveTo(centerX + 50, glomY, centerX + 50, centerY);
            ctx.stroke();

            // Loop of Henle
            ctx.strokeStyle = 'rgba(255,200,0,0.5)';
            ctx.beginPath();
            ctx.moveTo(centerX + 50, centerY);
            ctx.lineTo(centerX + 50, centerY + 60);
            ctx.quadraticCurveTo(centerX + 50, centerY + 80, centerX + 30, centerY + 80);
            ctx.quadraticCurveTo(centerX + 10, centerY + 80, centerX + 10, centerY + 60);
            ctx.lineTo(centerX + 10, centerY);
            ctx.stroke();

            // DCT
            ctx.strokeStyle = 'rgba(0,255,136,0.5)';
            ctx.beginPath();
            ctx.moveTo(centerX + 10, centerY);
            ctx.quadraticCurveTo(centerX - 30, centerY - 30, centerX - 60, centerY);
            ctx.stroke();

            // Collecting duct
            ctx.strokeStyle = 'rgba(157,0,255,0.5)';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(centerX - 60, centerY);
            ctx.lineTo(centerX - 60, centerY + 70);
            ctx.stroke();

            // Flow particles
            const flowSpeed = state.gfr / 60;
            ctx.fillStyle = 'rgba(255,200,0,0.8)';
            for (let i = 0; i < 5; i++) {
                const t = (state.time * flowSpeed + i * 0.5) % 3;
                let x, y;
                if (t < 1) {
                    x = lerp(glomX, centerX + 50, t);
                    y = lerp(glomY, centerY, t);
                } else if (t < 2) {
                    x = centerX + 50;
                    y = lerp(centerY, centerY + 60, t - 1);
                } else {
                    x = centerX - 60;
                    y = lerp(centerY, centerY + 70, t - 2);
                }
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Labels
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '9px sans-serif';
            ctx.fillText('Glomerulus', glomX - 25, glomY - glomSize - 15);
            ctx.fillText('PCT', centerX + 55, centerY - 20);
            ctx.fillText('Loop', centerX + 55, centerY + 70);
            ctx.fillText('DCT', centerX - 80, centerY - 10);
            ctx.fillText('CD', centerX - 80, centerY + 50);

            // Urine output indicator
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`Urine: ${Math.round(state.urine)} mL/day`, centerX - 80, centerY + 90);
        }

        function gameLoop() {
            simulate(1/30);
            updateDisplay();
            render();
            requestAnimationFrame(gameLoop);
        }

        gameLoop();
        console.log('[Kidney] Initialized:', containerId);
    }

    // ═══════════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE 4: RNA SECONDARY STRUCTURE LAB - COMPLETE IMPLEMENTATION ✅
    // ═══════════════════════════════════════════════════════════════════════

    function initRNAStructureLab(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('[RNA] Container not found:', containerId);
        return;
    }

    // Base pairing rules (Watson-Crick)
    const BASE_PAIRS = { 'A': 'U', 'U': 'A', 'G': 'C', 'C': 'G' };
    
    // Energy parameters (simplified nearest-neighbor model in kcal/mol)
    const ENERGY = {
        // Base pair stacking energies
        stack: {
            'AU-AU': -0.9, 'AU-UA': -1.1, 'AU-CG': -2.1, 'AU-GC': -2.2,
            'UA-AU': -1.3, 'UA-UA': -1.3, 'UA-CG': -2.4, 'UA-GC': -2.1,
            'CG-AU': -2.1, 'CG-UA': -2.4, 'CG-CG': -3.3, 'CG-GC': -3.4,
            'GC-AU': -2.2, 'GC-UA': -2.1, 'GC-CG': -3.4, 'GC-GC': -3.3,
            'GU-AU': -0.5, 'GU-UA': -0.5, 'GU-CG': -1.5, 'GU-GC': -1.5,
            'UG-AU': -0.5, 'UG-UA': -0.5, 'UG-CG': -1.5, 'UG-GC': -1.5
        },
        // Loop penalties (hairpin, bulge, internal)
        hairpin: { 3: 5.4, 4: 5.9, 5: 5.3, 6: 5.5, 7: 5.7, 8: 5.9, 9: 6.1 },
        bulge: { 1: 3.8, 2: 2.8, 3: 3.2, 4: 3.6, 5: 4.0, 6: 4.4 },
        // Terminal AU penalty
        terminalAU: 0.5
    };

    let state = {
        sequence: 'GGGGAAACCCUUUU',  // Example hairpin
        structure: [],               // Array: structure[i] = j means i pairs with j, -1 = unpaired
        freeEnergy: 0,
        temperature: 37,             // Celsius
        mgConc: 1.5,                 // mM
        running: false,
        time: 0,
        animationPhase: 0,
        foldingProgress: 0,
        isManualMode: false,
        selectedBase: -1
    };

    // Initialize structure
    state.structure = new Array(state.sequence.length).fill(-1);

    container.innerHTML = `
        <div style="width:100%;height:100%;background:linear-gradient(135deg,#0a1505,#0f2010);border-radius:12px;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;color:#e0f2fe;display:flex;flex-direction:column;">
            <div style="padding:12px 16px;background:linear-gradient(90deg,rgba(0,255,136,0.15),rgba(0,200,100,0.1));border-bottom:1px solid rgba(0,255,136,0.2);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <h3 style="margin:0;font-size:15px;color:#00ff88;">🧬 RNA Secondary Structure Lab</h3>
                        <p style="margin:2px 0 0;font-size:10px;color:rgba(255,255,255,0.5);">Thermodynamic Folding & Energy Prediction</p>
                    </div>
                    <div style="display:flex;gap:10px;align-items:center;">
                        <div id="rna-energy-${containerId}" style="padding:4px 10px;background:rgba(255,200,0,0.2);border:1px solid #ffd700;border-radius:8px;font-size:11px;color:#ffd700;">ΔG: 0.0 kcal/mol</div>
                        <div id="rna-pairs-${containerId}" style="font-size:10px;color:rgba(255,255,255,0.6);">0 bp</div>
                    </div>
                </div>
            </div>
            <div style="flex:1;display:grid;grid-template-columns:1fr 200px;gap:10px;padding:10px;overflow:hidden;">
                <div style="display:flex;flex-direction:column;gap:10px;">
                    <canvas id="rna-canvas-${containerId}" style="flex:1;background:#030308;border-radius:8px;border:1px solid rgba(0,255,136,0.2);cursor:crosshair;"></canvas>
                    <div style="padding:12px;background:rgba(0,0,0,0.3);border-radius:8px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <div style="font-size:9px;color:rgba(255,255,255,0.5);">RNA Sequence (${state.sequence.length} nt)</div>
                            <div style="font-size:9px;color:rgba(255,255,255,0.5);">Click bases to pair manually</div>
                        </div>
                        <input type="text" id="rna-seq-${containerId}" value="${state.sequence}" maxlength="100" style="width:100%;padding:8px;background:#0a1505;border:1px solid rgba(0,255,136,0.3);border-radius:4px;color:#00ff88;font-family:'Courier New',monospace;font-size:13px;letter-spacing:2px;">
                        <div style="margin-top:6px;font-size:9px;color:rgba(255,255,255,0.4);">Valid bases: A, U, G, C • Min 10 nt • Example: GGGGAAACCCUUUU (hairpin)</div>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;overflow-y:auto;">
                    <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                        <div style="font-size:10px;color:#00ff88;margin-bottom:8px;">🌡️ Conditions</div>
                        <div style="margin-bottom:8px;">
                            <div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:3px;">
                                <span>Temperature</span>
                                <span id="rna-temp-val-${containerId}" style="color:#ffd700;">37°C</span>
                            </div>
                            <input type="range" id="rna-temp-${containerId}" min="20" max="60" value="37" style="width:100%;accent-color:#00ff88;">
                        </div>
                        <div>
                            <div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:3px;">
                                <span>Mg²⁺ Conc</span>
                                <span id="rna-mg-val-${containerId}" style="color:#ffd700;">1.5 mM</span>
                            </div>
                            <input type="range" id="rna-mg-${containerId}" min="0" max="100" value="15" style="width:100%;accent-color:#00ff88;">
                        </div>
                    </div>
                    <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                        <div style="font-size:10px;color:#ffd700;margin-bottom:8px;">🧪 Actions</div>
                        <button id="rna-fold-${containerId}" style="width:100%;padding:7px;margin-bottom:5px;background:rgba(0,255,136,0.3);border:1px solid #00ff88;border-radius:4px;color:#00ff88;font-size:10px;cursor:pointer;font-weight:bold;">🧬 Auto-Fold (MFE)</button>
                        <button id="rna-unfold-${containerId}" style="width:100%;padding:7px;margin-bottom:5px;background:rgba(255,200,0,0.2);border:1px solid #ffd700;border-radius:4px;color:#ffd700;font-size:10px;cursor:pointer;">↺ Unfold All</button>
                        <button id="rna-random-${containerId}" style="width:100%;padding:7px;background:rgba(0,200,255,0.2);border:1px solid #00d4ff;border-radius:4px;color:#00d4ff;font-size:10px;cursor:pointer;">🎲 Random Seq</button>
                    </div>
                    <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                        <div style="font-size:10px;color:#ff6b9d;margin-bottom:8px;">📊 Statistics</div>
                        <div style="font-size:9px;color:rgba(255,255,255,0.6);line-height:1.6;">
                            <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                                <span>Paired Bases:</span>
                                <span id="rna-stat-paired-${containerId}" style="color:#00ff88;">0</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                                <span>GC Content:</span>
                                <span id="rna-stat-gc-${containerId}" style="color:#ffd700;">0%</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                                <span>Stability:</span>
                                <span id="rna-stat-stable-${containerId}" style="color:#00d4ff;">-</span>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;gap:5px;margin-top:auto;">
                        <button id="rna-start-${containerId}" style="flex:1;padding:8px;background:rgba(157,0,255,0.3);border:1px solid #9d00ff;border-radius:6px;color:#9d00ff;font-size:11px;cursor:pointer;">▶ Animate</button>
                        <button id="rna-reset-${containerId}" style="flex:1;padding:8px;background:rgba(255,100,100,0.2);border:1px solid #ff6b6b;border-radius:6px;color:#ff6b6b;font-size:11px;cursor:pointer;">↺ Reset</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const canvas = document.getElementById(`rna-canvas-${containerId}`);
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ═══════════════════════════════════════════════════════════════════════
    // BASE PAIRING AND FOLDING ALGORITHMS
    // ═══════════════════════════════════════════════════════════════════════

    function canPair(b1, b2) {
        return BASE_PAIRS[b1] === b2 || (b1 === 'G' && b2 === 'U') || (b1 === 'U' && b2 === 'G');
    }

    function getPairType(b1, b2) {
        if ((b1 === 'A' && b2 === 'U') || (b1 === 'U' && b2 === 'A')) return 'AU';
        if ((b1 === 'G' && b2 === 'C') || (b1 === 'C' && b2 === 'G')) return 'GC';
        if ((b1 === 'G' && b2 === 'U') || (b1 === 'U' && b2 === 'G')) return 'GU';
        return null;
    }

    function getStackingEnergy(type1, type2) {
        const key = `${type1}-${type2}`;
        return ENERGY.stack[key] || 0;
    }

    function foldRNA() {
        // Greedy algorithm to find hairpins and stems (simplified MFE approach)
        const seq = state.sequence;
        const n = seq.length;
        state.structure = new Array(n).fill(-1);
        
        // Find complementary regions that can form stems
        const minStemLength = 2;
        const minLoopSize = 3;
        
        for (let i = 0; i < n - minLoopSize - 2 * minStemLength; i++) {
            for (let j = n - 1; j > i + minLoopSize + 2 * minStemLength - 1; j--) {
                if (state.structure[i] === -1 && state.structure[j] === -1 && canPair(seq[i], seq[j])) {
                    // Check if we can form a stem
                    let stemLen = 0;
                    while (i + stemLen < j - stemLen - minLoopSize && 
                           state.structure[i + stemLen] === -1 && 
                           state.structure[j - stemLen] === -1 &&
                           canPair(seq[i + stemLen], seq[j - stemLen]) && 
                           stemLen < 8) {
                        stemLen++;
                    }
                    
                    if (stemLen >= minStemLength) {
                        // Form the stem
                        for (let k = 0; k < stemLen; k++) {
                            state.structure[i + k] = j - k;
                            state.structure[j - k] = i + k;
                        }
                        break;
                    }
                }
            }
        }
        
        calculateEnergy();
        state.foldingProgress = 1;
    }

    function calculateEnergy() {
        // Calculate free energy of the current structure
        let energy = 0;
        const seq = state.sequence;
        const n = seq.length;
        let pairedCount = 0;
        
        for (let i = 0; i < n; i++) {
            if (state.structure[i] > i) {
                pairedCount += 2;
                const j = state.structure[i];
                const b1 = seq[i];
                const b2 = seq[j];
                const pairType = getPairType(b1, b2);
                
                if (!pairType) continue;
                
                // Base pair energy (GC stronger than AU)
                if (pairType === 'GC') {
                    energy -= 3.0;
                } else if (pairType === 'AU') {
                    energy -= 2.0;
                } else if (pairType === 'GU') {
                    energy -= 1.0;
                }
                
                // Stacking bonus if adjacent pair exists
                if (i + 1 < n && state.structure[i + 1] === j - 1) {
                    const nextPairType = getPairType(seq[i + 1], seq[j - 1]);
                    if (nextPairType) {
                        energy += getStackingEnergy(pairType, nextPairType);
                    }
                }
                
                // Terminal AU penalty
                if (pairType === 'AU' || pairType === 'GU') {
                    if ((i === 0 || state.structure[i - 1] === -1) || 
                        (j === n - 1 || state.structure[j + 1] === -1)) {
                        energy += ENERGY.terminalAU;
                    }
                }
            }
        }
        
        // Hairpin loop penalty (simplified)
        for (let i = 0; i < n; i++) {
            if (state.structure[i] > i) {
                const j = state.structure[i];
                const loopSize = j - i - 1;
                if (loopSize >= 3 && loopSize <= 9) {
                    const penalty = ENERGY.hairpin[loopSize] || (loopSize * 0.5 + 4);
                    energy += penalty;
                }
            }
        }
        
        // Temperature correction (simplified)
        const tempFactor = 1 + (state.temperature - 37) * 0.015;
        energy *= tempFactor;
        
        // Mg2+ stabilization
        energy -= state.mgConc * 0.3 * (pairedCount / 10);
        
        state.freeEnergy = energy;
        updateEnergyDisplay();
    }

    function updateEnergyDisplay() {
        const energyEl = document.getElementById(`rna-energy-${containerId}`);
        const pairsEl = document.getElementById(`rna-pairs-${containerId}`);
        
        const pairedBases = state.structure.filter(x => x !== -1).length;
        const pairs = pairedBases / 2;
        
        energyEl.textContent = `ΔG: ${state.freeEnergy.toFixed(1)} kcal/mol`;
        pairsEl.textContent = `${pairs} bp`;
        
        // Color code by stability
        if (state.freeEnergy < -10) {
            energyEl.style.borderColor = '#00ff88';
            energyEl.style.color = '#00ff88';
        } else if (state.freeEnergy < -5) {
            energyEl.style.borderColor = '#ffd700';
            energyEl.style.color = '#ffd700';
        } else {
            energyEl.style.borderColor = '#ff6b6b';
            energyEl.style.color = '#ff6b6b';
        }
        
        // Update statistics
        document.getElementById(`rna-stat-paired-${containerId}`).textContent = pairedBases;
        
        const gcCount = (state.sequence.match(/[GC]/g) || []).length;
        const gcPercent = Math.round((gcCount / state.sequence.length) * 100);
        document.getElementById(`rna-stat-gc-${containerId}`).textContent = gcPercent + '%';
        
        let stability = 'Unstable';
        if (state.freeEnergy < -15) stability = 'Very Stable';
        else if (state.freeEnergy < -10) stability = 'Stable';
        else if (state.freeEnergy < -5) stability = 'Moderate';
        document.getElementById(`rna-stat-stable-${containerId}`).textContent = stability;
    }

    function generateRandomSequence() {
        const bases = ['A', 'U', 'G', 'C'];
        const length = 14 + Math.floor(Math.random() * 16); // 14-30 nt
        let seq = '';
        for (let i = 0; i < length; i++) {
            seq += bases[Math.floor(Math.random() * 4)];
        }
        return seq;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    document.getElementById(`rna-temp-${containerId}`).addEventListener('input', function() {
        state.temperature = parseInt(this.value);
        document.getElementById(`rna-temp-val-${containerId}`).textContent = this.value + '°C';
        calculateEnergy();
    });

    document.getElementById(`rna-mg-${containerId}`).addEventListener('input', function() {
        state.mgConc = parseInt(this.value) / 10;
        document.getElementById(`rna-mg-val-${containerId}`).textContent = (parseInt(this.value) / 10).toFixed(1) + ' mM';
        calculateEnergy();
    });

    document.getElementById(`rna-seq-${containerId}`).addEventListener('input', function() {
        let seq = this.value.toUpperCase().replace(/[^AUGC]/g, '');
        if (seq.length < 10) seq = this.value; // Don't auto-change if too short
        state.sequence = seq;
        state.structure = new Array(seq.length).fill(-1);
        this.value = seq;
        calculateEnergy();
    });

    document.getElementById(`rna-fold-${containerId}`).addEventListener('click', function() {
        if (state.sequence.length < 10) {
            alert('Sequence too short! Need at least 10 nucleotides.');
            return;
        }
        state.foldingProgress = 0;
        foldRNA();
    });

    document.getElementById(`rna-unfold-${containerId}`).addEventListener('click', function() {
        state.structure = new Array(state.sequence.length).fill(-1);
        calculateEnergy();
    });

    document.getElementById(`rna-random-${containerId}`).addEventListener('click', function() {
        state.sequence = generateRandomSequence();
        state.structure = new Array(state.sequence.length).fill(-1);
        document.getElementById(`rna-seq-${containerId}`).value = state.sequence;
        calculateEnergy();
    });

    document.getElementById(`rna-start-${containerId}`).addEventListener('click', function() {
        state.running = !state.running;
        this.textContent = state.running ? '⏸ Pause' : '▶ Animate';
    });

    document.getElementById(`rna-reset-${containerId}`).addEventListener('click', function() {
        state = {
            sequence: 'GGGGAAACCCUUUU',
            structure: new Array('GGGGAAACCCUUUU'.length).fill(-1),
            freeEnergy: 0,
            temperature: 37,
            mgConc: 1.5,
            running: false,
            time: 0,
            animationPhase: 0,
            foldingProgress: 0,
            isManualMode: false,
            selectedBase: -1
        };
        document.getElementById(`rna-seq-${containerId}`).value = state.sequence;
        document.getElementById(`rna-start-${containerId}`).textContent = '▶ Animate';
        calculateEnergy();
    });

    // Canvas click for manual pairing
    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Find clicked base
        const n = state.sequence.length;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.35;
        const angleStep = (2 * Math.PI) / n;
        
        for (let i = 0; i < n; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const bx = centerX + Math.cos(angle) * radius;
            const by = centerY + Math.sin(angle) * radius;
            const dist = Math.sqrt((x - bx) ** 2 + (y - by) ** 2);
            
            if (dist < 12) {
                if (state.selectedBase === -1) {
                    state.selectedBase = i;
                } else {
                    // Try to pair
                    if (canPair(state.sequence[state.selectedBase], state.sequence[i]) && 
                        Math.abs(state.selectedBase - i) > 3) {
                        state.structure[state.selectedBase] = i;
                        state.structure[i] = state.selectedBase;
                        calculateEnergy();
                    }
                    state.selectedBase = -1;
                }
                break;
            }
        }
    });

    // ═══════════════════════════════════════════════════════════════════════
    // VISUALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function render() {
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = '#030308';
        ctx.fillRect(0, 0, w, h);

        const n = state.sequence.length;
        if (n === 0 || n < 10) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Enter RNA sequence (min 10 nt)', w / 2, h / 2);
            return;
        }

        const centerX = w / 2;
        const centerY = h / 2;
        const radius = Math.min(w, h) * 0.35;
        
        // Calculate positions
        const angleStep = (2 * Math.PI) / n;
        const positions = [];
        
        for (let i = 0; i < n; i++) {
            const angle = i * angleStep - Math.PI / 2 + state.animationPhase;
            positions.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }

        // Draw base pair connections
        ctx.strokeStyle = 'rgba(255,200,0,0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < n; i++) {
            if (state.structure[i] > i) {
                const j = state.structure[i];
                
                // Color by pair strength
                const pairType = getPairType(state.sequence[i], state.sequence[j]);
                if (pairType === 'GC') {
                    ctx.strokeStyle = 'rgba(0,255,136,0.7)';
                } else if (pairType === 'AU') {
                    ctx.strokeStyle = 'rgba(255,200,0,0.7)';
                } else {
                    ctx.strokeStyle = 'rgba(200,150,255,0.6)';
                }
                
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(positions[i].x, positions[i].y);
                ctx.lineTo(positions[j].x, positions[j].y);
                ctx.stroke();
            }
        }

        // Draw backbone
        ctx.strokeStyle = 'rgba(0,255,136,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            if (i === 0) ctx.moveTo(positions[i].x, positions[i].y);
            else ctx.lineTo(positions[i].x, positions[i].y);
        }
        ctx.stroke();

        // Draw bases
        const baseColors = { 
            A: '#00d4ff', 
            U: '#ff6b6b', 
            G: '#00ff88', 
            C: '#ffd700' 
        };
        
        for (let i = 0; i < n; i++) {
            const base = state.sequence[i];
            const paired = state.structure[i] !== -1;
            
            // Base circle
            ctx.fillStyle = baseColors[base] || '#fff';
            ctx.globalAlpha = paired ? 1.0 : 0.5;
            
            // Highlight selected
            const isSelected = state.selectedBase === i;
            const baseSize = isSelected ? 12 : 10;
            
            ctx.beginPath();
            ctx.arc(positions[i].x, positions[i].y, baseSize, 0, Math.PI * 2);
            ctx.fill();
            
            if (isSelected) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Base letter
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#000';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(base, positions[i].x, positions[i].y);
            
            // Position number (every 5th)
            if (i % 5 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '8px sans-serif';
                const angle = i * angleStep - Math.PI / 2;
                const labelX = centerX + Math.cos(angle) * (radius + 20);
                const labelY = centerY + Math.sin(angle) * (radius + 20);
                ctx.fillText(i.toString(), labelX, labelY);
            }
        }

        // Draw center info
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${n} nt`, centerX, centerY - 10);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(`${state.temperature}°C, ${state.mgConc.toFixed(1)} mM Mg²⁺`, centerX, centerY + 5);
    }

    function gameLoop() {
        if (state.running) {
            state.time += 0.016;
            state.animationPhase = Math.sin(state.time) * 0.1;
        }
        
        render();
        requestAnimationFrame(gameLoop);
    }

    // Initialize
    calculateEnergy();
    gameLoop();
    console.log('[RNA Structure Lab] Initialized:', containerId);
}

    // ═══════════════════════════════════════════════════════════════════════
    // MODULES 5-15: PLACEHOLDER IMPLEMENTATIONS (11 remaining)
    // Each needs 400-600 lines of mechanistic simulation code
    // ═══════════════════════════════════════════════════════════════════════

    function createSimpleModule(containerId, title, emoji, color, description, features) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let state = { value1: 50, value2: 50, value3: 50, running: false, time: 0 };

        container.innerHTML = `
            <div style="width:100%;height:100%;background:linear-gradient(135deg,#050510,#0a0a20);border-radius:12px;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;color:#e0f2fe;display:flex;flex-direction:column;">
                <div style="padding:12px 16px;background:linear-gradient(90deg,${color}22,${color}11);border-bottom:1px solid ${color}44;">
                    <h3 style="margin:0;font-size:15px;color:${color};">${emoji} ${title}</h3>
                    <p style="margin:2px 0 0;font-size:10px;color:rgba(255,255,255,0.5);">${description}</p>
                </div>
                <div style="flex:1;display:grid;grid-template-columns:1fr 160px;gap:10px;padding:10px;">
                    <canvas id="canvas-${containerId}" style="background:#030308;border-radius:8px;border:1px solid ${color}33;"></canvas>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                            <div style="font-size:10px;color:${color};margin-bottom:8px;">⚙️ Parameters</div>
                            ${features.map((f, i) => `
                                <div style="margin-bottom:8px;">
                                    <div style="display:flex;justify-content:space-between;font-size:9px;"><span>${f}</span><span id="val${i}-${containerId}">50</span></div>
                                    <input type="range" id="slider${i}-${containerId}" min="0" max="100" value="50" style="width:100%;accent-color:${color};">
                                </div>
                            `).join('')}
                        </div>
                        <div style="display:flex;gap:5px;margin-top:auto;">
                            <button id="start-${containerId}" style="flex:1;padding:8px;background:${color}33;border:1px solid ${color};border-radius:6px;color:${color};font-size:11px;cursor:pointer;">▶ Start</button>
                            <button id="reset-${containerId}" style="flex:1;padding:8px;background:rgba(255,100,100,0.2);border:1px solid #ff6b6b;border-radius:6px;color:#ff6b6b;font-size:11px;cursor:pointer;">↺ Reset</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const canvas = document.getElementById(`canvas-${containerId}`);
        const ctx = canvas.getContext('2d');

        function resize() {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
        resize();
        window.addEventListener('resize', resize);

        features.forEach((f, i) => {
            document.getElementById(`slider${i}-${containerId}`).addEventListener('input', function() {
                state[`value${i+1}`] = parseInt(this.value);
                document.getElementById(`val${i}-${containerId}`).textContent = this.value;
            });
        });

        document.getElementById(`start-${containerId}`).addEventListener('click', function() {
            state.running = !state.running;
            this.textContent = state.running ? '⏸ Pause' : '▶ Start';
        });

        document.getElementById(`reset-${containerId}`).addEventListener('click', function() {
            state = { value1: 50, value2: 50, value3: 50, running: false, time: 0 };
            document.getElementById(`start-${containerId}`).textContent = '▶ Start';
        });

        function render() {
            const w = canvas.width, h = canvas.height;
            ctx.fillStyle = '#030308';
            ctx.fillRect(0, 0, w, h);

            if (state.running) state.time += 0.03;

            const cx = w / 2, cy = h / 2;
            
            ctx.fillStyle = color + '40';
            ctx.beginPath();
            ctx.arc(cx, cy, 50 + state.value1 * 0.5 + Math.sin(state.time * 2) * 10, 0, Math.PI * 2);
            ctx.fill();

            for (let i = 0; i < 8; i++) {
                const angle = state.time + i * Math.PI / 4;
                const radius = 80 + state.value2 * 0.3;
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 5 + state.value3 * 0.05, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.strokeStyle = color + '30';
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const angle = state.time + i * Math.PI / 4;
                const radius = 80 + state.value2 * 0.3;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
                ctx.stroke();
            }

            requestAnimationFrame(render);
        }
        render();
        console.log(`[${title}] Initialized:`, containerId);
    }

    function initTCellSimulator(id) {
        createSimpleModule(id, 'CAR-T Immunotherapy', '🧬', '#ff0088', 
            'T-Cell Expansion & Response', ['CAR-T Dose', 'Tumor Burden', 'Cytokine Level']);
    }

    function initDrugDiscovery(id) {
        createSimpleModule(id, 'AI Drug Discovery', '🔬', '#00d4ff',
            'Target Binding Prediction', ['Binding Affinity', 'Selectivity', 'ADMET Score']);
    }

    function initOrganoidChamber(id) {
        createSimpleModule(id, 'Organoid Development', '🔬', '#9d00ff',
            'Stem Cell Differentiation', ['Wnt Signal', 'BMP Level', 'Culture Time']);
    }

    function initMicrofluidic(id) {
        createSimpleModule(id, 'Microfluidic Platform', '🔧', '#00ff88',
            'Channel Flow Dynamics', ['Flow Rate', 'Channel Width', 'Pressure']);
    }

    function initClinicalDecision(id) {
        createSimpleModule(id, 'Clinical Decision Support', '🏥', '#ff0033',
            'Bayesian Diagnosis Engine', ['Prior Prob', 'Test Sensitivity', 'Specificity']);
    }

    function initImmuneResponse(id) {
        createSimpleModule(id, 'Immune Response', '🦠', '#00ff88',
            'Adaptive Immunity Dynamics', ['Antigen Load', 'T-Cell Count', 'Antibody Titer']);
    }

    function initDNARepair(id) {
        createSimpleModule(id, 'DNA Damage & Repair', '🧬', '#ffd700',
            'Repair Pathway Simulation', ['Damage Level', 'Repair Rate', 'Cell Cycle']);
    }

    function initLiquidBiopsy(id) {
        createSimpleModule(id, 'Liquid Biopsy Lab', '🔬', '#ff0088',
            'ctDNA Detection Pipeline', ['Sample Volume', 'Tumor Fraction', 'Sensitivity']);
    }

    function initMultiOrganMPS(id) {
        createSimpleModule(id, 'Multi-Organ MPS', '🔬', '#00d4ff',
            'Body-on-Chip Controller', ['Flow Rate', 'Media pH', 'O₂ Level']);
    }

    function initDrugResponse(id) {
        createSimpleModule(id, 'Drug Response Lab', '💊', '#ff0088',
            'Pharmacodynamic Modeling', ['Drug A Conc', 'Drug B Conc', 'Combination']);
    }

    function initOrganoidViewer(id) {
        createSimpleModule(id, 'OrganoidViewer Pro', '🔬', '#ff6b9d',
            '3D Organoid Analysis', ['Rotation', 'Zoom', 'Slice Position']);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT TO GLOBAL SCOPE
    // ═══════════════════════════════════════════════════════════════════════

    window.initLungChipSimulator = initLungChipSimulator;
    window.initPKDigitalTwin = initPKDigitalTwin;
    window.initKidneySimulator = initKidneySimulator;
    window.initRNAStructureLab = initRNAStructureLab;
    window.initTCellSimulator = initTCellSimulator;
    window.initDrugDiscovery = initDrugDiscovery;
    window.initOrganoidChamber = initOrganoidChamber;
    window.initMicrofluidic = initMicrofluidic;
    window.initClinicalDecision = initClinicalDecision;
    window.initImmuneResponse = initImmuneResponse;
    window.initDNARepair = initDNARepair;
    window.initLiquidBiopsy = initLiquidBiopsy;
    window.initMultiOrganMPS = initMultiOrganMPS;
    window.initDrugResponse = initDrugResponse;
    window.initOrganoidViewer = initOrganoidViewer;

    console.log('[MuseumSims] v4.0.0 loaded - ✅ 4/15 complete (27%), 11 placeholders remaining');

})();
