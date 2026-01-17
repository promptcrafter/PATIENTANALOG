/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - Levels Data
 * 24+ Exciting Levels Across 4 Eras!
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

KennethGame.Levels = (function() {
    
    /**
     * ═══════════════════════════════════════════════════════════════════════
     * ERA DEFINITIONS
     * ═══════════════════════════════════════════════════════════════════════
     */
    const ERAS = [
        {
            id: 1,
            name: 'Basic Organs',
            icon: '🫀',
            description: 'Learn the building blocks of life! Real human organs!',
            color: '#ff4466',
            unlockLevel: 1,
            levels: [
                {
                    id: '1-1',
                    name: 'First Heartbeat',
                    subtitle: 'Build your first system!',
                    description: 'Welcome, Kenneth! Let\'s start with the amazing heart! Connect it to blood vessels to make your first bio-system.',
                    difficulty: 'Easy',
                    gridSize: { cols: 4, rows: 4 },
                    timeLimit: 180,
                    targetScore: 500,
                    availableModules: [
                        { id: 'heart', count: 1 },
                        { id: 'blood_vessel', count: 4 },
                        { id: 'lung', count: 1 }
                    ],
                    objectives: [
                        { type: 'place', target: 3, description: 'Place 3 modules' },
                        { type: 'connect', target: 2, description: 'Make 2 connections' }
                    ],
                    tips: [
                        'Drag the heart to the center of the grid!',
                        'Blood vessels have red ports - connect them to the heart!',
                        'Matching port colors gives bonus points!'
                    ],
                    rewards: { xp: 100, unlocks: ['blood_vessel'] },
                    starThresholds: { one: 300, two: 400, three: 500 }
                },
                {
                    id: '1-2',
                    name: 'Breathing Life',
                    subtitle: 'Add lungs to the mix!',
                    description: 'Great job! Now let\'s add lungs. The heart and lungs work together to keep you alive!',
                    difficulty: 'Easy',
                    gridSize: { cols: 5, rows: 4 },
                    timeLimit: 180,
                    targetScore: 750,
                    availableModules: [
                        { id: 'heart', count: 1 },
                        { id: 'lung', count: 2 },
                        { id: 'blood_vessel', count: 5 }
                    ],
                    objectives: [
                        { type: 'place', target: 5, description: 'Place 5 modules' },
                        { type: 'connect', target: 4, description: 'Make 4 connections' },
                        { type: 'synergy', target: 1, description: 'Create 1 synergy' }
                    ],
                    tips: [
                        'Connect the lungs to the heart through blood vessels!',
                        'Look for the Cardiovascular System synergy!',
                        'Synergies give HUGE bonus points!'
                    ],
                    rewards: { xp: 125, unlocks: ['lung'] },
                    starThresholds: { one: 450, two: 600, three: 750 }
                },
                {
                    id: '1-3',
                    name: 'Brain Power',
                    subtitle: 'The control center!',
                    description: 'Time for the brain! It controls everything with neural signals. Connect nerves to send messages!',
                    difficulty: 'Easy',
                    gridSize: { cols: 5, rows: 4 },
                    timeLimit: 180,
                    targetScore: 900,
                    availableModules: [
                        { id: 'brain', count: 1 },
                        { id: 'nerve_connector', count: 4 },
                        { id: 'eye', count: 1 },
                        { id: 'blood_vessel', count: 3 }
                    ],
                    objectives: [
                        { type: 'place', target: 6, description: 'Place 6 modules' },
                        { type: 'connect', target: 5, description: 'Make 5 connections' },
                        { type: 'synergy', target: 1, description: 'Create Nervous System synergy' }
                    ],
                    tips: [
                        'The brain has purple neural ports!',
                        'Eyes need to connect to the brain to see!',
                        'Nerve connectors carry signals super fast!'
                    ],
                    rewards: { xp: 150, unlocks: ['brain', 'nerve_connector'] },
                    starThresholds: { one: 540, two: 720, three: 900 }
                },
                {
                    id: '1-4',
                    name: 'The Filter Factory',
                    subtitle: 'Cleaning the body!',
                    description: 'The liver and kidneys clean your blood! Let\'s build a filtering system.',
                    difficulty: 'Medium',
                    gridSize: { cols: 5, rows: 5 },
                    timeLimit: 180,
                    targetScore: 1200,
                    availableModules: [
                        { id: 'liver', count: 1 },
                        { id: 'kidney', count: 2 },
                        { id: 'blood_vessel', count: 5 },
                        { id: 'fluid_channel', count: 3 }
                    ],
                    objectives: [
                        { type: 'place', target: 8, description: 'Place 8 modules' },
                        { type: 'connect', target: 7, description: 'Make 7 connections' },
                        { type: 'synergy', target: 1, description: 'Create Excretory System synergy' }
                    ],
                    tips: [
                        'Kidneys filter blood and make urine!',
                        'The liver cleans toxins from blood!',
                        'Use fluid channels for water flow!'
                    ],
                    rewards: { xp: 175, unlocks: ['liver', 'kidney', 'fluid_channel'] },
                    starThresholds: { one: 720, two: 960, three: 1200 }
                },
                {
                    id: '1-5',
                    name: 'Digestive Journey',
                    subtitle: 'From mouth to... well, you know!',
                    description: 'Food goes on an amazing journey! Build the digestive system from stomach to intestines.',
                    difficulty: 'Medium',
                    gridSize: { cols: 6, rows: 5 },
                    timeLimit: 180,
                    targetScore: 1500,
                    availableModules: [
                        { id: 'stomach', count: 1 },
                        { id: 'intestine', count: 2 },
                        { id: 'liver', count: 1 },
                        { id: 'pancreas', count: 1 },
                        { id: 'blood_vessel', count: 4 },
                        { id: 'fluid_channel', count: 3 }
                    ],
                    objectives: [
                        { type: 'place', target: 10, description: 'Place 10 modules' },
                        { type: 'connect', target: 9, description: 'Make 9 connections' },
                        { type: 'synergy', target: 1, description: 'Create Digestive System synergy' },
                        { type: 'score', target: 1200, description: 'Score 1200+ points' }
                    ],
                    tips: [
                        'The stomach mashes food with acid!',
                        'Intestines absorb all the nutrients!',
                        'The pancreas makes digestive juices!'
                    ],
                    rewards: { xp: 200, unlocks: ['stomach', 'intestine', 'pancreas'] },
                    starThresholds: { one: 900, two: 1200, three: 1500 }
                },
                {
                    id: '1-6',
                    name: 'Full Body System',
                    subtitle: 'Put it all together!',
                    description: 'Kenneth\'s Challenge! Build a complete body system with multiple organs working together!',
                    difficulty: 'Hard',
                    gridSize: { cols: 6, rows: 6 },
                    timeLimit: 240,
                    targetScore: 2500,
                    availableModules: [
                        { id: 'heart', count: 1 },
                        { id: 'brain', count: 1 },
                        { id: 'lung', count: 2 },
                        { id: 'liver', count: 1 },
                        { id: 'kidney', count: 1 },
                        { id: 'blood_vessel', count: 6 },
                        { id: 'nerve_connector', count: 4 },
                        { id: 'fluid_channel', count: 3 }
                    ],
                    objectives: [
                        { type: 'place', target: 15, description: 'Place 15 modules' },
                        { type: 'connect', target: 14, description: 'Make 14 connections' },
                        { type: 'synergy', target: 2, description: 'Create 2 different synergies' },
                        { type: 'combo', target: 2.0, description: 'Reach 2x combo' }
                    ],
                    tips: [
                        'Plan your layout before placing!',
                        'Try to get multiple synergies!',
                        'Speed builds your combo!'
                    ],
                    rewards: { xp: 300, unlocks: ['universal_hub'] },
                    starThresholds: { one: 1500, two: 2000, three: 2500 },
                    isBossLevel: true
                }
            ]
        },
        {
            id: 2,
            name: 'Organoids',
            icon: '🧫',
            description: 'Discover mini organs grown in the lab! Science fiction is real!',
            color: '#00ff88',
            unlockLevel: 5,
            levels: [
                {
                    id: '2-1',
                    name: 'Mini Brain',
                    subtitle: 'Neurons in a dish!',
                    description: 'Scientists can grow tiny brains in the lab! Let\'s build your first organoid system.',
                    difficulty: 'Medium',
                    gridSize: { cols: 5, rows: 5 },
                    timeLimit: 180,
                    targetScore: 1800,
                    availableModules: [
                        { id: 'brain_organoid', count: 1 },
                        { id: 'nerve_connector', count: 4 },
                        { id: 'blood_vessel', count: 3 },
                        { id: 'fluid_channel', count: 2 }
                    ],
                    objectives: [
                        { type: 'place', target: 8, description: 'Place 8 modules' },
                        { type: 'connect', target: 7, description: 'Make 7 connections' },
                        { type: 'score', target: 1500, description: 'Score 1500+ points' }
                    ],
                    tips: [
                        'Brain organoids have data AND neural ports!',
                        'They\'re like mini computers made of neurons!',
                        'Connect to nerves for signal processing!'
                    ],
                    rewards: { xp: 225, unlocks: ['brain_organoid'] },
                    starThresholds: { one: 1080, two: 1440, three: 1800 }
                },
                {
                    id: '2-2',
                    name: 'Beating Hearts',
                    subtitle: 'Watch it pulse!',
                    description: 'Heart organoids actually BEAT in the lab! Connect them to create a cardiac network.',
                    difficulty: 'Medium',
                    gridSize: { cols: 5, rows: 5 },
                    timeLimit: 180,
                    targetScore: 2000,
                    availableModules: [
                        { id: 'heart_organoid', count: 2 },
                        { id: 'blood_vessel', count: 5 },
                        { id: 'nerve_connector', count: 2 },
                        { id: 'fluid_channel', count: 2 }
                    ],
                    objectives: [
                        { type: 'place', target: 9, description: 'Place 9 modules' },
                        { type: 'connect', target: 8, description: 'Make 8 connections' },
                        { type: 'synergy', target: 1, description: 'Create an organoid synergy' }
                    ],
                    tips: [
                        'Heart organoids can synchronize their beating!',
                        'Connect them with blood vessels!',
                        'Watch for the golden synergy glow!'
                    ],
                    rewards: { xp: 250, unlocks: ['heart_organoid'] },
                    starThresholds: { one: 1200, two: 1600, three: 2000 }
                },
                {
                    id: '2-3',
                    name: 'Liver Lab',
                    subtitle: 'Testing medicines safely!',
                    description: 'Liver organoids help test if medicines are safe. Build a drug testing system!',
                    difficulty: 'Medium',
                    gridSize: { cols: 6, rows: 5 },
                    timeLimit: 180,
                    targetScore: 2200,
                    availableModules: [
                        { id: 'liver_organoid', count: 2 },
                        { id: 'kidney_organoid', count: 1 },
                        { id: 'fluid_channel', count: 5 },
                        { id: 'blood_vessel', count: 3 }
                    ],
                    objectives: [
                        { type: 'place', target: 10, description: 'Place 10 modules' },
                        { type: 'connect', target: 9, description: 'Make 9 connections' },
                        { type: 'synergy', target: 1, description: 'Connect liver and kidney organoids' }
                    ],
                    tips: [
                        'Liver organoids can process chemicals!',
                        'Kidney organoids filter waste!',
                        'Together they test drug safety!'
                    ],
                    rewards: { xp: 275, unlocks: ['liver_organoid', 'kidney_organoid'] },
                    starThresholds: { one: 1320, two: 1760, three: 2200 }
                },
                {
                    id: '2-4',
                    name: 'Gut Feelings',
                    subtitle: 'The gut-brain connection!',
                    description: 'Did you know your gut talks to your brain? Build the gut-brain axis!',
                    difficulty: 'Hard',
                    gridSize: { cols: 6, rows: 5 },
                    timeLimit: 180,
                    targetScore: 2500,
                    availableModules: [
                        { id: 'gut_organoid', count: 1 },
                        { id: 'brain_organoid', count: 1 },
                        { id: 'nerve_connector', count: 5 },
                        { id: 'fluid_channel', count: 4 },
                        { id: 'blood_vessel', count: 3 }
                    ],
                    objectives: [
                        { type: 'place', target: 12, description: 'Place 12 modules' },
                        { type: 'connect', target: 11, description: 'Make 11 connections' },
                        { type: 'synergy', target: 2, description: 'Create 2 synergies' }
                    ],
                    tips: [
                        'Gut organoids have neural ports!',
                        'They can communicate with brain organoids!',
                        'This is called the gut-brain axis!'
                    ],
                    rewards: { xp: 300, unlocks: ['gut_organoid'] },
                    starThresholds: { one: 1500, two: 2000, three: 2500 }
                },
                {
                    id: '2-5',
                    name: 'Vision Quest',
                    subtitle: 'Growing eyes in a lab!',
                    description: 'Retina organoids can actually sense light! Build an artificial vision system.',
                    difficulty: 'Hard',
                    gridSize: { cols: 6, rows: 5 },
                    timeLimit: 180,
                    targetScore: 2800,
                    availableModules: [
                        { id: 'retina_organoid', count: 2 },
                        { id: 'brain_organoid', count: 1 },
                        { id: 'nerve_connector', count: 5 },
                        { id: 'blood_vessel', count: 3 },
                        { id: 'universal_hub', count: 1 }
                    ],
                    objectives: [
                        { type: 'place', target: 11, description: 'Place 11 modules' },
                        { type: 'connect', target: 10, description: 'Make 10 connections' },
                        { type: 'synergy', target: 2, description: 'Create 2 synergies' },
                        { type: 'combo', target: 2.5, description: 'Reach 2.5x combo' }
                    ],
                    tips: [
                        'Retinas convert light to signals!',
                        'Connect them to the brain to "see"!',
                        'Universal hubs help connect different types!'
                    ],
                    rewards: { xp: 350, unlocks: ['retina_organoid', 'lung_organoid'] },
                    starThresholds: { one: 1680, two: 2240, three: 2800 }
                },
                {
                    id: '2-6',
                    name: 'Mini Body',
                    subtitle: 'Organoid orchestra!',
                    description: 'Kenneth\'s Organoid Challenge! Build a complete mini body with multiple organoids!',
                    difficulty: 'Expert',
                    gridSize: { cols: 7, rows: 6 },
                    timeLimit: 240,
                    targetScore: 4000,
                    availableModules: [
                        { id: 'brain_organoid', count: 1 },
                        { id: 'heart_organoid', count: 1 },
                        { id: 'liver_organoid', count: 1 },
                        { id: 'kidney_organoid', count: 1 },
                        { id: 'gut_organoid', count: 1 },
                        { id: 'nerve_connector', count: 5 },
                        { id: 'blood_vessel', count: 5 },
                        { id: 'fluid_channel', count: 4 },
                        { id: 'universal_hub', count: 2 }
                    ],
                    objectives: [
                        { type: 'place', target: 18, description: 'Place 18 modules' },
                        { type: 'connect', target: 17, description: 'Make 17 connections' },
                        { type: 'synergy', target: 3, description: 'Create 3 synergies' },
                        { type: 'combo', target: 3.0, description: 'Reach 3x combo' }
                    ],
                    tips: [
                        'This is the ultimate organoid challenge!',
                        'Plan carefully for maximum synergies!',
                        'You\'re building life, Kenneth!'
                    ],
                    rewards: { xp: 500, unlocks: ['organ_chip'] },
                    starThresholds: { one: 2400, two: 3200, three: 4000 },
                    isBossLevel: true
                }
            ]
        },
        {
            id: 3,
            name: 'MPS Systems',
            icon: '🔬',
            description: 'Microphysiological Systems - Organs on chips! Ultra high-tech!',
            color: '#a855f7',
            unlockLevel: 11,
            levels: [
                {
                    id: '3-1',
                    name: 'First Chip',
                    subtitle: 'Organs on silicon!',
                    description: 'Organ-on-chip technology puts living cells on computer chips! Build your first one.',
                    difficulty: 'Hard',
                    gridSize: { cols: 6, rows: 5 },
                    timeLimit: 180,
                    targetScore: 3000,
                    availableModules: [
                        { id: 'organ_chip', count: 2 },
                        { id: 'microfluidic_channel', count: 5 },
                        { id: 'sensor_array', count: 1 },
                        { id: 'fluid_channel', count: 3 }
                    ],
                    objectives: [
                        { type: 'place', target: 10, description: 'Place 10 modules' },
                        { type: 'connect', target: 9, description: 'Make 9 connections' },
                        { type: 'synergy', target: 1, description: 'Create Lab-on-Chip synergy' }
                    ],
                    tips: [
                        'Organ chips need microfluidic channels!',
                        'Sensors monitor everything in real-time!',
                        'Fluid channels deliver nutrients!'
                    ],
                    rewards: { xp: 400, unlocks: ['microfluidic_channel'] },
                    starThresholds: { one: 1800, two: 2400, three: 3000 }
                },
                {
                    id: '3-2',
                    name: 'Bioreactor Bay',
                    subtitle: 'Keeping cells alive!',
                    description: 'Bioreactors create the perfect environment for cells. Build a cell cultivation system!',
                    difficulty: 'Hard',
                    gridSize: { cols: 6, rows: 6 },
                    timeLimit: 180,
                    targetScore: 3500,
                    availableModules: [
                        { id: 'bioreactor', count: 2 },
                        { id: 'perfusion_system', count: 2 },
                        { id: 'microfluidic_channel', count: 4 },
                        { id: 'organ_chip', count: 1 },
                        { id: 'fluid_channel', count: 3 }
                    ],
                    objectives: [
                        { type: 'place', target: 11, description: 'Place 11 modules' },
                        { type: 'connect', target: 10, description: 'Make 10 connections' },
                        { type: 'synergy', target: 2, description: 'Create 2 MPS synergies' }
                    ],
                    tips: [
                        'Bioreactors need energy and fluid ports!',
                        'Perfusion keeps nutrients flowing!',
                        'It\'s like a spa for cells!'
                    ],
                    rewards: { xp: 450, unlocks: ['bioreactor', 'perfusion_system'] },
                    starThresholds: { one: 2100, two: 2800, three: 3500 }
                },
                {
                    id: '3-3',
                    name: 'Sensor Network',
                    subtitle: 'Watching everything!',
                    description: 'Sensors collect data from every part of the system. Build a monitoring network!',
                    difficulty: 'Hard',
                    gridSize: { cols: 6, rows: 6 },
                    timeLimit: 180,
                    targetScore: 3800,
                    availableModules: [
                        { id: 'sensor_array', count: 3 },
                        { id: 'organ_chip', count: 2 },
                        { id: 'microfluidic_channel', count: 4 },
                        { id: 'nerve_connector', count: 3 },
                        { id: 'universal_hub', count: 1 }
                    ],
                    objectives: [
                        { type: 'place', target: 12, description: 'Place 12 modules' },
                        { type: 'connect', target: 11, description: 'Make 11 connections' },
                        { type: 'synergy', target: 2, description: 'Create 2 synergies' },
                        { type: 'combo', target: 2.5, description: 'Reach 2.5x combo' }
                    ],
                    tips: [
                        'Sensors have ALL data ports!',
                        'Connect them to everything for monitoring!',
                        'Data is the key to understanding biology!'
                    ],
                    rewards: { xp: 500, unlocks: ['sensor_array'] },
                    starThresholds: { one: 2280, two: 3040, three: 3800 }
                },
                {
                    id: '3-4',
                    name: 'Living Factory',
                    subtitle: 'Making medicine!',
                    description: 'Build a complete bio-production facility! Cells that make medicine!',
                    difficulty: 'Expert',
                    gridSize: { cols: 7, rows: 6 },
                    timeLimit: 200,
                    targetScore: 4500,
                    availableModules: [
                        { id: 'bioreactor', count: 2 },
                        { id: 'perfusion_system', count: 2 },
                        { id: 'organ_chip', count: 2 },
                        { id: 'microfluidic_channel', count: 5 },
                        { id: 'sensor_array', count: 2 },
                        { id: 'fluid_channel', count: 3 }
                    ],
                    objectives: [
                        { type: 'place', target: 15, description: 'Place 15 modules' },
                        { type: 'connect', target: 14, description: 'Make 14 connections' },
                        { type: 'synergy', target: 3, description: 'Create 3 synergies' }
                    ],
                    tips: [
                        'Build a complete production pipeline!',
                        'Bioreactors grow, perfusion feeds, sensors monitor!',
                        'This is how real medicine is made!'
                    ],
                    rewards: { xp: 600, unlocks: ['digital_twin'] },
                    starThresholds: { one: 2700, two: 3600, three: 4500 },
                    isBossLevel: true
                }
            ]
        },
        {
            id: 4,
            name: 'Digital Twins',
            icon: '🤖',
            description: 'The future is NOW! AI, quantum computing, and digital biology!',
            color: '#ffd700',
            unlockLevel: 18,
            levels: [
                {
                    id: '4-1',
                    name: 'Digital You',
                    subtitle: 'A virtual copy!',
                    description: 'Digital twins are computer copies of real people! Build your first virtual patient.',
                    difficulty: 'Expert',
                    gridSize: { cols: 7, rows: 6 },
                    timeLimit: 200,
                    targetScore: 5000,
                    availableModules: [
                        { id: 'digital_twin', count: 1 },
                        { id: 'data_hub', count: 2 },
                        { id: 'sensor_array', count: 3 },
                        { id: 'organ_chip', count: 2 },
                        { id: 'nerve_connector', count: 3 },
                        { id: 'universal_hub', count: 2 }
                    ],
                    objectives: [
                        { type: 'place', target: 12, description: 'Place 12 modules' },
                        { type: 'connect', target: 11, description: 'Make 11 connections' },
                        { type: 'synergy', target: 2, description: 'Create 2 synergies' },
                        { type: 'score', target: 4000, description: 'Score 4000+ points' }
                    ],
                    tips: [
                        'Digital twins need lots of data!',
                        'Connect sensors to feed information!',
                        'Data hubs organize everything!'
                    ],
                    rewards: { xp: 700, unlocks: ['data_hub'] },
                    starThresholds: { one: 3000, two: 4000, three: 5000 }
                },
                {
                    id: '4-2',
                    name: 'AI Doctor',
                    subtitle: 'Artificial intelligence!',
                    description: 'AI can predict health problems before they happen! Build an AI medical system.',
                    difficulty: 'Expert',
                    gridSize: { cols: 7, rows: 6 },
                    timeLimit: 200,
                    targetScore: 5500,
                    availableModules: [
                        { id: 'ai_predictor', count: 2 },
                        { id: 'digital_twin', count: 1 },
                        { id: 'data_hub', count: 2 },
                        { id: 'sensor_array', count: 3 },
                        { id: 'nerve_connector', count: 4 },
                        { id: 'universal_hub', count: 2 }
                    ],
                    objectives: [
                        { type: 'place', target: 13, description: 'Place 13 modules' },
                        { type: 'connect', target: 12, description: 'Make 12 connections' },
                        { type: 'synergy', target: 2, description: 'Create AI Hospital synergy' },
                        { type: 'combo', target: 3.0, description: 'Reach 3x combo' }
                    ],
                    tips: [
                        'AI predictors analyze all the data!',
                        'Connect them to digital twins for predictions!',
                        'This is the future of medicine!'
                    ],
                    rewards: { xp: 800, unlocks: ['ai_predictor'] },
                    starThresholds: { one: 3300, two: 4400, three: 5500 }
                },
                {
                    id: '4-3',
                    name: 'Quantum Leap',
                    subtitle: 'Physics meets biology!',
                    description: 'Quantum computers can simulate molecules! Build a quantum biology lab.',
                    difficulty: 'Expert',
                    gridSize: { cols: 7, rows: 7 },
                    timeLimit: 220,
                    targetScore: 6500,
                    availableModules: [
                        { id: 'quantum_analyzer', count: 1 },
                        { id: 'digital_twin', count: 1 },
                        { id: 'ai_predictor', count: 1 },
                        { id: 'brain_organoid', count: 1 },
                        { id: 'data_hub', count: 3 },
                        { id: 'sensor_array', count: 2 },
                        { id: 'universal_hub', count: 3 }
                    ],
                    objectives: [
                        { type: 'place', target: 12, description: 'Place 12 modules' },
                        { type: 'connect', target: 11, description: 'Make 11 connections' },
                        { type: 'synergy', target: 2, description: 'Create Quantum Biology synergy' },
                        { type: 'combo', target: 3.5, description: 'Reach 3.5x combo' }
                    ],
                    tips: [
                        'Quantum analyzers are super powerful!',
                        'They need LOTS of energy ports!',
                        'Connect to everything for maximum analysis!'
                    ],
                    rewards: { xp: 900, unlocks: ['quantum_analyzer'] },
                    starThresholds: { one: 3900, two: 5200, three: 6500 }
                },
                {
                    id: '4-4',
                    name: 'Kenneth\'s Masterpiece',
                    subtitle: 'The ULTIMATE challenge!',
                    description: 'Build the most advanced bio-system ever! Combine EVERYTHING you\'ve learned!',
                    difficulty: 'LEGENDARY',
                    gridSize: { cols: 8, rows: 7 },
                    timeLimit: 300,
                    targetScore: 10000,
                    availableModules: [
                        { id: 'quantum_analyzer', count: 1 },
                        { id: 'digital_twin', count: 1 },
                        { id: 'ai_predictor', count: 2 },
                        { id: 'brain_organoid', count: 1 },
                        { id: 'heart_organoid', count: 1 },
                        { id: 'organ_chip', count: 2 },
                        { id: 'bioreactor', count: 1 },
                        { id: 'data_hub', count: 3 },
                        { id: 'sensor_array', count: 3 },
                        { id: 'microfluidic_channel', count: 4 },
                        { id: 'nerve_connector', count: 4 },
                        { id: 'universal_hub', count: 3 },
                        { id: 'synth_tissue', count: 1 },
                        { id: 'nanobots', count: 1 }
                    ],
                    objectives: [
                        { type: 'place', target: 25, description: 'Place 25 modules' },
                        { type: 'connect', target: 24, description: 'Make 24 connections' },
                        { type: 'synergy', target: 5, description: 'Create 5 different synergies' },
                        { type: 'combo', target: 4.0, description: 'Reach 4x combo' },
                        { type: 'score', target: 8000, description: 'Score 8000+ points' }
                    ],
                    tips: [
                        'This is your ULTIMATE test, Kenneth!',
                        'Use everything you\'ve learned!',
                        'You can do this! I believe in you!'
                    ],
                    rewards: { xp: 2000, unlocks: ['crispr_editor', 'nanobots', 'synth_tissue'] },
                    starThresholds: { one: 6000, two: 8000, three: 10000 },
                    isBossLevel: true,
                    isLegendary: true
                }
            ]
        }
    ];
    
    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════
    
    function getAllEras() {
        return ERAS;
    }
    
    function getEra(eraId) {
        return ERAS.find(e => e.id === eraId);
    }
    
    function getLevel(levelId) {
        for (const era of ERAS) {
            const level = era.levels.find(l => l.id === levelId);
            if (level) {
                return { ...level, era };
            }
        }
        return null;
    }
    
    function getLevelsByEra(eraId) {
        const era = getEra(eraId);
        return era ? era.levels : [];
    }
    
    function getNextLevel(currentLevelId) {
        let foundCurrent = false;
        for (const era of ERAS) {
            for (const level of era.levels) {
                if (foundCurrent) return level.id;
                if (level.id === currentLevelId) foundCurrent = true;
            }
        }
        return null;
    }
    
    function getTotalLevelCount() {
        return ERAS.reduce((sum, era) => sum + era.levels.length, 0);
    }
    
    function isEraUnlocked(eraId, playerLevel) {
        const era = getEra(eraId);
        return era ? playerLevel >= era.unlockLevel : false;
    }
    
    return {
        getAllEras,
        getEra,
        getLevel,
        getLevelsByEra,
        getNextLevel,
        getTotalLevelCount,
        isEraUnlocked,
        ERAS
    };
})();

console.log(`🗺️ Kenneth's Levels loaded: ${KennethGame.Levels.getTotalLevelCount()} levels across ${KennethGame.Levels.getAllEras().length} eras!`);
