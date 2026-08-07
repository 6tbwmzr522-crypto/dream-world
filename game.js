/**
 * Dream World — game logic
 * Built for a kid creator: worlds, houses, build/remove, animals, horses, inventory, gift shop.
 */
(function () {
  'use strict';

  // ---------- Constants ----------
  const SKIN_COLORS = ['#FFDBAC', '#F1C27D', '#E0AC69', '#8D5524', '#C68642', '#E0B190', '#FFDFC4', '#5C3836'];
  const HAIR_COLORS = ['#090806', '#2C222B', '#71635A', '#B7A69E', '#D6C4C2', '#CABFB1', '#8B4513', '#FFD700', '#FF6B6B', '#4ECDC4', '#9370DB', '#FF69B4'];
  const OUTFIT_COLORS = ['#FF6B6B', '#4ECDC4', '#FFD700', '#FF8E53', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8E6CF', '#DCEDC1', '#3498DB', '#E74C3C'];
  const AGE_SCALES = { newborn: 0.25, baby: 0.4, child: 0.6, preteen: 0.75, teenager: 0.9, adult: 1.0, old: 0.95 };

  const WORLDS = [
    { id: 'farm', name: 'Farm World', emoji: '🌾', desc: 'Barns, animals, and three starter houses', sky: 0x87CEEB, ground: 0x7CFC00 },
    { id: 'city', name: 'City World', emoji: '🏙️', desc: 'Tall buildings and busy streets', sky: 0x6ec6ff, ground: 0x888888 },
    { id: 'field', name: 'Field World', emoji: '🌻', desc: 'Wide open grassy fields', sky: 0x9fd3ff, ground: 0x9acd32 },
    { id: 'wood', name: 'Wood World', emoji: '🌲', desc: 'Deep forests and shady paths', sky: 0x6aa84f, ground: 0x3d6b2f },
    { id: 'village', name: 'Village World', emoji: '🏘️', desc: 'Cozy cottages and cobble roads', sky: 0x8ecae6, ground: 0xc2b280 },
    { id: 'town', name: 'Town World', emoji: '🏛️', desc: 'Like Fürstenwalde — shops & squares', sky: 0x7eb6d9, ground: 0xb0a090 }
  ];

  const FOOD_ITEMS = [
    { id: 'chicken', name: 'Chicken', icon: '🍗' },
    { id: 'pasta', name: 'Pasta', icon: '🍝' },
    { id: 'cucumber', name: 'Cucumber', icon: '🥒' },
    { id: 'tomato', name: 'Tomato', icon: '🍅' },
    { id: 'buckwheat', name: 'Buckwheat', icon: '🥣' },
    { id: 'ribs', name: 'Ribs', icon: '🍖' },
    { id: 'fries', name: 'Fries', icon: '🍟' },
    { id: 'fish', name: 'Fish', icon: '🐟' },
    { id: 'orange', name: 'Orange', icon: '🍊' },
    { id: 'apple', name: 'Apple', icon: '🍎' },
    { id: 'rice', name: 'Rice', icon: '🍚' }
  ];

  const PLACE_ITEMS = [
    { id: 'hospital', name: 'Hospital', icon: '🏥' },
    { id: 'giftshop', name: 'Gift Shop', icon: '🎁' },
    { id: 'cafe', name: 'Cafe', icon: '☕' },
    { id: 'playground', name: 'Playground', icon: '🎪' },
    { id: 'school', name: 'School', icon: '🏫' },
    { id: 'highschool', name: 'High School', icon: '🏢' },
    { id: 'daycare', name: 'Daycare', icon: '👶' },
    { id: 'mall', name: 'Mall', icon: '🏬' },
    { id: 'airport', name: 'Airport', icon: '✈️' },
    { id: 'houses', name: 'Houses', icon: '🏠' },
    { id: 'pethotel', name: 'Pet Hotel', icon: '🏨' },
    { id: 'petstore', name: 'Pet Store', icon: '🐾' },
    { id: 'petpark', name: 'Pet Park', icon: '🌳' },
    { id: 'vet', name: 'Veterinary', icon: '💉' },
    { id: 'zoo', name: 'Zoo', icon: '🦁' },
    { id: 'university', name: 'University', icon: '🎓' },
    { id: 'clothing', name: 'Clothing', icon: '👕' },
    { id: 'adoption', name: 'Pet Adoption', icon: '🏡' },
    { id: 'barn', name: 'Barn', icon: '🌾' },
    { id: 'catlibrary', name: 'Cat Library', icon: '📚' }
  ];

  const GEAR_ITEMS = [
    { id: 'leash', name: 'Leash / Lead', icon: '🦮', desc: 'Lead animals anywhere' },
    { id: 'saddle', name: 'Saddle', icon: '🪑', desc: 'Put on a horse to ride' },
    { id: 'harness', name: 'Harness', icon: '🪢', desc: 'Horse harness set' }
  ];

  // ---------- State ----------
  let scene, camera, renderer, previewScene, previewCamera, previewRenderer;
  let player, previewCharacter, groundPlane, groundMesh;
  let gameState = 'LOGIN';
  let selectedSlot = 0;
  let selectedAge = 'preteen';
  let buildMode = false;
  let selectedBuildItem = 'wall';
  let placedObjects = [];
  let removableParts = [];
  let animals = [];
  let particles = [];
  let keys = {};
  let mouse = { x: 0, y: 0, down: false };
  let touchMove = { x: 0, y: 0, active: false };
  let touchLookId = null;
  let touchLookLast = null;
  let touchRunning = false;
  let isTouchDevice = false;
  let cameraAngle = 0;
  let cameraHeight = 6;
  let cameraDistance = 10;
  let raycaster = new THREE.Raycaster();
  let mouseVector = new THREE.Vector2();
  let buildGhost = null;
  let currentWorld = null;
  let mountedHorse = null;
  let leashedAnimals = [];
  let equippedItem = null;
  let shopTab = 'places';
  let toastTimer = null;

  const CHARACTERS = [];
  const saveKey = 'dreamWorldSave_v1';

  let playerData = {
    name: '',
    inventory: { leash: 1, saddle: 1, harness: 1 },
    ownedPlaces: {},
    worldPlaces: {}, // { farm: ['hospital', 'cafe'], city: [...] }
    lastGiftClaim: '',
    claimedGifts: {}
  };

  FOOD_ITEMS.forEach((f) => { playerData.inventory[f.id] = 0; });

  // ---------- Helpers ----------
  function $(id) { return document.getElementById(id); }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    const el = $(id);
    if (el) el.classList.add('active');
  }

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(saveKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.playerData) playerData = Object.assign(playerData, data.playerData);
      if (!playerData.worldPlaces) playerData.worldPlaces = {};
      // Migrate old "owned everywhere" unlocks into farm world once
      if (data.playerData && data.playerData.ownedPlaces && !Object.keys(playerData.worldPlaces).length) {
        const old = Object.keys(data.playerData.ownedPlaces).filter((k) => data.playerData.ownedPlaces[k]);
        if (old.length) playerData.worldPlaces.farm = old;
      }
      if (data.characters) {
        data.characters.forEach((c, i) => {
          if (CHARACTERS[i]) Object.assign(CHARACTERS[i], c);
        });
      }
    } catch (e) { /* ignore */ }
  }

  function placesInWorld(worldId) {
    return playerData.worldPlaces[worldId] || [];
  }

  function isPlaceInWorld(placeId, worldId) {
    return placesInWorld(worldId).indexOf(placeId) !== -1;
  }

  function worldsWithPlace(placeId) {
    return WORLDS.filter((w) => isPlaceInWorld(placeId, w.id));
  }

  function togglePlaceInWorld(placeId, worldId) {
    if (!playerData.worldPlaces[worldId]) playerData.worldPlaces[worldId] = [];
    const list = playerData.worldPlaces[worldId];
    const idx = list.indexOf(placeId);
    if (idx === -1) {
      list.push(placeId);
      playerData.ownedPlaces[placeId] = true;
      return true;
    }
    list.splice(idx, 1);
    if (!worldsWithPlace(placeId).length) delete playerData.ownedPlaces[placeId];
    return false;
  }

  function saveGame() {
    localStorage.setItem(saveKey, JSON.stringify({
      playerData,
      characters: CHARACTERS
    }));
  }

  function createBox(color, w, h, d, x, y, z) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function createCylinder(color, rTop, rBot, h, x, y, z, segs) {
    const geo = new THREE.CylinderGeometry(rTop, rBot, h, segs || 10);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function markRemovable(mesh, label) {
    mesh.userData.removable = true;
    mesh.userData.buildLabel = label || 'piece';
    removableParts.push(mesh);
    return mesh;
  }

  // ---------- Gift schedule ----------
  function isGiftDay(date) {
    // Every Friday, plus the 1st of each month
    return date.getDay() === 5 || date.getDate() === 1;
  }

  function giftPeriodKey(date) {
    if (date.getDay() === 5) {
      // ISO week-ish key for Friday gifts
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return 'fri-' + d.toISOString().slice(0, 10);
    }
    return 'month-' + date.getFullYear() + '-' + (date.getMonth() + 1);
  }

  function getGiftOffer() {
    const now = new Date();
    const active = isGiftDay(now);
    const key = giftPeriodKey(now);
    const claimed = !!playerData.claimedGifts[key];
    return { active, key, claimed, isFriday: now.getDay() === 5, isMonthStart: now.getDate() === 1 };
  }

  function updateGiftUI() {
    const offer = getGiftOffer();
    const sign = $('gift-sign');
    const status = $('gift-status');
    if (offer.active && !offer.claimed) {
      sign.classList.add('new-gift');
      status.textContent = offer.isFriday
        ? '✨ New Friday gift is ready — tap Gifts!'
        : '✨ New monthly gift is ready — tap Gifts!';
    } else if (offer.active && offer.claimed) {
      sign.classList.remove('new-gift');
      status.textContent = 'You already claimed this gift. Next one comes Friday or on the 1st!';
    } else {
      sign.classList.remove('new-gift');
      const daysUntilFri = (5 - new Date().getDay() + 7) % 7 || 7;
      status.textContent = 'No new gift right now. Next Friday gift in ~' + daysUntilFri + ' day(s), or on the 1st of the month.';
    }
  }

  // ---------- Init ----------
  function init() {
    for (let i = 0; i < 25; i++) {
      CHARACTERS.push({
        id: i,
        age: 'preteen',
        skinColor: SKIN_COLORS[i % SKIN_COLORS.length],
        hairColor: HAIR_COLORS[i % HAIR_COLORS.length],
        outfitColor: OUTFIT_COLORS[i % OUTFIT_COLORS.length],
        saved: i === 0
      });
    }
    loadSave();

    const container = $('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 40, 100);

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 250);
    camera.position.set(0, 8, 12);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const planeGeo = new THREE.PlaneGeometry(300, 300);
    const planeMat = new THREE.MeshBasicMaterial({ visible: false });
    groundPlane = new THREE.Mesh(planeGeo, planeMat);
    groundPlane.rotation.x = -Math.PI / 2;
    scene.add(groundPlane);

    createCharacterCreatorScene();
    setupUI();
    setupControls();
    setupTouchControls();
    isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;

    if (playerData.name) {
      showMainMenu();
    } else {
      showScreen('login-screen');
      gameState = 'LOGIN';
    }

    $('loading').style.display = 'none';
    animate();
  }

  // ---------- Character mesh ----------
  function buildCharacterMesh(charData, scale) {
    const group = new THREE.Group();
    const ageScale = AGE_SCALES[charData.age] || 0.75;
    const s = (scale || 1) * ageScale;
    const skin = new THREE.Color(charData.skinColor);
    const hair = new THREE.Color(charData.hairColor);
    const outfit = new THREE.Color(charData.outfitColor);

    group.add(createBox(outfit, 0.6 * s, 0.7 * s, 0.35 * s, 0, 0.6 * s, 0));
    const headSize = 0.5 * s;
    group.add(createBox(skin, headSize, headSize, headSize, 0, 1.25 * s, 0));
    group.add(createBox(hair, headSize * 1.1, headSize * 0.3, headSize * 1.1, 0, 1.5 * s, 0));
    group.add(createBox(hair, headSize * 1.1, headSize * 0.6, headSize * 0.3, 0, 1.3 * s, -0.22 * s));

    const eyeGeo = new THREE.BoxGeometry(0.08 * s, 0.08 * s, 0.02 * s);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12 * s, 1.28 * s, 0.26 * s);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12 * s, 1.28 * s, 0.26 * s);
    group.add(rightEye);

    const armGeo = new THREE.BoxGeometry(0.15 * s, 0.5 * s, 0.15 * s);
    const armMat = new THREE.MeshLambertMaterial({ color: skin });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.42 * s, 0.7 * s, 0);
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.42 * s, 0.7 * s, 0);
    group.add(rightArm);

    const legGeo = new THREE.BoxGeometry(0.2 * s, 0.5 * s, 0.2 * s);
    const legMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.15 * s, 0.15 * s, 0);
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.15 * s, 0.15 * s, 0);
    group.add(rightLeg);

    if (charData.age === 'baby' || charData.age === 'newborn') {
      group.add(createBox(0xFF69B4, 0.08 * s, 0.08 * s, 0.05 * s, 0, 1.15 * s, 0.28 * s));
    }
    if (charData.age === 'old') {
      const glassGeo = new THREE.BoxGeometry(0.15 * s, 0.08 * s, 0.02 * s);
      const glassMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
      const g1 = new THREE.Mesh(glassGeo, glassMat);
      g1.position.set(-0.12 * s, 1.3 * s, 0.27 * s);
      group.add(g1);
      const g2 = new THREE.Mesh(glassGeo, glassMat);
      g2.position.set(0.12 * s, 1.3 * s, 0.27 * s);
      group.add(g2);
      group.add(createBox(0x8B4513, 0.05 * s, 0.8 * s, 0.05 * s, 0.5 * s, 0.4 * s, 0.2 * s));
    }
    group.userData.limbStart = 4;
    return group;
  }

  function createCharacterCreatorScene() {
    const previewDiv = $('creator-preview');
    previewScene = new THREE.Scene();
    previewScene.background = new THREE.Color(0x87CEEB);
    previewCamera = new THREE.PerspectiveCamera(45, Math.max(previewDiv.clientWidth, 1) / Math.max(previewDiv.clientHeight, 1), 0.1, 100);
    previewCamera.position.set(0, 2, 5);
    previewCamera.lookAt(0, 1, 0);
    previewRenderer = new THREE.WebGLRenderer({ antialias: true });
    previewRenderer.setSize(Math.max(previewDiv.clientWidth, 1), Math.max(previewDiv.clientHeight, 1));
    previewRenderer.shadowMap.enabled = true;
    previewDiv.appendChild(previewRenderer.domElement);
    previewScene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 5);
    previewScene.add(dir);
    previewScene.add(createBox(0x90EE90, 4, 0.2, 4, 0, -0.1, 0));
    updatePreviewCharacter();
  }

  function updatePreviewCharacter() {
    if (previewCharacter) previewScene.remove(previewCharacter);
    previewCharacter = buildCharacterMesh(CHARACTERS[selectedSlot]);
    previewScene.add(previewCharacter);
    syncCreatorControls();
  }

  function syncCreatorControls() {
    const c = CHARACTERS[selectedSlot];
    document.querySelectorAll('.age-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.age === c.age);
    });
    selectedAge = c.age;
    syncColorPicker('skin-colors', SKIN_COLORS, c.skinColor);
    syncColorPicker('hair-colors', HAIR_COLORS, c.hairColor);
    syncColorPicker('outfit-colors', OUTFIT_COLORS, c.outfitColor);
  }

  function syncColorPicker(id, colors, value) {
    const container = $(id);
    container.querySelectorAll('.color-swatch').forEach((s, idx) => {
      s.classList.toggle('active', colors[idx] === value);
    });
  }

  // ---------- UI setup ----------
  function setupUI() {
    $('btn-login').addEventListener('click', doLogin);
    $('player-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLogin();
    });
    $('btn-play').addEventListener('click', openWorldSelect);
    $('btn-char').addEventListener('click', openCharacterCreator);
    $('btn-shop').addEventListener('click', openShop);
    $('btn-logout').addEventListener('click', () => {
      showScreen('login-screen');
      gameState = 'LOGIN';
    });
    $('btn-world-back').addEventListener('click', showMainMenu);
    $('btn-char-back').addEventListener('click', showMainMenu);
    $('btn-shop-back').addEventListener('click', showMainMenu);
    $('btn-world-pick-close').addEventListener('click', closeWorldPicker);
    $('world-pick-modal').addEventListener('click', (e) => {
      if (e.target.id === 'world-pick-modal') closeWorldPicker();
    });
    $('btn-save-char').addEventListener('click', saveCharacter);
    $('btn-build-toggle').addEventListener('click', toggleBuildMode);
    $('btn-inventory').addEventListener('click', toggleInventory);
    $('btn-exit-world').addEventListener('click', exitToMenu);

    document.querySelectorAll('.build-item').forEach((item) => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.build-item').forEach((i) => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedBuildItem = item.dataset.item;
        updateBuildGhost();
      });
    });

    document.querySelectorAll('.shop-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.shop-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        shopTab = tab.dataset.tab;
        renderShop();
      });
    });

    const grid = $('char-grid');
    for (let i = 0; i < 25; i++) {
      const slot = document.createElement('div');
      slot.className = 'char-slot' + (i === 0 ? ' selected' : '');
      slot.innerHTML = '<span class="slot-num">' + (i + 1) + '</span>👤';
      if (CHARACTERS[i].saved) {
        slot.style.background = '#d4edda';
        slot.style.borderColor = '#28a745';
      }
      slot.addEventListener('click', () => {
        document.querySelectorAll('.char-slot').forEach((s) => s.classList.remove('selected'));
        slot.classList.add('selected');
        selectedSlot = i;
        updatePreviewCharacter();
      });
      grid.appendChild(slot);
    }

    document.querySelectorAll('.age-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.age-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAge = btn.dataset.age;
        CHARACTERS[selectedSlot].age = selectedAge;
        updatePreviewCharacter();
      });
    });

    createColorPicker('skin-colors', SKIN_COLORS, 'skinColor');
    createColorPicker('hair-colors', HAIR_COLORS, 'hairColor');
    createColorPicker('outfit-colors', OUTFIT_COLORS, 'outfitColor');

    const worldGrid = $('world-grid');
    WORLDS.forEach((w) => {
      const card = document.createElement('div');
      card.className = 'world-card';
      card.innerHTML = '<div class="world-emoji">' + w.emoji + '</div><div class="world-name">' + w.name + '</div><div class="world-desc">' + w.desc + '</div>';
      card.addEventListener('click', () => startWorld(w));
      worldGrid.appendChild(card);
    });

    if (playerData.name) $('player-name').value = playerData.name;
  }

  function createColorPicker(id, colors, property) {
    const container = $(id);
    colors.forEach((color, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch' + (idx === 0 ? ' active' : '');
      swatch.style.backgroundColor = color;
      swatch.addEventListener('click', () => {
        container.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('active'));
        swatch.classList.add('active');
        CHARACTERS[selectedSlot][property] = color;
        updatePreviewCharacter();
      });
      container.appendChild(swatch);
    });
  }

  function doLogin() {
    const name = $('player-name').value.trim();
    if (!name) {
      toast('Please type a name!');
      return;
    }
    playerData.name = name;
    saveGame();
    showMainMenu();
  }

  function showMainMenu() {
    gameState = 'MENU';
    showScreen('main-menu');
    $('welcome-name').textContent = 'Hi, ' + playerData.name + '!';
    $('game-ui').classList.remove('active');
    document.exitPointerLock && document.exitPointerLock();
  }

  function openWorldSelect() {
    gameState = 'WORLD_SELECT';
    showScreen('world-select');
  }

  function openCharacterCreator() {
    gameState = 'CHAR_CREATOR';
    showScreen('char-creator');
    setTimeout(() => {
      const previewDiv = $('creator-preview');
      if (previewCamera && previewRenderer && previewDiv) {
        previewCamera.aspect = Math.max(previewDiv.clientWidth, 1) / Math.max(previewDiv.clientHeight, 1);
        previewCamera.updateProjectionMatrix();
        previewRenderer.setSize(Math.max(previewDiv.clientWidth, 1), Math.max(previewDiv.clientHeight, 1));
      }
    }, 50);
  }

  function openShop() {
    gameState = 'SHOP';
    showScreen('shop-menu');
    updateGiftUI();
    renderShop();
  }

  function saveCharacter() {
    CHARACTERS[selectedSlot].saved = true;
    const slot = document.querySelectorAll('.char-slot')[selectedSlot];
    slot.style.background = '#d4edda';
    slot.style.borderColor = '#28a745';
    saveGame();
    toast('Character saved!');
  }

  // ---------- Shop ----------
  let pendingPlaceItem = null;

  function openWorldPicker(item) {
    pendingPlaceItem = item;
    $('world-pick-title').textContent = item.icon + '  ' + item.name;
    $('world-pick-desc').textContent = 'Which world should get this? Tap again to remove it from a world.';
    const list = $('world-pick-list');
    list.innerHTML = '';
    WORLDS.forEach((w) => {
      const inWorld = isPlaceInWorld(item.id, w.id);
      const btn = document.createElement('button');
      btn.className = 'world-pick-btn' + (inWorld ? ' in-world' : '');
      btn.innerHTML = '<span>' + w.emoji + ' ' + w.name + '</span><span>' + (inWorld ? '✓ Added' : 'Add') + '</span>';
      btn.addEventListener('click', () => {
        const added = togglePlaceInWorld(item.id, w.id);
        saveGame();
        toast(added ? item.name + ' added to ' + w.name + '!' : item.name + ' removed from ' + w.name);
        openWorldPicker(item);
        renderShop();
      });
      list.appendChild(btn);
    });
    $('world-pick-modal').classList.add('open');
  }

  function closeWorldPicker() {
    $('world-pick-modal').classList.remove('open');
    pendingPlaceItem = null;
  }

  function renderShop() {
    const grid = $('shop-grid');
    grid.innerHTML = '';
    updateGiftUI();

    if (shopTab === 'places') {
      PLACE_ITEMS.forEach((item) => {
        const worlds = worldsWithPlace(item.id);
        const div = document.createElement('div');
        div.className = 'shop-item' + (worlds.length ? ' owned' : '');
        const tags = worlds.length
          ? '<div class="world-tags">' + worlds.map((w) => '<span class="world-tag">' + w.emoji + ' ' + w.name.replace(' World', '') + '</span>').join('') + '</div>'
          : '<div class="shop-meta">Tap to choose a world</div>';
        div.innerHTML = '<div class="shop-icon">' + item.icon + '</div><div class="shop-name">' + item.name + '</div>' + tags;
        div.addEventListener('click', () => openWorldPicker(item));
        grid.appendChild(div);
      });
    } else if (shopTab === 'food') {
      FOOD_ITEMS.forEach((item) => {
        const qty = playerData.inventory[item.id] || 0;
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = '<div class="shop-icon">' + item.icon + '</div><div class="shop-name">' + item.name + '</div><div class="shop-meta">You have: ' + qty + ' · Click to buy</div>';
        div.addEventListener('click', () => {
          playerData.inventory[item.id] = qty + 1;
          saveGame();
          toast('Got ' + item.name + '!');
          renderShop();
        });
        grid.appendChild(div);
      });
    } else if (shopTab === 'gifts') {
      const offer = getGiftOffer();
      const div = document.createElement('div');
      div.className = 'shop-item';
      if (offer.active && !offer.claimed) {
        div.innerHTML = '<div class="shop-icon">🎁</div><div class="shop-name">Special Gift</div><div class="shop-meta">Tap to open!</div>';
        div.addEventListener('click', () => {
          claimGift(offer.key);
        });
      } else if (offer.claimed) {
        div.innerHTML = '<div class="shop-icon">🎀</div><div class="shop-name">Gift claimed</div><div class="shop-meta">Come back Friday or on the 1st</div>';
      } else {
        div.innerHTML = '<div class="shop-icon">📪</div><div class="shop-name">No gift yet</div><div class="shop-meta">Gifts arrive every Friday & on the 1st</div>';
      }
      grid.appendChild(div);
    } else if (shopTab === 'gear') {
      GEAR_ITEMS.forEach((item) => {
        const qty = playerData.inventory[item.id] || 0;
        const div = document.createElement('div');
        div.className = 'shop-item';
        const icon = item.id === 'saddle' ? '🐴' : item.icon;
        div.innerHTML = '<div class="shop-icon">' + icon + '</div><div class="shop-name">' + item.name + '</div><div class="shop-meta">' + item.desc + ' · Have: ' + qty + '</div>';
        div.addEventListener('click', () => {
          playerData.inventory[item.id] = qty + 1;
          saveGame();
          toast('Got ' + item.name + '!');
          renderShop();
        });
        grid.appendChild(div);
      });
    }
  }

  function claimGift(key) {
    playerData.claimedGifts[key] = true;
    const food = FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)];
    playerData.inventory[food.id] = (playerData.inventory[food.id] || 0) + 3;
    playerData.inventory.leash = (playerData.inventory.leash || 0) + 1;
    saveGame();
    toast('Gift opened! +3 ' + food.name + ' and a leash!');
    updateGiftUI();
    renderShop();
  }

  // ---------- Inventory ----------
  function toggleInventory() {
    const panel = $('inventory-panel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) renderInventory();
  }

  function renderInventory() {
    const grid = $('inv-grid');
    grid.innerHTML = '';
    const entries = [];
    GEAR_ITEMS.forEach((g) => {
      const qty = playerData.inventory[g.id] || 0;
      if (qty > 0) entries.push({ id: g.id, name: g.name, icon: g.id === 'saddle' ? '🐴' : g.icon, qty });
    });
    FOOD_ITEMS.forEach((f) => {
      const qty = playerData.inventory[f.id] || 0;
      if (qty > 0) entries.push({ id: f.id, name: f.name, icon: f.icon, qty });
    });
    if (!entries.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;opacity:0.7;font-size:13px;">Empty — visit the shop!</div>';
      return;
    }
    entries.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'inv-slot' + (equippedItem === item.id ? ' selected' : '');
      div.innerHTML = '<div class="inv-icon">' + item.icon + '</div><div>' + item.name + '</div><div>×' + item.qty + '</div>';
      div.addEventListener('click', () => {
        if (equippedItem === item.id) {
          equippedItem = null;
          toast('Unequipped ' + item.name);
        } else {
          equippedItem = item.id;
          toast('Equipped ' + item.name);
        }
        renderInventory();
      });
      grid.appendChild(div);
    });
  }

  // ---------- Worlds ----------
  function clearWorld() {
    while (scene.children.length) scene.remove(scene.children[0]);
    placedObjects = [];
    removableParts = [];
    animals = [];
    particles = [];
    player = null;
    mountedHorse = null;
    leashedAnimals = [];
    buildGhost = null;
    groundMesh = null;
  }

  function addLights() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(20, 30, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    scene.add(sun);
  }

  function startWorld(world) {
    currentWorld = world;
    gameState = 'PLAYING';
    buildMode = false;
    showScreen(''); // hide all overlay screens
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    $('game-ui').classList.add('active');
    $('world-label').textContent = world.name;
    $('build-menu').classList.remove('open');
    $('inventory-panel').classList.remove('open');
    $('mode-indicator').textContent = 'PLAY MODE';
    $('btn-build-toggle').textContent = 'Build Mode';
    if (isTouchDevice) {
      $('touch-controls').classList.add('active');
      $('hud-tip').textContent = 'Joystick move · Drag to look · Use / Jump / Run';
      setTimeout(() => {
        const hint = $('look-hint');
        if (hint) hint.style.display = 'none';
      }, 4000);
    } else {
      $('touch-controls').classList.remove('active');
    }

    clearWorld();
    scene.background = new THREE.Color(world.sky);
    scene.fog = new THREE.Fog(world.sky, 45, 110);
    addLights();

    groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    groundPlane.rotation.x = -Math.PI / 2;
    scene.add(groundPlane);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshLambertMaterial({ color: world.ground });
    groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    buildWorldContent(world);

    const charData = CHARACTERS.find((c) => c.saved) || CHARACTERS[0];
    player = buildCharacterMesh(charData);
    player.position.set(0, 0, 8);
    player.userData.jumpVel = 0;
    scene.add(player);

    cameraAngle = 0;
    camera.position.set(0, 8, 18);
    toast('Welcome to ' + world.name + '!');
  }

  function buildWorldContent(world) {
    // Path
    for (let i = -12; i < 12; i++) {
      scene.add(createBox(0x8B7355, 3, 0.05, 2, 0, 0.02, i * 3));
    }

    // Fence
    for (let x = -18; x <= 18; x += 3) {
      scene.add(createBox(0x8B4513, 0.15, 1.2, 0.15, x, 0.6, -22));
      scene.add(createBox(0x8B4513, 0.15, 1.2, 0.15, x, 0.6, 22));
    }
    for (let z = -22; z <= 22; z += 3) {
      scene.add(createBox(0x8B4513, 0.15, 1.2, 0.15, -18, 0.6, z));
      scene.add(createBox(0x8B4513, 0.15, 1.2, 0.15, 18, 0.6, z));
    }

    // Three starter houses from her pics (spaced so you can walk between them)
    buildStarterHouse1(-14, 0, -8);
    buildStarterHouse2(0, 0, -10);
    buildStarterHouse3(14, 0, -8);

    if (world.id === 'farm') {
      buildBarn(-8, 0, 12);
      spawnAnimals(28);
      const pond = new THREE.Mesh(
        new THREE.CircleGeometry(4, 32),
        new THREE.MeshLambertMaterial({ color: 0x4169E1 })
      );
      pond.rotation.x = -Math.PI / 2;
      pond.position.set(10, 0.03, 10);
      scene.add(pond);
    } else if (world.id === 'city') {
      for (let i = 0; i < 12; i++) {
        const h = 4 + Math.random() * 10;
        const bx = (i % 4) * 8 - 12;
        const bz = Math.floor(i / 4) * 10 - 4;
        scene.add(createBox(0x708090, 3, h, 3, bx, h / 2, bz));
      }
      spawnAnimals(8);
    } else if (world.id === 'field') {
      for (let i = 0; i < 80; i++) {
        const colors = [0xFFD700, 0xFF69B4, 0xFFFFFF, 0xFF6347];
        scene.add(createBox(colors[i % colors.length], 0.2, 0.35, 0.2, (Math.random() - 0.5) * 60, 0.18, (Math.random() - 0.5) * 60));
      }
      spawnAnimals(18);
    } else if (world.id === 'wood') {
      for (let i = 0; i < 45; i++) {
        buildTree((Math.random() - 0.5) * 70, (Math.random() - 0.5) * 70);
      }
      spawnAnimals(14);
    } else if (world.id === 'village') {
      for (let i = 0; i < 6; i++) {
        const cx = (i % 3) * 10 - 10;
        const cz = Math.floor(i / 3) * 12 + 6;
        buildCottage(cx, 0, cz);
      }
      spawnAnimals(10);
    } else if (world.id === 'town') {
      // Fürstenwalde-inspired town square
      scene.add(createBox(0xA0522D, 14, 0.08, 14, 0, 0.04, 6));
      scene.add(createCylinder(0x808080, 0.6, 0.8, 2.5, 0, 1.25, 6, 12));
      scene.add(createBox(0xC0C0C0, 8, 4, 5, -14, 2, 4));
      scene.add(createBox(0xCD853F, 7, 3.5, 5, 14, 1.75, 4));
      scene.add(createBox(0xDEB887, 6, 3, 4, 0, 1.5, 16));
      spawnAnimals(10);
    }

    if (world.id !== 'wood') {
      for (let i = 0; i < 16; i++) {
        const tx = (Math.random() - 0.5) * 50;
        const tz = (Math.random() - 0.5) * 50;
        if (Math.abs(tx) < 6 && Math.abs(tz) < 6) continue;
        buildTree(tx, tz);
      }
    }

    // Places unlocked from the shop for this world
    spawnWorldPlaces(world.id);
  }

  function spawnWorldPlaces(worldId) {
    const places = placesInWorld(worldId);
    if (!places.length) return;
    places.forEach((placeId, i) => {
      const angle = (i / Math.max(places.length, 1)) * Math.PI * 2;
      const radius = 16 + (i % 3) * 4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius + 10;
      buildShopPlace(placeId, x, 0, z);
    });
  }

  function buildShopPlace(placeId, x, y, z) {
    const item = PLACE_ITEMS.find((p) => p.id === placeId) || { name: placeId, icon: '🏠', id: placeId };
    const g = new THREE.Group();
    g.position.set(x, y, z);

    // Base building shell — color varies by type
    const colors = {
      hospital: 0xFFFFFF, giftshop: 0xF48FB1, cafe: 0xD7CCC8, playground: 0x81C784,
      school: 0xFFF59D, highschool: 0x90CAF9, daycare: 0xF8BBD0, mall: 0xCE93D8,
      airport: 0xB0BEC5, houses: 0xFFCC80, pethotel: 0xA5D6A7, petstore: 0xFFAB91,
      petpark: 0xAED581, vet: 0x80CBC4, zoo: 0xFFD54F, university: 0x9FA8DA,
      clothing: 0xF48FB1, adoption: 0xC5E1A5, barn: 0xE57373, catlibrary: 0xBCAAA4
    };
    const color = colors[placeId] || 0xE0E0E0;
    const h = placeId === 'airport' || placeId === 'mall' || placeId === 'university' ? 5 : 3.2;
    const w = placeId === 'airport' || placeId === 'mall' ? 8 : 5;
    const d = placeId === 'airport' ? 6 : 4.5;

    g.add(createBox(color, w, h, d, 0, h / 2, 0));
    g.add(createBox(0x5D4037, w + 0.4, 0.25, d + 0.4, 0, h + 0.1, 0));
    // Door + windows
    g.add(createBox(0x5D4037, 1.1, 2.0, 0.1, 0, 1.1, d / 2 + 0.02));
    g.add(createBox(0x81D4FA, 1.0, 1.0, 0.08, -1.5, 2.0, d / 2 + 0.02));
    g.add(createBox(0x81D4FA, 1.0, 1.0, 0.08, 1.5, 2.0, d / 2 + 0.02));

    if (placeId === 'hospital') {
      g.add(createBox(0xE53935, 0.35, 1.4, 0.15, 0, h + 1.0, 0));
      g.add(createBox(0xE53935, 1.4, 0.35, 0.15, 0, h + 1.0, 0));
    }
    if (placeId === 'giftshop') {
      g.add(createBox(0xE53935, 2.5, 0.7, 0.2, 0, h + 0.6, d / 2));
    }
    if (placeId === 'playground') {
      g.add(createBox(0xFF7043, 0.2, 2.5, 0.2, -1.5, 1.3, 3));
      g.add(createBox(0x42A5F5, 0.2, 2.5, 0.2, 1.5, 1.3, 3));
      g.add(createBox(0xFFEE58, 3.2, 0.15, 0.15, 0, 2.5, 3));
    }
    if (placeId === 'cafe') {
      g.add(createBox(0x6D4C41, 0.5, 0.5, 0.5, -2, 0.4, 3));
      g.add(createBox(0xFAFAFA, 0.4, 0.5, 0.4, -1.3, 0.4, 3));
    }

    // Floating name label
    const label = makeLabelSprite((item.icon || '') + ' ' + item.name);
    label.position.set(0, h + 1.6, 0);
    label.scale.set(2.4, 0.55, 1);
    g.add(label);

    scene.add(g);
    return g;
  }

  // ---------- Starter houses (matched to her reference pics) ----------
  function addRemovableWall(parent, color, w, h, d, x, y, z, label) {
    const mesh = createBox(color, w, h, d, x, y, z);
    markRemovable(mesh, label || 'wall');
    parent.add(mesh);
    return mesh;
  }

  function addInteriorRooms(house, width, depth) {
    // Dollhouse interior walls like her wallpaper screenshot — removable
    addRemovableWall(house, 0xFFF8E7, 0.12, 2.2, depth * 0.85, 0, 1.2, 0, 'interior wall');
    for (let i = 0; i < 5; i++) {
      const stripe = createBox(i % 2 === 0 ? 0xF5E6C8 : 0xE8D5A3, 0.04, 2.0, depth * 0.8, -width * 0.22, 1.15, 0);
      markRemovable(stripe, 'wallpaper');
      house.add(stripe);
    }
    const fruitWall = createBox(0xFFF5EE, 0.04, 2.0, depth * 0.8, width * 0.22, 1.15, 0);
    markRemovable(fruitWall, 'wallpaper');
    house.add(fruitWall);
    for (let i = 0; i < 6; i++) {
      const fruit = createBox(0xFF8A65, 0.12, 0.12, 0.08, width * 0.22 + 0.06, 0.7 + (i % 3) * 0.5, -depth * 0.25 + Math.floor(i / 3) * 0.8);
      markRemovable(fruit, 'deco');
      house.add(fruit);
    }
    const wood = createBox(0xD7B899, width * 0.48, 0.06, depth * 0.9, -width * 0.24, 0.12, 0);
    markRemovable(wood, 'floor');
    house.add(wood);
    const carpet = createBox(0xA8D5C0, width * 0.48, 0.06, depth * 0.9, width * 0.24, 0.12, 0);
    markRemovable(carpet, 'carpet');
    house.add(carpet);
  }

  // House 1: White suburban home with porch, fence, sunflowers
  function buildStarterHouse1(x, y, z) {
    const house = new THREE.Group();
    house.position.set(x, y, z);
    house.add(createBox(0x7CB342, 10, 0.08, 9, 0, 0.02, 0));
    house.add(createBox(0x90A4AE, 1.2, 0.06, 4, 0, 0.06, 3));
    house.add(createBox(0xC8B59A, 7.2, 0.2, 5.5, 0, 0.12, 0));
    addRemovableWall(house, 0xF5F5F5, 7, 2.4, 0.18, 0, 1.35, -2.5, 'wall');
    addRemovableWall(house, 0xF5F5F5, 7, 2.4, 0.18, 0, 1.35, 2.5, 'wall');
    addRemovableWall(house, 0xF5F5F5, 0.18, 2.4, 5, -3.4, 1.35, 0, 'wall');
    addRemovableWall(house, 0xF5F5F5, 0.18, 2.4, 1.7, 3.4, 1.35, -1.5, 'wall');
    addRemovableWall(house, 0xF5F5F5, 0.18, 2.4, 1.7, 3.4, 1.35, 1.5, 'wall');
    addRemovableWall(house, 0xFAFAFA, 7, 2.2, 0.18, 0, 3.5, -2.5, 'wall');
    addRemovableWall(house, 0xFAFAFA, 7, 2.2, 0.18, 0, 3.5, 2.5, 'wall');
    addRemovableWall(house, 0xFAFAFA, 0.18, 2.2, 5, -3.4, 3.5, 0, 'wall');
    addRemovableWall(house, 0xFAFAFA, 0.18, 2.2, 5, 3.4, 3.5, 0, 'wall');
    const door = createBox(0xECEFF1, 0.12, 2.0, 1.0, 0, 1.1, 2.55);
    markRemovable(door, 'door');
    house.add(door);
    house.add(createBox(0x212121, 0.06, 0.06, 0.06, 0.35, 1.1, 2.62));
    [[-1.8, 1.5], [1.8, 1.5]].forEach((p) => {
      const frame = createBox(0xF9A825, 1.1, 1.5, 0.1, p[0], p[1], 2.55);
      markRemovable(frame, 'window');
      house.add(frame);
      house.add(createBox(0x81D4FA, 0.9, 1.3, 0.06, p[0], p[1], 2.58));
    });
    const uw = createBox(0xF9A825, 2.2, 0.9, 0.1, 1.2, 3.6, 2.55);
    markRemovable(uw, 'window');
    house.add(uw);
    house.add(createBox(0x81D4FA, 2.0, 0.7, 0.06, 1.2, 3.6, 2.58));
    const oct1 = createBox(0xF9A825, 0.7, 0.7, 0.1, -2.2, 3.7, 2.55);
    markRemovable(oct1, 'window');
    house.add(oct1);
    house.add(createBox(0x81D4FA, 0.5, 0.5, 0.06, -2.2, 3.7, 2.58));
    house.add(createBox(0x6D4C41, 7.6, 0.35, 5.8, 0, 4.75, 0));
    const sky = createBox(0x81D4FA, 2.2, 0.08, 2.0, 1.5, 4.95, 0.3);
    markRemovable(sky, 'skylight');
    house.add(sky);
    house.add(createBox(0x5D4037, 2.2, 0.15, 1.4, 0, 2.25, 3.1));
    house.add(createBox(0x8D6E63, 2.5, 0.15, 5, 4.2, 0.2, 0));
    house.add(createBox(0x6D4C41, 0.8, 0.4, 0.4, 4.2, 0.45, 1.2));
    for (let i = -4; i <= 4; i++) {
      house.add(createBox(0xFAFAFA, 0.12, 0.7, 0.12, i, 0.4, 4.3));
      if (i < 4) house.add(createBox(0xFAFAFA, 1.0, 0.08, 0.08, i + 0.5, 0.55, 4.3));
    }
    [[-3.5, 3.5], [-2.5, 3.8], [2.8, 3.6], [3.5, 3.2]].forEach((p) => {
      house.add(createBox(0x558B2F, 0.08, 0.9, 0.08, p[0], 0.5, p[1]));
      house.add(createBox(0xFDD835, 0.35, 0.35, 0.1, p[0], 1.0, p[1]));
      house.add(createBox(0x5D4037, 0.15, 0.15, 0.08, p[0], 1.0, p[1] + 0.05));
    });
    house.add(createBox(0x90A4AE, 0.06, 1.2, 0.06, -4.2, 0.7, 2));
    house.add(createBox(0x90A4AE, 0.06, 1.2, 0.06, -3.2, 0.7, 2));
    house.add(createBox(0xB0BEC5, 1.0, 0.04, 0.04, -3.7, 1.2, 2));
    house.add(createBox(0x42A5F5, 0.3, 0.4, 0.08, -3.9, 1.0, 2));
    house.add(createBox(0xEF5350, 0.3, 0.35, 0.08, -3.5, 1.0, 2));
    house.add(createCylinder(0x6D4C41, 0.2, 0.28, 2.2, 4.5, 1.2, -3, 6));
    house.add(createBox(0x43A047, 2.2, 2.0, 2.2, 4.5, 2.8, -3));
    addInteriorRooms(house, 6.5, 4.5);
    scene.add(house);
  }

  // House 2: Modern villa with pool, pergola, BBQ
  function buildStarterHouse2(x, y, z) {
    const house = new THREE.Group();
    house.position.set(x, y, z);
    house.add(createBox(0x78909C, 9, 0.25, 7, 0, 0.12, 0));
    house.add(createBox(0x90A4AE, 1.2, 0.15, 1.5, 0, 0.2, 3.5));
    house.add(createBox(0x6D4C41, 0.25, 0.7, 0.2, -3.8, 0.5, 3.2));
    addRemovableWall(house, 0x455A64, 8, 2.6, 0.2, 0, 1.5, -3, 'wall');
    addRemovableWall(house, 0x455A64, 8, 2.6, 0.2, 0, 1.5, 3, 'wall');
    addRemovableWall(house, 0x455A64, 0.2, 2.6, 6, -3.9, 1.5, 0, 'wall');
    addRemovableWall(house, 0x455A64, 0.2, 2.6, 2, 3.9, 1.5, -1.8, 'wall');
    addRemovableWall(house, 0x455A64, 0.2, 2.6, 2, 3.9, 1.5, 1.8, 'wall');
    addRemovableWall(house, 0xD7CCC8, 2.5, 2.4, 0.15, -2.5, 1.45, 3.05, 'wood wall');
    addRemovableWall(house, 0xD7CCC8, 2.5, 2.4, 0.15, 2.5, 4.2, 3.05, 'wood wall');
    [[-2.2, 1.4], [0, 1.4], [2.2, 1.4]].forEach((p) => {
      const win = createBox(0x212121, 1.1, 2.0, 0.08, p[0], p[1], 3.05);
      markRemovable(win, 'window');
      house.add(win);
      house.add(createBox(0x81D4FA, 0.95, 1.85, 0.05, p[0], p[1], 3.08));
    });
    const door = createBox(0x8D6E63, 0.12, 2.1, 1.1, 0, 1.2, 3.1);
    markRemovable(door, 'door');
    house.add(door);
    addRemovableWall(house, 0x546E7A, 8, 2.4, 0.2, 0, 4.0, -3, 'wall');
    addRemovableWall(house, 0x546E7A, 0.2, 2.4, 6, -3.9, 4.0, 0, 'wall');
    addRemovableWall(house, 0x546E7A, 0.2, 2.4, 6, 3.9, 4.0, 0, 'wall');
    house.add(createBox(0xECEFF1, 4, 0.15, 3.5, -1.5, 2.95, 1.5));
    const pool = createBox(0x4FC3F7, 2.2, 0.35, 1.6, -2.2, 2.9, 1.2);
    markRemovable(pool, 'pool');
    house.add(pool);
    house.add(createBox(0xAED581, 0.7, 0.12, 0.35, -2.2, 3.15, 1.2));
    house.add(createBox(0xF48FB1, 0.08, 0.5, 0.08, -1.2, 3.3, 2.0));
    house.add(createBox(0xF48FB1, 0.5, 0.08, 0.5, -1.2, 3.55, 2.0));
    house.add(createBox(0xFAFAFA, 0.7, 0.15, 1.4, 0.5, 3.1, 1.5));
    house.add(createBox(0xFAFAFA, 0.7, 0.15, 1.4, 1.5, 3.1, 1.5));
    [-0.5, 0.5, 1.5].forEach((px) => {
      house.add(createBox(0xA1887F, 0.12, 1.4, 0.12, px, 3.75, 0.5));
      house.add(createBox(0xA1887F, 0.12, 1.4, 0.12, px, 3.75, 2.5));
    });
    house.add(createBox(0xBCAAA4, 3.2, 0.1, 2.4, 0.5, 4.45, 1.5));
    house.add(createBox(0x78909C, 1.5, 0.12, 4, 4.5, 3.0, 0));
    const bbq = createBox(0x212121, 0.6, 0.5, 0.6, 4.5, 3.35, -1.2);
    markRemovable(bbq, 'bbq');
    house.add(bbq);
    house.add(createBox(0xFF9800, 0.25, 0.3, 0.25, 4.5, 3.7, -1.2));
    house.add(createBox(0x607D8B, 8.4, 0.25, 6.4, 0, 5.35, 0));
    house.add(createBox(0x78909C, 0.5, 1.0, 0.5, -2.5, 5.95, -1));
    house.add(createBox(0xB0BEC5, 0.08, 1.2, 0.08, 2.5, 6.0, 1));
    house.add(createBox(0xB0BEC5, 0.8, 0.05, 0.05, 2.5, 6.55, 1));
    addInteriorRooms(house, 7.5, 5.5);
    scene.add(house);
  }

  // House 3: Pink cute cafe house with bows & flowers
  function buildStarterHouse3(x, y, z) {
    const house = new THREE.Group();
    house.position.set(x, y, z);
    house.add(createBox(0xB0BEC5, 9, 0.12, 8, 0, 0.04, 0));
    house.add(createBox(0xFFF3E0, 7, 0.2, 5.5, 0, 0.15, 0));
    addRemovableWall(house, 0xFFF8E1, 7, 2.5, 0.18, 0, 1.4, -2.5, 'wall');
    addRemovableWall(house, 0xFFF8E1, 7, 2.5, 0.18, 0, 1.4, 2.5, 'wall');
    addRemovableWall(house, 0xFFF8E1, 0.18, 2.5, 5, -3.4, 1.4, 0, 'wall');
    addRemovableWall(house, 0xFFF8E1, 0.18, 2.5, 1.7, 3.4, 1.4, -1.5, 'wall');
    addRemovableWall(house, 0xFFF8E1, 0.18, 2.5, 1.7, 3.4, 1.4, 1.5, 'wall');
    [[-3.5, -2.5], [3.5, -2.5], [-3.5, 2.5], [3.5, 2.5]].forEach((p) => {
      house.add(createBox(0x81D4FA, 0.25, 5.2, 0.25, p[0], 2.7, p[1]));
    });
    addRemovableWall(house, 0xFFFDE7, 7, 2.3, 0.18, 0, 3.7, -2.5, 'wall');
    addRemovableWall(house, 0xFFFDE7, 7, 2.3, 0.18, 0, 3.7, 2.5, 'wall');
    addRemovableWall(house, 0xFFFDE7, 0.18, 2.3, 5, -3.4, 3.7, 0, 'wall');
    addRemovableWall(house, 0xFFFDE7, 0.18, 2.3, 5, 3.4, 3.7, 0, 'wall');
    const door = createBox(0xF48FB1, 0.12, 2.0, 1.1, 0, 1.15, 2.55);
    markRemovable(door, 'door');
    house.add(door);
    [[-2, 1.4], [2, 1.4]].forEach((p) => {
      const w = createBox(0xF8BBD0, 1.3, 1.4, 0.1, p[0], p[1], 2.55);
      markRemovable(w, 'window');
      house.add(w);
      house.add(createBox(0xB3E5FC, 1.1, 1.2, 0.06, p[0], p[1], 2.58));
    });
    [-2, 0, 2].forEach((wx) => {
      const w = createBox(0xF8BBD0, 0.9, 1.3, 0.1, wx, 3.7, 2.55);
      markRemovable(w, 'window');
      house.add(w);
      house.add(createBox(0x81D4FA, 0.7, 1.1, 0.06, wx, 3.7, 2.58));
    });
    house.add(createBox(0xFCE4EC, 4.5, 0.12, 1.2, 0, 2.35, 3.1));
    for (let i = 0; i < 8; i++) {
      house.add(createBox(i % 2 ? 0xF48FB1 : 0xFFFFFF, 0.5, 0.08, 1.1, -1.75 + i * 0.5, 2.35, 3.1));
    }
    for (let i = 0; i < 6; i++) {
      house.add(createBox(0xF48FB1, 0.35, 0.35, 0.35, -1.2 + i * 0.45, 2.6, 3.1));
    }
    [[-3.2, 2.8], [3.2, 2.8]].forEach((p) => {
      house.add(createBox(0xEC407A, 0.7, 0.35, 0.15, p[0], p[1], 2.6));
      house.add(createBox(0xEC407A, 0.25, 0.55, 0.15, p[0], p[1] - 0.35, 2.6));
    });
    house.add(createBox(0x90CAF9, 7.6, 1.4, 5.8, 0, 5.4, 0));
    house.add(createBox(0x64B5F6, 6.5, 0.2, 4.5, 0, 6.15, 0));
    [-1.8, 0, 1.8].forEach((wx) => {
      house.add(createBox(0xF8BBD0, 0.7, 0.7, 0.15, wx, 5.5, 2.7));
      house.add(createBox(0x81D4FA, 0.5, 0.5, 0.08, wx, 5.5, 2.75));
    });
    house.add(createBox(0x90A4AE, 0.6, 0.4, 0.6, -1.5, 6.45, 0));
    house.add(createBox(0xB0BEC5, 0.08, 1.0, 0.08, 1.5, 6.7, 0));
    house.add(createBox(0xFAFAFA, 1.5, 0.12, 2, 4.2, 3.5, 0));
    house.add(createBox(0xECEFF1, 0.08, 0.6, 2, 4.9, 3.8, 0));
    house.add(createBox(0xFFFDE7, 2, 0.15, 2, -4.5, 0.25, 1.5));
    house.add(createBox(0xFAFAFA, 0.5, 0.08, 0.5, -4.5, 0.55, 1.5));
    house.add(createBox(0xF48FB1, 0.35, 0.45, 0.35, -4.1, 0.55, 1.8));
    house.add(createBox(0x42A5F5, 0.7, 0.4, 0.15, -4.5, 0.4, 2.8));
    house.add(createBox(0xA1887F, 1.2, 0.8, 0.8, 2.5, 0.5, 4));
    house.add(createBox(0xF8BBD0, 1.3, 0.08, 0.9, 2.5, 1.0, 4));
    [[-5, -2], [5, -2]].forEach((p) => {
      house.add(createCylinder(0x6D4C41, 0.15, 0.2, 1.8, p[0], 1.0, p[1], 6));
      house.add(createBox(0xF8BBD0, 1.8, 1.6, 1.8, p[0], 2.3, p[1]));
    });
    for (let i = 0; i < 5; i++) {
      house.add(createBox(0xF8BBD0, 0.1, 0.6, 0.1, 4.5, 0.35, -2 + i * 0.8));
    }
    addInteriorRooms(house, 6.5, 4.5);
    scene.add(house);
  }

  function buildBarn(x, y, z) {
    const barn = new THREE.Group();
    barn.add(createBox(0xDC143C, 6, 4, 5, 0, 2, 0));
    barn.add(createBox(0x8B0000, 7, 0.3, 6, 0, 4.15, 0));
    barn.add(createBox(0xFFFFFF, 2, 2.5, 0.1, 0, 1.25, 2.55));
    barn.add(createBox(0x87CEEB, 1, 1, 0.1, -1.5, 2.5, 2.55));
    barn.add(createBox(0x87CEEB, 1, 1, 0.1, 1.5, 2.5, 2.55));
    barn.position.set(x, y, z);
    scene.add(barn);
  }

  function buildCottage(x, y, z) {
    const g = new THREE.Group();
    g.add(createBox(0xFFE0B2, 4, 2.2, 3.5, 0, 1.1, 0));
    g.add(createBox(0x6D4C41, 4.5, 0.2, 4, 0, 2.3, 0));
    g.add(createBox(0x5D4037, 0.9, 1.6, 0.1, 0, 0.9, 1.8));
    g.position.set(x, y, z);
    scene.add(g);
  }

  function buildTree(x, z) {
    const tree = new THREE.Group();
    tree.add(createCylinder(0x6D4C41, 0.2, 0.28, 2, 0, 1, 0, 6));
    tree.add(createBox(0x2E7D32, 2, 2, 2, 0, 2.8, 0));
    tree.add(createBox(0x43A047, 1.5, 1.5, 1.5, 0, 3.8, 0));
    tree.position.set(x, 0, z);
    scene.add(tree);
  }

  function makeLabelSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(8, 8, 240, 48, 12);
    else ctx.rect(8, 8, 240, 48);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.6, 0.4, 1);
    return sprite;
  }

  function spawnAnimals(count) {
    const types = ['dog', 'cat', 'horse', 'cow', 'pig', 'sheep', 'chicken', 'goat', 'capybara'];
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const animal = createAnimal(type);
      animal.position.set((Math.random() - 0.5) * 36, 0, (Math.random() - 0.5) * 36);
      animal.userData = {
        type,
        speed: 0.015 + Math.random() * 0.025,
        direction: Math.random() * Math.PI * 2,
        changeTimer: 0,
        hasSaddle: false,
        hasHarness: false,
        leashed: false,
        id: i
      };
      scene.add(animal);
      animals.push(animal);
    }
  }

  function createAnimal(type) {
    const g = new THREE.Group();
    g.name = type;
    const label = makeLabelSprite(type.charAt(0).toUpperCase() + type.slice(1));
    label.position.y = 2.4;
    g.add(label);

    if (type === 'horse') {
      // Bay horse from her photo: reddish-brown body, black mane/tail/legs, white star + hind socks, leather halter
      const bay = 0x8B4513;
      const bayDark = 0x6B3410;
      const black = 0x1A1A1A;
      const leather = 0x5D4037;
      const white = 0xF5F5F5;

      // Muscular body + barrel
      g.add(createBox(bay, 0.72, 0.78, 1.55, 0, 1.2, 0));
      g.add(createBox(bayDark, 0.65, 0.35, 0.7, 0, 1.45, -0.15)); // back / withers
      // Chest
      g.add(createBox(bay, 0.7, 0.65, 0.45, 0, 1.15, 0.7));
      // Neck (arched)
      const neck = createBox(bay, 0.36, 0.85, 0.4, 0, 1.75, 0.85);
      neck.rotation.x = -0.5;
      g.add(neck);
      // Head
      g.add(createBox(bay, 0.32, 0.32, 0.5, 0, 2.15, 1.25));
      g.add(createBox(bayDark, 0.28, 0.22, 0.35, 0, 2.0, 1.5)); // muzzle
      // White star / blaze on forehead
      g.add(createBox(white, 0.1, 0.16, 0.06, 0, 2.22, 1.48));
      // Nostrils + eyes
      g.add(createBox(0x3E2723, 0.06, 0.05, 0.04, -0.08, 1.98, 1.68));
      g.add(createBox(0x3E2723, 0.06, 0.05, 0.04, 0.08, 1.98, 1.68));
      g.add(createBox(black, 0.07, 0.07, 0.05, -0.14, 2.18, 1.4));
      g.add(createBox(black, 0.07, 0.07, 0.05, 0.14, 2.18, 1.4));
      // Ears
      g.add(createBox(bay, 0.09, 0.2, 0.08, -0.12, 2.4, 1.15));
      g.add(createBox(bay, 0.09, 0.2, 0.08, 0.12, 2.4, 1.15));
      // Black mane along neck
      g.add(createBox(black, 0.12, 0.7, 0.45, 0, 1.95, 0.75));
      g.add(createBox(black, 0.1, 0.25, 0.2, 0, 2.35, 1.15)); // forelock
      // Long black tail
      g.add(createBox(black, 0.14, 0.9, 0.14, 0, 1.15, -0.95));
      g.add(createBox(black, 0.18, 0.35, 0.18, 0, 0.65, -1.0));

      // Legs: black points; hind legs have white socks
      // Front left / front right (black)
      [[-0.26, 0.55], [0.26, 0.55]].forEach((p) => {
        g.add(createBox(bayDark, 0.16, 0.55, 0.16, p[0], 0.75, p[1]));
        g.add(createBox(black, 0.15, 0.5, 0.15, p[0], 0.3, p[1]));
        g.add(createBox(black, 0.18, 0.1, 0.2, p[0], 0.05, p[1])); // hoof
      });
      // Hind left / hind right (white socks)
      [[-0.26, -0.55], [0.26, -0.55]].forEach((p) => {
        g.add(createBox(bayDark, 0.17, 0.5, 0.17, p[0], 0.8, p[1]));
        g.add(createBox(white, 0.16, 0.45, 0.16, p[0], 0.35, p[1])); // sock
        g.add(createBox(black, 0.18, 0.1, 0.2, p[0], 0.05, p[1]));
      });

      // Leather halter (always on, like her photo)
      g.add(createBox(leather, 0.36, 0.06, 0.06, 0, 2.1, 1.35)); // noseband
      g.add(createBox(leather, 0.06, 0.28, 0.06, -0.16, 2.2, 1.3));
      g.add(createBox(leather, 0.06, 0.28, 0.06, 0.16, 2.2, 1.3));
      g.add(createBox(leather, 0.34, 0.05, 0.05, 0, 2.32, 1.2)); // browband
      g.add(createBox(leather, 0.05, 0.05, 0.35, -0.16, 2.15, 1.15)); // cheek
      g.add(createBox(leather, 0.05, 0.05, 0.35, 0.16, 2.15, 1.15));
      g.add(createBox(0xC0C0C0, 0.06, 0.06, 0.06, 0.18, 2.1, 1.4)); // buckle

      // Removable saddle + harness (hidden until equipped)
      const saddle = createBox(0x4E342E, 0.62, 0.22, 0.58, 0, 1.65, 0.05);
      saddle.visible = false; saddle.name = 'saddle'; g.add(saddle);
      const pad = createBox(0xA1887F, 0.7, 0.08, 0.7, 0, 1.52, 0.05);
      pad.visible = false; pad.name = 'saddlePad'; g.add(pad);
      const stirrupL = createBox(0x3E2723, 0.08, 0.4, 0.08, -0.42, 1.35, 0.05);
      stirrupL.visible = false; stirrupL.name = 'stirrupL'; g.add(stirrupL);
      const stirrupR = createBox(0x3E2723, 0.08, 0.4, 0.08, 0.42, 1.35, 0.05);
      stirrupR.visible = false; stirrupR.name = 'stirrupR'; g.add(stirrupR);
      const harness = createBox(leather, 0.4, 0.1, 0.55, 0, 2.0, 1.25);
      harness.visible = false; harness.name = 'harness'; g.add(harness);
      const rein = createBox(leather, 0.05, 0.05, 0.75, 0, 1.75, 0.7);
      rein.visible = false; rein.name = 'rein'; g.add(rein);
      label.position.y = 2.9;
    } else if (type === 'cow') {
      g.add(createBox(0xFFFAF0, 1.0, 0.8, 1.7, 0, 1.05, 0));
      g.add(createBox(0x212121, 0.4, 0.4, 0.4, 0.3, 1.2, 0.15));
      g.add(createBox(0x212121, 0.3, 0.3, 0.3, -0.3, 1.0, -0.3));
      g.add(createBox(0xFFFAF0, 0.5, 0.5, 0.6, 0, 1.45, 0.95));
      g.add(createBox(0xFFB6C1, 0.28, 0.22, 0.22, 0, 1.2, 1.25));
      g.add(createBox(0xFFF8E1, 0.1, 0.28, 0.1, -0.18, 1.8, 0.8));
      g.add(createBox(0xFFF8E1, 0.1, 0.28, 0.1, 0.18, 1.8, 0.8));
      [[-0.32, 0.42, 0.55], [0.32, 0.42, 0.55], [-0.32, 0.42, -0.55], [0.32, 0.42, -0.55]].forEach((p) => {
        g.add(createBox(0xFFFAF0, 0.2, 0.85, 0.2, p[0], p[1], p[2]));
      });
      g.add(createBox(0xFFB6C1, 0.35, 0.3, 0.25, 0, 0.75, -0.7));
    } else if (type === 'pig') {
      g.add(createBox(0xFFAB91, 0.8, 0.55, 1.15, 0, 0.6, 0));
      g.add(createBox(0xFFAB91, 0.45, 0.4, 0.4, 0, 0.75, 0.65));
      g.add(createBox(0xF48FB1, 0.25, 0.18, 0.18, 0, 0.65, 0.9));
      g.add(createBox(0xFFAB91, 0.12, 0.18, 0.08, -0.12, 1.0, 0.6));
      g.add(createBox(0xFFAB91, 0.12, 0.18, 0.08, 0.12, 1.0, 0.6));
      [[-0.25, 0.22, 0.35], [0.25, 0.22, 0.35], [-0.25, 0.22, -0.35], [0.25, 0.22, -0.35]].forEach((p) => {
        g.add(createBox(0xFFAB91, 0.16, 0.45, 0.16, p[0], p[1], p[2]));
      });
      g.add(createBox(0xF48FB1, 0.12, 0.12, 0.3, 0, 0.75, -0.65));
      label.position.y = 1.6;
    } else if (type === 'sheep') {
      g.add(createBox(0xFAFAFA, 0.95, 0.75, 1.2, 0, 0.85, 0));
      g.add(createBox(0xFAFAFA, 0.7, 0.5, 0.5, 0, 0.95, 0));
      g.add(createBox(0xD7CCC8, 0.42, 0.42, 0.42, 0, 0.9, 0.75));
      g.add(createBox(0xFFCCBC, 0.2, 0.15, 0.15, 0, 0.8, 0.98));
      [[-0.28, 0.28, 0.38], [0.28, 0.28, 0.38], [-0.28, 0.28, -0.38], [0.28, 0.28, -0.38]].forEach((p) => {
        g.add(createBox(0x5D4037, 0.14, 0.55, 0.14, p[0], p[1], p[2]));
      });
      label.position.y = 1.9;
    } else if (type === 'dog') {
      g.add(createBox(0xA1887F, 0.5, 0.42, 0.95, 0, 0.6, 0));
      g.add(createBox(0xA1887F, 0.38, 0.38, 0.42, 0, 0.82, 0.55));
      g.add(createBox(0x5D4037, 0.14, 0.28, 0.08, -0.14, 1.05, 0.5));
      g.add(createBox(0x5D4037, 0.14, 0.28, 0.08, 0.14, 1.05, 0.5));
      g.add(createBox(0xFFCCBC, 0.18, 0.12, 0.15, 0, 0.7, 0.78));
      [[-0.16, 0.25, 0.3], [0.16, 0.25, 0.3], [-0.16, 0.25, -0.3], [0.16, 0.25, -0.3]].forEach((p) => {
        g.add(createBox(0xA1887F, 0.13, 0.5, 0.13, p[0], p[1], p[2]));
      });
      const tail = createBox(0xA1887F, 0.1, 0.4, 0.1, 0, 0.85, -0.55);
      tail.rotation.x = 0.7; g.add(tail);
      label.position.y = 1.7;
    } else if (type === 'cat') {
      g.add(createBox(0xFFB74D, 0.38, 0.32, 0.7, 0, 0.42, 0));
      g.add(createBox(0xFFB74D, 0.32, 0.3, 0.32, 0, 0.58, 0.42));
      g.add(createBox(0xFFB74D, 0.1, 0.18, 0.08, -0.1, 0.8, 0.38));
      g.add(createBox(0xFFB74D, 0.1, 0.18, 0.08, 0.1, 0.8, 0.38));
      g.add(createBox(0xFFF3E0, 0.15, 0.1, 0.12, 0, 0.5, 0.58));
      g.add(createBox(0x212121, 0.06, 0.06, 0.04, -0.08, 0.62, 0.58));
      g.add(createBox(0x212121, 0.06, 0.06, 0.04, 0.08, 0.62, 0.58));
      [[-0.12, 0.16, 0.22], [0.12, 0.16, 0.22], [-0.12, 0.16, -0.22], [0.12, 0.16, -0.22]].forEach((p) => {
        g.add(createBox(0xFFB74D, 0.09, 0.32, 0.09, p[0], p[1], p[2]));
      });
      g.add(createBox(0xFFB74D, 0.08, 0.08, 0.5, 0, 0.6, -0.5));
      label.position.y = 1.4;
    } else if (type === 'chicken') {
      g.add(createBox(0xFAFAFA, 0.38, 0.38, 0.45, 0, 0.42, 0));
      g.add(createBox(0xFFECB3, 0.28, 0.28, 0.28, 0, 0.65, 0.22));
      g.add(createBox(0xE53935, 0.14, 0.14, 0.1, 0, 0.85, 0.22));
      g.add(createBox(0xFF9800, 0.1, 0.08, 0.14, 0, 0.58, 0.4));
      g.add(createBox(0xFFECB3, 0.08, 0.28, 0.08, -0.1, 0.18, 0));
      g.add(createBox(0xFFECB3, 0.08, 0.28, 0.08, 0.1, 0.18, 0));
      g.add(createBox(0xFFCC80, 0.25, 0.2, 0.1, 0, 0.45, -0.28));
      label.position.y = 1.3;
    } else if (type === 'goat') {
      g.add(createBox(0xE0E0E0, 0.6, 0.55, 1.1, 0, 0.75, 0));
      g.add(createBox(0xE0E0E0, 0.38, 0.38, 0.42, 0, 1.1, 0.6));
      g.add(createBox(0x8D6E63, 0.1, 0.35, 0.1, -0.14, 1.4, 0.55));
      g.add(createBox(0x8D6E63, 0.1, 0.35, 0.1, 0.14, 1.4, 0.55));
      g.add(createBox(0xFFCCBC, 0.2, 0.15, 0.18, 0, 0.95, 0.85));
      g.add(createBox(0xBDBDBD, 0.15, 0.25, 0.1, 0, 0.85, -0.6));
      [[-0.2, 0.32, 0.35], [0.2, 0.32, 0.35], [-0.2, 0.32, -0.35], [0.2, 0.32, -0.35]].forEach((p) => {
        g.add(createBox(0x9E9E9E, 0.14, 0.6, 0.14, p[0], p[1], p[2]));
      });
      label.position.y = 2.0;
    } else if (type === 'capybara') {
      g.add(createBox(0x8D6E63, 0.85, 0.5, 1.25, 0, 0.55, 0));
      g.add(createBox(0x8D6E63, 0.55, 0.45, 0.5, 0, 0.7, 0.7));
      g.add(createBox(0x6D4C41, 0.35, 0.2, 0.2, 0, 0.55, 0.95));
      g.add(createBox(0x212121, 0.08, 0.08, 0.05, -0.15, 0.8, 0.95));
      g.add(createBox(0x212121, 0.08, 0.08, 0.05, 0.15, 0.8, 0.95));
      [[-0.28, 0.22, 0.4], [0.28, 0.22, 0.4], [-0.28, 0.22, -0.4], [0.28, 0.22, -0.4]].forEach((p) => {
        g.add(createBox(0x6D4C41, 0.16, 0.42, 0.16, p[0], p[1], p[2]));
      });
      label.position.y = 1.5;
    }
    return g;
  }

  function updateAnimals() {
    animals.forEach((animal) => {
      const d = animal.userData;
      if (mountedHorse === animal) return;
      if (d.leashed && player) {
        const dx = player.position.x - animal.position.x;
        const dz = player.position.z - animal.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 2.2) {
          animal.position.x += (dx / dist) * 0.08;
          animal.position.z += (dz / dist) * 0.08;
          animal.rotation.y = Math.atan2(dx, dz);
        }
        return;
      }
      d.changeTimer++;
      if (d.changeTimer > 100 + Math.random() * 200) {
        d.direction += (Math.random() - 0.5) * 2;
        d.changeTimer = 0;
      }
      animal.position.x += Math.cos(d.direction) * d.speed;
      animal.position.z += Math.sin(d.direction) * d.speed;
      animal.rotation.y = -d.direction + Math.PI / 2;
      if (Math.abs(animal.position.x) > 28) d.direction += Math.PI;
      if (Math.abs(animal.position.z) > 28) d.direction += Math.PI;
      animal.position.y = Math.abs(Math.sin(Date.now() * 0.004 + d.id)) * 0.08;
    });
  }

  // ---------- Build mode ----------
  function toggleBuildMode() {
    if (gameState !== 'PLAYING' && gameState !== 'BUILD_MODE') return;
    buildMode = !buildMode;
    const menu = $('build-menu');
    const indicator = $('mode-indicator');
    const btn = $('btn-build-toggle');
    if (buildMode) {
      menu.classList.add('open');
      indicator.textContent = isTouchDevice ? 'BUILD — tap place, Remove button deletes' : 'BUILD MODE — click add, right-click remove';
      indicator.style.background = 'rgba(155,89,182,0.85)';
      btn.textContent = 'Done Building';
      gameState = 'BUILD_MODE';
      document.exitPointerLock && document.exitPointerLock();
      createBuildGhost();
      const rem = $('touch-remove');
      if (rem) rem.classList.add('show');
    } else {
      menu.classList.remove('open');
      indicator.textContent = 'PLAY MODE';
      indicator.style.background = 'rgba(0,0,0,0.55)';
      btn.textContent = 'Build Mode';
      gameState = 'PLAYING';
      removeBuildGhost();
      const rem = $('touch-remove');
      if (rem) rem.classList.remove('show');
    }
  }

  function createBuildGhost() {
    removeBuildGhost();
    buildGhost = createBuildObject(selectedBuildItem, true);
    if (buildGhost) scene.add(buildGhost);
  }

  function removeBuildGhost() {
    if (buildGhost) {
      scene.remove(buildGhost);
      buildGhost = null;
    }
  }

  function updateBuildGhost() {
    if (!buildMode) return;
    createBuildGhost();
  }

  function createBuildObject(type, isGhost) {
    const group = new THREE.Group();
    const opacity = isGhost ? 0.45 : 1.0;
    const mat = (color) => new THREE.MeshLambertMaterial({ color, transparent: isGhost, opacity });
    switch (type) {
      case 'wall':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 0.2), mat(0xF5F5DC)));
        break;
      case 'wallStripe':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 0.15), mat(0xF5E6C8)));
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.5, 0.16), mat(0xE8D5A3)));
        group.children[1].position.x = -0.5;
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.5, 0.16), mat(0xE8D5A3)));
        group.children[2].position.x = 0.5;
        break;
      case 'wallFruit':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 0.15), mat(0xFFF5EE)));
        [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.4], [0.5, -0.4]].forEach((p, i) => {
          const fruit = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.1), mat(0xFF8A65));
          fruit.position.set(p[0], p[1], 0.08);
          group.add(fruit);
        });
        break;
      case 'floor':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 2), mat(0xD2691E)));
        break;
      case 'floorGreen':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 2), mat(0xA8D5C0)));
        break;
      case 'window':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.15), mat(0x87CEEB)));
        break;
      case 'door':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.15), mat(0x8B4513)));
        break;
      case 'bed':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 2.2), mat(0xFF6B6B)));
        group.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.4), mat(0xFFFFFF)));
        group.children[1].position.z = -0.9;
        break;
      case 'table':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1), mat(0x8B4513)));
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), mat(0x8B4513)));
        group.children[1].position.y = -0.4;
        break;
      case 'chair':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), mat(0x4ECDC4)));
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.1), mat(0x4ECDC4)));
        group.children[1].position.set(0, 0.3, -0.2);
        break;
      case 'fridge':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.8), mat(0xC0C0C0)));
        break;
      case 'sink':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.6), mat(0xFFFFFF)));
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.4), mat(0xFFFFFF)));
        group.children[1].position.y = 0.25;
        break;
      case 'tub':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.8), mat(0xFFFFFF)));
        break;
      case 'tv':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.1), mat(0x333333)));
        group.add(new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 0.05), mat(0x87CEEB)));
        group.children[1].position.z = 0.03;
        break;
      case 'plant':
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat(0x8B4513)));
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), mat(0x228B22)));
        group.children[1].position.y = 0.45;
        break;
      default:
        return null;
    }
    group.children.forEach((c) => {
      c.castShadow = !isGhost;
      c.receiveShadow = !isGhost;
    });
    group.userData.buildType = type;
    return group;
  }

  function placeBuildObject() {
    if (!buildGhost) return;
    const obj = createBuildObject(selectedBuildItem, false);
    if (!obj) return;
    obj.position.copy(buildGhost.position);
    obj.rotation.copy(buildGhost.rotation);
    obj.userData.removable = true;
    obj.userData.buildLabel = selectedBuildItem;
    // Mark children too for raycasting
    obj.traverse((c) => {
      if (c.isMesh) {
        c.userData.removable = true;
        c.userData.rootObject = obj;
      }
    });
    scene.add(obj);
    placedObjects.push(obj);
    removableParts.push(obj);
    for (let i = 0; i < 6; i++) {
      const p = createBox(0xFFD700, 0.08, 0.08, 0.08, obj.position.x + (Math.random() - 0.5), obj.position.y + 1, obj.position.z + (Math.random() - 0.5));
      p.userData = { vel: new THREE.Vector3((Math.random() - 0.5) * 0.1, Math.random() * 0.15, (Math.random() - 0.5) * 0.1), life: 1 };
      scene.add(p);
      particles.push(p);
    }
    toast('Placed ' + selectedBuildItem + '!');
  }

  function updateBuildGhostPosition() {
    if (!buildGhost) return;
    mouseVector.x = (mouse.x / window.innerWidth) * 2 - 1;
    mouseVector.y = -(mouse.y / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouseVector, camera);
    const intersects = raycaster.intersectObject(groundPlane);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      buildGhost.position.x = Math.round(point.x / 2) * 2;
      buildGhost.position.z = Math.round(point.z / 2) * 2;
      buildGhost.position.y = 0;
      if (selectedBuildItem === 'window' || selectedBuildItem === 'door' || selectedBuildItem === 'wall' || selectedBuildItem === 'wallStripe' || selectedBuildItem === 'wallFruit') {
        buildGhost.position.y = 1.25;
      }
    }
  }

  function tryRemoveAtMouse() {
    mouseVector.x = (mouse.x / window.innerWidth) * 2 - 1;
    mouseVector.y = -(mouse.y / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouseVector, camera);

    const targets = [];
    removableParts.forEach((obj) => {
      if (!obj) return;
      obj.traverse((c) => {
        if (c.isMesh) targets.push(c);
      });
      if (obj.isMesh) targets.push(obj);
    });

    const hits = raycaster.intersectObjects(targets, true);
    if (!hits.length) {
      toast('Nothing to remove here');
      return;
    }
    let mesh = hits[0].object;
    // Prefer root placed object
    let root = mesh.userData.rootObject || mesh;
    while (root.parent && root.parent !== scene && !root.userData.removable && !root.userData.buildType) {
      root = root.parent;
    }
    if (mesh.userData.removable || root.userData.removable || root.userData.buildType) {
      const toRemove = mesh.userData.rootObject || (mesh.userData.removable ? mesh : root);
      // If it's a child wall of a house, remove just that mesh
      if (toRemove.parent && toRemove.parent !== scene && toRemove.userData.removable && !toRemove.userData.buildType) {
        toRemove.parent.remove(toRemove);
        removableParts = removableParts.filter((p) => p !== toRemove);
        toast('Removed ' + (toRemove.userData.buildLabel || 'piece') + '!');
      } else {
        scene.remove(toRemove);
        placedObjects = placedObjects.filter((p) => p !== toRemove);
        removableParts = removableParts.filter((p) => p !== toRemove);
        toast('Removed ' + (toRemove.userData.buildLabel || toRemove.userData.buildType || 'piece') + '!');
      }
    }
  }

  // ---------- Interact: leash, saddle, ride ----------
  function nearestAnimal(maxDist) {
    if (!player) return null;
    let best = null;
    let bestD = maxDist;
    animals.forEach((a) => {
      const dx = a.position.x - player.position.x;
      const dz = a.position.z - player.position.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    });
    return best;
  }

  function interact() {
    if (mountedHorse) {
      // Dismount
      player.position.copy(mountedHorse.position);
      player.position.x += 1.5;
      player.visible = true;
      mountedHorse = null;
      toast('Dismounted');
      return;
    }

    const animal = nearestAnimal(3.5);
    if (!animal) {
      toast('Nothing nearby to interact with');
      return;
    }

    const type = animal.userData.type;

    // Leash
    if (equippedItem === 'leash' && (playerData.inventory.leash || 0) > 0) {
      animal.userData.leashed = !animal.userData.leashed;
      if (animal.userData.leashed) {
        leashedAnimals.push(animal);
        toast('Leashed the ' + type + '!');
      } else {
        leashedAnimals = leashedAnimals.filter((a) => a !== animal);
        toast('Released the ' + type);
      }
      return;
    }

    if (type === 'horse') {
      if (equippedItem === 'saddle') {
        animal.userData.hasSaddle = !animal.userData.hasSaddle;
        ['saddle', 'saddlePad', 'stirrupL', 'stirrupR'].forEach((n) => {
          const part = animal.getObjectByName(n);
          if (part) part.visible = animal.userData.hasSaddle;
        });
        toast(animal.userData.hasSaddle ? 'Saddle on! Press E again to ride.' : 'Saddle removed');
        return;
      }
      if (equippedItem === 'harness') {
        animal.userData.hasHarness = !animal.userData.hasHarness;
        ['harness', 'rein'].forEach((n) => {
          const part = animal.getObjectByName(n);
          if (part) part.visible = animal.userData.hasHarness;
        });
        toast(animal.userData.hasHarness ? 'Harness on!' : 'Harness removed');
        return;
      }
      if (animal.userData.hasSaddle) {
        mountedHorse = animal;
        player.visible = false;
        toast('Riding! WASD to steer, E to dismount');
        return;
      }
      toast('Equip a saddle in Inventory (I), then press E near the horse');
      return;
    }

    toast('That\'s a ' + type + '!');
  }

  function exitToMenu() {
    if (document.pointerLockElement) document.exitPointerLock();
    buildMode = false;
    removeBuildGhost();
    clearWorld();
    // Keep empty scene with lights for menu idle
    addLights();
    groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshBasicMaterial({ visible: false }));
    groundPlane.rotation.x = -Math.PI / 2;
    scene.add(groundPlane);
    $('game-ui').classList.remove('active');
    $('touch-controls').classList.remove('active');
    showMainMenu();
  }

  // ---------- Controls ----------
  function setupTouchControls() {
    const zone = $('joystick-zone');
    const knob = $('joystick-knob');
    if (!zone || !knob) return;

    let joyId = null;
    const maxR = 42;

    function setKnob(dx, dy) {
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const clamped = Math.min(len, maxR);
      const nx = (dx / len) * clamped;
      const ny = (dy / len) * clamped;
      knob.style.transform = 'translate(calc(-50% + ' + nx + 'px), calc(-50% + ' + ny + 'px))';
      touchMove.x = nx / maxR;
      touchMove.y = ny / maxR;
      touchMove.active = Math.abs(touchMove.x) > 0.08 || Math.abs(touchMove.y) > 0.08;
    }

    function resetKnob() {
      knob.style.transform = 'translate(-50%, -50%)';
      touchMove.x = 0;
      touchMove.y = 0;
      touchMove.active = false;
      joyId = null;
    }

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      joyId = t.identifier;
      const rect = zone.getBoundingClientRect();
      setKnob(t.clientX - (rect.left + rect.width / 2), t.clientY - (rect.top + rect.height / 2));
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== joyId) continue;
        const rect = zone.getBoundingClientRect();
        setKnob(t.clientX - (rect.left + rect.width / 2), t.clientY - (rect.top + rect.height / 2));
      }
    }, { passive: false });

    const endJoy = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joyId) resetKnob();
      }
    };
    zone.addEventListener('touchend', endJoy);
    zone.addEventListener('touchcancel', endJoy);

    function isUiTouchTarget(el) {
      if (!el || !el.closest) return false;
      return !!el.closest('.joystick-zone, .touch-actions, .hud-actions, .build-menu, #inventory-panel, .hud-btn, .touch-btn, .build-item, .inv-slot');
    }

    const canvasHost = $('canvas-container');
    canvasHost.addEventListener('touchstart', (e) => {
      if (gameState !== 'PLAYING' && gameState !== 'BUILD_MODE') return;
      const t = e.changedTouches[0];
      if (isUiTouchTarget(document.elementFromPoint(t.clientX, t.clientY))) return;
      if (t.identifier === joyId) return;
      // Right half or any non-joystick area = look / build place
      mouse.x = t.clientX;
      mouse.y = t.clientY;
      if (gameState === 'BUILD_MODE') {
        updateBuildGhostPosition();
        placeBuildObject();
        return;
      }
      touchLookId = t.identifier;
      touchLookLast = { x: t.clientX, y: t.clientY };
    }, { passive: true });

    canvasHost.addEventListener('touchmove', (e) => {
      if (touchLookId == null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== touchLookId) continue;
        if (touchLookLast) {
          cameraAngle -= (t.clientX - touchLookLast.x) * 0.005;
          cameraHeight = Math.max(3, Math.min(12, cameraHeight - (t.clientY - touchLookLast.y) * 0.02));
        }
        touchLookLast = { x: t.clientX, y: t.clientY };
        mouse.x = t.clientX;
        mouse.y = t.clientY;
        if (gameState === 'BUILD_MODE') updateBuildGhostPosition();
      }
    }, { passive: true });

    const endLook = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchLookId) {
          touchLookId = null;
          touchLookLast = null;
        }
      }
    };
    canvasHost.addEventListener('touchend', endLook);
    canvasHost.addEventListener('touchcancel', endLook);

    $('touch-jump').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!buildMode && !mountedHorse && player && player.position.y <= 0.1) {
        player.userData.jumpVel = 0.3;
      }
    }, { passive: false });

    $('touch-interact').addEventListener('touchstart', (e) => {
      e.preventDefault();
      interact();
    }, { passive: false });

    const runBtn = $('touch-run');
    const setRun = (on) => { touchRunning = on; runBtn.style.outline = on ? '3px solid #fff' : 'none'; };
    runBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setRun(true); }, { passive: false });
    runBtn.addEventListener('touchend', () => setRun(false));
    runBtn.addEventListener('touchcancel', () => setRun(false));

    $('touch-remove').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (gameState === 'BUILD_MODE') tryRemoveAtMouse();
    }, { passive: false });
  }

  function getMoveVector(baseSpeed) {
    let moveX = 0, moveZ = 0;
    const speed = (keys['shift'] || touchRunning) ? baseSpeed * 1.9 : baseSpeed;
    if (keys['w'] || keys['arrowup']) { moveX -= Math.sin(cameraAngle) * speed; moveZ -= Math.cos(cameraAngle) * speed; }
    if (keys['s'] || keys['arrowdown']) { moveX += Math.sin(cameraAngle) * speed; moveZ += Math.cos(cameraAngle) * speed; }
    if (keys['a'] || keys['arrowleft']) { moveX -= Math.cos(cameraAngle) * speed; moveZ += Math.sin(cameraAngle) * speed; }
    if (keys['d'] || keys['arrowright']) { moveX += Math.cos(cameraAngle) * speed; moveZ -= Math.sin(cameraAngle) * speed; }
    if (touchMove.active) {
      // joystick: up = forward
      moveX += (-touchMove.y * Math.sin(cameraAngle) + touchMove.x * Math.cos(cameraAngle)) * speed;
      moveZ += (-touchMove.y * Math.cos(cameraAngle) - touchMove.x * Math.sin(cameraAngle)) * speed;
    }
    return { moveX, moveZ };
  }

  function setupControls() {
    document.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
      if ((gameState === 'PLAYING' || gameState === 'BUILD_MODE') && e.code === 'Space') {
        e.preventDefault();
        if (!buildMode && !mountedHorse && player && player.position.y <= 0.1) {
          player.userData.jumpVel = 0.3;
        }
      }
      if ((gameState === 'PLAYING' || gameState === 'BUILD_MODE') && e.key.toLowerCase() === 'b') toggleBuildMode();
      if ((gameState === 'PLAYING' || gameState === 'BUILD_MODE') && e.key.toLowerCase() === 'i') toggleInventory();
      if ((gameState === 'PLAYING' || gameState === 'BUILD_MODE') && e.key.toLowerCase() === 'e') interact();
      if ((gameState === 'PLAYING' || gameState === 'BUILD_MODE') && e.key === 'Escape') exitToMenu();
    });
    document.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
    });
    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (gameState === 'PLAYING' && document.pointerLockElement) {
        cameraAngle -= e.movementX * 0.002;
      }
      if (gameState === 'BUILD_MODE') updateBuildGhostPosition();
    });
    document.addEventListener('mousedown', (e) => {
      mouse.down = true;
      if (gameState === 'PLAYING' && e.target.tagName === 'CANVAS' && !isTouchDevice) {
        document.body.requestPointerLock();
      }
      if (gameState === 'BUILD_MODE') {
        if (e.button === 0) placeBuildObject();
        if (e.button === 2) {
          e.preventDefault();
          tryRemoveAtMouse();
        }
      }
    });
    document.addEventListener('contextmenu', (e) => {
      if (gameState === 'BUILD_MODE') e.preventDefault();
    });
    document.addEventListener('mouseup', () => { mouse.down = false; });
    document.addEventListener('wheel', (e) => {
      if (gameState === 'PLAYING' || gameState === 'BUILD_MODE') {
        cameraDistance = Math.max(3, Math.min(20, cameraDistance + e.deltaY * 0.01));
      }
    });
  }

  function updatePlayer() {
    if (!player || (gameState !== 'PLAYING' && gameState !== 'BUILD_MODE')) return;

    if (mountedHorse) {
      const { moveX, moveZ } = getMoveVector(0.12);
      mountedHorse.position.x += moveX;
      mountedHorse.position.z += moveZ;
      if (moveX !== 0 || moveZ !== 0) mountedHorse.rotation.y = Math.atan2(moveX, moveZ);
      player.position.copy(mountedHorse.position);
      player.position.y = 1.6;
      return;
    }

    if (buildMode) {
      if (isTouchDevice) updateBuildGhostPosition();
      return;
    }

    const { moveX, moveZ } = getMoveVector(0.08);
    player.position.x += moveX;
    player.position.z += moveZ;
    if (moveX !== 0 || moveZ !== 0) player.rotation.y = Math.atan2(moveX, moveZ) + Math.PI;

    if (!player.userData.jumpVel) player.userData.jumpVel = 0;
    player.position.y += player.userData.jumpVel;
    player.userData.jumpVel -= 0.015;
    if (player.position.y < 0) {
      player.position.y = 0;
      player.userData.jumpVel = 0;
    }

    const isMoving = moveX !== 0 || moveZ !== 0;
    const time = Date.now() * 0.01;
    if (player.children.length >= 8) {
      if (isMoving && player.position.y <= 0.1) {
        player.children[4].rotation.x = Math.sin(time * 2) * 0.5;
        player.children[5].rotation.x = -Math.sin(time * 2) * 0.5;
        player.children[6].rotation.x = Math.sin(time * 2 + Math.PI) * 0.4;
        player.children[7].rotation.x = Math.sin(time * 2) * 0.4;
      } else {
        player.children[4].rotation.x = Math.sin(time) * 0.1;
        player.children[5].rotation.x = -Math.sin(time) * 0.1;
        player.children[6].rotation.x = 0;
        player.children[7].rotation.x = 0;
      }
    }
  }

  function updateCamera() {
    if (!player || (gameState !== 'PLAYING' && gameState !== 'BUILD_MODE')) return;
    const target = mountedHorse || player;
    const targetX = target.position.x - Math.sin(cameraAngle) * cameraDistance;
    const targetZ = target.position.z - Math.cos(cameraAngle) * cameraDistance;
    camera.position.x += (targetX - camera.position.x) * 0.1;
    camera.position.z += (targetZ - camera.position.z) * 0.1;
    camera.position.y += ((target.position.y + cameraHeight) - camera.position.y) * 0.1;
    camera.lookAt(target.position.x, target.position.y + 1, target.position.z);
  }

  function updateParticles() {
    particles = particles.filter((p) => {
      if (p.userData.vel) {
        p.position.add(p.userData.vel);
        p.userData.vel.y -= 0.01;
      }
      p.userData.life -= 0.03;
      p.scale.setScalar(Math.max(0.01, p.userData.life));
      if (p.userData.life <= 0) {
        scene.remove(p);
        return false;
      }
      return true;
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    if (gameState === 'CHAR_CREATOR' && previewRenderer) {
      if (previewCharacter) previewCharacter.rotation.y += 0.01;
      previewRenderer.render(previewScene, previewCamera);
    }
    if (gameState === 'PLAYING' || gameState === 'BUILD_MODE') {
      updatePlayer();
      updateCamera();
      updateAnimals();
      updateParticles();
      renderer.render(scene, camera);
    }
  }

  window.addEventListener('resize', () => {
    const container = $('canvas-container');
    if (!container || !camera || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    if (previewCamera && previewRenderer) {
      const previewDiv = $('creator-preview');
      if (previewDiv && previewDiv.clientWidth > 0) {
        previewCamera.aspect = previewDiv.clientWidth / previewDiv.clientHeight;
        previewCamera.updateProjectionMatrix();
        previewRenderer.setSize(previewDiv.clientWidth, previewDiv.clientHeight);
      }
    }
  });

  init();
})();
