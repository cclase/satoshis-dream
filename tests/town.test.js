'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/**
 * Loads town.js with a mocked BABYLON and DOM environment,
 * returning the Town object for testing rendering configuration.
 */
function freshTown() {
  // Track all BABYLON constructor calls for verification
  const calls = {
    shadowGen: null,
    pipeline: null,
    skybox: null,
    skyMat: null,
    lights: [],
    scene: null,
  };

  // Minimal Color/Vector stubs
  function Color3(r, g, b) { this.r = r; this.g = g; this.b = b; }
  function Color4(r, g, b, a) { this.r = r; this.g = g; this.b = b; this.a = a; }
  function Vector3(x, y, z) { this.x = x; this.y = y; this.z = z; }

  // Stub material
  function StubMaterial(name) {
    this.name = name;
    this.backFaceCulling = true;
    this.disableLighting = false;
    this.diffuseColor = null;
    this.specularColor = null;
    this.emissiveColor = null;
    this.emissiveTexture = null;
    this.diffuseTexture = null;
    this.dispose = function() {};
  }

  // Stub mesh
  function StubMesh(name) {
    this.name = name;
    this.position = { x: 0, y: 0, z: 0, set: function(x,y,z) { this.x=x; this.y=y; this.z=z; } };
    this.scaling = new Vector3(1, 1, 1);
    this.rotation = { y: 0 };
    this.material = null;
    this.infiniteDistance = false;
    this.renderingGroupId = 0;
    this.receiveShadows = false;
    this.billboardMode = 0;
    this.setEnabled = function() {};
    this.getChildMeshes = function() { return []; };
    this.getHierarchyBoundingVectors = function() {
      return { min: new Vector3(0,0,0), max: new Vector3(1,1,1) };
    };
  }

  // Stub scene
  function StubScene() {
    this.clearColor = null;
    this.ambientColor = null;
    this.fogMode = 0;
    this.fogDensity = 0;
    this.fogColor = null;
    this.render = function() {};
    this.pick = function() { return { hit: false }; };
    this.pointerX = 0;
    this.pointerY = 0;
    this.getLightByName = function(name) {
      return calls.lights.find(function(l) { return l._name === name; }) || null;
    };
  }

  function StubShadowGen(size, light) {
    this.mapSize = size;
    this.useBlurExponentialShadowMap = false;
    this.blurKernel = 0;
    this.depthScale = 0;
    this.addShadowCaster = function() {};
    calls.shadowGen = this;
  }

  function StubPipeline(name, hdr, scene, cameras) {
    this._name = name;
    this.fxaaEnabled = false;
    this.bloomEnabled = false;
    this.bloomThreshold = 0;
    this.bloomWeight = 0;
    this.bloomKernel = 0;
    this.bloomScale = 0;
    this.imageProcessingEnabled = false;
    this.imageProcessing = {
      toneMappingEnabled: false,
      toneMappingType: 0,
      contrast: 1,
      exposure: 1,
      vignetteEnabled: false,
      vignetteWeight: 0,
      vignetteStretch: 0,
    };
    calls.pipeline = this;
  }

  // Canvas stub
  function StubCanvas() {
    this.width = 0; this.height = 0;
    this.clientWidth = 800; this.clientHeight = 600;
    this.getContext = function() {
      return {
        fillStyle: '', font: '', textAlign: '', textBaseline: '',
        fillRect: function() {},
        fillText: function() {},
        clearRect: function() {},
        getImageData: function(x, y, w, h) {
          return { data: new Uint8ClampedArray(w * h * 4) };
        },
        putImageData: function() {},
        createLinearGradient: function() {
          return { addColorStop: function() {} };
        },
        beginPath: function() {},
        roundRect: function() {},
        fill: function() {},
      };
    };
    this.toDataURL = function() { return 'data:image/png;base64,'; };
    this.addEventListener = function() {};
  }

  function StubTexture(url, scene) { this.uScale = 1; this.vScale = 1; this.hasAlpha = false; this.dispose = function() {}; }
  function StubDynamicTexture(name, opts, scene) {
    this.hasAlpha = false;
    this.getContext = function() { return new StubCanvas().getContext(); };
    this.update = function() {};
    this.drawText = function() {};
    this.dispose = function() {};
  }

  function StubLight(name, dir, scene) {
    this._name = name;
    this.intensity = 0;
    this.diffuse = null;
    this.groundColor = null;
    this.position = new Vector3(0,0,0);
    calls.lights.push(this);
  }

  function StubTransformNode(name, scene) {
    this.name = name;
    this.position = { x: 0, y: 0, z: 0, set: function(x,y,z) { this.x=x; this.y=y; this.z=z; } };
  }

  var BABYLON = {
    Engine: function(canvas, antialias) { this.runRenderLoop = function() {}; this.resize = function() {}; },
    Scene: function(engine) { calls.scene = new StubScene(); return calls.scene; },
    Color3: Color3,
    Color4: Color4,
    Vector3: Vector3,
    ArcRotateCamera: function(name, a, b, r, t, s) {
      this.inputs = { clear: function() {}, addMouseWheel: function() {} };
      this.lowerRadiusLimit = 0; this.upperRadiusLimit = 0;
      this.lowerBetaLimit = 0; this.upperBetaLimit = 0;
      this.target = new Vector3(0,0,0);
    },
    FreeCamera: function(name, pos, s) {
      this.inputs = { clear: function() {} };
      this.position = pos || new Vector3(0,0,0);
      this.minZ = 0; this.maxZ = 1000;
      this.setTarget = function(t) { this.target = t; };
      this.target = new Vector3(0,0,0);
    },
    HemisphericLight: function(n, d, s) { return new StubLight(n, d, s); },
    DirectionalLight: function(n, d, s) { return new StubLight(n, d, s); },
    ShadowGenerator: StubShadowGen,
    DefaultRenderingPipeline: StubPipeline,
    StandardMaterial: StubMaterial,
    TransformNode: StubTransformNode,
    Texture: StubTexture,
    DynamicTexture: StubDynamicTexture,
    MeshBuilder: {
      CreateBox: function(n, o, s) { calls.skybox = new StubMesh(n); return calls.skybox; },
      CreateGround: function(n, o, s) { return new StubMesh(n); },
      CreatePlane: function(n, o, s) { return new StubMesh(n); },
      CreateCylinder: function(n, o, s) { var m = new StubMesh(n); m.parent = null; return m; },
      CreateSphere: function(n, o, s) { var m = new StubMesh(n); m.parent = null; return m; },
      CreateDisc: function(n, o, s) { var m = new StubMesh(n); m.parent = null; return m; },
      CreateTorus: function(n, o, s) { return new StubMesh(n); },
    },
    SceneLoader: { ImportMesh: function() {} },
    Mesh: { BILLBOARDMODE_ALL: 7 },
    ImageProcessingConfiguration: { TONEMAPPING_ACES: 1 },
    'Scene': { FOGMODE_EXP2: 2 },
  };
  // Fix: Scene constructor needs to return stub
  BABYLON.Scene = function() { calls.scene = new StubScene(); return calls.scene; };
  BABYLON.Scene.FOGMODE_EXP2 = 2;

  // Stub DOM element for loading screen elements
  function StubDOMElement() {
    this.style = { width: '', opacity: '', transition: '' };
    this.parentNode = { removeChild: function() {} };
    this.textContent = '';
  }
  var loadingElements = {
    'loading-screen': new StubDOMElement(),
    'loading-bar': new StubDOMElement(),
    'loading-status': new StubDOMElement(),
  };

  const context = {
    window: {},
    document: {
      createElement: function(tag) { return new StubCanvas(); },
      getElementById: function(id) { return loadingElements[id] || new StubCanvas(); },
    },
    BABYLON: BABYLON,
    Game: { state: { avatar: null }, HARDWARE: [], DARK_WEB: [] },
    UI: null,
    Sound: null,
    Date: Date,
    Math: Math,
    console: console,
    parseInt: parseInt,
    setTimeout: setTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    requestAnimationFrame: function() {},
    addEventListener: function() {},
    JSON: JSON,
    Object: Object,
    Array: Array,
  };
  context.window = context;

  const townSource = fs.readFileSync(
    path.join(__dirname, '..', 'town.js'),
    'utf8'
  );

  vm.createContext(context);
  vm.runInContext(townSource, context);

  // Initialize Town with a mock canvas
  const canvas = new StubCanvas();
  context.window.Town.init(canvas);

  return { Town: context.window.Town, calls: calls };
}

