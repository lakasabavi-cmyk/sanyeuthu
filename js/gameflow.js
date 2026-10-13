/* ============================================================
   gameflow.js — AR Flow hoàn chỉnh
   ★ v2.0: 1 flow duy nhất
   ★ GPS = area tracking (50m) + hiển thị số lượng + reset timer
   ★ Di chuyển THẬT (DeviceMotion) bắt buộc 30-120s
   ★ Crosshair đỏ → chờ 10-30s → item KHÓA vị trí
   ★ Mũi tên hướng dẫn quay camera về vị trí khóa
   ★ Căn tâm → bắt/nhặt
   ============================================================ */

var FLOW = {
  AREA_CREATURES: 2,
  AREA_BALLS: 2,
  MAX_ESCAPE: 3,
  RESET_MS: 60 * 60 * 1000,
  MOVE_METERS: 50
};

/* ================================================================
   ★★★ AREA STATE — GPS cho 50m area reset ★★★
   ================================================================ */
function initArea() {
  if (!GS.area) {
    GS.area = {caught:0, escaped:0, ballsTaken:0,
      totalBalls:FLOW.AREA_BALLS, totalCreatures:FLOW.AREA_CREATURES,
      lastReset:Date.now(), lat:playerLat||0, lng:playerLng||0};
    saveState();
  }
}

function resetArea() {
  GS.area = {caught:0, escaped:0, ballsTaken:0,
    totalBalls:FLOW.AREA_BALLS, totalCreatures:FLOW.AREA_CREATURES,
    lastReset:Date.now(), lat:playerLat||0, lng:playerLng||0};
  saveState(); updateAreaStatus();
}

function isAreaExhausted() {
  if (!GS.area) return false;
  return GS.area.caught >= FLOW.AREA_CREATURES || GS.area.escaped >= FLOW.MAX_ESCAPE;
}

function isBallAreaExhausted() {
  return !GS.area || GS.area.ballsTaken >= GS.area.totalBalls;
}

function isResetDue() {
  return !GS.area || (Date.now() - GS.area.lastReset) >= FLOW.RESET_MS;
}

function hasMovedEnough() {
  if (!GS.area || !GS.area.lat || !GS.area.lng) return true;
  return calcGPSDist(GS.area.lat, GS.area.lng, playerLat, playerLng) >= FLOW.MOVE_METERS;
}

function getTimeUntilReset() {
  return !GS.area ? 0 : Math.max(0, FLOW.RESET_MS - (Date.now() - GS.area.lastReset));
}

