export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const UP_URL = process.env.KV_REST_API_URL;
  const UP_TOKEN = process.env.KV_REST_API_TOKEN;
  if (!UP_URL || !UP_TOKEN) {
    return res.status(500).json({ ok: false, error: "Redis未配置" });
  }

  function parseEntries(raw) {
    if (!raw) return [];
    var val = raw.result !== undefined ? raw.result : raw;
    if (typeof val === "string") { try { val = JSON.parse(val); } catch(e) { return []; } }
    if (Array.isArray(val)) return val;
    return [];
  }

  /* GET: 查询反馈列表 */
  if (req.method === "GET") {
    try {
      const theme = req.query.theme || "all";
      const key = theme === "all" ? "feedback:all" : ("feedback:" + theme);
      const r = await fetch(UP_URL + "/get/" + encodeURIComponent(key), {
        headers: { Authorization: "Bearer " + UP_TOKEN }
      });
      const d = await r.json();
      let entries = parseEntries(d);
      entries.sort((a, b) => b.ts - a.ts);
      const limit = Math.min(parseInt(req.query.limit) || 100, 500);
      entries = entries.slice(0, limit);
      return res.status(200).json({ ok: true, list: entries, total: entries.length });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  /* POST: 提交反馈 */
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const { id, theme, themeName, type, text, contact, ts, pid } = req.body || {};
    if (!id || !theme || !type || !text) {
      return res.status(400).json({ ok: false, error: "参数不完整" });
    }

    const entry = {
      id: String(id),
      theme: String(theme),
      themeName: String(themeName || ""),
      type: String(type),
      text: String(text).slice(0, 500),
      contact: String(contact || "").slice(0, 50),
      ts: Number(ts) || Date.now(),
      pid: String(pid || ""),
      serverTs: Date.now(),
      status: "pending"
    };

    /* 存储到主题独立的 key 和全量 key */
    const themeKey = "feedback:" + theme;
    const allKey = "feedback:all";

    async function appendToKey(key) {
      const r = await fetch(UP_URL + "/get/" + encodeURIComponent(key), {
        headers: { Authorization: "Bearer " + UP_TOKEN }
      });
      const d = await r.json();
      let entries = parseEntries(d);
      /* 去重：同 id 不重复添加 */
      const exists = entries.findIndex(e => e.id === entry.id);
      if (exists >= 0) { entries[exists] = entry; }
      else { entries.unshift(entry); }
      /* 保留最近 500 条 */
      if (entries.length > 500) entries = entries.slice(0, 500);
      await fetch(UP_URL + "/set/" + encodeURIComponent(key), {
        method: "POST",
        headers: { Authorization: "Bearer " + UP_TOKEN, "Content-Type": "application/json" },
        body: JSON.stringify(entries)
      });
      return entries.length;
    }

    const totalTheme = await appendToKey(themeKey);
    await appendToKey(allKey);

    return res.status(200).json({ ok: true, total: totalTheme });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "服务器内部错误: " + e.message });
  }
};