// ─────────────────────────────────────────────
// 1. Shadow Generator Configuration
// ─────────────────────────────────────────────
describe('shadow generator', () => {
  let calls;
  beforeEach(() => { ({ calls } = freshTown()); });

  it('uses 2048 shadow map resolution', () => {
    assert.equal(calls.shadowGen.mapSize, 2048);
  });
  it('uses blur exponential shadow map', () => {
    assert.equal(calls.shadowGen.useBlurExponentialShadowMap, true);
  });
  it('has blur kernel of 32', () => {
    assert.equal(calls.shadowGen.blurKernel, 32);
  });
  it('has depth scale of 50', () => {
    assert.equal(calls.shadowGen.depthScale, 50);
  });
});

// ─────────────────────────────────────────────
// 2. Skybox
// ─────────────────────────────────────────────
describe('skybox', () => {
  let Town, calls;
  beforeEach(() => { ({ Town, calls } = freshTown()); });

  it('creates skybox mesh', () => {
    assert.ok(calls.skybox);
    assert.equal(calls.skybox.name, 'skybox');
  });
  it('skybox is infinite distance', () => {
    assert.equal(calls.skybox.infiniteDistance, true);
  });
  it('skybox material has lighting disabled', () => {
    assert.equal(Town._skyMat.disableLighting, true);
  });
  it('skybox material has backface culling off', () => {
    assert.equal(Town._skyMat.backFaceCulling, false);
  });
  it('skybox is stored on Town object', () => {
    assert.ok(Town._skybox);
  });
});

