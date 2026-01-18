/**
 * PatientAnalog.com - Core Engine
 * Unified architecture orchestrating all 5 master systems
 * 
 * @version 1.0.0
 * @author PatientAnalog Research Initiative
 */

// ============================================
// EVENT BUS - Cross-module communication
// ============================================
const EventBus = (function() {
    'use strict';
    
    const events = {};
    
    return {
        /**
         * Subscribe to an event
         * @param {string} event - Event name
         * @param {function} callback - Handler function
         * @returns {function} Unsubscribe function
         */
        on: function(event, callback) {
            if (!events[event]) {
                events[event] = [];
            }
            events[event].push(callback);
            
            // Return unsubscribe function
            return () => {
                events[event] = events[event].filter(cb => cb !== callback);
            };
        },
        
        /**
         * Emit an event
         * @param {string} event - Event name
         * @param {*} data - Event data
         */
        emit: function(event, data) {
            if (events[event]) {
                events[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (e) {
                        console.error(`EventBus error in ${event}:`, e);
                    }
                });
            }
        },
        
        /**
         * Subscribe to an event once
         * @param {string} event - Event name
         * @param {function} callback - Handler function
         */
        once: function(event, callback) {
            const unsubscribe = this.on(event, (data) => {
                callback(data);
                unsubscribe();
            });
        },
        
        /**
         * Remove all listeners for an event
         * @param {string} event - Event name
         */
        off: function(event) {
            delete events[event];
        },
        
        /**
         * Get all registered events (for debugging)
         */
        getEvents: function() {
            return Object.keys(events);
        }
    };
})();

// ============================================
// STATE MANAGEMENT - Global application state
// ============================================
const StateManager = (function() {
    'use strict';
    
    // Initial state
    let state = {
        // Current active system
        activeSystem: null, // 'chip' | 'organoid' | 'digitalTwin' | 'ai' | 'biomarker'
        
        // Current domain context
        currentDomain: null,
        currentPreset: null,
        
        // Active viewers
        viewers: {
            organoid: null,
            chip: null,
            simulator: null
        },
        
        // VR state
        vr: {
            enabled: false,
            session: null,
            controllers: []
        },
        
        // User preferences
        preferences: {
            quality: 'high', // 'low' | 'medium' | 'high'
            vrEnabled: false,
            soundEnabled: true
        },
        
        // Navigation state
        navigation: {
            currentSection: 'home',
            previousSection: null,
            history: []
        },
        
        // Simulation state
        simulation: {
            running: false,
            currentDrug: null,
            concentration: 50,
            timeElapsed: 0,
            results: {}
        },
        
        // Discovery Zone state
        kidsZone: {
            score: 0,
            completedChallenges: [],
            currentChallenge: null
        }
    };
    
    // State history for undo
    const stateHistory = [];
    const MAX_HISTORY = 50;
    
    return {
        /**
         * Get current state or a specific path
         * @param {string} path - Optional dot-notation path (e.g., 'simulation.currentDrug')
         * @returns {*} State value
         */
        getState: function(path) {
            if (!path) return { ...state };
            
            return path.split('.').reduce((obj, key) => {
                return obj && obj[key] !== undefined ? obj[key] : undefined;
            }, state);
        },
        
        /**
         * Set state value
         * @param {string} path - Dot-notation path
         * @param {*} value - New value
         */
        setState: function(path, value) {
            // Save to history
            if (stateHistory.length >= MAX_HISTORY) {
                stateHistory.shift();
            }
            stateHistory.push(JSON.stringify(state));
            
            // Update state
            const keys = path.split('.');
            let current = state;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            const oldValue = current[keys[keys.length - 1]];
            current[keys[keys.length - 1]] = value;
            
            // Emit change event
            EventBus.emit('stateChange', {
                path: path,
                oldValue: oldValue,
                newValue: value
            });
            
            EventBus.emit(`stateChange:${path}`, {
                oldValue: oldValue,
                newValue: value
            });
        },
        
        /**
         * Batch update multiple state values
         * @param {object} updates - Object with path:value pairs
         */
        batchUpdate: function(updates) {
            Object.entries(updates).forEach(([path, value]) => {
                this.setState(path, value);
            });
        },
        
        /**
         * Reset state to initial values
         */
        resetState: function() {
            stateHistory.push(JSON.stringify(state));
            state = {
                activeSystem: null,
                currentDomain: null,
                currentPreset: null,
                viewers: { organoid: null, chip: null, simulator: null },
                vr: { enabled: false, session: null, controllers: [] },
                preferences: { quality: 'high', vrEnabled: false, soundEnabled: true },
                navigation: { currentSection: 'home', previousSection: null, history: [] },
                simulation: { running: false, currentDrug: null, concentration: 50, timeElapsed: 0, results: {} },
                kidsZone: { score: 0, completedChallenges: [], currentChallenge: null }
            };
            EventBus.emit('stateReset');
        },
        
        /**
         * Undo last state change
         */
        undo: function() {
            if (stateHistory.length > 0) {
                state = JSON.parse(stateHistory.pop());
                EventBus.emit('stateUndo');
            }
        }
    };
})();

