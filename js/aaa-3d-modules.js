/**
 * PatientAnalog.com - AAA 3D Biotech Modules
 * Two new interactive 3D visualization modules
 * 
 * Module 1: Advanced Biomarker Flow Visualizer
 * Module 2: Multi-Organ Chip Platform
 * 
 * @version 1.0.0
 * @requires Three.js r128+
 * @requires aaa-game-engine.js
 */

(function() {
    'use strict';

    console.log('[AAA-3D-Modules] Initializing biotech visualizers...');

    // Check dependencies
    if (typeof THREE === 'undefined') {
        console.warn('[AAA-3D-Modules] Three.js not loaded, deferring initialization');
        return;
    }

    // ═══════════════════════════════════════════════════════════
    // SHARED 3D UTILITIES
    // ═══════════════════════════════════════════════════════════
    
    const ModuleUtils = {
        // Get performance tier from AAA Engine
        getTier: function() {
            if (window.AAAEngine && window.AAAEngine.Device) {
                return window.AAAEngine.Device.getPerformanceTier();
            }
            return 'medium';
        },
        
        // Create glowing material
        createGlowMaterial: function(color, intensity) {
            return new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: intensity || 0.4,
                metalness: 0.3,
                roughness: 0.4,
                transparent: true,
                opacity: 0.9
            });
        },
        
        // Create particle system for flow effects
        createFlowParticles: function(scene, options) {
            const opts = Object.assign({
                count: 200,
                color: 0x00FFFF,
                size: 0.03,
                pathLength: 10,
                speed: 0.02
            }, options);
            
            const tier = this.getTier();
            const particleCount = tier === 'low' ? 50 : (tier === 'medium' ? 100 : opts.count);
            
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const phases = new Float32Array(particleCount);
            
            const color = new THREE.Color(opts.color);
            
            for (let i = 0; i < particleCount; i++) {
                phases[i] = Math.random();
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            const material = new THREE.PointsMaterial({
                size: opts.size,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            const particles = new THREE.Points(geometry, material);
            particles.userData = { phases, opts };
            
            if (scene) scene.add(particles);
            return particles;
        },
        
        // Dispose of Three.js objects properly
        dispose: function(obj) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        }
    };

    // ═══════════════════════════════════════════════════════════
    // MODULE 1: ADVANCED BIOMARKER FLOW VISUALIZER
    // ═══════════════════════════════════════════════════════════
    
    const BiomarkerFlowModule = {
        containerId: 'biomarker-flow-module',
        scene: null,
        camera: null,
        renderer: null,
        particles: null,
        biomarkers: [],
        animationId: null,
        isRunning: false,
        score: 0,
        stage: 0,
        maxStages: 4,
        
        // Biomarker types with colors
        biomarkerTypes: [
            { name: 'KRAS', color: 0xFF6B6B, description: 'Oncogene mutation marker' },
            { name: 'BRAF', color: 0x4ECDC4, description: 'Melanoma pathway marker' },
            { name: 'EGFR', color: 0xFFE66D, description: 'Growth factor receptor' },
            { name: 'TP53', color: 0x9D00FF, description: 'Tumor suppressor marker' },
            { name: 'HER2', color: 0x00FFFF, description: 'Breast cancer marker' }
        ],
        
        init: function(containerId) {
            this.containerId = containerId || this.containerId;
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.warn('[Biomarker] Container not found:', this.containerId);
                return false;
            }
            
            // Clear existing content
            container.innerHTML = '';
            
            // Setup scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x050510);
            
            // Camera
            this.camera = new THREE.PerspectiveCamera(
                60,
                container.clientWidth / container.clientHeight,
                0.1,
                1000
            );
            this.camera.position.set(0, 2, 8);
            this.camera.lookAt(0, 0, 0);
            
            // Renderer
            const tier = ModuleUtils.getTier();
            this.renderer = new THREE.WebGLRenderer({
                antialias: tier !== 'low',
                alpha: true
            });
            this.renderer.setSize(container.clientWidth, container.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === 'low' ? 1 : 2));
            container.appendChild(this.renderer.domElement);
            
            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            this.scene.add(ambientLight);
            
            const pointLight = new THREE.PointLight(0x00FFFF, 1, 20);
            pointLight.position.set(5, 5, 5);
            this.scene.add(pointLight);
            
            // Create blood vessel tube
            this.createBloodVessel();
            
            // Create flow particles
            this.particles = ModuleUtils.createFlowParticles(this.scene, {
                count: 300,
                color: 0xFF4444,
                size: 0.02
            });
            
            // Create UI
            this.createUI(container);
            
            // Setup interaction
            this.setupInteraction(container);
            
            // Handle resize
            this.handleResize = () => {
                this.camera.aspect = container.clientWidth / container.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(container.clientWidth, container.clientHeight);
            };
            window.addEventListener('resize', this.handleResize);
            
            console.log('[Biomarker] Module initialized');
            return true;
        },
        
        createBloodVessel: function() {
            // Create curved tube for blood vessel
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-6, 0, 0),
                new THREE.Vector3(-3, 0.5, 1),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(3, -0.5, -1),
                new THREE.Vector3(6, 0, 0)
            ]);
            
            const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.8, 16, false);
            const tubeMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B0000,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide
            });
            
            const vessel = new THREE.Mesh(tubeGeometry, tubeMaterial);
            this.scene.add(vessel);
            
            // Inner glow
            const innerGeometry = new THREE.TubeGeometry(curve, 64, 0.6, 16, false);
            const innerMaterial = new THREE.MeshBasicMaterial({
                color: 0xFF0000,
                transparent: true,
                opacity: 0.2
            });
            const innerVessel = new THREE.Mesh(innerGeometry, innerMaterial);
            this.scene.add(innerVessel);
        },
        
        createUI: function(container) {
            const ui = document.createElement('div');
            ui.id = 'biomarker-ui';
            ui.innerHTML = `
                <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 15px; border-radius: 10px; border: 1px solid #0055ff; font-family: 'Orbitron', sans-serif; color: #fff; max-width: 200px;">
                    <div style="color: #0055ff; font-size: 14px; margin-bottom: 10px;">🧬 Liquid Biopsy Lab</div>
                    <div style="font-size: 12px; margin-bottom: 5px;">Stage: <span id="biomarker-stage">1</span>/${this.maxStages}</div>
                    <div style="font-size: 12px; margin-bottom: 10px;">Score: <span id="biomarker-score">0</span></div>
                    <div style="font-size: 11px; color: #888;" id="biomarker-instruction">Click biomarkers to capture them!</div>
                </div>
                <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px;">
                    <button id="biomarker-start" style="padding: 10px 20px; background: linear-gradient(135deg, rgba(0,255,255,0.3), rgba(157,0,255,0.2)); border: 1px solid #0055ff; border-radius: 8px; color: #fff; cursor: pointer; font-family: 'Orbitron', sans-serif;">Start Analysis</button>
                </div>
            `;
            ui.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none;';
            ui.querySelector('#biomarker-start').style.pointerEvents = 'auto';
            container.style.position = 'relative';
            container.appendChild(ui);
            
            // Button handler
            document.getElementById('biomarker-start').addEventListener('click', () => this.startGame());
        },
        
        setupInteraction: function(container) {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            
            const onClick = (event) => {
                if (!this.isRunning) return;
                
                const rect = container.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                
                raycaster.setFromCamera(mouse, this.camera);
                const intersects = raycaster.intersectObjects(this.biomarkers);
                
                if (intersects.length > 0) {
                    this.captureBiomarker(intersects[0].object);
                }
            };
            
            container.addEventListener('click', onClick);
            container.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                onClick({ clientX: touch.clientX, clientY: touch.clientY });
            });
        },
        
        startGame: function() {
            this.score = 0;
            this.stage = 1;
            this.isRunning = true;
            this.updateUI();
            this.spawnBiomarkers();
            this.animate();
            
            if (window.AAAEngine) {
                AAAEngine.playSound('click');
            }
            
            document.getElementById('biomarker-start').textContent = 'Analyzing...';
            document.getElementById('biomarker-instruction').textContent = 'Click the glowing biomarkers!';
        },
        
        spawnBiomarkers: function() {
            // Clear existing biomarkers
            this.biomarkers.forEach(b => {
                this.scene.remove(b);
                ModuleUtils.dispose(b);
            });
            this.biomarkers = [];
            
            // Spawn new ones based on stage
            const count = 2 + this.stage;
            for (let i = 0; i < count; i++) {
                const type = this.biomarkerTypes[Math.floor(Math.random() * this.biomarkerTypes.length)];
                const geometry = new THREE.SphereGeometry(0.15, 16, 16);
                const material = ModuleUtils.createGlowMaterial(type.color, 0.6);
                const marker = new THREE.Mesh(geometry, material);
                
                marker.position.set(
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 1.5,
                    (Math.random() - 0.5) * 2
                );
                marker.userData = { type: type, speed: 0.01 + Math.random() * 0.02 };
                
                this.scene.add(marker);
                this.biomarkers.push(marker);
            }
        },
        
        captureBiomarker: function(marker) {
            this.score += 10 * this.stage;
            
            // Remove marker with effect
            const idx = this.biomarkers.indexOf(marker);
            if (idx > -1) {
                this.biomarkers.splice(idx, 1);
                this.scene.remove(marker);
                ModuleUtils.dispose(marker);
            }
            
            if (window.AAAEngine) {
                AAAEngine.playSound('success');
            }
            
            this.updateUI();
            
            // Check stage completion
            if (this.biomarkers.length === 0) {
                this.nextStage();
            }
        },
        
        nextStage: function() {
            this.stage++;
            
            if (this.stage > this.maxStages) {
                this.endGame(true);
            } else {
                if (window.AAAEngine) {
                    AAAEngine.playSound('levelUp');
                }
                document.getElementById('biomarker-instruction').textContent = `Stage ${this.stage} - More biomarkers!`;
                this.spawnBiomarkers();
            }
            
            this.updateUI();
        },
        
        endGame: function(won) {
            this.isRunning = false;
            cancelAnimationFrame(this.animationId);
            
            if (won && window.AAAEngine) {
                AAAEngine.celebrate(this.containerId, '🧬 Analysis Complete!');
            }
            
            document.getElementById('biomarker-start').textContent = 'Play Again';
            document.getElementById('biomarker-instruction').textContent = won ? 
                `Complete! Score: ${this.score}` : 'Try again!';
        },
        
        updateUI: function() {
            document.getElementById('biomarker-stage').textContent = this.stage;
            document.getElementById('biomarker-score').textContent = this.score;
        },
        
        animate: function() {
            if (!this.isRunning) return;
            
            this.animationId = requestAnimationFrame(() => this.animate());
            
            // Animate biomarkers (floating motion)
            this.biomarkers.forEach(marker => {
                marker.position.x += marker.userData.speed;
                marker.position.y += Math.sin(Date.now() * 0.002 + marker.position.x) * 0.002;
                marker.rotation.y += 0.02;
                
                // Wrap around
                if (marker.position.x > 6) {
                    marker.position.x = -6;
                }
            });
            
            // Animate flow particles
            if (this.particles) {
                const positions = this.particles.geometry.attributes.position.array;
                const phases = this.particles.userData.phases;
                
                for (let i = 0; i < phases.length; i++) {
                    phases[i] += 0.005;
                    if (phases[i] > 1) phases[i] = 0;
                    
                    const t = phases[i];
                    positions[i * 3] = -6 + t * 12;
                    positions[i * 3 + 1] = Math.sin(t * Math.PI * 2) * 0.3;
                    positions[i * 3 + 2] = Math.cos(t * Math.PI * 2) * 0.3;
                }
                this.particles.geometry.attributes.position.needsUpdate = true;
            }
            
            this.renderer.render(this.scene, this.camera);
        },
        
        destroy: function() {
            this.isRunning = false;
            cancelAnimationFrame(this.animationId);
            window.removeEventListener('resize', this.handleResize);
            
            if (this.renderer) {
                this.renderer.dispose();
            }
        }
    };

    // ═══════════════════════════════════════════════════════════
    // MODULE 2: MULTI-ORGAN CHIP PLATFORM
    // ═══════════════════════════════════════════════════════════
    
    const MultiOrganChipModule = {
        containerId: 'multiorgan-chip-module',
        scene: null,
        camera: null,
        renderer: null,
        chips: [],
        connections: [],
        animationId: null,
        isRunning: false,
        flowRate: 50,
        pressure: 50,
        activeChips: 0,
        stage: 0,
        maxStages: 3,
        
        // Organ chip types
        organTypes: [
            { name: 'Liver', color: 0x8B4513, icon: '🫁', position: [-2, 1, 0] },
            { name: 'Heart', color: 0xFF0000, icon: '❤️', position: [0, 1.5, 0] },
            { name: 'Kidney', color: 0x8B0000, icon: '🫘', position: [2, 1, 0] },
            { name: 'Lung', color: 0xFFC0CB, icon: '🫁', position: [-2, -1, 0] },
            { name: 'Brain', color: 0xFFB6C1, icon: '🧠', position: [0, -1.5, 0] },
            { name: 'Gut', color: 0xDEB887, icon: '🧬', position: [2, -1, 0] }
        ],
        
        init: function(containerId) {
            this.containerId = containerId || this.containerId;
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.warn('[MultiOrgan] Container not found:', this.containerId);
                return false;
            }
            
            container.innerHTML = '';
            
            // Scene setup
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0A0F2C);
            
            // Camera
            this.camera = new THREE.PerspectiveCamera(
                50,
                container.clientWidth / container.clientHeight,
                0.1,
                1000
            );
            this.camera.position.set(0, 0, 8);
            
            // Renderer
            const tier = ModuleUtils.getTier();
            this.renderer = new THREE.WebGLRenderer({
                antialias: tier !== 'low',
                alpha: true
            });
            this.renderer.setSize(container.clientWidth, container.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === 'low' ? 1 : 2));
            container.appendChild(this.renderer.domElement);
            
            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);
            
            const spotLight = new THREE.SpotLight(0x00FFFF, 0.8);
            spotLight.position.set(0, 5, 5);
            this.scene.add(spotLight);
            
            // Create organ chips
            this.createOrganChips();
            
            // Create connections
            this.createConnections();
            
            // Create UI
            this.createUI(container);
            
            // Setup interaction
            this.setupInteraction(container);
            
            // Resize handler
            this.handleResize = () => {
                this.camera.aspect = container.clientWidth / container.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(container.clientWidth, container.clientHeight);
            };
            window.addEventListener('resize', this.handleResize);
            
            // Start rendering
            this.animate();
            
            console.log('[MultiOrgan] Module initialized');
            return true;
        },
        
        createOrganChips: function() {
            this.chips = [];
            
            this.organTypes.forEach((organ, index) => {
                // Create chip base
                const chipGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.2);
                const chipMaterial = new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    metalness: 0.5,
                    roughness: 0.3
                });
                const chip = new THREE.Mesh(chipGeometry, chipMaterial);
                chip.position.set(...organ.position);
                
                // Add organ chamber (glowing center)
                const chamberGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16);
                const chamberMaterial = ModuleUtils.createGlowMaterial(organ.color, 0.3);
                const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
                chamber.rotation.x = Math.PI / 2;
                chamber.position.z = 0.1;
                chip.add(chamber);
                
                // Add label
                chip.userData = { 
                    organ: organ, 
                    index: index, 
                    active: false,
                    chamber: chamber
                };
                
                this.scene.add(chip);
                this.chips.push(chip);
            });
        },
        
        createConnections: function() {
            // Create microfluidic channels between chips
            const connectionPairs = [
                [0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5]
            ];
            
            connectionPairs.forEach(([a, b]) => {
                const start = new THREE.Vector3(...this.organTypes[a].position);
                const end = new THREE.Vector3(...this.organTypes[b].position);
                const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
                mid.z = 0.3;
                
                const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
                const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.03, 8, false);
                const tubeMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00FFFF,
                    transparent: true,
                    opacity: 0.4
                });
                
                const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
                tube.userData = { start: a, end: b, active: false };
                this.scene.add(tube);
                this.connections.push(tube);
            });
        },
        
        createUI: function(container) {
            const ui = document.createElement('div');
            ui.id = 'multiorgan-ui';
            ui.innerHTML = `
                <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 10px; border: 1px solid #9D00FF; font-family: 'Orbitron', sans-serif; color: #fff; max-width: 220px;">
                    <div style="color: #9D00FF; font-size: 14px; margin-bottom: 10px;">🔬 Body-on-Chip Platform</div>
                    <div style="font-size: 12px; margin-bottom: 8px;">Stage: <span id="moc-stage">Setup</span></div>
                    <div style="font-size: 12px; margin-bottom: 8px;">Active Organs: <span id="moc-active">0</span>/6</div>
                    <div style="margin: 10px 0;">
                        <label style="font-size: 11px; display: block; margin-bottom: 5px;">Flow Rate: <span id="moc-flow-val">50</span>%</label>
                        <input type="range" id="moc-flow" min="0" max="100" value="50" style="width: 100%; accent-color: #0055ff;">
                    </div>
                    <div style="margin: 10px 0;">
                        <label style="font-size: 11px; display: block; margin-bottom: 5px;">Pressure: <span id="moc-pressure-val">50</span>%</label>
                        <input type="range" id="moc-pressure" min="0" max="100" value="50" style="width: 100%; accent-color: #9D00FF;">
                    </div>
                    <div style="font-size: 11px; color: #888; margin-top: 10px;" id="moc-instruction">Click organs to activate. Balance flow & pressure!</div>
                </div>
                <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);">
                    <button id="moc-calibrate" style="padding: 10px 20px; background: linear-gradient(135deg, rgba(157,0,255,0.3), rgba(0,255,255,0.2)); border: 1px solid #9D00FF; border-radius: 8px; color: #fff; cursor: pointer; font-family: 'Orbitron', sans-serif;">Calibrate System</button>
                </div>
            `;
            ui.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none;';
            ui.querySelectorAll('button, input').forEach(el => el.style.pointerEvents = 'auto');
            container.style.position = 'relative';
            container.appendChild(ui);
            
            // Slider handlers
            document.getElementById('moc-flow').addEventListener('input', (e) => {
                this.flowRate = parseInt(e.target.value);
                document.getElementById('moc-flow-val').textContent = this.flowRate;
            });
            
            document.getElementById('moc-pressure').addEventListener('input', (e) => {
                this.pressure = parseInt(e.target.value);
                document.getElementById('moc-pressure-val').textContent = this.pressure;
            });
            
            document.getElementById('moc-calibrate').addEventListener('click', () => this.calibrate());
        },
        
        setupInteraction: function(container) {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            
            const onClick = (event) => {
                const rect = container.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                
                raycaster.setFromCamera(mouse, this.camera);
                const intersects = raycaster.intersectObjects(this.chips);
                
                if (intersects.length > 0) {
                    this.toggleChip(intersects[0].object);
                }
            };
            
            container.addEventListener('click', onClick);
            container.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                onClick({ clientX: touch.clientX, clientY: touch.clientY });
            });
        },
        
        toggleChip: function(chip) {
            chip.userData.active = !chip.userData.active;
            
            // Visual feedback
            const chamber = chip.userData.chamber;
            if (chip.userData.active) {
                chamber.material.emissiveIntensity = 0.8;
                this.activeChips++;
                if (window.AAAEngine) AAAEngine.playSound('success');
            } else {
                chamber.material.emissiveIntensity = 0.3;
                this.activeChips--;
                if (window.AAAEngine) AAAEngine.playSound('click');
            }
            
            // Update connections
            this.updateConnections();
            this.updateUI();
        },
        
        updateConnections: function() {
            this.connections.forEach(conn => {
                const startActive = this.chips[conn.userData.start].userData.active;
                const endActive = this.chips[conn.userData.end].userData.active;
                
                if (startActive && endActive) {
                    conn.material.opacity = 0.9;
                    conn.material.color.setHex(0x00FF88);
                    conn.userData.active = true;
                } else if (startActive || endActive) {
                    conn.material.opacity = 0.6;
                    conn.material.color.setHex(0xFFD700);
                    conn.userData.active = false;
                } else {
                    conn.material.opacity = 0.3;
                    conn.material.color.setHex(0x00FFFF);
                    conn.userData.active = false;
                }
            });
        },
        
        calibrate: function() {
            // Check if all chips active and flow/pressure balanced
            const flowOk = this.flowRate >= 40 && this.flowRate <= 60;
            const pressureOk = this.pressure >= 40 && this.pressure <= 60;
            const allActive = this.activeChips === 6;
            
            if (allActive && flowOk && pressureOk) {
                this.stage++;
                
                if (this.stage >= this.maxStages) {
                    if (window.AAAEngine) {
                        AAAEngine.celebrate(this.containerId, '🔬 System Calibrated!');
                    }
                    document.getElementById('moc-instruction').textContent = 'Perfect! Multi-organ system operational!';
                    document.getElementById('moc-stage').textContent = 'Complete!';
                } else {
                    if (window.AAAEngine) AAAEngine.playSound('levelUp');
                    document.getElementById('moc-instruction').textContent = `Stage ${this.stage + 1}: Recalibrate with new parameters!`;
                    document.getElementById('moc-stage').textContent = this.stage + 1;
                    
                    // Randomize targets for next stage
                    this.flowRate = 30 + Math.random() * 40;
                    this.pressure = 30 + Math.random() * 40;
                    document.getElementById('moc-flow').value = this.flowRate;
                    document.getElementById('moc-pressure').value = this.pressure;
                    document.getElementById('moc-flow-val').textContent = Math.round(this.flowRate);
                    document.getElementById('moc-pressure-val').textContent = Math.round(this.pressure);
                }
            } else {
                if (window.AAAEngine) AAAEngine.playSound('error');
                
                let hint = '';
                if (!allActive) hint = 'Activate all organs first!';
                else if (!flowOk) hint = 'Adjust flow rate to 40-60%';
                else if (!pressureOk) hint = 'Adjust pressure to 40-60%';
                
                document.getElementById('moc-instruction').textContent = hint;
            }
        },
        
        updateUI: function() {
            document.getElementById('moc-active').textContent = this.activeChips;
        },
        
        animate: function() {
            this.animationId = requestAnimationFrame(() => this.animate());
            
            // Animate active chips (pulse effect)
            this.chips.forEach(chip => {
                if (chip.userData.active) {
                    const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 1;
                    chip.userData.chamber.scale.set(pulse, pulse, 1);
                }
            });
            
            // Rotate scene slightly for 3D effect
            this.scene.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
            
            this.renderer.render(this.scene, this.camera);
        },
        
        destroy: function() {
            cancelAnimationFrame(this.animationId);
            window.removeEventListener('resize', this.handleResize);
            if (this.renderer) this.renderer.dispose();
        }
    };

    // ═══════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════
    
    window.AAA3DModules = {
        BiomarkerFlow: BiomarkerFlowModule,
        MultiOrganChip: MultiOrganChipModule,
        
        initBiomarkerFlow: function(containerId) {
            return BiomarkerFlowModule.init(containerId);
        },
        
        initMultiOrganChip: function(containerId) {
            return MultiOrganChipModule.init(containerId);
        },
        
        destroyAll: function() {
            BiomarkerFlowModule.destroy();
            MultiOrganChipModule.destroy();
        }
    };
    
    console.log('[AAA-3D-Modules] Ready');
    
})();