function formatResetTime(ms) {
  var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (h > 0 ? h + ':' : '') + (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
}

function calcGPSDist(lat1, lng1, lat2, lng2) {
  var R = 6371000, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ================================================================
   ★★★ AREA STATUS WIDGET ★★★
   ================================================================ */
function createAreaStatusWidget() {
  var old = document.getElementById('area-status');
  if (old) old.remove();
  var el = document.createElement('div');
  el.className = 'area-status'; el.id = 'area-status';
  el.innerHTML =
    '<div class="as-row"><span class="as-icon">🐾</span><span class="as-label">Yêu thú:</span><span class="as-val creature" id="as-creatures">2</span></div>'
    + '<div class="as-row"><span class="as-icon">🎯</span><span class="as-label">Bùa:</span><span class="as-val ball" id="as-balls">2</span></div>'
    + '<div class="as-row"><span class="as-icon">⏱</span><span class="as-label">Reset:</span><span class="as-val reset" id="as-reset">--:--</span></div>';
  var hudTr = document.querySelector('.hud-tr');
  if (hudTr) hudTr.insertBefore(el, hudTr.firstChild);
}

function updateAreaStatus() {
  initArea();
  var cr = document.getElementById('as-creatures');
  if (cr) { var r = Math.max(0, FLOW.AREA_CREATURES - (GS.area.caught + GS.area.escaped)); cr.textContent = r; cr.className = 'as-val creature' + (r <= 0 ? ' empty' : ''); }
  var bl = document.getElementById('as-balls');
  if (bl) { var b = Math.max(0, GS.area.totalBalls - GS.area.ballsTaken); bl.textContent = b; bl.className = 'as-val ball' + (b <= 0 ? ' empty' : ''); }
  var rs = document.getElementById('as-reset');
  if (rs) { var t = getTimeUntilReset(); if (t <= 0) { rs.textContent = 'Sẵn sàng!'; rs.className = 'as-val reset ready'; } else { rs.textContent = formatResetTime(t); rs.className = 'as-val reset'; } }
}

var _areaTimer = null;
function startAreaStatusTimer() {
  createAreaStatusWidget(); updateAreaStatus();
  if (_areaTimer) clearInterval(_areaTimer);
  _areaTimer = setInterval(updateAreaStatus, 1000);
}

/* ================================================================
   ★★★ COMPASS — Manual toggle (GPS cho area) ★★★
   ================================================================ */
var _compassOn = false;

function toggleCompass() {
  _compassOn = !_compassOn;
  compassActive = _compassOn;
  var btn = document.getElementById('btn-compass');
  if (btn) { btn.classList.toggle('active', _compassOn); btn.textContent = _compassOn ? '🧭 Rời bí cảnh' : '🧭 Vào bí cảnh'; }
  var cs = document.getElementById('compass-status');
  if (cs) cs.textContent = _compassOn ? '🧭 Bật' : '🧭 Tắt';

  if (_compassOn) {
    /* ★ XIN QUYỀN DeviceOrientation (iOS cần) ★ */
    requestDeviceOrientation();
    requestDeviceMotion();

    initArea();
    startAreaStatusTimer();
    if (isResetDue() || hasMovedEnough()) resetArea();
    var rem = Math.max(0, FLOW.AREA_CREATURES - (GS.area.caught + GS.area.escaped));
    var bRem = Math.max(0, GS.area.totalBalls - GS.area.ballsTaken);
    showToast('🧭 La bàn bật! ' + rem + ' yêu thú + ' + bRem + ' bùa.', 4000);
  } else {
    showToast('🧭 La bàn tắt.', 2000);
    var asEl = document.getElementById('area-status');
    if (asEl) asEl.remove();
    if (_areaTimer) { clearInterval(_areaTimer); _areaTimer = null; }
    if (_state !== 'idle') cleanupAfterResult();
  }
  saveState();
}

/* ★★★ Request DeviceOrientation Permission ★★★ */
var _oriPermissionGranted = false;
var _motionPermissionGranted = false;

function requestDeviceMotion() {
  if (_motionPermissionGranted) return;
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(function(state) {
        _motionPermissionGranted = state === 'granted';
        if (!_motionPermissionGranted) showToast('⚠️ Chưa được cấp quyền cảm biến chuyển động.', 3000);
      })
      .catch(function() {
        showToast('⚠️ Không thể bật cảm biến chuyển động.', 3000);
      });
  } else {
    _motionPermissionGranted = true;
  }
}

function requestDeviceOrientation() {
  if (_oriPermissionGranted) return;

  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    /* iOS 13+ — cần user gesture */
    DeviceOrientationEvent.requestPermission()
      .then(function(state) {
        if (state === 'granted') {
          _oriPermissionGranted = true;
          setupOrientationListener();
          showToast('✅ La bàn cảm biến OK!', 2000);
        } else {
          showToast('⚠️ Cần cho phép la bàn trong Cài đặt!', 3000);
        }
      })
      .catch(function() {
        showToast('⚠️ Lỗi quyền la bàn!', 3000);
      });
  } else {
    /* Android / Desktop */
    _oriPermissionGranted = true;
    setupOrientationListener();
  }
}

/* ★ Listener nền — luôn ghi heading ★ */
var _globalHeading = 0;
var _orientationLastSeenAt = 0;
function setupOrientationListener() {
  window.addEventListener('deviceorientationabsolute', function(e) {
    if (e.alpha != null) {
      _globalHeading = (360 - e.alpha + 360) % 360;
      _orientationLastSeenAt = Date.now();
    }
  }, true);
  window.addEventListener('deviceorientation', function(e) {
    if (e.webkitCompassHeading != null && e.webkitCompassHeading !== undefined) {
      _globalHeading = e.webkitCompassHeading;
      _orientationLastSeenAt = Date.now();
    } else if (e.alpha != null) {
      _globalHeading = (360 - e.alpha + 360) % 360;
      _orientationLastSeenAt = Date.now();
    }
  }, true);
}

function activateCompass() { toggleCompass(); }

/* ================================================================
   ★★★ GAME STATE MACHINE ★★★
   idle → searching → detected → scanning → result → idle
   ================================================================ */
