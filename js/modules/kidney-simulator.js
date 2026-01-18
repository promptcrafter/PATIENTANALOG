/**
 * PatientAnalog.com - Module #3: Kidney Nephron Filtration Simulator
 * Museum-Grade Scientific Simulation
 * 
 * @version 1.0.0
 * @requires museum-grade-engine.js
 * 
 * SCIENTIFIC MODEL:
 * - Glomerular filtration rate (GFR) dynamics
 * - Tubular reabsorption/secretion per segment
 * - Electrolyte homeostasis (Na+, K+, Ca2+)
 * - Water balance and ADH response
 * - Nephrotoxicity and AKI modeling
 * - Diuretic mechanisms (loop, thiazide, K-sparing)
 */

(function() {
    'use strict';

    const { MathUtils, StateManager, SimulationClock, VisualizationController, 
            AudioFeedback, SimulationModule, PerformanceDetector } = window.MuseumGradeEngine;

    // ═══════════════════════════════════════════════════════════════════════
    // RENAL PHYSIOLOGY CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    const RENAL_PHYSIOLOGY = {
        // Normal GFR
        GFR_NORMAL: 120,              // mL/min
        GFR_MILD_CKD: 60,
        GFR_MODERATE_CKD: 30,
        GFR_SEVERE_CKD: 15,
        
        // Renal blood flow
        RBF_NORMAL: 1200,             // mL/min (20-25% of cardiac output)
        FILTRATION_FRACTION: 0.2,     // GFR/RPF
        
        // Pressures (mmHg)
        GLOMERULAR_HYDROSTATIC: 60,
        BOWMANS_HYDROSTATIC: 18,
        GLOMERULAR_ONCOTIC: 32,
        NET_FILTRATION_PRESSURE: 10,  // Normal NFP
        
        // Tubular segments - reabsorption percentages
        PCT_REABSORPTION: {
            water: 0.65,
            sodium: 0.65,
            potassium: 0.65,
            glucose: 1.0,             // 100% normally
            bicarbonate: 0.80,
            urea: 0.50
        },
        LOOP_REABSORPTION: {
            water: 0.15,              // Descending only
            sodium: 0.25,             // Thick ascending
            potassium: 0.25,
            chloride: 0.25
        },
        DCT_REABSORPTION: {
            water: 0.05,              // ADH-independent
            sodium: 0.05,
            calcium: 0.08
        },
        CD_REABSORPTION: {
            water: 0.10,              // ADH-dependent (variable)
            sodium: 0.03,             // Aldosterone-dependent
            potassium: -0.10          // Secretion
        },
        
        // Normal serum values
        SERUM_NORMAL: {
            sodium: 140,              // mEq/L
            potassium: 4.0,
            chloride: 100,
            bicarbonate: 24,
            bun: 15,                  // mg/dL
            creatinine: 1.0,          // mg/dL
            calcium: 9.5,             // mg/dL
            phosphate: 3.5,
            glucose: 100              // mg/dL
        },
        
        // Critical thresholds
        CRITICAL: {
            potassium_high: 6.0,
            potassium_low: 3.0,
            sodium_high: 150,
            sodium_low: 125,
            bicarbonate_low: 18,
            creatinine_aki: 2.0
        },
        
        // Tubular cell ATP
        ATP_NORMAL: 100,
        ATP_CRITICAL: 30
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DIURETIC DATABASE
    // ═══════════════════════════════════════════════════════════════════════

    const DIURETICS = {
        furosemide: {
            name: 'Furosemide',
            class: 'Loop diuretic',
            site: 'loop',
            mechanism: 'NKCC2 inhibition',
            potency: 0.8,
            effects: {
                sodiumExcretion: 0.25,
                potassiumExcretion: 0.15,
                waterExcretion: 0.20,
                calciumExcretion: 0.10
            },
            onset: 0.5,               // hours
            duration: 6,
            toxicity: {
                ototoxicity: 0.05,
                hypokalemia: 0.3
            }
        },
        hydrochlorothiazide: {
            name: 'Hydrochlorothiazide',
            class: 'Thiazide diuretic',
            site: 'dct',
            mechanism: 'NCC inhibition',
            potency: 0.4,
            effects: {
                sodiumExcretion: 0.08,
                potassiumExcretion: 0.08,
                waterExcretion: 0.05,
                calciumExcretion: -0.05  // Decreases calcium excretion
            },
            onset: 2,
            duration: 12,
            toxicity: {
                hyponatremia: 0.15,
                hypokalemia: 0.2
            }
        },
        spironolactone: {
            name: 'Spironolactone',
            class: 'K-sparing diuretic',
            site: 'cd',
            mechanism: 'Aldosterone antagonist',
            potency: 0.2,
            effects: {
                sodiumExcretion: 0.03,
                potassiumExcretion: -0.05,  // Decreases K excretion
                waterExcretion: 0.02
            },
            onset: 24,
            duration: 48,
            toxicity: {
                hyperkalemia: 0.2,
                gynecomastia: 0.1
            }
        },
        mannitol: {
            name: 'Mannitol',
            class: 'Osmotic diuretic',
            site: 'pct',
            mechanism: 'Osmotic gradient',
            potency: 0.6,
            effects: {
                waterExcretion: 0.30,
                sodiumExcretion: 0.10
            },
            onset: 0.25,
            duration: 4,
            toxicity: {
                volumeOverload: 0.2,
                rebound: 0.15
            }
        }
    };

    // Nephrotoxic agents
    const NEPHROTOXINS = {
        gentamicin: {
            name: 'Gentamicin',
            mechanism: 'Proximal tubular necrosis',
            site: 'pct',
            toxicityRate: 0.4,
            reversible: true,
            recoveryTime: 14         // days
        },
        contrast: {
            name: 'IV Contrast',
            mechanism: 'Vasoconstriction + direct toxicity',
            site: 'medulla',
            toxicityRate: 0.25,
            reversible: true,
            recoveryTime: 7
        },
        nsaid: {
            name: 'NSAID',
            mechanism: 'Afferent arteriole constriction',
            site: 'glomerulus',
            toxicityRate: 0.15,
            reversible: true,
            recoveryTime: 3
        },
        cisplatin: {
            name: 'Cisplatin',
            mechanism: 'Tubular cell apoptosis',
            site: 'pct',
            toxicityRate: 0.6,
            reversible: false,
            recoveryTime: 30
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // KIDNEY SIMULATOR CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class KidneySimulator extends SimulationModule {
        
        getInitialState() {
            return {
                // Glomerular function
                gfr: RENAL_PHYSIOLOGY.GFR_NORMAL,
                rbf: RENAL_PHYSIOLOGY.RBF_NORMAL,
                filtrationFraction: RENAL_PHYSIOLOGY.FILTRATION_FRACTION,
                
                // Pressures
                glomerularPressure: RENAL_PHYSIOLOGY.GLOMERULAR_HYDROSTATIC,
                bowmansPressure: RENAL_PHYSIOLOGY.BOWMANS_HYDROSTATIC,
                oncoticPressure: RENAL_PHYSIOLOGY.GLOMERULAR_ONCOTIC,
                netFiltrationPressure: RENAL_PHYSIOLOGY.NET_FILTRATION_PRESSURE,
                
                // Blood pressure (systemic)
                meanArterialPressure: 90,
                
                // Serum electrolytes
                serum: { ...RENAL_PHYSIOLOGY.SERUM_NORMAL },
                
                // Tubular concentrations (filtrate)
                filtrate: {
                    pct: { volume: 180, sodium: 140, potassium: 4, glucose: 100 },
                    loop: { volume: 63, sodium: 49, potassium: 1.4, glucose: 0 },
                    dct: { volume: 20, sodium: 12, potassium: 0.35, glucose: 0 },
                    cd: { volume: 15, sodium: 5, potassium: 1.2, glucose: 0 }
                },
                
                // Urine output
                urineVolume: 1.5,          // L/day
                urineOsmolality: 600,      // mOsm/kg
                urineElectrolytes: {
                    sodium: 100,            // mEq/L
                    potassium: 50,
                    chloride: 100
                },
                
                // Hormonal regulation
                hormones: {
                    adh: 2,                 // pg/mL (normal 1-5)
                    aldosterone: 10,        // ng/dL (normal 5-20)
                    renin: 1.5,             // ng/mL/hr
                    angiotensinII: 20,      // pg/mL
                    anp: 30                 // pg/mL
                },
                
                // Tubular cell health
                tubularHealth: {
                    pct: 100,
                    loop: 100,
                    dct: 100,
                    cd: 100
                },
                tubularATP: RENAL_PHYSIOLOGY.ATP_NORMAL,
                
                // Active drugs/toxins
                activeDrugs: {},
                nephrotoxinExposure: {},
                
                // Dialysis state
                dialysisActive: false,
                dialysisSettings: {
                    bloodFlowRate: 300,     // mL/min
                    dialysateFlowRate: 500,
                    duration: 4             // hours
                },
                
                // Injury markers
                akiStage: 0,                // 0 = none, 1-3 = KDIGO stages
                baselineCreatinine: 1.0,
                peakCreatinine: 1.0,
                
                // Clinical status
                fluidBalance: 0,            // mL (positive = overload)
                edemaScore: 0,              // 0-4+
                
                // Simulation
                simulationTime: 0,
                phase: 'tutorial',
                score: 0
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            
            container.innerHTML = `
                <div class="kidney-sim-container" style="
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #0a0510 0%, #150a20 50%, #0a0515 100%);
                    border-radius: 16px;
                    overflow: hidden;
                    position: relative;
                    font-family: 'Orbitron', 'Segoe UI', sans-serif;
                    color: #e0f2fe;
                ">
                    <!-- Header -->
                    <div style="
                        padding: 12px 20px;
                        background: linear-gradient(90deg, rgba(139,0,0,0.2), rgba(200,100,50,0.1));
                        border-bottom: 1px solid rgba(139,0,0,0.3);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h3 style="margin: 0; font-size: 16px; color: #ff6b6b;">
                                🫘 Kidney Nephron Dynamics
                            </h3>
                            <p style="margin: 3px 0 0; font-size: 11px; color: rgba(255,255,255,0.6);">
                                Glomerular Filtration & Tubular Processing
                            </p>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span id="kidney-aki" style="
                                padding: 4px 12px;
                                background: rgba(0,255,136,0.2);
                                border: 1px solid #00ff88;
                                border-radius: 12px;
                                font-size: 10px;
                            ">AKI Stage: 0</span>
                            <span id="kidney-time" style="font-size: 12px; color: #ffd700;">0h</span>
                        </div>
                    </div>

                    <!-- Main Layout -->
                    <div style="display: grid; grid-template-columns: 1fr 320px; height: calc(100% - 50px);">
                        
                        <!-- Left: Nephron Visualization -->
                        <div style="padding: 15px; overflow: hidden;">
                            
                            <!-- Nephron Diagram -->
                            <div id="nephron-diagram" style="
                                height: 320px;
                                background: rgba(0,0,0,0.3);
                                border: 1px solid rgba(139,0,0,0.3);
                                border-radius: 12px;
                                position: relative;
                                overflow: hidden;
                            ">
                                <!-- SVG Nephron Structure -->
                                <svg viewBox="0 0 400 280" style="width: 100%; height: 100%;">
                                    <!-- Glomerulus -->
                                    <g id="glomerulus-group">
                                        <ellipse cx="80" cy="60" rx="35" ry="30" 
                                            fill="url(#glomerulusGrad)" stroke="#ff6b6b" stroke-width="2"/>
                                        <text x="80" y="65" text-anchor="middle" fill="#fff" font-size="10">Glomerulus</text>
                                        
                                        <!-- Afferent arteriole -->
                                        <path d="M 20 60 Q 40 60 45 60" stroke="#ff4444" stroke-width="4" fill="none"/>
                                        <text x="15" y="50" fill="rgba(255,255,255,0.6)" font-size="8">Afferent</text>
                                        
                                        <!-- Efferent arteriole -->
                                        <path d="M 115 60 Q 130 60 140 80" stroke="#aa3333" stroke-width="3" fill="none"/>
                                        <text x="130" y="50" fill="rgba(255,255,255,0.6)" font-size="8">Efferent</text>
                                        
                                        <!-- Bowman's capsule -->
                                        <ellipse cx="80" cy="60" rx="45" ry="40" 
                                            fill="none" stroke="#ffd700" stroke-width="1.5" stroke-dasharray="3,3"/>
                                    </g>
                                    
                                    <!-- PCT -->
                                    <g id="pct-group">
                                        <path id="pct-path" d="M 80 100 Q 120 120 160 110 Q 200 100 220 130 Q 240 160 220 180" 
                                            stroke="#0055ff" stroke-width="12" fill="none" stroke-linecap="round"
                                            opacity="0.8"/>
                                        <path d="M 80 100 Q 120 120 160 110 Q 200 100 220 130 Q 240 160 220 180" 
                                            stroke="#0055ff" stroke-width="6" fill="none" stroke-linecap="round"
                                            opacity="0.5"/>
                                        <text x="170" y="95" fill="#0055ff" font-size="9">PCT</text>
                                        
                                        <!-- PCT reabsorption arrows -->
                                        <g class="reabsorption-arrows" opacity="0.6">
                                            <path d="M 140 105 L 140 85" stroke="#00ff88" stroke-width="1.5" marker-end="url(#arrowGreen)"/>
                                            <path d="M 180 115 L 185 95" stroke="#00ff88" stroke-width="1.5" marker-end="url(#arrowGreen)"/>
                                            <path d="M 210 140 L 220 125" stroke="#00ff88" stroke-width="1.5" marker-end="url(#arrowGreen)"/>
                                        </g>
                                    </g>
                                    
                                    <!-- Loop of Henle -->
                                    <g id="loop-group">
                                        <!-- Descending limb -->
                                        <path d="M 220 180 Q 220 220 180 250 Q 140 270 120 250" 
                                            stroke="#9d00ff" stroke-width="8" fill="none" stroke-linecap="round"
                                            opacity="0.8"/>
                                        <text x="200" y="230" fill="#9d00ff" font-size="8">Desc.</text>
                                        
                                        <!-- Ascending limb -->
                                        <path d="M 120 250 Q 100 230 100 200 Q 100 170 120 150" 
                                            stroke="#ffaa00" stroke-width="8" fill="none" stroke-linecap="round"
                                            opacity="0.8"/>
                                        <text x="85" y="200" fill="#ffaa00" font-size="8">Asc.</text>
                                        
                                        <!-- Loop label -->
                                        <text x="150" y="265" fill="rgba(255,255,255,0.5)" font-size="9">Loop of Henle</text>
                                    </g>
                                    
                                    <!-- DCT -->
                                    <g id="dct-group">
                                        <path d="M 120 150 Q 80 130 60 150 Q 40 170 60 190" 
                                            stroke="#ffd700" stroke-width="10" fill="none" stroke-linecap="round"
                                            opacity="0.8"/>
                                        <text x="50" y="145" fill="#ffd700" font-size="9">DCT</text>
                                    </g>
                                    
                                    <!-- Collecting Duct -->
                                    <g id="cd-group">
                                        <path d="M 60 190 Q 60 220 80 250 Q 100 280 100 290" 
                                            stroke="#ff6b6b" stroke-width="10" fill="none" stroke-linecap="round"
                                            opacity="0.8"/>
                                        <text x="90" y="230" fill="#ff6b6b" font-size="9">CD</text>
                                        
                                        <!-- Urine output -->
                                        <path d="M 100 290 L 100 310" stroke="#ffd700" stroke-width="6" fill="none"/>
                                        <text x="115" y="305" fill="#ffd700" font-size="8">→ Urine</text>
                                    </g>
                                    
                                    <!-- Peritubular capillaries -->
                                    <g id="capillaries" opacity="0.3">
                                        <path d="M 140 80 Q 160 100 180 90 Q 200 80 230 100" 
                                            stroke="#ff4444" stroke-width="2" fill="none" stroke-dasharray="3,2"/>
                                        <path d="M 140 170 Q 120 180 110 200 Q 100 220 110 240" 
                                            stroke="#ff4444" stroke-width="2" fill="none" stroke-dasharray="3,2"/>
                                    </g>
                                    
                                    <!-- Gradients & Markers -->
                                    <defs>
                                        <radialGradient id="glomerulusGrad" cx="30%" cy="30%">
                                            <stop offset="0%" style="stop-color:#ff8888"/>
                                            <stop offset="100%" style="stop-color:#aa3333"/>
                                        </radialGradient>
                                        <marker id="arrowGreen" markerWidth="6" markerHeight="6" 
                                            refX="3" refY="3" orient="auto">
                                            <path d="M 0 0 L 6 3 L 0 6 Z" fill="#00ff88"/>
                                        </marker>
                                    </defs>
                                    
                                    <!-- Flow particles (animated) -->
                                    <g id="flow-particles"></g>
                                </svg>
                                
                                <!-- GFR indicator overlay -->
                                <div id="gfr-indicator" style="
                                    position: absolute;
                                    top: 30px;
                                    left: 40px;
                                    background: rgba(0,0,0,0.8);
                                    padding: 8px 12px;
                                    border-radius: 8px;
                                    border: 1px solid #ff6b6b;
                                ">
                                    <div style="font-size: 9px; color: rgba(255,255,255,0.6);">GFR</div>
                                    <div id="gfr-value" style="font-size: 20px; font-weight: bold; color: #00ff88;">120</div>
                                    <div style="font-size: 8px; color: rgba(255,255,255,0.5);">mL/min</div>
                                </div>
                                
                                <!-- Segment concentrations -->
                                <div id="segment-indicators" style="
                                    position: absolute;
                                    bottom: 10px;
                                    left: 10px;
                                    right: 10px;
                                    display: flex;
                                    justify-content: space-around;
                                    font-size: 9px;
                                ">
                                    <div class="segment-ind" style="text-align: center; padding: 5px; background: rgba(0,212,255,0.2); border-radius: 5px;">
                                        <div style="color: #0055ff;">PCT</div>
                                        <div id="pct-vol">180 L/d</div>
                                    </div>
                                    <div class="segment-ind" style="text-align: center; padding: 5px; background: rgba(157,0,255,0.2); border-radius: 5px;">
                                        <div style="color: #9d00ff;">Loop</div>
                                        <div id="loop-vol">63 L/d</div>
                                    </div>
                                    <div class="segment-ind" style="text-align: center; padding: 5px; background: rgba(255,215,0,0.2); border-radius: 5px;">
                                        <div style="color: #ffd700;">DCT</div>
                                        <div id="dct-vol">20 L/d</div>
                                    </div>
                                    <div class="segment-ind" style="text-align: center; padding: 5px; background: rgba(255,107,107,0.2); border-radius: 5px;">
                                        <div style="color: #ff6b6b;">CD</div>
                                        <div id="cd-vol">1.5 L/d</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Controls Panel -->
                            <div style="
                                margin-top: 12px;
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 10px;
                            ">
                                <!-- Blood Pressure Control -->
                                <div style="
                                    padding: 12px;
                                    background: rgba(255,68,68,0.1);
                                    border: 1px solid rgba(255,68,68,0.3);
                                    border-radius: 10px;
                                ">
                                    <div style="font-size: 10px; color: #ff4444; margin-bottom: 8px;">
                                        🩺 Mean Arterial Pressure
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <input type="range" id="map-slider" min="50" max="140" value="90" style="
                                            flex: 1;
                                            accent-color: #ff4444;
                                        ">
                                        <span id="map-value" style="font-size: 14px; color: #ff4444; min-width: 50px;">90 mmHg</span>
                                    </div>
                                </div>

                                <!-- Fluid Status -->
                                <div style="
                                    padding: 12px;
                                    background: rgba(0,212,255,0.1);
                                    border: 1px solid rgba(0,212,255,0.3);
                                    border-radius: 10px;
                                ">
                                    <div style="font-size: 10px; color: #0055ff; margin-bottom: 8px;">
                                        💧 IV Fluid Bolus
                                    </div>
                                    <div style="display: flex; gap: 5px;">
                                        <button class="fluid-btn" data-amount="250" style="
                                            flex: 1;
                                            padding: 6px;
                                            background: rgba(0,212,255,0.2);
                                            border: 1px solid #0055ff;
                                            border-radius: 5px;
                                            color: #0055ff;
                                            font-size: 10px;
                                            cursor: pointer;
                                        ">250mL</button>
                                        <button class="fluid-btn" data-amount="500" style="
                                            flex: 1;
                                            padding: 6px;
                                            background: rgba(0,212,255,0.2);
                                            border: 1px solid #0055ff;
                                            border-radius: 5px;
                                            color: #0055ff;
                                            font-size: 10px;
                                            cursor: pointer;
                                        ">500mL</button>
                                        <button class="fluid-btn" data-amount="1000" style="
                                            flex: 1;
                                            padding: 6px;
                                            background: rgba(0,212,255,0.2);
                                            border: 1px solid #0055ff;
                                            border-radius: 5px;
                                            color: #0055ff;
                                            font-size: 10px;
                                            cursor: pointer;
                                        ">1000mL</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Diuretics & Nephrotoxins -->
                            <div style="
                                margin-top: 12px;
                                padding: 12px;
                                background: rgba(0,0,0,0.3);
                                border: 1px solid rgba(157,0,255,0.3);
                                border-radius: 10px;
                            ">
                                <div style="font-size: 10px; color: #9d00ff; margin-bottom: 10px;">
                                    💊 Pharmacological Intervention
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
                                    ${Object.entries(DIURETICS).map(([id, drug]) => `
                                        <button class="drug-btn" data-drug="${id}" data-type="diuretic" style="
                                            padding: 8px 4px;
                                            background: rgba(157,0,255,0.1);
                                            border: 1px solid rgba(157,0,255,0.3);
                                            border-radius: 6px;
                                            color: #9d00ff;
                                            font-size: 9px;
                                            cursor: pointer;
                                        ">${drug.name.split(' ')[0]}</button>
                                    `).join('')}
                                </div>
                                
                                <div style="font-size: 10px; color: #ff6b6b; margin: 12px 0 8px;">
                                    ⚠️ Nephrotoxin Challenge
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
                                    ${Object.entries(NEPHROTOXINS).map(([id, toxin]) => `
                                        <button class="drug-btn" data-drug="${id}" data-type="nephrotoxin" style="
                                            padding: 8px 4px;
                                            background: rgba(255,0,51,0.1);
                                            border: 1px solid rgba(255,0,51,0.3);
                                            border-radius: 6px;
                                            color: #ff0033;
                                            font-size: 9px;
                                            cursor: pointer;
                                        ">${toxin.name.split(' ')[0]}</button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Right Panel: Labs & Monitoring -->
                        <div style="
                            padding: 15px;
                            background: rgba(0,0,0,0.3);
                            border-left: 1px solid rgba(139,0,0,0.3);
                            overflow-y: auto;
                        ">
                            <!-- Serum Electrolytes -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #00ff88; margin-bottom: 8px;">
                                    🧪 Serum Chemistry
                                </div>
                                <div style="
                                    display: grid;
                                    grid-template-columns: 1fr 1fr;
                                    gap: 6px;
                                    font-size: 10px;
                                ">
                                    <div class="lab-box" style="
                                        padding: 8px;
                                        background: rgba(0,255,136,0.1);
                                        border: 1px solid rgba(0,255,136,0.3);
                                        border-radius: 6px;
                                    ">
                                        <div style="color: rgba(255,255,255,0.6);">Na⁺</div>
                                        <div id="lab-sodium" style="font-size: 16px; color: #00ff88;">140 mEq/L</div>
                                    </div>
                                    <div class="lab-box" style="
                                        padding: 8px;
                                        background: rgba(255,215,0,0.1);
                                        border: 1px solid rgba(255,215,0,0.3);
                                        border-radius: 6px;
                                    ">
                                        <div style="color: rgba(255,255,255,0.6);">K⁺</div>
                                        <div id="lab-potassium" style="font-size: 16px; color: #ffd700;">4.0 mEq/L</div>
                                    </div>
                                    <div class="lab-box" style="
                                        padding: 8px;
                                        background: rgba(0,212,255,0.1);
                                        border: 1px solid rgba(0,212,255,0.3);
                                        border-radius: 6px;
                                    ">
                                        <div style="color: rgba(255,255,255,0.6);">BUN</div>
                                        <div id="lab-bun" style="font-size: 16px; color: #0055ff;">15 mg/dL</div>
                                    </div>
                                    <div class="lab-box" style="
                                        padding: 8px;
                                        background: rgba(255,107,107,0.1);
                                        border: 1px solid rgba(255,107,107,0.3);
                                        border-radius: 6px;
                                    ">
                                        <div style="color: rgba(255,255,255,0.6);">Creatinine</div>
                                        <div id="lab-creatinine" style="font-size: 16px; color: #ff6b6b;">1.0 mg/dL</div>
                                    </div>
                                    <div class="lab-box" style="
                                        padding: 8px;
                                        background: rgba(157,0,255,0.1);
                                        border: 1px solid rgba(157,0,255,0.3);
                                        border-radius: 6px;
                                    ">
                                        <div style="color: rgba(255,255,255,0.6);">HCO₃⁻</div>
                                        <div id="lab-bicarb" style="font-size: 16px; color: #9d00ff;">24 mEq/L</div>
                                    </div>
                                    <div class="lab-box" style="
                                        padding: 8px;
                                        background: rgba(255,255,255,0.1);
                                        border: 1px solid rgba(255,255,255,0.2);
                                        border-radius: 6px;
                                    ">
                                        <div style="color: rgba(255,255,255,0.6);">Glucose</div>
                                        <div id="lab-glucose" style="font-size: 16px; color: #fff;">100 mg/dL</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Urine Output -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #ffd700; margin-bottom: 8px;">
                                    🚿 Urine Output
                                </div>
                                <div style="
                                    padding: 12px;
                                    background: rgba(255,215,0,0.1);
                                    border: 1px solid rgba(255,215,0,0.3);
                                    border-radius: 8px;
                                ">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span>Volume</span>
                                        <span id="urine-volume" style="color: #ffd700;">1.5 L/day</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span>Osmolality</span>
                                        <span id="urine-osm" style="color: #ffd700;">600 mOsm/kg</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>FENa</span>
                                        <span id="fena" style="color: #ffd700;">0.8%</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Tubular Health -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #ff6b6b; margin-bottom: 8px;">
                                    🏥 Tubular Health
                                </div>
                                <div style="display: grid; gap: 6px;">
                                    ${['pct', 'loop', 'dct', 'cd'].map(segment => `
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="width: 35px; font-size: 10px; color: rgba(255,255,255,0.6);">${segment.toUpperCase()}</span>
                                            <div style="flex: 1; height: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden;">
                                                <div id="health-${segment}" style="height: 100%; width: 100%; background: #00ff88; transition: width 0.3s;"></div>
                                            </div>
                                            <span id="health-${segment}-pct" style="width: 35px; font-size: 10px; text-align: right;">100%</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Creatinine Trend -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #9d00ff; margin-bottom: 8px;">
                                    📈 Creatinine Trend
                                </div>
                                <canvas id="creatinine-chart" width="280" height="100" style="
                                    width: 100%;
                                    background: rgba(0,0,0,0.3);
                                    border-radius: 8px;
                                "></canvas>
                            </div>

                            <!-- Hormones -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 8px;">
                                    🧬 Hormonal Status
                                </div>
                                <div style="font-size: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                    <div>ADH: <span id="hormone-adh" style="color: #0055ff;">2.0 pg/mL</span></div>
                                    <div>Aldosterone: <span id="hormone-aldo" style="color: #ffd700;">10 ng/dL</span></div>
                                    <div>Renin: <span id="hormone-renin" style="color: #ff6b6b;">1.5</span></div>
                                    <div>ANP: <span id="hormone-anp" style="color: #9d00ff;">30 pg/mL</span></div>
                                </div>
                            </div>

                            <!-- Controls -->
                            <div style="display: flex; gap: 8px;">
                                <button id="kidney-start-btn" style="
                                    flex: 1;
                                    padding: 10px;
                                    background: linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,212,255,0.1));
                                    border: 1px solid #00ff88;
                                    border-radius: 8px;
                                    color: #00ff88;
                                    font-family: 'Orbitron', sans-serif;
                                    font-size: 11px;
                                    cursor: pointer;
                                ">▶ Start</button>
                                <button id="kidney-reset-btn" style="
                                    flex: 1;
                                    padding: 10px;
                                    background: rgba(255,0,51,0.1);
                                    border: 1px solid rgba(255,0,51,0.3);
                                    border-radius: 8px;
                                    color: #ff0033;
                                    font-family: 'Orbitron', sans-serif;
                                    font-size: 11px;
                                    cursor: pointer;
                                ">↺ Reset</button>
                            </div>
                        </div>
                    </div>

                    <!-- Feedback -->
                    <div id="kidney-feedback" style="
                        position: absolute;
                        bottom: 10px;
                        left: 50%;
                        transform: translateX(-50%);
                        padding: 10px 20px;
                        background: rgba(0,0,0,0.9);
                        border-radius: 20px;
                        font-size: 12px;
                        display: none;
                        border: 1px solid #ff6b6b;
                    "></div>
                </div>
            `;

            this.bindEvents();
            this.initChart();
            this.startFlowAnimation();
        }

        bindEvents() {
            const container = document.getElementById(this.containerId);

            // MAP slider
            container.querySelector('#map-slider').addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                container.querySelector('#map-value').textContent = value + ' mmHg';
                this.state.set('meanArterialPressure', value);
            });

            // Fluid buttons
            container.querySelectorAll('.fluid-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const amount = parseInt(btn.dataset.amount);
                    this.administerFluid(amount);
                });
            });

            // Drug buttons
            container.querySelectorAll('.drug-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const drugId = btn.dataset.drug;
                    const type = btn.dataset.type;
                    if (type === 'diuretic') {
                        this.administerDiuretic(drugId);
                    } else {
                        this.exposeToNephrotoxin(drugId);
                    }
                });
            });

            // Start/Stop
            container.querySelector('#kidney-start-btn').addEventListener('click', () => {
                if (this.isRunning) {
                    this.pause();
                    container.querySelector('#kidney-start-btn').textContent = '▶ Resume';
                } else {
                    this.start();
                    container.querySelector('#kidney-start-btn').textContent = '⏸ Pause';
                }
            });

            // Reset
            container.querySelector('#kidney-reset-btn').addEventListener('click', () => {
                this.reset();
                container.querySelector('#kidney-start-btn').textContent = '▶ Start';
            });
        }

        initChart() {
            this.creatinineHistory = [];
            const canvas = document.getElementById('creatinine-chart');
            if (canvas) {
                this.chartCtx = canvas.getContext('2d');
            }
        }

        startFlowAnimation() {
            // Animate flow particles along nephron
            const tier = PerformanceDetector.detect().tier;
            if (tier === 'low') return;

            this.flowAnimationId = setInterval(() => {
                this.animateFlowParticles();
            }, 100);
        }

        animateFlowParticles() {
            const svg = document.querySelector('#nephron-diagram svg');
            if (!svg) return;

            const particlesGroup = svg.querySelector('#flow-particles');
            if (!particlesGroup) return;

            // Occasionally add new particle
            if (Math.random() < 0.3 && particlesGroup.children.length < 10) {
                const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                particle.setAttribute('r', '3');
                particle.setAttribute('fill', '#0055ff');
                particle.setAttribute('cx', '80');
                particle.setAttribute('cy', '100');
                particle.setAttribute('opacity', '0.8');
                particle.dataset.progress = '0';
                particlesGroup.appendChild(particle);
            }

            // Move existing particles
            Array.from(particlesGroup.children).forEach(particle => {
                let progress = parseFloat(particle.dataset.progress) + 0.02;
                particle.dataset.progress = progress;

                // Path through nephron (simplified)
                let x, y;
                if (progress < 0.3) {
                    // PCT
                    const t = progress / 0.3;
                    x = 80 + t * 140;
                    y = 100 + Math.sin(t * Math.PI) * 40;
                    particle.setAttribute('fill', '#0055ff');
                } else if (progress < 0.5) {
                    // Loop descending
                    const t = (progress - 0.3) / 0.2;
                    x = 220 - t * 100;
                    y = 180 + t * 70;
                    particle.setAttribute('fill', '#9d00ff');
                } else if (progress < 0.7) {
                    // Loop ascending
                    const t = (progress - 0.5) / 0.2;
                    x = 120 - t * 20;
                    y = 250 - t * 100;
                    particle.setAttribute('fill', '#ffaa00');
                } else if (progress < 0.85) {
                    // DCT
                    const t = (progress - 0.7) / 0.15;
                    x = 100 - t * 40;
                    y = 150 + t * 40;
                    particle.setAttribute('fill', '#ffd700');
                } else if (progress < 1) {
                    // CD
                    const t = (progress - 0.85) / 0.15;
                    x = 60 + t * 40;
                    y = 190 + t * 100;
                    particle.setAttribute('fill', '#ff6b6b');
                } else {
                    particlesGroup.removeChild(particle);
                    return;
                }

                particle.setAttribute('cx', x);
                particle.setAttribute('cy', y);
                particle.setAttribute('opacity', Math.max(0, 1 - progress));
            });
        }

        administerFluid(amount) {
            this.state.update('fluidBalance', fb => fb + amount);
            
            // Fluid expands plasma volume, increases RBF and GFR
            const rbf = this.state.get('rbf');
            const gfr = this.state.get('gfr');
            const boost = amount / 1000 * 0.1; // 10% boost per liter
            
            this.state.set('rbf', Math.min(1500, rbf * (1 + boost)));
            this.state.set('gfr', Math.min(150, gfr * (1 + boost)));
            
            this.showFeedback(`${amount}mL NS administered`, 'info');
            AudioFeedback.playStateChange('tick');
        }

        administerDiuretic(drugId) {
            const drug = DIURETICS[drugId];
            const activeDrugs = this.state.get('activeDrugs');
            
            activeDrugs[drugId] = {
                startTime: this.state.get('simulationTime'),
                ...drug
            };
            
            this.state.set('activeDrugs', activeDrugs);
            this.showFeedback(`${drug.name} administered`, 'success');
            AudioFeedback.playStateChange('success', 0.3);
        }

        exposeToNephrotoxin(toxinId) {
            const toxin = NEPHROTOXINS[toxinId];
            const exposure = this.state.get('nephrotoxinExposure');
            
            exposure[toxinId] = {
                startTime: this.state.get('simulationTime'),
                cumulativeDose: (exposure[toxinId]?.cumulativeDose || 0) + 1,
                ...toxin
            };
            
            this.state.set('nephrotoxinExposure', exposure);
            this.showFeedback(`⚠️ ${toxin.name} exposure!`, 'warning');
            AudioFeedback.playStateChange('warning');
        }

        // ═══════════════════════════════════════════════════════════════════
        // CORE SIMULATION
        // ═══════════════════════════════════════════════════════════════════

        simulationStep(dt, totalTime) {
            const timeScale = 60; // 1 real second = 1 simulation minute
            const dtHours = (dt * timeScale) / 60;
            const simTimeHours = (totalTime * timeScale) / 60;
            
            this.state.set('simulationTime', simTimeHours, false);

            // 1. Update blood pressure effects on GFR
            this.updateGlomerularDynamics(dtHours);

            // 2. Process tubular function
            this.updateTubularFunction(dtHours);

            // 3. Process diuretics
            this.processDiureticEffects(dtHours);

            // 4. Process nephrotoxin damage
            this.processNephrotoxicity(dtHours);

            // 5. Update hormonal responses
            this.updateHormones(dtHours);

            // 6. Update serum electrolytes
            this.updateSerumElectrolytes(dtHours);

            // 7. Calculate urine output
            this.calculateUrineOutput(dtHours);

            // 8. Assess for AKI
            this.assessAKI();

            // Track creatinine history
            this.creatinineHistory.push({
                time: simTimeHours,
                value: this.state.get('serum').creatinine
            });
            if (this.creatinineHistory.length > 200) {
                this.creatinineHistory.shift();
            }
        }

        updateGlomerularDynamics(dt) {
            const map = this.state.get('meanArterialPressure');
            const tubularHealth = this.state.get('tubularHealth');
            
            // Autoregulation: GFR maintained between MAP 80-180 mmHg
            let gfr = this.state.get('gfr');
            const targetGFR = RENAL_PHYSIOLOGY.GFR_NORMAL;
            
            if (map < 80) {
                // Below autoregulatory range - GFR drops
                const factor = map / 80;
                gfr = MathUtils.lerp(gfr, targetGFR * factor * factor, dt * 0.5);
            } else if (map > 180) {
                // Above autoregulatory range - hyperfiltration
                const excess = (map - 180) / 180;
                gfr = MathUtils.lerp(gfr, targetGFR * (1 + excess * 0.5), dt * 0.5);
            } else {
                // Normal autoregulation
                gfr = MathUtils.lerp(gfr, targetGFR, dt * 0.2);
            }
            
            // Tubular damage affects GFR via tubuloglomerular feedback
            const avgTubularHealth = (tubularHealth.pct + tubularHealth.loop + 
                                       tubularHealth.dct + tubularHealth.cd) / 4;
            gfr *= avgTubularHealth / 100;
            
            // Add stochastic variation
            gfr *= MathUtils.gaussianRandom(1, 0.02);
            gfr = MathUtils.clamp(gfr, 0, 180);
            
            this.state.set('gfr', gfr);
            
            // Update pressures
            const nfp = RENAL_PHYSIOLOGY.NET_FILTRATION_PRESSURE * (gfr / RENAL_PHYSIOLOGY.GFR_NORMAL);
            this.state.set('netFiltrationPressure', nfp);
        }

        updateTubularFunction(dt) {
            const gfr = this.state.get('gfr');
            const tubularHealth = this.state.get('tubularHealth');
            const filtrate = this.state.get('filtrate');
            
            // Filtered load per day (GFR in mL/min * 1440 min/day / 1000 = L/day)
            const filteredVolume = gfr * 1.44; // L/day
            
            // PCT reabsorption
            const pctHealth = tubularHealth.pct / 100;
            const pctReabsWater = RENAL_PHYSIOLOGY.PCT_REABSORPTION.water * pctHealth;
            filtrate.pct.volume = filteredVolume;
            filtrate.loop.volume = filteredVolume * (1 - pctReabsWater);
            
            // Loop reabsorption
            const loopHealth = tubularHealth.loop / 100;
            const loopReabsWater = RENAL_PHYSIOLOGY.LOOP_REABSORPTION.water * loopHealth;
            filtrate.dct.volume = filtrate.loop.volume * (1 - loopReabsWater);
            
            // DCT + CD with hormonal modulation
            const adh = this.state.get('hormones').adh;
            const adhEffect = MathUtils.sigmoid(adh, 3, 1.5); // ADH increases water reabsorption
            
            const dctHealth = tubularHealth.dct / 100;
            const cdHealth = tubularHealth.cd / 100;
            
            const finalReabsorption = (RENAL_PHYSIOLOGY.DCT_REABSORPTION.water * dctHealth + 
                                       RENAL_PHYSIOLOGY.CD_REABSORPTION.water * cdHealth * adhEffect);
            
            filtrate.cd.volume = filtrate.dct.volume * (1 - finalReabsorption);
            
            this.state.set('filtrate', filtrate);
        }

        processDiureticEffects(dt) {
            const activeDrugs = this.state.get('activeDrugs');
            const currentTime = this.state.get('simulationTime');
            const tubularHealth = this.state.get('tubularHealth');
            
            Object.keys(activeDrugs).forEach(drugId => {
                const drug = activeDrugs[drugId];
                const timeSinceAdmin = currentTime - drug.startTime;
                
                // Check if drug is still active
                if (timeSinceAdmin > drug.duration) {
                    delete activeDrugs[drugId];
                    return;
                }
                
                // Calculate effect magnitude based on timing
                let effectMag = 0;
                if (timeSinceAdmin < drug.onset) {
                    effectMag = timeSinceAdmin / drug.onset;
                } else if (timeSinceAdmin < drug.duration * 0.7) {
                    effectMag = 1;
                } else {
                    effectMag = (drug.duration - timeSinceAdmin) / (drug.duration * 0.3);
                }
                effectMag *= drug.potency;
                
                // Apply effects based on site
                // This increases sodium and water excretion
                const serum = this.state.get('serum');
                
                if (drug.effects.sodiumExcretion > 0) {
                    serum.sodium -= drug.effects.sodiumExcretion * effectMag * dt * 0.5;
                }
                if (drug.effects.potassiumExcretion > 0) {
                    serum.potassium -= drug.effects.potassiumExcretion * effectMag * dt * 0.3;
                } else if (drug.effects.potassiumExcretion < 0) {
                    // K-sparing
                    serum.potassium += Math.abs(drug.effects.potassiumExcretion) * effectMag * dt * 0.2;
                }
                
                // Clamp serum values
                serum.sodium = MathUtils.clamp(serum.sodium, 110, 160);
                serum.potassium = MathUtils.clamp(serum.potassium, 2.5, 7.0);
                
                this.state.set('serum', serum);
            });
            
            this.state.set('activeDrugs', activeDrugs);
        }

        processNephrotoxicity(dt) {
            const exposure = this.state.get('nephrotoxinExposure');
            const tubularHealth = this.state.get('tubularHealth');
            const currentTime = this.state.get('simulationTime');
            
            Object.keys(exposure).forEach(toxinId => {
                const toxin = exposure[toxinId];
                const timeSinceExposure = currentTime - toxin.startTime;
                
                // Damage accumulates over time
                const damageRate = toxin.toxicityRate * toxin.cumulativeDose * dt;
                
                // Apply damage to appropriate segment
                switch (toxin.site) {
                    case 'pct':
                        tubularHealth.pct = Math.max(0, tubularHealth.pct - damageRate * 10);
                        break;
                    case 'loop':
                        tubularHealth.loop = Math.max(0, tubularHealth.loop - damageRate * 10);
                        break;
                    case 'glomerulus':
                        // Affects GFR directly
                        let gfr = this.state.get('gfr');
                        gfr = Math.max(0, gfr - damageRate * 20);
                        this.state.set('gfr', gfr);
                        break;
                    case 'medulla':
                        tubularHealth.loop = Math.max(0, tubularHealth.loop - damageRate * 8);
                        tubularHealth.cd = Math.max(0, tubularHealth.cd - damageRate * 5);
                        break;
                }
                
                // Recovery if reversible and time has passed
                if (toxin.reversible && timeSinceExposure > 24) {
                    const recoveryRate = 0.5 * dt;
                    Object.keys(tubularHealth).forEach(segment => {
                        if (tubularHealth[segment] < 100) {
                            tubularHealth[segment] = Math.min(100, tubularHealth[segment] + recoveryRate);
                        }
                    });
                }
            });
            
            this.state.set('tubularHealth', tubularHealth);
        }

        updateHormones(dt) {
            const hormones = this.state.get('hormones');
            const map = this.state.get('meanArterialPressure');
            const serum = this.state.get('serum');
            const fluidBalance = this.state.get('fluidBalance');
            
            // RAAS response to low BP or volume
            if (map < 80 || fluidBalance < -500) {
                hormones.renin = MathUtils.lerp(hormones.renin, 5, dt * 0.3);
                hormones.angiotensinII = MathUtils.lerp(hormones.angiotensinII, 100, dt * 0.3);
                hormones.aldosterone = MathUtils.lerp(hormones.aldosterone, 40, dt * 0.2);
            } else {
                hormones.renin = MathUtils.lerp(hormones.renin, 1.5, dt * 0.1);
                hormones.angiotensinII = MathUtils.lerp(hormones.angiotensinII, 20, dt * 0.1);
                hormones.aldosterone = MathUtils.lerp(hormones.aldosterone, 10, dt * 0.1);
            }
            
            // ADH response to osmolality and volume
            const osmolality = serum.sodium * 2 + serum.glucose / 18 + this.state.get('serum').bun / 2.8;
            if (osmolality > 290 || fluidBalance < -500) {
                hormones.adh = MathUtils.lerp(hormones.adh, 8, dt * 0.3);
            } else if (osmolality < 280 || fluidBalance > 1000) {
                hormones.adh = MathUtils.lerp(hormones.adh, 0.5, dt * 0.3);
            } else {
                hormones.adh = MathUtils.lerp(hormones.adh, 2, dt * 0.1);
            }
            
            // ANP response to volume overload
            if (fluidBalance > 1000) {
                hormones.anp = MathUtils.lerp(hormones.anp, 100, dt * 0.3);
            } else {
                hormones.anp = MathUtils.lerp(hormones.anp, 30, dt * 0.1);
            }
            
            this.state.set('hormones', hormones);
        }

        updateSerumElectrolytes(dt) {
            const serum = this.state.get('serum');
            const gfr = this.state.get('gfr');
            const tubularHealth = this.state.get('tubularHealth');
            
            // Creatinine accumulates with reduced GFR
            const creatinineProduction = 1.0; // mg/dL per day baseline
            const creatinineClearance = gfr / RENAL_PHYSIOLOGY.GFR_NORMAL;
            
            serum.creatinine += (creatinineProduction - creatinineClearance) * dt * 0.1;
            serum.creatinine = MathUtils.clamp(serum.creatinine, 0.5, 15);
            
            // BUN similarly accumulates
            serum.bun += (15 - 15 * creatinineClearance) * dt * 0.05;
            serum.bun = MathUtils.clamp(serum.bun, 5, 150);
            
            // Bicarbonate drops with kidney failure (metabolic acidosis)
            if (gfr < 30) {
                serum.bicarbonate -= (30 - gfr) / 30 * dt * 0.5;
            } else {
                serum.bicarbonate = MathUtils.lerp(serum.bicarbonate, 24, dt * 0.1);
            }
            serum.bicarbonate = MathUtils.clamp(serum.bicarbonate, 8, 30);
            
            // Update peak creatinine
            if (serum.creatinine > this.state.get('peakCreatinine')) {
                this.state.set('peakCreatinine', serum.creatinine);
            }
            
            this.state.set('serum', serum);
        }

        calculateUrineOutput(dt) {
            const filtrate = this.state.get('filtrate');
            const hormones = this.state.get('hormones');
            const activeDrugs = this.state.get('activeDrugs');
            
            // Base urine volume from CD
            let urineVolume = filtrate.cd.volume;
            
            // Diuretic effects increase output
            Object.values(activeDrugs).forEach(drug => {
                if (drug.effects.waterExcretion > 0) {
                    urineVolume *= (1 + drug.effects.waterExcretion);
                }
            });
            
            // Clamp to physiological range
            urineVolume = MathUtils.clamp(urineVolume, 0.3, 10);
            
            // Osmolality depends on ADH
            const adhEffect = MathUtils.sigmoid(hormones.adh, 3, 1.5);
            const urineOsm = 100 + 900 * adhEffect; // Range: 100-1000 mOsm/kg
            
            this.state.set('urineVolume', urineVolume);
            this.state.set('urineOsmolality', urineOsm);
            
            // Update fluid balance
            const dailyIntake = 2; // L assumed
            const insensibleLoss = 0.5;
            const netBalance = (dailyIntake - urineVolume - insensibleLoss) * dt / 24;
            this.state.update('fluidBalance', fb => fb + netBalance * 1000);
        }

        assessAKI() {
            const serum = this.state.get('serum');
            const baseline = this.state.get('baselineCreatinine');
            const urineVolume = this.state.get('urineVolume');
            
            // KDIGO AKI staging
            let stage = 0;
            const creatinineRatio = serum.creatinine / baseline;
            const creatinineIncrease = serum.creatinine - baseline;
            
            if (creatinineRatio >= 3 || serum.creatinine >= 4 || urineVolume < 0.3) {
                stage = 3;
            } else if (creatinineRatio >= 2 || urineVolume < 0.5) {
                stage = 2;
            } else if (creatinineIncrease >= 0.3 || creatinineRatio >= 1.5 || urineVolume < 0.5) {
                stage = 1;
            }
            
            const prevStage = this.state.get('akiStage');
            this.state.set('akiStage', stage);
            
            // Alert on stage change
            if (stage > prevStage) {
                this.showFeedback(`⚠️ AKI Stage ${stage} detected!`, 'critical');
                AudioFeedback.playStateChange('critical');
            }
            
            // Check for critical electrolytes
            if (serum.potassium > RENAL_PHYSIOLOGY.CRITICAL.potassium_high) {
                this.showFeedback('🚨 CRITICAL: Hyperkalemia!', 'critical');
            }
            if (serum.potassium < RENAL_PHYSIOLOGY.CRITICAL.potassium_low) {
                this.showFeedback('⚠️ Hypokalemia detected', 'warning');
            }
        }

        updateVisualization() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const state = this.state.get();

            // Update time
            container.querySelector('#kidney-time').textContent = state.simulationTime.toFixed(1) + 'h';

            // Update AKI badge
            const akiBadge = container.querySelector('#kidney-aki');
            akiBadge.textContent = `AKI Stage: ${state.akiStage}`;
            akiBadge.style.background = state.akiStage === 0 ? 'rgba(0,255,136,0.2)' :
                                        state.akiStage === 1 ? 'rgba(255,215,0,0.2)' :
                                        'rgba(255,0,51,0.2)';
            akiBadge.style.borderColor = state.akiStage === 0 ? '#00ff88' :
                                          state.akiStage === 1 ? '#ffd700' : '#ff0033';

            // Update GFR
            const gfrEl = container.querySelector('#gfr-value');
            gfrEl.textContent = Math.round(state.gfr);
            gfrEl.style.color = state.gfr >= 90 ? '#00ff88' :
                                state.gfr >= 60 ? '#ffd700' :
                                state.gfr >= 30 ? '#ff6b6b' : '#ff0033';

            // Update segment volumes
            container.querySelector('#pct-vol').textContent = state.filtrate.pct.volume.toFixed(0) + ' L/d';
            container.querySelector('#loop-vol').textContent = state.filtrate.loop.volume.toFixed(0) + ' L/d';
            container.querySelector('#dct-vol').textContent = state.filtrate.dct.volume.toFixed(0) + ' L/d';
            container.querySelector('#cd-vol').textContent = state.filtrate.cd.volume.toFixed(1) + ' L/d';

            // Update serum labs
            container.querySelector('#lab-sodium').textContent = state.serum.sodium.toFixed(0) + ' mEq/L';
            container.querySelector('#lab-potassium').textContent = state.serum.potassium.toFixed(1) + ' mEq/L';
            container.querySelector('#lab-bun').textContent = state.serum.bun.toFixed(0) + ' mg/dL';
            container.querySelector('#lab-creatinine').textContent = state.serum.creatinine.toFixed(2) + ' mg/dL';
            container.querySelector('#lab-bicarb').textContent = state.serum.bicarbonate.toFixed(0) + ' mEq/L';
            container.querySelector('#lab-glucose').textContent = state.serum.glucose.toFixed(0) + ' mg/dL';

            // Color code abnormal values
            const creatEl = container.querySelector('#lab-creatinine');
            creatEl.style.color = state.serum.creatinine > 2 ? '#ff0033' :
                                   state.serum.creatinine > 1.3 ? '#ffd700' : '#ff6b6b';

            const kEl = container.querySelector('#lab-potassium');
            kEl.style.color = state.serum.potassium > 5.5 || state.serum.potassium < 3.5 ? '#ff0033' : '#ffd700';

            // Update urine output
            container.querySelector('#urine-volume').textContent = state.urineVolume.toFixed(2) + ' L/day';
            container.querySelector('#urine-osm').textContent = Math.round(state.urineOsmolality) + ' mOsm/kg';

            // Calculate FENa
            const fena = (state.urine?.sodium || 100) * state.serum.creatinine / 
                         (state.serum.sodium * (state.serum.creatinine || 1)) * 100;
            container.querySelector('#fena').textContent = (fena || 0.8).toFixed(1) + '%';

            // Update tubular health bars
            ['pct', 'loop', 'dct', 'cd'].forEach(segment => {
                const health = state.tubularHealth[segment];
                const bar = container.querySelector(`#health-${segment}`);
                const pct = container.querySelector(`#health-${segment}-pct`);
                bar.style.width = health + '%';
                bar.style.background = health > 70 ? '#00ff88' : health > 40 ? '#ffd700' : '#ff0033';
                pct.textContent = Math.round(health) + '%';
            });

            // Update hormones
            container.querySelector('#hormone-adh').textContent = state.hormones.adh.toFixed(1) + ' pg/mL';
            container.querySelector('#hormone-aldo').textContent = state.hormones.aldosterone.toFixed(0) + ' ng/dL';
            container.querySelector('#hormone-renin').textContent = state.hormones.renin.toFixed(1);
            container.querySelector('#hormone-anp').textContent = state.hormones.anp.toFixed(0) + ' pg/mL';

            // Draw creatinine chart
            this.drawCreatinineChart();
        }

        drawCreatinineChart() {
            if (!this.chartCtx || this.creatinineHistory.length < 2) return;

            const ctx = this.chartCtx;
            const canvas = ctx.canvas;
            const width = canvas.width;
            const height = canvas.height;
            const padding = { top: 10, right: 10, bottom: 20, left: 35 };

            ctx.fillStyle = 'rgba(0, 10, 30, 0.95)';
            ctx.fillRect(0, 0, width, height);

            const values = this.creatinineHistory.map(h => h.value);
            const maxCr = Math.max(2, ...values);
            
            // Draw threshold line
            const normalY = height - padding.bottom - (1.0 / maxCr) * (height - padding.top - padding.bottom);
            ctx.strokeStyle = 'rgba(0,255,136,0.3)';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(padding.left, normalY);
            ctx.lineTo(width - padding.right, normalY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw line
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            ctx.beginPath();

            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;

            this.creatinineHistory.forEach((point, i) => {
                const x = padding.left + (i / (this.creatinineHistory.length - 1)) * chartWidth;
                const y = height - padding.bottom - (point.value / maxCr) * chartHeight;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Y-axis
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '8px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('0', padding.left - 3, height - padding.bottom);
            ctx.fillText(maxCr.toFixed(1), padding.left - 3, padding.top + 5);
        }

        showFeedback(message, type = 'info') {
            const feedback = document.getElementById('kidney-feedback');
            if (!feedback) return;

            const colors = {
                info: '#0055ff',
                success: '#00ff88',
                warning: '#ffd700',
                critical: '#ff0033'
            };

            feedback.style.color = colors[type] || colors.info;
            feedback.style.borderColor = colors[type] || colors.info;
            feedback.textContent = message;
            feedback.style.display = 'block';

            clearTimeout(this._feedbackTimeout);
            this._feedbackTimeout = setTimeout(() => {
                feedback.style.display = 'none';
            }, 4000);
        }

        destroy() {
            super.destroy();
            if (this.flowAnimationId) {
                clearInterval(this.flowAnimationId);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════════════

    window.KidneySimulator = KidneySimulator;
    
    window.initKidneySimulator = function(containerId) {
        const sim = new KidneySimulator(containerId);
        sim.init();
        return sim;
    };

    console.log('[KidneySimulator] Module loaded');

})();
// v20260117-FULL
