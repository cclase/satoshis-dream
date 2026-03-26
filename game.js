(function() {
  'use strict';

  // ── Hardware constants (preserved from v2.5) ──
  var HARDWARE = [
    { id: 'u1', name: 'Laptop',      icon: '\u{1F4BB}', base: 15,      rate: 1,    heat: 0.2,  cur: 'sats', slots: 1 },
    { id: 'u2', name: 'Desktop',     icon: '\u{1F5A5}\uFE0F', base: 150,     rate: 6,    heat: 0.5,  cur: 'sats', slots: 1 },
    { id: 'u3', name: 'GPU Rig',     icon: '\u{1F3AE}', base: 2000,    rate: 35,   heat: 1.5,  cur: 'sats', slots: 2 },
    { id: 'u4', name: 'ASIC Miner',  icon: '\u26A1',    base: 40000,   rate: 450,  heat: 8.0,  cur: 'sats', slots: 3 },
    { id: 'u5', name: 'Mining Farm',  icon: '\u{1F3ED}', base: 250000,  rate: 2800, heat: 25.0, cur: 'sats', slots: 5 },
    { id: 'u6', name: 'Megafarm',    icon: '\u{1F30D}', base: 1000000, rate: 9500, heat: 50.0, cur: 'sats', slots: 10 },
  ];

  var DARK_WEB = [
    { id: 'd1', name: 'Botnet',  icon: '\u{1F480}', base: 500,    rate: 50,    heat: 2,    cur: 'usd', desc: '+50/s, +heat, +risk' },
    { id: 'd2', name: 'Coolant', icon: '\u2744\uFE0F', base: 1000,  rate: 0,     heat: -0.05, cur: 'usd', desc: '-Heat gen' },
    { id: 'd3', name: 'Relay',   icon: '\u{1F6F0}\uFE0F', base: 25000, rate: 500,   heat: 8,    cur: 'usd', desc: '+500/s, high heat+risk' },
  ];

  var HOUSING = [
    { id: 'studio',    name: 'Studio Apartment', slots: 3,   cost: 0,       cur: 'usd' },
    { id: 'apartment', name: 'Apartment',        slots: 8,   cost: 500,     cur: 'usd' },
    { id: 'house',     name: 'House',            slots: 20,  cost: 5000,    cur: 'usd' },
    { id: 'warehouse', name: 'Warehouse',        slots: 50,  cost: 50000,   cur: 'usd' },
    { id: 'solar',     name: 'Solar Farm',       slots: 200, cost: 1000000, cur: 'usd' },
  ];

  var VEHICLES = [
    { id: 'bicycle',   name: 'Bicycle',     icon: '\u{1F6B2}', speed: 1.2,  cost: 50,     cur: 'usd' },
    { id: 'scooter',   name: 'Scooter',     icon: '\u{1F6F5}', speed: 1.4,  cost: 200,    cur: 'usd' },
    { id: 'car',       name: 'Car',         icon: '\u{1F697}', speed: 1.6,  cost: 2000,   cur: 'usd' },
    { id: 'sports',    name: 'Sports Car',  icon: '\u{1F3CE}\uFE0F', speed: 1.8,  cost: 25000,  cur: 'usd' },
    { id: 'heli',      name: 'Helicopter',  icon: '\u{1F681}', speed: 2.5,  cost: 500000, cur: 'usd' },
  ];

  var PETS = [
    { id: 'dog',     name: 'Dog',     icon: '\u{1F415}', cost: 100,  cur: 'usd', desc: '+5% income',       bonus: 'income', val: 0.05 },
    { id: 'cat',     name: 'Cat',     icon: '\u{1F408}', cost: 150,  cur: 'usd', desc: '-5% heat',         bonus: 'heat',   val: 0.05 },
    { id: 'hamster', name: 'Hamster', icon: '\u{1F439}', cost: 300,  cur: 'usd', desc: '+10 sats/tap',     bonus: 'tap',    val: 10 },
    { id: 'parrot',  name: 'Parrot',  icon: '\u{1F99C}', cost: 1000, cur: 'usd', desc: '+15% sell price',  bonus: 'sell',   val: 0.15 },
    { id: 'lizard',  name: 'Lizard',  icon: '\u{1F98E}', cost: 2000, cur: 'usd', desc: '-10% electricity', bonus: 'elec',   val: 0.10 },
    { id: 'snake',   name: 'Snake',   icon: '\u{1F40D}', cost: 5000, cur: 'usd', desc: '+25% income, risky', bonus: 'snake', val: 0.25, darkWeb: true },
  ];

  var RESEARCH = [
    { id: 'overclock',  name: 'Overclocking',        desc: '+25% production',   cost: 5000,   cur: 'sats' },
    { id: 'heatsink',   name: 'Heat Sink Design',     desc: '-30% heat gen',     cost: 10000,  cur: 'sats' },
    { id: 'solar_int',  name: 'Solar Integration',    desc: '-50% electricity',  cost: 1000,   cur: 'usd' },
    { id: 'algo_trade', name: 'Algorithmic Trading',  desc: '+10% sell price',   cost: 5000,   cur: 'usd' },
    { id: 'quantum',    name: 'Quantum Computing',    desc: '+100% production',  cost: 100000, cur: 'usd' },
  ];

  var LOANS = [
    { id: 'small',  name: 'Small Loan',  amount: 100,   rate: 0.05 },
    { id: 'medium', name: 'Medium Loan', amount: 1000,  rate: 0.08 },
    { id: 'large',  name: 'Large Loan',  amount: 10000, rate: 0.12 },
  ];

  var CLOTHING = [
    { id: 'cl_hat',     name: 'Bitcoin Cap',     icon: '\u{1F9E2}', cost: 50,    cur: 'usd', desc: '+2% income',     bonus: 'income', val: 0.02 },
    { id: 'cl_jacket',  name: 'Hoodie',          icon: '\u{1F9E5}', cost: 200,   cur: 'usd', desc: '-3% heat',       bonus: 'heat',   val: 0.03 },
    { id: 'cl_shoes',   name: 'Running Shoes',   icon: '\u{1F45F}', cost: 500,   cur: 'usd', desc: '+10% speed',     bonus: 'speed',  val: 0.1 },
    { id: 'cl_suit',    name: 'Business Suit',   icon: '\u{1F454}', cost: 2000,  cur: 'usd', desc: '+5% sell price', bonus: 'sell',   val: 0.05 },
    { id: 'cl_watch',   name: 'Gold Watch',      icon: '\u231A',    cost: 10000, cur: 'usd', desc: '+8% income',     bonus: 'income', val: 0.08 },
  ];

  var FURNITURE = [
    { id: 'fu_desk',    name: 'Mining Desk',     icon: '\u{1F5A5}\uFE0F', cost: 100,   cur: 'usd', desc: '+3% production', bonus: 'prod', val: 0.03 },
    { id: 'fu_chair',   name: 'Gaming Chair',    icon: '\u{1FA91}', cost: 300,   cur: 'usd', desc: '+5 max energy',  bonus: 'energy', val: 5 },
    { id: 'fu_plant',   name: 'House Plant',     icon: '\u{1FAB4}', cost: 150,   cur: 'usd', desc: '-2% heat',       bonus: 'heat',   val: 0.02 },
    { id: 'fu_poster',  name: 'BTC Poster',      icon: '\u{1F5BC}\uFE0F', cost: 75,    cur: 'usd', desc: '+1% income',     bonus: 'income', val: 0.01 },
    { id: 'fu_lamp',    name: 'Neon Lamp',       icon: '\u{1F4A1}', cost: 200,   cur: 'usd', desc: '+2% production', bonus: 'prod',   val: 0.02 },
    { id: 'fu_rug',     name: 'Persian Rug',     icon: '\u{1F9F6}', cost: 1000,  cur: 'usd', desc: '+5% income',     bonus: 'income', val: 0.05 },
    { id: 'fu_tv',      name: 'Big Screen TV',   icon: '\u{1F4FA}', cost: 3000,  cur: 'usd', desc: '+3 energy regen',bonus: 'eregen', val: 3 },
    { id: 'fu_safe',    name: 'Safe',            icon: '\u{1F512}', cost: 5000,  cur: 'usd', desc: 'Protect 10% sats on default', bonus: 'protect', val: 0.1 },
  ];

  var SAVE_KEY = 'sd_town_v1';
  var OLD_SAVE_KEY = 'sd_v2_5';
  var COST_SCALE = 1.18;
  var MAX_OFFLINE_SECS = 8 * 3600; // 8 hours cap

  var PRESTIGE_UPGRADES = [
    { id: 'pu_automine',   name: 'Auto-Mine',        desc: '+1 sat/s base (no hardware needed)', cost: 2,  icon: '\u2699\uFE0F' },
    { id: 'pu_headstart',  name: 'Head Start',        desc: 'Start each run with a Laptop',       cost: 3,  icon: '\u{1F4BB}' },
    { id: 'pu_efficient',  name: 'Efficient Cooling',  desc: '-25% electricity costs permanently', cost: 5,  icon: '\u2744\uFE0F' },
    { id: 'pu_haggle',     name: 'Haggle',            desc: '-10% hardware costs',                cost: 5,  icon: '\u{1F4B0}' },
    { id: 'pu_sprint',     name: 'Sprint Boots',       desc: '+50% walk speed',                   cost: 3,  icon: '\u{1F45F}' },
    { id: 'pu_autosell',   name: 'Auto-Sell',          desc: 'Auto-sell sats at 50% capacity',    cost: 8,  icon: '\u{1F4B1}' },
    { id: 'pu_double_tap', name: 'Double Tap',         desc: '2x sats per manual tap',            cost: 6,  icon: '\u{1F446}' },
    { id: 'pu_offline',    name: 'Offline+',           desc: 'Offline earnings from 50% to 75%',  cost: 5,  icon: '\u{1F4F4}' },
    { id: 'pu_lucky',      name: 'Lucky Streak',       desc: '+5% casino win rate',               cost: 7,  icon: '\u{1F340}' },
    { id: 'pu_megaprod',   name: 'Mega Production',    desc: '+50% all production',               cost: 12, icon: '\u{1F680}' },
  ];

  var ACHIEVEMENTS = [
    { id: 'a_first_sat',    name: 'First Sat',       desc: 'Mine your first sat',           icon: '\u{1F947}', reward: 10,    check: function(s){ return s.lifetimeSats >= 1; } },
    { id: 'a_100_sats',     name: 'Stacking',        desc: 'Earn 100 lifetime sats',        icon: '\u{1F4B0}', reward: 50,    check: function(s){ return s.lifetimeSats >= 100; } },
    { id: 'a_10k_sats',     name: 'Ten Thousand',    desc: 'Earn 10K lifetime sats',        icon: '\u{1F4B5}', reward: 500,   check: function(s){ return s.lifetimeSats >= 10000; } },
    { id: 'a_100k_sats',    name: 'Whale Alert',     desc: 'Earn 100K lifetime sats',       icon: '\u{1F40B}', reward: 5000,  check: function(s){ return s.lifetimeSats >= 100000; } },
    { id: 'a_1m_sats',      name: 'Millionaire',     desc: 'Earn 1M lifetime sats',         icon: '\u{1F451}', reward: 25000, check: function(s){ return s.lifetimeSats >= 1000000; } },
    { id: 'a_first_hw',     name: 'Miner',           desc: 'Buy your first hardware',       icon: '\u{1F527}', reward: 20,    check: function(s){ var t=0; for(var k in s.owned) t+=s.owned[k]; return t > 0; } },
    { id: 'a_gpu',          name: 'GPU Gang',        desc: 'Own a GPU Rig',                 icon: '\u{1F3AE}', reward: 200,   check: function(s){ return (s.owned.u3||0) > 0; } },
    { id: 'a_asic',         name: 'ASIC Army',       desc: 'Own an ASIC Miner',             icon: '\u26A1',    reward: 2000,  check: function(s){ return (s.owned.u4||0) > 0; } },
    { id: 'a_farm',         name: 'Farm Life',       desc: 'Own a Mining Farm',             icon: '\u{1F3ED}', reward: 10000, check: function(s){ return (s.owned.u5||0) > 0; } },
    { id: 'a_first_sell',   name: 'Trader',          desc: 'Sell sats for USD',             icon: '\u{1F4C8}', reward: 25,    check: function(s){ return s.usd > 0; } },
    { id: 'a_house',        name: 'Homeowner',       desc: 'Upgrade to a House',            icon: '\u{1F3E0}', reward: 1000,  check: function(s){ return s.housing === 'house' || s.housing === 'warehouse' || s.housing === 'solar'; } },
    { id: 'a_vehicle',      name: 'Road Warrior',    desc: 'Buy any vehicle',               icon: '\u{1F697}', reward: 100,   check: function(s){ return !!s.vehicle; } },
    { id: 'a_pet',          name: 'Pet Parent',      desc: 'Adopt a pet',                   icon: '\u{1F43E}', reward: 100,   check: function(s){ return !!s.pet; } },
    { id: 'a_research',     name: 'Scholar',         desc: 'Complete any research',         icon: '\u{1F393}', reward: 500,   check: function(s){ return Object.keys(s.research).length > 0; } },
    { id: 'a_all_research', name: 'Genius',          desc: 'Complete all research',         icon: '\u{1F9E0}', reward: 10000, check: function(s){ return Object.keys(s.research).length >= 5; } },
    { id: 'a_prestige1',    name: 'Rebirth',         desc: 'Prestige for the first time',   icon: '\u{1FA99}', reward: 0,     check: function(s){ return s.tokens > 0; } },
    { id: 'a_prestige5',    name: 'Veteran',         desc: 'Earn 5+ prestige tokens',       icon: '\u2B50',    reward: 0,     check: function(s){ return s.tokens >= 5; } },
    { id: 'a_darkweb',      name: 'Dark Side',       desc: 'Buy from the dark web',         icon: '\u{1F480}', reward: 500,   check: function(s){ return (s.owned.d1||0)+(s.owned.d2||0)+(s.owned.d3||0) > 0; } },
  ];

  function defaultState() {
    return {
      avatar: null,
      sats: 0, usd: 0, totalSats: 0, lifetimeSats: 0,
      heat: 0, owned: {}, tokens: 0, price: 65000, buyMulti: 1,
      clothing: {}, furniture: {},
      tutorialStep: 0, // 0=not started, 1-6=active, 7=done
      priceEvent: null, nextEventAt: 0,
      // New systems
      housing: 'studio',
      vehicle: null,
      pet: null,
      energy: 100,
      research: {},
      loans: [],
      loanTime: 0,
      electricityBill: 0,
      electricitySolar: 0,
      policeRisk: 0,
      mailOrders: [],
      gymLevel: 0,
      health: 100,
      casinoLock: 0,
      // Prestige upgrades (persist through prestige)
      prestigeUpgrades: {},
      // Achievements (persist through prestige)
      achievements: {},
      version: 3,
      lastTick: Date.now(),
    };
  }

  var Game = {
    state: defaultState(),
    HARDWARE: HARDWARE, DARK_WEB: DARK_WEB, HOUSING: HOUSING,
    VEHICLES: VEHICLES, PETS: PETS, RESEARCH: RESEARCH, LOANS: LOANS,
    PRESTIGE_UPGRADES: PRESTIGE_UPGRADES, ACHIEVEMENTS: ACHIEVEMENTS,
    COST_SCALE: COST_SCALE, CLOTHING: CLOTHING, FURNITURE: FURNITURE,
    lastFrame: 0, running: false, floatingTexts: [],
    _offlineReport: null, // set after offline calc

    init: function() {
      this.load();
      var all = [].concat(HARDWARE, DARK_WEB);
      for (var i = 0; i < all.length; i++) {
        if (this.state.owned[all[i].id] === undefined) this.state.owned[all[i].id] = 0;
      }
      if (!this.state.achievements) this.state.achievements = {};
      if (!this.state.prestigeUpgrades) this.state.prestigeUpgrades = {};
      if (!this.state.nextEventAt) this.scheduleNextEvent();
      // Apply head-start upgrade
      if (this.state.prestigeUpgrades.pu_headstart && (!this.state.owned.u1 || this.state.owned.u1 === 0) && this.state.lifetimeSats === 0) {
        this.state.owned.u1 = 1;
      }
      // Offline progress
      this.calcOffline();
    },

    calcOffline: function() {
      var s = this.state;
      if (!s.avatar || !s.lastTick) return;
      var elapsed = (Date.now() - s.lastTick) / 1000;
      if (elapsed < 60) return; // less than 60s, skip (prevents refresh exploit)
      elapsed = Math.min(elapsed, MAX_OFFLINE_SECS);
      var rate = this.getProductionRate();
      if (rate <= 0 && !this.hasPrestigeUpgrade('pu_automine')) return;
      var mul = this.getMultiplier();
      // Remove heat/energy penalties for offline calc (use base mult)
      var offlineMul = mul;
      if (s.heat > 90) offlineMul /= 0.1; // undo heat penalty
      if (s.energy <= 0) offlineMul /= 0.05; // undo energy penalty
      var baseRate = rate;
      if (this.hasPrestigeUpgrade('pu_automine')) baseRate += 1;
      var efficiency = this.hasPrestigeUpgrade('pu_offline') ? 0.75 : 0.5;
      var gain = Math.floor(baseRate * offlineMul * elapsed * efficiency);
      if (gain <= 0) return;
      s.sats += gain;
      s.totalSats += gain;
      s.lifetimeSats += gain;
      // Reset heat/energy to reasonable levels after being away
      s.heat = Math.max(0, s.heat - elapsed * 2);
      s.energy = Math.min(this.getEnergyMax(), s.energy + elapsed * 0.5);
      s.lastTick = Date.now();
      this._offlineReport = { sats: gain, seconds: Math.floor(elapsed), efficiency: Math.round(efficiency * 100) };
    },

    load: function() {
      var saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        try {
          var parsed = JSON.parse(saved);
          var def = defaultState();
          for (var k in def) { if (parsed[k] === undefined) parsed[k] = def[k]; }
          Object.assign(this.state, parsed);
        } catch(e) {}
        return;
      }
      var oldSave = localStorage.getItem(OLD_SAVE_KEY);
      if (oldSave) {
        try {
          var old = JSON.parse(oldSave);
          this.state.sats = old.sats || 0;
          this.state.usd = old.usd || 0;
          this.state.totalSats = old.totalSats || 0;
          this.state.lifetimeSats = old.totalSats || 0;
          this.state.heat = old.heat || 0;
          this.state.owned = old.owned || {};
          this.state.tokens = old.tokens || 0;
          this.state.price = old.price || 65000;
        } catch(e) {}
      }
    },

    save: function() { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); },

    // ── Save Slots ──
    getSaveSlots: function() {
      var slots = [];
      for (var i = 0; i < 4; i++) {
        var data = localStorage.getItem('sd_slot_' + i);
        if (data) {
          try {
            var parsed = JSON.parse(data);
            slots.push({ index: i, name: parsed.avatar ? parsed.avatar.name : 'Unknown', sats: parsed.lifetimeSats || 0, tokens: parsed.tokens || 0, savedAt: parsed._savedAt || 0 });
          } catch(e) { slots.push(null); }
        } else { slots.push(null); }
      }
      return slots;
    },

    saveToSlot: function(index) {
      if (index < 0 || index > 3) return false;
      var data = JSON.parse(JSON.stringify(this.state));
      data._savedAt = Date.now();
      localStorage.setItem('sd_slot_' + index, JSON.stringify(data));
      return true;
    },

    loadFromSlot: function(index) {
      if (index < 0 || index > 3) return false;
      var data = localStorage.getItem('sd_slot_' + index);
      if (!data) return false;
      try {
        var parsed = JSON.parse(data);
        var def = defaultState();
        for (var k in def) { if (parsed[k] === undefined) parsed[k] = def[k]; }
        this.state = parsed;
        this.state.lastTick = Date.now();
        this.save();
        return true;
      } catch(e) { return false; }
    },

    deleteSlot: function(index) {
      if (index < 0 || index > 3) return;
      localStorage.removeItem('sd_slot_' + index);
    },

    // ── Economy ──
    getBulkCost: function(item, count) {
      var total = 0, owned = this.state.owned[item.id] || 0;
      var discount = (item.cur === 'sats' && this.hasPrestigeUpgrade('pu_haggle')) ? 0.9 : 1;
      for (var i = 0; i < count; i++) total += Math.floor(item.base * Math.pow(COST_SCALE, owned + i) * discount);
      return total;
    },

    getMax: function(item) {
      var bal = item.cur === 'sats' ? this.state.sats : this.state.usd;
      var c = 0;
      while (this.getBulkCost(item, c + 1) <= bal && c < 100) c++;
      return c;
    },

    getBuyCount: function(item) {
      if (this.state.buyMulti === -1) return Math.max(1, this.getMax(item));
      return this.state.buyMulti;
    },

    getUsedSlots: function() {
      var total = 0;
      for (var i = 0; i < HARDWARE.length; i++) {
        total += (this.state.owned[HARDWARE[i].id] || 0) * HARDWARE[i].slots;
      }
      return total;
    },

    getMaxSlots: function() {
      var h = HOUSING.find(function(h) { return h.id === Game.state.housing; });
      return h ? h.slots : 3;
    },

    buyItem: function(item, count) {
      var cost = this.getBulkCost(item, count);
      var bal = item.cur === 'sats' ? this.state.sats : this.state.usd;
      if (bal < cost) return false;
      // Check rig slots for hardware
      if (item.slots) {
        var newSlots = this.getUsedSlots() + (item.slots * count);
        if (newSlots > this.getMaxSlots()) return false;
      }
      if (item.cur === 'sats') this.state.sats -= cost; else this.state.usd -= cost;
      this.state.owned[item.id] = (this.state.owned[item.id] || 0) + count;
      return true;
    },

    getProductionRate: function() {
      var rate = 0;
      for (var i = 0; i < HARDWARE.length; i++) rate += (this.state.owned[HARDWARE[i].id] || 0) * HARDWARE[i].rate;
      for (var j = 0; j < DARK_WEB.length; j++) rate += (this.state.owned[DARK_WEB[j].id] || 0) * DARK_WEB[j].rate;
      if (this.hasPrestigeUpgrade('pu_automine')) rate += 1;
      return rate;
    },

    // Sum bonuses from clothing + furniture for a given type
    _getItemBonus: function(bonusType) {
      var s = this.state; var total = 0;
      var cl = s.clothing || {}, fu = s.furniture || {};
      CLOTHING.forEach(function(c) { if (cl[c.id] && c.bonus === bonusType) total += c.val; });
      FURNITURE.forEach(function(f) { if (fu[f.id] && f.bonus === bonusType) total += f.val; });
      return total;
    },

    getMultiplier: function() {
      var s = this.state;
      var mul = 1 + (s.tokens * 0.1);
      if (s.avatar && s.avatar.bonus === 'investor') mul += 0.1;
      if (s.research.overclock) mul *= 1.25;
      if (s.research.quantum) mul *= 2.0;
      if (s.pet === 'dog') mul *= 1.05;
      if (s.pet === 'snake') mul *= 1.25;
      if (this.hasPrestigeUpgrade('pu_megaprod')) mul *= 1.5;
      mul *= (1 + this._getItemBonus('income'));
      mul *= (1 + this._getItemBonus('prod'));
      if (s.heat > 90) mul *= 0.1;
      if (s.energy <= 0) mul *= 0.05;
      return mul;
    },

    hasPrestigeUpgrade: function(id) {
      return !!(this.state.prestigeUpgrades && this.state.prestigeUpgrades[id]);
    },

    buyPrestigeUpgrade: function(id) {
      var pu = PRESTIGE_UPGRADES.find(function(u) { return u.id === id; });
      if (!pu || this.hasPrestigeUpgrade(id)) return false;
      if (this.state.tokens < pu.cost) return false;
      this.state.tokens -= pu.cost;
      this.state.prestigeUpgrades[id] = true;
      return true;
    },

    getHeatMultiplier: function() {
      var s = this.state;
      var mul = 1.0;
      if (s.avatar && s.avatar.bonus === 'coolrunner') mul *= 0.8;
      if (s.research.heatsink) mul *= 0.7;
      if (s.pet === 'cat') mul *= 0.95;
      mul *= (1 - this._getItemBonus('heat'));
      return Math.max(0.1, mul);
    },

    getSellMultiplier: function() {
      var mul = 1.0;
      if (this.state.research.algo_trade) mul *= 1.10;
      if (this.state.pet === 'parrot') mul *= 1.15;
      mul *= (1 + this._getItemBonus('sell'));
      return mul;
    },

    getSpeedMultiplier: function() {
      var base = 1.0;
      if (this.state.vehicle) {
        var v = VEHICLES.find(function(v) { return v.id === Game.state.vehicle; });
        if (v) base = v.speed;
      }
      if (this.hasPrestigeUpgrade('pu_sprint')) base *= 1.5;
      base *= (1 + this._getItemBonus('speed'));
      return base;
    },

    getElectricityCost: function() {
      // Cost per second based on owned hardware
      var cost = 0;
      for (var i = 0; i < HARDWARE.length; i++) {
        cost += (this.state.owned[HARDWARE[i].id] || 0) * HARDWARE[i].heat * 0.01;
      }
      if (this.state.housing === 'solar') return 0;
      if (this.state.research.solar_int) cost *= 0.5;
      if (this.hasPrestigeUpgrade('pu_efficient')) cost *= 0.75;
      if (this.state.pet === 'lizard') cost *= 0.9;
      cost -= this.state.electricitySolar * 0.1;
      return Math.max(0, cost);
    },

    getEnergyMax: function() {
      return 100 + (this.state.gymLevel * 20) + this._getItemBonus('energy');
    },

    getEnergyRegen: function() {
      return 0.5 + (this.state.gymLevel * 0.2);
    },

    tapMine: function() {
      var gain = 1;
      if (this.state.avatar && this.state.avatar.bonus === 'quickhands') gain += 5;
      if (this.state.pet === 'hamster') gain += 10;
      if (this.hasPrestigeUpgrade('pu_double_tap')) gain *= 2;
      gain *= (1 + (this.state.tokens * 0.1));
      this.state.sats += gain;
      this.state.totalSats += gain;
      this.state.lifetimeSats += gain;
      this.state.heat = Math.min(100, this.state.heat + 0.05);
      // Tutorial: step 2 (tap mine) → step 3
      if (this.state.tutorialStep === 2) this.state.tutorialStep = 3;
      return gain;
    },

    ventHeat: function() {
      var cooled = Math.min(this.state.heat, 20);
      this.state.heat -= cooled;
      return cooled;
    },

    sellSats: function(fraction) {
      var satsToSell = Math.floor(this.state.sats * fraction);
      if (satsToSell <= 0) return 0;
      var btcAmount = satsToSell / 1e8;
      var usdGain = btcAmount * this.getEffectivePrice() * this.getSellMultiplier();
      this.state.sats -= satsToSell;
      this.state.usd += usdGain;
      return usdGain;
    },

    // ── Price Events ──
    scheduleNextEvent: function() {
      this.state.nextEventAt = Date.now() + (120 + Math.random() * 180) * 1000;
    },

    startPriceEvent: function() {
      var isBull = Math.random() > 0.5;
      var mag = 0.20 + Math.random() * 0.20;
      this.state.priceEvent = {
        type: isBull ? 'bull' : 'crash',
        mult: isBull ? (1 + mag) : (1 - mag),
        endsAt: Date.now() + (15 + Math.random() * 15) * 1000,
        magnitude: Math.round(mag * 100),
      };
      if (UI && UI.toast) {
        UI.toast(isBull ? '\u{1F4C8} BULL RUN! +' + this.state.priceEvent.magnitude + '%!' : '\u{1F4C9} CRASH! -' + this.state.priceEvent.magnitude + '%!');
      }
    },

    getEffectivePrice: function() {
      var p = this.state.price;
      if (this.state.priceEvent) p *= this.state.priceEvent.mult;
      return Math.max(1000, p);
    },

    // ── Loans ──
    takeLoan: function(loanId) {
      var loan = LOANS.find(function(l) { return l.id === loanId; });
      if (!loan) return false;
      // Max 1 loan at a time
      if (this.state.loans.length > 0) return false;
      this.state.usd += loan.amount;
      this.state.loans.push({ id: loan.id, amount: loan.amount, owed: loan.amount * (1 + loan.rate), takenAt: Date.now() });
      return true;
    },

    repayLoan: function() {
      if (this.state.loans.length === 0) return false;
      var loan = this.state.loans[0];
      if (this.state.usd < loan.owed) return false;
      this.state.usd -= loan.owed;
      this.state.loans = [];
      return true;
    },

    // ── Mail Orders ──
    orderItem: function(item) {
      var cost = Math.floor(this.getBulkCost(item, 1) * 0.7); // 30% cheaper
      var bal = item.cur === 'sats' ? this.state.sats : this.state.usd;
      if (bal < cost) return false;
      if (item.cur === 'sats') this.state.sats -= cost; else this.state.usd -= cost;
      this.state.mailOrders.push({ itemId: item.id, arrivesAt: Date.now() + 120000, name: item.name }); // 2 min
      return true;
    },

    // ── Casino ──
    coinFlip: function(bet) {
      if (bet <= 0 || bet > this.state.sats) return null;
      this.state.sats -= bet;
      var threshold = this.hasPrestigeUpgrade('pu_lucky') ? 0.45 : 0.5;
      var win = Math.random() > threshold;
      if (win) { this.state.sats += bet * 2; return bet; }
      return -bet;
    },

    slotMachine: function(bet) {
      if (bet <= 0 || bet > this.state.sats) return null;
      this.state.sats -= bet;
      var r = Math.random();
      var bonus = this.hasPrestigeUpgrade('pu_lucky') ? 0.05 : 0;
      var mult = 0;
      if (r < 0.01 + bonus) mult = 10;
      else if (r < 0.05 + bonus) mult = 5;
      else if (r < 0.15 + bonus) mult = 3;
      else if (r < 0.40 + bonus) mult = 1.5;
      // 60% lose
      var win = Math.floor(bet * mult);
      this.state.sats += win;
      return { mult: mult, win: win - bet };
    },

    // ── Tick ──
    tick: function(dt) {
      var s = this.state;
      var now = Date.now();
      s.lastTick = now; // Update every tick so offline calc is accurate

      // Production
      var rate = this.getProductionRate();
      var mul = this.getMultiplier();
      var gain = rate * mul * dt;
      s.sats += gain; s.totalSats += gain; s.lifetimeSats += gain;

      // Heat
      var hGen = 0;
      for (var i = 0; i < HARDWARE.length; i++) {
        hGen += (s.owned[HARDWARE[i].id] || 0) * Math.max(0.01, HARDWARE[i].heat + ((s.owned.d2 || 0) * -0.05));
      }
      for (var j = 0; j < DARK_WEB.length; j++) {
        if (DARK_WEB[j].id !== 'd2') hGen += (s.owned[DARK_WEB[j].id] || 0) * DARK_WEB[j].heat;
      }
      // Heat gen scaled by /3, passive cooling at 0.5/s
      s.heat = Math.min(100, Math.max(0, s.heat + (hGen * this.getHeatMultiplier() / 3 * dt) - (0.5 * dt)));

      // Energy - drains slowly, regens slowly
      var energyDrain = 0.15; // per second base
      if (this.getProductionRate() > 0) energyDrain = 0.3;
      s.energy = Math.max(0, Math.min(this.getEnergyMax(), s.energy - (energyDrain * dt) + (this.getEnergyRegen() * dt * 0.1)));

      // Electricity bill
      var elecCost = this.getElectricityCost();
      s.electricityBill += elecCost * dt;
      // Deduct bill every 60 seconds
      if (!s._lastBillTime) s._lastBillTime = now;
      if (now - s._lastBillTime > 60000) {
        var bill = s.electricityBill;
        s.usd -= bill;
        s.electricityBill = 0;
        s._lastBillTime = now;
        if (bill > 0.01 && s.usd < 0) {
          s.usd = 0; // Can't go negative, but lose the sats instead
        }
      }

      // Loan interest (compounds every 30s, auto-deducts payment)
      if (s.loans.length > 0) {
        if (!s.loanTime) s.loanTime = now;
        if (now - s.loanTime > 30000) {
          var loan = s.loans[0];
          var loanDef = LOANS.find(function(l) { return l.id === loan.id; });
          if (loanDef) {
            loan.owed *= (1 + loanDef.rate * 0.01); // 1% of rate per 30s — much faster compound
          }
          // Auto-deduct minimum payment (2% of owed) from USD
          var minPayment = loan.owed * 0.02;
          if (s.usd >= minPayment) {
            s.usd -= minPayment;
            loan.owed -= minPayment;
          } else {
            // Can't pay — add penalty interest
            loan.owed *= 1.02;
          }
          s.loanTime = now;
          // Fully paid off
          if (loan.owed <= 1) {
            s.loans = [];
            if (UI && UI.toast) UI.toast('\u2705 Loan fully paid off!');
          }
          // Default: if owed > 3x original (was 5x, now stricter)
          if (loan.owed > loan.amount * 3) {
            s.loans = [];
            s.sats = Math.floor(s.sats * 0.5);
            s.usd = Math.max(0, s.usd - loan.amount * 0.5); // Also lose USD
            if (UI && UI.toast) UI.toast('\u{1F6A8} Loan defaulted! Lost 50% sats and $' + Game.formatNumber(loan.amount * 0.5) + '!');
          }
        }
      }

      // Mail orders - deliver
      for (var m = s.mailOrders.length - 1; m >= 0; m--) {
        if (now >= s.mailOrders[m].arrivesAt) {
          var order = s.mailOrders[m];
          var item = HARDWARE.find(function(u) { return u.id === order.itemId; }) ||
                     DARK_WEB.find(function(u) { return u.id === order.itemId; });
          if (item) {
            // Check slot limits for hardware items
            if (item.slots && this.getUsedSlots() + item.slots > this.getMaxSlots()) {
              if (UI && UI.toast) UI.toast('\u{1F4E6} ' + order.name + ' delivered but no room! Sold for parts.');
              s.usd += Math.floor(item.base * 0.3);
            } else {
              s.owned[item.id] = (s.owned[item.id] || 0) + 1;
              if (UI && UI.toast) UI.toast('\u{1F4E6} ' + order.name + ' delivered!');
            }
          }
          s.mailOrders.splice(m, 1);
        }
      }

      // Snake risk
      if (s.pet === 'snake') {
        if (!s._snakeCheck) s._snakeCheck = now;
        if (now - s._snakeCheck > 60000) {
          s._snakeCheck = now;
          if (Math.random() < 0.05) {
            var lost = Math.floor(s.sats * 0.02);
            s.sats -= lost;
            if (UI && UI.toast) UI.toast('\u{1F40D} Snake incident! Lost ' + Game.formatNumber(lost) + ' sats');
          }
        }
      }

      // Police risk decay
      if (s.policeRisk > 0) s.policeRisk = Math.max(0, s.policeRisk - 0.01 * dt);

      // Auto-sell (prestige upgrade)
      if (this.hasPrestigeUpgrade('pu_autosell') && s.sats > 10000) {
        if (!s._lastAutoSell) s._lastAutoSell = now;
        if (now - s._lastAutoSell > 30000) { // every 30s
          this.sellSats(0.5);
          s._lastAutoSell = now;
        }
      }

      // Check achievements
      this.checkAchievements();

      // BTC price random walk
      s.price *= (1 + (Math.random() - 0.499) * 0.0005);
      s.price = Math.max(1000, s.price);

      // Price events
      if (s.priceEvent && now >= s.priceEvent.endsAt) { s.priceEvent = null; this.scheduleNextEvent(); }
      if (!s.priceEvent && s.nextEventAt && now >= s.nextEventAt) this.startPriceEvent();

      // Floating texts
      for (var fi = this.floatingTexts.length - 1; fi >= 0; fi--) {
        this.floatingTexts[fi].age += dt;
        this.floatingTexts[fi].y -= 40 * dt;
        if (this.floatingTexts[fi].age > 1) this.floatingTexts.splice(fi, 1);
      }
    },

    addFloatingText: function(text, x, y, color) {
      this.floatingTexts.push({ text: text, x: x + (Math.random() - 0.5) * 40, y: y, age: 0, color: color || '#f7931a' });
    },

    loop: function(timestamp) {
      if (!Game.running) return;
      try {
        if (!Game.lastFrame) Game.lastFrame = timestamp;
        var dt = (timestamp - Game.lastFrame) / 1000;
        Game.lastFrame = timestamp;
        dt = Math.min(dt, 0.1);
        if (Game.state.avatar) {
          Game.tick(dt);
          Town.updateAvatar(dt, UI.keys);
          Town.updateCamera(dt);
        }
        Town.render();
        if (Game.state.avatar) {
          UI.updateHUD();
          UI.updateOpenPanel();
        }
      } catch(e) { console.error('Loop error:', e); }
      requestAnimationFrame(Game.loop);
    },

    start: function() {
      if (this.running) return;
      this.running = true;
      this.lastFrame = 0;
      requestAnimationFrame(this.loop);
      if (!this._saveInterval) {
        this._saveInterval = setInterval(function() { Game.save(); }, 5000);
      }
    },

    // ── Achievements ──
    checkAchievements: function() {
      var s = this.state;
      if (!s.achievements) s.achievements = {};
      for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        var a = ACHIEVEMENTS[i];
        if (s.achievements[a.id]) continue;
        if (a.check(s)) {
          s.achievements[a.id] = Date.now();
          if (a.reward > 0) s.sats += a.reward;
          if (UI && UI.toast) UI.toast(a.icon + ' Achievement: ' + a.name + (a.reward > 0 ? ' (+' + Game.formatNumber(a.reward) + ' sats)' : ''));
        }
      }
    },

    getAchievementCount: function() {
      if (!this.state.achievements) return 0;
      return Object.keys(this.state.achievements).length;
    },

    // ── Prestige ──
    getPrestigeTokens: function() {
      // Earn tokens on a scaling curve: first at 100K, then increasingly harder
      // sqrt(lifetimeSats / 50000) gives ~1 at 50K, ~3 at 500K, ~10 at 5M, ~14 at 10M
      return Math.floor(Math.sqrt(this.state.lifetimeSats / 50000));
    },

    canPrestige: function() {
      return this.getPrestigeTokens() > this.state.tokens;
    },

    prestige: function() {
      var newTokens = this.getPrestigeTokens();
      if (newTokens <= this.state.tokens) return false;
      var tokens = newTokens;
      var upgrades = this.state.prestigeUpgrades || {};
      var achievements = this.state.achievements || {};
      var avatar = this.state.avatar; // Preserve avatar identity
      var def = defaultState();
      def.tokens = tokens;
      def.prestigeUpgrades = upgrades;
      def.achievements = achievements;
      def.avatar = avatar; // Keep same character
      def.lastTick = Date.now();
      this.state = def;
      this.floatingTexts = [];
      // Save BEFORE init so load() picks up the new token count
      this.save();
      this.init();
      return tokens;
    },

    formatNumber: function(n) {
      if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
      if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
      if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
      return Math.floor(n).toLocaleString();
    },
  };

  window.Game = Game;
})();
