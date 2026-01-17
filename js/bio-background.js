const initBioBackground = () => {
    // 1. Create the Canvas behind everything
    const canvas = document.createElement('canvas');
    canvas.id = 'bioCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-0'; // Puts it behind text but in front of deep background
    canvas.style.opacity = '0.8'; 
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    // 2. Setup 3D Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 3. Create the "Living Cell" Shape
    const geometry = new THREE.IcosahedronGeometry(10, 4);
    const material = new THREE.MeshPhongMaterial({
        color: 0x001d3d, 
        emissive: 0x00d4ff,
        emissiveIntensity: 0.2,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // 4. Add Lights
    const light = new THREE.PointLight(0x00d4ff, 1, 100);
    light.position.set(10, 10, 20);
    scene.add(light);
    camera.position.z = 18;

    // 5. Make it Move (Breathe)
    const clock = new THREE.Clock();
    
    const animate = () => {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        const positionAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            const offset = 10; 
            const amp = 0.4; 
            const speed = 1.2; 
            const distortion = Math.sin(vertex.x * 2 + time * speed) * amp 
                             + Math.cos(vertex.y * 2 + time * speed) * amp;
            vertex.normalize().multiplyScalar(offset + distortion);
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        sphere.rotation.y += 0.002;
        renderer.render(scene, camera);
    };

    animate();

    // 6. Fix size if window changes
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}; // <--- THIS WAS LIKELY MISSING

// Run it
window.addEventListener('load', initBioBackground);
