/* ============================================================
   gameflow.js — Area System + Compass + Bùa nhặt
   ★ v1.50: La bàn cập nhật liên tục theo GPS + hướng quay
   ★ Area: 2 yêu thú + 2 bùa mỗi lần reset
   ★ Bùa nhặt 100% thành công
   ============================================================ */

/* ================================================================
   ★★★ CONFIG ★★★
   ================================================================ */
var FLOW = {
  MAX_CAUGHT: 2,
  MAX_ESCAPE: 3,
  RESET_MS: 60 * 60 * 1000,
  MOVE_METERS: 50,
  EXPLORE_MIN_S: 30,
  EXPLORE_MAX_S: 120,
  AREA_CREATURES: 2,
  AREA_BALLS: 2
};

/* ================================================================
   ★★★ AREA STATE ★★★
   ================================================================ */
function initArea() {
  if (!GS.area) {
    GS.area = {
      caught: 0,
      escaped: 0,
      ballsTaken: 0,
      totalBalls: FLOW.AREA_BALLS,
      totalCreatures: FLOW.AREA_CREATURES,
      lastReset: Date.now(),
      lat: playerLat || 0,
      lng: playerLng || 0
    };
    saveState();
  }
}

function resetArea() {
  GS.area = {
    caught: 0,
    escaped: 0,
    ballsTaken: 0,
    totalBalls: FLOW.AREA_BALLS,
    totalCreatures: FLOW.AREA_CREATURES,
    lastReset: Date.now(),
    lat: playerLat || 0,
    lng: playerLng || 0
  };
  saveState();
  updateAreaStatus();
  return FLOW.AREA_CREATURES;
}

function isAreaExhausted() {
  if (!GS.area) return false;
  return (GS.area.caught >= FLOW.AREA_CREATURES) || (GS.area.escaped >= FLOW.MAX_ESCAPE);
}

function isBallAreaExhausted() {
  if (!GS.area) return true;
  return GS.area.ballsTaken >= FLOW.AREA_BALLS;
}

function isResetDue() {
  if (!GS.area) return true;
  return (Date.now() - GS.area.lastReset) >= FLOW.RESET_MS;
}

function hasMovedEnough() {
  if (!GS.area || !GS.area.lat || !GS.area.lng) return true;
  var R = 6371000;
  var dLat = (playerLat - GS.area.lat) * Math.PI / 180;
  var dLng = (playerLng - GS.area.lng) * Math.PI / 180;
  var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos(GS.area.lat*Math.PI/180)*Math.cos(playerLat*Math.PI/180) *
    Math.sin(dLng/2)*Math.sin(dLng/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c) >= FLOW.MOVE_METERS;
}

function getTimeUntilReset() {
  if (!GS.area) return 0;
  var elapsed = Date.now() - GS.area.lastReset;
  return Math.max(0, FLOW.RESET_MS - elapsed);
}

