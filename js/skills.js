/* ============================================================
   skills.js — Hệ thống kỹ năng yêu thú
   ★ v1.20: Stats (ATK/DEF/HP/SPD/SKI) + Skills ngũ hành
   ★ Combat: Board game — 1v1, 3v3, 5v5
   ============================================================ */

/* ================================================================
   ★★★ STAT SYSTEM ★★★
   5 chỉ số: ATK / DEF / HP / SPD / SKI
   Mỗi chỉ số max 100 điểm
   Tổng điểm theo rarity + level
   ================================================================ */

var STAT_KEYS = ['ATK', 'DEF', 'HP', 'SPD', 'SKI'];

var STAT_INFO = {
  ATK: {name:'Tấn công',  icon:'⚔️', desc:'Sát thương gây ra',   color:'#f44336'},
  DEF: {name:'Phòng thủ', icon:'🛡️', desc:'Giảm sát thương nhận', color:'#42a5f5'},
  HP:  {name:'Máu',       icon:'❤️', desc:'Lượng máu tối đa',    color:'#ef5350'},
  SPD: {name:'Tốc độ',    icon:'⚡', desc:'Thứ tự đi trong lượt', color:'#ffa726'},
  SKI: {name:'Kỹ năng',   icon:'✨', desc:'Độ mạnh kỹ năng',     color:'#ab47bc'}
};

/* ★ Tổng điểm tối đa theo rarity ★ */
function getMaxTotalStats(rarity) {
  switch (rarity) {
    case 'legendary': return 450;
    case 'rare':      return 400;
    default:
      return 300; /* common — sẽ tính theo level */
  }
}

/* ★ Tổng điểm theo level (cho common / không xác định rarity) ★ */
function getLevelTotalStats(level) {
  /* Level 1 → 100 điểm, Level 100 → 500 điểm, linear */
  return Math.min(500, Math.floor(100 + (level - 1) * 4));
}

/* ★ Tổng điểm chính xác ★ */
function getTotalStatBudget(creature) {
  var rarity = creature.rarity || 'common';
  var maxByRarity = getMaxTotalStats(rarity);
  var maxByLevel = getLevelTotalStats(creature.level);

  /* Lấy min của rarity cap và level cap */
  return Math.min(maxByRarity, maxByLevel);
}

/* ★ Phân phối stats theo hệ (element bias) ★ */
function getElementStatBias(element) {
  var biases = {
    KIM:  {ATK:0.30, DEF:0.15, HP:0.15, SPD:0.15, SKI:0.25},  /* chí mạng */
    MOC:  {ATK:0.15, DEF:0.20, HP:0.25, SPD:0.15, SKI:0.25},  /* hồi phục */
    THUY: {ATK:0.20, DEF:0.15, HP:0.15, SPD:0.15, SKI:0.35},  /* phép thuật */
    HOA:  {ATK:0.25, DEF:0.10, HP:0.15, SPD:0.30, SKI:0.20},  /* ảo ảnh */
    THO:  {ATK:0.15, DEF:0.35, HP:0.30, SPD:0.10, SKI:0.10}   /* phòng thủ */
  };
  return biases[element] || biases.KIM;
}

/* ★ Sinh stats cho creature ★ */
function generateCreatureStats(creature) {
  var budget = getTotalStatBudget(creature);
  var bias = getElementStatBias(creature.element);

  /* Seed ngẫu nhiên từ creature data */
  var seed = creature.level * 7 + (creature.id || 0) * 13 + (creature.caughtAt || Date.now()) % 997;
  function pseudoRandom(n) {
    var x = Math.sin(seed + n * 127.1) * 43758.5453;
    return x - Math.floor(x); /* 0-1 */
  }

  var stats = {};
  var assigned = 0;

  /* Phân phối theo bias + randomness ±10% */
  for (var i = 0; i < STAT_KEYS.length; i++) {
    var key = STAT_KEYS[i];
    var baseShare = bias[key] * budget;
    var variance = baseShare * 0.2 * (pseudoRandom(i) - 0.5); /* ±10% */
    var val = Math.round(baseShare + variance);
    val = Math.max(10, Math.min(100, val)); /* clamp 10-100 */
    stats[key] = val;
    assigned += val;
  }

  /* Adjust để tổng = budget */
  var diff = budget - assigned;
  if (diff !== 0) {
    /* Thêm/bớt vào stat cao nhất */
    var maxKey = 'ATK';
    for (var k in stats) {
      if (stats[k] > stats[maxKey]) maxKey = k;
    }
    stats[maxKey] = Math.max(10, Math.min(100, stats[maxKey] + diff));
  }

  /* Final clamp */
  for (var k in stats) {
    stats[k] = Math.max(10, Math.min(100, stats[k]));
  }

  return stats;
}

