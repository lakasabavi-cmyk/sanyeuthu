/* Mẫu mũi tên chỉ hướng quanh Crosshair. Mỗi mẫu vẽ hướng sang PHẢI, được xoay theo 8 hướng.
   Màu lấy từ CSS (currentColor), cùng màu đỏ với vòng Crosshair khi phát hiện. */
var RG_ARROWS = [
  {name: 'A. Chevron mảnh',
   body: '<path d="M14 7 L28 20 L14 33" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>'},
  {name: 'B. Tam giác đặc',
   body: '<path d="M11 7 L33 20 L11 33 Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>'},
  {name: 'C. Mũi tên có thân',
   body: '<path d="M5 20 H31 M20 8 L32 20 L20 32" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'},
  {name: 'D. Chevron kép',
   body: '<path d="M6 8 L18 20 L6 32 M20 8 L32 20 L20 32" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'},
  {name: 'E. Huy hiệu tròn',
   body: '<circle cx="20" cy="20" r="17" fill="rgba(244,67,54,.18)" stroke="currentColor" stroke-width="3"/><path d="M15 11 L26 20 L15 29" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>'},
  {name: 'F. Mũi tên la bàn',
   body: '<path d="M35 20 L7 7 L15 20 L7 33 Z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>'}
];

function getArrowSvg(idx) {
  var a = RG_ARROWS[idx] || RG_ARROWS[0];
  return '<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">' + a.body + '</svg>';
}
