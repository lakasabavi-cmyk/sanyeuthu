/* ============================================================
   versions.js — LỊCH SỬ PHIÊN BẢN
   ★ Mỗi lần thay đổi → thêm dòng mới ★
   ★★ QUY TẮC CSS: KHÔNG tự ý đổi vị trí/kích thước icon, button ★★
   ============================================================ */

var APP_VERSION = '1.06';

var VERSION_HISTORY = [
  {ver:'1.00',date:'2025-01-15',note:'Khởi tạo: AR game ngũ hành',changed:['index.html','css/style.css','js/config.js','js/creatures.js','js/idle.js','js/balls.js','js/navigation.js','js/camera.js','js/capture.js','js/ui.js']},
  {ver:'1.01',date:'2025-01-16',note:'Thêm fullscreen + safe area (iPhone notch)',changed:['index.html','css/style.css','js/ui.js']},
  {ver:'1.02',date:'2025-01-16',note:'Bỏ "Truy tìm" → 🔍 search. Bỏ manual turn.',changed:['index.html','css/style.css','js/ui.js']},
  {ver:'1.03',date:'2025-01-17',note:'Đổi 🎒 → 🐾 Collection + filter + detail',changed:['index.html','css/style.css','js/ui.js','js/balls.js']},
  {ver:'1.04',date:'2025-01-17',note:'FIX: ** → Math.pow. Thêm versions.js.',changed:['index.html','js/navigation.js','js/versions.js']},
  {ver:'1.05',date:'2025-01-17',note:'Bỏ nút fullscreen ⛶',changed:['index.html','js/versions.js']},
  {ver:'1.06',date:'2025-01-17',note:'Balls lên trên nút Bắt. Bỏ tên+% trên balls. Bỏ thanh tỷ lệ. Tăng size nút Bắt. Túi khởi tạo x1 mỗi loại + daily +1. CSS rule: không đổi vị trí/kích thước.',changed:['index.html','css/style.css','js/config.js','js/balls.js','js/camera.js','js/ui.js','js/versions.js']}
];

console.log('🔮 Yêu Thú Săn Bắt v' + APP_VERSION);
