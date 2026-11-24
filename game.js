/**
 * Jumanji: The Last Decision - Core 3D Game Engine
 * Built with Three.js. Features full 3D ruins environment, procedural character models,
 * skeletal animations, third-person camera, enemy AI, puzzle mechanics, and cinematic sequences.
 */

import * as THREE from './three.module.js';
import { CHARACTERS } from './characters.js';
import { soundEngine } from './audio.js';

export class JumanjiGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.selectedCharId = 'bravestone';
    this.charData = CHARACTERS.bravestone;

    // Game State
    this.state = 'INIT'; // 'INIT', 'INTRO', 'SELECT', 'PLAYING', 'DIALOGUE', 'PUZZLE', 'DECISION', 'ENDING'
    this.lives = 3;
    this.health = 100;
    this.maxHealth = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.abilityCooldown = 0;
    this.isSprinting = false;
    this.isInteracting = false;
    this.activeInteractable = null;

    // Quest & Puzzle Progress
    this.questObjective = "Speak with Nigel Billingsley at the Temple Gate";
    this.hasSpokenToNigel = false;
    this.collectedGlyphs = 0;
    this.totalGlyphs = 3;
    this.collectedBerries = 0;
    this.gateUnlocked = false;
    this.crackedWallBroken = false;
    this.guardianPacified = false;
    this.guardianStunTimer = 0;
    this.stealthTimer = 0;
    this.sunPillars = [
      { id: 0, currentAngle: 0, targetAngle: 0, solved: false, name: 'Sun Rune (Fire)' },
      { id: 1, currentAngle: 90, targetAngle: 0, solved: false, name: 'Moon Rune (Water)' },
      { id: 2, currentAngle: 180, targetAngle: 0, solved: false, name: 'Earth Rune (Nature)' }
    ];

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // 3D Objects & Entities
    this.player = null;
    this.playerMesh = null;
    this.playerJoints = {};
    this.nigelMesh = null;
    this.guardian = null;
    this.guardianMesh = null;
    this.guardianAlertIcon = null;
    this.falconJewel = null;
    this.jewelLight = null;
    this.templeGateMesh = null;
    this.crackedWallMesh = null;
    this.runePillarMeshes = [];
    this.collectibleMeshes = [];
    this.animatedTorches = [];
    this.particles = [];
    this.collisionObjects = [];

    // Camera Controls
    this.cameraMode = 'ORBIT'; // 'ORBIT', 'CINEMATIC'
    this.cameraDistance = 7.0;
    this.cameraYaw = 0;
    this.cameraPitch = 0.35;
    this.cameraTarget = new THREE.Vector3();
    this.cinematicTime = 0;
    this.cinematicCallback = null;
    this.cinematicCamStart = new THREE.Vector3();
    this.cinematicCamEnd = new THREE.Vector3();
    this.cinematicTargetStart = new THREE.Vector3();
    this.cinematicTargetEnd = new THREE.Vector3();
    this.cinematicDuration = 0;

    // Input
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false, prevX: 0, prevY: 0 };

    // Animation Timers
    this.animTime = 0;
    this.walkCycle = 0;
    this.isMoving = false;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.isAttacking = false;
    this.attackTimer = 0;

    this.initThree();
    this.setupInputs();
    this.buildWorld();
    this.buildGuardian();
    this.buildNPCNigel();
    this.buildCollectiblesAndPuzzle();
    this.setPlayerCharacter(this.selectedCharId);

    window.addEventListener('resize', () => this.onResize());
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  // --- THREE.JS INITIALIZATION ---
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a3328); // deep jungle atmosphere
    this.scene.fog = new THREE.FogExp2(0x1f3c30, 0.015);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 10, 20);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xd9eed1, 0.55);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x9bd8ff, 0x224422, 0.4);
    this.scene.add(hemiLight);

    // Golden Jungle Sunlight
    const sunLight = new THREE.DirectionalLight(0xfff3cf, 1.8);
    sunLight.position.set(35, 60, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 160;
    const d = 50;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);
    this.sunLight = sunLight;
  }

  // --- INPUT HANDLING ---
  setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Special Ability Key (Q)
      if (e.code === 'KeyQ' && this.state === 'PLAYING') {
        this.triggerSpecialAbility();
      }

      // Interact Key (E)
      if (e.code === 'KeyE' && this.state === 'PLAYING') {
        this.handleInteraction();
      }

      // Jump (Space)
      if (e.code === 'Space' && this.isGrounded && this.state === 'PLAYING') {
        this.verticalVelocity = 9.5;
        this.isGrounded = false;
        soundEngine.playSfx('jump');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.mouse.isDown = true;
      this.mouse.prevX = e.clientX;
      this.mouse.prevY = e.clientY;
      soundEngine.resume();
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mouse.isDown && this.cameraMode === 'ORBIT') {
        const dx = e.clientX - this.mouse.prevX;
        const dy = e.clientY - this.mouse.prevY;
        this.cameraYaw -= dx * 0.006;
        this.cameraPitch = Math.max(0.1, Math.min(1.2, this.cameraPitch + dy * 0.005));
        this.mouse.prevX = e.clientX;
        this.mouse.prevY = e.clientY;
      }
    });

    window.addEventListener('wheel', (e) => {
      if (this.cameraMode === 'ORBIT') {
        this.cameraDistance = Math.max(3.5, Math.min(14, this.cameraDistance + e.deltaY * 0.008));
      }
    });

    // Touch support for mobile / trackpad drag
    let touchStartX = 0, touchStartY = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        this.mouse.isDown = true;
        soundEngine.resume();
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.mouse.isDown && e.touches.length === 1 && this.cameraMode === 'ORBIT') {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        this.cameraYaw -= dx * 0.008;
        this.cameraPitch = Math.max(0.1, Math.min(1.2, this.cameraPitch + dy * 0.006));
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.isDown = false;
    });
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // --- ENVIRONMENT & WORLD BUILDING ---
  buildWorld() {
    // 1. Terrain Ground
    const groundGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
    // Add procedural terrain elevation waves
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Gentle slope rising towards the temple at the back (-Z)
      const dist = Math.sqrt(x * x + y * y);
      const elev = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.6 + (y < 0 ? Math.abs(y) * 0.08 : 0);
      pos.setZ(i, elev);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2d4f32,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Ancient Stone Courtyard Pavement (Pathway leading from entrance to temple)
    const stoneGeo = new THREE.BoxGeometry(16, 0.4, 75);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x6e7869,
      roughness: 0.9,
      metalness: 0.05
    });
    const path = new THREE.Mesh(stoneGeo, stoneMat);
    path.position.set(0, 0.15, -15);
    path.receiveShadow = true;
    this.scene.add(path);

    // Decorative flagstones
    for (let z = -50; z <= 20; z += 5) {
      for (let x = -7; x <= 7; x += 3.5) {
        if (Math.random() > 0.3) {
          const slabGeo = new THREE.BoxGeometry(2.8, 0.1, 4.2);
          const slabMat = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? 0x586354 : 0x7b8774,
            roughness: 0.88
          });
          const slab = new THREE.Mesh(slabGeo, slabMat);
          slab.position.set(x + (Math.random() - 0.5) * 0.5, 0.38, z + (Math.random() - 0.5) * 0.5);
          slab.receiveShadow = true;
          this.scene.add(slab);
        }
      }
    }

    // 3. Ancient Temple Gateway & Pillars (Entrance Arch where Nigel stands)
    this.buildEntranceArch(0, 0, 20);

    // 4. Courtyard Colonist Pillars lining the path
    for (let z = 12; z >= -35; z -= 14) {
      this.buildAncientPillar(-9, 0, z);
      this.buildAncientPillar(9, 0, z);
    }

    // 5. Great Sun Temple Terraced Sanctuary (-Z = -45 to -65)
    this.buildGrandTempleSanctuary(0, 0, -50);

    // 6. Sacred Water Pool (To the left of the courtyard)
    this.buildWaterSanctuary(-22, 0, -10);

    // 7. Dense Jungle Canopy: Palm Trees, Ferns, Mossy Boulders
    this.buildJungleFoliage();

    // 8. Torches & Braziers with dynamic flame lights
    this.buildBraziers();

    // 9. Destructible Cracked Stone Wall (Shortcut route)
    this.buildCrackedWall(13, 0, -22);
  }

  buildEntranceArch(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x5a6352, roughness: 0.85 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 8, 2.2), pillarMat);
    p1.position.set(-5, 4, 0);
    p1.castShadow = true;
    p1.receiveShadow = true;
    group.add(p1);
    this.collisionObjects.push({ x: x - 5, z: z, radius: 1.8 });

    const p2 = p1.clone();
    p2.position.set(5, 4, 0);
    group.add(p2);
    this.collisionObjects.push({ x: x + 5, z: z, radius: 1.8 });

    // Arch Lintels
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(13, 1.8, 2.8), pillarMat);
    lintel.position.set(0, 8.8, 0);
    lintel.castShadow = true;
    group.add(lintel);

    const crest = new THREE.Mesh(new THREE.ConeGeometry(2, 2, 4), new THREE.MeshStandardMaterial({ color: 0xb58a43, metalness: 0.4 }));
    crest.rotation.y = Math.PI / 4;
    crest.position.set(0, 10.5, 0);
    group.add(crest);

    this.scene.add(group);
  }

  buildAncientPillar(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x56604e, roughness: 0.9 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 2.4), stoneMat);
    base.position.y = 0.6;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 7.5, 12), stoneMat);
    shaft.position.y = 4.8;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 2.2), stoneMat);
    cap.position.y = 8.8;
    cap.castShadow = true;
    group.add(cap);

    // Vine wraps
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x224925, roughness: 0.8 });
    for (let i = 0; i < 4; i++) {
      const vine = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.12, 6, 12), vineMat);
      vine.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      vine.position.y = 2 + i * 1.6;
      group.add(vine);
    }

    this.scene.add(group);
    this.collisionObjects.push({ x: x, z: z, radius: 1.5 });
  }

  buildGrandTempleSanctuary(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const templeMat = new THREE.MeshStandardMaterial({ color: 0x4d5645, roughness: 0.85 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.8 });

    // Multi-tiered stepped pyramid terrace
    const stepCount = 5;
    for (let i = 0; i < stepCount; i++) {
      const w = 34 - i * 4.5;
      const d = 26 - i * 3.5;
      const h = 1.2;
      const tier = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), templeMat);
      tier.position.set(0, i * h + h / 2, 0);
      tier.castShadow = true;
      tier.receiveShadow = true;
      group.add(tier);
    }

    // Grand Stairs leading up
    const stairCount = 14;
    for (let s = 0; s < stairCount; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(9, 0.45, 1.2), templeMat);
      step.position.set(0, s * 0.45 + 0.22, 13.5 - s * 0.95);
      step.receiveShadow = true;
      step.castShadow = true;
      group.add(step);
    }

    // Temple Apex Platform (where Falcon Jewel rests)
    const apexFloor = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 1, 16), templeMat);
    apexFloor.position.set(0, 6.5, 0);
    apexFloor.receiveShadow = true;
    apexFloor.castShadow = true;
    group.add(apexFloor);

    // Glowing Golden Altar Pedestal
    const altarPedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 2.2, 8), templeMat);
    altarPedestal.position.set(0, 7.8, 0);
    altarPedestal.castShadow = true;
    altarPedestal.receiveShadow = true;
    group.add(altarPedestal);

    const goldRing = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.18, 8, 24), goldMat);
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.set(0, 8.8, 0);
    group.add(goldRing);

    // --- THE SACRED FALCON JEWEL ---
    const jewelGeo = new THREE.OctahedronGeometry(1.1, 1);
    const jewelMat = new THREE.MeshPhysicalMaterial({
      color: 0x00ff88,
      emissive: 0x008844,
      emissiveIntensity: 1.4,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.7,
      transparent: true,
      opacity: 0.95
    });
    this.falconJewel = new THREE.Mesh(jewelGeo, jewelMat);
    this.falconJewel.position.set(0, 10.4, 0);
    group.add(this.falconJewel);

    // Radiant Light Beam
    this.jewelLight = new THREE.PointLight(0x00ffaa, 3.5, 25);
    this.jewelLight.position.set(0, 10.5, 0);
    group.add(this.jewelLight);

    // Orbiting celestial rune ring around jewel
    const runeRingGeo = new THREE.TorusGeometry(2.3, 0.08, 6, 32);
    const runeRingMat = new THREE.MeshBasicMaterial({ color: 0x55ffcc });
    this.runeRing1 = new THREE.Mesh(runeRingGeo, runeRingMat);
    this.runeRing1.position.set(0, 10.4, 0);
    group.add(this.runeRing1);

    this.runeRing2 = new THREE.Mesh(runeRingGeo, runeRingMat);
    this.runeRing2.position.set(0, 10.4, 0);
    this.runeRing2.rotation.x = Math.PI / 3;
    group.add(this.runeRing2);

    // Temple Sanctum Gate (Lowers when puzzle is solved)
    const gateGeo = new THREE.BoxGeometry(9.5, 6, 0.8);
    const gateMat = new THREE.MeshStandardMaterial({
      color: 0x3d4435,
      roughness: 0.9,
      metalness: 0.2
    });
    this.templeGateMesh = new THREE.Mesh(gateGeo, gateMat);
    this.templeGateMesh.position.set(0, 3, 4.5);
    this.templeGateMesh.castShadow = true;
    group.add(this.templeGateMesh);

    // Gate rune carvings
    const runePlate = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.95), new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.4,
      emissive: 0xaa7700,
      emissiveIntensity: 0.3
    }));
    runePlate.position.set(0, 3, 4.5);
    group.add(runePlate);

    this.scene.add(group);
    this.templeGroup = group;

    // Sanctuary Collision
    this.collisionObjects.push({ x: x, z: z, radius: 12 });
  }

  buildWaterSanctuary(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Stone Basin Border
    const basin = new THREE.Mesh(new THREE.TorusGeometry(8, 0.8, 8, 24), new THREE.MeshStandardMaterial({ color: 0x556050, roughness: 0.9 }));
    basin.rotation.x = Math.PI / 2;
    basin.position.y = 0.4;
    group.add(basin);

    // Water Surface
    const waterGeo = new THREE.CircleGeometry(7.8, 24);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x247ba0,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.75
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.35;
    group.add(water);

    // Lotus Lily Pads
    for (let i = 0; i < 5; i++) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.7, 8), new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 }));
      pad.rotation.x = -Math.PI / 2;
      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 3 + Math.random() * 3;
      pad.position.set(Math.cos(angle) * dist, 0.38, Math.sin(angle) * dist);
      group.add(pad);
    }

    this.scene.add(group);
    this.collisionObjects.push({ x: x, z: z, radius: 7.5 });
  }

  buildJungleFoliage() {
    // Palm Trees around the borders
    const treePositions = [
      [-18, 15], [18, 14], [-24, 0], [22, -2],
      [-20, -25], [20, -28], [-28, -45], [26, -48],
      [-12, 32], [14, 30], [-30, 20], [32, 18],
      [-16, -55], [18, -55], [0, 36], [-28, -12]
    ];

    treePositions.forEach(([tx, tz]) => {
      this.buildPalmTree(tx + (Math.random() - 0.5) * 3, 0, tz + (Math.random() - 0.5) * 3);
    });

    // Fern clusters & mossy boulders
    for (let i = 0; i < 35; i++) {
      const fx = (Math.random() - 0.5) * 80;
      const fz = (Math.random() - 0.5) * 90;
      if (Math.abs(fx) > 6 || fz > 22 || fz < -40) {
        if (Math.random() > 0.5) {
          this.buildFern(fx, 0, fz);
        } else {
          this.buildMossyRock(fx, 0, fz);
        }
      }
    }
  }

  buildPalmTree(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Curved Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 0.95 });
    const trunkHeight = 8 + Math.random() * 3;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, trunkHeight, 8), trunkMat);
    trunk.position.set(0, trunkHeight / 2, 0);
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    trunk.rotation.x = (Math.random() - 0.5) * 0.15;
    trunk.castShadow = true;
    group.add(trunk);

    // Palm Leaves Fronds
    const frondMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.75,
      side: THREE.DoubleSide
    });
    const leafCount = 9;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2;
      const frondGeo = new THREE.ConeGeometry(1.2, 5.5, 4);
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(Math.cos(angle) * 1.5, trunkHeight + 0.2, Math.sin(angle) * 1.5);
      frond.rotation.z = Math.PI / 2.8;
      frond.rotation.y = -angle;
      frond.castShadow = true;
      group.add(frond);
    }

    this.scene.add(group);
    this.collisionObjects.push({ x: x, z: z, radius: 1.1 });
  }

  buildFern(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const mat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), mat);
      const angle = (i / 6) * Math.PI * 2;
      leaf.rotation.y = angle;
      leaf.rotation.x = 0.45;
      leaf.position.set(Math.cos(angle) * 0.4, 0.9, Math.sin(angle) * 0.4);
      group.add(leaf);
    }
    this.scene.add(group);
  }

  buildMossyRock(x, y, z) {
    const rockGeo = new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.8, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.4 ? 0x475143 : 0x3d433b,
      roughness: 0.95
    });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(x, 0.8, z);
    rock.scale.set(1 + Math.random() * 0.4, 0.7 + Math.random() * 0.4, 1 + Math.random() * 0.4);
    rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    rock.castShadow = true;
    rock.receiveShadow = true;
    this.scene.add(rock);
    this.collisionObjects.push({ x: x, z: z, radius: 1.4 });
  }

  buildBraziers() {
    const brazierPositions = [
      [-6, 0, 18], [6, 0, 18],
      [-6, 0, 0], [6, 0, 0],
      [-6, 0, -20], [6, 0, -20],
      [-6, 0, -38], [6, 0, -38]
    ];

    brazierPositions.forEach(([bx, by, bz]) => {
      const group = new THREE.Group();
      group.position.set(bx, by, bz);

      const standMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 });
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.8, 8), standMat);
      stand.position.y = 0.9;
      stand.castShadow = true;
      group.add(stand);

      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.4, 0.6, 8), standMat);
      bowl.position.y = 1.9;
      group.add(bowl);

      // Glowing Fire mesh
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xff7700 });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 6), flameMat);
      flame.position.y = 2.4;
      group.add(flame);

      // Flickering Light
      const light = new THREE.PointLight(0xff9922, 2.2, 14);
      light.position.y = 2.6;
      group.add(light);

      this.scene.add(group);
      this.animatedTorches.push({ flame, light, baseIntensity: 2.2 });
      this.collisionObjects.push({ x: bx, z: bz, radius: 1.0 });
    });
  }

  buildCrackedWall(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x60584c, roughness: 0.95 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4.5, 1.2), wallMat);
    wall.position.y = 2.25;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    // Glowing crack lines
    const crackMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
    const crack1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 1.25), crackMat);
    crack1.position.set(0.3, 2.2, 0);
    crack1.rotation.z = 0.25;
    group.add(crack1);

    const crack2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 1.25), crackMat);
    crack2.position.set(-0.5, 2.5, 0);
    crack2.rotation.z = -0.3;
    group.add(crack2);

    this.scene.add(group);
    this.crackedWallMesh = group;
    this.crackedWallCollider = { x: x, z: z, radius: 2.6 };
    this.collisionObjects.push(this.crackedWallCollider);
  }

  // --- PROCEDURAL 3D CHARACTER MODEL GENERATOR ---
  setPlayerCharacter(charId) {
    this.selectedCharId = charId;
    this.charData = CHARACTERS[charId] || CHARACTERS.bravestone;

    // Reset stats from character specs
    this.health = this.charData.stats.health;
    this.maxHealth = this.charData.stats.health;
    this.stamina = 100;
    this.abilityCooldown = 0;

    // Remove old player mesh if present
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh);
      this.playerMesh = null;
    }

    // Build brand new articulated model matching the character
    const { group, joints } = this.buildCharacterModel(this.charData);
    this.playerMesh = group;
    this.playerJoints = joints;
    this.playerMesh.position.set(0, 0, 16); // Spawn point in front of Nigel
    this.scene.add(this.playerMesh);

    // Initial camera look target
    this.cameraYaw = Math.PI; // Face towards the temple (-Z)
    this.cameraPitch = 0.35;
  }

  buildCharacterModel(config) {
    const group = new THREE.Group();
    const joints = {};
    const cfg = config.modelConfig;

    const skinMat = new THREE.MeshStandardMaterial({ color: cfg.skinColor, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: cfg.shirtColor, roughness: 0.85 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: cfg.pantsColor, roughness: 0.9 });
    const vestMat = new THREE.MeshStandardMaterial({ color: cfg.vestColor, roughness: 0.75 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x221a15, roughness: 0.8 });

    // Root Pelvis
    const pelvisGeo = new THREE.BoxGeometry(0.65 * cfg.width, 0.35, 0.45);
    const pelvis = new THREE.Mesh(pelvisGeo, pantsMat);
    pelvis.position.y = 1.05 * (cfg.height / 2.0);
    pelvis.castShadow = true;
    group.add(pelvis);
    joints.pelvis = pelvis;

    // Torso / Chest
    const torsoGeo = new THREE.BoxGeometry(0.85 * cfg.width, 0.85, 0.55);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 0.6;
    torso.castShadow = true;
    pelvis.add(torso);
    joints.torso = torso;

    // Vest / Harness Details
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.9 * cfg.width, 0.75, 0.6), vestMat);
    torso.add(vest);

    // Neck & Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.25, 8), skinMat);
    neck.position.y = 0.52;
    torso.add(neck);

    const headGeo = new THREE.BoxGeometry(0.48, 0.52, 0.5);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.35;
    head.castShadow = true;
    neck.add(head);
    joints.head = head;

    // Head accessories (Hats, Spectacles, Hair)
    if (cfg.hasHat) {
      if (cfg.hatType === 'bucket') {
        // Finbar's safari bucket hat
        const hatMat = new THREE.MeshStandardMaterial({ color: cfg.hatColor, roughness: 0.8 });
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.3, 10), hatMat);
        crown.position.y = 0.32;
        head.add(crown);
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.05, 12), hatMat);
        brim.position.y = 0.2;
        head.add(brim);
      } else if (cfg.hatType === 'trapper') {
        // Oberon's winter earflap hat
        const hatMat = new THREE.MeshStandardMaterial({ color: cfg.hatColor, roughness: 0.9 });
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), hatMat);
        cap.position.y = 0.25;
        head.add(cap);
        // Flaps
        const flapL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.3), hatMat);
        flapL.position.set(-0.3, 0.05, 0);
        head.add(flapL);
        const flapR = flapL.clone();
        flapR.position.x = 0.3;
        head.add(flapR);
      } else if (cfg.hatType === 'aviator') {
        // Seaplane's aviator cap
        const hatMat = new THREE.MeshStandardMaterial({ color: cfg.hatColor, roughness: 0.7 });
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), hatMat);
        cap.position.y = 0.2;
        head.add(cap);
      }
    }

    // Glasses / Goggles
    if (cfg.hasGlasses) {
      const glassMat = new THREE.MeshBasicMaterial({ color: 0x90e0ef });
      const g1 = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 12), glassMat);
      g1.position.set(-0.14, 0.08, 0.27);
      head.add(g1);
      const g2 = g1.clone();
      g2.position.x = 0.14;
      head.add(g2);
    }

    // Hair details
    if (cfg.hairStyle === 'redPigtails') {
      const hairMat = new THREE.MeshStandardMaterial({ color: cfg.hairColor || 0xb84224, roughness: 0.8 });
      const bunL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.7, 6), hairMat);
      bunL.position.set(-0.25, -0.1, -0.2);
      bunL.rotation.z = -0.3;
      head.add(bunL);
      const bunR = bunL.clone();
      bunR.position.x = 0.25;
      bunR.rotation.z = 0.3;
      head.add(bunR);
    } else if (cfg.hairStyle === 'topknot') {
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), hairMat);
      knot.position.set(0, 0.38, -0.15);
      head.add(knot);
    }

    // Cloak / Cape for Ming
    if (cfg.hasCloak) {
      const cloakMat = new THREE.MeshStandardMaterial({ color: cfg.cloakColor, roughness: 0.85, side: THREE.DoubleSide });
      const cloak = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.4), cloakMat);
      cloak.position.set(0, -0.1, -0.32);
      cloak.rotation.x = 0.15;
      torso.add(cloak);
      joints.cloak = cloak;
    }

    // Giant Valet Backpack for Mouse Finbar
    if (cfg.hasBackpack) {
      const bagMat = new THREE.MeshStandardMaterial({ color: cfg.backpackColor, roughness: 0.9 });
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.1, 0.7), bagMat);
      pack.position.set(0, 0.0, -0.55);
      pack.castShadow = true;
      torso.add(pack);

      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0x936639 }));
      roll.rotation.z = Math.PI / 2;
      roll.position.set(0, 0.65, -0.55);
      torso.add(roll);
    }

    // Satchel for Oberon
    if (cfg.hasSatchel) {
      const satchel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.2), new THREE.MeshStandardMaterial({ color: 0x6f4e37 }));
      satchel.position.set(0.48, -0.4, 0);
      torso.add(satchel);
    }

    // Arms
    const buildArm = (side) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * (0.55 * cfg.width), 0.35, 0);
      torso.add(shoulder);

      // Upper Arm
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.45, 8), shirtMat);
      upperArm.position.y = -0.22;
      upperArm.castShadow = true;
      shoulder.add(upperArm);

      // Forearm / Elbow joint
      const elbow = new THREE.Group();
      elbow.position.y = -0.45;
      shoulder.add(elbow);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.45, 8), skinMat);
      forearm.position.y = -0.22;
      forearm.castShadow = true;
      elbow.add(forearm);

      // Hand
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), skinMat);
      hand.position.y = -0.48;
      elbow.add(hand);

      return { shoulder, elbow };
    };

    const armL = buildArm(-1);
    const armR = buildArm(1);
    joints.shoulderL = armL.shoulder;
    joints.elbowL = armL.elbow;
    joints.shoulderR = armR.shoulder;
    joints.elbowR = armR.elbow;

    // Legs
    const buildLeg = (side) => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.22, -0.15, 0);
      pelvis.add(hip);

      // Thigh
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.55, 8), pantsMat);
      thigh.position.y = -0.28;
      thigh.castShadow = true;
      hip.add(thigh);

      // Knee joint
      const knee = new THREE.Group();
      knee.position.y = -0.55;
      hip.add(knee);

      // Shin / Calf
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.55, 8), pantsMat);
      shin.position.y = -0.28;
      shin.castShadow = true;
      knee.add(shin);

      // Boot
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.38), bootMat);
      boot.position.set(0, -0.58, 0.08);
      boot.castShadow = true;
      knee.add(boot);

      return { hip, knee };
    };

    const legL = buildLeg(-1);
    const legR = buildLeg(1);
    joints.hipL = legL.hip;
    joints.kneeL = legL.knee;
    joints.hipR = legR.hip;
    joints.kneeR = legR.knee;

    return { group, joints };
  }

  // --- NPC: NIGEL BILLINGSLEY ---
  buildNPCNigel() {
    const group = new THREE.Group();
    group.position.set(2.5, 0, 18);

    const tweedMat = new THREE.MeshStandardMaterial({ color: 0x8a7250, roughness: 0.9 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x3d3121, roughness: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5ceb2, roughness: 0.7 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.45), tweedMat);
    body.position.y = 1.6;
    body.castShadow = true;
    group.add(body);

    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.9, 0.47), vestMat);
    vest.position.y = 1.6;
    group.add(vest);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), skinMat);
    head.position.y = 2.45;
    head.castShadow = true;
    group.add(head);

    // Pith Helmet
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xd9cca9, roughness: 0.75 });
    const helmetCrown = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), helmetMat);
    helmetCrown.position.y = 2.62;
    group.add(helmetCrown);
    const helmetBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 12), helmetMat);
    helmetBrim.position.y = 2.58;
    group.add(helmetBrim);

    // British Explorer Mustache
    const stache = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.1), new THREE.MeshStandardMaterial({ color: 0x332211 }));
    stache.position.set(0, 2.38, 0.25);
    group.add(stache);

    // Monocle
    const monocle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 12), new THREE.MeshBasicMaterial({ color: 0xd4af37 }));
    monocle.position.set(0.12, 2.48, 0.26);
    group.add(monocle);

    // Guide Book in hand
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.12), new THREE.MeshStandardMaterial({ color: 0x661111 }));
    book.position.set(0.55, 1.6, 0.25);
    book.rotation.set(0.3, -0.4, 0.2);
    group.add(book);

    // Floating Interaction Prompt
    const promptSprite = this.createFloatingPrompt("[E] Speak with Nigel");
    promptSprite.position.set(0, 3.2, 0);
    group.add(promptSprite);

    this.scene.add(group);
    this.nigelMesh = group;
    this.collisionObjects.push({ x: 2.5, z: 18, radius: 1.4 });
  }

  // --- ENEMY: THE CURSED JADE GUARDIAN ---
  buildGuardian() {
    const group = new THREE.Group();
    group.position.set(0, 0, -8);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x222a22, roughness: 0.85, metalness: 0.3 });
    const jadeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

    // Torso / Quadruped Panther Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 2.8), stoneMat);
    body.position.y = 1.4;
    body.castShadow = true;
    group.add(body);

    // Shoulders / Muscular Chest
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.2), stoneMat);
    chest.position.set(0, 1.6, -0.8);
    chest.castShadow = true;
    group.add(chest);

    // Head / Feline Skull
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 1.1), stoneMat);
    head.position.set(0, 1.9, -1.8);
    head.castShadow = true;
    group.add(head);

    // Glowing Jade Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), jadeMat);
    eyeL.position.set(-0.32, 2.05, -2.35);
    group.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.32;
    group.add(eyeR);

    // Fangs / Stone Claws
    const fangL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
    fangL.rotation.x = Math.PI;
    fangL.position.set(-0.25, 1.5, -2.25);
    group.add(fangL);
    const fangR = fangL.clone();
    fangR.position.x = 0.25;
    group.add(fangR);

    // Ears
    const earL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 4), stoneMat);
    earL.position.set(-0.38, 2.45, -1.7);
    group.add(earL);
    const earR = earL.clone();
    earR.position.x = 0.38;
    group.add(earR);

    // 4 Powerful Stone Legs
    const legPositions = [
      [-0.75, 0.7, -1.0], [0.75, 0.7, -1.0],
      [-0.65, 0.7, 0.9], [0.65, 0.7, 0.9]
    ];
    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.4, 0.45), stoneMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      group.add(leg);
    });

    // Tail
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 2.2, 6), stoneMat);
    tail.rotation.x = 0.9;
    tail.position.set(0, 1.6, 1.8);
    group.add(tail);

    // Floating Alert Icon Sprite
    const alertCanvas = document.createElement('canvas');
    alertCanvas.width = 128;
    alertCanvas.height = 128;
    const aCtx = alertCanvas.getContext('2d');
    aCtx.font = 'bold 80px sans-serif';
    aCtx.fillStyle = '#ff2222';
    aCtx.textAlign = 'center';
    aCtx.textBaseline = 'middle';
    aCtx.fillText('!', 64, 64);
    const alertTex = new THREE.CanvasTexture(alertCanvas);
    const alertSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: alertTex, transparent: true }));
    alertSprite.scale.set(1.5, 1.5, 1);
    alertSprite.position.set(0, 3.4, 0);
    alertSprite.visible = false;
    group.add(alertSprite);
    this.guardianAlertIcon = alertSprite;

    this.scene.add(group);
    this.guardian = {
      mesh: group,
      state: 'PATROL', // 'PATROL', 'CHASE', 'ATTACK', 'STUNNED', 'PACIFIED'
      patrolPoints: [
        new THREE.Vector3(-10, 0, -6),
        new THREE.Vector3(10, 0, -6),
        new THREE.Vector3(10, 0, -22),
        new THREE.Vector3(-10, 0, -22)
      ],
      currentPointIdx: 0,
      speed: 3.2,
      chaseSpeed: 6.4,
      attackCooldown: 0,
      detectionRange: 13,
      fov: Math.PI * 0.7
    };
  }

  // --- COLLECTIBLES & PUZZLES ---
  buildCollectiblesAndPuzzle() {
    // 1. Sun Altar Rune Pillars (Guarding the sanctum entrance)
    const pillarPositions = [
      { x: -5, z: -35, id: 0, color: 0xffaa00, name: 'Sun Rune (Fire)' },
      { x: 0, z: -37, id: 1, color: 0x00ccff, name: 'Moon Rune (Water)' },
      { x: 5, z: -35, id: 2, color: 0x00ff88, name: 'Earth Rune (Nature)' }
    ];

    pillarPositions.forEach(p => {
      const group = new THREE.Group();
      group.position.set(p.x, 0, p.z);

      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a5245, roughness: 0.9 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.8, 12), stoneMat);
      base.position.y = 0.4;
      group.add(base);

      // Rotating Rune Dial
      const dialMat = new THREE.MeshStandardMaterial({ color: 0x6e7868, roughness: 0.7 });
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.2, 8), dialMat);
      dial.position.y = 1.9;
      dial.castShadow = true;
      group.add(dial);

      // Glowing Symbol Crest
      const symbol = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 1.85), new THREE.MeshBasicMaterial({ color: p.color }));
      symbol.position.y = 1.9;
      group.add(symbol);

      const prompt = this.createFloatingPrompt(`[E] Rotate ${p.name}`);
      prompt.position.set(0, 3.6, 0);
      group.add(prompt);

      this.scene.add(group);
      this.runePillarMeshes.push({ group, dial, symbol, config: p });
      this.collisionObjects.push({ x: p.x, z: p.z, radius: 1.4 });
    });

    // 2. Collectible Falcon Glyphs (3 scattered)
    const glyphPositions = [
      { x: -14, y: 1.2, z: 8, name: 'Pillar Grove Falcon Glyph' },
      { x: -22, y: 1.5, z: -10, name: 'Sacred Water Sanctuary Glyph' },
      { x: 18, y: 1.2, z: -25, name: 'Ancient Alcove Falcon Glyph' }
    ];

    glyphPositions.forEach(pos => {
      const group = new THREE.Group();
      group.position.set(pos.x, pos.y, pos.z);

      const glyphGeo = new THREE.OctahedronGeometry(0.5, 0);
      const glyphMat = new THREE.MeshBasicMaterial({ color: 0xffd700, wireframe: false });
      const mesh = new THREE.Mesh(glyphGeo, glyphMat);
      group.add(mesh);

      const light = new THREE.PointLight(0xffd700, 1.8, 6);
      group.add(light);

      this.scene.add(group);
      this.collectibleMeshes.push({ group, mesh, type: 'glyph', name: pos.name, collected: false });
    });

    // 3. Healing Jungle Berries (Restores 30 HP)
    const berryPositions = [
      { x: -8, y: 0.8, z: 5 },
      { x: 12, y: 0.8, z: 2 }
    ];
    berryPositions.forEach(pos => {
      const group = new THREE.Group();
      group.position.set(pos.x, pos.y, pos.z);

      for (let i = 0; i < 4; i++) {
        const berry = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.3 }));
        berry.position.set((Math.random() - 0.5) * 0.4, 0.4 + i * 0.15, (Math.random() - 0.5) * 0.4);
        group.add(berry);
      }

      const light = new THREE.PointLight(0xff2a55, 1.2, 4);
      group.add(light);

      this.scene.add(group);
      this.collectibleMeshes.push({ group, type: 'berry', name: 'Jumanji Healing Berries', collected: false });
    });
  }

  createFloatingPrompt(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.roundRect(10, 10, 364, 76, 20);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 192, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    sprite.scale.set(2.8, 0.7, 1);
    sprite.visible = false;
    return sprite;
  }

  // --- SPECIAL ABILITIES (Character-Specific) ---
  triggerSpecialAbility() {
    if (this.abilityCooldown > 0) return;

    this.abilityCooldown = this.charData.ability.cooldown;
    this.isAttacking = true;
    this.attackTimer = 0.8;
    soundEngine.playSfx(this.charData.ability.sound);

    const pPos = this.playerMesh.position;

    // Trigger visual effect & gameplay mechanic per character
    switch (this.charData.id) {
      case 'bravestone': {
        // SMOLDERING SMASH: Shockwave & breaks cracked wall / stuns guardian
        this.spawnShockwave(pPos, 0xe07a2c, 8);
        this.checkWallBreak();
        this.stunNearbyGuardian(9, 5.0);
        this.showNotification("SMOLDERING SMASH! Nearby obstacles shattered & guardian stunned!");
        break;
      }
      case 'oberon': {
        // GLYPH DECRYPTION: Instantly solves rune lock / reveals puzzle frequency
        this.spawnMagicAura(pPos, 0x4ea8de);
        this.solveAllPillars();
        this.showNotification("GLYPH DECRYPTION! Ancient runes decoded & aligned!");
        break;
      }
      case 'seaplane': {
        // SIGNAL FLARE & DASH: Blinds guardian & grants speed boost
        this.spawnFlare(pPos);
        this.stunNearbyGuardian(14, 6.0);
        this.stamina = 100;
        this.showNotification("SIGNAL FLARE! Guardian blinded & speed surge active!");
        break;
      }
      case 'finbar': {
        // BEAST WHISPER: Pacifies guardian beast permanently
        this.spawnBeastNotes(pPos);
        if (this.guardian && pPos.distanceTo(this.guardian.mesh.position) < 18) {
          this.guardian.state = 'PACIFIED';
          this.guardianPacified = true;
          this.guardianAlertIcon.visible = true;
          // Change alert icon to heart
          const c = document.createElement('canvas'); c.width = 128; c.height = 128;
          const ctx = c.getContext('2d'); ctx.font = '80px sans-serif'; ctx.fillStyle = '#ff69b4'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♥', 64, 64);
          this.guardianAlertIcon.material.map = new THREE.CanvasTexture(c);
          this.guardianAlertIcon.material.needsUpdate = true;
          this.showNotification("BEAST WHISPER! The Cursed Guardian is pacified!");
        } else {
          this.showNotification("BEAST WHISPER! Jungle creatures reveal sacred clues!");
        }
        break;
      }
      case 'ruby': {
        // DANCE FIGHTING WHIRLWIND: Spins & knocks out guardian / activates switches
        this.spawnWhirlwind(pPos);
        this.stunNearbyGuardian(8, 6.0);
        this.checkWallBreak();
        this.solveAllPillars();
        this.showNotification("WHIRLWIND DANCE! Struck all switches in lightning rhythm!");
        break;
      }
      case 'ming': {
        // SHADOW CLOAK & PICK: Invisibility & picks temple locks instantly
        this.stealthTimer = 6.0;
        this.spawnShadowSmoke(pPos);
        this.solveAllPillars();
        this.showNotification("SHADOW CLOAK & PICK! Invisibility active & locks bypassed!");
        break;
      }
    }
  }

  checkWallBreak() {
    if (this.crackedWallBroken) return;
    const pPos = this.playerMesh.position;
    if (pPos.distanceTo(this.crackedWallMesh.position) < 6.5) {
      this.crackedWallBroken = true;
      // Remove collider
      const idx = this.collisionObjects.indexOf(this.crackedWallCollider);
      if (idx !== -1) this.collisionObjects.splice(idx, 1);
      // Explode wall mesh downward
      this.scene.remove(this.crackedWallMesh);
      soundEngine.playSfx('smash');
      this.showNotification("CRACKED WALL SHATTERED! Secret shortcut opened!");
    }
  }

  stunNearbyGuardian(dist, duration) {
    if (!this.guardian || this.guardian.state === 'PACIFIED') return;
    if (this.playerMesh.position.distanceTo(this.guardian.mesh.position) < dist) {
      this.guardian.state = 'STUNNED';
      this.guardianStunTimer = duration;
      this.guardianAlertIcon.visible = true;
      // Change alert icon to stars
      const c = document.createElement('canvas'); c.width = 128; c.height = 128;
      const ctx = c.getContext('2d'); ctx.font = '80px sans-serif'; ctx.fillStyle = '#ffdd00'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💫', 64, 64);
      this.guardianAlertIcon.material.map = new THREE.CanvasTexture(c);
      this.guardianAlertIcon.material.needsUpdate = true;
    }
  }

  solveAllPillars() {
    this.sunPillars.forEach(p => {
      p.currentAngle = p.targetAngle;
      p.solved = true;
    });
    this.runePillarMeshes.forEach(mesh => {
      mesh.dial.rotation.y = 0;
      mesh.symbol.material.color.setHex(0x00ffaa);
    });
    this.checkPuzzleCompletion();
  }

  // --- PARTICLE EFFECTS ---
  spawnShockwave(pos, color, maxRadius) {
    const geo = new THREE.RingGeometry(0.4, 0.8, 24);
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    ring.position.y += 0.15;
    this.scene.add(ring);
    this.particles.push({ mesh: ring, scaleSpeed: maxRadius * 2.5, fadeSpeed: 2.2 });
  }

  spawnMagicAura(pos, color) {
    for (let i = 0; i < 16; i++) {
      const geo = new THREE.SphereGeometry(0.12, 6, 6);
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color }));
      mesh.position.set(pos.x + (Math.random() - 0.5) * 2, pos.y + 0.2 + Math.random(), pos.z + (Math.random() - 0.5) * 2);
      this.scene.add(mesh);
      this.particles.push({ mesh, vy: 2.5 + Math.random(), fadeSpeed: 1.8 });
    }
  }

  spawnFlare(pos) {
    const flare = new THREE.PointLight(0xff5500, 6, 20);
    flare.position.copy(pos);
    flare.position.y += 3;
    this.scene.add(flare);
    setTimeout(() => this.scene.remove(flare), 1200);
  }

  spawnBeastNotes(pos) {
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.TorusGeometry(0.15, 0.04, 6, 12);
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x52b788 }));
      mesh.position.set(pos.x + (Math.random() - 0.5) * 2, pos.y + 1 + Math.random() * 0.8, pos.z + (Math.random() - 0.5) * 2);
      this.scene.add(mesh);
      this.particles.push({ mesh, vy: 1.8, fadeSpeed: 1.4 });
    }
  }

  spawnWhirlwind(pos) {
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.TorusGeometry(1.5 + i * 0.6, 0.1, 6, 24);
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff0054, transparent: true, opacity: 0.8 }));
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(pos);
      mesh.position.y += 0.8 + i * 0.4;
      this.scene.add(mesh);
      this.particles.push({ mesh, scaleSpeed: 3.5, fadeSpeed: 2.5 });
    }
  }

  spawnShadowSmoke(pos) {
    for (let i = 0; i < 20; i++) {
      const geo = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3, 0);
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x221133, transparent: true, opacity: 0.85 }));
      mesh.position.set(pos.x + (Math.random() - 0.5) * 1.5, pos.y + Math.random() * 1.5, pos.z + (Math.random() - 0.5) * 1.5);
      this.scene.add(mesh);
      this.particles.push({ mesh, vy: 0.8, scaleSpeed: 1.2, fadeSpeed: 1.2 });
    }
  }

  // --- INTERACTION & DIALOGUE SYSTEM ---
  handleInteraction() {
    if (!this.activeInteractable) return;

    const { type, entity } = this.activeInteractable;

    if (type === 'nigel') {
      this.state = 'DIALOGUE';
      this.hasSpokenToNigel = true;
      this.questObjective = "Solve the Sun Altar Rune Lock or use your Special Ability [Q]";
      if (this.onDialogueTrigger) {
        this.onDialogueTrigger({
          speaker: 'Nigel Billingsley',
          speakerRole: 'Field Guide & Automaton',
          text: this.charData.dialogue.nigel,
          replyOptions: [
            { text: this.charData.dialogue.replyNigel, next: 'mission' },
            { text: "What are the rules of Jumanji?", next: 'rules' }
          ]
        });
      }
      soundEngine.playSfx('dialogue');
    } else if (type === 'pillar') {
      const p = entity.config;
      p.currentAngle = (p.currentAngle + 90) % 360;
      entity.dial.rotation.y = THREE.MathUtils.degToRad(p.currentAngle);
      soundEngine.playSfx('click');

      if (p.currentAngle === p.targetAngle) {
        entity.symbol.material.color.setHex(0x00ffaa);
        p.solved = true;
        soundEngine.playSfx('puzzleSolve');
      } else {
        entity.symbol.material.color.setHex(p.color);
        p.solved = false;
      }
      this.checkPuzzleCompletion();
    } else if (type === 'altar') {
      this.state = 'DECISION';
      soundEngine.stopDrums();
      soundEngine.playSfx('endingFanfare', { type: 'neutral' });
      if (this.onDecisionTrigger) {
        this.onDecisionTrigger();
      }
    }
  }

  checkPuzzleCompletion() {
    const allSolved = this.sunPillars.every(p => p.solved || p.currentAngle === p.targetAngle);
    if (allSolved && !this.gateUnlocked) {
      this.gateUnlocked = true;
      this.questObjective = "Ascend the Sun Sanctuary & Approach The Falcon Jewel";
      soundEngine.playSfx('puzzleSolve');
      this.showNotification("SANCTUARY GATE LOWERED! Path to Falcon Jewel is open!");

      // Animate gate sliding down into floor
      const startY = this.templeGateMesh.position.y;
      const targetY = -4;
      const startTime = performance.now();
      const slideGate = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(1, elapsed / 2.0);
        this.templeGateMesh.position.y = THREE.MathUtils.lerp(startY, targetY, t);
        if (t < 1) requestAnimationFrame(slideGate);
      };
      slideGate();
    }
  }

  // --- NOTIFICATION BANNER ---
  showNotification(msg) {
    if (this.onNotification) {
      this.onNotification(msg);
    }
  }

  // --- GAMEPLAY UPDATE LOOP ---
  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(0.1, this.clock.getDelta());
    this.animTime += delta;

    if (this.state === 'PLAYING') {
      this.updatePlayer(delta);
      this.updateGuardian(delta);
      this.updateCollectibles(delta);
      this.checkInteractions();
    }

    this.updateEnvironment(delta);
    this.updateParticles(delta);
    this.updateCamera(delta);

    this.renderer.render(this.scene, this.camera);
  }

  updatePlayer(delta) {
    if (!this.playerMesh) return;

    // Stamina & Sprinting
    this.isSprinting = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && this.stamina > 5;
    if (this.isSprinting && (this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD'])) {
      this.stamina = Math.max(0, this.stamina - 20 * delta);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 14 * delta);
    }

    // Ability Cooldown
    if (this.abilityCooldown > 0) {
      this.abilityCooldown = Math.max(0, this.abilityCooldown - delta);
    }

    // Stealth Timer (Ming)
    if (this.stealthTimer > 0) {
      this.stealthTimer = Math.max(0, this.stealthTimer - delta);
      this.playerMesh.traverse(child => {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = this.stealthTimer > 0 ? 0.35 : 1.0;
        }
      });
    }

    // Attack Timer
    if (this.isAttacking) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }

    // Direction calculation relative to camera yaw
    let moveX = 0, moveZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    this.isMoving = len > 0.01;

    if (this.isMoving) {
      moveX /= len;
      moveZ /= len;

      const baseSpeed = this.charData.stats.speed;
      const currentSpeed = baseSpeed * (this.isSprinting ? 1.6 : 1.0);

      // Rotate movement vector by camera yaw
      const forwardX = -Math.sin(this.cameraYaw);
      const forwardZ = -Math.cos(this.cameraYaw);
      const rightX = Math.cos(this.cameraYaw);
      const rightZ = -Math.sin(this.cameraYaw);

      const vx = (rightX * moveX + forwardX * moveZ) * currentSpeed * delta;
      const vz = (rightZ * moveX + forwardZ * moveZ) * currentSpeed * delta;

      const newX = this.playerMesh.position.x + vx;
      const newZ = this.playerMesh.position.z + vz;

      // World boundary clamping & obstacle collision
      if (!this.checkCollision(newX, newZ, 0.7)) {
        this.playerMesh.position.x = newX;
        this.playerMesh.position.z = newZ;
      }

      // Smoothly rotate player to face direction of travel
      const targetAngle = Math.atan2(vx, vz);
      this.playerMesh.rotation.y = THREE.MathUtils.lerp(this.playerMesh.rotation.y, targetAngle, 12 * delta);

      // Footstep SFX
      this.walkCycle += delta * (this.isSprinting ? 14 : 9);
      if (Math.sin(this.walkCycle) > 0.95) {
        soundEngine.playSfx('step');
      }
    } else {
      this.walkCycle = 0;
    }

    // Gravity & Vertical physics
    if (!this.isGrounded) {
      this.verticalVelocity -= 26 * delta;
      this.playerMesh.position.y += this.verticalVelocity * delta;

      // Ground check (Sanctuary stairs & temple tiers)
      const pz = this.playerMesh.position.z;
      const px = this.playerMesh.position.x;
      let groundH = 0;

      // Temple steps height calculation
      if (pz < -38 && pz > -58 && Math.abs(px) < 14) {
        const distIntoTemple = Math.abs(pz - (-38));
        groundH = Math.min(6.5, distIntoTemple * 0.45);
      }

      if (this.playerMesh.position.y <= groundH) {
        this.playerMesh.position.y = groundH;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // Animate Humanoid Joints
    this.animatePlayerJoints(delta);
  }

  checkCollision(x, z, radius) {
    // World bounds
    if (Math.abs(x) > 65 || z > 35 || z < -65) return true;

    // Gate collision (if not unlocked)
    if (!this.gateUnlocked && z < -36 && z > -42 && Math.abs(x) < 5) return true;

    // Static obstacles (pillars, rocks, statues)
    for (const obj of this.collisionObjects) {
      const dx = x - obj.x;
      const dz = z - obj.z;
      if (Math.sqrt(dx * dx + dz * dz) < (radius + obj.radius)) {
        return true;
      }
    }
    return false;
  }

  animatePlayerJoints(delta) {
    const j = this.playerJoints;
    if (!j.torso) return;

    if (this.isAttacking) {
      // Special ability strike pose
      j.torso.rotation.x = -0.3;
      j.shoulderR.rotation.x = -Math.PI * 0.8;
      j.shoulderL.rotation.x = -Math.PI * 0.8;
      return;
    }

    if (!this.isGrounded) {
      // Jump pose
      j.hipL.rotation.x = -0.7;
      j.kneeL.rotation.x = 0.9;
      j.hipR.rotation.x = -0.5;
      j.kneeR.rotation.x = 0.7;
      j.shoulderL.rotation.x = -1.2;
      j.shoulderR.rotation.x = -1.2;
      return;
    }

    if (this.isMoving) {
      // Walk / Sprint cycle
      const legAngle = Math.sin(this.walkCycle) * (this.isSprinting ? 0.95 : 0.6);
      j.hipL.rotation.x = legAngle;
      j.kneeL.rotation.x = Math.max(0, -legAngle * 1.1);

      j.hipR.rotation.x = -legAngle;
      j.kneeR.rotation.x = Math.max(0, legAngle * 1.1);

      // Opposite arm swings
      j.shoulderL.rotation.x = -legAngle * 0.85;
      j.shoulderR.rotation.x = legAngle * 0.85;

      j.torso.position.y = 0.6 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.08;
      j.torso.rotation.z = Math.sin(this.walkCycle) * 0.05;
    } else {
      // Idle Breathing
      const breath = Math.sin(this.animTime * 2.2) * 0.03;
      j.torso.position.y = 0.6 + breath;
      j.torso.rotation.set(0, 0, 0);
      j.hipL.rotation.set(0, 0, 0);
      j.hipR.rotation.set(0, 0, 0);
      j.kneeL.rotation.set(0, 0, 0);
      j.kneeR.rotation.set(0, 0, 0);
      j.shoulderL.rotation.x = Math.sin(this.animTime * 1.8) * 0.08;
      j.shoulderR.rotation.x = -Math.sin(this.animTime * 1.8) * 0.08;
    }
  }

  updateGuardian(delta) {
    if (!this.guardian) return;

    const g = this.guardian;
    const gPos = g.mesh.position;
    const pPos = this.playerMesh.position;
    const distToPlayer = gPos.distanceTo(pPos);

    if (g.state === 'PACIFIED') {
      // Follow player at gentle distance like a tamed companion!
      if (distToPlayer > 5) {
        const dir = new THREE.Vector3().subVectors(pPos, gPos).normalize();
        gPos.addScaledVector(dir, 2.5 * delta);
        g.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      }
      return;
    }

    if (g.state === 'STUNNED') {
      this.guardianStunTimer -= delta;
      g.mesh.rotation.z = Math.sin(this.animTime * 10) * 0.15;
      if (this.guardianStunTimer <= 0) {
        g.state = 'PATROL';
        this.guardianAlertIcon.visible = false;
        g.mesh.rotation.z = 0;
      }
      return;
    }

    // Stealth check (Ming)
    const canSeePlayer = this.stealthTimer <= 0 && distToPlayer < (this.isSprinting ? g.detectionRange * 1.4 : g.detectionRange);

    if (canSeePlayer) {
      if (g.state !== 'CHASE') {
        g.state = 'CHASE';
        this.guardianAlertIcon.visible = true;
        soundEngine.playSfx('guardianRoar');
        soundEngine.setIntensity(2); // War drums intensify!
        this.showNotification("GUARDIAN SPOTTED YOU! Run or use your Special Ability [Q]!");
      }

      // Chase Player
      const dir = new THREE.Vector3().subVectors(pPos, gPos).normalize();
      gPos.addScaledVector(dir, g.chaseSpeed * delta);
      g.mesh.rotation.y = THREE.MathUtils.lerp(g.mesh.rotation.y, Math.atan2(dir.x, dir.z), 10 * delta);

      // Attack if close
      if (distToPlayer < 2.5) {
        g.attackCooldown -= delta;
        if (g.attackCooldown <= 0) {
          g.attackCooldown = 1.6;
          this.damagePlayer(25);
          soundEngine.playSfx('hit');
        }
      }
    } else {
      if (g.state === 'CHASE') {
        g.state = 'PATROL';
        this.guardianAlertIcon.visible = false;
        soundEngine.setIntensity(1); // Back to exploration drums
      }

      // Follow Patrol Waypoints
      const targetPoint = g.patrolPoints[g.currentPointIdx];
      const distToTarget = gPos.distanceTo(targetPoint);
      if (distToTarget < 1.5) {
        g.currentPointIdx = (g.currentPointIdx + 1) % g.patrolPoints.length;
      } else {
        const dir = new THREE.Vector3().subVectors(targetPoint, gPos).normalize();
        gPos.addScaledVector(dir, g.speed * delta);
        g.mesh.rotation.y = THREE.MathUtils.lerp(g.mesh.rotation.y, Math.atan2(dir.x, dir.z), 6 * delta);
      }
    }
  }

  damagePlayer(dmg) {
    this.health = Math.max(0, this.health - dmg);
    if (this.onHealthChange) this.onHealthChange(this.health, this.maxHealth);

    if (this.health <= 0) {
      this.lives--;
      soundEngine.playSfx('hit');
      if (this.onLivesChange) this.onLivesChange(this.lives);

      if (this.lives > 0) {
        // Classic Jumanji Sky Respawn!
        this.showNotification(`AVATAR DOWN! Falling back into Jumanji! (${this.lives} lives remaining)`);
        this.playerMesh.position.set(0, 18, 16);
        this.verticalVelocity = -4;
        this.isGrounded = false;
        this.health = this.maxHealth;
      } else {
        // Game Over screen
        this.state = 'GAMEOVER';
        if (this.onGameOver) this.onGameOver();
      }
    }
  }

  updateCollectibles(delta) {
    const pPos = this.playerMesh.position;

    this.collectibleMeshes.forEach(col => {
      if (col.collected) return;

      // Bob & Rotate animation
      col.group.position.y += Math.sin(this.animTime * 3) * 0.003;
      col.group.rotation.y += 1.8 * delta;

      // Player proximity pickup
      if (pPos.distanceTo(col.group.position) < 1.8) {
        col.collected = true;
        this.scene.remove(col.group);
        soundEngine.playSfx('pickup');

        if (col.type === 'glyph') {
          this.collectedGlyphs++;
          this.showNotification(`COLLECTED: ${col.name} (${this.collectedGlyphs}/${this.totalGlyphs})`);
          if (this.onGlyphCollected) this.onGlyphCollected(this.collectedGlyphs, this.totalGlyphs);
        } else if (col.type === 'berry') {
          this.collectedBerries++;
          this.health = Math.min(this.maxHealth, this.health + 35);
          this.stamina = this.maxStamina;
          this.showNotification(`HEALED: 35 HP restored from ${col.name}!`);
          if (this.onHealthChange) this.onHealthChange(this.health, this.maxHealth);
        }
      }
    });
  }

  checkInteractions() {
    const pPos = this.playerMesh.position;
    this.activeInteractable = null;

    // 1. Nigel Billingsley
    if (this.nigelMesh && pPos.distanceTo(this.nigelMesh.position) < 3.2) {
      this.activeInteractable = { type: 'nigel' };
      this.setPromptVisible(this.nigelMesh, true);
    } else if (this.nigelMesh) {
      this.setPromptVisible(this.nigelMesh, false);
    }

    // 2. Rune Pillars
    this.runePillarMeshes.forEach(pMesh => {
      if (pPos.distanceTo(pMesh.group.position) < 2.8) {
        this.activeInteractable = { type: 'pillar', entity: pMesh };
        this.setPromptVisible(pMesh.group, true);
      } else {
        this.setPromptVisible(pMesh.group, false);
      }
    });

    // 3. Falcon Jewel Altar
    if (this.falconJewel) {
      const altarPos = new THREE.Vector3(0, 6.5, -50);
      if (pPos.distanceTo(altarPos) < 4.5 && this.gateUnlocked) {
        this.activeInteractable = { type: 'altar' };
        if (this.onAltarProximity) this.onAltarProximity(true);
      } else {
        if (this.onAltarProximity) this.onAltarProximity(false);
      }
    }

    if (this.onInteractionPrompt) {
      this.onInteractionPrompt(this.activeInteractable);
    }
  }

  setPromptVisible(group, visible) {
    group.traverse(child => {
      if (child.isSprite && child !== this.guardianAlertIcon) {
        child.visible = visible;
      }
    });
  }

  updateEnvironment(delta) {
    // Flickering torch flames
    this.animatedTorches.forEach(t => {
      t.flame.scale.y = 1.0 + Math.sin(this.animTime * 12 + t.flame.position.x) * 0.18;
      t.light.intensity = t.baseIntensity + (Math.random() - 0.5) * 0.4;
    });

    // Rotating Falcon Jewel & Orbiting rings
    if (this.falconJewel) {
      this.falconJewel.rotation.y += 1.2 * delta;
      this.falconJewel.rotation.x = Math.sin(this.animTime * 1.5) * 0.2;
      this.jewelLight.intensity = 3.0 + Math.sin(this.animTime * 4) * 1.2;

      if (this.runeRing1) this.runeRing1.rotation.z += 0.8 * delta;
      if (this.runeRing2) this.runeRing2.rotation.y += 0.6 * delta;
    }
  }

  updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.scaleSpeed) {
        p.mesh.scale.addScalar(p.scaleSpeed * delta);
      }
      if (p.vy) {
        p.mesh.position.y += p.vy * delta;
      }
      if (p.mesh.material) {
        p.mesh.material.opacity = Math.max(0, p.mesh.material.opacity - p.fadeSpeed * delta);
        if (p.mesh.material.opacity <= 0) {
          this.scene.remove(p.mesh);
          this.particles.splice(i, 1);
        }
      }
    }
  }

  // --- CAMERA UPDATE & CINEMATICS ---
  updateCamera(delta) {
    if (this.cameraMode === 'CINEMATIC') {
      this.cinematicTime += delta;
      const progress = Math.min(1, this.cinematicTime / this.cinematicDuration);
      // Smooth smoothstep interpolation
      const t = progress * progress * (3 - 2 * progress);

      this.camera.position.lerpVectors(this.cinematicCamStart, this.cinematicCamEnd, t);
      this.cameraTarget.lerpVectors(this.cinematicTargetStart, this.cinematicTargetEnd, t);
      this.camera.lookAt(this.cameraTarget);

      if (progress >= 1 && this.cinematicCallback) {
        const cb = this.cinematicCallback;
        this.cinematicCallback = null;
        cb();
      }
      return;
    }

    // Third-person orbit follow camera
    if (!this.playerMesh) return;

    const targetPos = this.playerMesh.position.clone();
    targetPos.y += 1.4; // Target upper chest/head

    // Smooth camera target
    this.cameraTarget.lerp(targetPos, 14 * delta);

    // Calculate spherical camera position
    const offsetX = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const offsetY = Math.sin(this.cameraPitch) * this.cameraDistance;
    const offsetZ = Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

    const camX = this.cameraTarget.x + offsetX;
    const camY = Math.max(0.8, this.cameraTarget.y + offsetY);
    const camZ = this.cameraTarget.z + offsetZ;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(this.cameraTarget);
  }

  playCinematic(camStart, camEnd, targetStart, targetEnd, duration, onComplete) {
    this.cameraMode = 'CINEMATIC';
    this.cinematicCamStart.copy(camStart);
    this.cinematicCamEnd.copy(camEnd);
    this.cinematicTargetStart.copy(targetStart);
    this.cinematicTargetEnd.copy(targetEnd);
    this.cinematicDuration = duration;
    this.cinematicTime = 0;
    this.cinematicCallback = onComplete;
  }

  playIntroFlyover(onComplete) {
    soundEngine.setIntensity(1);
    soundEngine.startJumanjiDrums(1);

    // Camera sweeps from high above the entrance arch down toward the player and Nigel
    this.playCinematic(
      new THREE.Vector3(0, 32, 45),
      new THREE.Vector3(0, 4.5, 23),
      new THREE.Vector3(0, 6, -30),
      new THREE.Vector3(0, 1.8, 16),
      6.0,
      () => {
        this.cameraMode = 'ORBIT';
        this.state = 'PLAYING';
        if (onComplete) onComplete();
      }
    );
  }

  playEndingCinematic(endingKey, onComplete) {
    this.cameraMode = 'CINEMATIC';
    const charEnding = this.charData.endings[endingKey];
    soundEngine.stopDrums();
    soundEngine.playSfx('endingFanfare', { type: endingKey });

    // Choreographed camera movement around the Falcon Jewel Altar
    this.playCinematic(
      new THREE.Vector3(0, 9, -42),
      new THREE.Vector3(12, 14, -58),
      new THREE.Vector3(0, 10.4, -50),
      new THREE.Vector3(0, 10.4, -50),
      8.0,
      () => {
        if (onComplete) onComplete(charEnding);
      }
    );
  }
}
