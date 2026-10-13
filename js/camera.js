/* ============================================================
   camera.js — Camera Feed ONLY
   ★ v2.0: XÓA toàn bộ renderAR (mũi tên canvas + bắt yêu cũ)
   ★ AR rendering: gameflow.js xử lý qua DOM
   ============================================================ */

var cameraStream = null;

/* ★ Vẫn giữ biến toàn cục để không crash file khác ★ */
var creatureOnScreen = false;
var crosshairLocked = false;
var currentAccuracy = 0;

function startCamera() {
  if (cameraStream) return;
  navigator.mediaDevices.getUserMedia({
    video: {facingMode: 'environment', width: {ideal: 1280}, height: {ideal: 720}},
    audio: false
  }).then(function(s) {
    cameraStream = s;
    document.getElementById('camera-feed').srcObject = s;
  }).catch(function() {
    showToast('Không mở camera!');
  });
}

/* ★ renderAR = NO-OP — không vẽ gì trên canvas ★ */
function renderAR() {
  /* Canvas cũ bị xóa */
  var canvas = document.getElementById('ar-canvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    if (ctx && canvas.width) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(renderAR);
}
