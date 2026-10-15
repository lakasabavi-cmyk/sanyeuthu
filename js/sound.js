/* ============================================================
   sound.js — Hiệu ứng âm thanh tổng hợp bằng Web Audio (không cần file)
   ★ v1.45
   ============================================================ */

var SFX = (function() {
  var ctx = null;
  var master = null;
  var musicGain = null;
  var muted = false;
  var musicMuted = false;
  var sfxVolume = 1;
  var musicVolume = 1;
  var musicTimer = null;
  var musicStep = 0;
  try {
    muted = localStorage.getItem('sfx_muted') === '1';
    musicMuted = localStorage.getItem('music_muted') === '1';
    var sv = parseFloat(localStorage.getItem('sfx_volume'));
    var mv = parseFloat(localStorage.getItem('music_volume'));
    if (!isNaN(sv)) sfxVolume = Math.min(1, Math.max(0, sv));
    if (!isNaN(mv)) musicVolume = Math.min(1, Math.max(0, mv));
  } catch (e) {}

  function ensureCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35 * sfxVolume;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.16 * musicVolume;
      musicGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function ensure() {
    if (muted) return null;
    return ensureCtx();
  }

  // Nốt nhạc nền: attack/release chậm, đi vào bus riêng
  function musicNote(freq, start, dur, type, vol) {
    var c = ctx;
    var t = c.currentTime + start;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  var CHORDS = [
    [130.8, 196, 261.6, 329.6],
    [110, 164.8, 220, 329.6],
    [87.3, 130.8, 220, 261.6],
    [98, 146.8, 196, 293.7]
  ];
  var SCALE = [523.3, 587.3, 659.3, 784, 880, 1046.5];

  function musicBar() {
    if (!ctx || musicMuted || document.hidden) return;
    var chord = CHORDS[musicStep % CHORDS.length];
    chord.forEach(function(f, i) { musicNote(f, i * 0.12, 5.6, 'sine', 0.22); });
    var notes = 3 + Math.floor(Math.random() * 3);
    for (var n = 0; n < notes; n++) {
      var f = SCALE[Math.floor(Math.random() * SCALE.length)];
      musicNote(f, 0.8 + n * (1 + Math.random() * 0.7), 2.4, 'triangle', 0.1);
    }
    musicStep++;
  }

  function startMusic() {
    if (musicMuted || musicTimer) return;
    if (!ensureCtx()) return;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(Math.max(0.0001, 0.16 * musicVolume), ctx.currentTime + 1.5);
    musicBar();
    musicTimer = setInterval(musicBar, 6000);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (musicGain && ctx) {
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
      musicGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    }
  }

  // Một nốt: tần số có thể trượt từ f0 sang f1
  function tone(f0, f1, start, dur, type, vol) {
    var c = ensure();
    if (!c) return;
    var t = c.currentTime + start;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.5, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(start, dur, vol, freq) {
    var c = ensure();
    if (!c) return;
    var t = c.currentTime + start;
    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource();
    src.buffer = buf;
    var filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq || 1800, t);
    filter.frequency.exponentialRampToValueAtTime((freq || 1800) * 0.3, t + dur);
    var g = c.createGain();
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t);
  }

  var sounds = {
    click: function() { tone(660, 880, 0, 0.07, 'triangle', 0.35); },
    screen: function() { tone(440, 660, 0, 0.1, 'sine', 0.3); tone(660, 990, 0.07, 0.12, 'sine', 0.25); },
    spawn: function() {
      tone(330, 990, 0, 0.35, 'sine', 0.4);
      tone(495, 1480, 0.05, 0.4, 'triangle', 0.2);
      noise(0, 0.4, 0.12, 4000);
    },
    throwBall: function() { noise(0, 0.28, 0.35, 2600); tone(500, 200, 0, 0.25, 'sawtooth', 0.15); },
    success: function() {
      [523, 659, 784, 1047, 1319].forEach(function(f, i) {
        tone(f, f, i * 0.09, 0.3, 'triangle', 0.4);
        tone(f * 2, f * 2, i * 0.09, 0.2, 'sine', 0.12);
      });
    },
    fail: function() {
      tone(392, 330, 0, 0.22, 'sawtooth', 0.25);
      tone(294, 196, 0.2, 0.4, 'sawtooth', 0.25);
    },
    levelUp: function() {
      [392, 523, 659, 784, 1047].forEach(function(f, i) { tone(f, f, i * 0.08, 0.25, 'square', 0.18); });
    },
    toast: function() { tone(880, 880, 0, 0.08, 'sine', 0.2); tone(1175, 1175, 0.08, 0.1, 'sine', 0.2); }
  };

  function play(name) {
    try { if (sounds[name]) sounds[name](); } catch (e) {}
  }

  function setMuted(value) {
    muted = !!value;
    try { localStorage.setItem('sfx_muted', muted ? '1' : '0'); } catch (e) {}
  }

  function setSfxVolume(v) {
    sfxVolume = Math.min(1, Math.max(0, v));
    try { localStorage.setItem('sfx_volume', String(sfxVolume)); } catch (e) {}
    if (master) master.gain.value = 0.35 * sfxVolume;
  }

  function setMusicVolume(v) {
    musicVolume = Math.min(1, Math.max(0, v));
    try { localStorage.setItem('music_volume', String(musicVolume)); } catch (e) {}
    if (musicGain && ctx && musicTimer) {
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
      musicGain.gain.linearRampToValueAtTime(Math.max(0.0001, 0.16 * musicVolume), ctx.currentTime + 0.1);
    }
  }

  function setMusicMuted(value) {
    musicMuted = !!value;
    try { localStorage.setItem('music_muted', musicMuted ? '1' : '0'); } catch (e) {}
    if (musicMuted) stopMusic(); else startMusic();
  }

  // Trình duyệt chỉ cho phát âm sau thao tác người dùng
  document.addEventListener('pointerdown', function(event) {
    ensure();
    startMusic();
    var target = event.target && event.target.closest
      ? event.target.closest('button, .coll-card, .pill-item, .ball-item, .elem-btn, [onclick]')
      : null;
    if (target) play('click');
  }, true);

  return {play:play, setMuted:setMuted, isMuted:function() { return muted; },
    setMusicMuted:setMusicMuted, isMusicMuted:function() { return musicMuted; },
    setSfxVolume:setSfxVolume, getSfxVolume:function() { return sfxVolume; },
    setMusicVolume:setMusicVolume, getMusicVolume:function() { return musicVolume; }};
})();

