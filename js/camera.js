/* ============================================================
   camera.js — Camera + AR Render
   ★ v1.07 FIX: Xóa canvas text Tây Bắc/ĐN (trùng với HTML ar-distance) ★
   ============================================================ */

var cameraStream=null,creatureOnScreen=false,crosshairLocked=false,currentAccuracy=0;
var displayModeActive='camera';

function supportsCamera(){
  var host=location.hostname;
  var secure=window.isSecureContext||location.protocol==='https:'||host==='localhost'||host==='127.0.0.1';
  return !!(secure&&navigator.mediaDevices&&typeof navigator.mediaDevices.getUserMedia==='function');
}

function getDisplayModeLabel(){
  if(GS.displayMode==='screen') return '📱 Không AR';
  if(GS.displayMode==='sensor') return displayModeActive==='camera'?'📷 AR cảm biến':'📱 Không AR*';
  return displayModeActive==='camera'?'✨ Tự động':'📱 Không AR*';
}

function updateDisplayModeButton(){
  var btn=document.getElementById('btn-display-mode');
  if(!btn) return;
  btn.textContent=getDisplayModeLabel();
  btn.title='Đổi chế độ hiển thị (đang dùng: '+(displayModeActive==='camera'?'camera':'không AR')+')';
}

function applyDisplayMode(mode,notify){
  if(['auto','sensor','screen'].indexOf(mode)<0) mode='auto';
  GS.displayMode=mode;
  if(_state&&_state!=='idle'&&typeof cleanupAfterResult==='function') cleanupAfterResult();

  var wantsCamera=mode!=='screen'&&supportsCamera();
  displayModeActive=wantsCamera?'camera':'screen';
  var screen=document.getElementById('screen-ar');
  if(screen) screen.classList.toggle('no-camera',!wantsCamera);

  if(wantsCamera) startCamera();
  else stopCamera();
  updateDisplayModeButton();
  if(notify){
    if(wantsCamera){
      showToast(mode==='sensor'?'📷 Đã bật AR cảm biến. Cho phép camera và la bàn.':'✨ Đã bật chế độ tự động.',3000);
    }else{
      showToast(mode==='screen'?'📱 Đã bật chế độ không AR. Vật thể sẽ xuất hiện giữa màn hình.':'📱 Thiết bị chưa hỗ trợ camera an toàn; đang dùng chế độ không AR.',3500);
    }
  }
}

function cycleDisplayMode(){
  var modes=['auto','sensor','screen'];
  var index=modes.indexOf(GS.displayMode||'auto');
  applyDisplayMode(modes[(index+1)%modes.length],true);
  saveState();
}

function stopCamera(){
  if(cameraStream){
    cameraStream.getTracks().forEach(function(track){track.stop();});
    cameraStream=null;
  }
  var video=document.getElementById('camera-feed');
  if(video) video.srcObject=null;
}

function handleCameraError(error){
  stopCamera();
  displayModeActive='screen';
  var screen=document.getElementById('screen-ar');
  if(screen) screen.classList.add('no-camera');
  updateDisplayModeButton();
  if(error&&error.name==='NotAllowedError'){
    showToast('Chưa được cấp quyền camera. Chuyển sang không AR; có thể bật camera trong cài đặt.');
  }else if(error&&error.name==='NotFoundError'){
    showToast('Không tìm thấy camera. Chuyển sang chế độ không AR.');
  }else{
    showToast('Không mở được camera. Chuyển sang chế độ không AR; hãy thử HTTPS và kiểm tra quyền camera.');
  }
}

function startCamera(){
  if(cameraStream) return;
  if(!supportsCamera()){
    handleCameraError();
    return;
  }
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}},audio:false}).then(function(s){
    if(displayModeActive!=='camera'){
      s.getTracks().forEach(function(track){track.stop();});
      return;
    }
    cameraStream=s;
    document.getElementById('camera-feed').srcObject=s;
    var cv=document.getElementById('ar-canvas'),v=document.getElementById('camera-feed');
    v.onloadedmetadata=function(){cv.width=v.videoWidth;cv.height=v.videoHeight;};
  }).catch(handleCameraError);
}

