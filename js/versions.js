/* ============================================================
   versions.js — LỊCH SỬ PHIÊN BẢN
   ★★★ CSS RULE: KHÔNG tự ý đổi vị trí/kích thước icon, button ★★★
   ============================================================ */

var APP_VERSION = '1.20';

var VERSION_HISTORY = [
  {ver:'1.00',date:'2025-01-15',note:'Khởi tạo',changed:['index.html','css/style.css','js/*']},
  {ver:'1.01',date:'2025-01-16',note:'Fullscreen + safe area',changed:['index.html','css/style.css','js/ui.js']},
  {ver:'1.02',date:'2025-01-16',note:'🔍 search, bỏ manual turn',changed:['index.html','css/style.css','js/ui.js']},
  {ver:'1.03',date:'2025-01-17',note:'🐾 Collection',changed:['index.html','css/style.css','js/ui.js','js/balls.js']},
  {ver:'1.04',date:'2025-01-17',note:'FIX ** → Math.pow',changed:['index.html','js/navigation.js','js/versions.js']},
  {ver:'1.05',date:'2025-01-17',note:'Bỏ fullscreen button',changed:['index.html','js/versions.js']},
  {ver:'1.06',date:'2025-01-17',note:'Balls trên nút Bắt. Bỏ tên+%. Bỏ thanh tỷ lệ. x1 daily.',changed:['index.html','css/style.css','js/config.js','js/balls.js','js/camera.js','js/ui.js','js/versions.js']},
  {ver:'1.07',date:'2025-01-17',note:'FIX: Xóa canvas text trùng HTML ar-distance',changed:['js/camera.js','js/versions.js']},
  {ver:'1.08',date:'2025-01-17',note:'Balls hàng ngang center. Capture ngay dưới balls. Chỉ sửa CSS layout.',changed:['css/style.css','js/versions.js']},
  {ver:'1.11',date:'2025-01-17',note:'Bộ 15 yêu thú SVG chibi animated mặc định. Ưu tiên: AI image > SVG art > emoji.',changed:['js/creature-art.js','css/style.css','js/ui.js','index.html','js/versions.js']},
  {ver:'1.20',date:'2025-01-18',note:'Hệ thống skills: ATK/DEF/HP/SPD/SKI (max 100/stat). Rarity cap: Legendary 450, Rare 400. 5 skill categories ngũ hành. Combat formula + Board formation 1v1/3v3/5v5.',changed:['js/skills.js','js/creatures.js','js/creature-art.js','css/style.css','js/versions.js']}
];

console.log('🔮 Yêu Thú Săn Bắt v' + APP_VERSION);
