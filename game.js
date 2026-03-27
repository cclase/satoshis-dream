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
    { id: 'd1', name: 'Botnet',  icon: '\u{1F480}', base: 500,    rate: 200,   heat: 2,    cur: 'usd', desc: '+200/s, +heat, +risk' },
    { id: 'd2', name: 'Coolant', icon: '\u2744\uFE0F', base: 1000,  rate: 0,     heat: -0.05, cur: 'usd', desc: '-Heat gen' },
    { id: 'd3', name: 'Relay',   icon: '\u{1F6F0}\uFE0F', base: 25000, rate: 2000,  heat: 8,    cur: 'usd', desc: '+2K/s, high heat+risk' },
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
    { id: 'cl_hat',     name: 'Bitcoin Cap',     icon: '\u{1F9E2}', cost: 50,    cur: 'usd', desc: '+5% income',     bonus: 'income', val: 0.05 },
    { id: 'cl_jacket',  name: 'Hoodie',          icon: '\u{1F9E5}', cost: 200,   cur: 'usd', desc: '-6% heat',       bonus: 'heat',   val: 0.06 },
    { id: 'cl_shoes',   name: 'Running Shoes',   icon: '\u{1F45F}', cost: 500,   cur: 'usd', desc: '+20% speed',     bonus: 'speed',  val: 0.2 },
    { id: 'cl_suit',    name: 'Business Suit',   icon: '\u{1F454}', cost: 2000,  cur: 'usd', desc: '+10% sell price',bonus: 'sell',   val: 0.10 },
    { id: 'cl_watch',   name: 'Gold Watch',      icon: '\u231A',    cost: 10000, cur: 'usd', desc: '+15% income',    bonus: 'income', val: 0.15 },
  ];

  var FURNITURE = [
    { id: 'fu_desk',    name: 'Mining Desk',     icon: '\u{1F5A5}\uFE0F', cost: 100,   cur: 'usd', desc: '+6% production', bonus: 'prod', val: 0.06 },
    { id: 'fu_chair',   name: 'Gaming Chair',    icon: '\u{1FA91}', cost: 300,   cur: 'usd', desc: '+10 max energy', bonus: 'energy', val: 10 },
    { id: 'fu_plant',   name: 'House Plant',     icon: '\u{1FAB4}', cost: 150,   cur: 'usd', desc: '-4% heat',       bonus: 'heat',   val: 0.04 },
    { id: 'fu_poster',  name: 'BTC Poster',      icon: '\u{1F5BC}\uFE0F', cost: 75,    cur: 'usd', desc: '+3% income',     bonus: 'income', val: 0.03 },
    { id: 'fu_lamp',    name: 'Neon Lamp',       icon: '\u{1F4A1}', cost: 200,   cur: 'usd', desc: '+4% production', bonus: 'prod',   val: 0.04 },
    { id: 'fu_rug',     name: 'Persian Rug',     icon: '\u{1F9F6}', cost: 1000,  cur: 'usd', desc: '+8% income',     bonus: 'income', val: 0.08 },
    { id: 'fu_tv',      name: 'Big Screen TV',   icon: '\u{1F4FA}', cost: 3000,  cur: 'usd', desc: '+5 energy regen',bonus: 'eregen', val: 5 },
    { id: 'fu_safe',    name: 'Safe',            icon: '\u{1F512}', cost: 5000,  cur: 'usd', desc: 'Protect 15% sats on default', bonus: 'protect', val: 0.15 },
    { id: 'fu_bed_good',name: 'Comfy Bed',       icon: '\u{1F6CF}\uFE0F', cost: 500,  cur: 'usd', desc: 'Sleep restores 75 energy', bonus: 'bed', val: 75 },
    { id: 'fu_bed_luxury',name:'Luxury Bed',     icon: '\u{1F6CC}', cost: 5000, cur: 'usd', desc: 'Sleep restores 100 energy', bonus: 'bed', val: 100 },
    { id: 'fu_kitchen', name: 'Kitchen',         icon: '\u{1F373}', cost: 1000, cur: 'usd', desc: '+25% energy from home food', bonus: 'kitchen', val: 0.25 },
    { id: 'fu_garage',  name: 'Garage',          icon: '\u{1F3CE}\uFE0F', cost: 2000, cur: 'usd', desc: 'Use vehicle anywhere', bonus: 'garage', val: 0 },
  ];

  var SEEDS = [
    { id: 'seed_herb',  name: 'Herb Seeds',    icon: '\u{1F33F}', cost: 20,   growTime: 120000, reward: 125,  energy: 25, desc: '2min grow, +125 sats or +25 energy' },
    { id: 'seed_flower',name: 'Flower Seeds',  icon: '\u{1F33B}', cost: 100,  growTime: 300000, reward: 750,  energy: 30, desc: '5min grow, +750 sats or +30 energy' },
    { id: 'seed_money', name: 'Money Tree',    icon: '\u{1F4B0}', cost: 1000, growTime: 900000, reward: 10000,energy: 80, desc: '15min grow, +10K sats or +80 energy' },
  ];

  var NPC_EVENTS = [
    { id: 'npc_tips', name: 'Mining Tips', icon: '\u{1F4A1}', desc: 'A stranger offers mining tips for $10.', accept: 'Buy Tips', decline: 'No thanks', effect: function(s) { if (s.usd < 10) return 'Not enough USD!'; s.usd -= 10; s._tempBoost = (s._tempBoost||0) + 0.05; s._tempBoostEnd = Date.now() + 60000; return '+5% production for 60s!'; } },
    { id: 'npc_usb', name: 'Found USB', icon: '\u{1F4BE}', desc: 'You found a USB drive on the ground!', accept: 'Pick up', decline: 'Leave it', effect: function(s) { var g = 50 + Math.floor(Math.random()*150); s.sats += g; s.totalSats += g; s.lifetimeSats += g; return '+' + g + ' sats!'; } },
    { id: 'npc_drink', name: 'Energy Drink', icon: '\u{1F964}', desc: 'Street vendor selling energy drinks for $3.', accept: 'Buy ($3)', decline: 'Pass', effect: function(s) { if (s.usd < 3) return 'Not enough USD!'; s.usd -= 3; s.energy = Math.min(s.energy + 30, 100 + s.gymLevel * 20); return '+30 energy!'; } },
    { id: 'npc_brief', name: 'Mysterious Briefcase', icon: '\u{1F4BC}', desc: 'A mysterious briefcase! Open it?', accept: 'Open', decline: 'Walk away', effect: function(s) { if (Math.random() > 0.5) { s.sats += 500; s.totalSats += 500; s.lifetimeSats += 500; return 'Jackpot! +500 sats!'; } else { var loss = Math.min(s.sats, 100); s.sats -= loss; return 'Empty! Lost ' + loss + ' sats...'; } } },
    { id: 'npc_trade', name: 'Miner Trade', icon: '\u{1F91D}', desc: 'Local miner: "Trade 1000 sats for $20?"', accept: 'Trade', decline: 'Decline', effect: function(s) { if (s.sats < 1000) return 'Not enough sats!'; s.sats -= 1000; s.usd += 20; return 'Traded! +$20'; } },
    { id: 'npc_meetup', name: 'BTC Meetup', icon: '\u{1F4E3}', desc: 'Bitcoin meetup nearby! Attend for a boost?', accept: 'Attend', decline: 'Too busy', effect: function(s) { s._tempBoost = (s._tempBoost||0) + 0.02; s._tempBoostEnd = Date.now() + 300000; return '+2% production for 5 min!'; } },
    { id: 'npc_rig', name: 'Broken Rig', icon: '\u{1F527}', desc: 'Broken mining rig on the sidewalk. Fix it for $50?', accept: 'Fix ($50)', decline: 'Leave it', effect: function(s) { if (s.usd < 50) return 'Not enough USD!'; s.usd -= 50; s.owned.u1 = (s.owned.u1||0) + 1; return 'Fixed! +1 Laptop!'; } },
    { id: 'npc_conf', name: 'Crypto Conference', icon: '\u{1F3AB}', desc: 'Conference ticket for $100. Instant knowledge!', accept: 'Buy ($100)', decline: 'Skip', effect: function(s) { if (s.usd < 100) return 'Not enough USD!'; s.usd -= 100; s.sats += 1000; s.totalSats += 1000; s.lifetimeSats += 1000; return '+1000 sats from networking!'; } },
    { id: 'npc_penny', name: 'Lucky Penny', icon: '\u{1FA99}', desc: 'You spot a shiny penny on the ground!', accept: 'Pick up', decline: 'Ignore', effect: function(s) { s.sats += 1; s.totalSats += 1; s.lifetimeSats += 1; return '+1 sat. Every sat counts!'; } },
    { id: 'npc_police', name: 'Police Patrol', icon: '\u{1F46E}', desc: 'Police are patrolling the area...', accept: 'Act normal', decline: 'Hide', effect: function(s) { if (s.policeRisk > 20) { var loss = Math.floor(s.sats * 0.05); s.sats -= loss; return 'They searched you! Lost ' + loss + ' sats.'; } return 'All clear. Nothing to worry about.'; } },
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
      tutorialStep: 0,
      pendingNpcEvent: null, lastNpcTime: 0,
      // Delivery quests
      deliveries: [], activeDelivery: null,
      // Police
      tickets: [], policeChaseActive: false,
      // Electricity
      powerCut: false, powerCutUntil: 0,
      // Sleep
      lastSleepTime: 0,
      // Garden
      garden: [], gardenInventory: {},
      dailyChallenges: [], dailyDate: '',
      buildingLevels: {}, buildingVisits: {},
      collection: {}, // rare drops
      // Craig rival
      craig: { sats: 0, hardware: 0, lastTaunt: 0 },
      craigMilestones: {},
      // Skill tree
      skillPoints: 0, skills: {},
      // Story
      storyFound: {},
      // Unlocked areas
      unlockedAreas: ['north'],
      // Movement history for ghosts
      movementHistory: [],
      stats: { taps: 0, satsSold: 0, buildingsVisited: 0, itemsCollected: 0, deliveriesCompleted: 0 },
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
    COST_SCALE: COST_SCALE, CLOTHING: CLOTHING, FURNITURE: FURNITURE, NPC_EVENTS: NPC_EVENTS,
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
      if (s.heat > 50) {
        var heatPenalty = Math.max(0.1, 1 - (s.heat - 50) / 55.5);
        offlineMul /= heatPenalty;
      }
      if (s.energy <= 0) offlineMul /= 0.05;
      else if (s.energy < 25) offlineMul /= 0.5;
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
      if (item.slots && this.hasSkill('sk_hash3')) discount *= 0.8; // Bulk Discount: hardware -20%
      if (item.heat !== undefined && this.hasSkill('sk_shadow2')) discount *= 0.7; // Discount Goods: dark web -30%
      if (item.heat !== undefined && this.activeEvent && this.activeEvent.bonus === 'darkweb50') discount *= 0.5; // Halloween event
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
      // Tutorial: step 4 (buy hardware) → step 5
      if (this.state.tutorialStep === 4 && item.slots) this.state.tutorialStep = 5;
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
      mul *= (1 + this.getCollectionBonus());
      if (this.hasSkill('sk_hash1')) mul *= 1.1;
      if (this.hasSkill('sk_trade1')) mul *= 1.0; // trade skill affects sell, not production
      // Temp boost from NPC events
      if (s._tempBoost && s._tempBoostEnd && Date.now() < s._tempBoostEnd) mul *= (1 + s._tempBoost);
      else { s._tempBoost = 0; s._tempBoostEnd = 0; }
      // Seasonal event multiplier
      mul *= this.getSeasonalMultiplier();
      // Gradual heat penalty: starts at 50%, scales to 0.1x at 100%
      if (s.heat > 50) mul *= Math.max(0.1, 1 - (s.heat - 50) / 55.5);
      if (s.energy <= 0) mul *= 0.05;
      else if (s.energy < 25) mul *= 0.5; // 50% production when low energy
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
      if (this.hasSkill('sk_trade1')) mul *= 1.1;
      return mul;
    },

    getSpeedMultiplier: function() {
      var base = 1.0;
      if (this.state.vehicle) {
        // Vehicle speed only works with garage or when near home
        var hasGarage = !!(this.state.furniture && this.state.furniture.fu_garage);
        var nearHome = false;
        if (!hasGarage && this.state.avatar) {
          var hb = (window.Town && window.Town.BUILDINGS) ? window.Town.BUILDINGS.find(function(b){return b.id==='apartment';}) : null;
          if (hb) {
            var dx = this.state.avatar.x - (hb.x + hb.w/2), dy = this.state.avatar.y - (hb.y + hb.h/2);
            nearHome = Math.sqrt(dx*dx+dy*dy) < 100;
          }
        }
        if (hasGarage || nearHome) {
          var v = VEHICLES.find(function(v) { return v.id === Game.state.vehicle; });
          if (v) base = v.speed;
        }
      }
      if (this.hasPrestigeUpgrade('pu_sprint')) base *= 1.5;
      base *= (1 + this._getItemBonus('speed'));
      base *= this.getWeatherSpeedMod();
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

    // ── Delivery Quests ──
    generateDeliveries: function() {
      var s = this.state;
      if (s.deliveries.length >= 3) return;
      var allBuildings = (window.Town && window.Town.BUILDINGS) || [];
      var targets = allBuildings.filter(function(b) { return b.panelType !== 'post_office' && b.panelType !== 'apartment'; });
      while (s.deliveries.length < 3 && targets.length > 0) {
        var idx = Math.floor(Math.random() * targets.length);
        var t = targets.splice(idx, 1)[0];
        var dist = Math.sqrt(Math.pow(t.x - 960, 2) + Math.pow(t.y - 768, 2));
        var reward = Math.floor(50 + dist * 0.3 + Math.random() * 100);
        var usdReward = Math.floor(reward * 0.01 + Math.random() * 5);
        s.deliveries.push({ targetId: t.id, targetName: t.name, sats: reward, usd: usdReward });
      }
    },
    acceptDelivery: function(index) {
      var s = this.state;
      if (s.activeDelivery || index >= s.deliveries.length) return false;
      s.activeDelivery = s.deliveries.splice(index, 1)[0];
      if (UI && UI.toast) UI.toast('\u{1F4E6} Delivering to ' + s.activeDelivery.targetName + '!');
      return true;
    },
    completeDelivery: function() {
      var s = this.state;
      if (!s.activeDelivery) return false;
      s.sats += s.activeDelivery.sats;
      s.totalSats += s.activeDelivery.sats;
      s.lifetimeSats += s.activeDelivery.sats;
      s.usd += s.activeDelivery.usd;
      if (!s.stats) s.stats = {};
      s.stats.deliveriesCompleted = (s.stats.deliveriesCompleted || 0) + 1;
      if (UI && UI.toast) UI.toast('\u{1F4E6} Delivered! +' + Game.formatNumber(s.activeDelivery.sats) + ' sats, +$' + Game.formatNumber(s.activeDelivery.usd));
      s.activeDelivery = null;
      this.generateDeliveries();
      return true;
    },

    // ── Sleep ──
    sleep: function() {
      var s = this.state;
      var now = Date.now();
      if (now - s.lastSleepTime < 180000) return { error: 'Too soon! Wait ' + Math.ceil((180000 - (now - s.lastSleepTime)) / 1000) + 's' };
      s.lastSleepTime = now;
      // Energy restore based on bed
      var restore = 50;
      if (s.furniture && s.furniture.fu_bed_luxury) restore = 100;
      else if (s.furniture && s.furniture.fu_bed_good) restore = 75;
      s.energy = Math.min(this.getEnergyMax(), s.energy + restore);
      // Fast-forward 30s of production
      var rate = this.getProductionRate() * this.getMultiplier();
      var gain = Math.floor(rate * 30);
      s.sats += gain; s.totalSats += gain; s.lifetimeSats += gain;
      s.heat = Math.max(0, s.heat - 10);
      return { energy: restore, sats: gain };
    },

    // ── Police ──
    bribePolice: function(amount) {
      var s = this.state;
      if (s.policeRisk <= 0 || s.policeRisk >= 75) return false;
      var cost = 500;
      if (s.usd < cost) return false;
      s.usd -= cost;
      s.policeRisk = Math.max(0, s.policeRisk - 10);
      return true;
    },
    payTicket: function(index) {
      var s = this.state;
      if (index >= s.tickets.length) return false;
      var ticket = s.tickets[index];
      if (s.usd < ticket.fine) return false;
      s.usd -= ticket.fine;
      s.tickets.splice(index, 1);
      return true;
    },

    // ── Garden ──
    getMaxPlots: function() {
      var h = { studio: 0, apartment: 1, house: 2, warehouse: 3, solar: 3 };
      return h[this.state.housing] || 0;
    },
    plantSeed: function(seedId) {
      var s = this.state;
      var seed = SEEDS.find(function(se) { return se.id === seedId; });
      if (!seed || s.garden.length >= this.getMaxPlots()) return false;
      if (s.usd < seed.cost) return false;
      s.usd -= seed.cost;
      s.garden.push({ seedId: seedId, plantedAt: Date.now() });
      return true;
    },
    harvestPlant: function(index) {
      var s = this.state;
      if (index >= s.garden.length) return false;
      var plant = s.garden[index];
      var seed = SEEDS.find(function(se) { return se.id === plant.seedId; });
      if (!seed || Date.now() - plant.plantedAt < seed.growTime) return false;
      s.garden.splice(index, 1);
      if (!s.gardenInventory) s.gardenInventory = {};
      s.gardenInventory[seed.id] = (s.gardenInventory[seed.id] || 0) + 1;
      return seed;
    },
    eatGardenItem: function(seedId) {
      var s = this.state;
      if (!s.gardenInventory || !s.gardenInventory[seedId]) return false;
      var seed = SEEDS.find(function(se) { return se.id === seedId; });
      if (!seed) return false;
      s.gardenInventory[seedId]--;
      if (s.gardenInventory[seedId] <= 0) delete s.gardenInventory[seedId];
      var bonus = s.furniture && s.furniture.fu_kitchen ? 1.25 : 1;
      s.energy = Math.min(this.getEnergyMax(), s.energy + Math.floor(seed.energy * bonus));
      return seed;
    },

    // ── Treasure Maps ──
    checkTreasureDrop: function() {
      var s = this.state;
      if (s.treasureMap) return;
      if (Math.random() < 0.01) { // 1% per tap (was 0.5%)
        var tx = 100 + Math.random() * (this.WORLD_W - 200);
        var ty = 100 + Math.random() * (this.WORLD_H - 200);
        var reward = 500 + Math.floor(Math.random() * 4500);
        s.treasureMap = { x: tx, y: ty, reward: reward, expiresAt: Date.now() + 600000 };
        if (UI && UI.toast) UI.toast('\u{1F5FA}\uFE0F Found a treasure map! Check your minimap!');
      }
    },
    digTreasure: function() {
      var s = this.state;
      if (!s.treasureMap || !s.avatar) return false;
      var dx = s.avatar.x - s.treasureMap.x, dy = s.avatar.y - s.treasureMap.y;
      if (Math.sqrt(dx * dx + dy * dy) > 30) return false;
      var reward = s.treasureMap.reward;
      s.sats += reward; s.totalSats += reward; s.lifetimeSats += reward;
      s.treasureMap = null;
      if (UI && UI.toast) UI.toast('\u{1F4B0} Treasure! +' + Game.formatNumber(reward) + ' sats!');
      return true;
    },

    // ── Building Reputation ──
    visitBuilding: function(panelType) {
      var s = this.state;
      if (!s.buildingVisits) s.buildingVisits = {};
      s.buildingVisits[panelType] = (s.buildingVisits[panelType] || 0) + 1;
      if (!s.stats) s.stats = {};
      s.stats.buildingsVisited = (s.stats.buildingsVisited || 0) + 1;
    },
    getBuildingDiscount: function(panelType) {
      var visits = (this.state.buildingVisits || {})[panelType] || 0;
      if (visits >= 30) return 0.15; // VIP
      if (visits >= 15) return 0.10;
      if (visits >= 5) return 0.05;
      return 0;
    },

    // ── Weather ──
    weather: 'clear',
    _weatherTimer: 0,
    _weatherThreshold: 180 + Math.random() * 300,
    updateWeather: function(dt) {
      this._weatherTimer += dt;
      if (this._weatherTimer > this._weatherThreshold) { // 3-8 min
        this._weatherTimer = 0;
        this._weatherThreshold = 180 + Math.random() * 300;
        var weathers = ['clear', 'clear', 'cloudy', 'rain'];
        if (this.weather === 'rain' && Math.random() < 0.1) weathers.push('storm');
        this.weather = weathers[Math.floor(Math.random() * weathers.length)];
      }
    },
    getWeatherSpeedMod: function() {
      return this.weather === 'rain' ? 0.85 : this.weather === 'storm' ? 0.7 : 1.0;
    },

    // ── Daily Challenges ──
    generateDailyChallenges: function() {
      var s = this.state;
      var today = new Date().toDateString();
      if (s.dailyDate === today) return;
      s.dailyDate = today;
      // Seed from date
      var seed = 0; for (var ci = 0; ci < today.length; ci++) seed += today.charCodeAt(ci);
      function dr() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      var types = [
        { desc: 'Mine {n} sats', key: 'sats', target: function() { return Math.floor(500 + dr() * 5000); }, check: function(s,t) { return s.lifetimeSats >= t._start + t.target; } },
        { desc: 'Visit {n} buildings', key: 'visits', target: function() { return Math.floor(3 + dr() * 5); }, check: function(s,t) { return (s.stats.buildingsVisited||0) >= t._startVisits + t.target; } },
        { desc: 'Collect {n} street items', key: 'collect', target: function() { return Math.floor(3 + dr() * 5); }, check: function(s,t) { return (s.stats.itemsCollected||0) >= t._startItems + t.target; } },
      ];
      s.dailyChallenges = [];
      for (var di = 0; di < 3; di++) {
        var type = types[di % types.length];
        var target = type.target();
        s.dailyChallenges.push({ desc: type.desc.replace('{n}', target), key: type.key, target: target, completed: false, reward: Math.floor(100 + dr() * 500),
          _start: s.lifetimeSats, _startVisits: s.stats.buildingsVisited||0, _startItems: s.stats.itemsCollected||0 });
      }
    },
    checkDailyChallenges: function() {
      var s = this.state;
      if (!s.dailyChallenges) return;
      for (var ci = 0; ci < s.dailyChallenges.length; ci++) {
        var ch = s.dailyChallenges[ci];
        if (ch.completed) continue;
        var done = false;
        if (ch.key === 'sats') done = s.lifetimeSats >= ch._start + ch.target;
        else if (ch.key === 'visits') done = (s.stats.buildingsVisited||0) >= ch._startVisits + ch.target;
        else if (ch.key === 'collect') done = (s.stats.itemsCollected||0) >= ch._startItems + ch.target;
        if (done) {
          ch.completed = true;
          s.sats += ch.reward; s.totalSats += ch.reward; s.lifetimeSats += ch.reward;
          if (UI && UI.toast) UI.toast('\u{1F3C6} Challenge done! +' + Game.formatNumber(ch.reward) + ' sats');
        }
      }
    },

    // ── Building Upgrades ──
    UPGRADE_COSTS: { 1: 500, 2: 5000, 3: 50000 },
    getBuildingLevel: function(panelType) { return (this.state.buildingLevels || {})[panelType] || 0; },
    upgradeBuilding: function(panelType) {
      var s = this.state;
      if (!s.buildingLevels) s.buildingLevels = {};
      var level = s.buildingLevels[panelType] || 0;
      if (level >= 3) return false;
      var cost = this.UPGRADE_COSTS[level + 1] || 99999;
      if (s.usd < cost) return false;
      s.usd -= cost;
      s.buildingLevels[panelType] = level + 1;
      return true;
    },
    getBuildingUpgradeBonus: function(panelType) {
      var level = this.getBuildingLevel(panelType);
      // Returns a multiplier bonus per building type per level
      if (panelType === 'hardware') return level * 0.05; // -5/10/15% cost
      if (panelType === 'exchange') return level * 0.05; // +5/10/15% sell
      if (panelType === 'mine') return level * 0.1; // +10/20/30% tap
      if (panelType === 'casino') return level * 0.02; // +2/4/6% win
      return level * 0.03; // generic 3% per level
    },

    // ── Rare Drops ──
    RARE_ITEMS: [
      {id:'r_whitepaper',name:'Satoshi\'s Whitepaper',set:'satoshi',icon:'\u{1F4DC}'},
      {id:'r_genesis',name:'Genesis Block',set:'satoshi',icon:'\u{1F4A0}'},
      {id:'r_pizza',name:'Pizza Receipt',set:'satoshi',icon:'\u{1F355}'},
      {id:'r_key',name:'Genesis Key',set:'satoshi',icon:'\u{1F511}'},
      {id:'r_wallet',name:'Satoshi\'s Wallet',set:'satoshi',icon:'\u{1F4B0}'},
      {id:'r_cpu',name:'Vintage CPU',set:'hardware',icon:'\u{1F4BE}'},
      {id:'r_gpu',name:'Gold GPU',set:'hardware',icon:'\u{1F4BB}'},
      {id:'r_asic',name:'Diamond ASIC',set:'hardware',icon:'\u{1F48E}'},
      {id:'r_quantum',name:'Quantum Chip',set:'hardware',icon:'\u2699\uFE0F'},
      {id:'r_alien',name:'Alien Tech',set:'hardware',icon:'\u{1F47D}'},
      {id:'r_alt',name:'Alt Coin',set:'crypto',icon:'\u{1FA99}'},
      {id:'r_defi',name:'DeFi Token',set:'crypto',icon:'\u{1F4B1}'},
      {id:'r_nft',name:'NFT Art',set:'crypto',icon:'\u{1F5BC}\uFE0F'},
      {id:'r_contract',name:'Smart Contract',set:'crypto',icon:'\u{1F4C4}'},
      {id:'r_dao',name:'DAO Vote',set:'crypto',icon:'\u{1F5F3}\uFE0F'},
      {id:'r_moon',name:'Moon Rock',set:'legend',icon:'\u{1F311}'},
      {id:'r_lambo',name:'Lambo Keys',set:'legend',icon:'\u{1F511}'},
      {id:'r_diamond',name:'Diamond Hands',set:'legend',icon:'\u{1F48E}'},
      {id:'r_hodl',name:'HODL Certificate',set:'legend',icon:'\u{1F4C3}'},
      {id:'r_flag',name:'Moon Flag',set:'legend',icon:'\u{1F3F3}\uFE0F'},
    ],
    SET_BONUSES: { satoshi: 0.25, hardware: 0.25, crypto: 0.25, legend: 1.0 },
    checkRareDrop: function() {
      var s = this.state;
      if (!s.collection) s.collection = {};
      if (Math.random() > 0.005) return; // 0.5% chance per tap (was 0.1%)
      var unowned = this.RARE_ITEMS.filter(function(r) { return !s.collection[r.id]; });
      if (unowned.length === 0) return;
      var item = unowned[Math.floor(Math.random() * unowned.length)];
      s.collection[item.id] = true;
      if (UI && UI.toast) UI.toast(item.icon + ' RARE: ' + item.name + '!');
      if (window.Sound) Sound.levelUp();
    },
    getCollectionBonus: function() {
      var s = this.state, self = this;
      if (!s.collection) return 0;
      var total = 0;
      var sets = {};
      this.RARE_ITEMS.forEach(function(r) { if (s.collection[r.id]) { if (!sets[r.set]) sets[r.set] = 0; sets[r.set]++; } });
      for (var setName in sets) {
        if (sets[setName] >= 5) total += self.SET_BONUSES[setName] || 0;
      }
      // +2% per individual item
      total += Object.keys(s.collection).length * 0.02;
      return total;
    },

    // ── Craig Rival ──
    getSkillScore: function() {
      var s = this.state;
      return (s.tokens || 0) + Math.floor(Object.keys(s.buildingStars || {}).length) +
        Math.floor(Object.keys(s.achievements || {}).length / 5) +
        Math.floor((s.lifetimeSats || 0) / 100000);
    },
    getCraigPace: function() {
      var score = this.getSkillScore();
      if (score >= 25) return 0.95;
      if (score >= 10) return 0.85;
      return 0.70;
    },
    updateCraig: function(dt) {
      var s = this.state;
      if (!s.craig) s.craig = { sats: 0, hardware: 0, lastTaunt: 0 };
      // Craig gets a head start: starts at 30% of player's lifetime sats
      if (s.craig.sats === 0 && s.lifetimeSats > 100) s.craig.sats = s.lifetimeSats * 0.3;
      var pace = this.getCraigPace();
      if (s.craig._sabotageUntil && Date.now() < s.craig._sabotageUntil) pace *= 0.5;
      var playerRate = Math.max(1, this.getProductionRate() * this.getMultiplier());
      s.craig.sats += playerRate * pace * dt;
      // Craig also earns a base amount even when player has no production
      s.craig.sats += 0.5 * dt;
      // Craig steals from you if he's ahead (reduced from 1% to 0.2%)
      if (s.craig.sats > s.lifetimeSats * 1.1) {
        var steal = playerRate * 0.002 * dt; // 0.2% production per second
        s.sats = Math.max(0, s.sats - steal);
      }
      s.craig.hardware = Math.floor(s.craig.sats / 5000);
      // Craig taunts
      var now = Date.now();
      if (now - s.craig.lastTaunt > 120000) { // every 2 min
        s.craig.lastTaunt = now;
        if (s.craig.sats > s.lifetimeSats * 0.9) {
          var taunts = ['Craig: "Catching up yet?"', 'Craig: "My rigs never sleep!"', 'Craig: "I\'m about to prestige..."'];
          if (UI && UI.toast) UI.toast('\u{1F9D4} ' + taunts[Math.floor(Math.random() * taunts.length)]);
        } else if (s.craig.sats < s.lifetimeSats * 0.5) {
          var nice = ['Craig: "Nice moves..."', 'Craig: "How did you get so many sats?!"', 'Craig: "I\'ll catch up, just watch."'];
          if (UI && UI.toast) UI.toast('\u{1F9D4} ' + nice[Math.floor(Math.random() * nice.length)]);
        }
      }
    },

    challengeCraig: function() {
      var s = this.state;
      if (!s.craig) return null;
      // 30-second duel: compare production rates
      var playerRate = Math.max(1, this.getProductionRate() * this.getMultiplier());
      var craigRate = playerRate * this.getCraigPace();
      var playerScore = playerRate * 30 * (0.8 + Math.random() * 0.4);
      var craigScore = craigRate * 30 * (0.8 + Math.random() * 0.4);
      var won = playerScore > craigScore;
      var prize = Math.max(10, Math.floor(Math.max(playerScore, craigScore) * 0.5));
      if (won) { s.sats += prize; s.totalSats += prize; s.lifetimeSats += prize; }
      else { s.sats = Math.max(0, s.sats - Math.floor(prize * 0.3)); }
      return { won: won, prize: prize, playerScore: Math.floor(playerScore), craigScore: Math.floor(craigScore) };
    },
    sabotageCraig: function() {
      var s = this.state;
      if (s.sats < 1000) return false;
      s.sats -= 1000;
      if (!s.craig) s.craig = { sats: 0, hardware: 0, lastTaunt: 0 };
      s.craig._sabotageUntil = Date.now() + 600000; // 10 min
      return true;
    },

    // ── Skill Tree ──
    SKILL_TREE: [
      { id: 'sk_hash1',  path: 'mining',  tier: 1, name: 'Hash Boost I',      desc: '+10% production', cost: 1 },
      { id: 'sk_hash2',  path: 'mining',  tier: 2, name: 'Auto-Vent',         desc: 'Auto-vent at 80% heat', cost: 2, requires: 'sk_hash1' },
      { id: 'sk_hash3',  path: 'mining',  tier: 3, name: 'Bulk Discount',     desc: 'Hardware -20%', cost: 3, requires: 'sk_hash2' },
      { id: 'sk_trade1', path: 'trader',  tier: 1, name: 'Market Eye',        desc: '+10% sell price', cost: 1 },
      { id: 'sk_trade2', path: 'trader',  tier: 2, name: 'Trend Spotter',     desc: 'See price trend', cost: 2, requires: 'sk_trade1' },
      { id: 'sk_trade3', path: 'trader',  tier: 3, name: 'Auto-Sell Bull',    desc: 'Auto-sell in bull runs', cost: 3, requires: 'sk_trade2' },
      { id: 'sk_shadow1',path: 'shadow',  tier: 1, name: 'Low Profile',       desc: 'Risk decays 2x faster', cost: 1 },
      { id: 'sk_shadow2',path: 'shadow',  tier: 2, name: 'Discount Goods',    desc: 'Dark web -30% cost', cost: 2, requires: 'sk_shadow1' },
      { id: 'sk_shadow3',path: 'shadow',  tier: 3, name: 'Untouchable',       desc: 'Immune 5min after buy', cost: 3, requires: 'sk_shadow2' },
    ],
    buySkill: function(id) {
      var s = this.state;
      var sk = this.SKILL_TREE.find(function(x) { return x.id === id; });
      if (!sk || (s.skills && s.skills[id])) return false;
      if (sk.requires && !(s.skills && s.skills[sk.requires])) return false;
      if ((s.skillPoints || 0) < sk.cost) return false;
      s.skillPoints -= sk.cost;
      if (!s.skills) s.skills = {};
      s.skills[id] = true;
      return true;
    },
    hasSkill: function(id) { return !!(this.state.skills && this.state.skills[id]); },

    // ── Story ──
    STORY_FRAGMENTS: [
      { id: 'ch1', name: 'Chapter 1: The Genesis Block', text: 'In 2009, a mysterious figure mined the first Bitcoin block, embedding a message about bank bailouts.', reward: 100 },
      { id: 'ch2', name: 'Chapter 2: The Pizza', text: 'On May 22, 2010, someone paid 10,000 BTC for two pizzas. Worth hundreds of millions today.', reward: 200 },
      { id: 'ch3', name: 'Chapter 3: The Silk Road', text: 'The dark web marketplace proved Bitcoin could be used for anonymous transactions.', reward: 300 },
      { id: 'ch4', name: 'Chapter 4: Mt. Gox', text: 'The largest exchange collapsed in 2014, losing 850,000 BTC. Trust was shattered.', reward: 500 },
      { id: 'ch5', name: 'Chapter 5: The Halving', text: 'Every 210,000 blocks, the mining reward halves. Scarcity drives value.', reward: 500 },
      { id: 'ch6', name: 'Chapter 6: HODL', text: 'A typo in a forum post became a movement. "Hold On for Dear Life" became a philosophy.', reward: 300 },
      { id: 'ch7', name: 'Chapter 7: The Bull Run', text: 'In 2017, Bitcoin reached $20,000 for the first time. The world took notice.', reward: 500 },
      { id: 'ch8', name: 'Chapter 8: Lightning', text: 'The Lightning Network promised instant Bitcoin payments. Layer 2 was born.', reward: 400 },
      { id: 'ch9', name: 'Chapter 9: DeFi Summer', text: 'In 2020, decentralized finance exploded. Smart contracts changed everything.', reward: 500 },
      { id: 'ch10', name: 'Chapter 10: The Moon', text: 'They said Bitcoin would go to the moon. And maybe, just maybe, it will.', reward: 1000 },
    ],
    checkStoryDrop: function() {
      var s = this.state;
      if (!s.storyFound) s.storyFound = {};
      if (Math.random() > 0.002) return; // 0.2% per tick (was 0.03%)
      var unread = this.STORY_FRAGMENTS.filter(function(f) { return !s.storyFound[f.id]; });
      if (unread.length === 0) return;
      var frag = unread[Math.floor(Math.random() * unread.length)];
      s.storyFound[frag.id] = true;
      s.sats += frag.reward; s.totalSats += frag.reward; s.lifetimeSats += frag.reward;
      if (UI && UI.toast) UI.toast('\u{1F4DC} ' + frag.name + ' (+' + frag.reward + ' sats)');
    },

    // ── Area Unlock ──
    checkAreaUnlock: function() {
      var s = this.state;
      if (!s.unlockedAreas) s.unlockedAreas = ['north'];
      if (s.unlockedAreas.indexOf('south') === -1 && s.lifetimeSats >= 50000) {
        s.unlockedAreas.push('south');
        if (UI && UI.toast) UI.toast('\u{1F510} Southside District unlocked!');
      }
      if (s.unlockedAreas.indexOf('waterfront') === -1 && s.lifetimeSats >= 500000) {
        s.unlockedAreas.push('waterfront');
        if (UI && UI.toast) UI.toast('\u{1F510} Waterfront area unlocked!');
      }
    },

    // ── Seasonal Events ──
    activeEvent: null,
    checkSeasonalEvents: function() {
      if (this.activeEvent) return;
      var d = new Date();
      var m = d.getMonth(), day = d.getDate();
      // Christmas (Dec 20-31)
      if (m === 11 && day >= 20) { this.activeEvent = { name: 'Crypto Christmas', icon: '\u{1F384}', bonus: 'collect5x', desc: 'Collectibles worth 5x!' }; }
      // Halloween (Oct 25-31)
      else if (m === 9 && day >= 25) { this.activeEvent = { name: 'Spooky Mining', icon: '\u{1F383}', bonus: 'darkweb50', desc: 'Dark web -50% cost!' }; }
      // April Fools (Apr 1)
      else if (m === 3 && day === 1) { this.activeEvent = { name: "Satoshi's Birthday", icon: '\u{1F382}', bonus: 'double', desc: 'Double production!' }; }
    },
    getSeasonalMultiplier: function() {
      if (!this.activeEvent) return 1;
      if (this.activeEvent.bonus === 'double') return 2;
      return 1;
    },

    SEEDS: SEEDS, WORLD_W: 2400, WORLD_H: 1700,

    collectStreetItem: function() {
      var rate = Math.max(1, this.getProductionRate());
      var gain = Math.max(10, Math.min(5000, Math.floor(rate * 0.1 + Math.random() * rate * 0.2)));
      if (this.activeEvent && this.activeEvent.bonus === 'collect5x') gain *= 5;
      this.state.sats += gain;
      this.state.totalSats += gain;
      this.state.lifetimeSats += gain;
      if (!this.state.stats) this.state.stats = {};
      this.state.stats.itemsCollected = (this.state.stats.itemsCollected || 0) + 1;
      if (window.Sound) Sound.coinCollect();
      if (UI && UI.toast) UI.toast('\u20BF Found +' + Game.formatNumber(gain) + ' sats!');
      return gain;
    },

    tapMine: function() {
      var gain = 5; // base 5 sats per tap
      // Scale with owned hardware count
      var hwCount = 0;
      for (var i = 0; i < HARDWARE.length; i++) hwCount += (this.state.owned[HARDWARE[i].id] || 0);
      gain += hwCount * 2; // +2 per owned hardware
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
      this.checkTreasureDrop();
      this.checkRareDrop();
      if (!this.state.stats) this.state.stats = {};
      this.state.stats.taps = (this.state.stats.taps || 0) + 1;
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
      if (!this.state.stats) this.state.stats = {};
      this.state.stats.satsSold = (this.state.stats.satsSold || 0) + satsToSell;
      // Tutorial: step 5 (sell sats) → step 6, then auto-complete to 7
      if (this.state.tutorialStep === 5) {
        this.state.tutorialStep = 6;
        var self = this;
        setTimeout(function() { if (self.state.tutorialStep === 6) self.state.tutorialStep = 7; }, 5000);
      }
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

    getPriceTrend: function() {
      if (!this.hasSkill('sk_trade2')) return null;
      var s = this.state;
      if (s.priceEvent) {
        var remaining = Math.max(0, Math.ceil((s.priceEvent.endsAt - Date.now()) / 1000));
        return { trend: s.priceEvent.type === 'bull' ? 'up' : 'down', label: (s.priceEvent.type === 'bull' ? 'Bull' : 'Crash') + ' (' + remaining + 's)', active: true };
      }
      if (s.nextEventAt) {
        var eta = Math.max(0, Math.ceil((s.nextEventAt - Date.now()) / 1000));
        return { trend: 'pending', label: 'Next event ~' + eta + 's', active: false };
      }
      return { trend: 'stable', label: 'Stable', active: false };
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
      if (r < 0.01) mult = 10;       // 1% jackpot (unchanged)
      else if (r < 0.05) mult = 5;   // 4% big win (unchanged)
      else if (r < 0.15) mult = 3;   // 10% medium (unchanged)
      else if (r < 0.40 + bonus) mult = 1.5; // 25-30% small win (lucky expands this)
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

      // Production (zero during power cut)
      var rate = s.powerCut ? 0 : this.getProductionRate();
      var mul = this.getMultiplier();
      var gain = rate * mul * dt;
      s.sats += gain; s.totalSats += gain; s.lifetimeSats += gain;

      // Tutorial: step 3 → 4 when player has enough for a laptop
      if (s.tutorialStep === 3 && s.sats >= 15) s.tutorialStep = 4;

      // Heat
      var hGen = 0;
      for (var i = 0; i < HARDWARE.length; i++) {
        hGen += (s.owned[HARDWARE[i].id] || 0) * Math.max(0.01, HARDWARE[i].heat + ((s.owned.d2 || 0) * -0.05));
      }
      for (var j = 0; j < DARK_WEB.length; j++) {
        if (DARK_WEB[j].id !== 'd2') hGen += (s.owned[DARK_WEB[j].id] || 0) * DARK_WEB[j].heat;
      }
      // Heat: direct hGen with 0.3/s passive cooling — heat matters from early game
      s.heat = Math.min(100, Math.max(0, s.heat + (hGen * this.getHeatMultiplier() * dt) - (0.3 * dt)));

      // Energy - drains slowly, regens slowly
      var energyDrain = 0.4; // per second base
      if (this.getProductionRate() > 0) energyDrain = 0.6; // drains in ~170s when producing
      // Reduced regen while producing (25% of normal), full regen when idle
      var energyRegen = this.getEnergyRegen() * dt * (this.getProductionRate() > 0 ? 0.25 : 1.0);
      s.energy = Math.max(0, Math.min(this.getEnergyMax(), s.energy - (energyDrain * dt) + energyRegen));

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
          s._billUnpaid = true;
          s.usd = 0; // Can't go negative
        } else {
          s._billUnpaid = false;
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
          // Warn at 2x original
          if (loan.owed > loan.amount * 2 && !loan._warned) {
            loan._warned = true;
            if (UI && UI.toast) UI.toast('\u26A0\uFE0F Loan at 2x! Repay soon or default at 5x!');
          }
          // Default: if owed > 5x original
          if (loan.owed > loan.amount * 5) {
            s.loans = [];
            var safeProtect = this._getItemBonus('protect'); // Safe furniture
            s.sats = Math.floor(s.sats * (0.5 + safeProtect)); // Safe protects some sats
            s.usd = Math.max(0, s.usd - loan.amount * 0.5);
            if (UI && UI.toast) UI.toast('\u{1F6A8} Loan defaulted! Lost ' + Math.round((0.5 - safeProtect) * 100) + '% sats and $' + Game.formatNumber(loan.amount * 0.5) + '!');
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
      var riskDecayRate = this.hasSkill('sk_shadow1') ? 0.02 : 0.01;
      if (s.policeRisk > 0) s.policeRisk = Math.max(0, s.policeRisk - riskDecayRate * dt);

      // Auto-sell (prestige upgrade)
      if (this.hasPrestigeUpgrade('pu_autosell') && s.sats > 10000) {
        if (!s._lastAutoSell) s._lastAutoSell = now;
        if (now - s._lastAutoSell > 30000) { // every 30s
          this.sellSats(0.5);
          s._lastAutoSell = now;
        }
      }

      // NPC events (every 60-120s while tutorial done)
      if (s.tutorialStep >= 7 && !s.pendingNpcEvent) {
        if (!s.lastNpcTime) s.lastNpcTime = now;
        var npcInterval = 60000 + Math.random() * 60000;
        if (now - s.lastNpcTime > npcInterval) {
          var evt = NPC_EVENTS[Math.floor(Math.random() * NPC_EVENTS.length)];
          s.pendingNpcEvent = { id: evt.id, name: evt.name, icon: evt.icon, desc: evt.desc, accept: evt.accept, decline: evt.decline };
          s.lastNpcTime = now;
        }
      }

      // Police consequences
      if (s.policeRisk >= 100 && !s.policeChaseActive && !(s._immuneUntil && now < s._immuneUntil)) {
        s.policeChaseActive = true;
        s.policeChaseEnd = now + 15000;
        if (window.Sound) Sound.policeSiren();
        if (UI && UI.toast) UI.toast('\u{1F6A8} POLICE CHASE! Run home!');
      }
      if (s.policeChaseActive && now >= s.policeChaseEnd) {
        s.policeChaseActive = false;
        // Check if player escaped home (near apartment building)
        var escaped = false;
        if (s.avatar && window.Town && window.Town.BUILDINGS) {
          var home = window.Town.BUILDINGS.find(function(b) { return b.id === 'apartment'; });
          if (home) {
            var hdx = s.avatar.x - (home.x + home.w / 2);
            var hdy = s.avatar.y - (home.y + home.h / 2);
            escaped = Math.sqrt(hdx * hdx + hdy * hdy) < 100;
          }
        }
        if (escaped) {
          // Escaped! Just a fine
          var fine = 200 + Math.floor(Math.random() * 300);
          s.usd = Math.max(0, s.usd - fine);
          s.policeRisk = Math.max(0, s.policeRisk - 50);
          if (UI && UI.toast) UI.toast('\u{1F3E0} Escaped! Paid $' + fine + ' fine.');
        } else {
          // Caught! Full penalty
          s.owned.d1 = 0; s.owned.d2 = 0; s.owned.d3 = 0;
          s.sats = Math.floor(s.sats * 0.5);
          s.usd = Math.max(0, s.usd * 0.5);
          s.policeRisk = 0;
          if (UI && UI.toast) UI.toast('\u{1F6A8} ARRESTED! Lost dark web items, 50% sats & USD!');
        }
      }
      if (s.policeRisk >= 50 && !s._lastRaidTime) s._lastRaidTime = now;
      if (s.policeRisk >= 50 && now - (s._lastRaidTime || 0) > 300000) {
        s._lastRaidTime = now;
        var confiscated = '';
        if (s.owned.d1 > 0) { s.owned.d1--; confiscated = 'Botnet'; }
        else if (s.owned.d3 > 0) { s.owned.d3--; confiscated = 'Relay'; }
        if (confiscated) {
          s.tickets.push({ fine: 100 + Math.floor(Math.random() * 400), issuedAt: now });
          if (UI && UI.toast) UI.toast('\u{1F46E} Police raid! Confiscated ' + confiscated + ' + ticket issued!');
        }
      }
      // Unpaid tickets → auto-arrest
      if (s.tickets.length >= 3 && s.policeRisk >= 25) {
        s.policeRisk = 100; // triggers chase next tick
      }

      // Electricity enforcement
      if (s.powerCut) {
        if (now >= s.powerCutUntil) s.powerCut = false;
      }
      if (!s.powerCut && s.electricityBill > 0 && s.usd <= 0 && s._billUnpaid) {
        s.powerCut = true;
        s.powerCutUntil = now + 30000;
        if (UI && UI.toast) UI.toast('\u26A1 BLACKOUT! Power cut for 30s!');
      }

      // Weather
      this.updateWeather(dt);
      // Storm hardware damage
      if (this.weather === 'storm') {
        if (!s._stormDmgCheck) s._stormDmgCheck = now;
        if (now - s._stormDmgCheck > 60000) {
          s._stormDmgCheck = now;
          if (Math.random() < 0.02) {
            for (var hi = HARDWARE.length - 1; hi >= 0; hi--) {
              if ((s.owned[HARDWARE[hi].id] || 0) > 0) { s.owned[HARDWARE[hi].id]--; if (UI && UI.toast) UI.toast('\u26A1 Lightning fried a ' + HARDWARE[hi].name + '!'); break; }
            }
          }
        }
      }
      // Record movement for ghosts (every 2 seconds)
      if (s.avatar) {
        if (!s._lastRecordTime) s._lastRecordTime = now;
        if (now - s._lastRecordTime > 2000) {
          s._lastRecordTime = now;
          if (!s.movementHistory) s.movementHistory = [];
          s.movementHistory.push({ x: s.avatar.x, y: s.avatar.y });
          if (s.movementHistory.length > 150) s.movementHistory.shift();
        }
      }
      // Seasonal events
      this.checkSeasonalEvents();
      // Craig rival
      this.updateCraig(dt);
      // Story fragments
      this.checkStoryDrop();
      // Area unlocks
      this.checkAreaUnlock();
      // Auto-vent skill
      if (this.hasSkill('sk_hash2') && s.heat >= 80) { s.heat = Math.max(0, s.heat - 5 * dt); }
      // Auto-sell in bull skill (every 30s, not every frame)
      if (this.hasSkill('sk_trade3') && s.priceEvent && s.priceEvent.type === 'bull' && s.sats > 1000) {
        if (!s._lastTradeSkillSell) s._lastTradeSkillSell = now;
        if (now - s._lastTradeSkillSell > 30000) {
          this.sellSats(0.5);
          s._lastTradeSkillSell = now;
        }
      }

      // Daily challenges
      this.generateDailyChallenges();
      this.checkDailyChallenges();

      // Treasure map expiry
      if (s.treasureMap && Date.now() > s.treasureMap.expiresAt) {
        s.treasureMap = null;
        if (UI && UI.toast) UI.toast('\u{1F5FA}\uFE0F Treasure map expired!');
      }

      // Check achievements
      this.checkAchievements();

      // BTC price random walk with mean reversion toward 65K
      var priceDrift = (Math.random() - 0.5) * 0.0005;
      var meanRevert = (65000 - s.price) * 0.00001; // Pull toward 65K
      s.price *= (1 + priceDrift + meanRevert);
      s.price = Math.max(50000, Math.min(150000, s.price)); // Floor 50K, cap 150K

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
          if (a.reward > 0) { s.sats += a.reward; s.totalSats += a.reward; s.lifetimeSats += a.reward; }
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
      var skills = this.state.skills || {};
      var skillPoints = (this.state.skillPoints || 0) + 1; // +1 per prestige
      var collection = this.state.collection || {};
      var storyFound = this.state.storyFound || {};
      var buildingStars = this.state.buildingStars || {};
      var stats = this.state.stats || {};
      var def = defaultState();
      def.tokens = tokens;
      def.prestigeUpgrades = upgrades;
      def.achievements = achievements;
      def.skills = skills;
      def.skillPoints = skillPoints;
      def.collection = collection;
      def.storyFound = storyFound;
      def.buildingStars = buildingStars;
      def.stats = stats;
      def.avatar = avatar;
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
