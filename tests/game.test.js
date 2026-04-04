'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { freshGame } = require('./test-helper');

// ─────────────────────────────────────────────
// 1. Default State
// ─────────────────────────────────────────────
describe('defaultState', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('initializes sats to 0', () => {
    assert.equal(Game.state.sats, 0);
  });
  it('initializes usd to 0', () => {
    assert.equal(Game.state.usd, 0);
  });
  it('initializes heat to 0', () => {
    assert.equal(Game.state.heat, 0);
  });
  it('initializes energy to 100', () => {
    assert.equal(Game.state.energy, 100);
  });
  it('initializes housing to studio', () => {
    assert.equal(Game.state.housing, 'studio');
  });
  it('initializes tokens to 0', () => {
    assert.equal(Game.state.tokens, 0);
  });
  it('initializes version to 3', () => {
    assert.equal(Game.state.version, 3);
  });
  it('has empty owned object', () => {
    assert.equal(Object.keys(Game.state.owned).length, 0);
  });
  it('has empty achievements', () => {
    assert.equal(Object.keys(Game.state.achievements).length, 0);
  });
  it('has empty prestigeUpgrades', () => {
    assert.equal(Object.keys(Game.state.prestigeUpgrades).length, 0);
  });
});

// ─────────────────────────────────────────────
// 2. Constants Integrity
// ─────────────────────────────────────────────
describe('constants integrity', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('has 6 hardware tiers', () => {
    assert.equal(Game.HARDWARE.length, 6);
  });
  it('hardware ids are unique', () => {
    const ids = Game.HARDWARE.map(h => h.id);
    assert.equal(new Set(ids).size, ids.length);
  });
  it('hardware rates increase with tier', () => {
    for (let i = 1; i < Game.HARDWARE.length; i++) {
      assert.ok(Game.HARDWARE[i].rate > Game.HARDWARE[i - 1].rate,
        `${Game.HARDWARE[i].name} rate should exceed ${Game.HARDWARE[i - 1].name}`);
    }
  });
  it('hardware base costs increase with tier', () => {
    for (let i = 1; i < Game.HARDWARE.length; i++) {
      assert.ok(Game.HARDWARE[i].base > Game.HARDWARE[i - 1].base);
    }
  });
  it('has 3 dark web items', () => {
    assert.equal(Game.DARK_WEB.length, 3);
  });
  it('has 5 housing options', () => {
    assert.equal(Game.HOUSING.length, 5);
  });
  it('housing slots increase with tier', () => {
    for (let i = 1; i < Game.HOUSING.length; i++) {
      assert.ok(Game.HOUSING[i].slots > Game.HOUSING[i - 1].slots);
    }
  });
  it('has 5 vehicles', () => {
    assert.equal(Game.VEHICLES.length, 5);
  });
  it('has 6 pets', () => {
    assert.equal(Game.PETS.length, 6);
  });
  it('has 5 research items', () => {
    assert.equal(Game.RESEARCH.length, 5);
  });
  it('has 18 achievements', () => {
    assert.equal(Game.ACHIEVEMENTS.length, 18);
  });
  it('achievement ids are unique', () => {
    const ids = Game.ACHIEVEMENTS.map(a => a.id);
    assert.equal(new Set(ids).size, ids.length);
  });
  it('has 10 prestige upgrades', () => {
    assert.equal(Game.PRESTIGE_UPGRADES.length, 10);
  });
  it('COST_SCALE is 1.18', () => {
    assert.equal(Game.COST_SCALE, 1.18);
  });
});

// ─────────────────────────────────────────────
// 3. Economy - getBulkCost
// ─────────────────────────────────────────────
describe('getBulkCost', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('returns base cost for first unit', () => {
    const laptop = Game.HARDWARE[0]; // base: 15
    assert.equal(Game.getBulkCost(laptop, 1), 15);
  });
  it('scales cost for second unit', () => {
    const laptop = Game.HARDWARE[0];
    Game.state.owned.u1 = 1;
    const cost = Game.getBulkCost(laptop, 1);
    assert.equal(cost, Math.floor(15 * 1.18));
  });
  it('sums cost for bulk purchase', () => {
    const laptop = Game.HARDWARE[0];
    const cost = Game.getBulkCost(laptop, 3);
    const expected = 15 + Math.floor(15 * 1.18) + Math.floor(15 * Math.pow(1.18, 2));
    assert.equal(cost, expected);
  });
  it('applies haggle prestige discount', () => {
    const laptop = Game.HARDWARE[0];
    Game.state.prestigeUpgrades.pu_haggle = true;
    const cost = Game.getBulkCost(laptop, 1);
    assert.equal(cost, Math.floor(15 * 0.9));
  });
  it('does not apply haggle to USD items', () => {
    const darkItem = Game.DARK_WEB[0]; // cur: 'usd'
    Game.state.prestigeUpgrades.pu_haggle = true;
    assert.equal(Game.getBulkCost(darkItem, 1), darkItem.base);
  });
});

