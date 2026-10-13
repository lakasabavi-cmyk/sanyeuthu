/* ============================================================
   ai.js — Biến hình yêu thú bằng AI
   - Không giữ khóa API ở client: gọi tới AI_CONFIG.endpoint (proxy của bạn).
   - endpoint trống => chế độ DEMO (không gọi AI thật, chỉ để thử luồng).
   - Proxy nhận POST JSON {prompt, negative, element, gu}
     và trả JSON {image: "<url hoặc data:image/...>"}.
   ============================================================ */
var AI_CONFIG = {
  endpoint: '',
  freeQuota: 3,
  timeoutMs: 60000,
  imageSize: 256
};

/* GU yêu thú: chỉ dùng từ khóa mô tả chung, không nêu tên nhân vật/thương hiệu/người thật */
var AI_GU = [
  {id:'chibi_jp',  name:'Chibi Nhật Bản',      prompt:'Japanese chibi kawaii style, big sparkling anime eyes, school-mascot charm, sakura petals, pastel candy palette'},
  {id:'doll_cn',   name:'Búp bê Trung Hoa',    prompt:'Chinese porcelain doll style, hanfu inspired mini outfit, hair buns with tiny tassels, red silk ribbons, golden cloud patterns, paper lantern'},
  {id:'kpop',      name:'Ca sĩ Hàn Quốc',     prompt:'K-pop idol stage outfit, trendy pastel hair color, tiny headset microphone, glittery stage costume, light stick, spotlight and confetti'},
  {id:'football',  name:'Cầu thủ nổi tiếng',  prompt:'cute football star, sporty jersey with number, tiny football boots, golden trophy, captain armband, stadium lights'},
  {id:'dragonball',name:'7 viên ngọc rồng',   prompt:'seven glowing orange wish orbs with red stars floating around, martial artist gi outfit, spiky energy hair, ki aura, adventure quest vibe'},
  {id:'dragon',    name:'Bí kíp luyện rồng',  prompt:'friendly young dragon companion with tiny wings, Viking adventurer outfit, fur boots, wooden shield, misty cliff island, dragon-training vibe'},
  {id:'avatar',    name:'Avatar film',         prompt:'bioluminescent alien forest creature, glowing blue-teal skin patterns, long braid with sensory tendrils, floating spirit seeds, fantasy jungle moon'},
  {id:'dc',        name:'Biệt đội DC',        prompt:'caped superhero team costume, bold emblem chest badge, tiny mask, heroic pose, dark city skyline with glowing signal in the sky'},
  {id:'elf',       name:'Yêu quái tai nhọn',  prompt:'pointed elf ears, forest spirit imp, tiny leaf cloak, pixie lantern, mischievous cute smile, moonlit woodland'},
  {id:'avengers',  name:'Anh Hùng Avenger',   prompt:'armored hero squad outfit, glowing energy core in chest, tiny hammer and shield, super hero landing pose, futuristic tower backdrop'}
];

