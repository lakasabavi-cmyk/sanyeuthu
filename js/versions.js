/* ============================================================
   versions.js — LỊCH SỬ PHIÊN BẢN
   ★ Mỗi lần thay đổi → thêm dòng mới vào VERSION_HISTORY ★
   ★ File này được load TRƯỚC mọi script khác ★
   ============================================================ */

var APP_VERSION = '1.04';

var VERSION_HISTORY = [
  {
    ver: '1.00',
    date: '2025-01-15',
    note: 'Khởi tạo: AR game ngũ hành (login, camera, capture, balls)',
    changed: ['index.html','css/style.css','js/config.js','js/creatures.js','js/idle.js','js/balls.js','js/navigation.js','js/camera.js','js/capture.js','js/ui.js']
  },
  {
    ver: '1.01',
    date: '2025-01-16',
    note: 'Thêm fullscreen + safe area (iPhone notch) + ẩn address bar',
    changed: ['index.html','css/style.css','js/ui.js']
  },
  {
    ver: '1.02',
    date: '2025-01-16',
    note: 'Bỏ notification "Truy tìm" → thay bằng nút 🔍 search trên side nav. Bỏ manual turn ◀▶.',
    changed: ['index.html','css/style.css','js/ui.js']
  },
  {
    ver: '1.03',
    date: '2025-01-17',
    note: 'Đổi 🎒 Túi bảo bối → 🐾 Collection (yêu thú sở hữu) + filter hệ + detail modal',
    changed: ['index.html','css/style.css','js/ui.js','js/balls.js']
  },
  {
    ver: '1.04',
    date: '2025-01-17',
    note: 'FIX: Thay ** operator → Math.pow (navigation.js chết trên webview cũ). Thêm versions.js. Thêm null safety.',
    changed: ['index.html','js/navigation.js','js/versions.js']
  }
];

/* Log version ra console */
console.log('🔮 Yêu Thú Săn Bắt v' + APP_VERSION);
console.log('📋 Lịch sử version:', VERSION_HISTORY.length, 'phiên bản');