// ─────────────────────────────────────────────
// 4. Slot Management
// ─────────────────────────────────────────────
describe('slot management', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('getUsedSlots returns 0 with no hardware', () => {
    assert.equal(Game.getUsedSlots(), 0);
  });
  it('getUsedSlots counts correctly', () => {
    Game.state.owned.u1 = 2; // 1 slot each
    Game.state.owned.u3 = 1; // 2 slots
    assert.equal(Game.getUsedSlots(), 4);
  });
  it('getMaxSlots returns 3 for studio', () => {
    assert.equal(Game.getMaxSlots(), 3);
  });
  it('getMaxSlots returns correct value for house', () => {
    Game.state.housing = 'house';
    assert.equal(Game.getMaxSlots(), 20);
  });
});

// ─────────────────────────────────────────────
// 5. buyItem
// ─────────────────────────────────────────────
describe('buyItem', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('buys item when affordable', () => {
    Game.state.sats = 100;
    const laptop = Game.HARDWARE[0];
    assert.ok(Game.buyItem(laptop, 1));
    assert.equal(Game.state.owned.u1, 1);
    assert.equal(Game.state.sats, 85);
  });
  it('rejects purchase when insufficient funds', () => {
    Game.state.sats = 5;
    const laptop = Game.HARDWARE[0];
    assert.equal(Game.buyItem(laptop, 1), false);
    assert.equal(Game.state.owned.u1 || 0, 0);
  });
  it('rejects purchase when exceeding slot capacity', () => {
    Game.state.sats = 1000000;
    Game.state.housing = 'studio'; // 3 slots
    Game.state.owned.u1 = 3; // 3 slots used
    const laptop = Game.HARDWARE[0];
    assert.equal(Game.buyItem(laptop, 1), false);
  });
  it('deducts USD for usd-currency items', () => {
    Game.state.usd = 1000;
    const botnet = Game.DARK_WEB[0];
    assert.ok(Game.buyItem(botnet, 1));
    assert.equal(Game.state.usd, 1000 - botnet.base);
  });
  it('handles bulk purchases', () => {
    Game.state.sats = 10000;
    const laptop = Game.HARDWARE[0];
    const cost = Game.getBulkCost(laptop, 3);
    assert.ok(Game.buyItem(laptop, 3));
    assert.equal(Game.state.owned.u1, 3);
    assert.equal(Game.state.sats, 10000 - cost);
  });
});

// ─────────────────────────────────────────────
// 6. Production Rate
// ─────────────────────────────────────────────
describe('getProductionRate', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('returns 0 with no hardware', () => {
    assert.equal(Game.getProductionRate(), 0);
  });
  it('sums hardware rates', () => {
    Game.state.owned.u1 = 2; // rate 1 each
    Game.state.owned.u2 = 1; // rate 6
    assert.equal(Game.getProductionRate(), 8);
  });
  it('includes dark web items', () => {
    Game.state.owned.d1 = 1; // rate 200
    assert.equal(Game.getProductionRate(), 200);
  });
  it('adds 1 with automine prestige upgrade', () => {
    Game.state.prestigeUpgrades.pu_automine = true;
    assert.equal(Game.getProductionRate(), 1);
  });
});

