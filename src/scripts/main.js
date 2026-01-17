// Global navigation, footer, and clocks initialization
// Cursor now handled by modular engine system
import '../engines/index.js';

document.addEventListener('DOMContentLoaded', () => {
  initSpaceBackground();
  initNav();
  initFooter();
  initMobileNav();
  initGlobalClocks();
  initBiotechOrganism();
});

function initSpaceBackground() {
  if (document.querySelector('.space-stars')) return;

  // Layer 1: Stars (deepest)
  var stars = document.createElement('div');
  stars.className = 'space-stars';

  // Layer 2: Deep nebula (behind main nebula)
  var nebulaDeep = document.createElement('div');
  nebulaDeep.className = 'space-nebula-deep';

  // Layer 3: Deep particles (behind main nebula)
  var deepParticles = document.createElement('div');
  deepParticles.className = 'deep-particles';

  // Layer 4: Main nebula
  var nebula = document.createElement('div');
  nebula.className = 'space-nebula';

  document.body.insertBefore(nebula, document.body.firstChild);
  document.body.insertBefore(deepParticles, document.body.firstChild);
  document.body.insertBefore(nebulaDeep, document.body.firstChild);
  document.body.insertBefore(stars, document.body.firstChild);

  // Create deep particles (30 - larger, slower, dimmer)
  for (var d = 0; d < 30; d++) {
    var deepP = document.createElement('div');
    deepP.className = 'deep-particle';
    deepP.style.left = Math.random() * 100 + 'vw';
    deepP.style.top = Math.random() * 100 + 'vh';
    deepP.style.animationDelay = Math.random() * 8 + 's';
    deepParticles.appendChild(deepP);
  }

  // Create twinkle stars (80)
  for (var i = 0; i < 80; i++) {
    var star = document.createElement('div');
    var size = Math.random();
    star.className = 'twinkle-star ' + (size < 0.6 ? 'small' : size < 0.9 ? 'medium' : 'large');
    star.style.left = Math.random() * 100 + 'vw';
    star.style.top = Math.random() * 100 + 'vh';
    star.style.animationDelay = Math.random() * 5 + 's';
    document.body.appendChild(star);
  }

  // Create floating particles (40)
  for (var j = 0; j < 40; j++) {
    var particle = document.createElement('div');
    particle.className = 'particle ' + (Math.random() > 0.7 ? 'spark' : 'dust');
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.animationDelay = Math.random() * 25 + 's';
    particle.style.animationDuration = (15 + Math.random() * 15) + 's';
    document.body.appendChild(particle);
  }

  // Create cursor glow
  var cursorGlow = document.createElement('div');
  cursorGlow.className = 'cursor-glow';
  document.body.appendChild(cursorGlow);

  var cursorInner = document.createElement('div');
  cursorInner.className = 'cursor-glow-inner';
  document.body.appendChild(cursorInner);

  var targetX = 0, targetY = 0;
  var currentX = 0, currentY = 0;
  var glowX = 0, glowY = 0;
  var innerX = 0, innerY = 0;
  var mouseX = 0, mouseY = 0;
  var time = 0;

  document.addEventListener('mousemove', function(e) {
    targetX = (e.clientX / window.innerWidth - 0.5);
    targetY = (e.clientY / window.innerHeight - 0.5);
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    time += 0.003;
    currentX += (targetX - currentX) * 0.05;
    currentY += (targetY - currentY) * 0.05;

    // Nebula autonomous drift (slow figure-8 pattern)
    var nebulaDriftX = Math.sin(time) * 25;
    var nebulaDriftY = Math.sin(time * 0.7) * 20;

    // Deep nebula drift (slower, opposite direction)
    var deepDriftX = Math.sin(time * 0.5) * 15;
    var deepDriftY = Math.cos(time * 0.4) * 12;

    // Parallax - PREMIUM: subtle, barely noticeable depth (50% slower)
    stars.style.transform = 'translate3d(' + (currentX * -15) + 'px, ' + (currentY * -15) + 'px, 0)';
    nebulaDeep.style.transform = 'translate3d(' + (currentX * -22 + deepDriftX * 0.5) + 'px, ' + (currentY * -22 + deepDriftY * 0.5) + 'px, 0)';
    deepParticles.style.transform = 'translate3d(' + (currentX * -28) + 'px, ' + (currentY * -28) + 'px, 0)';
    nebula.style.transform = 'translate3d(' + (currentX * -35 + nebulaDriftX * 0.5) + 'px, ' + (currentY * -35 + nebulaDriftY * 0.5) + 'px, 0)';

    // Cursor glow (outer follows slower)
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top = glowY + 'px';

    // Inner glow (follows faster)
    innerX += (mouseX - innerX) * 0.15;
    innerY += (mouseY - innerY) * 0.15;
    cursorInner.style.left = innerX + 'px';
    cursorInner.style.top = innerY + 'px';

    requestAnimationFrame(animate);
  }

  animate();

  // Scroll reveal
  var reveals = document.querySelectorAll('section, .card, .pyramid-container');
  reveals.forEach(function(el) {
    el.classList.add('reveal');
  });

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach(function(el) {
    observer.observe(el);
  });
}

function initNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  nav.innerHTML = `
    <div class="nav-content">
      <a href="/" class="nav-logo" title="Return to Home">
        <span class="logo-text">Patient Analog</span>
      </a>
      <div class="global-clocks" id="global-clocks">
        <span class="live-indicator"><span class="live-dot"></span>LIVE</span>
        <span class="clock-item" id="clock-DC" title="FDA - Washington DC"></span>
        <span class="clock-item" id="clock-LON" title="EMA - London"></span>
        <span class="clock-item" id="clock-EU" title="EU - Brussels"></span>
        <span class="clock-item" id="clock-KSA" title="Saudi Arabia - Riyadh"></span>
        <span class="clock-item" id="clock-TYO" title="PMDA - Tokyo"></span>
        <span class="clock-item" id="clock-BEI" title="NMPA - Beijing"></span>
      </div>
      <button class="nav-mobile-toggle" id="nav-toggle" aria-label="Toggle navigation">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="nav-links" id="nav-links">
        <a href="/platform" class="nav-link">Platform</a>
        <a href="/technology" class="nav-link">Technology</a>
        <a href="/science" class="nav-link">Science</a>
        <a href="/companies" class="nav-link">Companies</a>
        <a href="/regulatory" class="nav-link">Regulatory</a>
        <a href="/market" class="nav-link">Market</a>
        <a href="/research" class="nav-link">Research</a>
        <a href="/portfolio" class="nav-link">Glossary</a>
        <a href="/games" class="nav-link">BioLab</a>
        <a href="/news" class="nav-link">News</a>
      </div>
    </div>
  `;
}

