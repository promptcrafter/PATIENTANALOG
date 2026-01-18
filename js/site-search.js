/**
 * NUCLEAR SIMPLE SITE SEARCH
 * For Research Hub pages
 */
console.log('[SITE-SEARCH] Script loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('[SITE-SEARCH] DOMContentLoaded fired');
    
    // Get elements by EXPLICIT IDs
    var searchInput = document.getElementById('siteSearchInput');
    var resultsContainer = document.getElementById('searchResults');
    
    console.log('[SITE-SEARCH] searchInput:', searchInput);
    console.log('[SITE-SEARCH] resultsContainer:', resultsContainer);
    
    // If elements don't exist, stop
    if (!searchInput) {
        console.log('[SITE-SEARCH] #siteSearchInput not found - skipping');
        return;
    }
    if (!resultsContainer) {
        console.log('[SITE-SEARCH] #searchResults not found - skipping');
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
        if (src.indexOf('site-search.js') !== -1) {
            basePath = src.substring(0, src.lastIndexOf('/') + 1);
            break;
        }
    }
    var indexPath = basePath + 'search-index.json';
    console.log('[SITE-SEARCH] Loading index from:', indexPath);
    
    // Load search index
    fetch(indexPath)
        .then(function(response) {
            console.log('[SITE-SEARCH] Fetch response status:', response.status);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(function(data) {
            searchIndex = data;
            indexLoaded = true;
            console.log('[SITE-SEARCH] Index loaded:', searchIndex.length, 'entries');
        })
        .catch(function(error) {
            console.error('[SITE-SEARCH] Failed to load index:', error);
        });
    
    // SIMPLE search function
    function doSearch(query) {
        console.log('[SITE-SEARCH] doSearch called with:', query);
        
        if (!indexLoaded) {
            resultsContainer.innerHTML = '<div class="search-message" style="padding:15px;color:#8be0ff;text-align:center;">Loading search index...</div>';
            resultsContainer.style.display = 'block';
            return;
        }
        
        var q = query.toLowerCase().trim();
        if (q.length < 2) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            return;
        }
        
        // Filter results
        var matches = [];
        for (var i = 0; i < searchIndex.length && matches.length < 10; i++) {
            var page = searchIndex[i];
            var title = (page.title || '').toLowerCase();
            var desc = (page.description || '').toLowerCase();
            var keywords = (page.keywords || []).join(' ').toLowerCase();
            if (title.indexOf(q) !== -1 || desc.indexOf(q) !== -1 || keywords.indexOf(q) !== -1) {
                matches.push(page);
            }
        }
        
        console.log('[SITE-SEARCH] Found', matches.length, 'matches');
        
        // Show results
        if (matches.length === 0) {
            resultsContainer.innerHTML = '<div class="search-message" style="padding:15px;color:#8be0ff;text-align:center;">No results found for "' + query + '"</div>';
        } else {
            var html = '<div class="search-results-header" style="padding:10px 15px;border-bottom:1px solid rgba(0,212,255,0.2);font-size:12px;color:#8be0ff;">Found ' + matches.length + ' results</div>';
            for (var j = 0; j < matches.length; j++) {
                var m = matches[j];
                html += '<a href="' + m.url + '" class="search-result-item" style="display:block;padding:12px 15px;border-bottom:1px solid rgba(0,212,255,0.1);text-decoration:none;transition:background 0.2s;">';
                html += '<div class="search-result-title" style="font-size:14px;color:#0066ff;font-weight:600;margin-bottom:4px;">' + (m.title || 'Untitled') + '</div>';
                html += '<div class="search-result-desc" style="font-size:12px;color:rgba(224,242,254,0.7);">' + ((m.description || '').substring(0, 100)) + '...</div>';
                html += '<div class="search-result-url" style="font-size:10px;color:rgba(0,212,255,0.5);margin-top:4px;">' + m.url + '</div>';
                html += '</a>';
            }
            resultsContainer.innerHTML = html;
        }
        resultsContainer.style.display = 'block';
    }
    
    // Clear results function (for clear button)
    window.siteSearch = {
        clearResults: function() {
            console.log('[SITE-SEARCH] clearResults called');
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        }
    };
    
    // EVENT: Input typing
    searchInput.addEventListener('input', function(e) {
        console.log('[SITE-SEARCH] Input event, value:', e.target.value);
        doSearch(e.target.value);
    });
    
    // EVENT: Keydown (Enter, Escape)
    searchInput.addEventListener('keydown', function(e) {
        console.log('[SITE-SEARCH] Keydown:', e.key);
        if (e.key === 'Enter') {
            e.preventDefault();
            doSearch(this.value);
        }
        if (e.key === 'Escape') {
            this.value = '';
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        }
    });
    
    console.log('[SITE-SEARCH] Event listeners attached - search ready');
});

console.log('[SITE-SEARCH] Script finished');
// v20260117-FULL