// ─────────────────────────────────────────────
// 7. Multiplier
// ─────────────────────────────────────────────
describe('getMultiplier', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('returns 1.0 base multiplier', () => {
    assert.equal(Game.getMultiplier(), 1.0);
  });
  it('adds 10% per prestige token', () => {
    Game.state.tokens = 3;
    assert.ok(Math.abs(Game.getMultiplier() - 1.3) < 0.001);
  });
  it('applies overclock research (+25%)', () => {
    Game.state.research.overclock = true;
    assert.ok(Math.abs(Game.getMultiplier() - 1.25) < 0.001);
  });
  it('applies quantum research (+100%)', () => {
    Game.state.research.quantum = true;
    assert.ok(Math.abs(Game.getMultiplier() - 2.0) < 0.001);
  });
  it('stacks overclock and quantum', () => {
    Game.state.research.overclock = true;
    Game.state.research.quantum = true;
    assert.ok(Math.abs(Game.getMultiplier() - 2.5) < 0.001);
  });
  it('applies dog pet bonus (+5%)', () => {
    Game.state.pet = 'dog';
    assert.ok(Math.abs(Game.getMultiplier() - 1.05) < 0.001);
  });
  it('applies mega production prestige (+50%)', () => {
    Game.state.prestigeUpgrades.pu_megaprod = true;
    assert.ok(Math.abs(Game.getMultiplier() - 1.5) < 0.001);
  });
  it('applies heat penalty above 50%', () => {
    Game.state.heat = 75;
    const mul = Game.getMultiplier();
    assert.ok(mul < 1.0, `Expected multiplier < 1 with high heat, got ${mul}`);
  });
  it('applies severe penalty at 0 energy', () => {
    Game.state.energy = 0;
    const mul = Game.getMultiplier();
    assert.ok(Math.abs(mul - 0.05) < 0.001);
  });
  it('applies 50% penalty at low energy', () => {
    Game.state.energy = 20;
    assert.ok(Math.abs(Game.getMultiplier() - 0.5) < 0.001);
  });
});

// ─────────────────────────────────────────────
// 8. Heat Multiplier
// ─────────────────────────────────────────────
describe('getHeatMultiplier', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('returns 1.0 base', () => {
    assert.equal(Game.getHeatMultiplier(), 1.0);
  });
  it('applies heatsink research (-30%)', () => {
    Game.state.research.heatsink = true;
    assert.ok(Math.abs(Game.getHeatMultiplier() - 0.7) < 0.001);
  });
  it('applies cat pet bonus (-5%)', () => {
    Game.state.pet = 'cat';
    assert.ok(Math.abs(Game.getHeatMultiplier() - 0.95) < 0.001);
  });
  it('never goes below 0.1', () => {
    Game.state.research.heatsink = true;
    Game.state.pet = 'cat';
    Game.state.avatar = { bonus: 'coolrunner' };
    Game.state.clothing = { cl_jacket: true };
    Game.state.furniture = { fu_plant: true };
    assert.ok(Game.getHeatMultiplier() >= 0.1);
  });
});

// ─────────────────────────────────────────────
// 9. Sell Multiplier
// ─────────────────────────────────────────────
describe('getSellMultiplier', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('returns 1.0 base', () => {
    assert.equal(Game.getSellMultiplier(), 1.0);
  });
  it('applies algo_trade research (+10%)', () => {
    Game.state.research.algo_trade = true;
    assert.ok(Math.abs(Game.getSellMultiplier() - 1.1) < 0.001);
  });
  it('applies parrot pet (+15%)', () => {
    Game.state.pet = 'parrot';
    assert.ok(Math.abs(Game.getSellMultiplier() - 1.15) < 0.001);
  });
});

// ─────────────────────────────────────────────
// 10. Electricity Cost
// ─────────────────────────────────────────────
describe('getElectricityCost', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('returns 0 with no hardware', () => {
    assert.equal(Game.getElectricityCost(), 0);
  });
  it('calculates cost from hardware heat', () => {
    Game.state.owned.u1 = 1; // heat 0.2
    const cost = Game.getElectricityCost();
    assert.ok(Math.abs(cost - 0.002) < 0.0001);
  });
  it('returns 0 with solar housing', () => {
    Game.state.housing = 'solar';
    Game.state.owned.u1 = 10;
    assert.equal(Game.getElectricityCost(), 0);
  });
  it('applies solar research (-50%)', () => {
    Game.state.owned.u1 = 1;
    const baseCost = Game.getElectricityCost();
    Game.state.research.solar_int = true;
    assert.ok(Math.abs(Game.getElectricityCost() - baseCost * 0.5) < 0.0001);
  });
  it('applies efficient prestige (-25%)', () => {
    Game.state.owned.u1 = 1;
    const baseCost = Game.getElectricityCost();
    Game.state.prestigeUpgrades.pu_efficient = true;
    assert.ok(Math.abs(Game.getElectricityCost() - baseCost * 0.75) < 0.0001);
  });
});

