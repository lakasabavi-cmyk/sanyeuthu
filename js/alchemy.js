/* ============================================================
   alchemy.js — Luyện Đan + Tu Luyện Yêu Thú
   ★ v1.31: Animation lò luyện đan + ngồi thiền tu luyện
   ★ Notification: "Nhận được 01 đan dược cấp X"
   ★ Notification: "Tu luyện thành công nhận được yêu thú cấp X"
   ★ Notification: "Tu luyện thất bại, mất vật phẩm"
   ============================================================ */

/* ================================================================
   ★★★ PILL DATABASE ★★★
   ================================================================ */
var PILL_DB = [
  {tier:1,  name:'Nhất Phẩm Đan', icon:'💊', color:'#9e9e9e', desc:'Đan dược hạ phẩm'},
  {tier:2,  name:'Nhị Phẩm Đan', icon:'💊', color:'#8bc34a', desc:'Đan dược trung hạ'},
  {tier:3,  name:'Tam Phẩm Đan', icon:'💊', color:'#03a9f4', desc:'Đan dược trung phẩm'},
  {tier:4,  name:'Tứ Phẩm Đan', icon:'💊', color:'#3f51b5', desc:'Đan dược trung thượng'},
  {tier:5,  name:'Ngũ Phẩm Đan', icon:'🔮', color:'#9c27b0', desc:'Đan dược thượng phẩm'},
  {tier:6,  name:'Lục Phẩm Đan', icon:'🔮', color:'#e91e63', desc:'Đan dược tinh phẩm'},
  {tier:7,  name:'Thất Phẩm Đan', icon:'🔮', color:'#f44336', desc:'Đan dược cực phẩm'},
  {tier:8,  name:'Bát Phẩm Đan', icon:'💎', color:'#ff5722', desc:'Đan dược tuyệt phẩm'},
  {tier:9,  name:'Cửu Phẩm Đan', icon:'💎', color:'#ffc107', desc:'Đan dược vô thượng'},
  {tier:10, name:'Tiên Đan',     icon:'✨', color:'#ffd700', desc:'Tiên gia đan dược — siêu hiếm'},
  {tier:11, name:'Đế Đan',       icon:'👑', color:'#ff1744', desc:'Đế gia đan dược — vô địch'}
];

function getPillInfo(tier) {
  return PILL_DB[Math.max(1, Math.min(11, tier)) - 1] || PILL_DB[0];
}

/* ================================================================
   ★★★ TIER SYSTEM ★★★
   ================================================================ */
function getCreatureTier(creature) {
  return Math.min(11, Math.max(1, Math.ceil((creature.level || 1) / 10)));
}

function calcAlchemyPillTier(creature) {
  var base = getCreatureTier(creature);
  var bonus = creature.rarity === 'legendary' ? 2 : creature.rarity === 'rare' ? 1 : 0;
  var rand = Math.floor(Math.random() * 3) - 1;
  return Math.max(1, Math.min(11, base + bonus + rand));
}

/* ================================================================
   ★★★ PILL INVENTORY ★★★
   ================================================================ */
function getPillCount(tier) {
  return (GS.pills && GS.pills[tier]) || 0;
}

function addPill(tier, count) {
  if (!GS.pills) GS.pills = {};
  GS.pills[tier] = (GS.pills[tier] || 0) + (count || 1);
  saveState();
}

function removePill(tier, count) {
  if (!GS.pills || !GS.pills[tier] || GS.pills[tier] < (count || 1)) return false;
  GS.pills[tier] -= (count || 1);
  if (GS.pills[tier] <= 0) delete GS.pills[tier];
  saveState();
  return true;
}

/* ================================================================
   ★★★ TRAINING REQUIREMENTS ★★★
   ================================================================ */
function getTrainingReq(tier) {
  var n;
  if (tier <= 2) n = 5;
  else if (tier <= 4) n = 4;
  else if (tier <= 6) n = 3;
  else if (tier <= 8) n = 2;
  else n = 1;
  return {tier:tier, needCreatures:n, needPillTier:tier, needPillCount:1};
}

