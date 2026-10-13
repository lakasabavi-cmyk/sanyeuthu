/* ============================================================
   gameflow.js — La bàn game + Area + Bùa nhặt
   ★ v1.60: La bàn = chỉ đường đơn giản (tiến/rẽ)
   ★ Không dùng GPS real — chỉ là game mechanic
   ★ Red circle pulse → phát hiện → AR → bắt/nhặt
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
      caught: 0, escaped: 0, ballsTaken: 0,
      totalBalls: FLOW.AREA_BALLS,
      totalCreatures: FLOW.AREA_CREATURES,
      lastReset: Date.now(),
      lat: playerLat || 0, lng: playerLng || 0
    };
    saveState();
  }
}

function resetArea() {
  GS.area = {
    caught: 0, escaped: 0, ballsTaken: 0,
    totalBalls: FLOW.AREA_BALLS,
    totalCreatures: FLOW.AREA_CREATURES,
    lastReset: Date.now(),
    lat: playerLat || 0, lng: playerLng || 0
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
  return GS.area.ballsTaken >= GS.area.totalBalls;
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
  return Math.max(0, FLOW.RESET_MS - (Date.now() - GS.area.lastReset));
}

function formatResetTime(ms) {
  var s = Math.floor(ms / 1000);
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var sec = s % 60;
  return (h > 0 ? h + ':' : '') + (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
}

/* ================================================================
   ★★★ AREA STATUS — Không có tọa độ ★★★
   ================================================================ */
function createAreaStatusWidget() {
  var old = document.getElementById('area-status');
  if (old) old.remove();

  var el = document.createElement('div');
  el.className = 'area-status';
  el.id = 'area-status';
  el.innerHTML =
    '<div class="as-row"><span class="as-icon">🐾</span><span class="as-label">Yêu thú:</span><span class="as-val creature" id="as-creatures">2</span></div>'
    + '<div class="as-row"><span class="as-icon">🎯</span><span class="as-label">Bùa:</span><span class="as-val ball" id="as-balls">2</span></div>'
    + '<div class="as-row"><span class="as-icon">⏱</span><span class="as-label">Reset:</span><span class="as-val reset" id="as-reset">--:--</span></div>';

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

  var crEl = document.getElementById('as-creatures');
  if (crEl) {
    var rem = Math.max(0, FLOW.AREA_CREATURES - (GS.area.caught + GS.area.escaped));
    crEl.textContent = rem;
    crEl.className = 'as-val creature' + (rem <= 0 ? ' empty' : '');
  }

  var blEl = document.getElementById('as-balls');
  if (blEl) {
    var bRem = Math.max(0, GS.area.totalBalls - GS.area.ballsTaken);
    blEl.textContent = bRem;
    blEl.className = 'as-val ball' + (bRem <= 0 ? ' empty' : '');
  }

  var rsEl = document.getElementById('as-reset');
  if (rsEl) {
    var t = getTimeUntilReset();
    if (t <= 0) {
      rsEl.textContent = 'Sẵn sàng!';
      rsEl.className = 'as-val reset ready';
    } else {
      rsEl.textContent = formatResetTime(t);
      rsEl.className = 'as-val reset';
    }
  }
}

var _areaStatusTimer = null;
function startAreaStatusTimer() {
  createAreaStatusWidget();
  updateAreaStatus();
  if (_areaStatusTimer) clearInterval(_areaStatusTimer);
  _areaStatusTimer = setInterval(updateAreaStatus, 1000);
}

function stopAreaStatusTimer() {
  if (_areaStatusTimer) clearInterval(_areaStatusTimer);
  _areaStatusTimer = null;
}

