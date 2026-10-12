/* ============================================================
   camera.js — Camera + AR Render
   ★ v1.07 FIX: Xóa canvas text Tây Bắc/ĐN (trùng với HTML ar-distance) ★
   ============================================================ */

var cameraStream=null,creatureOnScreen=false,crosshairLocked=false,currentAccuracy=0;

function startCamera(){
  if(cameraStream) return;
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}},audio:false}).then(function(s){
    cameraStream=s;
    document.getElementById('camera-feed').srcObject=s;
    var cv=document.getElementById('ar-canvas'),v=document.getElementById('camera-feed');
    v.onloadedmetadata=function(){cv.width=v.videoWidth;cv.height=v.videoHeight;};
  }).catch(function(){showToast('Không mở camera!');});
}

function renderAR(){
  updateSmoothHeading();
  var canvas=document.getElementById('ar-canvas');
  if(!canvas.width){requestAnimationFrame(renderAR);return;}
  var ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  var target=GS.currentTarget;
  if(!target){requestAnimationFrame(renderAR);return;}

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
