/**
 * PATIENT ANALOG - Microfluidic Motion System
 * GPU-accelerated canvas-based fluid simulation
 * Simulates cells flowing through microfluidic channels
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    particleCount: 50,
    channelCount: 5,
    cellColors: [
      'rgba(255, 107, 107, 0.7)',  // Red blood cells
      'rgba(255, 255, 255, 0.6)',  // White blood cells
      'rgba(255, 193, 7, 0.5)'     // Platelets
    ],
    flowSpeed: 0.5,
    pulseFrequency: 0.002,
    enabled: true
  };

  // State
  let canvas, ctx;
  let particles = [];
  let channels = [];
  let animationId = null;
  let isVisible = true;
  let lastTime = 0;

  // Particle class
  class Particle {
    constructor(channel) {
      this.channel = channel;
      this.reset();
    }

    reset() {
      this.x = -20;
      this.y = this.channel.y + (Math.random() - 0.5) * this.channel.height * 0.6;
      this.size = 3 + Math.random() * 5;
      this.speed = CONFIG.flowSpeed * (0.7 + Math.random() * 0.6);
      this.color = CONFIG.cellColors[Math.floor(Math.random() * CONFIG.cellColors.length)];
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.02 + Math.random() * 0.03;
      this.wobbleAmp = 2 + Math.random() * 3;
      this.opacity = 0;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    update(deltaTime) {
      // Move along channel
      this.x += this.speed * deltaTime * 0.1;

      // Wobble effect (simulates turbulent flow)
      this.wobble += this.wobbleSpeed * deltaTime * 0.1;
      this.y = this.channel.y + Math.sin(this.wobble) * this.wobbleAmp;

      // Rotation
      this.rotation += this.rotationSpeed * deltaTime * 0.1;

      // Fade in/out at edges
      if (this.x < 50) {
        this.opacity = this.x / 50;
      } else if (this.x > canvas.width - 50) {
        this.opacity = (canvas.width - this.x) / 50;
      } else {
        this.opacity = 1;
      }

      // Reset when off screen
      if (this.x > canvas.width + 20) {
        this.reset();
      }
    }

    draw() {
      if (this.opacity <= 0) return;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.opacity * 0.8;

      // Draw cell body
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();

      // Inner highlight
      ctx.beginPath();
      ctx.ellipse(-this.size * 0.2, -this.size * 0.2, this.size * 0.3, this.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      ctx.restore();
    }
  }

  // Channel class
  class Channel {
    constructor(y, height, flowDirection = 1) {
      this.y = y;
      this.height = height;
      this.flowDirection = flowDirection;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.baseAlpha = 0.15 + Math.random() * 0.1;
    }

    update(time) {
      this.pulsePhase = time * CONFIG.pulseFrequency;
    }

    draw() {
      const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
      const alpha = this.baseAlpha + pulse * 0.1;

      // Channel gradient
      const gradient = ctx.createLinearGradient(0, this.y - this.height/2, 0, this.y + this.height/2);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.3, `rgba(0, 85, 255, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(0, 255, 136, ${alpha * 0.8})`);
      gradient.addColorStop(0.7, `rgba(0, 85, 255, ${alpha})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, this.y - this.height/2, canvas.width, this.height);

      // Flow lines
      ctx.strokeStyle = `rgba(0, 85, 255, ${alpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([10, 20]);
      ctx.lineDashOffset = -performance.now() * 0.02 * this.flowDirection;

      ctx.beginPath();
      ctx.moveTo(0, this.y);
      ctx.lineTo(canvas.width, this.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Junction node class
  class Junction {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = 8 + Math.random() * 8;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.003 + Math.random() * 0.002;
    }

    update(time) {
      this.pulsePhase = time * this.pulseSpeed;
    }

    draw() {
      const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
      const size = this.size * (1 + pulse * 0.3);

      // Outer glow
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 2);
      gradient.addColorStop(0, `rgba(0, 85, 255, ${0.4 + pulse * 0.3})`);
      gradient.addColorStop(0.5, `rgba(0, 255, 136, ${0.2 + pulse * 0.1})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = `rgba(0, 85, 255, ${0.6 + pulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Initialize canvas
  function initCanvas() {
    // Check if already exists
    let existing = document.getElementById('microfluidic-canvas');
    if (existing) {
      canvas = existing;
      ctx = canvas.getContext('2d');
      resizeCanvas();
      return true;
    }

    canvas = document.createElement('canvas');
    canvas.id = 'microfluidic-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      opacity: 0.5;
    `;

    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');
    resizeCanvas();

    return true;
  }

  // Resize handler
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    // Reinitialize elements on resize
    initElements();
  }

  // Initialize particles and channels
  function initElements() {
    channels = [];
    particles = [];

    const channelSpacing = window.innerHeight / (CONFIG.channelCount + 1);

    // Create channels
    for (let i = 0; i < CONFIG.channelCount; i++) {
      const y = channelSpacing * (i + 1);
      const height = 20 + Math.random() * 30;
      channels.push(new Channel(y, height, i % 2 === 0 ? 1 : -1));
    }

    // Create particles for each channel
    channels.forEach(channel => {
      const particlesPerChannel = Math.floor(CONFIG.particleCount / CONFIG.channelCount);
      for (let i = 0; i < particlesPerChannel; i++) {
        const particle = new Particle(channel);
        particle.x = Math.random() * window.innerWidth; // Spread initial positions
        particles.push(particle);
      }
    });

    // Create junction nodes at intersections
    window.junctions = [];
    for (let i = 0; i < 6; i++) {
      window.junctions.push(new Junction(
        100 + Math.random() * (window.innerWidth - 200),
        100 + Math.random() * (window.innerHeight - 200)
      ));
    }
  }

  // Animation loop
  function animate(currentTime) {
    if (!CONFIG.enabled || !isVisible) {
      animationId = requestAnimationFrame(animate);
      return;
    }

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw and update channels
    channels.forEach(channel => {
      channel.update(currentTime);
      channel.draw();
    });

    // Draw and update junctions
    if (window.junctions) {
      window.junctions.forEach(junction => {
        junction.update(currentTime);
        junction.draw();
      });
    }

    // Draw and update particles
    particles.forEach(particle => {
      particle.update(deltaTime);
      particle.draw();
    });

    animationId = requestAnimationFrame(animate);
  }

  // Visibility change handler
  function handleVisibilityChange() {
    isVisible = !document.hidden;
  }

  // Check for reduced motion preference
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Public API
  window.MicrofluidicSystem = {
    init: function() {
      // Don't initialize if reduced motion is preferred
      if (prefersReducedMotion()) {
        console.log('Microfluidic system disabled: prefers-reduced-motion');
        return;
      }

      // Don't initialize on small screens for performance
      if (window.innerWidth < 768) {
        console.log('Microfluidic system disabled: small screen');
        return;
      }

      if (!initCanvas()) return;
      initElements();

      // Event listeners
      window.addEventListener('resize', debounce(resizeCanvas, 250));
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Start animation
      lastTime = performance.now();
      animate(lastTime);

      console.log('Microfluidic motion system initialized');
    },

    destroy: function() {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    },

    setEnabled: function(enabled) {
      CONFIG.enabled = enabled;
    },

    setOpacity: function(opacity) {
      if (canvas) {
        canvas.style.opacity = opacity;
      }
    },

    setParticleCount: function(count) {
      CONFIG.particleCount = count;
      initElements();
    },

    setFlowSpeed: function(speed) {
      CONFIG.flowSpeed = speed;
    }
  };

  // Utility: debounce
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Delay init slightly to prioritize content rendering
      setTimeout(() => window.MicrofluidicSystem.init(), 500);
    });
  } else {
    setTimeout(() => window.MicrofluidicSystem.init(), 500);
  }

})();
