/* ============================================================
   MODULE: camera.js
   Chức năng: Điều hướng camera — Camera + AR Rendering + Mũi tên
   ============================================================ */

var cameraStream = null;
var creatureOnScreen = false, crosshairLocked = false, currentAccuracy = 0;

function startCamera(){
  if(cameraStream) return;
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}},audio:false})
    .then(function(s){
      cameraStream=s;
      document.getElementById('camera-feed').srcObject=s;
      var cv=document.getElementById('ar-canvas');
      var v=document.getElementById('camera-feed');
      v.onloadedmetadata=function(){cv.width=v.videoWidth;cv.height=v.videoHeight;};
    })
    .catch(function(){showToast('Không mở camera!');});
}

/* ===== AR RENDER LOOP ===== */
function renderAR(){
  // ★ Mượt hóa la bàn mỗi frame ★
  updateSmoothHeading();

  var canvas=document.getElementById('ar-canvas');
  if(!canvas.width){requestAnimationFrame(renderAR);return;}
  var ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);

  var target=GS.currentTarget;
  if(!target){requestAnimationFrame(renderAR);return;}

  var cx=canvas.width/2, cy=canvas.height/2, time=Date.now()/1000;

  // ★ Tính hướng dùng smoothHeading ★
  var gpsDist=getDist(playerLat,playerLng,target.lat,target.lng);
  var bearing=getBearing(playerLat,playerLng,target.lat,target.lng);
  var relAngle=((bearing-smoothHeading)+360)%360;
  var aCenter=relAngle>180?360-relAngle:relAngle;
  var halfFOV=CONFIG.FOV/2;

  document.getElementById('ar-dist-val').textContent='~'+Math.round(gpsDist)+'m';

  if(aCenter>halfFOV){
    // ===== CHƯA THẤY YÊU THÚ — MŨI TÊN QUAY THEO CAMERA =====
    creatureOnScreen=false; crosshairLocked=false; currentAccuracy=0;

    var dirs=['Bắc','Đông Bắc','Đông','Đông Nam','Nam','Tây Nam','Tây','Tây Bắc'];
    var dirName=dirs[Math.round(bearing/45)%8];
    document.getElementById('ar-dist-hint').textContent='🧭 '+dirName+' | Xoay camera';

    var arrowSize=Math.min(canvas.width,canvas.height)*0.12;
    var pulse=0.7+Math.sin(time*3)*0.3;

    // Glow bg
    var bg=ctx.createRadialGradient(cx,cy,10,cx,cy,250);
    bg.addColorStop(0,'rgba(76,195,247,'+(0.2*pulse)+')'); bg.addColorStop(1,'transparent');
    ctx.fillStyle=bg; ctx.fillRect(0,0,canvas.width,canvas.height);

    // ★★★ MŨI TÊN — ROTATE theo relAngle, CẬP NHẬT 60fps ★★★
    ctx.save();
    ctx.translate(cx, cy-50);
    ctx.rotate(relAngle*Math.PI/180);  // ★ QUAY THEO CAMERA ★
    var ag=ctx.createLinearGradient(0,-arrowSize,0,arrowSize*0.3);
    ag.addColorStop(0,'#4caf50'); ag.addColorStop(1,'#81c784');
    ctx.fillStyle=ag; ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(0,-arrowSize);
    ctx.lineTo(arrowSize*0.5,-arrowSize*0.2);
    ctx.lineTo(arrowSize*0.22,-arrowSize*0.2);
    ctx.lineTo(arrowSize*0.22,arrowSize*0.3);
    ctx.lineTo(-arrowSize*0.22,arrowSize*0.3);
    ctx.lineTo(-arrowSize*0.22,-arrowSize*0.2);
    ctx.lineTo(-arrowSize*0.5,-arrowSize*0.2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowColor='rgba(76,195,247,0.8)'; ctx.shadowBlur=15*pulse;
    ctx.fill(); ctx.shadowBlur=0;
    ctx.restore();

    // Direction text
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.fillRect(cx-100,cy+50,200,50);
    ctx.font='bold 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#4fc3f7'; ctx.fillText('🧭 '+dirName, cx, cy+65);
    ctx.font='13px sans-serif'; ctx.fillStyle='#fff';
    ctx.fillText('~'+Math.round(gpsDist)+'m', cx, cy+88);
    ctx.restore();

  }else{
    // ===== YÊU THÚ HIỂN THỊ TRÊN CAMERA =====
    creatureOnScreen=true;
    var fovRatio=aCenter/halfFOV;
    var side=relAngle<180?1:-1;
    var creatureX=cx+side*fovRatio*(canvas.width*0.35);
    var creatureY=cy;

    var distFactor=Math.max(0.3,Math.min(1.5,CONFIG.SPAWN_MIN/Math.max(0.5,gpsDist)));
    var creatureSize=Math.min(canvas.width,canvas.height)*0.12*distFactor*2;

    drawCreatureIdle(ctx,creatureX,creatureY,creatureSize,target,time);

    var dx=creatureX-cx, dy=creatureY-cy;
    var crossDist=Math.sqrt(dx*dx+dy*dy);
    crosshairLocked=crossDist<CONFIG.CROSSHAIR_LOCK_PX;
    currentAccuracy=crosshairLocked?Math.max(0.5,1-crossDist/CONFIG.CROSSHAIR_LOCK_PX*0.5):Math.max(0,1-crossDist/(CONFIG.CROSSHAIR_LOCK_PX*3));

    if(crossDist<CONFIG.CROSSHAIR_LOCK_PX*3){
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.setLineDash([5,5]);
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(creatureX,creatureY); ctx.stroke(); ctx.setLineDash([]);
    }
    document.getElementById('ar-dist-hint').textContent=crosshairLocked?'✅ ĐÃ NHẮM! Nhấn Bắt!':'🎯 Đưa dấu + vào yêu thú';
  }

  // Crosshair
  var ring=document.getElementById('crosshair-ring');
  if(crosshairLocked){ring.classList.add('locked');ring.classList.remove('close');document.getElementById('crosshair-pulse').style.display='';}
  else{ring.classList.remove('locked');document.getElementById('crosshair-pulse').style.display='none';if(creatureOnScreen&&currentAccuracy>0.3)ring.classList.add('close');else ring.classList.remove('close');}

  // Rate
  var rate=creatureOnScreen?getRate(GS.selectedBall,target.element,target.level,GS.level,currentAccuracy):0;
  var pct=Math.round(rate*1000)/10;
  document.getElementById('ar-rate-pct').textContent=pct+'%';
  var fill=document.getElementById('ar-rate-fill');
  fill.style.width=pct+'%';
  fill.style.background=pct<=0?'#f44336':pct<=30?'#ff9800':pct<=70?'#ffc107':'#4caf50';

  // Button
  var btn=document.getElementById('capture-btn');
  if(creatureOnScreen&&crosshairLocked) btn.classList.remove('disabled');
  else btn.classList.add('disabled');

  requestAnimationFrame(renderAR);
}
