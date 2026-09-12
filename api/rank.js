import { Redis } from '@upstash/redis';
const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { theme, board, pid } = req.query || {};
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    if (!theme || !board) {
      return res.status(400).json({ ok: false, error: '参数不完整' });
    }

    const key = `board:${theme}_${board}`;
    const entries = JSON.parse(await redis.get(key) || '[]');
    const top = entries.slice(0, limit);

    // 我的排名
    let myRank = -1, myScore = null;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].pid === pid) {
        myRank = i + 1;
        myScore = entries[i];
        break;
      }
    }

    return res.status(200).json({
      ok: true,
      list: top.map((e, i) => ({ rank: i + 1, name: e.name, score: e.score, ts: e.ts })),
      myRank,
      myScore: myScore ? myScore.score : null,
      total: entries.length
    });
  } catch (e) {
    console.error('rank error:', e);
    return res.status(500).json({ ok: false, error: '服务器内部错误' });
  }
}