function renderAR(){
  updateSmoothHeading();
  if(displayModeActive==='screen'){
    requestAnimationFrame(renderAR);
    return;
  }
  var canvas=document.getElementById('ar-canvas');
  if(!canvas.width){requestAnimationFrame(renderAR);return;}
  var ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  /* The gameflow overlay owns positioning and hit testing while scanning. */
  if(typeof _state!=='undefined'&&_state==='scanning'){
    requestAnimationFrame(renderAR);
    return;
  }
  var target=GS.currentTarget;
  if(!target||(typeof _state!=='undefined'&&_state==='idle')){requestAnimationFrame(renderAR);return;}

  var cx=canvas.width/2,cy=canvas.height/2,time=Date.now()/1000;
  var gpsDist=getDist(playerLat,playerLng,target.lat,target.lng);
  var bearing=getBearing(playerLat,playerLng,target.lat,target.lng);
  var relAngle=((bearing-smoothHeading)+360)%360;
  var aCenter=relAngle>180?360-relAngle:relAngle;
  var halfFOV=CONFIG.FOV/2;

  /* ★ HTML element hiển thị khoảng cách — CHỈ 1 chỗ ★ */
  document.getElementById('ar-dist-val').textContent='~'+Math.round(gpsDist)+'m';

  if(aCenter>halfFOV){
    creatureOnScreen=false;crosshairLocked=false;currentAccuracy=0;

    var dirs=['Bắc','Đông Bắc','Đông','Đông Nam','Nam','Tây Nam','Tây','Tây Bắc'];
    var dir=dirs[Math.round(bearing/45)%8];

    /* ★ HTML element hiển thị hướng — CHỈ 1 chỗ ★ */
    document.getElementById('ar-dist-hint').textContent='🧭 '+dir+' | Xoay camera';

    var sz=Math.min(canvas.width,canvas.height)*0.12,pulse=0.7+Math.sin(time*3)*0.3;

    /* Glow bg */
    var bg=ctx.createRadialGradient(cx,cy,10,cx,cy,250);
    bg.addColorStop(0,'rgba(76,195,247,'+(0.2*pulse)+')');bg.addColorStop(1,'transparent');
    ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);

    /* Mũi tên */
    ctx.save();ctx.translate(cx,cy-50);ctx.rotate(relAngle*Math.PI/180);
    var ag=ctx.createLinearGradient(0,-sz,0,sz*0.3);ag.addColorStop(0,'#4caf50');ag.addColorStop(1,'#81c784');
    ctx.fillStyle=ag;ctx.strokeStyle='rgba(255,255,255,0.9)';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(0,-sz);ctx.lineTo(sz*0.5,-sz*0.2);ctx.lineTo(sz*0.22,-sz*0.2);ctx.lineTo(sz*0.22,sz*0.3);ctx.lineTo(-sz*0.22,sz*0.3);ctx.lineTo(-sz*0.22,-sz*0.2);ctx.lineTo(-sz*0.5,-sz*0.2);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.shadowColor='rgba(76,195,247,0.8)';ctx.shadowBlur=15*pulse;ctx.fill();ctx.shadowBlur=0;ctx.restore();

    /* ★★ v1.07: ĐÃ XÓA canvas text "Tây Bắc ~5m" ở đây ★★ */
    /* ★★ (trước đây có ctx.fillRect + ctx.fillText) ★★ */

  }else{
    creatureOnScreen=true;
    var fovRatio=aCenter/halfFOV,side=relAngle<180?1:-1;
    var cX=cx+side*fovRatio*(canvas.width*0.35),cY=cy;
    var distF=Math.max(0.3,Math.min(1.5,CONFIG.SPAWN_MIN/Math.max(0.5,gpsDist)));
    var cSize=Math.min(canvas.width,canvas.height)*0.12*distF*2;

    drawCreatureIdle(ctx,cX,cY,cSize,target,time);

    var dx=cX-cx,dy=cY-cy,dist=Math.sqrt(dx*dx+dy*dy);
    crosshairLocked=dist<CONFIG.CROSSHAIR_LOCK_PX;
    currentAccuracy=crosshairLocked?Math.max(0.5,1-dist/CONFIG.CROSSHAIR_LOCK_PX*0.5):Math.max(0,1-dist/(CONFIG.CROSSHAIR_LOCK_PX*3));

    if(dist<CONFIG.CROSSHAIR_LOCK_PX*3){
      ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;ctx.setLineDash([5,5]);
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cX,cY);ctx.stroke();ctx.setLineDash([]);
    }
    document.getElementById('ar-dist-hint').textContent=crosshairLocked?'✅ Nhấn 🎯 để bắt!':'🎯 Đưa dấu + vào yêu thú';
  }

  /* Crosshair */
  var ring=document.getElementById('crosshair-ring');
  if(crosshairLocked){ring.classList.add('locked');ring.classList.remove('close');document.getElementById('crosshair-pulse').style.display='';}
  else{ring.classList.remove('locked');document.getElementById('crosshair-pulse').style.display='none';if(creatureOnScreen&&currentAccuracy>0.3)ring.classList.add('close');else ring.classList.remove('close');}

  /* Capture button */
  var btn=document.getElementById('capture-btn');
  if(creatureOnScreen&&crosshairLocked)btn.classList.remove('disabled');else btn.classList.add('disabled');

  requestAnimationFrame(renderAR);
}