function getTrainingRate(tier) {
  if (tier <= 5) return 100;
  if (tier === 6) return 80;
  if (tier === 7) return 60;
  if (tier === 8) return 40;
  if (tier === 9) return 20;
  return 1 + Math.floor(Math.random() * 3);
}

function getTrainingRateText(tier) {
  if (tier <= 5) return {rate:100, text:'100%'};
  if (tier === 6) return {rate:80, text:'80%'};
  if (tier === 7) return {rate:60, text:'60%'};
  if (tier === 8) return {rate:40, text:'40%'};
  if (tier === 9) return {rate:20, text:'20%'};
  return {rate:2, text:'1~3%'};
}

/* ================================================================
   ★★★ LUYỆN ĐAN ★★★
   Xóa yêu thú → Nhận đan dược
   ================================================================ */
function doAlchemy(creatureIdx) {
  var c = GS.collection[creatureIdx];
  if (!c) return;

  if (!confirm('⚠️ THAO TÁC KHÔNG THỂ KHÔI PHỤC!\n\nBạn có chắc chắn đem ' + c.name + ' (Lv.' + c.level + ') đi luyện đan?\n\nYêu thú sẽ bị xóa vĩnh viễn.')) return;

  closeCreatureDetail();
  showFurnaceAnimation(function() {
    var pillTier = calcAlchemyPillTier(c);
    var pill = getPillInfo(pillTier);
    addPill(pillTier, 1);
    GS.collection.splice(creatureIdx, 1);
    saveState();
    updateCollection();
    showAlchemyResult(pill, pillTier);
  });
}

function showAlchemyResult(pill, pillTier) {
  var m = document.getElementById('result-modal');
  if (!m) return;
  document.getElementById('result-icon').innerHTML = pill.icon;
  document.getElementById('result-title').innerHTML = '🔥 Luyện đan thành công!';
  document.getElementById('result-sub').innerHTML = 'Nhận được <strong style="color:' + pill.color + ';font-size:16px">01 ' + pill.name + ' (Cấp ' + pillTier + ')</strong><br><span style="opacity:.7">' + pill.desc + '</span>';
  m.classList.add('show');
}

/* ================================================================
   ★★★ LÒ LUYỆN ĐAN — Animation ★★★
   ================================================================ */
function showFurnaceAnimation(callback) {
  var old = document.getElementById('furnace-overlay');
  if (old) old.remove();

  var overlay = document.createElement('div');
  overlay.className = 'furnace-overlay active';
  overlay.id = 'furnace-overlay';
  overlay.innerHTML =
    '<div class="furnace-box">'
    + '<svg class="furnace-svg" viewBox="0 0 200 200" width="180" height="180">'
    + '<ellipse cx="100" cy="188" rx="55" ry="10" fill="rgba(0,0,0,0.3)"/>'
    + '<path d="M55,180 Q45,140 65,100 L135,100 Q155,140 145,180 Z" fill="#5D4037" stroke="#3E2723" stroke-width="2.5"/>'
    + '<rect x="58" y="95" width="84" height="14" rx="6" fill="#795548"/>'
    + '<ellipse cx="100" cy="148" rx="22" ry="28" fill="#1a0a00"/>'
    + '<ellipse cx="100" cy="148" rx="18" ry="24" fill="#FF6F00" opacity="0.6" class="furnace-glow"/>'
    + '<ellipse cx="96" cy="158" rx="10" ry="22" fill="#FF5722" class="flame f1"/>'
    + '<ellipse cx="104" cy="155" rx="8" ry="18" fill="#FF9800" class="flame f2"/>'
    + '<ellipse cx="100" cy="152" rx="6" ry="15" fill="#FFEB3B" class="flame f3"/>'
    + '<circle cx="78" cy="108" r="3" fill="#FFAB00" class="spark sp1"/>'
    + '<circle cx="122" cy="103" r="2.5" fill="#FFAB00" class="spark sp2"/>'
    + '<circle cx="100" cy="95" r="2" fill="#FFD740" class="spark sp3"/>'
    + '<circle cx="86" cy="112" r="2" fill="#FF6D00" class="spark sp4"/>'
    + '<circle cx="114" cy="110" r="1.5" fill="#FF6D00" class="spark sp5"/>'
    + '<path d="M62,100 Q60,82 75,77 L125,77 Q140,82 138,100" fill="none" stroke="#5D4037" stroke-width="4" stroke-linecap="round"/>'
    + '</svg>'
    + '<div class="furnace-text">🔥 Đang luyện đan...</div>'
    + '<div class="furnace-sub">Đan dược đang được tôi luyện</div>'
    + '</div>';
  document.body.appendChild(overlay);

  setTimeout(function() {
    overlay.classList.remove('active');
    setTimeout(function() {
      overlay.remove();
      if (callback) callback();
    }, 500);
  }, 6000);
}