var _state = 'idle';
var _findType = 'creature';
var _lockedHeading = 0;
var _triggerSec = 0;
var _moveTime = 0;
var _lastMotionTs = 0;
var _accelHistory = [];
var _motionFn = null;
var _gpsWatchId = null;
var _orientFn = null;
var _detectTimer = null;

/* ================================================================
   ★★★ BẤM 🔍 — Search Start ★★★
   ================================================================ */
function setSearchSpinning(on) {
  var b = document.getElementById('btn-search');
  if (b) b.classList.toggle('searching', !!on);
}

function startSearchPhase() {
  if (_state === 'searching') { showToast('🔍 Đang tìm kiếm...'); return; }
  if (_state === 'detected' || _state === 'scanning') {
    cleanupAfterResult();
    showToast('🔍 Bỏ qua, tìm lại...', 1500);
  }
  if (!_compassOn) { showToast('🧭 Hãy vào bí cảnh trước!', 3000); return; }

  initArea();
  if (isResetDue() || hasMovedEnough()) { resetArea(); showToast('🗺️ Khu vực mới! 2 yêu thú + 2 bùa.', 4000); return; }

  var cr = FLOW.AREA_CREATURES - (GS.area.caught + GS.area.escaped);
  var bl = GS.area.totalBalls - GS.area.ballsTaken;
  if (cr <= 0 && bl <= 0) {
    showToast('🗺️ Đã hết yêu thú và bùa trong khu vực, vui lòng chờ reset map hoặc chuyển sang khu vực khác (cách tối thiểu 50m) để tiếp tục.', 6000);
    return;
  }

  requestDeviceMotion();
  _findType = (bl > 0 && cr <= 0) ? 'ball' : (cr > 0 && bl <= 0) ? 'creature' : (Math.random() < 0.4 ? 'ball' : 'creature');
  _state = 'searching';
  _moveTime = 0;
  _triggerSec = 30 + Math.random() * 90;
  _accelHistory = [];

  showSearchOverlay();
  startMovementDetection();
  startSearchRing();
  setSearchSpinning(true);
}

/* ================================================================
   ★★★ SEARCH OVERLAY — 🔍 xoay vòng + text ★★★
   ================================================================ */
function showSearchOverlay() {
  removeSearchOverlay();
  var el = document.createElement('div');
  el.className = 'search-overlay';
  el.id = 'search-overlay';
  el.innerHTML =
    '<div class="so-hint" id="so-hint">Chưa thấy di chuyển, hãy di chuyển để tìm xung quanh</div>';
  document.getElementById('screen-ar').appendChild(el);
}

function removeSearchOverlay() {
  var el = document.getElementById('search-overlay');
  if (el) el.remove();
}

/* ================================================================
   ★★★ MOVEMENT DETECTION — Di chuyển THẬT ★★★
   ★ DeviceMotion = cảm biến gia tốc
   ★ GPS = backup (cũng track cho area 50m)
   ================================================================ */
function startMovementDetection() {
  /* DeviceMotion — chính */
  _motionFn = function(e) {
    if (_state !== 'searching') return;
    var acc = e.accelerationIncludingGravity || e.acceleration;
    if (!acc) return;
    var mag = Math.sqrt((acc.x || 0) * (acc.x || 0) + (acc.y || 0) * (acc.y || 0) + (acc.z || 0) * (acc.z || 0));
    var now = Date.now();
    _accelHistory.push({t: now, v: mag});
    while (_accelHistory.length > 0 && _accelHistory[0].t < now - 2000) _accelHistory.shift();

    var moving = false;
    if (_accelHistory.length > 5) {
      var sum = 0;
      for (var i = 1; i < _accelHistory.length; i++) sum += Math.abs(_accelHistory[i].v - _accelHistory[i - 1].v);
      moving = (sum / (_accelHistory.length - 1)) > 0.15;
    }

    if (moving) {
      if (_lastMotionTs > 0) _moveTime += (now - _lastMotionTs) / 1000;
    }
    _lastMotionTs = now;

    var hint = null;
    if (hint) hint.textContent = moving ? 'Đang di chuyển, tiếp tục tìm xung quanh...' : 'Chưa thấy di chuyển, hãy di chuyển để tìm xung quanh';

    if (_moveTime >= _triggerSec) triggerDetection();
  };
  window.addEventListener('devicemotion', _motionFn);

  /* GPS — backup + area tracking */
  if (navigator.geolocation) {
    _gpsWatchId = navigator.geolocation.watchPosition(function(pos) {
      playerLat = pos.coords.latitude; playerLng = pos.coords.longitude;
      if (_state === 'searching') { _moveTime += 0.5; if (_moveTime >= _triggerSec) triggerDetection(); }
    }, function() {}, {enableHighAccuracy: true, maximumAge: 3000, timeout: 15000});
  }

  /* Fallback: nếu không có DeviceMotion (desktop) */
  var fbTimer = setInterval(function() {
    if (_state !== 'searching') { clearInterval(fbTimer); return; }
    if (_accelHistory.length === 0) {
      _moveTime += 1;
      if (_moveTime >= _triggerSec) { clearInterval(fbTimer); triggerDetection(); }
    }
  }, 1000);
}

