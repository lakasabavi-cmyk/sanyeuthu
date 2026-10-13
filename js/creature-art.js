/* ============================================================
   creature-art.js — Bộ 15 yêu thú SVG chibi mặc định
   ★ v1.11: Ảnh mặc định animated — không cần AI gen
   ★ Mỗi con: SVG body + CSS animation + particle effects
   ============================================================ */

var CREATURE_ART = {};

/* ================================================================
   ★★★ TEMPLATE CHIBI BODY — dùng lại cho 15 con ★★★
   ================================================================ */
function chibiSvg(creature, size) {
  var s = size || 200;
  var id = 'art_' + creature.id;
  var el = ELEMENTS[creature.element] || ELEMENTS.KIM;
  var rarity = creature.rarity || 'common';

  /* Per-element colors */
  var colors = getCreatureColors(creature.element, rarity);
  var accessory = getCreatureAccessory(creature.id);

  return '<svg id="' + id + '" class="creature-svg" viewBox="0 0 ' + s + ' ' + s + '" width="' + s + '" height="' + s + '" xmlns="http://www.w3.org/2000/svg">'

    + '<defs>'
    +   '<radialGradient id="glow_' + id + '" cx="50%" cy="50%" r="50%">'
    +     '<stop offset="0%" stop-color="' + colors.glow + '" stop-opacity="0.4"/>'
    +     '<stop offset="100%" stop-color="' + colors.glow + '" stop-opacity="0"/>'
    +   '</radialGradient>'
    +   '<radialGradient id="eye_' + id + '" cx="35%" cy="30%" r="50%">'
    +     '<stop offset="0%" stop-color="#fff"/>'
    +     '<stop offset="40%" stop-color="' + colors.eye + '"/>'
    +     '<stop offset="100%" stop-color="' + colors.eyeDark + '"/>'
    +   '</radialGradient>'
    +   '<radialGradient id="body_' + id + '" cx="50%" cy="35%" r="60%">'
    +     '<stop offset="0%" stop-color="' + colors.bodyLight + '"/>'
    +     '<stop offset="100%" stop-color="' + colors.body + '"/>'
    +   '</radialGradient>'
    + '</defs>'

    /* Glow background */
    + '<circle cx="' + (s/2) + '" cy="' + (s/2) + '" r="' + (s*0.45) + '" fill="url(#glow_' + id + ')" class="art-glow"/>'

    /* ★ Sparkle particles (animated via CSS) ★ */
    + '<g class="art-sparkles">' + getSparkles(s, colors.sparkle) + '</g>'

    /* ★ Shadow ★ */
    + '<ellipse cx="' + (s/2) + '" cy="' + (s*0.82) + '" rx="' + (s*0.18) + '" ry="' + (s*0.04) + '" fill="rgba(0,0,0,0.15)"/>'

    /* ★ BODY ★ */
    + '<g class="art-body">'
    +   '<ellipse cx="' + (s/2) + '" cy="' + (s*0.62) + '" rx="' + (s*0.18) + '" ry="' + (s*0.16) + '" fill="url(#body_' + id + ')" stroke="' + colors.bodyDark + '" stroke-width="1.5"/>'
    +   '<ellipse cx="' + (s/2) + '" cy="' + (s*0.66) + '" rx="' + (s*0.12) + '" ry="' + (s*0.10) + '" fill="' + colors.belly + '" opacity="0.5"/>'

    /* Feet */
    +   '<ellipse cx="' + (s*0.42) + '" cy="' + (s*0.77) + '" rx="' + (s*0.05) + '" ry="' + (s*0.03) + '" fill="' + colors.feet + '" stroke="' + colors.bodyDark + '" stroke-width="1"/>'
    +   '<ellipse cx="' + (s*0.58) + '" cy="' + (s*0.77) + '" rx="' + (s*0.05) + '" ry="' + (s*0.03) + '" fill="' + colors.feet + '" stroke="' + colors.bodyDark + '" stroke-width="1"/>'
    + '</g>'

    /* ★ HEAD ★ */
    + '<g class="art-head">'
    /* Head base */
    +   '<ellipse cx="' + (s/2) + '" cy="' + (s*0.38) + '" rx="' + (s*0.22) + '" ry="' + (s*0.21) + '" fill="url(#body_' + id + ')" stroke="' + colors.bodyDark + '" stroke-width="1.5"/>'

    /* Ears */
    +   getEars(s, colors, creature.element)

    /* Eyes */
    +   '<g class="art-eyes">'
    +     '<ellipse cx="' + (s*0.42) + '" cy="' + (s*0.37) + '" rx="' + (s*0.055) + '" ry="' + (s*0.065) + '" fill="url(#eye_' + id + ')" stroke="' + colors.eyeDark + '" stroke-width="0.5"/>'
    +     '<ellipse cx="' + (s*0.58) + '" cy="' + (s*0.37) + '" rx="' + (s*0.055) + '" ry="' + (s*0.065) + '" fill="url(#eye_' + id + ')" stroke="' + colors.eyeDark + '" stroke-width="0.5"/>'
    /* Pupils */
    +     '<circle cx="' + (s*0.43) + '" cy="' + (s*0.38) + '" r="' + (s*0.025) + '" fill="#1a1a2e"/>'
    +     '<circle cx="' + (s*0.57) + '" cy="' + (s*0.38) + '" r="' + (s*0.025) + '" fill="#1a1a2e"/>'
    /* Eye highlights */
    +     '<circle cx="' + (s*0.415) + '" cy="' + (s*0.355) + '" r="' + (s*0.018) + '" fill="#fff" opacity="0.9"/>'
    +     '<circle cx="' + (s*0.565) + '" cy="' + (s*0.355) + '" r="' + (s*0.018) + '" fill="#fff" opacity="0.9"/>'
    +     '<circle cx="' + (s*0.44) + '" cy="' + (s*0.395) + '" r="' + (s*0.01) + '" fill="#fff" opacity="0.6"/>'
    +     '<circle cx="' + (s*0.58) + '" cy="' + (s*0.395) + '" r="' + (s*0.01) + '" fill="#fff" opacity="0.6"/>'
    +   '</g>'

    /* Blush */
    +   '<ellipse cx="' + (s*0.36) + '" cy="' + (s*0.42) + '" rx="' + (s*0.035) + '" ry="' + (s*0.02) + '" fill="' + colors.blush + '" opacity="0.6"/>'
    +   '<ellipse cx="' + (s*0.64) + '" cy="' + (s*0.42) + '" rx="' + (s*0.035) + '" ry="' + (s*0.02) + '" fill="' + colors.blush + '" opacity="0.6"/>'

    /* Mouth */
    +   '<path d="M ' + (s*0.46) + ' ' + (s*0.44) + ' Q ' + (s*0.50) + ' ' + (s*0.47) + ' ' + (s*0.54) + ' ' + (s*0.44) + '" fill="none" stroke="#333" stroke-width="1.8" stroke-linecap="round"/>'
    + '</g>'

    /* ★ ACCESSORY ★ */
    + accessory

    + '</svg>';
}