// ============================================
// SPA ROUTER - Client-side navigation
// ============================================
const Router = (function() {
    'use strict';
    
    let currentRoute = null;
    let isInitialized = false;
    
    // Route definitions
    const routeConfig = {
        '/': { section: 'home', title: 'Patient Analog - Human Simulation Technologies' },
        '/technologies': { section: 'technologies', title: 'Technologies Hub | Patient Analog' },
        '/science': { section: 'science', title: 'Science Hub | Patient Analog' },
        '/companies': { section: 'companies', title: 'Companies Hub | Patient Analog' },
        '/regulatory': { section: 'regulatory', title: 'Regulatory Hub | Patient Analog' },
        '/market': { section: 'market', title: 'Market Intelligence | Patient Analog' },
        '/domain-portfolio': { section: 'domain-portfolio', title: 'Domain Portfolio | Patient Analog' },
        '/resources': { section: 'resources', title: 'Resources Hub | Patient Analog' },
        '/interactive-lab': { section: 'interactive-lab', title: '3D Visualization Lab | Patient Analog' },
        '/kids-zone': { section: 'kids-zone', title: 'Science Discovery Zone | Patient Analog' }
    };
    
    /**
     * Initialize router with History API
     */
    function init() {
        if (isInitialized) return;
        isInitialized = true;
        
        // Listen for popstate (back/forward browser buttons)
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.section) {
                navigateToSection(event.state.section, false);
            } else {
                handleRouteChange();
            }
        });
        
        // Handle initial route
        handleRouteChange();
        
        // Intercept anchor clicks for SPA navigation
        document.addEventListener('click', (e) => {
            // Handle #section links
            const hashLink = e.target.closest('a[href^="#"]');
            if (hashLink) {
                e.preventDefault();
                const section = hashLink.getAttribute('href').substring(1);
                navigate(section);
                return;
            }
            
            // Handle /path links (internal SPA routes)
            const pathLink = e.target.closest('a[href^="/"]');
            if (pathLink && !pathLink.hasAttribute('data-external')) {
                const href = pathLink.getAttribute('href');
                if (routeConfig[href]) {
                    e.preventDefault();
                    navigate(routeConfig[href].section);
                }
            }
        });
        
        console.log('Router initialized (History API mode)');
    }
    
    /**
     * Handle route change from URL
     */
    function handleRouteChange() {
        // Check pathname first
        let path = window.location.pathname;
        let route = routeConfig[path];
        
        // Fallback to hash for compatibility
        if (!route && window.location.hash) {
            const hash = window.location.hash.substring(1);
            route = routeConfig['/' + hash] || routeConfig['/'];
        }
        
        // Default to home
        if (!route) {
            route = routeConfig['/'];
        }
        
        navigateToSection(route.section, false);
    }
    
    /**
     * Navigate to a section
     * @param {string} section - Section ID
     * @param {boolean} pushState - Whether to push to history
     */
    function navigateToSection(section, pushState = true) {
        const routeKey = '/' + (section === 'home' ? '' : section);
        const route = routeConfig[routeKey] || routeConfig['/'];
        
        // Update state
        StateManager.setState('navigation.previousSection', currentRoute);
        StateManager.setState('navigation.currentSection', route.section);
        
        // Track history in state
        const navHistory = StateManager.getState('navigation.history') || [];
        navHistory.push(route.section);
        if (navHistory.length > 20) navHistory.shift();
        StateManager.setState('navigation.history', navHistory);
        
        currentRoute = route.section;
        
        // Update document title
        document.title = route.title;
        
        // Push to browser history (History API)
        if (pushState) {
            const newPath = section === 'home' ? '/' : '/' + section;
            window.history.pushState(
                { section: route.section, path: newPath },
                route.title,
                newPath
            );
        }
        
        // Scroll to section
        const element = document.getElementById(route.section);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Emit navigation event
        EventBus.emit('navigate', {
            section: route.section,
            path: routeKey
        });
    }
    
    /**
     * Navigate to a route
     * @param {string} section - Section name (without / or #)
     */
    function navigate(section) {
        navigateToSection(section, true);
    }
    
    /**
     * Replace current history entry
     */
    function replace(section) {
        const routeKey = '/' + (section === 'home' ? '' : section);
        const route = routeConfig[routeKey] || routeConfig['/'];
        const newPath = section === 'home' ? '/' : '/' + section;
        
        window.history.replaceState(
            { section: route.section, path: newPath },
            route.title,
            newPath
        );
        
        navigateToSection(section, false);
    }
    
    /**
     * Go back in history
     */
    function back() {
        window.history.back();
    }
    
    /**
     * Go forward in history
     */
    function forward() {
        window.history.forward();
    }
    
    /**
     * Get current route
     */
    function getCurrentRoute() {
        return currentRoute;
    }
    
    /**
     * Get current path
     */
    function getCurrentPath() {
        return window.location.pathname;
    }
    
    return {
        init: init,
        navigate: navigate,
        replace: replace,
        back: back,
        forward: forward,
        getCurrentRoute: getCurrentRoute,
        getCurrentPath: getCurrentPath,
        routes: routeConfig
    };
})();

