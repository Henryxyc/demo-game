export default async function handler(req, res) {
  const UP_URL = process.env.KV_REST_API_URL;
  const UP_TOKEN = process.env.KV_REST_API_TOKEN;
  if (!UP_URL || !UP_TOKEN) {
    return res.status(200).json({ ok: false, error: "Redis未配置" });
  }
  try {
    const key = req.query.key || "board:doupo_combat";
    const r = await fetch(UP_URL + "/get/" + encodeURIComponent(key), {
      headers: { Authorization: "Bearer " + UP_TOKEN }
    });
    const d = await r.json();
    return res.status(200).json({ ok: true, raw: d, type: typeof d.result, isArray: Array.isArray(d.result) });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
};