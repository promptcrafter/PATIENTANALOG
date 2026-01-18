/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - State Management (FIXED)
 * Fixed: Storage keys, XP infinite loop protection, proper initialization
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

KennethGame.State = (function() {
    const CONSTANTS = KennethGame.CONSTANTS;
    
    // Default player state
    const defaultPlayer = {
        name: 'Kenneth',
        level: 1,
        xp: 0,
        highScore: 0,
        totalScore: 0,
        totalStars: 0,
        levelsCompleted: {},
        modulesUnlocked: ['heart', 'brain', 'lung', 'liver', 'kidney', 'blood_vessel', 'nerve_connector', 'fluid_channel', 'universal_hub', 'eye'],
        achievementsUnlocked: [],
        powerUps: {
            hint: 3,
            undo: 5,
            boost: 2,
            time: 1
        },
        labBuddies: {
            active: 'helix',
            unlocked: ['helix', 'luna'],
            treats: 0
        },
        settings: {
            soundEnabled: true,
            musicEnabled: true,
            particlesEnabled: true,
            highContrast: false,
            reducedMotion: false,
            tutorialCompleted: false
        },
        statistics: {
            totalPlayTime: 0,
            modulesPlaced: 0,
            connectionsFormed: 0,
            synergiesCreated: 0,
            gamesPlayed: 0
        },
        createdAt: Date.now(),
        lastPlayedAt: Date.now()
    };
    
    let player = null;
    
    // ═══════════════════════════════════════════════════════════════════════
    // STORAGE - FIXED: Now uses CONSTANTS.STORAGE properly
    // ═══════════════════════════════════════════════════════════════════════
    
    function save() {
        try {
            player.lastPlayedAt = Date.now();
            const saveKey = CONSTANTS.STORAGE?.SAVE_DATA || 'kenneth_biotech_save';
            const highScoreKey = CONSTANTS.STORAGE?.HIGH_SCORE || 'kenneth_biotech_highscore';
            
            localStorage.setItem(saveKey, JSON.stringify(player));
            localStorage.setItem(highScoreKey, player.highScore.toString());
            console.log('💾 Game saved!');
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }
    
    function load() {
        try {
            const saveKey = CONSTANTS.STORAGE?.SAVE_DATA || 'kenneth_biotech_save';
            const saved = localStorage.getItem(saveKey);
            
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure all fields exist
                player = mergeDeep(JSON.parse(JSON.stringify(defaultPlayer)), parsed);
                console.log('📂 Game loaded!');
                return true;
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
        
        player = JSON.parse(JSON.stringify(defaultPlayer));
        return false;
    }
    
    function reset() {
        const saveKey = CONSTANTS.STORAGE?.SAVE_DATA || 'kenneth_biotech_save';
        const highScoreKey = CONSTANTS.STORAGE?.HIGH_SCORE || 'kenneth_biotech_highscore';
        
        localStorage.removeItem(saveKey);
        localStorage.removeItem(highScoreKey);
        player = JSON.parse(JSON.stringify(defaultPlayer));
        console.log('🔄 Game reset!');
    }
    
    function mergeDeep(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                target[key] = target[key] || {};
                mergeDeep(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PLAYER NAME
    // ═══════════════════════════════════════════════════════════════════════
    
    function setPlayerName(name) {
        if (!name || typeof name !== 'string') return false;
        name = name.trim().substring(0, 20);
        if (name.length === 0) return false;
        
        player.name = name;
        save();
        return true;
    }
    
    function getPlayerName() {
        return player?.name || 'Kenneth';
    }
    
    function hasPlayerName() {
        return player?.name && player.name !== 'Kenneth' && player.name.length > 0;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // XP & LEVELING - FIXED: Added max level protection against infinite loop
    // ═══════════════════════════════════════════════════════════════════════
    
    function getXpForLevel(level) {
        const base = CONSTANTS.PROGRESSION?.BASE_XP || 100;
        const multiplier = CONSTANTS.PROGRESSION?.LEVEL_XP_MULTIPLIER || 1.15;
        return Math.floor(base * Math.pow(multiplier, level - 1));
    }
    
    function getCurrentLevelXp() {
        return getXpForLevel(player.level);
    }
    
    function getXpProgress() {
        const currentLevelXp = getXpForLevel(player.level);
        const nextLevelXp = getXpForLevel(player.level + 1);
        const xpNeeded = nextLevelXp - currentLevelXp;
        return {
            current: player.xp,
            needed: xpNeeded,
            percent: Math.min(100, (player.xp / xpNeeded) * 100)
        };
    }
    
    function addXp(amount) {
        if (amount <= 0) return { leveledUp: false, newLevel: player.level };
        
        player.xp += amount;
        let leveledUp = false;
        const startLevel = player.level;
        const maxLevel = CONSTANTS.PROGRESSION?.MAX_LEVEL || 50;
        
        // FIXED: Added max level check to prevent infinite loop
        let iterations = 0;
        const maxIterations = 100; // Safety limit
        
        while (player.level < maxLevel && iterations < maxIterations) {
            const xpNeeded = getXpForLevel(player.level + 1) - getXpForLevel(player.level);
            if (player.xp >= xpNeeded) {
                player.xp -= xpNeeded;
                player.level++;
                leveledUp = true;
                
                // Unlock new modules for this level
                checkModuleUnlocks();
            } else {
                break;
            }
            iterations++;
        }
        
        if (leveledUp) {
            save();
            console.log(`🎉 Level up! Now level ${player.level}`);
        }
        
        return {
            leveledUp,
            newLevel: player.level,
            levelsGained: player.level - startLevel
        };
    }
    
    function checkModuleUnlocks() {
        const unlocks = CONSTANTS.PROGRESSION?.MODULE_UNLOCK_LEVELS || {};
        
        Object.entries(unlocks).forEach(([moduleId, unlockLevel]) => {
            if (player.level >= unlockLevel && !player.modulesUnlocked.includes(moduleId)) {
                player.modulesUnlocked.push(moduleId);
                console.log(`🔓 Unlocked module: ${moduleId}`);
            }
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SCORES & PROGRESS
    // ═══════════════════════════════════════════════════════════════════════
    
    function updateScore(score) {
        player.totalScore += score;
        if (score > player.highScore) {
            player.highScore = score;
        }
        save();
    }
    
    function getHighScore() {
        return player?.highScore || 0;
    }
    
    function completeLevel(levelId, score, stars, stats = {}) {
        const existing = player.levelsCompleted[levelId] || {};
        
        player.levelsCompleted[levelId] = {
            completed: true,
            bestScore: Math.max(existing.bestScore || 0, score),
            stars: Math.max(existing.stars || 0, stars),
            attempts: (existing.attempts || 0) + 1,
            lastPlayed: Date.now()
        };
        
        // Update total stars
        let totalStars = 0;
        Object.values(player.levelsCompleted).forEach(level => {
            totalStars += level.stars || 0;
        });
        player.totalStars = totalStars;
        
        // Update statistics
        if (stats) {
            player.statistics.modulesPlaced += stats.modulesPlaced || 0;
            player.statistics.connectionsFormed += stats.connectionsFormed || 0;
            player.statistics.synergiesCreated += stats.synergiesCreated || 0;
        }
        player.statistics.gamesPlayed++;
        
        // Calculate XP
        let xpGained = CONSTANTS.PROGRESSION?.XP_FOR_COMPLETION || 50;
        xpGained += stars * (CONSTANTS.PROGRESSION?.XP_PER_STAR || 30);
        
        if (score > (existing.bestScore || 0)) {
            xpGained += CONSTANTS.PROGRESSION?.XP_FOR_NEW_HIGH_SCORE || 25;
        }
        
        const levelResult = addXp(xpGained);
        
        updateScore(score);
        save();
        
        return {
            xpGained,
            ...levelResult
        };
    }
    
    function getLevelProgress(levelId) {
        return player.levelsCompleted[levelId] || null;
    }
    
    function isLevelCompleted(levelId) {
        return player.levelsCompleted[levelId]?.completed || false;
    }
    
    function getLevelStars(levelId) {
        return player.levelsCompleted[levelId]?.stars || 0;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // POWER-UPS
    // ═══════════════════════════════════════════════════════════════════════
    
    function getPowerUps() {
        return { ...player.powerUps };
    }
    
    function usePowerUp(type) {
        if (!player.powerUps[type] || player.powerUps[type] <= 0) {
            return false;
        }
        player.powerUps[type]--;
        save();
        return true;
    }
    
    function addPowerUp(type, amount = 1) {
        if (!player.powerUps.hasOwnProperty(type)) return false;
        player.powerUps[type] += amount;
        save();
        return true;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════════════
    
    function getSetting(key) {
        return player.settings[key];
    }
    
    function setSetting(key, value) {
        if (player.settings.hasOwnProperty(key)) {
            player.settings[key] = value;
            save();
            return true;
        }
        return false;
    }
    
    function getSettings() {
        return { ...player.settings };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // LAB BUDDIES
    // ═══════════════════════════════════════════════════════════════════════
    
    function getActiveBuddy() {
        return player.labBuddies.active;
    }
    
    function setActiveBuddy(buddyId) {
        if (player.labBuddies.unlocked.includes(buddyId)) {
            player.labBuddies.active = buddyId;
            save();
            return true;
        }
        return false;
    }
    
    function getUnlockedBuddies() {
        return [...player.labBuddies.unlocked];
    }
    
    function unlockBuddy(buddyId) {
        if (!player.labBuddies.unlocked.includes(buddyId)) {
            player.labBuddies.unlocked.push(buddyId);
            save();
            return true;
        }
        return false;
    }
    
    function addTreats(amount) {
        player.labBuddies.treats += amount;
        save();
    }
    
    function getTreats() {
        return player.labBuddies.treats;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // TITLES
    // ═══════════════════════════════════════════════════════════════════════
    
    function getTitle() {
        const titles = CONSTANTS.TITLES || [];
        let currentTitle = titles[0] || { title: 'Lab Assistant', emoji: '🔬' };
        
        for (const t of titles) {
            if (player.level >= t.level) {
                currentTitle = t;
            }
        }
        
        return currentTitle;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // GETTERS
    // ═══════════════════════════════════════════════════════════════════════
    
    function getLevel() {
        return player?.level || 1;
    }
    
    function getXp() {
        return player?.xp || 0;
    }
    
    function getTotalStars() {
        return player?.totalStars || 0;
    }
    
    function getStatistics() {
        return { ...player.statistics };
    }
    
    function getUnlockedModules() {
        return [...player.modulesUnlocked];
    }
    
    function isModuleUnlocked(moduleId) {
        return player.modulesUnlocked.includes(moduleId);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    function init() {
        load();
        console.log(`👤 Player: ${player.name} | Level ${player.level} | ${player.totalStars}⭐`);
    }
    
    // Initialize on load
    init();
    
    return {
        save,
        load,
        reset,
        setPlayerName,
        getPlayerName,
        hasPlayerName,
        getXpForLevel,
        getCurrentLevelXp,
        getXpProgress,
        addXp,
        updateScore,
        getHighScore,
        completeLevel,
        getLevelProgress,
        isLevelCompleted,
        getLevelStars,
        getPowerUps,
        usePowerUp,
        addPowerUp,
        getSetting,
        setSetting,
        getSettings,
        getActiveBuddy,
        setActiveBuddy,
        getUnlockedBuddies,
        unlockBuddy,
        addTreats,
        getTreats,
        getTitle,
        getLevel,
        getXp,
        getTotalStars,
        getStatistics,
        getUnlockedModules,
        isModuleUnlocked
    };
})();

console.log('💾 State management loaded!');
// v20260117-FULL
