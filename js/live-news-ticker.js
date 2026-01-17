/**
 * Live Breaking News Ticker Enhancement
 * Fetches real-time biotech/pharma news from RSS feeds
 * and displays them in the ticker banner
 */
(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    RSS_PROXY: 'https://api.rss2json.com/v1/api.json?rss_url=',
    CACHE_KEY: 'pa_breaking_news_cache',
    CACHE_DURATION: 15 * 60 * 1000, // 15 minutes
    REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutes
    MAX_HEADLINES: 8
  };

  // RSS Feed sources for biotech/pharma news
  const RSS_FEEDS = [
    {
      name: 'FierceBiotech',
      url: 'https://www.fiercebiotech.com/rss/xml',
      priority: 1
    },
    {
      name: 'BioSpace',
      url: 'https://www.biospace.com/rss/',
      priority: 2
    },
    {
      name: 'GEN News',
      url: 'https://www.genengnews.com/feed/',
      priority: 2
    },
    {
      name: 'Endpoints News',
      url: 'https://endpts.com/feed/',
      priority: 1
    },
    {
      name: 'STAT News',
      url: 'https://www.statnews.com/feed/',
      priority: 1
    }
  ];

  // Keywords for filtering relevant news
  const BIOTECH_KEYWORDS = [
    'organoid', 'organ-on-chip', 'organ on chip', 'microphysiological',
    'digital twin', 'iPSC', 'stem cell', 'in vitro', 'drug discovery',
    'biotech', 'pharmaceutical', 'FDA', 'clinical trial', 'preclinical',
    'tissue engineering', 'cell culture', 'biotechnology', 'NAM',
    'new approach methodologies', 'alternative testing', 'drug development',
    'gene therapy', 'cell therapy', 'CRISPR', 'mRNA', 'vaccine',
    'oncology', 'cancer', 'immunotherapy', 'biomarker', 'precision medicine',
    'AI drug', 'machine learning', 'approval', 'breakthrough'
  ];

  // State
  let breakingNews = [];
  let currentHeadlineIndex = 0;
  let rotationInterval = null;
  let refreshInterval = null;
  let tickerInitialized = false;

  /**
   * Check if cached news is still valid
   */
  function getCachedNews() {
    try {
      const cached = localStorage.getItem(CONFIG.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CONFIG.CACHE_DURATION) {
        localStorage.removeItem(CONFIG.CACHE_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Cache news data
   */
  function cacheNews(data) {
    try {
      localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({
        data: data,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Cache failed, continue without caching
    }
  }

  /**
   * Check if article is relevant to biotech
   */
  function isRelevantArticle(title, description = '') {
    const text = (title + ' ' + description).toLowerCase();
    return BIOTECH_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * Check if article is breaking (within last 24 hours)
   */
  function isBreakingNews(dateString) {
    const articleDate = new Date(dateString);
    const now = new Date();
    const hoursAgo = (now - articleDate) / (1000 * 60 * 60);
    return hoursAgo <= 24;
  }

  /**
   * Fetch single RSS feed
   */
  async function fetchRSSFeed(feed) {
    try {
      const response = await fetch(CONFIG.RSS_PROXY + encodeURIComponent(feed.url), {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) return [];

      const data = await response.json();
      if (data.status !== 'ok' || !data.items) return [];

      return data.items
        .filter(item => isRelevantArticle(item.title || '', item.description || ''))
        .slice(0, 5)
        .map(item => ({
          title: cleanTitle(item.title || 'Untitled'),
          source: feed.name,
          date: item.pubDate || new Date().toISOString(),
          url: item.link || '#',
          isBreaking: isBreakingNews(item.pubDate),
          priority: feed.priority
        }));
    } catch (e) {
      console.warn(`[LiveNewsTicker] Failed to fetch ${feed.name}:`, e.message);
      return [];
    }
  }

  /**
   * Clean up title text
   */
  function cleanTitle(title) {
    return title
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;|&#8221;/g, '"')
      .trim()
      .substring(0, 100) + (title.length > 100 ? '...' : '');
  }

  /**
   * Fetch all RSS feeds
   */
  async function fetchAllNews() {
    // Check cache first
    const cached = getCachedNews();
    if (cached && cached.length > 0) {
      console.log('[LiveNewsTicker] Using cached news');
      return cached;
    }

    console.log('[LiveNewsTicker] Fetching live news feeds...');

    try {
      const results = await Promise.allSettled(
        RSS_FEEDS.map(feed => fetchRSSFeed(feed))
      );

      const allArticles = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

      if (allArticles.length === 0) {
        console.log('[LiveNewsTicker] No articles fetched, using fallback');
        return getFallbackNews();
      }

      // Sort by date and priority
      allArticles.sort((a, b) => {
        // Breaking news first
        if (a.isBreaking && !b.isBreaking) return -1;
        if (!a.isBreaking && b.isBreaking) return 1;
        // Then by priority
        if (a.priority !== b.priority) return a.priority - b.priority;
        // Then by date
        return new Date(b.date) - new Date(a.date);
      });

      // Take top headlines
      const headlines = allArticles.slice(0, CONFIG.MAX_HEADLINES);

      // Cache results
      cacheNews(headlines);

      return headlines;
    } catch (e) {
      console.error('[LiveNewsTicker] Error fetching news:', e);
      return getFallbackNews();
    }
  }

  /**
   * Fallback news when feeds unavailable
   */
  function getFallbackNews() {
    return [
      { title: 'FDA Advances New Approach Methodologies for Drug Safety', source: 'FDA.gov', isBreaking: false },
      { title: 'Organ-on-Chip Technology Gains Regulatory Momentum', source: 'BioPharma', isBreaking: false },
      { title: 'Digital Twin Models Show Promise in Clinical Trials', source: 'Nature', isBreaking: false },
      { title: 'AI Drug Discovery Market Expected to Reach $4B by 2027', source: 'MarketWatch', isBreaking: false },
      { title: 'NIH NCATS Expands Tissue Chip Testing Program', source: 'NIH', isBreaking: false }
    ];
  }

  /**
   * Create breaking news ticker element
   */
  function createBreakingNewsTicker() {
    const tickerContainer = document.getElementById('live-ticker');
    if (!tickerContainer) return null;

    // Find or create the secondary row for breaking news
    let newsRow = tickerContainer.querySelector('.ticker-news-row');

    if (!newsRow) {
      // Create new breaking news row
      newsRow = document.createElement('div');
      newsRow.className = 'live-ticker-row ticker-news-row';
      newsRow.innerHTML = `
        <div class="breaking-news-container">
          <span class="breaking-badge">
            <span class="breaking-pulse"></span>
            BREAKING
          </span>
          <span class="breaking-headline-wrapper">
            <span class="breaking-headline"></span>
          </span>
          <span class="breaking-source"></span>
        </div>
      `;

      // Insert after the secondary row or at the end
      const tickerInner = tickerContainer.querySelector('.live-ticker-inner');
      if (tickerInner) {
        tickerInner.appendChild(newsRow);
      }
    }

    return newsRow;
  }

  /**
   * Update the breaking news display
   */
  function updateBreakingNewsDisplay() {
    if (breakingNews.length === 0) return;

    const headline = document.querySelector('.breaking-headline');
    const source = document.querySelector('.breaking-source');
    const badge = document.querySelector('.breaking-badge');

    if (!headline || !source) return;

    const news = breakingNews[currentHeadlineIndex];

    // Fade out
    headline.style.opacity = '0';
    source.style.opacity = '0';

    setTimeout(() => {
      headline.textContent = news.title;
      source.textContent = news.source;

      // Update badge for breaking vs regular
      if (badge) {
        if (news.isBreaking) {
          badge.classList.add('is-breaking');
          badge.innerHTML = '<span class="breaking-pulse"></span>BREAKING';
        } else {
          badge.classList.remove('is-breaking');
          badge.innerHTML = '<span class="breaking-pulse"></span>NEWS';
        }
      }

      // Fade in
      headline.style.opacity = '1';
      source.style.opacity = '1';
    }, 300);

    // Move to next headline
    currentHeadlineIndex = (currentHeadlineIndex + 1) % breakingNews.length;
  }

  /**
   * Start headline rotation
   */
  function startHeadlineRotation() {
    if (rotationInterval) clearInterval(rotationInterval);

    // Initial display
    updateBreakingNewsDisplay();

    // Rotate every 6 seconds
    rotationInterval = setInterval(updateBreakingNewsDisplay, 6000);
  }

  /**
   * Add CSS styles for breaking news
   */
  function injectStyles() {
    if (document.getElementById('breaking-news-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'breaking-news-styles';
    styles.textContent = `
      .ticker-news-row {
        background: linear-gradient(90deg, rgba(139, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0) 50%, rgba(139, 0, 0, 0.15) 100%);
        border-top: 1px solid rgba(255, 68, 68, 0.2);
        padding: 4px 12px;
        min-height: 24px;
        display: flex;
        align-items: center;
        overflow: hidden;
      }

      .breaking-news-container {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        overflow: hidden;
      }

      .breaking-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, #8b0000, #cc0000);
        color: #fff;
        font-size: 9px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 3px;
        text-transform: uppercase;
        letter-spacing: 1px;
        flex-shrink: 0;
        animation: breakingGlow 2s ease-in-out infinite;
      }

      .breaking-badge:not(.is-breaking) {
        background: linear-gradient(135deg, #0055ff, #0088ff);
        animation: none;
      }

      .breaking-pulse {
        width: 6px;
        height: 6px;
        background: #fff;
        border-radius: 50%;
        animation: pulse 1.5s ease-in-out infinite;
      }

      .breaking-badge:not(.is-breaking) .breaking-pulse {
        animation: none;
        opacity: 0.7;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
      }

      @keyframes breakingGlow {
        0%, 100% { box-shadow: 0 0 5px rgba(255, 68, 68, 0.5); }
        50% { box-shadow: 0 0 15px rgba(255, 68, 68, 0.8); }
      }

      .breaking-headline-wrapper {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
      }

      .breaking-headline {
        color: #e0f2fe;
        font-size: 11px;
        font-weight: 500;
        transition: opacity 0.3s ease;
        display: inline-block;
      }

      .breaking-source {
        color: rgba(0, 212, 255, 0.7);
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex-shrink: 0;
        transition: opacity 0.3s ease;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .ticker-news-row {
          padding: 3px 8px;
        }
        .breaking-badge {
          font-size: 8px;
          padding: 2px 6px;
        }
        .breaking-headline {
          font-size: 10px;
        }
        .breaking-source {
          display: none;
        }
      }

      @media (max-width: 480px) {
        .ticker-news-row {
          display: none;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Initialize the breaking news ticker
   */
  async function init() {
    // Wait for main ticker to be ready
    const tickerContainer = document.getElementById('live-ticker');
    if (!tickerContainer) {
      // Retry after delay
      setTimeout(init, 500);
      return;
    }

    // Wait for ticker inner to be created
    const tickerInner = tickerContainer.querySelector('.live-ticker-inner');
    if (!tickerInner) {
      setTimeout(init, 500);
      return;
    }

    if (tickerInitialized) return;
    tickerInitialized = true;

    console.log('[LiveNewsTicker] Initializing breaking news ticker...');

    // Inject styles
    injectStyles();

    // Create ticker element
    createBreakingNewsTicker();

    // Fetch news
    breakingNews = await fetchAllNews();
    console.log(`[LiveNewsTicker] Loaded ${breakingNews.length} headlines`);

    // Start rotation
    if (breakingNews.length > 0) {
      startHeadlineRotation();
    }

    // Set up auto-refresh (store reference for cleanup)
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(async () => {
      localStorage.removeItem(CONFIG.CACHE_KEY);
      breakingNews = await fetchAllNews();
      console.log('[LiveNewsTicker] Refreshed headlines');
    }, CONFIG.REFRESH_INTERVAL);
  }

  /**
   * Cleanup/destroy function to prevent memory leaks
   */
  function destroy() {
    if (rotationInterval) {
      clearInterval(rotationInterval);
      rotationInterval = null;
    }
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }

    // Remove injected styles
    const styles = document.getElementById('breaking-news-styles');
    if (styles) styles.remove();

    // Remove ticker row
    const newsRow = document.querySelector('.ticker-news-row');
    if (newsRow) newsRow.remove();

    tickerInitialized = false;
    breakingNews = [];
    currentHeadlineIndex = 0;

    console.log('[LiveNewsTicker] Destroyed and cleaned up');
  }

  // Cleanup on page unload to prevent memory leaks
  window.addEventListener('beforeunload', destroy);
  window.addEventListener('pagehide', destroy);

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
  } else {
    setTimeout(init, 1000);
  }

  // Export for debugging and cleanup
  window.LiveNewsTicker = {
    init,
    destroy,
    refresh: async () => {
      localStorage.removeItem(CONFIG.CACHE_KEY);
      breakingNews = await fetchAllNews();
      startHeadlineRotation();
    },
    getNews: () => breakingNews
  };

})();
