/* ============================================================
   MODULE: capture.js
   Chức năng: Bắt yêu thú + kết quả
   ============================================================ */

function doCapture(){
  var creature=GS.currentTarget; if(!creature) return;
  if(!creatureOnScreen||!crosshairLocked){showToast('Đưa dấu + vào yêu thú!');return;}
  var ball=GS.selectedBall;
  if(GS.inventory[ball]<=0){showToast('Hết bảo bối!');return;}
  GS.inventory[ball]--;

  var rate=getRate(ball,creature.element,creature.level,GS.level,currentAccuracy);

  if(Math.random()<rate){
    GS.caught++; GS.xp+=CONFIG.XP_CAPTURE; GS.totalXp+=CONFIG.XP_CAPTURE;
    GS.collection.push(Object.assign({},creature,{caughtAt:Date.now(),caughtWith:ball}));
    checkLevelUp();
    showResult('🎉','Bắt được '+creature.emoji+' <strong>'+creature.name+'</strong>!','+'+CONFIG.XP_CAPTURE+' XP | '+ELEMENTS[creature.element].icon+' '+ELEMENTS[creature.element].name+' Lv.'+creature.level,'ok');
  }else{
    GS.failed++; GS.xp+=CONFIG.XP_FAIL; if(GS.xp<0)GS.xp=0;
    var remain=(creature.escapeChances||1)-(creature.escapeAttemptsUsed||0)-1;
    if(remain<=0){
      showResult('💨',creature.emoji+' <strong>'+creature.name+'</strong> biến mất!','Hết lượt. Tỷ lệ: '+Math.round(rate*100)+'%','fail');
    }else{
      creature.escapeAttemptsUsed=(creature.escapeAttemptsUsed||0)+1;
      placeCreature(creature);
      creatureOnScreen=false; crosshairLocked=false; currentAccuracy=0;
      showResult('🏃',creature.emoji+' <strong>'+creature.name+'</strong> chạy trốn!','Còn '+remain+' lượt<br>Yêu thú chạy sang chỗ mới! Theo mũi tên!','fail');
    }
  }
  saveState(); updateHUD(); renderBalls();
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
  var c=GS.currentTarget;
  if(c&&c.escapeAttemptsUsed>=(c.escapeChances||1)){GS.currentTarget=null;}
  if(!GS.currentTarget){
    document.getElementById('ar-distance').style.display='none';
    setTimeout(function(){if(document.getElementById('screen-ar').classList.contains('active'))triggerDetection();},2000);
  }
}

function checkLevelUp(){
  var need=xpForLevel(GS.level);
  if(GS.xp>=need){GS.xp-=need;GS.level++;showToast('🎊 Level '+GS.level+'!',5000);checkLevelUp();}
}