/* Prompt theo hệ ngũ hành */
var CREATURE_PROMPTS = {
  KIM: {
    style: 'chibi collectible figurine, blind box toy, kawaii Sanrio style, Nendoroid inspired',
    color: 'rich gold #FFD700, warm amber #FFBF00, white pearl #FFF8E7, soft pink #FFB6C1',
    features: 'oversized round head, sparkling golden amber eyes with star highlights, rosy pink blush cheeks, tiny beak with gentle smile, golden feather tuft on head',
    body: 'soft golden metallic feathers with pearlescent sheen, tiny wings with metal plating, small golden boots with diamond buckle, miniature golden royal cape with star patterns',
    accessories: 'tiny golden sword, small round golden shield, golden ring on pinky finger, sparkling golden star particles, subtle golden halo ring',
    lighting: 'soft studio lighting top-left, gentle rim light, volumetric golden glow',
    bg: 'soft cream to light gold gradient, golden bokeh, floating tiny gold stars',
    negative: 'realistic bird, eagle anatomy, scary, dark, horror, deformed, ugly, text, watermark'
  },
  MOC: {
    style: 'chibi collectible figurine, blind box toy, kawaii Sanrio My Melody style, Nendoroid inspired',
    color: 'fresh spring green #228B22, soft mint #98FB98, pink cherry blossom #FFB6C1, white daisy #FFF8E7',
    features: 'oversized round head, sparkling emerald green eyes with flower highlights, rosy sakura blush cheeks, tiny smile with pink tongue, green leaf sprout on forehead',
    body: 'soft pastel green scales with pearlescent shimmer, curled spiral shape like cinnamon roll, tiny flower petal pattern on back scales, outfit made of interwoven leaves and tiny flowers',
    accessories: 'tiny flower crown with sakura and daisies, blue butterfly on shoulder, tiny snail friend on shoulder, small mushroom basket, floating flower petals, tiny ladybug',
    lighting: 'soft warm sunlight top-right, gentle green ambient glow, volumetric morning light',
    bg: 'soft green to pastel pink gradient, garden bokeh, floating flower petals, morning dew drops',
    negative: 'realistic snake, reptile, scary, venomous, slimy, dark, horror, deformed, ugly, text, watermark'
  },
  THUY: {
    style: 'chibi collectible figurine, blind box toy, kawaii Sanrio Cinnamoroll style, Nendoroid inspired',
    color: 'ocean blue #1E90FF, deep teal #008080, seafoam #20B2AA, pearl white #FFF8E7, coral pink #FF7F50',
    features: 'oversized round head, sparkling deep ocean blue eyes with droplet highlights, rosy coral blush cheeks, tiny gentle peaceful smile, water droplet bang on forehead',
    body: 'soft pastel blue skin, beautiful sea turtle shell with hexagonal pattern in deep teal with golden edges, tiny wave motifs and starfish details, webbed feet with shell sandals',
    accessories: 'water droplet tiara refracting light, starfish necklace, seashell purse, iridescent soap bubbles floating, cute jellyfish friend above, tiny coral reef, treasure chest with pearls',
    lighting: 'soft underwater lighting from above, gentle blue ambient glow, volumetric underwater sun rays',
    bg: 'light blue to aquamarine gradient, underwater caustic light, floating air bubbles, sun rays through water',
    negative: 'realistic turtle, reptile, scary, rough shell, slimy, dark deep sea, horror, deformed, ugly, text, watermark'
  },
  HOA: {
    style: 'chibi collectible figurine, blind box toy, kawaii Sanrio Kuromi style, Nendoroid inspired',
    color: 'warm orange #FF4500, sunset red #FF6347, cream #FFFDD0, golden amber #FFBF00, spark yellow #FFD700',
    features: 'oversized round head, sparkling warm amber orange eyes with flame highlights, rosy sunset blush cheeks, mischievous smile with one tiny fang, three small flame tuft on head, oversized fox ears pink inside',
    body: 'soft fluffy orange-red fur gradient, cream belly, three tail flames each tip with golden star, tiny paws with paw pads in orange sneakers, subtle sparkly ember particles in fur',
    accessories: 'tiny red lantern on ear, red ribbon bow on other ear, sparkler wand in hand, crescent moon necklace, floating ember particles, warm glowing aura, tiny fireworks burst above head',
    lighting: 'warm golden hour lighting from behind, gentle orange ambient glow, volumetric fire light',
    bg: 'warm orange to sunset pink gradient, fire ember particles, warm sunset glow, tiny sparkles',
    negative: 'realistic fox, wolf, scary, aggressive, dark, sharp teeth, realistic fire, horror, deformed, ugly, text, watermark'
  },
  THO: {
    style: 'chibi collectible figurine, blind box toy, kawaii Sanrio Pompompurin style, Nendoroid inspired',
    color: 'warm chocolate brown #8B4513, earthy terracotta #D2691E, cream #FFFDD0, peach #FFDAB9, rainbow crystal iridescent',
    features: 'oversized round head, sparkling chocolate brown eyes with heart highlights, rosy peach blush cheeks, content peaceful smile, rainbow crystal growing from head refracting tiny rainbows, tiny rounded tusks',
    body: 'soft warm chocolate brown fur, cream belly, chubby rounded body, small hooves in brown hiking boots with flowers, back shell plate with moss and tiny mushroom growing, tiny boar tusks',
    accessories: 'rainbow crystal crown, tiny mushroom hat red with white dots, bread loaf in hands, miniature cottage backpack, wheat stalks and flower bouquet, tiny ladybug, golden honey pot, floating crystal shards',
    lighting: 'warm cottage lighting front-right, gentle golden ambient glow, volumetric warm light',
    bg: 'warm earth to cream gradient, golden bokeh, floating crystal particles, cozy cabin lighting, morning golden light',
    negative: 'realistic boar, pig, scary, dark, rough, sharp tusks, muddy, dirty, horror, deformed, ugly, text, watermark'
  }
};

