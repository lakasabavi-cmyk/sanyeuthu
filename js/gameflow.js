/* ============================================================
   gameflow.js — AR Flow: Vận động thực + La bàn + Căn tâm
   ★ v2.0: 1 flow duy nhất — không notify
   ★ GPS bắt buộc di chuyển thật 30-60s
   ★ Crosshair đỏ → quay camera → căn tâm → bắt
   ★ Sau kết quả → mất mũi tên → 🔍 để tìm tiếp
   ============================================================ */

var FLOW = {
  AREA_CREATURES: 2,
  AREA_BALLS: 2,
  MAX_ESCAPE: 3,
  RESET_MS: 60 * 60 * 1000,
  MOVE_METERS: 50
};

/* ================================================================
   ★★★ AREA STATE ★★★
   ================================================================ */
function initArea() {
  if (!GS.area) {
    GS.area = {caught:0, escaped:0, ballsTaken:0,
      totalBalls:FLOW.AREA_BALLS, totalCreatures:FLOW.AREA_CREATURES,
      lastReset:Date.now(), lat:playerLat||0, lng:playerLng||0};
    saveState();
  }
}

function resetArea() {
  GS.area = {caught:0, escaped:0, ballsTaken:0,
    totalBalls:FLOW.AREA_BALLS, totalCreatures:FLOW.AREA_CREATURES,
    lastReset:Date.now(), lat:playerLat||0, lng:playerLng||0};
  saveState();
  updateAreaStatus();
}

function isAreaExhausted() {
  if (!GS.area) return false;
  return GS.area.caught >= FLOW.AREA_CREATURES || GS.area.escaped >= FLOW.MAX_ESCAPE;
}

function isBallAreaExhausted() {
  return !GS.area || GS.area.ballsTaken >= GS.area.totalBalls;
}

function isResetDue() {
  return !GS.area || (Date.now() - GS.area.lastReset) >= FLOW.RESET_MS;
}

function hasMovedEnough() {
  if (!GS.area || !GS.area.lat || !GS.area.lng) return true;
  var R=6371000;
  var dLat=(playerLat-GS.area.lat)*Math.PI/180;
  var dLng=(playerLng-GS.area.lng)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(GS.area.lat*Math.PI/180)*Math.cos(playerLat*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return (R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))) >= FLOW.MOVE_METERS;
}

function getTimeUntilReset() {
  return !GS.area ? 0 : Math.max(0, FLOW.RESET_MS-(Date.now()-GS.area.lastReset));
}

function formatResetTime(ms) {
  var s=Math.floor(ms/1000), h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
  return (h>0?h+':':'')+(m<10?'0':'')+m+':'+(sec<10?'0':'')+sec;
}

/* ================================================================
   ★★★ AREA STATUS WIDGET ★★★
   ================================================================ */
function createAreaStatusWidget() {
  var old=document.getElementById('area-status');
  if(old) old.remove();
  var el=document.createElement('div');
  el.className='area-status'; el.id='area-status';
  el.innerHTML=
    '<div class="as-row"><span class="as-icon">🐾</span><span class="as-label">Yêu thú:</span><span class="as-val creature" id="as-creatures">2</span></div>'
    +'<div class="as-row"><span class="as-icon">🎯</span><span class="as-label">Bùa:</span><span class="as-val ball" id="as-balls">2</span></div>'
    +'<div class="as-row"><span class="as-icon">⏱</span><span class="as-label">Reset:</span><span class="as-val reset" id="as-reset">--:--</span></div>';
  var hudTr=document.querySelector('.hud-tr');
  if(hudTr&&hudTr.parentNode){
    hudTr.parentNode.insertBefore(el,hudTr.nextSibling);
    el.style.position='absolute';
    el.style.top=(hudTr.offsetTop+hudTr.offsetHeight+8)+'px';
    el.style.right='12px'; el.style.zIndex='300';
  }
}