function formatResetTime(ms) {
  var totalSec = Math.floor(ms / 1000);
  var h = Math.floor(totalSec / 3600);
  var m = Math.floor((totalSec % 3600) / 60);
  var s = totalSec % 60;
  return (h > 0 ? h + ':' : '') + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

/* ================================================================
   ★★★ AREA STATUS WIDGET — Dưới icon la bàn ★★★
   ================================================================ */
function createAreaStatusWidget() {
  var old = document.getElementById('area-status');
  if (old) old.remove();

  var el = document.createElement('div');
  el.className = 'area-status';
  el.id = 'area-status';
  el.innerHTML =
    '<div class="as-row">'
    + '<span class="as-icon">📍</span>'
    + '<span class="as-label">Tọa độ:</span>'
    + '<span class="as-val" id="as-coord">---</span>'
    + '</div>'
    + '<div class="as-row">'
    + '<span class="as-icon">🐾</span>'
    + '<span class="as-label">Yêu thú:</span>'
    + '<span class="as-val creature" id="as-creatures">2</span>'
    + '</div>'
    + '<div class="as-row">'
    + '<span class="as-icon">🎯</span>'
    + '<span class="as-label">Bùa:</span>'
    + '<span class="as-val ball" id="as-balls">2</span>'
    + '</div>'
    + '<div class="as-row">'
    + '<span class="as-icon">⏱</span>'
    + '<span class="as-label">Reset:</span>'
    + '<span class="as-val reset" id="as-reset">--:--</span>'
    + '</div>';

  /* Insert below HUD top-right */
  var hudTr = document.querySelector('.hud-tr');
  if (hudTr && hudTr.parentNode) {
    hudTr.parentNode.insertBefore(el, hudTr.nextSibling);
    el.style.position = 'absolute';
    el.style.top = (hudTr.offsetTop + hudTr.offsetHeight + 8) + 'px';
    el.style.right = '12px';
    el.style.zIndex = '300';
  }
}

function updateAreaStatus() {
  initArea();

  /* Coordinates */
  var coordEl = document.getElementById('as-coord');
  if (coordEl) {
    var latStr = (playerLat || 0).toFixed(5);
    var lngStr = (playerLng || 0).toFixed(5);
    coordEl.textContent = latStr + ' - ' + lngStr;
  }

  /* Creatures remaining */
  var crEl = document.getElementById('as-creatures');
  if (crEl) {
    var remaining = Math.max(0, FLOW.AREA_CREATURES - (GS.area.caught + GS.area.escaped));
    crEl.textContent = remaining;
    if (remaining <= 0) {
      crEl.classList.add('empty');
    } else {
      crEl.classList.remove('empty');
    }
  }

  /* Balls remaining */
  var blEl = document.getElementById('as-balls');
  if (blEl) {
    var bRemain = Math.max(0, GS.area.totalBalls - GS.area.ballsTaken);
    blEl.textContent = bRemain;
    if (bRemain <= 0) {
      blEl.classList.add('empty');
    } else {
      blEl.classList.remove('empty');
    }
  }

  /* Reset countdown */
  var rsEl = document.getElementById('as-reset');
  if (rsEl) {
    var remaining2 = getTimeUntilReset();
    if (remaining2 <= 0) {
      rsEl.textContent = 'Sẵn sàng!';
      rsEl.classList.add('ready');
    } else {
      rsEl.textContent = formatResetTime(remaining2);
      rsEl.classList.remove('ready');
    }
  }
}

/* ★ Start countdown timer (gọi 1 lần khi login) ★ */
var _areaStatusTimer = null;
function startAreaStatusTimer() {
  createAreaStatusWidget();
  updateAreaStatus();
  if (_areaStatusTimer) clearInterval(_areaStatusTimer);
  _areaStatusTimer = setInterval(function() {
    updateAreaStatus();
  }, 1000);
}

function stopAreaStatusTimer() {
  if (_areaStatusTimer) clearInterval(_areaStatusTimer);
  _areaStatusTimer = null;
}

/* ================================================================
   ★★★ COMPASS PROMPT — Sau đăng nhập ★★★
   ================================================================ */
function showCompassPrompt() {
  var old = document.getElementById('compass-prompt');
  if (old) old.remove();

  var el = document.createElement('div');
  el.className = 'compass-prompt active';
  el.id = 'compass-prompt';
  el.innerHTML =
    '<div class="cp-box">'
    + '<div class="cp-icon">🧭</div>'
    + '<div class="cp-title">La Bàn Định Vị</div>'
    + '<div class="cp-desc">Bạn có muốn sử dụng la bàn để định vị yêu thú và bùa xung quanh không?</div>'
    + '<div class="cp-buttons">'
    +   '<button class="cp-btn yes" onclick="handleCompassChoice(true)">✅ Có</button>'
    +   '<button class="cp-btn no" onclick="handleCompassChoice(false)">❌ Không</button>'
    + '</div></div>';
  document.body.appendChild(el);
}

function handleCompassChoice(yes) {
  var old = document.getElementById('compass-prompt');
  if (old) old.remove();

  initArea();
  startAreaStatusTimer();

  if (yes) {
    compassActive = true;
    activateCompass();
    startCompassTracking();

    if (isResetDue() || hasMovedEnough()) {
      var count = resetArea();
      showToast('🧭 Khu vực mới! Có <strong>' + count + ' yêu thú</strong> và <strong>' + FLOW.AREA_BALLS + ' bùa</strong>. Dùng kính chiếu yêu 🔍 để tìm!', 7000);
    } else {
      var rem = Math.max(0, FLOW.AREA_CREATURES - (GS.area.caught + GS.area.escaped));
      var bRem = Math.max(0, GS.area.totalBalls - GS.area.ballsTaken);
      showToast('🧭 Khu vực còn <strong>' + rem + ' yêu thú</strong> và <strong>' + bRem + ' bùa</strong>.', 5000);
    }
  } else {
    compassActive = false;
    showToast('🧭 La bàn tắt. Bạn vẫn có thể sử dụng các chức năng khác.', 3000);
  }
  saveState();
}

/* ================================================================
   ★★★ COMPASS TRACKING — Cập nhật liên tục ★★★
   ★ Fix: Arrow đổi theo thời gian + di chuyển thực
   ================================================================ */
var _compassHeading = 0;
var _compassInterval = null;
var _compassDeviceHeading = 0;

function startCompassTracking() {
  /* Device orientation → heading */
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then(function(state) {
      if (state === 'granted') {
        window.addEventListener('deviceorientationabsolute', onDeviceOrientation, true);
        window.addEventListener('deviceorientation', onDeviceOrientation, true);
      }
    }).catch(function(){});
  } else {
    window.addEventListener('deviceorientationabsolute', onDeviceOrientation, true);
    window.addEventListener('deviceorientation', onDeviceOrientation, true);
  }

  /* GPS update every 2s */
  if (_compassInterval) clearInterval(_compassInterval);
  _compassInterval = setInterval(function() {
    updateCompassArrow();
  }, 2000);
}