/* ================================================================
   ★★★ COLORS PER ELEMENT ★★★
   ================================================================ */
function getCreatureColors(element, rarity) {
  var base = {
    KIM: {
      body: '#FFD700', bodyLight: '#FFEC80', bodyDark: '#B8860B',
      belly: '#FFF8DC', feet: '#B8860B',
      eye: '#FFD700', eyeDark: '#8B6914', blush: '#FFB6C1',
      glow: '#FFD700', sparkle: '#FFF8DC'
    },
    MOC: {
      body: '#228B22', bodyLight: '#90EE90', bodyDark: '#006400',
      belly: '#E8F5E9', feet: '#006400',
      eye: '#228B22', eyeDark: '#1B5E20', blush: '#FFB6C1',
      glow: '#228B22', sparkle: '#90EE90'
    },
    THUY: {
      body: '#1E90FF', bodyLight: '#87CEEB', bodyDark: '#0052CC',
      belly: '#E3F2FD', feet: '#0052CC',
      eye: '#1E90FF', eyeDark: '#0D47A1', blush: '#FFB6C1',
      glow: '#1E90FF', sparkle: '#87CEEB'
    },
    HOA: {
      body: '#FF4500', bodyLight: '#FF8C00', bodyDark: '#CC2200',
      belly: '#FFF3E0', feet: '#CC2200',
      eye: '#FF6347', eyeDark: '#B71C1C', blush: '#FFB6C1',
      glow: '#FF4500', sparkle: '#FFA07A'
    },
    THO: {
      body: '#8B4513', bodyLight: '#DEB887', bodyDark: '#5C2E00',
      belly: '#FFF8E7', feet: '#5C2E00',
      eye: '#8B4513', eyeDark: '#3E2723', blush: '#FFDAB9',
      glow: '#D2691E', sparkle: '#DEB887'
    }
  };

  var c = base[element] || base.KIM;

  /* Rarity tint */
  if (rarity === 'rare') {
    c.glow = c.eye;
  } else if (rarity === 'legendary') {
    c.glow = '#FFD700';
    c.sparkle = '#FFD700';
  }

  return c;
}