function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('active');
      toggle.classList.toggle('active');
    });
  }
}

function getContextualFooter() {
  const path = window.location.pathname;

  // Footer A - Authority (Platform, Companies, Regulatory, Market)
  const footerA = `
    <div class="contextual-footer footer-authority">
      <h3>PATIENT ANALOG</h3>
      <p>436+ curated resources | Framework aligned with NIH NCATS | FDA NAMs | DARPA MPS</p>
      <p class="portfolio-note">Part of a 140+ premium biotech domain portfolio.</p>
      <div class="contextual-links">
        <a href="/research" class="ctx-btn">Research Links</a>
        <a href="/contact" class="ctx-btn ctx-btn-outline">Strategic Inquiries</a>
      </div>
    </div>
  `;

  // Footer B - Games Promo (Technology, Science, News)
  const footerB = `
    <div class="contextual-footer footer-games">
      <h3>Try our interactive experiences:</h3>
      <p class="games-list">Science Lab - 6 simulations | Discovery Zone | Kenneth's Adventure</p>
      <div class="contextual-links">
        <a href="/games" class="ctx-btn">View All BioLab</a>
      </div>
    </div>
  `;

  // Footer C - Research Promo (Games, Research)
  const footerC = `
    <div class="contextual-footer footer-research">
      <h3>Want to learn more?</h3>
      <p class="research-list">436+ Research Links | Regulatory Updates | Latest Science</p>
      <div class="contextual-links">
        <a href="/research" class="ctx-btn">Explore Research Hub</a>
      </div>
    </div>
  `;

  // Page mapping
  if (path.includes('platform') || path.includes('companies') || path.includes('regulatory') || path.includes('market')) {
    return footerA;
  } else if (path.includes('technology') || path.includes('science') || path.includes('news')) {
    return footerB;
  } else if (path.includes('games') || path.includes('research') || path.includes('kids')) {
    return footerC;
  }

  // Default: no contextual footer for homepage and other pages
  return '';
}