/* ================================================================
   ★★★ SKILL SYSTEM — 5 hệ ngũ hành ★★★
   ================================================================ */

var SKILL_CATEGORIES = {
  KIM: {
    name: 'Cuồng Phong',
    subtitle: 'Sát thương chí mạng',
    icon: '⚔️',
    color: '#FFD700',
    description: 'Tấn công mạnh mẽ với xác suất chí mạng cao. Thích hợp đánh nhanh thắng nhanh.',
    skills: [
      {
        id: 'kim_1', name: 'Trảm Phong', icon: '🗡️',
        type: 'attack', target: 'single',
        damage: 85, critChance: 30, critDamage: 2.5,
        cooldown: 2, levelReq: 1,
        desc: 'Nhát chém cực mạnh, 30% chí mạng (x2.5 sát thương)'
      },
      {
        id: 'kim_2', name: 'Cuồng Long Trảm', icon: '🐉',
        type: 'attack', target: 'all',
        damage: 55, critChance: 15, critDamage: 2.0,
        cooldown: 3, levelReq: 10,
        desc: 'Chém toàn bộ kẻ địch, 15% chí mạng (x2.0)'
      },
      {
        id: 'kim_3', name: 'Thiên Kiếm', icon: '⚡',
        type: 'attack', target: 'single',
        damage: 120, critChance: 50, critDamage: 3.0,
        cooldown: 5, levelReq: 25,
        desc: 'Kiếm từ trời giáng, 50% chí mạng (x3.0)'
      },
      {
        id: 'kim_4', name: 'Vạn Kiếm Quy Tông', icon: '⚔️',
        type: 'ultimate', target: 'all',
        damage: 95, critChance: 40, critDamage: 2.5,
        cooldown: 7, levelReq: 50,
        desc: 'Ultimate: Vạn kiếm tấn công toàn địch, 40% chí mạng (x2.5)'
      }
    ]
  },

  MOC: {
    name: 'Khống Chế & Hồi Phục',
    subtitle: 'Hỗ trợ & Trị liệu',
    icon: '🌿',
    color: '#228B22',
    description: 'Hồi máu cho đồng đội, khống chế kẻ địch bằng rễ cây, độc tố. Thích hợp đội hình 3-5.',
    skills: [
      {
        id: 'moc_1', name: 'Lá Trời', icon: '🍃',
        type: 'heal', target: 'ally',
        heal: 60, cooldown: 2, levelReq: 1,
        desc: 'Hồi 60 HP cho đồng minh'
      },
      {
        id: 'moc_2', name: 'Rễ Trói', icon: '🌳',
        type: 'control', target: 'single',
        damage: 35, stunChance: 50, stunTurns: 1,
        cooldown: 3, levelReq: 10,
        desc: 'Rễ cây trói kẻ địch, 50% choáng 1 lượt'
      },
      {
        id: 'moc_3', name: 'Hồi Sinh Thảo', icon: '💚',
        type: 'heal', target: 'all',
        heal: 45, cooldown: 5, levelReq: 25,
        desc: 'Hồi 45 HP cho toàn đội'
      },
      {
        id: 'moc_4', name: 'Cây Sự Sống', icon: '🌳',
        type: 'ultimate', target: 'all',
        heal: 80, buffAtk: 20, buffDef: 20,
        cooldown: 7, levelReq: 50,
        desc: 'Ultimate: Hồi 80 HP + tăng ATK/DEF 20% cho toàn đội 3 lượt'
      }
    ]
  },

  THUY: {
    name: 'Phép Thuật & Hóa Giải',
    subtitle: 'Ma thuật & Giải phép',
    icon: '💧',
    color: '#1E90FF',
    description: 'Phép thuật mạnh với hiệu ứng hóa giải buff kẻ địch. Thích hợp chiến thuật.',
    skills: [
      {
        id: 'thuy_1', name: 'Thủy Kiếm', icon: '🗡️',
        type: 'attack', target: 'single',
        damage: 70, magicBonus: 1.3,
        cooldown: 2, levelReq: 1,
        desc: 'Phép thuật mạnh, x1.3 theo chỉ số SKI'
      },
      {
        id: 'thuy_2', name: 'Hóa Giải', icon: '🔮',
        type: 'purify', target: 'enemy',
        removeBuff: true, damage: 25,
        cooldown: 3, levelReq: 10,
        desc: 'Xóa buff của kẻ địch + gây 25 sát thương'
      },
      {
        id: 'thuy_3', name: 'Bão Thủy Triều', icon: '🌊',
        type: 'attack', target: 'all',
        damage: 60, magicBonus: 1.2,
        cooldown: 5, levelReq: 25,
        desc: 'Sóng thần tấn công toàn địch, x1.2 theo SKI'
      },
      {
        id: 'thuy_4', name: 'Huyền Vũ Phép', icon: '🐢',
        type: 'ultimate', target: 'all',
        damage: 85, magicBonus: 1.5, removeBuff: true,
        cooldown: 7, levelReq: 50,
        desc: 'Ultimate: Phép thuật mạnh + xóa buff toàn địch, x1.5 theo SKI'
      }
    ]
  },

  HOA: {
    name: 'Phù Thủy & Ảo Ảnh',
    subtitle: 'Ma thuật & Tạo ảo ảnh',
    icon: '🔥',
    color: '#FF4500',
    description: 'Tạo ảo ảnh gây nhầm lẫn, hút máu, thiêu đốt. Thích hợp PvP tâm lý chiến.',
    skills: [
      {
        id: 'hoa_1', name: 'Hỏa Cầu', icon: '🔥',
        type: 'attack', target: 'single',
        damage: 75, burnChance: 40, burnDamage: 15, burnTurns: 2,
        cooldown: 2, levelReq: 1,
        desc: 'Cầu lửa, 40% thiêu đốt (15 sát thương/giờ/lượt)'
      },
      {
        id: 'hoa_2', name: 'Ảo Ảnh', icon: '👻',
        type: 'illusion', target: 'enemy',
        dodgeBuff: 40, turns: 2,
        cooldown: 3, levelReq: 10,
        desc: 'Tạo ảo ảnh, tăng 40% né tránh 2 lượt'
      },
      {
        id: 'hoa_3', name: 'Hấp Huyết', icon: '🧛',
        type: 'lifesteal', target: 'single',
        damage: 65, lifestealPercent: 50,
        cooldown: 4, levelReq: 25,
        desc: 'Hút 50% sát thương thành máu cho bản thân'
      },
      {
        id: 'hoa_4', name: 'Phượng Hoàng Hỏa', icon: '🐦',
        type: 'ultimate', target: 'all',
        damage: 80, burnChance: 60, burnDamage: 25, burnTurns: 3,
        cooldown: 7, levelReq: 50,
        desc: 'Ultimate: Phượng hoàng thiêu đốt toàn địch, 60% burn (25/3 lượt)'
      }
    ]
  },

  THO: {
    name: 'Phòng Thủ & Khiên Chắn',
    subtitle: 'Giáp vững & Bảo vệ',
    icon: '🏔️',
    color: '#8B4513',
    description: 'Khiên chắn mạnh, phản đòn, bảo vệ đồng đội. Thích hợp đội hình 3-5.',
    skills: [
      {
        id: 'tho_1', name: 'Địa Giáp', icon: '🛡️',
        type: 'shield', target: 'self',
        shieldValue: 80, shieldTurns: 3,
        cooldown: 2, levelReq: 1,
        desc: 'Tạo khiên 80 HP kéo dài 3 lượt'
      },
      {
        id: 'tho_2', name: 'Phản Đòn', icon: '🪨',
        type: 'counter', target: 'self',
        counterPercent: 40, counterTurns: 2,
        cooldown: 3, levelReq: 10,
        desc: 'Phản 40% sát thương nhận vào kẻ tấn công (2 lượt)'
      },
      {
        id: 'tho_3', name: 'Thổ Thành', icon: '🏰',
        type: 'shield', target: 'all',
        shieldValue: 50, shieldTurns: 2,
        cooldown: 5, levelReq: 25,
        desc: 'Khiên cho toàn đội 50 HP (2 lượt)'
      },
      {
        id: 'tho_4', name: 'Kỳ Lân Bảo Hộ', icon: '🦄',
        type: 'ultimate', target: 'all',
        shieldValue: 100, shieldTurns: 3, counterPercent: 30, counterTurns: 3,
        cooldown: 7, levelReq: 50,
        desc: 'Ultimate: Khiên 100 HP + phản 30% (3 lượt) cho toàn đội'
      }
    ]
  }
};

