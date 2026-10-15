/* ============================================================
   versions.js — LỊCH SỬ PHIÊN BẢN
   ★★★ CSS RULE: KHÔNG tự ý đổi vị trí/kích thước icon, button ★★★
   ============================================================ */

var APP_VERSION = '1.53';

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
  {ver:'1.20',date:'2025-01-18',note:'Hệ thống skills: ATK/DEF/HP/SPD/SKI (max 100/stat). Rarity cap: Legendary 450, Rare 400. 5 skill categories ngũ hành. Combat formula + Board formation 1v1/3v3/5v5.',changed:['js/skills.js','js/creatures.js','js/creature-art.js','css/style.css','js/versions.js']},
  {ver:'1.41',date:'2026-10-16',note:'Hiệu ứng giả lập 3D cho yêu thú, đan dược và bùa ngũ hành trong túi và AR.',changed:['css/style.css','js/versions.js','index.html','js/ui.js']},
  {ver:'1.42',date:'2026-10-16',note:'Thử nghiệm mô hình 3D realtime có animation cho Kim Ưng bằng Three.js.',changed:['index.html','js/creature-art.js','js/creature-3d.js','css/style.css','js/versions.js','js/ui.js']},
  {ver:'1.43',date:'2026-10-16',note:'Thay bộ 15 yêu thú mặc định bằng mô hình 3D realtime có animation theo loài và nguyên tố.',changed:['js/creature-art.js','js/creature-3d.js','css/style.css','js/versions.js','index.html','js/ui.js']}
  ,{ver:'1.44',date:'2026-10-16',note:'Texture 3D theo hệ: Kim ánh kim, Mộc vân lá, Thủy sóng nước, Hỏa lửa, Thổ đá nứt với màu đúng hệ.',changed:['js/creature-3d.js','js/versions.js','index.html','js/ui.js']}
  ,{ver:'1.45',date:'2026-10-16',note:'Thêm hiệu ứng âm thanh (Web Audio): bấm nút, chuyển màn, yêu thú xuất hiện, ném bùa, bắt thành công/thất bại, lên cấp.',changed:['js/sound.js','js/capture.js','js/gameflow.js','js/ui.js','index.html','js/versions.js']}
  ,{ver:'1.46',date:'2026-10-16',note:'Thêm nhạc nền nhẹ nhàng; Hồ sơ có công tắc bật/tắt riêng hiệu ứng và nhạc nền.',changed:['js/sound.js','js/ui.js','css/style.css','index.html','js/versions.js']}
  ,{ver:'1.47',date:'2026-10-16',note:'Hồ sơ: thêm nút −/+ và thanh trượt chỉnh âm lượng hiệu ứng và nhạc nền riêng.',changed:['js/sound.js','css/style.css','index.html','js/ui.js','js/versions.js']}
  ,{ver:'1.48',date:'2026-10-16',note:'Mỗi khu vực 5 yêu thú + 5 bùa (từ 2). Bắt trượt: yêu thú trốn sang hướng khác, trượt đủ 3 lần mới biến mất và trừ số lượng.',changed:['js/gameflow.js','js/capture.js','js/ui.js','index.html','js/versions.js']}
  ,{ver:'1.49',date:'2026-10-16',note:'Đóng gói app Android/iOS bằng Capacitor; thư viện three/supabase chạy offline.',changed:['package.json','capacitor.config.json','scripts/*','android/*','ios/*','index.html','js/vendor/*','js/ui.js','js/versions.js']}
  ,{ver:'1.50',date:'2026-10-16',note:'Gỡ nút test thêm yêu thú và thêm đan dược khỏi Hồ sơ.',changed:['index.html','js/ui.js','js/creatures.js','js/versions.js']}
  ,{ver:'1.51',date:'2026-10-16',note:'Kết nối AI: chọn Gemini, ChatGPT hoặc Claude (bỏ Muse Spark); vẫn giữ backend riêng.',changed:['js/ai.js','js/versions.js','js/ui.js','index.html']}
  ,{ver:'1.52',date:'2026-10-16',note:'Tự động toàn màn hình khi chơi bằng trình duyệt điện thoại (chạm lần đầu).',changed:['js/ui.js','js/versions.js','index.html']}
  ,{ver:'1.53',date:'2026-10-16',note:'Sửa lỗi không tải được dịch vụ đăng nhập: thêm CDN dự phòng cho Supabase/Three khi thiếu js/vendor.',changed:['index.html','js/ui.js','js/versions.js']}
];

console.log('🔮 PHỤC YÊU AI v' + APP_VERSION);
