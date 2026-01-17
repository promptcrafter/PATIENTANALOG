/* ============================================
   PATIENT ANALOG - MASTER JAVASCRIPT Version 2.0 - Modular Authority Site
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    initDataNodes();
    initParticles();
    initScrollAnimations();
    initContactModal();
    initSectionHighlight();
    initSmoothScroll();
});

function initDataStream() {
    const streamCanvas = document.getElementById('dataStream');
    if (!streamCanvas) return;
    const streamCtx = streamCanvas.getContext('2d');
    streamCanvas.width = 200;
    streamCanvas.height = window.innerHeight;
    const dataStreams = Array.from({length: 8}, (_, i) => ({
        x: i * 25 + 10,
        y: Math.random() * streamCanvas.height,
        speed: 0.5 + Math.random() * 1.5,
        opacity: 0.3 + Math.random() * 0.4
    }));

    function animateDataStream() {
        streamCtx.fillStyle = 'rgba(0, 8, 20, 0.1)';
        streamCtx.fillRect(0, 0, streamCanvas.width, streamCanvas.height);
        dataStreams.forEach(stream => {
            streamCtx.fillStyle = `rgba(0, 85, 255, ${stream.opacity})`;
            streamCtx.font = '10px monospace';
            streamCtx.fillText(Math.random() > 0.5 ? '1' : '0', stream.x, stream.y);
            stream.y += stream.speed;
            if (stream.y > streamCanvas.height) {
                stream.y = 0;
                stream.opacity = 0.3 + Math.random() * 0.4;
            }
        });
        requestAnimationFrame(animateDataStream);
    }
    animateDataStream();
    window.addEventListener('resize', () => {
        streamCanvas.height = window.innerHeight;
    });
}

function initDataNodes() {
    const container = document.getElementById('dataNodes');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
        const node = document.createElement('div');
        node.className = 'data-node';
        node.style.left = Math.random() * 100 + '%';
        node.style.top = Math.random() * 100 + '%';
        node.style.animationDelay = Math.random() * 4 + 's';
        container.appendChild(node);
    }
}

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 3 + 1}px;
            height: ${Math.random() * 3 + 1}px;
            background: rgba(0, 85, 255, ${Math.random() * 0.5 + 0.2});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float-particle ${Math.random() * 20 + 10}s linear infinite;
            opacity: 0;
        `;
        container.appendChild(particle);
    }
}

function initScrollAnimations() {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.classList.remove('animate');
            }
        });
    }, observerOptions);
    document.querySelectorAll('.fade-in, .domain-card, .program-card, .stat-card, .glossary-item').forEach(el => {
        el.classList.add('animate');
        observer.observe(el);
    });
}

function initSectionHighlight() {
    const titles = document.querySelectorAll('.section-title');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('highlight');
                setTimeout(() => {
                    entry.target.classList.remove('highlight');
                }, 2000);
            }
        });
    }, { threshold: 0.5 });
    titles.forEach(title => observer.observe(title));
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function initContactModal() {
    const modal = document.getElementById('contactModal');
    const openButtons = document.querySelectorAll('.contact-button, .open-contact-modal');
    const closeButton = document.querySelector('.modal-close');
    const overlay = document.querySelector('.contact-modal-overlay');
    if (!modal) return;
    openButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    if (overlay) {
        overlay.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

function initDNAHelix() {
    const dnaCanvas = document.getElementById('brandedDNA');
    if (!dnaCanvas) return;
    const dnaCtx = dnaCanvas.getContext('2d');
    dnaCanvas.width = 250;
    dnaCanvas.height = 400;
    let dnaRotation = 0;

    function drawBrandedDNA() {
        dnaCtx.clearRect(0, 0, dnaCanvas.width, dnaCanvas.height);
        dnaRotation += 0.004;
        const centerX = dnaCanvas.width / 2;
        const helixRadius = 35;
        const pairsCount = 60;
        dnaCtx.strokeStyle = 'rgba(0, 85, 255, 0.15)';
        dnaCtx.lineWidth = 1.5;
        for (let i = 0; i < pairsCount - 1; i++) {
            const y1 = (i / pairsCount) * (dnaCanvas.height - 40);
            const y2 = ((i + 1) / pairsCount) * (dnaCanvas.height - 40);
            const angle1 = (i / pairsCount) * Math.PI * 8 + dnaRotation;
            const angle2 = ((i + 1) / pairsCount) * Math.PI * 8 + dnaRotation;
            const x1 = centerX + Math.cos(angle1) * helixRadius;
            const x2 = centerX + Math.cos(angle2) * helixRadius;
            dnaCtx.beginPath();
            dnaCtx.moveTo(x1, y1);
            dnaCtx.lineTo(x2, y2);
            dnaCtx.stroke();
            const x3 = centerX + Math.cos(angle1 + Math.PI) * helixRadius;
            const x4 = centerX + Math.cos(angle2 + Math.PI) * helixRadius;
            dnaCtx.strokeStyle = 'rgba(255, 170, 0, 0.15)';
            dnaCtx.beginPath();
            dnaCtx.moveTo(x3, y1);
            dnaCtx.lineTo(x4, y2);
            dnaCtx.stroke();
            dnaCtx.strokeStyle = 'rgba(0, 85, 255, 0.15)';
        }
        for (let i = 0; i < pairsCount; i++) {
            const y = (i / pairsCount) * (dnaCanvas.height - 40);
            const angle = (i / pairsCount) * Math.PI * 8 + dnaRotation;
            const x1 = centerX + Math.cos(angle) * helixRadius;
            const z1 = Math.sin(angle);
            const x2 = centerX + Math.cos(angle + Math.PI) * helixRadius;
            const z2 = Math.sin(angle + Math.PI);
            if (z1 > -0.4 && z2 > -0.4) {
                const avgZ = (z1 + z2) / 2;
                const bondOpacity = 0.25 + avgZ * 0.35;
                const bondCount = i % 3 === 0 ? 3 : 2;
                for (let b = 0; b < bondCount; b++) {
                    const bondY = y + (b - bondCount/2) * 0.8;
                    dnaCtx.strokeStyle = `rgba(255, 195, 0, ${bondOpacity})`;
                    dnaCtx.lineWidth = 0.8;
                    dnaCtx.setLineDash([2, 1]);
                    dnaCtx.beginPath();
                    dnaCtx.moveTo(x1, bondY);
                    dnaCtx.lineTo(x2, bondY);
                    dnaCtx.stroke();
                    dnaCtx.setLineDash([]);
                }
            }
            const renderNucleotide = (x, y, z, color) => {
                const opacity = 0.5 + z * 0.5;
                const size = 2.5 + z * 2;
                const glowSize = size + 2;
                const gradient = dnaCtx.createRadialGradient(x, y, 0, x, y, glowSize);
                gradient.addColorStop(0, color.replace('rgb', 'rgba').replace(')', `, ${opacity})`));
                gradient.addColorStop(1, color.replace('rgb', 'rgba').replace(')', ', 0)'));
                dnaCtx.fillStyle = gradient;
                dnaCtx.beginPath();
                dnaCtx.arc(x, y, glowSize, 0, Math.PI * 2);
                dnaCtx.fill();
                dnaCtx.fillStyle = color.replace('rgb', 'rgba').replace(')', `, ${opacity + 0.2})`);
                dnaCtx.beginPath();
                dnaCtx.arc(x, y, size, 0, Math.PI * 2);
                dnaCtx.fill();
            };
            renderNucleotide(x1, y, z1, 'rgb(0, 212, 255)');
            renderNucleotide(x2, y, z2, 'rgb(247, 37, 133)');
        }
        dnaCtx.font = 'bold 12px monospace';
        dnaCtx.fillStyle = 'rgba(0, 85, 255, 0.9)';
        dnaCtx.textAlign = 'center';
        dnaCtx.shadowBlur = 10;
        dnaCtx.shadowColor = 'rgba(0, 85, 255, 0.8)';
        dnaCtx.fillText('HUMAN SIMULATION', centerX, dnaCanvas.height - 18);
        dnaCtx.font = '9px monospace';
        dnaCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        dnaCtx.fillText('INFRASTRUCTURE', centerX, dnaCanvas.height - 6);
        dnaCtx.shadowBlur = 0;
        requestAnimationFrame(drawBrandedDNA);
    }
    drawBrandedDNA();
}

function initBiometricViz() {
    const bioCanvas = document.getElementById('biometricCanvas');
    if (!bioCanvas) return;
    const bioCtx = bioCanvas.getContext('2d');
    bioCanvas.width = window.innerWidth;
    bioCanvas.height = 60;
    let bioTime = 0;
    let currentVizIndex = 0;
    const vizTypes = ['ekg', 'pulse', 'bloodPressure', 'brain', 'cellular'];

    function naturalVar(base, variance) {
        return base + (Math.random() - 0.5) * variance;
    }

    function drawVisualization() {
        bioCtx.fillStyle = 'rgba(0, 8, 20, 0.15)';
        bioCtx.fillRect(0, 0, bioCanvas.width, bioCanvas.height);
        const vizType = vizTypes[currentVizIndex % vizTypes.length];
        switch(vizType) {
            case 'ekg':
                bioCtx.strokeStyle = '#0055ff';
                bioCtx.lineWidth = 2;
                bioCtx.shadowBlur = 8;
                bioCtx.shadowColor = '#0055ff';
                bioCtx.beginPath();
                for (let x = 0; x < bioCanvas.width; x += 2) {
                    const phase = ((x + bioTime) / bioCanvas.width) * Math.PI * 2;
                    let y = 30;
                    if (phase > 0.1 && phase < 0.2) { y += Math.sin((phase - 0.1) * Math.PI / 0.1) * 5; }
                    if (phase > 0.4 && phase < 0.5) {
                        const qrsPhase = (phase - 0.4) / 0.1;
                        if (qrsPhase < 0.3) y -= qrsPhase * 60;
                        else if (qrsPhase < 0.7) y += (qrsPhase - 0.3) * 80;
                        else y -= (qrsPhase - 0.7) * 40;
                    }
                    if (phase > 0.6 && phase < 0.8) { y += Math.sin((phase - 0.6) * Math.PI / 0.2) * 8; }
                    if (x === 0) bioCtx.moveTo(x, y);
                    else bioCtx.lineTo(x, y);
                }
                bioCtx.stroke();
                break;
            case 'pulse':
                bioCtx.strokeStyle = '#00ff88';
                bioCtx.lineWidth = 2;
                bioCtx.shadowBlur = 6;
                bioCtx.shadowColor = '#00ff88';
                bioCtx.beginPath();
                for (let x = 0; x < bioCanvas.width; x += 2) {
                    const phase = ((x + bioTime) / bioCanvas.width) * Math.PI * 2;
                    let y = naturalVar(30, 0.8);
                    if (phase > 0.2 && phase < 0.5) {
                        const pulsePhase = (phase - 0.2) / 0.3;
                        y -= Math.sin(pulsePhase * Math.PI) * 20;
                    }
                    if (phase > 0.55 && phase < 0.7) {
                        const dicPhase = (phase - 0.55) / 0.15;
                        y -= Math.sin(dicPhase * Math.PI) * 5;
                    }
                    if (x === 0) bioCtx.moveTo(x, y);
                    else bioCtx.lineTo(x, y);
                }
                bioCtx.stroke();
                break;
            case 'brain':
                bioCtx.strokeStyle = '#0055ff';
                bioCtx.lineWidth = 1.5;
                bioCtx.shadowBlur = 3;
                bioCtx.shadowColor = '#0055ff';
                bioCtx.beginPath();
                for (let x = 0; x < bioCanvas.width; x += 1) {
                    const y = naturalVar(18, 0.4) + Math.sin((x + bioTime * 3) * 0.08) * 4;
                    if (x === 0) bioCtx.moveTo(x, y);
                    else bioCtx.lineTo(x, y);
                }
                bioCtx.stroke();
                bioCtx.strokeStyle = '#7dd3fc';
                bioCtx.shadowColor = '#7dd3fc';
                bioCtx.beginPath();
                for (let x = 0; x < bioCanvas.width; x += 1) {
                    const y = naturalVar(30, 0.4) + Math.sin((x + bioTime * 5) * 0.15) * 3;
                    if (x === 0) bioCtx.moveTo(x, y);
                    else bioCtx.lineTo(x, y);
                }
                bioCtx.stroke();
                break;
        }
        bioCtx.shadowBlur = 0;
        bioTime += 2;
        requestAnimationFrame(drawVisualization);
    }
    drawVisualization();
    // Throttled scroll listener with requestAnimationFrame
    let bioVizScrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!bioVizScrollTicking) {
            requestAnimationFrame(() => {
                const scrollPos = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = scrollPos / docHeight;
                currentVizIndex = Math.floor(scrollPercent * 5);
                bioVizScrollTicking = false;
            });
            bioVizScrollTicking = true;
        }
    }, { passive: true });
    window.addEventListener('resize', () => {
        bioCanvas.width = window.innerWidth;
        bioCanvas.height = 60;
    });
}

class SoundSystem {
    constructor() {
        this.enabled = false; // Default: muted
        this.audioContext = null;
    }

    init() {
        if (this.audioContext) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    toggle() {
        this.enabled = !this.enabled;
        window.siteSoundEnabled = this.enabled; // Global flag

        if (this.enabled && !this.audioContext) {
            this.init();
        }

        // Update button icon
        const toggleBtn = document.getElementById('soundToggleBtn');
        if (toggleBtn) {
            toggleBtn.textContent = this.enabled ? '🔊' : '🔇';
            toggleBtn.classList.toggle('muted', !this.enabled);
        }

        // Confirmation beep when enabling
        if (this.enabled) {
            this.playClick(); // Or a softer beep
        }

        return this.enabled;
    }

    playHover() {
        if (!this.enabled || !this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    playClick() {
        if (!this.enabled || !this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = 1200;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }
}

const soundSystem = new SoundSystem();

// Add sound toggle button and handler
document.addEventListener('DOMContentLoaded', () => {
    // Create toggle button if it doesn't exist
    let toggleBtn = document.getElementById('soundToggleBtn');
    if (!toggleBtn) {
        toggleBtn = document.createElement('div');
        toggleBtn.id = 'soundToggleBtn';
        toggleBtn.className = 'sound-toggle muted';
        toggleBtn.textContent = '🔇';
        toggleBtn.title = 'Toggle sound effects';
        document.body.appendChild(toggleBtn);
    }

    // Toggle on click
    toggleBtn.addEventListener('click', () => {
        soundSystem.toggle();
    });
});

window.addEventListener('load', () => {
    initDataStream();
    initDNAHelix();
    initBiometricViz();

    document.querySelectorAll('.domain-card, .program-card, .nav-links a, .contact-button').forEach(el => {
        el.addEventListener('mouseenter', () => soundSystem.playHover());
        el.addEventListener('click', () => soundSystem.playClick());
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { soundSystem, initDNAHelix, initBiometricViz };
}

// ============================================
// SCROLL PROGRESS INDICATOR (Throttled with RAF)
// ============================================
(function() {
    const progressBar = document.querySelector('.scroll-progress');
    if (progressBar) {
        let progressScrollTicking = false;
        window.addEventListener('scroll', function() {
            if (!progressScrollTicking) {
                requestAnimationFrame(function() {
                    const scrollTop = window.scrollY;
                    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const scrollPercent = scrollTop / docHeight;
                    progressBar.style.transform = 'scaleX(' + scrollPercent + ')';
                    progressScrollTicking = false;
                });
                progressScrollTicking = true;
            }
        }, { passive: true });
    }
})();

// ============================================
// LAZY LOADING FOR IMAGES (if any added later)
// ============================================
if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    lazyImages.forEach(function(img) { imageObserver.observe(img); });
}

// ============================================
// ENHANCED CARD HOVER EFFECTS
// ============================================
document.querySelectorAll('.domain-card, .program-card').forEach(function(card) {
    card.addEventListener('mouseenter', function(e) {
        this.style.setProperty('--mouse-x', e.offsetX + 'px');
        this.style.setProperty('--mouse-y', e.offsetY + 'px');
    });
});

// ============================================
// SECTION REVEAL ANIMATIONS
// ============================================
if ('IntersectionObserver' in window) {
    const sections = document.querySelectorAll('.section');
    const sectionObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
                const title = entry.target.querySelector('.section-title');
                if (title) title.classList.add('highlight');
            }
        });
    }, { threshold: 0.1 });
    sections.forEach(function(section) { sectionObserver.observe(section); });
}

// ============================================
// KEYBOARD NAVIGATION ENHANCEMENT
// ============================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.querySelector('.contact-modal.active');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// ============================================
// ANALYTICS-READY EVENT TRACKING
// ============================================
window.trackEvent = function(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, { event_category: category, event_label: label });
    }
    console.log('Event:', category, action, label);
};

// Track portfolio link clicks
document.querySelectorAll('a[href*="sedo.com"]').forEach(function(link) {
    link.addEventListener('click', function() {
        var domain = this.href.match(/domain=([^&]+)/);
        if (domain) trackEvent('Portfolio', 'click', domain[1]);
    });
});

// Track contact form opens
document.querySelectorAll('.contact-button').forEach(function(btn) {
    btn.addEventListener('click', function() {
        trackEvent('Engagement', 'contact_open', 'contact_modal');
    });
});