function updateAreaStatus() {
  initArea();
  var cr=document.getElementById('as-creatures');
  if(cr){var r=Math.max(0,FLOW.AREA_CREATURES-(GS.area.caught+GS.area.escaped));cr.textContent=r;cr.className='as-val creature'+(r<=0?' empty':'');}
  var bl=document.getElementById('as-balls');
  if(bl){var b=Math.max(0,GS.area.totalBalls-GS.area.ballsTaken);bl.textContent=b;bl.className='as-val ball'+(b<=0?' empty':'');}
  var rs=document.getElementById('as-reset');
  if(rs){var t=getTimeUntilReset();if(t<=0){rs.textContent='Sẵn sàng!';rs.className='as-val reset ready';}else{rs.textContent=formatResetTime(t);rs.className='as-val reset';}}
}

var _areaTimer=null;
function startAreaStatusTimer() {
  createAreaStatusWidget(); updateAreaStatus();
  if(_areaTimer) clearInterval(_areaTimer);
  _areaTimer=setInterval(updateAreaStatus,1000);
}

/* ================================================================
   ★★★ STATE MACHINE ★★★
   idle → walking → detected → scanning → result → idle
   ================================================================ */
var _state='idle';
var _findType='creature';
var _walkStart=0;
var _walkDist=0;
var _lastPos=null;
var _watchId=null;
var _arrowAngle=0;
var _arrowTimer=null;
var _triggerSec=0;
var _itemHeading=0;
var _orientFn=null;

/* ================================================================
   ★★★ SEARCH START — Bấm 🔍 ★★★
   ================================================================ */
function startSearchPhase() {
  if(_state!=='idle'){showToast('🔍 Đang tìm kiếm...');return;}
  if(!_compassOn){showToast('🧭 Bật la bàn trước!',3000);return;}

  initArea();
  if(isResetDue()||hasMovedEnough()){resetArea();showToast('🗺️ Khu vực mới! 2 yêu thú + 2 bùa.',4000);return;}

  var cr=FLOW.AREA_CREATURES-(GS.area.caught+GS.area.escaped);
  var bl=GS.area.totalBalls-GS.area.ballsTaken;
  if(cr<=0&&bl<=0){showAreaExhausted();return;}

  _findType=(bl>0&&cr<=0)?'ball':(cr>0&&bl<=0)?'creature':(Math.random()<0.4?'ball':'creature');
  _state='walking';
  _walkStart=Date.now();
  _walkDist=0; _lastPos=null;
  _triggerSec=30+Math.random()*30; /* 30-60s */

  startMovementDetection();
  startArrowGuidance();
  showToast('🔍 Đi theo mũi tên trên vòng tròn! Cần đi bộ thật!',4000);
}

/* ================================================================
   ★★★ GPS MOVEMENT DETECTION — Bắt buộc đi bộ thật ★★★
   ================================================================ */
function startMovementDetection() {
  if(_watchId) navigator.geolocation.clearWatch(_watchId);

  /* Fallback: nếu GPS lỗi, vẫn trigger theo thời gian */
  var fbTimer=setInterval(function(){
    if(_state!=='walking'){clearInterval(fbTimer);return;}
    var elapsed=(Date.now()-_walkStart)/1000;
    if(elapsed>=_triggerSec){clearInterval(fbTimer);triggerDetection();}
  },1000);

  _watchId=navigator.geolocation.watchPosition(function(pos){
    if(_state!=='walking') return;
    var lat=pos.coords.latitude, lng=pos.coords.longitude;
    if(_lastPos){
      var d=calcGPSDist(_lastPos.lat,_lastPos.lng,lat,lng);
      if(d>1.5) _walkDist+=d;
    }
    _lastPos={lat:lat,lng:lng};
    playerLat=lat; playerLng=lng;

    var elapsed=(Date.now()-_walkStart)/1000;

    /* ★ Cần đi bộ thật: elapsed >= trigger VÀ distance >= 5m ★ */
    if(elapsed>=_triggerSec && _walkDist>=5){
      triggerDetection();
    }

    /* Update hint */
    var dv=document.getElementById('ar-dist-val');
    if(dv) dv.textContent=Math.floor(_walkDist)+'m';
    var dh=document.getElementById('ar-dist-hint');
    if(dh) dh.textContent='🚶 Đi bộ ('+Math.floor(elapsed)+'s) — cần đi thêm!';

  },function(){
    /* GPS lỗi → fallback timer xử lý */
  },{enableHighAccuracy:true, maximumAge:2000, timeout:10000});
}

