/**
 * PatientAnalog.com - Advanced 3D Visualization Modules
 * ctDNA Particles, Protein Structures, AI Panels, Quantum Visualizations
 * 
 * @version 1.0.0
 */

// ============================================
// ctDNA PARTICLE VISUALIZATION
// ============================================
class CtDNAParticleViewer {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container #${containerId} not found`);
        }
        
        // Ensure container has dimensions
        if (this.container.clientWidth === 0 || this.container.clientHeight === 0) {
            this.container.style.minHeight = '350px';
            this.container.style.minWidth = '100%';
        }

        this.options = {
            particleCount: options.particleCount || 500,
            markers: options.markers || ['KRAS', 'BRAF', 'EGFR', 'TP53'],
            bloodStreamSpeed: options.bloodStreamSpeed || 0.5,
            ...options
        };

        this.particles = [];
        this.markerParticles = [];
        this.isRunning = false;

        this.init();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0814);
        this.scene.fog = new THREE.FogExp2(0x0a0814, 0.02);

        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        this.setupLighting();

        // Create blood vessel
        this.createBloodVessel();

        // Create particles
        this.createBloodCells();
        this.createCtDNAParticles();

        // Create UI
        this.createInfoPanel();

        // Start animation
        this.start();

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
        
        // Register for VR integration
        registerViewerForVR(this, 'ctdna');
        
        // Hide loading indicator
        const loading = this.container.querySelector('.viewer-loading');
        if (loading) loading.style.display = 'none';
    }

    setupLighting() {
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);

        const point1 = new THREE.PointLight(0xff4444, 1, 50);
        point1.position.set(0, 10, 0);
        this.scene.add(point1);

        const point2 = new THREE.PointLight(0x00d4ff, 0.5, 50);
        point2.position.set(0, -5, 10);
        this.scene.add(point2);
    }

    createBloodVessel() {
        // Vessel tube
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-30, 0, 0),
            new THREE.Vector3(-15, 2, 5),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(15, -2, -5),
            new THREE.Vector3(30, 0, 0)
        ]);

        const geometry = new THREE.TubeGeometry(curve, 64, 4, 16, false);
        const material = new THREE.MeshPhongMaterial({
            color: 0x8b0000,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        this.vessel = new THREE.Mesh(geometry, material);
        this.scene.add(this.vessel);
        this.vesselCurve = curve;
    }

    createBloodCells() {
        // Red blood cells (biconcave discs)
        const rbcGeometry = new THREE.TorusGeometry(0.3, 0.15, 8, 16);
        const rbcMaterial = new THREE.MeshPhongMaterial({
            color: 0xcc0000,
            emissive: 0x330000,
            shininess: 30
        });

        for (let i = 0; i < 200; i++) {
            const rbc = new THREE.Mesh(rbcGeometry, rbcMaterial.clone());
            const t = Math.random();
            const pos = this.vesselCurve.getPoint(t);
            
            // Random offset within vessel
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3
            );
            rbc.position.copy(pos).add(offset);
            rbc.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            rbc.userData = { t: t, offset: offset, speed: 0.001 + Math.random() * 0.002 };

            this.particles.push(rbc);
            this.scene.add(rbc);
        }
    }

    createCtDNAParticles() {
        // ctDNA particles - small glowing spheres with DNA helix
        const colors = {
            'KRAS': 0x00ff88,
            'BRAF': 0xff6b6b,
            'EGFR': 0x00d4ff,
            'TP53': 0xffc300
        };

        for (let i = 0; i < this.options.particleCount; i++) {
            const marker = this.options.markers[Math.floor(Math.random() * this.options.markers.length)];
            
            // DNA fragment geometry
            const group = new THREE.Group();
            
            // Core sphere
            const coreGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const coreMaterial = new THREE.MeshBasicMaterial({
                color: colors[marker],
                transparent: true,
                opacity: 0.9
            });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            group.add(core);

            // Glow effect
            const glowGeometry = new THREE.SphereGeometry(0.12, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: colors[marker],
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            group.add(glow);

            // Position along vessel
            const t = Math.random();
            const pos = this.vesselCurve.getPoint(t);
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 2.5,
                (Math.random() - 0.5) * 2.5,
                (Math.random() - 0.5) * 2.5
            );
            group.position.copy(pos).add(offset);

            group.userData = {
                marker: marker,
                t: t,
                offset: offset,
                speed: 0.002 + Math.random() * 0.003,
                pulsePhase: Math.random() * Math.PI * 2
            };

            this.markerParticles.push(group);
            this.scene.add(group);
        }
    }

    createInfoPanel() {
        const panel = document.createElement('div');
        panel.className = 'ctdna-info-panel';
        panel.innerHTML = `
            <h4 style="font-family: 'Orbitron', sans-serif; color: #0055ff; margin-bottom: 10px;">ctDNA Detection</h4>
            <div class="marker-legend">
                ${this.options.markers.map(m => `
                    <div class="marker-item" style="display: flex; align-items: center; margin: 5px 0;">
                        <span class="marker-dot" style="width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; background: ${this.getMarkerColor(m)};"></span>
                        <span style="color: rgba(255,255,255,0.8); font-size: 12px;">${m}</span>
                        <span class="marker-count" id="count-${m}" style="margin-left: auto; color: #0055ff;">0</span>
                    </div>
                `).join('')}
            </div>
        `;
        panel.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(10, 22, 40, 0.9);
            border: 1px solid rgba(0, 85, 255, 0.3);
            border-radius: 8px;
            padding: 15px;
            min-width: 150px;
        `;
        this.container.style.position = 'relative';
        this.container.appendChild(panel);
        this.infoPanel = panel;
    }

    getMarkerColor(marker) {
        const colors = { 'KRAS': '#00ff88', 'BRAF': '#ff6b6b', 'EGFR': '#0055ff', 'TP53': '#ffc300' };
        return colors[marker] || '#ffffff';
    }

    updateMarkerCounts() {
        const counts = {};
        this.options.markers.forEach(m => counts[m] = 0);
        
        this.markerParticles.forEach(p => {
            if (p.userData.t > 0.4 && p.userData.t < 0.6) {
                counts[p.userData.marker]++;
            }
        });

        this.options.markers.forEach(m => {
            const el = document.getElementById(`count-${m}`);
            if (el) el.textContent = counts[m];
        });
    }

    animate() {
        if (!this.isRunning) return;

        // Update blood cells
        this.particles.forEach(p => {
            p.userData.t += p.userData.speed;
            if (p.userData.t > 1) p.userData.t = 0;
            
            const pos = this.vesselCurve.getPoint(p.userData.t);
            p.position.copy(pos).add(p.userData.offset);
            p.rotation.x += 0.01;
            p.rotation.z += 0.02;
        });

        // Update ctDNA particles
        this.markerParticles.forEach(p => {
            p.userData.t += p.userData.speed;
            if (p.userData.t > 1) p.userData.t = 0;

            const pos = this.vesselCurve.getPoint(p.userData.t);
            p.position.copy(pos).add(p.userData.offset);

            // Pulse effect
            p.userData.pulsePhase += 0.1;
            const scale = 1 + Math.sin(p.userData.pulsePhase) * 0.2;
            p.scale.set(scale, scale, scale);
        });

        // Update marker counts periodically
        if (Math.random() < 0.02) {
            this.updateMarkerCounts();
        }

        // Slowly rotate camera
        this.camera.position.x = Math.sin(Date.now() * 0.0001) * 3;

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
    }

    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        this.stop();
        this.container.removeChild(this.renderer.domElement);
        if (this.infoPanel) this.container.removeChild(this.infoPanel);
        // Dispose geometries and materials...
    }
}

// ============================================
// PROTEIN STRUCTURE VIEWER
// ============================================
class ProteinStructureViewer {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container #${containerId} not found`);
        }
        
        // Ensure container has dimensions
        if (this.container.clientWidth === 0 || this.container.clientHeight === 0) {
            this.container.style.minHeight = '350px';
            this.container.style.minWidth = '100%';
        }

        this.options = {
            proteinType: options.proteinType || 'kinase',
            showBackbone: options.showBackbone !== false,
            showSurface: options.showSurface || false,
            colorScheme: options.colorScheme || 'secondary',
            ...options
        };

        this.aminoAcids = [];
        this.bonds = [];
        this.isRunning = false;

        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510);

        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 50);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 1);
        directional.position.set(10, 10, 10);
        this.scene.add(directional);

        // Create protein structure
        this.createProteinStructure();

        // Controls
        this.setupControls();

        // Start
        this.start();

        window.addEventListener('resize', () => this.onResize());
        
        // Register for VR integration
        registerViewerForVR(this, 'protein');
        
        // Hide loading indicator
        const loading = this.container.querySelector('.viewer-loading');
        if (loading) loading.style.display = 'none';
    }

    createProteinStructure() {
        // Generate a simplified protein backbone
        const proteinGroup = new THREE.Group();

        // Helix parameters
        const numResidues = 100;
        const helixRadius = 5;
        const helixPitch = 2;

        // Secondary structure colors
        const colors = {
            helix: 0xf72585,
            sheet: 0x00d4ff,
            coil: 0x7dd3fc
        };

        // Create backbone
        const backbonePoints = [];
        for (let i = 0; i < numResidues; i++) {
            const t = i / numResidues;
            let x, y, z;

            // Alternate between helix, sheet, and coil
            if (i < 30) {
                // Alpha helix
                const angle = i * 0.6;
                x = Math.cos(angle) * helixRadius;
                y = i * 0.5 - 15;
                z = Math.sin(angle) * helixRadius;
            } else if (i < 50) {
                // Beta sheet
                x = (i - 40) * 1.5;
                y = Math.sin((i - 30) * 0.5) * 3;
                z = ((i - 30) % 2) * 3 - 1.5;
            } else {
                // Random coil
                const angle = i * 0.3;
                x = Math.cos(angle) * (3 + Math.sin(i * 0.2) * 2);
                y = (i - 50) * 0.4 + 10;
                z = Math.sin(angle) * (3 + Math.cos(i * 0.2) * 2);
            }

            backbonePoints.push(new THREE.Vector3(x, y, z));

            // Amino acid sphere
            const aaGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            let color = colors.coil;
            if (i < 30) color = colors.helix;
            else if (i < 50) color = colors.sheet;

            const aaMaterial = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.2
            });
            const aaMesh = new THREE.Mesh(aaGeometry, aaMaterial);
            aaMesh.position.set(x, y, z);
            proteinGroup.add(aaMesh);
            this.aminoAcids.push(aaMesh);
        }

        // Create backbone tube
        if (this.options.showBackbone && backbonePoints.length > 1) {
            const curve = new THREE.CatmullRomCurve3(backbonePoints);
            const tubeGeometry = new THREE.TubeGeometry(curve, 200, 0.2, 8, false);
            const tubeMaterial = new THREE.MeshPhongMaterial({
                color: 0x7dd3fc,
                transparent: true,
                opacity: 0.6
            });
            const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
            proteinGroup.add(tube);
        }

        this.proteinGroup = proteinGroup;
        this.scene.add(proteinGroup);
    }

    setupControls() {
        this.isDragging = false;
        this.previousMouse = { x: 0, y: 0 };

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMouse = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.previousMouse.x;
            const deltaY = e.clientY - this.previousMouse.y;

            this.proteinGroup.rotation.y += deltaX * 0.01;
            this.proteinGroup.rotation.x += deltaY * 0.01;

            this.previousMouse = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.renderer.domElement.addEventListener('wheel', (e) => {
            this.camera.position.z += e.deltaY * 0.05;
            this.camera.position.z = Math.max(20, Math.min(100, this.camera.position.z));
        });
    }

    animate() {
        if (!this.isRunning) return;

        // Auto-rotate if not dragging
        if (!this.isDragging) {
            this.proteinGroup.rotation.y += 0.002;
        }

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
    }

    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        this.stop();
        this.container.removeChild(this.renderer.domElement);
    }
}