/* ================================================================
   ★★★ EARS PER ELEMENT ★★★
   ================================================================ */
function getEars(s, colors, element) {
  if (element === 'HOA') {
    /* Fox ears — oversized, rounded */
    return '<g class="art-ears">'
      + '<ellipse cx="' + (s*0.36) + '" cy="' + (s*0.22) + '" rx="' + (s*0.06) + '" ry="' + (s*0.10) + '" transform="rotate(-20 ' + (s*0.36) + ' ' + (s*0.22) + ')" fill="' + colors.body + '" stroke="' + colors.bodyDark + '" stroke-width="1"/>'
      + '<ellipse cx="' + (s*0.36) + '" cy="' + (s*0.24) + '" rx="' + (s*0.03) + '" ry="' + (s*0.06) + '" transform="rotate(-20 ' + (s*0.36) + ' ' + (s*0.24) + ')" fill="' + colors.blush + '" opacity="0.5"/>'
      + '<ellipse cx="' + (s*0.64) + '" cy="' + (s*0.22) + '" rx="' + (s*0.06) + '" ry="' + (s*0.10) + '" transform="rotate(20 ' + (s*0.64) + ' ' + (s*0.22) + ')" fill="' + colors.body + '" stroke="' + colors.bodyDark + '" stroke-width="1"/>'
      + '<ellipse cx="' + (s*0.64) + '" cy="' + (s*0.24) + '" rx="' + (s*0.03) + '" ry="' + (s*0.06) + '" transform="rotate(20 ' + (s*0.64) + ' ' + (s*0.24) + ')" fill="' + colors.blush + '" opacity="0.5"/>'
      + '</g>';
  }
  if (element === 'KIM') {
    /* Bird tufts */
    return '<g class="art-ears">'
      + '<path d="M ' + (s*0.38) + ' ' + (s*0.22) + ' L ' + (s*0.32) + ' ' + (s*0.12) + ' L ' + (s*0.40) + ' ' + (s*0.18) + ' Z" fill="' + colors.body + '" stroke="' + colors.bodyDark + '" stroke-width="1"/>'
      + '<path d="M ' + (s*0.62) + ' ' + (s*0.22) + ' L ' + (s*0.68) + ' ' + (s*0.12) + ' L ' + (s*0.60) + ' ' + (s*0.18) + ' Z" fill="' + colors.body + '" stroke="' + colors.bodyDark + '" stroke-width="1"/>'
      + '</g>';
  }
  if (element === 'THUY') {
    /* Small fins */
    return '<g class="art-ears">'
      + '<ellipse cx="' + (s*0.33) + '" cy="' + (s*0.30) + '" rx="' + (s*0.04) + '" ry="' + (s*0.06) + '" transform="rotate(-30 ' + (s*0.33) + ' ' + (s*0.30) + ')" fill="' + colors.bodyLight + '" stroke="' + colors.bodyDark + '" stroke-width="1" opacity="0.8"/>'
      + '<ellipse cx="' + (s*0.67) + '" cy="' + (s*0.30) + '" rx="' + (s*0.04) + '" ry="' + (s*0.06) + '" transform="rotate(30 ' + (s*0.67) + ' ' + (s*0.30) + ')" fill="' + colors.bodyLight + '" stroke="' + colors.bodyDark + '" stroke-width="1" opacity="0.8"/>'
      + '</g>';
  }
  if (element === 'MOC') {
    /* Leaf sprouts */
    return '<g class="art-ears">'
      + '<path d="M ' + (s*0.5) + ' ' + (s*0.18) + ' Q ' + (s*0.42) + ' ' + (s*0.08) + ' ' + (s*0.38) + ' ' + (s*0.14) + ' Q ' + (s*0.44) + ' ' + (s*0.16) + ' ' + (s*0.5) + ' ' + (s*0.18) + ' Z" fill="' + colors.bodyLight + '" stroke="' + colors.bodyDark + '" stroke-width="1"/>'
      + '<path d="M ' + (s*0.5) + ' ' + (s*0.18) + ' Q ' + (s*0.58) + ' ' + (s*0.08) + ' ' + (s*0.62) + ' ' + (s*0.14) + ' Q ' + (s*0.56) + ' ' + (s*0.16) + ' ' + (s*0.5) + ' ' + (s*0.18) + ' Z" fill="' + colors.bodyLight + '" stroke="' + colors.bodyDark + '" stroke-width="1"/>'
      + '</g>';
  }
  /* THO — crystal horn */
  return '<g class="art-ears">'
    + '<polygon points="' + (s*0.5) + ',' + (s*0.10) + ' ' + (s*0.46) + ',' + (s*0.20) + ' ' + (s*0.54) + ',' + (s*0.20) + '" fill="#E8E0D0" stroke="' + colors.bodyDark + '" stroke-width="1"/>'
    + '<polygon points="' + (s*0.5) + ',' + (s*0.12) + ' ' + (s*0.48) + ',' + (s*0.18) + ' ' + (s*0.52) + ',' + (s*0.18) + '" fill="#FFD700" opacity="0.5"/>'
    + '</g>';
}

