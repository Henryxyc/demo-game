import { verifySign, validateScore, checkRateLimit, getClientIp } from "./_security.js";

function getWeekKey(ts) {
  const d = new Date(ts);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return d.getFullYear() + "-W" + String(weekNum).padStart(2, "0");
}

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
    if (typeof val === "string") { try { val = JSON.parse(val); } catch(e) { return []; } }
    if (Array.isArray(val)) return val;
    return [];
  }

  try {
    const { theme, board, name, score, pid, ts, sign } = req.body || {};

    /* ====== 1. 参数校验 ====== */
    if (!theme || !board || !pid || !isFinite(Number(score))) {
      return res.status(400).json({ ok: false, error: "参数不完整" });
    }

    /* ====== 2. 频率限制（每 IP 每分钟最多 30 次提交） ====== */
    const ip = getClientIp(req);
    const ipRate = await checkRateLimit(UP_URL, UP_TOKEN, "rate:submit:ip:" + ip, 30, 60);
    if (!ipRate.allowed) {
      return res.status(429).json({ ok: false, error: "请求过于频繁，请稍后再试" });
    }
    /* 每 PID 每分钟最多 10 次提交（防止脚本刷单个账号） */
    const pidRate = await checkRateLimit(UP_URL, UP_TOKEN, "rate:submit:pid:" + pid, 10, 60);
    if (!pidRate.allowed) {
      return res.status(429).json({ ok: false, error: "提交过于频繁，请稍后再试" });
    }

    /* ====== 3. HMAC 签名校验 ====== */
    if (sign && ts) {
      if (!verifySign(pid, theme, board, score, ts, sign)) {
        return res.status(403).json({ ok: false, error: "签名校验失败" });
      }
      /* 签名时间戳校验：请求必须在 5 分钟内 */
      const age = Math.abs(Date.now() - Number(ts));
      if (age > 5 * 60 * 1000) {
        return res.status(403).json({ ok: false, error: "请求已过期" });
      }
    }

    /* ====== 4. 分数合理性验证 ====== */
    const scoreCheck = validateScore(theme, board, score);
    if (!scoreCheck.ok) {
      return res.status(400).json({ ok: false, error: "分数异常: " + scoreCheck.reason });
    }

    /* ====== 5. 主题/板块白名单 ====== */
    const validThemes = ["doomsday", "douluo", "doupo", "wanmei"];
    const validBoards = ["combat", "life", "lvl"];
    if (!validThemes.includes(theme) || !validBoards.includes(board)) {
      return res.status(400).json({ ok: false, error: "无效的主题或板块" });
    }

    /* ====== 6. 输入清洗 ====== */
    const key = "board:" + theme + "_" + board;
    const trimmedName = String(name || "匿名").trim().slice(0, 12).replace(/[<>&"']/g, "") || "匿名";
    const numScore = Math.floor(Number(score));
    const safePid = String(pid).slice(0, 50);

    /* ====== 7. 读取 & 更新排行榜（总榜 + 日榜 + 周榜 + 月榜） ====== */
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const weekKey = getWeekKey(now);
    const monthKey = new Date(now).toISOString().slice(0, 7);
    const periods = [
      { key: "board:" + theme + "_" + board, ttl: 0 },
      { key: "board:" + theme + "_" + board + ":d:" + today, ttl: 2 * 86400 },
      { key: "board:" + theme + "_" + board + ":w:" + weekKey, ttl: 2 * 7 * 86400 },
      { key: "board:" + theme + "_" + board + ":m:" + monthKey, ttl: 60 * 86400 }
    ];

    let mainRank = -1;
    for (const p of periods) {
      const r2 = await fetch(UP_URL + "/get/" + encodeURIComponent(p.key), {
        headers: { Authorization: "Bearer " + UP_TOKEN }
      });
      const d2 = await r2.json();
      let entries = parseEntries(d2);
      const existing = entries.findIndex(e => e.pid === safePid);
      const entry = { pid: safePid, name: trimmedName, score: numScore, ts: now };
      if (existing >= 0) {
        if (numScore > entries[existing].score) entries[existing] = entry;
      } else { entries.push(entry); }
      entries.sort((a, b) => b.score - a.score || a.ts - b.ts);
      if (entries.length > 200) entries = entries.slice(0, 200);
      await fetch(UP_URL + "/set/" + encodeURIComponent(p.key), {
        method: "POST",
        headers: { Authorization: "Bearer " + UP_TOKEN, "Content-Type": "application/json" },
        body: JSON.stringify(entries)
      });
      if (p.ttl === 0) {
        for (let i = 0; i < entries.length; i++) {
          if (entries[i].pid === safePid) { mainRank = i + 1; break; }
        }
      }
    }

    return res.status(200).json({ ok: true, rank: mainRank, total: periods[0] ? 0 : 0 });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "服务器内部错误" });
  }
};
