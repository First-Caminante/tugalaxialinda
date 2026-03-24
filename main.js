import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- Escena ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040315);
scene.fog = new THREE.FogExp2(0x040315, 0.00045);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(13, 6, 18);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// --- Postprocesado bloom ---
const renderScene = new RenderPass(scene, camera);
// Reducimos intensidad del bloom (iluminación de galaxia)
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.4, 0.85);
bloomPass.threshold = 0.15;
bloomPass.strength = 0.35; // rebajada la intensidad
bloomPass.radius = 0.4;
const effectComposer = new EffectComposer(renderer);
effectComposer.addPass(renderScene);
effectComposer.addPass(bloomPass);

// --- Controles 360° ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 1.2;
controls.zoomSpeed = 1.0;
controls.panSpeed = 0.5;
controls.enableZoom = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.65;
controls.target.set(0, 0.5, 0);

// ---------- 1. FLORES EN FORMA DE GALAXIA (partículas densas) ----------
// Texturas variadas de flores amarillas (pequeñas) mejoradas
function createFlowerTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    const cx = 64, cy = 64;

    // Mejorar sombreado y realismo con gradientes
    const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, 32);
    gradient.addColorStop(0, '#FFF59D');
    gradient.addColorStop(0.5, '#FFD54F');
    gradient.addColorStop(1, '#FFB300');

    if (type === 0) { // clásica detallada
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const px = cx + Math.cos(angle) * 28;
            const py = cy + Math.sin(angle) * 28;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(0, 0, 14, 28, 0, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        }
    } else if (type === 1) { // margarita más pétalos
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const px = cx + Math.cos(angle) * 32;
            const py = cy + Math.sin(angle) * 32;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(0, 0, 10, 32, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#FFE082';
            ctx.fill();
            ctx.restore();
        }
    } else { // pequeña estrella/girasol mini
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const px = cx + Math.cos(angle) * 25;
            const py = cy + Math.sin(angle) * 25;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 24, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#FFCA28';
            ctx.fill();
            ctx.restore();
        }
    }
    // centro común más detallado
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
    centerGrad.addColorStop(0, '#5D4037');
    centerGrad.addColorStop(0.6, '#3E2723');
    centerGrad.addColorStop(1, '#1B0000');

    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = centerGrad;
    ctx.fill();

    ctx.fillStyle = '#FFB300';
    for (let i = 0; i < 35; i++) {
        const rad = Math.random() * 15;
        const ang = Math.random() * Math.PI * 2;
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

const flowerTextures = [
    createFlowerTexture(0),
    createFlowerTexture(1),
    createFlowerTexture(2)
];

const TOTAL_FLOWERS = 18500;
const positions = new Float32Array(TOTAL_FLOWERS * 3);
const colors = new Float32Array(TOTAL_FLOWERS * 3);
const sizes = new Float32Array(TOTAL_FLOWERS);
const texIndices = new Float32Array(TOTAL_FLOWERS);

const arms = 4;
const spiralTightness = 2.6;
const armSpread = 0.58;
const innerRadius = 1.0;
const outerRadius = 16.2;

for (let i = 0; i < TOTAL_FLOWERS; i++) {
    let radius, angle, yOffset;
    const isCore = Math.random() < 0.2;
    if (isCore) {
        radius = Math.pow(Math.random(), 1.3) * 3.8;
        angle = Math.random() * Math.PI * 2;
        yOffset = (Math.random() - 0.5) * 1.9 * (1 - radius / 5);
    } else {
        const armIdx = Math.floor(Math.random() * arms);
        const armAngleOffset = (armIdx / arms) * Math.PI * 2;
        const t = Math.pow(Math.random(), 1.1);
        radius = innerRadius + t * (outerRadius - innerRadius);
        const spiralAngle = spiralTightness * Math.log(radius + 0.6) + armAngleOffset;
        const randomAngleOffset = (Math.random() - 0.5) * armSpread * (1 + radius * 0.08);
        angle = spiralAngle + randomAngleOffset;
        yOffset = Math.sin(radius * 1.4 + armIdx) * 0.85 + (Math.random() - 0.5) * 0.8;
        if (Math.random() > 0.7) yOffset += (Math.random() - 0.5) * 0.9;
    }
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = yOffset * 1.3;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const distFactor = Math.min(1, Math.sqrt(x * x + y * y + z * z) / 14);
    let r = 1.0, g = 0.7 + Math.random() * 0.3, b = 0.1 + Math.random() * 0.3;
    if (distFactor < 0.3) { g = 0.55 + Math.random() * 0.2; b = 0.08; }
    if (distFactor > 0.7) { g = 0.92; b = 0.45; }
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;

    let sizeVal = 0.28 + Math.random() * 0.48;
    if (distFactor < 0.3) sizeVal *= 0.85;
    if (distFactor > 0.8) sizeVal *= 1.25;
    if (Math.random() > 0.93) sizeVal *= 1.55;
    sizes[i] = sizeVal;
    texIndices[i] = Math.floor(Math.random() * flowerTextures.length);
}

const flowerGeometry = new THREE.BufferGeometry();
flowerGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
flowerGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
flowerGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
flowerGeometry.setAttribute('texIndex', new THREE.BufferAttribute(texIndices, 1));

const vertexShader = `
    attribute float size;
    attribute vec3 color;
    attribute float texIndex;
    varying vec3 vColor;
    varying float vTexIndex;
    void main() {
        vColor = color;
        vTexIndex = texIndex;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * ( 300.0 / ( - mvPosition.z ) ) * 0.95;
        gl_PointSize = clamp(gl_PointSize, 7.0, 48.0);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    uniform sampler2D uTextures[3];
    varying vec3 vColor;
    varying float vTexIndex;
    void main() {
        int idx = int(round(vTexIndex));
        vec4 texColor;
        if (idx == 0) texColor = texture2D(uTextures[0], gl_PointCoord);
        else if (idx == 1) texColor = texture2D(uTextures[1], gl_PointCoord);
        else texColor = texture2D(uTextures[2], gl_PointCoord);
        if (texColor.a < 0.2) discard;
        vec3 finalColor = vColor * texColor.rgb;
        finalColor += vec3(0.2, 0.12, 0.04);
        gl_FragColor = vec4(finalColor, texColor.a * 0.95);
    }
`;

const flowerMaterial = new THREE.ShaderMaterial({
    uniforms: { uTextures: { value: flowerTextures } },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const flowerPoints = new THREE.Points(flowerGeometry, flowerMaterial);
scene.add(flowerPoints);

// ---------- 2. RAMOS DE GIRASOLES (SUNFLOWERS) EN 3D MÁS REALISTAS ----------
function createSunflower(x, z, yOffset = 0, scaleFactor = 1.0) {
    const group = new THREE.Group();

    // Tallo (curvado y orgánico)
    class CustomCurve extends THREE.Curve {
        constructor(scale) {
            super();
            this.scale = scale;
        }
        getPoint(t, optionalTarget = new THREE.Vector3()) {
            const tx = Math.sin(t * Math.PI) * 0.1 * this.scale;
            const ty = (t * 1.5 - 0.75) * this.scale;
            const tz = 0;
            return optionalTarget.set(tx, ty, tz);
        }
    }
    const path = new CustomCurve(scaleFactor);
    const stemGeo = new THREE.TubeGeometry(path, 12, 0.06 * scaleFactor, 8, false);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a7c38, roughness: 0.8, metalness: 0.1 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    group.add(stem);

    // Hojas más realistas
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x568233, roughness: 0.9, side: THREE.DoubleSide });
    const leafGeo = new THREE.SphereGeometry(0.3 * scaleFactor, 8, 8); // Base para aplastar y estirar

    const leaf1 = new THREE.Mesh(leafGeo, leafMat);
    leaf1.scale.set(0.6, 0.1, 1.2);
    leaf1.position.set(0.15 * scaleFactor, -0.2 * scaleFactor, 0.2 * scaleFactor);
    leaf1.rotation.set(0.3, 0.5, 0.2);
    group.add(leaf1);

    const leaf2 = new THREE.Mesh(leafGeo, leafMat);
    leaf2.scale.set(0.6, 0.1, 1.2);
    leaf2.position.set(-0.15 * scaleFactor, -0.4 * scaleFactor, -0.2 * scaleFactor);
    leaf2.rotation.set(-0.2, 0.6, -0.3);
    group.add(leaf2);

    // Centro de la flor (disco y floretes)
    const centerGeo = new THREE.SphereGeometry(0.3 * scaleFactor, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const centerMat = new THREE.MeshStandardMaterial({
        color: 0x3d1a04,
        roughness: 0.9,
        bumpMap: createCenterBumpMap(),
        bumpScale: 0.02
    });
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.scale.set(1, 0.3, 1);
    center.position.y = 0.7 * scaleFactor;
    group.add(center);

    // Textura generativa para el relieve del centro
    function createCenterBumpMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 400; i++) {
            let cx = Math.random() * 128, cy = Math.random() * 128;
            ctx.beginPath();
            ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        return new THREE.CanvasTexture(canvas);
    }

    // Pétalos amarillos realistas
    const petalMat = new THREE.MeshStandardMaterial({
        color: 0xffb700,
        emissive: 0xffaa00,
        emissiveIntensity: 0.1,
        roughness: 0.4
    });
    // Pétalos base - Geometría de esfera aplastada
    const basePetalGeo = new THREE.SphereGeometry(1, 12, 12);

    const petalsGroup = new THREE.Group();
    petalsGroup.position.y = 0.7 * scaleFactor;

    // Dos anillos de pétalos para mayor volumen
    for (let layer = 0; layer < 2; layer++) {
        const numPetals = layer === 0 ? 18 : 14;
        const radius = layer === 0 ? 0.3 * scaleFactor : 0.25 * scaleFactor;
        const scaleL = layer === 0 ? scaleFactor : scaleFactor * 0.85;

        for (let i = 0; i < numPetals; i++) {
            const angle = (i / numPetals) * Math.PI * 2 + (layer * 0.15);

            const petal = new THREE.Mesh(basePetalGeo, petalMat);
            petal.scale.set(0.12 * scaleL, 0.02 * scaleL, 0.45 * scaleL); // Aplastar y estirar

            petal.position.x = Math.cos(angle) * radius;
            petal.position.z = Math.sin(angle) * radius;

            petal.rotation.y = -angle; // Orientar hacia afuera
            // Ligera inclinación hacia arriba o abajo
            petal.rotation.x = layer === 0 ? -0.1 : -0.25;

            // Variabilidad orgánica
            petal.rotation.z = (Math.random() - 0.5) * 0.1;
            petal.scale.z *= (0.9 + Math.random() * 0.2);

            petalsGroup.add(petal);
        }
    }
    group.add(petalsGroup);

    group.position.set(x, yOffset, z);
    // Orientar las flores un poco hacia el centro o con variación natural
    group.rotation.y = Math.random() * Math.PI * 2;
    // Ligeramente inclinadas
    group.rotation.x = (Math.random() - 0.5) * 0.4;
    group.rotation.z = (Math.random() - 0.5) * 0.4;
    return group;
}

const sunflowerPositions = [];
for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const radius = 1.8 + Math.random() * 1.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    sunflowerPositions.push({ x, z, y: -0.2 + Math.random() * 0.5, scale: 0.9 + Math.random() * 0.3 });
}
const armAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
for (let a = 0; a < armAngles.length; a++) {
    for (let r = 3.5; r <= 12; r += 2.2) {
        const angleOffset = armAngles[a];
        const spiralBase = spiralTightness * Math.log(r + 0.8);
        const angle = spiralBase + angleOffset + (Math.random() - 0.5) * 0.8;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const y = Math.sin(r * 1.2) * 0.4 + (Math.random() - 0.5) * 0.4;
        sunflowerPositions.push({ x, z, y: y - 0.1, scale: 0.8 + Math.random() * 0.5 });
    }
}
for (let i = 0; i < 15; i++) {
    const rad = 6 + Math.random() * 7;
    const ang = Math.random() * Math.PI * 2;
    const x = Math.cos(ang) * rad;
    const z = Math.sin(ang) * rad;
    const y = (Math.random() - 0.5) * 1.5;
    sunflowerPositions.push({ x, z, y: y, scale: 0.7 + Math.random() * 0.6 });
}