function checkAiConnection() { return true; }

function getAiQuota() {
  if (!GS.ai) GS.ai = {used: 0, bonus: 0};
  var total = AI_CONFIG.freeQuota + (GS.ai.bonus || 0);
  return {total: total, used: GS.ai.used || 0, left: Math.max(0, total - (GS.ai.used || 0))};
}

function getGu(id) {
  for (var i = 0; i < AI_GU.length; i++) if (AI_GU[i].id === id) return AI_GU[i];
  return AI_GU[0];
}

function getSelectedGu() {
  return getGu(GS.ai && GS.ai.gu);
}

function setGu(id) {
  if (!GS.ai) GS.ai = {used: 0, bonus: 0};
  GS.ai.gu = getGu(id).id;
  saveState();
}

/* Dropdown "Chọn GU yêu thú" đặt trên nút Biến hình */
function renderGuSelect() {
  var cur = getSelectedGu().id;
  var opts = AI_GU.map(function(g) {
    return '<option value="' + g.id + '"' + (g.id === cur ? ' selected' : '') + '>' + g.name + '</option>';
  }).join('');
  return '<div class="gu-wrap"><label class="gu-label" for="gu-select">🎀 Chọn GU yêu thú</label>'
    + '<select class="gu-select" id="gu-select" onchange="setGu(this.value)">' + opts + '</select></div>';
}

function buildAiPrompt(creature, gu) {
  var t = CREATURE_PROMPTS[creature.element] || CREATURE_PROMPTS.KIM;
  var rarity = creature.rarity || 'common';
  var rarityDetail = rarity === 'legendary'
    ? 'legendary epic divine ultra detailed ornate decorations glowing divine aura mythical'
    : rarity === 'rare'
    ? 'rare special detailed magical effects unique design glowing accents'
    : 'cute adorable friendly simple clean design';
  var realm = (typeof getRealm === 'function') ? getRealm(creature.level) : {name: ''};

  return 'A super cute ' + t.style + ' character, "' + creature.name + '", '
    + 'kawaii ' + creature.element + ' element creature, level ' + creature.level + ' ' + realm.name + ' realm, '
    + rarityDetail + ', '
    + 'HYBRID THEME (blend with the creature, keep the creature recognizable): ' + gu.prompt + ', '
    + 'FACIAL: ' + t.features + ', '
    + 'BODY: ' + t.body + ', '
    + 'ACCESSORIES: ' + t.accessories + ', '
    + 'COLORS: ' + t.color + ', '
    + 'BACKGROUND: ' + t.bg + ', '
    + 'LIGHTING: ' + t.lighting + ', '
    + 'centered composition, white border edges, ultra detailed 4K product photography style, '
    + 'smooth toy texture, family friendly, no text no watermark';
}

function buildAiNegative(creature) {
  var t = CREATURE_PROMPTS[creature.element];
  return (t ? t.negative : '') + ', photorealistic, blurry, low quality, cropped, signature, real person, logo, brand name';
}

/* ---------- UI ---------- */
var _aiSel = {idx: -1, busy: false};

