/**
 * PatientAnalog.com - Module #4: RNA Secondary Structure Prediction Lab
 * Museum-Grade Scientific Simulation
 * 
 * @version 1.0.0
 * @requires museum-grade-engine.js
 * 
 * SCIENTIFIC MODEL:
 * - RNA thermodynamic folding (nearest-neighbor model)
 * - Base pairing energy calculations
 * - Secondary structure prediction (MFE)
 * - Ensemble probability computation
 * - Riboswitch design challenges
 */

(function() {
    'use strict';

    const { MathUtils, StateManager, SimulationModule, PerformanceDetector, AudioFeedback } = window.MuseumGradeEngine;

    // ═══════════════════════════════════════════════════════════════════════
    // RNA THERMODYNAMICS CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    const RNA_ENERGY = {
        // Base pair stacking energies (kcal/mol) - simplified
        stacking: {
            'GC/GC': -3.4, 'GC/CG': -2.4, 'GC/AU': -2.1, 'GC/UA': -2.2,
            'CG/GC': -2.4, 'CG/CG': -3.3, 'CG/AU': -2.1, 'CG/UA': -1.4,
            'AU/GC': -2.1, 'AU/CG': -2.1, 'AU/AU': -0.9, 'AU/UA': -1.1,
            'UA/GC': -2.2, 'UA/CG': -1.4, 'UA/AU': -1.3, 'UA/UA': -0.9,
            'GU/GC': -1.4, 'GU/AU': -0.6, 'UG/CG': -1.0, 'UG/UA': -0.5
        },
        // Loop penalties
        hairpinLoop: [0, 0, 0, 5.4, 5.6, 5.7, 5.4, 6.0, 6.4, 6.8, 7.2],
        internalLoop: [0, 0, 0, 0, 1.1, 2.1, 2.5, 2.7, 2.9, 3.0, 3.1],
        bulge: [0, 3.8, 2.8, 3.2, 3.6, 4.0, 4.4, 4.6, 4.7, 4.8, 4.9],
        // Initiation
        initiation: 4.1,
        // GU closing penalty
        guClosing: 0.5
    };

    const VALID_PAIRS = {
        'A': ['U'],
        'U': ['A', 'G'],
        'G': ['C', 'U'],
        'C': ['G']
    };

    // Sample sequences for challenges
    const RNA_CHALLENGES = [
        {
            id: 'hairpin1',
            name: 'Simple Hairpin',
            sequence: 'GGGGAAAACCCC',
            difficulty: 1,
            description: 'Predict the classic hairpin structure',
            targetPairs: [[0,11], [1,10], [2,9], [3,8]]
        },
        {
            id: 'stemloop',
            name: 'Stem-Loop',
            sequence: 'GCGCAUAUAUGCGC',
            difficulty: 2,
            description: 'Find the optimal stem-loop configuration'
        },
        {
            id: 'multiloop',
            name: 'Multi-branch Loop',
            sequence: 'GGCCAAUUGGCCAAUUGGCC',
            difficulty: 3,
            description: 'Predict the multi-branched structure'
        },
        {
            id: 'riboswitch',
            name: 'Riboswitch Design',
            sequence: 'GGCUAAAAGCCGGGAAACCCGGC',
            difficulty: 4,
            description: 'Design a ligand-responsive switch'
        }
    ];

    // ═══════════════════════════════════════════════════════════════════════
    // RNA STRUCTURE PREDICTOR CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class RNAStructureLab extends SimulationModule {
        
        getInitialState() {
            return {
                sequence: 'GGGGAAAACCCC',
                sequenceLength: 12,
                
                // User-drawn structure
                userPairs: [],           // Array of [i, j] base pairs
                
                // Computed MFE structure
                mfePairs: [],
                mfeEnergy: 0,
                
                // Energy components
                energyBreakdown: {
                    stacking: 0,
                    loops: 0,
                    initiation: 0,
                    total: 0
                },
                
                // Ensemble
                ensembleSize: 0,
                pairProbabilities: [],    // Matrix of pairing probabilities
                
                // Current selection
                selectedBase: null,
                hoverBase: null,
                
                // Challenge mode
                currentChallenge: null,
                challengeComplete: false,
                accuracy: 0,
                
                // Tools
                activeTool: 'pair',       // 'pair', 'unpair', 'mutate'
                
                // Display
                viewMode: 'arc',          // 'arc', 'circle', 'linear'
                showProbabilities: false,
                temperature: 37,          // Celsius
                
                score: 0,
                phase: 'freeplay'
            };
        }

        createUI() {
            const container = document.getElementById(this.containerId);
            
            container.innerHTML = `
                <div class="rna-lab-container" style="
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #050510 0%, #101025 50%, #050515 100%);
                    border-radius: 16px;
                    overflow: hidden;
                    position: relative;
                    font-family: 'Orbitron', 'Segoe UI', sans-serif;
                    color: #e0f2fe;
                ">
                    <!-- Header -->
                    <div style="
                        padding: 12px 20px;
                        background: linear-gradient(90deg, rgba(0,255,136,0.1), rgba(0,212,255,0.1));
                        border-bottom: 1px solid rgba(0,255,136,0.2);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h3 style="margin: 0; font-size: 16px; color: #00ff88;">
                                🧬 RNA Secondary Structure Lab
                            </h3>
                            <p style="margin: 3px 0 0; font-size: 11px; color: rgba(255,255,255,0.6);">
                                Thermodynamic Folding Prediction
                            </p>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span id="rna-energy" style="
                                padding: 4px 12px;
                                background: rgba(0,212,255,0.2);
                                border: 1px solid #0055ff;
                                border-radius: 12px;
                                font-size: 10px;
                            ">ΔG: 0.0 kcal/mol</span>
                        </div>
                    </div>

                    <!-- Main Layout -->
                    <div style="display: grid; grid-template-columns: 1fr 280px; height: calc(100% - 50px);">
                        
                        <!-- Center: Structure Visualization -->
                        <div style="padding: 15px; display: flex; flex-direction: column;">
                            
                            <!-- Sequence Input -->
                            <div style="margin-bottom: 10px;">
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <input type="text" id="rna-sequence-input" value="GGGGAAAACCCC" style="
                                        flex: 1;
                                        padding: 10px 15px;
                                        background: rgba(0,0,0,0.5);
                                        border: 1px solid rgba(0,255,136,0.3);
                                        border-radius: 8px;
                                        color: #00ff88;
                                        font-family: 'Courier New', monospace;
                                        font-size: 14px;
                                        letter-spacing: 2px;
                                    ">
                                    <button id="load-sequence-btn" style="
                                        padding: 10px 20px;
                                        background: rgba(0,255,136,0.2);
                                        border: 1px solid #00ff88;
                                        border-radius: 8px;
                                        color: #00ff88;
                                        cursor: pointer;
                                        font-family: inherit;
                                    ">Load</button>
                                </div>
                            </div>

                            <!-- Structure Canvas -->
                            <div id="rna-structure-view" style="
                                flex: 1;
                                background: rgba(0,0,0,0.4);
                                border: 1px solid rgba(0,255,136,0.2);
                                border-radius: 12px;
                                position: relative;
                                overflow: hidden;
                                min-height: 250px;
                            ">
                                <canvas id="rna-canvas" style="width: 100%; height: 100%;"></canvas>
                                
                                <!-- Energy breakdown overlay -->
                                <div id="energy-breakdown" style="
                                    position: absolute;
                                    top: 10px;
                                    right: 10px;
                                    background: rgba(0,0,0,0.8);
                                    padding: 10px;
                                    border-radius: 8px;
                                    font-size: 10px;
                                    border: 1px solid rgba(0,212,255,0.3);
                                ">
                                    <div style="color: #0055ff; margin-bottom: 5px;">Energy Components</div>
                                    <div>Stacking: <span id="e-stacking">0.0</span></div>
                                    <div>Loops: <span id="e-loops">0.0</span></div>
                                    <div>Init: <span id="e-init">0.0</span></div>
                                    <div style="border-top: 1px solid rgba(255,255,255,0.2); margin-top: 5px; padding-top: 5px;">
                                        Total: <span id="e-total" style="color: #00ff88;">0.0</span> kcal/mol
                                    </div>
                                </div>
                            </div>

                            <!-- Tools -->
                            <div style="
                                margin-top: 10px;
                                padding: 12px;
                                background: rgba(0,0,0,0.3);
                                border-radius: 10px;
                                display: flex;
                                gap: 10px;
                                align-items: center;
                            ">
                                <div style="display: flex; gap: 5px;">
                                    <button class="tool-btn active" data-tool="pair" style="
                                        padding: 8px 15px;
                                        background: rgba(0,255,136,0.2);
                                        border: 1px solid #00ff88;
                                        border-radius: 6px;
                                        color: #00ff88;
                                        cursor: pointer;
                                        font-size: 11px;
                                    ">🔗 Pair</button>
                                    <button class="tool-btn" data-tool="unpair" style="
                                        padding: 8px 15px;
                                        background: rgba(255,107,107,0.1);
                                        border: 1px solid rgba(255,107,107,0.3);
                                        border-radius: 6px;
                                        color: #ff6b6b;
                                        cursor: pointer;
                                        font-size: 11px;
                                    ">✂️ Unpair</button>
                                    <button class="tool-btn" data-tool="mutate" style="
                                        padding: 8px 15px;
                                        background: rgba(157,0,255,0.1);
                                        border: 1px solid rgba(157,0,255,0.3);
                                        border-radius: 6px;
                                        color: #9d00ff;
                                        cursor: pointer;
                                        font-size: 11px;
                                    ">🧬 Mutate</button>
                                </div>
                                
                                <div style="flex: 1;"></div>
                                
                                <button id="predict-mfe-btn" style="
                                    padding: 8px 20px;
                                    background: linear-gradient(135deg, rgba(0,212,255,0.3), rgba(157,0,255,0.2));
                                    border: 1px solid #0055ff;
                                    border-radius: 6px;
                                    color: #0055ff;
                                    cursor: pointer;
                                    font-size: 11px;
                                ">🔮 Predict MFE</button>
                                
                                <button id="clear-pairs-btn" style="
                                    padding: 8px 15px;
                                    background: rgba(255,0,51,0.1);
                                    border: 1px solid rgba(255,0,51,0.3);
                                    border-radius: 6px;
                                    color: #ff0033;
                                    cursor: pointer;
                                    font-size: 11px;
                                ">Clear</button>
                            </div>
                        </div>

                        <!-- Right Panel -->
                        <div style="
                            padding: 15px;
                            background: rgba(0,0,0,0.3);
                            border-left: 1px solid rgba(0,255,136,0.2);
                            overflow-y: auto;
                        ">
                            <!-- Challenge Selector -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #ffd700; margin-bottom: 8px;">
                                    🎯 Challenges
                                </div>
                                <select id="challenge-select" style="
                                    width: 100%;
                                    padding: 10px;
                                    background: rgba(0,0,0,0.5);
                                    border: 1px solid rgba(255,215,0,0.3);
                                    border-radius: 8px;
                                    color: #fff;
                                    font-family: inherit;
                                ">
                                    <option value="">Free Play</option>
                                    ${RNA_CHALLENGES.map(c => 
                                        `<option value="${c.id}">${c.name} (★${'★'.repeat(c.difficulty)})</option>`
                                    ).join('')}
                                </select>
                                
                                <div id="challenge-desc" style="
                                    margin-top: 8px;
                                    padding: 10px;
                                    background: rgba(255,215,0,0.1);
                                    border-radius: 6px;
                                    font-size: 10px;
                                    display: none;
                                "></div>
                            </div>

                            <!-- Base Pair Rules -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #0055ff; margin-bottom: 8px;">
                                    📚 Base Pairing Rules
                                </div>
                                <div style="
                                    padding: 10px;
                                    background: rgba(0,212,255,0.1);
                                    border-radius: 8px;
                                    font-size: 10px;
                                ">
                                    <div style="display: flex; justify-content: space-around; margin-bottom: 8px;">
                                        <span style="color: #ff6b6b;">A</span>
                                        <span>━━</span>
                                        <span style="color: #0055ff;">U</span>
                                        <span style="opacity: 0.5;">(weak)</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-around; margin-bottom: 8px;">
                                        <span style="color: #ffd700;">G</span>
                                        <span>≡≡≡</span>
                                        <span style="color: #00ff88;">C</span>
                                        <span style="opacity: 0.5;">(strong)</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-around;">
                                        <span style="color: #ffd700;">G</span>
                                        <span>∙∙</span>
                                        <span style="color: #0055ff;">U</span>
                                        <span style="opacity: 0.5;">(wobble)</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Current Structure Info -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #9d00ff; margin-bottom: 8px;">
                                    📊 Structure Analysis
                                </div>
                                <div style="font-size: 10px;">
                                    <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                        <span>Base Pairs:</span>
                                        <span id="num-pairs">0</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                        <span>Unpaired:</span>
                                        <span id="num-unpaired">12</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                        <span>Hairpin Loops:</span>
                                        <span id="num-hairpins">0</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                        <span>Internal Loops:</span>
                                        <span id="num-internal">0</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Dot-Bracket Notation -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: #00ff88; margin-bottom: 8px;">
                                    📝 Dot-Bracket Notation
                                </div>
                                <div id="dot-bracket" style="
                                    padding: 10px;
                                    background: rgba(0,0,0,0.5);
                                    border-radius: 6px;
                                    font-family: 'Courier New', monospace;
                                    font-size: 12px;
                                    color: #00ff88;
                                    word-break: break-all;
                                ">............</div>
                            </div>

                            <!-- Accuracy (for challenges) -->
                            <div id="accuracy-panel" style="margin-bottom: 15px; display: none;">
                                <div style="font-size: 11px; color: #00ff88; margin-bottom: 8px;">
                                    🎯 Accuracy
                                </div>
                                <div style="
                                    height: 20px;
                                    background: rgba(0,0,0,0.3);
                                    border-radius: 10px;
                                    overflow: hidden;
                                ">
                                    <div id="accuracy-bar" style="
                                        height: 100%;
                                        width: 0%;
                                        background: linear-gradient(90deg, #ff0033, #ffd700, #00ff88);
                                        transition: width 0.3s;
                                    "></div>
                                </div>
                                <div id="accuracy-value" style="text-align: center; margin-top: 5px; font-size: 14px;">0%</div>
                            </div>

                            <!-- Temperature Control -->
                            <div style="margin-bottom: 15px;">
                                <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 8px;">
                                    🌡️ Temperature: <span id="temp-value">37</span>°C
                                </div>
                                <input type="range" id="temp-slider" min="20" max="80" value="37" style="
                                    width: 100%;
                                    accent-color: #ff6b6b;
                                ">
                            </div>

                            <!-- Controls -->
                            <div style="display: flex; gap: 8px;">
                                <button id="rna-check-btn" style="
                                    flex: 1;
                                    padding: 10px;
                                    background: linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,212,255,0.1));
                                    border: 1px solid #00ff88;
                                    border-radius: 8px;
                                    color: #00ff88;
                                    font-family: 'Orbitron', sans-serif;
                                    font-size: 11px;
                                    cursor: pointer;
                                ">✓ Check</button>
                            </div>
                        </div>
                    </div>

                    <!-- Feedback -->
                    <div id="rna-feedback" style="
                        position: absolute;
                        bottom: 10px;
                        left: 50%;
                        transform: translateX(-50%);
                        padding: 10px 20px;
                        background: rgba(0,0,0,0.9);
                        border-radius: 20px;
                        font-size: 12px;
                        display: none;
                        border: 1px solid #00ff88;
                    "></div>
                </div>
            `;

            this.bindEvents();
            this.initCanvas();
            this.loadSequence(this.state.get('sequence'));
        }

        bindEvents() {
            const container = document.getElementById(this.containerId);

            // Load sequence
            container.querySelector('#load-sequence-btn').addEventListener('click', () => {
                const input = container.querySelector('#rna-sequence-input').value.toUpperCase();
                if (/^[AUGC]+$/.test(input)) {
                    this.loadSequence(input);
                } else {
                    this.showFeedback('Invalid sequence. Use only A, U, G, C', 'warning');
                }
            });

            // Tool selection
            container.querySelectorAll('.tool-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.set('activeTool', btn.dataset.tool);
                });
            });

            // Predict MFE
            container.querySelector('#predict-mfe-btn').addEventListener('click', () => {
                this.predictMFE();
            });

            // Clear pairs
            container.querySelector('#clear-pairs-btn').addEventListener('click', () => {
                this.state.set('userPairs', []);
                this.calculateEnergy();
                this.render();
            });

            // Challenge selector
            container.querySelector('#challenge-select').addEventListener('change', (e) => {
                const challengeId = e.target.value;
                if (challengeId) {
                    this.loadChallenge(challengeId);
                } else {
                    this.state.set('currentChallenge', null);
                    container.querySelector('#accuracy-panel').style.display = 'none';
                    container.querySelector('#challenge-desc').style.display = 'none';
                }
            });

            // Temperature
            container.querySelector('#temp-slider').addEventListener('input', (e) => {
                this.state.set('temperature', parseInt(e.target.value));
                container.querySelector('#temp-value').textContent = e.target.value;
                this.calculateEnergy();
                this.render();
            });

            // Check answer
            container.querySelector('#rna-check-btn').addEventListener('click', () => {
                this.checkAnswer();
            });

            // Canvas interactions
            const canvas = container.querySelector('#rna-canvas');
            canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
            canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
        }

        initCanvas() {
            const canvas = document.getElementById('rna-canvas');
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            this.ctx = canvas.getContext('2d');
            this.basePositions = [];
        }

        loadSequence(sequence) {
            this.state.set('sequence', sequence);
            this.state.set('sequenceLength', sequence.length);
            this.state.set('userPairs', []);
            this.state.set('mfePairs', []);
            this.calculateBasePositions();
            this.calculateEnergy();
            this.render();
            this.showFeedback(`Loaded sequence: ${sequence.length} nucleotides`, 'info');
        }

        loadChallenge(challengeId) {
            const challenge = RNA_CHALLENGES.find(c => c.id === challengeId);
            if (!challenge) return;

            this.state.set('currentChallenge', challenge);
            this.loadSequence(challenge.sequence);
            
            const container = document.getElementById(this.containerId);
            container.querySelector('#challenge-desc').textContent = challenge.description;
            container.querySelector('#challenge-desc').style.display = 'block';
            container.querySelector('#accuracy-panel').style.display = 'block';
            
            this.showFeedback(`Challenge: ${challenge.name}`, 'info');
        }

        calculateBasePositions() {
            const canvas = document.getElementById('rna-canvas');
            const sequence = this.state.get('sequence');
            const n = sequence.length;
            
            this.basePositions = [];
            const centerX = canvas.width / 2;
            const centerY = canvas.height * 0.6;
            const radius = Math.min(canvas.width, canvas.height) * 0.35;
            
            // Arc layout for now
            for (let i = 0; i < n; i++) {
                const angle = Math.PI + (i / (n - 1)) * Math.PI;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY - radius * Math.sin(angle) * 0.5;
                this.basePositions.push({ x, y, base: sequence[i], index: i });
            }
        }

        handleCanvasClick(e) {
            const canvas = document.getElementById('rna-canvas');
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            // Find clicked base
            const clickedBase = this.basePositions.find(bp => {
                const dist = Math.sqrt((bp.x - x) ** 2 + (bp.y - y) ** 2);
                return dist < 20;
            });

            if (!clickedBase) return;

            const tool = this.state.get('activeTool');
            const selected = this.state.get('selectedBase');

            if (tool === 'pair') {
                if (selected === null) {
                    this.state.set('selectedBase', clickedBase.index);
                } else {
                    // Try to form pair
                    this.tryFormPair(selected, clickedBase.index);
                    this.state.set('selectedBase', null);
                }
            } else if (tool === 'unpair') {
                this.removePairsInvolving(clickedBase.index);
            } else if (tool === 'mutate') {
                this.cycleBase(clickedBase.index);
            }

            this.render();
        }

        handleCanvasHover(e) {
            const canvas = document.getElementById('rna-canvas');
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            const hoverBase = this.basePositions.find(bp => {
                const dist = Math.sqrt((bp.x - x) ** 2 + (bp.y - y) ** 2);
                return dist < 20;
            });

            this.state.set('hoverBase', hoverBase ? hoverBase.index : null, false);
            this.render();
        }

        tryFormPair(i, j) {
            if (i === j) return;
            if (Math.abs(i - j) < 4) {
                this.showFeedback('Pairs must be at least 4 bases apart', 'warning');
                return;
            }

            const sequence = this.state.get('sequence');
            const base1 = sequence[i];
            const base2 = sequence[j];

            // Check if valid pair
            if (!VALID_PAIRS[base1]?.includes(base2)) {
                this.showFeedback(`${base1}-${base2} is not a valid base pair`, 'warning');
                return;
            }

            // Check for crossing pairs (pseudoknots not allowed in simple model)
            const pairs = this.state.get('userPairs');
            const [minIdx, maxIdx] = [Math.min(i, j), Math.max(i, j)];
            
            for (const [pi, pj] of pairs) {
                const [pMin, pMax] = [Math.min(pi, pj), Math.max(pi, pj)];
                // Check for crossing
                if ((minIdx < pMin && pMin < maxIdx && maxIdx < pMax) ||
                    (pMin < minIdx && minIdx < pMax && pMax < maxIdx)) {
                    this.showFeedback('Pseudoknots not allowed in this model', 'warning');
                    return;
                }
            }

            // Check if either base already paired
            for (const [pi, pj] of pairs) {
                if (pi === i || pj === i || pi === j || pj === j) {
                    this.showFeedback('Base already paired', 'warning');
                    return;
                }
            }

            // Add pair
            pairs.push([minIdx, maxIdx]);
            this.state.set('userPairs', pairs);
            this.calculateEnergy();
            AudioFeedback.playStateChange('tick');
        }

        removePairsInvolving(index) {
            const pairs = this.state.get('userPairs');
            const filtered = pairs.filter(([i, j]) => i !== index && j !== index);
            this.state.set('userPairs', filtered);
            this.calculateEnergy();
        }

        cycleBase(index) {
            const sequence = this.state.get('sequence');
            const bases = ['A', 'U', 'G', 'C'];
            const currentBase = sequence[index];
            const nextBase = bases[(bases.indexOf(currentBase) + 1) % 4];
            
            const newSequence = sequence.substring(0, index) + nextBase + sequence.substring(index + 1);
            this.state.set('sequence', newSequence);
            
            // Remove any pairs involving this base
            this.removePairsInvolving(index);
            this.calculateBasePositions();
            this.calculateEnergy();
        }

        calculateEnergy() {
            const pairs = this.state.get('userPairs');
            const sequence = this.state.get('sequence');
            const T = this.state.get('temperature') + 273.15; // Kelvin
            
            let stackingEnergy = 0;
            let loopEnergy = 0;
            let initEnergy = pairs.length > 0 ? RNA_ENERGY.initiation : 0;

            // Sort pairs by first index
            const sortedPairs = [...pairs].sort((a, b) => a[0] - b[0]);

            // Calculate stacking energies
            for (let p = 0; p < sortedPairs.length - 1; p++) {
                const [i1, j1] = sortedPairs[p];
                const [i2, j2] = sortedPairs[p + 1];
                
                // Check if these pairs stack (adjacent and nested)
                if (i2 === i1 + 1 && j2 === j1 - 1) {
                    const stack = `${sequence[i1]}${sequence[j1]}/${sequence[i2]}${sequence[j2]}`;
                    stackingEnergy += RNA_ENERGY.stacking[stack] || -1.5;
                }
            }

            // Hairpin loops
            for (const [i, j] of sortedPairs) {
                // Check if this is a hairpin (no pairs inside)
                let isHairpin = true;
                for (const [pi, pj] of sortedPairs) {
                    if (pi > i && pj < j) {
                        isHairpin = false;
                        break;
                    }
                }
                if (isHairpin) {
                    const loopSize = j - i - 1;
                    loopEnergy += RNA_ENERGY.hairpinLoop[Math.min(loopSize, 10)] || 7.5;
                }
            }

            // Temperature correction (simplified)
            const tempFactor = T / 310.15; // Relative to 37°C
            const totalEnergy = (stackingEnergy + loopEnergy + initEnergy) * tempFactor;

            this.state.set('energyBreakdown', {
                stacking: stackingEnergy,
                loops: loopEnergy,
                initiation: initEnergy,
                total: totalEnergy
            });

            // Update UI
            const container = document.getElementById(this.containerId);
            container.querySelector('#e-stacking').textContent = stackingEnergy.toFixed(1);
            container.querySelector('#e-loops').textContent = loopEnergy.toFixed(1);
            container.querySelector('#e-init').textContent = initEnergy.toFixed(1);
            container.querySelector('#e-total').textContent = totalEnergy.toFixed(1);
            container.querySelector('#rna-energy').textContent = `ΔG: ${totalEnergy.toFixed(1)} kcal/mol`;

            // Update structure info
            container.querySelector('#num-pairs').textContent = pairs.length;
            container.querySelector('#num-unpaired').textContent = sequence.length - pairs.length * 2;

            // Update dot-bracket
            this.updateDotBracket();
        }

        updateDotBracket() {
            const sequence = this.state.get('sequence');
            const pairs = this.state.get('userPairs');
            const n = sequence.length;
            
            const structure = Array(n).fill('.');
            for (const [i, j] of pairs) {
                structure[i] = '(';
                structure[j] = ')';
            }
            
            document.getElementById('dot-bracket').textContent = structure.join('');
        }

        predictMFE() {
            // Simplified Nussinov-style algorithm
            const sequence = this.state.get('sequence');
            const n = sequence.length;
            
            // Dynamic programming table
            const dp = Array(n).fill(null).map(() => Array(n).fill(0));
            const traceback = Array(n).fill(null).map(() => Array(n).fill(null));

            // Fill DP table
            for (let len = 5; len <= n; len++) {
                for (let i = 0; i <= n - len; i++) {
                    const j = i + len - 1;
                    
                    // Case 1: i unpaired
                    dp[i][j] = dp[i + 1][j];
                    traceback[i][j] = { type: 'skip', next: [i + 1, j] };
                    
                    // Case 2: i pairs with some k
                    for (let k = i + 4; k <= j; k++) {
                        if (this.canPair(sequence[i], sequence[k])) {
                            const score = 1 + (i + 1 <= k - 1 ? dp[i + 1][k - 1] : 0) + 
                                         (k + 1 <= j ? dp[k + 1][j] : 0);
                            if (score > dp[i][j]) {
                                dp[i][j] = score;
                                traceback[i][j] = { type: 'pair', i, k, 
                                    left: [i + 1, k - 1], right: [k + 1, j] };
                            }
                        }
                    }
                }
            }

            // Traceback to get pairs
            const mfePairs = [];
            const stack = [[0, n - 1]];
            
            while (stack.length > 0) {
                const [i, j] = stack.pop();
                if (i >= j || !traceback[i][j]) continue;
                
                const tb = traceback[i][j];
                if (tb.type === 'pair') {
                    mfePairs.push([tb.i, tb.k]);
                    if (tb.left[0] <= tb.left[1]) stack.push(tb.left);
                    if (tb.right[0] <= tb.right[1]) stack.push(tb.right);
                } else {
                    stack.push(tb.next);
                }
            }

            this.state.set('mfePairs', mfePairs);
            this.state.set('userPairs', [...mfePairs]);
            this.calculateEnergy();
            this.render();
            
            this.showFeedback(`MFE structure predicted: ${mfePairs.length} base pairs`, 'success');
            AudioFeedback.playStateChange('success');
        }

        canPair(b1, b2) {
            return VALID_PAIRS[b1]?.includes(b2) || false;
        }

        checkAnswer() {
            const challenge = this.state.get('currentChallenge');
            if (!challenge || !challenge.targetPairs) {
                this.showFeedback('No target structure for this challenge', 'info');
                return;
            }

            const userPairs = this.state.get('userPairs');
            const targetPairs = challenge.targetPairs;
            
            // Calculate accuracy
            let correct = 0;
            for (const [ti, tj] of targetPairs) {
                for (const [ui, uj] of userPairs) {
                    if ((ti === ui && tj === uj) || (ti === uj && tj === ui)) {
                        correct++;
                        break;
                    }
                }
            }
            
            const accuracy = targetPairs.length > 0 ? (correct / targetPairs.length) * 100 : 0;
            this.state.set('accuracy', accuracy);
            
            const container = document.getElementById(this.containerId);
            container.querySelector('#accuracy-bar').style.width = accuracy + '%';
            container.querySelector('#accuracy-value').textContent = Math.round(accuracy) + '%';
            
            if (accuracy === 100) {
                this.showFeedback('🎉 Perfect! Structure correctly predicted!', 'success');
                AudioFeedback.playStateChange('levelUp');
            } else if (accuracy >= 75) {
                this.showFeedback('👍 Good! Most pairs correct.', 'info');
            } else {
                this.showFeedback('Try again - check your base pairs', 'warning');
            }
        }

        render() {
            if (!this.ctx) return;
            
            const canvas = this.ctx.canvas;
            const ctx = this.ctx;
            
            // Clear
            ctx.fillStyle = 'rgba(5, 5, 20, 0.95)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const sequence = this.state.get('sequence');
            const pairs = this.state.get('userPairs');
            const selected = this.state.get('selectedBase');
            const hover = this.state.get('hoverBase');

            // Draw base pairs as arcs
            pairs.forEach(([i, j]) => {
                const p1 = this.basePositions[i];
                const p2 = this.basePositions[j];
                
                const midX = (p1.x + p2.x) / 2;
                const midY = Math.min(p1.y, p2.y) - Math.abs(p1.x - p2.x) * 0.3;
                
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
                ctx.strokeStyle = this.getPairColor(sequence[i], sequence[j]);
                ctx.lineWidth = 3;
                ctx.stroke();
            });

            // Draw bases
            this.basePositions.forEach((bp, i) => {
                const isSelected = selected === i;
                const isHovered = hover === i;
                const isPaired = pairs.some(([pi, pj]) => pi === i || pj === i);
                
                // Base circle
                ctx.beginPath();
                ctx.arc(bp.x, bp.y, isSelected || isHovered ? 18 : 15, 0, Math.PI * 2);
                ctx.fillStyle = this.getBaseColor(bp.base);
                ctx.fill();
                
                if (isSelected) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                } else if (isHovered) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                
                // Base letter
                ctx.fillStyle = '#000';
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(bp.base, bp.x, bp.y);
                
                // Index
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '8px monospace';
                ctx.fillText(i + 1, bp.x, bp.y + 25);
            });
        }

        getBaseColor(base) {
            const colors = {
                'A': '#ff6b6b',
                'U': '#0055ff',
                'G': '#ffd700',
                'C': '#00ff88'
            };
            return colors[base] || '#888';
        }

        getPairColor(b1, b2) {
            if ((b1 === 'G' && b2 === 'C') || (b1 === 'C' && b2 === 'G')) {
                return 'rgba(0, 255, 136, 0.6)'; // Strong
            } else if ((b1 === 'A' && b2 === 'U') || (b1 === 'U' && b2 === 'A')) {
                return 'rgba(255, 215, 0, 0.5)'; // Weak
            } else {
                return 'rgba(157, 0, 255, 0.5)'; // Wobble
            }
        }

        showFeedback(message, type = 'info') {
            const feedback = document.getElementById('rna-feedback');
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

    // Export
    window.RNAStructureLab = RNAStructureLab;
    window.initRNAStructureLab = (containerId) => {
        const sim = new RNAStructureLab(containerId);
        sim.init();
        return sim;
    };

    console.log('[RNAStructureLab] Module loaded');
})();
// v20260117-FULL