// ─────────────────────────────────────────────
// 11. Energy System
// ─────────────────────────────────────────────
describe('energy system', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('getEnergyMax returns 100 at base', () => {
    assert.equal(Game.getEnergyMax(), 100);
  });
  it('gym levels add 20 max energy each', () => {
    Game.state.gymLevel = 3;
    assert.equal(Game.getEnergyMax(), 160);
  });
  it('getEnergyRegen returns 0.5 at base', () => {
    assert.equal(Game.getEnergyRegen(), 0.5);
  });
  it('gym levels increase regen', () => {
    Game.state.gymLevel = 2;
    assert.ok(Math.abs(Game.getEnergyRegen() - 0.9) < 0.001);
  });
});

// ─────────────────────────────────────────────
// 12. tapMine
// ─────────────────────────────────────────────
describe('tapMine', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('grants base 5 sats per tap', () => {
    const gain = Game.tapMine();
    assert.equal(gain, 5);
    assert.equal(Game.state.sats, 5);
  });
  it('tracks lifetime and total sats', () => {
    Game.tapMine();
    assert.equal(Game.state.totalSats, 5);
    assert.equal(Game.state.lifetimeSats, 5);
  });
  it('scales with owned hardware', () => {
    Game.state.owned.u1 = 3;
    const gain = Game.tapMine();
    assert.equal(gain, 5 + 3 * 2); // base 5 + 3 hw * 2
  });
  it('applies double tap prestige', () => {
    Game.state.prestigeUpgrades.pu_double_tap = true;
    const gain = Game.tapMine();
    assert.equal(gain, 10);
  });
  it('applies hamster pet bonus', () => {
    Game.state.pet = 'hamster';
    const gain = Game.tapMine();
    assert.equal(gain, 15); // 5 base + 10 hamster
  });
  it('increases heat slightly', () => {
    Game.tapMine();
    assert.ok(Math.abs(Game.state.heat - 0.05) < 0.001);
  });
  it('increments tap counter', () => {
    Game.tapMine();
    Game.tapMine();
    assert.equal(Game.state.stats.taps, 2);
  });
});

// ─────────────────────────────────────────────
// 13. ventHeat
// ─────────────────────────────────────────────
describe('ventHeat', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('reduces heat by up to 20', () => {
    Game.state.heat = 50;
    const cooled = Game.ventHeat();
    assert.equal(cooled, 20);
    assert.equal(Game.state.heat, 30);
  });
  it('only reduces by available heat', () => {
    Game.state.heat = 10;
    const cooled = Game.ventHeat();
    assert.equal(cooled, 10);
    assert.equal(Game.state.heat, 0);
  });
});

// ─────────────────────────────────────────────
// 14. sellSats
// ─────────────────────────────────────────────
describe('sellSats', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('converts sats to USD at market price', () => {
    Game.state.sats = 100000000; // 1 BTC
    Game.state.price = 65000;
    const usd = Game.sellSats(1.0);
    assert.ok(usd > 0);
    assert.equal(Game.state.sats, 0);
  });
  it('sells correct fraction', () => {
    Game.state.sats = 1000;
    Game.sellSats(0.5);
    assert.equal(Game.state.sats, 500);
  });
  it('returns 0 when no sats', () => {
    assert.equal(Game.sellSats(0.5), 0);
  });
  it('tracks satsSold stat', () => {
    Game.state.sats = 1000;
    Game.sellSats(1.0);
    assert.equal(Game.state.stats.satsSold, 1000);
  });
});