// ============================================
// AI PREDICTION 3D PANEL
// ============================================
class AIPrediction3DPanel {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container #${containerId} not found`);
        }
        
        // Ensure container has dimensions
        if (this.container.clientWidth === 0 || this.container.clientHeight === 0) {
            this.container.style.minHeight = '350px';
            this.container.style.minWidth = '100%';
        }

        this.options = {
            model: options.model || 'Transformer',
            inputs: options.inputs || ['SMILES', 'Target', 'Dose'],
            outputs: options.outputs || ['Efficacy', 'Toxicity', 'ADME'],
            ...options
        };

        this.nodes = [];
        this.connections = [];
        this.isRunning = false;
        this.predictionData = null;

        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510);

        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(0, 5, 20);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);

        // Create neural network visualization
        this.createNeuralNetwork();

        // Create UI overlay
        this.createUIOverlay();

        // Start
        this.start();

        window.addEventListener('resize', () => this.onResize());
        
        // Register for VR integration
        registerViewerForVR(this, 'ai-panel');
        
        // Hide loading indicator
        const loading = this.container.querySelector('.viewer-loading');
        if (loading) loading.style.display = 'none';
    }

    createNeuralNetwork() {
        const layers = [
            { count: this.options.inputs.length, x: -8, color: 0x00d4ff, labels: this.options.inputs },
            { count: 8, x: -4, color: 0x7dd3fc },
            { count: 12, x: 0, color: 0xf72585 },
            { count: 8, x: 4, color: 0x7dd3fc },
            { count: this.options.outputs.length, x: 8, color: 0x00ff88, labels: this.options.outputs }
        ];

        // Create nodes
        layers.forEach((layer, layerIndex) => {
            const layerNodes = [];
            for (let i = 0; i < layer.count; i++) {
                const y = (i - (layer.count - 1) / 2) * 2;

                const nodeGeometry = new THREE.SphereGeometry(0.4, 16, 16);
                const nodeMaterial = new THREE.MeshPhongMaterial({
                    color: layer.color,
                    emissive: layer.color,
                    emissiveIntensity: 0.3
                });
                const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
                node.position.set(layer.x, y, 0);
                node.userData = {
                    layer: layerIndex,
                    index: i,
                    activation: 0,
                    label: layer.labels ? layer.labels[i] : null
                };

                this.scene.add(node);
                layerNodes.push(node);
                this.nodes.push(node);
            }

            // Connect to previous layer
            if (layerIndex > 0) {
                const prevLayer = layers[layerIndex - 1];
                const prevNodes = this.nodes.slice(-layer.count - prevLayer.count, -layer.count);

                layerNodes.forEach(targetNode => {
                    prevNodes.forEach(sourceNode => {
                        if (Math.random() > 0.3) { // Not fully connected for visual clarity
                            const points = [sourceNode.position.clone(), targetNode.position.clone()];
                            const geometry = new THREE.BufferGeometry().setFromPoints(points);
                            const material = new THREE.LineBasicMaterial({
                                color: 0x00d4ff,
                                transparent: true,
                                opacity: 0.2
                            });
                            const line = new THREE.Line(geometry, material);
                            line.userData = { source: sourceNode, target: targetNode };
                            this.scene.add(line);
                            this.connections.push(line);
                        }
                    });
                });
            }
        });
    }

    createUIOverlay() {
        const panel = document.createElement('div');
        panel.innerHTML = `
            <div style="font-family: 'Orbitron', sans-serif; color: #0055ff; font-size: 14px; margin-bottom: 15px;">
                AI PREDICTION ENGINE
            </div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 10px;">
                Model: ${this.options.model}
            </div>
            <div id="ai-outputs" style="margin-top: 15px;"></div>
            <button id="run-prediction" style="
                margin-top: 15px;
                padding: 8px 16px;
                background: linear-gradient(135deg, rgba(0, 85, 255, 0.3), rgba(255, 170, 0, 0.3));
                border: 1px solid #0055ff;
                border-radius: 4px;
                color: #fff;
                cursor: pointer;
                font-family: 'Orbitron', sans-serif;
                font-size: 11px;
            ">RUN PREDICTION</button>
        `;
        panel.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(10, 22, 40, 0.9);
            border: 1px solid rgba(0, 85, 255, 0.3);
            border-radius: 8px;
            padding: 15px;
            min-width: 180px;
        `;
        this.container.style.position = 'relative';
        this.container.appendChild(panel);

        // Run prediction button
        const runBtn = panel.querySelector('#run-prediction');
        if (runBtn) {
            runBtn.addEventListener('click', () => {
                this.runPrediction();
            });
        }

        this.uiPanel = panel;
    }

    runPrediction() {
        // Animate signal through network
        this.animateSignal();

        // Generate mock prediction
        setTimeout(() => {
            const outputs = {};
            this.options.outputs.forEach(out => {
                outputs[out] = (Math.random() * 0.4 + 0.6).toFixed(2);
            });

            const outputDiv = this.uiPanel.querySelector('#ai-outputs');
            outputDiv.innerHTML = this.options.outputs.map(out => `
                <div style="display: flex; justify-content: space-between; margin: 5px 0; font-size: 11px;">
                    <span style="color: rgba(255,255,255,0.7);">${out}:</span>
                    <span style="color: #00ff88;">${outputs[out]}</span>
                </div>
            `).join('');

            // Emit event
            if (window.EventBus) {
                EventBus.emit('aiPredictionComplete', outputs);
            }
        }, 1500);
    }

    animateSignal() {
        // Animate nodes layer by layer
        const animateLayer = (layerIndex) => {
            const layerNodes = this.nodes.filter(n => n.userData.layer === layerIndex);
            
            layerNodes.forEach((node, i) => {
                setTimeout(() => {
                    node.material.emissiveIntensity = 1;
                    setTimeout(() => {
                        node.material.emissiveIntensity = 0.3;
                    }, 200);
                }, i * 50);
            });

            if (layerIndex < 4) {
                setTimeout(() => animateLayer(layerIndex + 1), 300);
            }
        };

        animateLayer(0);
    }

    animate() {
        if (!this.isRunning) return;

        // Gentle camera movement
        this.camera.position.y = 5 + Math.sin(Date.now() * 0.001) * 0.5;

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
    }

    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        this.stop();
        this.container.removeChild(this.renderer.domElement);
        this.container.removeChild(this.uiPanel);
    }
}

// ============================================
// QUANTUM VISUALIZER
// ============================================
class QuantumVisualizer {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container #${containerId} not found`);
        }
        
        // Ensure container has dimensions
        if (this.container.clientWidth === 0 || this.container.clientHeight === 0) {
            this.container.style.minHeight = '350px';
            this.container.style.minWidth = '100%';
        }

        this.options = {
            qubits: options.qubits || 8,
            showProbabilities: options.showProbabilities !== false,
            ...options
        };

        this.qubits = [];
        this.entanglements = [];
        this.isRunning = false;

        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x030308);

        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambient);

        // Create quantum circuit visualization
        this.createQuantumCircuit();

        // Create UI
        this.createUI();

        // Start
        this.start();

        window.addEventListener('resize', () => this.onResize());
        
        // Register for VR integration
        registerViewerForVR(this, 'quantum');
        
        // Hide loading indicator
        const loading = this.container.querySelector('.viewer-loading');
        if (loading) loading.style.display = 'none';
    }

    createQuantumCircuit() {
        // Qubit spheres (Bloch spheres simplified)
        for (let i = 0; i < this.options.qubits; i++) {
            const qubitGroup = new THREE.Group();

            // Bloch sphere
            const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
            const sphereMaterial = new THREE.MeshPhongMaterial({
                color: 0x00d4ff,
                transparent: true,
                opacity: 0.3,
                wireframe: true
            });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            qubitGroup.add(sphere);

            // State vector
            const vectorGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8);
            const vectorMaterial = new THREE.MeshPhongMaterial({
                color: 0xf72585,
                emissive: 0xf72585,
                emissiveIntensity: 0.5
            });
            const vector = new THREE.Mesh(vectorGeometry, vectorMaterial);
            vector.position.y = 0.4;
            vector.rotation.z = Math.random() * Math.PI; // Random initial state
            qubitGroup.add(vector);

            // Equator ring
            const ringGeometry = new THREE.TorusGeometry(1, 0.02, 8, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            qubitGroup.add(ring);

            // Position in grid
            const row = Math.floor(i / 4);
            const col = i % 4;
            qubitGroup.position.set((col - 1.5) * 4, 0, (row - 0.5) * 4);

            qubitGroup.userData = {
                index: i,
                theta: Math.random() * Math.PI,
                phi: Math.random() * Math.PI * 2,
                vector: vector
            };

            this.qubits.push(qubitGroup);
            this.scene.add(qubitGroup);
        }

        // Create entanglement lines
        for (let i = 0; i < this.options.qubits - 1; i++) {
            if (Math.random() > 0.5) {
                const q1 = this.qubits[i];
                const q2 = this.qubits[i + 1];

                const points = [q1.position.clone(), q2.position.clone()];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineDashedMaterial({
                    color: 0xffc300,
                    dashSize: 0.3,
                    gapSize: 0.1
                });
                const line = new THREE.Line(geometry, material);
                line.computeLineDistances();
                this.entanglements.push(line);
                this.scene.add(line);
            }
        }
    }

    createUI() {
        const panel = document.createElement('div');
        panel.innerHTML = `
            <div style="font-family: 'Orbitron', sans-serif; color: #ffc300; font-size: 14px; margin-bottom: 15px;">
                QUANTUM STATE VISUALIZER
            </div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.7);">
                Qubits: ${this.options.qubits}
            </div>
            <div id="quantum-states" style="margin-top: 15px; font-size: 10px;"></div>
            <button id="measure" style="
                margin-top: 15px;
                padding: 8px 16px;
                background: linear-gradient(135deg, rgba(255, 195, 0, 0.3), rgba(255, 170, 0, 0.3));
                border: 1px solid #ffc300;
                border-radius: 4px;
                color: #fff;
                cursor: pointer;
                font-family: 'Orbitron', sans-serif;
                font-size: 11px;
            ">MEASURE</button>
        `;
        panel.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(10, 22, 40, 0.9);
            border: 1px solid rgba(255, 195, 0, 0.3);
            border-radius: 8px;
            padding: 15px;
            min-width: 150px;
        `;
        this.container.style.position = 'relative';
        this.container.appendChild(panel);

        panel.querySelector('#measure').addEventListener('click', () => {
            this.measure();
        });

        this.uiPanel = panel;
    }

    measure() {
        // Collapse qubits to |0⟩ or |1⟩
        const results = [];

        this.qubits.forEach(qubit => {
            const result = Math.random() > 0.5 ? 1 : 0;
            results.push(result);

            // Animate vector to |0⟩ or |1⟩
            const targetAngle = result === 0 ? 0 : Math.PI;
            qubit.userData.vector.rotation.z = targetAngle;

            // Flash effect
            qubit.children[0].material.opacity = 0.8;
            setTimeout(() => {
                qubit.children[0].material.opacity = 0.3;
            }, 200);
        });

        // Update UI
        const statesDiv = this.uiPanel.querySelector('#quantum-states');
        statesDiv.innerHTML = `
            <div style="color: #00ff88; margin-bottom: 5px;">Result: |${results.join('')}⟩</div>
            <div style="color: rgba(255,255,255,0.6);">Probability: ${(1 / Math.pow(2, this.options.qubits) * 100).toFixed(4)}%</div>
        `;

        if (window.EventBus) {
            EventBus.emit('quantumMeasurement', { results });
        }
    }

    animate() {
        if (!this.isRunning) return;

        // Rotate qubit vectors (superposition animation)
        this.qubits.forEach(qubit => {
            qubit.userData.phi += 0.02;
            qubit.userData.vector.rotation.y = qubit.userData.phi;
        });

        // Rotate camera slowly
        const time = Date.now() * 0.0003;
        this.camera.position.x = Math.sin(time) * 20;
        this.camera.position.z = Math.cos(time) * 20;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
    }

    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        this.stop();
        this.container.removeChild(this.renderer.domElement);
        this.container.removeChild(this.uiPanel);
    }
}

// ============================================
// EXPORT ALL MODULES
// ============================================
if (typeof window !== 'undefined') {
    window.CtDNAParticleViewer = CtDNAParticleViewer;
    window.ProteinStructureViewer = ProteinStructureViewer;
    window.AIPrediction3DPanel = AIPrediction3DPanel;
    window.QuantumVisualizer = QuantumVisualizer;
    
    // Store references to active viewers for VR integration
    window.Active3DViewers = window.Active3DViewers || {};
}

// Helper to register viewer for VR
function registerViewerForVR(viewer, type) {
    if (typeof window !== 'undefined' && window.Active3DViewers) {
        window.Active3DViewers[type] = viewer;
        
        // Emit event for VR system to attach
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('3dViewerReady', {
                type: type,
                renderer: viewer.renderer,
                scene: viewer.scene,
                camera: viewer.camera
            });
        }
        
        // Try to create VR button for first available viewer
        if (typeof VRSystem !== 'undefined' && !document.getElementById('vr-button')) {
            VRSystem.createEnterVRButton(viewer.renderer, viewer.scene, viewer.camera);
        }
    }
}
// v20260117-FULL