function stopMovementDetection() {
  if (_motionFn) { window.removeEventListener('devicemotion', _motionFn); _motionFn = null; }
  if (_gpsWatchId !== null && navigator.geolocation) { navigator.geolocation.clearWatch(_gpsWatchId); _gpsWatchId = null; }
}

/* ================================================================
   ★★★ SEARCH RING — Vòng crosshair đổi màu khi đang tìm ★★★
   ================================================================ */
function startSearchRing() {
  var ring = document.getElementById('crosshair-ring');
  if (ring) { ring.style.borderColor = '#ffa726'; ring.style.boxShadow = '0 0 15px rgba(255,167,38,0.5)'; }
}

function stopSearchRing() {
  var ring = document.getElementById('crosshair-ring');
  if (ring) { ring.style.borderColor = ''; ring.style.boxShadow = ''; }
}

/* ================================================================
   ★★★ DETECTION — Crosshair đỏ → chờ 10-30s ★★★
   ================================================================ */
function triggerDetection() {
  if (_state !== 'searching') return;
  _state = 'detected';
  stopMovementDetection();
  stopSearchRing();
  setSearchSpinning(false);
  removeSearchOverlay();

  var ring = document.getElementById('crosshair-ring');
  if (ring) { ring.style.transition = 'all 0.3s ease'; ring.style.borderColor = '#f44336'; ring.style.boxShadow = '0 0 25px rgba(244,67,54,0.8)'; }
  var pulse = document.getElementById('crosshair-pulse');
  if (pulse) pulse.style.borderColor = '#f44336';

  var txt = _findType === 'ball' ? 'bùa' : 'yêu thú';
  showToast('🔴 Phát hiện ' + txt + ' gần đây! Đứng yên, quay camera xung quanh tìm!', 5000);

  /* Random 10-30s trước khi item xuất hiện */
  var delay = 10000 + Math.random() * 20000;
  _detectTimer = setTimeout(function() {
    if (_state !== 'detected') return;
    startScanning();
  }, delay);
}

/* ================================================================
   ★★★ SCANNING — Item KHÓA vị trí, mũi tên hướng dẫn ★★★
   ================================================================ */
function startScanning() {
  _state = 'scanning';

  var ring = document.getElementById('crosshair-ring');
  if (ring) { ring.style.borderColor = ''; ring.style.boxShadow = ''; }
  var pulse = document.getElementById('crosshair-pulse');
  if (pulse) pulse.style.borderColor = '';

  if (_findType === 'creature') spawnCreatureItem();
  else spawnBallItem();

  startOrientationTracking();
  showToast('🐾 Quay camera xung quanh để tìm!', 3000);
}

function spawnCreatureItem() {
  var creature = generateCreature();
  GS.currentTarget = creature;
  saveState();
  removeItemFromAR();

  var el = ELEMENTS[creature.element] || ELEMENTS.KIM;
  var realm = typeof getRealm === 'function' ? getRealm(creature.level) : {icon:'🌀', name:''};

  var overlay = document.createElement('div');
  overlay.className = 'ar-item';
  overlay.id = 'ar-creature';
  overlay.style.left = '50%';
  overlay.innerHTML =
    '<div class="ac-info"><div class="ac-name">' + creature.name + '</div>'
    + '<div class="ac-tags">'
    + '<span class="ac-el" style="background:' + el.bg + '">' + el.icon + ' ' + el.name + '</span>'
    + '<span class="ac-lvl">Lv.' + creature.level + ' ' + realm.icon + '</span></div></div>'
    + '<div class="ac-art">' + renderCreatureArt(creature, 130) + '</div>'
    + '<div class="ac-ground" aria-hidden="true"></div>';

  document.getElementById('screen-ar').appendChild(overlay);
  _lockedHeading = getBearing(playerLat, playerLng, creature.lat, creature.lng);

  /* ★ Không còn hàng advantage riêng — gộp vào ball buttons ★ */
  updateBallButtonsWithAdvantage(creature.element);
}

