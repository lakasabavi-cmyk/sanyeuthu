/* ============================================================
   ui.js — UI + Auth + Search + Collection + Profile + Avatar
   ★ v1.40: Avatar picker + Account name + HUD mới
   ============================================================ */

/* ===== SCREEN ===== */
function showScreen(id){
  if(typeof SFX!=='undefined') SFX.play('screen');
  var ss=document.querySelectorAll('.screen');
  for(var i=0;i<ss.length;i++)ss[i].classList.remove('active');
  document.getElementById(id).classList.add('active');
  if(id==='screen-ar'){applyDisplayMode(GS.displayMode||'auto');initGPS();updateHUD();renderBalls();}
  if(id==='screen-profile')updateProfile();
  if(id==='screen-collection')updateCollection();
  if(id==='screen-pills')updatePillBag();
}

var _toastTimer=null;
function showToast(m,d){
  d=d||3000;
  var t=document.getElementById('toast');
  t.textContent=m;
  var ar=document.getElementById('screen-ar');
  t.classList.toggle('on-ar',!!(ar&&ar.classList.contains('active')));
  t.classList.add('show');
  document.body.classList.add('toast-on');
  clearTimeout(_toastTimer);
  _toastTimer=setTimeout(function(){t.classList.remove('show');document.body.classList.remove('toast-on');},d);
}

function showCompassPrompt(){
  if(displayModeActive!=='camera'||_compassOn) return;
  var prompt=document.getElementById('compass-prompt');
  if(prompt) prompt.classList.add('active');
}

function closeCompassPrompt(){
  var prompt=document.getElementById('compass-prompt');
  if(prompt) prompt.classList.remove('active');
}

function enableCompassFromPrompt(){
  closeCompassPrompt();
  if(!_compassOn) activateCompass();
}

/* ===== HUD ===== */
function updateHUD(){
  var r=getRealm(GS.level);
  /* ★ Name + Level ★ */
  var nameEl=document.getElementById('hud-name');
  if(nameEl) nameEl.textContent=getAccountName();
  var lvEl=document.getElementById('hud-level');
  if(lvEl) lvEl.textContent=GS.level;
  /* ★ Realm ★ */
  var realmEl=document.getElementById('hud-realm');
  if(realmEl) realmEl.textContent=r.icon+' '+r.name;
  /* ★ XP bar ★ */
  document.getElementById('hud-xp-fill').style.width=Math.min(100,(GS.xp/xpForLevel(GS.level))*100)+'%';
}

/* ===== ACCOUNT NAME ===== */
function getAccountName(){
  if(GS.user && GS.user.accountName) return GS.user.accountName;
  if(GS.user && GS.user.email){
    return GS.user.email.split('@')[0];
  }
  return 'Người chơi';
}

function updateAccountName(name){
  if(!GS.user) return;
  GS.user.accountName=name||GS.user.email.split('@')[0];
  saveState();
  updateHUD();
  showToast('✅ Đã đổi tên thành: '+getAccountName(),3000);
}

/* ===== LOGOUT ===== */
function doLogout(){
  if(!confirm('Đăng xuất khỏi tài khoản?')) return;
  if(!authClient){showToast('Dịch vụ đăng nhập chưa sẵn sàng.');return;}
  authClient.auth.signOut()
    .then(function(result){
      if(result.error){
        showAuthError('Đăng xuất thất bại',result.error);
        return;
      }
      GS.user=null;
      saveState();
      showScreen('screen-login');
      showToast('Đã đăng xuất',2000);
    })
    .catch(function(error){showAuthError('Đăng xuất thất bại',error);});
}