function onDeviceOrientation(e) {
  if (e.webkitCompassHeading != null) {
    _compassDeviceHeading = e.webkitCompassHeading;
  } else if (e.alpha != null) {
    /* Android: alpha = 0 is north, need to invert */
    _compassDeviceHeading = (360 - e.alpha) % 360;
  }
  updateCompassArrow();
}

function updateCompassArrow() {
  if (!compassActive) return;

  /* Find nearest creature target */
  var target = GS.currentTarget;
  if (!target) {
    /* No target → rotate slowly (idle) */
    var ring = document.getElementById('crosshair-ring');
    if (ring) ring.style.transform = 'rotate(' + (_compassDeviceHeading) + 'deg)';
    return;
  }

  /* Bearing from player to creature */
  var bearing = getBearing(playerLat, playerLng, target.lat, target.lng);

  /* Arrow rotation = bearing - device heading */
  var arrowAngle = bearing - _compassDeviceHeading;

  /* Apply to crosshair ring (arrow direction) */
  var ring = document.getElementById('crosshair-ring');
  if (ring) {
    ring.style.transition = 'transform 0.5s ease';
    ring.style.transform = 'rotate(' + arrowAngle + 'deg)';
  }

  /* Update distance */
  var dist = getDistance(playerLat, playerLng, target.lat, target.lng);
  var distEl = document.getElementById('ar-dist-val');
  if (distEl) distEl.textContent = '~' + Math.round(dist) + 'm';

  var hintEl = document.getElementById('ar-dist-hint');
  if (hintEl) {
    if (dist < 10) hintEl.textContent = '🎯 Gần rồi! Căn giữa!';
    else if (dist < 30) hintEl.textContent = '👉 Đi tiếp theo mũi tên';
    else hintEl.textContent = '🧭 Đi theo mũi tên';
  }
}

