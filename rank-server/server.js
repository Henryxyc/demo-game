/* ============================================================
 * 模拟器合集 · 全服排行榜服务
 * 
 * 启动: cd rank-server && npm install && npm start
 * 端口: 3456（可通过 PORT 环境变量修改）
 * 数据: 内存 + rank-data.json 持久化
 * ============================================================ */
var express = require('express');
var cors = require('cors');
var fs = require('fs');
var path = require('path');

var app = express();
var PORT = process.env.PORT || 3456;
var DATA_FILE = path.join(__dirname, 'rank-data.json');
var MAX_PER_BOARD = 200;  // 每个榜单最多保存条数

app.use(cors());
app.use(express.json({ limit: '16kb' }));

/* ---------- 数据存储 ---------- */
var boards = {};  // { "doupo_combat": [...], "doupo_life": [...], ... }

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      boards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('加载数据失败:', e.message);
    boards = {};
  }
}

function save() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(boards, null, 2), 'utf8');
  } catch (e) {
    console.error('保存数据失败:', e.message);
  }
}

load();

/* ---------- API ---------- */

// 提交成绩
app.post('/api/submit', function (req, res) {
  var body = req.body || {};
  var theme = String(body.theme || '').trim();
  var board = String(body.board || '').trim();
  var name = String(body.name || '匿名').trim().slice(0, 12) || '匿名';
  var score = Number(body.score);
  var pid = String(body.pid || '').trim();

  if (!theme || !board || !pid || !isFinite(score)) {
    return res.status(400).json({ ok: false, error: '参数不完整' });
  }

  var key = theme + '_' + board;
  if (!boards[key]) boards[key] = [];

  // 查找该玩家已有记录，保留最高分
  var existing = -1;
  for (var i = 0; i < boards[key].length; i++) {
    if (boards[key][i].pid === pid) {
      existing = i;
      break;
    }
  }

  var entry = {
    pid: pid,
    name: name,
    score: score,
    ts: Date.now()
  };

  if (existing >= 0) {
    if (score > boards[key][existing].score) {
      boards[key][existing] = entry;
    }
  } else {
    boards[key].push(entry);
  }

  // 排序并截断
  boards[key].sort(function (a, b) { return b.score - a.score || a.ts - b.ts; });
  if (boards[key].length > MAX_PER_BOARD) {
    boards[key] = boards[key].slice(0, MAX_PER_BOARD);
  }

  // 找排名
  var rank = -1;
  for (var j = 0; j < boards[key].length; j++) {
    if (boards[key][j].pid === pid) { rank = j + 1; break; }
  }

  save();
  res.json({ ok: true, rank: rank, total: boards[key].length });
});

// 获取排行榜
app.get('/api/rank', function (req, res) {
  var theme = String(req.query.theme || '').trim();
  var board = String(req.query.board || '').trim();
  var limit = Math.min(parseInt(req.query.limit) || 50, 100);
  var pid = String(req.query.pid || '').trim();

  if (!theme || !board) {
    return res.status(400).json({ ok: false, error: '参数不完整' });
  }

  var key = theme + '_' + board;
  var list = boards[key] || [];
  var top = list.slice(0, limit);

  // 我的排名
  var myRank = -1, myScore = null;
  for (var i = 0; i < list.length; i++) {
    if (list[i].pid === pid) {
      myRank = i + 1;
      myScore = list[i];
      break;
    }
  }

  res.json({
    ok: true,
    list: top.map(function (e, i) {
      return { rank: i + 1, name: e.name, score: e.score, ts: e.ts };
    }),
    myRank: myRank,
    myScore: myScore ? myScore.score : null,
    total: list.length
  });
});

// 健康检查
app.get('/api/health', function (req, res) {
  res.json({ ok: true, total: Object.keys(boards).length + ' boards' });
});

/* ---------- 启动 ---------- */
app.listen(PORT, function () {
  console.log('🏆 排行榜服务已启动: http://localhost:' + PORT);
  console.log('   API: POST /api/submit | GET /api/rank?theme=xx&board=xx');
});