const sunflowersGroup = new THREE.Group();
sunflowerPositions.forEach(pos => {
    const sunflower = createSunflower(pos.x, pos.z, pos.y, pos.scale);
    sunflowersGroup.add(sunflower);
});
scene.add(sunflowersGroup);

const pollenCount = 1800;
const pollenPositions = new Float32Array(pollenCount * 3);
for (let i = 0; i < pollenCount; i++) {
    const idx = Math.floor(Math.random() * sunflowerPositions.length);
    const base = sunflowerPositions[idx];
    const offsetX = (Math.random() - 0.5) * 1.2;
    const offsetZ = (Math.random() - 0.5) * 1.2;
    const offsetY = (Math.random() - 0.5) * 1.0;
    pollenPositions[i * 3] = base.x + offsetX;
    pollenPositions[i * 3 + 1] = base.y + offsetY + 0.2;
    pollenPositions[i * 3 + 2] = base.z + offsetZ;
}
const pollenGeo = new THREE.BufferGeometry();
pollenGeo.setAttribute('position', new THREE.BufferAttribute(pollenPositions, 3));
const pollenMat = new THREE.PointsMaterial({ color: 0xffeebb, size: 0.04, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.8 });
const pollenPoints = new THREE.Points(pollenGeo, pollenMat);
scene.add(pollenPoints);