/* ★ Bearing calculation ★ */
function getBearing(lat1, lng1, lat2, lng2) {
  var φ1 = lat1 * Math.PI / 180;
  var φ2 = lat2 * Math.PI / 180;
  var Δλ = (lng2 - lng1) * Math.PI / 180;
  var y = Math.sin(Δλ) * Math.cos(φ2);
  var x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

/* ★ Distance in meters ★ */
function getDistance(lat1, lng1, lat2, lng2) {
  var R = 6371000;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/* ================================================================
   ★★★ SEARCH — Walk rồi hiện yêu thú hoặc bùa ★★★
   ================================================================ */
var _flowExploring = false;
var _flowExploreTimer = null;

function startSearchPhase() {
  if (_flowExploring) {
    showToast('🔍 Đang tìm kiếm...');
    return;
  }

  initArea();

  /* Check if area needs reset */
  if (isResetDue() || hasMovedEnough()) {
    resetArea();
    showToast('🗺️ Bản đồ đã reset! Có ' + FLOW.AREA_CREATURES + ' yêu thú + ' + FLOW.AREA_BALLS + ' bùa.', 4000);
    updateAreaStatus();
    return;
  }

  /* Check if area exhausted */
  var creaturesLeft = FLOW.AREA_CREATURES - (GS.area.caught + GS.area.escaped);
  var ballsLeft = GS.area.totalBalls - GS.area.ballsTaken;

  if (creaturesLeft <= 0 && ballsLeft <= 0) {
    showAreaExhausted();
    return;
  }

  /* ★ Ưu tiên: Bùa trước (100%), sau yêu thú ★ */
  if (ballsLeft > 0 && creaturesLeft <= 0) {
    /* Only balls left */
    startWalk(function() {
      spawnBallPickup();
    });
    return;
  }

  if (creaturesLeft > 0 && ballsLeft > 0) {
    /* Both → random 50/50 */
    if (Math.random() < 0.4) {
      startWalk(function() {
        spawnBallPickup();
      });
    } else {
      startWalk(function() {
        spawnCreature();
      });
    }
    return;
  }

  /* Only creatures left */
  startWalk(function() {
    spawnCreature();
  });
}

function startWalk(callback) {
  _flowExploring = true;
  var duration = FLOW.EXPLORE_MIN_S + Math.floor(Math.random() * (FLOW.EXPLORE_MAX_S - FLOW.EXPLORE_MIN_S));
  showExploreBar(duration, callback);
}

function showExploreBar(duration, callback) {
  var old = document.getElementById('explore-bar');
  if (old) old.remove();

  var el = document.createElement('div');
  el.className = 'explore-bar';
  el.id = 'explore-bar';
  el.innerHTML =
    '<div class="eb-top">'
    + '<span class="eb-icon">🔍</span>'
    + '<span class="eb-text">Đang tìm kiếm... Hãy đi bộ quanh khu vực</span>'
    + '<span class="eb-time" id="eb-time">' + duration + 's</span>'
    + '</div>'
    + '<div class="eb-progress"><div class="eb-fill" id="eb-fill" style="width:0%"></div></div>';
  document.body.appendChild(el);

  var startTime = Date.now();
  var totalMs = duration * 1000;

  _flowExploreTimer = setInterval(function() {
    var elapsed = Date.now() - startTime;
    var progress = Math.min(100, (elapsed / totalMs) * 100);
    var remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));

    var fill = document.getElementById('eb-fill');
    var time = document.getElementById('eb-time');
    if (fill) fill.style.width = progress + '%';
    if (time) time.textContent = remaining + 's';

    if (elapsed >= totalMs) {
      clearInterval(_flowExploreTimer);
      _flowExploreTimer = null;
      _flowExploring = false;
      var bar = document.getElementById('explore-bar');
      if (bar) bar.remove();
      if (callback) callback();
    }
  }, 250);
}

function cancelExplore() {
  if (_flowExploreTimer) clearInterval(_flowExploreTimer);
  _flowExploreTimer = null;
  _flowExploring = false;
  var el = document.getElementById('explore-bar');
  if (el) el.remove();
  showToast('🔍 Đã hủy tìm kiếm', 2000);
}

/* ================================================================
   ★★★ SPAWN CREATURE ★★★
   ================================================================ */
