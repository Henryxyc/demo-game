export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

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

  function getWeekKey(ts) {
    const d = new Date(ts);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return d.getFullYear() + "-W" + String(weekNum).padStart(2, "0");
  }

  try {
    const { theme, board, pid, period } = req.query || {};
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    if (!theme || !board) {
      return res.status(400).json({ ok: false, error: "参数不完整" });
    }

    /* 根据 period 参数构建 Redis key */
    let key = "board:" + theme + "_" + board;
    const now = Date.now();
    if (period === "daily") {
      key += ":d:" + new Date(now).toISOString().slice(0, 10);
    } else if (period === "weekly") {
      key += ":w:" + getWeekKey(now);
    } else if (period === "monthly") {
      key += ":m:" + new Date(now).toISOString().slice(0, 7);
    }

    const r = await fetch(UP_URL + "/get/" + encodeURIComponent(key), {
      headers: { Authorization: "Bearer " + UP_TOKEN }
    });
    const d = await r.json();
    const entries = parseEntries(d);
    const top = entries.slice(0, limit);
    let myRank = -1, myScore = null;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].pid === pid) { myRank = i + 1; myScore = entries[i]; break; }
    }
    return res.status(200).json({
      ok: true,
      list: top.map((e, i) => ({ rank: i + 1, name: e.name, score: e.score, ts: e.ts })),
      myRank, myScore: myScore ? myScore.score : null, total: entries.length
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "服务器内部错误" });
  }
};
