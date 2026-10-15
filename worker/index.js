/* Cloudflare Worker: proxy tạo ảnh yêu thú bằng FLUX.1 schnell (Workers AI)
   Nhận POST {prompt, negative, element, gu} -> trả {image: "data:image/jpeg;base64,..."} */

const MODEL = '@cf/black-forest-labs/flux-1-schnell';
const MAX_PROMPT = 2000;

function cors(env, req) {
  const allow = (env.ALLOWED_ORIGIN || '*');
  const origin = req.headers.get('Origin') || '';
  const list = allow.split(',').map(function(s) { return s.trim(); });
  const ok = allow === '*' || list.indexOf(origin) >= 0;
  return {
    'Access-Control-Allow-Origin': ok ? (allow === '*' ? '*' : origin) : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({'Content-Type': 'application/json'}, headers)
  });
}

/* Đếm lượt bằng KV: mỗi khách/ngày và tổng toàn hệ thống/ngày */
async function takeQuota(env, who) {
  const day = new Date().toISOString().slice(0, 10);
  const perUser = parseInt(env.PER_USER_DAILY || '3', 10);
  const global = parseInt(env.GLOBAL_DAILY || '180', 10);
  const kU = 'u:' + day + ':' + who;
  const kG = 'g:' + day;
  const u = parseInt(await env.QUOTA.get(kU) || '0', 10);
  const g = parseInt(await env.QUOTA.get(kG) || '0', 10);
  if (u >= perUser) return {ok: false, reason: 'user'};
  if (g >= global) return {ok: false, reason: 'global'};
  await env.QUOTA.put(kU, String(u + 1), {expirationTtl: 172800});
  await env.QUOTA.put(kG, String(g + 1), {expirationTtl: 172800});
  return {ok: true, left: perUser - u - 1};
}

export default {
  async fetch(req, env) {
    const h = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, {status: 204, headers: h});
    if (req.method !== 'POST') return json({error: 'Method not allowed'}, 405, h);

    let body;
    try { body = await req.json(); } catch (e) { return json({error: 'JSON không hợp lệ'}, 400, h); }
    const prompt = String(body.prompt || '').slice(0, MAX_PROMPT);
    if (prompt.length < 10) return json({error: 'Thiếu prompt'}, 400, h);

    // Tạm định danh theo IP; thay bằng ID tài khoản sau khi có đăng nhập thật
    const who = req.headers.get('CF-Connecting-IP') || 'anon';
    const q = await takeQuota(env, who);
    if (!q.ok) {
      return json({error: q.reason === 'user' ? 'Hết lượt hôm nay, mai quay lại nhé' : 'Hệ thống đang quá tải, thử lại ngày mai'}, 429, h);
    }

    try {
      const out = await env.AI.run(MODEL, {prompt: prompt, steps: 4});
      if (!out || !out.image) throw new Error('empty');
      return json({image: 'data:image/jpeg;base64,' + out.image, left: q.left}, 200, h);
    } catch (e) {
      return json({error: 'Tạo ảnh thất bại'}, 502, h);
    }
  }
};
