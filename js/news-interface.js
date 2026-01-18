/**
 * PATIENT ANALOG - News Intelligence Feed
 * Command Deck 2035 Edition
 * Vanilla JS implementation with Live RSS Feed Integration
 */

(function() {
    'use strict';

    // ============================================================
    // LIVE RSS FEED CONFIGURATION
    // ============================================================
    const RSS_FEEDS = [
        {
            name: 'FierceBiotech',
            url: 'https://www.fiercebiotech.com/rss/xml',
            category: 'biotech funding'
        },
        {
            name: 'BioSpace',
            url: 'https://www.biospace.com/rss/',
            category: 'pharma partnerships'
        },
        {
            name: 'GEN News',
            url: 'https://www.genengnews.com/feed/',
            category: 'organ-on-chip'
        },
        {
            name: 'Drug Discovery Today',
            url: 'https://www.drugdiscoverytoday.com/rss/',
            category: 'AI drug discovery'
        }
    ];

    // RSS to JSON proxy service (free tier)
    const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

    // Keywords for filtering biotech/human simulation news
    const BIOTECH_KEYWORDS = [
        'organoid', 'organ-on-chip', 'organ on chip', 'microphysiological',
        'digital twin', 'iPSC', 'stem cell', 'in vitro', 'drug discovery',
        'biotech', 'pharmaceutical', 'FDA', 'clinical trial', 'preclinical',
        'tissue engineering', 'cell culture', 'biotechnology', 'NAM',
        'new approach methodologies', 'alternative testing', 'drug development'
    ];

    // Cache settings
    const CACHE_KEY = 'patientanalog_news_cache';
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    // ============================================================
    // FALLBACK NEWS DATA (used when RSS feeds unavailable)
    // ============================================================
    const newsData = [
        {
            id: 1,
            title: "FDA Announces New Framework for Organ-on-Chip Regulatory Approval",
            source: "BioPharma Dive",
            date: "2026-01-07T08:30:00Z",
            url: "/pages/regulatory/",
            summary: "The FDA has released comprehensive guidelines for validating organ-on-chip systems as alternatives to animal testing, marking a historic shift in drug development protocols.",
            tags: ["organ-on-chip", "FDA modernization"],
            isBreaking: true,
            visualType: "mps"
        },
        {
            id: 2,
            title: "Human Brain Organoids Show Spontaneous Neural Activity Patterns",
            source: "Nature Biotechnology",
            date: "2026-01-06T14:15:00Z",
            url: "/pages/science/organoids/brain-organoids/",
            summary: "Researchers have developed brain organoids that exhibit complex spontaneous activity resembling early human brain development.",
            tags: ["organoids", "AI drug discovery"],
            isBreaking: true,
            visualType: "organoid"
        },
        {
            id: 3,
            title: "Digital Twin Technology Predicts Drug Toxicity with 94% Accuracy",
            source: "Drug Discovery Today",
            date: "2026-01-05T10:00:00Z",
            url: "/pages/technology/digital-twins-healthcare/",
            summary: "A new AI-powered digital twin platform has demonstrated unprecedented accuracy in predicting hepatotoxicity.",
            tags: ["digital twins", "AI drug discovery"],
            isBreaking: false,
            visualType: "digital-twin"
        },
        {
            id: 4,
            title: "$2.3 Billion Funding Round for NAMs-Focused Biotech Consortium",
            source: "FierceBiotech",
            date: "2026-01-04T16:45:00Z",
            url: "/pages/market/",
            summary: "A consortium of leading biotech companies has secured record funding to accelerate NAMs adoption across the pharmaceutical industry.",
            tags: ["biotech funding", "MPS"],
            isBreaking: false,
            visualType: "organoid"
        },
        {
            id: 5,
            title: "Multi-Organ MPS Platform Reveals Novel Drug-Drug Interactions",
            source: "Science Translational Medicine",
            date: "2026-01-03T09:20:00Z",
            url: "/pages/technology/microphysiological-systems/",
            summary: "A connected multi-organ microphysiological system has identified previously unknown interactions between common medications.",
            tags: ["MPS", "organ-on-chip"],
            isBreaking: false,
            visualType: "mps"
        },
        {
            id: 6,
            title: "AI Model Trained on Organoid Data Accelerates Rare Disease Discovery",
            source: "Cell Reports Medicine",
            date: "2026-01-02T11:30:00Z",
            url: "/pages/science/disease-modeling/",
            summary: "Machine learning algorithms trained on patient-derived organoid responses have identified three promising drug candidates.",
            tags: ["AI drug discovery", "organoids"],
            isBreaking: false,
            visualType: "digital-twin"
        },
        {
            id: 7,
            title: "Emulate and Roche Expand Liver-Chip Partnership for NASH Studies",
            source: "GEN News",
            date: "2026-01-01T09:00:00Z",
            url: "/pages/companies/emulate/",
            summary: "The expanded collaboration will use organ-chip technology to develop new treatments for non-alcoholic steatohepatitis.",
            tags: ["organ-on-chip", "pharma partnerships"],
            isBreaking: false,
            visualType: "mps"
        },
        {
            id: 8,
            title: "New iPSC Protocol Generates Patient-Specific Cardiac Organoids in 14 Days",
            source: "Stem Cell Reports",
            date: "2025-12-30T14:00:00Z",
            url: "/pages/technology/ipsc-technology/",
            summary: "A streamlined differentiation protocol enables rapid generation of functional heart organoids from patient blood samples.",
            tags: ["organoids", "iPSC"],
            isBreaking: false,
            visualType: "organoid"
        }
    ];

    // ============================================================
    // STATE
    // ============================================================
    let articles = [];
    let searchQuery = '';
    let activeTag = null;
    let starfieldCanvas, starfieldCtx;
    let liveDataLoaded = false;

    // ============================================================
    // LIVE RSS FEED FUNCTIONS
    // ============================================================

    // Check if cached data is still valid
    function getCachedNews() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > CACHE_DURATION) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    // Save news to cache
    function cacheNews(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (e) {
            // Cache failed, continue without caching
        }
    }

    // Determine visual type based on article content
    function determineVisualType(title, description) {
        const text = (title + ' ' + description).toLowerCase();
        if (text.includes('organoid') || text.includes('stem cell') || text.includes('ipsc')) {
            return 'organoid';
        } else if (text.includes('digital twin') || text.includes('ai') || text.includes('machine learning')) {
            return 'digital-twin';
        } else {
            return 'mps';
        }
    }

    // Determine tags based on article content
    function determineTags(title, description) {
        const text = (title + ' ' + description).toLowerCase();
        const tags = [];

        if (text.includes('organoid')) tags.push('organoids');
        if (text.includes('organ-on-chip') || text.includes('organ on chip') || text.includes('chip')) tags.push('organ-on-chip');
        if (text.includes('digital twin')) tags.push('digital twins');
        if (text.includes('fda') || text.includes('regulatory') || text.includes('approval')) tags.push('FDA modernization');
        if (text.includes('ai') || text.includes('machine learning') || text.includes('drug discovery')) tags.push('AI drug discovery');
        if (text.includes('funding') || text.includes('investment') || text.includes('million') || text.includes('billion')) tags.push('biotech funding');
        if (text.includes('mps') || text.includes('microphysiological')) tags.push('MPS');
        if (text.includes('partnership') || text.includes('collaboration') || text.includes('deal')) tags.push('pharma partnerships');
        if (text.includes('ipsc') || text.includes('stem cell')) tags.push('iPSC');

        // Default tag if none found
        if (tags.length === 0) tags.push('biotech');

        return tags.slice(0, 3); // Max 3 tags
    }

    // Check if article is relevant to biotech/human simulation
    function isRelevantArticle(title, description) {
        const text = (title + ' ' + description).toLowerCase();
        return BIOTECH_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
    }

    // Fetch single RSS feed
    async function fetchRSSFeed(feed) {
        try {
            const response = await fetch(RSS2JSON_API + encodeURIComponent(feed.url));
            if (!response.ok) return [];

            const data = await response.json();
            if (data.status !== 'ok' || !data.items) return [];

            return data.items
                .filter(item => isRelevantArticle(item.title || '', item.description || ''))
                .map((item, index) => ({
                    id: `live_${feed.name}_${index}`,
                    title: item.title || 'Untitled',
                    source: feed.name,
                    date: item.pubDate || new Date().toISOString(),
                    url: item.link || '#',
                    summary: (item.description || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
                    tags: determineTags(item.title || '', item.description || ''),
                    isBreaking: false,
                    visualType: determineVisualType(item.title || '', item.description || ''),
                    isLive: true
                }));
        } catch (e) {
            console.warn(`Failed to fetch ${feed.name}:`, e);
            return [];
        }
    }

    // Fetch all RSS feeds
    async function fetchLiveNews() {
        // Check cache first
        const cached = getCachedNews();
        if (cached && cached.length > 0) {
            console.log('Using cached news data');
            return cached;
        }

        console.log('Fetching live news feeds...');
        const allFeeds = await Promise.all(RSS_FEEDS.map(feed => fetchRSSFeed(feed)));
        const liveArticles = allFeeds.flat();

        if (liveArticles.length > 0) {
            // Sort by date
            liveArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Mark first article as breaking if recent
            if (liveArticles[0] && isWithin24Hours(liveArticles[0].date)) {
                liveArticles[0].isBreaking = true;
            }

            // Cache the results
            cacheNews(liveArticles);

            return liveArticles;
        }

        return [];
    }

    // Auto-refresh timer
    let refreshInterval = null;
    function startAutoRefresh() {
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(async () => {
            console.log('Auto-refreshing news...');
            localStorage.removeItem(CACHE_KEY); // Clear cache to force refresh
            const liveNews = await fetchLiveNews();
            if (liveNews.length > 0) {
                articles = liveNews;
                renderTagFilters(getAllTags(articles));
                renderArticles();
            }
        }, CACHE_DURATION); // Refresh every 30 minutes
    }
    let stars = [];
    let starfieldAnimationId = null;

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    function isWithin24Hours(dateString) {
        const articleDate = new Date(dateString);
        const now = new Date();
        return (now - articleDate) / (1000 * 60 * 60) <= 24;
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function getAllTags(articles) {
        const tagSet = new Set();
        articles.forEach(a => a.tags.forEach(t => tagSet.add(t)));
        return Array.from(tagSet).sort();
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // ============================================================
    // SVG VISUALS
    // ============================================================
    function getOrganoidSVG() {
        return `
            <svg viewBox="0 0 120 120" class="news-card-visual">
                <defs>
                    <radialGradient id="organoidGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#00ffaa" stop-opacity="0.8"/>
                        <stop offset="100%" stop-color="#00ffaa" stop-opacity="0"/>
                    </radialGradient>
                    <filter id="organoidBlur">
                        <feGaussianBlur stdDeviation="2"/>
                    </filter>
                </defs>
                <circle cx="60" cy="60" r="45" fill="url(#organoidGlow)" filter="url(#organoidBlur)" class="pulse-slow"/>
                <g class="organoid-branches">
                    ${[0, 60, 120, 180, 240, 300].map((angle, i) => `
                        <g transform="rotate(${angle} 60 60)">
                            <path d="M60,60 Q${65 + i * 2},${35 - i} ${70 + i * 3},${20 + i * 2}"
                                  stroke="#00ffcc" stroke-width="2" fill="none" opacity="0.8">
                                <animate attributeName="opacity" values="0.4;1;0.4" dur="${2 + i * 0.3}s" repeatCount="indefinite"/>
                            </path>
                            <circle cx="${70 + i * 3}" cy="${20 + i * 2}" r="4" fill="#00ffaa">
                                <animate attributeName="r" values="3;5;3" dur="${1.5 + i * 0.2}s" repeatCount="indefinite"/>
                            </circle>
                        </g>
                    `).join('')}
                </g>
                <circle cx="60" cy="60" r="15" fill="#001a1a" stroke="#00ffcc" stroke-width="1.5"/>
                <circle cx="60" cy="60" r="8" fill="#00ffaa" opacity="0.6">
                    <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `;
    }

    function getDigitalTwinSVG() {
        return `
            <svg viewBox="0 0 120 120" class="news-card-visual">
                <defs>
                    <linearGradient id="neuralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#0055ff"/>
                        <stop offset="100%" stop-color="#0033cc"/>
                    </linearGradient>
                    <filter id="twinGlow">
                        <feGaussianBlur stdDeviation="3"/>
                    </filter>
                </defs>
                <ellipse cx="60" cy="55" rx="30" ry="38" fill="none" stroke="url(#neuralGrad)" stroke-width="1" opacity="0.3"/>
                <ellipse cx="60" cy="55" rx="25" ry="32" fill="none" stroke="#0055ff" stroke-width="0.5" stroke-dasharray="4 2">
                    <animateTransform attributeName="transform" type="rotate" from="0 60 55" to="360 60 55" dur="20s" repeatCount="indefinite"/>
                </ellipse>
                ${[[45,35], [75,35], [40,50], [80,50], [50,70], [70,70], [60,40], [60,60]].map(([x, y], i) => `
                    <g>
                        <circle cx="${x}" cy="${y}" r="3" fill="#0055ff" filter="url(#twinGlow)">
                            <animate attributeName="opacity" values="0.5;1;0.5" dur="${1 + i * 0.2}s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="${x}" cy="${y}" r="1.5" fill="#fff"/>
                    </g>
                `).join('')}
                ${[[45,35,75,35], [40,50,60,40], [80,50,60,40], [50,70,60,60], [70,70,60,60], [60,40,60,60]].map(([x1,y1,x2,y2], i) => `
                    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0055ff" stroke-width="0.5" opacity="0.6">
                        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="${1.5 + i * 0.1}s" repeatCount="indefinite"/>
                    </line>
                `).join('')}
                <text x="60" y="95" text-anchor="middle" fill="#0055ff" font-size="6" opacity="0.7">NEURAL SYNC</text>
            </svg>
        `;
    }

    function getMPSChipSVG() {
        return `
            <svg viewBox="0 0 120 120" class="news-card-visual">
                <defs>
                    <linearGradient id="channelFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#00ffaa" stop-opacity="0">
                            <animate attributeName="offset" values="-1;1" dur="2s" repeatCount="indefinite"/>
                        </stop>
                        <stop offset="50%" stop-color="#00ffaa" stop-opacity="1">
                            <animate attributeName="offset" values="-0.5;1.5" dur="2s" repeatCount="indefinite"/>
                        </stop>
                        <stop offset="100%" stop-color="#00ffaa" stop-opacity="0">
                            <animate attributeName="offset" values="0;2" dur="2s" repeatCount="indefinite"/>
                        </stop>
                    </linearGradient>
                </defs>
                <rect x="25" y="30" width="70" height="60" rx="4" fill="rgba(0,50,50,0.3)" stroke="#0055ff" stroke-width="1"/>
                <rect x="30" y="35" width="60" height="50" rx="2" fill="none" stroke="#0055ff" stroke-width="0.5" opacity="0.5"/>
                ${[40, 50, 60, 70].map((y, i) => `
                    <g>
                        <path d="M35,${y} L50,${y} Q55,${y} 55,${y + 5} L55,${y + 8} Q55,${y + 13} 60,${y + 13} L85,${y + 13 - i * 5}"
                              fill="none" stroke="url(#channelFlow)" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="35" cy="${y}" r="3" fill="#00ffaa" opacity="0.8">
                            <animate attributeName="r" values="2;4;2" dur="${1.5 + i * 0.3}s" repeatCount="indefinite"/>
                        </circle>
                    </g>
                `).join('')}
                ${[38, 52, 66].map((x, i) => `
                    <rect x="${x}" y="75" width="12" height="8" rx="1" fill="none" stroke="#0033cc" stroke-width="0.5">
                        <animate attributeName="opacity" values="0.5;1;0.5" dur="${2 + i * 0.4}s" repeatCount="indefinite"/>
                    </rect>
                `).join('')}
                <text x="60" y="100" text-anchor="middle" fill="#0055ff" font-size="5" opacity="0.6">MICROFLUIDIC ARRAY</text>
            </svg>
        `;
    }

    function getVisualSVG(type) {
        switch(type) {
            case 'organoid': return getOrganoidSVG();
            case 'digital-twin': return getDigitalTwinSVG();
            case 'mps': return getMPSChipSVG();
            default: return getOrganoidSVG();
        }
    }

    // ============================================================
    // STARFIELD ANIMATION
    // ============================================================
    function initStarfield() {
        starfieldCanvas = document.getElementById('newsStarfield');
        if (!starfieldCanvas) return;

        starfieldCtx = starfieldCanvas.getContext('2d');
        resizeStarfield();
        window.addEventListener('resize', debounce(resizeStarfield, 250));
        animateStarfield();
    }

    function resizeStarfield() {
        if (!starfieldCanvas) return;
        starfieldCanvas.width = window.innerWidth;
        starfieldCanvas.height = window.innerHeight;

        stars = Array.from({ length: 150 }, () => ({
            x: Math.random() * starfieldCanvas.width,
            y: Math.random() * starfieldCanvas.height,
            size: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.3 + 0.1,
            opacity: Math.random() * 0.8 + 0.2
        }));
    }

    function animateStarfield() {
        if (!starfieldCtx || !starfieldCanvas) return;

        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Draw static stars once
            starfieldCtx.fillStyle = '#030712';
            starfieldCtx.fillRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);
            stars.forEach(star => {
                starfieldCtx.beginPath();
                starfieldCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                starfieldCtx.fillStyle = `rgba(150, 220, 255, ${star.opacity * 0.5})`;
                starfieldCtx.fill();
            });
            return;
        }

        starfieldCtx.fillStyle = 'rgba(3, 7, 18, 0.1)';
        starfieldCtx.fillRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);

        stars.forEach(star => {
            star.y += star.speed;
            if (star.y > starfieldCanvas.height) {
                star.y = 0;
                star.x = Math.random() * starfieldCanvas.width;
            }

            const flicker = 0.5 + Math.sin(Date.now() * 0.003 + star.x) * 0.5;
            starfieldCtx.beginPath();
            starfieldCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            starfieldCtx.fillStyle = `rgba(150, 220, 255, ${star.opacity * flicker})`;
            starfieldCtx.fill();
        });

        starfieldAnimationId = requestAnimationFrame(animateStarfield);
    }

    // ============================================================
    // RENDER FUNCTIONS
    // ============================================================
    function renderNewsCard(article, index) {
        const showBreaking = article.isBreaking || isWithin24Hours(article.date);

        return `
            <article class="news-holo-card ${showBreaking ? 'breaking' : ''}" style="animation-delay: ${index * 0.15}s">
                <div class="news-card-holo-border"></div>
                ${showBreaking ? '<div class="news-card-breaking-beacon">BREAKING</div>' : ''}

                <div class="news-card-visual-container">
                    ${getVisualSVG(article.visualType)}
                </div>

                <div class="news-card-content">
                    <div class="news-card-meta">
                        <span class="news-card-source">${article.source}</span>
                        <span class="news-card-date">${formatDate(article.date)}</span>
                    </div>
                    <h3 class="news-card-title">${article.title}</h3>
                    <p class="news-card-summary">${article.summary}</p>
                    <div class="news-card-tags">
                        ${article.tags.map(tag => `<span class="news-card-tag">${tag}</span>`).join('')}
                    </div>
                    <a href="${article.url}" class="news-card-link">
                        <span>ACCESS FULL REPORT</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </a>
                </div>
            </article>
        `;
    }

    function renderTagFilters(tags) {
        const container = document.getElementById('newsTagFilter');
        if (!container) return;

        container.innerHTML = `
            <button class="news-tag-chip ${!activeTag ? 'active' : ''}" data-tag="">ALL</button>
            ${tags.map(tag => `
                <button class="news-tag-chip ${activeTag === tag ? 'active' : ''}" data-tag="${tag}">
                    ${tag.toUpperCase()}
                </button>
            `).join('')}
        `;

        // Add event listeners
        container.querySelectorAll('.news-tag-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const tag = chip.dataset.tag;
                activeTag = tag || null;
                renderTagFilters(getAllTags(articles));
                renderArticles();
            });
        });
    }

    function renderArticles() {
        const grid = document.getElementById('newsGrid');
        const resultsBar = document.getElementById('newsResultsBar');
        if (!grid) return;

        // Filter articles
        const filtered = articles.filter(article => {
            if (activeTag && !article.tags.includes(activeTag)) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!article.title.toLowerCase().includes(q) &&
                    !article.summary.toLowerCase().includes(q) &&
                    !article.tags.some(t => t.toLowerCase().includes(q))) {
                    return false;
                }
            }
            return true;
        });

        // Update results bar
        if (resultsBar) {
            resultsBar.innerHTML = `
                <span>DISPLAYING</span>
                <span class="news-results-count">${filtered.length}</span>
                <span>OF</span>
                <span class="news-results-count">${articles.length}</span>
                <span>REPORTS</span>
            `;
        }

        // Render cards or empty state
        if (filtered.length > 0) {
            grid.innerHTML = filtered.map((article, i) => renderNewsCard(article, i)).join('');
        } else {
            grid.innerHTML = `
                <div class="news-empty-state" style="grid-column: 1 / -1;">
                    <div class="news-empty-icon">&#9671;</div>
                    <p>No matching intelligence reports found.</p>
                </div>
            `;
        }
    }

    function renderBreakingBanner() {
        const hasBreaking = articles.some(a => a.isBreaking || isWithin24Hours(a.date));
        if (!hasBreaking) return;

        const breakingArticle = articles.find(a => a.isBreaking || isWithin24Hours(a.date));
        if (!breakingArticle) return;

        // Check if banner already dismissed this session
        if (sessionStorage.getItem('newsBreakingDismissed')) return;

        const banner = document.createElement('div');
        banner.className = 'news-breaking-banner';
        banner.innerHTML = `
            <span class="news-breaking-banner-dot"></span>
            <span class="news-breaking-banner-text">BREAKING: ${breakingArticle.title}</span>
            <button class="news-breaking-banner-close" aria-label="Dismiss">&times;</button>
        `;

        document.body.appendChild(banner);

        banner.querySelector('.news-breaking-banner-close').addEventListener('click', () => {
            banner.remove();
            sessionStorage.setItem('newsBreakingDismissed', 'true');
        });

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (banner.parentNode) {
                banner.style.animation = 'newsBannerSlide 0.5s ease-out reverse';
                setTimeout(() => banner.remove(), 500);
            }
        }, 10000);
    }

    function showLoading() {
        const grid = document.getElementById('newsGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="news-loading" style="grid-column: 1 / -1;">
                <div class="news-loading-ring"></div>
                <span class="news-loading-text">SYNCING DATA FEEDS</span>
            </div>
        `;
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================
    async function init() {
        // Show loading state
        showLoading();

        // Initialize starfield
        initStarfield();

        // Setup search
        const searchInput = document.getElementById('newsSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                searchQuery = e.target.value.trim();
                renderArticles();
            }, 300));
        }

        // Try to fetch live news first
        try {
            const liveNews = await fetchLiveNews();
            if (liveNews && liveNews.length > 0) {
                articles = liveNews;
                liveDataLoaded = true;
                console.log(`Loaded ${liveNews.length} live articles`);
                // Start auto-refresh for live data
                startAutoRefresh();
            } else {
                // Fallback to static data
                articles = [...newsData].sort((a, b) => new Date(b.date) - new Date(a.date));
                console.log('Using fallback static news data');
            }
        } catch (e) {
            console.warn('Live feed failed, using fallback:', e);
            articles = [...newsData].sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        // Render
        renderTagFilters(getAllTags(articles));
        renderArticles();
        renderBreakingBanner();

        // Add live indicator to header if live data loaded
        if (liveDataLoaded) {
            const header = document.querySelector('.news-deck-subtitle');
            if (header) {
                header.innerHTML = '<span style="display:inline-block;width:8px;height:8px;background:#00ff88;border-radius:50%;margin-right:8px;animation:pulse 2s infinite;"></span>LIVE - Real-time breakthroughs in human simulation technology';
            }
        }
    }

    // ============================================================
    // PUBLIC API
    // ============================================================
    window.NewsInterface = {
        init: init,
        refresh: function() {
            articles = [...newsData].sort((a, b) => new Date(b.date) - new Date(a.date));
            renderTagFilters(getAllTags(articles));
            renderArticles();
        },
        destroy: function() {
            if (starfieldAnimationId) {
                cancelAnimationFrame(starfieldAnimationId);
            }
            const banner = document.querySelector('.news-breaking-banner');
            if (banner) banner.remove();
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
// v20260117-FULL
