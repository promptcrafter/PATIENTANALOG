/**
 * Scientific Terminology Infrastructure
 * Clean, professional domain listing with research inquiry modal
 */

// Category icon mapping for visual identity
const categoryIcons = {
  'patient-simulation': { icon: '\u{1F9EC}', label: 'DNA' },
  'organ-on-chip': { icon: '\u{1FA7A}', label: 'Chip' },
  'organoids': { icon: '\u{1F9AB}', label: 'Organoid' },
  'ai-computational': { icon: '\u{1F916}', label: 'AI' },
  'cell-gene-therapy': { icon: '\u{1F9EC}', label: 'Gene' },
  'immunology': { icon: '\u{1FA78}', label: 'Blood' },
  'rna-therapeutics': { icon: '\u{1F52C}', label: 'RNA' },
  'liquid-biopsy': { icon: '\u{1F9EA}', label: 'Biopsy' },
  'metabolic': { icon: '\u{2697}\uFE0F', label: 'Metabolic' },
  'neurotech': { icon: '\u{1F9E0}', label: 'Brain' },
  'emerging-tech': { icon: '\u{1F680}', label: 'Emerging' },
  'robotics': { icon: '\u{1F916}', label: 'Robot' },
  'specialty': { icon: '\u{2B50}', label: 'Specialty' },
  'fragrance-botanical': { icon: '\u{1F339}', label: 'Rose' },
  'arabic-idn': { icon: '\u{1F319}', label: 'Crescent' },
  'chinese-idn': { icon: '\u{1F409}', label: 'Dragon' }
};

document.addEventListener('DOMContentLoaded', async () => {
  // Create research inquiry modal
  createInquiryModal();

  // Initialize counter animations for stats
  initCounterAnimations();

  try {
    const paths = ['/data/domains.json', '/src/data/domains.json'];
    let data = null;

    for (const path of paths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          data = await response.json();
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!data) throw new Error('Could not load domains');

    // Render domain categories
    renderDomainCategories(data);

    // Initialize scroll reveal for categories
    initScrollReveal();

  } catch (error) {
    console.error('Failed to load terminology data:', error);
    document.getElementById('domain-categories').innerHTML = `
      <div class="loading-error">
        <p class="text-secondary">Data temporarily unavailable</p>
        <button onclick="location.reload()" class="retry-btn">Retry</button>
      </div>
    `;
  }
});

/**
 * Create professional research inquiry modal
 */
