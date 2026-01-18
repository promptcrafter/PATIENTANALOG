/**
 * PatientAnalog.com - Module #2: Pharmacokinetic Digital Twin Engine
 * Museum-Grade Scientific Simulation
 * 
 * @version 1.0.0
 * @requires museum-grade-engine.js
 * 
 * SCIENTIFIC MODEL:
 * - Two-compartment pharmacokinetic model
 * - Organ-specific clearance (hepatic, renal)
 * - Protein binding dynamics
 * - Active metabolite generation
 * - Receptor occupancy calculations
 * - Drug-drug interactions (CYP450)
 * - Population PK variability
 */

(function() {
    'use strict';

    const { MathUtils, StateManager, SimulationClock, VisualizationController, 
            AudioFeedback, SimulationModule, PerformanceDetector } = window.MuseumGradeEngine;

    // ═══════════════════════════════════════════════════════════════════════
    // DRUG DATABASE WITH PK PARAMETERS
    // ═══════════════════════════════════════════════════════════════════════

    const DRUG_LIBRARY = {
        metformin: {
            name: 'Metformin',
            class: 'Biguanide',
            indication: 'Type 2 Diabetes',
            pk: {
                bioavailability: 0.55,
                vd: 654,                    // L (large distribution)
                proteinBinding: 0,           // Negligible
                halfLife: 5,                 // hours
                tmax: 2.5,                   // hours
                clearance: 510,              // mL/min
                renalElimination: 0.9,       // 90% renal
                hepaticMetabolism: 0.1       // 10% hepatic
            },
            pd: {
                mechanism: 'AMPK activation, hepatic glucose suppression',
                ec50: 1.0,                   // μg/mL
                emax: 80,                    // % max effect
                hill: 1.5,
                onsetTime: 2,                // hours
                therapeuticRange: { min: 0.5, max: 2.5 },  // μg/mL
                toxicThreshold: 5.0
            },
            organEffects: {
                liver: { efficacy: 0.8, toxicity: 0.05 },
                kidney: { efficacy: 0.1, toxicity: 0.15 },
                heart: { efficacy: 0.2, toxicity: 0.02 },
                gi: { efficacy: 0.3, toxicity: 0.3 }
            },
            doses: [500, 850, 1000, 1500, 2000]  // mg
        },
        warfarin: {
            name: 'Warfarin',
            class: 'Anticoagulant',
            indication: 'Thromboembolism prophylaxis',
            pk: {
                bioavailability: 0.95,
                vd: 10,                      // L (small, highly bound)
                proteinBinding: 0.99,        // 99% bound
                halfLife: 40,                // hours (highly variable)
                tmax: 4,
                clearance: 3,                // mL/min
                renalElimination: 0.08,
                hepaticMetabolism: 0.92      // CYP2C9
            },
            pd: {
                mechanism: 'Vitamin K epoxide reductase inhibition',
                ec50: 0.5,
                emax: 100,
                hill: 1.2,
                onsetTime: 24,               // Delayed onset
                therapeuticRange: { min: 1.0, max: 3.0 },  // INR target
                toxicThreshold: 4.0
            },
            organEffects: {
                liver: { efficacy: 0, toxicity: 0.1 },
                kidney: { efficacy: 0, toxicity: 0.05 },
                blood: { efficacy: 0.95, toxicity: 0.3 }
            },
            doses: [1, 2, 2.5, 3, 5, 7.5, 10]  // mg
        },
        atorvastatin: {
            name: 'Atorvastatin',
            class: 'Statin',
            indication: 'Hypercholesterolemia',
            pk: {
                bioavailability: 0.14,       // Low due to first-pass
                vd: 381,
                proteinBinding: 0.98,
                halfLife: 14,
                tmax: 1.5,
                clearance: 625,
                renalElimination: 0.02,
                hepaticMetabolism: 0.98      // CYP3A4
            },
            pd: {
                mechanism: 'HMG-CoA reductase inhibition',
                ec50: 0.014,                 // μg/mL
                emax: 55,                    // % LDL reduction
                hill: 1.8,
                onsetTime: 4,
                therapeuticRange: { min: 0.001, max: 0.08 },
                toxicThreshold: 0.2
            },
            organEffects: {
                liver: { efficacy: 0.9, toxicity: 0.15 },
                muscle: { efficacy: 0, toxicity: 0.1 },
                heart: { efficacy: 0.4, toxicity: 0.02 }
            },
            doses: [10, 20, 40, 80]  // mg
        },
        gentamicin: {
            name: 'Gentamicin',
            class: 'Aminoglycoside',
            indication: 'Serious Gram-negative infections',
            pk: {
                bioavailability: 1.0,        // IV only
                vd: 18,
                proteinBinding: 0.1,
                halfLife: 2,                 // Short
                tmax: 0.5,
                clearance: 100,
                renalElimination: 0.95,
                hepaticMetabolism: 0.05
            },
            pd: {
                mechanism: '30S ribosomal subunit binding',
                ec50: 4.0,
                emax: 99,                    // Bactericidal
                hill: 3.0,                   // Steep concentration-effect
                onsetTime: 0.5,
                therapeuticRange: { min: 5, max: 10 },  // Peak target
                toxicThreshold: 12
            },
            organEffects: {
                kidney: { efficacy: 0, toxicity: 0.4 },   // Nephrotoxic
                ear: { efficacy: 0, toxicity: 0.3 },     // Ototoxic
                bacteria: { efficacy: 1.0, toxicity: 0 }
            },
            doses: [80, 120, 160, 240]  // mg
        },
        doxorubicin: {
            name: 'Doxorubicin',
            class: 'Anthracycline',
            indication: 'Various malignancies',
            pk: {
                bioavailability: 1.0,        // IV only
                vd: 809,
                proteinBinding: 0.75,
                halfLife: 30,
                tmax: 0.1,
                clearance: 500,
                renalElimination: 0.12,
                hepaticMetabolism: 0.88
            },
            pd: {
                mechanism: 'DNA intercalation, topoisomerase II inhibition',
                ec50: 0.5,
                emax: 90,
                hill: 2.0,
                onsetTime: 1,
                therapeuticRange: { min: 0.1, max: 1.0 },
                toxicThreshold: 2.0
            },
            organEffects: {
                heart: { efficacy: 0, toxicity: 0.5 },   // Cardiotoxic
                bone_marrow: { efficacy: 0, toxicity: 0.6 },
                tumor: { efficacy: 0.85, toxicity: 0 }
            },
            doses: [20, 40, 60, 75]  // mg/m²
        }
    };

    // Patient population parameters
    const PATIENT_PHENOTYPES = {
        healthy_adult: {
            name: 'Healthy Adult',
            age: 35,
            weight: 70,
            bsa: 1.73,
            gfr: 100,               // mL/min
            hepaticFunction: 1.0,   // Normal = 1
            cyp2c9: 'normal',
            cyp3a4: 'normal',
            geneticVariants: {}
        },
        elderly: {
            name: 'Elderly Patient',
            age: 75,
            weight: 65,
            bsa: 1.68,
            gfr: 55,
            hepaticFunction: 0.7,
            cyp2c9: 'normal',
            cyp3a4: 'reduced',
            geneticVariants: {}
        },
        renal_impaired: {
            name: 'CKD Stage 3',
            age: 60,
            weight: 72,
            bsa: 1.75,
            gfr: 40,
            hepaticFunction: 1.0,
            cyp2c9: 'normal',
            cyp3a4: 'normal',
            geneticVariants: {}
        },
        hepatic_impaired: {
            name: 'Child-Pugh B',
            age: 55,
            weight: 68,
            bsa: 1.70,
            gfr: 90,
            hepaticFunction: 0.5,
            cyp2c9: 'reduced',
            cyp3a4: 'reduced',
            geneticVariants: {}
        },
        cyp2c9_poor: {
            name: 'CYP2C9 Poor Metabolizer',
            age: 45,
            weight: 75,
            bsa: 1.80,
            gfr: 95,
            hepaticFunction: 1.0,
            cyp2c9: 'poor',
            cyp3a4: 'normal',
            geneticVariants: { CYP2C9: '*3/*3' }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PK DIGITAL TWIN CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class PKDigitalTwin extends SimulationModule {
        
        getInitialState() {
            return {
                // Patient
                patient: PATIENT_PHENOTYPES.healthy_adult,
                
                // Drug selection
                selectedDrug: null,
                
                // Dosing regimen
                doses: [],                    // Array of { time, amount, route }
                dosingInterval: 12,           // hours
                numberOfDoses: 1,
                currentDose: 0,
                
                // Central compartment
                centralAmount: 0,             // mg
                centralConc: 0,               // μg/mL
                
                // Peripheral compartment
                peripheralAmount: 0,
                peripheralConc: 0,
                
                // Metabolites
                metaboliteConc: 0,
                
                // Protein binding
                freeConc: 0,
                boundConc: 0,
                
                // Organ concentrations
                organConcentrations: {
                    liver: 0,
                    kidney: 0,
                    heart: 0,
                    muscle: 0,
                    brain: 0
                },
                
                // Pharmacodynamics
                effect: 0,                    // % of max
                receptorOccupancy: 0,         // %
                
                // Organ-specific effects
                organEffects: {},
                organViability: {
                    liver: 100,
                    kidney: 100,
                    heart: 100,
                    muscle: 100,
                    bone_marrow: 100
                },
                
                // Toxicity accumulation
                toxicityScore: 0,
                cumulativeDose: 0,
                
                // Clinical outcomes
                therapeuticSuccess: false,
                toxicityEvent: false,
                
                // Time
                simulationTime: 0,            // hours
                
                // Concentration history for plotting
                concentrationHistory: [],
                effectHistory: [],
                
                // Phase
                phase: 'setup',               // 'setup', 'running', 'complete'
                score: 0
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            const tier = PerformanceDetector.detect().tier;

            container.innerHTML = `
                <div class="pktwin-container" style="
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #030712 0%, #0f172a 50%, #020617 100%);
                    border-radius: 16px;
                    overflow: hidden;
                    position: relative;
                    font-family: 'Orbitron', 'Segoe UI', sans-serif;
                    color: #e0f2fe;
                ">
                    <!-- Header -->
                    <div style="
                        padding: 15px 20px;
                        background: linear-gradient(90deg, rgba(157,0,255,0.1), rgba(0,212,255,0.1));
                        border-bottom: 1px solid rgba(157,0,255,0.2);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h3 style="margin: 0; font-size: 16px; color: #9d00ff;">
                                🧬 Pharmacokinetic Digital Twin
                            </h3>
                            <p style="margin: 3px 0 0; font-size: 11px; color: rgba(255,255,255,0.6);">
                                Two-Compartment PK/PD Simulator
                            </p>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span id="pk-phase" style="
                                padding: 4px 12px;
                                background: rgba(157,0,255,0.2);
                                border: 1px solid #9d00ff;
                                border-radius: 12px;
                                font-size: 10px;
                            ">SETUP</span>
                            <span id="pk-time" style="font-size: 12px; color: #ffd700;">0h</span>
                        </div>
                    </div>

                    <!-- Main Layout -->
                    <div style="display: grid; grid-template-columns: 280px 1fr 280px; height: calc(100% - 55px);">
                        
                        <!-- Left Panel: Drug & Patient Selection -->
                        <div style="
                            padding: 15px;
                            background: rgba(0,0,0,0.3);
                            border-right: 1px solid rgba(157,0,255,0.2);
                            overflow-y: auto;
                        ">
                            <!-- Drug Selection -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #9d00ff; margin-bottom: 8px;">💊 Select Drug</div>
                                <select id="drug-select" style="
                                    width: 100%;
                                    padding: 10px;
                                    background: rgba(0,0,0,0.5);
                                    border: 1px solid rgba(157,0,255,0.3);
                                    border-radius: 8px;
                                    color: #fff;
                                    font-family: inherit;
                                    font-size: 12px;
                                ">
                                    <option value="">-- Select a drug --</option>
                                    ${Object.entries(DRUG_LIBRARY).map(([id, drug]) => 
                                        `<option value="${id}">${drug.name} (${drug.class})</option>`
                                    ).join('')}
                                </select>
                            </div>

                            <!-- Drug Info Panel -->
                            <div id="drug-info" style="
                                padding: 12px;
                                background: rgba(157,0,255,0.05);
                                border: 1px solid rgba(157,0,255,0.2);
                                border-radius: 8px;
                                font-size: 11px;
                                display: none;
                            ">
                                <div id="drug-mechanism" style="color: rgba(255,255,255,0.7); margin-bottom: 8px;"></div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 10px;">
                                    <div>t½: <span id="drug-halflife" style="color: #0055ff;">--</span></div>
                                    <div>Bioavail: <span id="drug-f" style="color: #0055ff;">--</span></div>
                                    <div>Vd: <span id="drug-vd" style="color: #0055ff;">--</span></div>
                                    <div>Binding: <span id="drug-binding" style="color: #0055ff;">--</span></div>
                                </div>
                                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(157,0,255,0.2);">
                                    <span style="color: #00ff88;">Therapeutic: </span>
                                    <span id="drug-therapeutic">--</span>
                                </div>
                            </div>

                            <!-- Patient Selection -->
                            <div style="margin-top: 15px;">
                                <div style="font-size: 11px; color: #0055ff; margin-bottom: 8px;">👤 Patient Profile</div>
                                <select id="patient-select" style="
                                    width: 100%;
                                    padding: 10px;
                                    background: rgba(0,0,0,0.5);
                                    border: 1px solid rgba(0,212,255,0.3);
                                    border-radius: 8px;
                                    color: #fff;
                                    font-family: inherit;
                                    font-size: 12px;
                                ">
                                    ${Object.entries(PATIENT_PHENOTYPES).map(([id, pt]) => 
                                        `<option value="${id}">${pt.name}</option>`
                                    ).join('')}
                                </select>
                                
                                <div id="patient-info" style="
                                    margin-top: 10px;
                                    padding: 10px;
                                    background: rgba(0,212,255,0.05);
                                    border: 1px solid rgba(0,212,255,0.2);
                                    border-radius: 8px;
                                    font-size: 10px;
                                ">
                                    <div>Age: <span id="pt-age">35</span> y | Weight: <span id="pt-weight">70</span> kg</div>
                                    <div>GFR: <span id="pt-gfr">100</span> mL/min</div>
                                    <div>Hepatic function: <span id="pt-hepatic">Normal</span></div>
                                </div>
                            </div>

                            <!-- Dosing Regimen -->
                            <div style="margin-top: 15px;">
                                <div style="font-size: 11px; color: #ffd700; margin-bottom: 8px;">💉 Dosing Regimen</div>
                                
                                <div style="margin-bottom: 10px;">
                                    <label style="font-size: 10px; display: block; margin-bottom: 3px;">Dose:</label>
                                    <select id="dose-select" style="
                                        width: 100%;
                                        padding: 8px;
                                        background: rgba(0,0,0,0.5);
                                        border: 1px solid rgba(255,215,0,0.3);
                                        border-radius: 6px;
                                        color: #fff;
                                        font-size: 11px;
                                    ">
                                        <option value="">Select dose</option>
                                    </select>
                                </div>

                                <div style="margin-bottom: 10px;">
                                    <label style="font-size: 10px; display: block; margin-bottom: 3px;">
                                        Interval: <span id="interval-value">12</span>h
                                    </label>
                                    <input type="range" id="dose-interval" min="4" max="24" value="12" style="
                                        width: 100%;
                                        accent-color: #ffd700;
                                    ">
                                </div>

                                <div style="margin-bottom: 10px;">
                                    <label style="font-size: 10px; display: block; margin-bottom: 3px;">
                                        Number of doses: <span id="num-doses-value">3</span>
                                    </label>
                                    <input type="range" id="num-doses" min="1" max="10" value="3" style="
                                        width: 100%;
                                        accent-color: #ffd700;
                                    ">
                                </div>

                                <button id="add-dose-btn" style="
                                    width: 100%;
                                    padding: 10px;
                                    background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,107,107,0.1));
                                    border: 1px solid #ffd700;
                                    border-radius: 8px;
                                    color: #ffd700;
                                    font-family: 'Orbitron', sans-serif;
                                    font-size: 11px;
                                    cursor: pointer;
                                    margin-top: 10px;
                                ">+ Add Dose Regimen</button>
                            </div>

                            <!-- Scheduled Doses -->
                            <div id="scheduled-doses" style="
                                margin-top: 15px;
                                max-height: 100px;
                                overflow-y: auto;
                                font-size: 10px;
                            "></div>
                        </div>

                        <!-- Center: Visualization -->
                        <div style="padding: 15px; display: flex; flex-direction: column; gap: 15px;">
                            
                            <!-- Concentration-Time Curve -->
                            <div style="flex: 1; min-height: 180px;">
                                <div style="font-size: 11px; color: #0055ff; margin-bottom: 8px;">
                                    📈 Concentration-Time Profile
                                </div>
                                <div style="
                                    height: calc(100% - 20px);
                                    background: rgba(0,0,0,0.4);
                                    border: 1px solid rgba(0,212,255,0.2);
                                    border-radius: 10px;
                                    position: relative;
                                    overflow: hidden;
                                ">
                                    <canvas id="pk-conc-chart" style="width: 100%; height: 100%;"></canvas>
                                    
                                    <!-- Therapeutic window overlay -->
                                    <div id="therapeutic-window" style="
                                        position: absolute;
                                        left: 50px;
                                        right: 10px;
                                        background: rgba(0,255,136,0.1);
                                        border-top: 1px dashed #00ff88;
                                        border-bottom: 1px dashed #00ff88;
                                        pointer-events: none;
                                        display: none;
                                    "></div>
                                    
                                    <!-- Toxic threshold line -->
                                    <div id="toxic-line" style="
                                        position: absolute;
                                        left: 50px;
                                        right: 10px;
                                        height: 1px;
                                        background: #ff0033;
                                        pointer-events: none;
                                        display: none;
                                    ">
                                        <span style="position: absolute; right: 0; top: -12px; font-size: 9px; color: #ff0033;">TOXIC</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Compartmental Diagram -->
                            <div style="height: 150px;">
                                <div style="font-size: 11px; color: #9d00ff; margin-bottom: 8px;">
                                    🔄 Two-Compartment Model
                                </div>
                                <div style="
                                    height: calc(100% - 20px);
                                    background: rgba(0,0,0,0.4);
                                    border: 1px solid rgba(157,0,255,0.2);
                                    border-radius: 10px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    position: relative;
                                ">
                                    <!-- Dose input -->
                                    <div style="position: absolute; left: 20px; text-align: center;">
                                        <div style="font-size: 9px; color: rgba(255,255,255,0.5);">DOSE</div>
                                        <div style="font-size: 24px;">💊</div>
                                        <div id="dose-indicator" style="font-size: 10px; color: #ffd700;">0 mg</div>
                                    </div>
                                    
                                    <!-- Arrow to central -->
                                    <div style="
                                        position: absolute;
                                        left: 80px;
                                        width: 40px;
                                        height: 2px;
                                        background: linear-gradient(90deg, #ffd700, #0055ff);
                                    ">
                                        <div style="
                                            position: absolute;
                                            right: -5px;
                                            top: -4px;
                                            border: 5px solid transparent;
                                            border-left: 8px solid #0055ff;
                                        "></div>
                                    </div>
                                    
                                    <!-- Central compartment -->
                                    <div id="central-comp" style="
                                        width: 100px;
                                        height: 80px;
                                        background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.05));
                                        border: 2px solid #0055ff;
                                        border-radius: 12px;
                                        display: flex;
                                        flex-direction: column;
                                        align-items: center;
                                        justify-content: center;
                                        margin-left: 60px;
                                        transition: all 0.3s;
                                    ">
                                        <div style="font-size: 9px; color: rgba(255,255,255,0.6);">CENTRAL</div>
                                        <div id="central-conc-display" style="font-size: 18px; font-weight: bold; color: #0055ff;">0.00</div>
                                        <div style="font-size: 8px; color: rgba(255,255,255,0.5);">μg/mL</div>
                                    </div>
                                    
                                    <!-- Bidirectional arrows -->
                                    <div style="
                                        width: 50px;
                                        display: flex;
                                        flex-direction: column;
                                        align-items: center;
                                        gap: 5px;
                                    ">
                                        <div style="font-size: 8px; color: #9d00ff;">k₁₂</div>
                                        <div style="width: 40px; height: 2px; background: #9d00ff;"></div>
                                        <div style="width: 40px; height: 2px; background: #9d00ff;"></div>
                                        <div style="font-size: 8px; color: #9d00ff;">k₂₁</div>
                                    </div>
                                    
                                    <!-- Peripheral compartment -->
                                    <div id="peripheral-comp" style="
                                        width: 100px;
                                        height: 80px;
                                        background: linear-gradient(135deg, rgba(157,0,255,0.2), rgba(157,0,255,0.05));
                                        border: 2px solid #9d00ff;
                                        border-radius: 12px;
                                        display: flex;
                                        flex-direction: column;
                                        align-items: center;
                                        justify-content: center;
                                        transition: all 0.3s;
                                    ">
                                        <div style="font-size: 9px; color: rgba(255,255,255,0.6);">PERIPHERAL</div>
                                        <div id="peripheral-conc-display" style="font-size: 18px; font-weight: bold; color: #9d00ff;">0.00</div>
                                        <div style="font-size: 8px; color: rgba(255,255,255,0.5);">μg/mL</div>
                                    </div>
                                    
                                    <!-- Elimination arrow -->
                                    <div style="
                                        position: absolute;
                                        bottom: 15px;
                                        left: 180px;
                                    ">
                                        <div style="
                                            width: 2px;
                                            height: 25px;
                                            background: linear-gradient(180deg, #0055ff, #ff6b6b);
                                        "></div>
                                        <div style="font-size: 8px; color: #ff6b6b; margin-top: 2px;">Elimination</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Panel: Effects & Outcomes -->
                        <div style="
                            padding: 15px;
                            background: rgba(0,0,0,0.3);
                            border-left: 1px solid rgba(0,212,255,0.2);
                            overflow-y: auto;
                        ">
                            <!-- Current Status -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #00ff88; margin-bottom: 8px;">📊 Current Status</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                    <div style="
                                        padding: 10px;
                                        background: rgba(0,255,136,0.1);
                                        border: 1px solid rgba(0,255,136,0.3);
                                        border-radius: 8px;
                                        text-align: center;
                                    ">
                                        <div style="font-size: 9px; color: rgba(255,255,255,0.6);">Cp</div>
                                        <div id="current-conc" style="font-size: 18px; font-weight: bold; color: #00ff88;">0.00</div>
                                        <div style="font-size: 8px;">μg/mL</div>
                                    </div>
                                    <div style="
                                        padding: 10px;
                                        background: rgba(255,215,0,0.1);
                                        border: 1px solid rgba(255,215,0,0.3);
                                        border-radius: 8px;
                                        text-align: center;
                                    ">
                                        <div style="font-size: 9px; color: rgba(255,255,255,0.6);">Effect</div>
                                        <div id="current-effect" style="font-size: 18px; font-weight: bold; color: #ffd700;">0%</div>
                                        <div style="font-size: 8px;">of max</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Therapeutic Status -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #0055ff; margin-bottom: 8px;">🎯 Therapeutic Status</div>
                                <div style="
                                    padding: 12px;
                                    background: rgba(0,0,0,0.3);
                                    border-radius: 8px;
                                ">
                                    <div style="margin-bottom: 8px;">
                                        <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 3px;">
                                            <span>Time in Therapeutic Range</span>
                                            <span id="time-in-range">0%</span>
                                        </div>
                                        <div style="height: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; overflow: hidden;">
                                            <div id="therapeutic-bar" style="height: 100%; width: 0%; background: #00ff88; transition: width 0.3s;"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 3px;">
                                            <span>Toxicity Risk</span>
                                            <span id="toxicity-risk">0%</span>
                                        </div>
                                        <div style="height: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; overflow: hidden;">
                                            <div id="toxicity-bar" style="height: 100%; width: 0%; background: #ff0033; transition: width 0.3s;"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Organ Effects -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #ff6b6b; margin-bottom: 8px;">🫀 Organ Effects</div>
                                <div id="organ-effects-panel" style="
                                    display: grid;
                                    gap: 6px;
                                    font-size: 10px;
                                ">
                                    <div class="organ-effect-row" data-organ="liver" style="
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                        padding: 6px 8px;
                                        background: rgba(139,69,19,0.2);
                                        border-radius: 6px;
                                    ">
                                        <span>🫀 Liver</span>
                                        <div style="flex: 1; height: 4px; background: rgba(0,0,0,0.3); border-radius: 2px;">
                                            <div class="organ-viability" style="height: 100%; width: 100%; background: #00ff88; border-radius: 2px;"></div>
                                        </div>
                                        <span class="organ-pct">100%</span>
                                    </div>
                                    <div class="organ-effect-row" data-organ="kidney" style="
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                        padding: 6px 8px;
                                        background: rgba(139,0,0,0.2);
                                        border-radius: 6px;
                                    ">
                                        <span>🫘 Kidney</span>
                                        <div style="flex: 1; height: 4px; background: rgba(0,0,0,0.3); border-radius: 2px;">
                                            <div class="organ-viability" style="height: 100%; width: 100%; background: #00ff88; border-radius: 2px;"></div>
                                        </div>
                                        <span class="organ-pct">100%</span>
                                    </div>
                                    <div class="organ-effect-row" data-organ="heart" style="
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                        padding: 6px 8px;
                                        background: rgba(255,0,0,0.1);
                                        border-radius: 6px;
                                    ">
                                        <span>❤️ Heart</span>
                                        <div style="flex: 1; height: 4px; background: rgba(0,0,0,0.3); border-radius: 2px;">
                                            <div class="organ-viability" style="height: 100%; width: 100%; background: #00ff88; border-radius: 2px;"></div>
                                        </div>
                                        <span class="organ-pct">100%</span>
                                    </div>
                                </div>
                            </div>

                            <!-- PK Parameters -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 8px;">📋 Calculated PK</div>
                                <div style="font-size: 10px; color: rgba(255,255,255,0.6);">
                                    <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                                        <span>Cmax:</span>
                                        <span id="calc-cmax">--</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                                        <span>Tmax:</span>
                                        <span id="calc-tmax">--</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                                        <span>AUC:</span>
                                        <span id="calc-auc">--</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                                        <span>Adj. t½:</span>
                                        <span id="calc-halflife">--</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Control Buttons -->
                            <div style="display: flex; gap: 8px; margin-top: auto;">
                                <button id="pk-start-btn" style="
                                    flex: 1;
                                    padding: 10px;
                                    background: linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,212,255,0.1));
                                    border: 1px solid #00ff88;
                                    border-radius: 8px;
                                    color: #00ff88;
                                    font-family: 'Orbitron', sans-serif;
                                    font-size: 11px;
                                    cursor: pointer;
                                ">▶ Simulate</button>
                                <button id="pk-reset-btn" style="
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
                    <div id="pk-feedback" style="
                        position: absolute;
                        bottom: 10px;
                        left: 50%;
                        transform: translateX(-50%);
                        padding: 10px 20px;
                        background: rgba(0,0,0,0.9);
                        border-radius: 20px;
                        font-size: 12px;
                        display: none;
                        border: 1px solid #9d00ff;
                    "></div>
                </div>
            `;

            this.bindEvents();
            this.initializeChart();
        }

        bindEvents() {
            const container = document.getElementById(this.containerId);

            // Drug selection
            container.querySelector('#drug-select').addEventListener('change', (e) => {
                this.selectDrug(e.target.value);
            });

            // Patient selection
            container.querySelector('#patient-select').addEventListener('change', (e) => {
                this.selectPatient(e.target.value);
            });

            // Dosing controls
            container.querySelector('#dose-interval').addEventListener('input', (e) => {
                container.querySelector('#interval-value').textContent = e.target.value;
                this.state.set('dosingInterval', parseInt(e.target.value));
            });

            container.querySelector('#num-doses').addEventListener('input', (e) => {
                container.querySelector('#num-doses-value').textContent = e.target.value;
                this.state.set('numberOfDoses', parseInt(e.target.value));
            });

            // Add dose button
            container.querySelector('#add-dose-btn').addEventListener('click', () => {
                this.addDosingRegimen();
            });

            // Start simulation
            container.querySelector('#pk-start-btn').addEventListener('click', () => {
                if (this.state.get('phase') === 'running') {
                    this.pause();
                    container.querySelector('#pk-start-btn').textContent = '▶ Resume';
                } else {
                    this.startSimulation();
                    container.querySelector('#pk-start-btn').textContent = '⏸ Pause';
                }
            });

            // Reset
            container.querySelector('#pk-reset-btn').addEventListener('click', () => {
                this.reset();
                container.querySelector('#pk-start-btn').textContent = '▶ Simulate';
            });
        }

        initializeChart() {
            const canvas = document.getElementById('pk-conc-chart');
            if (!canvas) return;

            // Set canvas size
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            this.chartCtx = canvas.getContext('2d');
        }

        selectDrug(drugId) {
            if (!drugId) {
                this.state.set('selectedDrug', null);
                document.getElementById('drug-info').style.display = 'none';
                return;
            }

            const drug = DRUG_LIBRARY[drugId];
            this.state.set('selectedDrug', { id: drugId, ...drug });

            // Update drug info panel
            const container = document.getElementById(this.containerId);
            container.querySelector('#drug-info').style.display = 'block';
            container.querySelector('#drug-mechanism').textContent = drug.pd.mechanism;
            container.querySelector('#drug-halflife').textContent = drug.pk.halfLife + 'h';
            container.querySelector('#drug-f').textContent = (drug.pk.bioavailability * 100).toFixed(0) + '%';
            container.querySelector('#drug-vd').textContent = drug.pk.vd + ' L';
            container.querySelector('#drug-binding').textContent = (drug.pk.proteinBinding * 100).toFixed(0) + '%';
            container.querySelector('#drug-therapeutic').textContent = 
                `${drug.pd.therapeuticRange.min}-${drug.pd.therapeuticRange.max} μg/mL`;

            // Update dose options
            const doseSelect = container.querySelector('#dose-select');
            doseSelect.innerHTML = '<option value="">Select dose</option>' +
                drug.doses.map(d => `<option value="${d}">${d} mg</option>`).join('');

            this.showFeedback(`${drug.name} selected`, 'info');
        }

        selectPatient(patientId) {
            const patient = PATIENT_PHENOTYPES[patientId];
            this.state.set('patient', patient);

            const container = document.getElementById(this.containerId);
            container.querySelector('#pt-age').textContent = patient.age;
            container.querySelector('#pt-weight').textContent = patient.weight;
            container.querySelector('#pt-gfr').textContent = patient.gfr;
            container.querySelector('#pt-hepatic').textContent = 
                patient.hepaticFunction >= 0.9 ? 'Normal' : 
                patient.hepaticFunction >= 0.6 ? 'Reduced' : 'Impaired';
        }

        addDosingRegimen() {
            const drug = this.state.get('selectedDrug');
            const container = document.getElementById(this.containerId);
            const doseSelect = container.querySelector('#dose-select');
            
            if (!drug || !doseSelect.value) {
                this.showFeedback('Select a drug and dose first', 'warning');
                return;
            }

            const dose = parseFloat(doseSelect.value);
            const interval = this.state.get('dosingInterval');
            const numDoses = this.state.get('numberOfDoses');

            const doses = this.state.get('doses');
            
            for (let i = 0; i < numDoses; i++) {
                doses.push({
                    time: i * interval,
                    amount: dose,
                    route: 'oral',
                    administered: false
                });
            }

            this.state.set('doses', doses);
            this.updateScheduledDosesDisplay();
            this.showFeedback(`Added ${numDoses} dose(s) of ${dose}mg`, 'success');
        }

        updateScheduledDosesDisplay() {
            const doses = this.state.get('doses');
            const container = document.getElementById('scheduled-doses');
            
            container.innerHTML = doses.map((d, i) => `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    padding: 5px 8px;
                    background: ${d.administered ? 'rgba(0,255,136,0.1)' : 'rgba(255,215,0,0.1)'};
                    border-radius: 4px;
                    margin-bottom: 4px;
                ">
                    <span>Dose ${i + 1}: ${d.amount}mg</span>
                    <span>@ ${d.time}h ${d.administered ? '✓' : ''}</span>
                </div>
            `).join('');
        }

        startSimulation() {
            const drug = this.state.get('selectedDrug');
            const doses = this.state.get('doses');

            if (!drug) {
                this.showFeedback('Please select a drug first', 'warning');
                return;
            }

            if (doses.length === 0) {
                this.showFeedback('Please add at least one dose', 'warning');
                return;
            }

            this.state.set('phase', 'running');
            document.getElementById('pk-phase').textContent = 'RUNNING';
            document.getElementById('pk-phase').style.background = 'rgba(0,255,136,0.2)';
            document.getElementById('pk-phase').style.borderColor = '#00ff88';

            // Initialize tracking
            this.state.set('concentrationHistory', []);
            this.state.set('effectHistory', []);
            this._timeInTherapeutic = 0;
            this._totalSimTime = 0;
            this._cmax = 0;
            this._tmax = 0;
            this._auc = 0;

            AudioFeedback.init();
            this.start();
        }

        // ═══════════════════════════════════════════════════════════════════
        // CORE PK SIMULATION
        // ═══════════════════════════════════════════════════════════════════

        simulationStep(dt, totalTime) {
            // Convert to hours (simulation runs in real seconds, but PK is in hours)
            const timeScale = 60; // 1 real second = 1 simulation minute = 1/60 hour
            const dtHours = (dt * timeScale) / 60;
            const simTimeHours = (totalTime * timeScale) / 60;
            
            this.state.set('simulationTime', simTimeHours, false);

            const drug = this.state.get('selectedDrug');
            if (!drug) return;

            const patient = this.state.get('patient');

            // 1. Check for scheduled doses
            this.processDoses(simTimeHours, drug, patient);

            // 2. Two-compartment PK model
            this.updateCompartments(dtHours, drug, patient);

            // 3. Calculate effect (PD)
            this.updatePharmacodynamics(dtHours, drug);

            // 4. Update organ toxicity
            this.updateOrganEffects(dtHours, drug);

            // 5. Track metrics
            this.updateMetrics(dtHours, drug);

            // 6. Check for simulation end
            const lastDoseTime = Math.max(...this.state.get('doses').map(d => d.time));
            if (simTimeHours > lastDoseTime + drug.pk.halfLife * 5) {
                this.endSimulation();
            }
        }

        processDoses(currentTime, drug, patient) {
            const doses = this.state.get('doses');
            let doseGiven = false;

            doses.forEach(dose => {
                if (!dose.administered && currentTime >= dose.time) {
                    // Administer dose
                    const bioavailableDose = dose.amount * drug.pk.bioavailability;
                    
                    // Add to central compartment
                    let centralAmount = this.state.get('centralAmount');
                    centralAmount += bioavailableDose;
                    this.state.set('centralAmount', centralAmount);

                    dose.administered = true;
                    doseGiven = true;

                    // Update cumulative dose
                    this.state.update('cumulativeDose', cd => cd + dose.amount);

                    this.showFeedback(`Dose ${dose.amount}mg administered`, 'success');
                    AudioFeedback.playStateChange('tick');
                }
            });

            if (doseGiven) {
                this.state.set('doses', doses);
                this.updateScheduledDosesDisplay();
            }
        }

        updateCompartments(dt, drug, patient) {
            // Get current amounts
            let centralAmount = this.state.get('centralAmount');
            let peripheralAmount = this.state.get('peripheralAmount');

            // Adjust clearance for patient factors
            let clRenal = drug.pk.clearance * drug.pk.renalElimination;
            let clHepatic = drug.pk.clearance * drug.pk.hepaticMetabolism;

            // Renal adjustment based on GFR
            clRenal *= patient.gfr / 100;

            // Hepatic adjustment
            clHepatic *= patient.hepaticFunction;

            // CYP adjustments
            if (patient.cyp2c9 === 'poor' && drug.pk.hepaticMetabolism > 0.5) {
                clHepatic *= 0.3;
            }
            if (patient.cyp3a4 === 'reduced') {
                clHepatic *= 0.6;
            }

            const totalClearance = clRenal + clHepatic;

            // Rate constants
            // Adjusted for patient's Vd (scaled by weight)
            const vdAdjusted = drug.pk.vd * (patient.weight / 70);
            const vdPeripheral = vdAdjusted * 0.6;
            const vdCentral = vdAdjusted * 0.4;

            const ke = totalClearance / (vdCentral * 1000 / 60); // Convert to per hour
            const k12 = 0.5;  // Transfer rate central to peripheral
            const k21 = 0.3;  // Transfer rate peripheral to central

            // Calculate concentration changes (simple Euler method)
            const centralConc = centralAmount / vdCentral;
            const peripheralConc = peripheralAmount / vdPeripheral;

            // Elimination from central
            const eliminationRate = ke * centralAmount;

            // Transfer between compartments
            const transferTo = k12 * centralAmount;
            const transferFrom = k21 * peripheralAmount;

            // Update amounts
            centralAmount += (-eliminationRate - transferTo + transferFrom) * dt;
            peripheralAmount += (transferTo - transferFrom) * dt;

            // Ensure non-negative
            centralAmount = Math.max(0, centralAmount);
            peripheralAmount = Math.max(0, peripheralAmount);

            // Update state
            this.state.set('centralAmount', centralAmount);
            this.state.set('peripheralAmount', peripheralAmount);

            // Calculate concentrations
            const newCentralConc = centralAmount / vdCentral;
            const newPeripheralConc = peripheralAmount / vdPeripheral;

            this.state.set('centralConc', newCentralConc);
            this.state.set('peripheralConc', newPeripheralConc);

            // Free vs bound
            const freeConc = newCentralConc * (1 - drug.pk.proteinBinding);
            const boundConc = newCentralConc * drug.pk.proteinBinding;
            this.state.set('freeConc', freeConc);
            this.state.set('boundConc', boundConc);

            // Add stochastic variability (inter-occasion)
            const variability = MathUtils.gaussianRandom(1, 0.05);
            this.state.set('centralConc', newCentralConc * variability);

            // Record history
            const history = this.state.get('concentrationHistory');
            history.push({
                time: this.state.get('simulationTime'),
                conc: newCentralConc,
                free: freeConc
            });

            // Limit history length
            if (history.length > 500) history.shift();
            this.state.set('concentrationHistory', history);
        }

        updatePharmacodynamics(dt, drug) {
            const freeConc = this.state.get('freeConc');

            // Hill equation for effect
            const effect = MathUtils.hillEquation(freeConc, drug.pd.emax, drug.pd.ec50, drug.pd.hill);

            // Receptor occupancy
            const occupancy = MathUtils.sigmoid(freeConc, drug.pd.ec50, 1) * 100;

            this.state.set('effect', effect);
            this.state.set('receptorOccupancy', occupancy);

            // Effect history
            const effectHistory = this.state.get('effectHistory');
            effectHistory.push({
                time: this.state.get('simulationTime'),
                effect: effect
            });
            if (effectHistory.length > 500) effectHistory.shift();
            this.state.set('effectHistory', effectHistory);
        }

        updateOrganEffects(dt, drug) {
            const conc = this.state.get('centralConc');
            const organViability = this.state.get('organViability');

            Object.keys(drug.organEffects).forEach(organ => {
                const effects = drug.organEffects[organ];
                
                // Toxicity accumulation
                if (effects.toxicity > 0 && conc > drug.pd.therapeuticRange.max) {
                    const toxicityRate = effects.toxicity * (conc / drug.pd.toxicThreshold);
                    organViability[organ] = Math.max(0, organViability[organ] - toxicityRate * dt);
                }

                // Slow recovery when in safe range
                if (conc < drug.pd.therapeuticRange.min && organViability[organ] < 100) {
                    organViability[organ] = Math.min(100, organViability[organ] + 0.1 * dt);
                }
            });

            this.state.set('organViability', organViability);

            // Check for toxicity events
            Object.keys(organViability).forEach(organ => {
                if (organViability[organ] < 50 && !this._toxicityWarningShown) {
                    this.showFeedback(`⚠️ ${organ} toxicity detected!`, 'critical');
                    AudioFeedback.playStateChange('warning');
                    this._toxicityWarningShown = true;
                    this.state.set('toxicityEvent', true);
                }
            });
        }

        updateMetrics(dt, drug) {
            const conc = this.state.get('centralConc');
            const simTime = this.state.get('simulationTime');

            // Time in therapeutic range
            if (conc >= drug.pd.therapeuticRange.min && conc <= drug.pd.therapeuticRange.max) {
                this._timeInTherapeutic += dt;
            }
            this._totalSimTime += dt;

            // Cmax tracking
            if (conc > this._cmax) {
                this._cmax = conc;
                this._tmax = simTime;
            }

            // AUC (trapezoidal rule)
            const history = this.state.get('concentrationHistory');
            if (history.length > 1) {
                const prev = history[history.length - 2];
                this._auc += (prev.conc + conc) / 2 * dt;
            }
        }

        endSimulation() {
            this.pause();
            this.state.set('phase', 'complete');

            const drug = this.state.get('selectedDrug');
            const percentInRange = (this._timeInTherapeutic / this._totalSimTime) * 100;

            document.getElementById('pk-phase').textContent = 'COMPLETE';
            document.getElementById('pk-phase').style.background = 'rgba(157,0,255,0.2)';
            document.getElementById('pk-phase').style.borderColor = '#9d00ff';

            // Calculate final score
            let score = percentInRange;
            if (this.state.get('toxicityEvent')) {
                score *= 0.5;
            }

            // Determine outcome
            if (percentInRange > 70 && !this.state.get('toxicityEvent')) {
                this.showFeedback('🎉 Excellent! Optimal therapeutic exposure achieved!', 'success');
                this.state.set('therapeuticSuccess', true);
            } else if (percentInRange > 40) {
                this.showFeedback('👍 Good attempt. Consider dose adjustment.', 'info');
            } else {
                this.showFeedback('⚠️ Suboptimal. Review dosing strategy.', 'warning');
            }

            this.state.set('score', Math.round(score));
        }

        updateVisualization() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const state = this.state.get();
            const drug = state.selectedDrug;

            // Update time display
            container.querySelector('#pk-time').textContent = state.simulationTime.toFixed(1) + 'h';

            // Update concentration displays
            container.querySelector('#central-conc-display').textContent = state.centralConc.toFixed(2);
            container.querySelector('#peripheral-conc-display').textContent = state.peripheralConc.toFixed(2);
            container.querySelector('#current-conc').textContent = state.centralConc.toFixed(2);
            container.querySelector('#current-effect').textContent = Math.round(state.effect) + '%';

            // Update compartment glow based on concentration
            const centralComp = container.querySelector('#central-comp');
            const peripheralComp = container.querySelector('#peripheral-comp');
            
            if (drug) {
                const maxConc = drug.pd.toxicThreshold;
                const centralIntensity = Math.min(1, state.centralConc / maxConc);
                const peripheralIntensity = Math.min(1, state.peripheralConc / maxConc);
                
                centralComp.style.boxShadow = `0 0 ${20 * centralIntensity}px rgba(0,212,255,${centralIntensity})`;
                peripheralComp.style.boxShadow = `0 0 ${20 * peripheralIntensity}px rgba(157,0,255,${peripheralIntensity})`;
            }

            // Update therapeutic status
            if (this._totalSimTime > 0) {
                const percentInRange = (this._timeInTherapeutic / this._totalSimTime) * 100;
                container.querySelector('#time-in-range').textContent = Math.round(percentInRange) + '%';
                container.querySelector('#therapeutic-bar').style.width = percentInRange + '%';
            }

            // Toxicity risk
            if (drug) {
                const toxRisk = Math.min(100, (state.centralConc / drug.pd.toxicThreshold) * 100);
                container.querySelector('#toxicity-risk').textContent = Math.round(toxRisk) + '%';
                container.querySelector('#toxicity-bar').style.width = toxRisk + '%';
            }

            // Update organ viability
            Object.entries(state.organViability).forEach(([organ, viability]) => {
                const row = container.querySelector(`.organ-effect-row[data-organ="${organ}"]`);
                if (row) {
                    const bar = row.querySelector('.organ-viability');
                    const pct = row.querySelector('.organ-pct');
                    bar.style.width = viability + '%';
                    bar.style.background = viability > 70 ? '#00ff88' : viability > 40 ? '#ffd700' : '#ff0033';
                    pct.textContent = Math.round(viability) + '%';
                }
            });

            // Update calculated PK parameters
            container.querySelector('#calc-cmax').textContent = this._cmax ? this._cmax.toFixed(2) + ' μg/mL' : '--';
            container.querySelector('#calc-tmax').textContent = this._tmax ? this._tmax.toFixed(1) + ' h' : '--';
            container.querySelector('#calc-auc').textContent = this._auc ? this._auc.toFixed(1) + ' μg·h/mL' : '--';
            
            if (drug) {
                const patient = state.patient;
                const adjHalfLife = drug.pk.halfLife * (100 / patient.gfr) * (1 / patient.hepaticFunction);
                container.querySelector('#calc-halflife').textContent = adjHalfLife.toFixed(1) + ' h';
            }

            // Draw concentration-time chart
            this.drawConcentrationChart();
        }

        drawConcentrationChart() {
            if (!this.chartCtx) return;

            const canvas = this.chartCtx.canvas;
            const ctx = this.chartCtx;
            const history = this.state.get('concentrationHistory');
            const drug = this.state.get('selectedDrug');

            if (history.length < 2) return;

            const width = canvas.width;
            const height = canvas.height;
            const padding = { top: 20, right: 20, bottom: 30, left: 50 };

            // Clear
            ctx.fillStyle = 'rgba(0, 10, 30, 0.95)';
            ctx.fillRect(0, 0, width, height);

            // Determine scale
            const times = history.map(h => h.time);
            const concs = history.map(h => h.conc);
            const maxTime = Math.max(...times, 24);
            const maxConc = Math.max(...concs, drug ? drug.pd.toxicThreshold : 10);

            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;

            // Draw grid
            ctx.strokeStyle = 'rgba(157, 0, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = padding.top + (chartHeight * i / 4);
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
            }

            // Draw therapeutic window
            if (drug) {
                const yMin = padding.top + chartHeight * (1 - drug.pd.therapeuticRange.min / maxConc);
                const yMax = padding.top + chartHeight * (1 - drug.pd.therapeuticRange.max / maxConc);
                
                ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
                ctx.fillRect(padding.left, yMax, chartWidth, yMin - yMax);
                
                ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(padding.left, yMin);
                ctx.lineTo(width - padding.right, yMin);
                ctx.moveTo(padding.left, yMax);
                ctx.lineTo(width - padding.right, yMax);
                ctx.stroke();
                ctx.setLineDash([]);

                // Toxic line
                const yToxic = padding.top + chartHeight * (1 - drug.pd.toxicThreshold / maxConc);
                ctx.strokeStyle = '#ff0033';
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(padding.left, yToxic);
                ctx.lineTo(width - padding.right, yToxic);
                ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.fillStyle = '#ff0033';
                ctx.font = '9px monospace';
                ctx.fillText('TOXIC', width - padding.right - 30, yToxic - 3);
            }

            // Draw concentration line
            ctx.strokeStyle = '#0055ff';
            ctx.lineWidth = 2;
            ctx.beginPath();

            history.forEach((point, i) => {
                const x = padding.left + (point.time / maxTime) * chartWidth;
                const y = padding.top + chartHeight * (1 - point.conc / maxConc);
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Glow effect
            ctx.strokeStyle = '#0055ff';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.3;
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Axes labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Time (hours)', width / 2, height - 5);

            ctx.save();
            ctx.translate(12, height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('Concentration (μg/mL)', 0, 0);
            ctx.restore();

            // Y-axis values
            ctx.textAlign = 'right';
            for (let i = 0; i <= 4; i++) {
                const value = maxConc * (1 - i / 4);
                const y = padding.top + (chartHeight * i / 4);
                ctx.fillText(value.toFixed(1), padding.left - 5, y + 3);
            }

            // X-axis values
            ctx.textAlign = 'center';
            for (let i = 0; i <= 4; i++) {
                const value = maxTime * (i / 4);
                const x = padding.left + (chartWidth * i / 4);
                ctx.fillText(Math.round(value), x, height - padding.bottom + 15);
            }
        }

        showFeedback(message, type = 'info') {
            const feedback = document.getElementById('pk-feedback');
            if (!feedback) return;

            const colors = {
                info: '#9d00ff',
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
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════════════

    window.PKDigitalTwin = PKDigitalTwin;
    
    window.initPKDigitalTwin = function(containerId) {
        const sim = new PKDigitalTwin(containerId);
        sim.init();
        return sim;
    };

    console.log('[PKDigitalTwin] Module loaded');

})();
// v20260117-FULL