/* ================================================================
   ★★★ ACCESSORY PER CREATURE ID ★★★
   ================================================================ */
function getCreatureAccessory(id) {
  var s = 200;
  var accessories = {
    1: /* Kim Ưng — tiny crown */ '<circle cx="100" cy="68" r="8" fill="none" stroke="#FFD700" stroke-width="2"/><polygon points="92,68 96,58 100,66 104,58 108,68" fill="#FFD700"/>',
    2: /* Bạch Hổ — tiara */ '<polygon points="90,72 95,62 100,70 105,62 110,72" fill="none" stroke="#C0C0C0" stroke-width="1.5"/><circle cx="100" cy="64" r="3" fill="#0F52BA"/>',
    3: /* Kim Long — crown */ '<polygon points="85,70 88,56 93,66 100,52 107,66 112,56 115,70" fill="#FFD700" stroke="#B8860B" stroke-width="1"/><circle cx="100" cy="56" r="4" fill="#FF4444"/><circle cx="90" cy="62" r="2.5" fill="#4CAF50"/><circle cx="110" cy="62" r="2.5" fill="#448AFF"/>',
    4: /* Mộc Xà — flower */ '<circle cx="95" cy="66" r="6" fill="#FFB6C1"/><circle cx="105" cy="66" r="6" fill="#FFB6C1"/><circle cx="100" cy="62" r="6" fill="#FFB6C1"/><circle cx="100" cy="66" r="3" fill="#FFEB3B"/>',
    5: /* Thanh Lân — gem spikes */ '<polygon points="92,68 94,56 96,68" fill="#50C878" opacity="0.8"/><polygon points="98,66 100,52 102,66" fill="#50C878" opacity="0.8"/><polygon points="104,68 106,56 108,68" fill="#50C878" opacity="0.8"/>',
    6: /* Mộc Hoàng — peacock crown */ '<path d="M85,72 Q92,52 100,60 Q108,52 115,72" fill="none" stroke="#FFD700" stroke-width="2"/><circle cx="100" cy="56" r="5" fill="#008080"/><circle cx="100" cy="56" r="2.5" fill="#FFD700"/>',
    7: /* Thủy Quy — droplet */ '<path d="M100,58 Q95,68 100,74 Q105,68 100,58Z" fill="#87CEEB" stroke="#1E90FF" stroke-width="1"/>',
    8: /* Giao Long — crystal fin */ '<path d="M88,66 Q82,50 88,54 Q94,58 88,66Z" fill="#0F52BA" opacity="0.7"/><path d="M112,66 Q118,50 112,54 Q106,58 112,66Z" fill="#0F52BA" opacity="0.7"/>',
    9: /* Huyền Vũ — star crest */ '<polygon points="100,52 103,62 113,62 105,68 108,78 100,72 92,78 95,68 87,62 97,62" fill="#FFD700" opacity="0.6"/>',
    10: /* Hỏa Ly — flame tufts */ '<path d="M92,60 Q88,48 94,52 Q96,44 100,50" fill="#FF4500" opacity="0.7"/><path d="M100,50 Q100,42 104,48 Q108,40 112,52" fill="#FF6347" opacity="0.7"/>',
    11: /* Xích Phượng — flame crown */ '<path d="M88,70 Q85,52 92,58 Q94,48 100,56 Q106,48 108,58 Q115,52 112,70" fill="#DC143C" opacity="0.6" stroke="#FF4500" stroke-width="1"/>',
    12: /* Chu Tước — divine crown */ '<polygon points="85,72 88,54 93,64 100,50 107,64 112,54 115,72" fill="#FF4500" stroke="#FFD700" stroke-width="1.5"/><circle cx="100" cy="54" r="5" fill="#FFD700"/><circle cx="100" cy="54" r="2" fill="#fff" opacity="0.7"/>',
    13: /* Thổ Giáp — rainbow crystal */ '<polygon points="100,54 94,66 106,66" fill="#FFD700" opacity="0.5"/><polygon points="100,54 96,66 104,66" fill="#FF69B4" opacity="0.5"/><polygon points="100,54 98,66 102,66" fill="#87CEEB" opacity="0.5"/>',
    14: /* Huyền Giáp — armor plates */ '<rect x="82" y="76" width="36" height="8" rx="3" fill="#FFBF00" stroke="#8B4513" stroke-width="1"/><rect x="88" y="72" width="24" height="6" rx="2" fill="#D2691E" stroke="#8B4513" stroke-width="1"/>',
    15: /* Kỳ Lân — rainbow horn */ '<path d="M100,48 Q96,58 98,66 M100,48 Q104,58 102,66" fill="none" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/><path d="M100,48 Q96,58 98,66 M100,48 Q104,58 102,66" fill="none" stroke="#FF69B4" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>'
  };
  return accessories[id] || '';
}