/* ================================================================
   ★★★ COMPASS PROMPT ★★★
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
    + '<div class="cp-desc">Sử dụng la bàn để tìm đường đến yêu thú và bùa xung quanh?</div>'
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
    if (isResetDue() || hasMovedEnough()) {
      resetArea();
      showToast('🧭 Khu vực mới! <strong>2 yêu thú</strong> + <strong>2 bùa</strong>. Bấm 🔍 để tìm!', 6000);
    } else {
      var rem = Math.max(0, FLOW.AREA_CREATURES - (GS.area.caught + GS.area.escaped));
      var bRem = Math.max(0, GS.area.totalBalls - GS.area.ballsTaken);
      showToast('🧭 Khu vực còn <strong>' + rem + ' yêu thú</strong> + <strong>' + bRem + ' bùa</strong>.', 5000);
    }
  } else {
    compassActive = false;
    showToast('🧭 La bàn tắt. Dùng chức năng khác.', 3000);
  }
  saveState();
}

/* ================================================================
   ★★★ DIRECTION STEPS — La bàn chỉ đường game ★★★
   ★ Không GPS real — chỉ là hướng dẫn đơn giản
   ================================================================ */
var DIRECTIONS = [
  {icon:'⬆️', text:'Tiến về phía trước'},
  {icon:'↗️', text:'Tiến về phía trước rồi rẽ phải'},
  {icon:'⬆️', text:'Tiến về phía trước'},
  {icon:'↖️', text:'Tiến về phía trước rồi rẽ trái'},
  {icon:'⬇️', text:'Lùi lại phía sau'},
  {icon:'➡️', text:'Rẽ phải'},
  {icon:'⬅️', text:'Rẽ trái'},
  {icon:'🔄', text:'Quay người lại'},
  {icon:'↗️', text:'Đi chéo về phía trước bên phải'},
  {icon:'↖️', text:'Đi chéo về phía trước bên trái'}
];

function generateWalkSteps() {
  var steps = [];
  var numSteps = 3 + Math.floor(Math.random() * 3); /* 3-5 bước */
  for (var i = 0; i < numSteps; i++) {
    var d = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    var meters = 2 + Math.floor(Math.random() * 6); /* 2-7m */
    steps.push({icon: d.icon, text: d.text, meters: meters});
  }
  return steps;
}

/* ================================================================
   ★★★ SEARCH — Walk theo hướng → phát hiện → AR ★★★
   ================================================================ */
var _flowExploring = false;

function startSearchPhase() {
  if (_flowExploring) {
    showToast('🔍 Đang tìm kiếm...');
    return;
  }

  initArea();

  if (isResetDue() || hasMovedEnough()) {
    resetArea();
    showToast('🗺️ Bản đồ đã reset! 2 yêu thú + 2 bùa mới.', 4000);
    return;
  }

  var creaturesLeft = FLOW.AREA_CREATURES - (GS.area.caught + GS.area.escaped);
  var ballsLeft = GS.area.totalBalls - GS.area.ballsTaken;

  if (creaturesLeft <= 0 && ballsLeft <= 0) {
    showAreaExhausted();
    return;
  }

  /* Random: yêu thú hay bùa */
  var findBall = false;
  if (ballsLeft > 0 && creaturesLeft <= 0) {
    findBall = true;
  } else if (creaturesLeft > 0 && ballsLeft > 0) {
    findBall = Math.random() < 0.4;
  }

  _flowExploring = true;
  var steps = generateWalkSteps();
  showWalkGuide(steps, findBall);
}

function showWalkGuide(steps, findBall) {
  var old = document.getElementById('walk-guide');
  if (old) old.remove();

  var totalDist = 0;
  for (var i = 0; i < steps.length; i++) totalDist += steps[i].meters;

  var stepsHtml = '';
  for (var i = 0; i < steps.length; i++) {
    stepsHtml += '<div class="wg-step">'
      + '<div class="wg-step-icon">' + steps[i].icon + '</div>'
      + '<div class="wg-step-text">' + steps[i].text + '</div>'
      + '<div class="wg-step-dist">' + steps[i].meters + 'm</div>'
      + '</div>';
  }

  var el = document.createElement('div');
  el.className = 'walk-guide';
  el.id = 'walk-guide';
  el.innerHTML =
    '<div class="wg-header">'
    + '<span class="wg-header-icon">🧭</span>'
    + '<span class="wg-header-text">Hướng dẫn tìm kiếm</span>'
    + '<button class="wg-cancel" onclick="cancelWalk()">✕</button>'
    + '</div>'
    + '<div class="wg-steps">' + stepsHtml + '</div>'
    + '<div class="wg-total">Tổng: ~' + totalDist + 'm</div>'
    + '<button class="wg-done-btn" onclick="onWalkDone(' + (findBall ? 'true' : 'false') + ')">✅ Đã đi xong</button>';

  document.body.appendChild(el);
}