function updateBallButtonsWithAdvantage(creatureElement) {
  var row = document.getElementById('ar-balls-row');
  if (!row) return;
  if (!GS.inventory) GS.inventory = {};
  if (!GS.selectedBall) GS.selectedBall = 'KIM';

  var html = '';
  var bk = BALL_KEYS || ['KIM','MOC','THUY','HOA','THO'];
  for (var i = 0; i < bk.length; i++) {
    var key = bk[i];
    var b = BALLS[key];
    var count = GS.inventory[key] || 0;
    var sel = GS.selectedBall === key ? ' selected' : '';
    var empty = count <= 0 ? ' empty' : '';
    /* ★ Advantage text trên ball button ★ */
    var adv = creatureElement ? getAdvantageLabel(key, creatureElement) : {color:'#aaa', bonus:'—'};
    html += '<div class="ball-item' + sel + empty + '" onclick="selectBall(\'' + key + '\')">';
    html += '<div class="ball-icon">' + b.icon + '</div>';
    html += '<div class="ball-name" style="color:' + b.color + '">' + b.name.replace('Bùa ','') + '</div>';
    html += '<div class="ball-count">' + count + '</div>';
    if (creatureElement) {
      html += '<div class="ball-adv" style="color:' + adv.color + '">' + adv.bonus + '</div>';
    }
    html += '</div>';
  }
  row.innerHTML = html;
}

function spawnBallItem() {
  initArea();
  var bk = BALL_KEYS || ['KIM', 'MOC', 'THUY', 'HOA', 'THO'];
  var ballKey = bk[Math.floor(Math.random() * bk.length)];
  var ball = BALLS[ballKey];
  GS._pendingBall = ballKey;

  removeItemFromAR();

  var overlay = document.createElement('div');
  overlay.className = 'ar-item ar-ball';
  overlay.id = 'ar-creature';
  overlay.style.left = '50%';
  overlay.onclick = function(ev) { ev.stopPropagation(); collectBallItem(GS._pendingBall); };
  overlay.innerHTML =
    '<div class="bp-art"><svg viewBox="0 0 100 100" width="110" height="110">'
    + '<defs><radialGradient id="bpG" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="' + ball.color + '" stop-opacity="0.5"/><stop offset="100%" stop-color="' + ball.color + '" stop-opacity="0"/></radialGradient></defs>'
    + '<circle cx="50" cy="50" r="45" fill="url(#bpG)" class="bp-glow"/>'
    + '<circle cx="50" cy="50" r="28" fill="' + ball.color + '" opacity="0.85" stroke="#fff" stroke-width="2"/>'
    + '<text x="50" y="58" text-anchor="middle" font-size="26">' + ball.icon + '</text></svg></div>'
    + '<div class="bp-name" style="color:' + ball.color + '">' + ball.icon + ' ' + ball.name + '</div>'
    + '<div class="ac-ground" aria-hidden="true"></div>';
  document.getElementById('screen-ar').appendChild(overlay);
  _lockedHeading = Math.random() * 360;
  showSearchOverlay();
  setBallHint(false);
}

/* ================================================================
   ★★★ ORIENTATION TRACKING — Quay camera → hiện/ẩn item ★★★
   ★ Item ở locked heading, mũi tên hướng quay về
   ================================================================ */