/* ================================================================
   ★★★ SPARKLE PARTICLES ★★★
   ================================================================ */
function getSparkles(s, color) {
  var html = '';
  var positions = [
    [0.15, 0.2], [0.85, 0.18], [0.12, 0.6], [0.88, 0.55],
    [0.25, 0.12], [0.75, 0.12], [0.08, 0.4], [0.92, 0.38]
  ];
  for (var i = 0; i < positions.length; i++) {
    var r = 2 + (i % 3);
    html += '<circle class="art-sparkle s' + (i%4) + '" cx="' + (s * positions[i][0]) + '" cy="' + (s * positions[i][1]) + '" r="' + r + '" fill="' + color + '" opacity="0.6"/>';
  }
  return html;
}

/* ================================================================
   ★★★ RENDER FUNCTIONS ★★★
   ================================================================ */

function renderCreatureArt(creature, size) {
  return chibiSvg(creature, size || 200);
}

function renderCreatureCard(creature, idx) {
  var el = ELEMENTS[creature.element] || ELEMENTS.KIM;
  var rarity = creature.rarity || 'common';
  var html = '';

  html += '<div class="coll-card ' + rarity + '" onclick="showCreatureDetail(' + idx + ')">';
  html += '<div class="coll-card-rarity ' + rarity + '">' + (RARITY_NAMES[rarity] || 'Thường') + '</div>';

  /* ★ Ưu tiên: AI image > SVG art > emoji ★ */
  if (creature.aiImage) {
    html += '<img src="' + creature.aiImage + '" class="coll-card-art" alt="' + creature.name + '">';
  } else {
    html += '<div class="coll-card-art">' + renderCreatureArt(creature, 80) + '</div>';
  }

  html += '<div class="coll-card-name">' + creature.name + '</div>';
  html += '<div class="coll-card-el" style="background:' + el.bg + '">' + el.icon + ' ' + el.name + '</div>';
  html += '<div class="coll-card-lvl">Lv.' + creature.level + '</div>';
  html += '</div>';

  return html;
}