function initFooter() {
  const footer = document.getElementById('main-footer');
  if (!footer) return;

  const contextualSection = getContextualFooter();

  footer.innerHTML = `
    ${contextualSection}
    <div class="footer-grid">
      <div class="footer-section">
        <h4>Platform</h4>
        <a href="/technology">Technology</a>
        <a href="/science">Science</a>
        <a href="/technology">Framework</a>
      </div>
      <div class="footer-section">
        <h4>Research</h4>
        <a href="/companies">Companies</a>
        <a href="/regulatory">Regulatory</a>
        <a href="/market">Market</a>
      </div>
      <div class="footer-section">
        <h4>Resources</h4>
        <a href="/research">Research Links</a>
        <a href="/glossary">Glossary</a>
        <a href="/portfolio">Terminology Index</a>
        <a href="/news">News</a>
      </div>
      <div class="footer-section">
        <h4>About</h4>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
        <a href="/games/kids-zone">Discovery Zone</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 Patient Analog</span>
      <div class="footer-legal">
        <a href="/legal/privacy">Privacy</a>
        <a href="/legal/terms">Terms</a>
        <a href="/portfolio">Research Assets</a>
      </div>
    </div>
  `;
}

// Global time zone clocks for major biotech/regulatory hubs
const timeZones = [
  { id: 'DC', zone: 'America/New_York', label: 'DC' },
  { id: 'LON', zone: 'Europe/London', label: 'LON' },
  { id: 'EU', zone: 'Europe/Brussels', label: 'EU' },
  { id: 'KSA', zone: 'Asia/Riyadh', label: 'KSA' },
  { id: 'TYO', zone: 'Asia/Tokyo', label: 'TYO' },
  { id: 'BEI', zone: 'Asia/Shanghai', label: 'BEI' }
];

function isBusinessHours(zone) {
  const now = new Date();
  const options = { timeZone: zone, hour: 'numeric', hour12: false };
  const hour = parseInt(now.toLocaleString('en-US', options));
  const dayOptions = { timeZone: zone, weekday: 'short' };
  const day = now.toLocaleString('en-US', dayOptions);
  const isWeekend = day === 'Sat' || day === 'Sun';
  return !isWeekend && hour >= 9 && hour < 17;
}