function startOrientationTracking() {
  stopOrientationTracking();

  /* ★ Item starts hidden until its compass bearing enters the camera view ★ */
  var item = document.getElementById('ar-creature');
  if (item) { item.style.opacity = '0'; item.style.visibility = 'hidden'; }

  if (displayModeActive === 'screen') {
    showItemAtScreenCenter();
    return;
  }

  /* ★ Check định kỳ — dùng _globalHeading ★ */
  _orientFn = function() {
    if (_state !== 'scanning') return;

    var heading = _globalHeading;
    var diff = ((_lockedHeading - heading + 540) % 360) - 180;
    var absDiff = Math.abs(diff);

    var itemEl = document.getElementById('ar-creature');
    if (!itemEl) return;

    var screen = document.getElementById('screen-ar');
    var screenWidth = screen ? screen.clientWidth : window.innerWidth;
    var halfFov = CONFIG.FOV / 2;
    var visible = absDiff <= halfFov;
    var itemX = screenWidth / 2 + (diff / CONFIG.FOV) * screenWidth;
    itemEl.style.left = Math.max(0, Math.min(screenWidth, itemX)) + 'px';

    /* Place the sprite above a fixed ground-contact point in the camera view. */
    if (visible) {
      itemEl.style.opacity = '1';
      itemEl.style.visibility = 'visible';
    } else {
      itemEl.style.opacity = '0';
      itemEl.style.visibility = 'hidden';
    }

    /* Rotation guide */
    updateRotationGuide(diff, absDiff);

    /* Enable capture — CHỈ creature */
    if (_findType === 'creature') {
      var screenOffset = Math.abs(itemX - screenWidth / 2);
      creatureOnScreen = visible;
      crosshairLocked = visible && screenOffset <= CONFIG.CROSSHAIR_LOCK_PX;
      currentAccuracy = crosshairLocked
        ? Math.max(0.5, 1 - screenOffset / (CONFIG.CROSSHAIR_LOCK_PX * 2))
        : Math.max(0, 1 - screenOffset / (CONFIG.CROSSHAIR_LOCK_PX * 3));
      var capBtn = document.getElementById('capture-btn');
      if (capBtn) {
        if (crosshairLocked) capBtn.classList.remove('disabled');
        else capBtn.classList.add('disabled');
      }
    } else {
      creatureOnScreen = false;
      crosshairLocked = false;
      currentAccuracy = 0;
      var capBtn = document.getElementById('capture-btn');
      if (capBtn) capBtn.classList.add('disabled');
    }

    /* Ball: gợi ý nhấn vào bùa khi bùa đang trong khung hình */
    if (_findType === 'ball') setBallHint(visible);
  };

  /* ★ Check mỗi 200ms; fall back to a centered, ground-anchored item if no sensor responds ★ */
  var scanStartedAt = Date.now();
  var checkInterval = setInterval(function() {
    if (_state !== 'scanning') { clearInterval(checkInterval); return; }
    if (_orientationLastSeenAt && Date.now() - _orientationLastSeenAt < 3000) {
      _orientFn();
    } else if (Date.now() - scanStartedAt >= 5000) {
      showItemAtScreenCenter();
    }
  }, 200);
}

function showItemAtScreenCenter() {
  var item = document.getElementById('ar-creature');
  if (item) {
    item.style.left = '50%';
    item.style.opacity = '1';
    item.style.visibility = 'visible';
  }
  if (displayModeActive === 'screen') removeRotationGuide();
  else updateRotationGuide(0, 0);
  if (_findType === 'creature') {
    creatureOnScreen = true;
    crosshairLocked = true;
    currentAccuracy = 1;
    var capBtn = document.getElementById('capture-btn');
    if (capBtn) capBtn.classList.remove('disabled');
  } else {
    setBallHint(true);
  }
}

function setBallHint(found) {
  var hint = document.getElementById('so-hint');
  if (!hint) return;
  if (found) {
    var ball = BALLS[GS._pendingBall];
    var el = ball ? ball.name.replace(/^Bùa\s+/, '') : '';
    hint.textContent = 'Phát hiện bùa hệ ' + el + ', nhấn vào bùa để nhặt';
  } else {
    hint.textContent = 'Chưa thấy di chuyển, hãy di chuyển để tìm xung quanh';
  }
}

function stopOrientationTracking() {
  /* Interval đã handle cleanup */
}

function stopOrientationTracking() {
  if (_orientFn) { window.removeEventListener('deviceorientation', _orientFn); _orientFn = null; }
}

/* ================================================================
   ★★★ ROTATION GUIDE — Mũi tên hai bên Crosshair chỉ hướng quay ★★★
   ================================================================ */