function spawnCreature() {
  var creature = generateCreature();
  GS.currentTarget = creature;
  saveState();

  showScreen('screen-ar');
  showCreatureOnAR(creature);
  updateAreaStatus();

  var el = ELEMENTS[creature.element] || ELEMENTS.KIM;
  showToast('🐾 Phát hiện yêu thú! ' + creature.name + ' — ' + el.icon + ' Lv.' + creature.level, 5000);
}

/* ================================================================
   ★★★ SPAWN BALL PICKUP — Nhặt bùa 100% ★★★
   ================================================================ */
function spawnBallPickup() {
  initArea();
  var ballKeys = BALL_KEYS || ['KIM','MOC','THUY','HOA','THO'];
  var ballKey = ballKeys[Math.floor(Math.random() * ballKeys.length)];
  var ball = BALLS[ballKey];

  /* Place near player */
  var angle = Math.random() * 360;
  var dist = 5 + Math.random() * 15;
  var bLat = playerLat + (dist * Math.cos(angle * Math.PI / 180)) / 111320;
  var bLng = playerLng + (dist * Math.sin(angle * Math.PI / 180)) / (111320 * Math.cos(playerLat * Math.PI / 180));

  showScreen('screen-ar');
  showBallOnAR(ballKey, ball, bLat, bLng);
  updateAreaStatus();
}

function showBallOnAR(ballKey, ball, bLat, bLng) {
  removeCreatureOnAR();

  var overlay = document.createElement('div');
  overlay.className = 'ar-ball-pickup active';
  overlay.id = 'ar-ball-pickup';
  overlay.innerHTML =
    '<div class="bp-info">'
    + '<div class="bp-name" style="color:' + ball.color + '">' + ball.icon + ' ' + ball.name + '</div>'
    + '<div class="bp-desc">' + ball.desc + '</div>'
    + '</div>'
    + '<div class="bp-art">'
    + '<svg viewBox="0 0 100 100" width="120" height="120">'
    +   '<defs><radialGradient id="bpGlow" cx="50%" cy="50%" r="50%">'
    +   '<stop offset="0%" stop-color="' + ball.color + '" stop-opacity="0.5"/>'
    +   '<stop offset="100%" stop-color="' + ball.color + '" stop-opacity="0"/>'
    +   '</radialGradient></defs>'
    +   '<circle cx="50" cy="50" r="45" fill="url(#bpGlow)" class="bp-glow"/>'
    +   '<circle cx="50" cy="50" r="30" fill="' + ball.color + '" opacity="0.85" stroke="#fff" stroke-width="2"/>'
    +   '<text x="50" y="58" text-anchor="middle" font-size="28">' + ball.icon + '</text>'
    +   '<circle cx="38" cy="38" r="8" fill="#fff" opacity="0.3"/>'
    +   '<circle cx="60" cy="35" r="4" fill="#fff" opacity="0.2"/>'
    +   /* Sparkles */
    +   '<circle class="bp-spark bs1" cx="20" cy="25" r="3" fill="' + ball.color + '"/>'
    +   '<circle class="bp-spark bs2" cx="80" cy="20" r="2.5" fill="' + ball.color + '"/>'
    +   '<circle class="bp-spark bs3" cx="25" cy="80" r="2" fill="' + ball.color + '"/>'
    +   '<circle class="bp-spark bs4" cx="75" cy="75" r="2.5" fill="' + ball.color + '"/>'
    + '</svg>'
    + '</div>'
    + '<button class="bp-pickup-btn" onclick="collectBall(\'' + ballKey + '\')">🎯 Nhặt Bùa</button>';

  var arScreen = document.getElementById('screen-ar');
  if (arScreen) arScreen.appendChild(overlay);
}