// ---------- 3. ELEMENTOS DE FONDO: ESTRELLAS Y POLVO ----------
const starCount = 4500;
const starPositionsArr = new Float32Array(starCount * 3);
const starColorsArr = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    const rad = 40 + Math.random() * 55;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositionsArr[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
    starPositionsArr[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta) * 0.5;
    starPositionsArr[i * 3 + 2] = rad * Math.cos(phi);
    const intens = 0.4 + Math.random() * 0.8;
    starColorsArr[i * 3] = intens * (Math.random() > 0.6 ? 1.0 : 0.7);
    starColorsArr[i * 3 + 1] = intens * (Math.random() > 0.5 ? 0.9 : 0.6);
    starColorsArr[i * 3 + 2] = intens * 0.5;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositionsArr, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColorsArr, 3));
const starMatObj = new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
const starsField = new THREE.Points(starGeo, starMatObj);
scene.add(starsField);

const dustCount = 8000;
const dustPositions = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
    const radius = 5 + Math.random() * 14;
    const ang = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 4.5;
    dustPositions[i * 3] = Math.cos(ang) * radius * (0.6 + Math.random() * 0.7);
    dustPositions[i * 3 + 1] = y + (Math.random() - 0.5) * 1.5;
    dustPositions[i * 3 + 2] = Math.sin(ang) * radius * (0.6 + Math.random() * 0.7);
}
const dustGeoObj = new THREE.BufferGeometry();
dustGeoObj.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
const dustMatObj = new THREE.PointsMaterial({ color: 0xffbb77, size: 0.055, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
const dustCloud = new THREE.Points(dustGeoObj, dustMatObj);
scene.add(dustCloud);

// ---------- 3.5. NEBULOSAS (CONTEXTO DE FONDO) ----------
function createNebulaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
}

const nebulaCount = 180; // Más nubes
const nebulaGeometry = new THREE.BufferGeometry();
const nebulaPositions = new Float32Array(nebulaCount * 3);
const nebulaColors = new Float32Array(nebulaCount * 3);
for (let i = 0; i < nebulaCount; i++) {
    // Nebulosas más esparcidas y alejadas
    const rad = 60 + Math.random() * 70;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    nebulaPositions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
    nebulaPositions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta) * 0.5; // Menos aplastado para dar volumen
    nebulaPositions[i * 3 + 2] = rad * Math.cos(phi);

    // Tonos cósmicos más realistas inspirados en fotos espaciales
    const colorType = Math.random();
    if (colorType > 0.7) {
        nebulaColors[i * 3] = 0.08; nebulaColors[i * 3 + 1] = 0.2; nebulaColors[i * 3 + 2] = 0.45; // Azul espacial profundo
    } else if (colorType > 0.4) {
        nebulaColors[i * 3] = 0.05; nebulaColors[i * 3 + 1] = 0.35; nebulaColors[i * 3 + 2] = 0.4; // Turquesa espectral (Oxígeno)
    } else if (colorType > 0.1) {
        nebulaColors[i * 3] = 0.4; nebulaColors[i * 3 + 1] = 0.08; nebulaColors[i * 3 + 2] = 0.15; // Rosa polvoriento (Hidrógeno)
    } else {
        nebulaColors[i * 3] = 0.15; nebulaColors[i * 3 + 1] = 0.05; nebulaColors[i * 3 + 2] = 0.25; // Morado sutil (casi grisáceo)
    }
}
nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3));
const nebulaMaterial = new THREE.PointsMaterial({
    size: 80, // Nubes aún más grandes para que se agrupen y disuelvan
    map: createNebulaTexture(),
    transparent: true,
    opacity: 0.15, // Más tenue para un efecto de mezcla natural
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const nebulaCloud = new THREE.Points(nebulaGeometry, nebulaMaterial);
scene.add(nebulaCloud);

// ---------- 3.6. COMETAS ESTELARES ----------
const comets = [];
const cometCount = 35; // Muchos cometas
const cometHeadGeo = new THREE.SphereGeometry(0.12, 8, 8);
const cometHeadMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });

for (let i = 0; i < cometCount; i++) {
    const head = new THREE.Mesh(cometHeadGeo, cometHeadMat);

    const tailSegs = 60; // Cola larga
    const tailGeo = new THREE.BufferGeometry();
    const tailPositions = new Float32Array(tailSegs * 3);
    const tailColors = new Float32Array(tailSegs * 3);

    for (let j = 0; j < tailSegs; j++) {
        const alpha = Math.max(0, 1.0 - (j / tailSegs));
        tailColors[j * 3] = alpha;         // R
        tailColors[j * 3 + 1] = alpha * 0.8; // G
        tailColors[j * 3 + 2] = alpha * 0.9; // B
    }
    tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeo.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));

    const tailMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.6
    });
    const tail = new THREE.Line(tailGeo, tailMat);

    // Inician en posición oculta
    head.position.set(999, 999, 999);
    for (let j = 0; j < tailSegs * 3; j++) tailPositions[j] = 999;

    scene.add(head);
    scene.add(tail);

    comets.push({
        head: head,
        tail: tail,
        tailPositions: tailPositions,
        active: false,
        timer: Math.random() * 300, // Menos tiempo esperando
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        segs: tailSegs
    });
}

// ---------- 3.7. FRASES FLOTANTES (AMOR) ----------
function createTextSprite(message) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Lienzo grande para nitidez
    canvas.width = 1024;
    canvas.height = 256;

    ctx.font = 'bold 50px "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Contorno oscuro ultra grueso
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeText(message, 512, 128);

    // Sombra negra en vez de roja para el resplandor exterior
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'; // Sombra negra fuerte
    ctx.shadowBlur = 12;

    // Relleno
    ctx.fillText(message, 512, 128);
    // Un segundo relleno para que el texto central quede opaco y brillante
    ctx.shadowBlur = 0; // Sin sombra para mayor solidez
    ctx.fillText(message, 512, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        blending: THREE.NormalBlending,
        depthTest: false // Para leer siempre bien al sobreponerse a todo
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(8.5, 2.1, 1); // Relación de aspecto
    return sprite;
}