function updateRotationGuide(diff, absDiff) {
  var wrap = document.querySelector('.crosshair');
  if (!wrap) return;
  var offScreen = absDiff > CONFIG.FOV / 2;
  var sides = [{ id: 'rg-arrow-left', cls: 'rg-left', ch: '◀', on: offScreen && diff < 0 },
               { id: 'rg-arrow-right', cls: 'rg-right', ch: '▶', on: offScreen && diff > 0 }];
  sides.forEach(function(s) {
    var el = document.getElementById(s.id);
    if (!s.on) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = s.id;
      el.className = 'rg-arrow ' + s.cls;
      el.textContent = s.ch;
      wrap.appendChild(el);
    }
  });
}

function removeRotationGuide() {
  ['rg-arrow-left', 'rg-arrow-right'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  });
}

/* ================================================================
   ★★★ COLLECT BALL — 100% không trừ bùa ★★★
   ================================================================ */
function collectBallItem(ballKey) {
  initArea();
  if (!GS.inventory) GS.inventory = {};
  GS.inventory[ballKey] = (GS.inventory[ballKey] || 0) + 1;
  GS.area.ballsTaken++;

  cleanupAfterResult();
  saveState(); renderBalls(); updateAreaStatus();

  var ball = BALLS[ballKey];
  showResult('🎯', 'Đã nhận được bùa!', 'Nhận được <strong style="color:' + ball.color + '">1 ' + ball.name + '</strong>', 'ok');

  setTimeout(function() {
    var cr = FLOW.AREA_CREATURES - (GS.area.caught + GS.area.escaped);
    var bl = GS.area.totalBalls - GS.area.ballsTaken;
    if (cr <= 0 && bl <= 0) setTimeout(showAreaExhausted, 1500);
  }, 2000);
}

/* ================================================================
   ★★★ CLEANUP — Về idle, mũi tên biến mất ★★★
   ================================================================ */
function cleanupAfterResult() {
  _state = 'idle';
  clearTimeout(_detectTimer); _detectTimer = null;
  setSearchSpinning(false); stopOrientationTracking(); stopSearchRing();
  removeSearchOverlay(); removeRotationGuide(); removeItemFromAR();
  var ring = document.getElementById('crosshair-ring');
  if (ring) { ring.style.borderColor = ''; ring.style.boxShadow = ''; }
  var pulse = document.getElementById('crosshair-pulse');
  if (pulse) pulse.style.borderColor = '';
}

function removeItemFromAR() {
  var el = document.getElementById('ar-creature');
  if (el) el.remove();
  var bpBtn = document.getElementById('bp-pickup-btn');
  if (bpBtn) bpBtn.remove();
  var capBtn = document.getElementById('capture-btn');
  if (capBtn) capBtn.classList.add('disabled');
  creatureOnScreen = false; crosshairLocked = false;
}

function removeCreatureOnAR() { removeItemFromAR(); }

/* ================================================================
   ★★★ KẾT QUẢ BẮT ★★★
   ================================================================ */
function onCaptureSuccess(creature) {
  initArea(); GS.area.caught++;
  cleanupAfterResult();
  saveState(); updateAreaStatus();
  showToast('✅ Đã bắt được <strong>' + creature.name + '</strong>!', 4000);
  setTimeout(function() {
    if (isAreaExhausted() && isBallAreaExhausted()) setTimeout(showAreaExhausted, 1500);
  }, 2000);
}

function onCaptureFail(creature) {
  initArea(); GS.area.escaped++;
  cleanupAfterResult();
  saveState(); updateAreaStatus();
  showToast('💔 Yêu thú đã chạy thoát! Bấm 🔍 để tìm tiếp.', 4000);
  setTimeout(function() {
    if (isAreaExhausted() && isBallAreaExhausted()) setTimeout(showAreaExhausted, 1500);
  }, 2000);
}

/* ================================================================
   ★★★ HẾT KHU VỰC ★★★
   ================================================================ */
function showAreaExhausted() {
  var m = document.getElementById('result-modal');
  if (!m) return;
  document.getElementById('result-icon').innerHTML = '🗺️';
  document.getElementById('result-title').innerHTML = 'Đã hết yêu thú và bùa!';
  document.getElementById('result-sub').innerHTML = 'Vui lòng chờ reset map hoặc chuyển sang khu vực khác (cách tối thiểu <strong>50m</strong>) để tiếp tục.';
  m.classList.add('show');
}
