/**
 * PatientAnalog.com - Module #15: OrganoidViewer Enhancement
 * Museum-Grade Scientific Simulation
 * 
 * Enhanced 3D organoid visualization with:
 * - Multi-layer structure rendering
 * - Growth simulation over time
 * - Marker expression visualization
 * - Drug response modeling
 * - Export capabilities
 */

(function() {
    'use strict';

    const { MathUtils, StateManager, SimulationModule, PerformanceDetector, AudioFeedback } = window.MuseumGradeEngine;

    // ═══════════════════════════════════════════════════════════════════════
    // ORGANOID CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const ORGANOID_TYPES = {
        intestinal: {
            name: 'Intestinal Organoid',
            layers: ['epithelium', 'lumen'],
            markers: ['LGR5', 'KI67', 'MUC2', 'CHGA'],
            growthRate: 1.2,
            color: '#ff6b9d'
        },
        cerebral: {
            name: 'Cerebral Organoid',
            layers: ['ventricular', 'subventricular', 'cortical'],
            markers: ['SOX2', 'PAX6', 'TBR1', 'CTIP2'],
            growthRate: 0.8,
            color: '#9d6bff'
        },
        hepatic: {
            name: 'Hepatic Organoid',
            layers: ['hepatocyte', 'biliary'],
            markers: ['ALB', 'CYP3A4', 'HNF4A', 'KRT19'],
            growthRate: 1.0,
            color: '#8b4513'
        },
        cardiac: {
            name: 'Cardiac Organoid',
            layers: ['cardiomyocyte', 'fibroblast', 'endothelial'],
            markers: ['TNNT2', 'MYH7', 'NKX2.5', 'CD31'],
            growthRate: 0.9,
            color: '#dc143c'
        },
        kidney: {
            name: 'Kidney Organoid',
            layers: ['nephron', 'stromal', 'endothelial'],
            markers: ['PAX2', 'WT1', 'PODXL', 'CDH1'],
            growthRate: 1.1,
            color: '#8b0000'
        }
    };

    const DRUG_RESPONSES = {
        cisplatin: { name: 'Cisplatin', ic50: 5, maxKill: 80, selectivity: 0.3 },
        doxorubicin: { name: 'Doxorubicin', ic50: 2, maxKill: 90, selectivity: 0.4 },
        paclitaxel: { name: 'Paclitaxel', ic50: 0.5, maxKill: 85, selectivity: 0.5 },
        '5fu': { name: '5-Fluorouracil', ic50: 10, maxKill: 70, selectivity: 0.6 }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ORGANOID VIEWER CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class OrganoidViewer extends SimulationModule {
        getInitialState() {
            return {
                // Organoid type and settings
                organoidType: 'intestinal',
                
                // Growth state
                developmentDay: 0,
                size: 100,                  // μm diameter
                cellCount: 1000,
                
                // Structure
                layers: {},
                lumenFormed: false,
                polarized: false,
                
                // Marker expression (0-100%)
                markerExpression: {},
                
                // Viability
                viability: 100,
                proliferationRate: 50,
                apoptosisRate: 5,
                
                // Drug treatment
                drugApplied: null,
                drugConcentration: 0,
                drugResponse: 0,
                
                // Visualization settings
                viewMode: '3d',             // '3d', 'slice', 'markers'
                rotationAngle: 0,
                slicePosition: 50,
                selectedMarker: null,
                
                // Analysis
                measurements: {
                    diameter: 100,
                    volume: 0,
                    surfaceArea: 0,
                    circularity: 0.95
                },
                
                // Export
                analysisReport: null,
                
                phase: 'culture',
                score: 0
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            const config = ORGANOID_TYPES[this.state.get('organoidType')];
            
            container.innerHTML = `
                <div class="organoid-viewer" style="width:100%;height:100%;background:linear-gradient(135deg,#050508,#0a0a12);border-radius:16px;overflow:hidden;font-family:'Orbitron',sans-serif;color:#e0f2fe;">
                    <div style="padding:12px 20px;background:linear-gradient(90deg,rgba(255,107,157,0.1),rgba(157,107,255,0.1));border-bottom:1px solid rgba(255,107,157,0.2);display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#ff6b9d;">🔬 OrganoidViewer Pro</h3>
                            <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.6);">Advanced 3D Organoid Analysis</p>
                        </div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            <span id="ov-day" style="padding:4px 12px;background:rgba(255,215,0,0.2);border:1px solid #ffd700;border-radius:12px;font-size:10px;">Day 0</span>
                            <span id="ov-size" style="font-size:11px;color:#0055ff;">100 μm</span>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 300px;height:calc(100% - 50px);">
                        <div style="padding:15px;display:flex;flex-direction:column;gap:10px;">
                            <!-- 3D Organoid visualization -->
                            <div id="organoid-3d-container" style="flex:1;background:radial-gradient(ellipse at center,rgba(20,10,30,0.8),rgba(5,5,10,0.95));border:1px solid rgba(255,107,157,0.2);border-radius:12px;position:relative;overflow:hidden;">
                                <canvas id="organoid-canvas" style="width:100%;height:100%;"></canvas>
                                
                                <!-- Rotation control -->
                                <div style="position:absolute;bottom:10px;left:10px;right:10px;">
                                    <input type="range" id="rotation-slider" min="0" max="360" value="0" style="width:100%;accent-color:#ff6b9d;">
                                </div>
                                
                                <!-- View mode buttons -->
                                <div style="position:absolute;top:10px;right:10px;display:flex;gap:5px;">
                                    <button class="view-btn active" data-mode="3d" style="padding:6px 12px;background:rgba(255,107,157,0.3);border:1px solid #ff6b9d;border-radius:5px;color:#ff6b9d;font-size:9px;cursor:pointer;">3D</button>
                                    <button class="view-btn" data-mode="slice" style="padding:6px 12px;background:rgba(157,107,255,0.1);border:1px solid rgba(157,107,255,0.3);border-radius:5px;color:#9d6bff;font-size:9px;cursor:pointer;">Slice</button>
                                    <button class="view-btn" data-mode="markers" style="padding:6px 12px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);border-radius:5px;color:#00ff88;font-size:9px;cursor:pointer;">Markers</button>
                                </div>
                                
                                <!-- Measurements overlay -->
                                <div id="measurements-overlay" style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.7);padding:8px;border-radius:6px;font-size:9px;">
                                    <div>Ø <span id="meas-diameter">100</span> μm</div>
                                    <div>V <span id="meas-volume">0.52</span> mm³</div>
                                    <div>Cells: <span id="meas-cells">1000</span></div>
                                </div>
                            </div>
                            
                            <!-- Controls -->
                            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
                                <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                                    <div style="font-size:10px;color:#ff6b9d;margin-bottom:5px;">Organoid Type</div>
                                    <select id="organoid-type-select" style="width:100%;padding:6px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,107,157,0.3);border-radius:4px;color:#fff;font-size:10px;">
                                        ${Object.entries(ORGANOID_TYPES).map(([k,v]) => `<option value="${k}">${v.name}</option>`).join('')}
                                    </select>
                                </div>
                                <button id="culture-btn" style="padding:10px;background:rgba(0,255,136,0.2);border:1px solid #00ff88;border-radius:8px;color:#00ff88;cursor:pointer;font-size:10px;">🧫 Culture (+1 Day)</button>
                                <button id="analyze-btn" style="padding:10px;background:rgba(0,212,255,0.2);border:1px solid #0055ff;border-radius:8px;color:#0055ff;cursor:pointer;font-size:10px;">📊 Analyze</button>
                            </div>
                        </div>
                        <div style="padding:15px;background:rgba(0,0,0,0.3);border-left:1px solid rgba(255,107,157,0.2);overflow-y:auto;">
                            <!-- Marker Expression -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#00ff88;margin-bottom:8px;">🧬 Marker Expression</div>
                                <div id="marker-bars">
                                    ${config.markers.map(m => `
                                        <div style="margin-bottom:6px;">
                                            <div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:2px;">
                                                <span>${m}</span>
                                                <span class="marker-val" data-marker="${m}">0%</span>
                                            </div>
                                            <div style="height:6px;background:rgba(0,0,0,0.3);border-radius:3px;cursor:pointer;" class="marker-bar-container" data-marker="${m}">
                                                <div class="marker-bar" data-marker="${m}" style="height:100%;width:0%;background:linear-gradient(90deg,#00ff88,#ffd700);border-radius:3px;"></div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <!-- Structure -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#9d6bff;margin-bottom:8px;">🏗️ Structure</div>
                                <div style="font-size:10px;">
                                    <div style="display:flex;justify-content:space-between;padding:4px 0;">
                                        <span>Lumen</span>
                                        <span id="struct-lumen" style="color:#ff6b6b;">✗</span>
                                    </div>
                                    <div style="display:flex;justify-content:space-between;padding:4px 0;">
                                        <span>Polarized</span>
                                        <span id="struct-polar" style="color:#ff6b6b;">✗</span>
                                    </div>
                                    <div style="display:flex;justify-content:space-between;padding:4px 0;">
                                        <span>Layers</span>
                                        <span id="struct-layers">0</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Viability -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ff6b6b;margin-bottom:8px;">❤️ Viability</div>
                                <div style="height:20px;background:rgba(0,0,0,0.3);border-radius:10px;overflow:hidden;">
                                    <div id="viability-bar" style="height:100%;width:100%;background:#00ff88;"></div>
                                </div>
                                <div style="display:flex;justify-content:space-between;font-size:9px;margin-top:4px;">
                                    <span>Prolif: <span id="prolif-rate">50</span>%</span>
                                    <span>Apop: <span id="apop-rate">5</span>%</span>
                                </div>
                            </div>
                            
                            <!-- Drug Treatment -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ffd700;margin-bottom:8px;">💊 Drug Treatment</div>
                                <select id="drug-select" style="width:100%;padding:8px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,215,0,0.3);border-radius:6px;color:#fff;font-size:10px;margin-bottom:8px;">
                                    <option value="">Select drug...</option>
                                    ${Object.entries(DRUG_RESPONSES).map(([k,v]) => `<option value="${k}">${v.name}</option>`).join('')}
                                </select>
                                <div style="display:flex;gap:8px;align-items:center;">
                                    <input type="range" id="drug-conc" min="0" max="20" value="0" style="flex:1;accent-color:#ffd700;">
                                    <span id="drug-conc-val" style="font-size:10px;min-width:40px;">0 μM</span>
                                </div>
                                <button id="treat-btn" style="width:100%;padding:8px;margin-top:8px;background:rgba(255,215,0,0.2);border:1px solid #ffd700;border-radius:6px;color:#ffd700;cursor:pointer;font-size:10px;">Apply Treatment</button>
                            </div>
                            
                            <!-- Drug Response -->
                            <div id="drug-response-panel" style="display:none;padding:10px;background:rgba(255,0,51,0.1);border-radius:8px;margin-bottom:15px;">
                                <div style="font-size:10px;color:#ff0033;">Drug Response</div>
                                <div style="font-size:20px;color:#ff0033;" id="drug-response-val">0%</div>
                                <div style="font-size:9px;color:rgba(255,255,255,0.5);">Cell death</div>
                            </div>
                            
                            <!-- Export -->
                            <button id="export-btn" style="width:100%;padding:10px;background:rgba(157,0,255,0.2);border:1px solid #9d00ff;border-radius:8px;color:#9d00ff;cursor:pointer;font-size:10px;">📥 Export Report</button>
                        </div>
                    </div>
                </div>
            `;
            
            this.bindOVEvents();
            this.initCanvas();
            this.initializeOrganoid();
        }

        bindOVEvents() {
            const container = document.getElementById(this.containerId);
            
            // Type selection
            container.querySelector('#organoid-type-select').addEventListener('change', (e) => {
                this.state.set('organoidType', e.target.value);
                this.initializeOrganoid();
                this.updateMarkerUI();
            });
            
            // View mode
            container.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.set('viewMode', btn.dataset.mode);
                    this.render();
                });
            });
            
            // Rotation
            container.querySelector('#rotation-slider').addEventListener('input', (e) => {
                this.state.set('rotationAngle', parseInt(e.target.value));
                this.render();
            });
            
            // Culture
            container.querySelector('#culture-btn').addEventListener('click', () => this.advanceDay());
            
            // Analyze
            container.querySelector('#analyze-btn').addEventListener('click', () => this.performAnalysis());
            
            // Drug treatment
            container.querySelector('#drug-conc').addEventListener('input', (e) => {
                container.querySelector('#drug-conc-val').textContent = e.target.value + ' μM';
            });
            
            container.querySelector('#treat-btn').addEventListener('click', () => this.applyDrugTreatment());
            
            // Export
            container.querySelector('#export-btn').addEventListener('click', () => this.exportReport());
            
            // Marker selection
            container.querySelectorAll('.marker-bar-container').forEach(bar => {
                bar.addEventListener('click', () => {
                    this.state.set('selectedMarker', bar.dataset.marker);
                    this.render();
                });
            });
        }

        initCanvas() {
            const canvas = document.getElementById('organoid-canvas');
            if (canvas) {
                const rect = canvas.parentElement.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                this.ctx = canvas.getContext('2d');
            }
        }

        initializeOrganoid() {
            const type = this.state.get('organoidType');
            const config = ORGANOID_TYPES[type];
            
            // Initialize marker expression
            const markers = {};
            config.markers.forEach(m => {
                markers[m] = m.includes('LGR5') || m.includes('SOX2') ? 80 : 10;
            });
            this.state.set('markerExpression', markers);
            
            // Initialize layers
            const layers = {};
            config.layers.forEach((l, i) => {
                layers[l] = { thickness: 10 + i * 5, integrity: 100 };
            });
            this.state.set('layers', layers);
            
            this.render();
        }

        advanceDay() {
            const day = this.state.get('developmentDay') + 1;
            this.state.set('developmentDay', day);
            
            const type = this.state.get('organoidType');
            const config = ORGANOID_TYPES[type];
            
            // Growth
            let size = this.state.get('size');
            let cells = this.state.get('cellCount');
            const viability = this.state.get('viability');
            
            size *= (1 + 0.1 * config.growthRate * (viability / 100));
            cells *= (1 + 0.15 * config.growthRate * (viability / 100));
            
            this.state.set('size', Math.min(1000, size));
            this.state.set('cellCount', Math.round(cells));
            
            // Structure development
            if (day > 3 && !this.state.get('lumenFormed')) {
                this.state.set('lumenFormed', true);
            }
            if (day > 5 && !this.state.get('polarized')) {
                this.state.set('polarized', true);
            }
            
            // Marker expression changes
            const markers = this.state.get('markerExpression');
            Object.keys(markers).forEach(m => {
                if (m.includes('KI67') || m.includes('SOX2')) {
                    markers[m] = Math.max(20, markers[m] - 2); // Decrease stem/proliferation
                } else {
                    markers[m] = Math.min(90, markers[m] + 5); // Increase differentiation
                }
            });
            this.state.set('markerExpression', markers);
            
            // Update measurements
            this.updateMeasurements();
            this.updateUI();
            this.render();
            
            AudioFeedback.playStateChange('tick');
        }

        applyDrugTreatment() {
            const container = document.getElementById(this.containerId);
            const drugId = container.querySelector('#drug-select').value;
            const conc = parseFloat(container.querySelector('#drug-conc').value);
            
            if (!drugId || conc === 0) return;
            
            const drug = DRUG_RESPONSES[drugId];
            this.state.set('drugApplied', drugId);
            this.state.set('drugConcentration', conc);
            
            // Calculate response using Hill equation
            const response = (drug.maxKill * Math.pow(conc, 1.5)) / (Math.pow(drug.ic50, 1.5) + Math.pow(conc, 1.5));
            this.state.set('drugResponse', response);
            
            // Apply to viability
            const viability = this.state.get('viability');
            this.state.set('viability', Math.max(0, viability - response));
            
            // Show response panel
            container.querySelector('#drug-response-panel').style.display = 'block';
            container.querySelector('#drug-response-val').textContent = Math.round(response) + '%';
            
            this.updateUI();
            this.render();
            
            AudioFeedback.playStateChange('warning');
        }

        performAnalysis() {
            this.updateMeasurements();
            
            const report = {
                type: ORGANOID_TYPES[this.state.get('organoidType')].name,
                day: this.state.get('developmentDay'),
                measurements: this.state.get('measurements'),
                markers: this.state.get('markerExpression'),
                viability: this.state.get('viability'),
                structure: {
                    lumen: this.state.get('lumenFormed'),
                    polarized: this.state.get('polarized')
                }
            };
            
            this.state.set('analysisReport', report);
            
            alert(`Analysis Complete!\n\nDiameter: ${report.measurements.diameter.toFixed(0)} μm\nCells: ${report.measurements.cells}\nViability: ${report.viability.toFixed(1)}%\nLumen: ${report.structure.lumen ? 'Yes' : 'No'}\nPolarized: ${report.structure.polarized ? 'Yes' : 'No'}`);
            
            AudioFeedback.playStateChange('success');
        }

        updateMeasurements() {
            const size = this.state.get('size');
            const cells = this.state.get('cellCount');
            
            const measurements = {
                diameter: size,
                volume: (4/3) * Math.PI * Math.pow(size/2000, 3), // mm³
                surfaceArea: 4 * Math.PI * Math.pow(size/2000, 2), // mm²
                circularity: 0.9 + Math.random() * 0.1,
                cells: cells
            };
            
            this.state.set('measurements', measurements);
        }

        updateMarkerUI() {
            const container = document.getElementById(this.containerId);
            const type = this.state.get('organoidType');
            const config = ORGANOID_TYPES[type];
            
            container.querySelector('#marker-bars').innerHTML = config.markers.map(m => `
                <div style="margin-bottom:6px;">
                    <div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:2px;">
                        <span>${m}</span>
                        <span class="marker-val" data-marker="${m}">0%</span>
                    </div>
                    <div style="height:6px;background:rgba(0,0,0,0.3);border-radius:3px;cursor:pointer;" class="marker-bar-container" data-marker="${m}">
                        <div class="marker-bar" data-marker="${m}" style="height:100%;width:0%;background:linear-gradient(90deg,#00ff88,#ffd700);border-radius:3px;"></div>
                    </div>
                </div>
            `).join('');
        }

        updateUI() {
            const container = document.getElementById(this.containerId);
            if (!container) return;
            
            const state = this.state.get();
            
            container.querySelector('#ov-day').textContent = `Day ${state.developmentDay}`;
            container.querySelector('#ov-size').textContent = `${Math.round(state.size)} μm`;
            
            // Measurements
            container.querySelector('#meas-diameter').textContent = Math.round(state.size);
            container.querySelector('#meas-volume').textContent = state.measurements.volume.toFixed(3);
            container.querySelector('#meas-cells').textContent = state.cellCount.toLocaleString();
            
            // Markers
            const markers = state.markerExpression;
            Object.entries(markers).forEach(([m, val]) => {
                const valEl = container.querySelector(`.marker-val[data-marker="${m}"]`);
                const barEl = container.querySelector(`.marker-bar[data-marker="${m}"]`);
                if (valEl) valEl.textContent = Math.round(val) + '%';
                if (barEl) barEl.style.width = val + '%';
            });
            
            // Structure
            container.querySelector('#struct-lumen').textContent = state.lumenFormed ? '✓' : '✗';
            container.querySelector('#struct-lumen').style.color = state.lumenFormed ? '#00ff88' : '#ff6b6b';
            container.querySelector('#struct-polar').textContent = state.polarized ? '✓' : '✗';
            container.querySelector('#struct-polar').style.color = state.polarized ? '#00ff88' : '#ff6b6b';
            container.querySelector('#struct-layers').textContent = Object.keys(state.layers).length;
            
            // Viability
            container.querySelector('#viability-bar').style.width = state.viability + '%';
            container.querySelector('#viability-bar').style.background = state.viability > 70 ? '#00ff88' : state.viability > 40 ? '#ffd700' : '#ff0033';
            container.querySelector('#prolif-rate').textContent = Math.round(state.proliferationRate);
            container.querySelector('#apop-rate').textContent = Math.round(state.apoptosisRate);
        }

        render() {
            if (!this.ctx) return;
            
            const canvas = this.ctx.canvas;
            const ctx = this.ctx;
            const { width, height } = canvas;
            
            // Clear
            ctx.fillStyle = 'rgba(5,5,10,0.95)';
            ctx.fillRect(0, 0, width, height);
            
            const viewMode = this.state.get('viewMode');
            const type = this.state.get('organoidType');
            const config = ORGANOID_TYPES[type];
            const size = this.state.get('size');
            const angle = this.state.get('rotationAngle') * Math.PI / 180;
            const viability = this.state.get('viability');
            
            const centerX = width / 2;
            const centerY = height / 2;
            const baseRadius = Math.min(width, height) * 0.3 * (size / 500);
            
            if (viewMode === '3d') {
                // Draw 3D-like organoid
                this.draw3DOrganoid(ctx, centerX, centerY, baseRadius, config, angle, viability);
            } else if (viewMode === 'slice') {
                // Draw cross-section
                this.drawSlice(ctx, centerX, centerY, baseRadius, config, viability);
            } else if (viewMode === 'markers') {
                // Draw marker heatmap
                this.drawMarkerView(ctx, centerX, centerY, baseRadius, config);
            }
        }

        draw3DOrganoid(ctx, cx, cy, radius, config, angle, viability) {
            // Outer glow
            const gradient = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.5);
            gradient.addColorStop(0, config.color + '40');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Main body with 3D shading
            const bodyGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius);
            bodyGrad.addColorStop(0, this.adjustBrightness(config.color, 1.5));
            bodyGrad.addColorStop(0.5, config.color);
            bodyGrad.addColorStop(1, this.adjustBrightness(config.color, 0.5));
            
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.ellipse(cx, cy, radius, radius * 0.9, angle * 0.1, 0, Math.PI * 2);
            ctx.fill();
            
            // Cell texture
            const tier = PerformanceDetector.detect().tier;
            if (tier !== 'low') {
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                for (let i = 0; i < 30; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const r = Math.random() * radius * 0.8;
                    const x = cx + Math.cos(a) * r;
                    const y = cy + Math.sin(a) * r * 0.9;
                    ctx.beginPath();
                    ctx.arc(x, y, 2 + Math.random() * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Lumen if formed
            if (this.state.get('lumenFormed')) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.beginPath();
                ctx.ellipse(cx, cy, radius * 0.3, radius * 0.25, angle * 0.1, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Viability overlay (red tint for low viability)
            if (viability < 70) {
                ctx.fillStyle = `rgba(255,0,0,${(70 - viability) / 200})`;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.ellipse(cx - radius * 0.3, cy - radius * 0.3, radius * 0.2, radius * 0.1, -0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        drawSlice(ctx, cx, cy, radius, config, viability) {
            const layers = this.state.get('layers');
            const layerCount = Object.keys(layers).length;
            
            // Draw concentric layers
            Object.entries(layers).forEach(([name, data], i) => {
                const layerRadius = radius * (1 - i * 0.2);
                const alpha = 0.3 + (i * 0.2);
                
                ctx.fillStyle = this.adjustBrightness(config.color, 1 - i * 0.2) + Math.round(alpha * 255).toString(16).padStart(2, '0');
                ctx.beginPath();
                ctx.arc(cx, cy, layerRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Layer label
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '9px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(name, cx + layerRadius * 0.7, cy - layerRadius * 0.5);
            });
            
            // Lumen
            if (this.state.get('lumenFormed')) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.beginPath();
                ctx.arc(cx, cy, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('lumen', cx, cy + 3);
            }
        }

        drawMarkerView(ctx, cx, cy, radius, config) {
            const markers = this.state.get('markerExpression');
            const selected = this.state.get('selectedMarker');
            
            // Draw organoid outline
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw marker heatmap
            if (selected && markers[selected] !== undefined) {
                const intensity = markers[selected] / 100;
                const heatGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                heatGrad.addColorStop(0, `rgba(0,255,136,${intensity})`);
                heatGrad.addColorStop(0.5, `rgba(255,215,0,${intensity * 0.7})`);
                heatGrad.addColorStop(1, `rgba(255,0,51,${intensity * 0.3})`);
                
                ctx.fillStyle = heatGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Label
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${selected}: ${Math.round(markers[selected])}%`, cx, cy);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Click a marker to view', cx, cy);
            }
        }

        adjustBrightness(hex, factor) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            
            const nr = Math.min(255, Math.round(r * factor));
            const ng = Math.min(255, Math.round(g * factor));
            const nb = Math.min(255, Math.round(b * factor));
            
            return `#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}`;
        }

        exportReport() {
            const report = this.state.get('analysisReport') || {
                type: ORGANOID_TYPES[this.state.get('organoidType')].name,
                day: this.state.get('developmentDay'),
                measurements: this.state.get('measurements'),
                markers: this.state.get('markerExpression'),
                viability: this.state.get('viability')
            };
            
            const reportText = `
ORGANOID ANALYSIS REPORT
========================
Type: ${report.type}
Culture Day: ${report.day}

MEASUREMENTS
------------
Diameter: ${report.measurements.diameter?.toFixed(0) || '-'} μm
Volume: ${report.measurements.volume?.toFixed(4) || '-'} mm³
Cell Count: ${report.measurements.cells || '-'}
Circularity: ${report.measurements.circularity?.toFixed(2) || '-'}

MARKER EXPRESSION
-----------------
${Object.entries(report.markers).map(([m,v]) => `${m}: ${Math.round(v)}%`).join('\n')}

VIABILITY: ${report.viability?.toFixed(1) || '-'}%

Generated by PatientAnalog OrganoidViewer Pro
            `;
            
            console.log(reportText);
            alert('Report exported to console!\n\n(In production, this would download as PDF/CSV)');
            
            AudioFeedback.playStateChange('success');
        }

        updateVisualization() { 
            this.updateUI(); 
            this.render(); 
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════════════

    window.OrganoidViewer = OrganoidViewer;
    window.initOrganoidViewer = (id) => { 
        const s = new OrganoidViewer(id); 
        s.init(); 
        return s; 
    };

    console.log('[OrganoidViewer] Module loaded');
})();
// v20260117-FULL
