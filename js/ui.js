/* ============================================================
   MODULE: ui.js
   Chức năng: UI + Auth + Detection + Fullscreen + Main Init
   ============================================================ */

/* ===== FULLSCREEN ===== */
function isFullscreen(){
  return !!(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement);
}

function toggleFullscreen(){
  if(isFullscreen()){
    exitFullscreen();
  }else{
    enterFullscreen();
  }
}

function enterFullscreen(){
  var el=document.documentElement;

  if(el.requestFullscreen){
    el.requestFullscreen().catch(function(){});
  }else if(el.webkitRequestFullscreen){
    // iOS Safari: không hỗ trợ Fullscreen API
    el.webkitRequestFullscreen();
  }else if(el.mozRequestFullScreen){
    el.mozRequestFullScreen();
  }else if(el.msRequestFullscreen){
    el.msRequestFullscreen();
  }

  // ★ iOS Safari fallback: ẩn address bar ★
  if(navigator.userAgent.match(/iPhone|iPad/i)){
    // Thử hide address bar bằng scroll
    window.scrollTo(0,1);
    setTimeout(function(){window.scrollTo(0,0);},100);
  }

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
  if(isFullscreen()){
    btn.textContent='⛶';
    btn.classList.add('fullscreen');
    btn.title='Thoát fullscreen';
  }else{
    btn.textContent='⛶';
    btn.classList.remove('fullscreen');
    btn.title='Bật fullscreen';
  }
}

// Lắng nghe sự kiện fullscreen change
['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange'].forEach(function(evt){
  document.addEventListener(evt,updateFullscreenBtn);
});

// ★ MẶC ĐỊNH FULLSCREEN trên mobile khi vào game ★
function tryAutoFullscreen(){
  var isMobile=/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if(isMobile&&!isFullscreen()){
    // Chỉ tự động nếu user đã click (browser policy)
    // Sẽ tự động bật khi user bấm "Đăng nhập" hoặc bấm "Truy tìm"
  }
}

// ★ VOUCHESAFE: hiển thị ẩn address bar khi scroll ★
function hideAddressBar(){
  if(!window.pageYOffset){
    setTimeout(function(){window.scrollTo(0,1);},500);
    setTimeout(function(){window.scrollTo(0,0);},600);
  }
}
window.addEventListener('orientationchange',function(){setTimeout(hideAddressBar,300);});
window.addEventListener('load',hideAddressBar);

// ★ AUTO FULLSCREEN khi đăng nhập hoặc vào AR ★
function autoFullscreenOnMobile(){
  var isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if(isMobile){
    // Thử fullscreen (sẽ fail nếu không có user gesture)
    try{enterFullscreen();}catch(e){}
    // Ẩn address bar
    setTimeout(hideAddressBar,300);
    setTimeout(hideAddressBar,800);
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
  if(l.style.display==='none'){l.style.display='';r.style.display='none';}
  else{l.style.display='none';r.style.display='';}
}

function handleLogin(){
  var e=document.getElementById('input-email').value,p=document.getElementById('input-password').value;
  if(!e||!p){showToast('Nhập thông tin');return;}
  GS.user={email:e,name:e.split('@')[0]};
  saveState(); showToast('Đăng nhập!');

  // ★ TỰ ĐỘNG FULLSCREEN khi đăng nhập (user gesture) ★
  autoFullscreenOnMobile();

  showScreen('screen-ar');
  setTimeout(function(){
    if(!compassActive) showToast('👉 Bấm "Bật la bàn" để tìm yêu thú!',5000);
  },1000);
}

function handleRegister(){
  var n=document.getElementById('reg-name').value,e=document.getElementById('reg-email').value;
  if(!n||!e){showToast('Điền đủ');return;}
  GS.user={email:e,name:n};saveState();showToast('Chào '+n+'!');
  autoFullscreenOnMobile();
  showScreen('screen-ar');
}

function handleGoogleLogin(){
  GS.user={email:'google@gmail.com',name:'Thợ Săn'};
  saveState();showToast('Google OK!');
  autoFullscreenOnMobile();
  showScreen('screen-ar');
}

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

// Ẩn address bar ngay khi load
setTimeout(hideAddressBar,200);
setTimeout(hideAddressBar,1000);

setTimeout(function(){
  if(document.getElementById('screen-ar').classList.contains('active')) triggerDetection();
},8000);

console.log('🔮 Yêu Thú Săn Bắt — Fullscreen Edition');
