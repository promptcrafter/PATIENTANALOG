/**
 * GameEngine.js - Shared Game Utilities
 * Patient Analog Mini-Games Engine
 *
 * Features:
 * - Game loop management
 * - Input handling (keyboard, mouse, touch)
 * - Canvas utilities
 * - State management
 * - Responsive scaling
 */

class GameEngine {
  constructor(options = {}) {
    this.canvas = options.canvas || null;
    this.ctx = null;
    this.width = options.width || 800;
    this.height = options.height || 600;
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;

    // Input state
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false, clicked: false };
    this.touch = { x: 0, y: 0, active: false };

    // Game state
    this.state = options.initialState || 'menu';
    this.score = 0;
    this.level = 1;

    // Callbacks
    this.onUpdate = options.onUpdate || null;
    this.onRender = options.onRender || null;
    this.onStateChange = options.onStateChange || null;

    if (this.canvas) {
      this.init();
    }
  }

  init() {
    // Setup canvas
    if (typeof this.canvas === 'string') {
      this.canvas = document.getElementById(this.canvas);
    }

    if (!this.canvas) {
      console.error('[GameEngine] Canvas not found');
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.resize();

    // Setup input handlers
    this.setupInput();

    // Handle window resize
    window.addEventListener('resize', () => this.resize());

    console.log('[GameEngine] Initialized');
  }

  setupInput() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (this.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (this.height / rect.height);
    });

    this.canvas.addEventListener('mousedown', () => {
      this.mouse.down = true;
      this.mouse.clicked = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });

    // Touch
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.touch.x = (touch.clientX - rect.left) * (this.width / rect.width);
      this.touch.y = (touch.clientY - rect.top) * (this.height / rect.height);
      this.touch.active = true;
      this.mouse.x = this.touch.x;
      this.mouse.y = this.touch.y;
      this.mouse.clicked = true;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.touch.x = (touch.clientX - rect.left) * (this.width / rect.width);
      this.touch.y = (touch.clientY - rect.top) * (this.height / rect.height);
      this.mouse.x = this.touch.x;
      this.mouse.y = this.touch.y;
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.touch.active = false;
    });
  }

  resize() {
    const container = this.canvas.parentElement;
    const containerWidth = container?.clientWidth || window.innerWidth;
    const containerHeight = container?.clientHeight || window.innerHeight;

    const scale = Math.min(
      containerWidth / this.width,
      containerHeight / this.height
    );

    this.canvas.style.width = `${this.width * scale}px`;
    this.canvas.style.height = `${this.height * scale}px`;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
    console.log('[GameEngine] Started');
  }

  stop() {
    this.running = false;
    console.log('[GameEngine] Stopped');
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  loop() {
    if (!this.running) return;

    const now = performance.now();
    this.deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // FPS calculation
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    if (!this.paused) {
      // Update
      if (this.onUpdate) {
        this.onUpdate(this.deltaTime);
      }

      // Render
      this.clear();
      if (this.onRender) {
        this.onRender(this.ctx);
      }
    }

    // Reset click state
    this.mouse.clicked = false;

    requestAnimationFrame(() => this.loop());
  }

  clear(color = '#000814') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState, oldState);
    }
  }

  // Utility methods
  isKeyDown(code) {
    return this.keys[code] === true;
  }

  isClicked() {
    return this.mouse.clicked;
  }

  getMousePos() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  // Drawing helpers
  drawText(text, x, y, options = {}) {
    const {
      font = '16px system-ui',
      color = '#ffffff',
      align = 'left',
      baseline = 'top'
    } = options;

    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(text, x, y);
  }

  drawRect(x, y, w, h, color = '#0055ff') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  drawCircle(x, y, r, color = '#0055ff') {
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  drawLine(x1, y1, x2, y2, color = '#0055ff', width = 1) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.stroke();
  }

  // Collision detection
  rectCollision(r1, r2) {
    return r1.x < r2.x + r2.w &&
           r1.x + r1.w > r2.x &&
           r1.y < r2.y + r2.h &&
           r1.y + r1.h > r2.y;
  }

  circleCollision(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < c1.r + c2.r;
  }

  pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  // Random helpers
  random(min, max) {
    return Math.random() * (max - min) + min;
  }

  randomInt(min, max) {
    return Math.floor(this.random(min, max + 1));
  }

  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
if (typeof window !== 'undefined') {
  window.GameEngine = GameEngine;
}
