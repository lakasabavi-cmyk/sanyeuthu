/* ============================================================
   navigation.js — GPS + La bàn + Hướng
   ★ v1.04 FIX: ** → Math.pow (webview cũ không hỗ trợ **)
   ============================================================ */

var playerLat = 10.762622;
var playerLng = 106.660172;
var rawHeading = 0;
var smoothHeading = 0;
var compassActive = false;

/* ===== GPS ===== */
function initGPS(){
  if(!navigator.geolocation) return;
  navigator.geolocation.watchPosition(
    function(p){playerLat=p.coords.latitude;playerLng=p.coords.longitude;},
    function(){},
    {enableHighAccuracy:true, maximumAge:2000}
  );
}

/* ===== LA BÀN ===== */
function activateCompass(){
  if(compassActive) return;
  if(typeof DeviceOrientationEvent==='undefined'){
    showToast('⚠️ Thiết bị không hỗ trợ la bàn');
    return;
  }

  if(typeof DeviceOrientationEvent.requestPermission==='function'){
    DeviceOrientationEvent.requestPermission()
      .then(function(r){
        if(r==='granted'){
          setupCompass();
          compassActive=true;
          updateCompassUI();
          showToast('🧭 La bàn OK!');
        }else{
          showToast('⛔ Cho phép la bàn trong Cài đặt!');
        }
      })
      .catch(function(){
        showToast('⛔ Lỗi la bàn!');
      });
  }else{
    setupCompass();
    compassActive=true;
    updateCompassUI();
    showToast('🧭 La bàn OK!');
  }
}

function setupCompass(){
  window.addEventListener('deviceorientationabsolute', function(e){
    if(e.alpha!==null && e.alpha!==undefined) rawHeading=e.alpha;
  }, true);

  window.addEventListener('deviceorientation', function(e){
    if(e.webkitCompassHeading!==undefined && e.webkitCompassHeading!==null){
      rawHeading=e.webkitCompassHeading;
    }else if(e.alpha!==null && e.alpha!==undefined){
      rawHeading=360-e.alpha;
    }
  }, true);

  window.addEventListener('webkitCompassNeedsCalibration', function(){
    showToast('📱 Xoay hình số 8 để hiệu chỉnh!', 5000);
  });
}

function updateCompassUI(){
  var b=document.getElementById('btn-compass');
  var s=document.getElementById('compass-status');
  if(compassActive && b){
    b.classList.add('active');
  }
  if(s) s.textContent='🧭 '+Math.round(smoothHeading)+'°';
}

function updateSmoothHeading(){
  var d=rawHeading-smoothHeading;
  if(d>180) d-=360;
  if(d<-180) d+=360;
  smoothHeading+=d*0.12;
  smoothHeading=((smoothHeading%360)+360)%360;
  if(compassActive){
    var s=document.getElementById('compass-status');
    if(s) s.textContent='🧭 '+Math.round(smoothHeading)+'°';
  }
}

/* ================================================================
   ★★★ FIX v1.04: ** → Math.pow() — webview cũ chết với ** ★★★
   ================================================================ */

function getDist(lat1, lng1, lat2, lng2){
  var R=6371000;
  var dLat=(lat2-lat1)*Math.PI/180;
  var dLng=(lng2-lng1)*Math.PI/180;
  var a=Math.pow(Math.sin(dLat/2), 2)
      + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180)
      * Math.pow(Math.sin(dLng/2), 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getBearing(lat1, lng1, lat2, lng2){
  var dLng=(lng2-lng1)*Math.PI/180;
  var y=Math.sin(dLng)*Math.cos(lat2*Math.PI/180);
  var x=Math.cos(lat1*Math.PI/180)*Math.sin(lat2*Math.PI/180)
       - Math.sin(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.cos(dLng);
  return ((Math.atan2(y, x)*180/Math.PI)+360) % 360;
}
