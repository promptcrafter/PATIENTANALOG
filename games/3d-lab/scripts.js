// 3D Visualization Lab Scripts

// Three.js 3D Brain Organoid Viewer
function initOrganoidViewer() {
  const container = document.getElementById('organoid-viewer');
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.insertBefore(renderer.domElement, container.firstChild);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;

  // Create organoid structure
  const organoid = new THREE.Group();

  // Core sphere (stem cells)
  const coreGeo = new THREE.SphereGeometry(0.8, 32, 32);
  const coreMat = new THREE.MeshPhongMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.6,
    emissive: 0x004466,
    shininess: 100
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  organoid.add(core);

  // Outer cells (neurons)
  const cellColors = [0x8b5cf6, 0xf72585, 0x00e5ff, 0x00ff88];
  for (let i = 0; i < 80; i++) {
    const size = 0.1 + Math.random() * 0.2;
    const geo = new THREE.SphereGeometry(size, 16, 16);
    const mat = new THREE.MeshPhongMaterial({
      color: cellColors[Math.floor(Math.random() * cellColors.length)],
      transparent: true,
      opacity: 0.7 + Math.random() * 0.3,
      emissive: 0x111111
    });
    const cell = new THREE.Mesh(geo, mat);

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1 + Math.random() * 0.8;

    cell.position.x = r * Math.sin(phi) * Math.cos(theta);
    cell.position.y = r * Math.sin(phi) * Math.sin(theta);
    cell.position.z = r * Math.cos(phi);

    organoid.add(cell);
  }

  scene.add(organoid);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x00e5ff, 1, 100);
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xf72585, 0.5, 100);
  pointLight2.position.set(-5, -5, 5);
  scene.add(pointLight2);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

// Three.js Microfluidic Chip Viewer
function initChipViewer() {
  const container = document.getElementById('chip-viewer');
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 3, 5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.insertBefore(renderer.domElement, container.firstChild);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;

  // Chip base
  const chipGeo = new THREE.BoxGeometry(4, 0.2, 3);
  const chipMat = new THREE.MeshPhongMaterial({
    color: 0x001a33,
    transparent: true,
    opacity: 0.8
  });
  const chip = new THREE.Mesh(chipGeo, chipMat);
  scene.add(chip);

  // Organ chambers
  const chamberPositions = [
    { x: -1.2, z: -0.8, color: 0xff4444, label: 'Heart' },
    { x: 0, z: -0.8, color: 0x8b4513, label: 'Liver' },
    { x: 1.2, z: -0.8, color: 0x4444ff, label: 'Kidney' },
    { x: -1.2, z: 0.8, color: 0xff69b4, label: 'Lung' },
    { x: 0, z: 0.8, color: 0x00ff88, label: 'Gut' },
    { x: 1.2, z: 0.8, color: 0xffaa00, label: 'Brain' }
  ];

  chamberPositions.forEach(pos => {
    const chamberGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 32);
    const chamberMat = new THREE.MeshPhongMaterial({
      color: pos.color,
      transparent: true,
      opacity: 0.8,
      emissive: pos.color,
      emissiveIntensity: 0.2
    });
    const chamber = new THREE.Mesh(chamberGeo, chamberMat);
    chamber.position.set(pos.x, 0.25, pos.z);
    scene.add(chamber);
  });

  // Microfluidic channels
  const channelMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.5 });

  // Horizontal channels
  const hChannelGeo = new THREE.BoxGeometry(3.4, 0.05, 0.08);
  const hChannel1 = new THREE.Mesh(hChannelGeo, channelMat);
  hChannel1.position.set(0, 0.12, -0.8);
  scene.add(hChannel1);

  const hChannel2 = new THREE.Mesh(hChannelGeo, channelMat);
  hChannel2.position.set(0, 0.12, 0.8);
  scene.add(hChannel2);

  // Vertical channels
  const vChannelGeo = new THREE.BoxGeometry(0.08, 0.05, 1.6);
  [-1.2, 0, 1.2].forEach(x => {
    const vChannel = new THREE.Mesh(vChannelGeo, channelMat);
    vChannel.position.set(x, 0.12, 0);
    scene.add(vChannel);
  });

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0x00e5ff, 1, 100);
  pointLight.position.set(0, 5, 5);
  scene.add(pointLight);

  // Flowing particles
  const particles = [];
  const particleGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const particleMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

  for (let i = 0; i < 30; i++) {
    const particle = new THREE.Mesh(particleGeo, particleMat);
    particle.userData = {
      speed: 0.01 + Math.random() * 0.02,
      offset: Math.random() * Math.PI * 2,
      row: Math.random() > 0.5 ? -0.8 : 0.8
    };
    particle.position.y = 0.15;
    particles.push(particle);
    scene.add(particle);
  }

  function animate(time) {
    requestAnimationFrame(animate);

    particles.forEach((p, i) => {
      const t = (time * 0.001 * p.userData.speed + p.userData.offset) % 1;
      p.position.x = -1.7 + t * 3.4;
      p.position.z = p.userData.row;
    });

    controls.update();
    renderer.render(scene, camera);
  }

  animate(0);

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

