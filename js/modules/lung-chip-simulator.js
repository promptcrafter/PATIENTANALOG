/**
 * PatientAnalog.com - Module #1: Lung-on-Chip Respiratory Dynamics Simulator
 * Museum-Grade Scientific Simulation
 * 
 * @version 1.0.0
 * @requires museum-grade-engine.js
 * @requires Three.js r128+
 * 
 * SCIENTIFIC MODEL:
 * - Alveolar gas exchange (O₂/CO₂ partial pressures)
 * - Surfactant dynamics and depletion
 * - Epithelial barrier integrity
 * - Inflammatory cytokine cascades
 * - Ventilator-induced lung injury
 * - Drug pharmacokinetics (anti-inflammatory, surfactant, bronchodilators)
 */

(function() {
    'use strict';

    const { MathUtils, StateManager, SimulationClock, VisualizationController, 
            AudioFeedback, SimulationModule, PerformanceDetector } = window.MuseumGradeEngine;

    // ═══════════════════════════════════════════════════════════════════════
    // PHYSIOLOGICAL CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    const PHYSIOLOGY = {
        // Normal ranges
        PAO2_NORMAL: 100,        // mmHg - alveolar O2
        PACO2_NORMAL: 40,        // mmHg - alveolar CO2
        SPO2_NORMAL: 98,         // % - blood O2 saturation
        
        // Critical thresholds
        SPO2_HYPOXIA: 90,
        SPO2_SEVERE_HYPOXIA: 85,
        SPO2_CRITICAL: 75,
        PACO2_HYPERCAPNIA: 50,
        
        // Surfactant
        SURFACTANT_NORMAL: 100,
        SURFACTANT_CRITICAL: 20,
        SURFACTANT_DEPLETION_RATE: 0.5,  // % per second without production
        SURFACTANT_PRODUCTION_RATE: 0.3, // % per second with healthy type II cells
        
        // Barrier integrity
        BARRIER_NORMAL: 100,
        BARRIER_CRITICAL: 30,
        BARRIER_HEAL_RATE: 0.1,
        
        // Breathing
        NORMAL_RR: 14,           // breaths per minute
        NORMAL_TV: 500,          // mL tidal volume
        MIN_RR: 8,
        MAX_RR: 35,
        
        // Inflammation
        IL6_NORMAL: 5,           // pg/mL
        IL6_ELEVATED: 20,
        IL6_STORM: 100,
        TNF_NORMAL: 10,
        TNF_ELEVATED: 50,
        
        // Gas exchange
        DIFFUSION_CAPACITY_NORMAL: 25,  // mL O2/mmHg/min
        VENTILATION_PERFUSION_NORMAL: 0.8
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DRUG DATABASE
    // ═══════════════════════════════════════════════════════════════════════

    const DRUGS = {
        dexamethasone: {
            name: 'Dexamethasone',
            type: 'anti-inflammatory',
            halfLife: 36,          // hours
            onsetTime: 2,          // hours
            peakEffect: 6,         // hours
            effects: {
                il6Reduction: 0.6,      // 60% reduction at peak
                tnfReduction: 0.5,
                barrierHealBoost: 0.3,
                immuneSuppression: 0.4  // Impairs pathogen clearance
            },
            sideEffects: {
                hyperglycemia: 0.3,
                immunocompromise: 0.4
            }
        },
        surfactantReplacement: {
            name: 'Exogenous Surfactant',
            type: 'surfactant',
            halfLife: 6,
            onsetTime: 0.5,
            peakEffect: 1,
            effects: {
                surfactantBoost: 40     // Direct addition
            },
            sideEffects: {}
        },
        salbutamol: {
            name: 'Salbutamol',
            type: 'bronchodilator',
            halfLife: 4,
            onsetTime: 0.25,
            peakEffect: 0.5,
            effects: {
                airwayResistanceReduction: 0.5,
                mucociliaryBoost: 0.2
            },
            sideEffects: {
                tachycardia: 0.2
            }
        },
        oxygen: {
            name: 'Supplemental O₂',
            type: 'respiratory-support',
            halfLife: 0,
            onsetTime: 0,
            peakEffect: 0,
            effects: {
                fio2Boost: 0            // Calculated separately
            },
            sideEffects: {
                oxidativeStress: 0.1    // At high FiO2
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LUNG CHIP SIMULATOR CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class LungChipSimulator extends SimulationModule {
        
        getInitialState() {
            return {
                // Gas exchange
                pao2: PHYSIOLOGY.PAO2_NORMAL,
                paco2: PHYSIOLOGY.PACO2_NORMAL,
                spo2: PHYSIOLOGY.SPO2_NORMAL,
                fio2: 21,                    // Room air = 21%
                
                // Surfactant system
                surfactant: PHYSIOLOGY.SURFACTANT_NORMAL,
                surfactantProductionRate: PHYSIOLOGY.SURFACTANT_PRODUCTION_RATE,
                
                // Epithelial barrier
                barrierIntegrity: PHYSIOLOGY.BARRIER_NORMAL,
                edemaLevel: 0,
                
                // Inflammation
                il6: PHYSIOLOGY.IL6_NORMAL,
                tnfAlpha: PHYSIOLOGY.TNF_NORMAL,
                inflammationScore: 0,
                
                // Breathing mechanics
                respiratoryRate: PHYSIOLOGY.NORMAL_RR,
                tidalVolume: PHYSIOLOGY.NORMAL_TV,
                minuteVentilation: PHYSIOLOGY.NORMAL_RR * PHYSIOLOGY.NORMAL_TV / 1000,
                airwayResistance: 1,         // Normalized
                compliance: 1,               // Normalized
                
                // Ventilator (if used)
                ventilatorActive: false,
                peep: 5,                     // cmH2O
                pip: 20,                     // Peak inspiratory pressure
                ventMode: 'AC',              // Assist-control
                
                // User breathing (rhythm game element)
                breathPhase: 'rest',         // 'inhale', 'exhale', 'rest'
                breathDepth: 0,              // 0-100
                breathingEfficiency: 1,
                
                // Pathogen/stress
                pathogenLoad: 0,
                stressorType: 'none',        // 'infection', 'particulate', 'toxic'
                
                // Drug concentrations
                drugs: {},
                
                // Outcomes
                lungDamage: 0,               // Cumulative irreversible damage
                timeInHypoxia: 0,
                gamePhase: 'tutorial',       // 'tutorial', 'scenario', 'advanced'
                score: 0,
                scenarioTime: 0
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            const tier = PerformanceDetector.detect().tier;

            container.innerHTML = `
                <div class="lung-sim-container" style="
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #020810 0%, #0a1525 50%, #051020 100%);
                    border-radius: 16px;
                    overflow: hidden;
                    position: relative;
                    font-family: 'Orbitron', 'Segoe UI', sans-serif;
                    color: #e0f2fe;
                ">
                    <!-- Header -->
                    <div class="sim-header" style="
                        padding: 15px 20px;
                        background: linear-gradient(90deg, rgba(0,212,255,0.1), rgba(157,0,255,0.1));
                        border-bottom: 1px solid rgba(0,212,255,0.2);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h3 style="margin: 0; font-size: 16px; color: #0055ff;">
                                🫁 Lung-on-Chip Respiratory Dynamics
                            </h3>
                            <p style="margin: 3px 0 0; font-size: 11px; color: rgba(255,255,255,0.6);">
                                Alveolar Gas Exchange Simulator
                            </p>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span id="lung-phase" style="
                                padding: 4px 12px;
                                background: rgba(0,255,136,0.2);
                                border: 1px solid #00ff88;
                                border-radius: 12px;
                                font-size: 10px;
                                color: #00ff88;
                            ">TUTORIAL</span>
                            <span id="lung-time" style="font-size: 12px; color: #ffd700;">00:00</span>
                        </div>
                    </div>

                    <!-- Main Content Area -->
                    <div style="display: grid; grid-template-columns: 1fr 300px; height: calc(100% - 60px);">
                        
                        <!-- Left: 3D Visualization -->
                        <div style="position: relative; padding: 15px;">
                            <div id="lung-3d-view" style="
                                width: 100%;
                                height: 280px;
                                background: radial-gradient(ellipse at center, rgba(0,50,100,0.3) 0%, transparent 70%);
                                border: 1px solid rgba(0,212,255,0.2);
                                border-radius: 12px;
                                position: relative;
                                overflow: hidden;
                            ">
                                <!-- Alveolus Visualization -->
                                <div id="alveolus-viz" style="
                                    position: absolute;
                                    top: 50%;
                                    left: 50%;
                                    transform: translate(-50%, -50%);
                                    width: 200px;
                                    height: 200px;
                                ">
                                    <!-- Outer membrane -->
                                    <div id="alveolus-membrane" style="
                                        position: absolute;
                                        width: 100%;
                                        height: 100%;
                                        border-radius: 50%;
                                        background: radial-gradient(ellipse at 30% 30%, 
                                            rgba(255,150,150,0.6), 
                                            rgba(180,80,80,0.4));
                                        box-shadow: 
                                            inset 0 0 30px rgba(255,100,100,0.3),
                                            0 0 40px rgba(255,100,100,0.2);
                                        transition: all 0.3s ease;
                                    "></div>
                                    
                                    <!-- Surfactant layer -->
                                    <div id="surfactant-layer" style="
                                        position: absolute;
                                        width: 90%;
                                        height: 90%;
                                        top: 5%;
                                        left: 5%;
                                        border-radius: 50%;
                                        border: 3px solid rgba(0,255,255,0.5);
                                        box-shadow: inset 0 0 20px rgba(0,255,255,0.3);
                                        transition: all 0.3s ease;
                                    "></div>
                                    
                                    <!-- Air space (lumen) -->
                                    <div id="alveolus-lumen" style="
                                        position: absolute;
                                        width: 70%;
                                        height: 70%;
                                        top: 15%;
                                        left: 15%;
                                        border-radius: 50%;
                                        background: radial-gradient(ellipse at center,
                                            rgba(100,200,255,0.4),
                                            rgba(50,100,200,0.2));
                                        transition: all 0.5s ease;
                                    "></div>
                                    
                                    <!-- Gas particles container -->
                                    <div id="gas-particles" style="
                                        position: absolute;
                                        width: 100%;
                                        height: 100%;
                                        pointer-events: none;
                                    "></div>
                                    
                                    <!-- Capillary blood flow -->
                                    <div id="capillary-flow" style="
                                        position: absolute;
                                        bottom: -20px;
                                        left: 10%;
                                        width: 80%;
                                        height: 25px;
                                        background: linear-gradient(90deg, 
                                            rgba(139,0,0,0.8),
                                            rgba(200,0,0,0.6),
                                            rgba(139,0,0,0.8));
                                        border-radius: 12px;
                                        overflow: hidden;
                                    ">
                                        <div id="blood-cells" style="
                                            width: 200%;
                                            height: 100%;
                                            background: repeating-linear-gradient(90deg,
                                                transparent 0px,
                                                rgba(255,0,0,0.5) 5px,
                                                transparent 10px
                                            );
                                            animation: bloodFlow 2s linear infinite;
                                        "></div>
                                    </div>
                                </div>
                                
                                <!-- Gas exchange indicators -->
                                <div style="position: absolute; top: 15px; left: 15px;">
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                        <span style="width: 12px; height: 12px; background: #0055ff; border-radius: 50%;"></span>
                                        <span style="font-size: 11px;">O₂ ↓</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="width: 12px; height: 12px; background: #ff6b6b; border-radius: 50%;"></span>
                                        <span style="font-size: 11px;">CO₂ ↑</span>
                                    </div>
                                </div>
                                
                                <!-- Edema indicator -->
                                <div id="edema-overlay" style="
                                    position: absolute;
                                    bottom: 0;
                                    left: 0;
                                    right: 0;
                                    height: 0%;
                                    background: linear-gradient(to top, 
                                        rgba(255,200,100,0.4),
                                        transparent);
                                    pointer-events: none;
                                    transition: height 1s ease;
                                "></div>
                            </div>

                            <!-- Breathing Control -->
                            <div style="margin-top: 15px; text-align: center;">
                                <p style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 10px;">
                                    Hold to inhale, release to exhale. Maintain rhythm!
                                </p>
                                <div style="display: flex; justify-content: center; gap: 15px; align-items: center;">
                                    <button id="breath-btn" style="
                                        width: 120px;
                                        height: 50px;
                                        background: linear-gradient(135deg, rgba(0,212,255,0.3), rgba(0,255,136,0.2));
                                        border: 2px solid #0055ff;
                                        border-radius: 25px;
                                        color: #fff;
                                        font-family: 'Orbitron', sans-serif;
                                        font-size: 14px;
                                        cursor: pointer;
                                        transition: all 0.2s;
                                    ">🌬️ INHALE</button>
                                    
                                    <div style="width: 150px;">
                                        <div style="
                                            height: 20px;
                                            background: rgba(0,0,0,0.3);
                                            border-radius: 10px;
                                            overflow: hidden;
                                            border: 1px solid rgba(0,212,255,0.3);
                                        ">
                                            <div id="breath-bar" style="
                                                height: 100%;
                                                width: 50%;
                                                background: linear-gradient(90deg, #0055ff, #00ff88);
                                                border-radius: 10px;
                                                transition: width 0.1s linear;
                                            "></div>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; font-size: 9px; color: rgba(255,255,255,0.5); margin-top: 3px;">
                                            <span>Empty</span>
                                            <span>Full</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Drug Administration Panel -->
                            <div style="
                                margin-top: 15px;
                                padding: 12px;
                                background: rgba(0,0,0,0.3);
                                border-radius: 10px;
                                border: 1px solid rgba(157,0,255,0.3);
                            ">
                                <div style="font-size: 11px; color: #9d00ff; margin-bottom: 10px;">
                                    💊 Drug Administration
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                                    <button class="drug-btn" data-drug="dexamethasone" style="
                                        padding: 8px;
                                        background: rgba(255,215,0,0.1);
                                        border: 1px solid rgba(255,215,0,0.3);
                                        border-radius: 6px;
                                        color: #ffd700;
                                        font-size: 10px;
                                        cursor: pointer;
                                    ">Dexamethasone</button>
                                    <button class="drug-btn" data-drug="surfactantReplacement" style="
                                        padding: 8px;
                                        background: rgba(0,255,255,0.1);
                                        border: 1px solid rgba(0,255,255,0.3);
                                        border-radius: 6px;
                                        color: #0055ff;
                                        font-size: 10px;
                                        cursor: pointer;
                                    ">Surfactant</button>
                                    <button class="drug-btn" data-drug="salbutamol" style="
                                        padding: 8px;
                                        background: rgba(0,255,136,0.1);
                                        border: 1px solid rgba(0,255,136,0.3);
                                        border-radius: 6px;
                                        color: #00ff88;
                                        font-size: 10px;
                                        cursor: pointer;
                                    ">Salbutamol</button>
                                    <div style="display: flex; align-items: center; gap: 5px;">
                                        <span style="font-size: 10px; color: rgba(255,255,255,0.6);">FiO₂:</span>
                                        <input type="range" id="fio2-slider" min="21" max="100" value="21" style="
                                            flex: 1;
                                            accent-color: #0055ff;
                                        ">
                                        <span id="fio2-value" style="font-size: 10px; color: #0055ff; width: 30px;">21%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Dashboard -->
                        <div style="
                            background: rgba(0,0,0,0.3);
                            border-left: 1px solid rgba(0,212,255,0.2);
                            padding: 15px;
                            display: flex;
                            flex-direction: column;
                            gap: 12px;
                            overflow-y: auto;
                        ">
                            <!-- Vital Signs -->
                            <div class="dashboard-section">
                                <div style="font-size: 11px; color: #0055ff; margin-bottom: 8px;">
                                    📊 Vital Signs
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                    <div class="vital-box" style="
                                        padding: 10px;
                                        background: rgba(0,255,136,0.1);
                                        border: 1px solid rgba(0,255,136,0.3);
                                        border-radius: 8px;
                                        text-align: center;
                                    ">
                                        <div style="font-size: 9px; color: rgba(255,255,255,0.6);">SpO₂</div>
                                        <div id="spo2-value" style="font-size: 24px; font-weight: bold; color: #00ff88;">98%</div>
                                    </div>
                                    <div class="vital-box" style="
                                        padding: 10px;
                                        background: rgba(255,215,0,0.1);
                                        border: 1px solid rgba(255,215,0,0.3);
                                        border-radius: 8px;
                                        text-align: center;
                                    ">
                                        <div style="font-size: 9px; color: rgba(255,255,255,0.6);">RR</div>
                                        <div id="rr-value" style="font-size: 24px; font-weight: bold; color: #ffd700;">14</div>
                                    </div>
                                </div>
                                
                                <!-- SpO2 Time Series -->
                                <div style="margin-top: 10px;">
                                    <canvas id="spo2-chart" width="270" height="80" style="width: 100%;"></canvas>
                                </div>
                            </div>

                            <!-- Blood Gases -->
                            <div class="dashboard-section">
                                <div style="font-size: 11px; color: #9d00ff; margin-bottom: 8px;">
                                    🩸 Blood Gases
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                    <div style="
                                        padding: 8px;
                                        background: rgba(0,212,255,0.1);
                                        border-radius: 6px;
                                        text-align: center;
                                    ">
                                        <div style="font-size: 9px; color: rgba(255,255,255,0.6);">PaO₂</div>
                                        <div id="pao2-value" style="font-size: 16px; color: #0055ff;">100 <span style="font-size: 9px;">mmHg</span></div>
                                    </div>
                                    <div style="
                                        padding: 8px;
                                        background: rgba(255,107,107,0.1);
                                        border-radius: 6px;
                                        text-align: center;
                                    ">
                                        <div style="font-size: 9px; color: rgba(255,255,255,0.6);">PaCO₂</div>
                                        <div id="paco2-value" style="font-size: 16px; color: #ff6b6b;">40 <span style="font-size: 9px;">mmHg</span></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Lung Status -->
                            <div class="dashboard-section">
                                <div style="font-size: 11px; color: #ffd700; margin-bottom: 8px;">
                                    🫁 Lung Status
                                </div>
                                
                                <!-- Surfactant Bar -->
                                <div style="margin-bottom: 8px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 3px;">
                                        <span>Surfactant</span>
                                        <span id="surfactant-pct">100%</span>
                                    </div>
                                    <div style="height: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden;">
                                        <div id="surfactant-bar" style="
                                            height: 100%;
                                            width: 100%;
                                            background: linear-gradient(90deg, #ff0033, #ffd700, #00ff88);
                                            background-size: 300% 100%;
                                            background-position: 100% 0;
                                            transition: width 0.3s, background-position 0.3s;
                                        "></div>
                                    </div>
                                </div>
                                
                                <!-- Barrier Integrity Bar -->
                                <div style="margin-bottom: 8px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 3px;">
                                        <span>Barrier Integrity</span>
                                        <span id="barrier-pct">100%</span>
                                    </div>
                                    <div style="height: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden;">
                                        <div id="barrier-bar" style="
                                            height: 100%;
                                            width: 100%;
                                            background: #0055ff;
                                            transition: width 0.3s;
                                        "></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Inflammation Panel -->
                            <div class="dashboard-section">
                                <div style="font-size: 11px; color: #ff6b6b; margin-bottom: 8px;">
                                    🔥 Inflammation
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                    <div style="text-align: center;">
                                        <div style="font-size: 9px; color: rgba(255,255,255,0.6);">IL-6</div>
                                        <div id="il6-value" style="font-size: 14px; color: #ff6b6b;">5 pg/mL</div>
                                    </div>
                                    <div style="text-align: center;">
                                        <div style="font-size: 9px; color: rgba(255,255,255,0.6);">TNF-α</div>
                                        <div id="tnf-value" style="font-size: 14px; color: #ff6b6b;">10 pg/mL</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Control Buttons -->
                            <div style="margin-top: auto; display: flex; gap: 8px;">
                                <button id="lung-start-btn" style="
                                    flex: 1;
                                    padding: 10px;
                                    background: linear-gradient(135deg, rgba(0,255,136,0.3), rgba(0,212,255,0.2));
                                    border: 1px solid #00ff88;
                                    border-radius: 8px;
                                    color: #00ff88;
                                    font-family: 'Orbitron', sans-serif;
                                    font-size: 12px;
                                    cursor: pointer;
                                ">▶ Start</button>
                                <button id="lung-reset-btn" style="
                                    flex: 1;
                                    padding: 10px;
                                    background: rgba(255,0,51,0.1);
                                    border: 1px solid rgba(255,0,51,0.3);
                                    border-radius: 8px;
                                    color: #ff0033;
                                    font-family: 'Orbitron', sans-serif;
                                    font-size: 12px;
                                    cursor: pointer;
                                ">↺ Reset</button>
                            </div>
                        </div>
                    </div>

                    <!-- Feedback Overlay -->
                    <div id="lung-feedback" style="
                        position: absolute;
                        bottom: 10px;
                        left: 50%;
                        transform: translateX(-50%);
                        padding: 10px 20px;
                        background: rgba(0,0,0,0.8);
                        border-radius: 20px;
                        font-size: 12px;
                        display: none;
                        border: 1px solid rgba(0,212,255,0.3);
                    "></div>
                </div>

                <style>
                    @keyframes bloodFlow {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    
                    @keyframes gasParticle {
                        0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
                        50% { opacity: 1; transform: translate(var(--tx), var(--ty)) scale(1); }
                        100% { opacity: 0; transform: translate(var(--tx2), var(--ty2)) scale(0.5); }
                    }
                    
                    .drug-btn:hover {
                        transform: scale(1.05);
                        filter: brightness(1.2);
                    }
                    
                    .drug-btn:active {
                        transform: scale(0.95);
                    }
                    
                    .drug-btn.active {
                        box-shadow: 0 0 15px currentColor;
                    }
                    
                    #breath-btn:active {
                        transform: scale(1.1);
                        box-shadow: 0 0 30px rgba(0,212,255,0.5);
                    }
                </style>
            `;

            this.bindEvents();
            this.initCharts();
            this.createGasParticles();
        }

        bindEvents() {
            const container = document.getElementById(this.containerId);
            
            // Start/Stop
            container.querySelector('#lung-start-btn').addEventListener('click', () => {
                if (this.isRunning) {
                    this.pause();
                    container.querySelector('#lung-start-btn').textContent = '▶ Resume';
                } else {
                    this.start();
                    container.querySelector('#lung-start-btn').textContent = '⏸ Pause';
                }
            });

            // Reset
            container.querySelector('#lung-reset-btn').addEventListener('click', () => {
                this.reset();
                container.querySelector('#lung-start-btn').textContent = '▶ Start';
                this.showFeedback('Simulation reset', 'info');
            });

            // Breathing control
            const breathBtn = container.querySelector('#breath-btn');
            
            const startInhale = (e) => {
                e.preventDefault();
                this.state.set('breathPhase', 'inhale');
                breathBtn.textContent = '💨 EXHALE';
                breathBtn.style.background = 'linear-gradient(135deg, rgba(0,255,136,0.4), rgba(0,212,255,0.3))';
            };
            
            const startExhale = () => {
                if (this.state.get('breathPhase') === 'inhale') {
                    this.state.set('breathPhase', 'exhale');
                    breathBtn.textContent = '🌬️ INHALE';
                    breathBtn.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(0,255,136,0.2))';
                }
            };

            breathBtn.addEventListener('mousedown', startInhale);
            breathBtn.addEventListener('touchstart', startInhale);
            breathBtn.addEventListener('mouseup', startExhale);
            breathBtn.addEventListener('mouseleave', startExhale);
            breathBtn.addEventListener('touchend', startExhale);

            // Drug buttons
            container.querySelectorAll('.drug-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const drugId = btn.dataset.drug;
                    this.administerDrug(drugId);
                    btn.classList.add('active');
                    setTimeout(() => btn.classList.remove('active'), 500);
                });
            });

            // FiO2 slider
            const fio2Slider = container.querySelector('#fio2-slider');
            fio2Slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.state.set('fio2', value);
                container.querySelector('#fio2-value').textContent = value + '%';
            });
        }

        initCharts() {
            this.visualization.createTimeSeriesChart('spo2-chart', {
                maxPoints: 100,
                yMin: 70,
                yMax: 100,
                color: '#00ff88',
                label: 'SpO₂ Trend',
                thresholds: [
                    { value: 90, color: '#ffd700', label: 'Hypoxia' },
                    { value: 85, color: '#ff0033', label: 'Severe' }
                ]
            });
        }

        createGasParticles() {
            const container = document.getElementById('gas-particles');
            if (!container) return;

            const tier = PerformanceDetector.detect().tier;
            const particleCount = tier === 'high' ? 20 : (tier === 'medium' ? 10 : 5);

            // Create O2 particles (blue)
            for (let i = 0; i < particleCount / 2; i++) {
                const particle = document.createElement('div');
                particle.className = 'gas-particle o2-particle';
                particle.style.cssText = `
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    background: #0055ff;
                    border-radius: 50%;
                    box-shadow: 0 0 6px #0055ff;
                    opacity: 0;
                    pointer-events: none;
                `;
                container.appendChild(particle);
            }

            // Create CO2 particles (red)
            for (let i = 0; i < particleCount / 2; i++) {
                const particle = document.createElement('div');
                particle.className = 'gas-particle co2-particle';
                particle.style.cssText = `
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    background: #ff6b6b;
                    border-radius: 50%;
                    box-shadow: 0 0 6px #ff6b6b;
                    opacity: 0;
                    pointer-events: none;
                `;
                container.appendChild(particle);
            }
        }

        administerDrug(drugId) {
            const drug = DRUGS[drugId];
            if (!drug) return;

            const currentDrugs = this.state.get('drugs');
            currentDrugs[drugId] = {
                administeredAt: this.state.get('scenarioTime'),
                concentration: 100,
                ...drug
            };
            this.state.set('drugs', currentDrugs);

            this.showFeedback(`${drug.name} administered`, 'success');
            AudioFeedback.playStateChange('success', 0.3);
        }

        // ═══════════════════════════════════════════════════════════════════
        // CORE SIMULATION LOGIC
        // ═══════════════════════════════════════════════════════════════════

        simulationStep(dt, totalTime) {
            this.state.set('scenarioTime', totalTime, false);

            // 1. Update breathing mechanics
            this.updateBreathing(dt);

            // 2. Update gas exchange
            this.updateGasExchange(dt);

            // 3. Update surfactant dynamics
            this.updateSurfactant(dt);

            // 4. Update barrier integrity
            this.updateBarrier(dt);

            // 5. Update inflammation
            this.updateInflammation(dt);

            // 6. Process drug effects
            this.processDrugEffects(dt);

            // 7. Check for critical events
            this.checkCriticalEvents(dt);

            // 8. Update score
            this.updateScore(dt);
        }

        updateBreathing(dt) {
            const phase = this.state.get('breathPhase');
            let depth = this.state.get('breathDepth');
            let rr = this.state.get('respiratoryRate');

            if (phase === 'inhale') {
                // Inhale: depth increases
                depth = Math.min(100, depth + 80 * dt);
                
                // Track for breath counting
                if (depth >= 70 && !this._breathStarted) {
                    this._breathStarted = true;
                }
            } else if (phase === 'exhale') {
                // Exhale: depth decreases
                depth = Math.max(0, depth - 60 * dt);
                
                // Complete breath when fully exhaled
                if (depth <= 10 && this._breathStarted) {
                    this._breathStarted = false;
                    this._breathCount = (this._breathCount || 0) + 1;
                    this.state.set('breathPhase', 'rest');
                }
            } else {
                // Rest: slow decay
                depth = Math.max(0, depth - 20 * dt);
            }

            this.state.set('breathDepth', depth);

            // Calculate effective respiratory rate based on user breathing
            const breathsPerMinute = ((this._breathCount || 0) / totalTime) * 60;
            if (totalTime > 5) { // After 5 seconds, start measuring
                rr = MathUtils.lerp(rr, Math.max(8, Math.min(35, breathsPerMinute)), 0.1);
            }
            
            this.state.set('respiratoryRate', rr);

            // Minute ventilation
            const mv = rr * (300 + depth * 3) / 1000; // Tidal volume varies with breath depth
            this.state.set('minuteVentilation', mv);
        }

        updateGasExchange(dt) {
            const depth = this.state.get('breathDepth');
            const mv = this.state.get('minuteVentilation');
            const fio2 = this.state.get('fio2');
            const surfactant = this.state.get('surfactant');
            const barrier = this.state.get('barrierIntegrity');
            const edema = this.state.get('edemaLevel');

            // Calculate diffusion capacity
            // Affected by surfactant (surface area) and barrier (thickness)
            let diffusionCapacity = PHYSIOLOGY.DIFFUSION_CAPACITY_NORMAL;
            diffusionCapacity *= (surfactant / 100);  // Surfactant affects surface area
            diffusionCapacity *= (barrier / 100);     // Barrier damage reduces diffusion
            diffusionCapacity *= (1 - edema * 0.5);   // Edema increases diffusion distance

            // Alveolar gas equations (simplified)
            // PAO2 = FiO2 × (Patm - PH2O) - PACO2/RQ
            const patm = 760;  // mmHg
            const ph2o = 47;   // mmHg at body temp
            const rq = 0.8;    // Respiratory quotient

            // Target PAO2 based on FiO2 and ventilation
            let targetPao2 = (fio2 / 100) * (patm - ph2o) - this.state.get('paco2') / rq;
            targetPao2 = MathUtils.clamp(targetPao2, 40, 500);

            // Actual PAO2 approaches target based on ventilation and diffusion
            const ventilationFactor = MathUtils.smoothstep(2, 8, mv);
            const diffusionFactor = diffusionCapacity / PHYSIOLOGY.DIFFUSION_CAPACITY_NORMAL;
            
            let pao2 = this.state.get('pao2');
            const pao2Change = (targetPao2 - pao2) * ventilationFactor * diffusionFactor * dt * 0.5;
            pao2 = MathUtils.clamp(pao2 + pao2Change, 30, 500);
            this.state.set('pao2', pao2);

            // PACO2 - inversely related to ventilation
            let paco2 = this.state.get('paco2');
            const targetPaco2 = 40 / (mv / 6); // Normal MV ~6 L/min
            const paco2Change = (targetPaco2 - paco2) * dt * 0.3;
            paco2 = MathUtils.clamp(paco2 + paco2Change, 20, 100);
            this.state.set('paco2', paco2);

            // SpO2 from PAO2 using oxygen-hemoglobin dissociation curve (Hill equation)
            // Simplified version
            const p50 = 26.7;  // mmHg
            const hill = 2.7;
            let spo2 = MathUtils.hillEquation(pao2, 100, p50, hill);
            
            // Add stochastic variation (±1%)
            spo2 += MathUtils.gaussianRandom(0, 0.5);
            spo2 = MathUtils.clamp(spo2, 0, 100);
            
            this.state.set('spo2', spo2);

            // Track hypoxia time
            if (spo2 < PHYSIOLOGY.SPO2_HYPOXIA) {
                this.state.update('timeInHypoxia', t => t + dt);
            }
        }

        updateSurfactant(dt) {
            let surfactant = this.state.get('surfactant');
            const barrier = this.state.get('barrierIntegrity');
            const il6 = this.state.get('il6');

            // Type II pneumocyte production (depends on barrier health)
            const productionRate = PHYSIOLOGY.SURFACTANT_PRODUCTION_RATE * (barrier / 100);
            
            // Depletion from inflammation and use
            let depletionRate = PHYSIOLOGY.SURFACTANT_DEPLETION_RATE;
            depletionRate *= (1 + il6 / PHYSIOLOGY.IL6_ELEVATED); // Inflammation increases depletion
            
            // Net change
            const netChange = (productionRate - depletionRate) * dt;
            surfactant = MathUtils.clamp(surfactant + netChange, 0, 100);
            
            this.state.set('surfactant', surfactant);
        }

        updateBarrier(dt) {
            let barrier = this.state.get('barrierIntegrity');
            const il6 = this.state.get('il6');
            const tnf = this.state.get('tnfAlpha');
            const pao2 = this.state.get('pao2');
            const fio2 = this.state.get('fio2');

            // Damage from inflammation
            const inflammationDamage = (il6 / PHYSIOLOGY.IL6_STORM + tnf / 200) * 0.1 * dt;
            
            // Damage from hypoxia
            const hypoxiaDamage = pao2 < 60 ? (60 - pao2) * 0.01 * dt : 0;
            
            // Damage from hyperoxia (high FiO2)
            const hyperoxiaDamage = fio2 > 60 ? (fio2 - 60) * 0.002 * dt : 0;
            
            // Natural healing
            const healing = PHYSIOLOGY.BARRIER_HEAL_RATE * dt * (barrier > 50 ? 1 : 0.5);
            
            // Net change
            const netChange = healing - inflammationDamage - hypoxiaDamage - hyperoxiaDamage;
            barrier = MathUtils.clamp(barrier + netChange, 0, 100);
            
            this.state.set('barrierIntegrity', barrier);

            // Edema from barrier damage
            const edemaRate = (100 - barrier) * 0.001 * dt;
            const edema = MathUtils.clamp(this.state.get('edemaLevel') + edemaRate, 0, 100);
            this.state.set('edemaLevel', edema);
        }

        updateInflammation(dt) {
            let il6 = this.state.get('il6');
            let tnf = this.state.get('tnfAlpha');
            const barrier = this.state.get('barrierIntegrity');
            const pathogenLoad = this.state.get('pathogenLoad');

            // Inflammation increases with damage and pathogens
            const stimulation = (100 - barrier) * 0.02 + pathogenLoad * 0.1;
            
            // Natural resolution
            const resolution = 0.05;
            
            // IL-6 dynamics
            il6 += (stimulation - resolution * il6 / PHYSIOLOGY.IL6_NORMAL) * dt;
            il6 = MathUtils.clamp(il6, PHYSIOLOGY.IL6_NORMAL * 0.5, PHYSIOLOGY.IL6_STORM * 2);
            
            // TNF-α dynamics (faster response)
            tnf += (stimulation * 2 - resolution * 1.5 * tnf / PHYSIOLOGY.TNF_NORMAL) * dt;
            tnf = MathUtils.clamp(tnf, PHYSIOLOGY.TNF_NORMAL * 0.5, 200);
            
            this.state.set('il6', il6);
            this.state.set('tnfAlpha', tnf);

            // Combined inflammation score
            const score = (il6 / PHYSIOLOGY.IL6_STORM + tnf / 100) * 50;
            this.state.set('inflammationScore', score);
        }

        processDrugEffects(dt) {
            const drugs = this.state.get('drugs');
            const currentTime = this.state.get('scenarioTime');

            Object.keys(drugs).forEach(drugId => {
                const drug = drugs[drugId];
                const timeSinceAdmin = (currentTime - drug.administeredAt) / 3600; // hours
                
                // Calculate effect magnitude based on PK
                let effectMagnitude = 0;
                if (timeSinceAdmin < drug.onsetTime) {
                    effectMagnitude = timeSinceAdmin / drug.onsetTime * 0.5;
                } else if (timeSinceAdmin < drug.peakEffect) {
                    effectMagnitude = 0.5 + (timeSinceAdmin - drug.onsetTime) / (drug.peakEffect - drug.onsetTime) * 0.5;
                } else {
                    // Decay with half-life
                    const decayTime = timeSinceAdmin - drug.peakEffect;
                    effectMagnitude = Math.exp(-0.693 * decayTime / drug.halfLife);
                }

                // Apply effects
                if (drug.effects.il6Reduction && effectMagnitude > 0.1) {
                    let il6 = this.state.get('il6');
                    il6 *= (1 - drug.effects.il6Reduction * effectMagnitude * dt);
                    this.state.set('il6', il6);
                }

                if (drug.effects.tnfReduction && effectMagnitude > 0.1) {
                    let tnf = this.state.get('tnfAlpha');
                    tnf *= (1 - drug.effects.tnfReduction * effectMagnitude * dt);
                    this.state.set('tnfAlpha', tnf);
                }

                if (drug.effects.surfactantBoost && effectMagnitude > 0.5) {
                    // One-time boost at peak
                    if (!drug._boostApplied && timeSinceAdmin >= drug.peakEffect) {
                        let surfactant = this.state.get('surfactant');
                        surfactant = Math.min(100, surfactant + drug.effects.surfactantBoost);
                        this.state.set('surfactant', surfactant);
                        drug._boostApplied = true;
                        this.showFeedback('Surfactant levels restored', 'success');
                    }
                }

                if (drug.effects.airwayResistanceReduction && effectMagnitude > 0.1) {
                    let resistance = this.state.get('airwayResistance');
                    resistance = 1 - drug.effects.airwayResistanceReduction * effectMagnitude;
                    this.state.set('airwayResistance', Math.max(0.3, resistance));
                }

                // Update drug concentration
                drug.concentration = effectMagnitude * 100;
            });

            this.state.set('drugs', drugs);
        }

        checkCriticalEvents(dt) {
            const spo2 = this.state.get('spo2');
            const barrier = this.state.get('barrierIntegrity');
            const il6 = this.state.get('il6');
            const surfactant = this.state.get('surfactant');

            // Critical hypoxia
            if (spo2 < PHYSIOLOGY.SPO2_CRITICAL) {
                if (!this._criticalAlertShown) {
                    this.showFeedback('⚠️ CRITICAL: Severe hypoxia! Increase FiO₂!', 'critical');
                    AudioFeedback.playStateChange('critical');
                    this._criticalAlertShown = true;
                }
            } else if (spo2 < PHYSIOLOGY.SPO2_SEVERE_HYPOXIA) {
                if (!this._severeAlertShown) {
                    this.showFeedback('⚠️ Severe hypoxia - SpO₂ < 85%', 'warning');
                    AudioFeedback.playStateChange('warning');
                    this._severeAlertShown = true;
                }
            } else {
                this._criticalAlertShown = false;
                this._severeAlertShown = false;
            }

            // Cytokine storm
            if (il6 > PHYSIOLOGY.IL6_STORM && !this._stormAlertShown) {
                this.showFeedback('🔥 Cytokine storm developing! Consider steroids.', 'warning');
                AudioFeedback.playStateChange('warning');
                this._stormAlertShown = true;
            }

            // Surfactant crisis
            if (surfactant < PHYSIOLOGY.SURFACTANT_CRITICAL && !this._surfactantAlertShown) {
                this.showFeedback('⚠️ Surfactant critically low! Risk of atelectasis.', 'warning');
                this._surfactantAlertShown = true;
            }

            // ARDS (barrier failure)
            if (barrier < PHYSIOLOGY.BARRIER_CRITICAL && !this._ardsAlertShown) {
                this.showFeedback('🚨 ARDS developing! Barrier integrity critical.', 'critical');
                AudioFeedback.playStateChange('critical');
                this._ardsAlertShown = true;
            }

            // Accumulate permanent damage
            if (barrier < 50 || spo2 < 80) {
                this.state.update('lungDamage', d => d + dt * 0.5);
            }
        }

        updateScore(dt) {
            const spo2 = this.state.get('spo2');
            const barrier = this.state.get('barrierIntegrity');
            
            // Score based on maintaining healthy state
            let pointsPerSecond = 0;
            
            if (spo2 >= 95) pointsPerSecond += 10;
            else if (spo2 >= 90) pointsPerSecond += 5;
            else if (spo2 >= 85) pointsPerSecond += 1;
            else pointsPerSecond -= 5;
            
            if (barrier >= 80) pointsPerSecond += 5;
            else if (barrier >= 50) pointsPerSecond += 2;
            else pointsPerSecond -= 3;
            
            this.state.update('score', s => Math.max(0, s + pointsPerSecond * dt));
        }

        // ═══════════════════════════════════════════════════════════════════
        // VISUALIZATION UPDATE
        // ═══════════════════════════════════════════════════════════════════

        updateVisualization() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const state = this.state.get();

            // Update vital displays
            const spo2El = container.querySelector('#spo2-value');
            spo2El.textContent = Math.round(state.spo2) + '%';
            spo2El.style.color = state.spo2 >= 95 ? '#00ff88' : 
                                  state.spo2 >= 90 ? '#ffd700' : '#ff0033';

            container.querySelector('#rr-value').textContent = Math.round(state.respiratoryRate);
            container.querySelector('#pao2-value').innerHTML = Math.round(state.pao2) + ' <span style="font-size: 9px;">mmHg</span>';
            container.querySelector('#paco2-value').innerHTML = Math.round(state.paco2) + ' <span style="font-size: 9px;">mmHg</span>';

            // Update surfactant bar
            const surfactantBar = container.querySelector('#surfactant-bar');
            surfactantBar.style.width = state.surfactant + '%';
            surfactantBar.style.backgroundPosition = (100 - state.surfactant) + '% 0';
            container.querySelector('#surfactant-pct').textContent = Math.round(state.surfactant) + '%';

            // Update barrier bar
            container.querySelector('#barrier-bar').style.width = state.barrierIntegrity + '%';
            container.querySelector('#barrier-pct').textContent = Math.round(state.barrierIntegrity) + '%';

            // Update inflammation values
            container.querySelector('#il6-value').textContent = state.il6.toFixed(1) + ' pg/mL';
            container.querySelector('#tnf-value').textContent = state.tnfAlpha.toFixed(1) + ' pg/mL';

            // Update breath bar
            container.querySelector('#breath-bar').style.width = state.breathDepth + '%';

            // Update time display
            const mins = Math.floor(state.scenarioTime / 60);
            const secs = Math.floor(state.scenarioTime % 60);
            container.querySelector('#lung-time').textContent = 
                String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

            // Update SpO2 chart
            this.visualization.updateChart('spo2-chart', state.spo2, Date.now());

            // Update alveolus visualization
            this.updateAlveolusVisualization(state);

            // Update edema overlay
            container.querySelector('#edema-overlay').style.height = state.edemaLevel + '%';

            // Animate gas particles
            this.animateGasParticles(state);
        }

        updateAlveolusVisualization(state) {
            const membrane = document.getElementById('alveolus-membrane');
            const surfactantLayer = document.getElementById('surfactant-layer');
            const lumen = document.getElementById('alveolus-lumen');

            if (!membrane) return;

            // Alveolus size based on breath depth (expansion)
            const scale = 0.85 + (state.breathDepth / 100) * 0.3;
            membrane.style.transform = `scale(${scale})`;

            // Membrane color based on barrier integrity
            const barrierHealth = state.barrierIntegrity / 100;
            const r = Math.round(255 - barrierHealth * 75);
            const g = Math.round(80 + barrierHealth * 70);
            const b = Math.round(80 + barrierHealth * 20);
            membrane.style.background = `radial-gradient(ellipse at 30% 30%, 
                rgba(${r},${g},${b},0.6), 
                rgba(${Math.round(r*0.7)},${Math.round(g*0.5)},${Math.round(b*0.5)},0.4))`;

            // Surfactant layer opacity based on level
            surfactantLayer.style.borderColor = `rgba(0,255,255,${0.2 + state.surfactant * 0.006})`;
            surfactantLayer.style.boxShadow = `inset 0 0 ${state.surfactant * 0.3}px rgba(0,255,255,${state.surfactant * 0.005})`;

            // Lumen color based on oxygenation
            const oxygenation = state.spo2 / 100;
            lumen.style.background = `radial-gradient(ellipse at center,
                rgba(${Math.round(100 + 155 * (1 - oxygenation))},${Math.round(100 + 100 * oxygenation)},255,0.4),
                rgba(${Math.round(50 + 150 * (1 - oxygenation))},${Math.round(50 + 50 * oxygenation)},200,0.2))`;
        }

        animateGasParticles(state) {
            const tier = PerformanceDetector.detect().tier;
            if (tier === 'low') return;

            const o2Particles = document.querySelectorAll('.o2-particle');
            const co2Particles = document.querySelectorAll('.co2-particle');

            // O2 particles move from lumen toward capillary when inhaling
            // CO2 particles move from capillary toward lumen when exhaling
            const breathPhase = state.breathPhase;
            const depth = state.breathDepth;

            o2Particles.forEach((p, i) => {
                if (breathPhase === 'inhale' && Math.random() < 0.1) {
                    const startX = 80 + Math.random() * 40;
                    const startY = 60 + Math.random() * 80;
                    p.style.left = startX + 'px';
                    p.style.top = startY + 'px';
                    p.style.setProperty('--tx', (Math.random() - 0.5) * 20 + 'px');
                    p.style.setProperty('--ty', 60 + Math.random() * 40 + 'px');
                    p.style.setProperty('--tx2', (Math.random() - 0.5) * 30 + 'px');
                    p.style.setProperty('--ty2', 120 + 'px');
                    p.style.animation = 'none';
                    p.offsetHeight; // Trigger reflow
                    p.style.animation = 'gasParticle 1.5s ease-out forwards';
                }
            });

            co2Particles.forEach((p, i) => {
                if (breathPhase === 'exhale' && Math.random() < 0.1) {
                    const startX = 80 + Math.random() * 40;
                    const startY = 140 + Math.random() * 30;
                    p.style.left = startX + 'px';
                    p.style.top = startY + 'px';
                    p.style.setProperty('--tx', (Math.random() - 0.5) * 20 + 'px');
                    p.style.setProperty('--ty', -40 - Math.random() * 40 + 'px');
                    p.style.setProperty('--tx2', (Math.random() - 0.5) * 30 + 'px');
                    p.style.setProperty('--ty2', -80 + 'px');
                    p.style.animation = 'none';
                    p.offsetHeight;
                    p.style.animation = 'gasParticle 1.5s ease-out forwards';
                }
            });
        }

        showFeedback(message, type = 'info') {
            const feedback = document.getElementById('lung-feedback');
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
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════════════

    window.LungChipSimulator = LungChipSimulator;
    
    // Auto-initialization
    window.initLungChipSimulator = function(containerId) {
        const sim = new LungChipSimulator(containerId);
        sim.init();
        return sim;
    };

    console.log('[LungChipSimulator] Module loaded');

})();
