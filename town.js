(function() {
  'use strict';

  var WORLD_W = 2400;
  var WORLD_H = 1700;
  var AVATAR_SIZE = 24;
  var AVATAR_SPEED = 280;
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
    { id: 'clothing',     name: 'Clothing Store',  emoji: '\u{1F455}',    x: 576,  y: 1408, w: 192, h: 128, color: '#dd88aa', panelType: 'clothing' },
    { id: 'apartment',    name: 'Your Home',       emoji: '\u{1F3E0}', x: 960, y: 1408, w: 128, h: 128, color: '#555577', panelType: 'apartment' },
    { id: 'homegoods',    name: 'Home Goods',      emoji: '\u{1F6CB}\uFE0F', x: 1344, y: 1408, w: 192, h: 128, color: '#88aa66', panelType: 'homegoods' },
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
    // Route through nearest road intersections to avoid buildings
    // Find nearest intersection to start and end
    var startInt = nearestIntersection(sx, sy);
    var endInt = nearestIntersection(ex, ey);
    var path = [];

    // Step 1: walk to nearest intersection
    path.push(startInt);

    // Step 2: travel along road grid via intersections
    // If start and end are on same H road or same V road, go direct
    if (startInt.x === endInt.x || startInt.y === endInt.y) {
      // Same axis, go direct
      if (startInt.x !== endInt.x || startInt.y !== endInt.y) path.push(endInt);
    } else {
      // Need an L-shaped turn through a shared intersection
      // Option A: go horizontal on startInt.y, turn at endInt.x
      var cornerA = { x: endInt.x, y: startInt.y };
      // Option B: go vertical on startInt.x, turn at endInt.y
      var cornerB = { x: startInt.x, y: endInt.y };
      // Pick the corner that's an actual intersection (both coords on roads)
      var aValid = isIntersection(cornerA.x, cornerA.y);
      var bValid = isIntersection(cornerB.x, cornerB.y);
      if (aValid) { path.push(cornerA); }
      else if (bValid) { path.push(cornerB); }
      else {
        // Neither is a clean intersection — route through closest real intersection
        var best = null, bestD = Infinity;
        for (var w = 0; w < WAYPOINTS.length; w++) {
          var wp = WAYPOINTS[w];
          var d = Math.abs(wp.x - startInt.x) + Math.abs(wp.y - startInt.y) +
                  Math.abs(wp.x - endInt.x) + Math.abs(wp.y - endInt.y);
          if (d < bestD) { bestD = d; best = wp; }
        }
        if (best) path.push(best);
      }
      path.push(endInt);
    }

    // Step 3: walk from last intersection to destination
    path.push({ x: ex, y: ey });
    return path;
  }

  function nearestIntersection(px, py) {
    var best = WAYPOINTS[0], bestD = Infinity;
    for (var i = 0; i < WAYPOINTS.length; i++) {
      var d = Math.abs(WAYPOINTS[i].x - px) + Math.abs(WAYPOINTS[i].y - py);
      if (d < bestD) { bestD = d; best = WAYPOINTS[i]; }
    }
    return { x: best.x, y: best.y };
  }

  function isIntersection(px, py) {
    var onH = false, onV = false;
    for (var i = 0; i < ROAD_CENTERS_H.length; i++) { if (Math.abs(py - ROAD_CENTERS_H[i]) < 5) { onH = true; break; } }
    for (var j = 0; j < ROAD_CENTERS_V.length; j++) { if (Math.abs(px - ROAD_CENTERS_V[j]) < 5) { onV = true; break; } }
    return onH && onV;
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


  // ── Babylon.js Helpers ──
  function hexToColor3(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return new BABYLON.Color3(parseInt(hex.substring(0,2),16)/255, parseInt(hex.substring(2,4),16)/255, parseInt(hex.substring(4,6),16)/255);
  }
  function makeBrickCanvas(baseHex) {
    var c = document.createElement('canvas'); c.width=128; c.height=128;
    var ctx = c.getContext('2d');
    var r=parseInt(baseHex.substr(1,2),16), g=parseInt(baseHex.substr(3,2),16), bl=parseInt(baseHex.substr(5,2),16);
    ctx.fillStyle='#a09080'; ctx.fillRect(0,0,128,128);
    for(var row=0;row*15<128;row++){var off=(row%2)*14;
      for(var col=-1;col*31<140;col++){var v=(Math.random()-0.5)*25;
        ctx.fillStyle='rgb('+Math.max(0,Math.min(255,r+v))+','+Math.max(0,Math.min(255,g+v))+','+Math.max(0,Math.min(255,bl+v))+')';
        ctx.fillRect(off+col*31, row*15, 28, 12);}}
    return c;
  }
  function makeStuccoCanvas(baseHex) {
    var c = document.createElement('canvas'); c.width=128; c.height=128;
    var ctx = c.getContext('2d'); ctx.fillStyle=baseHex; ctx.fillRect(0,0,128,128);
    var id=ctx.getImageData(0,0,128,128);
    for(var i=0;i<id.data.length;i+=4){var n=(Math.random()-0.5)*18;
      id.data[i]=Math.max(0,Math.min(255,id.data[i]+n));id.data[i+1]=Math.max(0,Math.min(255,id.data[i+1]+n));id.data[i+2]=Math.max(0,Math.min(255,id.data[i+2]+n));}
    ctx.putImageData(id,0,0); return c;
  }
  function makeStoneCanvas(baseHex) {
    var c = document.createElement('canvas'); c.width=128; c.height=128;
    var ctx = c.getContext('2d');
    var r=parseInt(baseHex.substr(1,2),16), g=parseInt(baseHex.substr(3,2),16), bl=parseInt(baseHex.substr(5,2),16);
    ctx.fillStyle='#888880'; ctx.fillRect(0,0,128,128);
    for(var row=0;row*25<140;row++){var off=(row%2)*20; var x=-off;
      while(x<128){var sw=28+Math.floor(Math.random()*20); var v=(Math.random()-0.5)*20;
        ctx.fillStyle='rgb('+Math.max(0,Math.min(255,r+v))+','+Math.max(0,Math.min(255,g+v))+','+Math.max(0,Math.min(255,bl+v))+')';
        ctx.fillRect(x+3,row*25+3,sw-3,22); x+=sw;}}
    return c;
  }
  function makeRoofCanvas(baseHex) {
    var c = document.createElement('canvas'); c.width=128; c.height=128;
    var ctx = c.getContext('2d'); ctx.fillStyle=baseHex; ctx.fillRect(0,0,128,128);
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1;
    for(var row=0;row<13;row++){var y=row*10;
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y);ctx.stroke();
      var off=(row%2)*14;for(var x=off;x<128;x+=28){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+10);ctx.stroke();}}
    return c;
  }

  // ── Building Style Data ──
  var WALL_COLORS = {mine:'#c4956a',hardware:'#b8a88a',exchange:'#d4c8b0',bank:'#e8dcc8',diner:'#cc6655',coffee:'#8b7355',university:'#c8b8a0',hospital:'#e0d8d0',internet_cafe:'#7a8878',casino:'#9a6688',post_office:'#b0a898',gym:'#bb8844',real_estate:'#a8b898',car_dealer:'#c0b8b0',pet_shop:'#d8b8a0',pawn_shop:'#998866',utility:'#8899aa',clothing:'#d8a8b8',apartment:'#c0b0a0',homegoods:'#a8b890'};
  // Default label heights (used before model loads); updated dynamically once model bounding box is known
  var BLDG_HEIGHTS = {mine:65,hardware:50,exchange:55,bank:95,diner:32,coffee:30,university:70,hospital:65,internet_cafe:40,casino:55,post_office:45,gym:38,real_estate:35,car_dealer:30,pet_shop:32,pawn_shop:30,utility:45,clothing:35,apartment:40,homegoods:38};

  // Loading screen helpers
  var _loadingTotal = 0;
  var _loadingDone = 0;
  function _updateLoadingBar() {
    _loadingDone++;
    var bar = document.getElementById('loading-bar');
    var status = document.getElementById('loading-status');
    if (bar) bar.style.width = Math.min(100, Math.round((_loadingDone / _loadingTotal) * 100)) + '%';
    if (status) status.textContent = 'Loading assets... ' + _loadingDone + '/' + _loadingTotal;
    if (_loadingDone >= _loadingTotal) _hideLoadingScreen();
  }
  var _loadingHidden = false;
  function _hideLoadingScreen() {
    if (_loadingHidden) return;
    _loadingHidden = true;
    var screen = document.getElementById('loading-screen');
    if (screen) {
      screen.style.opacity = '0';
      screen.style.transition = 'opacity 0.5s';
      setTimeout(function() { if (screen.parentNode) screen.parentNode.removeChild(screen); }, 600);
    }
  }
  var ROOF_COLORS = ['#9a5533','#6b4423','#667766','#884444','#7a5533'];
  var BRICK_TYPES = ['diner','gym','pawn_shop','mine'];
  var STONE_TYPES = ['bank','university','post_office','hospital'];
  var BUILDING_MODEL_ROOT = 'models/';
  var BUILDING_MODELS = {
    mine: 'mine_hq.glb',
    hardware: 'hardware_shop.glb',
    exchange: 'exchange.glb',
    bank: 'bank.glb',
    diner: 'diner.glb',
    coffee: 'coffee_shop.glb',
    university: 'university.glb',
    hospital: 'hospital.glb',
    internet_cafe: 'internet_cafe.glb',
    casino: 'casino.glb',
    post_office: 'post_office.glb',
    gym: 'gym.glb',
    real_estate: 'real_estate_office.glb',
    car_dealer: 'car_dealership.glb',
    pet_shop: 'pet_shop.glb',
    pawn_shop: 'pawn_shop.glb',
    utility: 'utility_hub.glb',
    clothing: 'clothing_store.glb',
    apartment: 'apartment_building.glb',
    homegoods: 'homegoods_center.glb'
  };
  var MODEL_ASSET_REV = '20260406-overhaul-1';

  // ── Town Object ──
  var Town = {
    canvas: null, camera: { x: 0, y: 0 },
    nearbyBuilding: null, moveTarget: null, _pathWaypoints: null,
    autoEnterBuilding: null, BUILDINGS: BUILDINGS,
    _engine: null, _scene: null, _camera3: null, _groundMesh: null,
    _avatarRoot: null, _avatarBody: null, _avatarHead: null,
    _avatarLabelTex: null, _avatarLastName: null,
    _moveTargetMesh: null, _promptMesh: null,
    _buildingMeshes: [], _time: 0,
    _lastAvatarX: 0, _lastAvatarY: 0, _stuckTimer: 0,
    _collectibles: [], // {mesh, x, z, active, respawnAt}
    _ghostMeshes: [], _ghostIdx: 0, _craigMesh: null,

    init: function(canvasEl) {
      this.canvas = canvasEl;
      this._engine = new BABYLON.Engine(canvasEl, true);
      this._scene = new BABYLON.Scene(this._engine);
      this._scene.clearColor = new BABYLON.Color4(0.55, 0.75, 0.95, 1);
      this._scene.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);
      this._scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
      this._scene.fogDensity = 0.000055;
      this._scene.fogColor = new BABYLON.Color3(0.68, 0.78, 0.88);

      // Camera: third-person follow behind character at chest height
      this._camDistance = canvasEl.clientWidth < 600 ? 90 : 65;
      this._camMinDist = 30;
      this._camMaxDist = 250;
      this._camHeight = 22;        // just above character's head
      this._camHeightOffset = 18;  // look-at point: character's chest
      this._camOrbitAngle = 0;     // orbit angle around character (left/right arrows rotate this)
      this._camera3 = new BABYLON.FreeCamera('cam',
        new BABYLON.Vector3(WORLD_W/2, this._camHeight, WORLD_H/2 - this._camDistance),
        this._scene);
      this._camera3.setTarget(new BABYLON.Vector3(WORLD_W/2, this._camHeightOffset, WORLD_H/2));
      this._camera3.inputs.clear(); // we control the camera manually
      this._camera3.minZ = 1;
      this._camera3.maxZ = 5000;
      // Zoom via scroll wheel (prevent browser Ctrl+Scroll from hijacking)
      var self = this;
      canvasEl.addEventListener('wheel', function(e) {
        e.preventDefault();
        var delta = e.deltaY > 0 ? 20 : -20;
        self._camDistance = Math.max(self._camMinDist, Math.min(self._camMaxDist, self._camDistance + delta));
      }, { passive: false });

      var hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0,1,0), this._scene);
      hemi.intensity = 0.6; hemi.diffuse = new BABYLON.Color3(0.98,0.97,0.95);
      hemi.groundColor = new BABYLON.Color3(0.24,0.28,0.3);

      var sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.35,-1,-0.42), this._scene);
      sun.intensity = 1.15; sun.diffuse = new BABYLON.Color3(1,0.95,0.86);
      sun.position = new BABYLON.Vector3(1400,950,-320);
      var fill = new BABYLON.DirectionalLight('fill', new BABYLON.Vector3(0.5,-0.8,0.2), this._scene);
      fill.intensity = 0.28;
      fill.diffuse = new BABYLON.Color3(0.6, 0.68, 0.75);
      fill.position = new BABYLON.Vector3(-220, 600, 1250);
      this._shadowGen = new BABYLON.ShadowGenerator(2048, sun);
      this._shadowGen.useBlurExponentialShadowMap = true;
      this._shadowGen.blurKernel = 32;
      this._shadowGen.depthScale = 50;
      this._shadowGen.darkness = 0.42;
      this._shadowGen.bias = 0.0002;
      this._shadowGen.normalBias = 0.03;

      // ── Skybox ──
      this._buildSkybox();

      // ── Post-processing pipeline ──
      this._buildPostProcess();

      this._buildGround(); this._buildRoads(); this._buildBuildings();
      this._buildTrees(); this._buildProps(); this._buildCollectibles(); this._buildGhosts(); this._buildAvatar(); this._buildMoveTarget(); this._buildPrompt(); this._buildBeacon(); this._buildProximityRing();

      // Safety: hide loading screen after 15s even if some assets fail silently
      setTimeout(function() { _hideLoadingScreen(); }, 15000);

      var self = this;
      window.addEventListener('resize', function() { self.resize(); });

      canvasEl.addEventListener('pointerup', function(evt) {
        if (!Game.state.avatar || UI.panelOpen || UI.modalActive()) return;
        // Skip click-to-move if this was a drag gesture
        if (UI._touchMoved && UI._touchMoved()) return;
        // Try picking ground first, then any mesh
        var pick = self._scene.pick(self._scene.pointerX, self._scene.pointerY);
        if (!pick.hit) return;
        var hitMesh = pick.pickedMesh;
        var worldX, worldY;

        // Check if we hit a building mesh
        var clickedBuilding = null;
        if (hitMesh && hitMesh !== self._groundMesh) {
          // Find which building this mesh belongs to by checking position
          for (var bi = 0; bi < BUILDINGS.length; bi++) {
            var bb = BUILDINGS[bi];
            var px = pick.pickedPoint.x, pz = pick.pickedPoint.z;
            if (px >= bb.x - 10 && px <= bb.x + bb.w + 10 && pz >= bb.y - 10 && pz <= bb.y + bb.h + 10) {
              clickedBuilding = bb; break;
            }
          }
        }

        if (clickedBuilding) {
          worldX = clickedBuilding.x + clickedBuilding.w / 2;
          worldY = clickedBuilding.y + clickedBuilding.h + 30;
          self._pathWaypoints = null;
          self.moveTarget = { x: worldX, y: worldY };
          self.autoEnterBuilding = clickedBuilding;
        } else if (hitMesh === self._groundMesh) {
          worldX = pick.pickedPoint.x; worldY = pick.pickedPoint.z;
          // Also check if ground click is inside a building footprint
          var tappedBuilding = null;
          for (var i = 0; i < BUILDINGS.length; i++) {
            var b = BUILDINGS[i];
            if (worldX >= b.x && worldX <= b.x+b.w && worldY >= b.y && worldY <= b.y+b.h) { tappedBuilding = b; break; }
          }
          self._pathWaypoints = null;
          if (tappedBuilding) {
            self.moveTarget = { x: tappedBuilding.x+tappedBuilding.w/2, y: tappedBuilding.y+tappedBuilding.h+30 };
            self.autoEnterBuilding = tappedBuilding;
          } else { self.moveTarget = { x: worldX, y: worldY }; self.autoEnterBuilding = null; }
        }
      });
    },

    _buildSkybox: function() {
      var s = this._scene;
      var skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: 5000 }, s);
      var skyMat = new BABYLON.StandardMaterial('skyMat', s);
      skyMat.backFaceCulling = false;
      skyMat.disableLighting = true;
      skyMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
      skyMat.specularColor = new BABYLON.Color3(0, 0, 0);
      // Gradient sky via procedural texture
      var skyCanvas = document.createElement('canvas');
      skyCanvas.width = 1; skyCanvas.height = 256;
      var ctx = skyCanvas.getContext('2d');
      var grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#3a7bd5');   // Zenith blue
      grad.addColorStop(0.5, '#87ceeb'); // Mid sky
      grad.addColorStop(0.85, '#d4e9f7');// Horizon haze
      grad.addColorStop(1, '#e8dcc8');   // Warm horizon
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 1, 256);
      var skyTex = new BABYLON.Texture(skyCanvas.toDataURL(), s);
      skyMat.emissiveTexture = skyTex;
      skybox.material = skyMat;
      skybox.infiniteDistance = true;
      skybox.renderingGroupId = 0;
      this._skybox = skybox;
      this._skyMat = skyMat;
    },

    _buildPostProcess: function() {
      var s = this._scene;
      var cam = this._camera3;
      if (!BABYLON.DefaultRenderingPipeline) return;
      var pipeline = new BABYLON.DefaultRenderingPipeline('defaultPipeline', true, s, [cam]);
      pipeline.fxaaEnabled = true;
      pipeline.bloomEnabled = true;
      pipeline.bloomThreshold = 0.7;
      pipeline.bloomWeight = 0.3;
      pipeline.bloomKernel = 32;
      pipeline.bloomScale = 0.5;
      pipeline.imageProcessingEnabled = true;
      pipeline.imageProcessing.toneMappingEnabled = true;
      pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
      pipeline.imageProcessing.contrast = 1.1;
      pipeline.imageProcessing.exposure = 1.05;
      pipeline.imageProcessing.vignetteEnabled = true;
      pipeline.imageProcessing.vignetteWeight = 0.5;
      pipeline.imageProcessing.vignetteStretch = 0.3;
      this._pipeline = pipeline;
    },

    _updateSkybox: function(r, g, b) {
      if (!this._skybox) return;
      var skyCanvas = document.createElement('canvas');
      skyCanvas.width = 1; skyCanvas.height = 256;
      var ctx = skyCanvas.getContext('2d');
      var grad = ctx.createLinearGradient(0, 0, 0, 256);
      // Zenith is darker version of sky color
      var zr = Math.max(0, r - 0.15), zg = Math.max(0, g - 0.15), zb = Math.max(0, b - 0.05);
      // Horizon is lighter/warmer
      var hr = Math.min(1, r + 0.2), hg = Math.min(1, g + 0.05), hb = Math.min(1, b - 0.1);
      grad.addColorStop(0, 'rgb(' + Math.floor(zr*255) + ',' + Math.floor(zg*255) + ',' + Math.floor(zb*255) + ')');
      grad.addColorStop(0.5, 'rgb(' + Math.floor(r*255) + ',' + Math.floor(g*255) + ',' + Math.floor(b*255) + ')');
      grad.addColorStop(1, 'rgb(' + Math.floor(hr*255) + ',' + Math.floor(hg*255) + ',' + Math.floor(hb*255) + ')');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 1, 256);
      if (this._skyMat.emissiveTexture) this._skyMat.emissiveTexture.dispose();
      this._skyMat.emissiveTexture = new BABYLON.Texture(skyCanvas.toDataURL(), this._scene);
    },

    _updateBuildingEmissives: function(dayTime) {
      if (!this._buildingMeshes) return;
      var isNight = dayTime >= 0.7 && dayTime < 0.85;
      var isDusk = dayTime >= 0.6 && dayTime < 0.7;
      var glowIntensity = isNight ? 1.0 : (isDusk ? (dayTime - 0.6) / 0.1 : 0);
      if (dayTime >= 0.85) glowIntensity = Math.max(0, 1.0 - (dayTime - 0.85) / 0.15);

      for (var i = 0; i < this._buildingMeshes.length; i++) {
        var root = this._buildingMeshes[i];
        if (!root) continue;
        var meshes = root.getChildMeshes ? root.getChildMeshes() : [];
        for (var m = 0; m < meshes.length; m++) {
          var mat = meshes[m].material;
          if (!mat) continue;
          // Warm window glow at night
          mat.emissiveColor = new BABYLON.Color3(
            0.9 * glowIntensity,
            0.7 * glowIntensity,
            0.3 * glowIntensity
          );
        }
      }
    },

    _buildGround: function() {
      var s = this._scene;
      var ground = BABYLON.MeshBuilder.CreateGround('ground', {width:2800,height:2100}, s);
      ground.position.x=WORLD_W/2; ground.position.z=WORLD_H/2; ground.receiveShadows=true;
      var gc=document.createElement('canvas'); gc.width=1024; gc.height=1024;
      var gctx=gc.getContext('2d');
      var grad=gctx.createLinearGradient(0,0,1024,1024);
      grad.addColorStop(0,'#355f34');
      grad.addColorStop(0.5,'#487143');
      grad.addColorStop(1,'#2f552f');
      gctx.fillStyle=grad; gctx.fillRect(0,0,1024,1024);
      for(var i=0;i<3600;i++){
        var x=Math.random()*1024, y=Math.random()*1024, r=8+Math.random()*28;
        var a=0.02+Math.random()*0.06;
        gctx.fillStyle='rgba('+(58+Math.floor(Math.random()*35))+','+(84+Math.floor(Math.random()*45))+','+(45+Math.floor(Math.random()*25))+','+a+')';
        if (typeof gctx.arc === 'function') {
          gctx.beginPath();
          gctx.arc(x, y, r, 0, Math.PI * 2);
          gctx.fill();
        } else {
          gctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
      }
      // Dirt patches and broad color breakup keep the city from reading as flat green tiles.
      for (var pch = 0; pch < 220; pch++) {
        var px = Math.random() * 1024;
        var py = Math.random() * 1024;
        var pw = 30 + Math.random() * 140;
        var ph = 30 + Math.random() * 140;
        var pa = 0.02 + Math.random() * 0.05;
        gctx.fillStyle = 'rgba(84,77,54,' + pa + ')';
        gctx.fillRect(px, py, pw, ph);
      }

      var gid=gctx.getImageData(0,0,1024,1024);
      for(var p=0;p<gid.data.length;p+=4){
        var n=(Math.random()-0.5)*26;
        gid.data[p]=Math.min(255,Math.max(0,gid.data[p]+n));
        gid.data[p+1]=Math.min(255,Math.max(0,gid.data[p+1]+n));
        gid.data[p+2]=Math.min(255,Math.max(0,gid.data[p+2]+n));
      }
      gctx.putImageData(gid,0,0);
      var gtex=new BABYLON.Texture(gc.toDataURL(),s); gtex.uScale=18; gtex.vScale=14;
      var gmat=new BABYLON.StandardMaterial('gmat',s);
      gmat.diffuseTexture=gtex;
      gmat.specularColor=new BABYLON.Color3(0.02,0.02,0.02);
      ground.material=gmat; this._groundMesh=ground;
    },

    _buildRoads: function() {
      var s=this._scene;
      var rc=document.createElement('canvas'); rc.width=512; rc.height=512;
      var rctx=rc.getContext('2d');
      var rgrad = rctx.createLinearGradient(0, 0, 512, 512);
      rgrad.addColorStop(0, '#2a2f36');
      rgrad.addColorStop(0.5, '#323840');
      rgrad.addColorStop(1, '#252a31');
      rctx.fillStyle=rgrad; rctx.fillRect(0,0,512,512);
      for(var i=0;i<3600;i++){
        var v=45+Math.floor(Math.random()*34), a=0.02+Math.random()*0.08;
        rctx.fillStyle='rgba('+v+','+v+','+(v+4)+','+a+')';
        rctx.fillRect(Math.random()*512,Math.random()*512,2+Math.random()*10,2+Math.random()*10);
      }
      for (var crack = 0; crack < 80; crack++) {
        var x0 = Math.random() * 512;
        var y0 = Math.random() * 512;
        rctx.strokeStyle = 'rgba(18,18,20,' + (0.08 + Math.random() * 0.12) + ')';
        rctx.lineWidth = 1 + Math.random() * 1.2;
        if (typeof rctx.moveTo === 'function' && typeof rctx.lineTo === 'function' && typeof rctx.stroke === 'function') {
          rctx.beginPath();
          rctx.moveTo(x0, y0);
          rctx.lineTo(x0 + (Math.random() * 90 - 45), y0 + (Math.random() * 90 - 45));
          rctx.stroke();
        } else {
          rctx.fillStyle = 'rgba(18,18,20,0.12)';
          rctx.fillRect(x0, y0, 12, 2);
        }
      }
      var rtex=new BABYLON.Texture(rc.toDataURL(),s); rtex.uScale=20; rtex.vScale=9;
      var rmat=new BABYLON.StandardMaterial('rmat',s);
      rmat.diffuseTexture=rtex;
      rmat.specularColor=new BABYLON.Color3(0.03,0.03,0.03);

      var swc=document.createElement('canvas'); swc.width=256; swc.height=256;
      var swctx=swc.getContext('2d'); swctx.fillStyle='#9a988f'; swctx.fillRect(0,0,256,256);
      for(var j=0;j<1300;j++){
        var sv=138+Math.floor(Math.random()*42), sa=0.02+Math.random()*0.08;
        swctx.fillStyle='rgba('+sv+','+sv+','+(sv-5)+','+sa+')';
        swctx.fillRect(Math.random()*256,Math.random()*256,2+Math.random()*6,2+Math.random()*6);
      }
      var swtex=new BABYLON.Texture(swc.toDataURL(),s); swtex.uScale=34; swtex.vScale=34;
      var swmat=new BABYLON.StandardMaterial('swmat',s);
      swmat.diffuseTexture=swtex;
      swmat.specularColor=new BABYLON.Color3(0.02,0.02,0.02);

      var lmat=new BABYLON.StandardMaterial('lmat',s);
      lmat.diffuseColor=new BABYLON.Color3(0.95,0.94,0.86);
      lmat.emissiveColor=new BABYLON.Color3(0.02,0.02,0.01);

      var curbMat=new BABYLON.StandardMaterial('curbMat',s);
      curbMat.diffuseColor=new BABYLON.Color3(0.74,0.74,0.71);

      for(var ri=0;ri<H_ROADS.length;ri++){
        var hr=H_ROADS[ri]; var cz=hr.y+hr.h/2;
        var rd=BABYLON.MeshBuilder.CreateGround('hr'+ri,{width:2400,height:hr.h},s);
        rd.position.x=1200;rd.position.y=0.15;rd.position.z=cz;rd.material=rmat;rd.receiveShadows=true;
        var sw1=BABYLON.MeshBuilder.CreateGround('hsw1'+ri,{width:2400,height:10},s);
        sw1.position.set(1200,0.28,hr.y-5);sw1.material=swmat;sw1.receiveShadows=true;
        var sw2=BABYLON.MeshBuilder.CreateGround('hsw2'+ri,{width:2400,height:10},s);
        sw2.position.set(1200,0.28,hr.y+hr.h+5);sw2.material=swmat;sw2.receiveShadows=true;
        var curb1=BABYLON.MeshBuilder.CreateGround('hcurb1'+ri,{width:2400,height:2},s);
        curb1.position.set(1200,0.36,hr.y+0.5);curb1.material=curbMat;
        var curb2=BABYLON.MeshBuilder.CreateGround('hcurb2'+ri,{width:2400,height:2},s);
        curb2.position.set(1200,0.36,hr.y+hr.h-0.5);curb2.material=curbMat;
        for(var d=0;d<30;d++){var dx=d*80+20;if(dx>2400)break;
          var dash=BABYLON.MeshBuilder.CreateGround('hd'+ri+'_'+d,{width:30,height:2.1},s);
          dash.position.set(dx,0.2,cz);dash.material=lmat;}
      }
      for(var vi=0;vi<V_ROADS.length;vi++){
        var vr=V_ROADS[vi]; var cx=vr.x+vr.w/2;
        var vrd=BABYLON.MeshBuilder.CreateGround('vr'+vi,{width:vr.w,height:1700},s);
        vrd.position.x=cx;vrd.position.y=0.15;vrd.position.z=850;vrd.material=rmat;vrd.receiveShadows=true;
        var vsw1=BABYLON.MeshBuilder.CreateGround('vsw1'+vi,{width:10,height:1700},s);
        vsw1.position.set(vr.x-5,0.28,850);vsw1.material=swmat;vsw1.receiveShadows=true;
        var vsw2=BABYLON.MeshBuilder.CreateGround('vsw2'+vi,{width:10,height:1700},s);
        vsw2.position.set(vr.x+vr.w+5,0.28,850);vsw2.material=swmat;vsw2.receiveShadows=true;
        var vcurb1=BABYLON.MeshBuilder.CreateGround('vcurb1'+vi,{width:2,height:1700},s);
        vcurb1.position.set(vr.x+0.5,0.36,850);vcurb1.material=curbMat;
        var vcurb2=BABYLON.MeshBuilder.CreateGround('vcurb2'+vi,{width:2,height:1700},s);
        vcurb2.position.set(vr.x+vr.w-0.5,0.36,850);vcurb2.material=curbMat;
        for(var vd=0;vd<22;vd++){var dz=vd*80+20;if(dz>1700)break;
          var vdash=BABYLON.MeshBuilder.CreateGround('vd'+vi+'_'+vd,{width:2.1,height:30},s);
          vdash.position.set(cx,0.2,dz);vdash.material=lmat;}
      }

      // Crosswalk bars at all road intersections to break the flat grid look.
      for (var hi = 0; hi < H_ROADS.length; hi++) {
        var h = H_ROADS[hi];
        for (var vi2 = 0; vi2 < V_ROADS.length; vi2++) {
          var v = V_ROADS[vi2];
          var ix = v.x + v.w / 2, iz = h.y + h.h / 2;
          for (var cw = -2; cw <= 2; cw++) {
            var barH = BABYLON.MeshBuilder.CreateGround('cwH'+hi+'_'+vi2+'_'+cw,{width:22,height:1.4},s);
            barH.position.set(ix,0.22,iz + cw * 3.1);
            barH.material = lmat;
            var barV = BABYLON.MeshBuilder.CreateGround('cwV'+hi+'_'+vi2+'_'+cw,{width:1.4,height:22},s);
            barV.position.set(ix + cw * 3.1,0.22,iz);
            barV.material = lmat;
          }
        }
      }
    },

    _buildBuildings: function() {
      var s = this._scene;
      this._buildingMeshes = [];
      var self = this;
      this._labelMeshes = [];
      this._emojiMeshes = [];

      _loadingTotal += BUILDINGS.length;

      for (var i = 0; i < BUILDINGS.length; i++) {
        (function(idx) {
          var b = BUILDINGS[idx];
          var bestPackFile = BUILDING_MODELS[b.panelType];
          var bestPackWithRev = bestPackFile ? (bestPackFile + '?v=' + MODEL_ASSET_REV) : null;

          // Ground each building on a lot pad so it doesn't look like it floats on grass.
          var lot = BABYLON.MeshBuilder.CreateGround('lot_'+b.id,{width:b.w*0.92,height:b.h*0.92},s);
          lot.position.set(b.x + b.w / 2, 0.12, b.y + b.h / 2);
          var lotMat = new BABYLON.StandardMaterial('lotMat_'+b.id,s);
          lotMat.diffuseColor = new BABYLON.Color3(0.21, 0.22, 0.23);
          lotMat.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02);
          lot.material = lotMat;

          // Lot curb ring + basic parking striping reduce the "flat square pasted on grass" look.
          var curbMat = new BABYLON.StandardMaterial('lotCurbMat_'+b.id,s);
          curbMat.diffuseColor = new BABYLON.Color3(0.64, 0.64, 0.62);
          curbMat.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02);
          var stripeMat = new BABYLON.StandardMaterial('lotStripeMat_'+b.id,s);
          stripeMat.diffuseColor = new BABYLON.Color3(0.83, 0.84, 0.82);
          stripeMat.emissiveColor = new BABYLON.Color3(0.03, 0.03, 0.03);
          stripeMat.specularColor = new BABYLON.Color3(0.01, 0.01, 0.01);

          var lotCenterX = b.x + b.w / 2;
          var lotCenterZ = b.y + b.h / 2;
          var curbTop = BABYLON.MeshBuilder.CreateGround('lotCurbTop_'+b.id,{width:b.w*0.95,height:1.5},s);
          curbTop.position.set(lotCenterX, 0.17, lotCenterZ - b.h * 0.46);
          curbTop.material = curbMat;
          var curbBottom = BABYLON.MeshBuilder.CreateGround('lotCurbBottom_'+b.id,{width:b.w*0.95,height:1.5},s);
          curbBottom.position.set(lotCenterX, 0.17, lotCenterZ + b.h * 0.46);
          curbBottom.material = curbMat;
          var curbLeft = BABYLON.MeshBuilder.CreateGround('lotCurbLeft_'+b.id,{width:1.5,height:b.h*0.95},s);
          curbLeft.position.set(lotCenterX - b.w * 0.46, 0.17, lotCenterZ);
          curbLeft.material = curbMat;
          var curbRight = BABYLON.MeshBuilder.CreateGround('lotCurbRight_'+b.id,{width:1.5,height:b.h*0.95},s);
          curbRight.position.set(lotCenterX + b.w * 0.46, 0.17, lotCenterZ);
          curbRight.material = curbMat;

          var stripeCount = Math.max(2, Math.floor(b.w / 55));
          for (var si = 0; si < stripeCount; si++) {
            var sx = b.x + b.w * 0.14 + (si * (b.w * 0.72 / Math.max(1, stripeCount - 1)));
            var stripe = BABYLON.MeshBuilder.CreateGround('lotStripe_'+b.id+'_'+si,{width:1.1,height:b.h*0.22},s);
            stripe.position.set(sx, 0.18, b.y + b.h * 0.37);
            stripe.material = stripeMat;
          }

          // Floating label (always visible, doesn't need model to load)
          var bh = BLDG_HEIGHTS[b.panelType] || 40;
          var ltex = new BABYLON.DynamicTexture('lt' + b.id, {width: 512, height: 128}, s, false);
          var lctx = ltex.getContext();
          lctx.fillStyle = 'rgba(0,0,0,0.5)';
          lctx.beginPath(); lctx.roundRect(40, 20, 432, 80, 12); lctx.fill();
          lctx.font = 'bold 48px sans-serif'; lctx.fillStyle = '#ffffff';
          lctx.textAlign = 'center'; lctx.fillText(b.name, 256, 72);
          ltex.update(); ltex.hasAlpha = true;
          var lmat = new BABYLON.StandardMaterial('lm' + b.id, s);
          lmat.diffuseTexture = ltex; lmat.emissiveColor = new BABYLON.Color3(1, 1, 1); lmat.backFaceCulling = false;
          var lp = BABYLON.MeshBuilder.CreatePlane('lp' + b.id, {width: 80, height: 20}, s);
          lp.position.set(b.x + b.w / 2, bh * 1.3 + 18, b.y + b.h / 2);
          lp.material = lmat; lp.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
          self._labelMeshes[idx] = lp;

          var etex = new BABYLON.DynamicTexture('et' + b.id, {width: 128, height: 128}, s, false);
          var ectx = etex.getContext(); ectx.font = '88px sans-serif'; ectx.textAlign = 'center';
          ectx.textBaseline = 'middle'; ectx.fillText(b.emoji || '', 64, 64);
          etex.update(); etex.hasAlpha = true;
          var emat = new BABYLON.StandardMaterial('em' + b.id, s);
          emat.diffuseTexture = etex; emat.emissiveColor = new BABYLON.Color3(1, 1, 1); emat.backFaceCulling = false;
          var ep = BABYLON.MeshBuilder.CreatePlane('ep' + b.id, {width: 28, height: 28}, s);
          ep.position.set(b.x + b.w / 2, bh * 1.3 + 38, b.y + b.h / 2);
          ep.material = emat; ep.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
          self._emojiMeshes[idx] = ep;

          function polishMaterial(mat) {
            if (!mat) return;
            if (mat.specularColor && !mat.metallic) {
              mat.specularColor = new BABYLON.Color3(0.12, 0.12, 0.12);
            }
            if (typeof mat.roughness === 'number' && mat.roughness < 0.75) {
              mat.roughness = 0.78;
            }
            if (typeof mat.environmentIntensity === 'number') {
              mat.environmentIntensity = Math.max(mat.environmentIntensity, 0.8);
            }
          }

          // Helper to position model + reposition labels at actual height
          function placeModel(root, meshes) {
            root.computeWorldMatrix(true);
            var bounds = root.getHierarchyBoundingVectors(true);
            var modelW = bounds.max.x - bounds.min.x;
            var modelH = bounds.max.y - bounds.min.y;
            var modelD = bounds.max.z - bounds.min.z;
            if (modelW < 0.01) modelW = 1;
            if (modelH < 0.01) modelH = 1;
            if (modelD < 0.01) modelD = 1;

            // Fill most of the lot while preserving true model proportions.
            var uniformScale = Math.min(b.w / modelW, b.h / modelD);
            uniformScale *= 0.78;
            var targetW = b.w * 0.78;
            var targetD = b.h * 0.78;
            var targetH = (BLDG_HEIGHTS[b.panelType] || 40) * 1.15;
            if (modelH * uniformScale < targetH * 0.7) {
              uniformScale = targetH / modelH;
            }

            root.scaling = new BABYLON.Vector3(uniformScale, uniformScale, uniformScale);
            root.computeWorldMatrix(true);
            bounds = root.getHierarchyBoundingVectors(true);
            root.position.x = b.x + b.w / 2;
            root.position.z = b.y + b.h / 2;
            root.position.y = -bounds.min.y + 0.1;

            var shadowPatch = BABYLON.MeshBuilder.CreateGround('bshadow_'+b.id,{width:targetW*1.1,height:targetD*1.1},s);
            shadowPatch.position.set(root.position.x,0.13,root.position.z);
            var shadowPatchMat = new BABYLON.StandardMaterial('bshadowM_'+b.id,s);
            shadowPatchMat.diffuseColor = new BABYLON.Color3(0.06,0.06,0.06);
            shadowPatchMat.alpha = 0.28;
            shadowPatch.material = shadowPatchMat;

            // Reposition labels based on actual scaled model height
            var actualHeight = modelH * uniformScale;
            actualHeight += root.position.y;
            if (self._labelMeshes[idx]) self._labelMeshes[idx].position.y = actualHeight + 18;
            if (self._emojiMeshes[idx]) self._emojiMeshes[idx].position.y = actualHeight + 38;

            for (var mi = 0; mi < meshes.length; mi++) {
              meshes[mi].receiveShadows = true;
              if (self._shadowGen) self._shadowGen.addShadowCaster(meshes[mi]);
              if (meshes[mi].material) polishMaterial(meshes[mi].material);
            }
            self._buildingMeshes.push(root);
          }

          // Helper to create colored fallback box when model fails to load
          function createFallbackBox() {
            var box = BABYLON.MeshBuilder.CreateBox('fallback_' + b.id, {width: b.w * 0.8, height: bh, depth: b.h * 0.8}, s);
            box.position.set(b.x + b.w / 2, bh / 2, b.y + b.h / 2);
            var mat = new BABYLON.StandardMaterial('fbmat_' + b.id, s);
            var c = b.color || '#888888';
            var r = parseInt(c.slice(1,3), 16) / 255;
            var g = parseInt(c.slice(3,5), 16) / 255;
            var bl = parseInt(c.slice(5,7), 16) / 255;
            mat.diffuseColor = new BABYLON.Color3(r, g, bl);
            box.material = mat;
            box.receiveShadows = true;
            if (self._shadowGen) self._shadowGen.addShadowCaster(box);
            self._buildingMeshes.push(box);
          }

          function tryLoadModel(rootPath, fileName, onSuccess, onFailure) {
            BABYLON.SceneLoader.ImportMesh('', rootPath, fileName, s, function(meshes) {
              if (!meshes.length) { onFailure('No meshes in ' + fileName); return; }
              onSuccess(meshes);
            }, null, function(scene, msg, ex) {
              onFailure(msg || ex || ('Failed to load ' + fileName));
            });
          }

          if (bestPackFile) {
            tryLoadModel(BUILDING_MODEL_ROOT, bestPackWithRev, function(meshes) {
              placeModel(meshes[0], meshes);
              _updateLoadingBar();
            }, function(bestErr) {
              console.warn('Failed to load ' + b.id + ': ' + bestErr);
              createFallbackBox();
              _updateLoadingBar();
            });
          } else {
            console.warn('No mapped building model for ' + b.id);
            createFallbackBox();
            _updateLoadingBar();
          }
        })(i);
      }
    },

    _buildTrees: function() {
      var s = this._scene;
      var TREE_MODELS = ['grass-trees.glb', 'grass-trees-tall.glb'];
      var seed = 12345;
      function sr() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

      for (var ti = 0; ti < 25; ti++) {
        var tx, tz, valid;
        var attempts = 0;
        do {
          tx = sr() * WORLD_W; tz = sr() * WORLD_H; valid = true; attempts++;
          for (var bi = 0; bi < BUILDINGS.length; bi++) {
            var bb = BUILDINGS[bi];
            if (tx > bb.x - 30 && tx < bb.x + bb.w + 30 && tz > bb.y - 30 && tz < bb.y + bb.h + 30) { valid = false; break; }
          }
          if (valid) for (var ri = 0; ri < H_ROADS.length; ri++) { if (tz > H_ROADS[ri].y - 10 && tz < H_ROADS[ri].y + H_ROADS[ri].h + 10) { valid = false; break; } }
          if (valid) for (var vi = 0; vi < V_ROADS.length; vi++) { if (tx > V_ROADS[vi].x - 10 && tx < V_ROADS[vi].x + V_ROADS[vi].w + 10) { valid = false; break; } }
        } while (!valid && attempts < 20);
        if (!valid) continue;

        _loadingTotal++;
        (function(x, z, idx) {
          var modelFile = TREE_MODELS[idx % TREE_MODELS.length];
          BABYLON.SceneLoader.ImportMesh('', 'models/', modelFile, s, function(meshes) {
            if (!meshes.length) { _updateLoadingBar(); return; }
            var root = meshes[0];
            var sc = 30 + sr() * 20;
            root.scaling = new BABYLON.Vector3(sc, sc, sc);
            root.position.set(x, 0, z);
            root.rotation.y = sr() * Math.PI * 2;
            _updateLoadingBar();
          }, null, function(scene, msg, ex) {
            console.warn('Failed to load tree: ' + (msg || ex));
            _updateLoadingBar();
          });
        })(tx, tz, ti);
      }
    },

    _buildProps: function() {
      var s = this._scene;
      // Decorative props placed along sidewalks, intersections, and open areas
      var PROPS = [
        // Street lamps along horizontal roads
        { model: 'street_lamp.glb', x: 200, z: 310, scale: 25 },
        { model: 'street_lamp.glb', x: 600, z: 310, scale: 25 },
        { model: 'street_lamp.glb', x: 1000, z: 310, scale: 25 },
        { model: 'street_lamp.glb', x: 1400, z: 310, scale: 25 },
        { model: 'street_lamp.glb', x: 200, z: 630, scale: 25 },
        { model: 'street_lamp.glb', x: 600, z: 630, scale: 25 },
        { model: 'street_lamp.glb', x: 1000, z: 630, scale: 25 },
        { model: 'street_lamp.glb', x: 1400, z: 630, scale: 25 },
        { model: 'street_lamp.glb', x: 200, z: 950, scale: 25 },
        { model: 'street_lamp.glb', x: 600, z: 950, scale: 25 },
        { model: 'street_lamp.glb', x: 1000, z: 950, scale: 25 },
        { model: 'street_lamp.glb', x: 1400, z: 950, scale: 25 },
        { model: 'street_lamp.glb', x: 200, z: 1270, scale: 25 },
        { model: 'street_lamp.glb', x: 600, z: 1270, scale: 25 },
        { model: 'street_lamp.glb', x: 1000, z: 1270, scale: 25 },
        { model: 'street_lamp.glb', x: 1400, z: 1270, scale: 25 },
        // Benches near park-like areas (between buildings)
        { model: 'park_bench.glb', x: 500, z: 400, scale: 15, ry: 0 },
        { model: 'park_bench.glb', x: 900, z: 720, scale: 15, ry: Math.PI / 2 },
        { model: 'park_bench.glb', x: 1300, z: 1040, scale: 15, ry: 0 },
        { model: 'park_bench.glb', x: 500, z: 1360, scale: 15, ry: Math.PI / 2 },
        // Fire hydrants at intersections
        { model: 'fire_hydrant.glb', x: 430, z: 315, scale: 8 },
        { model: 'fire_hydrant.glb', x: 815, z: 635, scale: 8 },
        { model: 'fire_hydrant.glb', x: 1200, z: 955, scale: 8 },
        { model: 'fire_hydrant.glb', x: 430, z: 1275, scale: 8 },
        // Trash cans near diner, coffee, casino
        { model: 'trash_can.glb', x: 330, z: 450, scale: 8 },
        { model: 'trash_can.glb', x: 720, z: 450, scale: 8 },
        { model: 'trash_can.glb', x: 840, z: 770, scale: 8 },
        // Mailboxes near post office and residential areas
        { model: 'mailbox.glb', x: 940, z: 910, scale: 10 },
        { model: 'mailbox.glb', x: 1100, z: 1400, scale: 10 },
        // Bus stops along main roads
        { model: 'bus_stop.glb', x: 473, z: 315, scale: 20, ry: Math.PI / 2 },
        { model: 'bus_stop.glb', x: 857, z: 955, scale: 20, ry: Math.PI / 2 },
        // Flower planters near shops
        { model: 'flower_planter.glb', x: 560, z: 130, scale: 12 },
        { model: 'flower_planter.glb', x: 940, z: 130, scale: 12 },
        { model: 'flower_planter.glb', x: 1330, z: 450, scale: 12 },
        { model: 'flower_planter.glb', x: 110, z: 770, scale: 12 },
        { model: 'flower_planter.glb', x: 1100, z: 1090, scale: 12 },
        // Garden center near real estate / residential
        { model: 'garden_center.glb', x: 100, z: 1250, scale: 20 },
      ];

      _loadingTotal += PROPS.length;
      for (var i = 0; i < PROPS.length; i++) {
        (function(prop) {
          BABYLON.SceneLoader.ImportMesh('', 'models/', prop.model, s, function(meshes) {
            if (!meshes.length) { _updateLoadingBar(); return; }
            var root = meshes[0];
            var bounds = root.getHierarchyBoundingVectors(true);
            var mW = bounds.max.x - bounds.min.x || 1;
            var mH = bounds.max.y - bounds.min.y || 1;
            var mD = bounds.max.z - bounds.min.z || 1;
            // Uniform scaling preserves model proportions
            var maxDim = Math.max(mW, mH, mD);
            var sc = prop.scale / maxDim;
            root.scaling = new BABYLON.Vector3(sc, sc, sc);
            root.position.set(prop.x, 0, prop.z);
            if (prop.ry) root.rotation.y = prop.ry;
            for (var mi = 0; mi < meshes.length; mi++) {
              meshes[mi].receiveShadows = true;
            }
            _updateLoadingBar();
          }, null, function(scene, msg, ex) {
            console.warn('Failed to load prop ' + prop.model + ': ' + (msg || ex));
            _updateLoadingBar();
          });
        })(PROPS[i]);
      }
    },

    _buildCollectibles: function() {
      var s = this._scene;
      var goldMat = new BABYLON.StandardMaterial('goldMat', s);
      goldMat.diffuseColor = new BABYLON.Color3(1, 0.85, 0.2);
      goldMat.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0.1);
      var seed = 99999;
      function sr() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

      for (var ci = 0; ci < 8; ci++) {
        var cx, cz, valid;
        var attempts = 0;
        do {
          cx = sr() * WORLD_W; cz = sr() * WORLD_H; valid = true; attempts++;
          for (var bi = 0; bi < BUILDINGS.length; bi++) {
            var bb = BUILDINGS[bi];
            if (cx > bb.x - 20 && cx < bb.x + bb.w + 20 && cz > bb.y - 20 && cz < bb.y + bb.h + 20) { valid = false; break; }
          }
          if (valid) for (var ri = 0; ri < H_ROADS.length; ri++) { if (cz > H_ROADS[ri].y - 5 && cz < H_ROADS[ri].y + H_ROADS[ri].h + 5) { valid = false; break; } }
          if (valid) for (var vi = 0; vi < V_ROADS.length; vi++) { if (cx > V_ROADS[vi].x - 5 && cx < V_ROADS[vi].x + V_ROADS[vi].w + 5) { valid = false; break; } }
        } while (!valid && attempts < 30);
        if (!valid) continue;

        var orb = BABYLON.MeshBuilder.CreateSphere('orb' + ci, { diameter: 10, segments: 8 }, s);
        orb.material = goldMat;
        orb.position.set(cx, 8, cz);
        this._collectibles.push({ mesh: orb, x: cx, z: cz, active: true, respawnAt: 0 });
      }
    },

    _checkCollectibles: function(av) {
      var now = Date.now();
      for (var ci = 0; ci < this._collectibles.length; ci++) {
        var c = this._collectibles[ci];
        if (!c.active) {
          // Check respawn
          if (now >= c.respawnAt) {
            c.active = true;
            c.mesh.setEnabled(true);
            // New random position
            var seed = now + ci * 777;
            c.x = 50 + (((seed * 16807) % 2147483647) / 2147483646) * (WORLD_W - 100);
            c.z = 50 + ((((seed + 12345) * 16807) % 2147483647) / 2147483646) * (WORLD_H - 100);
            c.mesh.position.x = c.x;
            c.mesh.position.z = c.z;
          }
          continue;
        }
        // Bob animation
        c.mesh.position.y = 8 + Math.sin(this._time * 3 + ci) * 3;
        // Check collection distance
        var dx = av.x - c.x, dz = av.y - c.z;
        if (Math.sqrt(dx * dx + dz * dz) < 25) {
          c.active = false;
          c.mesh.setEnabled(false);
          c.respawnAt = now + 90000; // 90 seconds
          Game.collectStreetItem();
        }
      }
    },

    _buildGhosts: function() {
      var s = this._scene;
      var ghostMat = new BABYLON.StandardMaterial('ghostMat', s);
      ghostMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.7);
      ghostMat.alpha = 0.3;
      // 2 ghost avatars following recorded paths
      for (var gi = 0; gi < 2; gi++) {
        var ghost = BABYLON.MeshBuilder.CreateCylinder('ghost' + gi, {diameterTop: 10, diameterBottom: 14, height: 20, tessellation: 6}, s);
        ghost.material = ghostMat;
        ghost.position.y = 10;
        ghost.setEnabled(false);
        this._ghostMeshes.push(ghost);
      }
      this._craigMesh = new BABYLON.TransformNode('craig', s);
      this._craigMesh.position.y = 12;
      var self = this;
      function loadCraigModel() {
        BABYLON.SceneLoader.ImportMesh('', 'models/', 'npc_craig.glb', s, function(meshes) {
          if (!meshes.length) return;
          var host = new BABYLON.TransformNode('craigHost', s);
          for (var i = 0; i < meshes.length; i++) {
            if (!meshes[i].parent) meshes[i].parent = host;
            meshes[i].receiveShadows = true;
            if (self._shadowGen) self._shadowGen.addShadowCaster(meshes[i]);
          }
          host.parent = self._craigMesh;
          host.computeWorldMatrix(true);
          var bounds = host.getHierarchyBoundingVectors(true);
          var h = Math.max(0.01, bounds.max.y - bounds.min.y);
          var targetH = 24;
          var sc = targetH / h;
          host.scaling = new BABYLON.Vector3(sc, sc, sc);
          host.computeWorldMatrix(true);
          bounds = host.getHierarchyBoundingVectors(true);
          host.position.y = -bounds.min.y;
        }, null, function() {
          var craigMat = new BABYLON.StandardMaterial('craigMat', s);
          craigMat.diffuseColor = new BABYLON.Color3(0.8, 0.3, 0.3);
          craigMat.alpha = 0.5;
          var fallback = BABYLON.MeshBuilder.CreateCylinder('craigFallback', {diameterTop: 12, diameterBottom: 16, height: 24, tessellation: 6}, s);
          fallback.material = craigMat;
          fallback.position.y = 12;
          fallback.parent = self._craigMesh;
        });
      }
      loadCraigModel();

      // Craig label
      var cLabel = BABYLON.MeshBuilder.CreatePlane('craigLabel', {width: 30, height: 8}, s);
      cLabel.position.y = 34; cLabel.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL; cLabel.parent = this._craigMesh;
      var cTex = new BABYLON.DynamicTexture('craigTex', {width: 256, height: 64}, s, false);
      cTex.hasAlpha = true;
      var cCtx = cTex.getContext(); cCtx.font = 'bold 28px sans-serif'; cCtx.fillStyle = '#ff4444'; cCtx.textAlign = 'center'; cCtx.fillText('Craig', 128, 40); cTex.update();
      var cLMat = new BABYLON.StandardMaterial('craigLM', s); cLMat.diffuseTexture = cTex; cLMat.emissiveColor = new BABYLON.Color3(1,1,1); cLMat.backFaceCulling = false;
      cLabel.material = cLMat;
    },

    _updateGhosts: function() {
      var history = Game.state.movementHistory || [];
      if (history.length < 10) return;
      this._ghostIdx = (this._ghostIdx + 1) % 60; // Update every ~60 frames
      if (this._ghostIdx !== 0) return;
      for (var gi = 0; gi < this._ghostMeshes.length; gi++) {
        var offset = Math.floor(history.length * (gi + 1) / 4);
        if (offset < history.length) {
          var pos = history[offset];
          this._ghostMeshes[gi].setEnabled(true);
          this._ghostMeshes[gi].position.x = pos.x;
          this._ghostMeshes[gi].position.z = pos.y;
        }
      }
      // Craig wanders semi-randomly near a building
      if (this._craigMesh) {
        var b = BUILDINGS[Math.floor(this._time * 0.1) % BUILDINGS.length];
        this._craigMesh.position.x += (b.x + b.w/2 - this._craigMesh.position.x) * 0.02;
        this._craigMesh.position.z += (b.y + b.h + 30 - this._craigMesh.position.z) * 0.02;
      }
    },

    _buildAvatar: function() {
      var s = this._scene;
      this._avatarRoot = new BABYLON.TransformNode('avRoot', s);
      var self = this;
      function loadAvatarModel() {
        BABYLON.SceneLoader.ImportMesh('', 'models/', 'avatar_player.glb', s, function(meshes) {
          if (!meshes.length) return;
          var host = new BABYLON.TransformNode('avModelHost', s);
          for (var i = 0; i < meshes.length; i++) {
            if (!meshes[i].parent) meshes[i].parent = host;
            meshes[i].receiveShadows = true;
            if (self._shadowGen) self._shadowGen.addShadowCaster(meshes[i]);
          }
          host.parent = self._avatarRoot;
          host.computeWorldMatrix(true);
          var bounds = host.getHierarchyBoundingVectors(true);
          var h = Math.max(0.01, bounds.max.y - bounds.min.y);
          var targetH = 26;
          var sc = targetH / h;
          host.scaling = new BABYLON.Vector3(sc, sc, sc);
          host.computeWorldMatrix(true);
          bounds = host.getHierarchyBoundingVectors(true);
          host.position.y = -bounds.min.y;
        }, null, function() {
          self._avatarBody = BABYLON.MeshBuilder.CreateCylinder('avBody', {diameterTop:14,diameterBottom:18,height:26,tessellation:8}, s);
          var bmat = new BABYLON.StandardMaterial('avBM', s); bmat.diffuseColor = new BABYLON.Color3(0.97,0.58,0.1);
          self._avatarBody.material = bmat; self._avatarBody.position.y = 13; self._avatarBody.parent = self._avatarRoot;
          self._avatarHead = BABYLON.MeshBuilder.CreateSphere('avHead', {diameter:16,segments:8}, s);
          var hmat = new BABYLON.StandardMaterial('avHM', s); hmat.diffuseColor = new BABYLON.Color3(0.95,0.82,0.68);
          self._avatarHead.material = hmat; self._avatarHead.position.y = 32; self._avatarHead.parent = self._avatarRoot;
        });
      }
      loadAvatarModel();

      var shadow=BABYLON.MeshBuilder.CreateDisc('avSh',{radius:10,tessellation:16},s);
      var smat=new BABYLON.StandardMaterial('avSM',s); smat.diffuseColor=new BABYLON.Color3(0,0,0); smat.alpha=0.3;
      shadow.material=smat; shadow.rotation.x=Math.PI/2; shadow.position.y=0.2; shadow.parent=this._avatarRoot;
      // Label
      var lp=BABYLON.MeshBuilder.CreatePlane('avLabel',{width:50,height:12},s);
      lp.position.y=44; lp.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL; lp.parent=this._avatarRoot;
      this._avatarLabelTex=new BABYLON.DynamicTexture('avLT',{width:256,height:64},s,false);
      this._avatarLabelTex.hasAlpha=true;
      var almat=new BABYLON.StandardMaterial('avLM',s);
      almat.diffuseTexture=this._avatarLabelTex; almat.emissiveTexture=this._avatarLabelTex;
      almat.opacityTexture=this._avatarLabelTex; almat.backFaceCulling=false;
      lp.material=almat;
    },

    _buildMoveTarget: function() {
      this._moveTargetMesh=BABYLON.MeshBuilder.CreateTorus('mt',{diameter:16,thickness:2,tessellation:16},this._scene);
      var mmat=new BABYLON.StandardMaterial('mtM',this._scene); mmat.diffuseColor=new BABYLON.Color3(1,0.6,0); mmat.alpha=0.5;
      this._moveTargetMesh.material=mmat; this._moveTargetMesh.rotation.x=Math.PI/2; this._moveTargetMesh.setEnabled(false);
    },

    _buildPrompt: function() {
      var s=this._scene;
      this._promptMesh=BABYLON.MeshBuilder.CreatePlane('prompt',{width:80,height:20},s);
      var ptex=new BABYLON.DynamicTexture('ptex',{width:512,height:128},s,false);
      ptex.hasAlpha=true; ptex.drawText('Press Enter',null,96,'bold 64px sans-serif','white','transparent',true,true);
      var pmat=new BABYLON.StandardMaterial('pmat',s);
      pmat.diffuseTexture=ptex; pmat.emissiveTexture=ptex; pmat.opacityTexture=ptex; pmat.backFaceCulling=false;
      this._promptMesh.material=pmat; this._promptMesh.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL;
      this._promptMesh.setEnabled(false);
    },

    _buildBeacon: function() {
      var s = this._scene;
      // Pulsing column of light over Mining HQ during tutorial
      this._beaconMesh = BABYLON.MeshBuilder.CreateCylinder('beacon', {height: 200, diameter: 20, tessellation: 12}, s);
      var bmat = new BABYLON.StandardMaterial('beaconMat', s);
      bmat.diffuseColor = new BABYLON.Color3(1, 0.58, 0.1);
      bmat.emissiveColor = new BABYLON.Color3(1, 0.58, 0.1);
      bmat.alpha = 0.3;
      this._beaconMesh.material = bmat;
      // Position over Mining HQ center (x:128, y:128, w:256, h:192)
      this._beaconMesh.position.x = 128 + 256 / 2;
      this._beaconMesh.position.z = 128 + 192 / 2;
      this._beaconMesh.position.y = 100;
      this._beaconMesh.setEnabled(false);
    },

    _buildProximityRing: function() {
      var s = this._scene;
      this._proximityRing = BABYLON.MeshBuilder.CreateTorus('proxRing', {diameter: 60, thickness: 2, tessellation: 24}, s);
      var prmat = new BABYLON.StandardMaterial('prmat', s);
      prmat.diffuseColor = new BABYLON.Color3(1, 0.85, 0.2);
      prmat.emissiveColor = new BABYLON.Color3(1, 0.85, 0.2);
      prmat.alpha = 0;
      this._proximityRing.material = prmat;
      this._proximityRing.rotation.x = Math.PI / 2;
      this._proximityRing.position.y = 0.5;
      this._proximityRing.setEnabled(false);
    },

    // ── Resize ──

    resize: function() {
      if (this._engine) this._engine.resize();
    },

    // ── Update Avatar (same logic, x/y mapped to x/z) ──

    updateAvatar: function(dt, keys) {
      var av = Game.state.avatar;
      if (!av) return;

      // Left/Right rotate the camera orbit around the character
      var rotSpeed = 2.5; // radians per second
      if (keys.left)  this._camOrbitAngle -= rotSpeed * dt;
      if (keys.right) this._camOrbitAngle += rotSpeed * dt;

      // Up/Down move character forward/backward relative to camera direction
      var dx = 0, dy = 0;
      var moveAngle = this._camOrbitAngle;
      if (keys.up) {
        dx += Math.sin(moveAngle);
        dy += Math.cos(moveAngle);
      }
      if (keys.down) {
        dx -= Math.sin(moveAngle);
        dy -= Math.cos(moveAngle);
      }

      if (dx !== 0 || dy !== 0) {
        this.moveTarget = null;
        this._pathWaypoints = null;
      }

      if (this.moveTarget && dx === 0 && dy === 0) {
        // Skip pathfinding for short distances — go direct
        var directDx = this.moveTarget.x - av.x;
        var directDy = this.moveTarget.y - av.y;
        var directDist = Math.sqrt(directDx * directDx + directDy * directDy);
        if (directDist < 200 && !this._pathWaypoints) {
          // Check if direct path is clear (no building collision at midpoint)
          var midX = av.x + directDx * 0.5, midY = av.y + directDy * 0.5;
          if (!this.collidesBuilding(midX, midY)) {
            this._pathWaypoints = [{ x: this.moveTarget.x, y: this.moveTarget.y }];
          }
        }
        if (!this._pathWaypoints) {
          this._pathWaypoints = findPath(av.x, av.y, this.moveTarget.x, this.moveTarget.y);
        }
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
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) { dx /= len; dy /= len; }
      }

      if (dx === 0 && dy === 0) {
        this.nearbyBuilding = this.getNearbyBuilding();
        return;
      }

      // Track facing direction for avatar rotation
      this._facingAngle = Math.atan2(dx, dy);

      var speed = AVATAR_SPEED * Game.getSpeedMultiplier();
      var moveX = dx * speed * dt;
      var moveY = dy * speed * dt;

      // Wall-sliding collision: try full move, then slide along each axis independently
      if (!this.collidesBuilding(av.x + moveX, av.y + moveY)) {
        av.x += moveX;
        av.y += moveY;
      } else if (!this.collidesBuilding(av.x + moveX, av.y)) {
        av.x += moveX; // slide along X
      } else if (!this.collidesBuilding(av.x, av.y + moveY)) {
        av.y += moveY; // slide along Y
      } else {
        // Fully blocked — skip waypoint if pathfinding
        if (this._pathWaypoints && this._pathWaypoints.length > 0) {
          this._pathWaypoints.shift();
        }
      }

      // World boundary clamping with edge flag for visual feedback
      var prevX = av.x, prevY = av.y;
      av.x = Math.max(AVATAR_SIZE, Math.min(WORLD_W - AVATAR_SIZE, av.x));
      av.y = Math.max(AVATAR_SIZE, Math.min(WORLD_H - AVATAR_SIZE, av.y));
      this._atWorldEdge = (av.x !== prevX || av.y !== prevY);

      // Stuck detection: 0.6 seconds with visual feedback
      if (this.moveTarget) {
        var movedDist = Math.abs(av.x - this._lastAvatarX) + Math.abs(av.y - this._lastAvatarY);
        if (movedDist < 2) {
          this._stuckTimer += dt;
          if (this._stuckTimer > 0.6) {
            this._stuckTimer = 0;
            if (this._pathWaypoints && this._pathWaypoints.length > 0) {
              this._pathWaypoints.shift();
            } else {
              this.moveTarget = null;
              this._pathWaypoints = null;
            }
          }
        } else {
          this._stuckTimer = 0;
        }
      }
      this._lastAvatarX = av.x;
      this._lastAvatarY = av.y;

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
      var cam = this._camera3;

      // Position camera behind the character using orbit angle
      var dist = this._camDistance;
      var angle = this._camOrbitAngle;
      var behindX = av.x - Math.sin(angle) * dist;
      var behindZ = av.y - Math.cos(angle) * dist;

      // Smooth camera follow (lerp)
      var lerpFactor = 0.1;
      cam.position.x += (behindX - cam.position.x) * lerpFactor;
      cam.position.y += (this._camHeight - cam.position.y) * lerpFactor;
      cam.position.z += (behindZ - cam.position.z) * lerpFactor;

      // Look at avatar chest height
      cam.setTarget(new BABYLON.Vector3(av.x, this._camHeightOffset, av.y));
    },

    // ── Render ──
    _updateDayNight: function() {
      var t = this._dayTime;
      var s = this._scene;
      // Interpolate sky color
      var r, g, b;
      if (t < 0.6) { // Day
        r = 0.62; g = 0.73; b = 0.85;
      } else if (t < 0.7) { // Sunset transition
        var p = (t - 0.6) / 0.1;
        r = 0.62 + p * 0.24; g = 0.73 - p * 0.38; b = 0.85 - p * 0.5;
      } else if (t < 0.85) { // Night
        r = 0.06; g = 0.09; b = 0.16;
      } else { // Dawn transition
        var p2 = (t - 0.85) / 0.15;
        r = 0.06 + p2 * 0.56; g = 0.09 + p2 * 0.64; b = 0.16 + p2 * 0.69;
      }
      s.clearColor = new BABYLON.Color4(r, g, b, 1);
      s.fogColor = new BABYLON.Color3(r, g, b);
      // Update skybox gradient to match sky color
      this._updateSkybox(r, g, b);
      // Building window glow at night
      this._updateBuildingEmissives(t);
      // Adjust pipeline exposure for night
      if (this._pipeline && this._pipeline.imageProcessing) {
        this._pipeline.imageProcessing.exposure = t >= 0.7 && t < 0.85 ? 0.85 : 1.05;
      }
      // Adjust light intensity
      var hemi = s.getLightByName('hemi');
      var sun = s.getLightByName('sun');
      var fill = s.getLightByName('fill');
      if (hemi) hemi.intensity = t < 0.7 ? 0.58 : (t < 0.85 ? 0.18 : 0.18 + ((t - 0.85) / 0.15) * 0.4);
      if (sun) sun.intensity = t < 0.7 ? 1.15 : (t < 0.85 ? 0.18 : 0.18 + ((t - 0.85) / 0.15) * 0.97);
      if (fill) fill.intensity = t < 0.7 ? 0.28 : (t < 0.85 ? 0.12 : 0.12 + ((t - 0.85) / 0.15) * 0.16);
    },

    // Day/night cycle
    _dayTime: 0,
    getDayPhase: function() {
      var t = this._dayTime;
      if (t < 0.2) return 'morning';
      if (t < 0.6) return 'day';
      if (t < 0.7) return 'evening';
      return 'night';
    },

    render: function(dt) {
      if (!this._engine) return;
      dt = dt || 0.016;
      this._time += dt;
      // Day/night cycle: 300 seconds (5 minutes)
      this._dayTime = (this._dayTime + dt / 300) % 1.0;
      this._updateDayNight();
      var av = Game.state.avatar;

      // Sync avatar
      if (av && this._avatarRoot) {
        this._avatarRoot.position.x = av.x;
        this._avatarRoot.position.z = av.y;
        this._avatarRoot.position.y = Math.sin(this._time * 3) * 1.5;
        // Rotate avatar to face movement direction
        if (this._facingAngle !== undefined) {
          var targetAngle = this._facingAngle;
          var currentAngle = this._avatarRoot.rotation.y || 0;
          // Smooth rotation (lerp toward target)
          var diff = targetAngle - currentAngle;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          this._avatarRoot.rotation.y = currentAngle + diff * 0.2;
        }
        // Update name label
        if (this._avatarLastName !== av.name) {
          this._avatarLastName = av.name;
          var ctx = this._avatarLabelTex.getContext();
          ctx.clearRect(0, 0, 256, 64);
          ctx.font = 'bold 32px sans-serif';
          ctx.fillStyle = '#f7931a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(av.name, 128, 32);
          this._avatarLabelTex.update();
        }
      }

      // Collectibles + Ghosts
      if (av) this._checkCollectibles(av);
      this._updateGhosts();

      // Sync move target
      if (this.moveTarget && this._moveTargetMesh) {
        this._moveTargetMesh.setEnabled(true);
        this._moveTargetMesh.position.x = this.moveTarget.x;
        this._moveTargetMesh.position.z = this.moveTarget.y;
        this._moveTargetMesh.position.y = 0.5;
      } else if (this._moveTargetMesh) {
        this._moveTargetMesh.setEnabled(false);
      }

      // Sync beacon (pulse over Mining HQ during tutorial steps 1-2)
      if (this._beaconMesh) {
        var showBeacon = Game.state.tutorialStep >= 1 && Game.state.tutorialStep <= 2;
        this._beaconMesh.setEnabled(showBeacon);
        if (showBeacon) {
          var pulse = 0.3 + 0.2 * Math.sin(Date.now() * 0.003);
          this._beaconMesh.material.alpha = pulse;
        }
      }

      // Sync prompt + building proximity glow
      if (this.nearbyBuilding && av && !UI.panelOpen && this._promptMesh) {
        this._promptMesh.setEnabled(true);
        this._promptMesh.position.x = av.x;
        this._promptMesh.position.y = 40;
        this._promptMesh.position.z = av.y;
      } else if (this._promptMesh) {
        this._promptMesh.setEnabled(false);
      }

      // Building proximity highlight — glow ring under nearest interactable building
      if (av && !UI.panelOpen && this._proximityRing) {
        var nb = this.nearbyBuilding;
        if (nb) {
          this._proximityRing.position.x = nb.x + nb.w / 2;
          this._proximityRing.position.z = nb.y + nb.h / 2;
          this._proximityRing.material.alpha = 0.4 + 0.2 * Math.sin(this._time * 4);
          this._proximityRing.setEnabled(true);
        } else {
          this._proximityRing.setEnabled(false);
        }
      }

      // World edge vignette overlay — trigger on rising edge only
      if (this._atWorldEdge && !this._wasAtWorldEdge) {
        this._edgeFlashTimer = 0.3; // flash for 0.3 seconds
      }
      this._wasAtWorldEdge = this._atWorldEdge;
      if (this._edgeFlashTimer > 0) {
        this._edgeFlashTimer -= dt;
        var edgeAlpha = Math.max(0, this._edgeFlashTimer / 0.3) * 0.15;
        if (this._pipeline && this._pipeline.imageProcessing) {
          this._pipeline.imageProcessing.vignetteWeight = 0.5 + edgeAlpha * 8;
        }
      } else if (this._pipeline && this._pipeline.imageProcessing) {
        this._pipeline.imageProcessing.vignetteWeight = 0.5;
      }

      this._scene.render();
    },
  };

  window.Town = Town;
})();
