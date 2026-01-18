/**
 * PATIENTANALOG - WebGL Detection & GPU Optimization Module
 * Prevents 3D graphics failures with graceful fallbacks
 * 
 * SAFE: Does not interfere with existing JavaScript
 * CRITICAL: Must load BEFORE other 3D modules
 * 
 * @version 1.0.0
 */

(function() {
    'use strict';

    // ============================================
    // WebGL CAPABILITY DETECTION
    // ============================================
    
    const WebGLDetector = {
        supported: false,
        tier: 'unknown',
        capabilities: {},
        
        /**
         * Detect WebGL support
         */
        detect: function() {
            try {
                const canvas = document.createElement('canvas');
                if (!canvas) return false;
                
                const gl = canvas.getContext('webgl') || 
                          canvas.getContext('experimental-webgl');
                
                if (!gl) {
                    console.warn('[WebGL] Not supported on this device');
                    return false;
                }
                
                // Check GPU tier
                const maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
                const maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
                
                this.capabilities = {
                    maxTextures: maxTextures,
                    maxFragmentUniforms: maxFragmentUniforms,
                    vendor: gl.getParameter(gl.VENDOR),
                    renderer: gl.getParameter(gl.RENDERER),
                    version: gl.getParameter(gl.VERSION)
                };
                
                // Determine tier
                if (maxTextures >= 16 && maxFragmentUniforms >= 256) {
                    this.tier = 'high';
                } else if (maxTextures >= 8 && maxFragmentUniforms >= 128) {
                    this.tier = 'medium';
                } else {
                    this.tier = 'low';
                }
                
                this.supported = true;
                console.info('[WebGL] ✓ Supported at ' + this.tier + ' tier');
                console.info('[WebGL] Device:', this.capabilities.renderer);
                
                return true;
                
            } catch (e) {
                console.error('[WebGL] Detection error:', e.message);
                return false;
            }
        },
        
        /**
         * Get initialization settings based on GPU tier
         */
        getOptimizations: function() {
            if (!this.supported) {
                return {
                    enabled: false,
                    renderingLevel: 'none'
                };
            }
            
            const settings = {
                enabled: true,
                renderingLevel: this.tier,
                
                high: {
                    enableShadows: true,
                    maxFPS: 60,
                    antialias: true,
                    quality: 'high',
                    pixelRatio: Math.min(window.devicePixelRatio, 2)
                },
                
                medium: {
                    enableShadows: false,
                    maxFPS: 45,
                    antialias: window.devicePixelRatio < 2,
                    quality: 'medium',
                    pixelRatio: 1
                },
                
                low: {
                    enableShadows: false,
                    maxFPS: 30,
                    antialias: false,
                    quality: 'low',
                    pixelRatio: 1
                }
            };
            
            return settings;
        }
    };
    
    // ============================================
    // DEVICE CAPABILITY DETECTION
    // ============================================
    
    const DeviceConfig = {
        isWeakDevice: navigator.hardwareConcurrency < 4 || 
                     (navigator.deviceMemory && navigator.deviceMemory < 4),
        isSlowNetwork: navigator.connection && 
                      ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType),
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        isMobile: /iPhone|iPad|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isTablet: /iPad|Android/.test(navigator.userAgent) && !/Mobile/.test(navigator.userAgent),
        
        /**
         * Determine if heavy modules should be deferred
         */
        shouldDeferHeavy: function() {
            return this.isWeakDevice || this.isSlowNetwork || this.prefersReducedMotion;
        }
    };
    
    // ============================================
    // 3D VIEWER INITIALIZATION WRAPPER
    // ============================================
    
    const ThreeJSInit = {
        /**
         * Safe initialization of 3D viewers
         */
        initViewer: function(containerId, ViewerClass, options) {
            const container = document.getElementById(containerId);
            
            if (!container) {
                console.warn('[3D] Container #' + containerId + ' not found');
                return null;
            }
            
            // Check WebGL support
            if (!WebGLDetector.supported) {
                console.warn('[3D] WebGL not supported - using fallback for #' + containerId);
                this.showFallback(container);
                return null;
            }
            
            // Apply optimizations based on device
            const optimizations = WebGLDetector.getOptimizations();
            const mergedOptions = Object.assign({}, options, optimizations[optimizations.renderingLevel]);
            
            try {
                const viewer = new ViewerClass(containerId, mergedOptions);
                console.info('[3D] Initialized:', containerId);
                return viewer;
            } catch (e) {
                console.error('[3D] Failed to initialize ' + containerId + ':', e.message);
                this.showFallback(container);
                return null;
            }
        },
        
        /**
         * Show fallback content when WebGL fails
         */
        showFallback: function(container) {
            container.innerHTML = '<div style="' +
                'width:100%; height:100%; ' +
                'background:linear-gradient(135deg, rgba(0,29,61,0.8) 0%, rgba(15,90,143,0.8) 100%); ' +
                'display:flex; align-items:center; justify-content:center; ' +
                'border:1px solid rgba(0,212,255,0.25); border-radius:8px; ' +
                '">' +
                '<div style="text-align:center; color:#f0f4f8; padding:40px;">' +
                '<p style="font-size:18px; font-weight:bold; margin-bottom:10px;">3D Not Available</p>' +
                '<p style="font-size:14px; color:rgba(240,244,248,0.7);">Your browser doesn\'t support WebGL</p>' +
                '</div>' +
                '</div>';
        }
    };
    
    // ============================================
    // MEMORY MANAGEMENT
    // ============================================
    
    const MemoryManager = {
        viewers: [],
        listeners: [],
        
        /**
         * Register a viewer for cleanup
         */
        register: function(viewer) {
            this.viewers.push(viewer);
        },
        
        /**
         * Register an event listener for cleanup
         */
        trackListener: function(element, event, handler) {
            this.listeners.push({
                element: element,
                event: event,
                handler: handler
            });
            element.addEventListener(event, handler);
        },
        
        /**
         * Cleanup all resources
         */
        cleanup: function() {
            console.info('[Memory] Cleaning up resources...');
            
            // Destroy viewers
            this.viewers.forEach(function(viewer) {
                if (viewer && typeof viewer.destroy === 'function') {
                    try {
                        viewer.destroy();
                    } catch (e) {
                        console.warn('[Memory] Viewer cleanup error:', e.message);
                    }
                }
            });
            
            // Remove listeners
            this.listeners.forEach(function(item) {
                try {
                    item.element.removeEventListener(item.event, item.handler);
                } catch (e) {
                    console.warn('[Memory] Listener removal error:', e.message);
                }
            });
            
            this.viewers = [];
            this.listeners = [];
        }
    };
    
    // ============================================
    // INITIALIZATION ON LOAD
    // ============================================
    
    function initialize() {
        // Detect WebGL
        WebGLDetector.detect();
        
        // Store configurations globally
        window.PA_WEBGL = WebGLDetector;
        window.PA_DEVICE = DeviceConfig;
        window.PA_3D_INIT = ThreeJSInit;
        window.PA_MEMORY = MemoryManager;
        
        // Add CSS class for device awareness
        const html = document.documentElement;
        if (DeviceConfig.shouldDeferHeavy()) {
            html.classList.add('defer-heavy-modules');
        }
        if (DeviceConfig.isMobile) {
            html.classList.add('is-mobile');
        }
        if (DeviceConfig.isTablet) {
            html.classList.add('is-tablet');
        }
        
        console.info('[PA] Initialization complete');
        console.info('[Device]', {
            weak: DeviceConfig.isWeakDevice,
            slowNetwork: DeviceConfig.isSlowNetwork,
            reducedMotion: DeviceConfig.prefersReducedMotion,
            mobile: DeviceConfig.isMobile
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Cleanup on unload
    window.addEventListener('beforeunload', function() {
        if (window.PA_MEMORY) {
            window.PA_MEMORY.cleanup();
        }
    });
    
})();

/* ============================================
   CONSOLE: Check Configuration
   ============================================
   
   In browser console, check:
   
   > window.PA_WEBGL        // WebGL detection results
   > window.PA_DEVICE       // Device capabilities
   > window.PA_3D_INIT      // 3D initialization helper
   > window.PA_MEMORY       // Memory management
   
   Expected output:
   [WebGL] ✓ Supported at high|medium|low tier
   [Device] {...}
   [PA] Initialization complete
   
 */
// v20260117-FULL
