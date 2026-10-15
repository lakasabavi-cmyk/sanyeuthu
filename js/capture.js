/* ============================================================
   capture.js — Bắt yêu thú + kết quả
   ★ v1.40: Element advantage + bùa ngũ hành
   ============================================================ */

function doCapture(){
  var creature=GS.currentTarget;
  if(!creature) return;
  if(!creatureOnScreen||!crosshairLocked){
    showToast('Đưa dấu + vào yêu thú!');
    return;
  }
  var ball=GS.selectedBall;
  if(!GS.inventory[ball]||GS.inventory[ball]<=0){
    showToast('Hết '+(BALLS[ball]?BALLS[ball].name:'bùa')+'!');
    return;
  }
  GS.inventory[ball]--;
  if(typeof SFX!=='undefined') SFX.play('throwBall');

  var rate=getRate(ball,creature.element,creature.level,GS.level,currentAccuracy);

  /* ★ Element advantage display ★ */
  var adv=getAdvantageLabel(ball,creature.element);
  var advText='<br><span style="color:'+adv.color+';font-size:11px">'+adv.text+' '+adv.bonus+'</span>';

  if(Math.random()<rate){
    /* ★★★ THÀNH CÔNG ★★★ */
    GS.caught++;
    GS.xp+=CONFIG.XP_CAPTURE;
    GS.totalXp+=CONFIG.XP_CAPTURE;
    GS.collection.push(Object.assign({},creature,{caughtAt:Date.now(),caughtWith:ball}));
    checkLevelUp();

    showResult(
      '🎉',
      'Bắt được '+creature.emoji+' <strong>'+creature.name+'</strong>!',
      '+'+CONFIG.XP_CAPTURE+' XP | '+ELEMENTS[creature.element].icon+' '+ELEMENTS[creature.element].name+' Lv.'+creature.level+advText,
      'ok'
    );

    if(typeof onCaptureSuccess==='function') onCaptureSuccess(creature);

  }else{
    /* ★★★ THẤT BẠI — Yêu thú biến mất ★★★ */
    GS.failed++;
    GS.xp+=CONFIG.XP_FAIL;
    if(GS.xp<0) GS.xp=0;
    creature.fails=(creature.fails||0)+1;
    var maxFails=(typeof FLOW!=='undefined'&&FLOW.MAX_FAILS_PER_CREATURE)||3;
    var fled=creature.fails<maxFails;

    showResult(
      fled?'💨':'🏃',
      fled
        ?creature.emoji+' <strong>'+creature.name+'</strong> trốn sang chỗ khác!'
        :creature.emoji+' <strong>'+creature.name+'</strong> đã chạy thoát!',
      (fled?'Trượt lần '+creature.fails+'/'+maxFails+'. Hãy tìm và thử lại.':'Đã trượt '+maxFails+' lần, yêu thú biến mất.')
        +'<br>Tỷ lệ bắt: '+Math.round(rate*100)+'%'+advText,
      'fail'
    );

    if(typeof onCaptureFail==='function') onCaptureFail(creature);
  }

  saveState();
  updateHUD();
  renderBalls();
}

function showResult(icon,title,sub,cls){
  document.getElementById('result-icon').innerHTML=icon;
  document.getElementById('result-title').innerHTML=title;
  document.getElementById('result-sub').innerHTML=sub;
  document.getElementById('result-btn').className='result-btn '+(cls==='ok'?'ok':'fail');
  document.getElementById('result-modal').classList.add('active');
}

function closeResult(){
  document.getElementById('result-modal').classList.remove('active');
  GS.currentTarget=null;
  document.getElementById('ar-distance').style.display='none';
  if(typeof removeCreatureOnAR==='function') removeCreatureOnAR();
  if(typeof respawnFledCreature==='function') respawnFledCreature();
}

function checkLevelUp(){
  var need=xpForLevel(GS.level);
  if(GS.xp>=need){
    GS.xp-=need;
    GS.level++;
    if(typeof SFX!=='undefined') setTimeout(function(){SFX.play('levelUp');},1100);
    showToast('🎊 Level '+GS.level+'!',5000);
    checkLevelUp();
  }
}
