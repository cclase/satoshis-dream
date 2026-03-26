(function() {
  'use strict';
  var ctx = null;
  var muted = localStorage.getItem('sd_muted') === 'true';

  function init() {
    if (ctx) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }

  function play(freq, type, duration, vol) {
    if (muted || !ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.value = vol || 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  window.Sound = {
    init: function() { init(); },
    toggleMute: function() {
      muted = !muted;
      localStorage.setItem('sd_muted', muted);
      return muted;
    },
    isMuted: function() { return muted; },

    coinCollect: function() { init(); play(800, 'sine', 0.08, 0.15); setTimeout(function(){play(1200, 'sine', 0.08, 0.12);}, 50); },
    tapMine: function() { init(); play(150, 'triangle', 0.06, 0.12); setTimeout(function(){play(2000, 'sine', 0.04, 0.08);}, 30); },
    purchase: function() { init(); play(1000, 'sine', 0.06, 0.1); setTimeout(function(){play(1500, 'sine', 0.06, 0.1);}, 60); setTimeout(function(){play(2000, 'sine', 0.06, 0.1);}, 120); },
    sell: function() { init(); if(!ctx) return; var o=ctx.createOscillator(),g=ctx.createGain(); o.type='sine'; o.frequency.setValueAtTime(400,ctx.currentTime); o.frequency.linearRampToValueAtTime(1200,ctx.currentTime+0.25); g.gain.value=0.1; g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3); o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime); o.stop(ctx.currentTime+0.3); },
    error: function() { init(); play(100, 'sawtooth', 0.12, 0.08); },
    levelUp: function() { init(); play(500,'sine',0.1,0.12); setTimeout(function(){play(700,'sine',0.1,0.12);},100); setTimeout(function(){play(900,'sine',0.1,0.12);},200); setTimeout(function(){play(1200,'sine',0.15,0.12);},300); },
    toast: function() { init(); play(600, 'sine', 0.05, 0.06); },
    doorOpen: function() { init(); if(!ctx) return; var buf=ctx.createBuffer(1,ctx.sampleRate*0.15,ctx.sampleRate),d=buf.getChannelData(0); for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.max(0,1-i/d.length); var src=ctx.createBufferSource(),g=ctx.createGain(); src.buffer=buf; g.gain.value=0.08; src.connect(g); g.connect(ctx.destination); src.start(); },
    policeSiren: function() { init(); play(800,'square',0.3,0.1); setTimeout(function(){play(1000,'square',0.3,0.1);},300); setTimeout(function(){play(800,'square',0.3,0.1);},600); },
  };
})();
