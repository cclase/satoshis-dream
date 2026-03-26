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
      this.setupTouchMove();
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

    // ── Touch Drag-to-Move ──
    setupTouchMove: function() {
      var self = this;
      var canvas = document.getElementById('town');
      var touchStartX = 0, touchStartY = 0, touching = false, moved = false;
      var DEAD_ZONE = 15;

      canvas.addEventListener('pointerdown', function(e) {
        if (self.panelOpen || self.modalActive()) return;
        touchStartX = e.clientX; touchStartY = e.clientY;
        touching = true; moved = false;
      });

      canvas.addEventListener('pointermove', function(e) {
        if (!touching || self.panelOpen) return;
        var dx = e.clientX - touchStartX;
        var dy = e.clientY - touchStartY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < DEAD_ZONE) return;
        moved = true;
        // Convert screen drag to world movement direction
        // Screen right = world right, screen up = world "up" (negative z)
        self.keys.left = dx < -DEAD_ZONE;
        self.keys.right = dx > DEAD_ZONE;
        self.keys.up = dy < -DEAD_ZONE;
        self.keys.down = dy > DEAD_ZONE;
      });

      var stopTouch = function() {
        touching = false;
        self.keys.up = self.keys.down = self.keys.left = self.keys.right = false;
      };
      canvas.addEventListener('pointerup', stopTouch);
      canvas.addEventListener('pointercancel', stopTouch);
      canvas.addEventListener('pointerleave', stopTouch);

      // Store moved flag for click-to-move detection
      this._touchMoved = function() { return moved; };
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
          // Instant teleport to building entrance
          if (Game.state.avatar) {
            Game.state.avatar.x = b.x + b.w / 2;
            Game.state.avatar.y = b.y + b.h + 30;
          }
          Town.moveTarget = null;
          Town._pathWaypoints = null;
          self.hideNavMenu();
          // Auto-open building panel
          setTimeout(function() { UI.showPanel(b); }, 200);
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
          '<div class="hud-item hud-reset" id="hudReset">\u{1F504}</div>' +
          '<div class="hud-item hud-reset" id="hudSaveSlots">\u{1F4BE}</div>' +
          '<div class="hud-item hud-reset" id="hudMenu">\u2630</div>' +
          '<div id="hudDropdown" style="display:none;position:absolute;top:32px;right:0;background:rgba(16,16,37,0.95);border:1px solid var(--border);border-radius:10px;padding:6px;z-index:15;">' +
            '<div class="hud-item hud-reset" id="hudAchievements">\u{1F3C6}</div>' +
            '<div class="hud-item hud-reset" id="hudPrestigeShop">\u{1F6D2}</div>' +
            '<div class="hud-item hud-reset" id="hudDailies">\u{1F4C5}</div>' +
            '<div class="hud-item hud-reset" id="hudRival">\u{1F9D4}</div>' +
            '<div class="hud-item hud-reset" id="hudSkills">\u{1F3AF}</div>' +
            '<div class="hud-item hud-reset" id="hudMute">' + (Sound.isMuted() ? '\u{1F507}' : '\u{1F50A}') + '</div>' +
          '</div>' +
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
      document.getElementById('hudMenu').addEventListener('click', function() {
        var dd = document.getElementById('hudDropdown');
        dd.style.display = dd.style.display === 'none' ? 'flex' : 'none';
      });
      document.getElementById('hudAchievements').addEventListener('click', function() { UI.showAchievementsPanel(); });
      document.getElementById('hudPrestigeShop').addEventListener('click', function() { UI.showPrestigeShopPanel(); });
      document.getElementById('hudRival').addEventListener('click', function() { UI.showRivalPanel(); });
      document.getElementById('hudSkills').addEventListener('click', function() { UI.showSkillPanel(); });
      document.getElementById('hudMute').addEventListener('click', function() {
        var m = Sound.toggleMute();
        document.getElementById('hudMute').textContent = m ? '\u{1F507}' : '\u{1F50A}';
      });
      document.getElementById('hudDailies').addEventListener('click', function() { UI.showDailiesPanel(); });
      document.getElementById('hudSaveSlots').addEventListener('click', function() { UI.showSaveSlotsModal(); });
    },

    updateHUD: function() {
      this._renderGuide();
      this._checkNpcEvent();
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
      // Weather icon
      var weatherEl = document.getElementById('weatherIcon');
      if (!weatherEl) {
        weatherEl = document.createElement('div');
        weatherEl.id = 'weatherIcon';
        weatherEl.style.cssText = 'position:fixed;top:4px;left:50%;transform:translateX(-50%);font-size:18px;z-index:11;';
        document.body.appendChild(weatherEl);
      }
      var wi = {clear:'\u2600\uFE0F',cloudy:'\u26C5',rain:'\u{1F327}\uFE0F',storm:'\u26C8\uFE0F'};
      weatherEl.textContent = wi[Game.weather] || '\u2600\uFE0F';
      // Active delivery indicator
      var deliveryBar = document.getElementById('deliveryBar');
      if (!deliveryBar) {
        deliveryBar = document.createElement('div');
        deliveryBar.id = 'deliveryBar';
        deliveryBar.style.cssText = 'position:fixed;top:62px;left:50%;transform:translateX(-50%);background:rgba(16,16,37,0.85);border:1px solid var(--gold);border-radius:8px;padding:4px 12px;font-size:11px;font-weight:700;color:var(--gold);z-index:11;display:none;';
        document.body.appendChild(deliveryBar);
      }
      if (s.activeDelivery) {
        deliveryBar.style.display = 'block';
        deliveryBar.textContent = '\u{1F4E6} Deliver to: ' + s.activeDelivery.targetName;
      } else { deliveryBar.style.display = 'none'; }
      // Power cut warning
      if (s.powerCut) {
        var pcEl = document.getElementById('powerCutWarn');
        if (!pcEl) {
          pcEl = document.createElement('div');
          pcEl.id = 'powerCutWarn';
          pcEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,0,0,0.15);border:2px solid var(--red);border-radius:12px;padding:16px 24px;font-size:16px;font-weight:800;color:var(--red);z-index:25;text-align:center;';
          pcEl.textContent = '\u26A1 POWER CUT \u26A1\nProduction halted!';
          document.body.appendChild(pcEl);
        }
      } else {
        var pcEl2 = document.getElementById('powerCutWarn');
        if (pcEl2) pcEl2.remove();
      }
      // Minimap
      this._renderMinimap();
    },

    _minimapCanvas: null,
    _renderMinimap: function() {
      if (!this._minimapCanvas) {
        this._minimapCanvas = document.createElement('canvas');
        this._minimapCanvas.id = 'minimap';
        this._minimapCanvas.width = 180;
        this._minimapCanvas.height = 128;
        document.body.appendChild(this._minimapCanvas);
        // Click on minimap to navigate
        var self = this;
        this._minimapCanvas.addEventListener('click', function(e) {
          var rect = self._minimapCanvas.getBoundingClientRect();
          var mx = (e.clientX - rect.left) / rect.width * 2400;
          var my = (e.clientY - rect.top) / rect.height * 1700;
          Town._pathWaypoints = null;
          Town.moveTarget = { x: mx, y: my };
          Town.autoEnterBuilding = null;
        });
      }
      var c = this._minimapCanvas;
      var ctx = c.getContext('2d');
      var sx = c.width / 2400, sy = c.height / 1700;
      // Background
      ctx.fillStyle = '#4a7a3a';
      ctx.fillRect(0, 0, c.width, c.height);
      // Roads
      ctx.fillStyle = '#555';
      var hr = [{ y: 330, h: 50 },{ y: 650, h: 50 },{ y: 970, h: 50 },{ y: 1290, h: 50 }];
      var vr = [{ x: 448, w: 50 },{ x: 832, w: 50 },{ x: 1216, w: 50 }];
      for (var ri = 0; ri < hr.length; ri++) ctx.fillRect(0, hr[ri].y * sy, c.width, hr[ri].h * sy);
      for (var vi = 0; vi < vr.length; vi++) ctx.fillRect(vr[vi].x * sx, 0, vr[vi].w * sx, c.height);
      // Buildings
      var bldgs = Town.BUILDINGS;
      for (var bi = 0; bi < bldgs.length; bi++) {
        var b = bldgs[bi];
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
        // Label abbreviation
        ctx.fillStyle = '#fff'; ctx.font = '6px sans-serif'; ctx.textAlign = 'center';
        var abbr = b.name.substring(0, 3);
        ctx.fillText(abbr, (b.x + b.w/2) * sx, (b.y + b.h/2) * sy + 2);
      }
      // Avatar
      var av = Game.state.avatar;
      if (av) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(av.x * sx, av.y * sy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f7931a';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Treasure map X
      if (Game.state.treasureMap) {
        var tm = Game.state.treasureMap;
        ctx.fillStyle = '#ff0000'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('X', tm.x * sx, tm.y * sy + 3);
      }
      // Move target
      if (Town.moveTarget) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(Town.moveTarget.x * sx, Town.moveTarget.y * sy, 3, 0, Math.PI * 2);
        ctx.stroke();
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
        // Avatar is preserved through prestige, just restart the game
        UI.startGame();
        UI.toast('\u{1FA99} Prestiged! ' + tokens + ' tokens - all progress reset, upgrades kept!');
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
      // Tutorial: step 1 (go to mine) → step 2
      if (Game.state.tutorialStep === 1 && building.panelType === 'mine') Game.state.tutorialStep = 2;
      // Track building visits
      Game.visitBuilding(building.panelType);
      // Auto-complete delivery quest
      if (Game.state.activeDelivery && Game.state.activeDelivery.targetId === building.id) {
        Game.completeDelivery();
      }

      var level = Game.getBuildingLevel(building.panelType);
      var stars = '';
      for (var si = 0; si < level; si++) stars += '\u2B50';
      var visits = (Game.state.buildingVisits || {})[building.panelType] || 0;
      var discount = Game.getBuildingDiscount(building.panelType);

      var header = '<div class="panel-header">' +
        '<div class="panel-title">' + building.emoji + ' ' + building.name + (stars ? ' ' + stars : '') +
        (discount > 0 ? ' <span style="font-size:11px;color:var(--green);">-' + Math.round(discount*100) + '%</span>' : '') +
        '</div><button class="panel-close" id="panelCloseBtn">\u2715</button></div>';

      var body = this.buildPanel(building.panelType);

      // Add upgrade button if < level 3
      if (level < 3 && building.panelType !== 'apartment') {
        var upgCost = Game.UPGRADE_COSTS[level + 1] || 99999;
        body += '<div style="border-top:1px solid var(--border);padding-top:8px;margin-top:8px;">' +
          '<button class="panel-btn btn-gold" id="upgradeBtn"' + (Game.state.usd < upgCost ? ' disabled style="opacity:0.4"' : '') +
          '>\u2B50 Upgrade to Level ' + (level+1) + ' ($' + Game.formatNumber(upgCost) + ')</button></div>';
      }

      panel.innerHTML = header + body;
      document.getElementById('panelCloseBtn').onclick = function() { UI.hidePanel(); };
      var upBtn = document.getElementById('upgradeBtn');
      if (upBtn) upBtn.addEventListener('click', function() {
        if (Game.upgradeBuilding(building.panelType)) {
          if (window.Sound) Sound.levelUp();
          UI.toast('\u2B50 ' + building.name + ' upgraded to Level ' + Game.getBuildingLevel(building.panelType) + '!');
          UI.showPanel(building);
        }
      });
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
        case 'clothing': return this.buildClothingPanel();
        case 'homegoods': return this.buildHomegoodsPanel();
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
        case 'clothing': this.wireClothingPanel(); break;
        case 'homegoods': this.wireHomegoodsPanel(); break;
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
        if (window.Sound) Sound.tapMine();
        var av = Game.state.avatar;
        if (av) Game.addFloatingText('+' + Game.formatNumber(gain), av.x, av.y - 20, '#f7931a');
        btn.classList.add('tapped');
        setTimeout(function() { btn.classList.remove('tapped'); }, 100);
      };
      btn.addEventListener('click', doTap);
      // Auto-tap on hold (5x/second)
      var holdInterval = null;
      btn.addEventListener('mousedown', function() { holdInterval = setInterval(doTap, 200); });
      btn.addEventListener('touchstart', function(e) { e.preventDefault(); doTap(); holdInterval = setInterval(doTap, 200); });
      var stopHold = function() { if (holdInterval) { clearInterval(holdInterval); holdInterval = null; } };
      btn.addEventListener('mouseup', stopHold);
      btn.addEventListener('mouseleave', stopHold);
      btn.addEventListener('touchend', stopHold);
      btn.addEventListener('touchcancel', stopHold);
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
      // Bribe option
      if (s.policeRisk > 0 && s.policeRisk < 75) {
        html += '<div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px;">';
        html += '<button class="panel-btn btn-gold" id="bribeBtn"' + (s.usd < 500 ? ' disabled style="opacity:0.4"' : '') + '>\u{1F46E} Bribe Officer ($500, -10% risk)</button>';
        html += '</div>';
      }
      // Pay tickets
      if (s.tickets && s.tickets.length > 0) {
        html += '<div style="border-top:1px solid var(--border);margin-top:8px;padding-top:8px;">';
        html += '<div style="font-weight:800;margin-bottom:6px;color:var(--red);">\u{1F4CB} Unpaid Tickets (' + s.tickets.length + ')</div>';
        s.tickets.forEach(function(t, i) {
          html += '<div class="hw-card" data-payticket="' + i + '"><div class="hw-icon">\u{1F4CB}</div>' +
            '<div class="hw-info"><div class="hw-name">Traffic Ticket</div><div class="hw-sub">Fine: $' + Game.formatNumber(t.fine) + '</div></div>' +
            '<div class="hw-cost" style="color:var(--green);">Pay</div></div>';
        });
        html += '</div>';
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
      var bribe = document.getElementById('bribeBtn');
      if (bribe) bribe.addEventListener('click', function() {
        if (Game.bribePolice()) { UI.toast('\u{1F46E} Officer bribed! -10% risk'); UI.showPanel(UI.currentBuilding); }
      });
      document.querySelectorAll('[data-payticket]').forEach(function(el) {
        el.addEventListener('click', function() {
          if (Game.payTicket(parseInt(el.dataset.payticket))) { UI.toast('\u{1F4CB} Ticket paid!'); UI.showPanel(UI.currentBuilding); }
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
      // Delivery quests
      Game.generateDeliveries();
      if (s.activeDelivery) {
        html += '<div class="hw-card" style="border-color:var(--gold);"><div class="hw-icon">\u{1F4E6}</div>' +
          '<div class="hw-info"><div class="hw-name">Active: Deliver to ' + s.activeDelivery.targetName + '</div>' +
          '<div class="hw-sub">Reward: ' + Game.formatNumber(s.activeDelivery.sats) + ' sats + $' + Game.formatNumber(s.activeDelivery.usd) + '</div></div></div>';
      } else if (s.deliveries.length > 0) {
        html += '<div style="font-weight:800;margin-bottom:8px;">\u{1F4E6} Delivery Jobs</div>';
        s.deliveries.forEach(function(d, i) {
          html += '<div class="hw-card" data-delivery="' + i + '">' +
            '<div class="hw-icon">\u{1F4E6}</div>' +
            '<div class="hw-info"><div class="hw-name">Deliver to ' + d.targetName + '</div>' +
            '<div class="hw-sub">Reward: ' + Game.formatNumber(d.sats) + ' sats + $' + Game.formatNumber(d.usd) + '</div></div>' +
            '<div class="hw-cost" style="color:var(--green);">Accept</div></div>';
        });
      }
      html += '<div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px;">';
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
      return html + '</div></div>';
    },
    wirePostOfficePanel: function() {
      document.querySelectorAll('[data-delivery]').forEach(function(el) {
        el.addEventListener('click', function() {
          var idx = parseInt(el.dataset.delivery);
          if (Game.acceptDelivery(idx)) UI.showPanel(UI.currentBuilding);
        });
      });
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
    // CLOTHING STORE
    // ═══════════════════════════════════════
    buildClothingPanel: function() {
      var s = Game.state, html = '<div class="panel-body">';
      html += '<p style="color:var(--dim);font-size:12px;margin-bottom:12px;">Buy clothing for permanent stat bonuses!</p>';
      Game.CLOTHING.forEach(function(c) {
        var owned = !!(s.clothing && s.clothing[c.id]);
        html += '<div class="hw-card' + (owned ? '' : (s.usd < c.cost ? ' locked' : '')) + '" data-cloth="' + c.id + '">' +
          '<div class="hw-icon">' + c.icon + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + c.name + '</div><div class="hw-sub">' + c.desc + '</div></div>' +
          '<div class="hw-cost">' + (owned ? '\u2705 Wearing' : '$' + Game.formatNumber(c.cost)) + '</div></div>';
      });
      return html + '</div>';
    },
    wireClothingPanel: function() {
      document.querySelectorAll('[data-cloth]').forEach(function(el) {
        el.addEventListener('click', function() {
          var c = Game.CLOTHING.find(function(x) { return x.id === el.dataset.cloth; });
          if (!c || (Game.state.clothing && Game.state.clothing[c.id]) || Game.state.usd < c.cost) return;
          Game.state.usd -= c.cost;
          if (!Game.state.clothing) Game.state.clothing = {};
          Game.state.clothing[c.id] = true;
          UI.toast('\u{1F455} Bought ' + c.name + '!');
          UI.showPanel(UI.currentBuilding);
        });
      });
    },

    // ═══════════════════════════════════════
    // HOME GOODS STORE
    // ═══════════════════════════════════════
    buildHomegoodsPanel: function() {
      var s = Game.state, html = '<div class="panel-body">';
      html += '<p style="color:var(--dim);font-size:12px;margin-bottom:12px;">Furnish your home for permanent bonuses! View your home to see your items.</p>';
      Game.FURNITURE.forEach(function(f) {
        var owned = !!(s.furniture && s.furniture[f.id]);
        html += '<div class="hw-card' + (owned ? '' : (s.usd < f.cost ? ' locked' : '')) + '" data-furn="' + f.id + '">' +
          '<div class="hw-icon">' + f.icon + '</div>' +
          '<div class="hw-info"><div class="hw-name">' + f.name + '</div><div class="hw-sub">' + f.desc + '</div></div>' +
          '<div class="hw-cost">' + (owned ? '\u2705 Placed' : '$' + Game.formatNumber(f.cost)) + '</div></div>';
      });
      // Seeds section
      if (Game.getMaxPlots() > 0) {
        html += '<div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px;">';
        html += '<div style="font-weight:800;margin-bottom:6px;">\u{1F331} Garden Seeds</div>';
        Game.SEEDS.forEach(function(se) {
          html += '<div class="hw-card' + (s.usd < se.cost ? ' locked' : '') + '" data-seed="' + se.id + '">' +
            '<div class="hw-icon">' + se.icon + '</div>' +
            '<div class="hw-info"><div class="hw-name">' + se.name + '</div><div class="hw-sub">' + se.desc + '</div></div>' +
            '<div class="hw-cost">$' + Game.formatNumber(se.cost) + '</div></div>';
        });
        html += '</div>';
      }
      return html + '</div>';
    },
    wireHomegoodsPanel: function() {
      document.querySelectorAll('[data-seed]').forEach(function(el) {
        el.addEventListener('click', function() {
          if (Game.plantSeed(el.dataset.seed)) { UI.toast('\u{1F331} Planted!'); UI.showPanel(UI.currentBuilding); }
          else UI.toast('No garden plots available or not enough USD');
        });
      });
      document.querySelectorAll('[data-furn]').forEach(function(el) {
        el.addEventListener('click', function() {
          var f = Game.FURNITURE.find(function(x) { return x.id === el.dataset.furn; });
          if (!f || (Game.state.furniture && Game.state.furniture[f.id]) || Game.state.usd < f.cost) return;
          Game.state.usd -= f.cost;
          if (!Game.state.furniture) Game.state.furniture = {};
          Game.state.furniture[f.id] = true;
          UI.toast('\u{1F6CB}\uFE0F Placed ' + f.name + '!');
          UI.showPanel(UI.currentBuilding);
        });
      });
    },

    // ═══════════════════════════════════════
    // YOUR HOME (apartment)
    // ═══════════════════════════════════════
    buildApartmentPanel: function() {
      var s = Game.state;
      var h = Game.HOUSING.find(function(x){return x.id===s.housing;});
      var html = '<div class="panel-body">' +
        '<p style="margin-bottom:8px;font-weight:800;">\u{1F3E0} ' + (h ? h.name : 'Studio') + '</p>' +
        '<div class="ex-stat" style="margin-bottom:8px;"><span class="ex-stat-label">Rig Slots</span><span>' + Game.getUsedSlots() + ' / ' + Game.getMaxSlots() + '</span></div>' +
        '<div class="ex-stat" style="margin-bottom:8px;"><span class="ex-stat-label">Vehicle</span><span>' + (s.vehicle ? (Game.VEHICLES.find(function(v){return v.id===s.vehicle;}) || {}).name || 'Unknown' : 'None') + '</span></div>' +
        '<div class="ex-stat" style="margin-bottom:8px;"><span class="ex-stat-label">Pet</span><span>' + (s.pet ? (Game.PETS.find(function(p){return p.id===s.pet;}) || {}).name || 'Unknown' : 'None') + '</span></div>' +
        '<div class="ex-stat" style="margin-bottom:8px;"><span class="ex-stat-label">Research</span><span>' + Object.keys(s.research).length + '/' + Game.RESEARCH.length + '</span></div>';
      // Show owned clothing
      var ownedClothing = Game.CLOTHING.filter(function(c) { return s.clothing && s.clothing[c.id]; });
      if (ownedClothing.length > 0) {
        html += '<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:8px;"><div style="font-weight:800;margin-bottom:6px;font-size:12px;color:var(--dim);">WARDROBE</div>';
        ownedClothing.forEach(function(c) { html += '<span style="font-size:20px;" title="' + c.name + '">' + c.icon + '</span> '; });
        html += '</div>';
      }
      // Show owned furniture
      var ownedFurn = Game.FURNITURE.filter(function(f) { return s.furniture && s.furniture[f.id]; });
      if (ownedFurn.length > 0) {
        html += '<div style="margin-top:8px;border-top:1px solid var(--border);padding-top:8px;"><div style="font-weight:800;margin-bottom:6px;font-size:12px;color:var(--dim);">FURNITURE</div>';
        ownedFurn.forEach(function(f) { html += '<span style="font-size:20px;" title="' + f.name + ' - ' + f.desc + '">' + f.icon + '</span> '; });
        html += '</div>';
      }
      // Garden
      if (Game.getMaxPlots() > 0) {
        html += '<div style="margin-top:8px;border-top:1px solid var(--border);padding-top:8px;"><div style="font-weight:800;margin-bottom:6px;font-size:12px;color:var(--dim);">GARDEN (' + s.garden.length + '/' + Game.getMaxPlots() + ' plots)</div>';
        s.garden.forEach(function(p, i) {
          var seed = Game.SEEDS.find(function(se) { return se.id === p.seedId; });
          var elapsed = Date.now() - p.plantedAt;
          var ready = seed && elapsed >= seed.growTime;
          var timeLeft = seed ? Math.max(0, Math.ceil((seed.growTime - elapsed) / 1000)) : 0;
          html += '<div class="hw-card' + (ready ? '' : ' locked') + '" data-harvest="' + i + '">' +
            '<div class="hw-icon">' + (seed ? seed.icon : '\u{1F331}') + '</div>' +
            '<div class="hw-info"><div class="hw-name">' + (seed ? seed.name : 'Plant') + '</div>' +
            '<div class="hw-sub">' + (ready ? 'Ready to harvest!' : timeLeft + 's remaining') + '</div></div>' +
            '<div class="hw-cost" style="color:' + (ready ? 'var(--green)' : 'var(--dim)') + ';">' + (ready ? 'Harvest' : '\u231B') + '</div></div>';
        });
        html += '</div>';
      }
      // Garden inventory (eat at home)
      var inv = s.gardenInventory || {};
      var hasFood = Object.keys(inv).length > 0;
      if (hasFood) {
        html += '<div style="margin-top:8px;border-top:1px solid var(--border);padding-top:8px;"><div style="font-weight:800;margin-bottom:6px;font-size:12px;color:var(--dim);">PANTRY</div>';
        Game.SEEDS.forEach(function(se) {
          if (!inv[se.id]) return;
          html += '<div class="hw-card" data-eat="' + se.id + '"><div class="hw-icon">' + se.icon + '</div>' +
            '<div class="hw-info"><div class="hw-name">' + se.name + ' x' + inv[se.id] + '</div>' +
            '<div class="hw-sub">Eat for +' + se.energy + ' energy</div></div>' +
            '<div class="hw-cost" style="color:var(--green);">Eat</div></div>';
        });
        html += '</div>';
      }
      // Sleep button
      var canSleep = Date.now() - (s.lastSleepTime || 0) >= 180000;
      html += '<button class="panel-btn btn-purple" id="sleepBtn"' + (canSleep ? '' : ' disabled style="opacity:0.4"') + '>\u{1F6CC} Sleep' + (canSleep ? '' : ' (cooldown)') + '</button>';
      return html + '</div>';
    },
    wireApartmentPanel: function() {
      document.querySelectorAll('[data-harvest]').forEach(function(el) {
        el.addEventListener('click', function() {
          var seed = Game.harvestPlant(parseInt(el.dataset.harvest));
          if (seed) { UI.toast(seed.icon + ' Harvested ' + seed.name + '!'); UI.showPanel(UI.currentBuilding); }
        });
      });
      document.querySelectorAll('[data-eat]').forEach(function(el) {
        el.addEventListener('click', function() {
          var seed = Game.eatGardenItem(el.dataset.eat);
          if (seed) { UI.toast(seed.icon + ' Ate ' + seed.name + '! +' + seed.energy + ' energy'); UI.showPanel(UI.currentBuilding); }
        });
      });
      var el = document.getElementById('sleepBtn');
      if (el) el.addEventListener('click', function() {
        var result = Game.sleep();
        if (result.error) { UI.toast(result.error); return; }
        UI.toast('\u{1F6CC} Slept! +' + result.energy + ' energy, +' + Game.formatNumber(result.sats) + ' sats');
        UI.showPanel(UI.currentBuilding);
      });
    },

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
        // Start tutorial for new characters
        if (Game.state.tutorialStep === 0) Game.state.tutorialStep = 1;
        Game.save();
        self.startGame();
      });
      setTimeout(function() { nameInput.focus(); }, 100);
    },

    startGame: function() { Game.start(); },

    // ═══════════════════════════════════════
    // NPC TUTORIAL GUIDE
    // ═══════════════════════════════════════
    _guideMessages: [
      '', // step 0: not started
      '\u{1F9D9} Welcome! Head to Mining HQ \u26CF\uFE0F to earn your first Bitcoin! Use the map button or walk there.',
      '\u{1F9D9} Tap the \u20BF button to mine sats! Try it!',
      '\u{1F9D9} Nice! You earned your first sat! Keep tapping to earn more.',
      '\u{1F9D9} You can afford a Laptop now! Visit the Hardware Shop \u{1F527} to buy one.',
      '\u{1F9D9} You\'re mining automatically! Visit the Exchange \u{1F4C8} to sell sats for USD.',
      '\u{1F9D9} You\'re a real miner now! Explore the town \u2014 there\'s lots to discover. Good luck! \u{1F680}',
    ],
    _lastGuideStep: -1,

    _renderGuide: function() {
      var step = Game.state.tutorialStep;
      if (!step || step <= 0 || step >= 7) {
        var existing = document.getElementById('guide-bubble');
        if (existing) existing.remove();
        return;
      }
      var bubble = document.getElementById('guide-bubble');
      if (!bubble) {
        bubble = document.createElement('div');
        bubble.id = 'guide-bubble';
        document.body.appendChild(bubble);
      }
      // Hide guide when panel is open to prevent blocking clicks
      if (this.panelOpen) { bubble.style.display = 'none'; return; }
      else { bubble.style.display = ''; }
      if (this._lastGuideStep !== step) {
        this._lastGuideStep = step;
        bubble.innerHTML = '<div class="guide-text">' + (this._guideMessages[step] || '') + '</div>' +
          '<button class="guide-dismiss" id="guideDismiss">Skip tutorial</button>';
        document.getElementById('guideDismiss').addEventListener('click', function() {
          Game.state.tutorialStep = 7;
          bubble.remove();
        });
      }
    },

    // ═══════════════════════════════════════
    // NPC EVENT POPUP
    // ═══════════════════════════════════════
    _npcShowing: false,
    _checkNpcEvent: function() {
      var s = Game.state;
      if (!s.pendingNpcEvent || this._npcShowing || this.panelOpen || this.modalActive()) return;
      this._npcShowing = true;
      var evt = s.pendingNpcEvent;
      var modal = document.getElementById('modal');
      modal.classList.add('active');
      modal.innerHTML = '<div class="modal-card" style="text-align:center;">' +
        '<div style="font-size:36px;margin-bottom:8px;">' + evt.icon + '</div>' +
        '<div class="modal-title" style="font-size:18px;">' + evt.name + '</div>' +
        '<p style="color:var(--dim);margin-bottom:16px;font-size:14px;">' + evt.desc + '</p>' +
        '<div style="display:flex;gap:10px;">' +
          '<button class="modal-btn" id="npcDecline" style="background:var(--card);color:var(--text);border:1px solid var(--border);">' + evt.decline + '</button>' +
          '<button class="modal-btn" id="npcAccept" style="background:var(--gold);color:var(--bg);">' + evt.accept + '</button>' +
        '</div></div>';
      var self = this;
      document.getElementById('npcDecline').addEventListener('click', function() {
        s.pendingNpcEvent = null; self._npcShowing = false;
        modal.classList.remove('active'); modal.innerHTML = '';
      });
      document.getElementById('npcAccept').addEventListener('click', function() {
        var npcDef = Game.NPC_EVENTS.find(function(e) { return e.id === evt.id; });
        var result = npcDef ? npcDef.effect(s) : 'Something happened.';
        s.pendingNpcEvent = null; self._npcShowing = false;
        modal.classList.remove('active'); modal.innerHTML = '';
        if (result) self.toast(evt.icon + ' ' + result);
      });
    },

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

      // Rare Collection
      var coll = s.collection || {};
      var collCount = Object.keys(coll).length;
      html += '<div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px;">';
      html += '<div style="font-weight:800;margin-bottom:8px;">\u{1F48E} Collection (' + collCount + '/' + Game.RARE_ITEMS.length + ')</div>';
      var sets = {};
      Game.RARE_ITEMS.forEach(function(r) {
        if (!sets[r.set]) sets[r.set] = [];
        sets[r.set].push(r);
      });
      for (var setName in sets) {
        var setItems = sets[setName];
        var setOwned = setItems.filter(function(r) { return coll[r.id]; }).length;
        var setComplete = setOwned >= 5;
        html += '<div style="margin-bottom:6px;"><span style="font-weight:700;text-transform:capitalize;">' + setName + '</span> (' + setOwned + '/5)' +
          (setComplete ? ' <span style="color:var(--green);">+' + Math.round((Game.SET_BONUSES[setName]||0)*100) + '% bonus!</span>' : '') + '<br>';
        setItems.forEach(function(r) {
          html += '<span style="font-size:18px;opacity:' + (coll[r.id] ? '1' : '0.2') + ';" title="' + r.name + '">' + r.icon + '</span> ';
        });
        html += '</div>';
      }
      html += '</div></div>';
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

    // ═══════════════════════════════════════
    // ═══════════════════════════════════════
    // ═══════════════════════════════════════
    // RIVAL PANEL
    // ═══════════════════════════════════════
    showRivalPanel: function() {
      var panel = document.getElementById('panel');
      panel.style.display = 'block'; this.panelOpen = true;
      this.currentPanel = 'rival'; this.currentBuilding = null;
      var s = Game.state, c = s.craig || { sats: 0, hardware: 0 };
      var playerAhead = s.lifetimeSats > c.sats;
      var html = '<div class="panel-header"><div class="panel-title">\u{1F9D4} Rival: Craig</div>' +
        '<button class="panel-close" id="panelCloseBtn">\u2715</button></div><div class="panel-body">' +
        '<p style="color:var(--dim);font-size:12px;margin-bottom:12px;">Craig is also building a mining empire. Can you stay ahead?</p>' +
        '<div style="display:flex;gap:12px;margin-bottom:12px;">' +
          '<div style="flex:1;background:var(--bg);border:1px solid ' + (playerAhead ? 'var(--green)' : 'var(--border)') + ';border-radius:10px;padding:10px;text-align:center;">' +
            '<div style="font-size:11px;color:var(--dim);">YOU</div>' +
            '<div style="font-size:20px;font-weight:900;color:var(--gold);">' + Game.formatNumber(s.lifetimeSats) + '</div>' +
            '<div style="font-size:10px;color:var(--dim);">lifetime sats</div></div>' +
          '<div style="flex:1;background:var(--bg);border:1px solid ' + (!playerAhead ? 'var(--red)' : 'var(--border)') + ';border-radius:10px;padding:10px;text-align:center;">' +
            '<div style="font-size:11px;color:var(--dim);">CRAIG</div>' +
            '<div style="font-size:20px;font-weight:900;color:var(--red);">' + Game.formatNumber(c.sats) + '</div>' +
            '<div style="font-size:10px;color:var(--dim);">lifetime sats</div></div>' +
        '</div>' +
        '<div class="ex-stat" style="margin-bottom:6px;"><span class="ex-stat-label">Craig\'s Hardware</span><span>' + c.hardware + ' units</span></div>' +
        '<div class="ex-stat" style="margin-bottom:6px;"><span class="ex-stat-label">Difficulty</span><span>' + Math.round(Game.getCraigPace() * 100) + '% of your pace</span></div>' +
        '<div class="ex-stat"><span class="ex-stat-label">Status</span><span style="color:' + (playerAhead ? 'var(--green)' : 'var(--red)') + ';">' + (playerAhead ? 'You\'re winning!' : 'Craig is ahead! (-1%/s)') + '</span></div>' +
        (c._sabotageUntil && Date.now() < c._sabotageUntil ? '<div class="ex-stat" style="color:var(--green);"><span class="ex-stat-label">Sabotage</span><span>Active! Craig at 50% speed</span></div>' : '') +
        '<div style="display:flex;gap:8px;margin-top:12px;">' +
          '<button class="panel-btn btn-gold" id="craigChallenge">\u2694\uFE0F Challenge Duel</button>' +
          '<button class="panel-btn btn-red" id="craigSabotage"' + (s.sats < 1000 ? ' disabled style="opacity:0.4"' : '') + '>\u{1F4A3} Sabotage (1K sats)</button>' +
        '</div></div>';
      panel.innerHTML = html;
      document.getElementById('panelCloseBtn').onclick = function() { UI.hidePanel(); };
      document.getElementById('craigChallenge').addEventListener('click', function() {
        var result = Game.challengeCraig();
        if (!result) return;
        UI.toast(result.won ? '\u2694\uFE0F You won! +' + Game.formatNumber(result.prize) + ' sats!' : '\u2694\uFE0F Craig won! Lost ' + Game.formatNumber(Math.floor(result.prize*0.3)) + ' sats');
        if (window.Sound) result.won ? Sound.levelUp() : Sound.error();
        UI.showRivalPanel();
      });
      document.getElementById('craigSabotage').addEventListener('click', function() {
        if (Game.sabotageCraig()) {
          UI.toast('\u{1F4A3} Craig sabotaged! 50% speed for 5min');
          if (window.Sound) Sound.purchase();
          UI.showRivalPanel();
        }
      });
    },

    // ═══════════════════════════════════════
    // SKILL TREE PANEL
    // ═══════════════════════════════════════
    showSkillPanel: function() {
      var panel = document.getElementById('panel');
      panel.style.display = 'block'; this.panelOpen = true;
      this.currentPanel = 'skills'; this.currentBuilding = null;
      var s = Game.state;
      var html = '<div class="panel-header"><div class="panel-title">\u{1F3AF} Skill Tree</div>' +
        '<button class="panel-close" id="panelCloseBtn">\u2715</button></div><div class="panel-body">' +
        '<div style="text-align:center;margin-bottom:12px;"><span style="color:var(--dim);font-size:12px;">SKILL POINTS</span><br>' +
        '<span style="font-size:24px;font-weight:900;color:var(--gold);">' + (s.skillPoints || 0) + '</span>' +
        '<span style="font-size:11px;color:var(--dim);"> (earn 1 per prestige)</span></div>';
      var paths = { mining: '\u26CF\uFE0F Mining', trader: '\u{1F4C8} Trader', shadow: '\u{1F480} Shadow' };
      for (var pathName in paths) {
        html += '<div style="font-weight:800;margin:8px 0 4px;color:var(--gold);">' + paths[pathName] + '</div>';
        Game.SKILL_TREE.filter(function(sk) { return sk.path === pathName; }).forEach(function(sk) {
          var owned = Game.hasSkill(sk.id);
          var canBuy = !owned && (s.skillPoints || 0) >= sk.cost && (!sk.requires || Game.hasSkill(sk.requires));
          html += '<div class="hw-card' + (owned ? '' : (!canBuy ? ' locked' : '')) + '" data-skill="' + sk.id + '">' +
            '<div class="hw-icon">' + (owned ? '\u2705' : '\u{1F3AF}') + '</div>' +
            '<div class="hw-info"><div class="hw-name">' + sk.name + '</div><div class="hw-sub">' + sk.desc + '</div></div>' +
            '<div class="hw-cost">' + (owned ? 'Learned' : sk.cost + ' pts') + '</div></div>';
        });
      }
      panel.innerHTML = html + '</div>';
      document.getElementById('panelCloseBtn').onclick = function() { UI.hidePanel(); };
      document.querySelectorAll('[data-skill]').forEach(function(el) {
        el.addEventListener('click', function() {
          if (Game.buySkill(el.dataset.skill)) {
            if (window.Sound) Sound.levelUp();
            UI.toast('\u{1F3AF} Skill learned!');
            UI.showSkillPanel();
          }
        });
      });
    },

    // ═══════════════════════════════════════
    // DAILY CHALLENGES PANEL
    // ═══════════════════════════════════════
    showDailiesPanel: function() {
      var panel = document.getElementById('panel');
      panel.style.display = 'block';
      this.panelOpen = true;
      this.currentPanel = 'dailies';
      this.currentBuilding = null;
      var s = Game.state;
      Game.generateDailyChallenges();
      var html = '<div class="panel-header"><div class="panel-title">\u{1F4C5} Daily Challenges</div>' +
        '<button class="panel-close" id="panelCloseBtn">\u2715</button></div><div class="panel-body">';
      if (s.dailyChallenges && s.dailyChallenges.length > 0) {
        s.dailyChallenges.forEach(function(ch) {
          html += '<div class="hw-card' + (ch.completed ? '' : '') + '">' +
            '<div class="hw-icon">' + (ch.completed ? '\u2705' : '\u{1F3AF}') + '</div>' +
            '<div class="hw-info"><div class="hw-name">' + ch.desc + '</div>' +
            '<div class="hw-sub">Reward: ' + Game.formatNumber(ch.reward) + ' sats' + (ch.completed ? ' — DONE!' : '') + '</div></div></div>';
        });
      } else {
        html += '<p style="color:var(--dim);">No challenges today.</p>';
      }
      // Stats section
      var st = s.stats || {};
      html += '<div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px;">' +
        '<div style="font-weight:800;margin-bottom:6px;">\u{1F4CA} Lifetime Stats</div>' +
        '<div class="ex-stat" style="margin-bottom:4px;"><span class="ex-stat-label">Total Taps</span><span>' + Game.formatNumber(st.taps||0) + '</span></div>' +
        '<div class="ex-stat" style="margin-bottom:4px;"><span class="ex-stat-label">Items Collected</span><span>' + (st.itemsCollected||0) + '</span></div>' +
        '<div class="ex-stat" style="margin-bottom:4px;"><span class="ex-stat-label">Buildings Visited</span><span>' + (st.buildingsVisited||0) + '</span></div>' +
        '<div class="ex-stat" style="margin-bottom:4px;"><span class="ex-stat-label">Deliveries</span><span>' + (st.deliveriesCompleted||0) + '</span></div>' +
        '</div>';
      panel.innerHTML = html + '</div>';
      document.getElementById('panelCloseBtn').onclick = function() { UI.hidePanel(); };
    },

    // ═══════════════════════════════════════
    // SAVE SLOTS MODAL
    // ═══════════════════════════════════════
    showSaveSlotsModal: function() {
      var modal = document.getElementById('modal');
      modal.classList.add('active');
      this._renderSaveSlots(modal);
    },
    _renderSaveSlots: function(modal) {
      var slots = Game.getSaveSlots();
      var hasAvatar = !!Game.state.avatar;
      var html = '<div class="modal-card">' +
        '<div class="modal-title">\u{1F4BE} Save &amp; Load</div>';

      for (var i = 0; i < 4; i++) {
        var slot = slots[i];
        var isEmpty = !slot || !slot.name;
        var timeStr = '';
        if (slot && slot.savedAt) {
          var d = new Date(slot.savedAt);
          timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
        }
        html += '<div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-weight:800;font-size:13px;color:var(--text);">Slot ' + (i + 1) + '</div>' +
            (isEmpty ?
              '<div style="font-size:11px;color:var(--dim);margin-top:2px;">Empty</div>' :
              '<div style="font-size:11px;color:var(--dim);margin-top:2px;">' + slot.name + ' \u2022 ' + Game.formatNumber(slot.sats) + ' lifetime sats \u2022 \u{1FA99} ' + slot.tokens + '</div>' +
              '<div style="font-size:10px;color:var(--dim);">' + timeStr + '</div>') +
          '</div>' +
          '<div style="display:flex;gap:6px;flex-shrink:0;">' +
            (hasAvatar ? '<button class="slot-btn" data-slot-save="' + i + '" style="background:var(--green);color:var(--bg);border:none;border-radius:6px;padding:6px 10px;font-size:11px;font-weight:800;cursor:pointer;">Save</button>' : '') +
            (isEmpty ?
              '<button class="slot-btn" data-slot-new="' + i + '" style="background:var(--gold);color:var(--bg);border:none;border-radius:6px;padding:6px 10px;font-size:11px;font-weight:800;cursor:pointer;">New Game</button>' :
              '<button class="slot-btn" data-slot-load="' + i + '" style="background:var(--blue);color:white;border:none;border-radius:6px;padding:6px 10px;font-size:11px;font-weight:800;cursor:pointer;">Load</button>' +
              '<button class="slot-btn" data-slot-del="' + i + '" style="background:var(--red);color:white;border:none;border-radius:6px;padding:6px 10px;font-size:11px;font-weight:800;cursor:pointer;">\u2715</button>') +
          '</div>' +
        '</div>';
      }

      html += '<div style="display:flex;gap:8px;margin-top:8px;">' +
        '<button class="modal-btn" id="slotClose" style="flex:1;background:var(--card);color:var(--text);border:1px solid var(--border);">Close</button>' +
        (hasAvatar ? '<button class="modal-btn" id="slotReset" style="flex:0 0 auto;background:var(--red);color:white;padding:14px 20px;">\u{1F5D1} Reset Current</button>' : '') +
        '</div></div>';
      modal.innerHTML = html;

      document.getElementById('slotClose').addEventListener('click', function() {
        modal.classList.remove('active'); modal.innerHTML = '';
      });
      var resetBtn = document.getElementById('slotReset');
      if (resetBtn) resetBtn.addEventListener('click', function() {
        modal.innerHTML = '<div class="modal-card" style="text-align:center;">' +
          '<div class="modal-title" style="color:var(--red);">\u{1F5D1} Reset Current Game?</div>' +
          '<p style="color:var(--dim);margin-bottom:20px;font-size:14px;">This resets your current active game.<br>Save slots are NOT affected.</p>' +
          '<div style="display:flex;gap:10px;">' +
            '<button class="modal-btn" id="hardResetCancel" style="background:var(--card);color:var(--text);border:1px solid var(--border);">Cancel</button>' +
            '<button class="modal-btn" id="hardResetConfirm" style="background:var(--red);color:white;">Reset Game</button>' +
          '</div></div>';
        document.getElementById('hardResetCancel').addEventListener('click', function() { modal.classList.remove('active'); modal.innerHTML = ''; });
        document.getElementById('hardResetConfirm').addEventListener('click', function() {
          localStorage.removeItem('sd_town_v1');
          Game.running = false;
          Object.assign(Game.state, {avatar:null,sats:0,usd:0,totalSats:0,lifetimeSats:0,heat:0,owned:{},tokens:0,price:65000,buyMulti:1,priceEvent:null,nextEventAt:0,housing:'studio',vehicle:null,pet:null,energy:100,research:{},loans:[],loanTime:0,electricityBill:0,electricitySolar:0,policeRisk:0,mailOrders:[],gymLevel:0,health:100,casinoLock:0,prestigeUpgrades:{},achievements:{},version:3,lastTick:Date.now()});
          Game.floatingTexts = [];
          Game.init();
          modal.classList.remove('active'); modal.innerHTML = '';
          UI.hidePanel();
          UI.setupHUD();
          UI.showAvatarCreation();
          UI.toast('Game reset');
        });
      });

      var self = this;
      // New game on empty slot
      modal.querySelectorAll('[data-slot-new]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(btn.dataset.slotNew);
          // Save current game to the slot as a fresh start
          var prevState = JSON.stringify(Game.state);
          // Reset current game
          localStorage.removeItem('sd_town_v1');
          Game.running = false;
          Object.assign(Game.state, {avatar:null,sats:0,usd:0,totalSats:0,lifetimeSats:0,heat:0,owned:{},tokens:0,price:65000,buyMulti:1,priceEvent:null,nextEventAt:0,housing:'studio',vehicle:null,pet:null,energy:100,research:{},loans:[],loanTime:0,electricityBill:0,electricitySolar:0,policeRisk:0,mailOrders:[],gymLevel:0,health:100,casinoLock:0,prestigeUpgrades:{},achievements:{},version:3,lastTick:Date.now()});
          Game.floatingTexts = [];
          Game.init();
          modal.classList.remove('active'); modal.innerHTML = '';
          UI.hidePanel();
          UI.setupHUD();
          UI.showAvatarCreation();
        });
      });
      modal.querySelectorAll('[data-slot-save]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(btn.dataset.slotSave);
          Game.saveToSlot(idx);
          self.toast('\u{1F4BE} Saved to Slot ' + (idx + 1));
          self._renderSaveSlots(modal);
        });
      });
      modal.querySelectorAll('[data-slot-load]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(btn.dataset.slotLoad);
          if (Game.loadFromSlot(idx)) {
            modal.classList.remove('active'); modal.innerHTML = '';
            Game.running = false;
            Game.floatingTexts = [];
            Game.init();
            self.hidePanel();
            self.setupHUD();
            if (!Game.state.avatar) self.showAvatarCreation();
            else { self.startGame(); self.toast('\u{1F4BE} Loaded Slot ' + (idx + 1)); }
          }
        });
      });
      modal.querySelectorAll('[data-slot-del]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(btn.dataset.slotDel);
          Game.deleteSlot(idx);
          self.toast('Slot ' + (idx + 1) + ' deleted');
          self._renderSaveSlots(modal);
        });
      });
    },

    toast: function(msg) {
      var el = document.getElementById('toast');
      el.textContent = msg;
      el.classList.add('show');
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(function() { el.classList.remove('show'); }, 2000);
      if (window.Sound) Sound.toast();
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
