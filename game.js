/**
 * Jumanji x Axes.io - Core 3D Action-Arena Engine
 * - Realistic articulated 3D humanoid characters & rival champions with powers
 * - Zero-lag pooled collectibles (shared geometries/materials, no per-item PointLights)
 * - Crisp direct WASD + Virtual Joystick movement with sliding wall collision
 * - Spinning 3D throwing axes, Bullseye hits, XP Level-Up Perks, Leaderboard & Kill Feed
 * - 5 connected Jumanji levels culminating in The Shadow Colossus & The Last Decision
 */

import * as THREE from './three.module.js';
import { CHARACTERS } from './characters.js';
import { LEVELS } from './levels.js';
import { soundEngine } from './audio.js';

const JUMANJI_ANIMALS = [
  { type: 'jaguar', name: 'Jade Jaguar', power: 'pounce', color: 0x00ff88, hp: 100, speed: 2.3 },
  { type: 'rhino', name: 'Charging Rhino', power: 'stampede', color: 0xf59e0b, hp: 145, speed: 1.8 },
  { type: 'hippo', name: 'River Hippo', power: 'slam', color: 0x38bdf8, hp: 135, speed: 1.7 },
  { type: 'mandrill', name: 'Savage Mandrill', power: 'triple', color: 0xef4444, hp: 90, speed: 2.2 },
  { type: 'cobra', name: 'Venom Cobra', power: 'frost', color: 0x22c55e, hp: 85, speed: 2.0 },
  { type: 'ostrich', name: 'Fierce Ostrich', power: 'rapid', color: 0xfbbf24, hp: 80, speed: 2.6 }
];

export const PERK_POOL = [
  { id: 'double', name: 'Double Axe', icon: '🪓🪓', desc: 'Throw 2 axes in a spread!' },
  { id: 'fire', name: 'Fire Blade', icon: '🔥', desc: 'Axes burn enemies for +18 bonus damage!' },
  { id: 'ricochet', name: 'Ricochet', icon: '⚡', desc: 'Axes bounce off walls once!' },
  { id: 'vampire', name: 'Vampiric', icon: '🩸', desc: 'Heal +15 HP on every enemy kill!' },
  { id: 'rapid', name: 'Rapid Throw', icon: '💨', desc: '35% faster axe throw cooldown!' },
  { id: 'giant', name: 'Titan Axe', icon: '💥', desc: 'Larger axes with +30% damage!' }
];

