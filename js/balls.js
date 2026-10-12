/* ============================================================
   MODULE: balls.js
   Chức năng: Bảo bối — chọn, hiển thị, quan hệ khắc/sinh
   ============================================================ */

function renderBalls(){
  var row=document.getElementById('ar-balls-row'); row.innerHTML='';
  if(!GS.currentTarget) return;
  var cre=GS.currentTarget;
  for(var key in GS.inventory){
    var el=ELEMENTS[key], count=GS.inventory[key];
    var rate=getRate(key,cre.element,cre.level,GS.level,1);
    var ratePct=Math.round(rate*1000)/10;
    var relHtml='', ballCls='';
    if(KHAC[key]===cre.element){relHtml='<div class="ar-ball-rel khac">Khắc</div>';ballCls=' advantage';}
    else if(SINH[key]===cre.element){relHtml='<div class="ar-ball-rel sinh">Sinh</div>';ballCls=' disadvantage';}
    var rc=ratePct>=50?'#4caf50':ratePct>=20?'#ffc107':'#f44336';
    row.innerHTML+='<div class="ar-ball'+(GS.selectedBall===key?' selected':'')+ballCls+'" onclick="selectBall(this,\''+key+'\')" style="background:'+el.bg+';opacity:'+(count>0?1:.3)+'">'+
      relHtml+'<div class="ar-ball-icon">'+el.icon+'</div><div class="ar-ball-name">'+el.name+'</div>'+
      '<div class="ar-ball-rate" style="color:'+rc+'">'+ratePct+'%</div><div class="ar-ball-count">×'+count+'</div></div>';
  }
}

function selectBall(elem,key){
  GS.selectedBall=key;
  document.querySelectorAll('.ar-ball').forEach(function(b){b.classList.remove('selected');});
  elem.classList.add('selected');
}

function updateInventory(){
  var c=document.getElementById('ball-inventory'); c.innerHTML='';
  for(var k in GS.inventory){
    var el=ELEMENTS[k];
    c.innerHTML+='<div class="inv-item"><div class="inv-ball-icon" style="background:'+el.bg+'">'+el.icon+'</div><div class="inv-ball-name" style="color:'+el.color+'">'+el.name+'</div><div class="inv-ball-count">×'+GS.inventory[k]+'</div></div>';
  }
}
