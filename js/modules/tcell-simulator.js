/**
 * PatientAnalog.com - Module #5: T-Cell Immunotherapy Response Simulator
 * Museum-Grade Scientific Simulation
 * 
 * SCIENTIFIC MODEL:
 * - CAR-T cell expansion kinetics
 * - Tumor response dynamics
 * - Cytokine release syndrome (CRS)
 * - T-cell exhaustion and phenotype
 * - Antigen escape evolution
 */

(function() {
    'use strict';

    const { MathUtils, StateManager, SimulationModule, PerformanceDetector, AudioFeedback } = window.MuseumGradeEngine;

    const TCELL_PARAMS = {
        expansionPeak: 14,           // Days to peak expansion
        maxExpansion: 1000,          // Fold expansion
        exhaustionRate: 0.02,        // Per day at high antigen
        memoryFormation: 0.1,        // Fraction becoming memory
        cytokineHalfLife: 6,         // Hours
        crsThresholds: { mild: 50, moderate: 200, severe: 500, lifeThreatening: 1000 }
    };

    const TUMOR_PARAMS = {
        doublingTime: 30,            // Days (untreated)
        killRatePerTCell: 0.001,     // Tumor cells killed per T-cell per day
        escapeRate: 0.0001,          // Antigen loss rate under pressure
        microenvironmentSuppression: 0.3
    };

    class TCellSimulator extends SimulationModule {
        getInitialState() {
            return {
                // T-cell populations (cells/μL)
                tCells: {
                    naive: 0,
                    effector: 100,       // Infused CAR-T
                    memory: 0,
                    exhausted: 0
                },
                totalTCells: 100,
                peakTCells: 100,
                
                // Tumor
                tumorBurden: 10000,      // Arbitrary units
                initialTumor: 10000,
                antigenExpression: 1.0,  // 0-1
                
                // Cytokines (pg/mL)
                cytokines: {
                    il6: 5,
                    ifnGamma: 10,
                    tnfAlpha: 10,
                    il2: 5
                },
                crsGrade: 0,
                
                // Patient status
                temperature: 37,
                bloodPressure: 120,
                oxygenation: 98,
                
                // Interventions
                tocilizumabGiven: false,
                steroidsGiven: false,
                
                // Time
                daysSinceInfusion: 0,
                
                // Outcomes
                responseStatus: 'pending',  // CR, PR, SD, PD
                phase: 'setup',
                score: 0
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            
            container.innerHTML = `
                <div class="tcell-sim" style="
                    width: 100%; height: 100%;
                    background: linear-gradient(135deg, #0a0515 0%, #150520 50%, #0a0510 100%);
                    border-radius: 16px; overflow: hidden; position: relative;
                    font-family: 'Orbitron', sans-serif; color: #e0f2fe;
                ">
                    <div style="padding: 12px 20px; background: linear-gradient(90deg, rgba(255,0,136,0.1), rgba(0,212,255,0.1)); border-bottom: 1px solid rgba(255,0,136,0.2); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="margin: 0; font-size: 16px; color: #ff0088;">🧬 CAR-T Immunotherapy Simulator</h3>
                            <p style="margin: 3px 0 0; font-size: 11px; color: rgba(255,255,255,0.6);">T-Cell Expansion & Tumor Response Dynamics</p>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span id="tcell-crs" style="padding: 4px 12px; background: rgba(0,255,136,0.2); border: 1px solid #00ff88; border-radius: 12px; font-size: 10px;">CRS Grade 0</span>
                            <span id="tcell-day" style="font-size: 12px; color: #ffd700;">Day 0</span>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 300px; height: calc(100% - 50px);">
                        <div style="padding: 15px; display: flex; flex-direction: column; gap: 10px;">
                            <!-- Population dynamics chart -->
                            <div style="flex: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,0,136,0.2); border-radius: 12px; position: relative;">
                                <canvas id="tcell-chart" style="width: 100%; height: 100%;"></canvas>
                                <div style="position: absolute; top: 10px; left: 10px; font-size: 10px; color: rgba(255,255,255,0.6);">
                                    <div><span style="color: #ff0088;">━</span> T-Cells</div>
                                    <div><span style="color: #00ff88;">━</span> Tumor</div>
                                    <div><span style="color: #ffd700;">━</span> IL-6</div>
                                </div>
                            </div>

                            <!-- Treatment controls -->
                            <div style="padding: 12px; background: rgba(0,0,0,0.3); border-radius: 10px; display: flex; gap: 15px; align-items: center;">
                                <div>
                                    <div style="font-size: 10px; color: rgba(255,255,255,0.6); margin-bottom: 5px;">CAR-T Dose (×10⁶)</div>
                                    <input type="range" id="cart-dose" min="50" max="500" value="100" style="width: 120px; accent-color: #ff0088;">
                                    <span id="cart-dose-val" style="font-size: 11px; color: #ff0088; margin-left: 8px;">100</span>
                                </div>
                                <button id="infuse-btn" style="padding: 10px 20px; background: rgba(255,0,136,0.2); border: 1px solid #ff0088; border-radius: 8px; color: #ff0088; cursor: pointer;">💉 Infuse</button>
                                <button id="toci-btn" style="padding: 10px 15px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3); border-radius: 8px; color: #0055ff; cursor: pointer; font-size: 10px;">Tocilizumab</button>
                                <button id="steroid-btn" style="padding: 10px 15px; background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.3); border-radius: 8px; color: #ffd700; cursor: pointer; font-size: 10px;">Steroids</button>
                            </div>
                        </div>

                        <div style="padding: 15px; background: rgba(0,0,0,0.3); border-left: 1px solid rgba(255,0,136,0.2); overflow-y: auto;">
                            <!-- T-Cell Status -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #ff0088; margin-bottom: 8px;">🧬 T-Cell Populations</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px;">
                                    <div style="padding: 8px; background: rgba(255,0,136,0.1); border-radius: 6px;">
                                        <div style="color: rgba(255,255,255,0.6);">Effector</div>
                                        <div id="t-effector" style="font-size: 16px; color: #ff0088;">100</div>
                                    </div>
                                    <div style="padding: 8px; background: rgba(0,255,136,0.1); border-radius: 6px;">
                                        <div style="color: rgba(255,255,255,0.6);">Memory</div>
                                        <div id="t-memory" style="font-size: 16px; color: #00ff88;">0</div>
                                    </div>
                                    <div style="padding: 8px; background: rgba(255,107,107,0.1); border-radius: 6px;">
                                        <div style="color: rgba(255,255,255,0.6);">Exhausted</div>
                                        <div id="t-exhausted" style="font-size: 16px; color: #ff6b6b;">0</div>
                                    </div>
                                    <div style="padding: 8px; background: rgba(157,0,255,0.1); border-radius: 6px;">
                                        <div style="color: rgba(255,255,255,0.6);">Total</div>
                                        <div id="t-total" style="font-size: 16px; color: #9d00ff;">100</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Tumor Status -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #00ff88; margin-bottom: 8px;">🎯 Tumor Burden</div>
                                <div style="height: 30px; background: rgba(0,0,0,0.3); border-radius: 15px; overflow: hidden; position: relative;">
                                    <div id="tumor-bar" style="height: 100%; width: 100%; background: linear-gradient(90deg, #00ff88, #ffd700, #ff0033); transition: width 0.5s;"></div>
                                    <span id="tumor-value" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 12px;">10000</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 5px; color: rgba(255,255,255,0.5);">
                                    <span>CR</span><span>PR</span><span>SD</span><span>PD</span>
                                </div>
                            </div>

                            <!-- Cytokines -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #ffd700; margin-bottom: 8px;">🔥 Cytokines</div>
                                <div style="display: grid; gap: 5px; font-size: 10px;">
                                    ${['il6', 'ifnGamma', 'tnfAlpha'].map(c => `
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="width: 60px;">${c.toUpperCase()}</span>
                                            <div style="flex: 1; height: 6px; background: rgba(0,0,0,0.3); border-radius: 3px;">
                                                <div id="cyt-${c}" style="height: 100%; width: 5%; background: #ffd700; border-radius: 3px;"></div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Patient Vitals -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #0055ff; margin-bottom: 8px;">🩺 Patient Status</div>
                                <div style="font-size: 10px;">
                                    <div>Temp: <span id="pt-temp">37.0</span>°C</div>
                                    <div>BP: <span id="pt-bp">120</span> mmHg</div>
                                    <div>SpO₂: <span id="pt-spo2">98</span>%</div>
                                </div>
                            </div>

                            <!-- Response Status -->
                            <div id="response-panel" style="padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; text-align: center;">
                                <div style="font-size: 10px; color: rgba(255,255,255,0.6);">Response</div>
                                <div id="response-status" style="font-size: 20px; color: #ffd700;">Pending</div>
                            </div>

                            <div style="display: flex; gap: 8px; margin-top: 15px;">
                                <button id="tcell-start-btn" style="flex: 1; padding: 10px; background: linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,212,255,0.1)); border: 1px solid #00ff88; border-radius: 8px; color: #00ff88; cursor: pointer; font-size: 11px;">▶ Start</button>
                                <button id="tcell-reset-btn" style="flex: 1; padding: 10px; background: rgba(255,0,51,0.1); border: 1px solid rgba(255,0,51,0.3); border-radius: 8px; color: #ff0033; cursor: pointer; font-size: 11px;">↺ Reset</button>
                            </div>
                        </div>
                    </div>
                    <div id="tcell-feedback" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); padding: 10px 20px; background: rgba(0,0,0,0.9); border-radius: 20px; font-size: 12px; display: none; border: 1px solid #ff0088;"></div>
                </div>
            `;

            this.bindEvents();
            this.initChart();
        }

        bindEvents() {
            const container = document.getElementById(this.containerId);
            
            container.querySelector('#cart-dose').addEventListener('input', (e) => {
                container.querySelector('#cart-dose-val').textContent = e.target.value;
            });

            container.querySelector('#infuse-btn').addEventListener('click', () => {
                const dose = parseInt(container.querySelector('#cart-dose').value);
                this.infuseCART(dose);
            });

            container.querySelector('#toci-btn').addEventListener('click', () => this.giveTocilizumab());
            container.querySelector('#steroid-btn').addEventListener('click', () => this.giveSteroids());

            container.querySelector('#tcell-start-btn').addEventListener('click', () => {
                if (this.isRunning) {
                    this.pause();
                    container.querySelector('#tcell-start-btn').textContent = '▶ Resume';
                } else {
                    this.start();
                    container.querySelector('#tcell-start-btn').textContent = '⏸ Pause';
                }
            });

            container.querySelector('#tcell-reset-btn').addEventListener('click', () => {
                this.reset();
                container.querySelector('#tcell-start-btn').textContent = '▶ Start';
            });
        }

        initChart() {
            this.history = { tCells: [], tumor: [], il6: [] };
            const canvas = document.getElementById('tcell-chart');
            if (canvas) {
                const rect = canvas.parentElement.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                this.chartCtx = canvas.getContext('2d');
            }
        }

        infuseCART(dose) {
            const tCells = this.state.get('tCells');
            tCells.effector += dose * 10; // Scale dose
            this.state.set('tCells', tCells);
            this.state.set('totalTCells', tCells.effector + tCells.memory);
            this.showFeedback(`${dose}×10⁶ CAR-T cells infused`, 'success');
            AudioFeedback.playStateChange('success');
        }

        giveTocilizumab() {
            if (this.state.get('tocilizumabGiven')) {
                this.showFeedback('Tocilizumab already administered', 'warning');
                return;
            }
            this.state.set('tocilizumabGiven', true);
            this.showFeedback('Tocilizumab administered - IL-6R blocked', 'info');
        }

        giveSteroids() {
            if (this.state.get('steroidsGiven')) {
                this.showFeedback('Steroids already given', 'warning');
                return;
            }
            this.state.set('steroidsGiven', true);
            this.showFeedback('⚠️ Steroids given - may suppress T-cell activity', 'warning');
        }

        simulationStep(dt, totalTime) {
            const timeScale = 24; // 1 real second = hours in simulation
            const dtDays = (dt * timeScale) / 24;
            const days = this.state.get('daysSinceInfusion') + dtDays;
            this.state.set('daysSinceInfusion', days);

            const tCells = this.state.get('tCells');
            const cytokines = this.state.get('cytokines');
            let tumor = this.state.get('tumorBurden');
            const antigen = this.state.get('antigenExpression');

            // T-cell expansion (logistic growth with antigen stimulation)
            const antigenStimulation = (tumor / this.state.get('initialTumor')) * antigen;
            const expansionRate = 0.5 * antigenStimulation * (1 - this.state.get('totalTCells') / (TCELL_PARAMS.maxExpansion * 1000));
            
            if (!this.state.get('steroidsGiven')) {
                tCells.effector += tCells.effector * expansionRate * dtDays;
            } else {
                tCells.effector *= (1 - 0.1 * dtDays); // Steroid suppression
            }

            // Exhaustion
            const exhaustionRate = TCELL_PARAMS.exhaustionRate * antigenStimulation;
            const exhausting = tCells.effector * exhaustionRate * dtDays;
            tCells.exhausted += exhausting;
            tCells.effector -= exhausting;

            // Memory formation
            const memoryForming = tCells.effector * TCELL_PARAMS.memoryFormation * dtDays * 0.1;
            tCells.memory += memoryForming;

            // Tumor killing
            const killRate = TUMOR_PARAMS.killRatePerTCell * (1 - TUMOR_PARAMS.microenvironmentSuppression);
            const killed = (tCells.effector + tCells.memory * 0.5) * killRate * tumor * dtDays / 1000;
            tumor = Math.max(0, tumor - killed);

            // Tumor growth (if not fully eliminated)
            if (tumor > 0) {
                tumor *= (1 + Math.log(2) / TUMOR_PARAMS.doublingTime * dtDays);
            }

            // Antigen escape
            if (tCells.effector > 1000) {
                const escape = TUMOR_PARAMS.escapeRate * tCells.effector / 1000 * dtDays;
                this.state.set('antigenExpression', Math.max(0.1, antigen - escape));
            }

            // Cytokine dynamics
            const cytokineProduction = tCells.effector * tumor / (this.state.get('initialTumor') * 100);
            cytokines.il6 = Math.max(5, cytokines.il6 + cytokineProduction * dtDays - cytokines.il6 * 0.1 * dtDays);
            cytokines.ifnGamma = Math.max(10, cytokines.ifnGamma + cytokineProduction * 0.5 * dtDays - cytokines.ifnGamma * 0.1 * dtDays);
            cytokines.tnfAlpha = Math.max(10, cytokines.tnfAlpha + cytokineProduction * 0.3 * dtDays - cytokines.tnfAlpha * 0.1 * dtDays);

            // Tocilizumab effect
            if (this.state.get('tocilizumabGiven')) {
                cytokines.il6 *= 0.5; // Block IL-6 signaling
            }

            // CRS grading
            let crsGrade = 0;
            if (cytokines.il6 > TCELL_PARAMS.crsThresholds.lifeThreatening) crsGrade = 4;
            else if (cytokines.il6 > TCELL_PARAMS.crsThresholds.severe) crsGrade = 3;
            else if (cytokines.il6 > TCELL_PARAMS.crsThresholds.moderate) crsGrade = 2;
            else if (cytokines.il6 > TCELL_PARAMS.crsThresholds.mild) crsGrade = 1;

            // Vital signs based on CRS
            const temp = 37 + crsGrade * 0.5 + MathUtils.gaussianRandom(0, 0.1);
            const bp = 120 - crsGrade * 10 + MathUtils.gaussianRandom(0, 5);
            const spo2 = 98 - crsGrade * 2 + MathUtils.gaussianRandom(0, 0.5);

            // Update state
            tCells.effector = Math.max(0, tCells.effector);
            this.state.set('tCells', tCells);
            this.state.set('totalTCells', tCells.effector + tCells.memory + tCells.exhausted);
            this.state.set('tumorBurden', tumor);
            this.state.set('cytokines', cytokines);
            this.state.set('crsGrade', crsGrade);
            this.state.set('temperature', temp);
            this.state.set('bloodPressure', bp);
            this.state.set('oxygenation', spo2);

            // Track peak T-cells
            const total = tCells.effector + tCells.memory;
            if (total > this.state.get('peakTCells')) {
                this.state.set('peakTCells', total);
            }

            // Assess response
            this.assessResponse();

            // History for chart
            this.history.tCells.push(this.state.get('totalTCells'));
            this.history.tumor.push(tumor);
            this.history.il6.push(cytokines.il6);
            if (this.history.tCells.length > 200) {
                this.history.tCells.shift();
                this.history.tumor.shift();
                this.history.il6.shift();
            }
        }

        assessResponse() {
            const tumor = this.state.get('tumorBurden');
            const initial = this.state.get('initialTumor');
            const ratio = tumor / initial;

            let status = 'pending';
            if (tumor < 1) status = 'CR'; // Complete response
            else if (ratio < 0.3) status = 'PR'; // Partial response
            else if (ratio < 1.2) status = 'SD'; // Stable disease
            else status = 'PD'; // Progressive disease

            this.state.set('responseStatus', status);
        }

        updateVisualization() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const state = this.state.get();

            container.querySelector('#tcell-day').textContent = `Day ${state.daysSinceInfusion.toFixed(1)}`;
            
            const crsEl = container.querySelector('#tcell-crs');
            crsEl.textContent = `CRS Grade ${state.crsGrade}`;
            crsEl.style.background = state.crsGrade === 0 ? 'rgba(0,255,136,0.2)' :
                                      state.crsGrade <= 2 ? 'rgba(255,215,0,0.2)' : 'rgba(255,0,51,0.2)';
            crsEl.style.borderColor = state.crsGrade === 0 ? '#00ff88' :
                                       state.crsGrade <= 2 ? '#ffd700' : '#ff0033';

            container.querySelector('#t-effector').textContent = Math.round(state.tCells.effector);
            container.querySelector('#t-memory').textContent = Math.round(state.tCells.memory);
            container.querySelector('#t-exhausted').textContent = Math.round(state.tCells.exhausted);
            container.querySelector('#t-total').textContent = Math.round(state.totalTCells);

            const tumorPct = (state.tumorBurden / state.initialTumor) * 100;
            container.querySelector('#tumor-bar').style.width = Math.min(100, tumorPct) + '%';
            container.querySelector('#tumor-value').textContent = Math.round(state.tumorBurden);

            // Cytokine bars
            const maxCyt = 1000;
            container.querySelector('#cyt-il6').style.width = Math.min(100, state.cytokines.il6 / maxCyt * 100) + '%';
            container.querySelector('#cyt-ifnGamma').style.width = Math.min(100, state.cytokines.ifnGamma / maxCyt * 100) + '%';
            container.querySelector('#cyt-tnfAlpha').style.width = Math.min(100, state.cytokines.tnfAlpha / maxCyt * 100) + '%';

            container.querySelector('#pt-temp').textContent = state.temperature.toFixed(1);
            container.querySelector('#pt-bp').textContent = Math.round(state.bloodPressure);
            container.querySelector('#pt-spo2').textContent = Math.round(state.oxygenation);

            const respEl = container.querySelector('#response-status');
            respEl.textContent = state.responseStatus;
            respEl.style.color = state.responseStatus === 'CR' ? '#00ff88' :
                                  state.responseStatus === 'PR' ? '#ffd700' :
                                  state.responseStatus === 'SD' ? '#0055ff' : '#ff0033';

            this.drawChart();
        }

        drawChart() {
            if (!this.chartCtx) return;
            const ctx = this.chartCtx;
            const canvas = ctx.canvas;
            const { width, height } = canvas;
            const pad = { top: 20, right: 20, bottom: 30, left: 50 };

            ctx.fillStyle = 'rgba(10, 5, 20, 0.95)';
            ctx.fillRect(0, 0, width, height);

            const chartW = width - pad.left - pad.right;
            const chartH = height - pad.top - pad.bottom;

            const maxT = Math.max(100, ...this.history.tCells);
            const maxTumor = Math.max(100, ...this.history.tumor);
            const maxIL6 = Math.max(10, ...this.history.il6);

            // Draw lines
            const drawLine = (data, maxVal, color) => {
                if (data.length < 2) return;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                data.forEach((v, i) => {
                    const x = pad.left + (i / (data.length - 1)) * chartW;
                    const y = pad.top + chartH * (1 - v / maxVal);
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                });
                ctx.stroke();
            };

            drawLine(this.history.tCells, maxT, '#ff0088');
            drawLine(this.history.tumor, maxTumor, '#00ff88');
            drawLine(this.history.il6, maxIL6, '#ffd700');
        }

        showFeedback(message, type = 'info') {
            const feedback = document.getElementById('tcell-feedback');
            if (!feedback) return;
            const colors = { info: '#0055ff', success: '#00ff88', warning: '#ffd700', critical: '#ff0033' };
            feedback.style.color = colors[type];
            feedback.style.borderColor = colors[type];
            feedback.textContent = message;
            feedback.style.display = 'block';
            clearTimeout(this._feedbackTimeout);
            this._feedbackTimeout = setTimeout(() => feedback.style.display = 'none', 4000);
        }
    }

    window.TCellSimulator = TCellSimulator;
    window.initTCellSimulator = (containerId) => { const s = new TCellSimulator(containerId); s.init(); return s; };
    console.log('[TCellSimulator] Module loaded');
})();
// v20260117-FULL
