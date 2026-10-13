/* ============================================================
   alchemy.js — Luyện Đan + Tu Luyện Yêu Thú
   ★ v1.30: Đan dược 11 phẩm chất + nâng cấp yêu thú
   ★ Luyện đan: Xóa yêu thú → nhận đan dược
   ★ Tu luyện: Hiến tế yêu thú + đan dược → nâng cấp
   ============================================================ */

/* ================================================================
   ★★★ PILL DATABASE — 11 phẩm chất ★★★
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
   Tier = ceil(level/10), cap 11
   Lv.1-10 → Tier 1, Lv.11-20 → Tier 2, ... Lv.101+ → Tier 11
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
   ★★★ PILL INVENTORY — GS.pills ★★★
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
   Tier 1-2: 5 yêu thú | Tier 3-4: 4 | Tier 5-6: 3 | Tier 7-8: 2 | Tier 9+: 1
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
    showAlchemyResult(pill);
  });
}

function showAlchemyResult(pill) {
  var m = document.getElementById('result-modal');
  if (!m) return;
  document.getElementById('result-icon').innerHTML = pill.icon;
  document.getElementById('result-title').innerHTML = '🔥 Luyện đan thành công!';
  document.getElementById('result-sub').innerHTML = 'Nhận được <strong style="color:' + pill.color + ';font-size:16px">' + pill.name + '</strong><br><span style="opacity:.7">' + pill.desc + '</span>';
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
    /* Shadow */
    + '<ellipse cx="100" cy="185" rx="55" ry="12" fill="rgba(0,0,0,0.3)"/>'
    /* Furnace base */
    + '<path d="M55,180 Q45,140 65,100 L135,100 Q155,140 145,180 Z" fill="#5D4037" stroke="#3E2723" stroke-width="2.5"/>'
    /* Furnace rim */
    + '<rect x="58" y="95" width="84" height="14" rx="6" fill="#795548"/>'
    /* Furnace opening */
    + '<ellipse cx="100" cy="145" rx="22" ry="30" fill="#1a0a00"/>'
    /* Fire glow */
    + '<ellipse cx="100" cy="145" rx="18" ry="25" fill="#FF6F00" opacity="0.6" class="furnace-glow"/>'
    /* Flames */
    + '<ellipse cx="96" cy="155" rx="10" ry="22" fill="#FF5722" class="flame f1"/>'
    + '<ellipse cx="104" cy="152" rx="8" ry="18" fill="#FF9800" class="flame f2"/>'
    + '<ellipse cx="100" cy="150" rx="6" ry="15" fill="#FFEB3B" class="flame f3"/>'
    /* Sparks */
    + '<circle cx="80" cy="110" r="3" fill="#FFAB00" class="spark sp1"/>'
    + '<circle cx="120" cy="105" r="2.5" fill="#FFAB00" class="spark sp2"/>'
    + '<circle cx="100" cy="98" r="2" fill="#FFD740" class="spark sp3"/>'
    + '<circle cx="88" cy="115" r="2" fill="#FF6D00" class="spark sp4"/>'
    + '<circle cx="112" cy="112" r="1.5" fill="#FF6D00" class="spark sp5"/>'
    /* Handle */
    + '<path d="M62,100 Q60,85 75,80 L125,80 Q140,85 138,100" fill="none" stroke="#5D4037" stroke-width="4" stroke-linecap="round"/>'
    + '</svg>'
    + '<div class="furnace-text">🔥 Đang luyện đan...</div>'
    + '<div class="furnace-sub">Xin chờ trong giây lát</div>'
    + '</div>';
  document.body.appendChild(overlay);

  setTimeout(function() {
    overlay.classList.remove('active');
    setTimeout(function() {
      overlay.remove();
      if (callback) callback();
    }, 500);
  }, 7000);
}

/* ================================================================
   ★★★ TU LUYỆN — Nâng cấp yêu thú ★★★
   ================================================================ */