function updateGlobalClocks() {
  timeZones.forEach(tz => {
    const el = document.getElementById(`clock-${tz.id}`);
    if (el) {
      const time = new Date().toLocaleTimeString('en-US', {
        timeZone: tz.zone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const isOpen = isBusinessHours(tz.zone);
      el.innerHTML = `<span class="clock-label">${tz.label}</span><span class="clock-time">${time}</span><span class="clock-status ${isOpen ? 'open' : 'closed'}"></span>`;
    }
  });
}

function initGlobalClocks() {
  updateGlobalClocks();
  setInterval(updateGlobalClocks, 1000);
}

// ═══════════════════════════════════════════════════════════════
// LIVING BIOTECH ORGANISM - Easter Egg that grows over time
// ═══════════════════════════════════════════════════════════════

function initBiotechOrganism() {
  // Check when user first visited
  var firstVisit = localStorage.getItem('pa-organism-birth');
  var now = Date.now();

  if (!firstVisit) {
    localStorage.setItem('pa-organism-birth', now);
    firstVisit = now;
  }

  // Calculate age in days
  var ageMs = now - parseInt(firstVisit);
  var ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  // Determine growth stage (1-5)
  var stage;
  if (ageDays < 1) stage = 1;        // Day 0: tiny
  else if (ageDays < 7) stage = 2;   // Week 1: small
  else if (ageDays < 30) stage = 3;  // Month 1: medium
  else if (ageDays < 180) stage = 4; // 6 months: large
  else stage = 5;                     // 6+ months: mature

  // Page-specific positions (easter egg locations)
  var positions = {
    'index': { bottom: '20px', right: '30px' },
    'platform': { top: '150px', left: '20px' },
    'technology': { top: '300px', right: '20px' },
    'science': { bottom: '100px', left: '40px' },
    'companies': { top: '200px', right: '40px' },
    'regulatory': { bottom: '150px', right: '60px' },
    'market': { top: '250px', left: '30px' },
    'research': { bottom: '80px', left: '50px' },
    'games': { bottom: '200px', right: '50px' },
    'news': { top: '350px', left: '25px' },
    'default': { bottom: '30px', right: '30px' }
  };

  // Detect current page
  var path = window.location.pathname;
  var page = 'default';

  if (path === '/' || path.includes('index')) page = 'index';
  else if (path.includes('platform')) page = 'platform';
  else if (path.includes('technology')) page = 'technology';
  else if (path.includes('science')) page = 'science';
  else if (path.includes('companies')) page = 'companies';
  else if (path.includes('regulatory')) page = 'regulatory';
  else if (path.includes('market')) page = 'market';
  else if (path.includes('research')) page = 'research';
  else if (path.includes('games')) page = 'games';
  else if (path.includes('news')) page = 'news';

  var pos = positions[page] || positions['default'];

  // Create organism HTML
  var organism = document.createElement('div');
  organism.className = 'biotech-organism organism-stage-' + stage;
  organism.innerHTML = createOrganismHTML(stage);

  // Position it
  Object.keys(pos).forEach(function(key) {
    organism.style[key] = pos[key];
  });

  // Add tooltip on hover
  organism.title = 'Day ' + ageDays + ' · Stage ' + stage + '/5';

  // Click reveals info
  organism.style.pointerEvents = 'auto';
  organism.addEventListener('click', function() {
    showOrganismInfo(ageDays, stage);
  });

  document.body.appendChild(organism);
}

function createOrganismHTML(stage) {
  var html = '<div class="organism-core"></div>';
  html += '<div class="organism-membrane"></div>';

  // Add child cells based on stage
  if (stage >= 2) {
    html += '<div class="organism-child" style="width:8px;height:8px;top:-10px;left:50%;"></div>';
  }
  if (stage >= 3) {
    html += '<div class="organism-child" style="width:10px;height:10px;bottom:-12px;right:20%;"></div>';
    html += '<div class="organism-child" style="width:6px;height:6px;top:30%;left:-8px;"></div>';
  }
  if (stage >= 4) {
    html += '<div class="organism-child" style="width:12px;height:12px;top:-15px;right:20%;"></div>';
    html += '<div class="organism-child" style="width:8px;height:8px;bottom:-10px;left:10%;"></div>';
    html += '<div class="organism-tendril" style="width:20px;top:50%;right:-20px;"></div>';
  }
  if (stage >= 5) {
    html += '<div class="organism-child" style="width:14px;height:14px;top:50%;left:-18px;"></div>';
    html += '<div class="organism-child" style="width:10px;height:10px;bottom:20%;right:-12px;"></div>';
    html += '<div class="organism-tendril" style="width:25px;bottom:30%;left:-25px;transform:rotate(180deg);"></div>';
    html += '<div class="organism-tendril" style="width:30px;top:20%;right:-30px;transform:rotate(-20deg);"></div>';
  }

  return html;
}

function showOrganismInfo(ageDays, stage) {
  var stageNames = ['', 'Nascent Cell', 'Young Colony', 'Growing Cluster', 'Thriving Network', 'Mature Organism'];
  var nextMilestone = '';

  if (stage === 1) nextMilestone = 'Next stage in ' + (1 - ageDays) + ' days';
  else if (stage === 2) nextMilestone = 'Next stage in ' + (7 - ageDays) + ' days';
  else if (stage === 3) nextMilestone = 'Next stage in ' + (30 - ageDays) + ' days';
  else if (stage === 4) nextMilestone = 'Next stage in ' + (180 - ageDays) + ' days';
  else nextMilestone = 'Fully evolved!';

  // Create modal instead of alert
  var modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,20,40,0.95);border:1px solid rgba(0,212,255,0.5);border-radius:16px;padding:32px;z-index:10000;max-width:320px;text-align:center;box-shadow:0 0 40px rgba(0,212,255,0.3);';
  modal.innerHTML = `
    <div style="font-size:48px;margin-bottom:16px;">🧬</div>
    <h3 style="color:#00d4ff;margin:0 0 8px;font-size:18px;">Patient Analog Organism</h3>
    <p style="color:#94a3b8;margin:0 0 16px;font-size:14px;">${stageNames[stage]}</p>
    <div style="display:flex;justify-content:space-around;margin-bottom:16px;">
      <div><div style="color:#fff;font-size:24px;font-weight:bold;">${ageDays}</div><div style="color:#64748b;font-size:11px;">DAYS OLD</div></div>
      <div><div style="color:#00ff99;font-size:24px;font-weight:bold;">${stage}/5</div><div style="color:#64748b;font-size:11px;">STAGE</div></div>
    </div>
    <p style="color:#64748b;font-size:12px;margin:0 0 16px;">${nextMilestone}</p>
    <button style="background:linear-gradient(135deg,#0284c7,#0ea5e9);border:none;color:#fff;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;" onclick="this.parentElement.remove()">Close</button>
  `;

  // Click outside to close
  var backdrop = document.createElement('div');
  backdrop.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;';
  backdrop.onclick = function() { backdrop.remove(); modal.remove(); };

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
}