/* ================================================================
   ★★★ TU LUYỆN ★★★
   ================================================================ */
function doTraining(targetIdx) {
  var target = GS.collection[targetIdx];
  if (!target) return;

  var tier = getCreatureTier(target);
  var req = getTrainingReq(tier);
  var rateInfo = getTrainingRateText(tier);
  var pillInfo = getPillInfo(tier);
  var pillCount = getPillCount(tier);

  var sameTier = [];
  for (var i = 0; i < GS.collection.length; i++) {
    if (i === targetIdx) continue;
    if (getCreatureTier(GS.collection[i]) === tier) {
      sameTier.push({idx:i, creature:GS.collection[i]});
    }
  }

  showTrainingModal(targetIdx, target, tier, req, rateInfo, pillInfo, pillCount, sameTier);
}

function showTrainingModal(targetIdx, target, tier, req, rateInfo, pillInfo, pillCount, sameTier) {
  var dm = document.getElementById('coll-detail');
  if (dm) dm.remove();

  var rateColor = rateInfo.rate >= 60 ? '#4caf50' : rateInfo.rate >= 40 ? '#ff9800' : '#f44336';
  var hasEnoughPills = pillCount >= req.needPillCount;
  var hasEnoughCreatures = sameTier.length >= req.needCreatures;

  var html = '<div class="train-modal">';
  html += '<div class="train-header">⚡ Tu Luyện</div>';

  html += '<div class="train-target"><div class="train-label">Yêu thú tu luyện:</div><div class="train-target-card">';
  html += '<div class="train-target-art">' + renderCreatureArt(target, 70) + '</div>';
  html += '<div class="train-target-info"><strong>' + target.name + '</strong> Lv.' + target.level + '<br>Tier ' + tier + '</div>';
  html += '</div></div>';

  html += '<div class="train-req"><div class="train-label">Cần:</div>';
  html += '<div class="req-row' + (hasEnoughCreatures ? ' ok' : ' fail') + '"><span class="req-icon">🐾</span> ' + req.needCreatures + ' yêu thú Tier ' + tier + ' <span class="req-count">(' + sameTier.length + ')</span></div>';
  html += '<div class="req-row' + (hasEnoughPills ? ' ok' : ' fail') + '"><span class="req-icon">' + pillInfo.icon + '</span> 1 ' + pillInfo.name + ' <span class="req-count">(Có: ' + pillCount + ')</span></div>';
  html += '<div class="req-row"><span class="req-icon">🎯</span> Tỷ lệ: <strong style="color:' + rateColor + '">' + rateInfo.text + '</strong></div>';
  html += '</div>';

  html += '<div class="train-select"><div class="train-label">Chọn yêu thú hợp tu (cần ' + req.needCreatures + '):</div><div class="train-grid">';
  for (var i = 0; i < sameTier.length; i++) {
    var sc = sameTier[i].creature;
    var sel = ELEMENTS[sc.element] || ELEMENTS.KIM;
    html += '<div class="train-card" data-idx="' + sameTier[i].idx + '" onclick="toggleTrainCard(this,' + req.needCreatures + ')">';
    html += renderCreatureArt(sc, 50);
    html += '<div class="tc-name">' + sc.name + '</div>';
    html += '<div class="tc-lvl">Lv.' + sc.level + '</div>';
    html += '<div class="tc-el">' + sel.icon + '</div>';
    html += '</div>';
  }
  if (!sameTier.length) html += '<div class="train-empty">Không có yêu thú Tier ' + tier + ' để hiến tế</div>';
  html += '</div></div>';

  html += '<div class="train-warning">⚠️ Thất bại sẽ mất yêu thú hợp tu + đan dược</div>';

  var canExecute = hasEnoughCreatures && hasEnoughPills;
  html += '<div class="train-actions">';
  html += '<button class="train-btn exec' + (canExecute ? '' : ' disabled') + '" onclick="executeTraining(' + targetIdx + ',' + tier + ',' + req.needCreatures + ')">⚡ Tu Luyện</button>';
  html += '<button class="train-btn cancel" onclick="closeTrainModal()">Hủy</button>';
  html += '</div></div>';

  var overlay = document.createElement('div');
  overlay.className = 'train-overlay active';
  overlay.id = 'train-overlay';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function toggleTrainCard(el, maxSelect) {
  if (el.classList.contains('selected')) { el.classList.remove('selected'); return; }
  var selected = document.querySelectorAll('.train-card.selected');
  if (selected.length >= maxSelect) { showToast('Chỉ chọn tối đa ' + maxSelect + ' yêu thú!'); return; }
  el.classList.add('selected');
}

function executeTraining(targetIdx, tier, needCount) {
  var selected = document.querySelectorAll('.train-card.selected');
  if (selected.length < needCount) { showToast('Cần chọn đủ ' + needCount + ' yêu thú hiến tu!'); return; }
  if (getPillCount(tier) < 1) { showToast('Không đủ đan dược cấp ' + tier + '!'); return; }

  var rateInfo = getTrainingRateText(tier);
  if (!confirm('⚠️ Tu luyện sẽ MẤT ' + needCount + ' yêu thú + 1 đan dược nếu thất bại.\n\nTỷ lệ: ' + rateInfo.text + '\n\nTiếp tục?')) return;

  /* Collect sacrifice indices */
  var sacIdx = [];
  for (var i = 0; i < selected.length && i < needCount; i++) {
    sacIdx.push(parseInt(selected[i].dataset.idx));
  }

  /* ★ Đóng modal + hiện ngồi thiền ★ */
  closeTrainModal();

  var targetCreature = GS.collection[targetIdx];
  showMeditationAnimation(targetCreature, function() {
    /* ★ Roll sau animation ★ */
    var rate = getTrainingRate(tier);
    var success = Math.random() * 100 < rate;

    /* Luôn tiêu hao đan dược */
    removePill(tier, 1);

    /* Xóa yêu thú hiến tế (desc order) */
    sacIdx.sort(function(a,b){ return b-a; });
    for (var i = 0; i < sacIdx.length; i++) {
      GS.collection.splice(sacIdx[i], 1);
    }

    /* Adjust targetIdx */
    var adjust = 0;
    for (var i = 0; i < sacIdx.length; i++) {
      if (sacIdx[i] < targetIdx) adjust++;
    }
    targetIdx -= adjust;
    var target = GS.collection[targetIdx];

    if (success && target) {
      target.level = Math.min(100, (target.level || 1) + 1);
      if (target.stats) {
        for (var k in target.stats) {
          target.stats[k] = Math.min(100, target.stats[k] + 2);
        }
      }
    }

    saveState();
    updateCollection();
    showTrainResult(success, target, tier);
  });
}

function showTrainResult(success, target, tier) {
  var m = document.getElementById('result-modal');
  if (!m) return;
  if (success) {
    document.getElementById('result-icon').innerHTML = '⚡';
    document.getElementById('result-title').innerHTML = '✨ Tu luyện thành công!';
    document.getElementById('result-sub').innerHTML = 'Nhận được <strong style="color:#ffd700;font-size:16px">' + (target ? target.name : 'Yêu thú') + ' cấp ' + tier + '</strong><br><span style="opacity:.7">Lv.' + (target ? target.level : '?') + ' — Stats +2 mỗi chỉ số</span>';
  } else {
    document.getElementById('result-icon').innerHTML = '💥';
    document.getElementById('result-title').innerHTML = '💔 Tu luyện thất bại!';
    document.getElementById('result-sub').innerHTML = '<strong style="color:#f44336">Mất vật phẩm</strong><br><span style="opacity:.7">Yêu thú hợp tu + Đan dược đã tiêu hao</span>';
  }
  m.classList.add('show');
}

function closeTrainModal() {
  var m = document.getElementById('train-overlay');
  if (m) m.remove();
}

/* ================================================================
   ★★★ NGỒI THIỀN — Meditation Animation ★★★
   Yêu thú khoanh chân chắp tay + khói bốc lên đầu
   ================================================================ */
function showMeditationAnimation(creature, callback) {
  var old = document.getElementById('med-overlay');
  if (old) old.remove();

  /* Colors from element */
  var colors;
  if (typeof getCreatureColors === 'function') {
    colors = getCreatureColors(creature.element, creature.rarity);
  } else {
    colors = {body:'#7c4dff', bodyLight:'#b388ff', bodyDark:'#4a148c', belly:'#e1bee7', feet:'#4a148c', blush:'#FFB6C1'};
  }

  var overlay = document.createElement('div');
  overlay.className = 'med-overlay active';
  overlay.id = 'med-overlay';

  overlay.innerHTML = '<div class="med-box">'
    + '<svg class="med-svg" viewBox="0 0 200 220" width="160" height="176">'

    /* Glow aura */
    + '<defs><radialGradient id="medGlow" cx="50%" cy="50%" r="50%">'
    +   '<stop offset="0%" stop-color="' + colors.glow + '" stop-opacity="0.35"/>'
    +   '<stop offset="100%" stop-color="' + colors.glow + '" stop-opacity="0"/>'
    + '</radialGradient></defs>'
    + '<circle cx="100" cy="115" r="80" fill="url(#medGlow)" class="med-aura"/>'

    /* Shadow */
    + '<ellipse cx="100" cy="188" rx="45" ry="8" fill="rgba(0,0,0,0.2)"/>'

    /* Crossed legs */
    + '<g class="med-legs">'
    +   '<ellipse cx="82" cy="168" rx="26" ry="13" fill="' + colors.body + '" stroke="' + colors.bodyDark + '" stroke-width="1.5"/>'
    +   '<ellipse cx="118" cy="168" rx="26" ry="13" fill="' + colors.body + '" stroke="' + colors.bodyDark + '" stroke-width="1.5"/>'
    +   '<ellipse cx="82" cy="166" rx="18" ry="8" fill="' + colors.bodyLight + '" opacity="0.4"/>'
    +   '<ellipse cx="118" cy="166" rx="18" ry="8" fill="' + colors.bodyLight + '" opacity="0.4"/>'
    + '</g>'

    /* Body */
    + '<g class="med-body">'
    +   '<ellipse cx="100" cy="138" rx="24" ry="30" fill="' + colors.body + '" stroke="' + colors.bodyDark + '" stroke-width="1.5"/>'
    +   '<ellipse cx="100" cy="144" rx="15" ry="20" fill="' + colors.belly + '" opacity="0.45"/>'
    + '</g>'

    /* Arms — prayer position */
    + '<g class="med-arms">'
    +   '<path d="M80,132 Q85,150 98,152" fill="none" stroke="' + colors.bodyDark + '" stroke-width="3.5" stroke-linecap="round"/>'
    +   '<path d="M120,132 Q115,150 102,152" fill="none" stroke="' + colors.bodyDark + '" stroke-width="3.5" stroke-linecap="round"/>'
    +   '<ellipse cx="100" cy="150" rx="9" ry="7" fill="' + colors.bodyLight + '" stroke="' + colors.bodyDark + '" stroke-width="1"/>'
    + '</g>'

    /* Head */
    + '<g class="med-head">'
    +   '<circle cx="100" cy="82" r="32" fill="' + colors.body + '" stroke="' + colors.bodyDark + '" stroke-width="1.5"/>'

    /* Closed eyes (meditation) */
    +   '<path d="M85,86 Q89,82 93,86" fill="none" stroke="#333" stroke-width="2.2" stroke-linecap="round"/>'
    +   '<path d="M107,86 Q111,82 115,86" fill="none" stroke="#333" stroke-width="2.2" stroke-linecap="round"/>'

    /* Peaceful smile */
    +   '<path d="M94,98 Q100,103 106,98" fill="none" stroke="#333" stroke-width="1.8" stroke-linecap="round"/>'

    /* Blush */
    +   '<ellipse cx="80" cy="91" rx="6" ry="3.5" fill="' + colors.blush + '" opacity="0.55"/>'
    +   '<ellipse cx="120" cy="91" rx="6" ry="3.5" fill="' + colors.blush + '" opacity="0.55"/>'

    /* Third eye dot (meditation symbol) */
    +   '<circle cx="100" cy="72" r="3" fill="' + colors.glow + '" opacity="0.6" class="med-third-eye"/>'
    + '</g>'

    /* ★ SMOKE — khói bốc lên ★ */
    + '<g class="med-smoke-group">'
    +   '<path class="med-smoke ms1" d="M90,48 Q87,36 92,26 Q95,18 90,10" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3.5" stroke-linecap="round"/>'
    +   '<path class="med-smoke ms2" d="M100,44 Q103,32 98,22 Q96,14 100,5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" stroke-linecap="round"/>'
    +   '<path class="med-smoke ms3" d="M110,48 Q113,36 108,26 Q105,18 110,8" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2.5" stroke-linecap="round"/>'
    +   '<path class="med-smoke ms4" d="M84,52 Q80,42 85,32" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-linecap="round"/>'
    +   '<path class="med-smoke ms5" d="M116,52 Q120,42 115,32" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-linecap="round"/>'
    + '</g>'

    /* Floating energy dots */
    + '<circle class="med-dot md1" cx="75" cy="60" r="3" fill="' + colors.glow + '" opacity="0.5"/>'
    + '<circle class="med-dot md2" cx="125" cy="55" r="2.5" fill="' + colors.glow + '" opacity="0.4"/>'
    + '<circle class="med-dot md3" cx="80" cy="40" r="2" fill="' + colors.glow + '" opacity="0.3"/>'
    + '<circle class="med-dot md4" cx="120" cy="38" r="2.5" fill="' + colors.glow + '" opacity="0.35"/>'

    + '</svg>'
    + '<div class="med-text">🧘 Đang tu luyện...</div>'
    + '<div class="med-sub">Yêu thú đang hấp thu linh khí</div>'
    + '</div>';

  document.body.appendChild(overlay);

  setTimeout(function() {
    overlay.classList.remove('active');
    setTimeout(function() {
      overlay.remove();
      if (callback) callback();
    }, 500);
  }, 4500);
}

/* ================================================================
   ★★★ PILL INVENTORY DISPLAY ★★★
   ================================================================ */
function renderPillInventory() {
  if (!GS.pills || !Object.keys(GS.pills).length) {
    return '<div class="pill-inv"><div class="pill-inv-title">💊 Đan Dược</div><div class="pill-empty">Chưa có đan dược. Luyện đan yêu thú để nhận!</div></div>';
  }
  var html = '<div class="pill-inv"><div class="pill-inv-title">💊 Đan Dược</div><div class="pill-grid">';
  for (var t in GS.pills) {
    if (GS.pills[t] <= 0) continue;
    var p = getPillInfo(parseInt(t));
    html += '<div class="pill-item" style="border-color:' + p.color + '">'
      + '<div class="pill-icon">' + p.icon + '</div>'
      + '<div class="pill-name" style="color:' + p.color + '">' + p.name + '</div>'
      + '<div class="pill-count">x' + GS.pills[t] + '</div></div>';
  }
  html += '</div></div>';
  return html;
}
