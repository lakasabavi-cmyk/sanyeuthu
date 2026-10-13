/* ============================================================
   gameflow.js — Game Flow: La bàn + Tìm kiếm + Khu vực
   ★ v1.40: Không mặc định yêu thú. Walk 30-120s rồi mới hiện.
   ★ Area: 2 bắt / 3 chạy thoát → hết → 60 phút hoặc 50m
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
  EXPLORE_MAX_S: 120
};

/* ================================================================
   ★★★ AREA STATE ★★★
   ================================================================ */
function initArea() {
  if (!GS.area) {
    GS.area = {caught:0, escaped:0, lastReset:Date.now(), lat:playerLat||0, lng:playerLng||0, creatures:0};
    saveState();
  }
}

function resetArea() {
  var count = 3 + Math.floor(Math.random() * 3); /* 3-5 */
  GS.area = {caught:0, escaped:0, lastReset:Date.now(), lat:playerLat||0, lng:playerLng||0, creatures:count};
  saveState();
  return count;
}

function isAreaExhausted() {
  return (GS.area.caught >= FLOW.MAX_CAUGHT) || (GS.area.escaped >= FLOW.MAX_ESCAPE);
}

function isResetDue() {
  return (Date.now() - GS.area.lastReset) >= FLOW.RESET_MS;
}

function hasMovedEnough() {
  if (!GS.area.lat || !GS.area.lng) return true;
  var R = 6371000;
  var dLat = (playerLat - GS.area.lat) * Math.PI / 180;
  var dLng = (playerLng - GS.area.lng) * Math.PI / 180;
  var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos(GS.area.lat*Math.PI/180)*Math.cos(playerLat*Math.PI/180) *
    Math.sin(dLng/2)*Math.sin(dLng/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c) >= FLOW.MOVE_METERS;
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
    + '<div class="cp-desc">Bạn có muốn sử dụng la bàn để định vị yêu thú xung quanh không?</div>'
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

  if (yes) {
    compassActive = true;
    if (typeof activateCompass === 'function') activateCompass();

    if (isResetDue() || hasMovedEnough()) {
      var count = resetArea();
      showToast('🧭 La bàn đã bật! Xuất hiện <strong>' + count + ' yêu thú</strong> đang ở gần bạn. Hãy sử dụng kính chiếu yêu (🔍) và hướng mũi tên để tìm yêu thú!', 7000);
    } else {
      showToast('🧭 La bàn đã bật! Khu vực này còn ' + GS.area.creatures + ' yêu thú.', 5000);
    }
  } else {
    compassActive = false;
    showToast('🧭 La bàn tắt. Bạn vẫn có thể sử dụng các chức năng khác.', 3000);
  }
  saveState();
}

/* ================================================================
   ★★★ SEARCH — Walk 30-120s rồi mới hiện yêu thú ★★★
   ================================================================ */
var _flowExploring = false;
var _flowExploreTimer = null;

function startSearchPhase() {
  if (_flowExploring) {
    showToast('🔍 Đang tìm kiếm yêu thú...');
    return;
  }

  /* Check area */
  if (isAreaExhausted()) {
    if (isResetDue() || hasMovedEnough()) {
      resetArea();
      showToast('🗺️ Bản đồ yêu thú đã được reset! Có ' + GS.area.creatures + ' yêu thú mới.', 4000);
    } else {
      showAreaExhausted();
      return;
    }
  }
  if (GS.area.creatures <= 0) {
    showAreaExhausted();
    return;
  }

  /* Start walking timer */
  _flowExploring = true;
  var duration = FLOW.EXPLORE_MIN_S + Math.floor(Math.random() * (FLOW.EXPLORE_MAX_S - FLOW.EXPLORE_MIN_S));
  showExploreBar(duration);
}

function showExploreBar(duration) {
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
      onExploreComplete();
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

function onExploreComplete() {
  var bar = document.getElementById('explore-bar');
  if (bar) bar.remove();

  /* Generate creature */
  var creature = generateCreature();
  GS.currentTarget = creature;
  saveState();

  /* Hiển thị lên AR */
  showScreen('screen-ar');
  showCreatureOnAR(creature);

  var el = ELEMENTS[creature.element] || ELEMENTS.KIM;
  showToast('🐾 Phát hiện yêu thú! ' + creature.name + ' — ' + el.icon + ' Lv.' + creature.level + '. Hãy căn giữa và bắt!', 5000);
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
  GS.area.creatures = Math.max(0, (GS.area.creatures || 1) - 1);
  saveState();

  showToast('✅ Đã bắt được yêu thú <strong>' + creature.name + '</strong>!', 4000);

  setTimeout(function() {
    if (isAreaExhausted() || GS.area.creatures <= 0) {
      setTimeout(showAreaExhausted, 1500);
    }
  }, 2000);
}

function onCaptureFail(creature) {
  removeCreatureOnAR();
  initArea();
  GS.area.escaped++;
  GS.area.creatures = Math.max(0, (GS.area.creatures || 1) - 1);
  saveState();

  showToast('💔 Yêu thú đã chạy thoát! Hãy tiếp tục tìm kiếm.', 4000);

  setTimeout(function() {
    if (isAreaExhausted() || GS.area.creatures <= 0) {
      setTimeout(showAreaExhausted, 1500);
    }
  }, 2000);
}

/* ================================================================
   ★★★ HẾT YÊU THÚ KHU VỰC ★★★
   ================================================================ */
function showAreaExhausted() {
  var m = document.getElementById('result-modal');
  if (!m) return;
  document.getElementById('result-icon').innerHTML = '🗺️';
  document.getElementById('result-title').innerHTML = 'Đã hết yêu thú tại khu vực!';
  document.getElementById('result-sub').innerHTML =
    'Quay lại sau <strong style="color:#ffd700;font-size:15px">60 phút</strong> để hệ thống reset bản đồ yêu thú'
    + '<br>hoặc đi sang khu vực khác (cách vị trí hiện tại tối thiểu <strong style="color:#4fc3f7;font-size:15px">50m</strong>) để tìm yêu thú mới.';
  m.classList.add('show');
}
