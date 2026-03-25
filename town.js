(function() {
  'use strict';

  var WORLD_W = 2400;
  var WORLD_H = 1700;
  var AVATAR_SIZE = 24;
  var AVATAR_SPEED = 200;
  var INTERACT_DIST = 52;

  var BUILDINGS = [
    { id: 'mining_hq',    name: 'Mining HQ',      emoji: '\u26CF\uFE0F', x: 128,  y: 128,  w: 256, h: 192, color: '#f7931a', panelType: 'mine' },
    { id: 'hardware',     name: 'Hardware Shop',   emoji: '\u{1F527}',    x: 576,  y: 128,  w: 192, h: 192, color: '#4a9eff', panelType: 'hardware' },
    { id: 'exchange',     name: 'Exchange',        emoji: '\u{1F4C8}',    x: 960,  y: 128,  w: 192, h: 128, color: '#00d4aa', panelType: 'exchange' },
    { id: 'bank',         name: 'Bank',            emoji: '\u{1F3E6}',    x: 1344, y: 128,  w: 256, h: 192, color: '#ffd700', panelType: 'bank' },
    { id: 'diner',        name: 'Diner',           emoji: '\u{1F354}',    x: 128,  y: 448,  w: 192, h: 128, color: '#ff6b6b', panelType: 'diner' },
    { id: 'coffee',       name: 'Coffee Shop',     emoji: '\u2615',       x: 576,  y: 448,  w: 128, h: 128, color: '#8B5E3C', panelType: 'coffee' },
    { id: 'university',   name: 'University',      emoji: '\u{1F393}',    x: 960,  y: 448,  w: 256, h: 192, color: '#a855f7', panelType: 'university' },
    { id: 'hospital',     name: 'Hospital',        emoji: '\u{1F3E5}',    x: 1344, y: 448,  w: 192, h: 192, color: '#ff4466', panelType: 'hospital' },
    { id: 'internet_cafe',name: 'Internet Cafe',   emoji: '\u{1F310}',    x: 128,  y: 768,  w: 192, h: 128, color: '#4af7d4', panelType: 'internet_cafe' },
    { id: 'casino',       name: 'Casino',          emoji: '\u{1F3B0}',    x: 576,  y: 768,  w: 256, h: 192, color: '#ff00ff', panelType: 'casino' },
    { id: 'post_office',  name: 'Post Office',     emoji: '\u{1F4EC}',    x: 960,  y: 768,  w: 192, h: 128, color: '#8888aa', panelType: 'post_office' },
    { id: 'gym',          name: 'Gym',             emoji: '\u{1F4AA}',    x: 1344, y: 768,  w: 192, h: 128, color: '#ff8800', panelType: 'gym' },
    { id: 'real_estate',  name: 'Real Estate',     emoji: '\u{1F3E0}',    x: 128,  y: 1088, w: 192, h: 128, color: '#44aa44', panelType: 'real_estate' },
    { id: 'car_dealer',   name: 'Car Dealership',  emoji: '\u{1F697}',    x: 576,  y: 1088, w: 256, h: 128, color: '#aaaacc', panelType: 'car_dealer' },
    { id: 'pet_shop',     name: 'Pet Shop',        emoji: '\u{1F43E}',    x: 960,  y: 1088, w: 128, h: 128, color: '#ffaacc', panelType: 'pet_shop' },
    { id: 'pawn_shop',    name: 'Pawn Shop',       emoji: '\u{1F48D}',    x: 1344, y: 1088, w: 128, h: 128, color: '#aa8833', panelType: 'pawn_shop' },
    { id: 'utility',      name: 'Utility Co.',     emoji: '\u26A1',       x: 128,  y: 1408, w: 192, h: 128, color: '#66aaff', panelType: 'utility' },
    { id: 'apartment',    name: 'Studio Apt.',     emoji: '\u{1F6CF}\uFE0F', x: 960, y: 1408, w: 128, h: 128, color: '#555577', panelType: 'apartment' },
  ];

  // Road definitions
  var H_ROADS = [
    { y: 330, h: 50 },
    { y: 650, h: 50 },
    { y: 970, h: 50 },
    { y: 1290, h: 50 },
  ];
  var V_ROADS = [
    { x: 448, w: 50 },
    { x: 832, w: 50 },
    { x: 1216, w: 50 },
  ];

  // ── Helpers ──
  function hexToRGB(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return {
      r: parseInt(hex.substring(0,2), 16) / 255,
      g: parseInt(hex.substring(2,4), 16) / 255,
      b: parseInt(hex.substring(4,6), 16) / 255
    };
  }

  function makeTextSprite(text, opts) {
    opts = opts || {};
    var fontSize = opts.fontSize || 48;
    var color = opts.color || '#e8e8f0';
    var bold = opts.bold !== false;

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var font = (bold ? 'bold ' : '') + fontSize + 'px -apple-system, system-ui, sans-serif';
    ctx.font = font;
    var metrics = ctx.measureText(text);
    var tw = Math.ceil(metrics.width) + 16;
    var th = fontSize + 16;
    // Power-of-two sizing for texture
    canvas.width = nextPow2(tw);
    canvas.height = nextPow2(th);

    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    var tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(canvas.width / 4, canvas.height / 4, 1);
    sprite._canvasEl = canvas;
    return sprite;
  }

  function makeEmojiSprite(emoji, size) {
    size = size || 64;
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');
    ctx.font = size + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 64);

    var tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(32, 32, 1);
    return sprite;
  }

  function nextPow2(v) {
    v--;
    v |= v >> 1; v |= v >> 2; v |= v >> 4; v |= v >> 8; v |= v >> 16;
    return v + 1;
  }

  // ── Road Pathfinding ──
  // Build waypoint graph from road intersections + building entrances
  var ROAD_CENTERS_H = H_ROADS.map(function(r) { return r.y + r.h / 2; });
  var ROAD_CENTERS_V = V_ROADS.map(function(r) { return r.x + r.w / 2; });

  // Waypoints: all road intersections + road endpoints
  var WAYPOINTS = [];
  // Road intersections
  for (var hi = 0; hi < ROAD_CENTERS_H.length; hi++) {
    // Add endpoints on horizontal roads
    WAYPOINTS.push({ x: 20, y: ROAD_CENTERS_H[hi] });
    WAYPOINTS.push({ x: WORLD_W - 20, y: ROAD_CENTERS_H[hi] });
    for (var vi = 0; vi < ROAD_CENTERS_V.length; vi++) {
      WAYPOINTS.push({ x: ROAD_CENTERS_V[vi], y: ROAD_CENTERS_H[hi] });
      if (hi === 0) {
        WAYPOINTS.push({ x: ROAD_CENTERS_V[vi], y: 20 });
        WAYPOINTS.push({ x: ROAD_CENTERS_V[vi], y: WORLD_H - 20 });
      }
    }
  }

  function findNearestRoadPoint(px, py) {
    // Find nearest point on road grid
    var bestDist = Infinity, bestX = px, bestY = py;
    // Check horizontal roads
    for (var i = 0; i < ROAD_CENTERS_H.length; i++) {
      var d = Math.abs(py - ROAD_CENTERS_H[i]);
      if (d < bestDist) { bestDist = d; bestX = px; bestY = ROAD_CENTERS_H[i]; }
    }
    // Check vertical roads
    for (var j = 0; j < ROAD_CENTERS_V.length; j++) {
      var d2 = Math.abs(px - ROAD_CENTERS_V[j]);
      if (d2 < bestDist) { bestDist = d2; bestX = ROAD_CENTERS_V[j]; bestY = py; }
    }
    return { x: bestX, y: bestY };
  }

  function findPath(sx, sy, ex, ey) {
    // Simple waypoint path: go to nearest road, travel along roads, exit to destination
    var startRoad = findNearestRoadPoint(sx, sy);
    var endRoad = findNearestRoadPoint(ex, ey);
    var path = [];

    // Step 1: walk to nearest road
    if (Math.abs(sx - startRoad.x) > 5 || Math.abs(sy - startRoad.y) > 5) {
      path.push(startRoad);
    }

    // Step 2: navigate on road grid (L-shaped: first horizontal, then vertical, or vice versa)
    // Try both orderings, pick the one that doesn't cut through buildings
    var midA = { x: endRoad.x, y: startRoad.y }; // go horizontal first
    var midB = { x: startRoad.x, y: endRoad.y }; // go vertical first

    // Use whichever intermediate point is closer to a road center
    var useA = isOnRoad(midA.x, midA.y);
    var useB = isOnRoad(midB.x, midB.y);
    if (useA) {
      path.push(midA);
    } else if (useB) {
      path.push(midB);
    } else {
      // Find nearest intersection as intermediate
      var bestWp = null, bestD = Infinity;
      for (var w = 0; w < WAYPOINTS.length; w++) {
        var wp = WAYPOINTS[w];
        var d = Math.abs(wp.x - startRoad.x) + Math.abs(wp.y - startRoad.y) +
                Math.abs(wp.x - endRoad.x) + Math.abs(wp.y - endRoad.y);
        if (d < bestD) { bestD = d; bestWp = wp; }
      }
      if (bestWp) path.push(bestWp);
    }

    // Step 3: go to road point near destination
    if (Math.abs(endRoad.x - (path.length > 0 ? path[path.length-1].x : sx)) > 5 ||
        Math.abs(endRoad.y - (path.length > 0 ? path[path.length-1].y : sy)) > 5) {
      path.push(endRoad);
    }

    // Step 4: walk to destination
    path.push({ x: ex, y: ey });
    return path;
  }

  function isOnRoad(px, py) {
    for (var i = 0; i < H_ROADS.length; i++) {
      if (py >= H_ROADS[i].y && py <= H_ROADS[i].y + H_ROADS[i].h) return true;
    }
    for (var j = 0; j < V_ROADS.length; j++) {
      if (px >= V_ROADS[j].x && px <= V_ROADS[j].x + V_ROADS[j].w) return true;
    }
    return false;
  }

  // ── Town Object ──
  var Town = {
    canvas: null,
    camera: { x: 0, y: 0 },
    nearbyBuilding: null,
    moveTarget: null,
    _pathWaypoints: null, // Array of {x,y} waypoints for road navigation
    autoEnterBuilding: null,
    BUILDINGS: BUILDINGS,

    // Three.js objects
    _renderer: null,
    _scene: null,
    _camera3: null,
    _raycaster: null,
    _groundPlane: null,
    _avatarGroup: null,
    _avatarBody: null,
    _avatarHead: null,
    _avatarNameSprite: null,
    _moveTargetMesh: null,
    _promptSprite: null,
    _buildingMeshes: [],
    _buildingEdgeMeshes: [],
    _floatingTextSprites: [],
    _time: 0,

    init: function(canvasEl) {
      this.canvas = canvasEl;

      // Set up Three.js renderer using the existing canvas
      this._renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false });
      this._renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this._renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight);
      this._renderer.setClearColor(0x1a1520, 1);
      this._renderer.shadowMap.enabled = true;
      this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Scene
      this._scene = new THREE.Scene();
      this._scene.fog = new THREE.FogExp2(0x2a1a25, 0.0002);

      // Camera - isometric-like perspective
      var aspect = canvasEl.clientWidth / canvasEl.clientHeight;
      this._camera3 = new THREE.PerspectiveCamera(45, aspect, 10, 5000);
      // Initial position; will be updated by updateCamera
      this._camera3.position.set(WORLD_W / 2, 600, WORLD_H / 2 + 500);
      this._camera3.lookAt(WORLD_W / 2, 0, WORLD_H / 2);

      // Lighting
      var ambient = new THREE.AmbientLight(0x8877aa, 0.4);
      this._scene.add(ambient);

      var hemiLight = new THREE.HemisphereLight(0xffeedd, 0x223344, 0.3);
      this._scene.add(hemiLight);

      var dirLight = new THREE.DirectionalLight(0xffcc88, 0.8);
      dirLight.position.set(-300, 600, -200);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 1;
      dirLight.shadow.camera.far = 2000;
      dirLight.shadow.camera.left = -1500;
      dirLight.shadow.camera.right = 1500;
      dirLight.shadow.camera.top = 1500;
      dirLight.shadow.camera.bottom = -1500;
      this._scene.add(dirLight);

      // Warm point light
      var pointLight = new THREE.PointLight(0xffaa44, 0.4, 2000);
      pointLight.position.set(WORLD_W / 2, 300, WORLD_H / 2);
      this._scene.add(pointLight);

      // Raycaster for click-to-move
      this._raycaster = new THREE.Raycaster();

      // Build the scene
      this._buildSky();
      this._buildGround();
      this._buildRoads();
      this._buildBuildings();
      this._buildTrees();
      this._buildAvatar();
      this._buildMoveTarget();
      this._buildPrompt();

      // Resize handler
      var self = this;
      window.addEventListener('resize', function() { self.resize(); });

      // Click/tap-to-move
      function handleMapTap(clientX, clientY) {
        if (!Game.state.avatar || UI.panelOpen || UI.modalActive()) return;
        var rect = canvasEl.getBoundingClientRect();

        // Normalize mouse to NDC
        var mouse = new THREE.Vector2();
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast to ground plane (y=0)
        self._raycaster.setFromCamera(mouse, self._camera3);
        var planeNormal = new THREE.Vector3(0, 1, 0);
        var plane = new THREE.Plane(planeNormal, 0);
        var intersection = new THREE.Vector3();
        var hit = self._raycaster.ray.intersectPlane(plane, intersection);

        if (!hit) return;

        // intersection.x = worldX, intersection.z = worldY (2D mapping)
        var worldX = intersection.x;
        var worldY = intersection.z;

        // Check if tapped on a building
        var tappedBuilding = null;
        for (var i = 0; i < BUILDINGS.length; i++) {
          var b = BUILDINGS[i];
          if (worldX >= b.x && worldX <= b.x + b.w && worldY >= b.y && worldY <= b.y + b.h) {
            tappedBuilding = b;
            break;
          }
        }

        self._pathWaypoints = null; // Clear existing path
        if (tappedBuilding) {
          self.moveTarget = { x: tappedBuilding.x + tappedBuilding.w / 2, y: tappedBuilding.y + tappedBuilding.h + 30 };
          self.autoEnterBuilding = tappedBuilding;
        } else {
          self.moveTarget = { x: worldX, y: worldY };
          self.autoEnterBuilding = null;
        }
      }

      canvasEl.addEventListener('click', function(e) { handleMapTap(e.clientX, e.clientY); });
      canvasEl.addEventListener('touchend', function(e) {
        if (e.changedTouches.length !== 1) return;
        var t = e.changedTouches[0];
        handleMapTap(t.clientX, t.clientY);
      });
    },

    // ── Scene Construction ──

    _buildGround: function() {
      // Main ground plane
      var groundGeo = new THREE.PlaneGeometry(WORLD_W + 200, WORLD_H + 200);
      var groundMat = new THREE.MeshStandardMaterial({
        color: 0x3a3530,
        roughness: 0.95,
        metalness: 0.1
      });
      this._groundPlane = new THREE.Mesh(groundGeo, groundMat);
      this._groundPlane.rotation.x = -Math.PI / 2;
      this._groundPlane.position.set(WORLD_W / 2, -0.5, WORLD_H / 2);
      this._groundPlane.receiveShadow = true;
      this._scene.add(this._groundPlane);

      // Subtle grid lines on ground
      var gridMat = new THREE.LineBasicMaterial({ color: 0x4a4540, transparent: true, opacity: 0.25 });
      var gridGeo = new THREE.BufferGeometry();
      var gridVerts = [];
      for (var gx = 0; gx <= WORLD_W; gx += 64) {
        gridVerts.push(gx, 0.1, 0, gx, 0.1, WORLD_H);
      }
      for (var gy = 0; gy <= WORLD_H; gy += 64) {
        gridVerts.push(0, 0.1, gy, WORLD_W, 0.1, gy);
      }
      gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridVerts, 3));
      var grid = new THREE.LineSegments(gridGeo, gridMat);
      this._scene.add(grid);

      // Green grass patches between buildings
      var grassMat = new THREE.MeshStandardMaterial({ color: 0x3a6630, roughness: 0.95, metalness: 0.0 });
      var rng = function(seed) { return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1; };
      for (var gi = 0; gi < 20; gi++) {
        var gpx = rng(gi * 3 + 1) * WORLD_W;
        var gpz = rng(gi * 3 + 2) * WORLD_H;
        // Skip if on a building or road
        var onBuilding = false;
        for (var bi = 0; bi < BUILDINGS.length; bi++) {
          var bb = BUILDINGS[bi];
          if (gpx >= bb.x - 20 && gpx <= bb.x + bb.w + 20 && gpz >= bb.y - 20 && gpz <= bb.y + bb.h + 20) { onBuilding = true; break; }
        }
        if (onBuilding) continue;
        var onRoad = false;
        for (var ri = 0; ri < H_ROADS.length; ri++) { if (gpz >= H_ROADS[ri].y - 10 && gpz <= H_ROADS[ri].y + H_ROADS[ri].h + 10) { onRoad = true; break; } }
        for (var vi = 0; vi < V_ROADS.length; vi++) { if (gpx >= V_ROADS[vi].x - 10 && gpx <= V_ROADS[vi].x + V_ROADS[vi].w + 10) { onRoad = true; break; } }
        if (onRoad) continue;
        var gSize = 30 + rng(gi * 7) * 50;
        var grassGeo = new THREE.PlaneGeometry(gSize, gSize);
        var grassMesh = new THREE.Mesh(grassGeo, grassMat);
        grassMesh.rotation.x = -Math.PI / 2;
        grassMesh.position.set(gpx, 0.15, gpz);
        this._scene.add(grassMesh);
      }
    },

    _buildRoads: function() {
      var roadMat = new THREE.MeshStandardMaterial({
        color: 0x555550,
        roughness: 0.9,
        metalness: 0.05
      });
      var sidewalkMat = new THREE.MeshStandardMaterial({
        color: 0x998877,
        roughness: 0.85,
        metalness: 0.02
      });

      // Dashed yellow center-line material
      var lineMat = new THREE.LineDashedMaterial({
        color: 0xcccc99,
        dashSize: 20,
        gapSize: 15,
        linewidth: 1
      });

      var sidewalkW = 10;

      for (var ri = 0; ri < H_ROADS.length; ri++) {
        var hr = H_ROADS[ri];
        var rGeo = new THREE.PlaneGeometry(WORLD_W, hr.h);
        var rMesh = new THREE.Mesh(rGeo, roadMat);
        rMesh.rotation.x = -Math.PI / 2;
        rMesh.position.set(WORLD_W / 2, 0.2, hr.y + hr.h / 2);
        this._scene.add(rMesh);

        // Sidewalks along both sides
        var swGeoTop = new THREE.PlaneGeometry(WORLD_W, sidewalkW);
        var swTop = new THREE.Mesh(swGeoTop, sidewalkMat);
        swTop.rotation.x = -Math.PI / 2;
        swTop.position.set(WORLD_W / 2, 0.25, hr.y - sidewalkW / 2);
        this._scene.add(swTop);
        var swGeoBot = new THREE.PlaneGeometry(WORLD_W, sidewalkW);
        var swBot = new THREE.Mesh(swGeoBot, sidewalkMat);
        swBot.rotation.x = -Math.PI / 2;
        swBot.position.set(WORLD_W / 2, 0.25, hr.y + hr.h + sidewalkW / 2);
        this._scene.add(swBot);

        // Center line
        var lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute([
          0, 0.4, hr.y + hr.h / 2, WORLD_W, 0.4, hr.y + hr.h / 2
        ], 3));
        var line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        this._scene.add(line);
      }

      for (var vi = 0; vi < V_ROADS.length; vi++) {
        var vr = V_ROADS[vi];
        var vrGeo = new THREE.PlaneGeometry(vr.w, WORLD_H);
        var vrMesh = new THREE.Mesh(vrGeo, roadMat);
        vrMesh.rotation.x = -Math.PI / 2;
        vrMesh.position.set(vr.x + vr.w / 2, 0.2, WORLD_H / 2);
        this._scene.add(vrMesh);

        // Sidewalks along both sides
        var vswGeoL = new THREE.PlaneGeometry(sidewalkW, WORLD_H);
        var vswL = new THREE.Mesh(vswGeoL, sidewalkMat);
        vswL.rotation.x = -Math.PI / 2;
        vswL.position.set(vr.x - sidewalkW / 2, 0.25, WORLD_H / 2);
        this._scene.add(vswL);
        var vswGeoR = new THREE.PlaneGeometry(sidewalkW, WORLD_H);
        var vswR = new THREE.Mesh(vswGeoR, sidewalkMat);
        vswR.rotation.x = -Math.PI / 2;
        vswR.position.set(vr.x + vr.w + sidewalkW / 2, 0.25, WORLD_H / 2);
        this._scene.add(vswR);

        var vlGeo = new THREE.BufferGeometry();
        vlGeo.setAttribute('position', new THREE.Float32BufferAttribute([
          vr.x + vr.w / 2, 0.4, 0, vr.x + vr.w / 2, 0.4, WORLD_H
        ], 3));
        var vline = new THREE.Line(vlGeo, lineMat);
        vline.computeLineDistances();
        this._scene.add(vline);
      }
    },

    _buildSky: function() {
      // Large inverted sphere for sunset sky
      var skyGeo = new THREE.SphereGeometry(3000, 32, 16);
      var skyCanvas = document.createElement('canvas');
      skyCanvas.width = 256;
      skyCanvas.height = 256;
      var skyCtx = skyCanvas.getContext('2d');
      var grad = skyCtx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#1a1030');
      grad.addColorStop(0.3, '#3a2040');
      grad.addColorStop(0.5, '#884455');
      grad.addColorStop(0.7, '#cc7744');
      grad.addColorStop(0.85, '#ffaa66');
      grad.addColorStop(1, '#ffddaa');
      skyCtx.fillStyle = grad;
      skyCtx.fillRect(0, 0, 256, 256);
      var skyTex = new THREE.CanvasTexture(skyCanvas);
      var skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false });
      var skyMesh = new THREE.Mesh(skyGeo, skyMat);
      skyMesh.position.set(WORLD_W / 2, 0, WORLD_H / 2);
      this._scene.add(skyMesh);
    },

    _buildTrees: function() {
      var greens = [0x336633, 0x447744, 0x2a5a2a, 0x558855];
      var trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9, metalness: 0.0 });
      var rng = function(seed) { return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1; };

      for (var ti = 0; ti < 30; ti++) {
        var tx = rng(ti * 5 + 100) * WORLD_W;
        var tz = rng(ti * 5 + 101) * WORLD_H;

        // Skip if on a building
        var onBuilding = false;
        for (var bi = 0; bi < BUILDINGS.length; bi++) {
          var bb = BUILDINGS[bi];
          if (tx >= bb.x - 15 && tx <= bb.x + bb.w + 15 && tz >= bb.y - 15 && tz <= bb.y + bb.h + 15) { onBuilding = true; break; }
        }
        if (onBuilding) continue;

        // Skip if on a road
        var onRoad = false;
        for (var ri = 0; ri < H_ROADS.length; ri++) { if (tz >= H_ROADS[ri].y - 5 && tz <= H_ROADS[ri].y + H_ROADS[ri].h + 5) { onRoad = true; break; } }
        for (var vi = 0; vi < V_ROADS.length; vi++) { if (tx >= V_ROADS[vi].x - 5 && tx <= V_ROADS[vi].x + V_ROADS[vi].w + 5) { onRoad = true; break; } }
        if (onRoad) continue;

        var trunkH = 20 + rng(ti * 5 + 102) * 10;
        var canopyR = 12 + rng(ti * 5 + 103) * 6;
        var greenColor = greens[ti % greens.length];

        // Trunk
        var trunkGeo = new THREE.CylinderGeometry(3, 3, trunkH, 6);
        var trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(tx, trunkH / 2, tz);
        trunk.castShadow = true;
        this._scene.add(trunk);

        // Canopy - alternate between cone and sphere
        var canopyMat = new THREE.MeshStandardMaterial({ color: greenColor, roughness: 0.9, metalness: 0.0 });
        var canopy;
        if (ti % 2 === 0) {
          var coneGeo = new THREE.ConeGeometry(canopyR, canopyR * 1.8, 8);
          canopy = new THREE.Mesh(coneGeo, canopyMat);
        } else {
          var sphereGeo = new THREE.SphereGeometry(canopyR, 8, 6);
          canopy = new THREE.Mesh(sphereGeo, canopyMat);
        }
        canopy.position.set(tx, trunkH + canopyR * 0.6, tz);
        canopy.castShadow = true;
        this._scene.add(canopy);
      }
    },

    _buildBuildings: function() {
      this._buildingMeshes = [];
      this._buildingEdgeMeshes = [];

      // Wall colors per building type
      var wallColors = {
        mine: '#c4956a', hardware: '#b8a88a', exchange: '#d4c8b0', bank: '#e8dcc8',
        diner: '#cc6655', coffee: '#8b7355', university: '#c8b8a0', hospital: '#e0d8d0',
        internet_cafe: '#7a8878', casino: '#9a6688', post_office: '#b0a898', gym: '#bb8844',
        real_estate: '#a8b898', car_dealer: '#c0b8b0', pet_shop: '#d8b8a0', pawn_shop: '#998866',
        utility: '#8899aa', apartment: '#c0b0a0'
      };

      // Roof colors cycled per building
      var roofColors = ['#9a5533', '#554433', '#667766', '#884444'];

      // Building heights by category
      var buildingHeights = {
        mine: 70, hardware: 50, exchange: 55, bank: 95,
        diner: 35, coffee: 30, university: 70, hospital: 75,
        internet_cafe: 45, casino: 65, post_office: 48, gym: 50,
        real_estate: 65, car_dealer: 60, pet_shop: 32, pawn_shop: 35,
        utility: 52, apartment: 55
      };

      // Shop types that get awnings
      var awningTypes = { diner: '#cc3333', coffee: '#664422', pet_shop: '#dd8866', pawn_shop: '#887744' };

      for (var i = 0; i < BUILDINGS.length; i++) {
        var b = BUILDINGS[i];
        var bGroup = new THREE.Group();
        var wallHex = wallColors[b.panelType] || '#bbaa99';
        var buildingHeight = buildingHeights[b.panelType] || 50;

        // 1. Main body
        var bodyMat = new THREE.MeshStandardMaterial({
          color: wallHex,
          roughness: 0.8,
          metalness: 0.05
        });
        var bodyGeo = new THREE.BoxGeometry(b.w, buildingHeight, b.h);
        var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.set(b.x + b.w / 2, buildingHeight / 2, b.y + b.h / 2);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        bGroup.add(bodyMesh);
        this._buildingMeshes.push(bodyMesh);

        // Edge highlight for nearby detection
        var edgeGeo = new THREE.EdgesGeometry(bodyGeo);
        var edgeMat = new THREE.LineBasicMaterial({
          color: 0x887766,
          transparent: true,
          opacity: 0.6
        });
        var edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);
        edgeMesh.position.copy(bodyMesh.position);
        bGroup.add(edgeMesh);
        this._buildingEdgeMeshes.push(edgeMesh);

        // 2. Peaked roof - triangular prism along longer axis
        var roofHex = roofColors[i % roofColors.length];
        var roofRGB = hexToRGB(roofHex);
        var roofMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(roofRGB.r, roofRGB.g, roofRGB.b),
          roughness: 0.85,
          metalness: 0.05
        });
        var ridgeHeight = buildingHeight * 0.4;
        var hw = b.w / 2;
        var hd = b.h / 2;
        var bx = b.x + b.w / 2;
        var bz = b.y + b.h / 2;
        var roofY = buildingHeight;

        if (b.w >= b.h) {
          // Ridge along X axis (width is longer)
          var roofVerts = new Float32Array([
            // Left triangle
            bx - hw, roofY, bz - hd,
            bx - hw, roofY, bz + hd,
            bx - hw, roofY + ridgeHeight, bz,
            // Right triangle
            bx + hw, roofY, bz - hd,
            bx + hw, roofY, bz + hd,
            bx + hw, roofY + ridgeHeight, bz,
            // Front slope
            bx - hw, roofY, bz + hd,
            bx + hw, roofY, bz + hd,
            bx + hw, roofY + ridgeHeight, bz,
            bx - hw, roofY, bz + hd,
            bx + hw, roofY + ridgeHeight, bz,
            bx - hw, roofY + ridgeHeight, bz,
            // Back slope
            bx - hw, roofY, bz - hd,
            bx + hw, roofY + ridgeHeight, bz,
            bx + hw, roofY, bz - hd,
            bx - hw, roofY, bz - hd,
            bx - hw, roofY + ridgeHeight, bz,
            bx + hw, roofY + ridgeHeight, bz
          ]);
        } else {
          // Ridge along Z axis (height/depth is longer)
          var roofVerts = new Float32Array([
            // Near triangle
            bx - hw, roofY, bz - hd,
            bx + hw, roofY, bz - hd,
            bx, roofY + ridgeHeight, bz - hd,
            // Far triangle
            bx - hw, roofY, bz + hd,
            bx + hw, roofY, bz + hd,
            bx, roofY + ridgeHeight, bz + hd,
            // Left slope
            bx - hw, roofY, bz - hd,
            bx, roofY + ridgeHeight, bz - hd,
            bx, roofY + ridgeHeight, bz + hd,
            bx - hw, roofY, bz - hd,
            bx, roofY + ridgeHeight, bz + hd,
            bx - hw, roofY, bz + hd,
            // Right slope
            bx + hw, roofY, bz - hd,
            bx, roofY + ridgeHeight, bz + hd,
            bx, roofY + ridgeHeight, bz - hd,
            bx + hw, roofY, bz - hd,
            bx + hw, roofY, bz + hd,
            bx, roofY + ridgeHeight, bz + hd
          ]);
        }

        var roofGeo = new THREE.BufferGeometry();
        roofGeo.setAttribute('position', new THREE.Float32BufferAttribute(roofVerts, 3));
        roofGeo.computeVertexNormals();
        var roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.castShadow = true;
        bGroup.add(roofMesh);

        // 3. Windows - warm yellow glow
        var winMat = new THREE.MeshBasicMaterial({
          color: '#ffeecc',
          transparent: true,
          opacity: 0.85
        });
        var winEmMat = new THREE.MeshStandardMaterial({
          color: '#ffeecc',
          emissive: '#ffeecc',
          emissiveIntensity: 0.6,
          roughness: 0.3,
          metalness: 0.0
        });
        var floors = Math.max(1, Math.floor(buildingHeight / 25));
        var cols = Math.max(1, Math.floor(b.w / 40));
        var winW = 12, winH = 10;
        for (var fl = 0; fl < floors; fl++) {
          for (var wc = 0; wc < cols; wc++) {
            var wGeo = new THREE.PlaneGeometry(winW, winH);
            var wMesh = new THREE.Mesh(wGeo, winEmMat);
            var wx = b.x + 20 + wc * (b.w - 40) / Math.max(1, cols - 1);
            if (cols === 1) wx = b.x + b.w / 2;
            var wy = 12 + fl * 25;
            // Front face
            wMesh.position.set(wx, wy, b.y + b.h + 0.5);
            bGroup.add(wMesh);
            // Back face
            var wBack = new THREE.Mesh(wGeo, winEmMat);
            wBack.position.set(wx, wy, b.y - 0.5);
            wBack.rotation.y = Math.PI;
            bGroup.add(wBack);
          }
        }
        // Side windows
        var sideCols = Math.max(1, Math.floor(b.h / 40));
        for (var fl2 = 0; fl2 < floors; fl2++) {
          for (var sc = 0; sc < sideCols; sc++) {
            var sGeo = new THREE.PlaneGeometry(winW, winH);
            var sz = b.y + 20 + sc * (b.h - 40) / Math.max(1, sideCols - 1);
            if (sideCols === 1) sz = b.y + b.h / 2;
            var sy = 12 + fl2 * 25;
            var sRight = new THREE.Mesh(sGeo, winEmMat);
            sRight.position.set(b.x + b.w + 0.5, sy, sz);
            sRight.rotation.y = Math.PI / 2;
            bGroup.add(sRight);
            var sLeft = new THREE.Mesh(sGeo, winEmMat);
            sLeft.position.set(b.x - 0.5, sy, sz);
            sLeft.rotation.y = -Math.PI / 2;
            bGroup.add(sLeft);
          }
        }

        // 4. Door - dark rectangle on front face at ground level
        var doorMat = new THREE.MeshStandardMaterial({ color: '#443322', roughness: 0.9, metalness: 0.05 });
        var doorGeo = new THREE.PlaneGeometry(14, 20);
        var doorMesh = new THREE.Mesh(doorGeo, doorMat);
        doorMesh.position.set(b.x + b.w / 2, 10, b.y + b.h + 0.6);
        bGroup.add(doorMesh);

        // 5. Optional awning for shop types
        if (awningTypes[b.panelType]) {
          var awningMat = new THREE.MeshStandardMaterial({
            color: awningTypes[b.panelType],
            roughness: 0.7,
            metalness: 0.0,
            side: THREE.DoubleSide
          });
          var awningW = Math.min(b.w * 0.6, 80);
          var awningGeo = new THREE.PlaneGeometry(awningW, 15);
          var awning = new THREE.Mesh(awningGeo, awningMat);
          awning.position.set(b.x + b.w / 2, 22, b.y + b.h + 7);
          awning.rotation.x = -Math.PI * 0.15;
          awning.castShadow = true;
          bGroup.add(awning);
        }

        // 6. Emoji sprite above building
        var emojiSprite = makeEmojiSprite(b.emoji, 56);
        emojiSprite.position.set(b.x + b.w / 2, buildingHeight + ridgeHeight + 24, b.y + b.h / 2);
        bGroup.add(emojiSprite);

        // Name label sprite
        var labelSprite = makeTextSprite(b.name, { fontSize: 36, color: '#e8e8f0', bold: true });
        labelSprite.position.set(b.x + b.w / 2, buildingHeight + ridgeHeight + 8, b.y + b.h / 2);
        bGroup.add(labelSprite);

        this._scene.add(bGroup);

        // Warm ground light per building
        var glow = new THREE.PointLight(0xffddaa, 0.15, Math.max(b.w, b.h) * 1.2);
        glow.position.set(b.x + b.w / 2, 3, b.y + b.h / 2);
        this._scene.add(glow);
      }
    },

    _buildAvatar: function() {
      this._avatarGroup = new THREE.Group();

      // Body - cone (pointing up)
      var bodyGeo = new THREE.ConeGeometry(8, 20, 8);
      var bodyMat = new THREE.MeshStandardMaterial({
        color: 0xf7931a,
        roughness: 0.5,
        metalness: 0.4,
        emissive: 0xf7931a,
        emissiveIntensity: 0.15
      });
      this._avatarBody = new THREE.Mesh(bodyGeo, bodyMat);
      this._avatarBody.position.y = 12;
      this._avatarBody.castShadow = true;
      this._avatarGroup.add(this._avatarBody);

      // Head - sphere
      var headGeo = new THREE.SphereGeometry(7, 12, 8);
      var headMat = new THREE.MeshStandardMaterial({
        color: 0xffcc88,
        roughness: 0.6,
        metalness: 0.1
      });
      this._avatarHead = new THREE.Mesh(headGeo, headMat);
      this._avatarHead.position.y = 28;
      this._avatarHead.castShadow = true;
      this._avatarGroup.add(this._avatarHead);

      // Shadow disc on ground
      var shadowGeo = new THREE.CircleGeometry(10, 16);
      var shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.4
      });
      var shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = 0.3;
      this._avatarGroup.add(shadowMesh);

      // Name sprite (created on first render when avatar exists)
      this._avatarNameSprite = null;

      this._scene.add(this._avatarGroup);
      this._avatarGroup.visible = false;
    },

    _buildMoveTarget: function() {
      var ringGeo = new THREE.RingGeometry(6, 9, 16);
      var ringMat = new THREE.MeshBasicMaterial({
        color: 0xf7931a,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      this._moveTargetMesh = new THREE.Mesh(ringGeo, ringMat);
      this._moveTargetMesh.rotation.x = -Math.PI / 2;
      this._moveTargetMesh.position.y = 0.5;
      this._moveTargetMesh.visible = false;
      this._scene.add(this._moveTargetMesh);
    },

    _buildPrompt: function() {
      this._promptSprite = makeTextSprite('Press Enter', { fontSize: 40, color: '#f7931a', bold: true });
      this._promptSprite.visible = false;
      this._scene.add(this._promptSprite);
    },

    // ── Resize ──

    resize: function() {
      if (!this._renderer) return;
      var w = this.canvas.clientWidth;
      var h = this.canvas.clientHeight;
      this._renderer.setSize(w, h);
      this._camera3.aspect = w / h;
      this._camera3.updateProjectionMatrix();
    },

    // ── Update Avatar (same logic, x/y mapped to x/z) ──

    updateAvatar: function(dt, keys) {
      var av = Game.state.avatar;
      if (!av) return;

      var dx = 0, dy = 0;

      if (keys.left)  dx -= 1;
      if (keys.right) dx += 1;
      if (keys.up)    dy -= 1;
      if (keys.down)  dy += 1;

      if (dx !== 0 || dy !== 0) {
        this.moveTarget = null;
        this._pathWaypoints = null;
      }

      if (this.moveTarget && dx === 0 && dy === 0) {
        // Initialize path if needed
        if (!this._pathWaypoints) {
          this._pathWaypoints = findPath(av.x, av.y, this.moveTarget.x, this.moveTarget.y);
        }
        // Follow waypoints
        var currentWP = this._pathWaypoints.length > 0 ? this._pathWaypoints[0] : this.moveTarget;
        var tdx = currentWP.x - av.x;
        var tdy = currentWP.y - av.y;
        var dist = Math.sqrt(tdx * tdx + tdy * tdy);
        if (dist < 12) {
          if (this._pathWaypoints.length > 0) this._pathWaypoints.shift();
          if (this._pathWaypoints.length === 0) {
            this.moveTarget = null;
            this._pathWaypoints = null;
            if (this.autoEnterBuilding && !UI.panelOpen) {
              var ab = this.autoEnterBuilding;
              this.autoEnterBuilding = null;
              if (this.getNearbyBuilding() === ab) {
                setTimeout(function() { UI.showPanel(ab); }, 100);
              }
            }
          }
        } else {
          dx = tdx / dist;
          dy = tdy / dist;
        }
      }

      if (this.moveTarget === null && dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }

      if (dx === 0 && dy === 0) {
        this.nearbyBuilding = this.getNearbyBuilding();
        return;
      }

      var speed = AVATAR_SPEED * Game.getSpeedMultiplier();
      var newX = av.x + dx * speed * dt;
      var newY = av.y + dy * speed * dt;

      if (!this.collidesBuilding(newX, av.y)) {
        av.x = newX;
      } else if (this._pathWaypoints && this._pathWaypoints.length > 0) {
        this._pathWaypoints.shift(); // Skip to next waypoint on collision
      } else {
        this.moveTarget = null;
        this._pathWaypoints = null;
      }
      if (!this.collidesBuilding(av.x, newY)) {
        av.y = newY;
      } else if (this._pathWaypoints && this._pathWaypoints.length > 0) {
        this._pathWaypoints.shift();
      } else {
        this.moveTarget = null;
        this._pathWaypoints = null;
      }

      av.x = Math.max(AVATAR_SIZE, Math.min(WORLD_W - AVATAR_SIZE, av.x));
      av.y = Math.max(AVATAR_SIZE, Math.min(WORLD_H - AVATAR_SIZE, av.y));

      this.nearbyBuilding = this.getNearbyBuilding();
    },

    collidesBuilding: function(px, py) {
      var half = AVATAR_SIZE / 2;
      var ax1 = px - half, ay1 = py - half;
      var ax2 = px + half, ay2 = py + half;

      for (var i = 0; i < BUILDINGS.length; i++) {
        var b = BUILDINGS[i];
        if (ax2 > b.x && ax1 < b.x + b.w && ay2 > b.y && ay1 < b.y + b.h) {
          return true;
        }
      }
      return false;
    },

    getNearbyBuilding: function() {
      var av = Game.state.avatar;
      if (!av) return null;

      for (var i = 0; i < BUILDINGS.length; i++) {
        var b = BUILDINGS[i];
        var cx = Math.max(b.x, Math.min(av.x, b.x + b.w));
        var cy = Math.max(b.y, Math.min(av.y, b.y + b.h));
        var dist = Math.sqrt((av.x - cx) * (av.x - cx) + (av.y - cy) * (av.y - cy));
        if (dist < INTERACT_DIST) {
          return b;
        }
      }
      return null;
    },

    // ── Camera ──

    updateCamera: function(dt) {
      var av = Game.state.avatar;
      if (!av) return;

      // Target in 2D (same as before)
      var vw = this.canvas.clientWidth;
      var vh = this.canvas.clientHeight;
      var targetX = av.x - vw / 2;
      var targetY = av.y - vh / 2;
      targetX = Math.max(0, Math.min(WORLD_W - vw, targetX));
      targetY = Math.max(0, Math.min(WORLD_H - vh, targetY));

      this.camera.x += (targetX - this.camera.x) * 0.1;
      this.camera.y += (targetY - this.camera.y) * 0.1;

      // Position 3D camera looking at avatar from above+behind
      var camHeight = 450;
      var camDist = 350;
      var lookX = av.x;
      var lookZ = av.y;

      this._camera3.position.x += (lookX - this._camera3.position.x) * 0.08;
      this._camera3.position.z += (lookZ + camDist - this._camera3.position.z) * 0.08;
      this._camera3.position.y += (camHeight - this._camera3.position.y) * 0.08;
      this._camera3.lookAt(lookX, 0, lookZ);
    },

    // ── Render ──

    render: function() {
      if (!this._renderer) return;

      this._time += 0.016; // ~60fps increment

      var av = Game.state.avatar;

      // Update avatar 3D position
      if (av) {
        this._avatarGroup.visible = true;
        this._avatarGroup.position.x = av.x;
        this._avatarGroup.position.z = av.y;

        // Gentle bob
        this._avatarBody.position.y = 12 + Math.sin(this._time * 3) * 1.5;
        this._avatarHead.position.y = 28 + Math.sin(this._time * 3) * 1.5;

        // Create/update name sprite
        if (!this._avatarNameSprite && av.name) {
          this._avatarNameSprite = makeTextSprite(av.name, { fontSize: 32, color: '#f7931a', bold: true });
          this._avatarGroup.add(this._avatarNameSprite);
        }
        if (this._avatarNameSprite) {
          this._avatarNameSprite.position.y = 40;
        }
      } else {
        this._avatarGroup.visible = false;
      }

      // Move target ring
      if (this.moveTarget) {
        this._moveTargetMesh.visible = true;
        this._moveTargetMesh.position.x = this.moveTarget.x;
        this._moveTargetMesh.position.z = this.moveTarget.y;
        this._moveTargetMesh.rotation.z = this._time * 2;
      } else {
        this._moveTargetMesh.visible = false;
      }

      // Interaction prompt
      if (this.nearbyBuilding && !UI.panelOpen && av) {
        this._promptSprite.visible = true;
        this._promptSprite.position.set(av.x, 55, av.y);
      } else {
        this._promptSprite.visible = false;
      }

      // Update building edge highlights for nearby building
      for (var bi = 0; bi < BUILDINGS.length; bi++) {
        var isNearby = (this.nearbyBuilding === BUILDINGS[bi]);
        var edgeMesh = this._buildingEdgeMeshes[bi];
        if (edgeMesh) {
          if (isNearby) {
            edgeMesh.material.color.setHex(0xf7931a);
            edgeMesh.material.opacity = 0.9;
          } else {
            var rgb = hexToRGB(BUILDINGS[bi].color);
            edgeMesh.material.color.setRGB(rgb.r, rgb.g, rgb.b);
            edgeMesh.material.opacity = 0.6;
          }
        }
      }

      // Floating texts - render as temporary sprites
      this._updateFloatingTexts();

      // Render
      this._renderer.render(this._scene, this._camera3);
    },

    _updateFloatingTexts: function() {
      // Remove expired sprites
      for (var i = this._floatingTextSprites.length - 1; i >= 0; i--) {
        var entry = this._floatingTextSprites[i];
        if (entry.age > 1) {
          this._scene.remove(entry.sprite);
          this._floatingTextSprites.splice(i, 1);
        }
      }

      // Sync with Game.floatingTexts
      var gTexts = Game.floatingTexts;
      for (var fi = 0; fi < gTexts.length; fi++) {
        var ft = gTexts[fi];
        // Check if we already have a sprite for this floating text
        if (!ft._spriteCreated) {
          var sprite = makeTextSprite(ft.text, { fontSize: 42, color: ft.color, bold: true });
          sprite.position.set(ft.x, 50, ft.y);
          this._scene.add(sprite);
          this._floatingTextSprites.push({ sprite: sprite, ref: ft, age: 0 });
          ft._spriteCreated = true;
        }
      }

      // Update positions and opacity
      for (var si = 0; si < this._floatingTextSprites.length; si++) {
        var s = this._floatingTextSprites[si];
        s.age = s.ref.age;
        s.sprite.position.y = 50 + s.age * 40;
        s.sprite.material.opacity = 1 - s.age;
      }
    }
  };

  window.Town = Town;
})();
