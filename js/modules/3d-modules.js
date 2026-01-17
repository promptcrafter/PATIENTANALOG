/**
 * PatientAnalog.com - Modules #12-14: 3D Module Replacements
 * Museum-Grade Scientific Simulations
 * 
 * - Module #12: Circulating Biomarker Liquid Biopsy Lab
 * - Module #13: Multi-Organ Microphysiological System Controller
 * - Module #14: Multi-Drug Pharmacodynamic Response Lab
 */

(function() {
    'use strict';

    const { MathUtils, StateManager, SimulationModule, PerformanceDetector, AudioFeedback } = window.MuseumGradeEngine;

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE #12: CIRCULATING BIOMARKER LIQUID BIOPSY LAB
    // ═══════════════════════════════════════════════════════════════════════

    const BIOMARKER_TYPES = {
        ctDNA: { name: 'ctDNA', size: '150-200bp', sensitivity: 0.85, specificity: 0.92 },
        ctc: { name: 'CTCs', size: '10-25μm', sensitivity: 0.65, specificity: 0.95 },
        exosomes: { name: 'Exosomes', size: '30-150nm', sensitivity: 0.75, specificity: 0.80 },
        proteins: { name: 'Protein Markers', size: 'N/A', sensitivity: 0.70, specificity: 0.85 }
    };

    const CANCER_PANELS = {
        lung: { genes: ['EGFR', 'ALK', 'KRAS', 'ROS1', 'BRAF'], prevalence: 0.15 },
        breast: { genes: ['BRCA1', 'BRCA2', 'HER2', 'PIK3CA', 'ESR1'], prevalence: 0.12 },
        colorectal: { genes: ['KRAS', 'NRAS', 'BRAF', 'MSI', 'PIK3CA'], prevalence: 0.10 },
        prostate: { genes: ['AR', 'BRCA2', 'ATM', 'PTEN', 'TP53'], prevalence: 0.11 }
    };

    class LiquidBiopsyLab extends SimulationModule {
        getInitialState() {
            return {
                // Sample
                sampleVolume: 10,           // mL blood
                sampleQuality: 100,
                processingTime: 0,
                
                // Patient/Tumor characteristics
                tumorBurden: 'moderate',    // low, moderate, high
                cancerType: 'lung',
                tumorFraction: 0.05,        // ctDNA fraction (0.1-30%)
                
                // Analysis settings
                selectedPanel: null,
                captureMethod: 'hybrid',     // hybrid, amplicon, wgs
                sequencingDepth: 1000,       // x coverage
                
                // Results
                ctdnaDetected: false,
                ctcCount: 0,
                mutationsFound: [],
                alleleFrequencies: {},
                
                // Quality metrics
                uniqueMolecules: 0,
                errorRate: 0.001,
                limitOfDetection: 0.1,       // % VAF
                
                // Clinical interpretation
                actionableMutations: [],
                resistanceMutations: [],
                mrdStatus: 'unknown',        // MRD: minimal residual disease
                
                // Costs
                testCost: 0,
                turnaroundTime: 0,
                
                phase: 'collection',
                score: 0
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            container.innerHTML = `
                <div class="liquid-biopsy" style="width:100%;height:100%;background:linear-gradient(135deg,#080510,#100818);border-radius:16px;overflow:hidden;font-family:'Orbitron',sans-serif;color:#e0f2fe;">
                    <div style="padding:12px 20px;background:linear-gradient(90deg,rgba(255,0,136,0.1),rgba(0,212,255,0.1));border-bottom:1px solid rgba(255,0,136,0.2);display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#ff0088;">🔬 Liquid Biopsy Lab</h3>
                            <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.6);">Circulating Biomarker Analysis</p>
                        </div>
                        <span id="lb-phase" style="padding:4px 12px;background:rgba(0,212,255,0.2);border:1px solid #0055ff;border-radius:12px;font-size:10px;">Collection</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 300px;height:calc(100% - 50px);">
                        <div style="padding:15px;display:flex;flex-direction:column;gap:10px;">
                            <!-- Blood sample visualization -->
                            <div style="flex:1;background:rgba(0,0,0,0.4);border:1px solid rgba(255,0,136,0.2);border-radius:12px;position:relative;overflow:hidden;">
                                <div id="blood-viz" style="position:absolute;inset:20px;background:radial-gradient(ellipse at center,rgba(139,0,0,0.6),rgba(80,0,0,0.4));border-radius:50%;display:flex;align-items:center;justify-content:center;">
                                    <div style="text-align:center;">
                                        <div style="font-size:40px;">🩸</div>
                                        <div id="sample-status" style="font-size:12px;margin-top:10px;">Ready for collection</div>
                                    </div>
                                </div>
                                <!-- Floating CTCs -->
                                <div id="ctc-particles" style="position:absolute;inset:0;pointer-events:none;"></div>
                            </div>
                            
                            <!-- Workflow controls -->
                            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
                                <button class="workflow-btn" data-step="collect" style="padding:10px;background:rgba(255,0,136,0.2);border:1px solid #ff0088;border-radius:8px;color:#ff0088;cursor:pointer;font-size:10px;">1. Collect</button>
                                <button class="workflow-btn" data-step="process" style="padding:10px;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.3);border-radius:8px;color:#0055ff;cursor:pointer;font-size:10px;">2. Process</button>
                                <button class="workflow-btn" data-step="sequence" style="padding:10px;background:rgba(157,0,255,0.1);border:1px solid rgba(157,0,255,0.3);border-radius:8px;color:#9d00ff;cursor:pointer;font-size:10px;">3. Sequence</button>
                                <button class="workflow-btn" data-step="analyze" style="padding:10px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);border-radius:8px;color:#00ff88;cursor:pointer;font-size:10px;">4. Analyze</button>
                            </div>
                        </div>
                        <div style="padding:15px;background:rgba(0,0,0,0.3);border-left:1px solid rgba(255,0,136,0.2);overflow-y:auto;">
                            <!-- Sample settings -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ff0088;margin-bottom:8px;">🧪 Sample Settings</div>
                                <div style="margin-bottom:8px;">
                                    <div style="font-size:10px;margin-bottom:3px;">Cancer Type</div>
                                    <select id="cancer-type" style="width:100%;padding:8px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,0,136,0.3);border-radius:6px;color:#fff;font-size:10px;">
                                        ${Object.keys(CANCER_PANELS).map(c => `<option value="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
                                    </select>
                                </div>
                                <div style="margin-bottom:8px;">
                                    <div style="font-size:10px;margin-bottom:3px;">Tumor Burden</div>
                                    <select id="tumor-burden" style="width:100%;padding:8px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,0,136,0.3);border-radius:6px;color:#fff;font-size:10px;">
                                        <option value="low">Low (Stage I-II)</option>
                                        <option value="moderate" selected>Moderate (Stage III)</option>
                                        <option value="high">High (Stage IV)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Analysis panel -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#0055ff;margin-bottom:8px;">🧬 Analysis Panel</div>
                                <select id="analysis-panel" style="width:100%;padding:8px;background:rgba(0,0,0,0.5);border:1px solid rgba(0,212,255,0.3);border-radius:6px;color:#fff;font-size:10px;">
                                    <option value="targeted">Targeted Panel (50 genes) - $1,500</option>
                                    <option value="comprehensive">Comprehensive (500 genes) - $3,500</option>
                                    <option value="wgs">Whole Genome - $5,000</option>
                                </select>
                            </div>
                            
                            <!-- Results -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#00ff88;margin-bottom:8px;">📊 Results</div>
                                <div id="results-panel" style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;font-size:10px;">
                                    <div style="color:rgba(255,255,255,0.5);">Run analysis to see results</div>
                                </div>
                            </div>
                            
                            <!-- Quality metrics -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ffd700;margin-bottom:8px;">📈 Quality Metrics</div>
                                <div style="font-size:10px;">
                                    <div>ctDNA Fraction: <span id="ctdna-frac">-</span></div>
                                    <div>Unique Molecules: <span id="unique-mol">-</span></div>
                                    <div>LOD: <span id="lod">-</span></div>
                                    <div>CTC Count: <span id="ctc-count">-</span></div>
                                </div>
                            </div>
                            
                            <!-- Clinical interpretation -->
                            <div id="clinical-interp" style="padding:10px;background:rgba(0,255,136,0.1);border-radius:8px;font-size:10px;display:none;">
                                <div style="color:#00ff88;margin-bottom:5px;">🎯 Actionable Findings</div>
                                <div id="actionable-list"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.bindLBEvents();
        }

        bindLBEvents() {
            const container = document.getElementById(this.containerId);
            
            container.querySelectorAll('.workflow-btn').forEach(btn => {
                btn.addEventListener('click', () => this.runWorkflowStep(btn.dataset.step));
            });
            
            container.querySelector('#cancer-type').addEventListener('change', (e) => {
                this.state.set('cancerType', e.target.value);
            });
            
            container.querySelector('#tumor-burden').addEventListener('change', (e) => {
                this.state.set('tumorBurden', e.target.value);
                const fractions = { low: 0.01, moderate: 0.05, high: 0.15 };
                this.state.set('tumorFraction', fractions[e.target.value]);
            });
        }

        runWorkflowStep(step) {
            const container = document.getElementById(this.containerId);
            
            switch(step) {
                case 'collect':
                    this.state.set('phase', 'collection');
                    this.state.set('sampleQuality', 100 - MathUtils.gaussianRandom(0, 5));
                    container.querySelector('#sample-status').textContent = 'Sample collected: 10mL';
                    container.querySelector('#lb-phase').textContent = 'Collection ✓';
                    AudioFeedback.playStateChange('tick');
                    break;
                    
                case 'process':
                    this.state.set('phase', 'processing');
                    // Simulate CTC capture
                    const burden = this.state.get('tumorBurden');
                    const ctcBase = { low: 2, moderate: 10, high: 50 }[burden];
                    const ctcCount = Math.round(ctcBase + MathUtils.gaussianRandom(0, ctcBase * 0.3));
                    this.state.set('ctcCount', Math.max(0, ctcCount));
                    container.querySelector('#sample-status').textContent = 'Processing complete';
                    container.querySelector('#lb-phase').textContent = 'Processing ✓';
                    this.updateCTCParticles();
                    break;
                    
                case 'sequence':
                    this.state.set('phase', 'sequencing');
                    // Calculate unique molecules based on ctDNA fraction
                    const fraction = this.state.get('tumorFraction');
                    const molecules = Math.round(10000 * fraction * (0.8 + Math.random() * 0.4));
                    this.state.set('uniqueMolecules', molecules);
                    this.state.set('limitOfDetection', 0.5 / Math.sqrt(molecules / 100));
                    container.querySelector('#sample-status').textContent = 'Sequencing...';
                    container.querySelector('#lb-phase').textContent = 'Sequencing ✓';
                    break;
                    
                case 'analyze':
                    this.state.set('phase', 'analysis');
                    this.performAnalysis();
                    container.querySelector('#lb-phase').textContent = 'Complete';
                    break;
            }
            
            this.updateLBUI();
        }

        performAnalysis() {
            const cancerType = this.state.get('cancerType');
            const panel = CANCER_PANELS[cancerType];
            const fraction = this.state.get('tumorFraction');
            const lod = this.state.get('limitOfDetection');
            
            // Simulate mutation detection
            const mutations = [];
            const actionable = [];
            const frequencies = {};
            
            panel.genes.forEach(gene => {
                // Probability of finding mutation based on tumor fraction vs LOD
                const detectable = fraction > lod;
                const mutationPresent = Math.random() < 0.3; // 30% chance per gene
                
                if (detectable && mutationPresent) {
                    const vaf = fraction * (0.3 + Math.random() * 0.7);
                    mutations.push(gene);
                    frequencies[gene] = (vaf * 100).toFixed(1);
                    
                    // Determine actionability
                    if (['EGFR', 'ALK', 'BRAF', 'HER2', 'BRCA1', 'BRCA2'].includes(gene)) {
                        actionable.push({ gene, therapy: this.getTherapyRecommendation(gene) });
                    }
                }
            });
            
            this.state.set('mutationsFound', mutations);
            this.state.set('alleleFrequencies', frequencies);
            this.state.set('actionableMutations', actionable);
            this.state.set('ctdnaDetected', mutations.length > 0);
            
            // MRD status
            if (fraction < 0.01 && mutations.length === 0) {
                this.state.set('mrdStatus', 'negative');
            } else if (mutations.length > 0) {
                this.state.set('mrdStatus', 'positive');
            }
        }

        getTherapyRecommendation(gene) {
            const therapies = {
                'EGFR': 'Osimertinib',
                'ALK': 'Alectinib',
                'BRAF': 'Dabrafenib/Trametinib',
                'HER2': 'Trastuzumab',
                'BRCA1': 'PARP inhibitor',
                'BRCA2': 'PARP inhibitor'
            };
            return therapies[gene] || 'Clinical trial';
        }

        updateCTCParticles() {
            const container = document.getElementById('ctc-particles');
            if (!container) return;
            
            const ctcCount = Math.min(20, this.state.get('ctcCount'));
            container.innerHTML = '';
            
            for (let i = 0; i < ctcCount; i++) {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: #ff0088;
                    border-radius: 50%;
                    left: ${20 + Math.random() * 60}%;
                    top: ${20 + Math.random() * 60}%;
                    box-shadow: 0 0 10px #ff0088;
                    animation: float 3s ease-in-out infinite;
                    animation-delay: ${Math.random() * 2}s;
                `;
                container.appendChild(particle);
            }
        }

        updateLBUI() {
            const container = document.getElementById(this.containerId);
            if (!container) return;
            
            const state = this.state.get();
            
            container.querySelector('#ctdna-frac').textContent = (state.tumorFraction * 100).toFixed(1) + '%';
            container.querySelector('#unique-mol').textContent = state.uniqueMolecules.toLocaleString();
            container.querySelector('#lod').textContent = state.limitOfDetection.toFixed(2) + '% VAF';
            container.querySelector('#ctc-count').textContent = state.ctcCount + ' cells/mL';
            
            if (state.phase === 'analysis') {
                const resultsPanel = container.querySelector('#results-panel');
                if (state.mutationsFound.length > 0) {
                    resultsPanel.innerHTML = `
                        <div style="color:#00ff88;margin-bottom:5px;">✓ ctDNA Detected</div>
                        <div style="margin-bottom:5px;">Mutations found:</div>
                        ${state.mutationsFound.map(m => `
                            <div style="padding:4px;background:rgba(255,0,136,0.2);margin-bottom:2px;border-radius:3px;">
                                ${m}: ${state.alleleFrequencies[m]}% VAF
                            </div>
                        `).join('')}
                    `;
                } else {
                    resultsPanel.innerHTML = `<div style="color:#ffd700;">No mutations detected above LOD</div>`;
                }
                
                if (state.actionableMutations.length > 0) {
                    const interpPanel = container.querySelector('#clinical-interp');
                    interpPanel.style.display = 'block';
                    container.querySelector('#actionable-list').innerHTML = state.actionableMutations.map(a => `
                        <div style="padding:4px;background:rgba(0,255,136,0.2);margin-bottom:2px;border-radius:3px;">
                            ${a.gene} → ${a.therapy}
                        </div>
                    `).join('');
                }
            }
        }

        updateVisualization() { this.updateLBUI(); }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE #13: MULTI-ORGAN MICROPHYSIOLOGICAL SYSTEM (MPS) CONTROLLER
    // ═══════════════════════════════════════════════════════════════════════

    const ORGAN_MODELS = {
        liver: { 
            name: 'Liver', 
            icon: '🫀', 
            function: 'metabolism',
            cypActivity: 1.0,
            albuminProduction: 100,
            viability: 100
        },
        heart: { 
            name: 'Heart', 
            icon: '❤️', 
            function: 'contractility',
            beatRate: 60,
            contractility: 100,
            viability: 100
        },
        kidney: { 
            name: 'Kidney', 
            icon: '🫘', 
            function: 'filtration',
            gfr: 100,
            reabsorption: 95,
            viability: 100
        },
        lung: { 
            name: 'Lung', 
            icon: '🫁', 
            function: 'barrier',
            teer: 500,
            permeability: 1,
            viability: 100
        },
        gut: { 
            name: 'Gut', 
            icon: '🔴', 
            function: 'absorption',
            permeability: 10,
            efflux: 1,
            viability: 100
        },
        brain: { 
            name: 'Brain (BBB)', 
            icon: '🧠', 
            function: 'barrier',
            teer: 1500,
            permeability: 0.1,
            viability: 100
        }
    };

    class MultiOrganMPS extends SimulationModule {
        getInitialState() {
            return {
                // Active organs
                activeOrgans: ['liver', 'heart', 'kidney'],
                
                // Per-organ states
                organStates: JSON.parse(JSON.stringify(ORGAN_MODELS)),
                
                // Flow settings
                flowRate: 10,              // μL/min
                mediaVolume: 500,          // μL
                recirculation: true,
                
                // Drug in system
                drugAdded: false,
                drugName: 'Test Compound',
                drugConcentration: 0,       // μM in media
                
                // Per-organ drug concentrations
                organConcentrations: {},
                
                // Metabolites
                metabolites: [],
                metaboliteConcentrations: {},
                
                // System time
                systemTime: 0,              // hours
                
                // Toxicity alerts
                toxicityAlerts: [],
                
                // PK predictions
                pkPredictions: {
                    cmax: 0,
                    auc: 0,
                    halfLife: 0,
                    clearance: 0
                },
                
                phase: 'setup'
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            container.innerHTML = `
                <div class="mps-controller" style="width:100%;height:100%;background:linear-gradient(135deg,#050a10,#0a1520);border-radius:16px;overflow:hidden;font-family:'Orbitron',sans-serif;color:#e0f2fe;">
                    <div style="padding:12px 20px;background:linear-gradient(90deg,rgba(0,212,255,0.1),rgba(157,0,255,0.1));border-bottom:1px solid rgba(0,212,255,0.2);display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#0055ff;">🔬 Multi-Organ MPS Controller</h3>
                            <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.6);">Body-on-a-Chip PKPD Modeling</p>
                        </div>
                        <span id="mps-time" style="font-size:12px;color:#ffd700;">0h</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 280px;height:calc(100% - 50px);">
                        <div style="padding:15px;display:flex;flex-direction:column;gap:10px;">
                            <!-- Organ chip network visualization -->
                            <div style="flex:1;background:rgba(0,0,0,0.4);border:1px solid rgba(0,212,255,0.2);border-radius:12px;position:relative;">
                                <svg id="mps-network" viewBox="0 0 400 250" style="width:100%;height:100%;">
                                    <!-- Central reservoir -->
                                    <rect x="170" y="100" width="60" height="50" rx="5" fill="rgba(0,212,255,0.3)" stroke="#0055ff" stroke-width="2"/>
                                    <text x="200" y="130" text-anchor="middle" fill="#0055ff" font-size="10">Media</text>
                                    
                                    <!-- Organ chips -->
                                    ${Object.entries(ORGAN_MODELS).map(([id, organ], i) => {
                                        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                                        const x = 200 + Math.cos(angle) * 100;
                                        const y = 125 + Math.sin(angle) * 80;
                                        return `
                                            <g class="organ-chip" data-organ="${id}">
                                                <circle cx="${x}" cy="${y}" r="25" fill="rgba(157,0,255,0.2)" stroke="#9d00ff" stroke-width="2"/>
                                                <text x="${x}" y="${y-5}" text-anchor="middle" font-size="16">${organ.icon}</text>
                                                <text x="${x}" y="${y+12}" text-anchor="middle" fill="#fff" font-size="8">${organ.name}</text>
                                                <!-- Connection line -->
                                                <line x1="${x + (200-x)*0.4}" y1="${y + (125-y)*0.4}" x2="${x + (200-x)*0.8}" y2="${y + (125-y)*0.8}" stroke="#0055ff" stroke-width="1" stroke-dasharray="3,3"/>
                                            </g>
                                        `;
                                    }).join('')}
                                    
                                    <!-- Flow indicator -->
                                    <circle id="flow-particle" cx="200" cy="125" r="4" fill="#ffd700">
                                        <animate attributeName="cx" values="200;300;200;100;200" dur="4s" repeatCount="indefinite"/>
                                        <animate attributeName="cy" values="125;45;125;205;125" dur="4s" repeatCount="indefinite"/>
                                    </circle>
                                </svg>
                            </div>
                            
                            <!-- Controls -->
                            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
                                <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">
                                    <div style="font-size:10px;color:#0055ff;margin-bottom:5px;">Flow Rate (μL/min)</div>
                                    <input type="range" id="mps-flow" min="1" max="50" value="10" style="width:100%;accent-color:#0055ff;">
                                    <span id="mps-flow-val" style="font-size:11px;">10</span>
                                </div>
                                <button id="add-drug-btn" style="padding:10px;background:rgba(255,215,0,0.2);border:1px solid #ffd700;border-radius:8px;color:#ffd700;cursor:pointer;font-size:10px;">💊 Add Drug (10μM)</button>
                                <button id="mps-run-btn" style="padding:10px;background:rgba(0,255,136,0.2);border:1px solid #00ff88;border-radius:8px;color:#00ff88;cursor:pointer;font-size:10px;">▶ Run System</button>
                            </div>
                        </div>
                        <div style="padding:15px;background:rgba(0,0,0,0.3);border-left:1px solid rgba(0,212,255,0.2);overflow-y:auto;">
                            <!-- Organ status panels -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#9d00ff;margin-bottom:8px;">🔬 Organ Status</div>
                                <div id="organ-status-panels" style="display:grid;gap:6px;">
                                    ${['liver','heart','kidney'].map(id => `
                                        <div class="organ-panel" data-organ="${id}" style="padding:8px;background:rgba(157,0,255,0.1);border-radius:6px;font-size:10px;">
                                            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                                                <span>${ORGAN_MODELS[id].icon} ${ORGAN_MODELS[id].name}</span>
                                                <span class="organ-viability" style="color:#00ff88;">100%</span>
                                            </div>
                                            <div style="display:flex;gap:4px;">
                                                <div style="flex:1;height:4px;background:rgba(0,0,0,0.3);border-radius:2px;">
                                                    <div class="viability-bar" style="height:100%;width:100%;background:#00ff88;border-radius:2px;"></div>
                                                </div>
                                            </div>
                                            <div class="organ-conc" style="margin-top:4px;color:#ffd700;">Drug: 0 μM</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <!-- Drug concentration chart -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ffd700;margin-bottom:8px;">📈 Media Concentration</div>
                                <canvas id="mps-conc-chart" width="250" height="80" style="width:100%;background:rgba(0,0,0,0.3);border-radius:6px;"></canvas>
                            </div>
                            
                            <!-- PK predictions -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#00ff88;margin-bottom:8px;">📊 Predicted In Vivo PK</div>
                                <div style="font-size:10px;padding:8px;background:rgba(0,255,136,0.1);border-radius:6px;">
                                    <div>Cmax: <span id="pk-cmax">-</span></div>
                                    <div>AUC: <span id="pk-auc">-</span></div>
                                    <div>t½: <span id="pk-half">-</span></div>
                                    <div>CL: <span id="pk-cl">-</span></div>
                                </div>
                            </div>
                            
                            <!-- Toxicity alerts -->
                            <div id="tox-alerts" style="display:none;">
                                <div style="font-size:11px;color:#ff0033;margin-bottom:8px;">⚠️ Toxicity Alerts</div>
                                <div id="tox-list" style="font-size:10px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.bindMPSEvents();
            this.initMPSChart();
        }

        bindMPSEvents() {
            const container = document.getElementById(this.containerId);
            
            container.querySelector('#mps-flow').addEventListener('input', (e) => {
                this.state.set('flowRate', parseInt(e.target.value));
                container.querySelector('#mps-flow-val').textContent = e.target.value;
            });
            
            container.querySelector('#add-drug-btn').addEventListener('click', () => {
                this.state.set('drugAdded', true);
                this.state.set('drugConcentration', 10);
                AudioFeedback.playStateChange('success');
            });
            
            container.querySelector('#mps-run-btn').addEventListener('click', () => {
                if (this.isRunning) { this.pause(); container.querySelector('#mps-run-btn').textContent = '▶ Resume'; }
                else { this.start(); container.querySelector('#mps-run-btn').textContent = '⏸ Pause'; }
            });
        }

        initMPSChart() {
            this.concHistory = [];
            const canvas = document.getElementById('mps-conc-chart');
            if (canvas) this.mpsChartCtx = canvas.getContext('2d');
        }

        simulationStep(dt) {
            if (!this.state.get('drugAdded')) return;
            
            const time = this.state.get('systemTime') + dt * 0.5; // 1 sec = 0.5 hours
            this.state.set('systemTime', time);
            
            let conc = this.state.get('drugConcentration');
            const organStates = this.state.get('organStates');
            const organConcs = this.state.get('organConcentrations');
            const flowRate = this.state.get('flowRate');
            
            // Liver metabolism
            const liverCL = organStates.liver.cypActivity * 0.1 * (flowRate / 10);
            conc *= Math.exp(-liverCL * dt * 0.5);
            
            // Distribute to organs based on flow
            ['liver', 'heart', 'kidney'].forEach(organ => {
                const uptake = conc * 0.1 * (flowRate / 10);
                organConcs[organ] = (organConcs[organ] || 0) * 0.95 + uptake;
                
                // Toxicity check
                if (organConcs[organ] > 5) {
                    organStates[organ].viability = Math.max(0, organStates[organ].viability - dt * 2);
                }
            });
            
            this.state.set('drugConcentration', conc);
            this.state.set('organConcentrations', organConcs);
            this.state.set('organStates', organStates);
            
            // History
            this.concHistory.push({ time, conc });
            if (this.concHistory.length > 100) this.concHistory.shift();
            
            // Calculate PK
            if (this.concHistory.length > 10) {
                const cmax = Math.max(...this.concHistory.map(h => h.conc));
                const auc = this.concHistory.reduce((s, h, i, arr) => {
                    if (i === 0) return 0;
                    return s + (arr[i-1].conc + h.conc) / 2 * (h.time - arr[i-1].time);
                }, 0);
                const halfLife = 0.693 / liverCL;
                
                this.state.set('pkPredictions', { cmax, auc, halfLife, clearance: liverCL * 60 });
            }
        }

        updateVisualization() {
            const container = document.getElementById(this.containerId);
            if (!container) return;
            
            const state = this.state.get();
            
            container.querySelector('#mps-time').textContent = state.systemTime.toFixed(1) + 'h';
            
            // Update organ panels
            ['liver', 'heart', 'kidney'].forEach(organ => {
                const panel = container.querySelector(`.organ-panel[data-organ="${organ}"]`);
                if (panel) {
                    const viability = state.organStates[organ].viability;
                    panel.querySelector('.organ-viability').textContent = Math.round(viability) + '%';
                    panel.querySelector('.viability-bar').style.width = viability + '%';
                    panel.querySelector('.viability-bar').style.background = viability > 70 ? '#00ff88' : viability > 40 ? '#ffd700' : '#ff0033';
                    panel.querySelector('.organ-conc').textContent = `Drug: ${(state.organConcentrations[organ] || 0).toFixed(2)} μM`;
                }
            });
            
            // PK predictions
            const pk = state.pkPredictions;
            container.querySelector('#pk-cmax').textContent = pk.cmax.toFixed(2) + ' μM';
            container.querySelector('#pk-auc').textContent = pk.auc.toFixed(1) + ' μM·h';
            container.querySelector('#pk-half').textContent = pk.halfLife.toFixed(1) + ' h';
            container.querySelector('#pk-cl').textContent = pk.clearance.toFixed(1) + ' mL/h';
            
            // Draw chart
            this.drawMPSChart();
        }

        drawMPSChart() {
            if (!this.mpsChartCtx || this.concHistory.length < 2) return;
            const ctx = this.mpsChartCtx;
            const { width, height } = ctx.canvas;
            
            ctx.fillStyle = 'rgba(0,10,20,0.95)';
            ctx.fillRect(0, 0, width, height);
            
            const maxConc = Math.max(10, ...this.concHistory.map(h => h.conc));
            
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            this.concHistory.forEach((h, i) => {
                const x = (i / (this.concHistory.length - 1)) * width;
                const y = height - (h.conc / maxConc) * height * 0.9;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE #14: MULTI-DRUG PHARMACODYNAMIC RESPONSE LAB
    // ═══════════════════════════════════════════════════════════════════════

    const PD_DRUGS = {
        drugA: { name: 'Drug A', ec50: 1, emax: 80, mechanism: 'Pathway 1', color: '#0055ff' },
        drugB: { name: 'Drug B', ec50: 2, emax: 70, mechanism: 'Pathway 2', color: '#ff0088' },
        drugC: { name: 'Drug C', ec50: 0.5, emax: 90, mechanism: 'Pathway 1', color: '#00ff88' }
    };

    class DrugResponseLab extends SimulationModule {
        getInitialState() {
            return {
                // Drug concentrations
                concentrations: { drugA: 0, drugB: 0, drugC: 0 },
                
                // Individual effects
                effects: { drugA: 0, drugB: 0, drugC: 0 },
                
                // Combined effect
                combinedEffect: 0,
                
                // Interaction type
                interactionType: 'additive',  // additive, synergistic, antagonistic
                
                // Dose-response data
                doseResponseData: [],
                
                // Isobologram data
                isobologramPoints: [],
                
                // Therapeutic index
                efficacy: 0,
                toxicity: 0,
                therapeuticIndex: 0,
                
                phase: 'setup'
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            container.innerHTML = `
                <div class="drug-response" style="width:100%;height:100%;background:linear-gradient(135deg,#080510,#101018);border-radius:16px;overflow:hidden;font-family:'Orbitron',sans-serif;color:#e0f2fe;">
                    <div style="padding:12px 20px;background:linear-gradient(90deg,rgba(0,212,255,0.1),rgba(255,0,136,0.1));border-bottom:1px solid rgba(0,212,255,0.2);display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#0055ff;">💊 Drug Response Lab</h3>
                            <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,0.6);">Multi-Drug Pharmacodynamics & Combinations</p>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 280px;height:calc(100% - 50px);">
                        <div style="padding:15px;display:flex;flex-direction:column;gap:10px;">
                            <!-- Dose-response curves -->
                            <div style="flex:1;background:rgba(0,0,0,0.4);border:1px solid rgba(0,212,255,0.2);border-radius:12px;">
                                <canvas id="dr-chart" style="width:100%;height:100%;"></canvas>
                            </div>
                            
                            <!-- Drug concentration sliders -->
                            <div style="padding:12px;background:rgba(0,0,0,0.3);border-radius:10px;">
                                <div style="font-size:10px;color:#ffd700;margin-bottom:10px;">💉 Drug Concentrations (μM)</div>
                                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;">
                                    ${Object.entries(PD_DRUGS).map(([id, drug]) => `
                                        <div>
                                            <div style="font-size:9px;color:${drug.color};margin-bottom:3px;">${drug.name}</div>
                                            <input type="range" class="drug-conc" data-drug="${id}" min="0" max="10" step="0.1" value="0" style="width:100%;accent-color:${drug.color};">
                                            <div class="conc-val" data-drug="${id}" style="font-size:10px;text-align:center;">0</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        <div style="padding:15px;background:rgba(0,0,0,0.3);border-left:1px solid rgba(0,212,255,0.2);overflow-y:auto;">
                            <!-- Individual effects -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#0055ff;margin-bottom:8px;">📊 Individual Effects</div>
                                ${Object.entries(PD_DRUGS).map(([id, drug]) => `
                                    <div style="margin-bottom:6px;">
                                        <div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:2px;">
                                            <span style="color:${drug.color};">${drug.name}</span>
                                            <span class="effect-val" data-drug="${id}">0%</span>
                                        </div>
                                        <div style="height:6px;background:rgba(0,0,0,0.3);border-radius:3px;">
                                            <div class="effect-bar" data-drug="${id}" style="height:100%;width:0%;background:${drug.color};border-radius:3px;"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <!-- Combined effect -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#00ff88;margin-bottom:8px;">🔗 Combined Effect</div>
                                <div style="text-align:center;">
                                    <div id="combined-effect" style="font-size:32px;color:#00ff88;">0%</div>
                                    <div id="interaction-type" style="font-size:10px;color:rgba(255,255,255,0.6);">Additive</div>
                                </div>
                            </div>
                            
                            <!-- Therapeutic index -->
                            <div style="margin-bottom:15px;">
                                <div style="font-size:11px;color:#ffd700;margin-bottom:8px;">⚖️ Therapeutic Index</div>
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:center;">
                                    <div style="padding:8px;background:rgba(0,255,136,0.1);border-radius:6px;">
                                        <div style="font-size:9px;color:rgba(255,255,255,0.6);">Efficacy</div>
                                        <div id="ti-efficacy" style="font-size:16px;color:#00ff88;">0%</div>
                                    </div>
                                    <div style="padding:8px;background:rgba(255,0,51,0.1);border-radius:6px;">
                                        <div style="font-size:9px;color:rgba(255,255,255,0.6);">Toxicity</div>
                                        <div id="ti-toxicity" style="font-size:16px;color:#ff0033;">0%</div>
                                    </div>
                                </div>
                                <div style="text-align:center;margin-top:8px;">
                                    <span style="font-size:10px;">TI = </span>
                                    <span id="ti-value" style="font-size:14px;color:#ffd700;">-</span>
                                </div>
                            </div>
                            
                            <!-- Analysis button -->
                            <button id="analyze-combo-btn" style="width:100%;padding:12px;background:rgba(157,0,255,0.2);border:1px solid #9d00ff;border-radius:8px;color:#9d00ff;cursor:pointer;font-size:11px;">🔬 Analyze Combination</button>
                        </div>
                    </div>
                </div>
            `;
            this.bindDREvents();
            this.initDRChart();
        }

        bindDREvents() {
            const container = document.getElementById(this.containerId);
            
            container.querySelectorAll('.drug-conc').forEach(slider => {
                slider.addEventListener('input', (e) => {
                    const drug = e.target.dataset.drug;
                    const value = parseFloat(e.target.value);
                    const concs = this.state.get('concentrations');
                    concs[drug] = value;
                    this.state.set('concentrations', concs);
                    container.querySelector(`.conc-val[data-drug="${drug}"]`).textContent = value.toFixed(1);
                    this.calculateEffects();
                });
            });
            
            container.querySelector('#analyze-combo-btn').addEventListener('click', () => {
                this.analyzeInteraction();
            });
        }

        initDRChart() {
            const canvas = document.getElementById('dr-chart');
            if (canvas) {
                const rect = canvas.parentElement.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                this.drChartCtx = canvas.getContext('2d');
            }
            this.drawDRCurves();
        }

        calculateEffects() {
            const concs = this.state.get('concentrations');
            const effects = {};
            
            Object.entries(PD_DRUGS).forEach(([id, drug]) => {
                // Hill equation
                const c = concs[id];
                const effect = (drug.emax * c) / (drug.ec50 + c);
                effects[id] = effect;
            });
            
            this.state.set('effects', effects);
            
            // Combined effect (Bliss independence for different pathways, Loewe for same)
            const effectValues = Object.values(effects);
            let combined = effectValues.reduce((a, b) => a + b - (a * b / 100), 0);
            combined = Math.min(100, combined);
            
            this.state.set('combinedEffect', combined);
            
            // Efficacy vs toxicity
            const efficacy = combined;
            const toxicity = combined * 0.3 + Math.pow(combined / 100, 2) * 30;
            const ti = toxicity > 0 ? efficacy / toxicity : 0;
            
            this.state.set('efficacy', efficacy);
            this.state.set('toxicity', toxicity);
            this.state.set('therapeuticIndex', ti);
            
            this.updateDRUI();
            this.drawDRCurves();
        }

        analyzeInteraction() {
            const concs = this.state.get('concentrations');
            const effects = this.state.get('effects');
            
            // Calculate expected additive effect
            const effectValues = Object.values(effects).filter(e => e > 0);
            if (effectValues.length < 2) {
                this.state.set('interactionType', 'single drug');
                return;
            }
            
            const maxSingle = Math.max(...effectValues);
            const combined = this.state.get('combinedEffect');
            
            // Determine interaction type
            const additiveExpected = effectValues.reduce((a, b) => a + b, 0) * 0.8;
            
            if (combined > additiveExpected * 1.2) {
                this.state.set('interactionType', 'SYNERGISTIC');
            } else if (combined < additiveExpected * 0.8) {
                this.state.set('interactionType', 'ANTAGONISTIC');
            } else {
                this.state.set('interactionType', 'Additive');
            }
            
            this.updateDRUI();
            AudioFeedback.playStateChange('success');
        }

        drawDRCurves() {
            if (!this.drChartCtx) return;
            const ctx = this.drChartCtx;
            const { width, height } = ctx.canvas;
            const pad = { top: 20, right: 20, bottom: 30, left: 50 };
            
            ctx.fillStyle = 'rgba(8,5,16,0.95)';
            ctx.fillRect(0, 0, width, height);
            
            const chartW = width - pad.left - pad.right;
            const chartH = height - pad.top - pad.bottom;
            
            // Draw grid
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = pad.top + (chartH * i / 4);
                ctx.beginPath();
                ctx.moveTo(pad.left, y);
                ctx.lineTo(width - pad.right, y);
                ctx.stroke();
            }
            
            // Draw dose-response curves for each drug
            Object.entries(PD_DRUGS).forEach(([id, drug]) => {
                ctx.strokeStyle = drug.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                
                for (let c = 0; c <= 10; c += 0.1) {
                    const effect = (drug.emax * c) / (drug.ec50 + c);
                    const x = pad.left + (c / 10) * chartW;
                    const y = pad.top + chartH * (1 - effect / 100);
                    
                    c === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
            });
            
            // Mark current concentrations
            const concs = this.state.get('concentrations');
            const effects = this.state.get('effects');
            
            Object.entries(PD_DRUGS).forEach(([id, drug]) => {
                const c = concs[id];
                const e = effects[id] || 0;
                const x = pad.left + (c / 10) * chartW;
                const y = pad.top + chartH * (1 - e / 100);
                
                ctx.fillStyle = drug.color;
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Axes labels
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Concentration (μM)', width / 2, height - 5);
            
            ctx.save();
            ctx.translate(12, height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('Effect (%)', 0, 0);
            ctx.restore();
        }

        updateDRUI() {
            const container = document.getElementById(this.containerId);
            if (!container) return;
            
            const effects = this.state.get('effects');
            
            Object.entries(PD_DRUGS).forEach(([id, drug]) => {
                const effect = effects[id] || 0;
                container.querySelector(`.effect-val[data-drug="${id}"]`).textContent = Math.round(effect) + '%';
                container.querySelector(`.effect-bar[data-drug="${id}"]`).style.width = effect + '%';
            });
            
            container.querySelector('#combined-effect').textContent = Math.round(this.state.get('combinedEffect')) + '%';
            
            const interactionType = this.state.get('interactionType');
            const interactionEl = container.querySelector('#interaction-type');
            interactionEl.textContent = interactionType;
            interactionEl.style.color = interactionType === 'SYNERGISTIC' ? '#00ff88' : 
                                        interactionType === 'ANTAGONISTIC' ? '#ff0033' : 'rgba(255,255,255,0.6)';
            
            container.querySelector('#ti-efficacy').textContent = Math.round(this.state.get('efficacy')) + '%';
            container.querySelector('#ti-toxicity').textContent = Math.round(this.state.get('toxicity')) + '%';
            container.querySelector('#ti-value').textContent = this.state.get('therapeuticIndex').toFixed(2);
        }

        updateVisualization() { this.updateDRUI(); this.drawDRCurves(); }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORTS
    // ═══════════════════════════════════════════════════════════════════════

    window.LiquidBiopsyLab = LiquidBiopsyLab;
    window.MultiOrganMPS = MultiOrganMPS;
    window.DrugResponseLab = DrugResponseLab;

    window.initLiquidBiopsy = (id) => { const s = new LiquidBiopsyLab(id); s.init(); return s; };
    window.initMultiOrganMPS = (id) => { const s = new MultiOrganMPS(id); s.init(); return s; };
    window.initDrugResponse = (id) => { const s = new DrugResponseLab(id); s.init(); return s; };

    console.log('[Modules 12-14] 3D Module Replacements loaded');
})();
