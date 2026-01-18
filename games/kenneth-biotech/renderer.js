/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - Renderer (FIXED)
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

KennethGame.Renderer = (function() {
    const Utils = KennethGame.Utils;
    const $ = Utils.$;
    const CONSTANTS = KennethGame.CONSTANTS;
    
    let gridElement = null;
    let svgElement = null;
    let trayElement = null;
    let gridCols = 6;
    let gridRows = 5;
    let cellSize = 70;
    let cellGap = 6;
    
    // Drag state
    let draggedModule = null;
    
    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    function init() {
        console.log('🎨 Initializing renderer...');
        gridElement = $('game-grid');
        svgElement = $('connections-svg');
        trayElement = $('module-tray');
        
        cellSize = CONSTANTS?.GRID?.CELL_SIZE || 70;
        cellGap = CONSTANTS?.GRID?.GAP || 6;
        
        console.log('✅ Renderer initialized!');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // GRID RENDERING
    // ═══════════════════════════════════════════════════════════════════════
    
    function renderGrid(cols, rows) {
        if (!gridElement) return;
        
        gridCols = cols;
        gridRows = rows;
        
        gridElement.innerHTML = '';
        gridElement.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        gridElement.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.col = col;
                cell.dataset.row = row;
                
                // Drop events
                cell.addEventListener('dragover', handleDragOver);
                cell.addEventListener('dragleave', handleDragLeave);
                cell.addEventListener('drop', handleDrop);
                cell.addEventListener('click', handleCellClick);
                
                gridElement.appendChild(cell);
            }
        }
        
        // Update SVG size
        if (svgElement) {
            const width = cols * (cellSize + cellGap);
            const height = rows * (cellSize + cellGap);
            svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
    }
    
    function updateCell(col, row, module) {
        const cell = gridElement?.querySelector(`[data-col="${col}"][data-row="${row}"]`);
        if (!cell) return;
        
        cell.innerHTML = '';
        
        if (module) {
            cell.classList.add('occupied');
            
            const moduleEl = document.createElement('div');
            moduleEl.className = 'placed-module';
            moduleEl.style.setProperty('--glow-color', module.glowColor || 'rgba(0,245,255,0.5)');
            
            // Module icon
            const icon = document.createElement('span');
            icon.className = 'module-icon';
            icon.textContent = module.icon;
            moduleEl.appendChild(icon);
            
            // Ports
            ['top', 'right', 'bottom', 'left'].forEach(dir => {
                if (module.ports && module.ports[dir]) {
                    const port = document.createElement('div');
                    port.className = `port ${dir} ${module.ports[dir]}`;
                    moduleEl.appendChild(port);
                }
            });
            
            cell.appendChild(moduleEl);
        } else {
            cell.classList.remove('occupied');
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // MODULE TRAY
    // ═══════════════════════════════════════════════════════════════════════
    
    function renderModuleTray(modules) {
        if (!trayElement) return;
        
        trayElement.innerHTML = '';
        
        modules.forEach(item => {
            if (item.count <= 0) return;
            
            const module = KennethGame.Modules?.getById?.(item.id);
            if (!module) return;
            
            const card = document.createElement('div');
            card.className = 'module-card';
            card.draggable = true;
            card.dataset.moduleId = item.id;
            
            card.innerHTML = `
                <span class="module-icon">${module.icon}</span>
                <span class="module-name">${module.name}</span>
                <span class="module-count">${item.count}</span>
            `;
            
            // Drag events
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
            card.addEventListener('click', () => selectModule(item.id));
            
            trayElement.appendChild(card);
        });
    }
    
    function updateModuleTray(modules) {
        renderModuleTray(modules);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // DRAG & DROP
    // ═══════════════════════════════════════════════════════════════════════
    
    function handleDragStart(e) {
        const moduleId = e.target.dataset.moduleId;
        draggedModule = moduleId;
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', moduleId);
        e.dataTransfer.effectAllowed = 'move';
    }
    
    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        draggedModule = null;
        
        // Remove all highlights
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('valid-drop', 'invalid-drop');
        });
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        
        const col = parseInt(e.target.dataset.col);
        const row = parseInt(e.target.dataset.row);
        
        if (KennethGame.GameLogic?.canPlaceModule?.(draggedModule, col, row)) {
            e.target.classList.add('valid-drop');
            e.target.classList.remove('invalid-drop');
            e.dataTransfer.dropEffect = 'move';
        } else {
            e.target.classList.add('invalid-drop');
            e.target.classList.remove('valid-drop');
            e.dataTransfer.dropEffect = 'none';
        }
    }
    
    function handleDragLeave(e) {
        e.target.classList.remove('valid-drop', 'invalid-drop');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.target.classList.remove('valid-drop', 'invalid-drop');
        
        const moduleId = e.dataTransfer.getData('text/plain');
        const col = parseInt(e.target.dataset.col);
        const row = parseInt(e.target.dataset.row);
        
        KennethGame.GameLogic?.placeModule?.(moduleId, col, row);
    }
    
    // Click to place
    let selectedModule = null;
    
    function selectModule(moduleId) {
        selectedModule = moduleId;
        
        document.querySelectorAll('.module-card').forEach(card => {
            card.style.outline = card.dataset.moduleId === moduleId ? '3px solid var(--color-cyan)' : '';
        });
    }
    
    function handleCellClick(e) {
        if (!selectedModule) return;
        
        const col = parseInt(e.currentTarget.dataset.col);
        const row = parseInt(e.currentTarget.dataset.row);
        
        if (KennethGame.GameLogic?.placeModule?.(selectedModule, col, row)) {
            selectedModule = null;
            document.querySelectorAll('.module-card').forEach(card => {
                card.style.outline = '';
            });
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONNECTIONS SVG
    // ═══════════════════════════════════════════════════════════════════════
    
    function updateConnections(connections) {
        if (!svgElement) return;
        
        svgElement.innerHTML = '';
        
        connections.forEach(conn => {
            const from = getCellCenter(conn.from.col, conn.from.row);
            const to = getCellCenter(conn.to.col, conn.to.row);
            
            const color = CONSTANTS?.CONNECTION_TYPES?.[conn.type]?.color || '#00f5ff';
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', from.x);
            line.setAttribute('y1', from.y);
            line.setAttribute('x2', to.x);
            line.setAttribute('y2', to.y);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', '4');
            line.setAttribute('stroke-linecap', 'round');
            line.style.filter = `drop-shadow(0 0 5px ${color})`;
            
            svgElement.appendChild(line);
        });
    }
    
    function getCellCenter(col, row) {
        const x = col * (cellSize + cellGap) + cellSize / 2 + cellGap;
        const y = row * (cellSize + cellGap) + cellSize / 2 + cellGap;
        return { x, y };
    }
    
    function getCellPosition(col, row) {
        if (!gridElement) return null;
        const cell = gridElement.querySelector(`[data-col="${col}"][data-row="${row}"]`);
        if (!cell) return null;
        const rect = cell.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UI UPDATES
    // ═══════════════════════════════════════════════════════════════════════
    
    function updateScore(score) {
        const el = $('game-score');
        if (el) el.textContent = Utils.formatNumber(score);
    }
    
    function updateTimer(seconds, maxSeconds) {
        const el = $('game-timer');
        if (el) el.textContent = Utils.formatTime(seconds);
        
        const fill = $('timer-fill');
        if (fill) {
            const percent = (seconds / maxSeconds) * 100;
            fill.style.width = `${percent}%`;
            
            fill.classList.remove('warning', 'critical');
            if (seconds <= 30) {
                fill.classList.add('critical');
            } else if (seconds <= 60) {
                fill.classList.add('warning');
            }
        }
    }
    
    function updateTarget(target) {
        const el = $('game-target');
        if (el) el.textContent = Utils.formatNumber(target);
    }
    
    function updateCombo(combo) {
        const indicator = $('combo-indicator');
        const value = $('combo-value');
        
        if (indicator && value) {
            value.textContent = `x${combo.toFixed(1)}`;
            indicator.classList.toggle('active', combo > 1);
        }
    }
    
    function updatePowerUps(powerUps) {
        ['hint', 'undo', 'boost', 'time'].forEach(type => {
            const el = $(`${type}-count`);
            if (el) el.textContent = powerUps[type] || 0;
            
            const btn = document.querySelector(`[data-power="${type}"]`);
            if (btn) btn.disabled = !powerUps[type] || powerUps[type] <= 0;
        });
    }
    
    function highlightTargetReached() {
        const scoreEl = $('game-score');
        if (scoreEl) {
            scoreEl.style.color = 'var(--color-gold)';
            scoreEl.style.textShadow = '0 0 20px rgba(255,215,0,0.8)';
        }
    }
    
    function updateSynergiesPanel(synergies) {
        const panel = $('synergy-list');
        if (!panel) return;
        
        if (synergies.length === 0) {
            panel.innerHTML = '<p style="color: var(--text-secondary); font-size: 12px;">Connect modules to create synergies!</p>';
            return;
        }
        
        panel.innerHTML = synergies.map(s => `
            <div style="margin: 5px 0; padding: 5px; background: rgba(255,215,0,0.1); border-radius: 5px;">
                <span style="font-size: 14px;">${s.icon || '✨'}</span>
                <span style="font-size: 11px; color: var(--color-gold);">${s.name}</span>
            </div>
        `).join('');
    }
    
    function addSynergyToPanel(synergy) {
        const panel = $('synergy-list');
        if (!panel) return;
        
        if (panel.querySelector('p')) panel.innerHTML = '';
        
        const div = document.createElement('div');
        div.style.cssText = 'margin: 5px 0; padding: 5px; background: rgba(255,215,0,0.1); border-radius: 5px;';
        div.innerHTML = `<span style="font-size: 14px;">${synergy.icon || '✨'}</span>
            <span style="font-size: 11px; color: var(--color-gold);">${synergy.name}</span>`;
        panel.appendChild(div);
    }
    
    function animatePlacement(col, row) {
        const cell = gridElement?.querySelector(`[data-col="${col}"][data-row="${row}"]`);
        if (cell) {
            cell.style.animation = 'placeModule 0.3s ease-out';
            setTimeout(() => { cell.style.animation = ''; }, 300);
        }
    }
    
    function animateConnection() {}
    function handleResize() {}
    
    return {
        init, renderGrid, updateCell, renderModuleTray, updateModuleTray,
        updateConnections, getCellPosition, updateScore, updateTimer,
        updateTarget, updateCombo, updatePowerUps, highlightTargetReached,
        updateSynergiesPanel, addSynergyToPanel, animatePlacement,
        animateConnection, handleResize
    };
})();

console.log('🎨 Renderer loaded!');
// v20260117-FULL