// ─────────────────────────────────────────────
// 3. Post-Processing Pipeline
// ─────────────────────────────────────────────
describe('post-processing pipeline', () => {
  let calls;
  beforeEach(() => { ({ calls } = freshTown()); });

  it('creates pipeline', () => {
    assert.ok(calls.pipeline);
  });
  it('enables FXAA', () => {
    assert.equal(calls.pipeline.fxaaEnabled, true);
  });
  it('enables bloom', () => {
    assert.equal(calls.pipeline.bloomEnabled, true);
  });
  it('bloom threshold is 0.7', () => {
    assert.equal(calls.pipeline.bloomThreshold, 0.7);
  });
  it('bloom weight is 0.3', () => {
    assert.equal(calls.pipeline.bloomWeight, 0.3);
  });
  it('bloom kernel is 32', () => {
    assert.equal(calls.pipeline.bloomKernel, 32);
  });
  it('bloom scale is 0.5', () => {
    assert.equal(calls.pipeline.bloomScale, 0.5);
  });
  it('enables image processing', () => {
    assert.equal(calls.pipeline.imageProcessingEnabled, true);
  });
  it('enables tone mapping', () => {
    assert.equal(calls.pipeline.imageProcessing.toneMappingEnabled, true);
  });
  it('uses ACES tone mapping', () => {
    assert.equal(calls.pipeline.imageProcessing.toneMappingType, 1);
  });
  it('contrast is 1.1', () => {
    assert.equal(calls.pipeline.imageProcessing.contrast, 1.1);
  });
  it('exposure is 1.05', () => {
    assert.equal(calls.pipeline.imageProcessing.exposure, 1.05);
  });
  it('enables vignette', () => {
    assert.equal(calls.pipeline.imageProcessing.vignetteEnabled, true);
  });
  it('vignette weight is 0.5 (subtle, not claustrophobic)', () => {
    assert.equal(calls.pipeline.imageProcessing.vignetteWeight, 0.5);
  });
  it('vignette stretch is 0.3', () => {
    assert.equal(calls.pipeline.imageProcessing.vignetteStretch, 0.3);
  });
});