// ============================================
// PATIENT ANALOG CORE ENGINE
// Orchestrates all 5 master systems
// ============================================
const PatientAnalogEngine = (function() {
    'use strict';
    
    // Engine configuration
    const CONFIG = {
        version: '1.0.0',
        debug: false,
        autoInit: true
    };
    
    // Master systems registry
    const systems = {
        chip: null,
        organoid: null,
        digitalTwin: null,
        ai: null,
        biomarker: null
    };
    
    // Active viewers
    const activeViewers = new Map();
    
    /**
     * Initialize the core engine
     */
    function init() {
        console.log(`PatientAnalog Engine v${CONFIG.version} initializing...`);
        
        // Initialize router
        Router.init();
        
        // Initialize systems
        initializeSystems();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize VR if available
        checkVRSupport();
        
        EventBus.emit('engineReady');
        console.log('PatientAnalog Engine ready');
    }
    
    /**
     * Initialize all 5 master systems
     */
    function initializeSystems() {
        // System 1: Organ-on-Chip
        systems.chip = {
            name: 'Organ-on-Chip System',
            domains: ['kidneychip.com', 'lungchip.com', 'dilichip.com', 'tissuechip.com'],
            presets: {
                kidney: { organ: 'Kidney', biomarkers: ['KIM-1', 'Creatinine'] },
                lung: { organ: 'Lung', biomarkers: ['Surfactant', 'IL-8'] },
                liver: { organ: 'Liver', biomarkers: ['ALT', 'AST'] }
            },
            create: (containerId, preset) => {
                if (window.Interactive3DViewer) {
                    return Interactive3DViewer.createChipViewer(containerId, { preset });
                }
            }
        };
        
        // System 2: Organoid
        systems.organoid = {
            name: 'Organoid Growth System',
            domains: ['organoidmedicine.com', 'organoids.app'],
            presets: {
                brain: { type: 'Cerebral', growthDays: 90 },
                liver: { type: 'Hepatic', growthDays: 21 },
                tumor: { type: 'Tumor', growthDays: 28 }
            },
            create: (containerId, preset) => {
                if (window.Interactive3DViewer) {
                    return Interactive3DViewer.createOrganoidViewer(containerId, { preset });
                }
            }
        };
        
        // System 3: Digital Twin
        systems.digitalTwin = {
            name: 'Digital Twin System',
            domains: ['patientdigitaltwin.app', 'digitaltwinhuman.com'],
            presets: {
                fullBody: { organs: 10, ai: true },
                cardiac: { organs: 1, focus: 'heart' }
            },
            create: (containerId, preset) => {
                return createDigitalTwinViewer(containerId, preset);
            }
        };
        
        // System 4: AI/Compute
        systems.ai = {
            name: 'AI Prediction System',
            domains: ['biocomputeai.com', 'omniomicsai.com'],
            presets: {
                drugPredictor: { model: 'Transformer' },
                toxicity: { model: 'GNN' }
            },
            predict: (drug, params) => {
                return aiPredict(drug, params);
            }
        };
        
        // System 5: Biomarker
        systems.biomarker = {
            name: 'Biomarker Analysis System',
            domains: ['circdna.com', 'circulatingdna.com'],
            presets: {
                ctDNA: { markers: ['KRAS', 'BRAF', 'EGFR'] },
                protein: { markers: ['Albumin', 'CRP'] }
            },
            create: (containerId, preset) => {
                return createBiomarkerViewer(containerId, preset);
            }
        };
        
        console.log('All 5 systems initialized');
    }
    
    /**
     * Set up global event listeners
     */
    function setupEventListeners() {
        // Listen for navigation events
        EventBus.on('navigate', (data) => {
            handleNavigation(data.section);
        });
        
        // Listen for state changes
        EventBus.on('stateChange:activeSystem', (data) => {
            activateSystem(data.newValue);
        });
        
        // Listen for simulation events
        EventBus.on('simulationStart', (data) => {
            StateManager.setState('simulation.running', true);
        });
        
        EventBus.on('simulationEnd', (data) => {
            StateManager.setState('simulation.running', false);
        });
    }
    
    /**
     * Handle navigation to different sections
     */
    function handleNavigation(section) {
        // Activate relevant system based on section
        switch (section) {
            case 'technologies':
            case 'interactive-lab':
                // Could activate chip or organoid viewer
                break;
            case 'kids-zone':
                initKidsZone();
                break;
        }
    }
    
    /**
     * Check VR support
     */
    function checkVRSupport() {
        if ('xr' in navigator) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                StateManager.setState('vr.enabled', supported);
                if (supported) {
                    console.log('VR support detected');
                    EventBus.emit('vrSupported');
                }
            });
        }
    }
    
    /**
     * Activate a specific system
     */
    function activateSystem(systemName) {
        if (systems[systemName]) {
            StateManager.setState('activeSystem', systemName);
            EventBus.emit('systemActivated', { system: systemName });
        }
    }
    
    /**
     * Launch a domain as a product
     */
    function launchDomain(domain, containerId) {
        const cleanDomain = domain.toLowerCase().replace(/\.(com|app|io)$/, '');
        
        // Find matching system
        for (const [name, system] of Object.entries(systems)) {
            const match = system.domains.find(d => d.includes(cleanDomain));
            if (match) {
                StateManager.setState('currentDomain', domain);
                StateManager.setState('activeSystem', name);
                
                if (system.create) {
                    return system.create(containerId, cleanDomain);
                }
            }
        }
        
        console.warn(`No system found for domain: ${domain}`);
        return null;
    }
    
    /**
     * Get a system by name
     */
    function getSystem(name) {
        return systems[name];
    }
    
    /**
     * Initialize Discovery Zone interactivity
     */
    function initKidsZone() {
        EventBus.emit('kidsZoneActivated');
        // Kids zone logic handled by KidsZoneModule
    }
    
    // Public API
    return {
        init: init,
        getSystem: getSystem,
        launchDomain: launchDomain,
        activateSystem: activateSystem,
        version: CONFIG.version,
        
        // Expose sub-modules
        EventBus: EventBus,
        StateManager: StateManager,
        Router: Router
    };
})();

// ============================================
// RETRY COUNTERS (must be before auto-init)
// ============================================
let vrRetryCount = 0;
const VR_MAX_RETRIES = 5;
let modules3DRetryCount = 0;
const MODULES_MAX_RETRIES = 10;

// ============================================
// AUTO-INITIALIZE
// ============================================
if (typeof window !== 'undefined') {
    window.PatientAnalogEngine = PatientAnalogEngine;
    window.EventBus = EventBus;
    window.StateManager = StateManager;
    window.Router = Router;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            PatientAnalogEngine.init();
            initializeVRSystem();
            initializeAdvanced3DModules();
        });
    } else {
        PatientAnalogEngine.init();
        initializeVRSystem();
        initializeAdvanced3DModules();
    }
}

/**
 * Initialize VR System and create Enter VR button
 */
function initializeVRSystem() {
    // Wait for VRSystem to be available (with limit)
    if (typeof VRSystem === 'undefined') {
        vrRetryCount++;
        if (vrRetryCount > VR_MAX_RETRIES) {
            console.log('VRSystem not available - VR features disabled');
            return;
        }
        setTimeout(initializeVRSystem, 100);
        return;
    }
    
    // Check if Three.js is available
    if (typeof THREE === 'undefined') {
        console.log('Three.js not loaded, VR button will be added when 3D viewer initializes');
        // VR will be initialized by the 3D viewer when it loads
        EventBus.on('3dViewerReady', (data) => {
            if (data.renderer && data.scene && data.camera) {
                VRSystem.createEnterVRButton(data.renderer, data.scene, data.camera);
            }
        });
        return;
    }
    
    // Initialize VR support check
    VRSystem.init().then((supported) => {
        console.log('VR System initialized, supported:', supported);
        StateManager.setState('vr.supported', supported);
    });
}

/**
 * Initialize Advanced 3D Visualization Modules
 */