function syncSoundSettings() {
  [['sfx', SFX.getSfxVolume()], ['music', SFX.getMusicVolume()]].forEach(function(pair) {
    var slider = document.getElementById('vol-' + pair[0]);
    var label = document.getElementById('vol-' + pair[0] + '-val');
    var pct = Math.round(pair[1] * 100);
    if (slider) slider.value = pct;
    if (label) label.textContent = pct + '%';
  });
  var sfx = document.getElementById('toggle-sfx');
  var music = document.getElementById('toggle-music');
  if (sfx) {
    sfx.classList.toggle('on', !SFX.isMuted());
    sfx.setAttribute('aria-checked', String(!SFX.isMuted()));
  }
  if (music) {
    music.classList.toggle('on', !SFX.isMusicMuted());
    music.setAttribute('aria-checked', String(!SFX.isMusicMuted()));
  }
}

function setVolumeFromSlider(kind, value) {
  var v = Number(value) / 100;
  if (kind === 'sfx') SFX.setSfxVolume(v); else SFX.setMusicVolume(v);
  syncSoundSettings();
}

function stepVolume(kind, delta) {
  var current = kind === 'sfx' ? SFX.getSfxVolume() : SFX.getMusicVolume();
  var next = Math.round((current + delta) * 20) / 20;
  setVolumeFromSlider(kind, Math.min(1, Math.max(0, next)) * 100);
  if (kind === 'sfx') SFX.play('click');
}

function toggleSfxSetting() {
  SFX.setMuted(!SFX.isMuted());
  syncSoundSettings();
  SFX.play('click');
}

function toggleMusicSetting() {
  SFX.setMusicMuted(!SFX.isMusicMuted());
  syncSoundSettings();
}

document.addEventListener('DOMContentLoaded', syncSoundSettings);
