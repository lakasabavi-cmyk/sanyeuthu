/* ============================================================
   balls.js — Bảo bối
   ★ v1.06: Chỉ hiện icon + số lượng. Bỏ tên, bỏ %, bỏ Khắc/Sinh ★
   ============================================================ */

function renderBalls(){
  var row=document.getElementById('ar-balls-row');
  if(!row) return;
  row.innerHTML='';
  var cre=GS.currentTarget;
  for(var key in GS.inventory){
    var el=ELEMENTS[key];
    var count=GS.inventory[key];
    var sel=GS.selectedBall===key?' sel':'';
    var cls='';
    if(cre){
      if(KHAC[key]===cre.element) cls=' adv';
      else if(SINH[key]===cre.element) cls=' dis';
    }
    row.innerHTML+=
      '<div class="ar-ball'+sel+cls+'" onclick="selectBall(this,\''+key+'\')" style="background:'+el.bg+';opacity:'+(count>0?1:.3)+'">'+
        '<div class="ar-ball-icon">'+el.icon+'</div>'+
        '<div class="ar-ball-cnt">×'+count+'</div>'+
      '</div>';
  }
}

function selectBall(elem,key){
  GS.selectedBall=key;
  document.querySelectorAll('.ar-ball').forEach(function(b){b.classList.remove('sel');});
  elem.classList.add('sel');
}
