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
      this.inputs = { addMouseWheel: function() {} };
      this.lowerRadiusLimit = 0; this.upperRadiusLimit = 0;
      this.lowerBetaLimit = 0; this.upperBetaLimit = 0;
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

  const context = {
    window: {},
    document: {
      createElement: function(tag) { return new StubCanvas(); },
      getElementById: function() { return new StubCanvas(); },
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
  it('vignette weight is 1.5', () => {
    assert.equal(calls.pipeline.imageProcessing.vignetteWeight, 1.5);
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
    pet_shop: 'pet_shop.glb',
    pawn_shop: 'pawn_shop.glb',
    utility: 'bitcoin_atm.glb',
    clothing: 'clothing_store.glb',
    apartment: 'apartment_building.glb',
    homegoods: 'furniture_store.glb',
  };
  it('all 19 unique building model files exist', () => {
    for (const [type, file] of Object.entries(ALL_BUILDING_MODELS)) {
      assert.ok(fs.existsSync(path.join(__dirname, '..', 'models', file)),
        `Missing model ${file} for building type ${type}`);
    }
  });
  it('generic fallback model exists for unmapped buildings', () => {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'models', 'building-garage.glb')));
  });
  it('all building types have model mappings in town.js', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    for (const [type, file] of Object.entries(ALL_BUILDING_MODELS)) {
      assert.ok(src.includes(`${type}: '${file}'`),
        `Missing mapping for ${type} → ${file} in town.js`);
    }
  });
  it('model selection uses panelType lookup before generic fallback', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'town.js'), 'utf8');
    assert.ok(src.includes('BUILDING_MODELS[b.panelType]'));
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