function requestTransform(idx) {
  var c = GS.collection[idx];
  if (!c) return;
  _aiSel = {idx: idx, busy: false};
  closeCreatureDetail();

  var q = getAiQuota();
  var gu = getSelectedGu();

  var o = document.createElement('div');
  o.className = 'ai-overlay';
  o.id = 'ai-overlay';
  o.innerHTML = '<div class="ai-box">'
    + '<div class="ai-title">✨ Biến hình</div>'
    + '<div class="ai-art" id="ai-art">' + renderCreatureArt(c, 140) + '</div>'
    + '<div class="ai-name">' + c.name + '</div>'
    + '<div class="ai-gu">🎀 GU: <strong>' + gu.name + '</strong></div>'
    + '<div class="ai-quota" id="ai-quota">Lượt miễn phí còn lại: <strong>' + q.left + '</strong>/' + q.total + (aiIsDemo() ? ' · <em>DEMO</em>' : '') + '</div>'
    + '<div class="ai-msg" id="ai-msg"></div>'
    + '<button class="ai-go" id="ai-go" onclick="aiGenerate()">✨ Tạo hình mới</button>'
    + '<button class="ai-cancel" onclick="closeAiModal()">Đóng</button>'
    + '</div>';
  document.body.appendChild(o);
}

function closeAiModal() {
  var o = document.getElementById('ai-overlay');
  if (o) o.remove();
}

function aiSetMsg(t, err) {
  var m = document.getElementById('ai-msg');
  if (m) { m.textContent = t || ''; m.className = 'ai-msg' + (err ? ' err' : ''); }
}

function aiGenerate() {
  if (_aiSel.busy) return;
  var c = GS.collection[_aiSel.idx];
  if (!c) return;
  var q = getAiQuota();
  if (q.left <= 0) { aiSetMsg('Đã hết lượt miễn phí. Hãy đăng ký gói của đối tác để tạo thêm.', true); return; }

  var gu = getSelectedGu();
  var prompt = buildAiPrompt(c, gu);

  _aiSel.busy = true;
  var go = document.getElementById('ai-go');
  go.disabled = true;
  go.textContent = '⏳ Đang biến hình...';
  document.getElementById('ai-art').classList.add('loading');
  aiSetMsg('');

  aiFetchImage(c, gu, prompt).then(function(img) {
    return aiShrink(img);
  }).then(function(img) {
    c.aiImage = img;
    c.aiGu = gu.id;
    GS.ai.used = (GS.ai.used || 0) + 1;
    try {
      saveState();
    } catch (e) {
      GS.ai.used--;
      delete c.aiImage;
      throw new Error('Bộ nhớ trình duyệt đã đầy.');
    }
    document.getElementById('ai-art').classList.remove('loading');
    document.getElementById('ai-art').innerHTML = '<img src="' + img + '" alt="' + c.name + '">';
    var q2 = getAiQuota();
    document.getElementById('ai-quota').innerHTML = 'Lượt miễn phí còn lại: <strong>' + q2.left + '</strong>/' + q2.total;
    aiSetMsg('🎉 Biến hình thành công!');
    go.textContent = '✅ Xong';
    if (typeof updateCollection === 'function') updateCollection();
    _aiSel.busy = false;
  }).catch(function(e) {
    _aiSel.busy = false;
    var art = document.getElementById('ai-art');
    if (art) art.classList.remove('loading');
    if (go) { go.disabled = false; go.textContent = '✨ Tạo hình mới'; }
    aiSetMsg('Không tạo được hình: ' + (e && e.message ? e.message : 'lỗi kết nối'), true);
  });
}

/* ---------- Kết nối AI (test) ----------
   Endpoint/chế độ lưu localStorage; token chỉ lưu sessionStorage (mất khi đóng tab).
   Chỉ dùng để thử. Bản chạy thật phải gọi qua backend, không để token ở trình duyệt. */
var AI_CONN_KEY = 'yeuthu_ai_conn';
var AI_TOKEN_KEY = 'yeuthu_ai_token';

function aiGetConn() {
  var c = {endpoint: '', mode: 'proxy', token: ''};
  try { var s = JSON.parse(localStorage.getItem(AI_CONN_KEY) || '{}'); c.endpoint = s.endpoint || ''; c.mode = s.mode || 'proxy'; } catch (e) {}
  try { c.token = sessionStorage.getItem(AI_TOKEN_KEY) || ''; } catch (e) {}
  if (AI_CONFIG.endpoint) c.endpoint = AI_CONFIG.endpoint;
  return c;
}

function aiIsDemo() { return !aiGetConn().endpoint; }

