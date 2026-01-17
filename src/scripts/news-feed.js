export class NewsFeed {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes cache
    this.refreshInterval = 30 * 60 * 1000; // 30 minutes auto-refresh
  }

  async fetchRSS(feedUrl, maxItems = 10) {
    const proxies = [
      { url: 'https://api.rss2json.com/v1/api.json?rss_url=', type: 'json' },
      { url: 'https://api.allorigins.win/raw?url=', type: 'raw' },
      { url: 'https://corsproxy.io/?', type: 'raw' }
    ];

    for (const proxy of proxies) {
      try {
        const res = await fetch(proxy.url + encodeURIComponent(feedUrl));
        if (!res.ok) continue;

        let articles = [];

        if (proxy.type === 'json') {
          const data = await res.json();
          if (data.items) {
            articles = data.items.slice(0, maxItems).map(item => ({
              title: item.title || '',
              link: item.link || '',
              date: new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              rawDate: new Date(item.pubDate),
              source: item.author || this.extractDomain(item.link)
            }));
          }
        } else {
          const text = await res.text();
          const xml = new DOMParser().parseFromString(text, 'text/xml');
          const items = Array.from(xml.querySelectorAll('item')).slice(0, maxItems);

          articles = items.map(item => {
            const pubDate = item.querySelector('pubDate')?.textContent;
            return {
              title: item.querySelector('title')?.textContent || '',
              link: item.querySelector('link')?.textContent || '',
              date: pubDate ? new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
              rawDate: pubDate ? new Date(pubDate) : new Date(0),
              source: item.querySelector('source')?.textContent || this.extractDomain(item.querySelector('link')?.textContent)
            };
          });
        }

        if (articles.length > 0) return articles;
      } catch (e) {
        continue;
      }
    }
    return [];
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'News';
    }
  }

  async fetchMultipleFeeds(feeds, maxTotal = 12) {
    const allArticles = [];

    // Fetch all feeds in parallel
    const results = await Promise.all(
      feeds.map(feed => this.fetchRSS(feed.url, feed.max || 8))
    );

    // Combine all articles
    results.forEach(articles => {
      allArticles.push(...articles);
    });

    // Sort by date (newest first) and remove duplicates
    const seen = new Set();
    const unique = allArticles
      .filter(a => {
        const key = a.title.toLowerCase().substring(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.rawDate - a.rawDate)
      .slice(0, maxTotal);

    return unique;
  }

  async fetchOrganChip() {
    const key = 'organ-chip';
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const feeds = [
      { url: 'https://news.google.com/rss/search?q=organ-on-chip+OR+tissue+chip+OR+microphysiological+systems&hl=en-US&gl=US&ceid=US:en', max: 10 },
      { url: 'https://www.sciencedaily.com/rss/matter_energy/engineering.xml', max: 5 },
      { url: 'https://www.nature.com/subjects/lab-on-a-chip.rss', max: 5 },
      { url: 'https://news.google.com/rss/search?q=lab-on-chip+drug+testing&hl=en-US&gl=US&ceid=US:en', max: 5 }
    ];

    const articles = await this.fetchMultipleFeeds(feeds, 12);
    this.cache.set(key, { data: articles, timestamp: Date.now() });
    return articles;
  }

  async fetchOrganoids() {
    const key = 'organoids';
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const feeds = [
      { url: 'https://news.google.com/rss/search?q=organoid+research+OR+organoids+science&hl=en-US&gl=US&ceid=US:en', max: 10 },
      { url: 'https://news.google.com/rss/search?q=brain+organoid+OR+tumor+organoid&hl=en-US&gl=US&ceid=US:en', max: 5 },
      { url: 'https://www.sciencedaily.com/rss/matter_energy/biochemistry.xml', max: 5 },
      { url: 'https://news.google.com/rss/search?q=stem+cell+organoid+2024+OR+2025&hl=en-US&gl=US&ceid=US:en', max: 5 }
    ];

    const articles = await this.fetchMultipleFeeds(feeds, 12);
    this.cache.set(key, { data: articles, timestamp: Date.now() });
    return articles;
  }

  async fetchDigitalTwins() {
    const key = 'digital-twins';
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const feeds = [
      { url: 'https://news.google.com/rss/search?q=digital+twin+healthcare+OR+patient+digital+twin&hl=en-US&gl=US&ceid=US:en', max: 10 },
      { url: 'https://news.google.com/rss/search?q=AI+healthcare+simulation+OR+virtual+patient&hl=en-US&gl=US&ceid=US:en', max: 5 },
      { url: 'https://news.google.com/rss/search?q=computational+medicine+OR+in+silico+drug&hl=en-US&gl=US&ceid=US:en', max: 5 },
      { url: 'https://www.sciencedaily.com/rss/computers_math/computer_modeling.xml', max: 5 }
    ];

    const articles = await this.fetchMultipleFeeds(feeds, 12);
    this.cache.set(key, { data: articles, timestamp: Date.now() });
    return articles;
  }

  async fetchRegulatory() {
    const key = 'regulatory';
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const feeds = [
      { url: 'https://news.google.com/rss/search?q=FDA+drug+approval+OR+FDA+modernization&hl=en-US&gl=US&ceid=US:en', max: 10 },
      { url: 'https://news.google.com/rss/search?q=FDA+animal+testing+alternative+OR+NAMs+regulatory&hl=en-US&gl=US&ceid=US:en', max: 5 },
      { url: 'https://news.google.com/rss/search?q=EMA+drug+regulation+OR+clinical+trial+regulation&hl=en-US&gl=US&ceid=US:en', max: 5 },
      { url: 'https://news.google.com/rss/search?q=biotech+regulation+2024+OR+2025&hl=en-US&gl=US&ceid=US:en', max: 5 }
    ];

    const articles = await this.fetchMultipleFeeds(feeds, 12);
    this.cache.set(key, { data: articles, timestamp: Date.now() });
    return articles;
  }

  async fetchPharma() {
    const key = 'pharma';
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const feeds = [
      { url: 'https://news.google.com/rss/search?q=drug+discovery+biotech+OR+pharmaceutical+development&hl=en-US&gl=US&ceid=US:en', max: 10 },
      { url: 'https://news.google.com/rss/search?q=preclinical+drug+OR+drug+candidate+pipeline&hl=en-US&gl=US&ceid=US:en', max: 5 },
      { url: 'https://news.google.com/rss/search?q=pharma+clinical+trials+OR+drug+efficacy&hl=en-US&gl=US&ceid=US:en', max: 5 }
    ];

    const articles = await this.fetchMultipleFeeds(feeds, 12);
    this.cache.set(key, { data: articles, timestamp: Date.now() });
    return articles;
  }

  async fetchIndustry() {
    const key = 'industry';
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const feeds = [
      { url: 'https://news.google.com/rss/search?q=biotech+company+OR+biotech+startup+funding&hl=en-US&gl=US&ceid=US:en', max: 10 },
      { url: 'https://news.google.com/rss/search?q=biotech+IPO+OR+biotech+acquisition+merger&hl=en-US&gl=US&ceid=US:en', max: 5 },
      { url: 'https://news.google.com/rss/search?q=life+sciences+business+OR+biotech+market&hl=en-US&gl=US&ceid=US:en', max: 5 }
    ];

    const articles = await this.fetchMultipleFeeds(feeds, 12);
    this.cache.set(key, { data: articles, timestamp: Date.now() });
    return articles;
  }

  async fetchResearchNews() {
    const key = 'research-news';
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const feeds = [
      { url: 'https://news.google.com/rss/search?q=scientific+research+breakthrough+biology&hl=en-US&gl=US&ceid=US:en', max: 10 },
      { url: 'https://www.sciencedaily.com/rss/top/science.xml', max: 5 },
      { url: 'https://news.google.com/rss/search?q=nature+journal+OR+science+journal+publication&hl=en-US&gl=US&ceid=US:en', max: 5 }
    ];

    const articles = await this.fetchMultipleFeeds(feeds, 12);
    this.cache.set(key, { data: articles, timestamp: Date.now() });
    return articles;
  }

  async fetchTech() {
    const key = 'tech';
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const feeds = [
      { url: 'https://news.google.com/rss/search?q=biotech+technology+OR+lab+automation&hl=en-US&gl=US&ceid=US:en', max: 10 },
      { url: 'https://news.google.com/rss/search?q=CRISPR+technology+OR+gene+editing+tool&hl=en-US&gl=US&ceid=US:en', max: 5 },
      { url: 'https://news.google.com/rss/search?q=AI+drug+discovery+OR+machine+learning+biology&hl=en-US&gl=US&ceid=US:en', max: 5 }
    ];

    const articles = await this.fetchMultipleFeeds(feeds, 12);
    this.cache.set(key, { data: articles, timestamp: Date.now() });
    return articles;
  }

  async fetchPubMed(term, max = 10) {
    const key = `pm_${term}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';

    try {
      const searchRes = await fetch(
        `${base}esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=${max}&retmode=json&sort=date`
      );
      const searchData = await searchRes.json();
      const ids = searchData.esearchresult?.idlist || [];

      if (!ids.length) return [];

      const summaryRes = await fetch(
        `${base}esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
      );
      const summaryData = await summaryRes.json();

      const articles = ids.map(id => {
        const a = summaryData.result?.[id];
        return a ? {
          title: a.title,
          authors: a.authors?.slice(0, 3).map(x => x.name).join(', '),
          journal: a.source,
          date: a.pubdate,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
        } : null;
      }).filter(Boolean);

      this.cache.set(key, { data: articles, timestamp: Date.now() });
      return articles;
    } catch (e) {
      console.error('PubMed fetch error:', e);
      return [];
    }
  }
}