const phrasesPool = [
    "Eres mi estrellita favorita",
    "Brillas más que esta galaxia, muchoooo",
    "Mi universo siempre es más hermoso contigo",
    "Tú le das color a mi vida gracias linda..",
    "Princesa de mi corazón",
    "Te elegiría en cada universo alternativo :)",
    "Haces que mi mundo gire",
    "Karina de mi vida",
    "Un amor infinito como el espacio",
    "Mi linda Karina",
    "A la luna y de regreso pero contigo eh",
    "Mi casualidad favorita siempre fuiste tu",
    "Tu sonrisa ilumina mi vida ",
    "Cada estrella en el fondo es un te quiero"
];

const phrasesGroup = new THREE.Group();
const floatingTexts = [];
const TOTAL_PHRASES = 12; // Unas cuantas nada más alrededor

for (let i = 0; i < TOTAL_PHRASES; i++) {
    const randomPhrase = phrasesPool[Math.floor(Math.random() * phrasesPool.length)];
    const sprite = createTextSprite(randomPhrase);

    // Solo alrededor (borde externo de la galaxia)
    const angle = Math.random() * Math.PI * 2;
    const radius = 17 + Math.random() * 6; // Radio exterior

    sprite.position.x = Math.cos(angle) * radius;
    sprite.position.y = (Math.random() - 0.5) * 6; // Menos fluctuación de altura
    sprite.position.z = Math.sin(angle) * radius;

    phrasesGroup.add(sprite);

    floatingTexts.push({
        mesh: sprite,
        baseY: sprite.position.y,
        speed: 0.8 + Math.random() * 1.5,
        offset: Math.random() * Math.PI * 2
    });
}
scene.add(phrasesGroup);

