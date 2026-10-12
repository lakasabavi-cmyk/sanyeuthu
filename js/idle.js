/* ============================================================
   MODULE: idle.js
   Chức năng: Yêu thú idle animation — ngoái đầu, đung đưa, dậm chân
   ============================================================ */

function drawCreatureIdle(ctx,cx,cy,size,creature,time){
  var el=ELEMENTS[creature.element], s=size/100;

  var bodySway=Math.sin(time*0.78)*4*s;
  var breathScale=1+Math.sin(time*1.25)*0.02;
  var headTurn=Math.sin(time*0.52)*12;
  var headBob=Math.sin(time*1.6)*3*s;
  var isBlinking=(time%4)>3.85&&(time%4)<4.0;
  var tailWag=Math.sin(time*2.1)*30;
  var footTapT=(time%3);
  var footTapY=footTapT<0.3?-15*Math.sin(footTapT/0.3*Math.PI)*s:0;
  var earTwitchT=(time%5);
  var earTwitch=earTwitchT>4.7?-8*Math.sin((earTwitchT-4.7)/0.3*Math.PI):0;
  var hipSway=Math.sin(time*0.9+1)*2*s;

  // Glow
  var gg=ctx.createRadialGradient(cx,cy,size*0.2,cx,cy,size*1.2);
  gg.addColorStop(0,el.primary+'35');gg.addColorStop(1,'transparent');
  ctx.fillStyle=gg;ctx.fillRect(cx-size*1.5,cy-size*1.5,size*3,size*3);

  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.beginPath();ctx.ellipse(cx+bodySway*0.5,cy+size*0.52,size*0.38,size*0.08,0,0,Math.PI*2);ctx.fill();

  // Tail
  ctx.save();ctx.translate(cx+bodySway*0.3,cy+hipSway*0.5);ctx.rotate(tailWag*Math.PI/180*0.5);
  ctx.strokeStyle=el.primary;ctx.lineWidth=5*s;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-18*s,10*s);ctx.quadraticCurveTo(-42*s,-5*s+Math.sin(time*2)*5*s,-52*s,-25*s);ctx.stroke();
  ctx.fillStyle=el.primary+'70';ctx.beginPath();ctx.arc(-52*s,-25*s,10*s,0,Math.PI*2);ctx.fill();ctx.restore();

  // Feet
  ctx.save();ctx.translate(cx+bodySway*0.5-15*s,cy+size*0.38);ctx.fillStyle='#FFE0BD';ctx.strokeStyle=el.primary+'40';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,0,10*s,8*s,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  ctx.save();ctx.translate(cx+bodySway*0.5+hipSway*0.3+15*s,cy+size*0.38+footTapY);ctx.fillStyle='#FFE0BD';ctx.strokeStyle=el.primary+'40';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,0,10*s,8*s,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();

  // Body
  ctx.save();ctx.translate(cx+bodySway,cy+hipSway*0.3);ctx.scale(breathScale,breathScale);
  ctx.fillStyle='#FFE0BD';ctx.strokeStyle=el.primary+'60';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(0,5*s,26*s,24*s,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.15)';ctx.beginPath();ctx.ellipse(0,12*s,16*s,14*s,0,0,Math.PI*2);ctx.fill();ctx.restore();

  // Head
  ctx.save();ctx.translate(cx+bodySway,cy-18*s+headBob);ctx.rotate(headTurn*Math.PI/180);

  [[-1,earTwitch],[1,-earTwitch]].forEach(function(p){
    var sx=p[0],tw=p[1];ctx.save();ctx.translate(sx*18*s,-28*s);ctx.rotate(tw*Math.PI/180);
    ctx.fillStyle='#FFE0BD';ctx.strokeStyle=el.primary+'60';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,10*s);ctx.lineTo(sx*10*s,-18*s);ctx.lineTo(-sx*12*s,5*s);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#FFB6C1';ctx.beginPath();ctx.moveTo(-sx*2*s,6*s);ctx.lineTo(sx*6*s,-12*s);ctx.lineTo(-sx*10*s,3*s);ctx.closePath();ctx.fill();ctx.restore();
  });

  var hr=28*s;
  ctx.fillStyle='#FFE0BD';ctx.strokeStyle=el.primary+'50';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,0,hr,hr*1.05,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#FFB6C150';ctx.beginPath();ctx.ellipse(-hr*0.55,5*s,7*s,5*s,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(hr*0.55,5*s,7*s,5*s,0,0,Math.PI*2);ctx.fill();

  [-1,1].forEach(function(sx){
    if(isBlinking){ctx.strokeStyle='#333';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx*10*s-5*s,-2*s);ctx.lineTo(sx*10*s+5*s,-2*s);ctx.stroke();}
    else{
      ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(sx*10*s,-2*s,9*s,11*s,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=el.primary;ctx.beginPath();ctx.arc(sx*10*s,0,6*s,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a1a2e';ctx.beginPath();ctx.arc(sx*10*s,0,3*s,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(sx*10*s-2.5*s,-3*s,2.5*s,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(sx*10*s+1.5*s,2*s,1.2*s,0,Math.PI*2);ctx.fill();
    }
  });
  ctx.strokeStyle='#333';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,10*s,7*s,Math.PI*0.15,Math.PI*0.85);ctx.stroke();
  ctx.fillStyle=el.primary+'80';ctx.beginPath();ctx.ellipse(0,4*s,3*s,2.5*s,0,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // Sparkles
  for(var sp=0;sp<6;sp++){
    var sa=time*1.5+sp*(Math.PI*2/6), sd=size*0.65+Math.sin(time*2+sp)*size*0.15;
    ctx.fillStyle=el.glow+'60';ctx.beginPath();
    ctx.arc(cx+Math.cos(sa)*sd,cy+Math.sin(sa)*sd*0.7,Math.max(1,1.5+Math.sin(time*3+sp*1.5)*1.5),0,Math.PI*2);ctx.fill();
  }
}
