/* ============================================================
   versions.js — LỊCH SỬ PHIÊN BẢN
   ★★★ CSS RULE: KHÔNG tự ý đổi vị trí/kích thước icon, button ★★★
   ============================================================ */

var APP_VERSION = '1.08';

var VERSION_HISTORY = [
  {ver:'1.00',date:'2025-01-15',note:'Khởi tạo',changed:['index.html','css/style.css','js/*']},
  {ver:'1.01',date:'2025-01-16',note:'Fullscreen + safe area',changed:['index.html','css/style.css','js/ui.js']},
  {ver:'1.02',date:'2025-01-16',note:'🔍 search, bỏ manual turn',changed:['index.html','css/style.css','js/ui.js']},
  {ver:'1.03',date:'2025-01-17',note:'🐾 Collection',changed:['index.html','css/style.css','js/ui.js','js/balls.js']},
  {ver:'1.04',date:'2025-01-17',note:'FIX ** → Math.pow',changed:['index.html','js/navigation.js','js/versions.js']},
  {ver:'1.05',date:'2025-01-17',note:'Bỏ fullscreen button',changed:['index.html','js/versions.js']},
  {ver:'1.06',date:'2025-01-17',note:'Balls trên nút Bắt. Bỏ tên+%. Bỏ thanh tỷ lệ. x1 daily.',changed:['index.html','css/style.css','js/config.js','js/balls.js','js/camera.js','js/ui.js','js/versions.js']},
  {ver:'1.07',date:'2025-01-17',note:'FIX: Xóa canvas text trùng HTML ar-distance',changed:['js/camera.js','js/versions.js']},
  {ver:'1.08',date:'2025-01-17',note:'Balls hàng ngang center. Capture ngay dưới balls. Chỉ sửa CSS layout.',changed:['css/style.css','js/versions.js']}
];

console.log('🔮 Yêu Thú Săn Bắt v' + APP_VERSION);
