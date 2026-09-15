/* ============================================================
 * API 安全工具模块
 * - HMAC 签名校验（防止伪造请求）
 * - 分数合理性验证（防止数据篡改）
 * - Redis 频率限制（防止刷接口）
 * ============================================================ */

import crypto from "crypto";

/* ---------- HMAC 签名校验 ---------- */
const SECRET = process.env.API_SECRET || "sim-game-sec-2024-xK9m";

/**
 * FNV-1a 风格哈希（与客户端 game.js 中的 makeSign 匹配）
 * 用于请求签名校验，防止伪造提交
 */
function fnv1a(msg) {
  let h = 0x811c9dc5;
  for (let i = 0; i < msg.length; i++) {
    h ^= msg.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  /* 混入 secret */
  for (let j = 0; j < SECRET.length; j++) {
    h ^= SECRET.charCodeAt(j);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function verifySign(pid, theme, board, score, ts, sign) {
  if (!sign || !pid || !theme || !board) return false;
  const payload = pid + ":" + theme + ":" + board + ":" + score + ":" + ts;
  return sign === fnv1a(payload);
}

/* ---------- 分数合理性验证 ---------- */
const SCORE_LIMITS = {
  doomsday: { combat: 5000000, life: 500, lvl: 100 },
  douluo:   { combat: 5000000, life: 500, lvl: 100 },
  doupo:    { combat: 5000000, life: 500, lvl: 100 },
  wanmei:   { combat: 5000000, life: 500, lvl: 100 }
};

/**
 * 验证分数是否在合理范围内
 * @returns { ok: boolean, reason?: string }
 */
export function validateScore(theme, board, score) {
  const numScore = Number(score);
  if (!isFinite(numScore) || numScore < 0) return { ok: false, reason: "invalid_score" };
  const limits = SCORE_LIMITS[theme];
  if (!limits) return { ok: false, reason: "unknown_theme" };
  const maxMap = { combat: limits.combat, life: limits.life, lvl: limits.lvl };
  const max = maxMap[board];
  if (!max) return { ok: false, reason: "unknown_board" };
  if (numScore > max) return { ok: false, reason: "score_exceeds_max:" + max };
  return { ok: true };
}

/* ---------- 频率限制（基于 Redis） ---------- */
/**
 * 检查频率限制
 * @param upUrl - Upstash REST URL
 * @param upToken - Upstash REST Token
 * @param key - 限制键（如 "rate:submit:IP" 或 "rate:submit:PID"）
 * @param maxRequests - 时间窗口内最大请求数
 * @param windowSec - 时间窗口（秒）
 * @returns { allowed: boolean, remaining: number }
 */
export async function checkRateLimit(upUrl, upToken, key, maxRequests, windowSec) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = "rl:" + key + ":" + Math.floor(now / windowSec);

    /* 使用 INCR + EXPIRE 实现滑动窗口 */
    const incrUrl = upUrl + "/incr/" + encodeURIComponent(windowKey);
    const r = await fetch(incrUrl, {
      method: "POST",
      headers: { Authorization: "Bearer " + upToken }
    });
    const d = await r.json();
    const count = Number(d.result || d) || 0;

    if (count === 1) {
      /* 首次请求，设置过期时间 */
      await fetch(upUrl + "/expire/" + encodeURIComponent(windowKey) + "/" + (windowSec + 10), {
        method: "POST",
        headers: { Authorization: "Bearer " + upToken }
      });
    }

    return { allowed: count <= maxRequests, remaining: Math.max(0, maxRequests - count) };
  } catch (e) {
    /* Redis 不可用时放行（不影响正常用户） */
    return { allowed: true, remaining: maxRequests };
  }
}

/* ---------- IP 获取 ---------- */
export function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}
