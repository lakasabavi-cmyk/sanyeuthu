/* ============================================================
   MODULE: ui.js
   Chức năng: UI + Auth + Search + Fullscreen + Init
   ★ ĐÃ BỎ manual turn + notification "Truy tìm" ★
   ★ THAY BẰNG KÍNH LÚP 🔍 TRÊN SIDE NAV ★
   ============================================================ */

/* ===== FULLSCREEN ===== */
function isFullscreen(){
  return !!(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement);
}
function toggleFullscreen(){if(isFullscreen())exitFullscreen();else enterFullscreen();}
function enterFullscreen(){
  var el=document.documentElement;
  if(el.requestFullscreen)el.requestFullscreen().catch(function(){});
  else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();
  else if(el.mozRequestFullScreen)el.mozRequestFullScreen();
  else if(el.msRequestFullscreen)el.msRequestFullscreen();
  if(/iPhone|iPad/i.test(navigator.userAgent)){window.scrollTo(0,1);setTimeout(function(){window.scrollTo(0,0);},100);}
  updateFullscreenBtn();
}
function exitFullscreen(){
  if(document.exitFullscreen)document.exitFullscreen();
  else if(document.webkitExitFullscreen)document.webkitExitFullscreen();
  else if(document.mozCancelFullScreen)document.mozCancelFullScreen();
  else if(document.msExitFullscreen)document.msExitFullscreen();
  updateFullscreenBtn();
}
function updateFullscreenBtn(){
  var btn=document.getElementById('fullscreen-btn');
  if(!btn)return;
  btn.classList.toggle('fullscreen',isFullscreen());
}
['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange'].forEach(function(e){document.addEventListener(e,updateFullscreenBtn);});
function hideAddressBar(){
  if(!window.pageYOffset){setTimeout(function(){window.scrollTo(0,1);},300);setTimeout(function(){window.scrollTo(0,0);},400);}
}
window.addEventListener('orientationchange',function(){setTimeout(hideAddressBar,300);});
window.addEventListener('load',hideAddressBar);
function autoFullscreenOnMobile(){
  if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){
    try{enterFullscreen();}catch(e){}
    setTimeout(hideAddressBar,300);setTimeout(hideAddressBar,800);
  }
}

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
function updateHUD(){
  var r=getRealm(GS.level);
  document.getElementById('hud-level').textContent='Level '+GS.level;
  document.getElementById('hud-realm').textContent=r.icon+' '+r.name;
  document.getElementById('hud-xp-fill').style.width=Math.min(100,(GS.xp/xpForLevel(GS.level))*100)+'%';
}
function updateProfile(){
  var r=getRealm(GS.level);
  document.getElementById('profile-realm').textContent=r.icon+' '+r.name;
  document.getElementById('profile-level').textContent='Level '+GS.level+' — '+GS.xp+'/'+xpForLevel(GS.level)+' XP';
  document.getElementById('stat-caught').textContent=GS.caught;
  document.getElementById('stat-failed').textContent=GS.failed;
  var t=GS.caught+GS.failed;
  document.getElementById('stat-rate').textContent=(t>0?Math.round(GS.caught/t*100):0)+'%';
  document.getElementById('stat-total-xp').textContent=GS.totalXp;
}

/* ===== AUTH ===== */
function toggleRegister(){
  var l=document.getElementById('login-form'),r=document.getElementById('register-form');
  if(l.style.display==='none'){l.style.display='';r.style.display='';}
  else{l.style.display='none';r.style.display='';}
}
function handleLogin(){
  var e=document.getElementById('input-email').value,p=document.getElementById('input-password').value;
  if(!e||!p){showToast('Nhập thông tin');return;}
  GS.user={email:e,name:e.split('@')[0]};saveState();
  autoFullscreenOnMobile();showScreen('screen-ar');
  showToast('Đăng nhập! Bấm 🔍 để tìm yêu thú!',4000);
}
function handleRegister(){
  var n=document.getElementById('reg-name').value,e=document.getElementById('reg-email').value;
  if(!n||!e){showToast('Điền đủ');return;}
  GS.user={email:e,name:n};saveState();
  autoFullscreenOnMobile();showScreen('screen-ar');
}
function handleGoogleLogin(){
  GS.user={email:'google@gmail.com',name:'Thợ Săn'};saveState();
  autoFullscreenOnMobile();showScreen('screen-ar');
}

/* ================================================================
   ★★★ SEARCH — KÍNH LÚP 🔍 ★★★
   ================================================================ */
var searchActive=false;

function startSearch(){
  if(searchActive){showToast('🔍 Đang tìm...');return;}
  searchActive=true;
  document.getElementById('btn-search').classList.add('active');
  showToast('🔍 Đang quét yêu thú xung quanh...',2000);
  setTimeout(function(){triggerDetection();},2000);
}

function triggerDetection(){
  var creature=generateCreature();
  GS.currentTarget=creature;saveState();
  var el=ELEMENTS[creature.element];
  var realm=getRealm(creature.level);
  document.getElementById('notif-found-icon').textContent=creature.emoji;
  document.getElementById('notif-found-name').innerHTML='Tìm thấy <strong>'+creature.name+'</strong>';
  document.getElementById('notif-found-detail').innerHTML=el.icon+' '+el.name+' | Lv.'+creature.level+' | '+realm.icon+' '+realm.name;
  document.getElementById('notif-found').classList.add('show');
  document.getElementById('ar-distance').style.display='';
  renderBalls();
  setTimeout(function(){closeNotifFound();},5000);
  if(!compassActive){showToast('👉 Bấm 🧭 La bàn để tìm đường!',5000);}
}

function closeNotifFound(){
  document.getElementById('notif-found').classList.remove('show');
}

/* ===== INIT ===== */
loadState();
renderAR();
setTimeout(hideAddressBar,200);
setTimeout(hideAddressBar,1000);
console.log('🔮 Yêu Thú Săn Bắt — Fixed Layout');