// ─────────────────────────────────────────────
// 15. Prestige System
// ─────────────────────────────────────────────
describe('prestige system', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('getPrestigeTokens returns 0 with no sats', () => {
    assert.equal(Game.getPrestigeTokens(), 0);
  });
  it('getPrestigeTokens scales with lifetime sats', () => {
    Game.state.lifetimeSats = 200000;
    assert.equal(Game.getPrestigeTokens(), 2);
  });
  it('canPrestige returns false initially', () => {
    assert.equal(Game.canPrestige(), false);
  });
  it('canPrestige returns true when eligible', () => {
    Game.state.lifetimeSats = 200000;
    assert.ok(Game.canPrestige());
  });
  it('buyPrestigeUpgrade deducts tokens', () => {
    Game.state.tokens = 10;
    assert.ok(Game.buyPrestigeUpgrade('pu_automine')); // cost 2
    assert.equal(Game.state.tokens, 8);
    assert.ok(Game.hasPrestigeUpgrade('pu_automine'));
  });
  it('rejects duplicate prestige upgrade', () => {
    Game.state.tokens = 10;
    Game.buyPrestigeUpgrade('pu_automine');
    assert.equal(Game.buyPrestigeUpgrade('pu_automine'), false);
  });
  it('rejects prestige upgrade with insufficient tokens', () => {
    Game.state.tokens = 1;
    assert.equal(Game.buyPrestigeUpgrade('pu_automine'), false); // cost 2
  });
});

// ─────────────────────────────────────────────
// 16. Skill Tree
// ─────────────────────────────────────────────
describe('skill tree', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('buySkill succeeds with enough points', () => {
    Game.state.skillPoints = 5;
    assert.ok(Game.buySkill('sk_hash1'));
    assert.ok(Game.hasSkill('sk_hash1'));
    assert.equal(Game.state.skillPoints, 4);
  });
  it('rejects skill without prerequisite', () => {
    Game.state.skillPoints = 5;
    assert.equal(Game.buySkill('sk_hash2'), false); // requires sk_hash1
  });
  it('allows tier 2 after tier 1', () => {
    Game.state.skillPoints = 10;
    Game.buySkill('sk_hash1');
    assert.ok(Game.buySkill('sk_hash2'));
  });
  it('rejects duplicate skill purchase', () => {
    Game.state.skillPoints = 10;
    Game.buySkill('sk_hash1');
    assert.equal(Game.buySkill('sk_hash1'), false);
  });
  it('rejects with insufficient points', () => {
    Game.state.skillPoints = 0;
    assert.equal(Game.buySkill('sk_hash1'), false);
  });
});

// ─────────────────────────────────────────────
// 17. Loans
// ─────────────────────────────────────────────
describe('loans', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('takeLoan grants USD', () => {
    assert.ok(Game.takeLoan('small'));
    assert.equal(Game.state.usd, 100);
  });
  it('only allows one loan at a time', () => {
    Game.takeLoan('small');
    assert.equal(Game.takeLoan('medium'), false);
  });
  it('repayLoan deducts owed amount', () => {
    Game.takeLoan('small'); // amount 100, rate 0.05 → owed 105
    Game.state.usd = 200;
    assert.ok(Game.repayLoan());
    assert.ok(Math.abs(Game.state.usd - 95) < 0.01);
    assert.equal(Game.state.loans.length, 0);
  });
  it('rejects repay with insufficient funds', () => {
    Game.takeLoan('small');
    Game.state.usd = 50; // owed is 105
    assert.equal(Game.repayLoan(), false);
  });
});

// ─────────────────────────────────────────────
// 18. Garden System
// ─────────────────────────────────────────────
describe('garden', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('getMaxPlots returns 0 for studio', () => {
    assert.equal(Game.getMaxPlots(), 0);
  });
  it('getMaxPlots returns 2 for house', () => {
    Game.state.housing = 'house';
    assert.equal(Game.getMaxPlots(), 2);
  });
  it('plantSeed fails with no plots', () => {
    Game.state.usd = 1000;
    assert.equal(Game.plantSeed('seed_herb'), false);
  });
  it('plantSeed succeeds with available plot', () => {
    Game.state.housing = 'house';
    Game.state.usd = 1000;
    assert.ok(Game.plantSeed('seed_herb'));
    assert.equal(Game.state.garden.length, 1);
    assert.equal(Game.state.usd, 980); // cost 20
  });
  it('plantSeed fails with insufficient USD', () => {
    Game.state.housing = 'house';
    Game.state.usd = 5;
    assert.equal(Game.plantSeed('seed_herb'), false);
  });
});

