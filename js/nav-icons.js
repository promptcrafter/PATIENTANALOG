/**
 * Premium Navigation SVG Icons
 * PatientAnalog.com - Biotech Enterprise Icon System
 * Icons inject at runtime, current section hidden
 */

const NAV_ICONS = {
    technologies: `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,2 21,7 21,17 12,22 3,17 3,7"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none"/>
        <line x1="8" y1="10" x2="12" y2="12"/>
        <line x1="16" y1="10" x2="12" y2="12"/>
    </svg>`,
    science: `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="6" r="3"/>
        <circle cx="6" cy="16" r="3"/>
        <circle cx="18" cy="16" r="3"/>
        <line x1="12" y1="9" x2="7.5" y2="13.5"/>
        <line x1="12" y1="9" x2="16.5" y2="13.5"/>
        <line x1="9" y1="16" x2="15" y2="16"/>
    </svg>`,
    companies: `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="6" width="7" height="15"/>
        <rect x="13" y="2" width="7" height="19"/>
        <line x1="6" y1="9" x2="9" y2="9"/>
        <line x1="6" y1="12" x2="9" y2="12"/>
        <line x1="6" y1="15" x2="9" y2="15"/>
        <line x1="15" y1="5" x2="18" y2="5"/>
        <line x1="15" y1="8" x2="18" y2="8"/>
        <line x1="15" y1="11" x2="18" y2="11"/>
        <line x1="15" y1="14" x2="18" y2="14"/>
    </svg>`,
    industry: `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12,1 L14,4 L18,3 L17,7 L21,8 L19,11 L21,14 L17,15 L18,19 L14,18 L12,21 L10,18 L6,19 L7,15 L3,14 L5,11 L3,8 L7,7 L6,3 L10,4 Z"/>
    </svg>`,
    regulatory: `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12,2 L21,6 L21,12 C21,16.5 17,20.5 12,22 C7,20.5 3,16.5 3,12 L3,6 L12,2 Z"/>
        <polyline points="8,12 11,15 16,9"/>
    </svg>`,
    market: `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <polyline points="3,18 8,13 12,16 21,6"/>
        <polyline points="17,6 21,6 21,10"/>
        <line x1="3" y1="21" x2="21" y2="21"/>
        <line x1="3" y1="3" x2="3" y2="21"/>
    </svg>`,
    portfolio: `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="8" height="8" rx="1"/>
        <rect x="13" y="3" width="8" height="8" rx="1"/>
        <rect x="3" y="13" width="8" height="8" rx="1"/>
        <rect x="13" y="13" width="8" height="8" rx="1"/>
    </svg>`,
    legal: `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <line x1="12" y1="3" x2="12" y2="19"/>
        <line x1="5" y1="7" x2="19" y2="7"/>
        <path d="M5,7 L3,14 L7,14 Z"/>
        <path d="M19,7 L17,14 L21,14 Z"/>
        <line x1="8" y1="19" x2="16" y2="19"/>
    </svg>`,
    top: `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <polyline points="6,12 12,6 18,12"/>
        <line x1="12" y1="6" x2="12" y2="20"/>
    </svg>`,
    home: `<svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3,12 L12,3 L21,12"/>
        <path d="M5,10 L5,20 L19,20 L19,10"/>
        <rect x="9" y="14" width="6" height="6"/>
    </svg>`
};

function getCurrentSection() {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    
    if (path.includes('/technology')) return 'technologies';
    if (path.includes('/science')) return 'science';
    if (path.includes('/companies')) return 'companies';
    if (path.includes('/industry')) return 'industry';
    if (path.includes('/regulatory')) return 'regulatory';
    if (path.includes('/market')) return 'market';
    if (path.includes('/portfolio')) return 'portfolio';
    if (path.includes('/legal')) return 'legal';
    
    return null;
}

document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-links a');
    const currentSection = getCurrentSection();
    
    navLinks.forEach(function(link) {
        const href = (link.getAttribute('href') || '').toLowerCase();
        const text = link.textContent.toLowerCase().trim();
        let iconKey = null;
        let sectionKey = null;

        if (href.includes('technolog') || text.includes('technolog')) {
            iconKey = 'technologies';
            sectionKey = 'technologies';
        } else if (href.includes('science') || text === 'science') {
            iconKey = 'science';
            sectionKey = 'science';
        } else if (href.includes('compan') || text.includes('compan')) {
            iconKey = 'companies';
            sectionKey = 'companies';
        } else if (href.includes('industr') || text.includes('industr')) {
            iconKey = 'industry';
            sectionKey = 'industry';
        } else if (href.includes('regulat') || text.includes('regulat')) {
            iconKey = 'regulatory';
            sectionKey = 'regulatory';
        } else if (href.includes('market') || text === 'market') {
            iconKey = 'market';
            sectionKey = 'market';
        } else if (href.includes('portfolio') || text.includes('portfolio') || href.includes('domain-portfolio')) {
            iconKey = 'portfolio';
            sectionKey = 'portfolio';
        } else if (href.includes('legal') || text === 'legal') {
            iconKey = 'legal';
            sectionKey = 'legal';
        } else if (text.includes('top') || text.includes('↑')) {
            iconKey = 'top';
        } else if (text.includes('home') || text.includes('framework')) {
            iconKey = 'home';
        }

        // Hide current section nav item
        if (currentSection && sectionKey === currentSection) {
            link.style.display = 'none';
            return;
        }

        if (iconKey && NAV_ICONS[iconKey]) {
            const cleanText = link.textContent.replace(/[↑↓←→▲▼◀▶🔬🧬🏢⚖️📊💼🛡️⚙️]/g, '').trim();
            link.innerHTML = NAV_ICONS[iconKey] + '<span>' + cleanText + '</span>';
        }
    });
});
