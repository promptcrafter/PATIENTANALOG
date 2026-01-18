/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - Constants & Configuration
 * FIXED VERSION - All missing constants added
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

window.KennethGame = window.KennethGame || {};

KennethGame.CONSTANTS = {
    
    // ═══════════════════════════════════════════════════════════════════════
    // VERSION & META
    // ═══════════════════════════════════════════════════════════════════════
    VERSION: '2.0.1',
    GAME_NAME: "Kenneth's AMAZING Biotech Adventure",
    
    // ═══════════════════════════════════════════════════════════════════════
    // STORAGE KEYS - FIXED: These were missing!
    // ═══════════════════════════════════════════════════════════════════════
    STORAGE: {
        SAVE_DATA: 'kenneth_biotech_save',
        HIGH_SCORE: 'kenneth_biotech_highscore',
        SETTINGS: 'kenneth_biotech_settings'
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // GRID CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    GRID: {
        CELL_SIZE: 70,
        GAP: 6,
        DEFAULT_COLS: 6,
        DEFAULT_ROWS: 5,
        SANDBOX_COLS: 10,
        SANDBOX_ROWS: 8,
        MAX_COLS: 12,
        MAX_ROWS: 10
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONNECTION TYPES - FIXED: These were missing!
    // ═══════════════════════════════════════════════════════════════════════
    CONNECTION_TYPES: {
        neural: {
            name: 'Neural',
            color: '#ff00ff',
            icon: '🟣',
            description: 'Brain signals and nerve impulses',
            compatibleWith: ['neural', 'universal'],
            bonusPoints: 30
        },
        vascular: {
            name: 'Vascular',
            color: '#ff4466',
            icon: '🔴',
            description: 'Blood flow and circulation',
            compatibleWith: ['vascular', 'universal'],
            bonusPoints: 25
        },
        data: {
            name: 'Data',
            color: '#00f5ff',
            icon: '🔵',
            description: 'Digital information transfer',
            compatibleWith: ['data', 'universal'],
            bonusPoints: 35
        },
        energy: {
            name: 'Energy',
            color: '#ffd700',
            icon: '🟡',
            description: 'Power and electricity',
            compatibleWith: ['energy', 'universal'],
            bonusPoints: 28
        },
        fluid: {
            name: 'Fluid',
            color: '#00ff88',
            icon: '🟢',
            description: 'Water and nutrient flow',
            compatibleWith: ['fluid', 'universal'],
            bonusPoints: 22
        },
        universal: {
            name: 'Universal',
            color: '#ffffff',
            icon: '⚪',
            description: 'Connects to anything!',
            compatibleWith: ['neural', 'vascular', 'data', 'energy', 'fluid', 'universal'],
            bonusPoints: 20
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // SCORING SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    SCORING: {
        BASE_PLACEMENT: 50,
        CONNECTION_POINTS: 25,
        PERFECT_CONNECTION: 100,
        SYNERGY_MULTIPLIER: 1.5,
        MEGA_SYNERGY_BONUS: 500,
        CHAIN_BONUS_PER_LINK: 50,
        COMBO_INCREMENT: 0.2,
        MAX_COMBO: 5.0,
        COMBO_DECAY_TIME: 3000,
        TIME_BONUS_RATE: 3,
        EARLY_FINISH_BONUS: 200,
        SPEED_BONUS_THRESHOLD: 0.7,
        SPEED_BONUS_AMOUNT: 150,
        NO_MISTAKES_BONUS: 100,
        ALL_MODULES_USED_BONUS: 75,
        STAR_THRESHOLDS: {
            ONE: 0.4,
            TWO: 0.7,
            THREE: 0.95
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // PROGRESSION SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    PROGRESSION: {
        BASE_XP: 100,
        LEVEL_XP_MULTIPLIER: 1.15,
        XP_PER_STAR: 30,
        XP_FOR_COMPLETION: 50,
        XP_FOR_NEW_HIGH_SCORE: 25,
        MAX_LEVEL: 50,
        UNLOCK_THRESHOLDS: {
            ERA_2: 4,
            ERA_3: 10,
            ERA_4: 18
        },
        MODULE_UNLOCK_LEVELS: {
            'heart': 1,
            'brain': 1,
            'liver': 1,
            'kidney': 1,
            'lung': 1,
            'blood_vessel': 1,
            'nerve_connector': 1,
            'fluid_channel': 1,
            'stomach': 2,
            'intestine': 2,
            'pancreas': 3,
            'spleen': 3,
            'bone_marrow': 4,
            'skin': 4,
            'muscle': 5,
            'eye': 1,
            'brain_organoid': 6,
            'heart_organoid': 7,
            'liver_organoid': 8,
            'kidney_organoid': 9,
            'lung_organoid': 10,
            'gut_organoid': 11,
            'retina_organoid': 12,
            'organ_chip': 13,
            'microfluidic_channel': 14,
            'bioreactor': 15,
            'sensor_array': 16,
            'perfusion_system': 17,
            'digital_twin': 18,
            'ai_predictor': 19,
            'data_hub': 20,
            'quantum_analyzer': 21,
            'synth_tissue': 22,
            'universal_hub': 1
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // TIMERS & ANIMATIONS
    // ═══════════════════════════════════════════════════════════════════════
    TIMERS: {
        DEFAULT_LEVEL_TIME: 180,
        EASY_LEVEL_TIME: 240,
        HARD_LEVEL_TIME: 120,
        WARNING_TIME: 60,
        CRITICAL_TIME: 30,
        ANIMATION_INSTANT: 50,
        ANIMATION_FAST: 150,
        ANIMATION_MEDIUM: 300,
        ANIMATION_SLOW: 500,
        ANIMATION_VERY_SLOW: 1000,
        TOAST_DURATION: 3500,
        ENCOURAGEMENT_DURATION: 2000,
        COMBO_DECAY: 3000,
        LEVEL_START_DELAY: 500,
        LEVEL_END_DELAY: 1000,
        MODAL_TRANSITION: 300
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // SYNERGIES - FIXED: These were referenced but not fully defined
    // ═══════════════════════════════════════════════════════════════════════
    SYNERGIES: {
        cardiovascular: {
            name: 'Cardiovascular System',
            modules: ['heart', 'lung', 'blood_vessel'],
            bonus: 300,
            description: 'Heart + Lungs + Blood Vessels = Life force!',
            icon: '❤️'
        },
        nervous: {
            name: 'Nervous System',
            modules: ['brain', 'nerve_connector', 'eye'],
            bonus: 350,
            description: 'Brain + Nerves + Eyes = Control center!',
            icon: '🧠'
        },
        digestive: {
            name: 'Digestive System',
            modules: ['stomach', 'intestine', 'liver'],
            bonus: 280,
            description: 'Stomach + Intestines + Liver = Food processing!',
            icon: '🍽️'
        },
        excretory: {
            name: 'Excretory System',
            modules: ['kidney', 'liver'],
            bonus: 200,
            description: 'Kidneys + Liver = Body filters!',
            icon: '🧹'
        },
        organoid_brain: {
            name: 'Mini Brain Lab',
            modules: ['brain_organoid', 'nerve_connector'],
            bonus: 400,
            description: 'Brain organoid research station!',
            icon: '🧫'
        },
        organ_chip_system: {
            name: 'Organ-on-Chip Array',
            modules: ['organ_chip', 'microfluidic_channel', 'sensor_array'],
            bonus: 500,
            description: 'Advanced MPS research!',
            icon: '🔬'
        },
        digital_biology: {
            name: 'Digital Biology Lab',
            modules: ['digital_twin', 'ai_predictor', 'data_hub'],
            bonus: 600,
            description: 'The future of medicine!',
            icon: '💻'
        },
        full_body: {
            name: 'Complete Body System',
            modules: ['heart', 'brain', 'lung', 'liver', 'kidney'],
            bonus: 1000,
            description: 'All major organs connected!',
            icon: '🏆'
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // TIERS
    // ═══════════════════════════════════════════════════════════════════════
    TIERS: {
        BASIC: { level: 1, name: 'Basic', color: '#4488ff', description: 'Fundamental bio-modules' },
        ORGANOID: { level: 2, name: 'Organoid', color: '#00ff88', description: 'Lab-grown mini-organs' },
        MPS: { level: 3, name: 'MPS', color: '#a855f7', description: 'Microphysiological systems' },
        ADVANCED: { level: 4, name: 'Advanced', color: '#ffd700', description: 'Cutting-edge technology' }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORIES
    // ═══════════════════════════════════════════════════════════════════════
    CATEGORIES: {
        organs: { name: 'Organs', icon: '🫀', color: '#ff4466', description: 'Real human organs' },
        organoids: { name: 'Organoids', icon: '🧫', color: '#00ff88', description: 'Mini lab-grown organs' },
        mps: { name: 'MPS', icon: '🔬', color: '#a855f7', description: 'Microphysiological systems' },
        digital: { name: 'Digital', icon: '💻', color: '#00f5ff', description: 'Digital & AI components' },
        synthetic: { name: 'Synthetic', icon: '🧪', color: '#ff8c00', description: 'Engineered bio-parts' },
        connectors: { name: 'Connectors', icon: '🔗', color: '#888888', description: 'Link modules together' }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // TITLES
    // ═══════════════════════════════════════════════════════════════════════
    TITLES: [
        { level: 1, title: 'Lab Assistant', emoji: '🔬' },
        { level: 3, title: 'Junior Scientist', emoji: '🧪' },
        { level: 5, title: 'Bio-Explorer', emoji: '🧬' },
        { level: 8, title: 'Cell Master', emoji: '🦠' },
        { level: 12, title: 'Organ Engineer', emoji: '🫀' },
        { level: 16, title: 'Biotech Wizard', emoji: '🧙' },
        { level: 20, title: 'Research Director', emoji: '👨‍🔬' },
        { level: 25, title: 'Bio-Genius', emoji: '🧠' },
        { level: 30, title: 'Science Legend', emoji: '⭐' },
        { level: 40, title: 'Ultimate Bio-Master', emoji: '🏆' },
        { level: 50, title: 'Kenneth the Great', emoji: '👑' }
    ],
    
    // ═══════════════════════════════════════════════════════════════════════
    // ENCOURAGEMENT MESSAGES
    // ═══════════════════════════════════════════════════════════════════════
    ENCOURAGEMENT: {
        onLevelStart: [
            "Let's go, Kenneth!",
            "You've got this!",
            "Time to do science!",
            "Ready to build something AMAZING?",
            "Science adventure begins!"
        ],
        onModulePlace: [
            "Great choice!",
            "Nice placement!",
            "Looking good!",
            "Smart move!",
            "Perfect spot!"
        ],
        onConnection: [
            "Connected!",
            "Systems linking!",
            "Great connection!",
            "Biology in action!",
            "Flow established!"
        ],
        onSynergy: [
            "SYNERGY!",
            "AMAZING combo!",
            "Incredible!",
            "Bio-system activated!",
            "PERFECT teamwork!"
        ],
        onCombo: [
            "COMBO!",
            "On fire!",
            "Keep it up!",
            "Unstoppable!",
            "BLAZING!"
        ],
        onLevelComplete: [
            "Level complete!",
            "You did it!",
            "Fantastic work!",
            "Bio-master!",
            "Science success!"
        ],
        onThreeStars: [
            "PERFECT! ⭐⭐⭐",
            "AMAZING, Kenneth! ⭐⭐⭐",
            "You're a GENIUS! ⭐⭐⭐",
            "INCREDIBLE! ⭐⭐⭐",
            "LEGENDARY! ⭐⭐⭐"
        ]
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // TIPS
    // ═══════════════════════════════════════════════════════════════════════
    TIPS: [
        "Match port colors for bonus points!",
        "Build combos by placing modules quickly!",
        "Look for synergy combinations!",
        "Universal ports connect to everything!",
        "The brain module has neural ports that power everything!",
        "Hearts pump resources through vascular connections!",
        "Organoids are mini versions of real organs!",
        "MPS systems use microfluidic channels!",
        "Digital twins simulate real biology on computers!"
    ],
    
    // ═══════════════════════════════════════════════════════════════════════
    // PARTICLES
    // ═══════════════════════════════════════════════════════════════════════
    PARTICLES: {
        AMBIENT: {
            count: 50,
            size: { min: 2, max: 6 },
            speed: { min: 0.1, max: 0.5 },
            colors: ['#00f5ff', '#ff00ff', '#00ff88', '#ffd700'],
            opacity: { min: 0.2, max: 0.6 }
        },
        PLACEMENT: {
            count: 15,
            size: { min: 4, max: 8 },
            speed: { min: 2, max: 5 },
            lifetime: 600,
            colors: ['#00f5ff', '#ffffff']
        },
        CONNECTION: {
            count: 20,
            size: { min: 3, max: 6 },
            speed: { min: 3, max: 7 },
            lifetime: 500,
            colors: ['#00ff88', '#ffd700', '#ffffff']
        },
        SYNERGY: {
            count: 40,
            size: { min: 5, max: 12 },
            speed: { min: 4, max: 10 },
            lifetime: 800,
            colors: ['#ffd700', '#ff00ff', '#00f5ff', '#00ff88']
        },
        CONFETTI: {
            count: 100,
            size: { min: 8, max: 15 },
            speed: { min: 2, max: 6 },
            lifetime: 3000,
            colors: ['#ff4466', '#ffd700', '#00f5ff', '#ff00ff', '#00ff88', '#a855f7']
        },
        COMBO: {
            count: 30,
            size: { min: 6, max: 10 },
            speed: { min: 5, max: 12 },
            lifetime: 400,
            colors: ['#ff8c00', '#ff4466', '#ffd700']
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // LAB BUDDIES
    // ═══════════════════════════════════════════════════════════════════════
    LAB_BUDDIES: {
        helix: {
            id: 'helix',
            name: 'Helix',
            emoji: '🐕',
            title: 'The DNA Dog',
            color: '#ff6b6b',
            ability: 'Finds hidden connections!',
            unlockStars: 0,
            phrases: [
                "Woof! Let's do science!",
                "I found a connection!",
                "You're doing great!",
                "Science is ruff-ly awesome!"
            ]
        },
        luna: {
            id: 'luna',
            name: 'Luna',
            emoji: '🐱',
            title: 'The Lab Cat',
            color: '#a855f7',
            ability: 'Slows down time!',
            unlockStars: 0,
            phrases: [
                "Meow! Science is purr-fect!",
                "Take your time!",
                "I believe in mew!"
            ]
        },
        spark: {
            id: 'spark',
            name: 'Spark',
            emoji: '🐭',
            title: 'The Science Mouse',
            color: '#ffd700',
            ability: '+50% bonus points!',
            unlockStars: 10,
            phrases: [
                "Squeak! Let's experiment!",
                "Small but mighty!"
            ]
        },
        bubbles: {
            id: 'bubbles',
            name: 'Bubbles',
            emoji: '🐠',
            title: 'The Bio-Fish',
            color: '#00f5ff',
            ability: 'Shows helpful hints!',
            unlockStars: 20,
            phrases: [
                "Blub blub! Water you waiting for?",
                "Just keep swimming!"
            ]
        }
    }
};

// Deep freeze to prevent modifications
(function deepFreeze(obj) {
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Object.isFrozen(obj[key])) {
            deepFreeze(obj[key]);
        }
    });
    return Object.freeze(obj);
})(KennethGame.CONSTANTS);

console.log('🧬 Constants loaded with all fixes!');
// v20260117-FULL