function doTraining(targetIdx) {
  var target = GS.collection[targetIdx];
  if (!target) return;

  var tier = getCreatureTier(target);
  var req = getTrainingReq(tier);
  var rateInfo = getTrainingRateText(tier);
  var pillInfo = getPillInfo(tier);
  var pillCount = getPillCount(tier);

  /* Same-tier creatures (exclude target) */
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
  /* Remove detail modal */
  var dm = document.getElementById('coll-detail');
  if (dm) dm.remove();

  var rateColor = rateInfo.rate >= 100 ? '#4caf50' : rateInfo.rate >= 60 ? '#4caf50' : rateInfo.rate >= 40 ? '#ff9800' : '#f44336';
  var hasEnoughPills = pillCount >= req.needPillCount;
  var hasEnoughCreatures = sameTier.length >= req.needCreatures;

  var html = '<div class="train-modal">';
  html += '<div class="train-header">⚡ Tu Luyện</div>';

  /* Target */
  html += '<div class="train-target">';
  html += '<div class="train-label">Yêu thú tu luyện:</div>';
  html += '<div class="train-target-card">';
  html += '<div class="train-target-art">' + renderCreatureArt(target, 70) + '</div>';
  html += '<div class="train-target-info"><strong>' + target.name + '</strong> Lv.' + target.level + '<br>Tier ' + tier + '</div>';
  html += '</div></div>';

  /* Requirements */
  html += '<div class="train-req">';
  html += '<div class="train-label">Cần:</div>';
  html += '<div class="req-row' + (hasEnoughCreatures ? ' ok' : ' fail') + '">'
    + '<span class="req-icon">🐾</span> ' + req.needCreatures + ' yêu thú Tier ' + tier
    + ' <span class="req-count">(' + sameTier.length + ')</span></div>';
  html += '<div class="req-row' + (hasEnoughPills ? ' ok' : ' fail') + '">'
    + '<span class="req-icon">' + pillInfo.icon + '</span> 1 ' + pillInfo.name
    + ' <span class="req-count">(Có: ' + pillCount + ')</span></div>';
  html += '<div class="req-row"><span class="req-icon">🎯</span> Tỷ lệ: <strong style="color:' + rateColor + '">' + rateInfo.text + '</strong></div>';
  html += '</div>';

  /* Sacrifice grid */
  html += '<div class="train-select">';
  html += '<div class="train-label">Chọn yêu thú hiến tế (cần ' + req.needCreatures + '):</div>';
  html += '<div class="train-grid">';
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
  if (!sameTier.length) {
    html += '<div class="train-empty">Không có yêu thú Tier ' + tier + ' nào để hiến tế</div>';
  }
  html += '</div></div>';

  /* Warning */
  html += '<div class="train-warning">⚠️ Thất bại sẽ mất yêu thú hiến tế + đan dược</div>';

  /* Buttons */
  var canExecute = hasEnoughCreatures && hasEnoughPills;
  html += '<div class="train-actions">';
  html += '<button class="train-btn exec' + (canExecute ? '' : ' disabled') + '" onclick="executeTraining(' + targetIdx + ',' + tier + ',' + req.needCreatures + ')">⚡ Tu Luyện</button>';
  html += '<button class="train-btn cancel" onclick="closeTrainModal()">Hủy</button>';
  html += '</div>';
  html += '</div>';

  var overlay = document.createElement('div');
  overlay.className = 'train-overlay active';
  overlay.id = 'train-overlay';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function toggleTrainCard(el, maxSelect) {
  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    return;
  }
  var selected = document.querySelectorAll('.train-card.selected');
  if (selected.length >= maxSelect) {
    showToast('Chỉ chọn tối đa ' + maxSelect + ' yêu thú!');
    return;
  }
  el.classList.add('selected');
}

function executeTraining(targetIdx, tier, needCount) {
  var selected = document.querySelectorAll('.train-card.selected');
  if (selected.length < needCount) {
    showToast('Cần chọn đủ ' + needCount + ' yêu thú hiến tế!');
    return;
  }
  if (getPillCount(tier) < 1) {
    showToast('Không đủ đan dược cấp ' + tier + '!');
    return;
  }

  var rateInfo = getTrainingRateText(tier);
  if (!confirm('⚠️ Tu luyện sẽ MẤT ' + needCount + ' yêu thú + 1 đan dược nếu thất bại.\n\nTỷ lệ: ' + rateInfo.text + '\n\nTiếp tục?')) return;

  /* Collect sacrifice indices */
  var sacIdx = [];
  for (var i = 0; i < selected.length && i < needCount; i++) {
    sacIdx.push(parseInt(selected[i].dataset.idx));
  }

  /* Roll */
  var rate = getTrainingRate(tier);
  var success = Math.random() * 100 < rate;

  /* Always consume pill */
  removePill(tier, 1);

  /* Remove sacrifices (desc order to keep indices valid) */
  sacIdx.sort(function(a,b){return b-a;});
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
    /* ★ Thành công: Nâng cấp ★ */
    target.level = Math.min(100, (target.level || 1) + 1);
    if (target.stats) {
      for (var k in target.stats) {
        target.stats[k] = Math.min(100, target.stats[k] + 2);
      }
    }
    saveState();
    closeTrainModal();
    updateCollection();
    showTrainResult(true, target, needCount, sacIdx.length);
  } else {
    /* ★ Thất bại: Mất hiến tế + đan dược, giữ target ★ */
    saveState();
    closeTrainModal();
    updateCollection();
    showTrainResult(false, target, needCount, sacIdx.length);
  }
}

function showTrainResult(success, target, needCount, lostCount) {
  var m = document.getElementById('result-modal');
  if (!m) return;
  if (success) {
    document.getElementById('result-icon').innerHTML = '⚡';
    document.getElementById('result-title').innerHTML = 'Tu luyện thành công!';
    document.getElementById('result-sub').innerHTML = '<strong style="color:#4caf50">' + (target ? target.name : '') + '</strong> lên <strong style="color:#ffd700">Lv.' + (target ? target.level : '?') + '</strong>!';
  } else {
    document.getElementById('result-icon').innerHTML = '💥';
    document.getElementById('result-title').innerHTML = 'Tu luyện thất bại!';
    document.getElementById('result-sub').innerHTML = 'Mất ' + lostCount + ' yêu thú hiến tế + 1 đan dược.<br>' + (target ? '<strong>' + target.name + '</strong> vẫn giữ nguyên Lv.' + target.level : '');
  }
  m.classList.add('show');
}

function closeTrainModal() {
  var m = document.getElementById('train-overlay');
  if (m) m.remove();
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
      + '<div class="pill-count">x' + GS.pills[t] + '</div>'
      + '</div>';
  }
  html += '</div></div>';
  return html;
}