export class JumanjiGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.selectedCharId = 'bravestone';
    this.charData = CHARACTERS.bravestone;

    // Campaign & Match State
    this.currentLevel = 1;
    this.unlockedLevel = 1;
    this.score = 0;
    this.coins = 0;
    this.kills = 0;
    this.xp = 0;
    this.xpToNext = 100;
    this.matchLevel = 1;
    this.state = 'INIT';

    // Player Stats & Perks
    this.lives = 3;
    this.health = 100;
    this.maxHealth = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.abilityCooldown = 0;
    this.throwCooldown = 0;
    this.speedBoostTimer = 0;
    this.shieldTimer = 0;
    this.dodgeTimer = 0;
    this.slowTimer = 0;
    this.stealthTimer = 0;
    this.perks = new Set();

    // Inventory
    this.inventory = { berries: 1, speedElixir: 1, shieldCharm: 0, keys: 0 };

    // Level Progress
    this.levelConfig = LEVELS[0];
    this.questObjective = LEVELS[0].objective;
    this.levelItemsCollected = 0;
    this.levelItemsRequired = 0;
    this.beaconsSabotaged = 0;
    this.gateUnlocked = false;
    this.checkpointPos = new THREE.Vector3(0, 0, 16);
    this.sunPillars = [];

    // Three.js
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.levelGroup = new THREE.Group();
    this.shared = {};

    // Entities
    this.playerMesh = null;
    this.playerJoints = {};
    this.aimDir = new THREE.Vector3(0, 0, -1);
    this.aimReticle = null;
    this.enemies = [];
    this.projectiles = [];
    this.boss = null;
    this.traps = [];
    this.checkpoints = [];
    this.secretChests = [];
    this.beacons = [];
    this.pressurePads = [];
    this.levers = [];
    this.sequencePedestals = [];
    this.sequenceIndex = 0;
    this.boxWalls = [];
    this.atmosphericParticles = null;
    this.falconJewel = null;
    this.exitPortal = null;
    this.nigelMesh = null;
    this.templeGateMesh = null;
    this.runePillarMeshes = [];
    this.collectibleMeshes = [];
    this.particles = [];
    this.collisionObjects = [];
    this.waterZones = [];

    // Camera & Juice
    this.cameraMode = 'FOLLOW';
    this.cameraShake = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.cinematicTime = 0;
    this.cinematicCallback = null;
    this.cinematicCamStart = new THREE.Vector3();
    this.cinematicCamEnd = new THREE.Vector3();
    this.cinematicTargetStart = new THREE.Vector3();
    this.cinematicTargetEnd = new THREE.Vector3();
    this.cinematicDuration = 0;
    this.cameraTarget = new THREE.Vector3();

    // Input
    this.keys = {};
    this.joystickVec = { x: 0, y: 0 };
    this.mouseNDC = new THREE.Vector2(0, 0);
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Animation
    this.animTime = 0;
    this.walkCycle = 0;
    this.isMoving = false;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.throwAnimTimer = 0;

    this.initThree();
    this.initSharedAssets();
    this.setupInputs();
    this.scene.add(this.levelGroup);
    this.loadLevel(1);
    this.setPlayerCharacter(this.selectedCharId);

    window.addEventListener('resize', () => this.onResize());
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x5288d8);
    this.scene.fog = new THREE.FogExp2(0x5288d8, 0.009);

    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.position.set(0, 14, 28);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5d6, 1.5);
    this.sunLight.position.set(28, 48, 22);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    const d = 48;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);
  }

  // Shared geometries & materials for ZERO-LAG pickups and projectiles!
  initSharedAssets() {
    this.shared.coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 12);
    this.shared.coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.75, roughness: 0.25, emissive: 0x664400 });
    this.shared.gemGeo = new THREE.OctahedronGeometry(0.42, 0);
    this.shared.gemMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x9d174d, roughness: 0.2 });
    this.shared.crystalMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x008844, roughness: 0.2 });
    this.shared.keyGeo = new THREE.TorusKnotGeometry(0.28, 0.09, 20, 6);
    this.shared.berryGeo = new THREE.SphereGeometry(0.36, 8, 8);
    this.shared.berryMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d });
    this.shared.speedGeo = new THREE.ConeGeometry(0.35, 0.7, 6);
    this.shared.speedMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0e7490 });
    this.shared.shieldGeo = new THREE.IcosahedronGeometry(0.38, 0);
    this.shared.shieldMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x6b21a8 });
    this.shared.shadowGeo = new THREE.CircleGeometry(0.65, 12);
    this.shared.shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32 });

    // Ground Aim Reticle
    this.aimReticle = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.65, 16),
      new THREE.MeshBasicMaterial({ color: 0xffe58f, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    this.aimReticle.rotation.x = -Math.PI / 2;
    this.aimReticle.position.y = 0.22;
    this.scene.add(this.aimReticle);
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (this.state !== 'PLAYING') return;
      if (e.code === 'KeyQ') this.triggerSpecialAbility();
      if (e.code === 'KeyF') this.throwAxe();
      if (e.code === 'KeyC') this.performDodge();
      if (e.code === 'KeyE') this.handleInteraction();
      if (e.code === 'Digit1') this.useInventoryItem('berries');
      if (e.code === 'Digit2') this.useInventoryItem('speedElixir');
      if (e.code === 'Digit3') this.useInventoryItem('shieldCharm');
      if (e.code === 'Space') {
        e.preventDefault();
        this.throwAxe();
      }
    });

    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    this.canvas.addEventListener('mousemove', (e) => {
      this.mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.updateMouseAim();
    });

    this.canvas.addEventListener('mousedown', (e) => {
      soundEngine.resume();
      if (e.button === 0 && this.state === 'PLAYING') {
        this.updateMouseAim();
        this.throwAxe();
      }
    });
  }

  updateMouseAim() {
    if (!this.playerMesh) return;
    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, hit)) {
      const dir = hit.sub(this.playerMesh.position);
      dir.y = 0;
      if (dir.lengthSq() > 0.1) {
        this.aimDir.copy(dir.normalize());
      }
    }
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // --- LEVEL BUILDERS (Axes.io Checkered Arena Style) ---
  clearLevel() {
    while (this.levelGroup.children.length > 0) {
      this.levelGroup.remove(this.levelGroup.children[0]);
    }
    this.enemies = [];
    this.projectiles = [];
    this.boss = null;
    this.traps = [];
    this.checkpoints = [];
    this.secretChests = [];
    this.beacons = [];
    this.pressurePads = [];
    this.levers = [];
    this.sequencePedestals = [];
    this.sequenceIndex = 0;
    this.boxWalls = [];
    this.atmosphericParticles = null;
    this.runePillarMeshes = [];
    this.collectibleMeshes = [];
    this.collisionObjects = [];
    this.waterZones = [];
    this.nigelMesh = null;
    this.falconJewel = null;
    this.exitPortal = null;
    this.templeGateMesh = null;
  }

  createGrassTexture(baseColor, bladeColor) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.arc(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = bladeColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < 320; i++) {
      const gx = Math.random() * 256;
      const gy = Math.random() * 256;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + (Math.random() - 0.5) * 6, gy - 5 - Math.random() * 6);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    return tex;
  }

  loadLevel(levelNum) {
    this.clearLevel();
    this.currentLevel = levelNum;
    const cfg = LEVELS[levelNum - 1] || LEVELS[0];
    this.levelConfig = cfg;

    this.levelItemsCollected = 0;
    this.levelItemsRequired = cfg.requiredCrystals || cfg.requiredKeys || 0;
    this.beaconsSabotaged = 0;
    this.gateUnlocked = (levelNum === 5);
    this.inventory.keys = 0;
    this.questObjective = cfg.objective;
    this.checkpointPos = new THREE.Vector3(0, 0, 18);

    // Natural Grass & Terrain Palette per Level
    const palettes = [
      { sky: 0x4b7f52, grass1: '#2e6f3e', grass2: '#3f8f4e' }, // Lvl 1: Lush Jungle Grass
      { sky: 0x2c524b, grass1: '#265c42', grass2: '#357a57' }, // Lvl 2: Mossy Temple Grass
      { sky: 0x4b3b5c, grass1: '#4d6b2d', grass2: '#648a3b' }, // Lvl 3: Twilight Savannah Grass
      { sky: 0x3b1818, grass1: '#3a3532', grass2: '#4d4440' }, // Lvl 4: Volcanic Ash & Moss
      { sky: 0x152238, grass1: '#263849', grass2: '#334d63' }  // Lvl 5: Stormy Summit Moss
    ];
    const pal = palettes[levelNum - 1] || palettes[0];
    this.scene.background = new THREE.Color(pal.sky);
    this.scene.fog = new THREE.FogExp2(pal.sky, 0.0095);
    soundEngine.setRealm(levelNum);
    soundEngine.setIntensity(cfg.drumIntensity);
    this.buildAtmosphericParticles(levelNum);

    // Natural Grass Ground
    const floorTex = this.createGrassTexture(pal.grass1, pal.grass2);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(130, 130),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.levelGroup.add(floor);

    // Arena Walls / Cliffs
    this.buildArenaWalls();

    // Level-specific maps & puzzles built inside buildLevel1..5!
    this.buildThickJungle(levelNum);

    // Spawn 16 XP Gems + Coins across arena (avoiding river/lava!)
    for (let i = 0; i < 16; i++) {
      const gx = (Math.random() - 0.5) * 52;
      let gz = (Math.random() - 0.5) * 64 - 12;
      if (Math.abs(gz - (-4)) < 5 || Math.abs(gz - (-20)) < 5) gz += 7;
      this.spawnCollectible(gx, 0.65, gz, i % 2 === 0 ? 'gem' : 'coin', 'XP Gem');
    }

    if (levelNum === 1) this.buildLevel1();
    else if (levelNum === 2) this.buildLevel2();
    else if (levelNum === 3) this.buildLevel3();
    else if (levelNum === 4) this.buildLevel4();
    else if (levelNum === 5) this.buildLevel5();

    if (this.playerMesh) {
      this.playerMesh.position.copy(this.checkpointPos);
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }
    if (this.onLevelChange) this.onLevelChange(cfg);
    if (this.onBossUpdate) this.onBossUpdate(this.boss);
  }

  buildArenaWalls() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
    const borders = [
      { x: 0, z: 34, w: 120, d: 4 },
      { x: 0, z: -60, w: 120, d: 4 },
      { x: -50, z: -13, w: 4, d: 98 },
      { x: 50, z: -13, w: 4, d: 98 }
    ];
    borders.forEach(b => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, 4, b.d), wallMat);
      m.position.set(b.x, 2, b.z);
      m.receiveShadow = true;
      this.levelGroup.add(m);
    });
  }

  buildRiverAndTwinBridges(zPos) {
    const river = new THREE.Mesh(
      new THREE.PlaneGeometry(96, 7),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.2, metalness: 0.1 })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, 0.04, zPos);
    this.levelGroup.add(river);

    [-14, 14].forEach(bx => {
      const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.35, 8.5),
        new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 })
      );
      bridge.position.set(bx, 0.12, zPos);
      bridge.receiveShadow = true;
      this.levelGroup.add(bridge);
    });

    this.waterZones.push({ z: zPos, halfDepth: 3.5, bridges: [-14, 14], bridgeHalfWidth: 3.8 });
  }

  buildWallBox(x, z, w, d, color = 0x57534e) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, 3.8, d),
      new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
    );
    m.position.set(x, 1.9, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.levelGroup.add(m);
    this.boxWalls.push({ x, z, hw: w / 2, hd: d / 2 });
  }

  buildTempleMazeWalls() {
    const c = 0x475569;
    this.buildWallBox(-14, 6, 16, 2.5, c);
    this.buildWallBox(14, 6, 16, 2.5, c);
    this.buildWallBox(0, -8, 18, 2.5, c);
    this.buildWallBox(-18, -20, 2.5, 18, c);
    this.buildWallBox(18, -20, 2.5, 18, c);
  }

  buildCanyonRidges() {
    const c = 0x78350f;
    this.buildWallBox(-12, 2, 12, 6, c);
    this.buildWallBox(12, -10, 12, 6, c);
    this.buildWallBox(-12, -24, 12, 6, c);
    this.buildWallBox(12, -34, 12, 6, c);
  }

  buildDualLavaMoats() {
    const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    [-2, -22].forEach((lz, idx) => {
      const lava = new THREE.Mesh(new THREE.PlaneGeometry(96, 6.5), lavaMat);
      lava.rotation.x = -Math.PI / 2;
      lava.position.set(0, 0.04, lz);
      this.levelGroup.add(lava);

      const bridges = idx === 0 ? [-16, 0, 16] : [-12, 12];
      bridges.forEach(bx => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.35, 8.0), bridgeMat);
        b.position.set(bx, 0.12, lz);
        this.levelGroup.add(b);
      });
      this.waterZones.push({ z: lz, halfDepth: 3.2, bridges, bridgeHalfWidth: 3.6 });
    });
  }

  spawnPressurePad(x, z, label) {
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.7, 0.2, 12),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    pad.position.set(x, 0.12, z);
    this.levelGroup.add(pad);
    this.pressurePads.push({ mesh: pad, label, active: false });
  }

  spawnLever(x, z, label) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 1.0), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    base.position.y = 0.3; g.add(base);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.4, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    handle.position.y = 0.9; handle.rotation.z = 0.45; g.add(handle);
    this.levelGroup.add(g);
    this.levers.push({ group: g, handle, label, pulled: false });
    this.collisionObjects.push({ x, z, radius: 0.9 });
  }

  spawnSequencePedestal(x, z, orderIdx, colorHex, label) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    base.position.y = 0.75; g.add(base);
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshBasicMaterial({ color: colorHex }));
    crystal.position.y = 2.1; g.add(crystal);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.35, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: orderIdx === 0 ? 0.9 : 0.15 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12; g.add(ring);
    this.levelGroup.add(g);
    this.sequencePedestals.push({ group: g, crystal, ring, orderIdx, colorHex, label, solved: false });
    this.collisionObjects.push({ x, z, radius: 1.0 });
  }

  buildPalmTree(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.55, 7.5, 7), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    trunk.position.y = 3.75;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    trunk.castShadow = true;
    g.add(trunk);

    const frondMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const frond = new THREE.Mesh(new THREE.ConeGeometry(1.0, 4.5, 4), frondMat);
      frond.position.set(Math.cos(a) * 1.3, 7.5, Math.sin(a) * 1.3);
      frond.rotation.z = Math.PI / 2.7;
      frond.rotation.y = -a;
      g.add(frond);
    }
    this.levelGroup.add(g);
    this.collisionObjects.push({ x, z, radius: 0.9 });
  }

  buildJungleFern(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const mat = new THREE.MeshStandardMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), mat);
      leaf.position.set(Math.cos(a) * 0.35, 0.7, Math.sin(a) * 0.35);
      leaf.rotation.y = a;
      leaf.rotation.x = 0.5;
      g.add(leaf);
    }
    this.levelGroup.add(g);
  }

  buildMossyRock(x, z) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.1 + Math.random() * 0.6, 1),
      new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.95 })
    );
    rock.position.set(x, 0.65, z);
    rock.castShadow = true;
    this.levelGroup.add(rock);
    this.collisionObjects.push({ x, z, radius: 1.2 });
  }

  buildStylizedTree(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.2, 0.9), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    g.add(trunk);

    const topMat = new THREE.MeshStandardMaterial({ color: 0x15803d, flatShading: true });
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4.0, 6), topMat);
    c1.position.y = 4.2; c1.castShadow = true; g.add(c1);
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.7, 3.2, 6), topMat);
    c2.position.y = 6.2; c2.castShadow = true; g.add(c2);

    this.levelGroup.add(g);
    this.collisionObjects.push({ x, z, radius: 1.1 });
  }

  buildAtmosphericParticles(levelNum) {
    const count = 85;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 76;
      pos[i * 3 + 1] = 0.8 + Math.random() * 7.0;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 84 - 12;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const colors = [0xd9ff88, 0x38bdf8, 0xfbbf24, 0xff5500, 0xc084fc];
    const mat = new THREE.PointsMaterial({ color: colors[levelNum - 1] || 0xd9ff88, size: 0.32, transparent: true, opacity: 0.82 });
    this.atmosphericParticles = new THREE.Points(geo, mat);
    this.levelGroup.add(this.atmosphericParticles);
  }

  buildThickJungle(levelNum) {
    // 1. Dense Double-Ring Perimeter Rainforest Wall (46 Trees)
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2;
      const r = (i % 2 === 0 ? 32 : 41) + Math.random() * 6;
      const tx = Math.cos(a) * r;
      const tz = Math.sin(a) * r - 12;
      if (i % 2 === 0) this.buildPalmTree(tx, tz);
      else this.buildStylizedTree(tx, tz);
    }

    // 2. Interior Jungle Groves along the flanks (keeps central bridge/lanes clear)
    for (let i = 0; i < 14; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const tx = side * (16 + Math.random() * 20);
      let tz = (Math.random() - 0.5) * 68 - 12;
      if (levelNum <= 3 && Math.abs(tz - (-4)) < 5.5) tz += 7;
      if (i % 2 === 0) this.buildPalmTree(tx, tz);
      else this.buildStylizedTree(tx, tz);
    }

    // 3. Thick Undergrowth: 65 Tropical Ferns, Broadleaf Bushes & Mossy Boulders
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
    const bushGeo = new THREE.DodecahedronGeometry(1.15, 1);
    for (let i = 0; i < 65; i++) {
      const fx = (Math.random() - 0.5) * 76;
      const fz = (Math.random() - 0.5) * 78 - 12;
      if (Math.abs(fx) > 8 && (levelNum > 3 || Math.abs(fz - (-4)) > 4.8)) {
        if (i % 4 === 0) {
          this.buildMossyRock(fx, fz);
        } else if (i % 3 === 0) {
          const bush = new THREE.Mesh(bushGeo, bushMat);
          bush.position.set(fx, 0.75, fz);
          bush.scale.set(1.2, 0.85, 1.2);
          this.levelGroup.add(bush);
        } else {
          this.buildJungleFern(fx, fz);
        }
      }
    }
  }

  buildWaterfall(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 6), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 }));
    cliff.position.y = 6; g.add(cliff);
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 11.5), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 }));
    fall.position.set(0, 5.8, 3.05); g.add(fall);
    this.levelGroup.add(g);
    this.collisionObjects.push({ x, z, radius: 4.5 });
  }

  buildTempleColumns() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    for (let z = 10; z >= -36; z -= 14) {
      [-11, 11].forEach(x => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 7, 8), mat);
        col.position.set(x, 3.5, z); col.castShadow = true;
        this.levelGroup.add(col);
        this.collisionObjects.push({ x, z, radius: 1.2 });
      });
    }
  }

  buildCampfire(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.3, 6), new THREE.MeshBasicMaterial({ color: 0xff7700 }));
    flame.position.y = 0.7; g.add(flame);
    this.levelGroup.add(g);
  }

  buildLavaChannels() {
    const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    [-22, 22].forEach(x => {
      const stream = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 86), lavaMat);
      stream.rotation.x = -Math.PI / 2;
      stream.position.set(x, 0.05, -14);
      this.levelGroup.add(stream);
    });
  }

  buildShadowCrystals() {
    const mat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x6b21a8 });
    [[-16, -8], [16, -8], [-18, -30], [18, -30]].forEach(([x, z]) => {
      const cry = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), mat);
      cry.position.set(x, 2.2, z);
      this.levelGroup.add(cry);
      this.collisionObjects.push({ x, z, radius: 1.2 });
    });
  }

  spawnSecretChest(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 1.0), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 }));
    box.position.y = 0.48; box.castShadow = true; g.add(box);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.2, 1.05), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8 }));
    trim.position.y = 0.85; g.add(trim);
    this.levelGroup.add(g);
    this.secretChests.push({ group: g, trim, opened: false });
    this.collisionObjects.push({ x, z, radius: 1.0 });
  }

  buildLevel1() {
    this.buildRiverAndTwinBridges(-4);
    this.buildWaterfall(-28, -4);
    this.spawnSecretChest(-22, -24);
    this.spawnPressurePad(-12, 8, 'Sun Pad');
    this.spawnPressurePad(12, 8, 'Moon Pad');
    this.spawnCollectible(-14, 0.8, -16, 'crystal', 'Emerald Sun Crystal');
    this.spawnCollectible(16, 0.8, -14, 'crystal', 'Emerald Sun Crystal');
    this.spawnCollectible(0, 0.8, -32, 'crystal', 'Emerald Sun Crystal');
    this.spawnCollectible(10, 0.7, 12, 'berry', 'Healing Berry');
    this.spawnCheckpoint(0, 0, -16);

    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[0], -10, -18);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[2], 12, -22);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[4], -8, 6);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[3], 10, 4);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[5], 0, -34);
    this.buildExitPortal(0, 0, -48, false);
  }

  buildLevel2() {
    this.buildTempleMazeWalls();
    this.buildTempleColumns();
    this.spawnSecretChest(22, -14);
    this.spawnSpikeTrap(0, 2, 0);
    this.spawnSpikeTrap(-6, -18, 1.2);
    this.spawnSpikeTrap(6, -26, 2.4);

    this.spawnLever(-24, -10, 'West Temple Lever');
    this.spawnLever(24, -10, 'East Temple Lever');
    this.sunPillars = [
      { id: 0, currentAngle: 90, targetAngle: 0, solved: false, name: 'Sun Rune' },
      { id: 1, currentAngle: 180, targetAngle: 0, solved: false, name: 'Moon Rune' },
      { id: 2, currentAngle: 270, targetAngle: 0, solved: false, name: 'Earth Rune' }
    ];
    this.buildRunePillars(-36);
    this.spawnCollectible(-14, 0.8, 12, 'key', 'Golden Temple Key');
    this.spawnCollectible(16, 0.8, -22, 'key', 'Golden Temple Key');
    this.spawnCollectible(-12, 0.7, -14, 'shield', 'Aegis Shield');
    this.spawnCheckpoint(0, 0, -12);

    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[3], -8, -22);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[4], 10, -28);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[0], 0, -32);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[1], -12, 12);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[2], 12, -14);
    this.buildExitPortal(0, 0, -50, false);
  }

  buildLevel3() {
    this.buildCanyonRidges();
    this.buildCampfire(-8, 10);
    this.buildCampfire(8, -22);
    this.spawnSecretChest(-22, -20);
    this.spawnSequencePedestal(-14, 10, 0, 0xf59e0b, '1st Amber Crystal');
    this.spawnSequencePedestal(0, -16, 1, 0x38bdf8, '2nd Cyan Crystal');
    this.spawnSequencePedestal(14, -26, 2, 0x00ff88, '3rd Emerald Crystal');
    this.spawnLever(-22, -6, 'West Spirit Totem');
    this.spawnLever(22, -18, 'East Spirit Totem');
    this.spawnCollectible(-14, 0.8, -8, 'crystal', 'Survival Relic');
    this.spawnCollectible(14, 0.8, 2, 'crystal', 'Survival Relic');
    this.spawnCollectible(-15, 0.8, -32, 'crystal', 'Survival Relic');
    this.spawnCollectible(13, 0.8, -42, 'crystal', 'Survival Relic');
    this.spawnCollectible(0, 0.7, 4, 'speed', 'Speed Elixir');
    this.spawnCheckpoint(0, 0, -14);

    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[1], -10, -12);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[5], 10, -20);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[0], 0, -34);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[4], -12, 12);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[3], 12, -30);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[2], -6, -42);
    this.buildExitPortal(0, 0, -52, false);
  }

  buildLevel4() {
    this.buildDualLavaMoats();
    this.spawnSecretChest(22, -12);
    this.spawnMovingBarrier(-10, 10, -10, 5.0);
    this.spawnMovingBarrier(-10, 10, -30, 6.5);
    this.spawnBeacon(-14, 0, -12, 'West Beacon');
    this.spawnBeacon(14, 0, -12, 'East Beacon');
    this.spawnBeacon(0, 0, -34, 'Core Beacon');
    this.spawnLever(-18, -32, 'West Power Valve');
    this.spawnLever(18, -32, 'East Power Valve');
    this.sunPillars = [
      { id: 0, currentAngle: 90, targetAngle: 0, solved: false, name: 'Left Obsidian Cipher' },
      { id: 1, currentAngle: 180, targetAngle: 0, solved: false, name: 'Right Obsidian Cipher' }
    ];
    this.buildRunePillars(-42);
    this.spawnCheckpoint(0, 0, -12);

    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[1], -10, -12);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[3], 10, -14);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[2], 0, -40);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[0], -12, 8);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[4], 12, 8);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[5], -6, -32);
    this.buildExitPortal(0, 0, -52, false);
  }

  buildLevel5() {
    this.buildShadowCrystals();
    this.spawnSecretChest(-16, 4);
    this.spawnLever(-16, -24, 'Left Elemental Seal');
    this.spawnLever(16, -24, 'Right Elemental Seal');
    this.buildGrandTempleSanctuary(0, 0, -50);
    this.spawnCollectible(-8, 0.7, 6, 'berry', 'Healing Berry');
    this.spawnCollectible(8, 0.7, 6, 'shield', 'Aegis Shield');
    this.spawnCheckpoint(0, 0, 10);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[0], -10, -6);
    this.spawnJumanjiAnimal(JUMANJI_ANIMALS[1], 10, -6);
    this.spawnBoss(0, 0, -18);
  }

  buildGrandTempleSanctuary(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const mat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    for (let i = 0; i < 4; i++) {
      const tier = new THREE.Mesh(new THREE.BoxGeometry(28 - i * 4, 1.0, 22 - i * 3), mat);
      tier.position.set(0, i * 1.0 + 0.5, 0);
      tier.receiveShadow = true;
      group.add(tier);
    }
    this.falconJewel = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.15, 0),
      new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00aa55, roughness: 0.1 })
    );
    this.falconJewel.position.set(0, 6.2, 0);
    group.add(this.falconJewel);
    this.levelGroup.add(group);
  }

  buildRunePillars(zPos) {
    const offsets = this.sunPillars.length === 2 ? [-6, 6] : [-5, 0, 5];
    this.sunPillars.forEach((cfg, idx) => {
      const px = offsets[idx] || 0;
      const pz = (this.sunPillars.length === 3 && idx === 1) ? zPos - 2 : zPos;
      const colors = [0xffaa00, 0x00ccff, 0x00ff88];
      const pColor = colors[idx % colors.length];
      const group = new THREE.Group();
      group.position.set(px, 0, pz);
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.0, 8), new THREE.MeshStandardMaterial({ color: 0x64748b }));
      dial.position.y = 1.2;
      dial.rotation.y = THREE.MathUtils.degToRad(cfg.currentAngle);
      group.add(dial);
      const sym = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 1.75), new THREE.MeshBasicMaterial({ color: pColor }));
      sym.position.y = 1.2;
      dial.add(sym);
      this.levelGroup.add(group);
      this.runePillarMeshes.push({ group, dial, symbol: sym, config: cfg, baseColor: pColor });
      this.collisionObjects.push({ x: px, z: pz, radius: 1.2 });
    });
  }

  buildExitPortal(x, y, z, active) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.35, 8, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.7 }));
    arch.position.y = 0.2;
    group.add(arch);
    const vortex = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 20),
      new THREE.MeshBasicMaterial({ color: active ? 0x00ffaa : 0x64748b, transparent: true, opacity: active ? 0.8 : 0.25, side: THREE.DoubleSide })
    );
    vortex.position.y = 2.2;
    group.add(vortex);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 1.2, 22, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: active ? 0.22 : 0.0, side: THREE.DoubleSide })
    );
    beam.position.y = 11;
    group.add(beam);
    this.levelGroup.add(group);
    this.exitPortal = { group, vortex, beam, active };
  }

  // --- ZERO-LAG COLLECTIBLES (No PointLights!) ---
  spawnCollectible(x, y, z, type, name) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    let mesh;
    if (type === 'coin') {
      mesh = new THREE.Mesh(this.shared.coinGeo, this.shared.coinMat);
      mesh.rotation.x = Math.PI / 2;
    } else if (type === 'gem') {
      mesh = new THREE.Mesh(this.shared.gemGeo, this.shared.gemMat);
    } else if (type === 'crystal') {
      mesh = new THREE.Mesh(this.shared.gemGeo, this.shared.crystalMat);
      mesh.scale.setScalar(1.3);
    } else if (type === 'key') {
      mesh = new THREE.Mesh(this.shared.keyGeo, this.shared.coinMat);
    } else if (type === 'berry') {
      mesh = new THREE.Mesh(this.shared.berryGeo, this.shared.berryMat);
    } else if (type === 'speed') {
      mesh = new THREE.Mesh(this.shared.speedGeo, this.shared.speedMat);
    } else {
      mesh = new THREE.Mesh(this.shared.shieldGeo, this.shared.shieldMat);
    }
    group.add(mesh);

    const shadow = new THREE.Mesh(this.shared.shadowGeo, this.shared.shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -y + 0.05;
    shadow.scale.setScalar(0.65);
    group.add(shadow);

    this.levelGroup.add(group);
    this.collectibleMeshes.push({ group, mesh, type, name, collected: false });
  }

  spawnCheckpoint(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 2.0, 8), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    base.position.y = 1.0; group.add(base);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
    orb.position.y = 2.4; group.add(orb);
    this.levelGroup.add(group);
    this.checkpoints.push({ group, orb, activated: false, pos: new THREE.Vector3(x, y, z + 2) });
  }

  spawnSpikeTrap(x, z, phase) {
    const group = new THREE.Group();
    group.position.set(x, 0.15, z);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 3.4), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    group.add(pad);
    const spikes = new THREE.Group();
    const sMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7 });
    for (let sx = -1; sx <= 1; sx++) {
      for (let sz = -1; sz <= 1; sz++) {
        const s = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.2, 4), sMat);
        s.position.set(sx * 1.0, 0.5, sz * 1.0);
        spikes.add(s);
      }
    }
    group.add(spikes);
    this.levelGroup.add(group);
    this.traps.push({ type: 'spikes', group, spikes, phase, hitCooldown: 0 });
  }

  spawnMovingBarrier(minX, maxX, z, speed) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 2.2, 0.7),
      new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.85 })
    );
    mesh.position.set(0, 1.1, z);
    this.levelGroup.add(mesh);
    this.traps.push({ type: 'barrier', mesh, minX, maxX, speed, dir: 1, hitCooldown: 0 });
  }

  spawnBeacon(x, y, z, name) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, 3.6, 8), new THREE.MeshStandardMaterial({ color: 0x3f2727 }));
    tower.position.y = 1.8; group.add(tower);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), new THREE.MeshBasicMaterial({ color: 0xff2200 }));
    core.position.y = 4.1; group.add(core);
    this.levelGroup.add(group);
    this.beacons.push({ group, core, name, sabotaged: false });
    this.collisionObjects.push({ x, z, radius: 1.1 });
  }

  // --- REALISTIC 3D JUMANJI ANIMALS WITH POWERS ---
  buildAnimalModel(type) {
    const group = new THREE.Group();
    const shadow = new THREE.Mesh(this.shared.shadowGeo, this.shared.shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.04;
    shadow.scale.setScalar(1.3);
    group.add(shadow);

    const makeLimbs = (mat, w, d, h) => {
      [[-w, -d], [w, -d], [-w, d], [w, d]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, h, 4, 6), mat);
        leg.position.set(lx, h * 0.6, lz);
        leg.castShadow = true;
        group.add(leg);
      });
    };

    if (type === 'jaguar') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 1.4, 6, 10), mat);
      body.rotation.x = Math.PI / 2; body.position.y = 1.05; body.castShadow = true; group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), mat);
      head.position.set(0, 1.35, 1.05); group.add(head);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      [-0.16, 0.16].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
        eye.position.set(ex, 1.45, 1.4); group.add(eye);
      });
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 1.4, 6), mat);
      tail.rotation.x = -0.8; tail.position.set(0, 1.2, -1.2); group.add(tail);
      makeLimbs(mat, 0.34, 0.65, 0.65);
    } else if (type === 'rhino') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.85 });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 1.6, 6, 10), mat);
      body.rotation.x = Math.PI / 2; body.position.y = 1.3; body.castShadow = true; group.add(body);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.75, 0.9), mat);
      head.position.set(0, 1.35, 1.35); group.add(head);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.75, 6), new THREE.MeshStandardMaterial({ color: 0xe7e5e4 }));
      horn.rotation.x = 0.5; horn.position.set(0, 1.85, 1.75); group.add(horn);
      makeLimbs(mat, 0.5, 0.75, 0.75);
    } else if (type === 'hippo') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x6b5b7b, roughness: 0.7 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 10), mat);
      body.scale.set(0.95, 0.82, 1.35); body.position.y = 1.15; body.castShadow = true; group.add(body);
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.8), mat);
      snout.position.set(0, 1.15, 1.3); group.add(snout);
      makeLimbs(mat, 0.5, 0.65, 0.55);
    } else if (type === 'mandrill') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.85, 6, 8), mat);
      body.position.y = 1.15; body.castShadow = true; group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 10), mat);
      head.position.set(0, 1.85, 0.2); group.add(head);
      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.3), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      muzzle.position.set(0, 1.78, 0.45); group.add(muzzle);
      makeLimbs(mat, 0.32, 0.35, 0.55);
    } else if (type === 'cobra') {
      const mat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.18, 8, 16), mat);
      coil.rotation.x = Math.PI / 2; coil.position.y = 0.22; group.add(coil);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.4, 8), mat);
      neck.position.set(0, 0.9, 0.2); group.add(neck);
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
      hood.scale.set(1.2, 1.0, 0.3); hood.position.set(0, 1.45, 0.28); group.add(hood);
    } else {
      // Ostrich
      const mat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), mat);
      body.scale.set(0.85, 0.85, 1.25); body.position.y = 1.3; body.castShadow = true; group.add(body);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 8), new THREE.MeshStandardMaterial({ color: 0xfca5a5 }));
      neck.position.set(0, 2.0, 0.45); group.add(neck);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 4), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
      beak.rotation.x = Math.PI / 2; beak.position.set(0, 2.52, 0.65); group.add(beak);
    }
    return group;
  }

  spawnJumanjiAnimal(animalCfg, x, z) {
    const group = this.buildAnimalModel(animalCfg.type);
    group.position.set(x, 0, z);

    const tag = this.createOverheadTag(animalCfg.name, animalCfg.hp, animalCfg.hp);
    tag.position.set(0, 2.8, 0);
    group.add(tag);

    this.levelGroup.add(group);
    this.enemies.push({
      name: animalCfg.name,
      power: animalCfg.power,
      color: animalCfg.color,
      mesh: group,
      joints: null,
      tag,
      hp: animalCfg.hp,
      maxHp: animalCfg.hp,
      kills: 0,
      speed: animalCfg.speed,
      throwCooldown: 1.8 + Math.random(),
      powerCooldown: 5.0 + Math.random() * 2,
      stunTimer: 0,
      state: 'ACTIVE',
      wanderTarget: new THREE.Vector3((Math.random() - 0.5) * 36, 0, (Math.random() - 0.5) * 44 - 10)
    });
  }

  // --- REALISTIC ARTICULATED 3D HUMANOID BUILDER ---
  buildRealisticHumanoid(cfg) {
    const group = new THREE.Group();
    const joints = {};
    const w = cfg.width || 0.85;
    const hScale = (cfg.height || 1.9) / 1.9;

    const skinMat = new THREE.MeshStandardMaterial({ color: cfg.skinColor, roughness: 0.65 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: cfg.shirtColor, roughness: 0.75 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: cfg.pantsColor, roughness: 0.82 });
    const vestMat = new THREE.MeshStandardMaterial({ color: cfg.vestColor || cfg.shirtColor, roughness: 0.7 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.7 });

    // Ground Drop Shadow
    const shadow = new THREE.Mesh(this.shared.shadowGeo, this.shared.shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.04;
    shadow.scale.setScalar(1.1);
    group.add(shadow);

    // Pelvis
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * w, 0.28 * w, 0.28, 10), pantsMat);
    pelvis.position.y = 0.95 * hScale;
    pelvis.castShadow = true;
    group.add(pelvis);
    joints.pelvis = pelvis;

    // Belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.34 * w, 0.34 * w, 0.1, 10), bootMat);
    belt.position.y = 0.12;
    pelvis.add(belt);

    // Sculpted Torso & Chest
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * w, 0.31 * w, 0.78, 10), shirtMat);
    torso.position.y = 0.52;
    torso.castShadow = true;
    pelvis.add(torso);
    joints.torso = torso;

    const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.44 * w, 0.33 * w, 0.55, 10), vestMat);
    vest.position.y = 0.05;
    torso.add(vest);

    // Neck & Realistic Rounded Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.18, 8), skinMat);
    neck.position.y = 0.45;
    torso.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), skinMat);
    head.scale.set(0.92, 1.08, 0.96);
    head.position.y = 0.26;
    head.castShadow = true;
    neck.add(head);
    joints.head = head;

    // Eyes & Brows
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
    eyeL.position.set(-0.09, 0.03, 0.23);
    head.add(eyeL);
    const eyeR = eyeL.clone(); eyeR.position.x = 0.09; head.add(eyeR);

    // Hat / Hair
    if (cfg.hasHat) {
      const hatMat = new THREE.MeshStandardMaterial({ color: cfg.hatColor || 0xc4b28d, roughness: 0.75 });
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hatMat);
      crown.position.y = 0.08;
      head.add(crown);
      if (cfg.hatType === 'bucket') {
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, 0.04, 12), hatMat);
        brim.position.y = 0.1;
        head.add(brim);
      }
    } else if (cfg.hairColor) {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.275, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), new THREE.MeshStandardMaterial({ color: cfg.hairColor }));
      hair.position.y = 0.05;
      hair.rotation.x = -0.2;
      head.add(hair);
    }

    if (cfg.hasBackpack) {
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.45), new THREE.MeshStandardMaterial({ color: cfg.backpackColor || 0x5a4a35 }));
      pack.position.set(0, 0.05, -0.4);
      torso.add(pack);
    }

    // Articulated Arms + Held 3D Battle Axe
    const buildArm = (side) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * (0.48 * w), 0.3, 0);
      torso.add(shoulder);

      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.28, 4, 8), shirtMat);
      upper.position.y = -0.2;
      upper.castShadow = true;
      shoulder.add(upper);

      const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.26, 4, 8), skinMat);
      fore.position.y = -0.52;
      fore.castShadow = true;
      shoulder.add(fore);

      if (side === 1) {
        const axe = this.buildAxeMesh(cfg.axeColor || 0x38bdf8);
        axe.position.set(0, -0.72, 0.28);
        axe.rotation.x = Math.PI / 2.2;
        shoulder.add(axe);
        joints.heldAxe = axe;
      }
      return shoulder;
    };

    joints.shoulderL = buildArm(-1);
    joints.shoulderR = buildArm(1);

    // Articulated Legs & Boots
    const buildLeg = (side) => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.18 * w, -0.1, 0);
      pelvis.add(hip);

      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.34, 4, 8), pantsMat);
      thigh.position.y = -0.25;
      thigh.castShadow = true;
      hip.add(thigh);

      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.34, 4, 8), bootMat);
      shin.position.y = -0.62;
      shin.castShadow = true;
      hip.add(shin);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.32), bootMat);
      boot.position.set(0, -0.84, 0.06);
      hip.add(boot);
      return hip;
    };

    joints.hipL = buildLeg(-1);
    joints.hipR = buildLeg(1);

    return { group, joints };
  }

  buildAxeMesh(bladeColor = 0x38bdf8) {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.0, 6), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    g.add(handle);
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.34, 0.08),
      new THREE.MeshStandardMaterial({ color: bladeColor, metalness: 0.65, roughness: 0.25, emissive: bladeColor, emissiveIntensity: 0.2 })
    );
    blade.position.set(0.16, 0.35, 0);
    g.add(blade);
    return g;
  }

  setPlayerCharacter(charId) {
    this.selectedCharId = charId;
    this.charData = CHARACTERS[charId] || CHARACTERS.bravestone;
    this.health = this.charData.stats.health;
    this.maxHealth = this.charData.stats.health;
    this.stamina = 100;
    this.abilityCooldown = 0;

    if (this.playerMesh) this.scene.remove(this.playerMesh);
    const { group, joints } = this.buildRealisticHumanoid({
      ...this.charData.modelConfig,
      axeColor: new THREE.Color(this.charData.themeColor).getHex()
    });
    this.playerMesh = group;
    this.playerJoints = joints;
    this.playerMesh.position.copy(this.checkpointPos);
    this.scene.add(this.playerMesh);
  }

  spawnBoss(x, y, z) {
    const { group, joints } = this.buildRealisticHumanoid({
      shirtColor: 0x1e1b4b,
      pantsColor: 0x0f172a,
      skinColor: 0x475569,
      vestColor: 0x991b1b,
      hasHat: true,
      hatColor: 0xf59e0b,
      axeColor: 0xff0055,
      height: 3.1,
      width: 1.45
    });
    group.position.set(x, y, z);
    group.scale.setScalar(1.45);
    this.levelGroup.add(group);

    this.boss = {
      name: 'The Shadow Colossus',
      mesh: group,
      joints,
      hp: 450,
      maxHp: 450,
      speed: 4.3,
      throwCooldown: 1.8,
      shockwaveTimer: 4.5,
      stunTimer: 0,
      defeated: false
    };
    soundEngine.playSfx('bossRoar');
  }

  createOverheadTag(name, hp, maxHp) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 72;
    const ctx = c.getContext('2d');
    this.drawOverheadCanvas(ctx, name, hp, maxHp);
    const tex = new THREE.CanvasTexture(c);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(2.4, 0.68, 1);
    sprite.userData = { canvas: c, ctx, tex, name };
    return sprite;
  }

  drawOverheadCanvas(ctx, name, hp, maxHp) {
    ctx.clearRect(0, 0, 256, 72);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(`♥ ${Math.ceil(hp)} ${name}`, 128, 30);
    ctx.fillText(`♥ ${Math.ceil(hp)} ${name}`, 128, 30);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(48, 42, 160, 12);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(48, 42, 160 * Math.max(0, hp / maxHp), 12);
  }

  updateEnemyTag(e) {
    const ud = e.tag.userData;
    this.drawOverheadCanvas(ud.ctx, ud.name, e.hp, e.maxHp);
    ud.tex.needsUpdate = true;
  }

  // --- AXE THROWING & COMBAT ---
  throwAxe() {
    if (this.throwCooldown > 0) return;
    const cd = this.perks.has('rapid') ? 0.28 : 0.42;
    this.throwCooldown = cd;
    this.throwAnimTimer = 0.25;
    soundEngine.playSfx('throw');

    // Auto-lock onto very close enemy if aim is neutral
    const pPos = this.playerMesh.position;
    const dir = this.aimDir.clone().normalize();
    this.playerMesh.rotation.y = Math.atan2(dir.x, dir.z);

    const count = this.perks.has('double') ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const spread = count === 2 ? (i === 0 ? -0.14 : 0.14) : 0;
      const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
      this.spawnProjectile(pPos, d, 'player', this.charData.themeColor, this.perks.has('fire'));
    }
  }

  buildPowerProjectile(powerType, colorHex) {
    const g = new THREE.Group();
    if (powerType === 'stampede') {
      // Rhino throws heavy Cracked Stone Boulder
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 }));
      g.add(rock);
    } else if (powerType === 'slam') {
      // Hippo throws Aqua Water Surge Orb
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 10), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 14), new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }));
      g.add(orb, ring);
    } else if (powerType === 'frost') {
      // Cobra spits Green Venom Globule
      const venom = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      g.add(venom);
    } else if (powerType === 'pounce') {
      // Jaguar throws Emerald Shadow Claw
      const claw = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 6, 12, Math.PI), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
      claw.rotation.x = Math.PI / 2;
      g.add(claw);
    } else if (powerType === 'rapid') {
      // Ostrich throws Golden Razor Feather Quill
      const quill = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.85, 5), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
      quill.rotation.x = Math.PI / 2;
      g.add(quill);
    } else if (powerType === 'triple') {
      // Mandrill throws Red Jungle Dart/Fruit
      const dart = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      g.add(dart);
    } else {
      return this.buildAxeMesh(colorHex);
    }
    return g;
  }

  spawnProjectile(origin, dir, owner, colorHex, isFire = false, isFrost = false, powerType = null) {
    const projMesh = (owner === 'enemy' && powerType)
      ? this.buildPowerProjectile(powerType, colorHex)
      : this.buildAxeMesh(isFire ? 0xff5500 : (isFrost ? 0x38bdf8 : colorHex));

    if (owner === 'player' && this.perks.has('giant')) projMesh.scale.setScalar(1.45);
    projMesh.position.set(origin.x + dir.x * 0.9, origin.y + 1.25, origin.z + dir.z * 0.9);
    this.levelGroup.add(projMesh);

    const baseDmg = owner === 'player'
      ? Math.round(this.charData.stats.strength * 0.42) + (this.perks.has('giant') ? 15 : 0) + (isFire ? 18 : 0)
      : (powerType === 'stampede' ? 22 : 16);

    this.projectiles.push({
      mesh: projMesh,
      dir: dir.clone().normalize(),
      owner,
      speed: owner === 'player' ? 24 : 12,
      dmg: baseDmg,
      life: 1.8,
      bounces: (owner === 'player' && this.perks.has('ricochet')) ? 1 : 0,
      isFrost
    });
  }

  updateProjectiles(delta) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= delta;
      pr.mesh.position.addScaledVector(pr.dir, pr.speed * delta);
      pr.mesh.rotation.y += 18 * delta;
      pr.mesh.rotation.x += 10 * delta;

      // Wall bounce / remove
      if (Math.abs(pr.mesh.position.x) > 47 || pr.mesh.position.z > 31 || pr.mesh.position.z < -57) {
        if (pr.bounces > 0) {
          pr.bounces--;
          if (Math.abs(pr.mesh.position.x) > 47) pr.dir.x *= -1;
          else pr.dir.z *= -1;
        } else {
          this.levelGroup.remove(pr.mesh);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      if (pr.life <= 0) {
        this.levelGroup.remove(pr.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Hit Detection
      if (pr.owner === 'player') {
        let hitSomething = false;
        for (const e of this.enemies) {
          if (e.state !== 'ACTIVE') continue;
          if (pr.mesh.position.distanceTo(e.mesh.position) < 1.65) {
            this.damageEnemy(e, pr.dmg);
            hitSomething = true;
            break;
          }
        }
        if (!hitSomething && this.boss && !this.boss.defeated) {
          if (pr.mesh.position.distanceTo(this.boss.mesh.position) < 2.6) {
            this.damageBoss(pr.dmg);
            hitSomething = true;
          }
        }
        if (hitSomething) {
          this.levelGroup.remove(pr.mesh);
          this.projectiles.splice(i, 1);
        }
      } else {
        // Enemy projectile hitting Player
        if (this.stealthTimer <= 0 && pr.mesh.position.distanceTo(this.playerMesh.position) < 1.35) {
          if (pr.isFrost) {
            this.slowTimer = 2.5;
            this.showNotification("FROST HIT! Slowed for 2.5s!");
          }
          this.damagePlayer(pr.dmg);
          this.levelGroup.remove(pr.mesh);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  damageEnemy(e, dmg) {
    e.hp = Math.max(0, e.hp - dmg);
    this.updateEnemyTag(e);
    soundEngine.playSfx('hit');
    this.cameraShake = Math.max(this.cameraShake, 0.14);
    if (this.onFloatingPopup) this.onFloatingPopup(`-${dmg}`, '#ff6b6b');

    if (e.hp <= 0) {
      e.state = 'DEAD';
      this.levelGroup.remove(e.mesh);
      this.kills++;
      this.bumpCombo();
      const pts = 250 * this.combo;
      this.addScore(pts);
      this.gainXP(55);
      if (this.perks.has('vampire')) {
        this.health = Math.min(this.maxHealth, this.health + 15);
        if (this.onHealthChange) this.onHealthChange(this.health, this.maxHealth);
      }
      if (this.onKillFeed) this.onKillFeed(this.charData.name, e.name, this.combo > 1);
      if (this.onFloatingPopup) this.onFloatingPopup(`BULLSEYE! +${pts}`, '#ffe58f');
    }
  }

  damageBoss(dmg) {
    if (!this.boss || this.boss.defeated) return;
    this.boss.hp = Math.max(0, this.boss.hp - dmg);
    soundEngine.playSfx('hit');
    this.cameraShake = Math.max(this.cameraShake, 0.18);
    if (this.boss.hp <= 0) {
      this.boss.defeated = true;
      this.levelGroup.remove(this.boss.mesh);
      this.addScore(1000);
      soundEngine.playSfx('puzzleSolve');
      this.questObjective = "Claim the Falcon Jewel on the Altar!";
      this.showNotification("SHADOW COLOSSUS DEFEATED! Claim the Falcon Jewel!");
    }
    if (this.onBossUpdate) this.onBossUpdate(this.boss);
  }

  gainXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.matchLevel++;
      this.xpToNext = Math.round(this.xpToNext * 1.35);
      soundEngine.playSfx('levelComplete');
      if (this.onMatchLevelUp) this.onMatchLevelUp(this.matchLevel);
    }
    if (this.onXPChange) this.onXPChange(this.xp, this.xpToNext, this.matchLevel);
  }

  applyPerk(perkId) {
    this.perks.add(perkId);
    const p = PERK_POOL.find(x => x.id === perkId);
    if (p) this.showNotification(`PERK UNLOCKED: ${p.name}!`);
  }

  // --- SPECIAL ABILITIES ---
  triggerSpecialAbility() {
    if (this.abilityCooldown > 0) return;
    this.abilityCooldown = this.charData.ability.cooldown;
    this.throwAnimTimer = 0.45;
    soundEngine.playSfx(this.charData.ability.sound);

    const pPos = this.playerMesh.position;
    const abilityDmg = Math.round(this.charData.stats.strength * 0.9);

    switch (this.charData.id) {
      case 'bravestone':
        this.spawnShockwave(pPos, 0xe07a2c, 9);
        this.cameraShake = 0.5;
        this.hitAndStunEnemies(pPos, 9, abilityDmg, 4.0);
        this.showNotification("SMOLDERING SMASH!");
        break;
      case 'oberon':
        this.solveAllPillars();
        this.sabotageNearbyBeacon(pPos, 12);
        this.hitAndStunEnemies(pPos, 8, 35, 3.0);
        this.showNotification("GLYPH DECRYPTION!");
        break;
      case 'seaplane':
        this.speedBoostTimer = 5.0;
        this.stamina = 100;
        this.hitAndStunEnemies(pPos, 13, 35, 4.5);
        this.showNotification("SIGNAL FLARE & SPEED SURGE!");
        break;
      case 'finbar':
        this.hitAndStunEnemies(pPos, 14, 25, 5.5);
        this.showNotification("BEAST WHISPER! Rivals stunned!");
        break;
      case 'ruby':
        this.spawnShockwave(pPos, 0xff0054, 8);
        this.solveAllPillars();
        this.hitAndStunEnemies(pPos, 9, abilityDmg, 4.5);
        this.showNotification("WHIRLWIND DANCE!");
        break;
      case 'ming':
        this.stealthTimer = 6.0;
        this.solveAllPillars();
        this.sabotageNearbyBeacon(pPos, 12);
        this.showNotification("SHADOW CLOAK ACTIVE!");
        break;
    }
  }

  hitAndStunEnemies(pos, range, dmg, stunTime) {
    this.enemies.forEach(e => {
      if (e.state !== 'ACTIVE') return;
      if (pos.distanceTo(e.mesh.position) < range) {
        e.stunTimer = stunTime;
        this.damageEnemy(e, dmg);
      }
    });
    if (this.boss && !this.boss.defeated && pos.distanceTo(this.boss.mesh.position) < range + 2) {
      this.boss.stunTimer = stunTime * 0.6;
      this.damageBoss(dmg);
    }
  }

  sabotageNearbyBeacon(pos, range) {
    this.beacons.forEach(b => {
      if (!b.sabotaged && pos.distanceTo(b.group.position) < range) this.sabotageBeacon(b);
    });
  }

  sabotageBeacon(b) {
    if (b.sabotaged) return;
    b.sabotaged = true;
    b.core.material.color.setHex(0x00ffaa);
    this.beaconsSabotaged++;
    this.addScore(200);
    soundEngine.playSfx('puzzleSolve');
    this.showNotification(`${b.name} Sabotaged! (${this.beaconsSabotaged}/3)`);
    this.evaluateLevelUnlock();
  }

  solveAllPillars() {
    if (this.sunPillars.length === 0) return;
    this.sunPillars.forEach(p => { p.currentAngle = 0; p.solved = true; });
    this.runePillarMeshes.forEach(m => { m.dial.rotation.y = 0; m.symbol.material.color.setHex(0x00ffaa); });
    this.checkLevel2Unlock();
  }

  useInventoryItem(itemKey) {
    if (this.inventory[itemKey] <= 0) return this.showNotification("Out of this item!");
    if (itemKey === 'berries') {
      if (this.health >= this.maxHealth) return this.showNotification("Health is already full!");
      this.inventory.berries--;
      this.health = Math.min(this.maxHealth, this.health + 40);
      soundEngine.playSfx('powerup');
      this.showNotification("Used Healing Berry! +40 HP");
      if (this.onHealthChange) this.onHealthChange(this.health, this.maxHealth);
    } else if (itemKey === 'speedElixir') {
      this.inventory.speedElixir--;
      this.speedBoostTimer = 8.0;
      soundEngine.playSfx('powerup');
      this.showNotification("Swiftness Elixir Active!");
    } else if (itemKey === 'shieldCharm') {
      this.inventory.shieldCharm--;
      this.shieldTimer = 8.0;
      soundEngine.playSfx('powerup');
      this.showNotification("Aegis Shield Active!");
    }
    if (this.onInventoryChange) this.onInventoryChange(this.inventory);
  }

  addScore(pts) {
    this.score += pts;
    if (this.onScoreChange) this.onScoreChange(this.score, this.coins);
  }

  bumpCombo() {
    this.combo = Math.min(6, this.combo + 1);
    this.comboTimer = 4.5;
    if (this.onComboChange) this.onComboChange(this.combo);
  }

  handleInteraction() {
    if (!this.activeInteractable) return;
    const { type, entity } = this.activeInteractable;

    if (type === 'nigel') {
      this.state = 'DIALOGUE';
      if (this.onDialogueTrigger) {
        this.onDialogueTrigger({
          speaker: 'Nigel Billingsley',
          text: this.charData.dialogue.nigel,
          replyOptions: [
            { text: this.charData.dialogue.replyNigel, next: 'mission' },
            { text: "Remind me of the rules.", next: 'rules' }
          ]
        });
      }
      soundEngine.playSfx('dialogue');
    } else if (type === 'pillar') {
      const p = entity.config;
      p.currentAngle = (p.currentAngle + 90) % 360;
      entity.dial.rotation.y = THREE.MathUtils.degToRad(p.currentAngle);
      soundEngine.playSfx('click');
      p.solved = (p.currentAngle === p.targetAngle);
      entity.symbol.material.color.setHex(p.solved ? 0x00ffaa : entity.baseColor);
      this.evaluateLevelUnlock();
    } else if (type === 'chest') {
      if (!entity.opened) {
        entity.opened = true;
        entity.trim.material.color.setHex(0x64748b);
        this.coins += 3;
        this.addScore(300);
        this.inventory.shieldCharm++;
        soundEngine.playSfx('powerup');
        if (this.onInventoryChange) this.onInventoryChange(this.inventory);
        if (this.onFloatingPopup) this.onFloatingPopup('+300 SECRET!', '#00ff9d');
        this.showNotification("SECRET TREASURE FOUND! +300 Score, +3 Coins, +1 Shield Charm!");
      }
    } else if (type === 'lever') {
      if (!entity.pulled) {
        entity.pulled = true;
        entity.handle.rotation.z = -0.45;
        entity.handle.material.color.setHex(0x00ff88);
        this.addScore(150);
        soundEngine.playSfx('puzzleSolve');
        if (this.onFloatingPopup) this.onFloatingPopup('+150 SOLVED!', '#00ff9d');
        this.showNotification(`${entity.label} Activated!`);
        if (this.currentLevel === 5 && this.boss && !this.boss.defeated && this.levers.every(l => l.pulled)) {
          this.boss.hp = Math.max(40, Math.round(this.boss.hp * 0.55));
          if (this.onBossUpdate) this.onBossUpdate(this.boss);
          this.showNotification("ELEMENTAL SEALS BROKEN! Boss armor shattered!");
        }
        this.evaluateLevelUnlock();
      }
    } else if (type === 'sequence') {
      if (!entity.solved) {
        if (entity.orderIdx === this.sequenceIndex) {
          entity.solved = true;
          entity.ring.material.color.setHex(0x00ff88);
          entity.ring.material.opacity = 0.9;
          this.sequenceIndex++;
          this.addScore(150);
          soundEngine.playSfx('puzzleSolve');
          if (this.onFloatingPopup) this.onFloatingPopup(`+${entity.orderIdx + 1}/3!`, '#00ff9d');
          this.sequencePedestals.forEach(sp => {
            if (!sp.solved) sp.ring.material.opacity = sp.orderIdx === this.sequenceIndex ? 0.95 : 0.15;
          });
          this.evaluateLevelUnlock();
        } else {
          this.showNotification(`Activate the glowing crystal #${this.sequenceIndex + 1} first!`);
          soundEngine.playSfx('trap');
        }
      }
    } else if (type === 'beacon') {
      this.sabotageBeacon(entity);
    } else if (type === 'portal') {
      if (this.exitPortal && this.exitPortal.active) this.completeCurrentLevel();
      else this.showNotification("Complete the mission objective first!");
    } else if (type === 'altar') {
      if (this.boss && !this.boss.defeated) return this.showNotification("Defeat the Shadow Colossus first!");
      this.state = 'DECISION';
      soundEngine.stopDrums();
      if (this.onDecisionTrigger) this.onDecisionTrigger();
    }
  }

  evaluateLevelUnlock() {
    const padsOk = this.pressurePads.every(p => p.active);
    const leversOk = this.levers.every(l => l.pulled);
    const runesOk = this.sunPillars.every(p => p.solved);
    const seqOk = this.sequencePedestals.every(s => s.solved);
    const beaconsOk = this.beacons.every(b => b.sabotaged);
    const itemsOk = this.levelItemsCollected >= this.levelItemsRequired;
    const keysOk = this.currentLevel !== 2 || this.inventory.keys >= 2 || this.charData.id === 'ming';

    if (padsOk && leversOk && runesOk && seqOk && beaconsOk && itemsOk && keysOk) {
      this.activateExitPortal();
    }
  }

  checkLevel2Unlock() {
    this.evaluateLevelUnlock();
  }

  activateExitPortal() {
    if (!this.exitPortal || this.exitPortal.active) return;
    this.exitPortal.active = true;
    this.exitPortal.vortex.material.color.setHex(0x00ffaa);
    this.exitPortal.vortex.material.opacity = 0.85;
    if (this.exitPortal.beam) this.exitPortal.beam.material.opacity = 0.24;
    this.questObjective = "Enter the Glowing Exit Portal!";
    soundEngine.playSfx('puzzleSolve');
    this.showNotification("PORTAL OPEN! Follow the Emerald Light Beam!");
  }

  completeCurrentLevel() {
    this.state = 'LEVEL_COMPLETE';
    this.addScore(500 + this.lives * 100);
    soundEngine.playSfx('levelComplete');
    if (this.currentLevel >= this.unlockedLevel && this.currentLevel < 5) this.unlockedLevel = this.currentLevel + 1;
    if (this.onLevelComplete) this.onLevelComplete(this.currentLevel, this.score, this.coins);
  }

  // --- MAIN LOOP ---
  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(0.08, this.clock.getDelta());
    this.animTime += delta;

    if (this.state === 'PLAYING') {
      this.updatePlayer(delta);
      this.updateEnemies(delta);
      this.updateBoss(delta);
      this.updateProjectiles(delta);
      this.updateTraps(delta);
      this.updatePuzzles();
      this.updateCheckpoints();
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

    this.isSprinting = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && this.stamina > 5;
    if (this.isSprinting && this.isMoving) this.stamina = Math.max(0, this.stamina - 20 * delta);
    else this.stamina = Math.min(this.maxStamina, this.stamina + 18 * delta);

    if (this.abilityCooldown > 0) this.abilityCooldown = Math.max(0, this.abilityCooldown - delta);
    if (this.throwCooldown > 0) this.throwCooldown = Math.max(0, this.throwCooldown - delta);
    if (this.speedBoostTimer > 0) this.speedBoostTimer = Math.max(0, this.speedBoostTimer - delta);
    if (this.shieldTimer > 0) this.shieldTimer = Math.max(0, this.shieldTimer - delta);
    if (this.dodgeTimer > 0) this.dodgeTimer = Math.max(0, this.dodgeTimer - delta);
    if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - delta);
    if (this.throwAnimTimer > 0) this.throwAnimTimer = Math.max(0, this.throwAnimTimer - delta);

    if (this.stealthTimer > 0) {
      this.stealthTimer = Math.max(0, this.stealthTimer - delta);
      this.playerMesh.traverse(c => {
        if (c.material) { c.material.transparent = true; c.material.opacity = this.stealthTimer > 0 ? 0.35 : 1.0; }
      });
    }

    // Direct Screen-Aligned Movement (WASD + Virtual Joystick)
    let moveX = this.joystickVec.x;
    let moveZ = this.joystickVec.y;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    this.isMoving = len > 0.05;

    if (this.isMoving) {
      moveX /= Math.max(1, len);
      moveZ /= Math.max(1, len);
      // Sync aim direction with WASD / Arrow / Joystick direction!
      this.aimDir.set(moveX, 0, moveZ).normalize();

      const boost = (this.speedBoostTimer > 0 ? 1.4 : 1.0) * (this.slowTimer > 0 ? 0.6 : 1.0) * (this.dodgeTimer > 0 ? 2.2 : 1.0);
      const speed = this.charData.stats.speed * (this.isSprinting ? 1.45 : 1.0) * boost;

      // Independent X & Z sliding collision so player never gets stuck!
      const nx = this.playerMesh.position.x + moveX * speed * delta;
      if (!this.checkCollision(nx, this.playerMesh.position.z, 0.65)) {
        this.playerMesh.position.x = nx;
      }
      const nz = this.playerMesh.position.z + moveZ * speed * delta;
      if (!this.checkCollision(this.playerMesh.position.x, nz, 0.65)) {
        this.playerMesh.position.z = nz;
      }

      if (this.throwAnimTimer <= 0) {
        const targetAngle = Math.atan2(moveX, moveZ);
        this.playerMesh.rotation.y = THREE.MathUtils.lerp(this.playerMesh.rotation.y, targetAngle, 14 * delta);
      }
      this.walkCycle += delta * (this.isSprinting ? 15 : 10);
    } else {
      this.walkCycle = 0;
    }

    // Aim Reticle Position
    if (this.aimReticle) {
      this.aimReticle.position.x = this.playerMesh.position.x + this.aimDir.x * 3.5;
      this.aimReticle.position.z = this.playerMesh.position.z + this.aimDir.z * 3.5;
    }

    // Ground & Temple Stairs Height
    let groundH = 0;
    if (this.currentLevel === 5) {
      const pz = this.playerMesh.position.z, px = this.playerMesh.position.x;
      if (pz < -38 && pz > -58 && Math.abs(px) < 14) {
        groundH = Math.min(4.0, Math.abs(pz - (-38)) * 0.34);
      }
    }

    if (!this.isGrounded) {
      this.verticalVelocity -= 26 * delta;
      this.playerMesh.position.y += this.verticalVelocity * delta;
      if (this.playerMesh.position.y <= groundH) {
        this.playerMesh.position.y = groundH;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    } else {
      this.playerMesh.position.y = THREE.MathUtils.lerp(this.playerMesh.position.y, groundH, 14 * delta);
    }

    this.animateJoints(this.playerJoints, this.isMoving, this.walkCycle, this.throwAnimTimer > 0);
  }

  checkCollision(x, z, radius) {
    if (Math.abs(x) > 47 || z > 31 || z < -57) return true;
    // Prevent walking on river water / lava outside the bridges!
    for (const w of this.waterZones) {
      if (Math.abs(z - w.z) < w.halfDepth + radius) {
        const bridges = w.bridges || [0];
        const onBridge = bridges.some(bx => Math.abs(x - bx) <= w.bridgeHalfWidth - radius);
        if (!onBridge) return true;
      }
    }
    // Maze & Canyon Box Walls
    for (const b of this.boxWalls) {
      if (Math.abs(x - b.x) < b.hw + radius && Math.abs(z - b.z) < b.hd + radius) return true;
    }
    for (const obj of this.collisionObjects) {
      const dx = x - obj.x, dz = z - obj.z;
      if (dx * dx + dz * dz < (radius + obj.radius) * (radius + obj.radius)) return true;
    }
    return false;
  }

  animateJoints(j, moving, cycle, throwing) {
    if (!j || !j.torso) return;
    if (throwing) {
      j.shoulderR.rotation.x = -Math.PI * 0.85;
      j.torso.rotation.y = 0.25;
      return;
    }
    j.torso.rotation.y = 0;
    if (moving) {
      const a = Math.sin(cycle) * 0.75;
      j.hipL.rotation.x = a; j.hipR.rotation.x = -a;
      j.shoulderL.rotation.x = -a * 0.8; j.shoulderR.rotation.x = a * 0.8;
    } else {
      j.hipL.rotation.x = 0; j.hipR.rotation.x = 0;
      j.shoulderL.rotation.x = Math.sin(this.animTime * 2) * 0.06;
      j.shoulderR.rotation.x = -Math.sin(this.animTime * 2) * 0.06;
    }
  }

  updateEnemies(delta) {
    const pPos = this.playerMesh.position;
    this.enemies.forEach(e => {
      if (e.state !== 'ACTIVE') return;
      if (e.stunTimer > 0) { e.stunTimer -= delta; return; }

      const ePos = e.mesh.position;
      const dist = ePos.distanceTo(pPos);
      const canSee = this.stealthTimer <= 0 && dist < 16;

      if (canSee) {
        const dir = new THREE.Vector3().subVectors(pPos, ePos).normalize();
        if (dist > 4.2) {
          const nx = ePos.x + dir.x * e.speed * delta;
          if (!this.checkCollision(nx, ePos.z, 0.7)) ePos.x = nx;
          const nz = ePos.z + dir.z * e.speed * delta;
          if (!this.checkCollision(ePos.x, nz, 0.7)) ePos.z = nz;
        }
        e.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // Character-Specific Animal Power Throw!
        e.throwCooldown -= delta;
        if (e.throwCooldown <= 0) {
          e.throwCooldown = e.power === 'rapid' ? 2.1 : 3.0 + Math.random() * 0.8;
          if (e.power === 'triple') {
            [-0.22, 0, 0.22].forEach(a => this.spawnProjectile(ePos, dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a), 'enemy', e.color, false, false, e.power));
          } else {
            this.spawnProjectile(ePos, dir, 'enemy', e.color, e.power === 'pounce', e.power === 'frost', e.power);
          }
        }

        // Animal Special Power (Stampede / Slam / Pounce)
        e.powerCooldown -= delta;
        if (e.powerCooldown <= 0) {
          e.powerCooldown = 6.0;
          this.spawnShockwave(ePos, e.color, 6);
          if (dist < 6.0) {
            this.damagePlayer(16);
            this.showNotification(`${e.name} used ${e.power.toUpperCase()}!`);
          }
        }
      } else {
        if (ePos.distanceTo(e.wanderTarget) < 1.5) {
          e.wanderTarget.set((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 48 - 10);
        } else {
          const dir = new THREE.Vector3().subVectors(e.wanderTarget, ePos).normalize();
          const nx = ePos.x + dir.x * e.speed * 0.65 * delta;
          if (!this.checkCollision(nx, ePos.z, 0.7)) ePos.x = nx;
          const nz = ePos.z + dir.z * e.speed * 0.65 * delta;
          if (!this.checkCollision(ePos.x, nz, 0.7)) ePos.z = nz;
          e.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        }
      }
      if (e.joints) this.animateJoints(e.joints, true, this.animTime * 8, false);
    });
  }

  updateBoss(delta) {
    if (!this.boss || this.boss.defeated) return;
    const b = this.boss;
    if (b.stunTimer > 0) { b.stunTimer -= delta; return; }
    const bPos = b.mesh.position;
    const pPos = this.playerMesh.position;
    const dist = bPos.distanceTo(pPos);

    if (this.stealthTimer <= 0 && dist < 38) {
      const dir = new THREE.Vector3().subVectors(pPos, bPos).normalize();
      if (dist > 4.5) bPos.addScaledVector(dir, b.speed * delta);
      b.mesh.rotation.y = Math.atan2(dir.x, dir.z);

      b.throwCooldown -= delta;
      if (b.throwCooldown <= 0) {
        b.throwCooldown = 1.9;
        [-0.25, 0, 0.25].forEach(a => this.spawnProjectile(bPos, dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a), 'enemy', 0xff0055, true));
      }

      b.shockwaveTimer -= delta;
      if (b.shockwaveTimer <= 0) {
        b.shockwaveTimer = 4.8;
        this.spawnShockwave(bPos, 0xff0055, 13);
        soundEngine.playSfx('bossRoar');
        if (dist < 10 && pPos.y < 1.0) {
          this.damagePlayer(24);
          this.showNotification("Boss Shockwave! Press [C] to Dodge!");
        }
      }
    }
  }

  updateTraps(delta) {
    const pPos = this.playerMesh.position;
    this.traps.forEach(t => {
      if (t.hitCooldown > 0) t.hitCooldown -= delta;
      if (t.type === 'spikes') {
        const active = Math.sin(this.animTime * 2.5 + t.phase) > 0.2;
        t.spikes.position.y = active ? 0.35 : -0.6;
        if (active && t.hitCooldown <= 0 && pPos.distanceTo(t.group.position) < 2.0 && pPos.y < 1.0) {
          t.hitCooldown = 1.2;
          soundEngine.playSfx('trap');
          this.damagePlayer(18);
        }
      } else if (t.type === 'barrier') {
        t.mesh.position.x += t.speed * t.dir * delta;
        if (t.mesh.position.x > t.maxX) t.dir = -1;
        if (t.mesh.position.x < t.minX) t.dir = 1;
        if (t.hitCooldown <= 0 && pPos.distanceTo(t.mesh.position) < 2.1) {
          t.hitCooldown = 1.2;
          soundEngine.playSfx('trap');
          this.damagePlayer(20);
        }
      }
    });
  }

  updatePuzzles() {
    const pPos = this.playerMesh.position;
    this.pressurePads.forEach(pad => {
      if (!pad.active && pPos.distanceTo(pad.mesh.position) < 1.8) {
        pad.active = true;
        pad.mesh.material.color.setHex(0x00ff88);
        this.addScore(150);
        soundEngine.playSfx('puzzleSolve');
        if (this.onFloatingPopup) this.onFloatingPopup('+150 PAD!', '#00ff9d');
        this.showNotification(`${pad.label} Activated!`);
        this.evaluateLevelUnlock();
      }
    });
  }

  updateCheckpoints() {
    const pPos = this.playerMesh.position;
    this.checkpoints.forEach(cp => {
      if (!cp.activated && pPos.distanceTo(cp.group.position) < 3.0) {
        cp.activated = true;
        cp.orb.material.color.setHex(0x00ff88);
        this.checkpointPos.copy(cp.pos);
        soundEngine.playSfx('checkpoint');
        this.showNotification("CHECKPOINT SAVED!");
        if (this.onSaveProgress) this.onSaveProgress();
      }
    });
  }

  // ZERO-LAG COLLECTIBLE LOOP (Instant hide, shared assets, no PointLights!)
  updateCollectibles(delta) {
    const px = this.playerMesh.position.x;
    const pz = this.playerMesh.position.z;

    for (let i = 0; i < this.collectibleMeshes.length; i++) {
      const col = this.collectibleMeshes[i];
      if (col.collected) continue;

      col.mesh.rotation.y += 2.2 * delta;
      const dx = px - col.group.position.x;
      const dz = pz - col.group.position.z;

      if (dx * dx + dz * dz < 3.6) {
        col.collected = true;
        col.group.visible = false; // Instant hide -> ZERO lag!

        if (col.type === 'coin' || col.type === 'gem') {
          this.coins++;
          this.bumpCombo();
          const pts = (col.type === 'gem' ? 40 : 50) * this.combo;
          this.addScore(pts);
          this.gainXP(col.type === 'gem' ? 30 : 20);
          soundEngine.playSfx('coin', { combo: this.combo }); // Soft low-volume chime!
        } else if (col.type === 'crystal') {
          this.levelItemsCollected++;
          this.addScore(150);
          soundEngine.playSfx('pickup');
          this.showNotification(`${col.name} (${this.levelItemsCollected}/${this.levelItemsRequired})`);
          this.evaluateLevelUnlock();
        } else if (col.type === 'key') {
          this.inventory.keys++;
          this.addScore(150);
          soundEngine.playSfx('pickup');
          this.showNotification(`Key Found! (${this.inventory.keys}/2)`);
          this.evaluateLevelUnlock();
        } else if (col.type === 'berry') {
          this.inventory.berries++;
          soundEngine.playSfx('powerup');
          this.showNotification("+1 Healing Berry [1]");
        } else if (col.type === 'speed') {
          this.inventory.speedElixir++;
          soundEngine.playSfx('powerup');
          this.showNotification("+1 Speed Elixir [2]");
        } else if (col.type === 'shield') {
          this.inventory.shieldCharm++;
          soundEngine.playSfx('powerup');
          this.showNotification("+1 Shield Charm [3]");
        }
        if (this.onInventoryChange) this.onInventoryChange(this.inventory);
      }
    }
  }

  performDodge() {
    if (this.dodgeTimer > 0 || this.stamina < 28) return;
    this.stamina -= 28;
    this.dodgeTimer = 0.35;
    soundEngine.playSfx('dodge');
    this.spawnShockwave(this.playerMesh.position, 0x38bdf8, 3.8);
  }

  checkInteractions() {
    const pPos = this.playerMesh.position;
    this.activeInteractable = null;
    let hintLabel = null;

    this.secretChests.forEach(c => {
      if (!c.opened && pPos.distanceTo(c.group.position) < 2.8) {
        this.activeInteractable = { type: 'chest', entity: c };
        hintLabel = 'Open Secret Treasure';
      }
    });

    if (this.nigelMesh && pPos.distanceTo(this.nigelMesh.position) < 3.4) {
      this.activeInteractable = { type: 'nigel' };
      hintLabel = 'Speak with Nigel Billingsley';
    }
    this.levers.forEach(l => {
      if (!l.pulled && pPos.distanceTo(l.group.position) < 2.8) {
        this.activeInteractable = { type: 'lever', entity: l };
        hintLabel = `Activate ${l.label}`;
      }
    });
    this.sequencePedestals.forEach(sp => {
      if (!sp.solved && pPos.distanceTo(sp.group.position) < 2.8) {
        this.activeInteractable = { type: 'sequence', entity: sp };
        hintLabel = `Activate ${sp.label}`;
      }
    });
    this.runePillarMeshes.forEach(pMesh => {
      if (pPos.distanceTo(pMesh.group.position) < 2.8) {
        this.activeInteractable = { type: 'pillar', entity: pMesh };
        hintLabel = `Rotate ${pMesh.config.name}`;
      }
    });
    this.beacons.forEach(b => {
      if (!b.sabotaged && pPos.distanceTo(b.group.position) < 3.2) {
        this.activeInteractable = { type: 'beacon', entity: b };
        hintLabel = `Sabotage ${b.name}`;
      }
    });
    if (this.exitPortal && pPos.distanceTo(this.exitPortal.group.position) < 3.8) {
      this.activeInteractable = { type: 'portal' };
      hintLabel = this.exitPortal.active ? 'Enter Exit Portal' : 'Portal Locked';
    }
    if (this.falconJewel && this.currentLevel === 5 && pPos.distanceTo(new THREE.Vector3(0, 4.5, -50)) < 5.0) {
      this.activeInteractable = { type: 'altar' };
      hintLabel = 'Claim the Falcon Jewel';
    }
    if (this.onInteractHint) this.onInteractHint(hintLabel);
  }

  damagePlayer(dmg) {
    if (this.shieldTimer > 0 || this.dodgeTimer > 0) return;
    soundEngine.playSfx('hit');
    this.cameraShake = Math.max(this.cameraShake, 0.4);
    if (this.onDamageFlash) this.onDamageFlash();
    this.health = Math.max(0, this.health - dmg);
    if (this.onHealthChange) this.onHealthChange(this.health, this.maxHealth);

    if (this.health <= 0) {
      this.lives--;
      if (this.onLivesChange) this.onLivesChange(this.lives);
      if (this.lives > 0) {
        this.showNotification(`AVATAR DOWN! (${this.lives} lives left)`);
        this.playerMesh.position.copy(this.checkpointPos);
        this.playerMesh.position.y = 12;
        this.verticalVelocity = -3;
        this.isGrounded = false;
        this.health = this.maxHealth;
        if (this.onHealthChange) this.onHealthChange(this.health, this.maxHealth);
      } else {
        this.state = 'GAMEOVER';
        if (this.onGameOver) this.onGameOver();
      }
    }
  }

  spawnShockwave(pos, color, maxRadius) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.85, 20),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, pos.y + 0.2, pos.z);
    this.scene.add(ring);
    this.particles.push({ mesh: ring, scaleSpeed: maxRadius * 2.4, fadeSpeed: 2.2 });
  }

  updateEnvironment(delta) {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        if (this.onComboChange) this.onComboChange(this.combo);
      }
    }
    if (this.atmosphericParticles) {
      this.atmosphericParticles.position.y = Math.sin(this.animTime * 0.9) * 0.35;
      this.atmosphericParticles.rotation.y += 0.035 * delta;
    }
    if (this.falconJewel) this.falconJewel.rotation.y += 1.2 * delta;
    if (this.exitPortal && this.exitPortal.active) this.exitPortal.vortex.rotation.z += 2.0 * delta;
  }

  updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.scaleSpeed) p.mesh.scale.addScalar(p.scaleSpeed * delta);
      if (p.mesh.material) {
        p.mesh.material.opacity = Math.max(0, p.mesh.material.opacity - p.fadeSpeed * delta);
        if (p.mesh.material.opacity <= 0) {
          this.scene.remove(p.mesh);
          this.particles.splice(i, 1);
        }
      }
    }
  }

  updateCamera(delta) {
    if (this.cameraMode === 'CINEMATIC') {
      this.cinematicTime += delta;
      const progress = Math.min(1, this.cinematicTime / this.cinematicDuration);
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

    if (!this.playerMesh) return;
    const target = this.playerMesh.position.clone();
    target.y += 1.2;
    this.cameraTarget.lerp(target, 12 * delta);

    let sx = 0, sy = 0;
    if (this.cameraShake > 0) {
      sx = (Math.random() - 0.5) * this.cameraShake;
      sy = (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - delta * 2.2);
    }

    // Crisp Axes.io Angled 3rd-Person Arena Camera!
    this.camera.position.set(
      this.cameraTarget.x + sx,
      this.cameraTarget.y + 13.5 + sy,
      this.cameraTarget.z + 13.5
    );
    this.camera.lookAt(this.cameraTarget);
  }

  getLeaderboard() {
    const list = [{ name: this.charData.name.split(' ').pop(), score: this.score, isPlayer: true }];
    this.enemies.forEach(e => {
      if (e.state === 'ACTIVE') list.push({ name: e.name, score: 120 + e.kills * 150, isPlayer: false });
    });
    return list.sort((a, b) => b.score - a.score).slice(0, 4);
  }

  getRadarData() {
    if (!this.playerMesh) return null;
    return {
      px: this.playerMesh.position.x,
      pz: this.playerMesh.position.z,
      enemies: this.enemies.filter(e => e.state === 'ACTIVE').map(e => ({ x: e.mesh.position.x, z: e.mesh.position.z })),
      boss: this.boss && !this.boss.defeated ? { x: this.boss.mesh.position.x, z: this.boss.mesh.position.z } : null,
      collectibles: this.collectibleMeshes.filter(c => !c.collected).map(c => ({ x: c.group.position.x, z: c.group.position.z, type: c.type })),
      checkpoints: this.checkpoints.map(cp => ({ x: cp.group.position.x, z: cp.group.position.z, active: cp.activated })),
      goal: this.currentLevel === 5 ? { x: 0, z: -50, active: true } : (this.exitPortal ? { x: this.exitPortal.group.position.x, z: this.exitPortal.group.position.z, active: this.exitPortal.active } : null)
    };
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
    soundEngine.startJumanjiDrums(this.levelConfig.drumIntensity);
    this.playCinematic(
      new THREE.Vector3(0, 26, 36),
      new THREE.Vector3(0, 14.5, 31.5),
      new THREE.Vector3(0, 2, -18),
      new THREE.Vector3(0, 1.2, 18),
      3.0,
      () => {
        this.cameraMode = 'FOLLOW';
        this.state = 'PLAYING';
        if (onComplete) onComplete();
      }
    );
  }

  playEndingCinematic(endingKey, onComplete) {
    this.cameraMode = 'CINEMATIC';
    const charEnding = this.charData.endings[endingKey];
    soundEngine.stopDrums();
    soundEngine.playSfx('endingFanfare');
    this.playCinematic(
      new THREE.Vector3(0, 9, -42),
      new THREE.Vector3(10, 14, -56),
      new THREE.Vector3(0, 6.2, -50),
      new THREE.Vector3(0, 6.2, -50),
      5.5,
      () => { if (onComplete) onComplete(charEnding); }
    );
  }

  showNotification(msg) {
    if (this.onNotification) this.onNotification(msg);
  }
}
