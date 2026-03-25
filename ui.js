(function() {
  'use strict';

  var UI = {
    keys: { up: false, down: false, left: false, right: false },
    panelOpen: false,
    currentPanel: null,
    currentBuilding: null,
    toastTimer: null,
    _hwDirty: true,

    init: function() {
      this.setupKeyboard();
      this.setupDpad();
      this.setupNavMenu();
      this.setupHUD();
      if (!Game.state.avatar) this.showAvatarCreation();
      else {
        this.startGame();
        // Show offline earnings if any
        if (Game._offlineReport) this.showOfflineReport(Game._offlineReport);
      }
    },

    showOfflineReport: function(report) {
      var modal = document.getElementById('modal');
      modal.classList.add('active');
      var mins = Math.floor(report.seconds / 60);
      var hrs = Math.floor(mins / 60);
      var timeStr = hrs > 0 ? hrs + 'h ' + (mins % 60) + 'm' : mins + 'm ' + (report.seconds % 60) + 's';
      modal.innerHTML = '<div class="modal-card" style="text-align:center;">' +
        '<div class="modal-title" style="color:var(--gold);">\u{1F44B} Welcome Back!</div>' +
        '<p style="color:var(--dim);margin-bottom:16px;font-size:14px;">You were away for <strong style="color:var(--text);">' + timeStr + '</strong></p>' +
        '<div style="background:rgba(247,147,26,0.1);border:1px solid rgba(247,147,26,0.3);border-radius:10px;padding:16px;margin-bottom:16px;">' +
          '<div style="font-size:12px;color:var(--dim);margin-bottom:4px;">OFFLINE EARNINGS (' + report.efficiency + '% efficiency)</div>' +
          '<div style="font-size:28px;font-weight:900;color:var(--gold);">+' + Game.formatNumber(report.sats) + ' sats</div>' +
        '</div>' +
        '<button class="modal-btn" id="offlineDismiss">Continue</button></div>';
      document.getElementById('offlineDismiss').addEventListener('click', function() {
        modal.classList.remove('active'); modal.innerHTML = '';
        document.getElementById('town').focus();
      });
      Game._offlineReport = null;
    },

    // ── Input ──
    isInputFocused: function() {
      var el = document.activeElement;
      if (!el) return false;
      var t = el.tagName;
      return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT';
    },
    modalActive: function() {
      var m = document.getElementById('modal');
      return m && m.classList.contains('active');
    },

    setupKeyboard: function() {
      var self = this;
      document.addEventListener('keydown', function(e) {
        if (self.isInputFocused() || self.modalActive()) return;
        switch(e.key) {
          case 'ArrowUp': case 'w': case 'W': self.keys.up = true; e.preventDefault(); break;
          case 'ArrowDown': case 's': case 'S': self.keys.down = true; e.preventDefault(); break;
          case 'ArrowLeft': case 'a': case 'A': self.keys.left = true; e.preventDefault(); break;
          case 'ArrowRight': case 'd': case 'D': self.keys.right = true; e.preventDefault(); break;
          case 'Enter': self.handleAction(); e.preventDefault(); break;
          case 'Escape': self.hidePanel(); e.preventDefault(); break;
        }
      });
      document.addEventListener('keyup', function(e) {
        if (self.isInputFocused()) return;
        switch(e.key) {
          case 'ArrowUp': case 'w': case 'W': self.keys.up = false; break;
          case 'ArrowDown': case 's': case 'S': self.keys.down = false; break;
          case 'ArrowLeft': case 'a': case 'A': self.keys.left = false; break;
          case 'ArrowRight': case 'd': case 'D': self.keys.right = false; break;
        }
      });
      window.addEventListener('blur', function() {
        self.keys.up = self.keys.down = self.keys.left = self.keys.right = false;
      });
    },

    setupDpad: function() {
      var dpad = document.getElementById('dpad');
      var self = this;
      var dirs = [
        { cls: 'dpad-up', arrow: '\u25B2', key: 'up' },
        { cls: 'dpad-left', arrow: '\u25C0', key: 'left' },
        { cls: 'dpad-right', arrow: '\u25B6', key: 'right' },
        { cls: 'dpad-down', arrow: '\u25BC', key: 'down' },
      ];
      dirs.forEach(function(d) {
        var btn = document.createElement('div');
        btn.className = 'dpad-btn ' + d.cls;
        btn.textContent = d.arrow;
        btn.addEventListener('touchstart', function(e) { e.preventDefault(); self.keys[d.key] = true; btn.classList.add('pressed'); });
        btn.addEventListener('touchend', function(e) { e.preventDefault(); self.keys[d.key] = false; btn.classList.remove('pressed'); });
        btn.addEventListener('touchcancel', function() { self.keys[d.key] = false; btn.classList.remove('pressed'); });
        dpad.appendChild(btn);
      });
      var actionBtn = document.createElement('div');
      actionBtn.id = 'dpad-action';
      actionBtn.textContent = 'A';
      actionBtn.addEventListener('touchstart', function(e) { e.preventDefault(); self.handleAction(); actionBtn.classList.add('pressed'); });
      actionBtn.addEventListener('touchend', function(e) { e.preventDefault(); actionBtn.classList.remove('pressed'); });
      document.body.appendChild(actionBtn);
    },

    // ── Building Nav Menu ──
    setupNavMenu: function() {
      var navBtn = document.getElementById('nav-menu-btn');
      var navMenu = document.getElementById('nav-menu');
      var self = this;

      navBtn.addEventListener('click', function() { self.toggleNavMenu(); });
      navBtn.addEventListener('touchstart', function(e) { e.preventDefault(); self.toggleNavMenu(); });

      var html = '<div class="nav-menu-header">' +
        '<div class="nav-menu-title">\u{1F5FA}\uFE0F Go To Building</div>' +
        '<button class="panel-close" id="navCloseBtn">\u2715</button></div>' +
        '<div class="nav-grid">';

      Town.BUILDINGS.forEach(function(b) {
        html += '<div class="nav-item" data-nav="' + b.id + '">' +
          '<span class="nav-item-emoji">' + b.emoji + '</span>' +
          '<span class="nav-item-name">' + b.name + '</span></div>';
      });
      html += '</div>';
      navMenu.innerHTML = html;

      document.getElementById('navCloseBtn').addEventListener('click', function() { self.hideNavMenu(); });

      navMenu.querySelectorAll('.nav-item').forEach(function(el) {
        el.addEventListener('click', function() {
          var b = Town.BUILDINGS.find(function(x) { return x.id === el.dataset.nav; });
          if (!b) return;
          // Set move target to building entrance (center-bottom)
          Town.moveTarget = { x: b.x + b.w / 2, y: b.y + b.h + 30 };
          Town.autoEnterBuilding = b;
          self.hideNavMenu();
        });
      });
    },

    toggleNavMenu: function() {
      var menu = document.getElementById('nav-menu');
      if (menu.classList.contains('active')) this.hideNavMenu();
      else { menu.classList.add('active'); this.panelOpen = true; }
    },

    hideNavMenu: function() {
      document.getElementById('nav-menu').classList.remove('active');
      if (!document.getElementById('panel').style.display || document.getElementById('panel').style.display === 'none') {
        this.panelOpen = false;
      }
    },

    // ── HUD ──
    setupHUD: function() {
      var hud = document.getElementById('hud');
      hud.innerHTML =
        '<div class="hud-left">' +
          '<div class="hud-item hud-sats">\u20BF <span id="hudSats">0</span></div>' +
          '<div class="hud-item hud-usd">$ <span id="hudUsd">0.00</span></div>' +
          '<div class="hud-item hud-tokens">\u{1FA99} <span id="hudTokens">0</span></div>' +
        '</div>' +
        '<div class="hud-right">' +
          '<div class="hud-item hud-price">BTC <span id="hudPrice">$65,000</span></div>' +
          '<div class="hud-item hud-rate"><span id="hudRate">0</span>/s</div>' +
          '<div class="hud-item hud-reset" id="hudReset">\u{1FA99}</div>' +
          '<div class="hud-item hud-reset" id="hudAchievements">\u{1F3C6}</div>' +
          '<div class="hud-item hud-reset" id="hudPrestigeShop">\u{1F6D2}</div>' +
        '</div>' +
        '<div class="heat-bar-wrap">' +
          '<div class="heat-bar"><div class="heat-fill" id="heatFill"></div></div>' +
          '<div class="heat-label" id="heatLabel">0%</div>' +
        '</div>' +
        '<div class="energy-bar-wrap">' +
          '<div class="energy-bar"><div class="energy-fill" id="energyFill"></div></div>' +
          '<div class="energy-label" id="energyLabel">\u26A1 100</div>' +
        '</div>' +
        '<div class="event-bar" id="eventBar"></div>';
      document.getElementById('hudReset').addEventListener('click', function() { UI.showResetConfirm(); });
      document.getElementById('hudAchievements').addEventListener('click', function() { UI.showAchievementsPanel(); });
      document.getElementById('hudPrestigeShop').addEventListener('click', function() { UI.showPrestigeShopPanel(); });
    },

    updateHUD: function() {
      var s = Game.state;
      var el = document.getElementById('hudSats'); if (el) el.textContent = Game.formatNumber(s.sats);
      el = document.getElementById('hudUsd'); if (el) el.textContent = Game.formatNumber(s.usd);
      el = document.getElementById('hudTokens'); if (el) el.textContent = s.tokens;
      el = document.getElementById('hudPrice'); if (el) el.textContent = '$' + Game.formatNumber(Game.getEffectivePrice());
      el = document.getElementById('hudRate'); if (el) el.textContent = Game.formatNumber(Game.getProductionRate() * Game.getMultiplier());

      var hp = Math.floor(s.heat);
      el = document.getElementById('heatFill'); if (el) { el.style.width = hp + '%'; el.className = 'heat-fill' + (hp > 90 ? ' heat-critical' : hp > 60 ? ' heat-warn' : ''); }
      el = document.getElementById('heatLabel'); if (el) el.textContent = hp + '%';

      var ep = Math.floor((s.energy / Game.getEnergyMax()) * 100);
      el = document.getElementById('energyFill'); if (el) el.style.width = ep + '%';
      el = document.getElementById('energyLabel'); if (el) el.textContent = '\u26A1 ' + Math.floor(s.energy);

      var eb = document.getElementById('eventBar');
      if (eb) {
        if (s.priceEvent) {
          var tl = Math.max(0, Math.ceil((s.priceEvent.endsAt - Date.now()) / 1000));
          eb.className = 'event-bar event-' + (s.priceEvent.type === 'bull' ? 'bull' : 'crash');
          eb.textContent = (s.priceEvent.type === 'bull' ? '\u{1F4C8} BULL +' : '\u{1F4C9} CRASH -') + s.priceEvent.magnitude + '% (' + tl + 's)';
          eb.style.display = 'block';
        } else { eb.style.display = 'none'; }
      }
    },

    showResetConfirm: function() {
      var modal = document.getElementById('modal');
      modal.classList.add('active');
      var newTokens = Game.getPrestigeTokens();
      var canPrestige = Game.canPrestige();
      var tokenGain = newTokens - Game.state.tokens;
      modal.innerHTML = '<div class="modal-card" style="text-align:center;">' +
        '<div class="modal-title" style="color:var(--purple);">\u{1FA99} Prestige</div>' +
        '<p style="color:var(--dim);margin-bottom:12px;font-size:14px;">Reset all progress but keep <strong style="color:var(--purple);">Prestige Tokens</strong>.<br>Each token gives <strong>+10%</strong> to all income permanently!</p>' +
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:12px;">' +
          '<div style="font-size:12px;color:var(--dim);margin-bottom:4px;">CURRENT TOKENS</div>' +
          '<div style="font-size:24px;font-weight:900;color:var(--purple);">' + Game.state.tokens + '</div>' +
        '</div>' +
        (canPrestige ?
          '<div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:10px;padding:12px;margin-bottom:12px;">' +
            '<div style="font-size:12px;color:var(--dim);margin-bottom:4px;">AFTER PRESTIGE</div>' +
            '<div style="font-size:24px;font-weight:900;color:var(--purple);">' + newTokens + ' <span style="font-size:14px;color:var(--green);">(+' + tokenGain + ')</span></div>' +
            '<div style="font-size:11px;color:var(--dim);margin-top:4px;">From ' + Game.formatNumber(Game.state.lifetimeSats) + ' lifetime sats (1 token per 100K)</div>' +
          '</div>' :
          '<div style="background:rgba(255,68,102,0.1);border:1px solid rgba(255,68,102,0.3);border-radius:10px;padding:12px;margin-bottom:12px;">' +
            '<div style="font-size:12px;color:var(--red);">Need ' + Game.formatNumber(((Game.state.tokens + 1) * 100000) - Game.state.lifetimeSats) + ' more lifetime sats to earn next token</div>' +
            '<div style="font-size:11px;color:var(--dim);margin-top:4px;">Current: ' + Game.formatNumber(Game.state.lifetimeSats) + ' / ' + Game.formatNumber((Game.state.tokens + 1) * 100000) + '</div>' +
          '</div>') +
        '<div style="display:flex;gap:10px;">' +
          '<button class="modal-btn" id="resetCancel" style="background:var(--card);color:var(--text);border:1px solid var(--border);">Cancel</button>' +
          '<button class="modal-btn" id="resetConfirm" style="background:var(--purple);color:white;' + (canPrestige ? '' : 'opacity:0.3;cursor:not-allowed;') + '"' + (canPrestige ? '' : ' disabled') + '>\u{1FA99} Prestige' + (canPrestige ? ' (+' + tokenGain + ')' : '') + '</button>' +
        '</div></div>';
      document.getElementById('resetCancel').addEventListener('click', function() { modal.classList.remove('active'); modal.innerHTML = ''; });
      document.getElementById('resetConfirm').addEventListener('click', function() {
        if (!Game.canPrestige()) return;
        Game.running = false;
        var tokens = Game.prestige();
        Game.save();
        modal.classList.remove('active'); modal.innerHTML = '';
        UI.hidePanel();
        UI.setupHUD();
        UI.showAvatarCreation();
        UI.toast('\u{1FA99} Prestiged! ' + tokens + ' tokens (+' + (tokens * 10) + '% income)');
      });
    },

    // ── Action ──
    handleAction: function() {
      if (this.panelOpen) { this.hidePanel(); return; }
      var b = Town.nearbyBuilding;
      if (b) this.showPanel(b);
    },

    // ── Panel System ──
    showPanel: function(building) {
      var panel = document.getElementById('panel');
      panel.style.display = 'block';
      this.panelOpen = true;
      this.currentPanel = building.panelType;
      this.currentBuilding = building;
      this._hwDirty = true;

      var header = '<div class="panel-header">' +
        '<div class="panel-title">' + building.emoji + ' ' + building.name + '</div>' +
        '<button class="panel-close" id="panelCloseBtn">\u2715</button></div>';

      var body = this.buildPanel(building.panelType);
      panel.innerHTML = header + body;
      document.getElementById('panelCloseBtn').onclick = function() { UI.hidePanel(); };
      this.wirePanel(building.panelType);
    },

    hidePanel: function() {
      document.getElementById('panel').style.display = 'none';
      this.panelOpen = false;
      this.currentPanel = null;
      this.currentBuilding = null;
    },

    updateOpenPanel: function() {
      if (!this.panelOpen || !this.currentPanel) return;
      // Only live-update panels that need it
      if (this.currentPanel === 'mine') this.updateMinePanel();
      else if (this.currentPanel === 'exchange') this.updateExchangePanel();
      // Hardware only refreshes on buy (via _hwDirty flag)
    },

    // ── Panel Builder Dispatcher ──
    buildPanel: function(type) {
      switch(type) {
        case 'mine': return this.buildMinePanel();
        case 'hardware': return this.buildHardwarePanel();
        case 'exchange': return this.buildExchangePanel();
        case 'diner': return this.buildDinerPanel();
        case 'coffee': return this.buildCoffeePanel();
        case 'real_estate': return this.buildRealEstatePanel();
        case 'car_dealer': return this.buildCarDealerPanel();
        case 'pet_shop': return this.buildPetShopPanel();
        case 'bank': return this.buildBankPanel();
        case 'university': return this.buildUniversityPanel();
        case 'post_office': return this.buildPostOfficePanel();
        case 'casino': return this.buildCasinoPanel();
        case 'utility': return this.buildUtilityPanel();
        case 'internet_cafe': return this.buildInternetCafePanel();
        case 'gym': return this.buildGymPanel();
        case 'hospital': return this.buildHospitalPanel();
        case 'pawn_shop': return this.buildPawnShopPanel();
        case 'apartment': return this.buildApartmentPanel();
        default: return '<div class="panel-body"><p style="color:var(--dim);">Nothing here yet.</p></div>';
      }
    },

    wirePanel: function(type) {
      switch(type) {
        case 'mine': this.wireMinePanel(); break;
        case 'hardware': this.wireHardwarePanel(); break;
        case 'exchange': this.wireExchangePanel(); break;
        case 'diner': this.wireDinerPanel(); break;
        case 'coffee': this.wireCoffeePanel(); break;
        case 'real_estate': this.wireRealEstatePanel(); break;
        case 'car_dealer': this.wireCarDealerPanel(); break;
        case 'pet_shop': this.wirePetShopPanel(); break;
        case 'bank': this.wireBankPanel(); break;
        case 'university': this.wireUniversityPanel(); break;
        case 'post_office': this.wirePostOfficePanel(); break;
        case 'casino': this.wireCasinoPanel(); break;
        case 'utility': this.wireUtilityPanel(); break;
        case 'internet_cafe': this.wireInternetCafePanel(); break;
        case 'gym': this.wireGymPanel(); break;
        case 'hospital': this.wireHospitalPanel(); break;
        case 'pawn_shop': this.wirePawnShopPanel(); break;
        case 'apartment': this.wireApartmentPanel(); break;
      }
    },

    // Helper: item card HTML
    itemCard: function(icon, name, sub, cost, locked, dataAttr) {
      return '<div class="hw-card' + (locked ? ' locked' : '') + '" ' + dataAttr + '>' +
        '<div class="hw-icon">' + icon + '</div>' +
        '<div class="hw-info"><div class="hw-name">' + name + '</div><div class="hw-sub">' + sub + '</div></div>' +
        '<div class="hw-cost">' + cost + '</div></div>';
    },

    // ═══════════════════════════════════════
    // MINING HQ
    // ═══════════════════════════════════════
    buildMinePanel: function() {
      return '<div class="panel-body mine-panel">' +
        '<div class="mine-stats">' +
          '<div class="mine-stat"><span class="mine-stat-label">Sats/s</span><span class="mine-stat-val" id="mineRate">0</span></div>' +
          '<div class="mine-stat"><span class="mine-stat-label">Multiplier</span><span class="mine-stat-val" id="mineMult">1.0x</span></div>' +
          '<div class="mine-stat"><span class="mine-stat-label">Heat</span><span class="mine-stat-val" id="mineHeat">0%</span></div>' +
          '<div class="mine-stat"><span class="mine-stat-label">Slots</span><span class="mine-stat-val" id="mineSlots">0/3</span></div>' +
        '</div>' +
        '<div class="mine-btn-area"><div class="mine-btn" id="mineTapBtn">\u20BF</div><div class="mine-tap-hint">Tap to mine</div></div>' +
        '<button class="panel-btn btn-red" id="mineVentBtn">\u2744\uFE0F VENT HEAT (-20%)</button></div>';
    },
    wireMinePanel: function() {
      var btn = document.getElementById('mineTapBtn');
      if (!btn) return;
      var doTap = function(e) {
        if (e) e.preventDefault();
        var gain = Game.tapMine();
        var av = Game.state.avatar;
        if (av) Game.addFloatingText('+' + Game.formatNumber(gain), av.x, av.y - 20, '#f7931a');
        btn.classList.add('tapped');
        setTimeout(function() { btn.classList.remove('tapped'); }, 100);
      };
      btn.addEventListener('click', doTap);
      btn.addEventListener('touchstart', doTap);
      document.getElementById('mineVentBtn').addEventListener('click', function() {
        var c = Game.ventHeat();
        if (c > 0) UI.toast('\u2744\uFE0F Vented ' + Math.floor(c) + '% heat');
      });
    },
    updateMinePanel: function() {
      var el = document.getElementById('mineRate'); if (el) el.textContent = Game.formatNumber(Game.getProductionRate() * Game.getMultiplier());
      el = document.getElementById('mineMult'); if (el) el.textContent = Game.getMultiplier().toFixed(1) + 'x';
      el = document.getElementById('mineHeat'); if (el) { var h = Math.floor(Game.state.heat); el.textContent = h + '%'; el.style.color = h > 90 ? 'var(--red)' : h > 60 ? '#ff8800' : 'var(--green)'; }
      el = document.getElementById('mineSlots'); if (el) el.textContent = Game.getUsedSlots() + '/' + Game.getMaxSlots();
    },

    // ═══════════════════════════════════════
    // HARDWARE SHOP (event delegation fix)
    // ═══════════════════════════════════════
    buildHardwarePanel: function() {
      var s = Game.state;
      var html = '<div class="panel-body">';
      html += '<div class="hw-slots">Rig Slots: ' + Game.getUsedSlots() + ' / ' + Game.getMaxSlots() + '</div>';
      html += '<div class="multi-bar">';
      [1, 5, 10, -1].forEach(function(v) {
        html += '<div class="multi-btn' + (s.buyMulti === v ? ' active' : '') + '" data-multi="' + v + '">' + (v === -1 ? 'MAX' : 'x' + v) + '</div>';
      });
      html += '</div><div id="hwCards">' + this.renderHardwareCards() + '</div></div>';
      return html;
    },
    renderHardwareCards: function() {
      var html = '';
      Game.HARDWARE.forEach(function(u) {
        var n = Game.getBuyCount(u);
        var cost = Game.getBulkCost(u, n);
        var owned = Game.state.owned[u.id] || 0;
        var canAfford = Game.state.sats >= cost;
        var slotsOk = Game.getUsedSlots() + (u.slots * n) <= Game.getMaxSlots();
        html += '<div class="hw-card' + ((!canAfford || !slotsOk) ? ' locked' : '') + '" data-id="' + u.id + '">' +
          '<div class="hw-icon">' + u.icon + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + u.name + ' <span class="hw-owned">[' + owned + ']</span></div>' +
          '<div class="hw-sub">+' + u.rate + '/s | +' + u.heat + ' heat | ' + u.slots + ' slot' + (u.slots > 1 ? 's' : '') + '</div></div>' +
          '<div class="hw-cost">' + Game.formatNumber(cost) + ' sats<div class="hw-qty">x' + n + '</div></div></div>';
      });
      return html;
    },
    wireHardwarePanel: function() {
      var panel = document.getElementById('panel');
      // Multi buttons
      panel.querySelectorAll('.multi-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          Game.state.buyMulti = parseInt(btn.dataset.multi);
          panel.querySelectorAll('.multi-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          document.getElementById('hwCards').innerHTML = UI.renderHardwareCards();
          UI.wireHwCards();
        });
      });
      this.wireHwCards();
    },
    wireHwCards: function() {
      // Use event delegation on container
      var container = document.getElementById('hwCards');
      if (!container) return;
      container.onclick = function(e) {
        var card = e.target.closest('.hw-card');
        if (!card) return;
        var id = card.dataset.id;
        var item = Game.HARDWARE.find(function(u) { return u.id === id; });
        if (!item) return;
        var n = Game.getBuyCount(item);
        if (Game.buyItem(item, n)) {
          UI.toast('Bought ' + n + 'x ' + item.name);
          container.innerHTML = UI.renderHardwareCards();
          // Update slots display
          var sd = container.parentElement.querySelector('.hw-slots');
          if (sd) sd.textContent = 'Rig Slots: ' + Game.getUsedSlots() + ' / ' + Game.getMaxSlots();
        }
      };
    },

    // ═══════════════════════════════════════
    // EXCHANGE
    // ═══════════════════════════════════════
    buildExchangePanel: function() {
      var s = Game.state, ep = Game.getEffectivePrice(), sv = (s.sats / 1e8) * ep;
      return '<div class="panel-body">' +
        '<div class="exchange-price"><div class="ex-label">BTC Price</div><div class="ex-val" id="exPriceVal">$' + Game.formatNumber(ep) + '</div>' +
        (s.priceEvent ? '<div class="ex-event ' + (s.priceEvent.type === 'bull' ? 'ex-bull' : 'ex-crash') + '">' + (s.priceEvent.type === 'bull' ? '\u{1F4C8} +' : '\u{1F4C9} -') + s.priceEvent.magnitude + '%</div>' : '') + '</div>' +
        '<div class="exchange-stats">' +
          '<div class="ex-stat"><span class="ex-stat-label">Your Sats</span><span id="exSats">' + Game.formatNumber(s.sats) + '</span></div>' +
          '<div class="ex-stat"><span class="ex-stat-label">Value</span><span id="exValue">$' + Game.formatNumber(sv) + '</span></div>' +
          '<div class="ex-stat"><span class="ex-stat-label">USD</span><span id="exUsd">$' + Game.formatNumber(s.usd) + '</span></div></div>' +
        '<div class="exchange-btns">' +
          '<button class="panel-btn btn-green" id="exSell25">Sell 25%</button>' +
          '<button class="panel-btn btn-green" id="exSell50">Sell 50%</button>' +
          '<button class="panel-btn btn-gold" id="exSellAll">Sell All</button></div>' +
        '<div class="exchange-lifetime"><span class="ex-stat-label">Lifetime Sats</span> <span id="exLifetime">' + Game.formatNumber(s.lifetimeSats) + '</span></div></div>';
    },
    wireExchangePanel: function() {
      var sell = function(f) { var u = Game.sellSats(f); if (u > 0) UI.toast('Sold for $' + Game.formatNumber(u)); };
      var e; e = document.getElementById('exSell25'); if (e) e.onclick = function() { sell(0.25); };
      e = document.getElementById('exSell50'); if (e) e.onclick = function() { sell(0.50); };
      e = document.getElementById('exSellAll'); if (e) e.onclick = function() { sell(1.0); };
    },
    updateExchangePanel: function() {
      var s = Game.state, ep = Game.getEffectivePrice();
      var el = document.getElementById('exPriceVal'); if (el) el.textContent = '$' + Game.formatNumber(ep);
      el = document.getElementById('exSats'); if (el) el.textContent = Game.formatNumber(s.sats);
      el = document.getElementById('exValue'); if (el) el.textContent = '$' + Game.formatNumber((s.sats / 1e8) * ep);
      el = document.getElementById('exUsd'); if (el) el.textContent = '$' + Game.formatNumber(s.usd);
      el = document.getElementById('exLifetime'); if (el) el.textContent = Game.formatNumber(s.lifetimeSats);
    },

    // ═══════════════════════════════════════
    // DINER (energy)
    // ═══════════════════════════════════════
    buildDinerPanel: function() {
      var s = Game.state;
      return '<div class="panel-body">' +
        '<p style="margin-bottom:12px;">Energy: ' + Math.floor(s.energy) + ' / ' + Game.getEnergyMax() + '</p>' +
        '<p style="color:var(--dim);font-size:12px;margin-bottom:12px;">Low energy reduces production. Eat to restore!</p>' +
        this.itemCard('\u{1F354}', 'Burger', '+30 energy', '$5', s.usd < 5, 'data-food="burger"') +
        this.itemCard('\u{1F355}', 'Pizza', '+50 energy', '$12', s.usd < 12, 'data-food="pizza"') +
        this.itemCard('\u{1F957}', 'Full Meal', '+80 energy', '$25', s.usd < 25, 'data-food="meal"') +
        '</div>';
    },
    wireDinerPanel: function() {
      var foods = { burger: { energy: 30, cost: 5 }, pizza: { energy: 50, cost: 12 }, meal: { energy: 80, cost: 25 } };
      document.querySelectorAll('[data-food]').forEach(function(el) {
        el.addEventListener('click', function() {
          var f = foods[el.dataset.food];
          if (!f || Game.state.usd < f.cost) return;
          Game.state.usd -= f.cost;
          Game.state.energy = Math.min(Game.getEnergyMax(), Game.state.energy + f.energy);
          UI.toast('+' + f.energy + ' energy!');
          UI.showPanel(UI.currentBuilding);
        });
      });
    },

    // ═══════════════════════════════════════
    // COFFEE SHOP (energy + temp boost)
    // ═══════════════════════════════════════
    buildCoffeePanel: function() {
      var s = Game.state;
      return '<div class="panel-body">' +
        '<p style="margin-bottom:12px;">Energy: ' + Math.floor(s.energy) + ' / ' + Game.getEnergyMax() + '</p>' +
        this.itemCard('\u2615', 'Coffee', '+15 energy', '$3', s.usd < 3, 'data-drink="coffee"') +
        this.itemCard('\u{1F375}', 'Green Tea', '+10 energy, -5% heat', '$5', s.usd < 5, 'data-drink="tea"') +
        this.itemCard('\u{1F964}', 'Energy Drink', '+40 energy', '$8', s.usd < 8, 'data-drink="energy"') +
        '</div>';
    },
    wireCoffeePanel: function() {
      var drinks = { coffee: { energy: 15, cost: 3 }, tea: { energy: 10, cost: 5, heatReduce: 5 }, energy: { energy: 40, cost: 8 } };
      document.querySelectorAll('[data-drink]').forEach(function(el) {
        el.addEventListener('click', function() {
          var d = drinks[el.dataset.drink];
          if (!d || Game.state.usd < d.cost) return;
          Game.state.usd -= d.cost;
          Game.state.energy = Math.min(Game.getEnergyMax(), Game.state.energy + d.energy);
          if (d.heatReduce) Game.state.heat = Math.max(0, Game.state.heat - d.heatReduce);
          UI.toast('+' + d.energy + ' energy!');
          UI.showPanel(UI.currentBuilding);
        });
      });
    },

    // ═══════════════════════════════════════
    // REAL ESTATE
    // ═══════════════════════════════════════
    buildRealEstatePanel: function() {
      var s = Game.state, html = '<div class="panel-body">';
      html += '<p style="margin-bottom:12px;">Current: <strong>' + (Game.HOUSING.find(function(h){return h.id===s.housing;}) || {}).name + '</strong> (' + Game.getMaxSlots() + ' slots)</p>';
      Game.HOUSING.forEach(function(h) {
        var owned = s.housing === h.id;
        var canUpgrade = !owned && Game.HOUSING.indexOf(h) > Game.HOUSING.findIndex(function(x){return x.id===s.housing;});
        html += '<div class="hw-card' + (owned ? '' : (!canUpgrade || s.usd < h.cost ? ' locked' : '')) + '" data-house="' + h.id + '">' +
          '<div class="hw-icon">' + (owned ? '\u2705' : '\u{1F3E0}') + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + h.name + '</div><div class="hw-sub">' + h.slots + ' rig slots' + (h.id === 'solar' ? ' + free electricity' : '') + '</div></div>' +
          '<div class="hw-cost">' + (owned ? 'Current' : (h.cost === 0 ? 'Free' : '$' + Game.formatNumber(h.cost))) + '</div></div>';
      });
      return html + '</div>';
    },
    wireRealEstatePanel: function() {
      document.querySelectorAll('[data-house]').forEach(function(el) {
        el.addEventListener('click', function() {
          var id = el.dataset.house;
          var h = Game.HOUSING.find(function(x) { return x.id === id; });
          if (!h || Game.state.housing === id || Game.state.usd < h.cost) return;
          var curIdx = Game.HOUSING.findIndex(function(x){return x.id===Game.state.housing;});
          var newIdx = Game.HOUSING.indexOf(h);
          if (newIdx <= curIdx) return;
          Game.state.usd -= h.cost;
          Game.state.housing = id;
          UI.toast('Moved to ' + h.name + '!');
          UI.showPanel(UI.currentBuilding);
        });
      });
    },

    // ═══════════════════════════════════════
    // CAR DEALERSHIP
    // ═══════════════════════════════════════
    buildCarDealerPanel: function() {
      var s = Game.state, html = '<div class="panel-body">';
      var cur = s.vehicle ? Game.VEHICLES.find(function(v){return v.id===s.vehicle;}) : null;
      var tradeIn = cur ? Math.floor(cur.cost * 0.5) : 0;
      html += '<p style="margin-bottom:12px;">Current: <strong>' + (cur ? cur.icon + ' ' + cur.name : 'Walking') + '</strong> (' + (cur ? cur.speed + 'x' : '1x') + ' speed)' + (tradeIn > 0 ? ' <span style="color:var(--green);font-size:12px;">Trade-in: $' + Game.formatNumber(tradeIn) + '</span>' : '') + '</p>';
      Game.VEHICLES.forEach(function(v) {
        var owned = s.vehicle === v.id;
        var effectiveCost = tradeIn > 0 ? Math.max(0, v.cost - tradeIn) : v.cost;
        html += '<div class="hw-card' + (owned ? '' : (s.usd < effectiveCost ? ' locked' : '')) + '" data-vehicle="' + v.id + '">' +
          '<div class="hw-icon">' + v.icon + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + v.name + '</div><div class="hw-sub">' + v.speed + 'x speed</div></div>' +
          '<div class="hw-cost">' + (owned ? '\u2705 Owned' : '$' + Game.formatNumber(v.cost) + (tradeIn > 0 ? '<div style="color:var(--green);font-size:10px;">net $' + Game.formatNumber(effectiveCost) + '</div>' : '')) + '</div></div>';
      });
      return html + '</div>';
    },
    wireCarDealerPanel: function() {
      document.querySelectorAll('[data-vehicle]').forEach(function(el) {
        el.addEventListener('click', function() {
          var v = Game.VEHICLES.find(function(x){return x.id===el.dataset.vehicle;});
          if (!v || Game.state.vehicle === v.id) return;
          // Refund 50% of old vehicle
          var refund = 0;
          if (Game.state.vehicle) {
            var old = Game.VEHICLES.find(function(x){return x.id===Game.state.vehicle;});
            if (old) refund = Math.floor(old.cost * 0.5);
          }
          if (Game.state.usd + refund < v.cost) return;
          Game.state.usd += refund - v.cost;
          Game.state.vehicle = v.id;
          UI.toast('Bought ' + v.name + '!' + (refund > 0 ? ' (trade-in: $' + Game.formatNumber(refund) + ')' : ''));
          UI.showPanel(UI.currentBuilding);
        });
      });
    },

    // ═══════════════════════════════════════
    // PET SHOP
    // ═══════════════════════════════════════
    buildPetShopPanel: function() {
      var s = Game.state, html = '<div class="panel-body">';
      var cur = s.pet ? Game.PETS.find(function(p){return p.id===s.pet;}) : null;
      html += '<p style="margin-bottom:12px;">Pet: <strong>' + (cur ? cur.icon + ' ' + cur.name : 'None') + '</strong>' + (cur ? ' - ' + cur.desc : '') + '</p>';
      Game.PETS.forEach(function(p) {
        if (p.darkWeb) return; // Snake only at dark web
        var owned = s.pet === p.id;
        html += '<div class="hw-card' + (owned ? '' : (s.usd < p.cost ? ' locked' : '')) + '" data-pet="' + p.id + '">' +
          '<div class="hw-icon">' + p.icon + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + p.name + '</div><div class="hw-sub">' + p.desc + '</div></div>' +
          '<div class="hw-cost">' + (owned ? '\u2705 Owned' : '$' + Game.formatNumber(p.cost)) + '</div></div>';
      });
      return html + '</div>';
    },
    wirePetShopPanel: function() {
      document.querySelectorAll('[data-pet]').forEach(function(el) {
        el.addEventListener('click', function() {
          var p = Game.PETS.find(function(x){return x.id===el.dataset.pet;});
          if (!p || Game.state.pet === p.id) return;
          // Refund 50% of old pet
          var refund = 0;
          if (Game.state.pet) {
            var old = Game.PETS.find(function(x){return x.id===Game.state.pet;});
            if (old) refund = Math.floor(old.cost * 0.5);
          }
          if (Game.state.usd + refund < p.cost) return;
          Game.state.usd += refund - p.cost;
          Game.state.pet = p.id;
          UI.toast('Adopted ' + p.name + '!' + (refund > 0 ? ' (rehomed old pet: $' + Game.formatNumber(refund) + ')' : ''));
          UI.showPanel(UI.currentBuilding);
        });
      });
    },

    // ═══════════════════════════════════════
    // BANK
    // ═══════════════════════════════════════
    buildBankPanel: function() {
      var s = Game.state, html = '<div class="panel-body">';
      if (s.loans.length > 0) {
        var loan = s.loans[0];
        html += '<div class="ex-stat" style="margin-bottom:12px;"><span class="ex-stat-label">Active Loan</span><span>Owed: $' + Game.formatNumber(loan.owed) + '</span></div>';
        html += '<button class="panel-btn btn-green" id="repayBtn"' + (s.usd < loan.owed ? ' disabled style="opacity:0.4"' : '') + '>Repay $' + Game.formatNumber(loan.owed) + '</button>';
      } else {
        html += '<p style="color:var(--dim);font-size:12px;margin-bottom:12px;">Take a loan. Interest compounds over time. Default at 5x = lose 50% sats!</p>';
        Game.LOANS.forEach(function(l) {
          html += '<div class="hw-card" data-loan="' + l.id + '">' +
            '<div class="hw-icon">\u{1F4B5}</div>' +
            '<div class="hw-info"><div class="hw-name">' + l.name + '</div><div class="hw-sub">$' + Game.formatNumber(l.amount) + ' at ' + (l.rate * 100) + '% interest</div></div>' +
            '<div class="hw-cost">Borrow</div></div>';
        });
      }
      return html + '</div>';
    },
    wireBankPanel: function() {
      var el = document.getElementById('repayBtn');
      if (el) el.addEventListener('click', function() { if (Game.repayLoan()) { UI.toast('Loan repaid!'); UI.showPanel(UI.currentBuilding); } });
      document.querySelectorAll('[data-loan]').forEach(function(el) {
        el.addEventListener('click', function() {
          if (Game.takeLoan(el.dataset.loan)) { UI.toast('Loan received!'); UI.showPanel(UI.currentBuilding); }
        });
      });
    },

    // ═══════════════════════════════════════
    // UNIVERSITY
    // ═══════════════════════════════════════
    buildUniversityPanel: function() {
      var s = Game.state, html = '<div class="panel-body">';
      html += '<p style="color:var(--dim);font-size:12px;margin-bottom:12px;">One-time research upgrades. Permanent benefits!</p>';
      Game.RESEARCH.forEach(function(r) {
        var done = s.research[r.id];
        var bal = r.cur === 'sats' ? s.sats : s.usd;
        var costStr = (r.cur === 'sats' ? '' : '$') + Game.formatNumber(r.cost) + (r.cur === 'sats' ? ' sats' : '');
        html += '<div class="hw-card' + (done ? '' : (bal < r.cost ? ' locked' : '')) + '" data-research="' + r.id + '">' +
          '<div class="hw-icon">' + (done ? '\u2705' : '\u{1F4DA}') + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + r.name + '</div><div class="hw-sub">' + r.desc + '</div></div>' +
          '<div class="hw-cost">' + (done ? 'Done' : costStr) + '</div></div>';
      });
      return html + '</div>';
    },
    wireUniversityPanel: function() {
      document.querySelectorAll('[data-research]').forEach(function(el) {
        el.addEventListener('click', function() {
          var r = Game.RESEARCH.find(function(x){return x.id===el.dataset.research;});
          if (!r || Game.state.research[r.id]) return;
          var bal = r.cur === 'sats' ? Game.state.sats : Game.state.usd;
          if (bal < r.cost) return;
          if (r.cur === 'sats') Game.state.sats -= r.cost; else Game.state.usd -= r.cost;
          Game.state.research[r.id] = true;
          UI.toast('Researched ' + r.name + '!');
          UI.showPanel(UI.currentBuilding);
        });
      });
    },

    // ═══════════════════════════════════════
    // POST OFFICE
    // ═══════════════════════════════════════
    buildPostOfficePanel: function() {
      var s = Game.state, html = '<div class="panel-body">';
      html += '<p style="color:var(--dim);font-size:12px;margin-bottom:12px;">Order hardware at 30% off! Delivery in 2 minutes.</p>';
      if (s.mailOrders.length > 0) {
        html += '<div style="margin-bottom:12px;">';
        s.mailOrders.forEach(function(o) {
          var timeLeft = Math.max(0, Math.ceil((o.arrivesAt - Date.now()) / 1000));
          html += '<div class="hw-card"><div class="hw-icon">\u{1F4E6}</div><div class="hw-info"><div class="hw-name">' + o.name + '</div><div class="hw-sub">Arriving in ' + timeLeft + 's</div></div></div>';
        });
        html += '</div>';
      }
      Game.HARDWARE.forEach(function(u) {
        var cost = Math.floor(Game.getBulkCost(u, 1) * 0.7);
        html += '<div class="hw-card' + (Game.state.sats < cost ? ' locked' : '') + '" data-order="' + u.id + '">' +
          '<div class="hw-icon">' + u.icon + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + u.name + '</div><div class="hw-sub">30% off! 2 min delivery</div></div>' +
          '<div class="hw-cost">' + Game.formatNumber(cost) + ' sats</div></div>';
      });
      return html + '</div>';
    },
    wirePostOfficePanel: function() {
      document.querySelectorAll('[data-order]').forEach(function(el) {
        el.addEventListener('click', function() {
          var item = Game.HARDWARE.find(function(u){return u.id===el.dataset.order;});
          if (!item) return;
          if (Game.orderItem(item)) { UI.toast('\u{1F4E6} ' + item.name + ' ordered!'); UI.showPanel(UI.currentBuilding); }
        });
      });
    },

    // ═══════════════════════════════════════
    // CASINO
    // ═══════════════════════════════════════
    buildCasinoPanel: function() {
      var s = Game.state;
      return '<div class="panel-body">' +
        '<p style="margin-bottom:8px;">Sats: <strong>' + Game.formatNumber(s.sats) + '</strong></p>' +
        '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
          '<input type="number" class="modal-input" id="casinoBet" placeholder="Bet amount" min="1" style="margin:0;">' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
          '<button class="panel-btn btn-gold" id="casinoFlip">\u{1FA99} Coin Flip (2x)</button>' +
          '<button class="panel-btn btn-purple" id="casinoSlots">\u{1F3B0} Slots (up to 10x)</button>' +
        '</div>' +
        '<div id="casinoResult" style="text-align:center;margin-top:12px;font-weight:800;min-height:20px;"></div></div>';
    },
    wireCasinoPanel: function() {
      document.getElementById('casinoFlip').addEventListener('click', function() {
        var bet = parseInt(document.getElementById('casinoBet').value) || 0;
        var result = Game.coinFlip(bet);
        var el = document.getElementById('casinoResult');
        if (result === null) { el.textContent = 'Invalid bet!'; el.style.color = 'var(--dim)'; }
        else if (result > 0) { el.textContent = '\u{1F389} Won ' + Game.formatNumber(result * 2) + ' sats!'; el.style.color = 'var(--green)'; }
        else { el.textContent = '\u{1F4A8} Lost ' + Game.formatNumber(-result) + ' sats!'; el.style.color = 'var(--red)'; }
      });
      document.getElementById('casinoSlots').addEventListener('click', function() {
        var bet = parseInt(document.getElementById('casinoBet').value) || 0;
        var result = Game.slotMachine(bet);
        var el = document.getElementById('casinoResult');
        if (result === null) { el.textContent = 'Invalid bet!'; el.style.color = 'var(--dim)'; }
        else if (result.mult >= 10) { el.textContent = '\u{1F3B0} JACKPOT! ' + Game.formatNumber(result.win + bet) + ' sats!'; el.style.color = 'var(--gold)'; }
        else if (result.mult > 0) { el.textContent = '\u2728 Won ' + Game.formatNumber(result.win + bet) + ' sats! (' + result.mult + 'x)'; el.style.color = 'var(--green)'; }
        else { el.textContent = '\u{1F4A8} Lost ' + Game.formatNumber(bet) + ' sats!'; el.style.color = 'var(--red)'; }
      });
    },

    // ═══════════════════════════════════════
    // UTILITY COMPANY
    // ═══════════════════════════════════════
    buildUtilityPanel: function() {
      var s = Game.state, elecCost = Game.getElectricityCost();
      return '<div class="panel-body">' +
        '<div class="ex-stat" style="margin-bottom:8px;"><span class="ex-stat-label">Electricity Rate</span><span>$' + elecCost.toFixed(3) + '/s</span></div>' +
        '<div class="ex-stat" style="margin-bottom:8px;"><span class="ex-stat-label">Pending Bill</span><span>$' + Game.formatNumber(s.electricityBill) + '</span></div>' +
        '<div class="ex-stat" style="margin-bottom:12px;"><span class="ex-stat-label">Solar Panels</span><span>' + s.electricitySolar + '</span></div>' +
        (s.housing === 'solar' ? '<p style="color:var(--green);text-align:center;font-weight:800;">Solar Farm = FREE electricity!</p>' :
          '<div class="hw-card' + (s.usd < 500 ? ' locked' : '') + '" id="buySolar">' +
            '<div class="hw-icon">\u2600\uFE0F</div>' +
            '<div class="hw-info"><div class="hw-name">Solar Panel</div><div class="hw-sub">Reduces bill by $0.10/s each</div></div>' +
            '<div class="hw-cost">$500</div></div>') +
        '</div>';
    },
    wireUtilityPanel: function() {
      var el = document.getElementById('buySolar');
      if (el) el.addEventListener('click', function() {
        if (Game.state.usd < 500) return;
        Game.state.usd -= 500;
        Game.state.electricitySolar++;
        UI.toast('Solar panel installed!');
        UI.showPanel(UI.currentBuilding);
      });
    },

    // ═══════════════════════════════════════
    // INTERNET CAFE (dark web)
    // ═══════════════════════════════════════
    buildInternetCafePanel: function() {
      var s = Game.state, html = '<div class="panel-body">';
      html += '<div class="ex-stat" style="margin-bottom:12px;"><span class="ex-stat-label">\u{1F6A8} Police Risk</span><span>' + Math.floor(s.policeRisk) + '%</span></div>';
      html += '<p style="color:var(--dim);font-size:12px;margin-bottom:12px;">Dark web items. Buying increases police risk. High risk = random sats seizure!</p>';
      Game.DARK_WEB.forEach(function(u) {
        var n = Game.getBuyCount(u);
        var cost = Game.getBulkCost(u, n);
        var owned = s.owned[u.id] || 0;
        html += '<div class="hw-card' + (s.usd < cost ? ' locked' : '') + '" data-dark="' + u.id + '">' +
          '<div class="hw-icon">' + u.icon + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + u.name + ' [' + owned + ']</div><div class="hw-sub">' + u.desc + '</div></div>' +
          '<div class="hw-cost">$' + Game.formatNumber(cost) + '</div></div>';
      });
      // Snake pet
      var snake = Game.PETS.find(function(p){return p.id==='snake';});
      if (snake && s.pet !== 'snake') {
        html += '<div class="hw-card' + (s.usd < snake.cost ? ' locked' : '') + '" data-dark-pet="snake">' +
          '<div class="hw-icon">' + snake.icon + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + snake.name + '</div><div class="hw-sub">' + snake.desc + '</div></div>' +
          '<div class="hw-cost">$' + Game.formatNumber(snake.cost) + '</div></div>';
      }
      return html + '</div>';
    },
    wireInternetCafePanel: function() {
      document.querySelectorAll('[data-dark]').forEach(function(el) {
        el.addEventListener('click', function() {
          var item = Game.DARK_WEB.find(function(u){return u.id===el.dataset.dark;});
          if (!item) return;
          var n = Game.getBuyCount(item);
          var cost = Game.getBulkCost(item, n);
          if (Game.state.usd < cost) return;
          Game.state.usd -= cost;
          Game.state.owned[item.id] = (Game.state.owned[item.id] || 0) + n;
          Game.state.policeRisk = Math.min(100, Game.state.policeRisk + 5);
          UI.toast('Bought ' + n + 'x ' + item.name);
          UI.showPanel(UI.currentBuilding);
        });
      });
      var sp = document.querySelector('[data-dark-pet]');
      if (sp) sp.addEventListener('click', function() {
        var snake = Game.PETS.find(function(p){return p.id==='snake';});
        if (!snake || Game.state.usd < snake.cost) return;
        Game.state.usd -= snake.cost;
        Game.state.pet = 'snake';
        Game.state.policeRisk = Math.min(100, Game.state.policeRisk + 15);
        UI.toast('\u{1F40D} Snake acquired... be careful!');
        UI.showPanel(UI.currentBuilding);
      });
    },

    // ═══════════════════════════════════════
    // GYM
    // ═══════════════════════════════════════
    buildGymPanel: function() {
      var s = Game.state, cost = (s.gymLevel + 1) * 50;
      return '<div class="panel-body">' +
        '<div class="ex-stat" style="margin-bottom:8px;"><span class="ex-stat-label">Gym Level</span><span>' + s.gymLevel + '</span></div>' +
        '<div class="ex-stat" style="margin-bottom:8px;"><span class="ex-stat-label">Max Energy</span><span>' + Game.getEnergyMax() + '</span></div>' +
        '<div class="ex-stat" style="margin-bottom:12px;"><span class="ex-stat-label">Energy Regen</span><span>' + Game.getEnergyRegen().toFixed(1) + '/s</span></div>' +
        '<button class="panel-btn btn-gold" id="gymTrain"' + (s.usd < cost ? ' disabled style="opacity:0.4"' : '') + '>\u{1F4AA} Train ($' + cost + ') - +20 max energy, +0.2 regen</button></div>';
    },
    wireGymPanel: function() {
      var el = document.getElementById('gymTrain');
      if (el) el.addEventListener('click', function() {
        var cost = (Game.state.gymLevel + 1) * 50;
        if (Game.state.usd < cost) return;
        Game.state.usd -= cost;
        Game.state.gymLevel++;
        UI.toast('Gym level ' + Game.state.gymLevel + '!');
        UI.showPanel(UI.currentBuilding);
      });
    },

    // ═══════════════════════════════════════
    // HOSPITAL
    // ═══════════════════════════════════════
    buildHospitalPanel: function() {
      var s = Game.state;
      return '<div class="panel-body">' +
        '<div class="ex-stat" style="margin-bottom:12px;"><span class="ex-stat-label">Energy</span><span>' + Math.floor(s.energy) + ' / ' + Game.getEnergyMax() + '</span></div>' +
        '<button class="panel-btn btn-green" id="hospHeal"' + (s.usd < 100 ? ' disabled style="opacity:0.4"' : '') + '>\u{1F3E5} Full Restore ($100) - Max energy + clear heat</button></div>';
    },
    wireHospitalPanel: function() {
      var el = document.getElementById('hospHeal');
      if (el) el.addEventListener('click', function() {
        if (Game.state.usd < 100) return;
        Game.state.usd -= 100;
        Game.state.energy = Game.getEnergyMax();
        Game.state.heat = 0;
        UI.toast('Fully restored!');
        UI.showPanel(UI.currentBuilding);
      });
    },

    // ═══════════════════════════════════════
    // PAWN SHOP
    // ═══════════════════════════════════════
    buildPawnShopPanel: function() {
      var s = Game.state, html = '<div class="panel-body">';
      html += '<p style="color:var(--dim);font-size:12px;margin-bottom:12px;">Sell hardware for 40% of base cost in USD.</p>';
      var hasStuff = false;
      Game.HARDWARE.forEach(function(u) {
        var owned = s.owned[u.id] || 0;
        if (owned === 0) return;
        hasStuff = true;
        var sellPrice = Math.floor(u.base * 0.4);
        html += '<div class="hw-card" data-pawn="' + u.id + '">' +
          '<div class="hw-icon">' + u.icon + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + u.name + ' [' + owned + ']</div><div class="hw-sub">Sell 1 for $' + Game.formatNumber(sellPrice) + '</div></div>' +
          '<div class="hw-cost" style="color:var(--green);">Sell</div></div>';
      });
      if (!hasStuff) html += '<p style="color:var(--dim);text-align:center;">Nothing to sell.</p>';
      return html + '</div>';
    },
    wirePawnShopPanel: function() {
      document.querySelectorAll('[data-pawn]').forEach(function(el) {
        el.addEventListener('click', function() {
          var item = Game.HARDWARE.find(function(u){return u.id===el.dataset.pawn;});
          if (!item || (Game.state.owned[item.id] || 0) <= 0) return;
          Game.state.owned[item.id]--;
          Game.state.usd += Math.floor(item.base * 0.4);
          UI.toast('Sold ' + item.name);
          UI.showPanel(UI.currentBuilding);
        });
      });
    },

    // ═══════════════════════════════════════
    // STUDIO APARTMENT (home)
    // ═══════════════════════════════════════
    buildApartmentPanel: function() {
      var s = Game.state;
      var h = Game.HOUSING.find(function(x){return x.id===s.housing;});
      return '<div class="panel-body">' +
        '<p style="margin-bottom:8px;font-weight:800;">' + (h ? h.name : 'Studio') + '</p>' +
        '<div class="ex-stat" style="margin-bottom:8px;"><span class="ex-stat-label">Rig Slots</span><span>' + Game.getUsedSlots() + ' / ' + Game.getMaxSlots() + '</span></div>' +
        '<div class="ex-stat" style="margin-bottom:8px;"><span class="ex-stat-label">Vehicle</span><span>' + (s.vehicle ? (Game.VEHICLES.find(function(v){return v.id===s.vehicle;}) || {}).name || 'Unknown' : 'None') + '</span></div>' +
        '<div class="ex-stat" style="margin-bottom:8px;"><span class="ex-stat-label">Pet</span><span>' + (s.pet ? (Game.PETS.find(function(p){return p.id===s.pet;}) || {}).name || 'Unknown' : 'None') + '</span></div>' +
        '<div class="ex-stat" style="margin-bottom:8px;"><span class="ex-stat-label">Research</span><span>' + Object.keys(s.research).length + '/' + Game.RESEARCH.length + '</span></div>' +
        '</div>';
    },
    wireApartmentPanel: function() {},

    // ═══════════════════════════════════════
    // Random Name / Avatar Creation
    // ═══════════════════════════════════════
    randomName: function() {
      var pre = ['Satoshi','Nakamoto','Crypto','Hash','Block','Node','Byte','Pixel','Cipher','Volt','Neon','Zero','Bit','Hex','Omega','Shadow','Ghost','Rune','Flux','Glitch','Nova','Axiom'];
      var suf = ['Miner','Runner','Wolf','Fox','Hawk','Jack','Max','X','Dev','Pro','Kid','Boss','Ace','Rex','Zen','One','Prime','Ray','Dash','Core'];
      return (pre[Math.floor(Math.random()*pre.length)] + suf[Math.floor(Math.random()*suf.length)]).substring(0,12);
    },

    showAvatarCreation: function() {
      var modal = document.getElementById('modal');
      modal.classList.add('active');
      var selectedSprite = null, selectedBonus = null;
      var sprites = [
        {emoji:'\u{1F9D1}\u200D\u{1F4BB}',label:'Hacker'},{emoji:'\u{1F477}',label:'Miner'},
        {emoji:'\u{1F575}\uFE0F',label:'Agent'},{emoji:'\u{1F9D9}',label:'Wizard'}
      ];
      var bonuses = [
        {id:'quickhands',name:'Quick Hands',desc:'+5 sats per tap'},
        {id:'investor',name:'Early Investor',desc:'+10% passive income'},
        {id:'coolrunner',name:'Cool Runner',desc:'-20% heat generation'},
        {id:'trustfund',name:'Trust Fund',desc:'Start with $50 USD'}
      ];
      var html = '<div class="modal-card"><div class="modal-title">Satoshi\'s Dream</div>' +
        '<div class="modal-subtitle">Choose your identity</div>' +
        '<div class="name-row"><input type="text" class="modal-input" id="avatarName" placeholder="Satoshi" maxlength="12" autocomplete="off">' +
        '<button class="random-btn" id="randomNameBtn" title="Random name">\u{1F3B2}</button></div>' +
        '<div class="modal-subtitle">Select avatar</div><div class="sprite-row">';
      sprites.forEach(function(s,i) { html += '<div class="sprite-option" data-idx="'+i+'"><div class="sprite-emoji">'+s.emoji+'</div><div class="sprite-label">'+s.label+'</div></div>'; });
      html += '</div><div class="modal-subtitle">Starting bonus</div><div class="bonus-grid">';
      bonuses.forEach(function(b) { html += '<div class="bonus-card" data-bonus="'+b.id+'"><div class="bonus-name">'+b.name+'</div><div class="bonus-desc">'+b.desc+'</div></div>'; });
      html += '</div><button class="modal-btn" id="startBtn" disabled>Start Mining</button></div>';
      modal.innerHTML = html;

      var nameInput = document.getElementById('avatarName'), startBtn = document.getElementById('startBtn');
      function checkReady() { startBtn.disabled = !(nameInput.value.trim() && selectedSprite !== null && selectedBonus); }
      nameInput.addEventListener('input', checkReady);
      document.getElementById('randomNameBtn').addEventListener('click', function() { nameInput.value = UI.randomName(); checkReady(); });
      modal.querySelectorAll('.sprite-option').forEach(function(el) {
        el.addEventListener('click', function() { modal.querySelectorAll('.sprite-option').forEach(function(o){o.classList.remove('selected');}); el.classList.add('selected'); selectedSprite = parseInt(el.dataset.idx); checkReady(); });
      });
      modal.querySelectorAll('.bonus-card').forEach(function(el) {
        el.addEventListener('click', function() { modal.querySelectorAll('.bonus-card').forEach(function(o){o.classList.remove('selected');}); el.classList.add('selected'); selectedBonus = el.dataset.bonus; checkReady(); });
      });
      var self = this;
      startBtn.addEventListener('click', function() {
        Game.state.avatar = { name: nameInput.value.trim()||'Satoshi', sprite: sprites[selectedSprite].emoji, bonus: selectedBonus, x: 750, y: 1560 };
        if (selectedBonus === 'trustfund') Game.state.usd += 50;
        modal.classList.remove('active'); modal.innerHTML = '';
        if (document.activeElement) document.activeElement.blur();
        document.getElementById('town').focus();
        Game.save();
        self.startGame();
      });
      setTimeout(function() { nameInput.focus(); }, 100);
    },

    startGame: function() { Game.start(); },

    // ═══════════════════════════════════════
    // ACHIEVEMENTS PANEL (HUD button)
    // ═══════════════════════════════════════
    showAchievementsPanel: function() {
      var panel = document.getElementById('panel');
      panel.style.display = 'block';
      this.panelOpen = true;
      this.currentPanel = 'achievements';
      this.currentBuilding = null;

      var s = Game.state;
      var earned = Game.getAchievementCount();
      var total = Game.ACHIEVEMENTS.length;
      var html = '<div class="panel-header">' +
        '<div class="panel-title">\u{1F3C6} Achievements (' + earned + '/' + total + ')</div>' +
        '<button class="panel-close" id="panelCloseBtn">\u2715</button></div>' +
        '<div class="panel-body">';

      Game.ACHIEVEMENTS.forEach(function(a) {
        var done = !!(s.achievements && s.achievements[a.id]);
        html += '<div class="hw-card' + (done ? '' : ' locked') + '">' +
          '<div class="hw-icon">' + (done ? a.icon : '\u{1F512}') + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + a.name + '</div><div class="hw-sub">' + a.desc + '</div></div>' +
          '<div class="hw-cost" style="color:' + (done ? 'var(--green)' : 'var(--dim)') + ';">' + (done ? '\u2705' : (a.reward > 0 ? '+' + Game.formatNumber(a.reward) : '')) + '</div></div>';
      });
      html += '</div>';
      panel.innerHTML = html;
      document.getElementById('panelCloseBtn').onclick = function() { UI.hidePanel(); };
    },

    // ═══════════════════════════════════════
    // PRESTIGE SHOP PANEL (HUD button)
    // ═══════════════════════════════════════
    showPrestigeShopPanel: function() {
      var panel = document.getElementById('panel');
      panel.style.display = 'block';
      this.panelOpen = true;
      this.currentPanel = 'prestige_shop';
      this.currentBuilding = null;

      var s = Game.state;
      var html = '<div class="panel-header">' +
        '<div class="panel-title">\u{1F6D2} Prestige Shop</div>' +
        '<button class="panel-close" id="panelCloseBtn">\u2715</button></div>' +
        '<div class="panel-body">' +
        '<div style="text-align:center;margin-bottom:12px;">' +
          '<span style="font-size:12px;color:var(--dim);">AVAILABLE TOKENS</span><br>' +
          '<span style="font-size:24px;font-weight:900;color:var(--purple);">\u{1FA99} ' + s.tokens + '</span>' +
        '</div>';

      Game.PRESTIGE_UPGRADES.forEach(function(pu) {
        var owned = Game.hasPrestigeUpgrade(pu.id);
        var canAfford = s.tokens >= pu.cost;
        html += '<div class="hw-card' + (owned ? '' : (!canAfford ? ' locked' : '')) + '" data-pu="' + pu.id + '">' +
          '<div class="hw-icon">' + pu.icon + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + pu.name + '</div><div class="hw-sub">' + pu.desc + '</div></div>' +
          '<div class="hw-cost" style="color:' + (owned ? 'var(--green)' : 'var(--purple)') + ';">' + (owned ? '\u2705 Owned' : '\u{1FA99} ' + pu.cost) + '</div></div>';
      });
      html += '</div>';
      panel.innerHTML = html;
      document.getElementById('panelCloseBtn').onclick = function() { UI.hidePanel(); };
      this.wirePrestigeShopPanel();
    },
    wirePrestigeShopPanel: function() {
      document.querySelectorAll('[data-pu]').forEach(function(el) {
        el.addEventListener('click', function() {
          var id = el.dataset.pu;
          if (Game.buyPrestigeUpgrade(id)) {
            var pu = Game.PRESTIGE_UPGRADES.find(function(u) { return u.id === id; });
            UI.toast('\u{1FA99} Unlocked: ' + (pu ? pu.name : id));
            UI.showPrestigeShopPanel(); // refresh
          }
        });
      });
    },

    toast: function(msg) {
      var el = document.getElementById('toast');
      el.textContent = msg;
      el.classList.add('show');
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(function() { el.classList.remove('show'); }, 2000);
    },
  };

  window.UI = UI;

  function boot() {
    if (window._booted) return;
    window._booted = true;
    Game.init();
    Town.init(document.getElementById('town'));
    UI.init();
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(boot, 0);
  else { document.addEventListener('DOMContentLoaded', boot); window.addEventListener('load', boot); }
})();