// ─────────────────────────────────────────────
// 4. Skybox Day/Night Updates
// ─────────────────────────────────────────────
describe('skybox day/night sync', () => {
  let Town;
  beforeEach(() => { ({ Town } = freshTown()); });

  it('_updateSkybox does not crash with valid RGB', () => {
    assert.doesNotThrow(() => Town._updateSkybox(0.55, 0.75, 0.95));
  });
  it('_updateSkybox handles night colors', () => {
    assert.doesNotThrow(() => Town._updateSkybox(0.05, 0.08, 0.15));
  });
  it('_updateSkybox handles sunset colors', () => {
    assert.doesNotThrow(() => Town._updateSkybox(0.9, 0.3, 0.4));
  });
});

// ─────────────────────────────────────────────
// 5. Building Emissive Night Glow
// ─────────────────────────────────────────────
describe('building emissive night glow', () => {
  let Town;
  beforeEach(() => { ({ Town } = freshTown()); });

  it('_updateBuildingEmissives exists', () => {
    assert.equal(typeof Town._updateBuildingEmissives, 'function');
  });
  it('does not crash during day (t=0.3)', () => {
    assert.doesNotThrow(() => Town._updateBuildingEmissives(0.3));
  });
  it('does not crash during dusk (t=0.65)', () => {
    assert.doesNotThrow(() => Town._updateBuildingEmissives(0.65));
  });
  it('does not crash during night (t=0.75)', () => {
    assert.doesNotThrow(() => Town._updateBuildingEmissives(0.75));
  });
  it('does not crash during dawn (t=0.9)', () => {
    assert.doesNotThrow(() => Town._updateBuildingEmissives(0.9));
  });
});

// ─────────────────────────────────────────────
// 6. Day Phase Utility
// ─────────────────────────────────────────────
describe('getDayPhase', () => {
  let Town;
  beforeEach(() => { ({ Town } = freshTown()); });

  it('returns morning for t=0.1', () => {
    Town._dayTime = 0.1;
    assert.equal(Town.getDayPhase(), 'morning');
  });
  it('returns day for t=0.4', () => {
    Town._dayTime = 0.4;
    assert.equal(Town.getDayPhase(), 'day');
  });
  it('returns evening for t=0.65', () => {
    Town._dayTime = 0.65;
    assert.equal(Town.getDayPhase(), 'evening');
  });
  it('returns night for t=0.8', () => {
    Town._dayTime = 0.8;
    assert.equal(Town.getDayPhase(), 'night');
  });
});

// ─────────────────────────────────────────────
// 7. Pipeline Exposure Adjusts at Night
// ─────────────────────────────────────────────
describe('pipeline exposure day/night', () => {
  let Town, calls;
  beforeEach(() => { ({ Town, calls } = freshTown()); });

  it('exposure is 1.05 during day', () => {
    Town._dayTime = 0.3;
    Town._updateDayNight();
    assert.equal(calls.pipeline.imageProcessing.exposure, 1.05);
  });
  it('exposure drops to 0.85 at night', () => {
    Town._dayTime = 0.75;
    Town._updateDayNight();
    assert.equal(calls.pipeline.imageProcessing.exposure, 0.85);
  });
  it('exposure returns to 1.05 at dawn', () => {
    Town._dayTime = 0.9;
    Town._updateDayNight();
    assert.equal(calls.pipeline.imageProcessing.exposure, 1.05);
  });
});

// ─────────────────────────────────────────────
// 8. Building Model Assignment
// ─────────────────────────────────────────────
describe('building model assignment', () => {
  const ALL_BUILDING_MODELS = {
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
    homegoods: 'homegoods_center.glb',
  };
  it('all building model files exist', () => {
    for (const [type, file] of Object.entries(ALL_BUILDING_MODELS)) {
      assert.ok(fs.existsSync(path.join(__dirname, '..', 'models', file)),
        `Missing model ${file} for building type ${type}`);
    }
  });
  it('all building types have model mappings in town.js', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    for (const [type, file] of Object.entries(ALL_BUILDING_MODELS)) {
      assert.ok(src.includes(`${type}: '${file}'`),
        `Missing mapping for ${type} → ${file} in town.js`);
    }
  });
  it('model selection uses panelType lookup', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('BUILDING_MODELS[b.panelType]'));
  });
  it('building model loading appends a cache-busting revision query', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes("bestPackFile + '?v=' + MODEL_ASSET_REV"));
  });
});