function collectBall(ballKey) {
  initArea();

  /* 100% success */
  if (!GS.inventory) GS.inventory = {};
  GS.inventory[ballKey] = (GS.inventory[ballKey] || 0) + 1;

  /* Track area */
  GS.area.ballsTaken++;

  /* Remove overlay */
  var el = document.getElementById('ar-ball-pickup');
  if (el) el.remove();

  saveState();
  renderBalls();
  updateAreaStatus();

  var ball = BALLS[ballKey];
  showResult('🎯', 'Nhặt thành công!', 'Nhận được <strong style="color:' + ball.color + '">1 ' + ball.name + '</strong>', 'ok');

  /* Check if area exhausted */
  setTimeout(function() {
    var creaturesLeft = FLOW.AREA_CREATURES - (GS.area.caught + GS.area.escaped);
    var ballsLeft = GS.area.totalBalls - GS.area.ballsTaken;
    if (creaturesLeft <= 0 && ballsLeft <= 0) {
      setTimeout(showAreaExhausted, 1500);
    }
  }, 2000);
}

/* ================================================================
   ★★★ YÊU THÚ TRÊN AR ★★★
   ================================================================ */
function showCreatureOnAR(creature) {
  removeCreatureOnAR();

  var el = ELEMENTS[creature.element] || ELEMENTS.KIM;
  var realm = typeof getRealm === 'function' ? getRealm(creature.level) : {icon:'🌀',name:''};

  var overlay = document.createElement('div');
  overlay.className = 'ar-creature active';
  overlay.id = 'ar-creature';
  overlay.innerHTML =
    '<div class="ac-info">'
    + '<div class="ac-name">' + creature.name + '</div>'
    + '<div class="ac-tags">'
    +   '<span class="ac-el" style="background:' + el.bg + '">' + el.icon + ' ' + el.name + '</span>'
    +   '<span class="ac-lvl">Lv.' + creature.level + ' ' + realm.icon + '</span>'
    + '</div></div>'
    + '<div class="ac-art">' + renderCreatureArt(creature, 140) + '</div>';

  var arScreen = document.getElementById('screen-ar');
  if (arScreen) arScreen.appendChild(overlay);

  /* Enable capture */
  var btn = document.getElementById('capture-btn');
  if (btn) btn.classList.remove('disabled');
}

function removeCreatureOnAR() {
  var el = document.getElementById('ar-creature');
  if (el) el.remove();
  var bp = document.getElementById('ar-ball-pickup');
  if (bp) bp.remove();
  var btn = document.getElementById('capture-btn');
  if (btn) btn.classList.add('disabled');
}

/* ================================================================
   ★★★ KẾT QUẢ BẮT ★★★
   ================================================================ */
function onCaptureSuccess(creature) {
  removeCreatureOnAR();
  initArea();
  GS.area.caught++;
  saveState();
  updateAreaStatus();

  showToast('✅ Đã bắt được yêu thú <strong>' + creature.name + '</strong>!', 4000);

  setTimeout(function() {
    if (isAreaExhausted() && isBallAreaExhausted()) {
      setTimeout(showAreaExhausted, 1500);
    }
  }, 2000);
}

function onCaptureFail(creature) {
  removeCreatureOnAR();
  initArea();
  GS.area.escaped++;
  saveState();
  updateAreaStatus();

  showToast('💔 Yêu thú đã chạy thoát! Hãy tiếp tục tìm kiếm.', 4000);

  setTimeout(function() {
    if (isAreaExhausted() && isBallAreaExhausted()) {
      setTimeout(showAreaExhausted, 1500);
    }
  }, 2000);
}

/* ================================================================
   ★★★ HẾT KHU VỰC ★★★
   ================================================================ */
function showAreaExhausted() {
  var m = document.getElementById('result-modal');
  if (!m) return;
  document.getElementById('result-icon').innerHTML = '🗺️';
  document.getElementById('result-title').innerHTML = 'Đã hết yêu thú và bùa tại khu vực!';
  document.getElementById('result-sub').innerHTML =
    'Quay lại sau <strong style="color:#ffd700;font-size:15px">60 phút</strong> để hệ thống reset'
    + '<br>hoặc đi sang khu vực khác (cách vị trí hiện tại tối thiểu <strong style="color:#4fc3f7;font-size:15px">50m</strong>).'
    + '<br><span style="opacity:.6;font-size:11px">Mỗi khu vực: 2 yêu thú + 2 bùa</span>';
  m.classList.add('show');
}