/* ===== PROFILE ===== */
function updateProfile(){
  if(typeof syncSoundSettings==='function') syncSoundSettings();
  var r=getRealm(GS.level);
  var name=getAccountName();

  /* Avatar */
  var avEl=document.getElementById('profile-avatar');
  if(avEl){
    if(GS.user && GS.user.avatarType==='image' && GS.user.avatarData){
      avEl.innerHTML='<img src="'+GS.user.avatarData+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
    }else if(GS.user && GS.user.avatarType==='creature' && GS.user.avatarData){
      avEl.innerHTML='<img src="'+GS.user.avatarData+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
    }else if(GS.user && GS.user.avatar){
      avEl.textContent=GS.user.avatar;
    }else{
      avEl.textContent='🧙';
    }
  }

  /* Name input */
  var nameInput=document.getElementById('profile-name-input');
  if(nameInput) nameInput.value=name;

  /* Email */
  var emailEl=document.getElementById('profile-email');
  if(emailEl) emailEl.textContent=(GS.user&&GS.user.email)?GS.user.email:'';

  /* Realm + Level */
  document.getElementById('profile-realm').textContent=r.icon+' '+r.name;
  document.getElementById('profile-level').textContent='Level '+GS.level+' — '+GS.xp+'/'+xpForLevel(GS.level)+' XP';

  /* XP bar */
  var xpFill=document.getElementById('profile-xp-fill');
  if(xpFill) xpFill.style.width=Math.min(100,(GS.xp/xpForLevel(GS.level))*100)+'%';

  /* Stats */
  document.getElementById('stat-caught').textContent=GS.caught;
  document.getElementById('stat-failed').textContent=GS.failed;
  var t=GS.caught+GS.failed;
  document.getElementById('stat-rate').textContent=(t>0?Math.round(GS.caught/t*100):0)+'%';
  document.getElementById('stat-total-xp').textContent=GS.totalXp;
}

/* ===== AVATAR PICKER ===== */
var AVATAR_EMOJIS=['🧙','🧙‍♂️','🧙‍♀️','🧝','🧝‍♂️','🧚','🧚‍♂️','🦹','🦸','🧙','👹','👺','👽','🐱','🐶','🦊','🐯','🦁','🐻','🐼','🐨','🦄','🐉','🦅','🦉','🐍','🐢','🦎','🐙','🦑','🦋','🌸','🔥','⚡','🌊','🏔️','⚔️','🛡️','🔮','💊','✨','💎','👑','🌟','🌙'];

function openAvatarPicker(){
  var overlay=document.getElementById('avatar-picker-overlay');
  if(!overlay) return;

  /* Emoji grid */
  var emojiGrid=document.getElementById('ap-emoji-grid');
  emojiGrid.innerHTML='';
  AVATAR_EMOJIS.forEach(function(em){
    var d=document.createElement('div');
    d.className='ap-emoji-item';
    d.textContent=em;
    d.onclick=function(){setAvatar('emoji',em);};
    emojiGrid.appendChild(d);
  });

  /* Creature grid */
  var cGrid=document.getElementById('ap-creature-grid');
  cGrid.innerHTML='';
  var creatures=GS.collection||[];
  if(creatures.length===0){
    cGrid.innerHTML='<div class="ap-empty">Chưa có yêu thú nào</div>';
  }else{
    creatures.forEach(function(c,i){
      var d=document.createElement('div');
      d.className='ap-creature-item';
      d.innerHTML=renderCreatureArt(c,50);
      d.onclick=function(){
        if(c.aiImage){setAvatar('creature',c.aiImage);}
        else{setAvatar('emoji',c.emoji||'🐾');}
      };
      cGrid.appendChild(d);
    });
  }

  /* AI images grid */
  var aiGrid=document.getElementById('ap-ai-grid');
  var aiSection=document.getElementById('ap-ai-section');
  aiGrid.innerHTML='';
  var hasAi=false;
  creatures.forEach(function(c){
    if(c.aiImage){
      hasAi=true;
      var img=document.createElement('div');
      img.className='ap-ai-item';
      img.innerHTML='<img src="'+c.aiImage+'" style="width:100%;height:100%;object-fit:cover;border-radius:10px">';
      img.onclick=function(){setAvatar('creature',c.aiImage);};
      aiGrid.appendChild(img);
    }
  });
  if(aiSection) aiSection.style.display=hasAi?'':'none';

  overlay.classList.add('active');
}

function closeAvatarPicker(){
  var overlay=document.getElementById('avatar-picker-overlay');
  if(overlay) overlay.classList.remove('active');
}

function setAvatar(type,data){
  if(!GS.user) GS.user={};
  GS.user.avatarType=type;
  GS.user.avatarData=data;
  if(type==='emoji') GS.user.avatar=data;
  saveState();
  closeAvatarPicker();
  updateProfile();
  showToast('✅ Đã đổi avatar!',2000);
}

function handleAvatarUpload(event){
  var file=event.target.files[0];
  if(!file) return;
  var reader=new FileReader();
  reader.onload=function(e){
    setAvatar('image',e.target.result);
  };
  reader.readAsDataURL(file);
}

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

  grid.innerHTML='';
  for(var i=0;i<f.length;i++){
    grid.innerHTML+=renderCreatureCard(f[i], creatures.indexOf(f[i]));
  }
}

function filterCollection(el,btn){
  currentFilter=el;
  document.querySelectorAll('.coll-fb').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  updateCollection();
}

