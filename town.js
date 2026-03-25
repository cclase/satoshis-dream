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

  var Town = {
    canvas: null,
    ctx: null,
    camera: { x: 0, y: 0 },
    nearbyBuilding: null,
    moveTarget: null,  // { x, y } click-to-move destination
    autoEnterBuilding: null, // building to auto-enter on arrival
    BUILDINGS: BUILDINGS,

    init: function(canvasEl) {
      this.canvas = canvasEl;
      this.ctx = canvasEl.getContext('2d');
      this.resize();
      var self = this;
      window.addEventListener('resize', function() { self.resize(); });

      // Click/tap-to-move with building detection
      function handleMapTap(clientX, clientY) {
        if (!Game.state.avatar || UI.panelOpen || UI.modalActive()) return;
        var rect = canvasEl.getBoundingClientRect();
        var worldX = clientX - rect.left + self.camera.x;
        var worldY = clientY - rect.top + self.camera.y;

        // Check if tapped on a building
        var tappedBuilding = null;
        for (var i = 0; i < BUILDINGS.length; i++) {
          var b = BUILDINGS[i];
          if (worldX >= b.x && worldX <= b.x + b.w && worldY >= b.y && worldY <= b.y + b.h) {
            tappedBuilding = b;
            break;
          }
        }

        if (tappedBuilding) {
          // Walk to building entrance and auto-enter
          self.moveTarget = { x: tappedBuilding.x + tappedBuilding.w / 2, y: tappedBuilding.y + tappedBuilding.h + 30 };
          self.autoEnterBuilding = tappedBuilding;
        } else {
          self.moveTarget = { x: worldX, y: worldY };
          self.autoEnterBuilding = null;
        }
      }

      canvasEl.addEventListener('click', function(e) { handleMapTap(e.clientX, e.clientY); });
      canvasEl.addEventListener('touchend', function(e) {
        if (e.changedTouches.length !== 1) return;
        var t = e.changedTouches[0];
        handleMapTap(t.clientX, t.clientY);
      });
    },

    resize: function() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = this.canvas.clientWidth * dpr;
      this.canvas.height = this.canvas.clientHeight * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    updateAvatar: function(dt, keys) {
      var av = Game.state.avatar;
      if (!av) return;

      var dx = 0, dy = 0;

      // Keyboard input
      if (keys.left)  dx -= 1;
      if (keys.right) dx += 1;
      if (keys.up)    dy -= 1;
      if (keys.down)  dy += 1;

      // Cancel click-to-move if keyboard is used
      if (dx !== 0 || dy !== 0) {
        this.moveTarget = null;
      }

      // Click-to-move
      if (this.moveTarget && dx === 0 && dy === 0) {
        var tdx = this.moveTarget.x - av.x;
        var tdy = this.moveTarget.y - av.y;
        var dist = Math.sqrt(tdx * tdx + tdy * tdy);
        if (dist < 12) {
          this.moveTarget = null;
          // Auto-enter building if we walked to one
          if (this.autoEnterBuilding && !UI.panelOpen) {
            var ab = this.autoEnterBuilding;
            this.autoEnterBuilding = null;
            // Check if we're actually nearby
            if (this.getNearbyBuilding() === ab) {
              setTimeout(function() { UI.showPanel(ab); }, 100);
            }
          }
        } else {
          dx = tdx / dist;
          dy = tdy / dist;
        }
      }

      // Normalize diagonal for keyboard
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

      // Axis-separated collision (sliding)
      if (!this.collidesBuilding(newX, av.y)) {
        av.x = newX;
      } else {
        this.moveTarget = null; // Stop click-to-move on collision
      }
      if (!this.collidesBuilding(av.x, newY)) {
        av.y = newY;
      } else {
        this.moveTarget = null;
      }

      // Clamp to world
      av.x = Math.max(AVATAR_SIZE, Math.min(WORLD_W - AVATAR_SIZE, av.x));
      av.y = Math.max(AVATAR_SIZE, Math.min(WORLD_H - AVATAR_SIZE, av.y));

      // Check nearby building
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
        // Distance from avatar center to building edge
        var cx = Math.max(b.x, Math.min(av.x, b.x + b.w));
        var cy = Math.max(b.y, Math.min(av.y, b.y + b.h));
        var dist = Math.sqrt((av.x - cx) * (av.x - cx) + (av.y - cy) * (av.y - cy));
        if (dist < INTERACT_DIST) {
          return b;
        }
      }
      return null;
    },

    updateCamera: function(dt) {
      var av = Game.state.avatar;
      if (!av) return;

      var vw = this.canvas.clientWidth;
      var vh = this.canvas.clientHeight;
      var targetX = av.x - vw / 2;
      var targetY = av.y - vh / 2;

      // Clamp target
      targetX = Math.max(0, Math.min(WORLD_W - vw, targetX));
      targetY = Math.max(0, Math.min(WORLD_H - vh, targetY));

      // Smooth lerp
      this.camera.x += (targetX - this.camera.x) * 0.1;
      this.camera.y += (targetY - this.camera.y) * 0.1;
    },

    render: function() {
      var ctx = this.ctx;
      var vw = this.canvas.clientWidth;
      var vh = this.canvas.clientHeight;

      // Clear
      ctx.fillStyle = '#0a0a18';
      ctx.fillRect(0, 0, vw, vh);

      ctx.save();
      ctx.translate(-this.camera.x, -this.camera.y);

      // Draw ground pattern (subtle grid)
      ctx.strokeStyle = '#0f0f22';
      ctx.lineWidth = 1;
      for (var gx = 0; gx < WORLD_W; gx += 64) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, WORLD_H);
        ctx.stroke();
      }
      for (var gy = 0; gy < WORLD_H; gy += 64) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(WORLD_W, gy);
        ctx.stroke();
      }

      // Draw roads
      ctx.fillStyle = '#0d0d20';
      for (var ri = 0; ri < H_ROADS.length; ri++) {
        var hr = H_ROADS[ri];
        ctx.fillRect(0, hr.y, WORLD_W, hr.h);
        // Road markings
        ctx.strokeStyle = '#1a1a30';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.moveTo(0, hr.y + hr.h / 2);
        ctx.lineTo(WORLD_W, hr.y + hr.h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      for (var vi = 0; vi < V_ROADS.length; vi++) {
        var vr = V_ROADS[vi];
        ctx.fillRect(vr.x, 0, vr.w, WORLD_H);
        ctx.strokeStyle = '#1a1a30';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.moveTo(vr.x + vr.w / 2, 0);
        ctx.lineTo(vr.x + vr.w / 2, WORLD_H);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw buildings
      for (var bi = 0; bi < BUILDINGS.length; bi++) {
        this.drawBuilding(BUILDINGS[bi]);
      }

      // Draw avatar
      this.drawAvatar();

      // Draw click-to-move target
      if (this.moveTarget) {
        ctx.strokeStyle = 'rgba(247,147,26,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.moveTarget.x, this.moveTarget.y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw interaction prompt
      if (this.nearbyBuilding && !UI.panelOpen) {
        this.drawPrompt(this.nearbyBuilding);
      }

      // Draw floating texts
      for (var fi = 0; fi < Game.floatingTexts.length; fi++) {
        var ft = Game.floatingTexts[fi];
        var alpha = 1 - ft.age;
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 14px -apple-system, system-ui, sans-serif';
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1;

      ctx.restore();
    },

    drawBuilding: function(b) {
      var ctx = this.ctx;
      var isNearby = (this.nearbyBuilding === b);
      var r = 8;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.roundRect(ctx, b.x + 4, b.y + 4, b.w, b.h, r);
      ctx.fill();

      // Building body
      ctx.fillStyle = b.color + '22';
      this.roundRect(ctx, b.x, b.y, b.w, b.h, r);
      ctx.fill();

      // Border
      ctx.strokeStyle = isNearby ? '#f7931a' : (b.color + '88');
      ctx.lineWidth = isNearby ? 3 : 2;
      this.roundRect(ctx, b.x, b.y, b.w, b.h, r);
      ctx.stroke();

      // Roof accent line
      ctx.fillStyle = b.color + '44';
      ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, 6);

      // Emoji
      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.emoji, b.x + b.w / 2, b.y + b.h / 2 - 10);

      // Label
      ctx.font = 'bold 11px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#e8e8f0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(b.name, b.x + b.w / 2, b.y + b.h / 2 + 14);
    },

    drawAvatar: function() {
      var av = Game.state.avatar;
      if (!av) return;
      var ctx = this.ctx;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(av.x, av.y + 14, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sprite emoji
      ctx.font = '26px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(av.sprite, av.x, av.y);

      // Name tag
      ctx.font = 'bold 9px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#f7931a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(av.name, av.x, av.y + 16);
    },

    drawPrompt: function(b) {
      var av = Game.state.avatar;
      var ctx = this.ctx;
      var text = 'Press Enter';
      ctx.font = 'bold 11px -apple-system, system-ui, sans-serif';
      var tw = ctx.measureText(text).width;

      // Background pill
      ctx.fillStyle = 'rgba(16,16,37,0.85)';
      this.roundRect(ctx, av.x - tw / 2 - 10, av.y - 36, tw + 20, 22, 11);
      ctx.fill();

      ctx.strokeStyle = '#f7931a';
      ctx.lineWidth = 1;
      this.roundRect(ctx, av.x - tw / 2 - 10, av.y - 36, tw + 20, 22, 11);
      ctx.stroke();

      ctx.fillStyle = '#f7931a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, av.x, av.y - 25);
    },

    roundRect: function(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    },
  };

  window.Town = Town;
})();