// ---------- 5. INTERACCIÓN CLIC EN FLORES (MODAL CARTA) ----------
const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.6; // Tolerancia para tocar partículas de flores
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    // Ignorar clics en botones o si la carta ya está abierta
    if (event.target.tagName === 'BUTTON' || event.target.closest('.love-letter-overlay')) return;

    // Normalizar coordenadas del mouse
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Revisar si tocamos hojas, tallos o el núcleo
    const intersects = raycaster.intersectObjects([sunflowersGroup, coreGlow], true);

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        if (hitObject === coreGlow) {
            showSpecialLetter();
        } else {
            showLoveLetter();
        }
    }
});

function showSpecialLetter() {
    const specialEl = document.getElementById('special-letter');
    if (specialEl) specialEl.classList.add('visible');
}

window.closeSpecialLetter = function () {
    const specialEl = document.getElementById('special-letter');
    if (specialEl) specialEl.classList.remove('visible');
};

function showLoveLetter() {
    const randomPhrase = phrasesPool[Math.floor(Math.random() * phrasesPool.length)];
    const letterEl = document.getElementById('love-letter');
    const contentEl = document.getElementById('letter-content');
    if (letterEl && contentEl) {
        contentEl.innerText = randomPhrase;
        letterEl.classList.add('visible');
    }
}

window.closeLoveLetter = function () {
    const letterEl = document.getElementById('love-letter');
    if (letterEl) {
        letterEl.classList.remove('visible');
    }
};

// ---------- 4. NÚCLEO BRILLANTE Y HALO REDUCIDO ----------
const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 32, 32),
    // Menos intensidad en el color emisivo
    new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xc85a00, emissiveIntensity: 0.8, roughness: 0.5 })
);
scene.add(coreGlow);

const haloCount = 1500;
const haloPositions = new Float32Array(haloCount * 3);
for (let i = 0; i < haloCount; i++) {
    const rad = 1.8 + Math.random() * 2.2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    haloPositions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
    haloPositions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta) * 0.7;
    haloPositions[i * 3 + 2] = rad * Math.cos(phi);
}
const haloGeo = new THREE.BufferGeometry();
haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3));
const haloMatPoints = new THREE.PointsMaterial({ color: 0xff9966, size: 0.06, blending: THREE.AdditiveBlending, opacity: 0.6 });
const haloRing = new THREE.Points(haloGeo, haloMatPoints);
scene.add(haloRing);

// Luces mejoradas para flores
const ambientLight = new THREE.AmbientLight(0x221100, 1.2);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffdd99, 1.0, 30); // Rebajada de 1.2 a 1.0
pointLight.position.set(2, 2.5, 2);
scene.add(pointLight);
const backLight = new THREE.PointLight(0xffaa66, 0.5); // Rebajada
backLight.position.set(-3, 2, -5);
scene.add(backLight);
const fillLight = new THREE.PointLight(0xffeebb, 0.4); // Rebajada
fillLight.position.set(1, 3, 3);
scene.add(fillLight);