function showCreatureDetail(idx){
  var c=GS.collection[idx];if(!c)return;
  var m=document.getElementById('coll-detail');if(m)m.remove();
  var modal=document.createElement('div');
  modal.className='coll-detail active';
  modal.id='coll-detail';
  modal.innerHTML=renderCreatureDetail(c, idx);
  document.body.appendChild(modal);
}

function closeCreatureDetail(){var m=document.getElementById('coll-detail');if(m)m.remove();}

/* ===== AUTH ===== */
function toggleRegister(){
  var l=document.getElementById('login-form'),r=document.getElementById('register-form');
  if(l.style.display==='none'){l.style.display='';r.style.display='none';}
  else{l.style.display='none';r.style.display='';}
}

function handleLogin(){
  var e=document.getElementById('input-email').value.trim();
  var p=document.getElementById('input-password').value;
  if(!e||!p){showToast('Nhập email và mật khẩu');return;}
  if(!authClient){showToast('Dịch vụ đăng nhập chưa sẵn sàng. Hãy tải lại trang.');return;}
  setAuthButtonsDisabled(true);
  authClient.auth.signInWithPassword({email:e,password:p})
    .then(function(result){
      if(result.error) showAuthError('Đăng nhập thất bại',result.error);
    })
    .catch(function(error){showAuthError('Đăng nhập thất bại',error);})
    .then(function(){setAuthButtonsDisabled(false);});
}

function handleRegister(){
  var n=document.getElementById('reg-name').value.trim();
  var e=document.getElementById('reg-email').value.trim();
  var p=document.getElementById('reg-password').value;
  if(!n||!e||!p){showToast('Điền tên, email và mật khẩu');return;}
  if(!authClient){showToast('Dịch vụ đăng nhập chưa sẵn sàng. Hãy tải lại trang.');return;}
  setAuthButtonsDisabled(true);
  authClient.auth.signUp({
    email:e,
    password:p,
    options:{data:{display_name:n},emailRedirectTo:getAuthRedirectUrl()}
  })
    .then(function(result){
      if(result.error){
        showAuthError('Đăng ký thất bại',result.error);
      }else if(!result.data.session){
        showToast('Đăng ký thành công. Hãy mở email để xác nhận tài khoản.',5000);
      }
    })
    .catch(function(error){showAuthError('Đăng ký thất bại',error);})
    .then(function(){setAuthButtonsDisabled(false);});
}

function handleSocialLogin(provider){
  if(provider!=='google'&&provider!=='apple'){
    showToast('Nhà cung cấp đăng nhập không được hỗ trợ.');
    return;
  }
  if(!authClient){showToast('Dịch vụ đăng nhập chưa sẵn sàng. Hãy tải lại trang.');return;}
  setAuthButtonsDisabled(true);
  authClient.auth.signInWithOAuth({
    provider:provider,
    options:{redirectTo:getAuthRedirectUrl()}
  })
    .then(function(result){
      if(result.error){
        showAuthError('Không thể đăng nhập bằng '+(provider==='google'?'Google':'Apple'),result.error);
        setAuthButtonsDisabled(false);
      }
    })
    .catch(function(error){
      showAuthError('Không thể đăng nhập bằng '+(provider==='google'?'Google':'Apple'),error);
      setAuthButtonsDisabled(false);
    });
}

function handleGoogleLogin(){handleSocialLogin('google');}

/* ===== SEARCH (delegate to gameflow) ===== */
function startSearch(){
  if(typeof startSearchPhase==='function') startSearchPhase();
}

/* ===== NOTIF ===== */
function closeNotifFound(){document.getElementById('notif-found').classList.remove('show');}

/* ================================================================
   ★★★ INIT ★★★
   ================================================================ */
loadState();
initAuth();
if(checkDailyReset()){showToast('🌅 Chúc ngày mới! +1 bảo bối mỗi loại!',5000);}
renderBalls();
renderAR();

/* Tự động toàn màn hình trên trình duyệt điện thoại (cần một lần chạm; iPhone Safari không hỗ trợ) */
(function autoFullscreen() {
  var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone || (window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  var el = document.documentElement;
  var req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!mobile || standalone || !req) return;
  function enter() {
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    try {
      var p = req.call(el, {navigationUI: 'hide'});
      if (p && p.catch) p.catch(function() {});
    } catch (e) {}
  }
  ['touchend', 'click'].forEach(function(t) { document.addEventListener(t, enter, true); });
})();
console.log('🔮 PHỤC YÊU AI v1.52');
