'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function freshUI(gameOverrides) {
  const elements = {};

  function makeClassList() {
    const set = new Set();
    return {
      add: function(cls) { set.add(cls); },
      remove: function(cls) { set.delete(cls); },
      contains: function(cls) { return set.has(cls); },
      toString: function() { return Array.from(set).join(' '); },
    };
  }

  function StubElement(id) {
    this.id = id || '';
    this.className = '';
    this.style = {};
    this.innerHTML = '';
    this.textContent = '';
    this.children = [];
    this.dataset = {};
    this.classList = makeClassList();
    this.parentElement = null;
    this.appendChild = function(child) {
      if (child.id) elements[child.id] = child;
      child.parentElement = this;
      this.children.push(child);
      return child;
    };
    this.addEventListener = function() {};
    this.querySelectorAll = function() { return []; };
    this.querySelector = function() { return null; };
    this.contains = function(target) { return target === this; };
    this.focus = function() {};
    this.remove = function() {};
  }

  function getElement(id) {
    if (!elements[id]) elements[id] = new StubElement(id);
    return elements[id];
  }

  const defaultGame = {
    state: {
      avatar: { x: 0, y: 0 },
      sessionFlags: {},
      currentObjective: 0,
      activeMilestones: [],
      lifetimeSats: 0,
      craig: { sats: 0 },
    },
    OBJECTIVES: [{ id: 'buy_desktop' }],
    isBuildingUnlocked: function() { return true; },
    getLockedBuildingLabel: function() { return 'Locked'; },
    getPrimaryGoal: function() {
      return {
        phase: 'objective',
        label: 'Buy a Desktop',
        progress: { text: '42/150 sats' },
      };
    },
    getMilestoneById: function(id) { return { id: id, label: id }; },
    getGoalProgress: function() { return { text: '0/1' }; },
    getBuildingLevel: function() { return 0; },
    getBuildingDiscount: function() { return 0; },
    visitBuilding: function() {},
    completeDelivery: function() {},
    formatNumber: function(n) { return String(n); },
  };

  const Game = Object.assign({}, defaultGame, gameOverrides || {});
  Game.state = Object.assign({}, defaultGame.state, (gameOverrides && gameOverrides.state) || {});

  const context = {
    window: {},
    document: {
      getElementById: getElement,
      createElement: function() { return new StubElement(); },
      body: new StubElement('body'),
      activeElement: null,
      addEventListener: function() {},
      querySelectorAll: function() { return []; },
    },
    Game: Game,
    Town: { BUILDINGS: [] },
    Sound: null,
    console: console,
    setTimeout: function(fn) { return fn(); },
    clearTimeout: function() {},
    setInterval: function() { return 0; },
    clearInterval: function() {},
    Math: Math,
    Date: Date,
  };
  context.window = context;
  context.window.addEventListener = function() {};

  const uiSource = fs.readFileSync(path.join(__dirname, '..', 'ui.js'), 'utf8');
  vm.createContext(context);
  vm.runInContext(uiSource, context);

  return { UI: context.window.UI, Game: context.Game, elements: elements, getElement: getElement };
}

describe('objective hud regression', () => {
  it('renders the current objective label and progress into the objective bar', () => {
    const { UI, elements } = freshUI();
    UI.renderObjectiveBar();

    assert.ok(elements.objectiveBar.innerHTML.includes('Buy a Desktop'));
    assert.ok(elements.objectiveBar.innerHTML.includes('42/150 sats'));
    assert.ok(elements.objectiveBar.innerHTML.includes('Objective'));
    assert.equal(elements.objectiveBar.style.display, 'block');
  });

  it('renders milestone chips after the linear objective chain is complete', () => {
    const { UI, Game, elements } = freshUI({
      state: { currentObjective: 1, activeMilestones: ['own_three_rigs', 'five_deliveries'] },
      OBJECTIVES: [{ id: 'done' }],
      getPrimaryGoal: function() {
        return {
          phase: 'milestone',
          label: 'Own 3 rigs total',
          progress: { text: '2/3 rigs' },
        };
      },
      getMilestoneById: function(id) {
        return {
          own_three_rigs: { id: id, label: 'Own 3 rigs total' },
          five_deliveries: { id: id, label: 'Complete 5 deliveries' },
        }[id];
      },
      getGoalProgress: function(goal) {
        return goal.id === 'own_three_rigs' ? { text: '2/3 rigs' } : { text: '1/5 deliveries' };
      },
    });

    UI.renderObjectiveBar();

    assert.ok(elements.objectiveBar.innerHTML.includes('Goal'));
    assert.ok(elements.objectiveBar.innerHTML.includes('Own 3 rigs total'));
    assert.ok(elements.objectiveBar.innerHTML.includes('Complete 5 deliveries'));
    assert.equal(Game.state.currentObjective >= Game.OBJECTIVES.length, true);
  });

  it('renders a larger objective completion celebration card', () => {
    const { UI, elements } = freshUI();

    UI.showObjectiveComplete({ label: 'Buy a Desktop' }, 'Unlocked 2 new destinations • +$10');

    assert.ok(elements.objectiveCelebration.innerHTML.includes('Objective Complete'));
    assert.ok(elements.objectiveCelebration.innerHTML.includes('Buy a Desktop'));
    assert.ok(elements.objectiveCelebration.innerHTML.includes('Unlocked 2 new destinations'));
  });

  it('renders a first-sell spotlight with the tutorial bonus messaging', () => {
    const { UI, elements } = freshUI();

    UI.showFirstSellSpotlight({ usdGain: 0.02, objectiveBonus: 10 });

    assert.ok(elements.firstSellSpotlight.innerHTML.includes('First Cash-Out'));
    assert.ok(elements.firstSellSpotlight.innerHTML.includes('Objective bonus: +$10.00'));
  });

  it('renders a production boost card after a hardware upgrade', () => {
    const { UI, elements } = freshUI();

    UI.showProductionBoost({ name: 'Desktop' }, 1, 1, 7);

    assert.ok(elements.productionBoost.innerHTML.includes('Production Boost'));
    assert.ok(elements.productionBoost.innerHTML.includes('Desktop'));
    assert.ok(elements.productionBoost.innerHTML.includes('1/s'));
    assert.ok(elements.productionBoost.innerHTML.includes('7/s'));
  });
});

describe('locked building access regression', () => {
  it('showPanel blocks locked buildings before opening the panel or tracking a visit', () => {
    let visited = 0;
    let toastMessage = '';
    const { UI, getElement } = freshUI({
      isBuildingUnlocked: function() { return false; },
      getLockedBuildingLabel: function() { return 'Finish: Buy a Desktop'; },
      visitBuilding: function() { visited++; },
    });
    const panel = getElement('panel');

    UI.toast = function(msg) { toastMessage = msg; };
    UI.showPanel({ id: 'hardware', panelType: 'hardware', name: 'Hardware Shop' });

    assert.equal(toastMessage, 'Finish: Buy a Desktop');
    assert.equal(visited, 0);
    assert.notEqual(panel.style.display, 'block');
    assert.equal(UI.panelOpen, false);
  });
});