// ─────────────────────────────────────────────
// 9. Decorative Prop Models
// ─────────────────────────────────────────────
describe('decorative prop placement', () => {
  const PROP_FILES = ['street_lamp.glb', 'park_bench.glb', 'fire_hydrant.glb', 'trash_can.glb',
    'mailbox.glb', 'bus_stop.glb', 'flower_planter.glb', 'garden_center.glb'];
  it('all decorative prop model files exist', () => {
    for (const f of PROP_FILES) {
      assert.ok(fs.existsSync(path.join(__dirname, '..', 'models', f)), `Missing prop ${f}`);
    }
  });
  it('_buildProps is called during init', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('this._buildProps()'));
  });
  it('props are placed at fixed positions along roads', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes("model: 'street_lamp.glb'"));
    assert.ok(src.includes("model: 'park_bench.glb'"));
    assert.ok(src.includes("model: 'fire_hydrant.glb'"));
    assert.ok(src.includes("model: 'trash_can.glb'"));
    assert.ok(src.includes("model: 'mailbox.glb'"));
    assert.ok(src.includes("model: 'bus_stop.glb'"));
    assert.ok(src.includes("model: 'flower_planter.glb'"));
    assert.ok(src.includes("model: 'garden_center.glb'"));
  });
});

// ─────────────────────────────────────────────
// 10. New Player Experience - Visual Aids
// ─────────────────────────────────────────────
describe('new player visual aids', () => {
  it('town.js has beacon builder for Mining HQ', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('_buildBeacon'));
    assert.ok(src.includes('beaconMesh'));
  });
  it('beacon shows during tutorial steps 1-2', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('tutorialStep >= 1 && Game.state.tutorialStep <= 2'));
  });
  it('ui.js has control hints overlay', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'ui.js'), 'utf8');
    assert.ok(src.includes('_showControlHints'));
    assert.ok(src.includes('control-hints'));
  });
  it('control hints show different content for mobile vs desktop', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'ui.js'), 'utf8');
    assert.ok(src.includes('Tap the ground to walk'));
    assert.ok(src.includes('WASD / Arrow keys to move'));
  });
  it('tutorial step 5 message mentions free Laptop', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'ui.js'), 'utf8');
    assert.ok(src.includes('Free Laptop'));
  });
});

// ─────────────────────────────────────────────
// 11. Arrow Key Movement Direction
// ─────────────────────────────────────────────
describe('arrow key movement direction', () => {
  // Simulate the rotation transform from town.js using live camera alpha.
  // BabylonJS left-handed: screen-right = (-sinA, cosA), screen-down = (cosA, sinA)
  function applyRotation(dx, dy, alpha) {
    var sinA = Math.sin(alpha || -Math.PI / 4);
    var cosA = Math.cos(alpha || -Math.PI / 4);
    return { dx: dx * (-sinA) + dy * cosA, dy: dx * cosA + dy * sinA };
  }

  it('up arrow moves character toward top of screen: game(-x, +y)', () => {
    const r = applyRotation(0, -1);
    assert.ok(r.dx < 0, 'game dx should be negative');
    assert.ok(r.dy > 0, 'game dy should be positive');
  });
  it('down arrow moves character toward bottom of screen: game(+x, -y)', () => {
    const r = applyRotation(0, 1);
    assert.ok(r.dx > 0, 'game dx should be positive');
    assert.ok(r.dy < 0, 'game dy should be negative');
  });
  it('right arrow moves character toward right of screen: game(+x, +y)', () => {
    const r = applyRotation(1, 0);
    assert.ok(r.dx > 0, 'game dx should be positive');
    assert.ok(r.dy > 0, 'game dy should be positive');
  });
  it('left arrow moves character toward left of screen: game(-x, -y)', () => {
    const r = applyRotation(-1, 0);
    assert.ok(r.dx < 0, 'game dx should be negative');
    assert.ok(r.dy < 0, 'game dy should be negative');
  });
  it('diagonal up-right moves in pure +y direction', () => {
    const r = applyRotation(1, -1);
    assert.ok(Math.abs(r.dx) < 0.01, 'dx should be ~0 for diagonal');
    assert.ok(r.dy > 0, 'dy should be positive');
  });
  it('camera inputs are cleared for manual control', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('inputs.clear()'), 'default inputs should be removed');
    assert.ok(src.includes('FreeCamera'), 'should use FreeCamera for third-person');
  });
  it('camera orbit uses _camOrbitAngle for direction', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('_camOrbitAngle'), 'should use orbit angle for camera positioning');
  });
});