function cancelWalk() {
  _flowExploring = false;
  var el = document.getElementById('walk-guide');
  if (el) el.remove();
  showToast('🔍 Đã hủy tìm kiếm', 2000);
}

function onWalkDone(findBall) {
  _flowExploring = false;
  var el = document.getElementById('walk-guide');
  if (el) el.remove();

  /* ★ Hiện vòng tròn đỏ nháy → phát hiện ★ */
  showDetectionPulse(findBall);
}

/* ================================================================
   ★★★ DETECTION PULSE — Vòng tròn đỏ nháy ★★★
   ================================================================ */
function showDetectionPulse(findBall) {
  var old = document.getElementById('detect-pulse');
  if (old) old.remove();

  var el = document.createElement('div');
  el.className = 'detect-pulse active';
  el.id = 'detect-pulse';
  el.innerHTML =
    '<div class="dp-circle">'
    + '<div class="dp-ring r1"></div>'
    + '<div class="dp-ring r2"></div>'
    + '<div class="dp-ring r3"></div>'
    + '<div class="dp-icon">' + (findBall ? '🎯' : '🐾') + '</div>'
    + '<div class="dp-text">Phát hiện ' + (findBall ? 'bùa' : 'yêu thú') + '!</div>'
    + '<div class="dp-hint">Quay camera xung quanh để tìm</div>'
    + '</div>';

  document.body.appendChild(el);

  /* Auto: sau 3s → hiện trên AR */
  setTimeout(function() {
    el.remove();
    showScreen('screen-ar');
    if (findBall) {
      spawnBallPickup();
    } else {
      spawnCreature();
    }
  }, 3500);
}

/* ================================================================
   ★★★ SPAWN CREATURE — Xuất hiện trên AR ★★★
   ================================================================ */
function spawnCreature() {
  var creature = generateCreature();
  GS.currentTarget = creature;
  saveState();

  showScreen('screen-ar');
  showCreatureOnAR(creature);
  updateAreaStatus();

  var el = ELEMENTS[creature.element] || ELEMENTS.KIM;
  showToast('🐾 ' + creature.name + ' — ' + el.icon + ' Lv.' + creature.level + '. Căn tâm + chọn bùa khắc chế!', 5000);
}

/* ================================================================
   ★★★ SPAWN BALL PICKUP — Nhặt bùa ★★★
   ================================================================ */
function spawnBallPickup() {
  initArea();
  var ballKeys = BALL_KEYS || ['KIM','MOC','THUY','HOA','THO'];
  var ballKey = ballKeys[Math.floor(Math.random() * ballKeys.length)];
  var ball = BALLS[ballKey];

  showScreen('screen-ar');
  showBallOnAR(ballKey, ball);
  updateAreaStatus();
}

