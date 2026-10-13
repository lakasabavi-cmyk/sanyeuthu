/* ============================================================
   balls.js — Bùa Ngũ Hành: Kim Mộc Thủy Hỏa Thổ
   ★ v1.40: Bùa khắc chế yêu thú — tăng tỷ lệ bắt
   ★ Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy,
     Thủy khắc Hỏa, Hỏa khắc Kim
   ============================================================ */

/* ================================================================
   ★★★ BÙA NGŨ HÀNH ★★★
   ================================================================ */
var BALLS = {
  KIM:  {name:'Bùa Kim',  icon:'⚔️', color:'#FFD700', bg:'rgba(255,215,0,.15)',   counters:'MOC',  desc:'Khắc Mộc'},
  MOC:  {name:'Bùa Mộc',  icon:'🌿', color:'#4CAF50', bg:'rgba(76,175,80,.15)',   counters:'THO',  desc:'Khắc Thổ'},
  THUY: {name:'Bùa Thủy', icon:'💧', color:'#2196F3', bg:'rgba(33,150,243,.15)',  counters:'HOA',  desc:'Khắc Hỏa'},
  HOA:  {name:'Bùa Hỏa',  icon:'🔥', color:'#FF5722', bg:'rgba(255,87,34,.15)',   counters:'KIM',  desc:'Khắc Kim'},
  THO:  {name:'Bùa Thổ',  icon:'🏔️', color:'#8D6E63', bg:'rgba(141,110,99,.15)', counters:'THUY', desc:'Khắc Thủy'}
};

var BALL_KEYS = ['KIM','MOC','THUY','HOA','THO'];

/* ★ Khắc chế: ball element → creature element ★ */
function getElementAdvantage(ballEl, creatureEl) {
  if (!BALLS[ballEl] || !creatureEl) return 0;
  if (BALLS[ballEl].counters === creatureEl) return 0.25;   /* +25% */
  /* Bị khắc ngược: -10% */
  if (BALLS[creatureEl] && BALLS[creatureEl].counters === ballEl) return -0.10;
  return 0;
}

function getAdvantageLabel(ballEl, creatureEl) {
  var adv = getElementAdvantage(ballEl, creatureEl);
  if (adv > 0) return {text:'⬆ Khắc chế!', color:'#4caf50', bonus:'+' + Math.round(adv*100) + '%'};
  if (adv < 0) return {text:'⬇ Bị khắc!', color:'#f44336', bonus:Math.round(adv*100) + '%'};
  return {text:'— Trung lập', color:'#aaa', bonus:'0%'};
}

/* ================================================================
   ★★★ TỶ LỆ BẮT ★★★
   Base rate + level + accuracy + element advantage
   ================================================================ */
function getRate(ball, creatureElement, creatureLevel, playerLevel, accuracy) {
  /* Base: 35% */
  var rate = 0.35;

  /* Level advantage */
  var lvlDiff = playerLevel - creatureLevel;
  rate += lvlDiff * 0.005; /* ±0.5% per level */
  rate = Math.max(0.05, Math.min(0.95, rate));

  /* Accuracy bonus (căn giữa) */
  rate += (accuracy || 0) * 0.20; /* +0~20% */

  /* ★ Element advantage ★ */
  rate += getElementAdvantage(ball, creatureElement);

  return Math.max(0.03, Math.min(0.97, rate));
}

/* ================================================================
   ★★★ RENDER BALLS — Bottom bar ★★★
   ================================================================ */
function renderBalls() {
  var row = document.getElementById('ar-balls-row');
  if (!row) return;
  if (!GS.inventory) GS.inventory = {KIM:5, MOC:5, THUY:5, HOA:5, THO:5};
  if (!GS.selectedBall) GS.selectedBall = 'KIM';

  /* ★ Lấy element yêu thú hiện tại nếu có ★ */
  var creatureEl = null;
  if (_state === 'scanning' && GS.currentTarget) {
    creatureEl = GS.currentTarget.element;
  }

  var html = '';
  for (var i = 0; i < BALL_KEYS.length; i++) {
    var key = BALL_KEYS[i];
    var b = BALLS[key];
    var count = GS.inventory[key] || 0;
    var selected = GS.selectedBall === key ? ' selected' : '';
    var empty = count <= 0 ? ' empty' : '';

    html += '<div class="ball-item' + selected + empty + '" onclick="selectBall(\'' + key + '\')">';
    html += '<div class="ball-icon">' + b.icon + '</div>';
    html += '<div class="ball-name" style="color:' + b.color + '">' + b.name.replace('Bùa ','') + '</div>';
    html += '<div class="ball-count">' + count + '</div>';

    /* ★ Advantage % khi có yêu thú ★ */
    if (creatureEl) {
      var adv = getAdvantageLabel(key, creatureEl);
      html += '<div class="ball-adv" style="color:' + adv.color + '">' + adv.bonus + '</div>';
    }
    html += '</div>';
  }
  row.innerHTML = html;
}

function selectBall(key) {
  GS.selectedBall = key;
  renderBalls();
  var b = BALLS[key];
  showToast(b.icon + ' Đã chọn ' + b.name + ' — ' + b.desc, 2000);
}

/* ================================================================
   ★★★ DAILY BALL REFILL ★★★
   ================================================================ */
function checkDailyReset() {
  var today = new Date().toDateString();
  if (GS.lastDaily !== today) {
    GS.lastDaily = today;
    for (var i = 0; i < BALL_KEYS.length; i++) {
      var key = BALL_KEYS[i];
      if (!GS.inventory) GS.inventory = {};
      GS.inventory[key] = (GS.inventory[key] || 0) + 1;
    }
    saveState();
    return true;
  }
  return false;
}

/* ================================================================
   ★★★ BALL INFO — Hiển thị khi chọn ★★★
   ================================================================ */
function showBallAdvantage(creatureElement) {
  if (!creatureElement || !GS.selectedBall) return '';
  var ball = GS.selectedBall;
  var adv = getAdvantageLabel(ball, creatureElement);
  return '<span style="color:' + adv.color + ';font-size:11px">' + adv.text + ' ' + adv.bonus + '</span>';
}