function calcGPSDist(lat1,lng1,lat2,lng2) {
  var R=6371000, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

/* ================================================================
   ★★★ ARROW GUIDANCE — Mũi tên trên vòng tròn ★★★
   ★ Chỉ hướng đi, thay đổi mỗi 8-15s
   ================================================================ */
function startArrowGuidance() {
  addCrosshairArrow();
  _arrowAngle=Math.floor(Math.random()*360);
  updateArrow();

  if(_arrowTimer) clearInterval(_arrowTimer);
  _arrowTimer=setInterval(function(){
    if(_state!=='walking') return;
    var change=(Math.random()>0.5?1:-1)*(20+Math.random()*40);
    _arrowAngle=(_arrowAngle+change+360)%360;
    updateArrow();
  },8000+Math.floor(Math.random()*7000));
}

function updateArrow() {
  var ring=document.getElementById('crosshair-ring');
  if(ring){
    ring.style.transition='border-color 0.5s ease, box-shadow 0.5s ease';
    ring.style.borderColor='#ffa726';
    ring.style.boxShadow='0 0 15px rgba(255,167,38,0.5)';
  }
  var arrow=document.getElementById('crosshair-arrow');
  if(arrow){
    arrow.style.transition='transform 1.5s ease';
    arrow.style.transform='rotate('+_arrowAngle+'deg)';
  }
  document.getElementById('ar-distance').style.display='';
}

function stopArrowGuidance() {
  if(_arrowTimer) clearInterval(_arrowTimer);
  _arrowTimer=null;
  removeCrosshairArrow();
  var ring=document.getElementById('crosshair-ring');
  if(ring){ring.style.borderColor='';ring.style.boxShadow='';}
  document.getElementById('ar-distance').style.display='none';
}

function addCrosshairArrow() {
  if(document.getElementById('crosshair-arrow')) return;
  var wrap=document.querySelector('.crosshair');
  if(!wrap) return;
  var arrow=document.createElement('div');
  arrow.id='crosshair-arrow';
  arrow.className='crosshair-arrow';
  arrow.innerHTML='➤';
  wrap.appendChild(arrow);
}

function removeCrosshairArrow() {
  var a=document.getElementById('crosshair-arrow');
  if(a) a.remove();
}

/* ================================================================
   ★★★ DETECTION — Crosshair đỏ ★★★
   ================================================================ */
function triggerDetection() {
  _state='detected';
  if(_watchId){navigator.geolocation.clearWatch(_watchId);_watchId=null;}
  stopArrowGuidance();

  var ring=document.getElementById('crosshair-ring');
  if(ring){
    ring.style.transition='all 0.3s ease';
    ring.style.borderColor='#f44336';
    ring.style.boxShadow='0 0 25px rgba(244,67,54,0.8)';
  }
  var pulse=document.getElementById('crosshair-pulse');
  if(pulse) pulse.style.borderColor='#f44336';

  var txt=_findType==='ball'?'bùa':'yêu thú';
  showToast('🔴 Phát hiện '+txt+'! Đứng yên, quay camera xung quanh tìm!',5000);

  setTimeout(function(){
    if(_state!=='detected') return;
    _state='scanning';
    if(_findType==='ball') spawnBallOnAR();
    else spawnCreatureOnAR();
  },2500);
}

/* ================================================================
   ★★★ CREATURE ON AR — Đặt trên vật thể, quay camera tìm ★★★
   ================================================================ */
function spawnCreatureOnAR() {
  var creature=generateCreature();
  GS.currentTarget=creature;
  saveState();
  removeItemFromAR();

  _itemHeading=Math.random()*360;

  var el=ELEMENTS[creature.element]||ELEMENTS.KIM;
  var realm=typeof getRealm==='function'?getRealm(creature.level):{icon:'🌀',name:''};

  /* ★ Advantage hints ★ */
  var advHtml='<div class="ac-adv">';
  var bk=BALL_KEYS||['KIM','MOC','THUY','HOA','THO'];
  for(var i=0;i<bk.length;i++){
    var key=bk[i], adv=getAdvantageLabel(key,creature.element), b=BALLS[key];
    var sel=GS.selectedBall===key?' selected':'';
    advHtml+='<div class="ac-adv-item'+sel+'" onclick="selectBall(\''+key+'\')">'
      +'<span class="ac-adv-icon">'+b.icon+'</span>'
      +'<span class="ac-adv-text" style="color:'+adv.color+'">'+adv.bonus+'</span></div>';
  }
  advHtml+='</div>';

  var overlay=document.createElement('div');
  overlay.className='ar-creature';
  overlay.id='ar-creature';
  overlay.style.left='50%';
  overlay.style.top='45%';
  overlay.innerHTML=
    '<div class="ac-lock-ring" id="ac-lock-ring"><div class="lock-text">🎯 Căn tâm!</div></div>'
    +'<div class="ac-art">'+renderCreatureArt(creature,120)+'</div>'
    +'<div class="ac-info"><div class="ac-name">'+creature.name+'</div>'
    +'<div class="ac-tags">'
    +'<span class="ac-el" style="background:'+el.bg+'">'+el.icon+' '+el.name+'</span>'
    +'<span class="ac-lvl">Lv.'+creature.level+' '+realm.icon+'</span></div></div>'
    +advHtml;

  document.getElementById('screen-ar').appendChild(overlay);

  startOrientationTracking();
  showToast('🐾 Quay camera xung quanh để tìm '+creature.name+'!',4000);
}

/* ================================================================
   ★★★ BALL ON AR ★★★
   ================================================================ */
function spawnBallOnAR() {
  initArea();
  var bk=BALL_KEYS||['KIM','MOC','THUY','HOA','THO'];
  var ballKey=bk[Math.floor(Math.random()*bk.length)];
  var ball=BALLS[ballKey];

  removeItemFromAR();
  _itemHeading=Math.random()*360;

  var overlay=document.createElement('div');
  overlay.className='ar-ball-pickup';
  overlay.id='ar-creature';
  overlay.style.left='50%';
  overlay.style.top='45%';
  overlay.innerHTML=
    '<div class="ac-lock-ring" id="ac-lock-ring"><div class="lock-text">🎯 Căn tâm!</div></div>'
    +'<div class="bp-art"><svg viewBox="0 0 100 100" width="100" height="100">'
    +'<defs><radialGradient id="bpG" cx="50%" cy="50%" r="50%">'
    +'<stop offset="0%" stop-color="'+ball.color+'" stop-opacity="0.5"/>'
    +'<stop offset="100%" stop-color="'+ball.color+'" stop-opacity="0"/></radialGradient></defs>'
    +'<circle cx="50" cy="50" r="45" fill="url(#bpG)" class="bp-glow"/>'
    +'<circle cx="50" cy="50" r="28" fill="'+ball.color+'" opacity="0.85" stroke="#fff" stroke-width="2"/>'
    +'<text x="50" y="58" text-anchor="middle" font-size="26">'+ball.icon+'</text></svg></div>'
    +'<div class="bp-name" style="color:'+ball.color+'">'+ball.icon+' '+ball.name+'</div>'
    +'<div class="bp-hint">Căn tâm + vào bùa rồi bấm Nhặt</div>'
    +'<button class="bp-pickup-btn" id="bp-pickup-btn" style="display:none" onclick="collectBallItem(\''+ballKey+'\')">🎯 Nhặt Bùa (Miễn phí)</button>';

  document.getElementById('screen-ar').appendChild(overlay);

  startOrientationTracking();
  showToast('🎯 Quay camera xung quanh để tìm '+ball.name+'!',4000);
}

/* ================================================================
   ★★★ ORIENTATION TRACKING — Quay camera tìm item ★★★
   ★ Item trôi theo hướng quay camera (deviceorientation)
   ★ Khi căn tâm → lock → nút bắt sáng
   ================================================================ */
function startOrientationTracking() {
  stopOrientationTracking();

  var lockCheck;

  _orientFn=function(e){
    if(_state!=='scanning') return;

    /* Heading từ device */
    var heading=e.webkitCompassHeading||(e.alpha!=null?(360-e.alpha)%360:0);

    /* Item trôi trên màn hình theo heading */
    var diff=((_itemHeading-heading+540)%360)-180;
    var screenX=50+(diff/180)*50;

    var overlay=document.getElementById('ar-creature');
    if(!overlay) return;

    overlay.style.left=Math.max(10,Math.min(90,screenX))+'%';
    overlay.style.top='45%';

    /* Check alignment */
    checkAlignment(Math.abs(screenX-50));
  };

  window.addEventListener('deviceorientation',_orientFn);

  /* Fallback: nếu không có deviceorientation, item drift nhẹ */
  var drift=0;
  var driftTimer=setInterval(function(){
    if(_state!=='scanning'){clearInterval(driftTimer);return;}
    if(window.DeviceOrientationEvent && _orientFn) return; /* có ori → bỏ qua */

    drift+=0.5;
    var screenX=50+Math.sin(drift*0.02)*30;
    var overlay=document.getElementById('ar-creature');
    if(!overlay) return;
    overlay.style.left=Math.max(10,Math.min(90,screenX))+'%';
    checkAlignment(Math.abs(screenX-50));
  },200);
}

function stopOrientationTracking() {
  if(_orientFn){
    window.removeEventListener('deviceorientation',_orientFn);
    _orientFn=null;
  }
}

/* ================================================================
   ★★★ ALIGNMENT CHECK — Căn tâm dấu + ★★★
   ================================================================ */
function checkAlignment(distancePct) {
  var ring=document.getElementById('ac-lock-ring');
  var lt=ring?ring.querySelector('.lock-text'):null;
  var capBtn=document.getElementById('capture-btn');
  var bpBtn=document.getElementById('bp-pickup-btn');
  var threshold=8; /* % từ center */

  if(distancePct<threshold){
    /* ★ ĐÃ CĂN GIỮA — LOCK ★ */
    if(ring){
      ring.classList.add('locked');
      ring.style.borderColor='#4caf50';
      ring.style.boxShadow='0 0 25px rgba(76,175,80,0.8)';
    }
    if(lt){lt.textContent='✅ ĐÃ LOCK!';lt.style.color='#4caf50';}

    if(_findType==='creature' && capBtn) capBtn.classList.remove('disabled');
    if(_findType==='ball' && bpBtn) bpBtn.style.display='';

  }else{
    /* ★ CHƯA CĂN GIỮA ★ */
    if(ring){
      ring.classList.remove('locked');
      ring.style.borderColor=distancePct<20?'#ffa726':'rgba(255,255,255,0.3)';
      ring.style.boxShadow=distancePct<20?'0 0 15px rgba(255,167,38,0.5)':'';
    }
    if(lt){
      if(distancePct<20){lt.textContent='👉 Căn giữa thêm!';lt.style.color='#ffa726';}
      else{lt.textContent='🎯 Căn tâm!';lt.style.color='rgba(255,255,255,0.5)';}
    }

    if(capBtn) capBtn.classList.add('disabled');
    if(bpBtn) bpBtn.style.display='none';
  }
}

/* ================================================================
   ★★★ COLLECT BALL ★★★
   ================================================================ */
function collectBallItem(ballKey) {
  initArea();
  if(!GS.inventory) GS.inventory={};
  GS.inventory[ballKey]=(GS.inventory[ballKey]||0)+1;
  GS.area.ballsTaken++;

  cleanupAfterResult();
  saveState(); renderBalls(); updateAreaStatus();

  var ball=BALLS[ballKey];
  showResult('🎯','Nhặt thành công!','Nhận được <strong style="color:'+ball.color+'">1 '+ball.name+'</strong><br><span style="opacity:.6">Không tốn bùa hiện có</span>','ok');

  setTimeout(function(){
    var cr=FLOW.AREA_CREATURES-(GS.area.caught+GS.area.escaped);
    var bl=GS.area.totalBalls-GS.area.ballsTaken;
    if(cr<=0&&bl<=0) setTimeout(showAreaExhausted,1500);
  },2000);
}

/* ================================================================
   ★★★ CLEANUP — Sau kết quả ★★★
   ★ Mũi tên mất, về idle, cần 🔍 để tìm tiếp
   ================================================================ */
function cleanupAfterResult() {
  _state='idle';
  stopOrientationTracking();
  removeItemFromAR();

  /* ★ Reset crosshair về bình thường ★ */
  var ring=document.getElementById('crosshair-ring');
  if(ring){
    ring.style.transition='all 0.5s ease';
    ring.style.borderColor='';
    ring.style.boxShadow='';
  }
  var pulse=document.getElementById('crosshair-pulse');
  if(pulse) pulse.style.borderColor='';

  /* ★ Mũi tên GONE ★ */
  removeCrosshairArrow();
}

function removeItemFromAR() {
  var el=document.getElementById('ar-creature');
  if(el) el.remove();
  stopOrientationTracking();
  var btn=document.getElementById('capture-btn');
  if(btn) btn.classList.add('disabled');
}

/* ★ Alias cho capture.js ★ */
function removeCreatureOnAR(){ removeItemFromAR(); }
function showCreatureOnAR(c){ spawnCreatureOnAR(); }

/* ================================================================
   ★★★ KẾT QUẢ BẮT ★★★
   ================================================================ */
function onCaptureSuccess(creature) {
  initArea();
  GS.area.caught++;
  cleanupAfterResult();
  saveState(); updateAreaStatus();
  showToast('✅ Đã bắt được <strong>'+creature.name+'</strong>!',4000);

  setTimeout(function(){
    if(isAreaExhausted()&&isBallAreaExhausted()) setTimeout(showAreaExhausted,1500);
  },2000);
}

function onCaptureFail(creature) {
  initArea();
  GS.area.escaped++;
  cleanupAfterResult();
  saveState(); updateAreaStatus();
  showToast('💔 Yêu thú chạy thoát! Bấm 🔍 để tìm tiếp.',4000);

  setTimeout(function(){
    if(isAreaExhausted()&&isBallAreaExhausted()) setTimeout(showAreaExhausted,1500);
  },2000);
}

/* ================================================================
   ★★★ COMPASS — Manual toggle ★★★
   ================================================================ */
var _compassOn=false;

function toggleCompass() {
  _compassOn=!_compassOn;
  compassActive=_compassOn;
  var btn=document.getElementById('btn-compass');
  if(btn) btn.classList.toggle('active',_compassOn);
  var cs=document.getElementById('compass-status');
  if(cs) cs.textContent=_compassOn?'🧭 Đang bật':'🧭 Tắt';

  if(_compassOn){
    initArea();
    startAreaStatusTimer();
    if(isResetDue()||hasMovedEnough()) resetArea();
    var rem=Math.max(0,FLOW.AREA_CREATURES-(GS.area.caught+GS.area.escaped));
    var bRem=Math.max(0,GS.area.totalBalls-GS.area.ballsTaken);
    showToast('🧭 La bàn bật! Khu vực: '+rem+' yêu thú + '+bRem+' bùa.',4000);
  }else{
    if(_state==='walking'){
      _state='idle';
      if(_watchId){navigator.geolocation.clearWatch(_watchId);_watchId=null;}
      stopArrowGuidance();
    }
    showToast('🧭 La bàn tắt.',2000);
  }
  saveState();
}

function activateCompass(){ toggleCompass(); }

/* ================================================================
   ★★★ HẾT KHU VỰC ★★★
   ================================================================ */
function showAreaExhausted() {
  var m=document.getElementById('result-modal');
  if(!m) return;
  document.getElementById('result-icon').innerHTML='🗺️';
  document.getElementById('result-title').innerHTML='Đã hết yêu thú và bùa!';
  document.getElementById('result-sub').innerHTML=
    'Quay lại sau <strong style="color:#ffd700;font-size:15px">60 phút</strong> hoặc đi cách <strong style="color:#4fc3f7;font-size:15px">50m</strong>.'
    +'<br><span style="opacity:.6;font-size:11px">Mỗi khu vực: 2 yêu thú + 2 bùa</span>';
  m.classList.add('show');
}