function initializeAdvanced3DModules() {
    modules3DRetryCount++;

    // Poll until Three.js is available (with limit)
    if (typeof THREE === 'undefined') {
        if (modules3DRetryCount > MODULES_MAX_RETRIES) {
            console.log('Three.js not available - 3D features disabled');
            return;
        }
        setTimeout(initializeAdvanced3DModules, 250);
        return;
    }

    // Poll until advanced modules are available (with limit)
    if (typeof CtDNAParticleViewer === 'undefined' ||
        typeof ProteinStructureViewer === 'undefined' ||
        typeof AIPrediction3DPanel === 'undefined' ||
        typeof QuantumVisualizer === 'undefined') {
        if (modules3DRetryCount > MODULES_MAX_RETRIES) {
            console.log('Advanced 3D modules not available - some features disabled');
            return;
        }
        setTimeout(initializeAdvanced3DModules, 250);
        return;
    }
    
    console.log('All 3D modules ready, setting up observers and immediate init...');
    
    // Viewer configurations
    const viewerConfigs = {
        'ctdna-viewer': { 
            Class: CtDNAParticleViewer, 
            options: { particleCount: 300, markers: ['KRAS', 'BRAF', 'EGFR', 'TP53'] },
            name: 'ctDNA Particle Viewer'
        },
        'protein-viewer': { 
            Class: ProteinStructureViewer, 
            options: { proteinType: 'kinase', showBackbone: true },
            name: 'Protein Structure Viewer'
        },
        'ai-panel-viewer': { 
            Class: AIPrediction3DPanel, 
            options: { model: 'Transformer' },
            name: 'AI Prediction Panel'
        },
        'quantum-viewer': { 
            Class: QuantumVisualizer, 
            options: { qubits: 8 },
            name: 'Quantum Visualizer'
        }
    };
    
    // Store active viewer instances
    window.ActiveAdvanced3DViewers = window.ActiveAdvanced3DViewers || {};
    
    // IMMEDIATE INITIALIZATION - Initialize all viewers now (no scroll needed)
    // This ensures viewers are "alive" even before scrolling
    Object.keys(viewerConfigs).forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.dataset.initialized) {
            const config = viewerConfigs[id];
            el.dataset.initialized = 'pending';
            console.log(`[3D-Immediate] Initializing ${config.name}...`);
            
            try {
                const loading = el.querySelector('.viewer-loading');
                if (loading) loading.style.display = 'none';
                
                const viewer = new config.Class(id, config.options);
                window.ActiveAdvanced3DViewers[id] = viewer;
                el.dataset.initialized = 'true';
                
                console.log(`[3D-Immediate] ✓ ${config.name} initialized`);
                
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('viewerInitialized', { id, type: config.name, viewer });
                }
            } catch (e) {
                console.error(`[3D-Immediate] ✗ Failed ${config.name}:`, e);
                el.dataset.initialized = 'failed';
            }
        }
    });
    
    // Create IntersectionObserver with robust error handling
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const containerId = entry.target.id;
                const config = viewerConfigs[containerId];
                
                if (config && !entry.target.dataset.initialized) {
                    entry.target.dataset.initialized = 'pending';
                    console.log(`[3D] Initializing ${config.name} in #${containerId}...`);
                    
                    try {
                        // Clear any loading indicator
                        const loading = entry.target.querySelector('.viewer-loading');
                        if (loading) loading.style.display = 'none';
                        
                        // Create viewer instance
                        const viewer = new config.Class(containerId, config.options);
                        window.ActiveAdvanced3DViewers[containerId] = viewer;
                        entry.target.dataset.initialized = 'true';
                        
                        console.log(`[3D] ✓ ${config.name} initialized successfully`);
                        
                        // Emit event for other systems
                        if (typeof EventBus !== 'undefined') {
                            EventBus.emit('viewerInitialized', { 
                                id: containerId, 
                                type: config.name,
                                viewer: viewer 
                            });
                        }
                    } catch (e) {
                        console.error(`[3D] ✗ Failed to initialize ${config.name}:`, e);
                        entry.target.dataset.initialized = 'failed';
                        
                        // Show error in container
                        entry.target.innerHTML = `
                            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ff6b6b;font-family:monospace;text-align:center;padding:20px;">
                                <div>
                                    <div style="font-size:24px;margin-bottom:10px;">⚠️</div>
                                    <div>Failed to load ${config.name}</div>
                                    <div style="font-size:11px;opacity:0.7;margin-top:5px;">${e.message}</div>
                                </div>
                            </div>
                        `;
                    }
                }
            }
        });
    }, { 
        threshold: 0.05,  // Trigger when even 5% visible
        rootMargin: '100px 0px'  // Start loading 100px before visible
    });
    
    // Observe all viewer containers (silently skip missing ones - expected per-page)
    let observedCount = 0;
    Object.keys(viewerConfigs).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            observer.observe(el);
            observedCount++;
        }
    });

    if (observedCount > 0) {
        console.log(`[3D] Observing ${observedCount} viewer containers`);
    }
    
    // Initialize Drug Response Simulator
    initializeDrugSimulator();
    
    // Initialize Technology Gallery animations
    initializeTechGallery();
}

/**
 * Drug Response Simulator - Interactive drug testing simulation
 */
