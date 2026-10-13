/* ============================================================
   config.js — Cấu hình + Ngũ hành + State
   ★ v1.06: Inventory x1 mỗi loại + daily reset +1 ★
   ============================================================ */

var CONFIG={
  SPAWN_MIN:2, SPAWN_MAX:5,
  CAPTURE_RANGE:5, CROSSHAIR_LOCK_PX:50, FOV:90, GYRO_MOVE_DPS:8,
  MAX_ITEM_PITCH:30, ARROW_STYLE:3, ARROW_RADIUS:78,
  XP_CAPTURE:100, XP_FAIL:-30,
  ESCAPE_MIN:1, ESCAPE_MAX:3
};

var ELEMENTS={
  KIM:{name:'Kim',icon:'⚔️',color:'#FFD700',bg:'linear-gradient(135deg,#B8860B,#FFD700)',primary:'#FFD700',glow:'#FFF8DC'},
  MOC:{name:'Mộc',icon:'🌿',color:'#228B22',bg:'linear-gradient(135deg,#006400,#228B22)',primary:'#228B22',glow:'#90EE90'},
  THUY:{name:'Thủy',icon:'💧',color:'#1E90FF',bg:'linear-gradient(135deg,#0052CC,#1E90FF)',primary:'#1E90FF',glow:'#87CEEB'},
  HOA:{name:'Hỏa',icon:'🔥',color:'#FF4500',bg:'linear-gradient(135deg,#CC2200,#FF4500)',primary:'#FF4500',glow:'#FFA07A'},
  THO:{name:'Thổ',icon:'🏔️',color:'#8B4513',bg:'linear-gradient(135deg,#5C2E00,#8B4513)',primary:'#8B4513',glow:'#DEB887'}
};
var SINH={KIM:'THUY',THUY:'MOC',MOC:'HOA',HOA:'THO',THO:'KIM'};
var KHAC={KIM:'MOC',MOC:'THO',THO:'THUY',THUY:'HOA',HOA:'KIM'};

var REALMS=[{name:'Luyện Khí',min:1,icon:'🌀'},{name:'Trúc Cơ',min:11,icon:'🏗️'},{name:'Kết Đan',min:21,icon:'💎'},{name:'Nguyên Anh',min:31,icon:'👶'},{name:'Hóa Thần',min:41,icon:'⚡'},{name:'Luyện Hư',min:51,icon:'🌌'},{name:'Hợp Thể',min:61,icon:'☯️'},{name:'Đại Thừa',min:71,icon:'🏔️'},{name:'Độ Kiếp',min:81,icon:'🌩️'},{name:'Tiên Nhân',min:91,icon:'✨'}];
function getRealm(l){for(var i=REALMS.length-1;i>=0;i--)if(l>=REALMS[i].min)return REALMS[i];return REALMS[0];}
function xpForLevel(l){return Math.floor(100*Math.pow(1.15,l-1));}

function getLevelRate(cL,pL){var d=cL-pL;if(d<=-2)return 1;if(d===-1)return .8;if(d===0)return .5;if(d===1)return .3;if(d===2)return .1;if(d===3)return .01;if(d===4)return .004;if(d===5)return .001;return 0;}
function getElemMod(b,c){if(KHAC[b]===c)return 1.5;if(SINH[b]===c)return .5;return 1;}
function getRate(b,c,cL,pL,acc){return Math.min(1,getLevelRate(cL,pL)*getElemMod(b,c)*acc);}

/* ===== GAME STATE ===== */
var GS={
  user:null, level:1, xp:0, totalXp:0, caught:0, failed:0,
  /* ★ v1.06: Khởi tạo x1 mỗi loại ★ */
  inventory:{KIM:1,MOC:1,THUY:1,HOA:1,THO:1},
  collection:[], currentTarget:null, selectedBall:'HOA',
  displayMode:'auto',
  /* ★ v1.06: Track daily reset ★ */
  lastResetDate:''
};

function loadState(){
  var s=localStorage.getItem('yeuthu_v2');
  if(s){
    try{var d=JSON.parse(s);for(var k in d)GS[k]=d[k];}catch(e){}
  }
}
function saveState(){localStorage.setItem('yeuthu_v2',JSON.stringify(GS));}

/* ================================================================
   ★★★ DAILY RESET — Mỗi ngày 00:00 tặng +1 mỗi loại ★★★
   ================================================================ */
function checkDailyReset(){
  var today=new Date().toDateString();
  if(GS.lastResetDate!==today){
    /* Tặng +1 mỗi loại bảo bối */
    for(var key in GS.inventory){
      GS.inventory[key]++;
    }
    GS.lastResetDate=today;
    saveState();
    return true;
  }
  return false;
}