/* ================================================================
   ★★★ SKILL HELPER FUNCTIONS ★★★
   ================================================================ */

/* Lấy skills của creature dựa trên element */
function getCreatureSkills(creature) {
  var cat = SKILL_CATEGORIES[creature.element] || SKILL_CATEGORIES.KIM;
  return cat.skills.filter(function(s) {
    return creature.level >= s.levelReq;
  });
}

/* Lấy skill category */
function getSkillCategory(element) {
  return SKILL_CATEGORIES[element] || SKILL_CATEGORIES.KIM;
}

/* Tính sát thương thực tế */
function calcDamage(skill, attackerStats, defenderStats) {
  var baseDamage = skill.damage || 0;
  var atkBonus = attackerStats.ATK * 0.5; /* ATK contribution */
  var skiBonus = 0;

  if (skill.magicBonus) {
    skiBonus = attackerStats.SKI * 0.3 * skill.magicBonus;
  }

  var defReduction = defenderStats.DEF * 0.3;
  var rawDamage = baseDamage + atkBonus + skiBonus - defReduction;

  /* Crit check */
  var isCrit = false;
  var finalDamage = Math.max(1, Math.round(rawDamage));

  if (skill.critChance && Math.random() * 100 < skill.critChance) {
    isCrit = true;
    finalDamage = Math.round(finalDamage * (skill.critDamage || 2.0));
  }

  return {damage: finalDamage, isCrit: isCrit};
}

