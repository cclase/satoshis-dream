<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>Satoshi's Dream - V2.5</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; font-family: -apple-system, system-ui, sans-serif; }
        :root {
            --bg: #050510; --card: #101025; --border: #1a1a35;
            --gold: #f7931a; --green: #00d4aa; --red: #ff4466;
            --text: #e8e8f0; --dim: #6a6a8a; --blue: #4a9eff; --purple: #a855f7;
        }
        body { background: var(--bg); color: var(--text); height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
        .header { padding: 10px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
        .stats-bar { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 10px 16px; flex-shrink: 0; }
        .stat-box { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 8px; text-align: center; }
        .stat-label { font-size: 10px; color: var(--dim); text-transform: uppercase; }
        .stat-val { font-size: 14px; font-weight: 800; margin-top: 2px; }
        .thermal-wrap { padding: 0 16px 10px; flex-shrink: 0; }
        .thermal-meta { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 4px; font-weight: 700; }
        .thermal-bar { height: 8px; background: var(--card); border-radius: 4px; border: 1px solid var(--border); overflow: hidden; }
        .thermal-fill { height: 100%; width: 0%; background: linear-gradient(90deg, var(--blue), var(--red)); transition: width 0.3s; }
        .tabs { display: flex; padding: 0 16px 10px; gap: 6px; overflow-x: auto; flex-shrink: 0; border-bottom: 1px solid var(--border); }
        .tab { padding: 8px 14px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; font-size: 11px; font-weight: 700; color: var(--dim); cursor: pointer; white-space: nowrap; }
        .tab.active { color: var(--gold); border-color: var(--gold); background: rgba(247,147,26,0.1); }
        .multi-bar { display: none; padding: 8px 16px; gap: 6px; justify-content: flex-end; flex-shrink: 0; }
        .m-btn { padding: 4px 10px; font-size: 10px; font-weight: 800; border-radius: 6px; border: 1px solid var(--border); background: var(--card); color: var(--dim); cursor: pointer; }
        .m-btn.active { border-color: var(--blue); color: var(--blue); }
        .panels { flex: 1; position: relative; }
        .panel { position: absolute; inset: 0; padding: 16px; display: none; flex-direction: column; gap: 10px; overflow-y: auto; }
        .panel.active { display: flex; }
        .mine-btn-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; }
        #clickBtn { width: 140px; height: 140px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #fdb347, #f7931a); display: flex; align-items: center; justify-content: center; font-size: 60px; cursor: pointer; user-select: none; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
        #clickBtn:active { transform: scale(0.95); }
        .card { background: var(--card); border: 1px solid var(--border); padding: 12px; border-radius: 14px; display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .card.locked { opacity: 0.4; pointer-events: none; }
        .card .icon { font-size: 26px; }
        .card .info { flex: 1; }
        .card .name { font-size: 14px; font-weight: 800; }
        .card .sub { font-size: 10px; color: var(--dim); margin-top: 2px; }
        .card .cost { font-size: 12px; font-weight: 800; color: var(--gold); text-align: right; }
        .card.dark .cost { color: var(--purple); }
        #farmCanvas { background: #08081a; border-radius: 12px; border: 1px solid var(--border); width: 100%; height: 260px; }
        .btn { border: none; padding: 12px; border-radius: 10px; font-weight: 800; cursor: pointer; width: 100%; }
        .btn-red { background: var(--red); color: white; }
        .btn-green { background: var(--green); color: var(--bg); }
        .btn-purple { background: var(--purple); color: white; }
        .toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: var(--card); border: 1px solid var(--gold); padding: 10px 20px; border-radius: 30px; font-size: 12px; font-weight: 700; opacity: 0; transition: 0.3s; pointer-events: none; z-index: 999; }
        .toast.show { opacity: 1; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">SATOSHI'S DREAM</div>
        <div class="ticker">BTC <span id="btcPrice">$0</span></div>
    </div>
    <div class="stats-bar">
        <div class="stat-box"><div class="stat-label">Sats</div><div class="stat-val" id="statSats" style="color:var(--gold);">0</div></div>
        <div class="stat-box"><div class="stat-label">USD</div><div class="stat-val" id="statUsd" style="color:var(--green);">$0.00</div></div>
        <div class="stat-box"><div class="stat-label">Tokens</div><div class="stat-val" id="statTokens" style="color:var(--purple);">0</div></div>
    </div>
    <div class="thermal-wrap">
        <div class="thermal-meta"><span>HEAT</span><span id="heatText">0%</span></div>
        <div class="thermal-bar"><div id="heatFill" class="thermal-fill"></div></div>
    </div>
    <div class="tabs">
        <div class="tab active" data-target="mine">Mine</div>
        <div class="tab" data-target="hardware">Hardware</div>
        <div class="tab" data-target="dark">Dark Web</div>
        <div class="tab" data-target="farm">Farm</div>
        <div class="tab" data-target="market">Market</div>
    </div>
    <div class="multi-bar" id="multiBar">
        <div class="m-btn active" data-val="1">x1</div>
        <div class="m-btn" data-val="5">x5</div>
        <div class="m-btn" data-val="10">x10</div>
        <div class="m-btn" data-val="-1">MAX</div>
    </div>
    <div class="panels">
        <div class="panel active" id="panelMine">
            <div class="mine-btn-wrap">
                <div id="clickBtn">₿</div>
                <button class="btn btn-red" style="width:160px;" id="ventBtn">VENT HEAT</button>
            </div>
        </div>
        <div class="panel" id="panelHardware"></div>
        <div class="panel" id="panelDark"></div>
        <div class="panel" id="panelFarm"><canvas id="farmCanvas"></canvas></div>
        <div class="panel" id="panelMarket">
            <div class="stat-box"><div class="stat-label">Lifetime Sats</div><div id="statTotal" class="stat-val">0</div></div>
            <div style="background:var(--card); border:1px solid var(--purple); padding:15px; border-radius:14px; text-align:center; margin-top:10px;">
                <p style="font-size:10px; margin-bottom:10px;">Reset for Genesis Tokens (+10% prod each)</p>
                <button id="prestigeBtn" class="btn btn-purple">PRESTIGE</button>
            </div>
            <button class="btn btn-green" style="margin-top:10px;" id="sellHalf">SELL 50%</button>
            <button class="btn btn-green" style="margin-top:10px;" id="sellAll">SELL ALL</button>
        </div>
    </div>
    <div class="toast" id="toast"></div>
<script>
    const HARDWARE = [
        { id:'u1', name:'Laptop', icon:'💻', base:15, rate:1, heat:0.2, cur:'sats' },
        { id:'u2', name:'Desktop', icon:'🖥️', base:150, rate:6, heat:0.5, cur:'sats' },
        { id:'u3', name:'GPU Rig', icon:'🎮', base:2000, rate:35, heat:1.5, cur:'sats' },
        { id:'u4', name:'ASIC Miner', icon:'⚡', base:40000, rate:450, heat:8.0, cur:'sats' },
        { id:'u5', name:'Megafarm', icon:'🏭', base:1000000, rate:9500, heat:50.0, cur:'sats' }
    ];
    const DARK_WEB = [
        { id:'d1', name:'Botnet', icon:'💀', base:100, rate:1200, heat:0, cur:'usd', desc:'Passive hash' },
        { id:'d2', name:'Coolant', icon:'❄️', base:500, rate:0, heat:-0.05, cur:'usd', desc:'-Heat gen' },
        { id:'d3', name:'Relay', icon:'🛰️', base:10000, rate:25000, heat:15, cur:'usd', desc:'Deep-web nodes' }
    ];
    let S = { sats: 0, usd: 0, totalSats: 0, heat: 0, owned: {}, tokens: 0, price: 65000, last: Date.now() };
    let buyMulti = 1;
    function load() {
        const saved = localStorage.getItem('sd_v2_5');
        if (saved) S = Object.assign(S, JSON.parse(saved));
        [...HARDWARE, ...DARK_WEB].forEach(u => { if (S.owned[u.id] === undefined) S.owned[u.id] = 0; });
    }
    function save() { localStorage.setItem('sd_v2_5', JSON.stringify(S)); }
    function getBulkCost(u, n) {
        let total = 0;
        let o = S.owned[u.id] || 0;
        for (let i = 0; i < n; i++) total += Math.floor(u.base * Math.pow(1.18, o + i));
        return total;
    }
    function getMax(u) {
        let bal = u.cur === 'sats' ? S.sats : S.usd;
        let c = 0;
        while (getBulkCost(u, c + 1) <= bal && c < 100) c++;
        return c;
    }
    function updateUI() {
        document.getElementById('statSats').textContent = Math.floor(S.sats).toLocaleString();
        document.getElementById('statUsd').textContent = '$' + S.usd.toFixed(2);
        document.getElementById('statTokens').textContent = S.tokens;
        document.getElementById('btcPrice').textContent = '$' + Math.floor(S.price).toLocaleString();
        document.getElementById('heatText').textContent = Math.floor(S.heat) + '%';
        document.getElementById('heatFill').style.width = S.heat + '%';
        document.getElementById('statTotal').textContent = Math.floor(S.totalSats).toLocaleString();
        const pending = Math.floor(Math.sqrt(S.totalSats / 1000000));
        const pBtn = document.getElementById('prestigeBtn');
        pBtn.textContent = `PRESTIGE (+${pending})`;
        pBtn.disabled = pending < 1;
    }
    function renderLists() {
        const hCont = document.getElementById('panelHardware');
        const dCont = document.getElementById('panelDark');
        hCont.innerHTML = ''; dCont.innerHTML = '';
        HARDWARE.forEach(u => {
            let n = buyMulti === -1 ? Math.max(1, getMax(u)) : buyMulti;
            let cost = getBulkCost(u, n);
            const card = document.createElement('div');
            card.className = `card ${S.sats < cost ? 'locked' : ''}`;
            card.innerHTML = `<div class="icon">${u.icon}</div><div class="info"><div class="name">${u.name} [${S.owned[u.id]}]</div><div class="sub">+${u.rate} sats/s | x${n}</div></div><div class="cost">${cost.toLocaleString()} sats</div>`;
            card.onclick = () => { if (S.sats >= cost) { S.sats -= cost; S.owned[u.id] += n; renderLists(); } };
            hCont.appendChild(card);
        });
        DARK_WEB.forEach(u => {
            let n = buyMulti === -1 ? Math.max(1, getMax(u)) : buyMulti;
            let cost = getBulkCost(u, n);
            const card = document.createElement('div');
            card.className = `card dark ${S.usd < cost ? 'locked' : ''}`;
            card.innerHTML = `<div class="icon">${u.icon}</div><div class="info"><div class="name">${u.name} [${S.owned[u.id]}]</div><div class="sub">${u.desc}</div></div><div class="cost">$${cost.toLocaleString()}</div>`;
            card.onclick = () => { if (S.usd >= cost) { S.usd -= cost; S.owned[u.id] += n; renderLists(); } };
            dCont.appendChild(card);
        });
    }
    function drawFarm() {
        const canvas = document.getElementById('farmCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let x = 20, y = 30;
        HARDWARE.forEach(u => {
            for (let i = 0; i < Math.min(S.owned[u.id], 100); i++) {
                ctx.font = '16px serif'; ctx.fillText(u.icon, x, y);
                x += 22; if (x > canvas.width - 25) { x = 20; y += 25; }
            }
        });
    }
    function tick() {
        const now = Date.now(); const dt = (now - S.last) / 1000; S.last = now;
        let rate = 0;
        HARDWARE.forEach(u => rate += (S.owned[u.id] || 0) * u.rate);
        DARK_WEB.forEach(u => rate += (S.owned[u.id] || 0) * u.rate);
        let mul = (1 + (S.tokens * 0.1)); if (S.heat > 90) mul *= 0.1;
        const gain = rate * mul * dt; S.sats += gain; S.totalSats += gain;
        let hGen = 0;
        HARDWARE.forEach(u => hGen += (S.owned[u.id] || 0) * Math.max(0.01, u.heat + (S.owned['d2'] * -0.05)));
        DARK_WEB.forEach(u => hGen += (S.owned[u.id] || 0) * u.heat);
        S.heat = Math.min(100, Math.max(0, S.heat + (hGen / 15 * dt) - (4 * dt)));
        S.price *= (1 + (Math.random() - 0.499) * 0.0005);
        updateUI();
        if (document.getElementById('panelFarm').classList.contains('active')) drawFarm();
    }
    document.getElementById('clickBtn').onclick = () => {
        let gain = 1 * (1 + (S.tokens * 0.1)); S.sats += gain; S.totalSats += gain; S.heat = Math.min(100, S.heat + 0.05); updateUI();
    };
    document.querySelectorAll('.tab').forEach(t => {
        t.onclick = (e) => {
            const target = e.currentTarget.dataset.target;
            document.querySelectorAll('.tab, .panel').forEach(x => x.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.getElementById('panel' + target.charAt(0).toUpperCase() + target.slice(1)).classList.add('active');
            document.getElementById('multiBar').style.display = (target === 'hardware' || target === 'dark') ? 'flex' : 'none';
            if (target === 'farm') { const c = document.getElementById('farmCanvas'); c.width = c.offsetWidth; c.height = c.offsetHeight; }
            renderLists();
        };
    });
    document.querySelectorAll('.m-btn').forEach(b => {
        b.onclick = (e) => {
            buyMulti = parseInt(e.target.dataset.val);
            document.querySelectorAll('.m-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active'); renderLists();
        };
    });
    document.getElementById('ventBtn').onclick = () => { S.heat = Math.max(0, S.heat - 20); updateUI(); };
    document.getElementById('sellHalf').onclick = () => { const gain = (S.sats * 0.5 / 1e8) * S.price; S.sats *= 0.5; S.usd += gain; updateUI(); };
    document.getElementById('sellAll').onclick = () => { const gain = (S.sats / 1e8) * S.price; S.sats = 0; S.usd += gain; updateUI(); };
    document.getElementById('prestigeBtn').onclick = () => {
        const p = Math.floor(Math.sqrt(S.totalSats / 1000000));
        if (confirm(`Reset for ${p} tokens?`)) { S.tokens += p; S.sats = 0; S.usd = 0; S.totalSats = 0; S.heat = 0; S.owned = {}; renderLists(); save(); }
    };
    window.onload = () => { load(); renderLists(); setInterval(tick, 100); setInterval(save, 5000); };
</script>
</body>
</html>