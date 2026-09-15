import { verifySign, validateScore, checkRateLimit, getClientIp } from "./_security.js";

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

    /* ====== 7. 读取 & 更新排行榜 ====== */
    const r = await fetch(UP_URL + "/get/" + encodeURIComponent(key), {
      headers: { Authorization: "Bearer " + UP_TOKEN }
    });
    const d = await r.json();
    let entries = parseEntries(d);

    const existing = entries.findIndex(e => e.pid === safePid);
    const entry = { pid: safePid, name: trimmedName, score: numScore, ts: Date.now() };
    if (existing >= 0) {
      if (numScore > entries[existing].score) entries[existing] = entry;
    } else { entries.push(entry); }

    entries.sort((a, b) => b.score - a.score || a.ts - b.ts);
    if (entries.length > 200) entries = entries.slice(0, 200);

    let rank = -1;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].pid === safePid) { rank = i + 1; break; }
    }

    await fetch(UP_URL + "/set/" + encodeURIComponent(key), {
      method: "POST",
      headers: { Authorization: "Bearer " + UP_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify(entries)
    });

    return res.status(200).json({ ok: true, rank, total: entries.length });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "服务器内部错误" });
  }
};