function showBallOnAR(ballKey, ball) {
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
    +   '<defs><radialGradient id="bpG" cx="50%" cy="50%" r="50%">'
    +   '<stop offset="0%" stop-color="' + ball.color + '" stop-opacity="0.5"/>'
    +   '<stop offset="100%" stop-color="' + ball.color + '" stop-opacity="0"/>'
    +   '</radialGradient></defs>'
    +   '<circle cx="50" cy="50" r="45" fill="url(#bpG)" class="bp-glow"/>'
    +   '<circle cx="50" cy="50" r="30" fill="' + ball.color + '" opacity="0.85" stroke="#fff" stroke-width="2"/>'
    +   '<text x="50" y="58" text-anchor="middle" font-size="28">' + ball.icon + '</text>'
    +   '<circle cx="38" cy="38" r="8" fill="#fff" opacity="0.3"/>'
    +   '<circle cx="60" cy="35" r="4" fill="#fff" opacity="0.2"/>'
    +   '<circle class="bp-spark bs1" cx="20" cy="25" r="3" fill="' + ball.color + '"/>'
    +   '<circle class="bp-spark bs2" cx="80" cy="20" r="2.5" fill="' + ball.color + '"/>'
    +   '<circle class="bp-spark bs3" cx="25" cy="80" r="2" fill="' + ball.color + '"/>'
    +   '<circle class="bp-spark bs4" cx="75" cy="75" r="2.5" fill="' + ball.color + '"/>'
    + '</svg>'
    + '</div>'
    + '<div class="bp-hint">Căn tâm + vào bùa rồi bấm Nhặt</div>'
    + '<button class="bp-pickup-btn" onclick="collectBall(\'' + ballKey + '\')">🎯 Nhặt Bùa (Miễn phí)</button>';

  var arScreen = document.getElementById('screen-ar');
  if (arScreen) arScreen.appendChild(overlay);
}

function collectBall(ballKey) {
  initArea();

  /* ★ Nhặt 100% — KHÔNG trừ bùa hiện có ★ */
  if (!GS.inventory) GS.inventory = {};
  GS.inventory[ballKey] = (GS.inventory[ballKey] || 0) + 1;
  GS.area.ballsTaken++;

  var el = document.getElementById('ar-ball-pickup');
  if (el) el.remove();

  saveState();
  renderBalls();
  updateAreaStatus();

  var ball = BALLS[ballKey];
  showResult('🎯', 'Nhặt thành công!', 'Nhận được <strong style="color:' + ball.color + '">1 ' + ball.name + '</strong><br><span style="opacity:.6">Không tốn bùa hiện có</span>', 'ok');

  setTimeout(function() {
    var cr = FLOW.AREA_CREATURES - (GS.area.caught + GS.area.escaped);
    var bl = GS.area.totalBalls - GS.area.ballsTaken;
    if (cr <= 0 && bl <= 0) {
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

  /* ★ Hiển thị lợi thế khắc chế cho từng bùa ★ */
  var advHtml = '<div class="ac-adv">';
  var ballKeys2 = BALL_KEYS || ['KIM','MOC','THUY','HOA','THO'];
  for (var i = 0; i < ballKeys2.length; i++) {
    var bk = ballKeys2[i];
    var adv = getAdvantageLabel(bk, creature.element);
    var b = BALLS[bk];
    var isSel = GS.selectedBall === bk ? ' selected' : '';
    advHtml += '<div class="ac-adv-item' + isSel + '" onclick="selectBall(\'' + bk + '\')">'
      + '<span class="ac-adv-icon">' + b.icon + '</span>'
      + '<span class="ac-adv-text" style="color:' + adv.color + '">' + adv.bonus + '</span>'
      + '</div>';
  }
  advHtml += '</div>';

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
    + '<div class="ac-art">' + renderCreatureArt(creature, 140) + '</div>'
    + advHtml;

  var arScreen = document.getElementById('screen-ar');
  if (arScreen) arScreen.appendChild(overlay);

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
  showToast('✅ Đã bắt được <strong>' + creature.name + '</strong>!', 4000);

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
  showToast('💔 Yêu thú đã chạy thoát! Bấm 🔍 để tìm tiếp.', 4000);

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
  document.getElementById('result-title').innerHTML = 'Đã hết yêu thú và bùa!';
  document.getElementById('result-sub').innerHTML =
    'Quay lại sau <strong style="color:#ffd700;font-size:15px">60 phút</strong> hoặc đi cách <strong style="color:#4fc3f7;font-size:15px">50m</strong>.'
    + '<br><span style="opacity:.6;font-size:11px">Mỗi khu vực: 2 yêu thú + 2 bùa</span>';
  m.classList.add('show');
}