function initializeDrugSimulator() {
    const container = document.getElementById('drugSimulator');
    if (!container) return;
    
    console.log('[DrugSim] Initializing Drug Response Simulator...');
    
    // Drug database
    // Expanded drug database with organ-specific toxicity profiles
    const drugs = [
        { 
            id: 'acetaminophen', 
            name: 'Acetaminophen', 
            type: 'Analgesic', 
            efficacy: 0.85, 
            color: '#0055ff',
            clearance: 'medium',
            description: 'Common pain reliever, liver-toxic at high doses',
            organToxicity: { liver: 0.65, heart: 0.05, kidney: 0.15, lung: 0.05, brain: 0.02, intestine: 0.1 }
        },
        { 
            id: 'doxorubicin', 
            name: 'Doxorubicin', 
            type: 'Chemotherapy', 
            efficacy: 0.92, 
            color: '#ffaa00',
            clearance: 'slow',
            description: 'Potent anticancer drug with cardiotoxicity risk',
            organToxicity: { liver: 0.4, heart: 0.85, kidney: 0.35, lung: 0.25, brain: 0.1, intestine: 0.5 }
        },
        { 
            id: 'metformin', 
            name: 'Metformin', 
            type: 'Antidiabetic', 
            efficacy: 0.82, 
            color: '#00ff88',
            clearance: 'fast',
            description: 'First-line diabetes drug, very safe profile',
            organToxicity: { liver: 0.05, heart: 0.02, kidney: 0.08, lung: 0.01, brain: 0.01, intestine: 0.2 }
        },
        { 
            id: 'atorvastatin', 
            name: 'Atorvastatin', 
            type: 'Statin', 
            efficacy: 0.78, 
            color: '#ffc300',
            clearance: 'medium',
            description: 'Cholesterol-lowering drug with muscle effects',
            organToxicity: { liver: 0.25, heart: 0.05, kidney: 0.1, lung: 0.02, brain: 0.02, intestine: 0.15 }
        },
        { 
            id: 'ibuprofen', 
            name: 'Ibuprofen', 
            type: 'NSAID', 
            efficacy: 0.72, 
            color: '#7dd3fc',
            clearance: 'fast',
            description: 'Anti-inflammatory with GI and kidney concerns',
            organToxicity: { liver: 0.15, heart: 0.12, kidney: 0.35, lung: 0.02, brain: 0.02, intestine: 0.45 }
        },
        { 
            id: 'amiodarone', 
            name: 'Amiodarone', 
            type: 'Antiarrhythmic', 
            efficacy: 0.88, 
            color: '#ff9ff3',
            clearance: 'very_slow',
            description: 'Heart rhythm drug with multi-organ toxicity',
            organToxicity: { liver: 0.45, heart: 0.15, kidney: 0.2, lung: 0.55, brain: 0.1, intestine: 0.25 }
        },
        { 
            id: 'cisplatin', 
            name: 'Cisplatin', 
            type: 'Chemotherapy', 
            efficacy: 0.90, 
            color: '#ff6b6b',
            clearance: 'slow',
            description: 'Platinum-based anticancer, highly nephrotoxic',
            organToxicity: { liver: 0.3, heart: 0.2, kidney: 0.9, lung: 0.15, brain: 0.25, intestine: 0.55 }
        },
        { 
            id: 'trastuzumab', 
            name: 'Trastuzumab', 
            type: 'Targeted Therapy', 
            efficacy: 0.85, 
            color: '#0033cc',
            clearance: 'slow',
            description: 'HER2 antibody for breast cancer, cardiac monitoring needed',
            organToxicity: { liver: 0.1, heart: 0.4, kidney: 0.05, lung: 0.15, brain: 0.02, intestine: 0.1 }
        },
        { 
            id: 'lisinopril', 
            name: 'Lisinopril', 
            type: 'ACE Inhibitor', 
            efficacy: 0.80, 
            color: '#22d3ee',
            clearance: 'medium',
            description: 'Blood pressure medication, watch kidney function',
            organToxicity: { liver: 0.05, heart: 0.03, kidney: 0.2, lung: 0.08, brain: 0.02, intestine: 0.05 }
        },
        { 
            id: 'valproic_acid', 
            name: 'Valproic Acid', 
            type: 'Anticonvulsant', 
            efficacy: 0.82, 
            color: '#fb923c',
            clearance: 'medium',
            description: 'Seizure medication with liver toxicity potential',
            organToxicity: { liver: 0.55, heart: 0.05, kidney: 0.1, lung: 0.05, brain: 0.08, intestine: 0.2 }
        },
        { 
            id: 'aspirin', 
            name: 'Aspirin', 
            type: 'NSAID/Antiplatelet', 
            efficacy: 0.75, 
            color: '#f0abfc',
            clearance: 'fast',
            description: 'Classic pain reliever with bleeding risk',
            organToxicity: { liver: 0.08, heart: 0.05, kidney: 0.15, lung: 0.02, brain: 0.03, intestine: 0.4 }
        },
        { 
            id: 'pembrolizumab', 
            name: 'Pembrolizumab', 
            type: 'Immunotherapy', 
            efficacy: 0.70, 
            color: '#4ade80',
            clearance: 'slow',
            description: 'PD-1 checkpoint inhibitor, immune-related adverse events',
            organToxicity: { liver: 0.35, heart: 0.15, kidney: 0.2, lung: 0.4, brain: 0.1, intestine: 0.45 }
        }
    ];
    
    let selectedDrug = drugs[0];
    let concentration = 50;
    let isRunning = false;
    let animationFrame = null;
    
    // Calculate overall toxicity from concentration
    function calculateToxicity(drug, conc) {
        const baseMultiplier = conc / 50; // 50μM is baseline
        const clearanceMultipliers = { fast: 0.7, medium: 1.0, slow: 1.3, very_slow: 1.6 };
        const clearanceFactor = clearanceMultipliers[drug.clearance] || 1.0;
        return Math.min(baseMultiplier * clearanceFactor, 2.0);
    }
    
    // Build UI
    container.innerHTML = `
        <div style="background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 16px; padding: 30px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #0055ff, #ffaa00, #00ff88);"></div>
            
            <h3 style="font-family: 'Orbitron', sans-serif; color: var(--cyan-bright); font-size: 20px; margin-bottom: 25px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">💊</span> Drug Response Simulator
            </h3>
            
            <div style="display: grid; grid-template-columns: 300px 1fr; gap: 30px;">
                <!-- Controls Panel -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- Drug Selection -->
                    <div>
                        <label style="display: block; color: rgba(224, 242, 254, 0.7); font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Select Drug Compound</label>
                        <select id="drugSelect" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(0, 85, 255, 0.3); border-radius: 8px; color: #e0f2fe; font-family: 'Rajdhani', sans-serif; font-size: 14px; cursor: pointer;">
                            ${drugs.map(d => `<option value="${d.id}" style="background: #0a1628;">${d.name} (${d.type})</option>`).join('')}
                        </select>
                    </div>
                    
                    <!-- Concentration Slider -->
                    <div>
                        <label style="display: block; color: rgba(224, 242, 254, 0.7); font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
                            Concentration: <span id="concValue" style="color: var(--cyan-bright);">50 μM</span>
                        </label>
                        <input type="range" id="concSlider" min="1" max="100" value="50" style="width: 100%; accent-color: #0055ff;">
                    </div>
                    
                    <!-- Run Button -->
                    <button id="runSimBtn" style="padding: 15px 30px; background: linear-gradient(135deg, #0055ff, #0099ff); border: none; border-radius: 8px; color: white; font-family: 'Orbitron', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <span id="runBtnIcon">▶</span>
                        <span id="runBtnText">Run Simulation</span>
                    </button>
                    
                    <!-- Drug Info -->
                    <div id="drugInfo" style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; font-size: 13px;">
                        <div style="color: var(--cyan-bright); margin-bottom: 10px; font-weight: 600;">Drug Properties</div>
                        <div style="display: grid; gap: 8px; color: rgba(224, 242, 254, 0.8);">
                            <div>Type: <span id="drugType" style="color: #0055ff;">Analgesic</span></div>
                            <div>Toxicity Risk: <span id="drugTox" style="color: #00ff88;">Low (30%)</span></div>
                            <div>Efficacy: <span id="drugEff" style="color: #ffc300;">85%</span></div>
                            <div>Clearance: <span id="drugClearance" style="color: #7dd3fc;">Medium</span></div>
                            <div id="drugDescription" style="margin-top: 10px; font-size: 11px; color: rgba(224, 242, 254, 0.6); line-height: 1.4; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px;">Common pain reliever, liver-toxic at high doses</div>
                        </div>
                    </div>
                </div>
                
                <!-- Visualization Area -->
                <div style="position: relative;">
                    <!-- Organ Response Grid -->
                    <div id="organGrid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div class="organ-card" data-organ="liver" style="background: rgba(139, 69, 19, 0.2); border: 1px solid rgba(139, 69, 19, 0.5); border-radius: 12px; padding: 20px; text-align: center; transition: all 0.5s;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🫁</div>
                            <div style="font-weight: 600; color: #e0f2fe;">Liver</div>
                            <div class="organ-status" style="font-size: 12px; color: rgba(224, 242, 254, 0.6); margin-top: 5px;">Ready</div>
                            <div class="organ-bar" style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 10px; overflow: hidden;">
                                <div class="organ-fill" style="height: 100%; width: 0%; background: #00ff88; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        <div class="organ-card" data-organ="heart" style="background: rgba(255, 68, 68, 0.2); border: 1px solid rgba(255, 68, 68, 0.5); border-radius: 12px; padding: 20px; text-align: center; transition: all 0.5s;">
                            <div style="font-size: 32px; margin-bottom: 10px;">❤️</div>
                            <div style="font-weight: 600; color: #e0f2fe;">Heart</div>
                            <div class="organ-status" style="font-size: 12px; color: rgba(224, 242, 254, 0.6); margin-top: 5px;">Ready</div>
                            <div class="organ-bar" style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 10px; overflow: hidden;">
                                <div class="organ-fill" style="height: 100%; width: 0%; background: #00ff88; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        <div class="organ-card" data-organ="kidney" style="background: rgba(107, 37, 37, 0.2); border: 1px solid rgba(107, 37, 37, 0.5); border-radius: 12px; padding: 20px; text-align: center; transition: all 0.5s;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🫘</div>
                            <div style="font-weight: 600; color: #e0f2fe;">Kidney</div>
                            <div class="organ-status" style="font-size: 12px; color: rgba(224, 242, 254, 0.6); margin-top: 5px;">Ready</div>
                            <div class="organ-bar" style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 10px; overflow: hidden;">
                                <div class="organ-fill" style="height: 100%; width: 0%; background: #00ff88; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        <div class="organ-card" data-organ="brain" style="background: rgba(255, 159, 243, 0.2); border: 1px solid rgba(255, 159, 243, 0.5); border-radius: 12px; padding: 20px; text-align: center; transition: all 0.5s;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🧠</div>
                            <div style="font-weight: 600; color: #e0f2fe;">Brain</div>
                            <div class="organ-status" style="font-size: 12px; color: rgba(224, 242, 254, 0.6); margin-top: 5px;">Ready</div>
                            <div class="organ-bar" style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 10px; overflow: hidden;">
                                <div class="organ-fill" style="height: 100%; width: 0%; background: #00ff88; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        <div class="organ-card" data-organ="lung" style="background: rgba(125, 211, 252, 0.2); border: 1px solid rgba(125, 211, 252, 0.5); border-radius: 12px; padding: 20px; text-align: center; transition: all 0.5s;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🫁</div>
                            <div style="font-weight: 600; color: #e0f2fe;">Lungs</div>
                            <div class="organ-status" style="font-size: 12px; color: rgba(224, 242, 254, 0.6); margin-top: 5px;">Ready</div>
                            <div class="organ-bar" style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 10px; overflow: hidden;">
                                <div class="organ-fill" style="height: 100%; width: 0%; background: #00ff88; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        <div class="organ-card" data-organ="gut" style="background: rgba(255, 170, 170, 0.2); border: 1px solid rgba(255, 170, 170, 0.5); border-radius: 12px; padding: 20px; text-align: center; transition: all 0.5s;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🔬</div>
                            <div style="font-weight: 600; color: #e0f2fe;">Gut</div>
                            <div class="organ-status" style="font-size: 12px; color: rgba(224, 242, 254, 0.6); margin-top: 5px;">Ready</div>
                            <div class="organ-bar" style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 10px; overflow: hidden;">
                                <div class="organ-fill" style="height: 100%; width: 0%; background: #00ff88; transition: width 0.3s;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Results Panel -->
                    <div id="simResults" style="background: rgba(0,0,0,0.4); border-radius: 12px; padding: 20px; display: none;">
                        <h4 style="color: var(--cyan-bright); margin-bottom: 15px; font-family: 'Orbitron', sans-serif; font-size: 14px;">Simulation Results</h4>
                        <div id="resultsContent" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Get elements
    const drugSelect = document.getElementById('drugSelect');
    const concSlider = document.getElementById('concSlider');
    const concValue = document.getElementById('concValue');
    const runBtn = document.getElementById('runSimBtn');
    const drugType = document.getElementById('drugType');
    const drugTox = document.getElementById('drugTox');
    const drugEff = document.getElementById('drugEff');
    const organCards = document.querySelectorAll('.organ-card');
    const simResults = document.getElementById('simResults');
    const resultsContent = document.getElementById('resultsContent');
    
    // Update drug info display
    function updateDrugInfo() {
        drugType.textContent = selectedDrug.type;
        drugType.style.color = selectedDrug.color;
        
        // Calculate average toxicity from organ profiles
        const toxValues = Object.values(selectedDrug.organToxicity);
        const avgToxicity = toxValues.reduce((a, b) => a + b, 0) / toxValues.length;
        const maxToxicity = Math.max(...toxValues);
        
        const toxLevel = maxToxicity < 0.25 ? 'Low' : maxToxicity < 0.5 ? 'Medium' : 'High';
        const toxColor = maxToxicity < 0.25 ? '#00ff88' : maxToxicity < 0.5 ? '#ffc300' : '#ff4444';
        drugTox.textContent = `${toxLevel} (Peak: ${Math.round(maxToxicity * 100)}%)`;
        drugTox.style.color = toxColor;
        
        drugEff.textContent = `${Math.round(selectedDrug.efficacy * 100)}%`;
        
        // Update description if element exists
        const descEl = document.getElementById('drugDescription');
        if (descEl) {
            descEl.textContent = selectedDrug.description;
        }
        
        // Update clearance indicator
        const clearEl = document.getElementById('drugClearance');
        if (clearEl) {
            const clearanceLabels = { fast: 'Fast', medium: 'Medium', slow: 'Slow', very_slow: 'Very Slow' };
            const clearanceColors = { fast: '#00ff88', medium: '#7dd3fc', slow: '#ffc300', very_slow: '#ff6b6b' };
            clearEl.textContent = clearanceLabels[selectedDrug.clearance] || 'Unknown';
            clearEl.style.color = clearanceColors[selectedDrug.clearance] || '#fff';
        }
    }
    
    // Drug selection handler
    drugSelect.addEventListener('change', (e) => {
        selectedDrug = drugs.find(d => d.id === e.target.value);
        updateDrugInfo();
    });
    
    // Concentration slider handler
    concSlider.addEventListener('input', (e) => {
        concentration = parseInt(e.target.value);
        concValue.textContent = `${concentration} μM`;
    });
    
    // Run simulation
    runBtn.addEventListener('click', () => {
        if (isRunning) return;
        
        isRunning = true;
        runBtn.querySelector('#runBtnIcon').textContent = '⏳';
        runBtn.querySelector('#runBtnText').textContent = 'Simulating...';
        runBtn.style.background = 'linear-gradient(135deg, #ffaa00, #7209b7)';
        
        // Reset organ cards
        organCards.forEach(card => {
            card.style.transform = 'scale(1)';
            card.querySelector('.organ-status').textContent = 'Processing...';
            card.querySelector('.organ-fill').style.width = '0%';
            card.querySelector('.organ-fill').style.background = '#00ff88';
        });
        
        simResults.style.display = 'none';
        
        // Calculate concentration multiplier
        const toxMultiplier = calculateToxicity(selectedDrug, concentration);
        
        // Simulate each organ with delays
        let delay = 0;
        const results = [];
        
        organCards.forEach((card, index) => {
            setTimeout(() => {
                const organName = card.dataset.organ;
                
                // Get organ-specific toxicity from drug profile
                const baseToxicity = selectedDrug.organToxicity[organName] || 0.1;
                const toxicity = Math.min(1, baseToxicity * toxMultiplier * (0.85 + Math.random() * 0.3));
                
                // Efficacy scales with concentration but diminishes at extremes
                const efficacyMod = concentration < 30 ? concentration / 30 : 
                                   concentration > 80 ? 1 - (concentration - 80) / 100 : 1;
                const response = Math.min(1, selectedDrug.efficacy * efficacyMod * (0.8 + Math.random() * 0.2));
                
                const fill = card.querySelector('.organ-fill');
                const status = card.querySelector('.organ-status');
                
                // Animate fill based on response
                fill.style.width = `${response * 100}%`;
                
                // Color and status based on organ-specific toxicity
                if (toxicity > 0.6) {
                    fill.style.background = '#ff4444';
                    status.textContent = 'Toxic Response';
                    status.style.color = '#ff4444';
                    card.style.boxShadow = '0 0 20px rgba(255, 68, 68, 0.5)';
                } else if (toxicity > 0.35) {
                    fill.style.background = '#ffc300';
                    status.textContent = 'Moderate Effect';
                    status.style.color = '#ffc300';
                    card.style.boxShadow = '0 0 20px rgba(255, 195, 0, 0.4)';
                } else if (toxicity > 0.15) {
                    fill.style.background = '#7dd3fc';
                    status.textContent = 'Mild Effect';
                    status.style.color = '#7dd3fc';
                    card.style.boxShadow = '0 0 15px rgba(125, 211, 252, 0.3)';
                } else {
                    fill.style.background = '#00ff88';
                    status.textContent = 'Healthy Response';
                    status.style.color = '#00ff88';
                    card.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.4)';
                }
                
                card.style.transform = 'scale(1.02)';
                setTimeout(() => card.style.transform = 'scale(1)', 300);
                
                results.push({
                    organ: organName,
                    response: response,
                    toxicity: toxicity
                });
                
                // After all organs processed
                if (index === organCards.length - 1) {
                    setTimeout(() => {
                        showResults(results);
                        isRunning = false;
                        runBtn.querySelector('#runBtnIcon').textContent = '▶';
                        runBtn.querySelector('#runBtnText').textContent = 'Run Simulation';
                        runBtn.style.background = 'linear-gradient(135deg, #0055ff, #0099ff)';
                    }, 500);
                }
            }, delay);
            
            delay += 400;
        });
    });
    
    // Show results summary
    function showResults(results) {
        const avgResponse = results.reduce((a, b) => a + b.response, 0) / results.length;
        const avgToxicity = results.reduce((a, b) => a + b.toxicity, 0) / results.length;
        const safetyScore = Math.max(0, 100 - avgToxicity * 100);
        
        resultsContent.innerHTML = `
            <div style="text-align: center; padding: 15px; background: rgba(0, 85, 255, 0.1); border-radius: 8px;">
                <div style="font-size: 24px; color: #0055ff; font-weight: 700;">${Math.round(avgResponse * 100)}%</div>
                <div style="font-size: 11px; color: rgba(224, 242, 254, 0.6); text-transform: uppercase;">Efficacy</div>
            </div>
            <div style="text-align: center; padding: 15px; background: rgba(${avgToxicity > 0.5 ? '255, 68, 68' : '0, 255, 136'}, 0.1); border-radius: 8px;">
                <div style="font-size: 24px; color: ${avgToxicity > 0.5 ? '#ff4444' : '#00ff88'}; font-weight: 700;">${Math.round(safetyScore)}%</div>
                <div style="font-size: 11px; color: rgba(224, 242, 254, 0.6); text-transform: uppercase;">Safety Score</div>
            </div>
            <div style="text-align: center; padding: 15px; background: rgba(255, 195, 0, 0.1); border-radius: 8px;">
                <div style="font-size: 24px; color: #ffc300; font-weight: 700;">${concentration} μM</div>
                <div style="font-size: 11px; color: rgba(224, 242, 254, 0.6); text-transform: uppercase;">Concentration</div>
            </div>
        `;
        
        simResults.style.display = 'block';
        
        // Emit event
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('drugSimulationComplete', {
                drug: selectedDrug,
                concentration: concentration,
                results: results,
                avgResponse: avgResponse,
                avgToxicity: avgToxicity
            });
        }
    }
    
    updateDrugInfo();
    console.log('[DrugSim] ✓ Drug Response Simulator initialized');
}

/**
 * Technology Gallery - Animate static SVG images
 */
function initializeTechGallery() {
    const gallery = document.querySelectorAll('.visual-card');
    if (gallery.length === 0) return;
    
    console.log(`[TechGallery] Enhancing ${gallery.length} gallery cards with cinematic effects...`);
    
    gallery.forEach((card, index) => {
        // Get card type from badge
        const badge = card.querySelector('.card-badge');
        const cardType = badge ? badge.textContent.trim() : '';
        
        // Add hover effects
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
            card.style.boxShadow = '0 20px 40px rgba(0, 85, 255, 0.3)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = 'none';
        });
        
        // Animate SVG elements within each card
        const svg = card.querySelector('svg');
        if (svg) {
            // Add pulse animation to circles
            const circles = svg.querySelectorAll('circle:not([r="0"])');
            circles.forEach((circle, i) => {
                if (!circle.querySelector('animate')) {
                    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                    animate.setAttribute('attributeName', 'opacity');
                    animate.setAttribute('values', '0.6;1;0.6');
                    animate.setAttribute('dur', `${1.5 + i * 0.2}s`);
                    animate.setAttribute('repeatCount', 'indefinite');
                    circle.appendChild(animate);
                }
            });
            
            // Add flow animations to paths/lines
            const paths = svg.querySelectorAll('path, line');
            paths.forEach((path, i) => {
                if (!path.querySelector('animate') && Math.random() > 0.5) {
                    const animStroke = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                    animStroke.setAttribute('attributeName', 'stroke-opacity');
                    animStroke.setAttribute('values', '0.5;1;0.5');
                    animStroke.setAttribute('dur', `${2 + Math.random()}s`);
                    animStroke.setAttribute('repeatCount', 'indefinite');
                    path.appendChild(animStroke);
                }
            });
            
            // Add glow filter if not present
            const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            if (!svg.querySelector('defs')) {
                svg.insertBefore(defs, svg.firstChild);
            }
            
            if (!defs.querySelector('#interactiveGlow')) {
                defs.innerHTML += `
                    <filter id="interactiveGlow">
                        <feGaussianBlur stdDeviation="3" result="blur"/>
                        <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                `;
            }
        }
        
        // Add cinematic status overlay
        if (!card.querySelector('.status-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'status-overlay';
            overlay.style.cssText = 'position: absolute; top: 10px; left: 10px; display: flex; gap: 8px; z-index: 5;';
            overlay.innerHTML = `
                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 4px; font-size: 9px; font-family: 'Orbitron', sans-serif;">
                    <span style="width: 6px; height: 6px; background: #00ff88; border-radius: 50%; animation: pulse 1.5s infinite;"></span>
                    <span style="color: #00ff88;">ONLINE</span>
                </div>
            `;
            card.style.position = 'relative';
            card.appendChild(overlay);
        }
        
        // Add interaction indicator
        if (!card.querySelector('.interaction-hint')) {
            const hint = document.createElement('div');
            hint.className = 'interaction-hint';
            hint.style.cssText = 'position: absolute; bottom: 10px; right: 10px; background: rgba(0,212,255,0.2); padding: 4px 8px; border-radius: 4px; font-size: 10px; color: #0055ff; opacity: 0; transition: opacity 0.3s;';
            hint.textContent = '🖱️ Interactive';
            card.style.position = 'relative';
            card.appendChild(hint);
            
            card.addEventListener('mouseenter', () => hint.style.opacity = '1');
            card.addEventListener('mouseleave', () => hint.style.opacity = '0');
        }
        
        // Add data ticker for institute-grade feel
        if (!card.querySelector('.data-ticker')) {
            const ticker = document.createElement('div');
            ticker.className = 'data-ticker';
            ticker.style.cssText = 'position: absolute; bottom: 40px; left: 10px; right: 10px; font-family: monospace; font-size: 9px; color: rgba(0, 85, 255, 0.5); overflow: hidden; white-space: nowrap;';
            const dataTypes = ['pH: 7.4', 'O₂: 98%', 'Flow: 2.3μL/min', 'T: 37°C', 'CO₂: 5%', 'Viability: 94%'];
            ticker.textContent = dataTypes.join(' │ ');
            let offset = 0;
            setInterval(() => {
                offset = (offset + 1) % 200;
                ticker.style.transform = `translateX(-${offset}px)`;
            }, 100);
            card.appendChild(ticker);
        }
    });
    
    // Add global styles for animations
    if (!document.querySelector('#techGalleryStyles')) {
        const style = document.createElement('style');
        style.id = 'techGalleryStyles';
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.2); }
            }
            .visual-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
            .visual-card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, #0055ff, transparent);
                opacity: 0;
                transition: opacity 0.3s;
            }
            .visual-card:hover::before {
                opacity: 1;
                animation: scanline 2s linear infinite;
            }
            @keyframes scanline {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log('[TechGallery] ✓ Technology Gallery enhanced with cinematic effects');
}

/**
 * Fallback: Force initialize any viewer that hasn't loaded after scroll
 */
function forceInitializeViewers() {
    const viewerIds = ['ctdna-viewer', 'protein-viewer', 'ai-panel-viewer', 'quantum-viewer'];
    
    viewerIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.dataset.initialized !== 'true' && el.dataset.initialized !== 'pending') {
            // Check if container is visible
            const rect = el.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
                console.log(`[Fallback] Force initializing #${id}`);
                
                try {
                    let viewer;
                    const loading = el.querySelector('.viewer-loading');
                    if (loading) loading.style.display = 'none';
                    
                    switch(id) {
                        case 'ctdna-viewer':
                            viewer = new CtDNAParticleViewer(id, { particleCount: 300 });
                            break;
                        case 'protein-viewer':
                            viewer = new ProteinStructureViewer(id, { proteinType: 'kinase' });
                            break;
                        case 'ai-panel-viewer':
                            viewer = new AIPrediction3DPanel(id, { model: 'Transformer' });
                            break;
                        case 'quantum-viewer':
                            viewer = new QuantumVisualizer(id, { qubits: 8 });
                            break;
                    }
                    
                    if (viewer) {
                        el.dataset.initialized = 'true';
                        window.ActiveAdvanced3DViewers = window.ActiveAdvanced3DViewers || {};
                        window.ActiveAdvanced3DViewers[id] = viewer;
                        console.log(`[Fallback] ✓ #${id} initialized`);
                    }
                } catch(e) {
                    console.error(`[Fallback] Failed to initialize #${id}:`, e);
                }
            }
        }
    });
}

// Run fallback check on scroll and after delays
if (typeof window !== 'undefined') {
    let fallbackTimeout;
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                clearTimeout(fallbackTimeout);
                fallbackTimeout = setTimeout(forceInitializeViewers, 300);
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });
    
    // Also run after page load with delays
    window.addEventListener('load', () => {
        // Force init viewers
        setTimeout(forceInitializeViewers, 1000);
        setTimeout(forceInitializeViewers, 3000);
        setTimeout(forceInitializeViewers, 5000);
        
        // Ensure Drug Simulator is initialized
        setTimeout(() => {
            const drugSim = document.getElementById('drugSimulator');
            if (drugSim && !drugSim.dataset.initialized) {
                console.log('[Load] Force initializing Drug Simulator');
                initializeDrugSimulator();
                drugSim.dataset.initialized = 'true';
            }
        }, 500);
        
        // Ensure Tech Gallery is enhanced
        setTimeout(() => {
            const gallery = document.querySelectorAll('.visual-card');
            if (gallery.length > 0 && !gallery[0].querySelector('.status-overlay')) {
                console.log('[Load] Force initializing Tech Gallery');
                initializeTechGallery();
            }
        }, 700);
    });
}
// v20260117-FULL
