/**
 * PatientAnalog.com - Modules #6-11 Consolidated
 * Museum-Grade Scientific Simulations
 * 
 * Includes:
 * - Module #6: AI Drug Target Discovery
 * - Module #7: Organoid Development Chamber
 * - Module #8: Microfluidic Engineering Platform
 * - Module #9: Clinical Decision Support
 * - Module #10: Adaptive Immune Response
 * - Module #11: DNA Damage & Repair
 */

(function() {
    'use strict';

    const { MathUtils, StateManager, SimulationModule, PerformanceDetector, AudioFeedback } = window.MuseumGradeEngine;

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE #6: AI DRUG TARGET DISCOVERY PLATFORM
    // ═══════════════════════════════════════════════════════════════════════

    const DRUG_TARGETS = {
        kinase: { name: 'Kinase', bindingSiteVolume: 450, hydrophobicity: 0.6, flexibility: 0.3 },
        gpcr: { name: 'GPCR', bindingSiteVolume: 380, hydrophobicity: 0.7, flexibility: 0.5 },
        ionChannel: { name: 'Ion Channel', bindingSiteVolume: 320, hydrophobicity: 0.4, flexibility: 0.2 },
        protease: { name: 'Protease', bindingSiteVolume: 500, hydrophobicity: 0.5, flexibility: 0.4 }
    };

    const COMPOUND_SCAFFOLDS = [
        { id: 'benzene', name: 'Benzene', mw: 78, logP: 2.1, hbd: 0, hba: 0 },
        { id: 'pyridine', name: 'Pyridine', mw: 79, logP: 0.65, hbd: 0, hba: 1 },
        { id: 'indole', name: 'Indole', mw: 117, logP: 2.1, hbd: 1, hba: 0 },
        { id: 'quinoline', name: 'Quinoline', mw: 129, logP: 2.0, hbd: 0, hba: 1 },
        { id: 'purine', name: 'Purine', mw: 120, logP: -0.4, hbd: 1, hba: 3 }
    ];

    class DrugDiscoveryPlatform extends SimulationModule {
        getInitialState() {
            return {
                selectedTarget: null,
                selectedScaffold: null,
                rGroups: { r1: 'H', r2: 'H', r3: 'H' },
                
                // Calculated properties
                compound: {
                    mw: 0,
                    logP: 0,
                    hbd: 0,
                    hba: 0,
                    tpsa: 0,
                    rotBonds: 0
                },
                
                // Predictions
                bindingAffinity: 0,     // pKd
                selectivity: 0,          // 0-100
                admet: {
                    absorption: 50,
                    distribution: 50,
                    metabolism: 50,
                    excretion: 50,
                    toxicity: 20
                },
                drugLikeness: 0,        // 0-100
                
                // SAR table
                testedCompounds: [],
                
                // Budget
                budget: 100,
                compoundsTested: 0,
                
                phase: 'design',
                score: 0
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            container.innerHTML = `
                <div class="drug-discovery" style="width:100%;height:100%;background:linear-gradient(135deg,#050a15,#0a1020);border-radius:16px;overflow:hidden;font-family:'Orbitron',sans-serif;color:#e0f2fe;">
                    <div style="padding:12px 20px;background:linear-gradient(90deg,rgba(0,212,255,0.1),rgba(157,0,255,0.1));border-bottom:1px solid rgba(0,212,255,0.2);display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#0055ff;">🔬 AI Drug Discovery Platform</h3>
                            <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.6);">Structure-Based Drug Design</p>
                        </div>
                        <span style="padding:4px 12px;background:rgba(255,215,0,0.2);border:1px solid #ffd700;border-radius:12px;font-size:10px;">Budget: $<span id="dd-budget">100</span>M</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 280px;height:calc(100% - 50px);">
                        <div style="padding:15px;display:flex;flex-direction:column;gap:10px;">
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                                <div style="padding:12px;background:rgba(0,0,0,0.3);border-radius:10px;">
                                    <div style="font-size:10px;color:#0055ff;margin-bottom:8px;">🎯 Target Selection</div>
                                    <select id="target-select" style="width:100%;padding:8px;background:rgba(0,0,0,0.5);border:1px solid rgba(0,212,255,0.3);border-radius:6px;color:#fff;">
                                        <option value="">Select target...</option>
                                        ${Object.entries(DRUG_TARGETS).map(([k,v]) => `<option value="${k}">${v.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div style="padding:12px;background:rgba(0,0,0,0.3);border-radius:10px;">
                                    <div style="font-size:10px;color:#9d00ff;margin-bottom:8px;">🧪 Scaffold</div>
                                    <select id="scaffold-select" style="width:100%;padding:8px;background:rgba(0,0,0,0.5);border:1px solid rgba(157,0,255,0.3);border-radius:6px;color:#fff;">
                                        <option value="">Select scaffold...</option>
                                        ${COMPOUND_SCAFFOLDS.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div style="flex:1;background:rgba(0,0,0,0.4);border:1px solid rgba(0,212,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                                <div id="compound-display" style="text-align:center;color:rgba(255,255,255,0.5);">
                                    <div style="font-size:40px;margin-bottom:10px;">🧬</div>
                                    <div>Select target and scaffold to begin</div>
                                </div>
                            </div>
                            <div style="display:flex;gap:10px;">
                                <button id="predict-btn" style="flex:1;padding:12px;background:rgba(0,212,255,0.2);border:1px solid #0055ff;border-radius:8px;color:#0055ff;cursor:pointer;">🔮 Predict Binding</button>
                                <button id="synthesize-btn" style="flex:1;padding:12px;background:rgba(0,255,136,0.2);border:1px solid #00ff88;border-radius:8px;color:#00ff88;cursor:pointer;">⚗️ Synthesize ($5M)</button>
                            </div>
                        </div>
                        <div style="padding:15px;background:rgba(0,0,0,0.3);border-left:1px solid rgba(0,212,255,0.2);overflow-y:auto;">
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#00ff88;margin-bottom:8px;">📊 Predicted Properties</div>
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10px;">
                                    <div style="padding:6px;background:rgba(0,255,136,0.1);border-radius:4px;">pKd: <span id="pred-pkd">-</span></div>
                                    <div style="padding:6px;background:rgba(255,215,0,0.1);border-radius:4px;">Select: <span id="pred-sel">-</span>%</div>
                                    <div style="padding:6px;background:rgba(0,212,255,0.1);border-radius:4px;">MW: <span id="pred-mw">-</span></div>
                                    <div style="padding:6px;background:rgba(157,0,255,0.1);border-radius:4px;">logP: <span id="pred-logp">-</span></div>
                                </div>
                            </div>
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ffd700;margin-bottom:8px;">💊 Drug-likeness</div>
                                <div style="height:20px;background:rgba(0,0,0,0.3);border-radius:10px;overflow:hidden;">
                                    <div id="druglike-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#ff0033,#ffd700,#00ff88);"></div>
                                </div>
                                <div id="druglike-rules" style="font-size:9px;color:rgba(255,255,255,0.5);margin-top:5px;"></div>
                            </div>
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ff6b6b;margin-bottom:8px;">⚠️ ADMET Profile</div>
                                ${['absorption','distribution','metabolism','excretion','toxicity'].map(p => `
                                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                                        <span style="width:60px;font-size:9px;">${p.charAt(0).toUpperCase()}</span>
                                        <div style="flex:1;height:6px;background:rgba(0,0,0,0.3);border-radius:3px;">
                                            <div id="admet-${p}" style="height:100%;width:50%;background:${p==='toxicity'?'#ff6b6b':'#00ff88'};border-radius:3px;"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div>
                                <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:8px;">📋 SAR Table (<span id="compounds-tested">0</span> tested)</div>
                                <div id="sar-table" style="max-height:150px;overflow-y:auto;font-size:9px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.bindDrugEvents();
        }

        bindDrugEvents() {
            const container = document.getElementById(this.containerId);
            container.querySelector('#target-select').addEventListener('change', (e) => {
                this.state.set('selectedTarget', DRUG_TARGETS[e.target.value] || null);
                this.updatePredictions();
            });
            container.querySelector('#scaffold-select').addEventListener('change', (e) => {
                this.state.set('selectedScaffold', COMPOUND_SCAFFOLDS.find(s => s.id === e.target.value) || null);
                this.updatePredictions();
            });
            container.querySelector('#predict-btn').addEventListener('click', () => this.predictBinding());
            container.querySelector('#synthesize-btn').addEventListener('click', () => this.synthesizeCompound());
        }

        predictBinding() {
            const target = this.state.get('selectedTarget');
            const scaffold = this.state.get('selectedScaffold');
            if (!target || !scaffold) return;

            // Simplified binding prediction based on complementarity
            const sizeMatch = 1 - Math.abs(target.bindingSiteVolume - scaffold.mw * 3) / 1000;
            const hydrophobicMatch = 1 - Math.abs(target.hydrophobicity - (scaffold.logP / 5));
            
            const pkd = 5 + sizeMatch * 3 + hydrophobicMatch * 2 + MathUtils.gaussianRandom(0, 0.5);
            const selectivity = 50 + (1 - target.flexibility) * 30 + MathUtils.gaussianRandom(0, 10);

            this.state.set('bindingAffinity', MathUtils.clamp(pkd, 3, 12));
            this.state.set('selectivity', MathUtils.clamp(selectivity, 10, 95));
            this.updateUI();
        }

        synthesizeCompound() {
            let budget = this.state.get('budget');
            if (budget < 5) {
                this.showFeedback('Insufficient budget!', 'warning');
                return;
            }
            budget -= 5;
            this.state.set('budget', budget);
            this.state.update('compoundsTested', n => n + 1);

            const tested = this.state.get('testedCompounds');
            tested.push({
                scaffold: this.state.get('selectedScaffold')?.name || 'Unknown',
                pkd: this.state.get('bindingAffinity'),
                selectivity: this.state.get('selectivity')
            });
            this.state.set('testedCompounds', tested);
            this.updateUI();
            this.showFeedback('Compound synthesized and tested!', 'success');
        }

        updatePredictions() {
            const scaffold = this.state.get('selectedScaffold');
            if (scaffold) {
                this.state.set('compound', {
                    mw: scaffold.mw,
                    logP: scaffold.logP,
                    hbd: scaffold.hbd,
                    hba: scaffold.hba
                });
            }
            this.updateUI();
        }

        updateUI() {
            const container = document.getElementById(this.containerId);
            const compound = this.state.get('compound');
            
            container.querySelector('#dd-budget').textContent = this.state.get('budget');
            container.querySelector('#pred-pkd').textContent = this.state.get('bindingAffinity').toFixed(1);
            container.querySelector('#pred-sel').textContent = Math.round(this.state.get('selectivity'));
            container.querySelector('#pred-mw').textContent = compound.mw;
            container.querySelector('#pred-logp').textContent = compound.logP.toFixed(1);
            container.querySelector('#compounds-tested').textContent = this.state.get('compoundsTested');

            // Drug-likeness (Lipinski)
            let violations = 0;
            if (compound.mw > 500) violations++;
            if (compound.logP > 5) violations++;
            if (compound.hbd > 5) violations++;
            if (compound.hba > 10) violations++;
            const drugLikeness = (1 - violations / 4) * 100;
            container.querySelector('#druglike-bar').style.width = drugLikeness + '%';
            container.querySelector('#druglike-rules').textContent = violations === 0 ? 'Passes Lipinski Rule of 5' : `${violations} violation(s)`;

            // SAR table
            const sarHtml = this.state.get('testedCompounds').slice(-5).reverse().map(c => 
                `<div style="display:flex;justify-content:space-between;padding:4px;background:rgba(0,0,0,0.2);margin-bottom:2px;border-radius:3px;">
                    <span>${c.scaffold}</span><span>pKd:${c.pkd.toFixed(1)}</span><span>Sel:${Math.round(c.selectivity)}%</span>
                </div>`
            ).join('');
            container.querySelector('#sar-table').innerHTML = sarHtml;
        }

        updateVisualization() { this.updateUI(); }
        showFeedback(msg, type) {
            AudioFeedback.playStateChange(type === 'success' ? 'success' : 'warning');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE #7: ORGANOID DEVELOPMENT CHAMBER
    // ═══════════════════════════════════════════════════════════════════════

    const SIGNALING_FACTORS = {
        wnt: { name: 'Wnt', color: '#00ff88', effect: 'stemness' },
        bmp: { name: 'BMP', color: '#ff6b6b', effect: 'differentiation' },
        fgf: { name: 'FGF', color: '#ffd700', effect: 'proliferation' },
        shh: { name: 'Shh', color: '#9d00ff', effect: 'patterning' },
        notch: { name: 'Notch', color: '#0055ff', effect: 'fate' }
    };

    class OrganoidChamber extends SimulationModule {
        getInitialState() {
            return {
                organoidType: 'intestinal',
                developmentDay: 0,
                
                cellPopulations: {
                    stem: 100,
                    progenitor: 0,
                    differentiated: 0,
                    apoptotic: 0
                },
                
                signaling: {
                    wnt: 50,
                    bmp: 20,
                    fgf: 30,
                    shh: 10,
                    notch: 25
                },
                
                structure: {
                    size: 50,           // μm
                    lumenFormed: false,
                    polarized: false,
                    cryptsFormed: false
                },
                
                maturationMarkers: {
                    lgr5: 100,          // Stem marker
                    ki67: 50,           // Proliferation
                    muc2: 0,            // Goblet cells
                    villin: 0           // Enterocytes
                },
                
                oxygenLevel: 21,
                matrixStiffness: 1,      // kPa
                feedingSchedule: 48,     // hours
                
                viability: 100,
                qualityScore: 0,
                phase: 'setup'
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            container.innerHTML = `
                <div class="organoid-chamber" style="width:100%;height:100%;background:linear-gradient(135deg,#0a050f,#150a18);border-radius:16px;overflow:hidden;font-family:'Orbitron',sans-serif;color:#e0f2fe;">
                    <div style="padding:12px 20px;background:linear-gradient(90deg,rgba(157,0,255,0.1),rgba(255,0,136,0.1));border-bottom:1px solid rgba(157,0,255,0.2);display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#9d00ff;">🔬 Organoid Development Chamber</h3>
                            <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.6);">Stem Cell Differentiation & Self-Organization</p>
                        </div>
                        <span id="org-day" style="font-size:12px;color:#ffd700;">Day 0</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 280px;height:calc(100% - 50px);">
                        <div style="padding:15px;display:flex;flex-direction:column;gap:10px;">
                            <!-- Organoid visualization -->
                            <div style="flex:1;background:radial-gradient(ellipse at center,rgba(157,0,255,0.1),transparent);border:1px solid rgba(157,0,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;position:relative;">
                                <div id="organoid-viz" style="width:150px;height:150px;border-radius:50%;background:radial-gradient(ellipse at 30% 30%,rgba(255,150,200,0.8),rgba(157,0,100,0.6));box-shadow:0 0 50px rgba(157,0,255,0.3);transition:all 0.5s;"></div>
                                <div id="lumen-indicator" style="position:absolute;width:50px;height:50px;border-radius:50%;background:rgba(0,0,0,0.3);opacity:0;transition:opacity 0.5s;"></div>
                            </div>
                            
                            <!-- Signaling controls -->
                            <div style="padding:12px;background:rgba(0,0,0,0.3);border-radius:10px;">
                                <div style="font-size:10px;color:#9d00ff;margin-bottom:10px;">🧪 Growth Factor Cocktail</div>
                                <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">
                                    ${Object.entries(SIGNALING_FACTORS).map(([k,v]) => `
                                        <div style="text-align:center;">
                                            <div style="font-size:9px;color:${v.color};margin-bottom:4px;">${v.name}</div>
                                            <input type="range" class="signal-slider" data-signal="${k}" min="0" max="100" value="50" style="width:100%;accent-color:${v.color};">
                                            <div class="signal-val" data-signal="${k}" style="font-size:9px;">50</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        <div style="padding:15px;background:rgba(0,0,0,0.3);border-left:1px solid rgba(157,0,255,0.2);overflow-y:auto;">
                            <!-- Cell populations -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#00ff88;margin-bottom:8px;">🧬 Cell Populations</div>
                                ${['stem','progenitor','differentiated'].map(type => `
                                    <div style="margin-bottom:6px;">
                                        <div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:2px;">
                                            <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                            <span id="pop-${type}">0</span>
                                        </div>
                                        <div style="height:6px;background:rgba(0,0,0,0.3);border-radius:3px;">
                                            <div id="pop-bar-${type}" style="height:100%;width:0%;background:#00ff88;border-radius:3px;"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <!-- Structure -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ffd700;margin-bottom:8px;">🏗️ Structure</div>
                                <div style="font-size:10px;">
                                    <div>Size: <span id="org-size">50</span> μm</div>
                                    <div>Lumen: <span id="org-lumen">✗</span></div>
                                    <div>Polarity: <span id="org-polar">✗</span></div>
                                </div>
                            </div>
                            
                            <!-- Markers -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#0055ff;margin-bottom:8px;">🔬 Markers</div>
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:9px;">
                                    <div>LGR5: <span id="mk-lgr5">100</span>%</div>
                                    <div>Ki67: <span id="mk-ki67">50</span>%</div>
                                    <div>MUC2: <span id="mk-muc2">0</span>%</div>
                                    <div>Villin: <span id="mk-villin">0</span>%</div>
                                </div>
                            </div>
                            
                            <!-- Viability -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ff6b6b;margin-bottom:8px;">❤️ Viability</div>
                                <div style="height:20px;background:rgba(0,0,0,0.3);border-radius:10px;overflow:hidden;">
                                    <div id="viability-bar" style="height:100%;width:100%;background:#00ff88;"></div>
                                </div>
                            </div>
                            
                            <div style="display:flex;gap:8px;">
                                <button id="org-start" style="flex:1;padding:10px;background:rgba(0,255,136,0.2);border:1px solid #00ff88;border-radius:8px;color:#00ff88;cursor:pointer;font-size:11px;">▶ Culture</button>
                                <button id="org-reset" style="flex:1;padding:10px;background:rgba(255,0,51,0.1);border:1px solid rgba(255,0,51,0.3);border-radius:8px;color:#ff0033;cursor:pointer;font-size:11px;">↺ Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.bindOrganoidEvents();
        }

        bindOrganoidEvents() {
            const container = document.getElementById(this.containerId);
            
            container.querySelectorAll('.signal-slider').forEach(slider => {
                slider.addEventListener('input', (e) => {
                    const signal = e.target.dataset.signal;
                    const value = parseInt(e.target.value);
                    const signaling = this.state.get('signaling');
                    signaling[signal] = value;
                    this.state.set('signaling', signaling);
                    container.querySelector(`.signal-val[data-signal="${signal}"]`).textContent = value;
                });
            });

            container.querySelector('#org-start').addEventListener('click', () => {
                if (this.isRunning) { this.pause(); container.querySelector('#org-start').textContent = '▶ Resume'; }
                else { this.start(); container.querySelector('#org-start').textContent = '⏸ Pause'; }
            });
            container.querySelector('#org-reset').addEventListener('click', () => {
                this.reset(); container.querySelector('#org-start').textContent = '▶ Culture';
            });
        }

        simulationStep(dt, totalTime) {
            const timeScale = 6; // Hours per second
            const days = (totalTime * timeScale) / 24;
            this.state.set('developmentDay', days);

            const signaling = this.state.get('signaling');
            const cells = this.state.get('cellPopulations');
            const structure = this.state.get('structure');
            const markers = this.state.get('maturationMarkers');

            // Wnt maintains stemness, low Wnt allows differentiation
            const wntEffect = signaling.wnt / 100;
            const diffSignal = (signaling.bmp / 100) * (1 - wntEffect * 0.5);

            // Cell dynamics
            const prolifRate = 0.1 * (signaling.fgf / 50) * wntEffect;
            const diffRate = 0.05 * diffSignal;
            
            cells.progenitor += cells.stem * diffRate * dt - cells.progenitor * diffRate * dt;
            cells.differentiated += cells.progenitor * diffRate * dt;
            cells.stem += cells.stem * prolifRate * dt - cells.stem * diffRate * dt;
            cells.stem = Math.max(0, cells.stem);

            // Structure development
            const totalCells = cells.stem + cells.progenitor + cells.differentiated;
            structure.size = 50 + Math.sqrt(totalCells) * 2;
            
            if (days > 3 && signaling.notch > 30) structure.lumenFormed = true;
            if (days > 5 && signaling.shh > 20) structure.polarized = true;
            if (days > 7 && wntEffect > 0.4) structure.cryptsFormed = true;

            // Markers
            markers.lgr5 = wntEffect * 100;
            markers.ki67 = prolifRate * 500;
            markers.muc2 = diffSignal * cells.differentiated / totalCells * 100;
            markers.villin = diffSignal * cells.differentiated / totalCells * 80;

            // Viability affected by suboptimal conditions
            let viability = this.state.get('viability');
            if (signaling.fgf < 20) viability -= dt * 2;
            if (signaling.wnt < 10 && cells.stem < 20) viability -= dt * 5;
            viability = MathUtils.clamp(viability, 0, 100);

            this.state.set('cellPopulations', cells);
            this.state.set('structure', structure);
            this.state.set('maturationMarkers', markers);
            this.state.set('viability', viability);
        }

        updateVisualization() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const state = this.state.get();
            container.querySelector('#org-day').textContent = `Day ${state.developmentDay.toFixed(1)}`;

            const total = state.cellPopulations.stem + state.cellPopulations.progenitor + state.cellPopulations.differentiated;
            ['stem','progenitor','differentiated'].forEach(type => {
                const pct = total > 0 ? (state.cellPopulations[type] / total) * 100 : 0;
                container.querySelector(`#pop-${type}`).textContent = Math.round(state.cellPopulations[type]);
                container.querySelector(`#pop-bar-${type}`).style.width = pct + '%';
            });

            container.querySelector('#org-size').textContent = Math.round(state.structure.size);
            container.querySelector('#org-lumen').textContent = state.structure.lumenFormed ? '✓' : '✗';
            container.querySelector('#org-polar').textContent = state.structure.polarized ? '✓' : '✗';

            container.querySelector('#mk-lgr5').textContent = Math.round(state.maturationMarkers.lgr5);
            container.querySelector('#mk-ki67').textContent = Math.round(state.maturationMarkers.ki67);
            container.querySelector('#mk-muc2').textContent = Math.round(state.maturationMarkers.muc2);
            container.querySelector('#mk-villin').textContent = Math.round(state.maturationMarkers.villin);

            container.querySelector('#viability-bar').style.width = state.viability + '%';
            container.querySelector('#viability-bar').style.background = state.viability > 70 ? '#00ff88' : state.viability > 40 ? '#ffd700' : '#ff0033';

            // Update organoid visual
            const viz = container.querySelector('#organoid-viz');
            const size = 100 + state.structure.size;
            viz.style.width = size + 'px';
            viz.style.height = size + 'px';
            
            const lumen = container.querySelector('#lumen-indicator');
            lumen.style.opacity = state.structure.lumenFormed ? '1' : '0';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE #8: MICROFLUIDIC ENGINEERING PLATFORM
    // ═══════════════════════════════════════════════════════════════════════

    class MicrofluidicPlatform extends SimulationModule {
        getInitialState() {
            return {
                channels: [
                    { id: 'main', width: 200, height: 50, length: 1000 },
                    { id: 'branch1', width: 100, height: 50, length: 500 },
                    { id: 'branch2', width: 100, height: 50, length: 500 }
                ],
                flowRate: 10,           // μL/min
                fluidViscosity: 1,      // cP (water = 1)
                
                calculated: {
                    reynoldsNumber: 0,
                    shearStress: 0,      // dyn/cm²
                    pressureDrop: 0,     // Pa
                    residenceTime: 0     // seconds
                },
                
                cellLayer: {
                    confluency: 0,
                    viability: 100,
                    alignment: 0
                },
                
                drugConcentration: 0,
                oxygenGradient: [21, 21, 21],
                
                phase: 'design'
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            container.innerHTML = `
                <div class="microfluidic-platform" style="width:100%;height:100%;background:linear-gradient(135deg,#050a10,#0a1520);border-radius:16px;overflow:hidden;font-family:'Orbitron',sans-serif;color:#e0f2fe;">
                    <div style="padding:12px 20px;background:linear-gradient(90deg,rgba(0,212,255,0.1),rgba(0,255,136,0.1));border-bottom:1px solid rgba(0,212,255,0.2);display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#0055ff;">🔧 Microfluidic Organ-Chip Platform</h3>
                            <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.6);">Fluid Dynamics & Cell Culture Engineering</p>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 280px;height:calc(100% - 50px);">
                        <div style="padding:15px;display:flex;flex-direction:column;gap:10px;">
                            <!-- Chip visualization -->
                            <div style="flex:1;background:rgba(0,0,0,0.4);border:1px solid rgba(0,212,255,0.2);border-radius:12px;position:relative;overflow:hidden;">
                                <svg id="chip-svg" viewBox="0 0 400 200" style="width:100%;height:100%;">
                                    <!-- Main channel -->
                                    <rect x="50" y="80" width="300" height="40" rx="5" fill="rgba(0,212,255,0.3)" stroke="#0055ff" stroke-width="2"/>
                                    <!-- Flow arrows -->
                                    <path d="M 70 100 L 100 100 L 95 95 M 100 100 L 95 105" stroke="#0055ff" stroke-width="2" fill="none" class="flow-arrow"/>
                                    <path d="M 170 100 L 200 100 L 195 95 M 200 100 L 195 105" stroke="#0055ff" stroke-width="2" fill="none" class="flow-arrow"/>
                                    <path d="M 270 100 L 300 100 L 295 95 M 300 100 L 295 105" stroke="#0055ff" stroke-width="2" fill="none" class="flow-arrow"/>
                                    <!-- Labels -->
                                    <text x="200" y="70" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="10">Main Channel</text>
                                    <text x="40" y="105" text-anchor="end" fill="#00ff88" font-size="10">In</text>
                                    <text x="360" y="105" text-anchor="start" fill="#ff6b6b" font-size="10">Out</text>
                                    <!-- Shear stress gradient -->
                                    <rect id="shear-overlay" x="50" y="115" width="300" height="5" fill="url(#shearGrad)"/>
                                    <defs>
                                        <linearGradient id="shearGrad">
                                            <stop offset="0%" style="stop-color:#00ff88"/>
                                            <stop offset="50%" style="stop-color:#ffd700"/>
                                            <stop offset="100%" style="stop-color:#ff6b6b"/>
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            
                            <!-- Controls -->
                            <div style="padding:12px;background:rgba(0,0,0,0.3);border-radius:10px;display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                                <div>
                                    <div style="font-size:10px;color:#0055ff;margin-bottom:5px;">Flow Rate (μL/min)</div>
                                    <input type="range" id="flow-rate" min="1" max="100" value="10" style="width:100%;accent-color:#0055ff;">
                                    <span id="flow-val" style="font-size:11px;">10</span>
                                </div>
                                <div>
                                    <div style="font-size:10px;color:#ffd700;margin-bottom:5px;">Channel Width (μm)</div>
                                    <input type="range" id="channel-width" min="50" max="500" value="200" style="width:100%;accent-color:#ffd700;">
                                    <span id="width-val" style="font-size:11px;">200</span>
                                </div>
                            </div>
                        </div>
                        <div style="padding:15px;background:rgba(0,0,0,0.3);border-left:1px solid rgba(0,212,255,0.2);overflow-y:auto;">
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#00ff88;margin-bottom:8px;">📊 Calculated Parameters</div>
                                <div style="font-size:10px;">
                                    <div style="padding:5px 0;">Reynolds #: <span id="calc-re" style="color:#0055ff;">0</span></div>
                                    <div style="padding:5px 0;">Shear Stress: <span id="calc-shear" style="color:#ffd700;">0</span> dyn/cm²</div>
                                    <div style="padding:5px 0;">Δ Pressure: <span id="calc-dp" style="color:#ff6b6b;">0</span> Pa</div>
                                    <div style="padding:5px 0;">Residence: <span id="calc-res" style="color:#9d00ff;">0</span> s</div>
                                </div>
                            </div>
                            
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ff6b6b;margin-bottom:8px;">🧬 Cell Response</div>
                                <div style="font-size:10px;">
                                    <div>Confluency: <span id="cell-conf">0</span>%</div>
                                    <div>Viability: <span id="cell-viab">100</span>%</div>
                                    <div>Alignment: <span id="cell-align">0</span>%</div>
                                </div>
                            </div>
                            
                            <div style="padding:10px;background:rgba(255,215,0,0.1);border-radius:8px;font-size:9px;">
                                <div style="color:#ffd700;margin-bottom:5px;">⚠️ Design Guidelines</div>
                                <div>• Re {'<'} 1 for laminar flow</div>
                                <div>• Shear 1-10 dyn/cm² for endothelium</div>
                                <div>• Avoid dead zones</div>
                            </div>
                            
                            <div style="display:flex;gap:8px;margin-top:15px;">
                                <button id="mf-start" style="flex:1;padding:10px;background:rgba(0,255,136,0.2);border:1px solid #00ff88;border-radius:8px;color:#00ff88;cursor:pointer;font-size:11px;">▶ Run Flow</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.bindMicrofluidicEvents();
        }

        bindMicrofluidicEvents() {
            const container = document.getElementById(this.containerId);
            
            container.querySelector('#flow-rate').addEventListener('input', (e) => {
                this.state.set('flowRate', parseInt(e.target.value));
                container.querySelector('#flow-val').textContent = e.target.value;
                this.calculateFluidDynamics();
            });
            
            container.querySelector('#channel-width').addEventListener('input', (e) => {
                const channels = this.state.get('channels');
                channels[0].width = parseInt(e.target.value);
                this.state.set('channels', channels);
                container.querySelector('#width-val').textContent = e.target.value;
                this.calculateFluidDynamics();
            });

            container.querySelector('#mf-start').addEventListener('click', () => {
                if (this.isRunning) { this.pause(); }
                else { this.start(); }
            });
            
            this.calculateFluidDynamics();
        }

        calculateFluidDynamics() {
            const Q = this.state.get('flowRate') / 60 * 1e-9;  // m³/s
            const channel = this.state.get('channels')[0];
            const w = channel.width * 1e-6;  // m
            const h = channel.height * 1e-6;  // m
            const L = channel.length * 1e-6;  // m
            const mu = this.state.get('fluidViscosity') * 1e-3;  // Pa·s
            const rho = 1000;  // kg/m³

            const A = w * h;
            const v = Q / A;  // m/s
            const Dh = 2 * w * h / (w + h);  // Hydraulic diameter

            const Re = rho * v * Dh / mu;
            const shear = 6 * mu * Q / (w * h * h) * 10;  // dyn/cm²
            const dP = 12 * mu * L * Q / (w * h * h * h);  // Pa
            const residence = L / v;  // s

            const calc = {
                reynoldsNumber: Re,
                shearStress: shear,
                pressureDrop: dP,
                residenceTime: residence
            };
            this.state.set('calculated', calc);
            this.updateMicrofluidicUI();
        }

        simulationStep(dt) {
            const calc = this.state.get('calculated');
            const cellLayer = this.state.get('cellLayer');

            // Cell response to shear
            const optimalShear = 5;  // dyn/cm²
            const shearDiff = Math.abs(calc.shearStress - optimalShear);
            
            if (calc.shearStress > 0.5 && calc.shearStress < 20) {
                cellLayer.confluency = Math.min(100, cellLayer.confluency + dt * 2);
                cellLayer.alignment = Math.min(100, calc.shearStress * 10);
            } else if (calc.shearStress > 20) {
                cellLayer.viability = Math.max(0, cellLayer.viability - dt * 5);
            }

            this.state.set('cellLayer', cellLayer);
        }

        updateMicrofluidicUI() {
            const container = document.getElementById(this.containerId);
            const calc = this.state.get('calculated');
            const cellLayer = this.state.get('cellLayer');

            container.querySelector('#calc-re').textContent = calc.reynoldsNumber.toFixed(4);
            container.querySelector('#calc-shear').textContent = calc.shearStress.toFixed(2);
            container.querySelector('#calc-dp').textContent = calc.pressureDrop.toFixed(1);
            container.querySelector('#calc-res').textContent = calc.residenceTime.toFixed(2);

            container.querySelector('#cell-conf').textContent = Math.round(cellLayer.confluency);
            container.querySelector('#cell-viab').textContent = Math.round(cellLayer.viability);
            container.querySelector('#cell-align').textContent = Math.round(cellLayer.alignment);
        }

        updateVisualization() { this.updateMicrofluidicUI(); }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE #9: CLINICAL DECISION SUPPORT
    // ═══════════════════════════════════════════════════════════════════════

    class ClinicalDecisionSupport extends SimulationModule {
        getInitialState() {
            return {
                patient: {
                    age: 55,
                    sex: 'M',
                    vitals: { hr: 88, bp: 145, rr: 18, temp: 37.2, spo2: 95 },
                    labs: { wbc: 12.5, hgb: 11.2, plt: 180, cr: 1.8, trop: 0.15 }
                },
                
                differentialDiagnosis: [
                    { dx: 'Acute Coronary Syndrome', probability: 45 },
                    { dx: 'Heart Failure Exacerbation', probability: 25 },
                    { dx: 'Pulmonary Embolism', probability: 15 },
                    { dx: 'Sepsis', probability: 10 },
                    { dx: 'Other', probability: 5 }
                ],
                
                testsOrdered: [],
                treatmentsGiven: [],
                
                correctDiagnosis: 'Acute Coronary Syndrome',
                patientOutcome: 'pending',
                
                timeElapsed: 0,
                score: 100,
                phase: 'assessment'
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            container.innerHTML = `
                <div class="clinical-decision" style="width:100%;height:100%;background:linear-gradient(135deg,#050810,#101520);border-radius:16px;overflow:hidden;font-family:'Orbitron',sans-serif;color:#e0f2fe;">
                    <div style="padding:12px 20px;background:linear-gradient(90deg,rgba(255,0,51,0.1),rgba(255,215,0,0.1));border-bottom:1px solid rgba(255,0,51,0.2);display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#ff0033;">🏥 Clinical Decision Support</h3>
                            <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.6);">Bayesian Diagnostic Reasoning</p>
                        </div>
                        <span id="cds-time" style="font-size:12px;color:#ffd700;">0 min</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 280px;height:calc(100% - 50px);">
                        <div style="padding:15px;display:flex;flex-direction:column;gap:10px;">
                            <!-- Patient presentation -->
                            <div style="padding:12px;background:rgba(255,0,51,0.1);border:1px solid rgba(255,0,51,0.3);border-radius:10px;">
                                <div style="font-size:11px;color:#ff0033;margin-bottom:8px;">📋 Chief Complaint</div>
                                <div style="font-size:12px;">"55M with chest pain, diaphoresis, dyspnea × 2 hours"</div>
                            </div>
                            
                            <!-- Vitals -->
                            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">
                                ${[['HR','88','bpm'],['BP','145/90','mmHg'],['RR','18','/min'],['T','37.2','°C'],['SpO2','95','%']].map(([l,v,u]) => `
                                    <div style="padding:8px;background:rgba(0,0,0,0.3);border-radius:6px;text-align:center;">
                                        <div style="font-size:9px;color:rgba(255,255,255,0.5);">${l}</div>
                                        <div style="font-size:14px;color:#0055ff;">${v}</div>
                                        <div style="font-size:8px;color:rgba(255,255,255,0.4);">${u}</div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <!-- Differential diagnosis bars -->
                            <div style="flex:1;padding:12px;background:rgba(0,0,0,0.3);border-radius:10px;">
                                <div style="font-size:11px;color:#ffd700;margin-bottom:10px;">🎯 Differential Diagnosis</div>
                                <div id="ddx-bars"></div>
                            </div>
                            
                            <!-- Actions -->
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                                <div style="padding:10px;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.3);border-radius:8px;">
                                    <div style="font-size:10px;color:#0055ff;margin-bottom:8px;">🔬 Order Test</div>
                                    <select id="test-select" style="width:100%;padding:6px;background:rgba(0,0,0,0.5);border:1px solid rgba(0,212,255,0.3);border-radius:4px;color:#fff;font-size:10px;">
                                        <option value="">Select test...</option>
                                        <option value="ecg">ECG</option>
                                        <option value="cxr">Chest X-Ray</option>
                                        <option value="echo">Echocardiogram</option>
                                        <option value="ctpa">CT Pulmonary Angio</option>
                                        <option value="trop">Serial Troponins</option>
                                    </select>
                                </div>
                                <div style="padding:10px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);border-radius:8px;">
                                    <div style="font-size:10px;color:#00ff88;margin-bottom:8px;">💊 Treatment</div>
                                    <select id="tx-select" style="width:100%;padding:6px;background:rgba(0,0,0,0.5);border:1px solid rgba(0,255,136,0.3);border-radius:4px;color:#fff;font-size:10px;">
                                        <option value="">Select treatment...</option>
                                        <option value="aspirin">Aspirin</option>
                                        <option value="heparin">Heparin</option>
                                        <option value="nitro">Nitroglycerin</option>
                                        <option value="morphine">Morphine</option>
                                        <option value="cath">Cardiac Cath</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style="padding:15px;background:rgba(0,0,0,0.3);border-left:1px solid rgba(255,0,51,0.2);overflow-y:auto;">
                            <!-- Score -->
                            <div style="margin-bottom:15px;text-align:center;">
                                <div style="font-size:10px;color:rgba(255,255,255,0.5);">Clinical Score</div>
                                <div id="cds-score" style="font-size:32px;color:#00ff88;">100</div>
                            </div>
                            
                            <!-- Tests ordered -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#0055ff;margin-bottom:8px;">📝 Tests Ordered</div>
                                <div id="tests-list" style="font-size:10px;max-height:80px;overflow-y:auto;"></div>
                            </div>
                            
                            <!-- Treatments -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#00ff88;margin-bottom:8px;">💊 Treatments</div>
                                <div id="tx-list" style="font-size:10px;max-height:80px;overflow-y:auto;"></div>
                            </div>
                            
                            <button id="cds-diagnose" style="width:100%;padding:12px;background:rgba(255,215,0,0.2);border:1px solid #ffd700;border-radius:8px;color:#ffd700;cursor:pointer;font-size:11px;">🎯 Make Diagnosis</button>
                        </div>
                    </div>
                </div>
            `;
            this.bindCDSEvents();
            this.updateDDxBars();
        }

        bindCDSEvents() {
            const container = document.getElementById(this.containerId);
            
            container.querySelector('#test-select').addEventListener('change', (e) => {
                if (e.target.value) {
                    this.orderTest(e.target.value);
                    e.target.value = '';
                }
            });
            
            container.querySelector('#tx-select').addEventListener('change', (e) => {
                if (e.target.value) {
                    this.giveTreatment(e.target.value);
                    e.target.value = '';
                }
            });
            
            container.querySelector('#cds-diagnose').addEventListener('click', () => this.makeDiagnosis());
        }

        orderTest(testId) {
            const tests = this.state.get('testsOrdered');
            if (tests.includes(testId)) return;
            
            tests.push(testId);
            this.state.set('testsOrdered', tests);
            
            // Update probabilities based on test
            const ddx = this.state.get('differentialDiagnosis');
            if (testId === 'ecg') {
                ddx[0].probability = Math.min(80, ddx[0].probability + 20);  // ACS more likely
                ddx[2].probability = Math.max(5, ddx[2].probability - 5);
            } else if (testId === 'trop') {
                ddx[0].probability = Math.min(85, ddx[0].probability + 25);
            }
            this.normalizeProbs(ddx);
            this.state.set('differentialDiagnosis', ddx);
            
            this.updateCDSUI();
        }

        giveTreatment(txId) {
            const txs = this.state.get('treatmentsGiven');
            if (txs.includes(txId)) return;
            
            txs.push(txId);
            this.state.set('treatmentsGiven', txs);
            
            // Appropriate treatment adds score, inappropriate subtracts
            let score = this.state.get('score');
            if (['aspirin', 'heparin', 'nitro', 'cath'].includes(txId)) {
                score += 5;
            }
            this.state.set('score', Math.min(100, score));
            
            this.updateCDSUI();
        }

        makeDiagnosis() {
            const ddx = this.state.get('differentialDiagnosis');
            const topDx = ddx.reduce((a, b) => a.probability > b.probability ? a : b);
            
            if (topDx.dx === this.state.get('correctDiagnosis') && topDx.probability > 70) {
                this.state.set('patientOutcome', 'success');
                this.state.update('score', s => Math.min(100, s + 20));
                alert('✅ Correct diagnosis! Patient outcome: Good');
            } else {
                this.state.set('patientOutcome', 'failure');
                this.state.update('score', s => Math.max(0, s - 30));
                alert('❌ Incorrect or uncertain diagnosis. Consider more workup.');
            }
            this.updateCDSUI();
        }

        normalizeProbs(ddx) {
            const total = ddx.reduce((s, d) => s + d.probability, 0);
            ddx.forEach(d => d.probability = (d.probability / total) * 100);
        }

        updateDDxBars() {
            const container = document.getElementById(this.containerId);
            const ddx = this.state.get('differentialDiagnosis');
            
            container.querySelector('#ddx-bars').innerHTML = ddx.map(d => `
                <div style="margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px;">
                        <span>${d.dx}</span>
                        <span>${Math.round(d.probability)}%</span>
                    </div>
                    <div style="height:12px;background:rgba(0,0,0,0.3);border-radius:6px;overflow:hidden;">
                        <div style="height:100%;width:${d.probability}%;background:linear-gradient(90deg,#ff0033,#ffd700,#00ff88);background-size:300% 100%;background-position:${100-d.probability}% 0;"></div>
                    </div>
                </div>
            `).join('');
        }

        updateCDSUI() {
            const container = document.getElementById(this.containerId);
            
            container.querySelector('#cds-score').textContent = this.state.get('score');
            
            const tests = this.state.get('testsOrdered');
            container.querySelector('#tests-list').innerHTML = tests.map(t => 
                `<div style="padding:4px;background:rgba(0,212,255,0.1);margin-bottom:2px;border-radius:3px;">• ${t.toUpperCase()}</div>`
            ).join('') || '<div style="color:rgba(255,255,255,0.4);">None ordered</div>';
            
            const txs = this.state.get('treatmentsGiven');
            container.querySelector('#tx-list').innerHTML = txs.map(t => 
                `<div style="padding:4px;background:rgba(0,255,136,0.1);margin-bottom:2px;border-radius:3px;">• ${t}</div>`
            ).join('') || '<div style="color:rgba(255,255,255,0.4);">None given</div>';
            
            this.updateDDxBars();
        }

        updateVisualization() { this.updateCDSUI(); }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE #10: ADAPTIVE IMMUNE RESPONSE
    // ═══════════════════════════════════════════════════════════════════════

    class ImmuneResponseSimulator extends SimulationModule {
        getInitialState() {
            return {
                pathogenLoad: 1000,
                daysSinceInfection: 0,
                
                innate: {
                    neutrophils: 100,
                    macrophages: 50,
                    nkCells: 30
                },
                
                adaptive: {
                    naiveTCells: 1000,
                    effectorTCells: 0,
                    memoryTCells: 0,
                    naiveBCells: 500,
                    plasmaCells: 0,
                    memoryBCells: 0
                },
                
                antibodies: {
                    igm: 0,
                    igg: 0,
                    neutralizing: 0
                },
                
                cytokines: {
                    il2: 10,
                    ifnGamma: 10,
                    il4: 5,
                    il10: 5
                },
                
                germinalCenterActive: false,
                affinityMaturation: 0,
                
                vaccinated: false,
                phase: 'naive'
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            container.innerHTML = `
                <div class="immune-sim" style="width:100%;height:100%;background:linear-gradient(135deg,#050810,#0a1520);border-radius:16px;overflow:hidden;font-family:'Orbitron',sans-serif;color:#e0f2fe;">
                    <div style="padding:12px 20px;background:linear-gradient(90deg,rgba(0,255,136,0.1),rgba(255,215,0,0.1));border-bottom:1px solid rgba(0,255,136,0.2);display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#00ff88;">🦠 Adaptive Immune Response</h3>
                            <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.6);">Infection & Vaccination Dynamics</p>
                        </div>
                        <span id="imm-day" style="font-size:12px;color:#ffd700;">Day 0</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 280px;height:calc(100% - 50px);">
                        <div style="padding:15px;display:flex;flex-direction:column;gap:10px;">
                            <div style="flex:1;background:rgba(0,0,0,0.4);border:1px solid rgba(0,255,136,0.2);border-radius:12px;">
                                <canvas id="immune-chart" style="width:100%;height:100%;"></canvas>
                            </div>
                            <div style="display:flex;gap:10px;">
                                <button id="infect-btn" style="flex:1;padding:10px;background:rgba(255,0,51,0.2);border:1px solid #ff0033;border-radius:8px;color:#ff0033;cursor:pointer;">🦠 Infect</button>
                                <button id="vaccinate-btn" style="flex:1;padding:10px;background:rgba(0,255,136,0.2);border:1px solid #00ff88;border-radius:8px;color:#00ff88;cursor:pointer;">💉 Vaccinate</button>
                                <button id="imm-start" style="flex:1;padding:10px;background:rgba(0,212,255,0.2);border:1px solid #0055ff;border-radius:8px;color:#0055ff;cursor:pointer;">▶ Run</button>
                            </div>
                        </div>
                        <div style="padding:15px;background:rgba(0,0,0,0.3);border-left:1px solid rgba(0,255,136,0.2);overflow-y:auto;">
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ff0033;margin-bottom:8px;">🦠 Pathogen</div>
                                <div style="height:20px;background:rgba(0,0,0,0.3);border-radius:10px;overflow:hidden;">
                                    <div id="pathogen-bar" style="height:100%;width:10%;background:#ff0033;"></div>
                                </div>
                                <div id="pathogen-val" style="font-size:10px;text-align:center;margin-top:3px;">1000</div>
                            </div>
                            
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#0055ff;margin-bottom:8px;">🧬 T Cells</div>
                                <div style="font-size:10px;">
                                    <div>Effector: <span id="t-eff">0</span></div>
                                    <div>Memory: <span id="t-mem">0</span></div>
                                </div>
                            </div>
                            
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ffd700;margin-bottom:8px;">🔬 Antibodies</div>
                                <div style="font-size:10px;">
                                    <div>IgM: <span id="ab-igm">0</span></div>
                                    <div>IgG: <span id="ab-igg">0</span></div>
                                    <div>Neutralizing: <span id="ab-neut">0</span>%</div>
                                </div>
                            </div>
                            
                            <div id="gc-status" style="padding:10px;background:rgba(157,0,255,0.1);border-radius:8px;font-size:10px;display:none;">
                                <div style="color:#9d00ff;">🔬 Germinal Center Active</div>
                                <div>Affinity: <span id="gc-affinity">0</span>%</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.bindImmuneEvents();
            this.initImmuneChart();
        }

        bindImmuneEvents() {
            const container = document.getElementById(this.containerId);
            container.querySelector('#infect-btn').addEventListener('click', () => {
                this.state.set('pathogenLoad', 1000);
                this.state.set('daysSinceInfection', 0);
            });
            container.querySelector('#vaccinate-btn').addEventListener('click', () => {
                this.state.set('vaccinated', true);
                this.state.update('adaptive', a => { a.memoryTCells += 100; a.memoryBCells += 50; return a; });
            });
            container.querySelector('#imm-start').addEventListener('click', () => {
                if (this.isRunning) this.pause();
                else this.start();
            });
        }

        initImmuneChart() {
            this.immuneHistory = { pathogen: [], tCells: [], antibodies: [] };
            const canvas = document.getElementById('immune-chart');
            if (canvas) {
                const rect = canvas.parentElement.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                this.immuneChartCtx = canvas.getContext('2d');
            }
        }

        simulationStep(dt) {
            const days = this.state.get('daysSinceInfection') + dt * 2;
            this.state.set('daysSinceInfection', days);

            let pathogen = this.state.get('pathogenLoad');
            const adaptive = this.state.get('adaptive');
            const antibodies = this.state.get('antibodies');

            // T cell activation (delayed ~5 days)
            if (days > 5 && pathogen > 0) {
                const activationRate = 0.1 * Math.log(pathogen + 1);
                adaptive.effectorTCells += adaptive.naiveTCells * activationRate * dt * 0.01;
                adaptive.naiveTCells -= adaptive.naiveTCells * activationRate * dt * 0.01;
            }

            // T cell killing
            pathogen -= adaptive.effectorTCells * 0.5 * dt;

            // B cell response (delayed ~7 days)
            if (days > 7 && pathogen > 0) {
                adaptive.plasmaCells += adaptive.naiveBCells * 0.05 * dt;
                antibodies.igm += adaptive.plasmaCells * 0.1 * dt;
                
                // Class switch to IgG
                if (days > 10) {
                    antibodies.igg += adaptive.plasmaCells * 0.2 * dt;
                    antibodies.neutralizing = Math.min(100, antibodies.igg / 10);
                }
            }

            // Antibody neutralization
            pathogen -= pathogen * (antibodies.neutralizing / 100) * 0.1 * dt;

            // Memory formation (after day 14)
            if (days > 14) {
                adaptive.memoryTCells += adaptive.effectorTCells * 0.01 * dt;
                adaptive.memoryBCells += adaptive.plasmaCells * 0.01 * dt;
                this.state.set('germinalCenterActive', true);
                this.state.update('affinityMaturation', a => Math.min(100, a + dt * 2));
            }

            // Contraction phase
            if (pathogen < 10 && days > 21) {
                adaptive.effectorTCells *= (1 - 0.1 * dt);
                adaptive.plasmaCells *= (1 - 0.1 * dt);
            }

            pathogen = Math.max(0, pathogen);
            this.state.set('pathogenLoad', pathogen);
            this.state.set('adaptive', adaptive);
            this.state.set('antibodies', antibodies);

            // History
            this.immuneHistory.pathogen.push(pathogen);
            this.immuneHistory.tCells.push(adaptive.effectorTCells);
            this.immuneHistory.antibodies.push(antibodies.igg);
            if (this.immuneHistory.pathogen.length > 200) {
                this.immuneHistory.pathogen.shift();
                this.immuneHistory.tCells.shift();
                this.immuneHistory.antibodies.shift();
            }
        }

        updateVisualization() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const state = this.state.get();
            container.querySelector('#imm-day').textContent = `Day ${state.daysSinceInfection.toFixed(1)}`;
            container.querySelector('#pathogen-bar').style.width = Math.min(100, state.pathogenLoad / 100) + '%';
            container.querySelector('#pathogen-val').textContent = Math.round(state.pathogenLoad);
            container.querySelector('#t-eff').textContent = Math.round(state.adaptive.effectorTCells);
            container.querySelector('#t-mem').textContent = Math.round(state.adaptive.memoryTCells);
            container.querySelector('#ab-igm').textContent = state.antibodies.igm.toFixed(0);
            container.querySelector('#ab-igg').textContent = state.antibodies.igg.toFixed(0);
            container.querySelector('#ab-neut').textContent = Math.round(state.antibodies.neutralizing);

            if (state.germinalCenterActive) {
                container.querySelector('#gc-status').style.display = 'block';
                container.querySelector('#gc-affinity').textContent = Math.round(state.affinityMaturation);
            }

            this.drawImmuneChart();
        }

        drawImmuneChart() {
            if (!this.immuneChartCtx) return;
            const ctx = this.immuneChartCtx;
            const { width, height } = ctx.canvas;

            ctx.fillStyle = 'rgba(5,8,16,0.95)';
            ctx.fillRect(0, 0, width, height);

            const drawLine = (data, max, color) => {
                if (data.length < 2) return;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                data.forEach((v, i) => {
                    const x = (i / (data.length - 1)) * width;
                    const y = height - (v / max) * height * 0.9;
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                });
                ctx.stroke();
            };

            const maxP = Math.max(1000, ...this.immuneHistory.pathogen);
            const maxT = Math.max(100, ...this.immuneHistory.tCells);
            const maxA = Math.max(100, ...this.immuneHistory.antibodies);

            drawLine(this.immuneHistory.pathogen, maxP, '#ff0033');
            drawLine(this.immuneHistory.tCells, maxT, '#0055ff');
            drawLine(this.immuneHistory.antibodies, maxA, '#ffd700');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE #11: DNA DAMAGE & REPAIR
    // ═══════════════════════════════════════════════════════════════════════

    const DNA_DAMAGE_TYPES = {
        ssb: { name: 'Single-Strand Break', repairPath: 'BER', repairTime: 0.5 },
        dsb: { name: 'Double-Strand Break', repairPath: 'HR/NHEJ', repairTime: 4 },
        oxidative: { name: '8-oxoG', repairPath: 'BER', repairTime: 1 },
        dimer: { name: 'Thymine Dimer', repairPath: 'NER', repairTime: 2 },
        crosslink: { name: 'Crosslink', repairPath: 'Fanconi', repairTime: 6 }
    };

    class DNARepairSimulator extends SimulationModule {
        getInitialState() {
            return {
                genomeSize: 1000,  // Symbolic positions
                damages: [],       // { position, type, repaired }
                
                repairPathways: {
                    ber: { active: true, efficiency: 1.0 },
                    ner: { active: true, efficiency: 1.0 },
                    hr: { active: true, efficiency: 1.0 },
                    nhej: { active: true, efficiency: 0.7 },  // Error-prone
                    fanconi: { active: true, efficiency: 0.9 }
                },
                
                cellCycle: {
                    phase: 'G1',
                    checkpoint: false,
                    progress: 0
                },
                
                mutations: 0,
                genomicInstability: 0,
                cellFate: 'viable',  // viable, senescent, apoptotic, transformed
                
                damageSource: 'none',  // UV, radiation, ROS, chemo
                exposureIntensity: 0,
                
                phase: 'normal'
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            container.innerHTML = `
                <div class="dna-repair" style="width:100%;height:100%;background:linear-gradient(135deg,#050510,#101020);border-radius:16px;overflow:hidden;font-family:'Orbitron',sans-serif;color:#e0f2fe;">
                    <div style="padding:12px 20px;background:linear-gradient(90deg,rgba(255,215,0,0.1),rgba(255,0,51,0.1));border-bottom:1px solid rgba(255,215,0,0.2);display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#ffd700;">🧬 DNA Damage & Repair</h3>
                            <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.6);">Genomic Integrity Simulator</p>
                        </div>
                        <span id="dna-mutations" style="padding:4px 12px;background:rgba(255,0,51,0.2);border:1px solid #ff0033;border-radius:12px;font-size:10px;">Mutations: 0</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 280px;height:calc(100% - 50px);">
                        <div style="padding:15px;display:flex;flex-direction:column;gap:10px;">
                            <!-- DNA visualization -->
                            <div style="flex:1;background:rgba(0,0,0,0.4);border:1px solid rgba(255,215,0,0.2);border-radius:12px;position:relative;overflow:hidden;">
                                <div id="dna-strand" style="position:absolute;top:50%;left:20px;right:20px;height:20px;transform:translateY(-50%);background:linear-gradient(90deg,#0055ff,#9d00ff,#0055ff);border-radius:10px;"></div>
                                <div id="damage-markers" style="position:absolute;top:50%;left:20px;right:20px;transform:translateY(-50%);height:40px;"></div>
                            </div>
                            
                            <!-- Damage source controls -->
                            <div style="padding:12px;background:rgba(0,0,0,0.3);border-radius:10px;">
                                <div style="font-size:10px;color:#ff0033;margin-bottom:10px;">☢️ Apply Damage</div>
                                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
                                    <button class="damage-btn" data-source="uv" style="padding:8px;background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:6px;color:#ffd700;font-size:9px;cursor:pointer;">UV</button>
                                    <button class="damage-btn" data-source="radiation" style="padding:8px;background:rgba(255,0,51,0.1);border:1px solid rgba(255,0,51,0.3);border-radius:6px;color:#ff0033;font-size:9px;cursor:pointer;">Radiation</button>
                                    <button class="damage-btn" data-source="ros" style="padding:8px;background:rgba(255,107,107,0.1);border:1px solid rgba(255,107,107,0.3);border-radius:6px;color:#ff6b6b;font-size:9px;cursor:pointer;">ROS</button>
                                    <button class="damage-btn" data-source="chemo" style="padding:8px;background:rgba(157,0,255,0.1);border:1px solid rgba(157,0,255,0.3);border-radius:6px;color:#9d00ff;font-size:9px;cursor:pointer;">Chemo</button>
                                </div>
                            </div>
                        </div>
                        <div style="padding:15px;background:rgba(0,0,0,0.3);border-left:1px solid rgba(255,215,0,0.2);overflow-y:auto;">
                            <!-- Damage count -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ff6b6b;margin-bottom:8px;">💥 Current Damage</div>
                                <div id="damage-count" style="font-size:10px;"></div>
                            </div>
                            
                            <!-- Repair pathways -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#00ff88;margin-bottom:8px;">🔧 Repair Pathways</div>
                                <div style="font-size:10px;">
                                    ${Object.entries({ ber: 'BER', ner: 'NER', hr: 'HR', nhej: 'NHEJ' }).map(([k, v]) => `
                                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                                            <input type="checkbox" id="path-${k}" checked style="accent-color:#00ff88;">
                                            <label for="path-${k}">${v}</label>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <!-- Cell cycle -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#0055ff;margin-bottom:8px;">🔄 Cell Cycle</div>
                                <div id="cell-cycle" style="font-size:14px;color:#0055ff;">G1</div>
                                <div id="checkpoint-status" style="font-size:10px;color:rgba(255,255,255,0.5);">No checkpoint</div>
                            </div>
                            
                            <!-- Cell fate -->
                            <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;text-align:center;">
                                <div style="font-size:10px;color:rgba(255,255,255,0.5);">Cell Fate</div>
                                <div id="cell-fate" style="font-size:16px;color:#00ff88;">Viable</div>
                            </div>
                            
                            <div style="display:flex;gap:8px;margin-top:15px;">
                                <button id="dna-start" style="flex:1;padding:10px;background:rgba(0,255,136,0.2);border:1px solid #00ff88;border-radius:8px;color:#00ff88;cursor:pointer;font-size:11px;">▶ Run</button>
                                <button id="dna-reset" style="flex:1;padding:10px;background:rgba(255,0,51,0.1);border:1px solid rgba(255,0,51,0.3);border-radius:8px;color:#ff0033;cursor:pointer;font-size:11px;">↺ Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.bindDNAEvents();
        }

        bindDNAEvents() {
            const container = document.getElementById(this.containerId);
            
            container.querySelectorAll('.damage-btn').forEach(btn => {
                btn.addEventListener('click', () => this.applyDamage(btn.dataset.source));
            });
            
            container.querySelectorAll('[id^="path-"]').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const path = e.target.id.replace('path-', '');
                    const pathways = this.state.get('repairPathways');
                    pathways[path].active = e.target.checked;
                    this.state.set('repairPathways', pathways);
                });
            });
            
            container.querySelector('#dna-start').addEventListener('click', () => {
                if (this.isRunning) this.pause();
                else this.start();
            });
            container.querySelector('#dna-reset').addEventListener('click', () => this.reset());
        }

        applyDamage(source) {
            const damages = this.state.get('damages');
            const damageMap = {
                uv: ['dimer', 'dimer', 'ssb'],
                radiation: ['dsb', 'ssb', 'ssb', 'oxidative'],
                ros: ['oxidative', 'oxidative', 'ssb'],
                chemo: ['crosslink', 'dsb', 'ssb']
            };
            
            const types = damageMap[source] || ['ssb'];
            types.forEach(type => {
                damages.push({
                    position: Math.floor(Math.random() * this.state.get('genomeSize')),
                    type: type,
                    repaired: false,
                    createdAt: Date.now()
                });
            });
            
            this.state.set('damages', damages);
            this.updateDNAUI();
        }

        simulationStep(dt) {
            const damages = this.state.get('damages');
            const pathways = this.state.get('repairPathways');
            const cellCycle = this.state.get('cellCycle');
            let mutations = this.state.get('mutations');

            // Repair process
            damages.forEach(damage => {
                if (damage.repaired) return;
                
                const damageInfo = DNA_DAMAGE_TYPES[damage.type];
                const pathwayKey = damageInfo.repairPath.toLowerCase().split('/')[0];
                const pathway = pathways[pathwayKey] || pathways.ber;
                
                if (pathway.active) {
                    const repairProb = (dt / damageInfo.repairTime) * pathway.efficiency;
                    if (Math.random() < repairProb) {
                        damage.repaired = true;
                        // NHEJ is error-prone
                        if (pathwayKey === 'nhej' && Math.random() < 0.3) {
                            mutations++;
                        }
                    }
                }
            });

            // Remove old repaired damages
            const activeDamages = damages.filter(d => !d.repaired || Date.now() - d.createdAt < 5000);
            this.state.set('damages', activeDamages);

            // Cell cycle progression
            const unrepairedDSB = damages.filter(d => d.type === 'dsb' && !d.repaired).length;
            if (unrepairedDSB > 0) {
                cellCycle.checkpoint = true;
            } else {
                cellCycle.checkpoint = false;
                cellCycle.progress += dt * 5;
                if (cellCycle.progress > 100) {
                    cellCycle.progress = 0;
                    const phases = ['G1', 'S', 'G2', 'M'];
                    const idx = phases.indexOf(cellCycle.phase);
                    cellCycle.phase = phases[(idx + 1) % 4];
                }
            }

            // Genomic instability from accumulated damage
            const instability = mutations * 5 + unrepairedDSB * 10;
            this.state.set('genomicInstability', instability);

            // Cell fate
            let fate = 'viable';
            if (instability > 50) fate = 'senescent';
            if (instability > 80) fate = 'apoptotic';
            if (mutations > 10 && Math.random() < 0.1) fate = 'transformed';

            this.state.set('mutations', mutations);
            this.state.set('cellCycle', cellCycle);
            this.state.set('cellFate', fate);
        }

        updateDNAUI() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const damages = this.state.get('damages');
            const unrepaired = damages.filter(d => !d.repaired);
            
            // Damage count by type
            const counts = {};
            unrepaired.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1; });
            container.querySelector('#damage-count').innerHTML = Object.entries(counts).map(([t, c]) => 
                `<div>${DNA_DAMAGE_TYPES[t]?.name || t}: ${c}</div>`
            ).join('') || '<div style="color:rgba(255,255,255,0.4);">No damage</div>';

            // Damage markers on DNA strand
            const markers = container.querySelector('#damage-markers');
            markers.innerHTML = unrepaired.slice(0, 20).map(d => {
                const left = (d.position / this.state.get('genomeSize')) * 100;
                const color = d.type === 'dsb' ? '#ff0033' : d.type === 'dimer' ? '#ffd700' : '#ff6b6b';
                return `<div style="position:absolute;left:${left}%;top:50%;transform:translate(-50%,-50%);width:8px;height:8px;background:${color};border-radius:50%;"></div>`;
            }).join('');

            container.querySelector('#dna-mutations').textContent = `Mutations: ${this.state.get('mutations')}`;
            container.querySelector('#cell-cycle').textContent = this.state.get('cellCycle').phase;
            container.querySelector('#checkpoint-status').textContent = this.state.get('cellCycle').checkpoint ? '⚠️ Checkpoint Active' : 'No checkpoint';
            
            const fate = this.state.get('cellFate');
            const fateEl = container.querySelector('#cell-fate');
            fateEl.textContent = fate.charAt(0).toUpperCase() + fate.slice(1);
            fateEl.style.color = fate === 'viable' ? '#00ff88' : fate === 'senescent' ? '#ffd700' : fate === 'apoptotic' ? '#ff6b6b' : '#9d00ff';
        }

        updateVisualization() { this.updateDNAUI(); }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORTS
    // ═══════════════════════════════════════════════════════════════════════

    window.DrugDiscoveryPlatform = DrugDiscoveryPlatform;
    window.OrganoidChamber = OrganoidChamber;
    window.MicrofluidicPlatform = MicrofluidicPlatform;
    window.ClinicalDecisionSupport = ClinicalDecisionSupport;
    window.ImmuneResponseSimulator = ImmuneResponseSimulator;
    window.DNARepairSimulator = DNARepairSimulator;

    window.initDrugDiscovery = (id) => { const s = new DrugDiscoveryPlatform(id); s.init(); return s; };
    window.initOrganoidChamber = (id) => { const s = new OrganoidChamber(id); s.init(); return s; };
    window.initMicrofluidic = (id) => { const s = new MicrofluidicPlatform(id); s.init(); return s; };
    window.initClinicalDecision = (id) => { const s = new ClinicalDecisionSupport(id); s.init(); return s; };
    window.initImmuneResponse = (id) => { const s = new ImmuneResponseSimulator(id); s.init(); return s; };
    window.initDNARepair = (id) => { const s = new DNARepairSimulator(id); s.init(); return s; };

    console.log('[Modules 6-11] All modules loaded');
})();
