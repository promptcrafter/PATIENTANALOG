/**
 * PatientAnalog Lightweight 3D Viewer
 * Simple, interactive, works in all browsers
 * 
 * Features:
 * - Procedural 3D models (DNA helix, organoid, organ chip, cell)
 * - OrbitControls (drag to rotate, scroll to zoom)
 * - Auto-rotation
 * - 3D toggle integration
 * - WebGL fallback
 * - Mobile touch support
 */

console.log('[PA-3D] Lightweight 3D Viewer loading...');

(function() {
    'use strict';
    
    var activeScenes = [];
    
    // Check if 3D should initialize
    function should3DInit() {
        if (typeof window.should3DInit === 'function') {
            return window.should3DInit();
        }
        return localStorage.getItem('3dMode') !== 'off';
    }
    
    // Check for WebGL support
    function hasWebGL() {
        try {
            var canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }
    
    // Main initialization
    function initPA3D() {
        console.log('[PA-3D] Initializing...');
        
        // Check 3D mode
        if (!should3DInit()) {
            console.log('[PA-3D] 3D mode is OFF - skipping initialization');
            showStaticFallbacks();
            return;
        }
        
        // Check WebGL
        if (!hasWebGL()) {
            console.warn('[PA-3D] WebGL not supported - showing fallback');
            showStaticFallbacks();
            return;
        }
        
        // Check for Three.js
        if (typeof THREE === 'undefined') {
            console.error('[PA-3D] Three.js not loaded - waiting...');
            setTimeout(initPA3D, 500);
            return;
        }
        
        console.log('[PA-3D] Three.js version:', THREE.REVISION);
        
        // Initialize hero DNA scene
        initHeroDNA();
        
        // Initialize technology viewers
        initOrganoidViewer();
        initChipViewer();
        initCTDNAViewer();
        
        console.log('[PA-3D] All scenes initialized');
    }
    
    // Hero Section DNA Helix
    function initHeroDNA() {
        var hero = document.querySelector('.hero');
        if (!hero) return;
        
        // Check if container exists
        var container = document.getElementById('hero-3d-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'hero-3d-container';
            container.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;opacity:0.5;';
            hero.insertBefore(container, hero.firstChild);
        }
        
        createScene(container, 'dna');
    }
    
    // Organoid Viewer
    function initOrganoidViewer() {
        var container = document.getElementById('organoidViewer');
        if (container) {
            createScene(container, 'organoid');
        }
    }
    
    // Chip Viewer
    function initChipViewer() {
        var container = document.getElementById('chipViewer');
        if (container) {
            createScene(container, 'chip');
        }
    }
    
    // ctDNA Viewer
    function initCTDNAViewer() {
        var container = document.getElementById('ctdna-viewer');
        if (container) {
            createScene(container, 'cell');
        }
    }
    
    // Create 3D Scene
    function createScene(container, type) {
        console.log('[PA-3D] Creating scene:', type);
        
        var width = container.offsetWidth || 400;
        var height = container.offsetHeight || 400;
        
        // Scene
        var scene = new THREE.Scene();
        
        // Camera
        var camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        
        // Renderer
        var renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: 'low-power'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        
        // Clear existing content
        container.innerHTML = '';
        container.appendChild(renderer.domElement);
        
        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        
        var pointLight1 = new THREE.PointLight(0x00d4ff, 1, 100);
        pointLight1.position.set(10, 10, 10);
        scene.add(pointLight1);
        
        var pointLight2 = new THREE.PointLight(0xff00ff, 0.5, 100);
        pointLight2.position.set(-10, -10, 10);
        scene.add(pointLight2);
        
        // Create model based on type
        var model;
        switch(type) {
            case 'dna':
                model = createDNAHelix();
                camera.position.set(0, 0, 30);
                break;
            case 'organoid':
                model = createOrganoid();
                camera.position.set(0, 0, 5);
                break;
            case 'chip':
                model = createChip();
                camera.position.set(0, 1, 5);
                break;
            case 'cell':
                model = createCell();
                camera.position.set(0, 0, 5);
                break;
            default:
                model = createOrganoid();
                camera.position.set(0, 0, 5);
        }
        scene.add(model);
        
        // Interaction state
        var isDragging = false;
        var previousMouse = { x: 0, y: 0 };
        var targetRotation = { x: 0, y: 0 };
        var currentRotation = { x: 0, y: 0 };
        var autoRotate = true;
        var targetZoom = camera.position.z;
        
        // Make interactive (except hero)
        if (type !== 'dna') {
            renderer.domElement.style.cursor = 'grab';
            renderer.domElement.style.pointerEvents = 'auto';
            
            // Mouse events
            renderer.domElement.addEventListener('mousedown', function(e) {
                isDragging = true;
                autoRotate = false;
                previousMouse.x = e.clientX;
                previousMouse.y = e.clientY;
                renderer.domElement.style.cursor = 'grabbing';
            });
            
            renderer.domElement.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                var deltaX = e.clientX - previousMouse.x;
                var deltaY = e.clientY - previousMouse.y;
                targetRotation.y += deltaX * 0.01;
                targetRotation.x += deltaY * 0.01;
                previousMouse.x = e.clientX;
                previousMouse.y = e.clientY;
            });
            
            renderer.domElement.addEventListener('mouseup', function() {
                isDragging = false;
                renderer.domElement.style.cursor = 'grab';
            });
            
            renderer.domElement.addEventListener('mouseleave', function() {
                isDragging = false;
                renderer.domElement.style.cursor = 'grab';
            });
            
            // Touch events
            renderer.domElement.addEventListener('touchstart', function(e) {
                isDragging = true;
                autoRotate = false;
                previousMouse.x = e.touches[0].clientX;
                previousMouse.y = e.touches[0].clientY;
            }, { passive: true });
            
            renderer.domElement.addEventListener('touchmove', function(e) {
                if (!isDragging) return;
                var deltaX = e.touches[0].clientX - previousMouse.x;
                var deltaY = e.touches[0].clientY - previousMouse.y;
                targetRotation.y += deltaX * 0.01;
                targetRotation.x += deltaY * 0.01;
                previousMouse.x = e.touches[0].clientX;
                previousMouse.y = e.touches[0].clientY;
            }, { passive: true });
            
            renderer.domElement.addEventListener('touchend', function() {
                isDragging = false;
            });
            
            // Zoom
            renderer.domElement.addEventListener('wheel', function(e) {
                e.preventDefault();
                targetZoom += e.deltaY * 0.01;
                targetZoom = Math.max(2, Math.min(10, targetZoom));
            }, { passive: false });
            
            // Double click to reset
            renderer.domElement.addEventListener('dblclick', function() {
                targetRotation.x = 0;
                targetRotation.y = 0;
                targetZoom = 5;
                autoRotate = true;
            });
        }
        
        // Animation loop
        var animationId;
        function animate() {
            animationId = requestAnimationFrame(animate);
            
            if (autoRotate) {
                targetRotation.y += type === 'dna' ? 0.005 : 0.008;
            }
            
            // Smooth damping
            currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
            currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;
            
            model.rotation.x = currentRotation.x;
            model.rotation.y = currentRotation.y;
            
            // Zoom interpolation
            if (type !== 'dna') {
                camera.position.z += (targetZoom - camera.position.z) * 0.1;
            }
            
            // DNA subtle movement
            if (type === 'dna') {
                model.rotation.x = Math.sin(Date.now() * 0.0005) * 0.1;
                camera.position.x = Math.sin(Date.now() * 0.0003) * 2;
                camera.lookAt(0, 0, 0);
            }
            
            renderer.render(scene, camera);
        }
        animate();
        
        // Handle resize
        function onResize() {
            var w = container.offsetWidth || 400;
            var h = container.offsetHeight || 400;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        window.addEventListener('resize', onResize);
        
        // Store scene for cleanup
        activeScenes.push({
            container: container,
            animationId: animationId,
            renderer: renderer,
            onResize: onResize
        });
        
        console.log('[PA-3D] Scene created:', type);
    }
    
    // DNA Helix Model
    function createDNAHelix() {
        var group = new THREE.Group();
        var helixRadius = 3;
        var helixHeight = 40;
        var turns = 4;
        var pointsPerTurn = 20;
        var totalPoints = turns * pointsPerTurn;
        
        var sphereMat1 = new THREE.MeshPhongMaterial({ 
            color: 0x00d4ff, 
            emissive: 0x004466,
            shininess: 100 
        });
        var sphereMat2 = new THREE.MeshPhongMaterial({ 
            color: 0xff00ff, 
            emissive: 0x440044,
            shininess: 100 
        });
        var lineMat = new THREE.LineBasicMaterial({ 
            color: 0x00ffaa, 
            transparent: true, 
            opacity: 0.6 
        });
        
        for (var i = 0; i < totalPoints; i++) {
            var t = i / totalPoints;
            var angle = t * Math.PI * 2 * turns;
            var y = (t - 0.5) * helixHeight;
            
            var x1 = Math.cos(angle) * helixRadius;
            var z1 = Math.sin(angle) * helixRadius;
            var x2 = Math.cos(angle + Math.PI) * helixRadius;
            var z2 = Math.sin(angle + Math.PI) * helixRadius;
            
            var sphereGeo = new THREE.SphereGeometry(0.3, 8, 8);
            
            var sphere1 = new THREE.Mesh(sphereGeo, sphereMat1);
            sphere1.position.set(x1, y, z1);
            group.add(sphere1);
            
            var sphere2 = new THREE.Mesh(sphereGeo, sphereMat2);
            sphere2.position.set(x2, y, z2);
            group.add(sphere2);
            
            if (i % 3 === 0) {
                var lineGeo = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(x1, y, z1),
                    new THREE.Vector3(x2, y, z2)
                ]);
                var line = new THREE.Line(lineGeo, lineMat);
                group.add(line);
            }
        }
        
        return group;
    }
    
    // Organoid Model
    function createOrganoid() {
        var group = new THREE.Group();
        
        var mainMat = new THREE.MeshPhongMaterial({
            color: 0x00d4ff,
            emissive: 0x002244,
            transparent: true,
            opacity: 0.85,
            shininess: 100
        });
        
        var centerGeo = new THREE.SphereGeometry(1, 32, 32);
        var center = new THREE.Mesh(centerGeo, mainMat);
        group.add(center);
        
        var smallMat = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            emissive: 0x220022,
            transparent: true,
            opacity: 0.75,
            shininess: 80
        });
        
        for (var i = 0; i < 15; i++) {
            var phi = Math.acos(-1 + (2 * i) / 15);
            var theta = Math.sqrt(15 * Math.PI) * phi;
            var r = 1.3 + Math.random() * 0.3;
            
            var smallGeo = new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 16, 16);
            var small = new THREE.Mesh(smallGeo, smallMat);
            small.position.setFromSphericalCoords(r, phi, theta);
            group.add(small);
        }
        
        // Inner nucleus
        var nucleusMat = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            emissive: 0x003322,
            shininess: 120
        });
        var nucleusGeo = new THREE.SphereGeometry(0.4, 24, 24);
        var nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
        group.add(nucleus);
        
        return group;
    }
    
    // Organ-on-Chip Model
    function createChip() {
        var group = new THREE.Group();
        
        // Base
        var baseGeo = new THREE.BoxGeometry(2.5, 0.25, 1.8);
        var baseMat = new THREE.MeshPhongMaterial({
            color: 0x1a1a2e,
            emissive: 0x0a0a15,
            shininess: 50
        });
        var base = new THREE.Mesh(baseGeo, baseMat);
        group.add(base);
        
        // Top layer (transparent)
        var topGeo = new THREE.BoxGeometry(2.5, 0.1, 1.8);
        var topMat = new THREE.MeshPhongMaterial({
            color: 0x4488ff,
            emissive: 0x112244,
            transparent: true,
            opacity: 0.3,
            shininess: 100
        });
        var top = new THREE.Mesh(topGeo, topMat);
        top.position.y = 0.25;
        group.add(top);
        
        // Channels
        var channelMat = new THREE.MeshPhongMaterial({
            color: 0x00d4ff,
            emissive: 0x004466,
            transparent: true,
            opacity: 0.7
        });
        
        // Main channel
        var mainChannelGeo = new THREE.BoxGeometry(2.2, 0.12, 0.08);
        var mainChannel = new THREE.Mesh(mainChannelGeo, channelMat);
        mainChannel.position.y = 0.18;
        group.add(mainChannel);
        
        // Branch channels
        for (var i = 0; i < 4; i++) {
            var branchGeo = new THREE.BoxGeometry(0.06, 0.12, 0.6);
            var branch = new THREE.Mesh(branchGeo, channelMat);
            branch.position.set(-0.8 + i * 0.5, 0.18, 0.34);
            group.add(branch);
        }
        
        // Tissue chambers
        var chamberMat = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            emissive: 0x440044,
            transparent: true,
            opacity: 0.65
        });
        
        for (var j = 0; j < 4; j++) {
            var chamberGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16);
            var chamber = new THREE.Mesh(chamberGeo, chamberMat);
            chamber.position.set(-0.8 + j * 0.5, 0.28, 0);
            group.add(chamber);
        }
        
        // Inlet/outlet ports
        var portMat = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            emissive: 0x003322
        });
        
        var inletGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12);
        var inlet = new THREE.Mesh(inletGeo, portMat);
        inlet.position.set(-1.15, 0.25, 0);
        group.add(inlet);
        
        var outlet = new THREE.Mesh(inletGeo, portMat);
        outlet.position.set(1.15, 0.25, 0);
        group.add(outlet);
        
        return group;
    }
    
    // Cell Model
    function createCell() {
        var group = new THREE.Group();
        
        // Membrane
        var membraneGeo = new THREE.SphereGeometry(1.3, 32, 32);
        var membraneMat = new THREE.MeshPhongMaterial({
            color: 0x00d4ff,
            emissive: 0x001122,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        var membrane = new THREE.Mesh(membraneGeo, membraneMat);
        group.add(membrane);
        
        // Nucleus
        var nucleusGeo = new THREE.SphereGeometry(0.55, 24, 24);
        var nucleusMat = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            emissive: 0x330033,
            shininess: 100
        });
        var nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
        group.add(nucleus);
        
        // Nucleolus
        var nucleolusGeo = new THREE.SphereGeometry(0.15, 16, 16);
        var nucleolusMat = new THREE.MeshPhongMaterial({
            color: 0xff4488,
            emissive: 0x441122
        });
        var nucleolus = new THREE.Mesh(nucleolusGeo, nucleolusMat);
        nucleolus.position.set(0.2, 0.1, 0.2);
        group.add(nucleolus);
        
        // Mitochondria
        var mitoMat = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            emissive: 0x003322
        });
        
        for (var i = 0; i < 6; i++) {
            var angle = (i / 6) * Math.PI * 2;
            var radius = 0.8 + Math.random() * 0.2;
            
            // CapsuleGeometry not available in THREE.js r128, using CylinderGeometry instead
            var mitoGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
            var mito = new THREE.Mesh(mitoGeo, mitoMat);
            mito.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 0.6,
                Math.sin(angle) * radius
            );
            mito.rotation.set(Math.random(), Math.random(), Math.random());
            group.add(mito);
        }
        
        // ER (simplified)
        var erMat = new THREE.MeshPhongMaterial({
            color: 0x4488ff,
            emissive: 0x112244,
            transparent: true,
            opacity: 0.5
        });
        
        var erGeo = new THREE.TorusGeometry(0.7, 0.05, 8, 24);
        var er = new THREE.Mesh(erGeo, erMat);
        er.rotation.x = Math.PI / 2;
        er.position.y = 0.3;
        group.add(er);
        
        return group;
    }
    
    // Show static fallbacks when 3D is off
    function showStaticFallbacks() {
        var viewers = ['organoidViewer', 'chipViewer', 'ctdna-viewer'];
        viewers.forEach(function(id) {
            var container = document.getElementById(id);
            if (container) {
                container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#0055ff;font-size:14px;text-align:center;padding:20px;background:linear-gradient(135deg, rgba(0,20,40,0.9), rgba(20,0,40,0.9));border-radius:12px;">Enable 3D mode for interactive visualization</div>';
            }
        });
    }
    
    // Cleanup function
    function cleanup() {
        activeScenes.forEach(function(s) {
            cancelAnimationFrame(s.animationId);
            window.removeEventListener('resize', s.onResize);
            if (s.renderer) s.renderer.dispose();
        });
        activeScenes = [];
    }
    
    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPA3D);
    } else {
        setTimeout(initPA3D, 100);
    }
    
    // Export
    window.PA3D = {
        init: initPA3D,
        cleanup: cleanup,
        isEnabled: should3DInit,
        hasWebGL: hasWebGL
    };
    
})();

console.log('[PA-3D] Lightweight 3D Viewer module ready');
