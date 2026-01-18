/**
 * PatientAnalog.com - VR System
 * WebXR integration with camera rig and controllers
 * 
 * @version 1.0.0
 */

const VRSystem = (function() {
    'use strict';

    let xrSession = null;
    let xrRefSpace = null;
    let renderer = null;
    let scene = null;
    let camera = null;

    // ============================================
    // VR CAMERA RIG
    // ============================================
    class VRCameraRig {
        constructor(scene, camera) {
            this.scene = scene;
            this.camera = camera;
            this.group = new THREE.Group();
            this.group.name = 'VRCameraRig';
            
            // User height offset
            this.group.position.y = 1.6; // Average eye height
            
            // Add camera to rig
            this.group.add(camera);
            scene.add(this.group);
            
            // Movement settings
            this.moveSpeed = 0.05;
            this.rotateSpeed = 0.02;
            this.position = new THREE.Vector3();
            this.rotation = new THREE.Euler();
        }

        /**
         * Set rig position
         */
        setPosition(x, y, z) {
            this.group.position.set(x, y, z);
        }

        /**
         * Move rig in direction
         */
        move(direction) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this.camera.quaternion);
            forward.y = 0;
            forward.normalize();

            const right = new THREE.Vector3(1, 0, 0);
            right.applyQuaternion(this.camera.quaternion);
            right.y = 0;
            right.normalize();

            this.group.position.addScaledVector(forward, direction.z * this.moveSpeed);
            this.group.position.addScaledVector(right, direction.x * this.moveSpeed);
            this.group.position.y += direction.y * this.moveSpeed;
        }

        /**
         * Rotate rig
         */
        rotate(angle) {
            this.group.rotation.y += angle * this.rotateSpeed;
        }

        /**
         * Reset to default position
         */
        reset() {
            this.group.position.set(0, 1.6, 3);
            this.group.rotation.set(0, 0, 0);
        }

        /**
         * Get world position of camera
         */
        getWorldPosition() {
            const pos = new THREE.Vector3();
            this.camera.getWorldPosition(pos);
            return pos;
        }

        /**
         * Update rig (called each frame)
         */
        update(delta) {
            // Smooth damping could be added here
        }

        /**
         * Dispose rig
         */
        dispose() {
            this.scene.remove(this.group);
        }
    }

    // ============================================
    // VR CONTROLLER
    // ============================================
    class VRController {
        constructor(renderer, index) {
            this.renderer = renderer;
            this.index = index;
            this.controller = renderer.xr.getController(index);
            this.grip = renderer.xr.getControllerGrip(index);
            
            // Controller state
            this.isSelecting = false;
            this.isSqueezing = false;
            this.intersected = null;
            
            // Raycaster for pointing
            this.raycaster = new THREE.Raycaster();
            this.tempMatrix = new THREE.Matrix4();
            
            // Visual elements
            this.createControllerModel();
            this.createRayLine();
            
            // Event handlers
            this.setupEvents();
        }

        /**
         * Create controller visual model
         */
        createControllerModel() {
            // Simple controller geometry
            const geometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
            const material = new THREE.MeshStandardMaterial({
                color: this.index === 0 ? 0x00d4ff : 0xf72585,
                emissive: this.index === 0 ? 0x00d4ff : 0xf72585,
                emissiveIntensity: 0.3
            });
            this.model = new THREE.Mesh(geometry, material);
            this.model.rotation.x = Math.PI / 2;
            this.grip.add(this.model);
        }

        /**
         * Create ray line for pointing
         */
        createRayLine() {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
            
            const material = new THREE.LineBasicMaterial({
                color: this.index === 0 ? 0x00d4ff : 0xf72585,
                transparent: true,
                opacity: 0.5
            });
            
            this.line = new THREE.Line(geometry, material);
            this.line.scale.z = 5;
            this.controller.add(this.line);
        }

        /**
         * Setup controller events
         */
        setupEvents() {
            this.controller.addEventListener('selectstart', () => {
                this.isSelecting = true;
                this.onSelectStart();
            });

            this.controller.addEventListener('selectend', () => {
                this.isSelecting = false;
                this.onSelectEnd();
            });

            this.controller.addEventListener('squeezestart', () => {
                this.isSqueezing = true;
                this.onSqueezeStart();
            });

            this.controller.addEventListener('squeezeend', () => {
                this.isSqueezing = false;
                this.onSqueezeEnd();
            });

            this.controller.addEventListener('connected', (event) => {
                this.onConnected(event.data);
            });

            this.controller.addEventListener('disconnected', () => {
                this.onDisconnected();
            });
        }

        /**
         * Handle select start (trigger press)
         */
        onSelectStart() {
            if (this.intersected) {
                EventBus.emit('vrSelect', {
                    controller: this.index,
                    object: this.intersected
                });
            }
            
            // Visual feedback
            this.model.material.emissiveIntensity = 0.8;
        }

        /**
         * Handle select end
         */
        onSelectEnd() {
            this.model.material.emissiveIntensity = 0.3;
        }

        /**
         * Handle squeeze start (grip press)
         */
        onSqueezeStart() {
            EventBus.emit('vrSqueeze', {
                controller: this.index,
                position: this.controller.position.clone()
            });
        }

        /**
         * Handle squeeze end
         */
        onSqueezeEnd() {
            // Release grabbed object
        }

        /**
         * Controller connected
         */
        onConnected(data) {
            console.log(`VR Controller ${this.index} connected:`, data.handedness);
            EventBus.emit('vrControllerConnected', {
                index: this.index,
                handedness: data.handedness
            });
        }

        /**
         * Controller disconnected
         */
        onDisconnected() {
            console.log(`VR Controller ${this.index} disconnected`);
        }

        /**
         * Check for intersections with objects
         */
        checkIntersections(objects) {
            this.tempMatrix.identity().extractRotation(this.controller.matrixWorld);
            this.raycaster.ray.origin.setFromMatrixPosition(this.controller.matrixWorld);
            this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);

            const intersects = this.raycaster.intersectObjects(objects, true);

            if (intersects.length > 0) {
                if (this.intersected !== intersects[0].object) {
                    // New intersection
                    if (this.intersected) {
                        this.intersected.material.emissive?.setHex(this.intersected.currentHex || 0x000000);
                    }
                    
                    this.intersected = intersects[0].object;
                    this.intersected.currentHex = this.intersected.material.emissive?.getHex();
                    this.intersected.material.emissive?.setHex(0x00ff00);
                    
                    // Update ray line
                    this.line.scale.z = intersects[0].distance;
                }
            } else {
                if (this.intersected) {
                    this.intersected.material.emissive?.setHex(this.intersected.currentHex || 0x000000);
                }
                this.intersected = null;
                this.line.scale.z = 5;
            }
        }

        /**
         * Get controller object
         */
        getController() {
            return this.controller;
        }

        /**
         * Get grip object
         */
        getGrip() {
            return this.grip;
        }

        /**
         * Update controller (called each frame)
         */
        update(objects) {
            this.checkIntersections(objects);
        }

        /**
         * Dispose controller
         */
        dispose() {
            this.controller.remove(this.line);
            this.grip.remove(this.model);
            this.line.geometry.dispose();
            this.line.material.dispose();
            this.model.geometry.dispose();
            this.model.material.dispose();
        }
    }

    // ============================================
    // WEBXR SESSION MANAGER
    // ============================================
    const WebXRSession = {
        /**
         * Check if VR is supported
         */
        isSupported: async function() {
            if (!navigator.xr) return false;
            return await navigator.xr.isSessionSupported('immersive-vr');
        },

        /**
         * Start VR session
         */
        start: async function(threeRenderer, threeScene, threeCamera) {
            if (!navigator.xr) {
                console.error('WebXR not available');
                return false;
            }

            renderer = threeRenderer;
            scene = threeScene;
            camera = threeCamera;

            try {
                // Request session
                xrSession = await navigator.xr.requestSession('immersive-vr', {
                    optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
                });

                // Enable XR on renderer
                renderer.xr.enabled = true;
                renderer.xr.setSession(xrSession);

                // Get reference space
                xrRefSpace = await xrSession.requestReferenceSpace('local-floor');

                // Create camera rig
                const cameraRig = new VRCameraRig(scene, camera);

                // Create controllers
                const controllers = [
                    new VRController(renderer, 0),
                    new VRController(renderer, 1)
                ];

                // Add controllers to scene
                controllers.forEach(ctrl => {
                    scene.add(ctrl.getController());
                    scene.add(ctrl.getGrip());
                });

                // Update state
                StateManager.setState('vr.session', xrSession);
                StateManager.setState('vr.controllers', controllers);

                // Session end handler
                xrSession.addEventListener('end', () => {
                    this.end();
                });

                EventBus.emit('vrSessionStarted');
                console.log('VR session started');
                return true;

            } catch (err) {
                console.error('Failed to start VR session:', err);
                return false;
            }
        },

        /**
         * End VR session
         */
        end: async function() {
            if (xrSession) {
                await xrSession.end();
                xrSession = null;
                xrRefSpace = null;

                renderer.xr.enabled = false;

                StateManager.setState('vr.session', null);
                StateManager.setState('vr.controllers', []);

                EventBus.emit('vrSessionEnded');
                console.log('VR session ended');
            }
        },

        /**
         * Get current session
         */
        getSession: function() {
            return xrSession;
        },

        /**
         * Check if in VR
         */
        isInVR: function() {
            return xrSession !== null;
        }
    };

    // ============================================
    // VR UI ELEMENTS
    // ============================================
    class VRFloatingPanel {
        constructor(width = 1, height = 0.75) {
            this.width = width;
            this.height = height;
            this.group = new THREE.Group();
            
            this.createPanel();
        }

        createPanel() {
            // Background panel
            const geometry = new THREE.PlaneGeometry(this.width, this.height);
            const material = new THREE.MeshBasicMaterial({
                color: 0x0a1628,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            this.background = new THREE.Mesh(geometry, material);
            this.group.add(this.background);

            // Border
            const borderGeometry = new THREE.EdgesGeometry(geometry);
            const borderMaterial = new THREE.LineBasicMaterial({ color: 0x00d4ff });
            this.border = new THREE.LineSegments(borderGeometry, borderMaterial);
            this.group.add(this.border);
        }

        /**
         * Add text to panel using canvas texture
         */
        setText(text, options = {}) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 384;
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = options.bgColor || 'rgba(10, 22, 40, 0.95)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Text
            ctx.fillStyle = options.textColor || '#0055ff';
            ctx.font = options.font || '24px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);

            // Create texture
            const texture = new THREE.CanvasTexture(canvas);
            this.background.material.map = texture;
            this.background.material.needsUpdate = true;
        }

        /**
         * Position panel in front of user
         */
        positionInFront(camera, distance = 2) {
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(camera.quaternion);
            
            this.group.position.copy(camera.position).addScaledVector(direction, distance);
            this.group.lookAt(camera.position);
        }

        /**
         * Add to scene
         */
        addToScene(scene) {
            scene.add(this.group);
        }

        /**
         * Remove from scene
         */
        removeFromScene(scene) {
            scene.remove(this.group);
        }

        /**
         * Dispose
         */
        dispose() {
            this.background.geometry.dispose();
            this.background.material.dispose();
            this.border.geometry.dispose();
            this.border.material.dispose();
        }
    }

    // ============================================
    // PUBLIC API
    // ============================================
    return {
        VRCameraRig: VRCameraRig,
        VRController: VRController,
        WebXRSession: WebXRSession,
        VRFloatingPanel: VRFloatingPanel,

        /**
         * Initialize VR system
         */
        init: async function(renderer, scene, camera) {
            const supported = await WebXRSession.isSupported();
            if (supported) {
                console.log('VR System initialized - VR supported');
                return true;
            }
            console.log('VR System initialized - VR not supported');
            return false;
        },

        /**
         * Create enter VR button
         */
        createEnterVRButton: function(renderer, scene, camera) {
            const button = document.createElement('button');
            button.id = 'vr-button';
            button.textContent = '🥽 Enter VR';
            button.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 24px;
                background: linear-gradient(135deg, rgba(255, 170, 0, 0.3), rgba(0, 85, 255, 0.3));
                border: 2px solid #ffaa00;
                border-radius: 8px;
                color: #fff;
                font-family: 'Orbitron', sans-serif;
                font-size: 14px;
                cursor: pointer;
                z-index: 10000;
                transition: all 0.3s ease;
            `;

            button.addEventListener('mouseenter', () => {
                button.style.background = 'linear-gradient(135deg, rgba(255, 170, 0, 0.5), rgba(0, 85, 255, 0.5))';
            });

            button.addEventListener('mouseleave', () => {
                button.style.background = 'linear-gradient(135deg, rgba(255, 170, 0, 0.3), rgba(0, 85, 255, 0.3))';
            });

            button.addEventListener('click', async () => {
                if (WebXRSession.isInVR()) {
                    await WebXRSession.end();
                    button.textContent = '🥽 Enter VR';
                } else {
                    const started = await WebXRSession.start(renderer, scene, camera);
                    if (started) {
                        button.textContent = '❌ Exit VR';
                    }
                }
            });

            // Check support and show/hide button
            WebXRSession.isSupported().then(supported => {
                if (supported) {
                    document.body.appendChild(button);
                }
            });

            return button;
        }
    };
})();

// Export
if (typeof window !== 'undefined') {
    window.VRSystem = VRSystem;
}
// v20260117-FULL