function createInquiryModal() {
  const modal = document.createElement('div');
  modal.id = 'domainInquiryModal';
  modal.className = 'domain-inquiry-modal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeInquiryModal()"></div>
    <div class="modal-content">
      <button class="modal-close" onclick="closeInquiryModal()" aria-label="Close">&times;</button>
      <div class="modal-header">
        <h3>Research Inquiry</h3>
        <p id="modalDomainName" class="modal-domain"></p>
      </div>
      <p class="modal-description">Submit an inquiry regarding this scientific terminology domain.</p>
      <form id="domainInquiryForm" action="https://api.web3forms.com/submit" method="POST">
        <input type="hidden" name="access_key" value="eefefa49-2e87-4a1d-9897-25d4b2d7d4d5">
        <input type="hidden" name="subject" id="formSubject" value="Research Inquiry - Patient Analog">
        <input type="hidden" name="redirect" value="https://patientanalog.com/thank-you.html">
        <input type="hidden" name="from_name" value="Research Inquiry">
        <input type="hidden" name="domain_term" id="hiddenDomain" value="">

        <div class="form-group">
          <label>Domain</label>
          <input type="text" name="terminology" id="displayDomain" class="form-input" readonly>
        </div>
        <div class="form-group">
          <label>Your Name</label>
          <input type="text" name="name" class="form-input" placeholder="Full Name" required>
        </div>
        <div class="form-group">
          <label>Organization</label>
          <input type="text" name="organization" class="form-input" placeholder="Company or Institution">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" class="form-input" placeholder="your.email@organization.com" required>
        </div>
        <div class="form-group">
          <label>Inquiry Type</label>
          <select name="inquiry_type" class="form-input" required>
            <option value="">Select type...</option>
            <option value="Research Collaboration">Research Collaboration</option>
            <option value="Licensing Information">Licensing Information</option>
            <option value="Partnership Discussion">Partnership Discussion</option>
            <option value="General Inquiry">General Inquiry</option>
          </select>
        </div>
        <div class="form-group">
          <label>Message</label>
          <textarea name="message" class="form-textarea" placeholder="Describe your research interest or inquiry..." rows="4" required></textarea>
        </div>
        <button type="submit" class="form-submit">
          <span>Submit Inquiry</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // Add modal styles
  const style = document.createElement('style');
  style.textContent = `
    .domain-inquiry-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      justify-content: center;
      align-items: center;
    }
    .domain-inquiry-modal.active {
      display: flex;
      animation: modalFadeIn 0.3s ease;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 8, 24, 0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .modal-content {
      position: relative;
      background: linear-gradient(135deg, rgba(0, 21, 64, 0.98) 0%, rgba(0, 32, 96, 0.95) 100%);
      border: 1px solid rgba(14, 165, 233, 0.4);
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(14, 165, 233, 0.1);
      animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .modal-close {
      position: absolute;
      top: 15px;
      right: 20px;
      background: none;
      border: none;
      color: rgba(148, 163, 184, 0.7);
      font-size: 28px;
      cursor: pointer;
      transition: all 0.3s;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .modal-close:hover {
      color: #ffffff;
      background: rgba(14, 165, 233, 0.2);
    }
    .modal-header {
      text-align: center;
      margin-bottom: 20px;
    }
    .modal-header h3 {
      font-family: 'Inter', sans-serif;
      font-size: 1.4rem;
      font-weight: 600;
      color: #fff;
      margin: 0 0 12px 0;
    }
    .modal-domain {
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      font-size: 1.1rem;
      color: #0ea5e9;
      font-weight: 500;
      padding: 8px 16px;
      background: rgba(14, 165, 233, 0.1);
      border: 1px solid rgba(14, 165, 233, 0.3);
      border-radius: 6px;
      display: inline-block;
    }
    .modal-description {
      color: rgba(148, 163, 184, 0.9);
      font-size: 0.9rem;
      margin-bottom: 25px;
      line-height: 1.6;
      text-align: center;
    }
    .modal-content .form-group {
      margin-bottom: 18px;
    }
    .modal-content label {
      display: block;
      color: rgba(224, 242, 254, 0.9);
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 6px;
    }
    .modal-content .form-input,
    .modal-content .form-textarea {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid rgba(14, 165, 233, 0.25);
      border-radius: 8px;
      background: rgba(0, 16, 48, 0.8);
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      transition: all 0.3s;
      box-sizing: border-box;
    }
    .modal-content .form-input:focus,
    .modal-content .form-textarea:focus {
      outline: none;
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
      background: rgba(0, 21, 64, 0.9);
    }
    .modal-content .form-input::placeholder,
    .modal-content .form-textarea::placeholder {
      color: rgba(148, 163, 184, 0.5);
    }
    .modal-content .form-input[readonly] {
      background: rgba(14, 165, 233, 0.1);
      color: #38bdf8;
      font-weight: 500;
      cursor: default;
    }
    .modal-content select.form-input {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 15px center;
    }
    .modal-content .form-submit {
      width: 100%;
      padding: 14px 28px;
      background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
      border: none;
      border-radius: 8px;
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .modal-content .form-submit:hover {
      background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
      box-shadow: 0 6px 25px rgba(14, 165, 233, 0.35);
      transform: translateY(-2px);
    }
    .loading-error {
      text-align: center;
      padding: 60px;
    }
    .retry-btn {
      margin-top: 20px;
      padding: 12px 30px;
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      border: none;
      border-radius: 8px;
      color: #ffffff;
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .retry-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(14, 165, 233, 0.3);
    }
    .domain-category.revealed,
    .domain-item.revealed {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Open inquiry modal with domain pre-filled
 */
function openInquiryModal(domain, label) {
  const modal = document.getElementById('domainInquiryModal');
  document.getElementById('modalDomainName').textContent = domain;
  document.getElementById('displayDomain').value = domain;
  document.getElementById('hiddenDomain').value = domain;
  document.getElementById('formSubject').value = `Research Inquiry: ${domain} - Patient Analog`;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Close inquiry modal
 */
function closeInquiryModal() {
  const modal = document.getElementById('domainInquiryModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Close on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeInquiryModal();
});

/**
 * Render all domain categories
 */
function renderDomainCategories(data) {
  const container = document.getElementById('domain-categories');
  if (!container) return;

  const categories = data.categories || [];

  container.innerHTML = categories.map((cat, catIndex) => {
    const iconData = categoryIcons[cat.id] || { icon: '\u{1F4BB}', label: 'Domain' };
    const domainCount = cat.domains.length;

    return `
      <div class="domain-category" data-category="${escapeHtml(cat.id)}" style="animation-delay: ${catIndex * 0.05}s">
        <div class="category-header">
          <div class="category-icon" aria-label="${iconData.label}">${iconData.icon}</div>
          <h3 class="category-title">${escapeHtml(cat.name)}</h3>
          <span class="category-count">${domainCount} domain${domainCount !== 1 ? 's' : ''}</span>
        </div>
        <p class="category-description">${escapeHtml(cat.description)}</p>
        <div class="domain-list">
          ${cat.domains.map((d, idx) => renderDomainItem(d, idx)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render individual domain card - simple, clean design
 */
function renderDomainItem(domain, index) {
  const animationDelay = Math.min(index * 0.03, 0.5);

  return `
    <div class="domain-item"
         style="animation-delay: ${animationDelay}s"
         tabindex="0"
         role="button"
         aria-label="${escapeHtml(domain.domain)} - ${escapeHtml(domain.label)}"
         onclick="openInquiryModal('${escapeHtml(domain.domain)}', '${escapeHtml(domain.label)}')"
         onkeypress="handleDomainKeypress(event, '${escapeHtml(domain.domain)}', '${escapeHtml(domain.label)}')">
      <span class="domain-name">${escapeHtml(domain.domain)}</span>
      <span class="domain-label">${escapeHtml(domain.label)}</span>
    </div>
  `;
}

/**
 * Handle keyboard navigation for accessibility
 */
function handleDomainKeypress(event, domain, label) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openInquiryModal(domain, label);
  }
}

/**
 * Initialize counter animations for statistics
 */
function initCounterAnimations() {
  const counters = document.querySelectorAll('.stat-value');

  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  counters.forEach(counter => {
    counterObserver.observe(counter);
  });
}

/**
 * Animate a counter from 0 to its target value
 */
function animateCounter(element) {
  const target = parseInt(element.textContent.replace(/[^\d]/g, ''), 10);
  if (isNaN(target)) return;

  const duration = 2000;
  const startTime = performance.now();
  const easing = (t) => 1 - Math.pow(1 - t, 4);

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const current = Math.round(target * easedProgress);

    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target;
    }
  }

  requestAnimationFrame(update);
}

/**
 * Initialize scroll reveal animations for categories
 */
function initScrollReveal() {
  const categories = document.querySelectorAll('.domain-category');

  const revealOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');

        const items = entry.target.querySelectorAll('.domain-item');
        items.forEach((item, idx) => {
          setTimeout(() => {
            item.classList.add('revealed');
          }, idx * 30);
        });
      }
    });
  }, revealOptions);

  categories.forEach(cat => {
    revealObserver.observe(cat);
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// Make functions globally available
window.openInquiryModal = openInquiryModal;
window.closeInquiryModal = closeInquiryModal;
window.handleDomainKeypress = handleDomainKeypress;
// v20260117-FULL
