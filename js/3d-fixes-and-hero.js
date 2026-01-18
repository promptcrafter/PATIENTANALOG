/**
 * PatientAnalog - 3D Viewer Fixes + New Interactive Hero
 * This file fixes the black 3D viewer issue and creates a new futuristic hero element
 */

(function() {
    'use strict';
    
    // ============================================================================
    // PART 1: FIX FOR 3D VIEWERS RENDERING BLACK
    // ============================================================================
    
    /**
     * The issue: Many 3D viewers initialize before their containers are visible,
     * causing them to have 0 dimensions. This results in black/empty scenes.
     * 
     * Solution: Re-initialize viewers when they become visible using IntersectionObserver
     */
    
    function fix3DViewers() {
        console.log('[3D Fix] Starting 3D viewer diagnostic and repair...');
        
        // Wait for THREE.js to load
        if (typeof THREE === 'undefined') {
            console.log('[3D Fix] Waiting for THREE.js to load...');
            setTimeout(fix3DViewers, 100);
            return;
        }
        
        // Find all 3D viewer containers
        const viewerContainers = document.querySelectorAll(
            '#organoidViewer, #chipViewer, #dtwinViewer, ' +
            '.viewer-container, .biomarker-viewer, ' +
            '[id$="Viewer"], [class*="3d-viewer"]'
        );
        
        console.log('[3D Fix] Found ' + viewerContainers.length + ' potential 3D viewer containers');
        
        viewerContainers.forEach(function(container) {
            // Check if container has a canvas (already initialized)
            const existingCanvas = container.querySelector('canvas');
            
            if (existingCanvas) {
                // Canvas exists - check if it's rendering properly
                const canvas = existingCanvas;
                const hasSize = canvas.width > 0 && canvas.height > 0;
                
                if (!hasSize) {
                    console.warn('[3D Fix] Canvas in ' + container.id + ' has no size, will re-initialize');
                    // Remove and re-create
                    canvas.remove();
                    scheduleViewerReinit(container);
                } else {
                    console.log('[3D Fix] Canvas in ' + container.id + ' looks okay (' + canvas.width + 'x' + canvas.height + ')');
                }
            } else {
                // No canvas yet - might initialize later
                console.log('[3D Fix] No canvas in ' + container.id + ', will monitor');
                scheduleViewerReinit(container);
            }
        });
    }
    
    function scheduleViewerReinit(container) {
        // Use IntersectionObserver to reinitialize when container becomes visible
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    // Container is visible - ensure it has dimensions
                    const width = container.clientWidth;
                    const height = container.clientHeight;
                    
                    if (width > 10 && height > 10) {
                        console.log('[3D Fix] Container ' + container.id + ' is visible with size ' + width + 'x' + height);
                        
                        // Force re-initialization based on container ID/class
                        if (container.id.includes('organoid') || container.classList.contains('organoid-viewer')) {
                            reinitOrganoidViewer(container);
                        } else if (container.id.includes('chip')) {
                            reinitChipViewer(container);
                        } else {
                            // Generic reinit
                            reinitGenericViewer(container);
                        }
                        
                        observer.disconnect();
                    }
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(container);
    }
    
    function reinitOrganoidViewer(container) {
        if (container.querySelector('canvas')) return; // Already has canvas
        
        console.log('[3D Fix] Reinitializing organoid viewer in ' + container.id);
        
        // Call the global createOrganoidViewer if it exists
        if (typeof window.createOrganoidViewer === 'function') {
            window.createOrganoidViewer(container.id, {});
        } else if (typeof window.Interactive3DViewer !== 'undefined' && 
                   window.Interactive3DViewer.createOrganoidViewer) {
            window.Interactive3DViewer.createOrganoidViewer(container.id, {});
        }
    }
    
    function reinitChipViewer(container) {
        if (container.querySelector('canvas')) return;
        console.log('[3D Fix] Reinitializing chip viewer in ' + container.id);
        if (typeof window.createChipViewer === 'function') {
            window.createChipViewer(container.id, {});
        }
    }
    
    function reinitGenericViewer(container) {
        console.log('[3D Fix] Generic reinit for ' + container.id);
        // This handles any custom viewers - they should self-initialize when visible
    }
    
    // ============================================================================
    // PART 2: NEW INTERACTIVE HERO ELEMENT
    // ============================================================================
    
    /**
     * Create a futuristic, interactive particle system for the hero section
     * Features:
     * - Biomarker/molecule particles floating in 3D space
     * - Mouse/touch interaction (particles attracted to pointer)
     * - Connections between nearby particles (network effect)
     * - Color-coded by "molecule type"
     * - Smooth, mesmerizing animation
     */
    
    function createInteractiveHero() {
        const heroContainer = document.querySelector('.hero-section') || 
                             document.querySelector('[class*="hero"]') ||
                             document.getElementById('hero');
        
        if (!heroContainer) {
            console.warn('[Hero] No hero container found');
            return;
        }
        
        // Remove old DNA helix
        const oldHelix = document.getElementById('dnaHelix');
        if (oldHelix) {
            console.log('[Hero] Removing old DNA helix');
            oldHelix.remove();
        }
        
        const oldParticles = document.getElementById('heroParticles');
        if (oldParticles) {
            oldParticles.remove();
        }
        
        // Create new canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'heroInteractive';
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;z-index:1;';
        
        heroContainer.style.position = 'relative';
        heroContainer.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        let mouse = { x: null, y: null, radius: 150 };
        let animationId;
        
        // Color palette based on PatientAnalog theme
        const colors = [
            '#0055ff', // Cyan (biomarkers)
            '#ffaa00', // Pink (cells)
            '#00ff88', // Green (signals)
            '#ffc300', // Yellow (metabolites)
            '#9d00ff', // Purple (proteins)
            '#7dd3fc'  // Light blue (data)
        ];
        
        function resize() {
            width = canvas.width = heroContainer.offsetWidth;
            height = canvas.height = heroContainer.offsetHeight;
            initParticles();
        }
        
        function initParticles() {
            particles = [];
            const particleCount = Math.min(Math.floor(width * height / 8000), 120); // Adaptive count
            
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    z: Math.random() * 500, // Depth for parallax
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    vz: (Math.random() - 0.5) * 0.2,
                    radius: Math.random() * 3 + 2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    type: Math.floor(Math.random() * 3), // 0: biomarker, 1: cell, 2: signal
                    pulsePhase: Math.random() * Math.PI * 2
                });
            }
        }
        
        function drawParticle(p, time) {
            // Calculate apparent size based on depth (parallax)
            const depthScale = 1 - (p.z / 1000);
            const size = p.radius * (0.8 + depthScale * 0.4);
            
            // Pulsing effect
            const pulse = 1 + Math.sin(time * 0.002 + p.pulsePhase) * 0.15;
            const finalSize = size * pulse;
            
            // Color with depth-based opacity
            const opacity = 0.6 + depthScale * 0.4;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, finalSize, 0, Math.PI * 2);
            
            // Gradient fill
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, finalSize);
            const baseColor = p.color;
            gradient.addColorStop(0, baseColor + 'ff');
            gradient.addColorStop(0.5, baseColor + Math.floor(opacity * 200).toString(16));
            gradient.addColorStop(1, baseColor + '00');
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Outer glow for special types
            if (p.type === 2) { // Signal particles get extra glow
                ctx.strokeStyle = baseColor + '40';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        function drawConnections() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dz = particles[i].z - particles[j].z;
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz * 0.1); // Z weighted less
                    
                    if (distance < 120) {
                        const opacity = (1 - distance / 120) * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = 'rgba(0, 85, 255, ' + opacity + ')';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        }
        
        function updateParticles() {
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                // Mouse interaction
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < mouse.radius) {
                        const force = (mouse.radius - distance) / mouse.radius;
                        const angle = Math.atan2(dy, dx);
                        
                        // Attract particles to mouse
                        p.vx -= Math.cos(angle) * force * 0.3;
                        p.vy -= Math.sin(angle) * force * 0.3;
                    }
                }
                
                // Update position
                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;
                
                // Boundaries with wrap-around
                if (p.x < -10) p.x = width + 10;
                if (p.x > width + 10) p.x = -10;
                if (p.y < -10) p.y = height + 10;
                if (p.y > height + 10) p.y = -10;
                if (p.z < 0) p.z = 500;
                if (p.z > 500) p.z = 0;
                
                // Slight friction
                p.vx *= 0.99;
                p.vy *= 0.99;
                p.vz *= 0.99;
                
                // Add slight random motion
                p.vx += (Math.random() - 0.5) * 0.02;
                p.vy += (Math.random() - 0.5) * 0.02;
            }
        }
        
        function animate() {
            const time = Date.now();
            
            // Clear with fade effect
            ctx.fillStyle = 'rgba(0, 8, 20, 0.15)';
            ctx.fillRect(0, 0, width, height);
            
            // Update particles
            updateParticles();
            
            // Draw connections first (background layer)
            drawConnections();
            
            // Draw particles
            particles.forEach(function(p) {
                drawParticle(p, time);
            });
            
            animationId = requestAnimationFrame(animate);
        }
        
        // Mouse/Touch event handlers
        canvas.addEventListener('mousemove', function(e) {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        
        canvas.addEventListener('mouseleave', function() {
            mouse.x = null;
            mouse.y = null;
        });
        
        canvas.addEventListener('touchmove', function(e) {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            mouse.x = touch.clientX - rect.left;
            mouse.y = touch.clientY - rect.top;
        }, { passive: false });
        
        canvas.addEventListener('touchend', function() {
            mouse.x = null;
            mouse.y = null;
        });
        
        // Initialize
        resize();
        window.addEventListener('resize', resize);
        animate();
        
        console.log('[Hero] Interactive particle system initialized with ' + particles.length + ' particles');
        
        // Cleanup function
        return function cleanup() {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
            canvas.remove();
        };
    }
    
    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    
    function init() {
        console.log('[PatientAnalog] Initializing 3D fixes and interactive hero...');
        
        // Fix 3D viewers
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fix3DViewers);
        } else {
            fix3DViewers();
        }
        
        // Create interactive hero
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createInteractiveHero);
        } else {
            setTimeout(createInteractiveHero, 100); // Small delay to ensure DOM is ready
        }
    }
    
    init();
    
    // Export for debugging
    window.PatientAnalogDebug = {
        fix3DViewers: fix3DViewers,
        createInteractiveHero: createInteractiveHero
    };
    
})();
// v20260117-FULL
