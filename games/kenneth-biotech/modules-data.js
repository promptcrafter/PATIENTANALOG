/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - Modules Data (FIXED)
 * All modules properly defined including fluid_channel
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

KennethGame.Modules = (function() {
    
    const MODULES = {
        // ═══════════════════════════════════════════════════════════════════
        // ERA 1: BASIC ORGANS
        // ═══════════════════════════════════════════════════════════════════
        
        heart: {
            id: 'heart',
            name: 'Heart',
            icon: '❤️',
            category: 'organs',
            tier: 1,
            description: 'The powerful pump that sends blood everywhere!',
            funFact: 'Your heart beats about 100,000 times every day!',
            ports: { top: 'vascular', right: 'vascular', bottom: 'vascular', left: 'vascular' },
            basePoints: 100,
            synergyBonus: ['lung', 'blood_vessel'],
            unlockLevel: 1,
            color: '#ff4466',
            glowColor: 'rgba(255, 68, 102, 0.6)',
            rarity: 'common'
        },
        
        brain: {
            id: 'brain',
            name: 'Brain',
            icon: '🧠',
            category: 'organs',
            tier: 1,
            description: 'The supercomputer of your body!',
            funFact: 'Your brain has 86 BILLION neurons!',
            ports: { top: 'neural', right: 'neural', bottom: 'neural', left: 'neural' },
            basePoints: 150,
            synergyBonus: ['nerve_connector', 'eye'],
            unlockLevel: 1,
            color: '#ff77ff',
            glowColor: 'rgba(255, 119, 255, 0.6)',
            rarity: 'common'
        },
        
        lung: {
            id: 'lung',
            name: 'Lungs',
            icon: '🫁',
            category: 'organs',
            tier: 1,
            description: 'Breathe in the good air!',
            funFact: 'You breathe about 22,000 times a day!',
            ports: { top: 'vascular', right: 'fluid', bottom: 'vascular', left: 'fluid' },
            basePoints: 90,
            synergyBonus: ['heart', 'blood_vessel'],
            unlockLevel: 1,
            color: '#ffaaaa',
            glowColor: 'rgba(255, 170, 170, 0.6)',
            rarity: 'common'
        },
        
        liver: {
            id: 'liver',
            name: 'Liver',
            icon: '🫀',
            category: 'organs',
            tier: 1,
            description: 'The body\'s cleaning factory!',
            funFact: 'Your liver does over 500 different jobs!',
            ports: { top: 'vascular', right: 'fluid', bottom: 'vascular', left: 'fluid' },
            basePoints: 85,
            synergyBonus: ['stomach', 'intestine', 'kidney'],
            unlockLevel: 1,
            color: '#cc6644',
            glowColor: 'rgba(204, 102, 68, 0.6)',
            rarity: 'common'
        },
        
        kidney: {
            id: 'kidney',
            name: 'Kidney',
            icon: '🫘',
            category: 'organs',
            tier: 1,
            description: 'The body\'s water filter!',
            funFact: 'Your kidneys filter ALL your blood about 40 times every day!',
            ports: { top: 'vascular', right: 'fluid', bottom: 'fluid', left: 'vascular' },
            basePoints: 80,
            synergyBonus: ['liver'],
            unlockLevel: 1,
            color: '#aa5544',
            glowColor: 'rgba(170, 85, 68, 0.6)',
            rarity: 'common'
        },
        
        stomach: {
            id: 'stomach',
            name: 'Stomach',
            icon: '🟤',
            category: 'organs',
            tier: 1,
            description: 'The food blender!',
            funFact: 'Your stomach acid is strong enough to dissolve metal!',
            ports: { top: 'fluid', right: 'fluid', bottom: 'fluid', left: 'vascular' },
            basePoints: 75,
            synergyBonus: ['intestine', 'liver', 'pancreas'],
            unlockLevel: 2,
            color: '#dd8866',
            glowColor: 'rgba(221, 136, 102, 0.6)',
            rarity: 'common'
        },
        
        intestine: {
            id: 'intestine',
            name: 'Intestines',
            icon: '🪱',
            category: 'organs',
            tier: 1,
            description: 'The super-long food tube!',
            funFact: 'Your intestines are about 25 feet long!',
            ports: { top: 'fluid', right: 'vascular', bottom: 'fluid', left: 'vascular' },
            basePoints: 70,
            synergyBonus: ['stomach', 'liver'],
            unlockLevel: 2,
            color: '#ee9977',
            glowColor: 'rgba(238, 153, 119, 0.6)',
            rarity: 'common'
        },
        
        pancreas: {
            id: 'pancreas',
            name: 'Pancreas',
            icon: '🥖',
            category: 'organs',
            tier: 1,
            description: 'Makes special juices to help digest food!',
            funFact: 'Your pancreas makes insulin, which is like a key for sugar!',
            ports: { top: 'fluid', right: 'vascular', bottom: 'fluid', left: 'energy' },
            basePoints: 80,
            synergyBonus: ['stomach', 'intestine', 'liver'],
            unlockLevel: 3,
            color: '#ffcc88',
            glowColor: 'rgba(255, 204, 136, 0.6)',
            rarity: 'uncommon'
        },
        
        eye: {
            id: 'eye',
            name: 'Eye',
            icon: '👁️',
            category: 'organs',
            tier: 1,
            description: 'Windows to the world!',
            funFact: 'Your eyes can see about 10 million different colors!',
            ports: { top: 'neural', right: 'neural', bottom: 'vascular', left: 'neural' },
            basePoints: 95,
            synergyBonus: ['brain', 'nerve_connector'],
            unlockLevel: 1,
            color: '#4488ff',
            glowColor: 'rgba(68, 136, 255, 0.6)',
            rarity: 'common'
        },
        
        // ═══════════════════════════════════════════════════════════════════
        // CONNECTORS - FIXED: Added fluid_channel
        // ═══════════════════════════════════════════════════════════════════
        
        blood_vessel: {
            id: 'blood_vessel',
            name: 'Blood Vessel',
            icon: '🩸',
            category: 'connectors',
            tier: 1,
            description: 'Carries blood everywhere!',
            funFact: 'Your body has 60,000 miles of blood vessels!',
            ports: { top: 'vascular', right: 'vascular', bottom: 'vascular', left: 'vascular' },
            basePoints: 40,
            isConnector: true,
            unlockLevel: 1,
            color: '#ff4466',
            glowColor: 'rgba(255, 68, 102, 0.5)',
            rarity: 'common'
        },
        
        nerve_connector: {
            id: 'nerve_connector',
            name: 'Nerve Bundle',
            icon: '⚡',
            category: 'connectors',
            tier: 1,
            description: 'Super-fast signal highways!',
            funFact: 'Nerve signals travel at 250 mph!',
            ports: { top: 'neural', right: 'neural', bottom: 'neural', left: 'neural' },
            basePoints: 45,
            isConnector: true,
            unlockLevel: 1,
            color: '#ff00ff',
            glowColor: 'rgba(255, 0, 255, 0.5)',
            rarity: 'common'
        },
        
        fluid_channel: {
            id: 'fluid_channel',
            name: 'Fluid Channel',
            icon: '💧',
            category: 'connectors',
            tier: 1,
            description: 'Carries water and nutrients!',
            funFact: 'Your body is 60% water - that\'s a lot of fluid flow!',
            ports: { top: 'fluid', right: 'fluid', bottom: 'fluid', left: 'fluid' },
            basePoints: 35,
            isConnector: true,
            unlockLevel: 1,
            color: '#00ff88',
            glowColor: 'rgba(0, 255, 136, 0.5)',
            rarity: 'common'
        },
        
        universal_hub: {
            id: 'universal_hub',
            name: 'Universal Hub',
            icon: '🔮',
            category: 'connectors',
            tier: 2,
            description: 'Connects to ANYTHING!',
            funFact: 'Like a universal adapter for biology!',
            ports: { top: 'universal', right: 'universal', bottom: 'universal', left: 'universal' },
            basePoints: 60,
            isConnector: true,
            unlockLevel: 1,
            color: '#ffffff',
            glowColor: 'rgba(255, 255, 255, 0.6)',
            rarity: 'uncommon'
        },
        
        // ═══════════════════════════════════════════════════════════════════
        // ERA 2: ORGANOIDS
        // ═══════════════════════════════════════════════════════════════════
        
        brain_organoid: {
            id: 'brain_organoid',
            name: 'Brain Organoid',
            icon: '🧫',
            category: 'organoids',
            tier: 2,
            description: 'A mini brain grown in a lab!',
            funFact: 'Scientists can grow tiny brains that can think!',
            ports: { top: 'neural', right: 'data', bottom: 'neural', left: 'fluid' },
            basePoints: 180,
            synergyBonus: ['nerve_connector', 'sensor_array'],
            unlockLevel: 6,
            color: '#ff88ff',
            glowColor: 'rgba(255, 136, 255, 0.7)',
            rarity: 'rare'
        },
        
        heart_organoid: {
            id: 'heart_organoid',
            name: 'Heart Organoid',
            icon: '💗',
            category: 'organoids',
            tier: 2,
            description: 'A beating mini heart!',
            funFact: 'These tiny hearts actually beat on their own!',
            ports: { top: 'vascular', right: 'data', bottom: 'vascular', left: 'fluid' },
            basePoints: 170,
            synergyBonus: ['blood_vessel', 'sensor_array'],
            unlockLevel: 7,
            color: '#ff6688',
            glowColor: 'rgba(255, 102, 136, 0.7)',
            rarity: 'rare'
        },
        
        liver_organoid: {
            id: 'liver_organoid',
            name: 'Liver Organoid',
            icon: '🟤',
            category: 'organoids',
            tier: 2,
            description: 'A mini liver for testing!',
            funFact: 'Used to test if medicines are safe!',
            ports: { top: 'fluid', right: 'data', bottom: 'vascular', left: 'fluid' },
            basePoints: 160,
            unlockLevel: 8,
            color: '#cc8866',
            glowColor: 'rgba(204, 136, 102, 0.7)',
            rarity: 'rare'
        },
        
        // ═══════════════════════════════════════════════════════════════════
        // ERA 3: MPS (Organ-on-Chip)
        // ═══════════════════════════════════════════════════════════════════
        
        organ_chip: {
            id: 'organ_chip',
            name: 'Organ Chip',
            icon: '🔬',
            category: 'mps',
            tier: 3,
            description: 'An organ on a tiny chip!',
            funFact: 'Replaces animal testing with better science!',
            ports: { top: 'data', right: 'fluid', bottom: 'data', left: 'fluid' },
            basePoints: 200,
            synergyBonus: ['microfluidic_channel', 'sensor_array'],
            unlockLevel: 13,
            color: '#a855f7',
            glowColor: 'rgba(168, 85, 247, 0.7)',
            rarity: 'epic'
        },
        
        microfluidic_channel: {
            id: 'microfluidic_channel',
            name: 'Microfluidic Channel',
            icon: '〰️',
            category: 'mps',
            tier: 3,
            description: 'Tiny tubes for tiny flows!',
            funFact: 'Smaller than a human hair!',
            ports: { top: 'fluid', right: 'fluid', bottom: 'fluid', left: 'fluid' },
            basePoints: 120,
            isConnector: true,
            unlockLevel: 14,
            color: '#00ccff',
            glowColor: 'rgba(0, 204, 255, 0.6)',
            rarity: 'rare'
        },
        
        sensor_array: {
            id: 'sensor_array',
            name: 'Sensor Array',
            icon: '📡',
            category: 'mps',
            tier: 3,
            description: 'Measures everything!',
            funFact: 'Can detect single molecules!',
            ports: { top: 'data', right: 'data', bottom: 'data', left: 'data' },
            basePoints: 150,
            unlockLevel: 16,
            color: '#00f5ff',
            glowColor: 'rgba(0, 245, 255, 0.7)',
            rarity: 'rare'
        },
        
        bioreactor: {
            id: 'bioreactor',
            name: 'Bioreactor',
            icon: '⚗️',
            category: 'mps',
            tier: 3,
            description: 'Grows cells in perfect conditions!',
            funFact: 'Like a spa for cells!',
            ports: { top: 'fluid', right: 'energy', bottom: 'fluid', left: 'data' },
            basePoints: 180,
            unlockLevel: 15,
            color: '#88ff88',
            glowColor: 'rgba(136, 255, 136, 0.7)',
            rarity: 'epic'
        },
        
        // ═══════════════════════════════════════════════════════════════════
        // ERA 4: DIGITAL & ADVANCED
        // ═══════════════════════════════════════════════════════════════════
        
        digital_twin: {
            id: 'digital_twin',
            name: 'Digital Twin',
            icon: '👾',
            category: 'digital',
            tier: 4,
            description: 'A computer copy of biology!',
            funFact: 'Can simulate years of aging in seconds!',
            ports: { top: 'data', right: 'data', bottom: 'neural', left: 'data' },
            basePoints: 250,
            synergyBonus: ['ai_predictor', 'data_hub'],
            unlockLevel: 18,
            color: '#00ffff',
            glowColor: 'rgba(0, 255, 255, 0.8)',
            rarity: 'legendary'
        },
        
        ai_predictor: {
            id: 'ai_predictor',
            name: 'AI Predictor',
            icon: '🤖',
            category: 'digital',
            tier: 4,
            description: 'AI that predicts health!',
            funFact: 'Can find diseases before symptoms appear!',
            ports: { top: 'data', right: 'neural', bottom: 'data', left: 'neural' },
            basePoints: 280,
            synergyBonus: ['digital_twin', 'sensor_array'],
            unlockLevel: 19,
            color: '#ff8800',
            glowColor: 'rgba(255, 136, 0, 0.8)',
            rarity: 'legendary'
        },
        
        data_hub: {
            id: 'data_hub',
            name: 'Data Hub',
            icon: '🌐',
            category: 'digital',
            tier: 4,
            description: 'Connects all digital systems!',
            funFact: 'Processes billions of data points!',
            ports: { top: 'data', right: 'data', bottom: 'data', left: 'data' },
            basePoints: 200,
            isConnector: true,
            unlockLevel: 20,
            color: '#4488ff',
            glowColor: 'rgba(68, 136, 255, 0.7)',
            rarity: 'epic'
        },
        
        quantum_analyzer: {
            id: 'quantum_analyzer',
            name: 'Quantum Analyzer',
            icon: '⚛️',
            category: 'digital',
            tier: 4,
            description: 'Uses quantum physics for analysis!',
            funFact: 'Can simulate entire molecules!',
            ports: { top: 'energy', right: 'data', bottom: 'energy', left: 'data' },
            basePoints: 350,
            unlockLevel: 21,
            color: '#ff00ff',
            glowColor: 'rgba(255, 0, 255, 0.9)',
            rarity: 'mythic'
        },
        
        synth_tissue: {
            id: 'synth_tissue',
            name: 'Synthetic Tissue',
            icon: '🧬',
            category: 'synthetic',
            tier: 4,
            description: 'Lab-made living tissue!',
            funFact: 'Could be used to repair damaged organs!',
            ports: { top: 'vascular', right: 'fluid', bottom: 'neural', left: 'universal' },
            basePoints: 300,
            unlockLevel: 22,
            color: '#88ffaa',
            glowColor: 'rgba(136, 255, 170, 0.8)',
            rarity: 'legendary'
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════
    
    function getAll() {
        return Object.values(MODULES);
    }
    
    function getById(id) {
        return MODULES[id] || null;
    }
    
    function getByCategory(category) {
        return Object.values(MODULES).filter(m => m.category === category);
    }
    
    function getByTier(tier) {
        return Object.values(MODULES).filter(m => m.tier === tier);
    }
    
    function getUnlockedFor(playerLevel) {
        return Object.values(MODULES).filter(m => m.unlockLevel <= playerLevel);
    }
    
    function getConnectors() {
        return Object.values(MODULES).filter(m => m.isConnector);
    }
    
    function arePortsCompatible(port1Type, port2Type) {
        if (port1Type === 'universal' || port2Type === 'universal') return true;
        const compatibility = KennethGame.CONSTANTS.CONNECTION_TYPES[port1Type]?.compatibleWith;
        if (!compatibility) return port1Type === port2Type;
        return compatibility.includes(port2Type);
    }
    
    function getConnectionScore(port1Type, port2Type) {
        if (!arePortsCompatible(port1Type, port2Type)) return 0;
        const type1 = KennethGame.CONSTANTS.CONNECTION_TYPES[port1Type];
        if (port1Type === port2Type) {
            return (type1?.bonusPoints || 25) * 2;
        }
        if (port1Type === 'universal' || port2Type === 'universal') {
            return 20;
        }
        return (type1?.bonusPoints || 25);
    }
    
    function getRandomFunFact() {
        const allModules = Object.values(MODULES);
        const module = allModules[Math.floor(Math.random() * allModules.length)];
        return `${module.icon} ${module.name}: ${module.funFact}`;
    }
    
    function getTotalCount() {
        return Object.keys(MODULES).length;
    }
    
    return {
        getAll,
        getById,
        getByCategory,
        getByTier,
        getUnlockedFor,
        getConnectors,
        arePortsCompatible,
        getConnectionScore,
        getRandomFunFact,
        getTotalCount,
        MODULES
    };
})();

console.log(`🧬 Modules loaded: ${KennethGame.Modules.getTotalCount()} modules ready!`);
// v20260117-FULL