// ─────────────────────────────────────────────
// 12. Movement Polish
// ─────────────────────────────────────────────
describe('movement polish', () => {
  it('wall-sliding collision tries full move, then X-only, then Y-only', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('collidesBuilding(av.x + moveX, av.y + moveY)'), 'should try full diagonal move');
    assert.ok(src.includes('collidesBuilding(av.x + moveX, av.y)'), 'should try X-only slide');
    assert.ok(src.includes('collidesBuilding(av.x, av.y + moveY)'), 'should try Y-only slide');
    // Should NOT have old step-down loop
    assert.ok(!src.includes('step >= 0.25; step *= 0.5'), 'old step-down collision should be removed');
  });
  it('avatar rotates to face movement direction', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('_facingAngle'), 'should track facing angle');
    assert.ok(src.includes('this._avatarRoot.rotation.y'), 'should apply rotation to avatar root');
  });
  it('camera lerp is 0.15 (not 0.08)', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('* 0.15'), 'camera lerp should be 0.15');
    assert.ok(!src.includes('* 0.08'), 'old 0.08 lerp should be removed');
  });
  it('world edge detection flag exists', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('_atWorldEdge'), 'should track world edge collision');
  });
  it('world edge triggers vignette flash', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('_edgeFlashTimer'), 'should have edge flash timer');
    assert.ok(src.includes('vignetteWeight'), 'should modify vignette weight at edge');
  });
  it('stuck detection timer is 0.6 seconds (not 1.5)', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('_stuckTimer > 0.6'), 'stuck timer should be 0.6s');
    assert.ok(!src.includes('_stuckTimer > 1.5'), 'old 1.5s stuck timer should be removed');
  });
  it('building proximity ring provides visual feedback', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('_proximityRing'), 'should have proximity ring mesh');
    assert.ok(src.includes('proxRing'), 'should create torus ring for building proximity');
  });
  it('short-distance click-to-move skips pathfinding', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('directDist < 200'), 'should skip pathfinding for short distances');
  });
  it('diagonal normalization uses proper vector length', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('Math.sqrt(dx * dx + dy * dy)'), 'should normalize diagonal with vector length');
    assert.ok(!src.includes('dx *= 0.707'), 'old hardcoded 0.707 normalization should be removed');
  });
});

// ─────────────────────────────────────────────
// 13. Uniform Scaling (Buildings + Props)
// ─────────────────────────────────────────────
describe('uniform scaling', () => {
  it('buildings use uniform scale (Math.min of width/depth ratios)', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('uniformScale = Math.min(b.w / modelW, b.h / modelD)'), 'should compute uniform scale from footprint');
    assert.ok(src.includes('Vector3(uniformScale, uniformScale, uniformScale)'), 'should apply same scale to all axes');
  });
  it('props use uniform scale (max dimension)', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('maxDim = Math.max(mW, mH, mD)'), 'should find max dimension');
    assert.ok(src.includes('sc = prop.scale / maxDim'), 'should scale uniformly by max dimension');
    assert.ok(src.includes('Vector3(sc, sc, sc)'), 'should apply same scale to all axes for props');
  });
});

