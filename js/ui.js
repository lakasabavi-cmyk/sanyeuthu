/* ============================================================
   MODULE: ui.js
   Chức năng: UI + Auth + Detection + Main Init
   ============================================================ */

/* ===== UI ===== */
function showScreen(id){
  var ss=document.querySelectorAll('.screen');
  for(var i=0;i<ss.length;i++)ss[i].classList.remove('active');
  document.getElementById(id).classList.add('active');
  if(id==='screen-ar'){startCamera();initGPS();updateHUD();}
  if(id==='screen-profile')updateProfile();
  if(id==='screen-inventory')updateInventory();
}
function showToast(m,d){d=d||3000;var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},d);}
function updateHUD(){var r=getRealm(GS.level);document.getElementById('hud-level').textContent='Level '+GS.level;document.getElementById('hud-realm').textContent=r.icon+' '+r.name;document.getElementById('hud-xp-fill').style.width=Math.min(100,(GS.xp/xpForLevel(GS.level))*100)+'%';}
function updateProfile(){var r=getRealm(GS.level);document.getElementById('profile-realm').textContent=r.icon+' '+r.name;document.getElementById('profile-level').textContent='Level '+GS.level+' — '+GS.xp+'/'+xpForLevel(GS.level)+' XP';document.getElementById('stat-caught').textContent=GS.caught;document.getElementById('stat-failed').textContent=GS.failed;var t=GS.caught+GS.failed;document.getElementById('stat-rate').textContent=(t>0?Math.round(GS.caught/t*100):0)+'%';document.getElementById('stat-total-xp').textContent=GS.totalXp;}

/* ===== AUTH ===== */
function toggleRegister(){var l=document.getElementById('login-form'),r=document.getElementById('register-form');if(l.style.display==='none'){l.style.display='';r.style.display='none';}else{l.style.display='none';r.style.display='';}}
function handleLogin(){
  var e=document.getElementById('input-email').value,p=document.getElementById('input-password').value;
  if(!e||!p){showToast('Nhập thông tin');return;}
  GS.user={email:e,name:e.split('@')[0]};
  saveState(); showToast('Đăng nhập!');
  showScreen('screen-ar');
  // ★ Tự động hiển thị nút bật la bàn ★
  setTimeout(function(){
    if(!compassActive) showToast('👉 Bấm "Bật la bàn" để tìm yêu thú!',5000);
  },1000);
}
function handleRegister(){var n=document.getElementById('reg-name').value,e=document.getElementById('reg-email').value;if(!n||!e){showToast('Điền đủ');return;}GS.user={email:e,name:n};saveState();showToast('Chào '+n+'!');showScreen('screen-ar');}
function handleGoogleLogin(){GS.user={email:'google@gmail.com',name:'Thợ Săn'};saveState();showToast('Google OK!');showScreen('screen-ar');}

/* ===== DETECTION ===== */
function triggerDetection(){
  var creature=generateCreature();
  GS.currentTarget=creature; saveState();
  var realm=getRealm(creature.level);
  document.getElementById('notif-title').innerHTML='⚠️ Phát hiện <strong>'+creature.emoji+' '+creature.name+'</strong>';
  document.getElementById('notif-desc').innerHTML=ELEMENTS[creature.element].icon+' '+ELEMENTS[creature.element].name+' | Lv.'+creature.level+' | ~'+Math.round(getDist(playerLat,playerLng,creature.lat,creature.lng))+'m';
  document.getElementById('notification').classList.add('show');
  showToast('🔮 Đã phát hiện '+creature.emoji+' '+creature.name+'!');
}
function acceptHunt(){
  document.getElementById('notification').classList.remove('show');
  document.getElementById('ar-distance').style.display='';
  renderBalls();
  if(!compassActive) showToast('👉 Bấm "Bật la bàn" để tìm yêu thú!',5000);
}

/* ===== INIT ===== */
loadState();
renderAR();
setTimeout(function(){
  if(document.getElementById('screen-ar').classList.contains('active')) triggerDetection();
},8000);
console.log('🔮 Yêu Thú Săn Bắt — Modular Edition');
