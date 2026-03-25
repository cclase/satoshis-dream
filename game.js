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
    { id: 'd1', name: 'Botnet',  icon: '\u{1F480}', base: 100,   rate: 1200,  heat: 0,    cur: 'usd', desc: 'Passive hash' },
    { id: 'd2', name: 'Coolant', icon: '\u2744\uFE0F', base: 500,   rate: 0,     heat: -0.05, cur: 'usd', desc: '-Heat gen' },
    { id: 'd3', name: 'Relay',   icon: '\u{1F6F0}\uFE0F', base: 10000, rate: 25000, heat: 15,   cur: 'usd', desc: 'Deep-web nodes' },
  ];

  var HOUSING = [
    { id: 'studio',    name: 'Studio Apartment', slots: 3,   cost: 0,       cur: 'usd' },
    { id: 'apartment', name: 'Apartment',        slots: 8,   cost: 500,     cur: 'usd' },
    { id: 'house',     name: 'House',            slots: 20,  cost: 5000,    cur: 'usd' },
    { id: 'warehouse', name: 'Warehouse',        slots: 50,  cost: 50000,   cur: 'usd' },
    { id: 'solar',     name: 'Solar Farm',       slots: 200, cost: 1000000, cur: 'usd' },
  ];

  var VEHICLES = [
    { id: 'bicycle',   name: 'Bicycle',     icon: '\u{1F6B2}', speed: 1.25, cost: 50,     cur: 'usd' },
    { id: 'scooter',   name: 'Scooter',     icon: '\u{1F6F5}', speed: 1.5,  cost: 200,    cur: 'usd' },
    { id: 'car',       name: 'Car',         icon: '\u{1F697}', speed: 2.0,  cost: 2000,   cur: 'usd' },
    { id: 'sports',    name: 'Sports Car',  icon: '\u{1F3CE}\uFE0F', speed: 3.0,  cost: 25000,  cur: 'usd' },
    { id: 'heli',      name: 'Helicopter',  icon: '\u{1F681}', speed: 5.0,  cost: 500000, cur: 'usd' },
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

  var SAVE_KEY = 'sd_town_v1';
  var OLD_SAVE_KEY = 'sd_v2_5';
  var COST_SCALE = 1.18;

  function defaultState() {
    return {
      avatar: null,
      sats: 0, usd: 0, totalSats: 0, lifetimeSats: 0,
      heat: 0, owned: {}, tokens: 0, price: 65000, buyMulti: 1,
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
      version: 2,
      lastTick: Date.now(),
    };
  }

  var Game = {
    state: defaultState(),
    HARDWARE: HARDWARE, DARK_WEB: DARK_WEB, HOUSING: HOUSING,
    VEHICLES: VEHICLES, PETS: PETS, RESEARCH: RESEARCH, LOANS: LOANS,
    COST_SCALE: COST_SCALE,
    lastFrame: 0, running: false, floatingTexts: [],

    init: function() {
      this.load();
      var all = [].concat(HARDWARE, DARK_WEB);
      for (var i = 0; i < all.length; i++) {
        if (this.state.owned[all[i].id] === undefined) this.state.owned[all[i].id] = 0;
      }
      if (!this.state.nextEventAt) this.scheduleNextEvent();
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

    // ── Economy ──
    getBulkCost: function(item, count) {
      var total = 0, owned = this.state.owned[item.id] || 0;
      for (var i = 0; i < count; i++) total += Math.floor(item.base * Math.pow(COST_SCALE, owned + i));
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
      return rate;
    },

    getMultiplier: function() {
      var s = this.state;
      var mul = 1 + (s.tokens * 0.1);
      if (s.avatar && s.avatar.bonus === 'investor') mul += 0.1;
      if (s.research.overclock) mul *= 1.25;
      if (s.research.quantum) mul *= 2.0;
      if (s.pet === 'dog') mul *= 1.05;
      if (s.pet === 'snake') mul *= 1.25;
      if (s.heat > 90) mul *= 0.1;
      if (s.energy <= 0) mul *= 0.05;
      return mul;
    },

    getHeatMultiplier: function() {
      var s = this.state;
      var mul = 1.0;
      if (s.avatar && s.avatar.bonus === 'coolrunner') mul *= 0.8;
      if (s.research.heatsink) mul *= 0.7;
      if (s.pet === 'cat') mul *= 0.95;
      return mul;
    },

    getSellMultiplier: function() {
      var mul = 1.0;
      if (this.state.research.algo_trade) mul *= 1.10;
      if (this.state.pet === 'parrot') mul *= 1.15;
      return mul;
    },

    getSpeedMultiplier: function() {
      if (!this.state.vehicle) return 1.0;
      var v = VEHICLES.find(function(v) { return v.id === Game.state.vehicle; });
      return v ? v.speed : 1.0;
    },

    getElectricityCost: function() {
      // Cost per second based on owned hardware
      var cost = 0;
      for (var i = 0; i < HARDWARE.length; i++) {
        cost += (this.state.owned[HARDWARE[i].id] || 0) * HARDWARE[i].heat * 0.01;
      }
      if (this.state.housing === 'solar') return 0;
      if (this.state.research.solar_int) cost *= 0.5;
      if (this.state.pet === 'lizard') cost *= 0.9;
      cost -= this.state.electricitySolar * 0.1;
      return Math.max(0, cost);
    },

    getEnergyMax: function() {
      return 100 + (this.state.gymLevel * 20);
    },

    getEnergyRegen: function() {
      return 0.5 + (this.state.gymLevel * 0.2);
    },

    tapMine: function() {
      var gain = 1;
      if (this.state.avatar && this.state.avatar.bonus === 'quickhands') gain += 5;
      if (this.state.pet === 'hamster') gain += 10;
      gain *= (1 + (this.state.tokens * 0.1));
      this.state.sats += gain;
      this.state.totalSats += gain;
      this.state.lifetimeSats += gain;
      this.state.heat = Math.min(100, this.state.heat + 0.05);
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
      var win = Math.random() > 0.5;
      if (win) { this.state.sats += bet * 2; return bet; }
      return -bet;
    },

    slotMachine: function(bet) {
      if (bet <= 0 || bet > this.state.sats) return null;
      this.state.sats -= bet;
      var r = Math.random();
      var mult = 0;
      if (r < 0.01) mult = 10;       // Jackpot 1%
      else if (r < 0.05) mult = 5;   // Big win 4%
      else if (r < 0.15) mult = 3;   // Medium 10%
      else if (r < 0.40) mult = 1.5; // Small 25%
      // 60% lose
      var win = Math.floor(bet * mult);
      this.state.sats += win;
      return { mult: mult, win: win - bet };
    },

    // ── Tick ──
    tick: function(dt) {
      var s = this.state;
      var now = Date.now();

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
      s.heat = Math.min(100, Math.max(0, s.heat + (hGen * this.getHeatMultiplier() / 15 * dt) - (4 * dt)));

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

      // Loan interest (compounds daily, check every 60s)
      if (s.loans.length > 0) {
        if (!s.loanTime) s.loanTime = now;
        if (now - s.loanTime > 60000) {
          var loan = s.loans[0];
          var loanDef = LOANS.find(function(l) { return l.id === loan.id; });
          if (loanDef) {
            loan.owed *= (1 + loanDef.rate * 0.001); // Small compound per minute
          }
          s.loanTime = now;
          // Default: if owed > 5x original
          if (loan.owed > loan.amount * 5) {
            s.loans = [];
            s.sats = Math.floor(s.sats * 0.5); // Penalty
            if (UI && UI.toast) UI.toast('\u{1F6A8} Loan defaulted! Lost 50% sats!');
          }
        }
      }

      // Mail orders - deliver
      for (var m = s.mailOrders.length - 1; m >= 0; m--) {
        if (now >= s.mailOrders[m].arrivesAt) {
          var order = s.mailOrders.splice(m, 1)[0];
          var item = HARDWARE.find(function(u) { return u.id === order.itemId; }) ||
                     DARK_WEB.find(function(u) { return u.id === order.itemId; });
          if (item) {
            s.owned[item.id] = (s.owned[item.id] || 0) + 1;
            if (UI && UI.toast) UI.toast('\u{1F4E6} ' + order.name + ' delivered!');
          }
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

    formatNumber: function(n) {
      if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
      if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
      if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
      return Math.floor(n).toLocaleString();
    },
  };

  window.Game = Game;
})();