// Luz direccional suave para destacar los relieves de las flores
const directionalLight = new THREE.DirectionalLight(0xffeedd, 0.6);
directionalLight.position.set(5, 8, 3);
scene.add(directionalLight);

// ---------- ANIMACIÓN Y ROTACIONES ----------
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.008;

    // Suavizado de la intensidad del núcleo
    const intensity = 0.6 + Math.sin(time * 2.5) * 0.2; // Era 1.4
    coreGlow.material.emissiveIntensity = intensity;
    pointLight.intensity = 0.8 + Math.sin(time * 2.2) * 0.15;

    dustCloud.rotation.y = time * 0.03;
    starsField.rotation.x = Math.sin(time * 0.05) * 0.05;
    starsField.rotation.y = time * 0.01;
    haloRing.rotation.y = time * 0.1;
    haloRing.rotation.x = Math.sin(time * 0.2) * 0.1;
    pollenPoints.rotation.y = time * 0.02;

    nebulaCloud.rotation.y = time * 0.01;
    nebulaCloud.rotation.z = Math.sin(time * 0.05) * 0.05;

    // Animación de frases (flotan suavemente y giran alrededor)
    phrasesGroup.rotation.y = time * -0.05; // Giran despacio en dirección contraria
    floatingTexts.forEach(ft => {
        // Movimiento de balanceo arriba y abajo
        ft.mesh.position.y = ft.baseY + Math.sin(time * ft.speed + ft.offset) * 0.4;
    });

    comets.forEach(c => {
        if (!c.active) {
            c.timer--;
            if (c.timer <= 0) {
                c.active = true;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = 80 + Math.random() * 20;
                // Spawn position
                c.pos.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));

                // Objetivo ligeramente desfasado del centro
                const target = new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 30);
                const speed = 0.5 + Math.random() * 0.5;
                c.vel.subVectors(target, c.pos).normalize().multiplyScalar(speed);

                c.head.position.copy(c.pos);
                for (let i = 0; i < c.segs; i++) {
                    c.tailPositions[i * 3] = c.pos.x;
                    c.tailPositions[i * 3 + 1] = c.pos.y;
                    c.tailPositions[i * 3 + 2] = c.pos.z;
                }
                c.tail.geometry.attributes.position.needsUpdate = true;
            }
        } else {
            c.pos.add(c.vel);
            c.head.position.copy(c.pos);

            // Mover la cola
            for (let i = c.segs - 1; i > 0; i--) {
                c.tailPositions[i * 3] = c.tailPositions[(i - 1) * 3];
                c.tailPositions[i * 3 + 1] = c.tailPositions[(i - 1) * 3 + 1];
                c.tailPositions[i * 3 + 2] = c.tailPositions[(i - 1) * 3 + 2];
            }
            c.tailPositions[0] = c.pos.x;
            c.tailPositions[1] = c.pos.y;
            c.tailPositions[2] = c.pos.z;
            c.tail.geometry.attributes.position.needsUpdate = true;

            if (c.pos.length() > 120) {
                c.active = false;
                c.timer = 50 + Math.random() * 150; // Reaparición rápida
                c.head.position.set(999, 999, 999);
                for (let i = 0; i < c.segs * 3; i++) c.tailPositions[i] = 999;
                c.tail.geometry.attributes.position.needsUpdate = true;
            }
        }
    });

    sunflowersGroup.children.forEach((sunflower, idx) => {
        sunflower.rotation.z += Math.sin(time * 1.2 + idx) * 0.001;
        sunflower.rotation.x += Math.cos(time * 1.0 + idx) * 0.001;
    });

    controls.update();
    effectComposer.render();
}
animate();

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effectComposer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);
}

console.log('🌻 Galaxia de Girasoles - Feliz día de las Flores Amarillas (Mejorado)');
