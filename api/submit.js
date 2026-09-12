import { kv } from '@vercel/kv';

const MAX_PER_BOARD = 200;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { theme, board, name, score, pid } = req.body || {};

    if (!theme || !board || !pid || !isFinite(Number(score))) {
      return res.status(400).json({ ok: false, error: '参数不完整' });
    }

    const key = `board:${theme}_${board}`;
    const trimmedName = String(name || '匿名').trim().slice(0, 12) || '匿名';
    const numScore = Number(score);

    // 获取现有排行榜
    let entries = await kv.get(key) || [];

    // 查找该玩家是否已有记录
    const existing = entries.findIndex(e => e.pid === pid);

    const entry = {
      pid,
      name: trimmedName,
      score: numScore,
      ts: Date.now()
    };

    if (existing >= 0) {
      if (numScore > entries[existing].score) {
        entries[existing] = entry;
      }
    } else {
      entries.push(entry);
    }

    // 排序并截断
    entries.sort((a, b) => b.score - a.score || a.ts - b.ts);
    if (entries.length > MAX_PER_BOARD) {
      entries = entries.slice(0, MAX_PER_BOARD);
    }

    // 找排名
    let rank = -1;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].pid === pid) { rank = i + 1; break; }
    }

    await kv.set(key, entries);

    return res.status(200).json({ ok: true, rank, total: entries.length });
  } catch (e) {
    console.error('submit error:', e);
    return res.status(500).json({ ok: false, error: '服务器内部错误' });
  }
}
