/* ============================================================
   MODULE: navigation.js
   Chức năng: Di chuyển — GPS + La bàn + Khoảng cách + Hướng
   ★★★ ĐÂY LÀ FILE QUAN TRỌNG NHẤT ★★★
   ============================================================ */

var playerLat = 10.762622;
var playerLng = 106.660172;
var rawHeading = 0;     // Hướng thô từ cảm biến
var smoothHeading = 0;   // Hướng đã mượt (dùng cho render)
var compassActive = false;

/* ===== GPS ===== */
function initGPS(){
  if(!navigator.geolocation) return;
  navigator.geolocation.watchPosition(
    function(p){playerLat=p.coords.latitude;playerLng=p.coords.longitude;},
    function(e){console.log('GPS error:',e);},
    {enableHighAccuracy:true,maximumAge:2000}
  );
}

/* ===== LA BÀN — ★★★ PHẢI CLICK BUTTON ĐỂ KÍCH HOẠT ★★★ ===== */
function activateCompass(){
  if(compassActive) return;

  // Kiểm tra hỗ trợ
  if(typeof DeviceOrientationEvent==='undefined'){
    showToast('⚠️ Thiết bị không hỗ trợ la bàn. Dùng nút ◀▶ để xoay.');
    return;
  }

  // ★ iOS 13+ PHẢI request permission từ user gesture ★
  if(typeof DeviceOrientationEvent.requestPermission==='function'){
    DeviceOrientationEvent.requestPermission()
      .then(function(res){
        if(res==='granted'){
          setupCompassListeners();
          compassActive=true;
          updateCompassUI();
          showToast('🧭 La bàn đã kích hoạt!');
        }else{
          showToast('⛔ Cần cho phép quyền la bàn trong Cài đặt!');
        }
      })
      .catch(function(err){
        showToast('⛔ Lỗi la bàn: '+err.message);
        showToast('💡 Dùng nút ◀▶ để xoay thủ công',5000);
      });
  }else{
    // Android / iOS cũ — không cần permission
    setupCompassListeners();
    compassActive=true;
    updateCompassUI();
    showToast('🧭 La bàn đã kích hoạt!');
  }
}

function setupCompassListeners(){
  // ★ Method 1: deviceorientationabsolute (Chrome Android) ★
  window.addEventListener('deviceorientationabsolute',function(e){
    if(e.alpha!==null&&e.alpha!==undefined){
      rawHeading=e.alpha;
    }
  },true);

  // ★ Method 2: deviceorientation (iOS + universal) ★
  window.addEventListener('deviceorientation',function(e){
    if(e.webkitCompassHeading!==undefined&&e.webkitCompassHeading!==null){
      rawHeading=e.webkitCompassHeading; // iOS: 0-360, Bắc=0
    }else if(e.alpha!==null&&e.alpha!==undefined){
      rawHeading=360-e.alpha; // Android: alpha=0 là Bắc
    }
  },true);

  // ★ Hiệu chỉnh la bàn ★
  window.addEventListener('webkitCompassNeedsCalibration',function(){
    showToast('📱 Xoay điện thoại hình số 8 để hiệu chỉnh!',5000);
  });
}

function updateCompassUI(){
  var btn=document.getElementById('btn-compass');
  var status=document.getElementById('compass-status');
  if(compassActive){
    btn.textContent='🧭 La bàn OK';
    btn.classList.add('active');
    status.textContent='🧭 La bàn: ' + Math.round(smoothHeading) + '°';
  }
}

/* ===== SMOOTHING — mượt 60fps ===== */
function updateSmoothHeading(){
  var diff=rawHeading-smoothHeading;
  if(diff>180) diff-=360;
  if(diff<-180) diff+=360;
  smoothHeading+=diff*0.12;
  smoothHeading=((smoothHeading%360)+360)%360;

  // Cập nhật UI
  if(compassActive){
    var status=document.getElementById('compass-status');
    if(status) status.textContent='🧭 '+Math.round(smoothHeading)+'°';
  }
}

/* ===== MANUAL FALLBACK — khi la bàn không hoạt động ===== */
function manualTurnLeft(){ rawHeading=((rawHeading-8)+360)%360; }
function manualTurnRight(){ rawHeading=((rawHeading+8)+360)%360; }

/* ===== KHOẢNG CÁCH + HƯỚNG ===== */
function getDist(a,b,c,d){
  var R=6371000,dLa=(c-a)*Math.PI/180,dLn=(d-b)*Math.PI/180;
  var h=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dLn/2)*Math.sin(dLn/2);
  return R*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}

function getBearing(a,b,c,d){
  var dLn=(d-b)*Math.PI/180;
  var y=Math.sin(dLn)*Math.cos(c*Math.PI/180);
  var x=Math.cos(a*Math.PI/180)*Math.sin(c*Math.PI/180)-Math.sin(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.cos(dLn);
  return((Math.atan2(y,x)*180/Math.PI)+360)%360;
}