// ─────────────────────────────────────────────
// 14. Loading Screen
// ─────────────────────────────────────────────
describe('loading screen', () => {
  it('index.html has loading screen HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    assert.ok(html.includes('id="loading-screen"'), 'should have loading screen div');
    assert.ok(html.includes('id="loading-bar"'), 'should have loading progress bar');
    assert.ok(html.includes('id="loading-status"'), 'should have loading status text');
  });
  it('town.js tracks loading progress', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('_loadingTotal'), 'should track total assets to load');
    assert.ok(src.includes('_loadingDone'), 'should track loaded assets');
    assert.ok(src.includes('_updateLoadingBar'), 'should have loading bar update function');
  });
  it('loading screen hides when all assets loaded', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('_hideLoadingScreen'), 'should have hide loading screen function');
    assert.ok(src.includes('loading-screen'), 'should reference loading-screen element');
  });
  it('has safety timeout to hide loading screen', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('setTimeout(function() { _hideLoadingScreen(); }'), 'should have safety timeout');
  });
});

// ─────────────────────────────────────────────
// 15. Model Error Handling
// ─────────────────────────────────────────────
describe('model error handling', () => {
  it('building model load has error callback with fallback box', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('createFallbackBox'), 'should have fallback box creator');
    assert.ok(src.includes("console.warn('Failed to load '"), 'should log model load failures');
  });
  it('fallback box uses building color', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes("b.color || '#888888'"), 'should use building color for fallback');
    assert.ok(src.includes('parseInt(c.slice('), 'should parse hex color');
  });
  it('error callback still updates loading bar', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    // Both success and error paths should call _updateLoadingBar
    const matches = src.match(/_updateLoadingBar\(\)/g);
    assert.ok(matches && matches.length >= 2, 'should call _updateLoadingBar in both success and error paths');
  });
});

// ─────────────────────────────────────────────
// 16. Dynamic Label Heights
// ─────────────────────────────────────────────
describe('dynamic label heights', () => {
  it('labels are repositioned based on actual scaled model height', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('actualHeight = modelH * uniformScale'), 'should compute actual height from model');
    assert.ok(src.includes('_labelMeshes[idx]'), 'should store label meshes for later repositioning');
    assert.ok(src.includes('_emojiMeshes[idx]'), 'should store emoji meshes for later repositioning');
  });
  it('label and emoji Y positions use actual height', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('_labelMeshes[idx].position.y = actualHeight + 18'), 'label should be at actualHeight + 18');
    assert.ok(src.includes('_emojiMeshes[idx].position.y = actualHeight + 38'), 'emoji should be at actualHeight + 38');
  });
});

// ─────────────────────────────────────────────
// 17. Review Fix: Loading screen double-call guard
// ─────────────────────────────────────────────
describe('loading screen double-call guard', () => {
  it('_hideLoadingScreen has _loadingHidden guard', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('_loadingHidden'), 'should have guard flag');
    assert.ok(src.includes('if (_loadingHidden) return'), 'should early-return if already hidden');
  });
});

// ─────────────────────────────────────────────
// 18. Review Fix: Trees and props tracked in loading bar
// ─────────────────────────────────────────────
describe('tree and prop loading tracking', () => {
  it('trees increment _loadingTotal and call _updateLoadingBar', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    // _buildTrees function should have _loadingTotal++ and _updateLoadingBar
    const treeSection = src.slice(src.indexOf('_buildTrees: function'), src.indexOf('_buildProps: function'));
    assert.ok(treeSection.includes('_loadingTotal++'), 'trees should increment loading total');
    assert.ok(treeSection.includes('_updateLoadingBar()'), 'trees should call _updateLoadingBar');
  });
  it('props increment _loadingTotal and call _updateLoadingBar', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    const propSection = src.slice(src.indexOf('_buildProps: function'), src.indexOf('_buildCollectibles: function'));
    assert.ok(propSection.includes('_loadingTotal += PROPS.length'), 'props should add to loading total');
    assert.ok(propSection.includes('_updateLoadingBar()'), 'props should call _updateLoadingBar');
  });
  it('tree and prop error callbacks exist', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes("console.warn('Failed to load tree:"), 'trees should have error callback');
    assert.ok(src.includes("console.warn('Failed to load prop"), 'props should have error callback');
  });
});