/* Tính hồi máu */
function calcHeal(skill, casterStats) {
  var baseHeal = skill.heal || 0;
  var skiBonus = casterStats.SKI * 0.3;
  return Math.max(1, Math.round(baseHeal + skiBonus));
}

/* Tính khiên */
function calcShield(skill, casterStats) {
  var baseShield = skill.shieldValue || 0;
  var defBonus = casterStats.DEF * 0.3;
  return Math.max(1, Math.round(baseShield + defBonus));
}

/* ================================================================
   ★★★ COMBAT FORMULA (cho Phase 2 Battle) ★★★
   ================================================================ */

function combatTurn(attacker, defender, skill) {
  var result = {
    type: skill.type,
    skillName: skill.name,
    skillIcon: skill.icon,
    damage: 0, heal: 0, shield: 0,
    isCrit: false,
    effects: [],
    message: ''
  };

  switch (skill.type) {
    case 'attack':
    case 'ultimate':
      var dmg = calcDamage(skill, attacker.stats, defender.stats);
      result.damage = dmg.damage;
      result.isCrit = dmg.isCrit;
      result.message = attacker.name + ' dùng ' + skill.name + ' gây ' + dmg.damage + ' sát thương' + (dmg.isCrit ? ' CHÍ MẠNG!' : '!');

      if (skill.burnChance && Math.random() * 100 < skill.burnChance) {
        result.effects.push({type: 'burn', value: skill.burnDamage, turns: skill.burnTurns});
        result.message += ' Kẻ địch bị THIÊU ĐỐT!';
      }
      if (skill.removeBuff) {
        result.effects.push({type: 'purify'});
        result.message += ' Đã hóa giải buff!';
      }
      if (skill.lifestealPercent) {
        var heal = Math.round(dmg.damage * skill.lifestealPercent / 100);
        result.heal = heal;
        result.message += ' Hút ' + heal + ' HP!';
      }
      break;

    case 'heal':
      result.heal = calcHeal(skill, attacker.stats);
      result.message = attacker.name + ' dùng ' + skill.name + ' hồi ' + result.heal + ' HP!';
      if (skill.buffAtk) result.effects.push({type: 'buffAtk', value: skill.buffAtk, turns: 3});
      if (skill.buffDef) result.effects.push({type: 'buffDef', value: skill.buffDef, turns: 3});
      break;

    case 'shield':
      result.shield = calcShield(skill, attacker.stats);
      result.message = attacker.name + ' dùng ' + skill.name + ' tạo khiên ' + result.shield + ' HP!';
      if (skill.counterPercent) {
        result.effects.push({type: 'counter', value: skill.counterPercent, turns: skill.counterTurns});
        result.message += ' + Phản đòn ' + skill.counterPercent + '%!';
      }
      break;

    case 'control':
      var ctrlDmg = calcDamage(skill, attacker.stats, defender.stats);
      result.damage = ctrlDmg.damage;
      result.message = attacker.name + ' dùng ' + skill.name + ' gây ' + ctrlDmg.damage + ' sát thương';
      if (skill.stunChance && Math.random() * 100 < skill.stunChance) {
        result.effects.push({type: 'stun', turns: skill.stunTurns});
        result.message += ' Kẻ địch bị CHOÁNG!';
      }
      break;

    case 'illusion':
      result.effects.push({type: 'dodge', value: skill.dodgeBuff, turns: skill.turns});
      result.message = attacker.name + ' dùng ' + skill.name + ' tăng ' + skill.dodgeBuff + '% né tránh ' + skill.turns + ' lượt!';
      break;

    case 'purify':
      result.effects.push({type: 'purify'});
      result.damage = skill.damage || 0;
      result.message = attacker.name + ' dùng ' + skill.name + ' hóa giải buff kẻ địch!';
      break;

    case 'lifesteal':
      var lsDmg = calcDamage(skill, attacker.stats, defender.stats);
      result.damage = lsDmg.damage;
      result.heal = Math.round(lsDmg.damage * skill.lifestealPercent / 100);
      result.message = attacker.name + ' dùng ' + skill.name + ' gây ' + lsDmg.damage + ' sát thương, hút ' + result.heal + ' HP!';
      break;

    case 'counter':
      result.effects.push({type: 'counter', value: skill.counterPercent, turns: skill.counterTurns});
      result.message = attacker.name + ' dùng ' + skill.name + ' sẵn sàng phản đòn!';
      break;
  }

  return result;
}