// ─────────────────────────────────────────────
// 19. Police System
// ─────────────────────────────────────────────
describe('police system', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('bribePolice reduces risk', () => {
    Game.state.policeRisk = 30;
    Game.state.usd = 1000;
    assert.ok(Game.bribePolice());
    assert.equal(Game.state.policeRisk, 20);
    assert.equal(Game.state.usd, 500);
  });
  it('bribePolice fails with 0 risk', () => {
    Game.state.usd = 1000;
    assert.equal(Game.bribePolice(), false);
  });
  it('bribePolice fails at 75+ risk', () => {
    Game.state.policeRisk = 75;
    Game.state.usd = 1000;
    assert.equal(Game.bribePolice(), false);
  });
  it('payTicket removes ticket and deducts fine', () => {
    Game.state.tickets = [{ fine: 100 }];
    Game.state.usd = 200;
    assert.ok(Game.payTicket(0));
    assert.equal(Game.state.tickets.length, 0);
    assert.equal(Game.state.usd, 100);
  });
});

// ─────────────────────────────────────────────
// 20. Sleep System
// ─────────────────────────────────────────────
describe('sleep', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('restores 50 energy by default', () => {
    Game.state.lastSleepTime = 0;
    Game.state.energy = 30;
    const result = Game.sleep();
    assert.equal(result.energy, 50);
    assert.equal(Game.state.energy, 80);
  });
  it('restores 75 with comfy bed', () => {
    Game.state.lastSleepTime = 0;
    Game.state.energy = 10;
    Game.state.furniture = { fu_bed_good: true };
    const result = Game.sleep();
    assert.equal(result.energy, 75);
  });
  it('restores 100 with luxury bed', () => {
    Game.state.lastSleepTime = 0;
    Game.state.energy = 0;
    Game.state.furniture = { fu_bed_luxury: true };
    const result = Game.sleep();
    assert.equal(result.energy, 100);
  });
  it('rejects sleep if cooldown not expired', () => {
    Game.state.lastSleepTime = Date.now();
    const result = Game.sleep();
    assert.ok(result.error);
  });
  it('reduces heat by 10', () => {
    Game.state.lastSleepTime = 0;
    Game.state.heat = 30;
    Game.sleep();
    assert.equal(Game.state.heat, 20);
  });
});

// ─────────────────────────────────────────────
// 21. Delivery System
// ─────────────────────────────────────────────
describe('deliveries', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('completeDelivery grants sats and usd', () => {
    Game.state.activeDelivery = { sats: 100, usd: 5, targetName: 'Test' };
    assert.ok(Game.completeDelivery());
    assert.equal(Game.state.sats, 100);
    assert.equal(Game.state.usd, 5);
    assert.equal(Game.state.activeDelivery, null);
  });
  it('completeDelivery tracks stats', () => {
    Game.state.activeDelivery = { sats: 50, usd: 2, targetName: 'Test' };
    Game.completeDelivery();
    assert.equal(Game.state.stats.deliveriesCompleted, 1);
  });
  it('completeDelivery fails with no active delivery', () => {
    assert.equal(Game.completeDelivery(), false);
  });
});

// ─────────────────────────────────────────────
// 22. Achievements
// ─────────────────────────────────────────────
describe('achievements', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('first sat achievement triggers at 1 lifetime sat', () => {
    Game.state.lifetimeSats = 1;
    Game.checkAchievements();
    assert.ok(Game.state.achievements.a_first_sat);
  });
  it('achievement grants reward sats', () => {
    Game.state.lifetimeSats = 1;
    const before = Game.state.sats;
    Game.checkAchievements();
    assert.equal(Game.state.sats, before + 10); // a_first_sat reward: 10
  });
  it('does not re-trigger completed achievements', () => {
    Game.state.lifetimeSats = 1;
    Game.checkAchievements();
    const satsAfterFirst = Game.state.sats;
    Game.checkAchievements();
    assert.equal(Game.state.sats, satsAfterFirst);
  });
  it('getAchievementCount reflects unlocked', () => {
    assert.equal(Game.getAchievementCount(), 0);
    Game.state.lifetimeSats = 100;
    Game.checkAchievements();
    assert.ok(Game.getAchievementCount() >= 2); // first_sat + 100_sats
  });
});

// ─────────────────────────────────────────────
// 23. formatNumber
// ─────────────────────────────────────────────
describe('formatNumber', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('formats billions', () => {
    assert.equal(Game.formatNumber(1500000000), '1.5B');
  });
  it('formats millions', () => {
    assert.equal(Game.formatNumber(2500000), '2.5M');
  });
  it('formats thousands', () => {
    assert.equal(Game.formatNumber(1500), '1.5K');
  });
  it('formats small numbers', () => {
    const result = Game.formatNumber(42);
    assert.ok(result.includes('42'));
  });
});

