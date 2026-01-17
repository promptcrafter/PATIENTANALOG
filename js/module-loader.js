/**
 * PatientAnalog Module Loader
 * Implements code splitting and lazy loading for heavy modules
 */
const PAModuleLoader = (function() {
    'use strict';
    
    const loadedModules = new Set();
    const pendingLoads = new Map();
    
    const config = window.PA_DEVICE_CONFIG || {
        isWeak: false,
        isSlowNetwork: false,
        reducedMotion: false,
        shouldDeferHeavy: false
    };
    
    const modules = {
        '3d-viewer': {
            script: 'js/interactive-3d-viewer.js',
            deps: ['three'],
            heavy: true
        },
        'bio-background': {
            script: 'js/bio-background.js',
            deps: ['three'],
            heavy: true
        },
        'biometric-hud': {
            script: 'js/biometric-hud.js',
            deps: [],
            heavy: true
        },
        'kids-zone': {
            script: 'js/kids-zone-module.js',
            deps: [],
            heavy: false
        },
        'advanced-3d': {
            script: 'js/advanced-3d-modules.js',
            deps: ['three'],
            heavy: true
        },
        'vr-system': {
            script: 'js/vr-system.js',
            deps: ['three'],
            heavy: true
        },
        'tilt-effects': {
            script: 'js/tilt-effects.js',
            deps: [],
            heavy: false
        },
        'smooth-scroll': {
            script: 'js/smooth-scroll.js',
            deps: [],
            heavy: false
        }
    };
    
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (pendingLoads.has(src)) {
                return pendingLoads.get(src);
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            const promise = new Promise((res, rej) => {
                script.onload = () => {
                    loadedModules.add(src);
                    res();
                };
                script.onerror = rej;
            });
            
            pendingLoads.set(src, promise);
            document.body.appendChild(script);
            
            promise.then(resolve).catch(reject);
        });
    }
    
    async function loadModule(moduleName) {
        const mod = modules[moduleName];
        if (!mod) {
            console.warn(`[PAModuleLoader] Unknown module: ${moduleName}`);
            return;
        }
        
        // Skip heavy modules on weak devices unless forced
        if (mod.heavy && config.shouldDeferHeavy) {
            console.log(`[PAModuleLoader] Deferring heavy module: ${moduleName}`);
            return;
        }
        
        // Load dependencies first
        for (const dep of mod.deps) {
            if (dep === 'three' && !window.THREE) {
                console.log('[PAModuleLoader] Three.js not loaded, skipping 3D module');
                return;
            }
        }
        
        // Load the module
        if (!loadedModules.has(mod.script)) {
            console.log(`[PAModuleLoader] Loading: ${moduleName}`);
            await loadScript(mod.script);
        }
    }
    
    function loadOnInteraction(moduleName, triggerElement) {
        const trigger = typeof triggerElement === 'string' 
            ? document.querySelector(triggerElement) 
            : triggerElement;
            
        if (!trigger) return;
        
        const load = () => {
            loadModule(moduleName);
            trigger.removeEventListener('mouseenter', load);
            trigger.removeEventListener('click', load);
            trigger.removeEventListener('touchstart', load);
        };
        
        trigger.addEventListener('mouseenter', load, { once: true, passive: true });
        trigger.addEventListener('click', load, { once: true, passive: true });
        trigger.addEventListener('touchstart', load, { once: true, passive: true });
    }
    
    function loadOnScroll(moduleName, threshold = 0.1) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadModule(moduleName);
                    observer.disconnect();
                }
            });
        }, { threshold });
        
        // Observe a sentinel element or the body
        const sentinel = document.querySelector(`[data-module="${moduleName}"]`) || document.body;
        observer.observe(sentinel);
    }
    
    // Public API
    return {
        load: loadModule,
        loadOnInteraction,
        loadOnScroll,
        isLoaded: (name) => loadedModules.has(modules[name]?.script),
        config
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PAModuleLoader;
}

console.log('[PAModuleLoader] Initialized', PAModuleLoader.config);