// ─────────────────────────────────────────────
// 19. Review Fix: Proximity ring built at init, not in render
// ─────────────────────────────────────────────
describe('proximity ring initialization', () => {
  it('_buildProximityRing is called during init', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('this._buildProximityRing()'), 'should call _buildProximityRing during init');
  });
  it('_buildProximityRing creates ring mesh', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes("_buildProximityRing: function()"), 'should have build method');
  });
  it('render loop does not create proximity ring lazily', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    const renderSection = src.slice(src.indexOf('render: function'));
    assert.ok(!renderSection.includes("CreateTorus('proxRing'"), 'render should not create torus');
  });
});

// ─────────────────────────────────────────────
// 20. Review Fix: Render uses real dt, not hardcoded 0.016
// ─────────────────────────────────────────────
describe('render uses real dt', () => {
  it('render function accepts dt parameter', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('render: function(dt)'), 'render should accept dt parameter');
  });
  it('game loop passes dt to Town.render', () => {
    const gameSrc = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
    assert.ok(gameSrc.includes('Town.render(dt)'), 'game loop should pass dt to render');
  });
  it('time accumulation uses dt not hardcoded', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    const renderSection = src.slice(src.indexOf('render: function(dt)'));
    assert.ok(renderSection.includes('this._time += dt'), 'should use dt for time');
    assert.ok(renderSection.includes('dt / 300'), 'should use dt for day/night cycle');
    // The only 0.016 should be in the fallback default, not in time calculations
    assert.ok(!renderSection.includes('this._time += 0.016'), 'should not hardcode 0.016 for time');
  });
});

// ─────────────────────────────────────────────
// 21. Review Fix: Edge flash triggers on rising edge only
// ─────────────────────────────────────────────
describe('edge flash rising edge trigger', () => {
  it('flash only triggers when _atWorldEdge transitions from false to true', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('_wasAtWorldEdge'), 'should track previous edge state');
    assert.ok(src.includes('this._atWorldEdge && !this._wasAtWorldEdge'), 'should check rising edge');
  });
  it('edge flash timer decrements with dt', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('this._edgeFlashTimer -= dt'), 'should decrement by dt not hardcoded');
  });
});

// ─────────────────────────────────────────────
// 22. Avatar Modal Readability Regression Guard
// ─────────────────────────────────────────────
describe('avatar modal readability styles', () => {
  it('keeps minimum readable text sizes on mobile', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
    const ui = fs.readFileSync(path.join(__dirname, '..', 'ui.js'), 'utf8');
    assert.ok(ui.includes('modal-card avatar-modal'), 'avatar creation should use dedicated large-layout modal class');
    assert.ok(ui.includes('modal-card offline-report-modal'), 'offline report should use dedicated readable modal class');
    assert.ok(css.includes('.avatar-modal {'), 'avatar modal class should exist');
    assert.ok(css.includes('.offline-report-modal {'), 'offline report modal class should exist');
    assert.ok(css.includes('max-width: min(920px, 96vw);'), 'desktop avatar modal should not be capped to tiny width');
    assert.ok(css.includes('max-width: min(700px, 95vw);'), 'offline report modal should be widened for readability');
    assert.ok(css.includes('.modal-title { font-size: 28px; }'), 'mobile modal title should stay at least 28px');
    assert.ok(css.includes('.modal-input { font-size: 18px; }'), 'mobile name input should stay at least 18px');
    assert.ok(css.includes('.modal-btn { padding: 14px; font-size: 18px; }'), 'mobile start button should stay readable');
    assert.ok(css.includes('.bonus-name { font-size: 14px; }'), 'mobile bonus title should stay readable');
    assert.ok(css.includes('.bonus-desc { font-size: 13px; }'), 'mobile bonus description should stay readable');
    assert.ok(css.includes('.sprite-option { width: 74px; height: 74px; }'), 'mobile avatar cards should remain tappable');
  });
});