function openAiConnect() {
  var c = aiGetConn();
  var o = document.createElement('div');
  o.className = 'ai-overlay';
  o.id = 'ai-conn-overlay';
  o.innerHTML = '<div class="ai-box">'
    + '<div class="ai-title">🔌 Kết nối AI (test)</div>'
    + '<div class="ai-label">Địa chỉ API (https://...)</div>'
    + '<input class="ai-input" id="aic-endpoint" placeholder="https://..." value="' + String(c.endpoint).replace(/"/g, '&quot;') + '">'
    + '<div class="ai-label">Kiểu yêu cầu</div>'
    + '<select class="gu-select" id="aic-mode">'
    +   '<option value="proxy"' + (c.mode === 'proxy' ? ' selected' : '') + '>Backend của game {prompt, negative, element, gu}</option>'
    +   '<option value="muse"' + (c.mode === 'muse' ? ' selected' : '') + '>Muse Spark {modality, input_prompt, config} (chưa xác minh)</option>'
    + '</select>'
    + '<div class="ai-label">API key / access token (chỉ lưu trong tab này)</div>'
    + '<input class="ai-input" id="aic-token" type="password" autocomplete="off" placeholder="Bearer token" value="' + String(c.token).replace(/"/g, '&quot;') + '">'
    + '<div class="ai-msg" id="aic-msg"></div>'
    + '<img id="aic-preview" style="display:none;width:120px;height:120px;border-radius:16px;margin:4px auto;object-fit:cover">'
    + '<button class="ai-go" id="aic-test" onclick="testAiConnect()">🧪 Lưu và thử tạo 1 ảnh</button>'
    + '<button class="ai-cancel" onclick="saveAiConnect(true)">Lưu và đóng</button>'
    + '<button class="ai-cancel" onclick="clearAiConnect()">Xóa kết nối (về demo)</button>'
    + '</div>';
  document.body.appendChild(o);
}

function saveAiConnect(close) {
  var ep = document.getElementById('aic-endpoint').value.trim();
  if (ep && !/^https:\/\//i.test(ep) && !/^http:\/\/(localhost|127\.0\.0\.1)/i.test(ep)) {
    document.getElementById('aic-msg').textContent = 'Địa chỉ phải bắt đầu bằng https://';
    document.getElementById('aic-msg').className = 'ai-msg err';
    return false;
  }
  localStorage.setItem(AI_CONN_KEY, JSON.stringify({endpoint: ep, mode: document.getElementById('aic-mode').value}));
  var tk = document.getElementById('aic-token').value.trim();
  if (tk) sessionStorage.setItem(AI_TOKEN_KEY, tk); else sessionStorage.removeItem(AI_TOKEN_KEY);
  if (close) { var o = document.getElementById('ai-conn-overlay'); if (o) o.remove(); if (typeof showToast === 'function') showToast(aiIsDemo() ? 'AI: chế độ demo' : 'AI: đã lưu kết nối'); }
  return true;
}

function clearAiConnect() {
  localStorage.removeItem(AI_CONN_KEY);
  sessionStorage.removeItem(AI_TOKEN_KEY);
  var o = document.getElementById('ai-conn-overlay'); if (o) o.remove();
  if (typeof showToast === 'function') showToast('AI: đã xóa kết nối, về chế độ demo');
}

function testAiConnect() {
  if (!saveAiConnect(false)) return;
  var msg = document.getElementById('aic-msg'), btn = document.getElementById('aic-test'), pv = document.getElementById('aic-preview');
  var sample = {id: 0, name: 'Thử nghiệm', element: 'KIM', rarity: 'common', level: 1};
  var gu = getSelectedGu();
  btn.disabled = true; btn.textContent = '⏳ Đang thử...';
  msg.className = 'ai-msg'; msg.textContent = '';
  aiFetchImage(sample, gu, buildAiPrompt(sample, gu)).then(function(img) {
    pv.src = img; pv.style.display = 'block';
    msg.textContent = aiIsDemo() ? 'Chưa nhập địa chỉ: đang ở chế độ demo.' : '✅ Kết nối thành công, nhận được ảnh.';
  }).catch(function(e) {
    msg.className = 'ai-msg err';
    msg.textContent = '❌ ' + (e && e.message ? e.message : 'Lỗi kết nối') + ' (có thể do CORS nếu gọi trực tiếp từ trình duyệt)';
  }).then(function() { btn.disabled = false; btn.textContent = '🧪 Lưu và thử tạo 1 ảnh'; });
}

/* Lấy ảnh từ nhiều dạng phản hồi phổ biến */
function aiExtractImage(d) {
  if (!d) return '';
  var cand = d.image || d.image_url || d.url || d.output_url ||
    (d.data && d.data[0] && (d.data[0].url || (d.data[0].b64_json && 'data:image/png;base64,' + d.data[0].b64_json))) ||
    (d.images && d.images[0] && (d.images[0].url || d.images[0])) ||
    (d.output && (d.output.url || (Array.isArray(d.output) && d.output[0]))) ||
    (d.result && (d.result.image || d.result.url)) || '';
  if (typeof cand !== 'string') return '';
  if (/^[A-Za-z0-9+\/=]{200,}$/.test(cand)) cand = 'data:image/png;base64,' + cand;
  return /^(https:|data:image\/)/.test(cand) ? cand : '';
}

/* ---------- Provider ---------- */
function aiFetchImage(creature, gu, prompt) {
  var conn = aiGetConn();
  if (!conn.endpoint) return aiDemoImage(creature, gu);

  var body = conn.mode === 'muse'
    ? {modality: 'image', input_prompt: prompt, config: {safety_filters: true, negative_prompt: buildAiNegative(creature)}}
    : {prompt: prompt, negative: buildAiNegative(creature), element: creature.element, gu: gu.id};
  var headers = {'Content-Type': 'application/json'};
  if (conn.token) headers['Authorization'] = 'Bearer ' + conn.token;

  var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var timer = ctrl ? setTimeout(function() { ctrl.abort(); }, AI_CONFIG.timeoutMs) : null;
  return fetch(conn.endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
    signal: ctrl ? ctrl.signal : undefined
  }).then(function(r) {
    if (timer) clearTimeout(timer);
    if (r.status === 401 || r.status === 403) throw new Error('Token không hợp lệ hoặc chưa có quyền (' + r.status + ')');
    if (!r.ok) throw new Error('Máy chủ trả về ' + r.status);
    return r.json();
  }).then(function(d) {
    var img = aiExtractImage(d);
    if (!img) throw new Error('Phản hồi không có ảnh hợp lệ');
    return img;
  });
}

/* DEMO: chỉ dựng lại hình SVG hiện có trên nền lấp lánh */
function aiDemoImage(creature, gu) {
  return new Promise(function(resolve) {
    var inner = renderCreatureArt(creature, 200).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    var bg = {chibi_jp: '#ffe3f1', doll_cn: '#ffd9d9', kpop: '#efe3ff', football: '#dcf7e8', dragonball: '#fff3c9', dragon: '#e3ecff', avatar: '#d4f5f5', dc: '#e0e3ee', elf: '#e6f7d4', avengers: '#ffe9d1'}[gu.id] || '#ffe3f1';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">'
      + '<rect width="200" height="200" rx="28" fill="' + bg + '"/>'
      + '<text x="22" y="34" font-size="18">✨</text><text x="160" y="46" font-size="14">⭐</text><text x="150" y="176" font-size="18">💖</text>'
      + '<g transform="translate(14 14) scale(.86)">' + inner + '</g></svg>';
    resolve('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  });
}

/* Thu nhỏ ảnh để không làm đầy localStorage */
function aiShrink(src) {
  if (/^data:image\/svg/.test(src)) return Promise.resolve(src);
  return new Promise(function(resolve) {
    var im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = function() {
      try {
        var s = AI_CONFIG.imageSize, cv = document.createElement('canvas');
        cv.width = cv.height = s;
        cv.getContext('2d').drawImage(im, 0, 0, s, s);
        resolve(cv.toDataURL('image/jpeg', 0.82));
      } catch (e) { resolve(src); }
    };
    im.onerror = function() { resolve(src); };
    im.src = src;
  });
}
