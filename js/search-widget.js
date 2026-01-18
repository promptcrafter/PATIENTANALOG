/**
 * PatientAnalog Internal Search Engine
 * Language-aware, no external dependencies, no tracking
 */
const PASearch = (function() {
    'use strict';
    
    let searchIndex = null;
    let currentLang = document.documentElement.lang || 'en';
    
    async function loadIndex() {
        if (searchIndex) return searchIndex;
        
        try {
            const response = await fetch('/search-index.json');
            searchIndex = await response.json();
            console.log('[PASearch] Index loaded:', searchIndex.entries.length, 'entries');
            return searchIndex;
        } catch (error) {
            console.error('[PASearch] Failed to load index:', error);
            return null;
        }
    }
    
    function normalizeQuery(query) {
        return query.toLowerCase().trim().split(/\s+/);
    }
    
    function scoreEntry(entry, queryTerms) {
        let score = 0;
        const title = (entry.title[currentLang] || entry.title.en || '').toLowerCase();
        const keywords = entry.keywords.map(k => k.toLowerCase());
        
        queryTerms.forEach(term => {
            // Exact title match
            if (title.includes(term)) score += 10;
            
            // Keyword match
            keywords.forEach(kw => {
                if (kw === term) score += 8;
                else if (kw.includes(term)) score += 4;
            });
            
            // ID match
            if (entry.id.includes(term)) score += 5;
            
            // Category match
            if (entry.category.includes(term)) score += 2;
        });
        
        // Priority boost
        score *= (4 - entry.priority) / 3;
        
        return score;
    }
    
    async function search(query, options = {}) {
        const index = await loadIndex();
        if (!index) return [];
        
        const queryTerms = normalizeQuery(query);
        if (queryTerms.length === 0) return [];
        
        const limit = options.limit || 10;
        const category = options.category || null;
        
        let results = index.entries
            .filter(entry => !category || entry.category === category)
            .map(entry => ({
                ...entry,
                score: scoreEntry(entry, queryTerms),
                displayTitle: entry.title[currentLang] || entry.title.en
            }))
            .filter(entry => entry.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        
        return results;
    }
    
    function setLanguage(lang) {
        currentLang = lang;
    }
    
    function createSearchWidget(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="pa-search-widget" role="search">
                <input type="search" 
                       class="pa-search-input" 
                       placeholder="Search..." 
                       aria-label="Search PatientAnalog"
                       autocomplete="off">
                <div class="pa-search-results" role="listbox" aria-label="Search results"></div>
            </div>
            <style>
                .pa-search-widget { position: relative; max-width: 400px; }
                .pa-search-input { 
                    width: 100%; padding: 12px 16px; 
                    background: rgba(0, 29, 61, 0.8); 
                    border: 1px solid rgba(0, 85, 255, 0.3); 
                    border-radius: 8px; color: #e0f2fe; 
                    font-size: 14px; outline: none;
                }
                .pa-search-input:focus { border-color: #0055ff; }
                .pa-search-results { 
                    position: absolute; top: 100%; left: 0; right: 0;
                    background: rgba(0, 8, 20, 0.95); 
                    border: 1px solid rgba(0, 85, 255, 0.2);
                    border-radius: 8px; margin-top: 4px;
                    max-height: 300px; overflow-y: auto;
                    display: none; z-index: 1000;
                }
                .pa-search-results.active { display: block; }
                .pa-search-result { 
                    padding: 12px 16px; cursor: pointer;
                    border-bottom: 1px solid rgba(0, 85, 255, 0.1);
                }
                .pa-search-result:hover { background: rgba(0, 85, 255, 0.1); }
                .pa-search-result-title { color: #0055ff; font-weight: 600; }
                .pa-search-result-category { 
                    font-size: 11px; color: rgba(224, 242, 254, 0.6);
                    text-transform: uppercase; margin-top: 4px;
                }
            </style>
        `;
        
        const input = container.querySelector('.pa-search-input');
        const resultsDiv = container.querySelector('.pa-search-results');
        let debounceTimer;
        
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                const query = input.value;
                if (query.length < 2) {
                    resultsDiv.classList.remove('active');
                    return;
                }
                
                const results = await search(query);
                
                if (results.length === 0) {
                    resultsDiv.innerHTML = '<div class="pa-search-result"><em>No results found</em></div>';
                } else {
                    resultsDiv.innerHTML = results.map(r => `
                        <a href="${r.url}" class="pa-search-result" role="option">
                            <div class="pa-search-result-title">${r.displayTitle}</div>
                            <div class="pa-search-result-category">${r.category}</div>
                        </a>
                    `).join('');
                }
                
                resultsDiv.classList.add('active');
            }, 200);
        });
        
        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                resultsDiv.classList.remove('active');
            }
        });
    }
    
    return {
        search,
        loadIndex,
        setLanguage,
        createSearchWidget
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PASearch;
}
// v20260117-FULL
