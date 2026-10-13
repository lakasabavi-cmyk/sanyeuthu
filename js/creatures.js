/* creatures.js — Yêu thú DB + sinh + stats
   ★ v1.20: Thêm stat generation ★
   ============================================================ */

var RARITY_COLORS = {common:'#4caf50',rare:'#2196f3',legendary:'#ff9800'};
var RARITY_NAMES = {common:'Thường',rare:'Hiếm',legendary:'Huyền thoại'};

var CREATURE_DB = [
  {id:1,name:'Kim Ưng',element:'KIM',emoji:'🦅',rarity:'common',minLvl:1,maxLvl:10},
  {id:2,name:'Bạch Hổ',element:'KIM',emoji:'🐅',rarity:'rare',minLvl:15,maxLvl:35},
  {id:3,name:'Kim Long',element:'KIM',emoji:'🐲',rarity:'legendary',minLvl:40,maxLvl:80},
  {id:4,name:'Mộc Xà',element:'MOC',emoji:'🐍',rarity:'common',minLvl:1,maxLvl:10},
  {id:5,name:'Thanh Lân',element:'MOC',emoji:'🦎',rarity:'rare',minLvl:15,maxLvl:35},
  {id:6,name:'Mộc Hoàng',element:'MOC',emoji:'🦚',rarity:'legendary',minLvl:40,maxLvl:80},
  {id:7,name:'Thủy Quy',element:'THUY',emoji:'🐢',rarity:'common',minLvl:1,maxLvl:10},
  {id:8,name:'Giao Long',element:'THUY',emoji:'🐉',rarity:'rare',minLvl:15,maxLvl:35},
  {id:9,name:'Huyền Vũ',element:'THUY',emoji:'🐋',rarity:'legendary',minLvl:40,maxLvl:80},
  {id:10,name:'Hỏa Ly',element:'HOA',emoji:'🦊',rarity:'common',minLvl:1,maxLvl:10},
  {id:11,name:'Xích Phượng',element:'HOA',emoji:'🦅',rarity:'rare',minLvl:15,maxLvl:35},
  {id:12,name:'Chu Tước',element:'HOA',emoji:'🐦',rarity:'legendary',minLvl:40,maxLvl:80},
  {id:13,name:'Thổ Giáp',element:'THO',emoji:'🐗',rarity:'common',minLvl:1,maxLvl:10},
  {id:14,name:'Huyền Giáp',element:'THO',emoji:'🦎',rarity:'rare',minLvl:15,maxLvl:35},
  {id:15,name:'Kỳ Lân',element:'THO',emoji:'🦄',rarity:'legendary',minLvl:40,maxLvl:80}
];

function placeCreature(c) {
  var angle = Math.random() * 360;
  var dist = CONFIG.SPAWN_MIN + Math.random() * (CONFIG.SPAWN_MAX - CONFIG.SPAWN_MIN);
  c.lat = playerLat + (dist * Math.cos(angle * Math.PI / 180)) / 111320;
  c.lng = playerLng + (dist * Math.sin(angle * Math.PI / 180)) / (111320 * Math.cos(playerLat * Math.PI / 180));
}

/* Công cụ test: thêm yêu thú ngẫu nhiên vào túi thợ săn */
function grantTestCreatures(n) {
  n = n || 20;
  if (!GS.collection) GS.collection = [];
  for (var i = 0; i < n; i++) {
    var base = CREATURE_DB[Math.floor(Math.random() * CREATURE_DB.length)];
    var lvl = base.minLvl + Math.floor(Math.random() * (base.maxLvl - base.minLvl + 1));
    var c = Object.assign({}, base, {
      level: lvl, lat: 0, lng: 0,
      escapeChances: 0, escapeAttemptsUsed: 0,
      caughtAt: Date.now(), caughtWith: 'TEST'
    });
    c.stats = generateCreatureStats(c);
    GS.collection.push(c);
  }
  GS.caught = (GS.caught || 0) + n;
  saveState();
  return n;
}

function generateCreature() {
  var pL = GS.level;
  var cands = CREATURE_DB.filter(function(c) { return c.minLvl <= pL + 5 && c.maxLvl >= pL - 2; });
  var base = cands[Math.floor(Math.random() * cands.length)] || CREATURE_DB[0];
  var cL = Math.max(base.minLvl, Math.min(base.maxLvl, pL + Math.floor(Math.random() * 8) - 3));

  var c = Object.assign({}, base, {
    level: cL,
    lat: 0, lng: 0,
    escapeChances: CONFIG.ESCAPE_MIN + Math.floor(Math.random() * (CONFIG.ESCAPE_MAX - CONFIG.ESCAPE_MIN + 1)),
    escapeAttemptsUsed: 0
  });

  /* ★ v1.20: Sinh stats ★ */
  c.stats = generateCreatureStats(c);

  placeCreature(c);
  return c;
}
