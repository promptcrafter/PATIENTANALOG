/**
 * PatientAnalog.com - Interactive 3D Viewer Module
 * Advanced Three.js-based visualization for organoids, organ-on-chip, and digital twins
 * Optimized for performance and future AR/VR integration
 * 
 * @version 2.0.0
 * @author PatientAnalog Research Initiative
 */

const Interactive3DViewer = (function() {
    'use strict';

    // Module configuration
    const CONFIG = {
        enableShadows: true,
        enablePostProcessing: false, // Disabled for performance
        maxFPS: 60,
        mobileMaxFPS: 30,
        enableVR: false, // Future AR/VR flag
        assetPath: '/assets/3d/',
        defaultCameraDistance: 5,
        rotationSpeed: 0.005,
        zoomSpeed: 0.1,
        minZoom: 2,
        maxZoom: 15
    };

    // Viewer instances storage
    const viewers = new Map();

    // Shared geometries and materials for memory optimization
    const sharedAssets = {
        geometries: {},
        materials: {},
        textures: {}
    };

    /**
     * OrganoidViewer - 3D visualization of organoid structures
     */
    class OrganoidViewer {
        constructor(containerId, options = {}) {
            this.containerId = containerId;
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.warn(`Container ${containerId} not found`);
                return;
            }

            this.options = { ...CONFIG, ...options };
            this.isRunning = false;
            this.mouse = { x: 0, y: 0 };
            this.targetRotation = { x: 0, y: 0 };
            this.currentRotation = { x: 0, y: 0 };
            this.selectedCell = null;
            this.cells = [];
            this.metadata = options.metadata || {};

            this.init();
        }

        init() {
            // Scene setup
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000814);
            this.scene.fog = new THREE.Fog(0x000814, 8, 20);

            // Camera
            const aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
            this.camera.position.z = this.options.defaultCameraDistance;

            // Renderer with optimizations
            this.renderer = new THREE.WebGLRenderer({
                antialias: window.devicePixelRatio < 2,
                alpha: true,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            
            if (this.options.enableShadows) {
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            }

            this.container.appendChild(this.renderer.domElement);

            // Lighting
            this.setupLighting();

            // Create organoid model
            this.createOrganoidModel();

            // Controls
            this.setupControls();

            // Metadata overlay
            this.createMetadataOverlay();

            // Event listeners
            this.addEventListeners();

            // Start animation
            this.start();
        }

        setupLighting() {
            // Ambient light
            const ambient = new THREE.AmbientLight(0x404060, 0.4);
            this.scene.add(ambient);

            // Main directional light
            const mainLight = new THREE.DirectionalLight(0x00d4ff, 0.8);
            mainLight.position.set(5, 5, 5);
            if (this.options.enableShadows) {
                mainLight.castShadow = true;
                mainLight.shadow.mapSize.width = 1024;
                mainLight.shadow.mapSize.height = 1024;
            }
            this.scene.add(mainLight);

            // Fill lights
            const fillLight1 = new THREE.PointLight(0xf72585, 0.5, 10);
            fillLight1.position.set(-3, 2, -3);
            this.scene.add(fillLight1);

            const fillLight2 = new THREE.PointLight(0xffc300, 0.3, 10);
            fillLight2.position.set(3, -2, 3);
            this.scene.add(fillLight2);

            // Rim light
            const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.4);
            rimLight.position.set(-5, 0, -5);
            this.scene.add(rimLight);
        }

        createOrganoidModel() {
            // Main organoid group
            this.organoid = new THREE.Group();
            this.organoid.name = 'organoid';

            // Core structure
            const coreGeometry = new THREE.IcosahedronGeometry(0.8, 2);
            const coreMaterial = new THREE.MeshPhongMaterial({
                color: 0x1a1a3e,
                transparent: true,
                opacity: 0.6,
                shininess: 30
            });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            core.name = 'core';
            this.organoid.add(core);

            // Cell types with different colors and positions
            const cellTypes = [
                { name: 'Epithelial Cells', color: 0x00d4ff, count: 25, radius: 1.2, size: 0.12 },
                { name: 'Stem Cells', color: 0xf72585, count: 8, radius: 0.5, size: 0.15 },
                { name: 'Differentiated Cells', color: 0xffc300, count: 20, radius: 1.0, size: 0.1 },
                { name: 'Support Cells', color: 0x7dd3fc, count: 15, radius: 1.4, size: 0.08 },
                { name: 'Lumen Cells', color: 0x00ff88, count: 12, radius: 0.3, size: 0.14 }
            ];

            cellTypes.forEach((type, typeIndex) => {
                const cellGroup = new THREE.Group();
                cellGroup.name = type.name;
                cellGroup.userData = { 
                    type: type.name, 
                    color: type.color,
                    description: this.getCellDescription(type.name)
                };

                for (let i = 0; i < type.count; i++) {
                    const phi = Math.acos(-1 + (2 * i) / type.count);
                    const theta = Math.sqrt(type.count * Math.PI) * phi;
                    
                    // Add some randomness
                    const r = type.radius * (0.9 + Math.random() * 0.2);
                    
                    const x = r * Math.cos(theta) * Math.sin(phi);
                    const y = r * Math.sin(theta) * Math.sin(phi);
                    const z = r * Math.cos(phi);

                    const cellGeometry = new THREE.SphereGeometry(type.size * (0.8 + Math.random() * 0.4), 12, 8);
                    const cellMaterial = new THREE.MeshPhongMaterial({
                        color: type.color,
                        emissive: type.color,
                        emissiveIntensity: 0.1,
                        shininess: 80,
                        transparent: true,
                        opacity: 0.9
                    });

                    const cell = new THREE.Mesh(cellGeometry, cellMaterial);
                    cell.position.set(x, y, z);
                    cell.userData = { 
                        type: type.name, 
                        index: i,
                        originalColor: type.color
                    };
                    
                    cellGroup.add(cell);
                    this.cells.push(cell);
                }

                this.organoid.add(cellGroup);
            });

            // Membrane layer
            const membraneGeometry = new THREE.SphereGeometry(1.6, 32, 24);
            const membraneMaterial = new THREE.MeshPhongMaterial({
                color: 0x003566,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide,
                wireframe: false
            });
            const membrane = new THREE.Mesh(membraneGeometry, membraneMaterial);
            membrane.name = 'membrane';
            this.organoid.add(membrane);

            // Wireframe overlay
            const wireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0x00d4ff,
                wireframe: true,
                transparent: true,
                opacity: 0.1
            });
            const wireframe = new THREE.Mesh(membraneGeometry.clone(), wireframeMaterial);
            wireframe.scale.set(1.02, 1.02, 1.02);
            this.organoid.add(wireframe);

            this.scene.add(this.organoid);
        }

        getCellDescription(cellType) {
            const descriptions = {
                'Epithelial Cells': 'Form the outer layer and internal surfaces. Essential for barrier function and secretion.',
                'Stem Cells': 'Pluripotent cells capable of self-renewal and differentiation into specialized cell types.',
                'Differentiated Cells': 'Mature cells that have acquired specific functions based on their lineage.',
                'Support Cells': 'Provide structural support and maintain the microenvironment.',
                'Lumen Cells': 'Line the central cavity, critical for organ-specific functions.'
            };
            return descriptions[cellType] || 'Specialized cell population within the organoid structure.';
        }

        setupControls() {
            // Custom orbit-style controls
            this.isDragging = false;
            this.previousMouse = { x: 0, y: 0 };

            this.container.addEventListener('mousedown', (e) => {
                this.isDragging = true;
                this.previousMouse = { x: e.clientX, y: e.clientY };
            });

            window.addEventListener('mouseup', () => {
                this.isDragging = false;
            });

            this.container.addEventListener('mousemove', (e) => {
                if (this.isDragging) {
                    const deltaX = e.clientX - this.previousMouse.x;
                    const deltaY = e.clientY - this.previousMouse.y;
                    
                    this.targetRotation.y += deltaX * this.options.rotationSpeed;
                    this.targetRotation.x += deltaY * this.options.rotationSpeed;
                    
                    // Clamp vertical rotation
                    this.targetRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.targetRotation.x));
                    
                    this.previousMouse = { x: e.clientX, y: e.clientY };
                }

                // Raycasting for cell hover
                this.handleRaycast(e);
            });

            // Touch controls for mobile
            this.container.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    this.isDragging = true;
                    this.previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                }
            });

            this.container.addEventListener('touchmove', (e) => {
                if (this.isDragging && e.touches.length === 1) {
                    const deltaX = e.touches[0].clientX - this.previousMouse.x;
                    const deltaY = e.touches[0].clientY - this.previousMouse.y;
                    
                    this.targetRotation.y += deltaX * this.options.rotationSpeed;
                    this.targetRotation.x += deltaY * this.options.rotationSpeed;
                    this.targetRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.targetRotation.x));
                    
                    this.previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                }
            });

            this.container.addEventListener('touchend', () => {
                this.isDragging = false;
            });

            // Zoom with mouse wheel
            this.container.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoomDelta = e.deltaY * this.options.zoomSpeed * 0.01;
                this.camera.position.z = Math.max(
                    this.options.minZoom,
                    Math.min(this.options.maxZoom, this.camera.position.z + zoomDelta)
                );
            }, { passive: false });

            // Pinch zoom for touch
            let initialPinchDistance = 0;
            this.container.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    initialPinchDistance = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                }
            });

            this.container.addEventListener('touchmove', (e) => {
                if (e.touches.length === 2) {
                    const currentDistance = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                    const zoomDelta = (initialPinchDistance - currentDistance) * 0.01;
                    this.camera.position.z = Math.max(
                        this.options.minZoom,
                        Math.min(this.options.maxZoom, this.camera.position.z + zoomDelta)
                    );
                    initialPinchDistance = currentDistance;
                }
            });
        }

        handleRaycast(event) {
            const rect = this.container.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(this.mouse, this.camera);

            const intersects = raycaster.intersectObjects(this.cells, false);

            // Reset previous selection
            if (this.selectedCell && (!intersects.length || intersects[0].object !== this.selectedCell)) {
                this.selectedCell.material.emissiveIntensity = 0.1;
                this.selectedCell.scale.set(1, 1, 1);
                this.selectedCell = null;
                this.hideTooltip();
            }

            if (intersects.length > 0) {
                const cell = intersects[0].object;
                if (cell !== this.selectedCell) {
                    this.selectedCell = cell;
                    cell.material.emissiveIntensity = 0.5;
                    cell.scale.set(1.3, 1.3, 1.3);
                    this.showTooltip(cell, event);
                }
            }
        }

        createMetadataOverlay() {
            // Create tooltip element
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'viewer-tooltip';
            this.tooltip.innerHTML = `
                <div class="tooltip-header"></div>
                <div class="tooltip-body"></div>
            `;
            this.container.appendChild(this.tooltip);

            // Create control panel
            this.controls = document.createElement('div');
            this.controls.className = 'viewer-controls';
            this.controls.innerHTML = `
                <button class="viewer-btn" data-action="reset" title="Reset View">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                    </svg>
                </button>
                <button class="viewer-btn" data-action="autorotate" title="Auto-Rotate">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                </button>
                <button class="viewer-btn" data-action="labels" title="Toggle Labels">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 7V4h16v3"/>
                        <path d="M9 20h6"/>
                        <path d="M12 4v16"/>
                    </svg>
                </button>
                <button class="viewer-btn" data-action="fullscreen" title="Fullscreen">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                </button>
            `;
            this.container.appendChild(this.controls);

            // Control event listeners
            this.controls.querySelectorAll('.viewer-btn').forEach(btn => {
                btn.addEventListener('click', () => this.handleControlAction(btn.dataset.action));
            });

            // Info panel
            this.infoPanel = document.createElement('div');
            this.infoPanel.className = 'viewer-info';
            this.infoPanel.innerHTML = `
                <div class="info-title">${this.metadata.title || 'Organoid Model'}</div>
                <div class="info-stats">
                    <span><strong>Cell Types:</strong> 5</span>
                    <span><strong>Total Cells:</strong> ${this.cells.length}</span>
                </div>
            `;
            this.container.appendChild(this.infoPanel);
        }

        showTooltip(cell, event) {
            const rect = this.container.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const parent = cell.parent;
            const cellData = parent.userData;

            this.tooltip.querySelector('.tooltip-header').innerHTML = `
                <span class="tooltip-color" style="background: #${cell.userData.originalColor.toString(16).padStart(6, '0')}"></span>
                ${cellData.type}
            `;
            this.tooltip.querySelector('.tooltip-body').textContent = cellData.description;
            
            this.tooltip.style.left = `${x + 15}px`;
            this.tooltip.style.top = `${y - 10}px`;
            this.tooltip.classList.add('visible');
        }

        hideTooltip() {
            this.tooltip.classList.remove('visible');
        }

        handleControlAction(action) {
            switch(action) {
                case 'reset':
                    this.targetRotation = { x: 0, y: 0 };
                    this.camera.position.z = this.options.defaultCameraDistance;
                    break;
                case 'autorotate':
                    this.autoRotate = !this.autoRotate;
                    this.controls.querySelector('[data-action="autorotate"]').classList.toggle('active', this.autoRotate);
                    break;
                case 'labels':
                    this.showLabels = !this.showLabels;
                    this.controls.querySelector('[data-action="labels"]').classList.toggle('active', this.showLabels);
                    this.updateLabels();
                    break;
                case 'fullscreen':
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        this.container.requestFullscreen();
                    }
                    break;
            }
        }

        updateLabels() {
            // Toggle cell type labels visibility
            if (this.showLabels) {
                this.createCellLabels();
            } else {
                this.removeCellLabels();
            }
        }

        createCellLabels() {
            // CSS2D labels would go here for production
            // For now, simplified implementation
        }

        removeCellLabels() {
            // Remove labels
        }

        addEventListeners() {
            // Resize handler
            this.resizeHandler = () => {
                const width = this.container.clientWidth;
                const height = this.container.clientHeight;
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height);
            };
            window.addEventListener('resize', this.resizeHandler);

            // Visibility change for performance
            this.visibilityHandler = () => {
                if (document.hidden) {
                    this.pause();
                } else {
                    this.resume();
                }
            };
            document.addEventListener('visibilitychange', this.visibilityHandler);

            // Intersection observer for lazy loading
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.resume();
                    } else {
                        this.pause();
                    }
                });
            }, { threshold: 0.1 });
            this.observer.observe(this.container);
        }

        animate() {
            if (!this.isRunning) return;

            this.animationId = requestAnimationFrame(() => this.animate());

            // Smooth rotation interpolation
            this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.05;
            this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.05;

            // Auto-rotation
            if (this.autoRotate && !this.isDragging) {
                this.targetRotation.y += 0.003;
            }

            // Apply rotation
            if (this.organoid) {
                this.organoid.rotation.x = this.currentRotation.x;
                this.organoid.rotation.y = this.currentRotation.y;

                // Subtle floating animation
                this.organoid.position.y = Math.sin(Date.now() * 0.001) * 0.05;
            }

            // Cell pulsing animation
            const time = Date.now() * 0.002;
            this.cells.forEach((cell, i) => {
                const pulse = 1 + Math.sin(time + i * 0.5) * 0.05;
                if (!this.selectedCell || cell !== this.selectedCell) {
                    cell.scale.set(pulse, pulse, pulse);
                }
            });

            this.renderer.render(this.scene, this.camera);
        }

        start() {
            this.isRunning = true;
            this.animate();
        }

        pause() {
            this.isRunning = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }

        resume() {
            if (!this.isRunning) {
                this.start();
            }
        }

        destroy() {
            this.pause();
            window.removeEventListener('resize', this.resizeHandler);
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.observer.disconnect();

            // Dispose Three.js resources
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });

            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
    }

    /**
     * OrganOnChipViewer - 3D visualization of microfluidic chip systems
     */
    class OrganOnChipViewer {
        constructor(containerId, options = {}) {
            this.containerId = containerId;
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.warn(`Container ${containerId} not found`);
                return;
            }

            this.options = { ...CONFIG, ...options };
            this.isRunning = false;
            this.flowParticles = [];
            this.organChambers = [];

            this.init();
        }

        init() {
            // Scene setup
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000814);

            // Camera - orthographic for chip view
            const aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
            this.camera.position.set(0, 8, 8);
            this.camera.lookAt(0, 0, 0);

            // Renderer
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.container.appendChild(this.renderer.domElement);

            // Lighting
            this.setupLighting();

            // Create chip model
            this.createChipModel();

            // Create flow simulation
            this.createFlowSimulation();

            // Controls
            this.setupControls();

            // Info overlay
            this.createInfoOverlay();

            // Events
            this.addEventListeners();

            // Start
            this.start();
        }

        setupLighting() {
            const ambient = new THREE.AmbientLight(0xffffff, 0.4);
            this.scene.add(ambient);

            const topLight = new THREE.DirectionalLight(0x00d4ff, 0.6);
            topLight.position.set(0, 10, 5);
            this.scene.add(topLight);

            const sideLight = new THREE.DirectionalLight(0xffc300, 0.4);
            sideLight.position.set(5, 5, 0);
            this.scene.add(sideLight);
        }

        createChipModel() {
            this.chip = new THREE.Group();

            // Main chip body (PDMS substrate)
            const chipGeometry = new THREE.BoxGeometry(8, 0.3, 4);
            const chipMaterial = new THREE.MeshPhongMaterial({
                color: 0x1a2744,
                transparent: true,
                opacity: 0.85,
                shininess: 100
            });
            const chipBody = new THREE.Mesh(chipGeometry, chipMaterial);
            chipBody.position.y = -0.15;
            this.chip.add(chipBody);

            // Glass top layer
            const glassGeometry = new THREE.BoxGeometry(8, 0.05, 4);
            const glassMaterial = new THREE.MeshPhongMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.3,
                shininess: 150
            });
            const glass = new THREE.Mesh(glassGeometry, glassMaterial);
            glass.position.y = 0.15;
            this.chip.add(glass);

            // Microfluidic channels
            this.createChannels();

            // Organ chambers
            this.createOrganChambers();

            // Inlet/Outlet ports
            this.createPorts();

            this.scene.add(this.chip);
        }

        createChannels() {
            const channelMaterial = new THREE.MeshPhongMaterial({
                color: 0x00d4ff,
                transparent: true,
                opacity: 0.6,
                emissive: 0x00d4ff,
                emissiveIntensity: 0.2
            });

            // Main horizontal channel
            const mainChannel = new THREE.Mesh(
                new THREE.BoxGeometry(7, 0.08, 0.15),
                channelMaterial
            );
            mainChannel.position.set(0, 0, 0);
            this.chip.add(mainChannel);

            // Branching channels to organ chambers
            const branchPositions = [
                { x: -2.5, z: 0.8 },
                { x: 0, z: 0.8 },
                { x: 2.5, z: 0.8 },
                { x: -2.5, z: -0.8 },
                { x: 0, z: -0.8 },
                { x: 2.5, z: -0.8 }
            ];

            branchPositions.forEach(pos => {
                const branch = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 0.08, Math.abs(pos.z) * 2),
                    channelMaterial.clone()
                );
                branch.position.set(pos.x, 0, pos.z / 2);
                this.chip.add(branch);
            });

            // Store channel path for particle flow
            this.channelPath = [
                new THREE.Vector3(-3.5, 0.05, 0),
                new THREE.Vector3(-2.5, 0.05, 0),
                new THREE.Vector3(0, 0.05, 0),
                new THREE.Vector3(2.5, 0.05, 0),
                new THREE.Vector3(3.5, 0.05, 0)
            ];
        }

        createOrganChambers() {
            const chamberData = [
                { x: -2.5, z: 1.2, organ: 'Liver', color: 0x8b4513 },
                { x: 0, z: 1.2, organ: 'Heart', color: 0xff4444 },
                { x: 2.5, z: 1.2, organ: 'Kidney', color: 0x6b2525 },
                { x: -2.5, z: -1.2, organ: 'Lung', color: 0xffaaaa },
                { x: 0, z: -1.2, organ: 'Brain', color: 0xffccaa },
                { x: 2.5, z: -1.2, organ: 'Intestine', color: 0xcc8866 }
            ];

            chamberData.forEach(data => {
                const chamberGroup = new THREE.Group();
                chamberGroup.userData = { organ: data.organ };

                // Chamber well
                const wellGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.25, 24);
                const wellMaterial = new THREE.MeshPhongMaterial({
                    color: 0x1a2744,
                    transparent: true,
                    opacity: 0.9
                });
                const well = new THREE.Mesh(wellGeometry, wellMaterial);
                well.position.y = -0.05;
                chamberGroup.add(well);

                // Organ tissue (simplified representation)
                const tissueGeometry = new THREE.SphereGeometry(0.25, 16, 12);
                const tissueMaterial = new THREE.MeshPhongMaterial({
                    color: data.color,
                    emissive: data.color,
                    emissiveIntensity: 0.1,
                    shininess: 30
                });
                const tissue = new THREE.Mesh(tissueGeometry, tissueMaterial);
                tissue.position.y = 0;
                tissue.scale.y = 0.6;
                chamberGroup.add(tissue);

                // Chamber rim glow
                const rimGeometry = new THREE.RingGeometry(0.38, 0.45, 32);
                const rimMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00d4ff,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                });
                const rim = new THREE.Mesh(rimGeometry, rimMaterial);
                rim.rotation.x = -Math.PI / 2;
                rim.position.y = 0.13;
                chamberGroup.add(rim);

                chamberGroup.position.set(data.x, 0, data.z);
                this.chip.add(chamberGroup);
                this.organChambers.push(chamberGroup);
            });
        }

        createPorts() {
            const portMaterial = new THREE.MeshPhongMaterial({
                color: 0x333355,
                shininess: 80
            });

            // Inlet port
            const inletGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 16);
            const inlet = new THREE.Mesh(inletGeometry, portMaterial);
            inlet.position.set(-3.7, 0.2, 0);
            inlet.userData = { type: 'inlet', label: 'Drug/Media Inlet' };
            this.chip.add(inlet);

            // Outlet port
            const outlet = new THREE.Mesh(inletGeometry.clone(), portMaterial);
            outlet.position.set(3.7, 0.2, 0);
            outlet.userData = { type: 'outlet', label: 'Waste Outlet' };
            this.chip.add(outlet);

            // Port indicators
            const indicatorMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.8
            });
            const indicatorGeometry = new THREE.TorusGeometry(0.2, 0.03, 8, 24);
            
            const inletIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
            inletIndicator.position.set(-3.7, 0.45, 0);
            inletIndicator.rotation.x = Math.PI / 2;
            this.chip.add(inletIndicator);
            this.inletIndicator = inletIndicator;

            const outletIndicator = new THREE.Mesh(indicatorGeometry.clone(), indicatorMaterial.clone());
            outletIndicator.material.color.setHex(0xff4444);
            outletIndicator.position.set(3.7, 0.45, 0);
            outletIndicator.rotation.x = Math.PI / 2;
            this.chip.add(outletIndicator);
        }

        createFlowSimulation() {
            // Create particles for flow visualization
            const particleGeometry = new THREE.SphereGeometry(0.03, 8, 6);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.8
            });

            for (let i = 0; i < 30; i++) {
                const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
                particle.userData = {
                    progress: Math.random(),
                    speed: 0.002 + Math.random() * 0.003,
                    offset: (Math.random() - 0.5) * 0.08
                };
                this.chip.add(particle);
                this.flowParticles.push(particle);
            }
        }

        updateFlowSimulation() {
            this.flowParticles.forEach(particle => {
                particle.userData.progress += particle.userData.speed;
                if (particle.userData.progress > 1) {
                    particle.userData.progress = 0;
                }

                // Interpolate position along channel path
                const t = particle.userData.progress;
                const x = -3.5 + t * 7;
                particle.position.set(
                    x,
                    0.05,
                    particle.userData.offset
                );

                // Fade at ends
                const fade = Math.sin(t * Math.PI);
                particle.material.opacity = fade * 0.8;
            });

            // Animate inlet indicator
            if (this.inletIndicator) {
                this.inletIndicator.rotation.z += 0.02;
            }
        }

        setupControls() {
            this.isDragging = false;
            this.previousMouse = { x: 0, y: 0 };
            this.cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 4 };
            this.cameraDistance = 12;

            this.container.addEventListener('mousedown', (e) => {
                this.isDragging = true;
                this.previousMouse = { x: e.clientX, y: e.clientY };
            });

            window.addEventListener('mouseup', () => {
                this.isDragging = false;
            });

            this.container.addEventListener('mousemove', (e) => {
                if (this.isDragging) {
                    const deltaX = e.clientX - this.previousMouse.x;
                    const deltaY = e.clientY - this.previousMouse.y;
                    
                    this.cameraAngle.theta -= deltaX * 0.01;
                    this.cameraAngle.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.1, this.cameraAngle.phi + deltaY * 0.01));
                    
                    this.updateCameraPosition();
                    this.previousMouse = { x: e.clientX, y: e.clientY };
                }
            });

            this.container.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.cameraDistance = Math.max(6, Math.min(20, this.cameraDistance + e.deltaY * 0.01));
                this.updateCameraPosition();
            }, { passive: false });
        }

        updateCameraPosition() {
            const x = this.cameraDistance * Math.sin(this.cameraAngle.phi) * Math.cos(this.cameraAngle.theta);
            const y = this.cameraDistance * Math.cos(this.cameraAngle.phi);
            const z = this.cameraDistance * Math.sin(this.cameraAngle.phi) * Math.sin(this.cameraAngle.theta);
            
            this.camera.position.set(x, y, z);
            this.camera.lookAt(0, 0, 0);
        }

        createInfoOverlay() {
            this.infoPanel = document.createElement('div');
            this.infoPanel.className = 'viewer-info chip-info';
            this.infoPanel.innerHTML = `
                <div class="info-title">Multi-Organ Chip</div>
                <div class="info-stats">
                    <span><strong>Organs:</strong> 6</span>
                    <span><strong>Channels:</strong> 7</span>
                    <span><strong>Flow Rate:</strong> 10 μL/min</span>
                </div>
                <div class="organ-legend">
                    <div class="legend-item"><span class="legend-color" style="background:#8b4513"></span>Liver</div>
                    <div class="legend-item"><span class="legend-color" style="background:#ff4444"></span>Heart</div>
                    <div class="legend-item"><span class="legend-color" style="background:#6b2525"></span>Kidney</div>
                    <div class="legend-item"><span class="legend-color" style="background:#ffaaaa"></span>Lung</div>
                    <div class="legend-item"><span class="legend-color" style="background:#ffccaa"></span>Brain</div>
                    <div class="legend-item"><span class="legend-color" style="background:#cc8866"></span>Intestine</div>
                </div>
            `;
            this.container.appendChild(this.infoPanel);
        }

        addEventListeners() {
            this.resizeHandler = () => {
                const width = this.container.clientWidth;
                const height = this.container.clientHeight;
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height);
            };
            window.addEventListener('resize', this.resizeHandler);

            this.visibilityHandler = () => {
                if (document.hidden) this.pause();
                else this.resume();
            };
            document.addEventListener('visibilitychange', this.visibilityHandler);

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) this.resume();
                    else this.pause();
                });
            }, { threshold: 0.1 });
            this.observer.observe(this.container);
        }

        animate() {
            if (!this.isRunning) return;

            this.animationId = requestAnimationFrame(() => this.animate());

            // Update flow simulation
            this.updateFlowSimulation();

            // Animate organ tissues (subtle pulse)
            const time = Date.now() * 0.002;
            this.organChambers.forEach((chamber, i) => {
                const tissue = chamber.children[1];
                const pulse = 1 + Math.sin(time + i) * 0.05;
                tissue.scale.set(pulse, pulse * 0.6, pulse);
            });

            this.renderer.render(this.scene, this.camera);
        }

        start() {
            this.isRunning = true;
            this.animate();
        }

        pause() {
            this.isRunning = false;
            if (this.animationId) cancelAnimationFrame(this.animationId);
        }

        resume() {
            if (!this.isRunning) this.start();
        }

        destroy() {
            this.pause();
            window.removeEventListener('resize', this.resizeHandler);
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.observer.disconnect();
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
    }

    /**
     * DrugResponseSimulator - Educational drug response simulation
     */
    class DrugResponseSimulator {
        constructor(containerId, options = {}) {
            this.containerId = containerId;
            this.container = document.getElementById(containerId);
            if (!this.container) return;

            this.options = options;
            this.currentDrug = 'aspirin';
            this.concentration = 50;
            this.timeElapsed = 0;
            this.responses = {};

            this.init();
        }

        init() {
            this.createUI();
            this.createVisualization();
            this.startSimulation();
        }

        createUI() {
            this.container.innerHTML = `
                <div class="simulator-header">
                    <h4>Drug Response Simulator</h4>
                    <p>Educational demonstration of organ-on-chip drug testing</p>
                    <span class="vr-badge" style="display: inline-block; padding: 4px 10px; background: linear-gradient(135deg, rgba(255, 170, 0, 0.2), rgba(0, 85, 255, 0.2)); border: 1px solid #ffaa00; border-radius: 12px; font-size: 10px; color: #ffaa00; margin-left: 10px;">🥽 VR Ready</span>
                </div>
                <div class="simulator-controls">
                    <div class="control-group">
                        <label>Select Drug Compound</label>
                        <select id="drugSelect">
                            <optgroup label="Anti-inflammatory">
                                <option value="aspirin">Aspirin (COX Inhibitor)</option>
                                <option value="ibuprofen">Ibuprofen (NSAID)</option>
                            </optgroup>
                            <optgroup label="Analgesics">
                                <option value="acetaminophen">Acetaminophen (Paracetamol)</option>
                            </optgroup>
                            <optgroup label="Chemotherapy">
                                <option value="doxorubicin">Doxorubicin (Anthracycline)</option>
                                <option value="cisplatin">Cisplatin (Platinum-based)</option>
                            </optgroup>
                            <optgroup label="Diabetes">
                                <option value="metformin">Metformin (Biguanide)</option>
                            </optgroup>
                            <optgroup label="Cardiovascular">
                                <option value="atorvastatin">Atorvastatin (Statin)</option>
                            </optgroup>
                            <optgroup label="Antibiotics">
                                <option value="gentamicin">Gentamicin (Aminoglycoside)</option>
                            </optgroup>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>Concentration: <span id="concValue">50</span> μM</label>
                        <input type="range" id="concentration" min="0" max="100" value="50">
                    </div>
                    <div class="control-group">
                        <button id="runSimulation" class="sim-btn">Run Simulation</button>
                        <button id="resetSimulation" class="sim-btn secondary">Reset</button>
                    </div>
                </div>
                <div class="simulator-visualization">
                    <div class="organ-responses" id="organResponses"></div>
                    <div class="time-course" id="timeCourse">
                        <canvas id="responseChart" width="400" height="200"></canvas>
                    </div>
                </div>
                <div class="simulator-results" id="simResults">
                    <div class="result-summary">Select a drug and click "Run Simulation" to begin</div>
                </div>
            `;

            // Event listeners with null safety
            const drugSelect = this.container.querySelector('#drugSelect');
            const concSlider = this.container.querySelector('#concentration');
            const concValue = this.container.querySelector('#concValue');
            const runBtn = this.container.querySelector('#runSimulation');
            const resetBtn = this.container.querySelector('#resetSimulation');

            if (drugSelect) {
                drugSelect.addEventListener('change', (e) => {
                    this.currentDrug = e.target.value;
                });
            }

            if (concSlider) {
                concSlider.addEventListener('input', (e) => {
                    this.concentration = parseInt(e.target.value);
                    if (concValue) concValue.textContent = this.concentration;
                });
            }

            if (runBtn) {
                runBtn.addEventListener('click', () => {
                    this.runSimulation();
                });
            }

            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetSimulation();
                });
            }
        }

        createVisualization() {
            const organs = ['Liver', 'Heart', 'Kidney', 'Lung', 'Brain', 'Intestine'];
            const responsesContainer = this.container.querySelector('#organResponses');
            
            organs.forEach(organ => {
                const card = document.createElement('div');
                card.className = 'organ-card';
                card.id = `organ-${organ.toLowerCase()}`;
                card.innerHTML = `
                    <div class="organ-icon">${this.getOrganEmoji(organ)}</div>
                    <div class="organ-name">${organ}</div>
                    <div class="organ-status">Ready</div>
                    <div class="organ-viability">
                        <div class="viability-bar" style="width: 100%"></div>
                    </div>
                    <div class="viability-value">100%</div>
                `;
                responsesContainer.appendChild(card);
            });
        }

        getOrganEmoji(organ) {
            const emojis = {
                'Liver': '🫀',
                'Heart': '❤️',
                'Kidney': '🫘',
                'Lung': '🫁',
                'Brain': '🧠',
                'Intestine': '🦠'
            };
            return emojis[organ] || '🔬';
        }

        runSimulation() {
            const drugProfiles = {
                'aspirin': {
                    'Liver': { toxicity: 0.1, metabolism: 0.8 },
                    'Heart': { toxicity: 0.05, efficacy: 0.3 },
                    'Kidney': { toxicity: 0.15, clearance: 0.7 },
                    'Lung': { toxicity: 0.02, efficacy: 0.1 },
                    'Brain': { toxicity: 0.05, efficacy: 0.2 },
                    'Intestine': { toxicity: 0.3, absorption: 0.9 }
                },
                'ibuprofen': {
                    'Liver': { toxicity: 0.15, metabolism: 0.75 },
                    'Heart': { toxicity: 0.1, efficacy: 0.25 },
                    'Kidney': { toxicity: 0.25, clearance: 0.65 },
                    'Lung': { toxicity: 0.03, efficacy: 0.1 },
                    'Brain': { toxicity: 0.08, efficacy: 0.3 },
                    'Intestine': { toxicity: 0.35, absorption: 0.85 }
                },
                'acetaminophen': {
                    'Liver': { toxicity: 0.4, metabolism: 0.9 },
                    'Heart': { toxicity: 0.02, efficacy: 0.1 },
                    'Kidney': { toxicity: 0.2, clearance: 0.6 },
                    'Lung': { toxicity: 0.01, efficacy: 0.05 },
                    'Brain': { toxicity: 0.1, efficacy: 0.5 },
                    'Intestine': { toxicity: 0.15, absorption: 0.85 }
                },
                'doxorubicin': {
                    'Liver': { toxicity: 0.5, metabolism: 0.4 },
                    'Heart': { toxicity: 0.7, efficacy: 0.1 },
                    'Kidney': { toxicity: 0.4, clearance: 0.3 },
                    'Lung': { toxicity: 0.3, efficacy: 0.2 },
                    'Brain': { toxicity: 0.2, efficacy: 0.6 },
                    'Intestine': { toxicity: 0.6, absorption: 0.7 }
                },
                'cisplatin': {
                    'Liver': { toxicity: 0.35, metabolism: 0.35 },
                    'Heart': { toxicity: 0.25, efficacy: 0.1 },
                    'Kidney': { toxicity: 0.75, clearance: 0.4 },
                    'Lung': { toxicity: 0.25, efficacy: 0.7 },
                    'Brain': { toxicity: 0.15, efficacy: 0.5 },
                    'Intestine': { toxicity: 0.5, absorption: 0.65 }
                },
                'metformin': {
                    'Liver': { toxicity: 0.05, metabolism: 0.3 },
                    'Heart': { toxicity: 0.02, efficacy: 0.4 },
                    'Kidney': { toxicity: 0.1, clearance: 0.8 },
                    'Lung': { toxicity: 0.01, efficacy: 0.1 },
                    'Brain': { toxicity: 0.02, efficacy: 0.1 },
                    'Intestine': { toxicity: 0.2, absorption: 0.6 }
                },
                'atorvastatin': {
                    'Liver': { toxicity: 0.2, metabolism: 0.85 },
                    'Heart': { toxicity: 0.02, efficacy: 0.7 },
                    'Kidney': { toxicity: 0.05, clearance: 0.5 },
                    'Lung': { toxicity: 0.01, efficacy: 0.1 },
                    'Brain': { toxicity: 0.03, efficacy: 0.2 },
                    'Intestine': { toxicity: 0.1, absorption: 0.3 }
                },
                'gentamicin': {
                    'Liver': { toxicity: 0.15, metabolism: 0.2 },
                    'Heart': { toxicity: 0.1, efficacy: 0.1 },
                    'Kidney': { toxicity: 0.65, clearance: 0.85 },
                    'Lung': { toxicity: 0.1, efficacy: 0.6 },
                    'Brain': { toxicity: 0.08, efficacy: 0.4 },
                    'Intestine': { toxicity: 0.15, absorption: 0.1 }
                }
            };

            const profile = drugProfiles[this.currentDrug];
            const concentrationFactor = this.concentration / 100;

            // Animate responses
            let step = 0;
            const maxSteps = 100;
            
            const animate = () => {
                step++;
                const progress = step / maxSteps;
                
                Object.keys(profile).forEach(organ => {
                    const card = this.container.querySelector(`#organ-${organ.toLowerCase()}`);
                    const toxicity = profile[organ].toxicity * concentrationFactor;
                    const viability = Math.max(0, 100 - (toxicity * 100 * progress));
                    
                    card.querySelector('.viability-bar').style.width = `${viability}%`;
                    card.querySelector('.viability-value').textContent = `${Math.round(viability)}%`;
                    
                    // Color coding
                    const bar = card.querySelector('.viability-bar');
                    if (viability > 80) bar.style.background = '#0055ff';
                    else if (viability > 50) bar.style.background = '#ffc300';
                    else bar.style.background = '#ffaa00';
                    
                    // Status
                    card.querySelector('.organ-status').textContent = 
                        viability > 80 ? 'Healthy' : viability > 50 ? 'Stressed' : 'Damaged';
                });

                if (step < maxSteps) {
                    requestAnimationFrame(animate);
                } else {
                    this.showResults(profile, concentrationFactor);
                }
            };

            // Reset first
            this.resetViability();
            setTimeout(animate, 100);
        }

        resetViability() {
            const cards = this.container.querySelectorAll('.organ-card');
            cards.forEach(card => {
                card.querySelector('.viability-bar').style.width = '100%';
                card.querySelector('.viability-bar').style.background = '#0055ff';
                card.querySelector('.viability-value').textContent = '100%';
                card.querySelector('.organ-status').textContent = 'Processing...';
            });
        }

        showResults(profile, factor) {
            const results = this.container.querySelector('#simResults');
            let warnings = [];
            let toxicOrgans = [];

            Object.keys(profile).forEach(organ => {
                if (profile[organ].toxicity * factor > 0.5) {
                    toxicOrgans.push(organ);
                }
            });

            const drugNames = {
                'aspirin': 'Aspirin',
                'acetaminophen': 'Acetaminophen',
                'doxorubicin': 'Doxorubicin',
                'metformin': 'Metformin'
            };

            results.innerHTML = `
                <div class="result-summary">
                    <h5>Simulation Complete: ${drugNames[this.currentDrug]} at ${this.concentration} μM</h5>
                    ${toxicOrgans.length > 0 
                        ? `<p class="warning">⚠️ Significant toxicity detected in: ${toxicOrgans.join(', ')}</p>`
                        : `<p class="success">✅ No significant organ toxicity at this concentration</p>`
                    }
                    <p class="note">This is an educational simulation. Real drug testing requires extensive validation.</p>
                </div>
            `;
        }

        resetSimulation() {
            const cards = this.container.querySelectorAll('.organ-card');
            cards.forEach(card => {
                card.querySelector('.viability-bar').style.width = '100%';
                card.querySelector('.viability-bar').style.background = '#0055ff';
                card.querySelector('.viability-value').textContent = '100%';
                card.querySelector('.organ-status').textContent = 'Ready';
            });

            this.container.querySelector('#simResults').innerHTML = `
                <div class="result-summary">Select a drug and click "Run Simulation" to begin</div>
            `;
        }

        startSimulation() {
            // Initial state ready
        }
    }

    // Public API
    return {
        OrganoidViewer,
        OrganOnChipViewer,
        DrugResponseSimulator,
        
        createOrganoidViewer: function(containerId, options) {
            const viewer = new OrganoidViewer(containerId, options);
            viewers.set(containerId, viewer);
            return viewer;
        },

        createChipViewer: function(containerId, options) {
            const viewer = new OrganOnChipViewer(containerId, options);
            viewers.set(containerId, viewer);
            return viewer;
        },

        createDrugSimulator: function(containerId, options) {
            const simulator = new DrugResponseSimulator(containerId, options);
            viewers.set(containerId, simulator);
            return simulator;
        },

        getViewer: function(containerId) {
            return viewers.get(containerId);
        },

        destroyViewer: function(containerId) {
            const viewer = viewers.get(containerId);
            if (viewer && viewer.destroy) {
                viewer.destroy();
            }
            viewers.delete(containerId);
        },

        destroyAll: function() {
            viewers.forEach((viewer, id) => {
                if (viewer.destroy) viewer.destroy();
            });
            viewers.clear();
        },

        // AR/VR preparation hooks
        enableVR: function(containerId) {
            const viewer = viewers.get(containerId);
            if (viewer && viewer.renderer) {
                // WebXR setup would go here
                console.log('VR mode ready for future integration');
            }
        },

        exportModel: function(containerId, format = 'gltf') {
            // Export for AR/VR apps
            console.log(`Export ${format} ready for ${containerId}`);
        },

        // ============================================
        // 5-ENGINE DOMAIN PRESETS SYSTEM
        // Maps domain portfolio to engine configurations
        // ============================================
        
        domainEngines: {
            // ENGINE 1: Organ-on-Chip Simulators
            chipSimulator: {
                domains: ['kidneychip.com', 'lungchip.com', 'cellonchip.com', 'tissuechip.com', 
                         'tissuechips.com', 'humanonchip.com', 'dilichip.com', 'admechip.com',
                         'biohybridchip.com', 'emulationchip.com', 'emulatorchip.com'],
                presets: {
                    'kidneychip': { organ: 'Kidney', focus: 'nephrotoxicity', biomarkers: ['KIM-1', 'Creatinine', 'BUN'] },
                    'lungchip': { organ: 'Lung', focus: 'respiratory', biomarkers: ['Surfactant', 'IL-8', 'TEER'] },
                    'dilichip': { organ: 'Liver', focus: 'DILI', biomarkers: ['ALT', 'AST', 'Albumin'] },
                    'admechip': { organ: 'Multi', focus: 'ADME-Tox', biomarkers: ['Clearance', 'Papp', 'Metabolism'] }
                },
                createViewer: function(containerId, preset) {
                    return Interactive3DViewer.createChipViewer(containerId, { preset: preset });
                }
            },

            // ENGINE 2: Organoid Growth Simulators
            organoidSimulator: {
                domains: ['organoidmedicine.com', 'organoids.app', 'microphysio.com', 
                         'biomps.com', 'celltherapy.app', 'celltherapybiobank.com'],
                presets: {
                    'brain': { type: 'Cerebral', cellTypes: ['Neurons', 'Astrocytes', 'Oligodendrocytes'], growthDays: 90 },
                    'liver': { type: 'Hepatic', cellTypes: ['Hepatocytes', 'Cholangiocytes', 'Stellate'], growthDays: 21 },
                    'intestine': { type: 'Intestinal', cellTypes: ['Enterocytes', 'Goblet', 'Paneth'], growthDays: 14 },
                    'tumor': { type: 'Tumor', cellTypes: ['Cancer', 'Stromal', 'Immune'], growthDays: 28 }
                },
                createViewer: function(containerId, preset) {
                    return Interactive3DViewer.createOrganoidViewer(containerId, { preset: preset });
                }
            },

            // ENGINE 3: Digital Twin Dashboards
            digitalTwin: {
                domains: ['patientdigitaltwin.app', 'patienttwin.app', 'digitaltwinhuman.com',
                         'liverdigitaltwin.com', 'heartdigitaltwin.com', 'kidneydigitaltwin.com',
                         'genomedigitaltwin.com', 'drugdigitaltwin.com', 'digitaltwinbio.com'],
                presets: {
                    'patient': { type: 'Full Body', organs: 10, ai: true, biomarkers: 50 },
                    'liver': { type: 'Liver Focus', organs: 1, ai: true, biomarkers: 15 },
                    'heart': { type: 'Cardiac Focus', organs: 1, ai: true, biomarkers: 12 },
                    'genome': { type: 'Genomic', organs: 10, ai: true, variants: 10000 }
                },
                createDashboard: function(containerId, preset) {
                    console.log(`Digital Twin Dashboard: ${preset} initialized in ${containerId}`);
                    return { type: 'digitalTwin', preset: preset };
                }
            },

            // ENGINE 4: AI Prediction Engines
            aiEngine: {
                domains: ['biocomputeai.com', 'omniomicsai.com', 'biologyfirstai.app',
                         'clinicaldocai.com', 'neuralchipai.com', 'quantummolsim.com',
                         'quantumdrugdiscovery.com', 'transformerasic.com', 'memristorcore.com'],
                presets: {
                    'drugPredictor': { model: 'Transformer', outputs: ['efficacy', 'toxicity', 'ADME'] },
                    'omics': { model: 'MultiOmics', outputs: ['transcriptome', 'proteome', 'metabolome'] },
                    'quantum': { model: 'QuantumML', outputs: ['binding', 'docking', 'dynamics'] }
                },
                predict: function(drug, params) {
                    // AI prediction mock
                    return {
                        efficacy: Math.random() * 0.4 + 0.6,
                        toxicity: Math.random() * 0.3,
                        confidence: Math.random() * 0.2 + 0.8
                    };
                }
            },

            // ENGINE 5: Biomarker Analyzers
            biomarkerEngine: {
                domains: ['circdna.com', 'circulatingdna.com', 'circulatingtumordna.com',
                         'neuropeptidey.com', 'omentin.com', 'chemerin.com', 'vaspin.com', 'heparan.com'],
                presets: {
                    'ctDNA': { type: 'Circulating Tumor DNA', markers: ['KRAS', 'BRAF', 'EGFR', 'TP53'] },
                    'adipokines': { type: 'Adipokines', markers: ['Omentin', 'Chemerin', 'Vaspin', 'Adiponectin'] },
                    'neuropeptides': { type: 'Neural', markers: ['NPY', 'Substance P', 'CGRP', 'VIP'] }
                },
                analyze: function(preset, sampleData) {
                    console.log(`Biomarker analysis: ${preset}`);
                    return { status: 'analyzed', markers: this.presets[preset]?.markers || [] };
                }
            }
        },

        // Get engine for a domain
        getEngineForDomain: function(domain) {
            const cleanDomain = domain.toLowerCase().replace('www.', '').replace('.com', '').replace('.app', '');
            for (const [engineName, engine] of Object.entries(this.domainEngines)) {
                if (engine.domains.some(d => d.includes(cleanDomain) || cleanDomain.includes(d.replace('.com', '').replace('.app', '')))) {
                    return { engine: engineName, config: engine };
                }
            }
            return null;
        },

        // Launch domain as product
        launchDomainProduct: function(domain, containerId) {
            const engineInfo = this.getEngineForDomain(domain);
            if (engineInfo) {
                console.log(`Launching ${domain} with ${engineInfo.engine} engine`);
                return engineInfo;
            }
            return null;
        }
    };
})();

// Auto-initialize on DOMContentLoaded
if (typeof window !== 'undefined') {
    window.Interactive3DViewer = Interactive3DViewer;
}
// v20260117-FULL
