export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const UP_URL = process.env.KV_REST_API_URL;
  const UP_TOKEN = process.env.KV_REST_API_TOKEN;
  if (!UP_URL || !UP_TOKEN) {
    return res.status(500).json({ ok: false, error: "Redis未配置" });
  }

  function parseEntries(raw) {
    if (!raw) return [];
    var val = raw.result !== undefined ? raw.result : raw;
    if (typeof val === "string") {
      try { val = JSON.parse(val); } catch(e) { return []; }
    }
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try { val = JSON.parse(val); } catch(e) { return []; }
    }
    if (Array.isArray(val)) return val;
    return [];
  }

  const MAX_PER_BOARD = 200;

  try {
    const { theme, board, name, score, pid } = req.body || {};
    if (!theme || !board || !pid || !isFinite(Number(score))) {
      return res.status(400).json({ ok: false, error: "参数不完整" });
    }
    const key = "board:" + theme + "_" + board;
    const trimmedName = String(name || "匿名").trim().slice(0, 12) || "匿名";
    const numScore = Number(score);

    const r = await fetch(UP_URL + "/get/" + encodeURIComponent(key), {
      headers: { Authorization: "Bearer " + UP_TOKEN }
    });
    const d = await r.json();
    let entries = parseEntries(d);

    const existing = entries.findIndex(e => e.pid === pid);
    const entry = { pid, name: trimmedName, score: numScore, ts: Date.now() };
    if (existing >= 0) {
      if (numScore > entries[existing].score) entries[existing] = entry;
    } else { entries.push(entry); }

    entries.sort((a, b) => b.score - a.score || a.ts - b.ts);
    if (entries.length > MAX_PER_BOARD) entries = entries.slice(0, MAX_PER_BOARD);

    let rank = -1;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].pid === pid) { rank = i + 1; break; }
    }

    await fetch(UP_URL + "/set/" + encodeURIComponent(key), {
      method: "POST",
      headers: { Authorization: "Bearer " + UP_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify(entries)
    });

    return res.status(200).json({ ok: true, rank, total: entries.length });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "服务器内部错误: " + e.message });
  }
};