// Gallery card animations (2D canvas)
function initGalleryCards() {
  // Chip card
  animateCanvas('canvas-chip', (ctx, w, h, t) => {
    ctx.fillStyle = '#000a14';
    ctx.fillRect(0, 0, w, h);

    const chambers = [
      { x: 0.25, y: 0.35, color: '#ff4444' },
      { x: 0.5, y: 0.35, color: '#8b4513' },
      { x: 0.75, y: 0.35, color: '#4444ff' },
      { x: 0.25, y: 0.65, color: '#ff69b4' },
      { x: 0.5, y: 0.65, color: '#00ff88' },
      { x: 0.75, y: 0.65, color: '#ffaa00' }
    ];

    // Channels
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.35);
    ctx.lineTo(w * 0.8, h * 0.35);
    ctx.moveTo(w * 0.2, h * 0.65);
    ctx.lineTo(w * 0.8, h * 0.65);
    ctx.stroke();

    chambers.forEach((c, i) => {
      const pulse = Math.sin(t * 0.003 + i) * 0.15 + 1;
      ctx.beginPath();
      ctx.arc(w * c.x, h * c.y, 18 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Flow particles
    for (let i = 0; i < 8; i++) {
      const progress = ((t * 0.001 + i * 0.12) % 1);
      const x = w * (0.2 + progress * 0.6);
      const y = i % 2 === 0 ? h * 0.35 : h * 0.65;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff88';
      ctx.fill();
    }
  });

  // Organoid card
  animateCanvas('canvas-organoid', (ctx, w, h, t) => {
    ctx.fillStyle = '#000a14';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Core glow
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fill();

    // Outer cells
    const colors = ['#8b5cf6', '#f72585', '#00e5ff', '#00ff88'];
    for (let i = 0; i < 30; i++) {
      const angle = (t * 0.001 + i * 0.2);
      const r = 25 + (i % 4) * 12 + Math.sin(t * 0.002 + i) * 5;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const size = 4 + Math.sin(t * 0.003 + i) * 2;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });

  // Lab setup card
  animateCanvas('canvas-lab', (ctx, w, h, t) => {
    ctx.fillStyle = '#000a14';
    ctx.fillRect(0, 0, w, h);

    // Incubator
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.1, h * 0.2, w * 0.25, h * 0.6);

    // Temperature display
    ctx.fillStyle = '#001833';
    ctx.fillRect(w * 0.12, h * 0.25, w * 0.21, h * 0.15);
    ctx.fillStyle = '#00ff88';
    ctx.font = '14px monospace';
    ctx.fillText('37.0C', w * 0.15, h * 0.35);

    // CO2 indicator
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('CO2 5%', w * 0.15, h * 0.48);

    // Microscope
    ctx.strokeStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.moveTo(w * 0.55, h * 0.8);
    ctx.lineTo(w * 0.55, h * 0.4);
    ctx.lineTo(w * 0.7, h * 0.3);
    ctx.stroke();

    // Confocal label
    ctx.fillStyle = '#f72585';
    ctx.font = '10px sans-serif';
    ctx.fillText('Confocal', w * 0.58, h * 0.55);

    // Data readout
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let x = w * 0.75; x < w * 0.95; x += 3) {
        const y = h * (0.3 + i * 0.15) + Math.sin((x + t * 0.5) * 0.1) * 8;
        if (x === w * 0.75) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });

  // Digital Twin card
  animateCanvas('canvas-twin', (ctx, w, h, t) => {
    ctx.fillStyle = '#000a14';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Human silhouette
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;

    // Head
    ctx.beginPath();
    ctx.arc(cx, cy - 35, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(cx, cy - 23);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 10);
    ctx.lineTo(cx + 18, cy - 10);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx - 12, cy + 40);
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx + 12, cy + 40);
    ctx.stroke();

    // Organ indicators
    const organs = [
      { x: cx - 8, y: cy - 15, color: '#ff4444' },
      { x: cx + 8, y: cy - 5, color: '#8b4513' },
      { x: cx, y: cy - 28, color: '#ffaa00' }
    ];

    organs.forEach((o, i) => {
      const pulse = Math.sin(t * 0.004 + i * 2) * 2;
      ctx.beginPath();
      ctx.arc(o.x, o.y, 5 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = o.color;
      ctx.fill();
    });

    // Data orbits
    for (let i = 0; i < 8; i++) {
      const angle = (t * 0.002 + i * (Math.PI / 4));
      const x = cx + Math.cos(angle) * 50;
      const y = cy + Math.sin(angle) * 30;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#f72585' : '#00e5ff';
      ctx.fill();
    }

    // AI prediction badge
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('AI PREDICTION', w * 0.65, h * 0.2);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.fillText('87% Efficacy', w * 0.65, h * 0.32);
  });

  // Neural network card
  animateCanvas('canvas-neural', (ctx, w, h, t) => {
    ctx.fillStyle = '#000a14';
    ctx.fillRect(0, 0, w, h);

    // Neural network visualization with multiple colors
    const nodes = [];
    const colors = ['#00e5ff', '#f97316', '#f72585'];

    // Use seeded random for consistent positions
    const seed = 12345;
    const seededRandom = (i) => {
      const x = Math.sin(seed + i) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < 40; i++) {
      nodes.push({
        x: seededRandom(i * 2) * w,
        y: seededRandom(i * 2 + 1) * h,
        color: colors[Math.floor(seededRandom(i * 3) * colors.length)],
        size: 3 + seededRandom(i * 4) * 4
      });
    }

    // Draw connections
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (dist < 80) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes with pulsing
    nodes.forEach((n, i) => {
      const pulse = Math.sin(t * 0.003 + i * 0.5) * 0.3 + 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size * pulse, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Signal flashes
    const flashSeed = Math.floor(t / 100);
    for (let i = 0; i < 3; i++) {
      const fx = seededRandom(flashSeed + i) * w;
      const fy = seededRandom(flashSeed + i + 100) * h;
      ctx.beginPath();
      ctx.arc(fx, fy, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    }
  });

  // Culture plate card
  animateCanvas('canvas-culture', (ctx, w, h, t) => {
    ctx.fillStyle = '#000a14';
    ctx.fillRect(0, 0, w, h);

    // Petri dish style organoids
    const organoidTypes = [
      { color: '#8b4513' },
      { color: '#ff4444' },
      { color: '#f97316' },
      { color: '#f0f0f0' }
    ];

    // Draw organoids in culture
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const x = w * (0.15 + col * 0.18);
        const y = h * (0.25 + row * 0.28);
        const type = organoidTypes[(row + col) % organoidTypes.length];
        const growth = Math.sin(t * 0.001 + row * 0.3 + col * 0.2) * 0.2 + 0.8;
        const size = 12 * growth;

        // Well background
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#001428';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
        ctx.stroke();

        // Organoid
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = type.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Scanning line
    const scanX = (t * 0.03 % w);
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scanX, 0);
    ctx.lineTo(scanX, h);
    ctx.stroke();
  });
}

function animateCanvas(canvasId, drawFn) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }

  resize();
  window.addEventListener('resize', resize);

  function animate(t) {
    const rect = canvas.getBoundingClientRect();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFn(ctx, rect.width, rect.height, t);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  initOrganoidViewer();
  initChipViewer();
  initGalleryCards();
});