/* ================================================================
   ★★★ BOARD GAME FORMATION ★★★
   ================================================================ */

var FORMATIONS = {
  '1v1': {name: 'Đấu Đơn', slots: 1, description: '1 vs 1 — 2 yêu thú đối mặt'},
  '3v3': {name: 'Đấu Nhóm', slots: 3, description: '3 vs 3 — Chiến thuật team'},
  '5v5': {name: 'Đấu Chiến', slots: 5, description: '5 vs 5 — Full team battle'}
};

/* ★ Vị trí board (5 slots per side) ★ */
var BOARD_POSITIONS = [
  {id: 'front-left',   name: 'Trái trước', x: 0, y: 1},
  {id: 'front-center', name: 'Giữa trước', x: 1, y: 1},
  {id: 'front-right',  name: 'Phải trước', x: 2, y: 1},
  {id: 'back-left',    name: 'Trái sau',   x: 0, y: 0},
  {id: 'back-right',   name: 'Phải sau',   x: 2, y: 0}
];

/* ★ Tính đội hình tối ưu ★ */
function getOptimalFormation(creatures) {
  /* Sort: DEF cao → front, ATK cao → back */
  var sorted = creatures.slice().sort(function(a, b) {
    return (b.stats.DEF + b.stats.HP) - (a.stats.DEF + a.stats.HP);
  });
  return sorted;
}

/* ★ Level up stat ★ */
function levelUpStats(creature, statKey) {
  if (!creature.stats) creature.stats = generateCreatureStats(creature);
  var current = creature.stats[statKey] || 0;
  if (current >= 100) return false;

  var budget = getTotalStatBudget(creature);
  var total = 0;
  for (var k in creature.stats) total += creature.stats[k];

  if (total >= budget) {
    /* Phải giảm stat khác để tăng */
    /* Giảm stat thấp nhất có thể giảm */
    var minKey = 'ATK';
    for (var k in creature.stats) {
      if (creature.stats[k] < creature.stats[minKey] && k !== statKey) minKey = k;
    }
    if (creature.stats[minKey] <= 10) return false; /* Đã ở min */
    creature.stats[minKey] -= 1;
  }

  creature.stats[statKey] = Math.min(100, current + 1);
  return true;
}
