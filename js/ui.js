/* ============================================================
   ui.js — UI + Auth + Search + Collection + Init
   ★ v1.06: Gọi checkDailyReset khi init ★
   ============================================================ */

/* ===== UI ===== */
function showScreen(id){
  var ss=document.querySelectorAll('.screen');
  for(var i=0;i<ss.length;i++)ss[i].classList.remove('active');
  document.getElementById(id).classList.add('active');
  if(id==='screen-ar'){startCamera();initGPS();updateHUD();renderBalls();}
  if(id==='screen-profile')updateProfile();
  if(id==='screen-collection')updateCollection();
}
function showToast(m,d){d=d||3000;var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},d);}
function updateHUD(){var r=getRealm(GS.level);document.getElementById('hud-level').textContent='Level '+GS.level;document.getElementById('hud-realm').textContent=r.icon+' '+r.name;document.getElementById('hud-xp-fill').style.width=Math.min(100,(GS.xp/xpForLevel(GS.level))*100)+'%';}
function updateProfile(){var r=getRealm(GS.level);document.getElementById('profile-realm').textContent=r.icon+' '+r.name;document.getElementById('profile-level').textContent='Level '+GS.level+' — '+GS.xp+'/'+xpForLevel(GS.level)+' XP';document.getElementById('stat-caught').textContent=GS.caught;document.getElementById('stat-failed').textContent=GS.failed;var t=GS.caught+GS.failed;document.getElementById('stat-rate').textContent=(t>0?Math.round(GS.caught/t*100):0)+'%';document.getElementById('stat-total-xp').textContent=GS.totalXp;}

/* ===== COLLECTION ===== */
var currentFilter='all';
function updateCollection(){
  var grid=document.getElementById('coll-grid');
  var countEl=document.getElementById('coll-count');
  var creatures=GS.collection||[];
  countEl.textContent=creatures.length+' con';

  if(!creatures.length){
    grid.innerHTML='<div class="coll-empty"><div class="coll-empty-icon">🐾</div><div class="coll-empty-text">Chưa có yêu thú nào!</div><div class="coll-empty-hint">Bấm 🔍 để tìm và bắt</div></div>';
    return;
  }

  var f=currentFilter==='all'?creatures:creatures.filter(function(c){return c.element===currentFilter;});
  if(!f.length){
    grid.innerHTML='<div class="coll-empty"><div class="coll-empty-icon">🔍</div><div class="coll-empty-text">Không có yêu thú hệ này</div></div>';
    return;
  }

  /* ★ Dùng creature-art renderCard ★ */
  grid.innerHTML='';
  for(var i=0;i<f.length;i++){
    grid.innerHTML+=renderCreatureCard(f[i], creatures.indexOf(f[i]));
  }
}
function filterCollection(el,btn){currentFilter=el;document.querySelectorAll('.coll-fb').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');updateCollection();}
function showCreatureDetail(idx){
  var c=GS.collection[idx];if(!c)return;
  var m=document.getElementById('coll-detail');if(m)m.remove();

  /* ★ Dùng creature-art renderDetail ★ */
  var modal=document.createElement('div');
  modal.className='coll-detail active';
  modal.id='coll-detail';
  modal.innerHTML=renderCreatureDetail(c, idx);
  document.body.appendChild(modal);
}
function closeCreatureDetail(){var m=document.getElementById('coll-detail');if(m)m.remove();}

/* ===== AUTH ===== */
function toggleRegister(){var l=document.getElementById('login-form'),r=document.getElementById('register-form');if(l.style.display==='none'){l.style.display='';r.style.display='none';}else{l.style.display='none';r.style.display='';}}
function handleLogin(){
  var e=document.getElementById('input-email').value,p=document.getElementById('input-password').value;
  if(!e||!p){showToast('Nhập thông tin');return;}
  GS.user={email:e,name:e.split('@')[0]};
  saveState();
  showScreen('screen-ar');
  showToast('Đăng nhập thành công!',3000);
  /* ★ Hiện compass prompt ★ */
  setTimeout(function(){ showCompassPrompt(); }, 500);
}
function handleRegister(){
  var n=document.getElementById('reg-name').value,e=document.getElementById('reg-email').value;
  if(!n||!e){showToast('Điền đủ');return;}
  GS.user={email:e,name:n};
  saveState();
  showScreen('screen-ar');
}
function handleGoogleLogin(){
  GS.user={email:'google@gmail.com',name:'Thợ Săn'};
  saveState();
  showScreen('screen-ar');
}

/* ===== SEARCH ===== */
var searchActive=false;
function startSearch(){
  startSearchPhase();
}
function triggerDetection(){
  var creature=generateCreature();
  GS.currentTarget=creature;saveState();
  var el=ELEMENTS[creature.element],realm=getRealm(creature.level);
  document.getElementById('notif-found-icon').textContent=creature.emoji;
  document.getElementById('notif-found-name').innerHTML='Tìm thấy <strong>'+creature.name+'</strong>';
  document.getElementById('notif-found-detail').innerHTML=el.icon+' '+el.name+' | Lv.'+creature.level+' | '+realm.icon+' '+realm.name;
  document.getElementById('notif-found').classList.add('show');
  document.getElementById('ar-distance').style.display='';
  renderBalls();
  setTimeout(function(){closeNotifFound();},5000);
  if(!compassActive){showToast('👉 Bấm 🧭 La bàn để tìm đường!',5000);}
}
function closeNotifFound(){document.getElementById('notif-found').classList.remove('show');}

/* ================================================================
   ★★★ INIT — Daily reset + render ★★★
   ================================================================ */
loadState();

/* ★ Daily reset: 00:00 tặng +1 mỗi loại ★ */
if(checkDailyReset()){
  showToast('🌅 Chúc ngày mới! +1 bảo bối mỗi loại!',5000);
}

renderBalls();
renderAR();
console.log('🔮 Yêu Thú Săn Bắt v1.06');
