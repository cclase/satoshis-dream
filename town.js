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
  var WALL_COLORS = {mine:'#c4956a',hardware:'#b8a88a',exchange:'#d4c8b0',bank:'#e8dcc8',diner:'#cc6655',coffee:'#8b7355',university:'#c8b8a0',hospital:'#e0d8d0',internet_cafe:'#7a8878',casino:'#9a6688',post_office:'#b0a898',gym:'#bb8844',real_estate:'#a8b898',car_dealer:'#c0b8b0',pet_shop:'#d8b8a0',pawn_shop:'#998866',utility:'#8899aa',apartment:'#c0b0a0'};
  var BLDG_HEIGHTS = {mine:65,hardware:50,exchange:55,bank:95,diner:32,coffee:30,university:70,hospital:65,internet_cafe:40,casino:55,post_office:45,gym:38,real_estate:35,car_dealer:30,pet_shop:32,pawn_shop:30,utility:45,apartment:40};
  var ROOF_COLORS = ['#9a5533','#6b4423','#667766','#884444','#7a5533'];
  var BRICK_TYPES = ['diner','gym','pawn_shop','mine'];
  var STONE_TYPES = ['bank','university','post_office','hospital'];

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

    init: function(canvasEl) {
      this.canvas = canvasEl;
      this._engine = new BABYLON.Engine(canvasEl, true);
      this._scene = new BABYLON.Scene(this._engine);
      this._scene.clearColor = new BABYLON.Color4(0.35, 0.2, 0.25, 1);
      this._scene.ambientColor = new BABYLON.Color3(0.3, 0.25, 0.2);
      this._scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
      this._scene.fogDensity = 0.00015;
      this._scene.fogColor = new BABYLON.Color3(0.35, 0.2, 0.25);

      this._camera3 = new BABYLON.ArcRotateCamera('cam', -Math.PI/4, Math.PI/3.5, 800,
        new BABYLON.Vector3(WORLD_W/2, 0, WORLD_H/2), this._scene);
      this._camera3.inputs.clear();
      this._camera3.lowerRadiusLimit = 300;
      this._camera3.upperRadiusLimit = 1500;

      var hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0,1,0), this._scene);
      hemi.intensity = 0.5; hemi.diffuse = new BABYLON.Color3(1,0.9,0.7);
      hemi.groundColor = new BABYLON.Color3(0.2,0.25,0.3);

      var sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-1,-2,-0.5), this._scene);
      sun.intensity = 0.8; sun.diffuse = new BABYLON.Color3(1,0.8,0.5);
      sun.position = new BABYLON.Vector3(2000,800,-200);
      this._shadowGen = new BABYLON.ShadowGenerator(1024, sun);
      this._shadowGen.useBlurExponentialShadowMap = true;

      this._buildGround(); this._buildRoads(); this._buildBuildings();
      this._buildTrees(); this._buildAvatar(); this._buildMoveTarget(); this._buildPrompt();

      var self = this;
      window.addEventListener('resize', function() { self.resize(); });

      canvasEl.addEventListener('pointerup', function() {
        if (!Game.state.avatar || UI.panelOpen || UI.modalActive()) return;
        var pick = self._scene.pick(self._scene.pointerX, self._scene.pointerY, function(m) { return m === self._groundMesh; });
        if (!pick.hit) return;
        var worldX = pick.pickedPoint.x, worldY = pick.pickedPoint.z;
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
      });
    },

    _buildGround: function() {
      var s = this._scene;
      var ground = BABYLON.MeshBuilder.CreateGround('ground', {width:2800,height:2100}, s);
      ground.position.x=WORLD_W/2; ground.position.z=WORLD_H/2; ground.receiveShadows=true;
      var gc=document.createElement('canvas'); gc.width=256; gc.height=256;
      var gctx=gc.getContext('2d'); gctx.fillStyle='#7a6e5e'; gctx.fillRect(0,0,256,256);
      var gid=gctx.getImageData(0,0,256,256);
      for(var i=0;i<gid.data.length;i+=4){var n=(Math.random()-0.5)*30;gid.data[i]=Math.min(255,Math.max(0,gid.data[i]+n));gid.data[i+1]=Math.min(255,Math.max(0,gid.data[i+1]+n));gid.data[i+2]=Math.min(255,Math.max(0,gid.data[i+2]+n));}
      gctx.putImageData(gid,0,0);
      var gtex=new BABYLON.Texture(gc.toDataURL(),s); gtex.uScale=40; gtex.vScale=40;
      var gmat=new BABYLON.StandardMaterial('gmat',s); gmat.diffuseTexture=gtex;
      ground.material=gmat; this._groundMesh=ground;
    },

    _buildRoads: function() {
      var s=this._scene;
      var rmat=new BABYLON.StandardMaterial('rmat',s); rmat.diffuseColor=new BABYLON.Color3(0.27,0.27,0.25);
      var swmat=new BABYLON.StandardMaterial('swmat',s); swmat.diffuseColor=new BABYLON.Color3(0.63,0.6,0.53);
      var lmat=new BABYLON.StandardMaterial('lmat',s); lmat.diffuseColor=new BABYLON.Color3(0.8,0.8,0.4); lmat.emissiveColor=new BABYLON.Color3(0.2,0.2,0.1);
      for(var ri=0;ri<H_ROADS.length;ri++){
        var hr=H_ROADS[ri]; var cz=hr.y+hr.h/2;
        var rd=BABYLON.MeshBuilder.CreateGround('hr'+ri,{width:2400,height:hr.h},s);
        rd.position.x=1200;rd.position.y=0.15;rd.position.z=cz;rd.material=rmat;rd.receiveShadows=true;
        var sw1=BABYLON.MeshBuilder.CreateGround('hsw1'+ri,{width:2400,height:12},s);
        sw1.position.set(1200,0.3,hr.y-6);sw1.material=swmat;sw1.receiveShadows=true;
        var sw2=BABYLON.MeshBuilder.CreateGround('hsw2'+ri,{width:2400,height:12},s);
        sw2.position.set(1200,0.3,hr.y+hr.h+6);sw2.material=swmat;sw2.receiveShadows=true;
        for(var d=0;d<30;d++){var dx=d*80+20;if(dx>2400)break;
          var dash=BABYLON.MeshBuilder.CreateGround('hd'+ri+'_'+d,{width:40,height:3},s);
          dash.position.set(dx,0.2,cz);dash.material=lmat;}
      }
      for(var vi=0;vi<V_ROADS.length;vi++){
        var vr=V_ROADS[vi]; var cx=vr.x+vr.w/2;
        var vrd=BABYLON.MeshBuilder.CreateGround('vr'+vi,{width:vr.w,height:1700},s);
        vrd.position.x=cx;vrd.position.y=0.15;vrd.position.z=850;vrd.material=rmat;vrd.receiveShadows=true;
        var vsw1=BABYLON.MeshBuilder.CreateGround('vsw1'+vi,{width:12,height:1700},s);
        vsw1.position.set(vr.x-6,0.3,850);vsw1.material=swmat;vsw1.receiveShadows=true;
        var vsw2=BABYLON.MeshBuilder.CreateGround('vsw2'+vi,{width:12,height:1700},s);
        vsw2.position.set(vr.x+vr.w+6,0.3,850);vsw2.material=swmat;vsw2.receiveShadows=true;
        for(var vd=0;vd<22;vd++){var dz=vd*80+20;if(dz>1700)break;
          var vdash=BABYLON.MeshBuilder.CreateGround('vd'+vi+'_'+vd,{width:3,height:40},s);
          vdash.position.set(cx,0.2,dz);vdash.material=lmat;}
      }
    },

    _buildBuildings: function() {
      var s = this._scene;
      this._buildingMeshes = [];
      // Map each building to a Kenney model (cycle through 5 models)
      var MODEL_FILES = ['building-small-a.glb','building-small-b.glb','building-small-c.glb','building-small-d.glb','building-garage.glb'];
      var self = this;

      for (var i = 0; i < BUILDINGS.length; i++) {
        (function(idx) {
          var b = BUILDINGS[idx];
          var modelFile = MODEL_FILES[idx % MODEL_FILES.length];

          // Load glb model
          BABYLON.SceneLoader.ImportMesh('', 'models/', modelFile, s, function(meshes) {
            if (!meshes.length) return;
            var root = meshes[0];
            // Get bounding info to scale properly
            var bounds = root.getHierarchyBoundingVectors(true);
            var modelW = bounds.max.x - bounds.min.x;
            var modelH = bounds.max.y - bounds.min.y;
            var modelD = bounds.max.z - bounds.min.z;
            if (modelW < 0.01) modelW = 1;
            if (modelH < 0.01) modelH = 1;
            if (modelD < 0.01) modelD = 1;

            // Scale to fit building footprint (models are ~1 unit, world is ~2400 units)
            var targetScale = Math.min(b.w, b.h) * 0.012;
            var scaleX = targetScale;
            var scaleZ = targetScale;
            var scaleY = targetScale * 1.2;
            root.scaling = new BABYLON.Vector3(scaleX, scaleY, scaleZ);

            // Position at building location
            root.position.x = b.x + b.w / 2;
            root.position.z = b.y + b.h / 2;
            root.position.y = 0;

            // Enable shadows on all child meshes
            for (var mi = 0; mi < meshes.length; mi++) {
              meshes[mi].receiveShadows = true;
              if (self._shadowGen) self._shadowGen.addShadowCaster(meshes[mi]);
            }
            self._buildingMeshes.push(root);
          });

          // Floating label (always visible, doesn't need model to load)
          var bh = BLDG_HEIGHTS[b.panelType] || 40;
          var ltex = new BABYLON.DynamicTexture('lt' + b.id, {width: 512, height: 128}, s, false);
          var lctx = ltex.getContext();
          lctx.font = 'bold 48px sans-serif'; lctx.fillStyle = '#ffffff';
          lctx.textAlign = 'center'; lctx.fillText(b.name, 256, 80);
          ltex.update(); ltex.hasAlpha = true;
          var lmat = new BABYLON.StandardMaterial('lm' + b.id, s);
          lmat.diffuseTexture = ltex; lmat.emissiveColor = new BABYLON.Color3(1, 1, 1); lmat.backFaceCulling = false;
          var lp = BABYLON.MeshBuilder.CreatePlane('lp' + b.id, {width: 60, height: 15}, s);
          lp.position.set(b.x + b.w / 2, bh * 1.3 + 15, b.y + b.h / 2);
          lp.material = lmat; lp.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

          // Emoji above label
          var etex = new BABYLON.DynamicTexture('et' + b.id, {width: 128, height: 128}, s, false);
          var ectx = etex.getContext(); ectx.font = '80px sans-serif'; ectx.textAlign = 'center';
          ectx.textBaseline = 'middle'; ectx.fillText(b.emoji || '', 64, 64);
          etex.update(); etex.hasAlpha = true;
          var emat = new BABYLON.StandardMaterial('em' + b.id, s);
          emat.diffuseTexture = etex; emat.emissiveColor = new BABYLON.Color3(1, 1, 1); emat.backFaceCulling = false;
          var ep = BABYLON.MeshBuilder.CreatePlane('ep' + b.id, {width: 20, height: 20}, s);
          ep.position.set(b.x + b.w / 2, bh * 1.3 + 30, b.y + b.h / 2);
          ep.material = emat; ep.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
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

        (function(x, z, idx) {
          var modelFile = TREE_MODELS[idx % TREE_MODELS.length];
          BABYLON.SceneLoader.ImportMesh('', 'models/', modelFile, s, function(meshes) {
            if (!meshes.length) return;
            var root = meshes[0];
            var sc = 1.5 + sr() * 1.0;
            root.scaling = new BABYLON.Vector3(sc, sc, sc);
            root.position.set(x, 0, z);
            root.rotation.y = sr() * Math.PI * 2;
          });
        })(tx, tz, ti);
      }
    },

    _buildAvatar: function() {
      var s=this._scene;
      this._avatarRoot=new BABYLON.TransformNode('avRoot',s);
      this._avatarBody=BABYLON.MeshBuilder.CreateCylinder('avBody',{diameterTop:10,diameterBottom:14,height:20,tessellation:8},s);
      var bmat=new BABYLON.StandardMaterial('avBM',s); bmat.diffuseColor=new BABYLON.Color3(0.97,0.58,0.1);
      this._avatarBody.material=bmat; this._avatarBody.position.y=10; this._avatarBody.parent=this._avatarRoot;
      this._avatarHead=BABYLON.MeshBuilder.CreateSphere('avHead',{diameter:12,segments:8},s);
      var hmat=new BABYLON.StandardMaterial('avHM',s); hmat.diffuseColor=new BABYLON.Color3(0.95,0.82,0.68);
      this._avatarHead.material=hmat; this._avatarHead.position.y=24; this._avatarHead.parent=this._avatarRoot;
      var shadow=BABYLON.MeshBuilder.CreateDisc('avSh',{radius:8,tessellation:16},s);
      var smat=new BABYLON.StandardMaterial('avSM',s); smat.diffuseColor=new BABYLON.Color3(0,0,0); smat.alpha=0.3;
      shadow.material=smat; shadow.rotation.x=Math.PI/2; shadow.position.y=0.2; shadow.parent=this._avatarRoot;
      // Label
      var lp=BABYLON.MeshBuilder.CreatePlane('avLabel',{width:40,height:10},s);
      lp.position.y=35; lp.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL; lp.parent=this._avatarRoot;
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

    // ── Resize ──

    resize: function() {
      if (this._engine) this._engine.resize();
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
        this._pathWaypoints.shift();
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
      var target = this._camera3.target;
      this._camera3.target = new BABYLON.Vector3(
        target.x + (av.x - target.x) * 0.08,
        0,
        target.z + (av.y - target.z) * 0.08
      );
    },

    // ── Render ──
    render: function() {
      if (!this._engine) return;
      this._time += 0.016;
      var av = Game.state.avatar;

      // Sync avatar
      if (av && this._avatarRoot) {
        this._avatarRoot.position.x = av.x;
        this._avatarRoot.position.z = av.y;
        this._avatarRoot.position.y = Math.sin(this._time * 3) * 1.5;
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

      // Sync move target
      if (this.moveTarget && this._moveTargetMesh) {
        this._moveTargetMesh.setEnabled(true);
        this._moveTargetMesh.position.x = this.moveTarget.x;
        this._moveTargetMesh.position.z = this.moveTarget.y;
        this._moveTargetMesh.position.y = 0.5;
      } else if (this._moveTargetMesh) {
        this._moveTargetMesh.setEnabled(false);
      }

      // Sync prompt
      if (this.nearbyBuilding && av && !UI.panelOpen && this._promptMesh) {
        this._promptMesh.setEnabled(true);
        this._promptMesh.position.x = av.x;
        this._promptMesh.position.y = 40;
        this._promptMesh.position.z = av.y;
      } else if (this._promptMesh) {
        this._promptMesh.setEnabled(false);
      }

      this._scene.render();
    },
  };

  window.Town = Town;
})();