// ─────────────────────────────────────────────
// 24. Price System
// ─────────────────────────────────────────────
describe('price system', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('getEffectivePrice returns base price normally', () => {
    Game.state.price = 65000;
    assert.equal(Game.getEffectivePrice(), 65000);
  });
  it('applies price event multiplier', () => {
    Game.state.price = 65000;
    Game.state.priceEvent = { mult: 1.2, endsAt: Date.now() + 60000 };
    assert.equal(Game.getEffectivePrice(), 78000);
  });
  it('enforces minimum price of 1000', () => {
    Game.state.price = 500;
    assert.equal(Game.getEffectivePrice(), 1000);
  });
});

// ─────────────────────────────────────────────
// 25. Craig Rival
// ─────────────────────────────────────────────
describe('craig rival', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('sabotageCraig costs 1000 sats', () => {
    Game.state.sats = 2000;
    assert.ok(Game.sabotageCraig());
    assert.equal(Game.state.sats, 1000);
    assert.ok(Game.state.craig._sabotageUntil > Date.now());
  });
  it('sabotageCraig fails with insufficient sats', () => {
    Game.state.sats = 500;
    assert.equal(Game.sabotageCraig(), false);
  });
  it('challengeCraig returns result object', () => {
    Game.state.owned.u1 = 1;
    Game.state.craig = { sats: 100, hardware: 0, lastTaunt: 0 };
    const result = Game.challengeCraig();
    assert.ok(result !== null);
    assert.ok('won' in result);
    assert.ok('prize' in result);
    assert.ok('playerScore' in result);
    assert.ok('craigScore' in result);
  });
});

// ─────────────────────────────────────────────
// 26. Area Unlock
// ─────────────────────────────────────────────
describe('area unlock', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('starts with north unlocked', () => {
    assert.equal(Game.state.unlockedAreas.length, 1);
    assert.equal(Game.state.unlockedAreas[0], 'north');
  });
  it('unlocks south at 50K lifetime sats', () => {
    Game.state.lifetimeSats = 50000;
    Game.checkAreaUnlock();
    assert.ok(Game.state.unlockedAreas.includes('south'));
  });
  it('unlocks waterfront at 500K lifetime sats', () => {
    Game.state.lifetimeSats = 500000;
    Game.checkAreaUnlock();
    assert.ok(Game.state.unlockedAreas.includes('waterfront'));
  });
  it('does not unlock south below threshold', () => {
    Game.state.lifetimeSats = 49999;
    Game.checkAreaUnlock();
    assert.ok(!Game.state.unlockedAreas.includes('south'));
  });
});

// ─────────────────────────────────────────────
// 27. Building Reputation
// ─────────────────────────────────────────────
describe('building reputation', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('visitBuilding tracks visits', () => {
    Game.visitBuilding('mine');
    Game.visitBuilding('mine');
    assert.equal(Game.state.buildingVisits.mine, 2);
  });
  it('getBuildingDiscount returns 0 for few visits', () => {
    assert.equal(Game.getBuildingDiscount('mine'), 0);
  });
  it('getBuildingDiscount returns 0.10 at 15 visits', () => {
    Game.state.buildingVisits = { mine: 15 };
    assert.equal(Game.getBuildingDiscount('mine'), 0.10);
  });
  it('getBuildingDiscount returns 0.15 at 30 visits', () => {
    Game.state.buildingVisits = { mine: 30 };
    assert.equal(Game.getBuildingDiscount('mine'), 0.15);
  });
});

// ─────────────────────────────────────────────
// 28. Save Slots
// ─────────────────────────────────────────────
describe('save slots', () => {
  let Game;
  beforeEach(() => { Game = freshGame(); });

  it('rejects out-of-range slot index for save', () => {
    assert.equal(Game.saveToSlot(-1), false);
    assert.equal(Game.saveToSlot(4), false);
  });
  it('rejects out-of-range slot index for load', () => {
    assert.equal(Game.loadFromSlot(-1), false);
    assert.equal(Game.loadFromSlot(4), false);
  });
});
