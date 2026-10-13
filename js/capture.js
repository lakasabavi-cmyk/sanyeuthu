/* ============================================================
   MODULE: capture.js
   Chức năng: Bắt yêu thú + kết quả
   ★ v1.40: Tích hợp gameflow — onCaptureSuccess / onCaptureFail ★
   ============================================================ */

function doCapture(){
  var creature=GS.currentTarget;
  if(!creature) return;
  if(!creatureOnScreen||!crosshairLocked){
    showToast('Đưa dấu + vào yêu thú!');
    return;
  }
  var ball=GS.selectedBall;
  if(GS.inventory[ball]<=0){
    showToast('Hết bảo bối!');
    return;
  }
  GS.inventory[ball]--;

  var rate=getRate(ball,creature.element,creature.level,GS.level,currentAccuracy);

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
      '+'+CONFIG.XP_CAPTURE+' XP | '+ELEMENTS[creature.element].icon+' '+ELEMENTS[creature.element].name+' Lv.'+creature.level,
      'ok'
    );

    /* ★ THÊM DÒNG NÀY — gameflow ★ */
    if(typeof onCaptureSuccess==='function') onCaptureSuccess(creature);

  }else{
    /* ★★★ THẤT BẠI — Yêu thú biến mất ★★★ */
    GS.failed++;
    GS.xp+=CONFIG.XP_FAIL;
    if(GS.xp<0) GS.xp=0;

    showResult(
      '🏃',
      creature.emoji+' <strong>'+creature.name+'</strong> đã chạy thoát!',
      'Hãy tiếp tục tìm kiếm.<br>Tỷ lệ bắt: '+Math.round(rate*100)+'%',
      'fail'
    );

    /* ★ THÊM DÒNG NÀY — gameflow ★ */
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

  /* ★ Xóa target sau kết quả ★ */
  GS.currentTarget=null;
  document.getElementById('ar-distance').style.display='none';

  /* ★ Xóa yêu thú trên AR ★ */
  if(typeof removeCreatureOnAR==='function') removeCreatureOnAR();

  /* KHÔNG auto triggerDetection nữa — chờ player bấm 🔍 */
}

function checkLevelUp(){
  var need=xpForLevel(GS.level);
  if(GS.xp>=need){
    GS.xp-=need;
    GS.level++;
    showToast('🎊 Level '+GS.level+'!',5000);
    checkLevelUp();
  }
}