// Auto-refresh timer
let refreshTimer = null;

export async function initNewsPage() {
  await loadAllFeeds();

  // Set up auto-refresh every 30 minutes
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(async () => {
    console.log('Auto-refreshing news feeds...');
    updateLastRefresh();
    await loadAllFeeds(true); // Force refresh
  }, 30 * 60 * 1000);

  // Update the "last updated" indicator
  updateLastRefresh();
}

async function loadAllFeeds(forceRefresh = false) {
  const feed = new NewsFeed();

  if (forceRefresh) {
    feed.cache.clear();
  }

  // Show loading state
  const columns = ['feed-organ-chip', 'feed-organoids', 'feed-digital-twins', 'feed-regulatory', 'feed-pharma', 'feed-industry', 'feed-research', 'feed-tech'];
  columns.forEach(id => {
    const el = document.getElementById(id);
    if (el && forceRefresh) {
      el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
  });

  console.log('Fetching news feeds...');

  // Fetch all feeds in parallel
  const [organChip, organoid, digitalTwin, regulatory, pharma, industry, researchNews, tech] = await Promise.all([
    feed.fetchOrganChip(),
    feed.fetchOrganoids(),
    feed.fetchDigitalTwins(),
    feed.fetchRegulatory(),
    feed.fetchPharma(),
    feed.fetchIndustry(),
    feed.fetchResearchNews(),
    feed.fetchTech()
  ]);

  console.log('Feeds loaded:', {
    organChip: organChip.length,
    organoid: organoid.length,
    digitalTwin: digitalTwin.length,
    regulatory: regulatory.length,
    pharma: pharma.length,
    industry: industry.length,
    researchNews: researchNews.length,
    tech: tech.length
  });

  renderColumn('feed-organ-chip', organChip);
  renderColumn('feed-organoids', organoid);
  renderColumn('feed-digital-twins', digitalTwin);
  renderColumn('feed-regulatory', regulatory);
  renderColumn('feed-pharma', pharma);
  renderColumn('feed-industry', industry);
  renderColumn('feed-research', researchNews);
  renderColumn('feed-tech', tech);

  // Fetch PubMed research - multiple queries for variety (broader searches for better results)
  const [organoidPapers, chipPapers, twinPapers, pharmaResearch] = await Promise.all([
    feed.fetchPubMed('organoid', 4),
    feed.fetchPubMed('organ-on-chip OR microphysiological systems OR tissue chip', 4),
    feed.fetchPubMed('digital twin medicine OR in silico clinical trial', 4),
    feed.fetchPubMed('drug discovery biotechnology OR preclinical model', 4)
  ]);

  // Combine and sort by date
  const allResearch = [...organoidPapers, ...chipPapers, ...twinPapers, ...pharmaResearch]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12);

  renderResearch('research-feed', allResearch);
}

function updateLastRefresh() {
  const el = document.getElementById('last-update');
  if (el) {
    el.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  }
}

function renderColumn(id, articles) {
  const el = document.getElementById(id);
  if (!el) return;

  if (!articles.length) {
    el.innerHTML = '<p class="text-secondary">No news available</p>';
    return;
  }

  el.innerHTML = articles.map(a => `
    <a href="${escapeHtml(a.link)}" target="_blank" rel="noopener" class="feed-item">
      <div class="feed-title">${escapeHtml(a.title)}</div>
      <div class="feed-meta">
        <span class="feed-source">${escapeHtml(a.source)}</span>
        <span class="feed-date">${escapeHtml(a.date)}</span>
      </div>
    </a>
  `).join('');
}

function renderResearch(id, articles) {
  const el = document.getElementById(id);
  if (!el) return;

  if (!articles.length) {
    el.innerHTML = '<p class="text-secondary">No research articles available</p>';
    return;
  }

  el.innerHTML = articles.map(a => `
    <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener" class="research-item">
      <div class="research-title">${escapeHtml(a.title)}</div>
      <div class="research-meta">${escapeHtml(a.journal)} | ${escapeHtml(a.date)}</div>
    </a>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}