function renderCreatureDetail(creature, idx) {
  var el = ELEMENTS[creature.element] || ELEMENTS.KIM;
  var rarity = creature.rarity || 'common';
  var realm = getRealm(creature.level);
  var skillCat = getSkillCategory(creature.element);

  /* Art */
  var artHtml;
  if (creature.aiImage) {
    artHtml = '<img src="' + creature.aiImage + '" class="coll-detail-art" style="width:180px;height:180px;border-radius:24px;object-fit:cover;border:2px solid rgba(255,255,255,.2);margin-bottom:12px">';
  } else {
    artHtml = '<div class="coll-detail-art" style="margin-bottom:12px">' + renderCreatureArt(creature, 180) + '</div>';
  }

  /* Stats bars */
  var stats = creature.stats || generateCreatureStats(creature);
  var budget = getTotalStatBudget(creature);
  var totalStats = 0;
  for (var k in stats) totalStats += stats[k];

  var statsHtml = '<div class="stats-container">';
  statsHtml += '<div class="stats-budget">Tổng điểm: <strong>' + totalStats + '</strong> / ' + budget + '</div>';
  for (var i = 0; i < STAT_KEYS.length; i++) {
    var key = STAT_KEYS[i];
    var info = STAT_INFO[key];
    var val = stats[key] || 0;
    var pct = val;
    statsHtml += '<div class="stat-row">'
      + '<div class="stat-icon">' + info.icon + '</div>'
      + '<div class="stat-name">' + info.name + '</div>'
      + '<div class="stat-bar">'
      +   '<div class="stat-bar-fill" style="width:' + pct + '%;background:' + info.color + '"></div>'
      + '</div>'
      + '<div class="stat-val" style="color:' + info.color + '">' + val + '</div>'
      + '</div>';
  }
  statsHtml += '</div>';

  /* Skills */
  var skills = getCreatureSkills(creature);
  var skillsHtml = '<div class="skills-container">';
  skillsHtml += '<div class="skills-header" style="color:' + skillCat.color + '">' + skillCat.icon + ' ' + skillCat.name + '</div>';
  skillsHtml += '<div class="skills-desc">' + skillCat.description + '</div>';
  for (var i = 0; i < skills.length; i++) {
    var sk = skills[i];
    var typeColor = sk.type === 'ultimate' ? '#FFD700' : sk.type === 'heal' ? '#4CAF50' : sk.type === 'shield' ? '#42A5F5' : '#FF5252';
    skillsHtml += '<div class="skill-row' + (sk.type === 'ultimate' ? ' skill-ultimate' : '') + '">'
      + '<div class="skill-icon">' + sk.icon + '</div>'
      + '<div class="skill-info">'
      +   '<div class="skill-name">' + sk.name + (sk.type === 'ultimate' ? ' <span class="skill-badge ult">ULT</span>' : '') + '</div>'
      +   '<div class="skill-desc">' + sk.desc + '</div>'
      +   '<div class="skill-meta">CD:' + sk.cooldown + ' | Lv.' + sk.levelReq + '</div>'
      + '</div>'
      + '</div>';
  }
  skillsHtml += '</div>';

  /* Transform button */
  var transformHtml;
  if (creature.aiImage) {
    transformHtml = '<button class="transform-btn done" onclick="closeCreatureDetail()">✅ Đã biến hình</button>';
  } else if (!checkAiConnection()) {
    transformHtml = '<button class="transform-btn disabled" onclick="showToast(\'Chưa kết nối AI!\')">✨ Biến hình (chưa kết nối AI)</button>';
  } else {
    transformHtml = '<button class="transform-btn" onclick="requestTransform(' + idx + ')">✨ Biến hình</button>';
  }

  return artHtml
    + '<div class="coll-detail-name">' + creature.name + '</div>'
    + '<div class="coll-detail-badges">'
    +   '<div class="coll-detail-badge" style="background:' + el.bg + '">' + el.icon + ' ' + el.name + '</div>'
    +   '<div class="coll-detail-badge" style="background:' + (RARITY_COLORS[rarity] || '#4caf50') + '">' + (RARITY_NAMES[rarity] || 'Thường') + '</div>'
    +   '<div class="coll-detail-badge" style="background:rgba(255,255,255,.1)">Lv.' + creature.level + ' ' + realm.icon + ' ' + realm.name + '</div>'
    + '</div>'
    + statsHtml
    + skillsHtml
    + transformHtml
    + '<button class="coll-detail-close" onclick="closeCreatureDetail()">Đóng</button>';
}

  /* Nút biến hình */
  var transformHtml;
  if (creature.aiImage) {
    transformHtml = '<button class="transform-btn done" onclick="closeCreatureDetail()">✅ Đã biến hình</button>';
  } else if (!checkAiConnection()) {
    transformHtml = '<button class="transform-btn disabled" onclick="showToast(\'Chưa kết nối AI! Vào Hồ sơ → Cài đặt AI.\')">✨ Biến hình (chưa kết nối AI)</button>';
  } else {
    transformHtml = '<button class="transform-btn" onclick="requestTransform(' + idx + ')">✨ Biến hình</button>';
  }

  return artHtml
    + '<div class="coll-detail-name">' + creature.name + '</div>'
    + '<div class="coll-detail-badges">'
    +   '<div class="coll-detail-badge" style="background:' + el.bg + '">' + el.icon + ' ' + el.name + '</div>'
    +   '<div class="coll-detail-badge" style="background:' + (RARITY_COLORS[rarity] || '#4caf50') + '">' + (RARITY_NAMES[rarity] || 'Thường') + '</div>'
    + '</div>'
    + '<div class="coll-detail-stats">'
    +   '<div class="coll-detail-row"><div class="coll-detail-label">Level</div><div class="coll-detail-value">Lv.' + creature.level + ' — ' + realm.icon + ' ' + realm.name + '</div></div>'
    +   '<div class="coll-detail-row"><div class="coll-detail-label">Hệ</div><div class="coll-detail-value">' + el.icon + ' ' + el.name + '</div></div>'
    +   '<div class="coll-detail-row"><div class="coll-detail-label">Hiếm</div><div class="coll-detail-value">' + (RARITY_NAMES[rarity] || 'Thường') + '</div></div>'
    +   '<div class="coll-detail-row"><div class="coll-detail-label">Bắt lúc</div><div class="coll-detail-value">' + (creature.caughtAt ? new Date(creature.caughtAt).toLocaleDateString('vi') : '—') + '</div></div>'
    +   '<div class="coll-detail-row"><div class="coll-detail-label">Bắt bằng</div><div class="coll-detail-value">' + (ELEMENTS[creature.caughtWith] ? ELEMENTS[creature.caughtWith].icon + ' ' + ELEMENTS[creature.caughtWith].name : '—') + '</div></div>'
    + '</div>'
    + transformHtml
    + '<button class="coll-detail-close" onclick="closeCreatureDetail()">Đóng</button>';
}
