/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - Game Logic (FIXED)
 * Fixed: Sandbox mode, module availability, timer handling
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

KennethGame.GameLogic = (function() {
    const Utils = KennethGame.Utils;
    const CONSTANTS = KennethGame.CONSTANTS;
    
    // Game state
    let grid = [];
    let gridCols = 6;
    let gridRows = 5;
    let currentLevel = null;
    let isPlaying = false;
    let isPaused = false;
    let isSandbox = false;
    
    // Score & stats
    let score = 0;
    let combo = 1.0;
    let timeRemaining = 180;
    let maxTime = 180;
    let lastPlacementTime = 0;
    let boostActive = false;
    
    // Game objects
    let placedModules = [];
    let connections = [];
    let activeSynergies = [];
    let availableModules = [];
    let moveHistory = [];
    
    // Level stats
    let levelStats = {
        modulesPlaced: 0,
        connectionsFormed: 0,
        synergiesCreated: 0,
        maxCombo: 1.0
    };
    
    // Timer
    let timerInterval = null;
    
    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    function init() {
        console.log('🎮 Initializing game logic...');
        console.log('✅ Game logic ready!');
    }
    
    function initGrid(cols, rows) {
        gridCols = cols;
        gridRows = rows;
        grid = [];
        
        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                grid[r][c] = null;
            }
        }
    }
    
    function resetGameState() {
        score = 0;
        combo = 1.0;
        lastPlacementTime = 0;
        boostActive = false;
        placedModules = [];
        connections = [];
        activeSynergies = [];
        moveHistory = [];
        levelStats = {
            modulesPlaced: 0,
            connectionsFormed: 0,
            synergiesCreated: 0,
            maxCombo: 1.0
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // LEVEL MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    function startLevel(levelId) {
        console.log(`🎯 Starting level: ${levelId}`);
        
        const levelData = KennethGame.Levels?.getLevel?.(levelId);
        if (!levelData) {
            console.error('Level not found:', levelId);
            return false;
        }
        
        currentLevel = levelData;
        isSandbox = false;
        
        // Initialize grid
        const { cols, rows } = levelData.gridSize || { cols: 6, rows: 5 };
        initGrid(cols, rows);
        
        // Reset state
        resetGameState();
        
        // Setup time
        timeRemaining = levelData.timeLimit || 180;
        maxTime = timeRemaining;
        
        // Setup available modules (with counts)
        availableModules = (levelData.availableModules || []).map(m => ({
            id: m.id,
            count: m.count
        }));
        
        // Render
        KennethGame.Renderer?.renderGrid?.(cols, rows);
        KennethGame.Renderer?.renderModuleTray?.(availableModules);
        KennethGame.Renderer?.updateScore?.(score);
        KennethGame.Renderer?.updateTarget?.(levelData.targetScore || 500);
        KennethGame.Renderer?.updateTimer?.(timeRemaining, maxTime);
        KennethGame.Renderer?.updateCombo?.(combo);
        KennethGame.Renderer?.updatePowerUps?.(KennethGame.State?.getPowerUps?.() || {});
        KennethGame.Renderer?.updateSynergiesPanel?.([]);
        
        // Start game
        isPlaying = true;
        isPaused = false;
        startTimer();
        
        KennethGame.Audio?.playMotif?.();
        Utils?.showToast?.(Utils?.getEncouragement?.('onLevelStart') || "Let's go!", 'info');
        
        return true;
    }
    
    function startSandbox() {
        console.log('🧪 Starting sandbox mode...');
        
        isSandbox = true;
        
        // Big grid
        const cols = CONSTANTS?.GRID?.SANDBOX_COLS || 8;
        const rows = CONSTANTS?.GRID?.SANDBOX_ROWS || 6;
        initGrid(cols, rows);
        
        // Reset state
        resetGameState();
        
        // FIXED: Sandbox has unlimited time (set high number, not 0)
        timeRemaining = 99999;
        maxTime = 99999;
        
        // FIXED: All modules with proper count format
        availableModules = KennethGame.Modules?.getAll?.().map(m => ({
            id: m.id,
            count: 99
        })) || [];
        
        currentLevel = {
            id: 'sandbox',
            name: 'Sandbox Mode',
            targetScore: 0,
            gridSize: { cols, rows },
            timeLimit: 99999
        };
        
        // Render
        KennethGame.Renderer?.renderGrid?.(cols, rows);
        KennethGame.Renderer?.renderModuleTray?.(availableModules);
        KennethGame.Renderer?.updateScore?.(score);
        KennethGame.Renderer?.updateTarget?.('∞');
        KennethGame.Renderer?.updateTimer?.(999, 999);
        KennethGame.Renderer?.updateCombo?.(combo);
        KennethGame.Renderer?.updatePowerUps?.({ hint: 99, undo: 99, boost: 99, time: 99 });
        KennethGame.Renderer?.updateSynergiesPanel?.([]);
        
        // Start (no timer countdown in sandbox)
        isPlaying = true;
        isPaused = false;
        
        // Hide timer in sandbox
        const timerEl = document.getElementById('game-timer');
        if (timerEl) timerEl.textContent = '∞';
        const timerFill = document.getElementById('timer-fill');
        if (timerFill) timerFill.style.width = '100%';
        
        Utils?.showToast?.('Sandbox Mode - Build freely!', 'success');
        
        return true;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // TIMER
    // ═══════════════════════════════════════════════════════════════════════
    
    function startTimer() {
        stopTimer();
        
        if (isSandbox) return; // No timer in sandbox
        
        timerInterval = setInterval(() => {
            if (!isPlaying || isPaused) return;
            
            timeRemaining--;
            KennethGame.Renderer?.updateTimer?.(timeRemaining, maxTime);
            
            // Combo decay
            const timeSinceLast = Date.now() - lastPlacementTime;
            if (timeSinceLast > (CONSTANTS?.TIMERS?.COMBO_DECAY || 3000)) {
                combo = 1.0;
                KennethGame.Renderer?.updateCombo?.(combo);
            }
            
            // Warning sounds
            if (timeRemaining === 60) {
                Utils?.showToast?.('⏰ One minute left!', 'warning');
            } else if (timeRemaining === 30) {
                Utils?.showToast?.('⚠️ 30 seconds!', 'warning');
                KennethGame.Audio?.playWarning?.();
            } else if (timeRemaining <= 10 && timeRemaining > 0) {
                KennethGame.Audio?.playWarning?.();
            }
            
            // Time's up
            if (timeRemaining <= 0) {
                endLevel(false);
            }
        }, 1000);
    }
    
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // MODULE PLACEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    function canPlaceModule(moduleId, col, row) {
        if (!isPlaying || isPaused) return false;
        if (col < 0 || col >= gridCols || row < 0 || row >= gridRows) return false;
        if (grid[row][col] !== null) return false;
        
        const trayModule = availableModules.find(m => m.id === moduleId);
        if (!trayModule || trayModule.count <= 0) return false;
        
        return true;
    }
    
    function placeModule(moduleId, col, row) {
        if (!canPlaceModule(moduleId, col, row)) {
            KennethGame.Audio?.playError?.();
            return false;
        }
        
        const module = KennethGame.Modules?.getById?.(moduleId);
        if (!module) return false;
        
        // Place on grid
        const placedModule = { ...module, col, row, placedAt: Date.now() };
        grid[row][col] = placedModule;
        placedModules.push(placedModule);
        
        // Reduce available count
        const trayModule = availableModules.find(m => m.id === moduleId);
        if (trayModule) trayModule.count--;
        
        // Save to history
        moveHistory.push({ type: 'place', module: placedModule, col, row });
        
        // Update combo
        updateCombo();
        
        // Calculate score
        let points = calculatePlacementScore(placedModule);
        
        if (boostActive) {
            points *= 3;
            boostActive = false;
            Utils?.showToast?.('🚀 BOOST! x3 points!', 'success');
        }
        
        addScore(points);
        levelStats.modulesPlaced++;
        
        // Check connections
        const newConnections = findNewConnections(col, row);
        newConnections.forEach(conn => {
            connections.push(conn);
            levelStats.connectionsFormed++;
            addScore(calculateConnectionScore(conn));
            KennethGame.Audio?.playConnection?.();
        });
        
        // Check synergies
        const newSynergies = checkSynergies();
        newSynergies.forEach(synergy => {
            if (!activeSynergies.find(s => s.id === synergy.id)) {
                activeSynergies.push(synergy);
                levelStats.synergiesCreated++;
                addScore(synergy.bonus);
                KennethGame.Audio?.playSynergy?.();
                KennethGame.Renderer?.addSynergyToPanel?.(synergy);
                Utils?.showToast?.(`✨ ${synergy.name}! +${synergy.bonus}`, 'success');
            }
        });
        
        // Visual feedback
        KennethGame.Audio?.playPlacement?.();
        KennethGame.Renderer?.updateCell?.(col, row, placedModule);
        KennethGame.Renderer?.updateModuleTray?.(availableModules);
        KennethGame.Renderer?.updateConnections?.(connections);
        KennethGame.Renderer?.animatePlacement?.(col, row);
        
        // Check level complete
        if (!isSandbox) {
            checkLevelComplete();
        }
        
        return true;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SCORING
    // ═══════════════════════════════════════════════════════════════════════
    
    function calculatePlacementScore(module) {
        const base = CONSTANTS?.SCORING?.BASE_PLACEMENT || 50;
        const modulePoints = module.basePoints || 0;
        return Math.floor((base + modulePoints) * combo);
    }
    
    function calculateConnectionScore(connection) {
        let points = CONSTANTS?.SCORING?.CONNECTION_POINTS || 25;
        
        if (connection.from.portType === connection.to.portType) {
            points += CONSTANTS?.SCORING?.PERFECT_CONNECTION || 100;
        }
        
        const typeBonus = CONSTANTS?.CONNECTION_TYPES?.[connection.type]?.bonusPoints || 0;
        points += typeBonus;
        
        return Math.floor(points * combo);
    }
    
    function addScore(points) {
        score += points;
        KennethGame.Renderer?.updateScore?.(score);
        
        if (!isSandbox && currentLevel?.targetScore && score >= currentLevel.targetScore) {
            KennethGame.Renderer?.highlightTargetReached?.();
        }
    }
    
    function updateCombo() {
        const now = Date.now();
        const timeSinceLast = now - lastPlacementTime;
        const decayTime = CONSTANTS?.TIMERS?.COMBO_DECAY || 3000;
        
        if (timeSinceLast < decayTime) {
            combo = Math.min(
                CONSTANTS?.SCORING?.MAX_COMBO || 5.0,
                combo + (CONSTANTS?.SCORING?.COMBO_INCREMENT || 0.2)
            );
            
            if (combo > levelStats.maxCombo) {
                levelStats.maxCombo = combo;
            }
            
            if (combo >= 2.0) {
                KennethGame.Audio?.playCombo?.(Math.floor(combo));
            }
        } else {
            combo = 1.0;
        }
        
        lastPlacementTime = now;
        KennethGame.Renderer?.updateCombo?.(combo);
    }
    
    function calculateStars() {
        if (!currentLevel?.targetScore) return 0;
        
        const thresholds = currentLevel.starThresholds || {
            one: currentLevel.targetScore * 0.4,
            two: currentLevel.targetScore * 0.7,
            three: currentLevel.targetScore * 0.95
        };
        
        if (score >= thresholds.three) return 3;
        if (score >= thresholds.two) return 2;
        if (score >= thresholds.one) return 1;
        return 0;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONNECTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    function findNewConnections(col, row) {
        const module = grid[row]?.[col];
        if (!module) return [];
        
        const newConnections = [];
        const adjacent = Utils?.getAdjacentCells?.(col, row) || [];
        
        adjacent.forEach(adj => {
            if (adj.col < 0 || adj.col >= gridCols || adj.row < 0 || adj.row >= gridRows) return;
            
            const adjModule = grid[adj.row]?.[adj.col];
            if (!adjModule) return;
            
            // Already connected?
            const exists = connections.some(c =>
                (c.from.col === col && c.from.row === row && c.to.col === adj.col && c.to.row === adj.row) ||
                (c.to.col === col && c.to.row === row && c.from.col === adj.col && c.from.row === adj.row)
            );
            if (exists) return;
            
            // Check ports
            const myPort = module.ports?.[adj.direction];
            const theirPort = adjModule.ports?.[Utils?.getOppositePort?.(adj.direction)];
            
            if (!myPort || !theirPort) return;
            
            if (KennethGame.Modules?.arePortsCompatible?.(myPort, theirPort)) {
                newConnections.push({
                    from: { col, row, portType: myPort, module },
                    to: { col: adj.col, row: adj.row, portType: theirPort, module: adjModule },
                    type: myPort === 'universal' ? theirPort : myPort,
                    direction: adj.direction
                });
            }
        });
        
        return newConnections;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SYNERGIES
    // ═══════════════════════════════════════════════════════════════════════
    
    function checkSynergies() {
        const newSynergies = [];
        const allSynergies = CONSTANTS?.SYNERGIES || {};
        const placedIds = placedModules.map(m => m.id);
        
        Object.entries(allSynergies).forEach(([id, synergy]) => {
            const hasAll = synergy.modules.every(req => placedIds.includes(req));
            
            if (hasAll && !activeSynergies.find(s => s.id === id)) {
                newSynergies.push({ id, ...synergy });
            }
        });
        
        return newSynergies;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // LEVEL END
    // ═══════════════════════════════════════════════════════════════════════
    
    function checkLevelComplete() {
        if (isSandbox) return;
        
        // Check if all modules used
        const allUsed = availableModules.every(m => m.count <= 0);
        
        if (allUsed) {
            endLevel(true);
        }
    }
    
    function endLevel(success) {
        isPlaying = false;
        stopTimer();
        
        if (isSandbox) return;
        
        if (success) {
            const stars = calculateStars();
            const timeBonus = Math.floor(timeRemaining * (CONSTANTS?.SCORING?.TIME_BONUS_RATE || 3));
            const finalScore = score + timeBonus;
            
            // Save progress
            const result = KennethGame.State?.completeLevel?.(
                currentLevel.id,
                finalScore,
                stars,
                levelStats
            );
            
            KennethGame.UI?.showLevelComplete?.({
                score: finalScore,
                stars,
                timeBonus,
                connections: levelStats.connectionsFormed,
                xpGained: result?.xpGained || 0,
                leveledUp: result?.leveledUp || false,
                newLevel: result?.newLevel || 1
            });
            
            window.bobCelebrate?.();
        } else {
            KennethGame.UI?.showGameOver?.(score, currentLevel?.targetScore || 0);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // POWER-UPS
    // ═══════════════════════════════════════════════════════════════════════
    
    function usePowerUp(type) {
        if (!isPlaying || isPaused) return false;
        
        const powerUps = KennethGame.State?.getPowerUps?.() || {};
        if (!powerUps[type] || powerUps[type] <= 0) {
            Utils?.showToast?.('No power-ups left!', 'warning');
            return false;
        }
        
        switch (type) {
            case 'hint':
                showHint();
                break;
            case 'undo':
                undoLastMove();
                break;
            case 'boost':
                boostActive = true;
                Utils?.showToast?.('🚀 Next placement: 3x points!', 'success');
                break;
            case 'time':
                timeRemaining += 30;
                if (timeRemaining > maxTime) maxTime = timeRemaining;
                KennethGame.Renderer?.updateTimer?.(timeRemaining, maxTime);
                Utils?.showToast?.('⏰ +30 seconds!', 'success');
                break;
        }
        
        KennethGame.State?.usePowerUp?.(type);
        KennethGame.Renderer?.updatePowerUps?.(KennethGame.State?.getPowerUps?.() || {});
        KennethGame.Audio?.playPowerUp?.();
        
        return true;
    }
    
    function showHint() {
        Utils?.showToast?.('💡 Try connecting matching port colors!', 'info');
    }
    
    function undoLastMove() {
        if (moveHistory.length === 0) {
            Utils?.showToast?.('Nothing to undo!', 'warning');
            return;
        }
        
        const lastMove = moveHistory.pop();
        if (lastMove.type === 'place') {
            const { col, row, module } = lastMove;
            
            // Remove from grid
            grid[row][col] = null;
            placedModules = placedModules.filter(m => !(m.col === col && m.row === row));
            
            // Restore to tray
            const trayModule = availableModules.find(m => m.id === module.id);
            if (trayModule) trayModule.count++;
            
            // Remove connections
            connections = connections.filter(c =>
                !(c.from.col === col && c.from.row === row) &&
                !(c.to.col === col && c.to.row === row)
            );
            
            // Update render
            KennethGame.Renderer?.updateCell?.(col, row, null);
            KennethGame.Renderer?.updateModuleTray?.(availableModules);
            KennethGame.Renderer?.updateConnections?.(connections);
            
            Utils?.showToast?.('↩️ Move undone!', 'info');
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // GAME CONTROLS
    // ═══════════════════════════════════════════════════════════════════════
    
    function pause() {
        if (!isPlaying) return;
        isPaused = true;
        KennethGame.UI?.showPause?.(score, timeRemaining);
    }
    
    function resume() {
        isPaused = false;
    }
    
    function restartLevel() {
        if (isSandbox) {
            startSandbox();
        } else if (currentLevel) {
            startLevel(currentLevel.id);
        }
    }
    
    function nextLevel() {
        if (!currentLevel || isSandbox) return;
        
        const nextLevelId = KennethGame.Levels?.getNextLevel?.(currentLevel.id);
        if (nextLevelId) {
            startLevel(nextLevelId);
            KennethGame.UI?.showScreen?.('game');
        } else {
            Utils?.showToast?.('🎉 You completed all levels!', 'success');
            KennethGame.UI?.showScreen?.('menu');
        }
    }
    
    function quitToMenu() {
        isPlaying = false;
        stopTimer();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // GETTERS
    // ═══════════════════════════════════════════════════════════════════════
    
    function getScore() { return score; }
    function getCombo() { return combo; }
    function getTimeRemaining() { return timeRemaining; }
    function isGamePlaying() { return isPlaying; }
    function isGamePaused() { return isPaused; }
    function getCurrentLevel() { return currentLevel; }
    
    return {
        init,
        startLevel,
        startSandbox,
        canPlaceModule,
        placeModule,
        usePowerUp,
        pause,
        resume,
        restartLevel,
        nextLevel,
        quitToMenu,
        getScore,
        getCombo,
        getTimeRemaining,
        isGamePlaying,
        isGamePaused,
        getCurrentLevel
    };
})();

console.log('🎮 Game Logic loaded!');
// v20260117-FULL
