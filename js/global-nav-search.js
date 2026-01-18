/**
 * NUCLEAR SIMPLE GLOBAL NAV SEARCH
 * Simple, explicit, easy to verify
 */
console.log('[GLOBAL-NAV-SEARCH] Script loaded');

// Wait for DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('[GLOBAL-NAV-SEARCH] DOMContentLoaded fired');
    
    // Get elements by EXPLICIT IDs
    var searchInput = document.getElementById('globalSearch');
    var resultsContainer = document.getElementById('globalSearchResults');
    
    // Log what we found
    console.log('[GLOBAL-NAV-SEARCH] searchInput:', searchInput);
    console.log('[GLOBAL-NAV-SEARCH] resultsContainer:', resultsContainer);
    
    // If elements don't exist, stop
    if (!searchInput) {
        console.warn('[GLOBAL-NAV-SEARCH] #globalSearch not found - search disabled');
        return;
    }
    if (!resultsContainer) {
        console.warn('[GLOBAL-NAV-SEARCH] #globalSearchResults not found - search disabled');
        return;
    }
    
    // Search index storage
    var searchIndex = [];
    var indexLoaded = false;
    
    // Determine path to search-index.json based on script location
    var scriptTags = document.getElementsByTagName('script');
    var basePath = '';
    for (var i = 0; i < scriptTags.length; i++) {
        var src = scriptTags[i].src || '';
        if (src.indexOf('global-nav-search.js') !== -1) {
            basePath = src.substring(0, src.lastIndexOf('/') + 1);
            break;
        }
    }
    var indexPath = basePath + 'search-index.json';
    console.log('[GLOBAL-NAV-SEARCH] Loading index from:', indexPath);
    
    // Load search index
    fetch(indexPath)
        .then(function(response) {
            console.log('[GLOBAL-NAV-SEARCH] Fetch response status:', response.status);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(function(data) {
            searchIndex = data;
            indexLoaded = true;
            console.log('[GLOBAL-NAV-SEARCH] Index loaded:', searchIndex.length, 'entries');
        })
        .catch(function(error) {
            console.error('[GLOBAL-NAV-SEARCH] Failed to load index:', error);
        });
    
    // SIMPLE search function
    function doSearch(query) {
        console.log('[GLOBAL-NAV-SEARCH] doSearch called with:', query);
        
        if (!indexLoaded) {
            resultsContainer.innerHTML = '<div style="padding:12px;color:#8be0ff;text-align:center;font-size:12px;">Loading...</div>';
            resultsContainer.style.display = 'block';
            return;
        }
        
        var q = query.toLowerCase().trim();
        if (q.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }
        
        // Filter results
        var matches = [];
        for (var i = 0; i < searchIndex.length && matches.length < 8; i++) {
            var page = searchIndex[i];
            var title = (page.title || '').toLowerCase();
            var desc = (page.description || '').toLowerCase();
            if (title.indexOf(q) !== -1 || desc.indexOf(q) !== -1) {
                matches.push(page);
            }
        }
        
        console.log('[GLOBAL-NAV-SEARCH] Found', matches.length, 'matches');
        
        // Show results
        if (matches.length === 0) {
            resultsContainer.innerHTML = '<div style="padding:12px;color:#8be0ff;text-align:center;font-size:12px;">No results for "' + query + '"</div>';
        } else {
            var html = '';
            for (var j = 0; j < matches.length; j++) {
                var m = matches[j];
                html += '<a href="' + m.url + '" style="display:block;padding:10px 12px;border-bottom:1px solid rgba(0,212,255,0.15);text-decoration:none;color:#e0f2fe;" onmouseover="this.style.background=\'rgba(0,212,255,0.1)\'" onmouseout="this.style.background=\'transparent\'">';
                html += '<div style="font-size:12px;color:#0066ff;font-weight:600;">' + (m.title || 'Untitled') + '</div>';
                html += '<div style="font-size:11px;color:rgba(224,242,254,0.6);margin-top:2px;">' + ((m.description || '').substring(0, 60)) + '...</div>';
                html += '</a>';
            }
            resultsContainer.innerHTML = html;
        }
        resultsContainer.style.display = 'block';
    }
    
    // EVENT: Input typing
    searchInput.addEventListener('input', function(e) {
        console.log('[GLOBAL-NAV-SEARCH] Input event, value:', e.target.value);
        doSearch(e.target.value);
    });
    
    // EVENT: Keydown (Enter, Escape)
    searchInput.addEventListener('keydown', function(e) {
        console.log('[GLOBAL-NAV-SEARCH] Keydown:', e.key);
        if (e.key === 'Enter') {
            e.preventDefault();
            doSearch(this.value);
        }
        if (e.key === 'Escape') {
            this.value = '';
            resultsContainer.style.display = 'none';
            this.blur();
        }
    });
    
    // EVENT: Click outside closes results
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });
    
    console.log('[GLOBAL-NAV-SEARCH] Event listeners attached - search ready');
});

console.log('[GLOBAL-NAV-SEARCH] Script finished');
// v20260117-FULL
