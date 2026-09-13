/* ============================================================
 * 模拟器合集 · UI 逻辑（手机优先，兼容电脑）
 * 多主题架构：ThemeRegistry 管理主题，engine = Sim.createEngine(theme) 绑定当前主题。
 *   - 主题切换时重新加载该主题的存档（玩家等级/排行榜/成就/保底/高光，按 theme.id 前缀隔离）
 *   - 音效/速度/手动模式为全局设置，跨主题共享
 *   - doomsday 主题键前缀特例保持 'dm_'，向后兼容老存档
 * ============================================================ */
(function () {
  /* ---------- 工具 ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) {
    n = Math.floor(n);
    if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + '亿';
    if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + '万';
    return String(n);
  }
  function pad2(x) { return (x < 10 ? '0' : '') + x; }
  function fmtTime(ts) {
    var d = new Date(ts), now = new Date();
    var hm = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    if (d.toDateString() === now.toDateString()) return '今天 ' + hm;
    if (d.getFullYear() === now.getFullYear()) return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + hm;
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + hm;
  }

  /* ---------- 主题 / 引擎（多主题核心） ---------- */
  var theme = ThemeRegistry.getCurrent();
  var engine = Sim.createEngine(theme);
  /* localStorage 键前缀：doomsday 保留 'dm_' 兼容老存档；其他主题用 theme.id+'_' */
  function key(n) { return theme.id === 'doomsday' ? 'dm_' + n : theme.id + '_' + n; }

  /* ---------- 音效（全局，跨主题共享） ---------- */
  var SOUND = true;
  var GKEY_SOUND = 'sim_sound';   /* 全局键，不带主题前缀 */
  var GKEY_SPEED = 'sim_speed';
  var GKEY_MANUAL = 'sim_manual';
  var audioCtx = null;
  function ensureAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) {}
  }
  function blip(freq, dur, type, vol) {
    if (!SOUND) return;
    try {
      ensureAudio();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.1, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }
  function loadSound() { try { SOUND = localStorage.getItem(GKEY_SOUND) !== '0'; } catch (e) {} }
  function saveSound() { try { localStorage.setItem(GKEY_SOUND, SOUND ? '1' : '0'); } catch (e) {} }
  function syncSoundUI() { var hs = $('home-sound'); if (hs) hs.checked = SOUND; }

  /* ---------- 手动模式（全局） ---------- */
  var MANUAL = false;
  function loadManual() { try { MANUAL = localStorage.getItem(GKEY_MANUAL) === '1'; } catch (e) { MANUAL = false; } }
  function saveManual() { try { localStorage.setItem(GKEY_MANUAL, MANUAL ? '1' : '0'); } catch (e) {} }
  function syncManualUI() {
    var m = $('home-manual'); if (m) m.checked = MANUAL;
    var mt = $('manual-tip'); if (mt) mt.hidden = !MANUAL;
  }

  /* ---------- 玩家身份 & 全服排行榜 API ---------- */
  var RANK_API = (location.port === '8765' || location.port === '8000')
    ? 'http://localhost:3456' : '';
  function getPid() {
    var pid = localStorage.getItem('sim_pid');
    if (!pid) { pid = 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem('sim_pid', pid); }
    return pid;
  }
  function getPlayerName() {
    try { return localStorage.getItem('sim_player_name') || ''; } catch (e) { return ''; }
  }
  function setPlayerName(n) {
    try { localStorage.setItem('sim_player_name', String(n || '').trim().slice(0, 12)); } catch (e) {}
  }
  function apiSubmit(theme, board, name, score, cb) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', RANK_API + '/api/submit', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.timeout = 5000;
      xhr.onload = function () { try { cb(null, JSON.parse(xhr.responseText)); } catch (e) { cb(e); } };
      xhr.onerror = xhr.ontimeout = function () { cb(new Error('network')); };
      xhr.send(JSON.stringify({ theme: theme, board: board, name: name, score: score, pid: getPid() }));
    } catch (e) { cb(e); }
  }
  function apiRank(theme, board, limit, cb) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', RANK_API + '/api/rank?theme=' + encodeURIComponent(theme) + '&board=' + encodeURIComponent(board) + '&limit=' + (limit || 50) + '&pid=' + encodeURIComponent(getPid()), true);
      xhr.timeout = 5000;
      xhr.onload = function () { try { cb(null, JSON.parse(xhr.responseText)); } catch (e) { cb(e); } };
      xhr.onerror = xhr.ontimeout = function () { cb(new Error('network')); };
      xhr.send();
    } catch (e) { cb(e); }
  }

  /* ---------- 本机统计（按主题隔离） ---------- */
  function loadPlays() { try { return parseInt(localStorage.getItem(key('plays')) || '0', 10) || 0; } catch (e) { return 0; } }
  function addPlay() {
    var n = loadPlays() + 1;
    try { localStorage.setItem(key('plays'), n); } catch (e) {}
    renderHomeCount();
    return n;
  }
  function renderHomeCount() { var el = $('home-count'); if (el) el.textContent = loadPlays(); }
  function loadAscendTotal() { try { return parseInt(localStorage.getItem(key('ascend_total')) || '0', 10) || 0; } catch (e) { return 0; } }
  function saveAscendTotal(n) { try { localStorage.setItem(key('ascend_total'), n); } catch (e) {} }

  /* ---------- 玩家等级（按主题隔离） ---------- */
  var player = { lv: 0, exp: 0 };
  function loadPlayer() {
    try {
      var o = JSON.parse(localStorage.getItem(key('player')) || '{"lv":0,"exp":0}');
      player = (o && typeof o.lv === 'number') ? o : { lv: 0, exp: 0 };
    } catch (e) { player = { lv: 0, exp: 0 }; }
  }
  function savePlayer() { try { localStorage.setItem(key('player'), JSON.stringify(player)); } catch (e) {} }
  function needExp() { return theme.PLAYER_LV_BASE * (player.lv + 1); }
  function addExp(amount) {
    player.exp += amount;
    var need = needExp();
    while (player.exp >= need) { player.exp -= need; player.lv++; need = needExp(); }
    savePlayer();
    renderPlayerUI();
  }
  function renderPlayerUI() {
    if (!$('home-lv')) return;
    var need = needExp();
    $('home-lv').textContent = '[Lv.' + player.lv + ']';
    var gtag = theme.guardInfo(player.lv).min;
    var guardTag = gtag >= 3 ? '[保底' + theme.terms.essenceShort + ' ' + theme.tierName(3) + ' 起（≥75级）]' : (gtag >= 2 ? '[保底天赋 ' + theme.tierName(2) + ' 起（≥25级）]' : '[无保底]');
    $('home-lv-bonus').textContent = '[抽到高阶' + theme.terms.ability + '概率+' + (player.lv * 0.1).toFixed(1) + '%] ' + guardTag;
    $('home-lv-exp').textContent = player.exp + '/' + need;
    $('home-lv-fill').style.width = Math.min(100, (player.exp / need) * 100) + '%';
    renderGuardUI();
  }

  /* ---------- 本地排行榜（按主题隔离） ---------- */
  var LOCAL_BOARDS = {
    combat: { kn: 'local_combat', name: theme.terms.combat },
    age:    { kn: 'local_life',   name: theme.terms.lifespan },
    lvl:    { kn: 'local_lvl',    name: theme.terms.level }
  };
  function loadLocalList(kn) {
    try { var a = JSON.parse(localStorage.getItem(key(kn)) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function saveLocalList(kn, list) { try { localStorage.setItem(key(kn), JSON.stringify(list.slice(0, 100))); } catch (e) {} }
  function insertLocal(kn, score) {
    var list = loadLocalList(kn);
    var ts = Date.now();
    list.push({ score: score, ts: ts });
    list.sort(function (a, b) { return b.score - a.score || a.ts - b.ts; });
    if (list.length > 100) list = list.slice(0, 100);
    saveLocalList(kn, list);
    var rank = list.length + 1;
    for (var i = 0; i < list.length; i++) { if (list[i].score === score && list[i].ts === ts) { rank = i + 1; break; } }
    return { rank: rank, total: list.length };
  }
  function localBest(kn) {
    var list = loadLocalList(kn), best = -1, i;
    for (i = 0; i < list.length; i++) if (list[i].score > best) best = list[i].score;
    return best;
  }

  /* ============ 高光时刻（按主题隔离） ============ */
  var HL_KEYS = { near: 'hlv3_near', top: 'hlv3_top', god: 'hlv3_god' };
  var hlTab = 'near';
  var hlCurrent = null;
  function hlLoad(kn) {
    try { var a = JSON.parse(localStorage.getItem(key(kn)) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function hlSave(kn, list) { try { localStorage.setItem(key(kn), JSON.stringify(list)); } catch (e) {} }
  function hlAddNear(list, rec, n) { return [rec].concat(list || []).slice(0, n || 5); }
  function hlAddTop(list, rec, n) {
    var l = (list || []).concat(rec);
    l.sort(function (a, b) { return b.combat - a.combat || a.ts - b.ts; });
    return l.slice(0, n || 5);
  }
  function hlAddGod(list, rec, n) {
    var l = (list || []).concat(rec);
    l.sort(function (a, b) { return b.combat - a.combat || (b.ts - a.ts) || ((b.guid || '') < (a.guid || '') ? 1 : -1); });
    return l.slice(0, n || 20);
  }
  function hlHighlights(log) {
    var out = [], i;
    for (i = 0; i < log.length; i++) if (log[i].cls !== 'year') out.push(log[i]);
    return out;
  }
  function hlEndText(rec) {
    if (rec.ascended) return hlAscendKind(rec);
    if (rec.ascendMode === 'fail') return theme.terms.settleFailTitle.replace(/^[^\u4e00-\u9fa5]+/, '').trim() || '进化失败';
    return '寿终';
  }
  /* 核心数据文本：导出/分享只含核心字段（含主题专属字段如 fires） */
  function hlCoreText(rec) {
    if (!rec) return '';
    var lines = [theme.terms.exportTitle];
    lines.push(theme.terms.ability + '：' + (rec.ability || '') + ' · ' + theme.terms.abilityTalent + '：' + (rec.innate != null ? theme.tierName(rec.innate) : ''));
    lines.push('结局：' + (rec.end || hlEndText(rec)));
    lines.push('最终' + theme.terms.level + '：' + (rec.lvl != null ? rec.lvl : '') + '级');
    lines.push(theme.terms.combat + '：' + fmt(rec.combat != null ? rec.combat : 0));
    lines.push((rec.ascended ? theme.terms.settleAgeLabelAscend : theme.terms.settleAgeLabelDead) + '：' + rec.age + theme.terms.ageUnit);
    var skill = (rec.skill && rec.skill.length) ? rec.skill : null;
    if (skill) {
      var hs = [];
      for (var hi = 0; hi < skill.length; hi++) { var it = SKILL_DISP[skill[hi]]; hs.push(it ? it.d : skill[hi]); }
      lines.push(theme.terms.skill + '：' + hs.join('·'));
    }
    if (rec.essenceName) lines.push(theme.terms.essence + '：' + rec.essenceName);
    /* 斗罗：导出魂环+魂骨信息 */
    if (rec.soulRings && rec.soulRings.length) {
      var ringStrs = [];
      for (var sri = 0; sri < rec.soulRings.length; sri++) {
        var sr = rec.soulRings[sri];
        ringStrs.push(sr.name + '（' + sr.year + '，' + sr.skill + '）');
      }
      lines.push('魂环：' + ringStrs.join(' · '));
    }
    if (rec.soulBones && rec.soulBones.length) {
      var boneStrs = [];
      for (var sbi2 = 0; sbi2 < rec.soulBones.length; sbi2++) {
        var sbb2 = rec.soulBones[sbi2];
        boneStrs.push(sbb2.beast + sbb2.part + '（' + sbb2.skill + '）');
      }
      lines.push('魂骨：' + boneStrs.join(' · '));
    }
    /* 天赐词条 */
    if (rec.talents && rec.talents.length) lines.push('天赐词条：' + rec.talents.map(function(t){return typeof t==='string'?t:t.name}).join('·'));
    /* 主题专属字段：斗破异火列表 */
    if (rec.fires && rec.fires.length) {
      var fnames = [];
      for (var fi = 0; fi < rec.fires.length; fi++) {
        var f = rec.fires[fi];
        var rnk = f.rank != null ? f.rank : '?';
        fnames.push((f.name || f) + '（' + rnk + '）');
      }
      lines.push('已收服异火（排行）：' + fnames.join(' · '));
    }
    /* 斗破炼药师 */
    if (rec.alchemist && theme.terms.alchemistGrades && rec.alchemist < theme.terms.alchemistGrades.length) {
      lines.push('炼药师：' + theme.terms.alchemistGrades[rec.alchemist]);
      if (rec.soulRealm && theme.terms.soulRealms) lines.push('灵魂力：' + theme.terms.soulRealms[rec.soulRealm]);
    }
    /* 多路径成帝/成神/成仙：帝名/神位名/仙帝名 */
    if (rec.emperorName) lines.push('帝名：' + rec.emperorName);
    if (rec.godName) lines.push('神位：' + rec.godName);
    if (rec.immortalName) lines.push('仙帝名：' + rec.immortalName);
    return lines.join('\n');
  }
  function hlClipText(rec) {
    var lines = [theme.terms.reviewTitle], log = hlHighlights(rec && rec.log), i;
    for (i = 0; i < log.length; i++) lines.push(log[i].text);
    return lines.join('\n');
  }
  function hlCoreOf(rec) {
    var c = {}, k;
    var keys = ['guid', 'ts', 'ability', 'innate', 'lvl', 'title', 'combat', 'age', 'lifespan', 'ascended', 'ascendMode', 'skill', 'soulRings', 'soulBones', 'essenceName', 'end', 'fires', 'talents', 'alchemist', 'soulRealm', 'emperorName', 'godName', 'immortalName'];
    for (k = 0; k < keys.length; k++) if (rec[keys[k]] !== undefined) c[keys[k]] = rec[keys[k]];
    return c;
  }
  function hlAscendKind(rec) {
    var m = rec && rec.ascendMode;
    if (m === 'refine') return '炼化晋升';
    if (m === 'forced') return '强行' + theme.terms.ascend;
    if (m === 'origin') return theme.terms.origin;
    return theme.terms.ascend;
  }
  function hlResultLabel(rec) {
    if (rec.ascended) return hlAscendKind(rec);
    if (rec.ascendMode === 'fail') return theme.terms.settleFailTitle.replace(/^[^\u4e00-\u9fa5]+/, '').trim() || (theme.terms.ascend + '失败');
    return '寿终';
  }
  function hlBadgeCls(rec) {
    if (rec.ascended) return 'asc-' + (rec.ascendMode && rec.ascendMode !== 'god' ? rec.ascendMode : 'god');
    if (rec.ascendMode === 'fail') return 'fail';
    return 'dead';
  }

  function recordHighlight(reason) {
    if (reason !== 'dead' && reason !== 'god') return;
    var log = [];
    try { log = JSON.parse(JSON.stringify(fullLog)); } catch (e) {}
    var rec = {
      guid: Date.now() + '_' + Math.floor(Math.random() * 1e6),
      ts: Date.now(), ability: G.ability, innate: G.innate,
      lvl: G.lvl, title: theme.titleOf(G.lvl), combat: G.combat,
      age: G.age, lifespan: G.lifespan, ascended: G.ascended,
      ascendMode: G.ascended ? (G.ascendMode === 'refine' || G.ascendMode === 'forced' || G.ascendMode === 'origin' ? G.ascendMode : 'god') : (G.ascendMode === 'fail' ? 'fail' : 'dead'),
      end: G.ascended ? (G.ascendMode === 'refine' ? '炼化晋升' : G.ascendMode === 'forced' ? ('强行' + theme.terms.ascend) : G.ascendMode === 'origin' ? theme.terms.origin : theme.terms.ascend) : (G.ascendMode === 'fail' ? (theme.terms.ascend + '失败') : '寿终'),
      skill: (G.skillSeq || []).slice(),
      soulRings: G.soulRings ? G.soulRings.slice() : undefined,
      soulBones: G.soulBones ? G.soulBones.slice() : undefined,
      essenceName: G.essence && G.essence.length ? G.essence[0].name : null,
      fires: G.fires ? G.fires.slice() : undefined,
      talents: G.talents ? G.talents.slice() : undefined,
      alchemist: G.alchemist || undefined,
      soulRealm: G.soulRealm || undefined,
      emperorName: G.emperorName || undefined,
      godName: G.godName || undefined,
      immortalName: G.immortalName || undefined,
      ascendMode: G.ascendMode || undefined,
      log: log
    };
    hlSave(HL_KEYS.near, hlAddNear(hlLoad(HL_KEYS.near), rec));
    hlSave(HL_KEYS.top, hlAddTop(hlLoad(HL_KEYS.top), rec));
    if (rec.ascended) hlSave(HL_KEYS.god, hlAddGod(hlLoad(HL_KEYS.god), rec));
  }

  /* ---------- 高光视图 ---------- */
  function openHL() { hlTab = 'near'; hlRenderTabs(); hlRender(); show('highlight'); }
  function hlRenderTabs() {
    var box = $('hl-tabs'); if (!box) return;
    box.innerHTML = '';
    var tabs = [['near', '近 5 局'], ['top', 'Top5 ' + theme.terms.combat], ['god', theme.terms.ascend + '局']];
    for (var i = 0; i < tabs.length; i++) {
      (function (id, label) {
        makeTab(box, hlTab === id, label, function () { hlTab = id; hlRenderTabs(); hlRender(); blip(500, 0.06, 'triangle', 0.08); });
      })(tabs[i][0], tabs[i][1]);
    }
  }
  function hlPick() {
    var kn = hlTab === 'god' ? HL_KEYS.god : (hlTab === 'top' ? HL_KEYS.top : HL_KEYS.near);
    return hlLoad(kn);
  }
  function hlRow(rec) {
    var row = document.createElement('div');
    row.className = 'hl-row';
    var top = document.createElement('div'); top.className = 'hl-top';
    var t = document.createElement('span'); t.className = 'hl-time'; t.textContent = fmtTime(rec.ts);
    var tt = document.createElement('span'); tt.className = 'hl-title';
    tt.textContent = (rec.ability || '') + ' · ' + theme.terms.abilityTalent + ' ' + theme.tierName(rec.innate);
    var b = document.createElement('span'); b.className = 'hl-badge ' + hlBadgeCls(rec); b.textContent = hlResultLabel(rec);
    top.appendChild(t); top.appendChild(tt); top.appendChild(b);
    row.appendChild(top);
    var subLine = document.createElement('div'); subLine.className = 'hl-sub-line';
    var sub = document.createElement('div'); sub.className = 'hl-sub';
    sub.innerHTML = '最后' + theme.terms.combat + ' <b>' + fmt(rec.combat) + '</b> · ' + theme.terms.level + ' ' + rec.lvl + ' 级 · ' +
      (rec.ascended ? theme.terms.settleAgeLabelAscend : theme.terms.settleAgeLabelDead) + ' ' + rec.age + ' ' + theme.terms.ageUnit;
    subLine.appendChild(sub);
    row.appendChild(subLine);
    var acts = document.createElement('div'); acts.className = 'hl-row-actions';
    var bD = document.createElement('button'); bD.type = 'button'; bD.className = 'hl-act-btn'; bD.textContent = '📋 导出详情';
    bD.addEventListener('click', function (ev) { ev.stopPropagation(); blip(520, 0.06, 'triangle', 0.08); openHLReview(rec); });
    var bC = document.createElement('button'); bC.type = 'button'; bC.className = 'hl-act-btn primary'; bC.textContent = '🖼 导出成就图';
    bC.addEventListener('click', function (ev) { ev.stopPropagation(); blip(560, 0.06, 'triangle', 0.08); hlExportCard(rec); });
    acts.appendChild(bD); acts.appendChild(bC);
    row.appendChild(acts);
    row.addEventListener('click', function () { blip(500, 0.06, 'triangle', 0.08); openHLReview(rec); });
    return row;
  }
  function hlRender() {
    var box = $('hl-list'); if (!box) return;
    box.innerHTML = '';
    var list = hlPick();
    if (!list.length) {
      var e = document.createElement('div');
      e.className = 'hl-empty';
      e.textContent = '还没有记录～\n完整走完一局（寿终或' + theme.terms.ascend + '）后，会自动收录到这里。';
      box.appendChild(e);
      return;
    }
    for (var i = 0; i < list.length; i++) box.appendChild(hlRow(list[i]));
  }

  function openHLReview(rec) {
    hlCurrent = rec;
    var box = $('hl-review-log'); box.innerHTML = '';
    var frag = document.createDocumentFragment();
    var log = rec && rec.log && rec.log.length ? rec.log : null;
    if (log) {
      for (var i = 0; i < log.length; i++) {
        var d = document.createElement('div');
        d.className = 'rv-' + (log[i].cls || 'year');
        d.textContent = log[i].text;
        frag.appendChild(d);
      }
    } else {
      var hint = document.createElement('div'); hint.className = 'rv-year'; hint.textContent = '（云端记录 · 仅核心数据，无逐行履历）';
      frag.appendChild(hint);
      var ct = hlCoreText(rec).split('\n');
      for (var j = 0; j < ct.length; j++) {
        var d2 = document.createElement('div'); d2.className = 'rv-year'; d2.textContent = ct[j];
        frag.appendChild(d2);
      }
    }
    box.appendChild(frag);
    $('hl-mask').hidden = false;
  }
  function closeHLReview() { $('hl-mask').hidden = true; }

  function hlTopChanged(before, after) {
    var seen = {}, i;
    for (i = 0; i < (before || []).length; i++) seen[(before[i] || {}).guid || ''] = 1;
    for (i = 0; i < (after || []).length; i++) if (!seen[(after[i] || {}).guid || '']) return true;
    return false;
  }
  function hlTrimKind(list, kind) {
    var l = (list || []).slice();
    if (kind === 'near') { l.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }); return l.slice(0, 5); }
    l.sort(function (a, b) { return b.combat - a.combat || ((b.ts || 0) - (a.ts || 0)); });
    return l.slice(0, kind === 'god' ? 20 : 5);
  }

  function hlToast(msg, ms) {
    var el = $('hl-toast'); if (!el) return;
    el.textContent = msg; el.hidden = false;
    clearTimeout(hlToast._t);
    hlToast._t = setTimeout(function () { el.hidden = true; }, ms || 2000);
  }
  function copyHl() {
    if (!hlCurrent) return;
    var txt = hlClipText(hlCurrent);
    function ok() { hlToast('✅ 已复制到剪贴板，去分享吧'); blip(700, 0.1, 'triangle', 0.1); }
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        var ok2 = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok2) ok(); else hlToast('❌ 复制失败（浏览器限制）');
      } catch (e) { hlToast('❌ 复制失败'); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok).catch(fallback);
    else fallback();
  }

  var hlCurDataUrl = null;
  function hlErrMsg(e) { if (!e) return '未知错误'; if (typeof e === 'string') return e; return (e.message || e.type || e.code || JSON.stringify(e)) || '未知错误'; }
  function hlDownload(dataUrl) {
    var data = dataUrl || hlCurDataUrl;
    if (!data) { hlToast('❌ 没有可保存的图片'); return; }
    try {
      var a = document.createElement('a');
      a.href = data; a.download = theme.terms.simulatorName + '-履历.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      hlToast('✅ 已开始下载');
    } catch (e) { hlToast('❌ 下载失败（' + hlErrMsg(e) + '）'); }
  }
  function hlShowImg(dataUrl) {
    var img = $('hl-img'); if (!img) return;
    hlCurDataUrl = dataUrl; img.src = dataUrl;
    $('hl-img-mask').hidden = false;
  }
  function hlCloseImg() { $('hl-img-mask').hidden = true; try { $('hl-img').src = ''; } catch (e) {} hlCurDataUrl = null; }
  function hlImgExport() {
    if (!hlCurrent) return;
    if (!hlCurrent.log || !hlCurrent.log.length) { hlToast('❌ 该记录来自云端，仅核心数据（可点「导出成就图」）', 3000); return; }
    hlToast('⏳ 正在生成履历图片…', 2500);
    hlBuildCanvas(hlCurrent, function (canvas) {
      if (!canvas) { hlToast('❌ 图片生成失败'); return; }
      var dataUrl = null;
      try { dataUrl = canvas.toDataURL('image/png'); } catch (e) { hlToast('❌ 图片生成失败（' + hlErrMsg(e) + '）'); return; }
      if (!dataUrl || dataUrl.length < 100) { hlToast('❌ 图片生成失败：画布为空'); return; }
      hlShowImg(dataUrl);
    });
  }
  function hlWrapText(ctx, s, maxW) {
    var out = [], cur = '';
    for (var i = 0; i < s.length; i++) {
      var test = cur + s[i];
      if (cur && ctx.measureText(test).width > maxW) { out.push(cur); cur = s[i]; }
      else cur = test;
    }
    if (cur) out.push(cur);
    return out;
  }
  function hlStyle(cls) {
    switch (cls) {
      case 'brk':    return { fg: '#1e6f3c', bg: 'rgba(30,111,60,.10)',  bold: true };
      case 'ev1':    return { fg: '#1f5fae', bg: 'rgba(31,95,174,.10)' };
      case 'ev2':    return { fg: '#7b3fa0', bg: 'rgba(123,63,160,.10)' };
      case 'ev3':    return { fg: '#a87c00', bg: 'rgba(168,124,0,.12)' };
      case 'ev4':    return { fg: '#c0392b', bg: 'rgba(192,57,43,.10)' };
      case 'skill':   return { fg: '#c2185b', bg: 'rgba(194,24,91,.10)' };
      case 'god':    return { fg: '#8a6d00', bg: 'rgba(138,109,0,.12)', bold: true };
      case 'dead':   return { fg: '#b71c1c', bg: 'rgba(183,28,28,.08)' };
      case 'rare':   return { fg: '#e65100', bg: 'rgba(230,81,0,.10)' };
      case 'red':    return { fg: '#b71c1c', bg: 'rgba(183,28,28,.10)', bold: true };
      case 'rainbow': return { fg: '#b8860b', bg: 'rgba(184,134,11,.10)', bold: true };
      default:       return { fg: '#44566b', bg: 'rgba(68,86,107,.06)' };
    }
  }

  function hlExportCard(rec) {
    if (!rec) return;
    hlToast('⏳ 正在生成成就图…', 2500);
    buildCoreCard(rec, function (dataUrl) {
      if (!dataUrl) { hlToast('❌ 图片生成失败'); return; }
      hlShowImg(dataUrl);
    });
  }
  function hlCardRound(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }
  function hlCardChip(name) {
    var it = SKILL_DISP[name] || { d: name, c: 'ten' };
    var col = { ten: ['#ffffff', '#333333'], bai: ['#f4c542', '#3a2c0a'], qian: ['#9b6bff', '#ffffff'],
                wan: ['#17171e', '#ffffff'], shiwan: ['#e03a3a', '#ffffff'] }[it.c] || ['#ffffff', '#333333'];
    return { bg: col[0], fg: col[1], d: it.d };
  }
  function buildCoreCard(rec, cb) {
    var W = 760, pad = 44, F = '"PingFang SC","Microsoft YaHei",sans-serif';
    var cv = document.createElement('canvas'); cv.width = W;
    var ctx = cv.getContext('2d');
    if (!ctx) { cb(null); return; }
    var chips = [], i;
    (rec.skill || []).forEach(function (h) { chips.push(hlCardChip(h)); });
    var godN = essenceShortName(rec);
    if (godN) chips.push({ bg: null, fg: '#3a2c0a', d: godN, rainbow: true });
    /* 主题专属 chips：斗破异火 */
    if (rec.fires && rec.fires.length) {
      for (var fi = 0; fi < rec.fires.length; fi++) chips.push({ bg: '#e03a3a', fg: '#ffffff', d: rec.fires[fi].name || String(rec.fires[fi]) });
    }
    /* 天赐词条 chips */
    if (rec.talents && rec.talents.length) {
      for (var ti = 0; ti < rec.talents.length; ti++) { var tn = typeof rec.talents[ti]==='string'?rec.talents[ti]:rec.talents[ti].name; chips.push({ bg: '#5a3c8a', fg: '#fbbf24', d: '✨' + tn }); }
    }
    ctx.font = 'bold 22px ' + F;
    var maxW = W - pad * 2, cw = 0, cur = [], lines = [];
    function wch(c) { return c.rainbow ? 78 : ctx.measureText(c.d).width + 36; }
    for (i = 0; i < chips.length; i++) {
      var w = wch(chips[i]);
      if (cur.length && cw + w + 14 > maxW) { lines.push(cur); cur = []; cw = 0; }
      cur.push(chips[i]); cw += w + 14;
    }
    if (cur.length) lines.push(cur);
    var rows = 6, chipArea = lines.length * 58;
    var H = pad + 190 + rows * 56 + 70 + chipArea + 150 + pad;
    cv.height = H;
    ctx = cv.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a2233'); g.addColorStop(1, '#0f1420');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = theme.accent || '#c9a13b'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.textBaseline = 'top';
    var y = pad;
    ctx.textAlign = 'center'; ctx.fillStyle = theme.accent || '#c9a13b'; ctx.font = 'bold 30px ' + F;
    ctx.fillText(theme.terms.exportCardTitle, W / 2, y); y += 48;
    ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 44px ' + F;
    ctx.fillText((rec.ability || '') + '【' + theme.terms.abilityTalent + '：' + (rec.innate != null ? theme.tierName(rec.innate) : '') + '】', W / 2, y); y += 70;
    ctx.fillStyle = rec.ascended ? '#ffd98a' : (rec.ascendMode === 'fail' ? '#ff9a9a' : '#c9cdd6');
    ctx.font = 'bold 30px ' + F;
    ctx.fillText(rec.end || hlEndText(rec), W / 2, y); y += 46;
    ctx.strokeStyle = 'rgba(201,161,59,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    y += 26;
    ctx.textAlign = 'left';
    var fields = [
      [theme.terms.ability, rec.ability || ''],
      [theme.terms.abilityTalent, (rec.innate != null ? theme.tierName(rec.innate) : '')],
      ['最终' + theme.terms.level, (rec.lvl != null ? rec.lvl : '') + ' 级'],
      [theme.terms.combat, fmt(rec.combat != null ? rec.combat : 0)],
      [rec.ascended ? theme.terms.settleAgeLabelAscend : theme.terms.settleAgeLabelDead, (rec.age != null ? rec.age : '') + ' ' + theme.terms.ageUnit],
      [theme.terms.essence, rec.essenceName ? rec.essenceName : '—']
    ];
    ctx.font = '23px ' + F;
    fields.forEach(function (f) {
      ctx.fillStyle = '#7f8ba0'; ctx.fillText(f[0], pad, y);
      ctx.fillStyle = '#e8e4d8'; ctx.textAlign = 'right'; ctx.fillText(f[1], W - pad, y); ctx.textAlign = 'left';
      y += 56;
    });
    y += 30;
    ctx.textAlign = 'center'; ctx.fillStyle = '#8b96ab'; ctx.font = '20px ' + F;
    ctx.fillText('—— ' + theme.terms.skill + ' ——', W / 2, y); y += 40;
    ctx.font = 'bold 22px ' + F;
    lines.forEach(function (ln) {
      var total = 0, j;
      for (j = 0; j < ln.length; j++) total += wch(ln[j]);
      total += (ln.length - 1) * 14;
      var x = (W - total) / 2;
      for (j = 0; j < ln.length; j++) {
        var w2 = wch(ln[j]);
        if (ln[j].rainbow) {
          var gg = ctx.createLinearGradient(x, 0, x + w2, 0);
          ['#ff4d4f', '#ff9800', '#ffeb3b', '#4caf50', '#00bcd4', '#3f51db', '#9c27b0'].forEach(function (col, idx) { gg.addColorStop(idx / 6, col); });
          ctx.fillStyle = gg;
        } else ctx.fillStyle = ln[j].bg;
        hlCardRound(ctx, x, y, w2, 44, 22); ctx.fill();
        ctx.fillStyle = ln[j].fg; ctx.textAlign = 'center';
        ctx.fillText(ln[j].d, x + w2 / 2, y + 11);
        x += w2 + 14;
      }
      y += 58;
    });
    y += 8;
    ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 24px ' + F; ctx.textAlign = 'center';
    ctx.fillText(theme.terms.exportFooter, W / 2, y);
    y += 44;
    try { cb(cv.toDataURL('image/png')); } catch (e) { cb(null); }
  }

  function hlBuildCanvas(rec, done) {
    var W = 720, pad = 26, lineH = 28, headH = 100, bottomPad = 26;
    var MAXH = 3500;
    var raw = hlHighlights(rec && rec.log), i, j;
    var cv = document.createElement('canvas');
    cv.width = W;
    var ctx = cv.getContext('2d');
    if (!ctx) { done(null); return; }
    ctx.font = '15px "PingFang SC","Microsoft YaHei",sans-serif';
    var maxTextW = W - pad * 2;
    var maxBodyPx = MAXH - headH - bottomPad;
    var maxLines = Math.floor(maxBodyPx / lineH);
    var wrapped = [];
    for (i = 0; i < raw.length; i++) {
      var cls = raw[i].cls || 'year';
      var ws = hlWrapText(ctx, raw[i].text, maxTextW);
      for (j = 0; j < ws.length; j++) wrapped.push({ t: ws[j], cls: cls });
    }
    if (wrapped.length > maxLines) {
      var tailN = Math.min(40, Math.floor(maxLines / 2));
      var headN = maxLines - tailN - 1;
      var omitted = wrapped.length - (headN + tailN);
      wrapped = wrapped.slice(0, headN)
        .concat([{ t: '……（中间省略 ' + omitted + ' 行）……', cls: 'red' }])
        .concat(wrapped.slice(wrapped.length - tailN));
    }
    var logH = wrapped.length * lineH;
    var totalH = headH + logH + bottomPad;
    cv.height = totalH;
    ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, totalH);
    ctx.textBaseline = 'top';
    var y = pad;
    ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = '#222';
    ctx.fillText(theme.terms.exportTitle, pad, y); y += 32;
    ctx.font = '14px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(theme.terms.ability + ' ' + (rec.ability || '') + ' · ' + theme.terms.abilityTalent + ' ' + theme.tierName(rec.innate) + ' · ' + fmtTime(rec.ts) + ' · 最后' + theme.terms.combat + ' ' + fmt(rec.combat) + ' · ' + hlResultLabel(rec), pad, y);
    y += 26;
    ctx.strokeStyle = '#e0e0e0'; ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    y += 16;
    for (i = 0; i < wrapped.length; i++) {
      var st = hlStyle(wrapped[i].cls);
      ctx.fillStyle = st.bg;
      ctx.fillRect(pad, y, maxTextW, lineH);
      ctx.font = (st.bold ? 'bold ' : '') + '15px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillStyle = st.fg;
      ctx.fillText(wrapped[i].t, pad, y);
      y += lineH;
    }
    done(cv);
  }

  /* ---------- 全局状态 ---------- */
  var G = null;
  var timer = null;
  var TICK_MS = 200;
  var FAST_MS = 60;
  var settleReason = '';
  var fullLog = [];
  var pendingLogs = [];

  /* ---------- 等级/阶别颜色映射 ---------- */
  var TIER_COLORS = {
    /* 斗破斗技阶 */
    '黄': '#f5c542', '玄': '#a855f7', '地': '#3b82f6', '天': '#ef4444', '帝': '#fbbf24',
    /* 斗罗魂环色 */
    '白': '#e0e0e0', '紫': '#a855f7', '黑': '#62a8e6', '红': '#ef4444',
    /* 末日异能档 */
    'F': '#9ca3af', 'E': '#6b7280', 'D': '#3b82f6', 'C': '#22c55e', 'B': '#a855f7',
    'A': '#f59e0b', 'S': '#ef4444', 'SS': '#ec4899', 'SSS': '#f97316', 'EX': '#fbbf24',
    /* 完美世界骨文品阶 */
    '凡': '#9ca3af', '灵': '#3b82f6', '真': '#a855f7', '神': '#f59e0b', '仙': '#ef4444'
  };
  /* 异火排行颜色（排行越低越强，颜色越红） */
  function fireRankColor(rank) {
    if (rank <= 3) return '#ef4444';
    if (rank <= 8) return '#f59e0b';
    if (rank <= 15) return '#a855f7';
    return '#6b7280';
  }
  /* 斗技名称+阶别着色 HTML */
  function skillTierHtml(name, tier) {
    var color = TIER_COLORS[tier] || '#e8e4d8';
    return '<span style="color:' + color + '">' + esc(name) + '（' + tier + '）</span>';
  }
  /* 异火名称+排行着色 HTML */
  function fireHtml(name, rank) {
    var color = fireRankColor(rank);
    return '<span style="color:' + color + '">' + esc(name) + '（' + rank + '）</span>';
  }
  /* 魂环名称+颜色着色 HTML */
  function soulRingHtml(ring) {
    var color = (theme.RING_COLORS && theme.RING_COLORS[ring.tier]) || '#e8e4d8';
    return '<span style="color:' + color + '">' + esc(ring.name) + '（' + ring.year + '，' + ring.skill + '）</span>';
  }

  /* ---------- 视图切换 ---------- */
  function show(v) {
    var views = document.querySelectorAll('.view'), i;
    for (i = 0; i < views.length; i++) views[i].hidden = views[i].id !== 'view-' + v;
    if (v === 'home') { renderHomeCount(); }
    if (v === 'grid') { renderGrid(); }
  }
  function openSettings(from) { settingsReturn = from; $('pause-mask').hidden = true; show('settings'); }
  function closeSettings() {
    if (settingsReturn === 'pause') { show('game'); $('pause-mask').hidden = false; }
    else show('home');
  }
  function hideMask() { $('pause-mask').hidden = true; }

  /* ---------- 合集首页（主题网格） ---------- */
  function renderGrid() {
    var box = $('grid-cards'); if (!box) return;
    box.innerHTML = '';
    var list = ThemeRegistry.listThemes();
    var sub = $('grid-sub');
    if (sub) sub.textContent = '共 ' + list.length + ' 款 · 文字放置 · 修仙养成';
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      var card = document.createElement('button');
      card.className = 'grid-card';
      card.style.setProperty('--card-accent', t.accent || '#d4af37');
      card.innerHTML =
        '<div class="grid-card-icon">' + esc(t.icon || '★') + '</div>' +
        '<div class="grid-card-name">' + esc(t.name) + '</div>' +
        '<div class="grid-card-sub">' + esc(t.subtitle || '') + '</div>' +
        (t.tags && t.tags.length ? '<div class="grid-card-tags">' + t.tags.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' : '');
      (function (id) {
        card.addEventListener('click', function () { blip(660, 0.08, 'triangle', 0.1); enterTheme(id); });
      })(t.id);
      box.appendChild(card);
    }
  }
  /* 进入某主题：切换 theme/engine，重载该主题存档，进入主题开始页 */
  function enterTheme(id) {
    if (!ThemeRegistry.has(id)) return;
    if (theme.id !== id) switchTheme(id);
    /* 重置当前对局 */
    stopPlay(); G = null; pendingLogs = []; fullLog = [];
    /* 刷新主题开始页文案 */
    renderThemeHome();
    show('home');
  }
  /* 切换主题：更新 theme/engine，重载该主题独立的存档（玩家等级/排行榜/成就/保底/高光） */
  function switchTheme(id) {
    var t = ThemeRegistry.setCurrent(id);
    if (!t) return;
    theme = t;
    engine = Sim.createEngine(theme);
    /* 重置 UI 文案相关 */
    document.title = theme.terms.simulatorName;
    /* 重载该主题存档（键前缀随 theme.id 变） */
    loadPlayer(); loadGuard(); loadAchLocal();
    /* 重新应用成就加成到新 engine（多实例各自独立） */
    engine.setAchBonus(achBonus());
    /* 排行榜榜名随主题术语变 */
    LOCAL_BOARDS.combat.name = theme.terms.combat;
    LOCAL_BOARDS.age.name = theme.terms.lifespan;
    LOCAL_BOARDS.lvl.name = theme.terms.level;
  }
  /* 渲染主题开始页文案（标题/副标题/说明） */
  function renderThemeHome() {
    var ht = $('home-title'); if (ht) ht.textContent = theme.name;
    var hs = $('home-sub'); if (hs) hs.textContent = theme.terms.homeSub;
    var gt = $('game-title'); if (gt) gt.textContent = theme.terms.simulatorName;
    var about = $('about-text'); if (about) about.innerHTML = theme.terms.aboutText;
    var nm = $('btn-guard-mask-title') || $('guard-mask-title');
    /* 说明页/保底弹窗标题在 HTML 内静态，由 show 时同步 */
    refreshHome();
  }

  /* ---------- 首页自适应 ---------- */
  function fitHomeBtns() {
    var confs = [['btn-rank', 8], ['btn-ach', 12], ['btn-guard', 8]];
    if (!document.body || typeof window.getComputedStyle !== 'function') return;
    var tmp = document.createElement('span');
    tmp.style.cssText = 'position:fixed;left:-9999px;top:0;white-space:nowrap;visibility:hidden;pointer-events:none;';
    document.body.appendChild(tmp);
    for (var k = 0; k < confs.length; k++) {
      var b = $(confs[k][0]); if (!b) continue;
      var cw = b.clientWidth || b.offsetWidth;
      if (!cw || cw <= 0) continue;
      var el = confs[k][0] === 'btn-rank' ? b : (b.firstElementChild || b);
      if (!el) continue;
      el.style.fontSize = '';
      var cs = window.getComputedStyle(el);
      var text = el.textContent || '';
      if (!text) continue;
      tmp.style.fontFamily = cs.fontFamily;
      tmp.style.fontSize = cs.fontSize;
      tmp.style.fontWeight = cs.fontWeight;
      tmp.textContent = text;
      var avail = cw - confs[k][1];
      if (tmp.offsetWidth <= avail) continue;
      var fs = parseFloat(cs.fontSize);
      while (fs > 11) { fs -= 0.5; tmp.style.fontSize = fs + 'px'; if (tmp.offsetWidth <= avail) { el.style.fontSize = fs + 'px'; break; } }
      if (tmp.offsetWidth > avail) el.style.fontSize = '11px';
    }
    try { document.body.removeChild(tmp); } catch (e) {}
  }
  function refreshHome() {
    renderHomeCount();
    renderPlayerUI();
    syncSoundUI();
    setTimeout(fitHomeBtns, 30);
  }

  /* ---------- 开始游戏 ---------- */
  function startGame() {
    ensureAudio(); blip(660, 0.08, 'triangle', 0.1);
    /* 天赐词条：生成候选 → 弹窗选择 → 确认后真正开始 */
    var guardHit = guard.pts >= 100;
    if (guardHit) { guardClear(); hlToast('🔥 保底触发：本次必定觉醒 ' + theme.tierName(10) + ' ' + theme.terms.ability + '！', 2800); }
    var candidates = generateTalents(8, guardHit);
    showTalentModal(candidates, guardHit);
  }

  /* ---------- 天赐词条系统 ---------- */
  var TALENT_RARITY = {
    green:  { weight: 70, color: '#22c55e', label: '绿' },
    blue:   { weight: 25, color: '#3b82f6', label: '蓝' },
    purple: { weight: 4,  color: '#a855f7', label: '紫' },
    gold:   { weight: 1,  color: '#fbbf24', label: '金' }
  };
  var _selectedTalents = [];
  var _talentCandidates = [];
  var _pendingGuardHit = false;

  function generateTalents(n, guardGold) {
    var pool = theme.TALENTS || [];
    if (!pool.length) return [];
    /* 按品质分组 */
    var byRarity = { green: [], blue: [], purple: [], gold: [] };
    pool.forEach(function(t){ if (byRarity[t.rarity]) byRarity[t.rarity].push(t); });
    var result = [];
    var usedIds = {};  /* 同批去重：已选词条 ID */
    for (var i = 0; i < n; i++) {
      var roll = Math.random() * 100;
      var rarity;
      if (roll < 11) rarity = 'gold';
      else if (roll < 5) rarity = 'purple';
      else if (roll < 30) rarity = 'blue';
      else rarity = 'green';
      /* 该品质无词条则降级 */
      while (rarity !== 'green' && !byRarity[rarity].length) {
        rarity = rarity === 'gold' ? 'purple' : (rarity === 'purple' ? 'blue' : 'green');
      }
      /* 在目标品质内寻找未用过的词条（最多 30 次尝试） */
      var arr = byRarity[rarity];
      var cand = null, tries = 0;
      while (tries < 30 && arr && arr.length) {
        var c = arr[Math.floor(Math.random() * arr.length)];
        if (!usedIds[c.id]) { cand = c; break; }
        tries++;
      }
      /* 目标品质全用完：跨品质找未用过的 */
      if (!cand) {
        var order = ['green', 'blue', 'purple', 'gold'];
        for (var oi = 0; oi < order.length && !cand; oi++) {
          var a2 = byRarity[order[oi]];
          if (!a2) continue;
          for (var j = 0; j < a2.length; j++) {
            if (!usedIds[a2[j].id]) { cand = a2[j]; break; }
          }
        }
      }
      if (cand) {
        result.push(cand);
        usedIds[cand.id] = true;
      }
    }
    /* 保底必出金 */
    if (guardGold) {
      var hasGold = result.some(function(t){ return t.rarity === 'gold'; });
      if (!hasGold && byRarity.gold.length) {
        /* 找一个未用过的金词条 */
        var goldCand = null;
        for (var k = 0; k < byRarity.gold.length; k++) {
          if (!usedIds[byRarity.gold[k].id]) { goldCand = byRarity.gold[k]; break; }
        }
        if (!goldCand) goldCand = byRarity.gold[0]; /* 全用完则取第一个 */
        /* 替换一个非金词条 */
        for (var m = 0; m < result.length; m++) {
          if (result[m].rarity !== 'gold') {
            delete usedIds[result[m].id];
            result[m] = goldCand;
            usedIds[goldCand.id] = true;
            break;
          }
        }
      }
    }
    return result;
  }

  function showTalentModal(candidates, guardHit) {
    /* 按稀有度排序：金→紫→蓝→绿 */
    var rarityOrder = { gold: 0, purple: 1, blue: 2, green: 3 };
    var sorted = candidates.slice().sort(function(a, b) {
      return (rarityOrder[a.rarity] || 9) - (rarityOrder[b.rarity] || 9);
    });
    _talentCandidates = sorted;
    _pendingGuardHit = guardHit;
    _selectedTalents = [];
    var list = $('talent-list');
    if (list) list.innerHTML = '';
    var count = $('talent-count');
    if (count) count.textContent = '（候选 ' + sorted.length + '）';
    sorted.forEach(function(t, idx) {
      var card = document.createElement('div');
      card.className = 'talent-card';
      card.style.setProperty('--rarity', TALENT_RARITY[t.rarity].color);
      card.innerHTML = '<div class="talent-dot"></div>' +
        '<div class="talent-info"><div class="talent-name">' + esc(t.name) + '</div>' +
        '<div class="talent-desc">' + esc(t.desc) + '</div></div>' +
        '<div class="talent-pick"></div>';
      card.addEventListener('click', function() {
        blip(440 + (_selectedTalents.length * 100), 0.05, 'sine', 0.08);
        if (_selectedTalents.indexOf(idx) >= 0) {
          /* 取消选择 */
          _selectedTalents = _selectedTalents.filter(function(x){ return x !== idx; });
          card.classList.remove('selected');
          card.querySelector('.talent-pick').textContent = '';
        } else if (_selectedTalents.length < 2) {
          _selectedTalents.push(idx);
          card.classList.add('selected');
          card.querySelector('.talent-pick').textContent = _selectedTalents.length;
        }
        var btn = $('btn-talent-confirm');
        if (btn) {
          btn.disabled = _selectedTalents.length !== 2;
          btn.textContent = _selectedTalents.length === 2 ? '✨ 确认选择，开始模拟' : '请先选择 2 个词条（已选 ' + _selectedTalents.length + '）';
        }
      });
      if (list) list.appendChild(card);
    });
    var btn = $('btn-talent-confirm');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '请先选择 2 个词条';
    }
    $('talent-mask').hidden = false;
  }

  
  /* ---------- 🔄 词条刷新 ---------- */
  function talentRefresh() {
    var candidates = generateTalents(8, _pendingGuardHit);
    showTalentModal(candidates, _pendingGuardHit);
    blip(330, 0.06, 'sine', 0.08);
  }
function confirmTalents() {
    $('talent-mask').hidden = true;
    var guardHit = _pendingGuardHit;
    var picked = _selectedTalents.map(function(i){ return _talentCandidates[i]; });
    G = engine.createGame(player.lv, guardHit ? { force10: true } : undefined);
    /* 应用词条效果 */
    if (picked.length) {
      G.talents = picked.map(function(t){ return { name: t.name, rarity: t.rarity }; });
      picked.forEach(function(t){ if (t.apply) t.apply(G); });
    }
    var talentLog = picked.length ? '✨ 天赐词条：' + G.talents.map(function(t){return t.name}).join('、') + '！' : '';
    $('game-title').textContent = G.ability + '【' + theme.terms.abilityTalent + '：' + theme.tierName(G.innate) + '】';
    renderAttrs();
    /* 展示词条 */
    var tRow = $('attr-talent-row');
    var tChips = $('attr-talent-chips');
    if (G.talents && G.talents.length) {
      if (tRow) tRow.hidden = false;
      if (tChips) {
        var th = '';
        for (var ti = 0; ti < G.talents.length; ti++) {
          if (ti > 0) th += ' · ';
          var tc = {green:'#22c55e',blue:'#3b82f6',purple:'#a855f7',gold:'#fbbf24'}[G.talents[ti].rarity]||'#fbbf24'; th += '<span style="color:'+tc+'"'+'>✨'+esc(G.talents[ti].name)+'</span>';
        }
        tChips.innerHTML = th;
      }
    } else {
      if (tRow) tRow.hidden = true;
    }
    pendingLogs = [];
    $('log-box').innerHTML = '';
    var first = [];
    if (talentLog) first.push({ cls: 'rare', text: talentLog });
    if (G.innate >= 8) first.push({ cls: 'rare', text: '第6' + theme.terms.ageUnit + '，天生天才！' + theme.terms.abilityTalent + ' ' + theme.tierName(G.innate) + ' ' });
    first.push({ cls: 'brk', text: '第6' + theme.terms.ageUnit + '，' + theme.terms.ability + '觉醒，' + G.ability + '！' + theme.terms.abilityTalent + ' ' + theme.tierName(G.innate) + ' ，' + theme.terms.combat + ' ' + G.combat });
    fullLog = [];
    for (var fi = 0; fi < first.length; fi++) fullLog.push(first[fi]);
    renderLog(first);
    show('game');
    syncManualUI();
    startPlay();
    addPlay();
  }
  function startPlay() { stopPlay(); if (MANUAL) return; playTick(); }
  function stopPlay() { if (timer) { clearTimeout(timer); timer = null; } }
  function playTick() {
    var gap = pendingLogs.length ? FAST_MS : TICK_MS;
    timer = setTimeout(function () { if (!timer) return; tick(); if (timer) playTick(); }, gap);
  }
  function setSpeed() {
    var r = $('speed-range'); if (!r) return;
    var v = parseFloat(r.value);
    $('speed-val').textContent = v.toFixed(1) + 's';
    TICK_MS = Math.round(v * 1000);
    try { localStorage.setItem(GKEY_SPEED, String(v)); } catch (e) {}
    if (timer) { stopPlay(); startPlay(); }
  }
  function loadSpeed() {
    try {
      var v = parseFloat(localStorage.getItem(GKEY_SPEED));
      if (isFinite(v) && v >= 0.05 && v <= 1) {
        TICK_MS = Math.round(v * 1000);
        var r = $('speed-range'); if (r) r.value = v;
        var s = $('speed-val'); if (s) s.textContent = v.toFixed(1) + 's';
      }
    } catch (e) {}
  }

  function tick() {
    if (pendingLogs.length) {
      renderLog([pendingLogs.shift()]);
      renderAttrs();
      if (!pendingLogs.length && (G.dead || G.ascended)) { stopPlay(); finishGame(G.dead ? 'dead' : 'god'); }
      return;
    }
    var log = engine.rollYear(G);
    for (var i = 0; i < log.length; i++) fullLog.push(log[i]);
    renderAttrs();
    checkAch();
    if (G.dead || G.ascended) {
      renderLog(log);
    } else {
      var brkCount = 0, j;
      for (j = 0; j < log.length; j++) if (log[j].cls === 'brk') brkCount++;
      if (brkCount > 1) {
        pendingLogs = log.slice();
        if (pendingLogs.length) renderLog([pendingLogs.shift()]);
      } else {
        renderLog(log);
      }
    }
    if (!pendingLogs.length && (G.dead || G.ascended)) { stopPlay(); finishGame(G.dead ? 'dead' : 'god'); }
  }

  /* ---------- 渲染 ---------- */
  
  /* ---------- ⏩ 跳过功能：批量推进年份 ---------- */
  var _skipRunning = false;
  function skipAhead() {
    if (_skipRunning || !G || G.dead || G.ascended || MANUAL) return;
    _skipRunning = true;
    stopPlay();
    var btn = $('btn-skip');
    if (btn) { btn.textContent = '⏳ 推进中...'; btn.disabled = true; }
    var batch = 0;
    function skipBatch() {
      if (!G || G.dead || G.ascended || batch >= 200) {
        _skipRunning = false;
        if (btn) { btn.textContent = '⏩ 跳过'; btn.disabled = false; }
        renderAttrs();
        if (G && (G.dead || G.ascended)) { finishGame(G.dead ? 'dead' : 'god'); }
        else { startPlay(); }
        return;
      }
      for (var i = 0; i < 10; i++) {
        if (!G || G.dead || G.ascended) break;
        var log = engine.rollYear(G);
        for (var j = 0; j < log.length; j++) fullLog.push(log[j]);
        var hasRare = false;
        for (var k = 0; k < log.length; k++) {
          if (log[k].cls === 'rare' || log[k].cls === 'brk' || log[k].cls === 'dead' || log[k].cls === 'god' || log[k].cls === 'ev3') hasRare = true;
        }
        batch++;
        if (hasRare || G.dead || G.ascended) break;
      }
      renderAttrs();
      checkAch();
      requestAnimationFrame(skipBatch);
    }
    skipBatch();
  }
function renderAttrs() {
    var lvEl = $('attr-lvl');
    if (lvEl) lvEl.textContent = theme.titleOf(G.lvl) + '（' + G.lvl + '）';
    var atn = $('attr-talent-name'); if (atn) atn.textContent = theme.terms.abilityTalent;
    $('attr-apt').textContent = theme.tierName(G.aptitude) + '/' + G.aptitude;
    $('attr-life').textContent = G.age + '/' + G.lifespan;
    $('attr-combat').textContent = fmt(G.combat);

    /* 顶部标题：斗破只显示血脉之力；完美只显示古文品阶；其他显示功法名+天赋 */
    var gt = $('game-title');
    if (gt) {
      if (theme.id === 'doupo') {
        gt.textContent = '血脉之力：' + theme.tierName(G.innate) + '/' + G.innate;
      } else if (theme.id === 'wanmei') {
        gt.textContent = '古文品阶：' + theme.tierName(G.innate) + '/' + G.innate;
      } else {
        gt.textContent = G.ability + '【' + theme.terms.abilityTalent + '：' + theme.tierName(G.innate) + '】';
      }
    }

    /* 技能行：不同主题不同展示 */
    var skillRow = $('attr-skill');
    var ahc = $('attr-skill-chips');
    if (theme.id === 'douluo') {
      /* 斗罗：技能行展示魂环（魂兽名+年限+魂技），按魂环颜色着色 */
      if (skillRow) skillRow.hidden = false;
      if (ahc) {
        var rings = G && G.soulRings;
        if (rings && rings.length) {
          var rh = '';
          for (var ri = 0; ri < rings.length; ri++) {
            if (ri > 0) rh += ' ';
            rh += soulRingHtml(rings[ri]);
          }
          ahc.innerHTML = rh;
        } else { ahc.innerHTML = ''; }
      }
      var skillLabel = skillRow && skillRow.querySelector('.skill-label');
      if (skillLabel) skillLabel.textContent = '魂环';
    } else if (theme.id === 'doupo' || theme.id === 'wanmei') {
      /* 斗破/完美：隐藏技能行（各自有独立的斗技/功法行在下方展示，避免重复） */
      if (skillRow) skillRow.hidden = true;
    } else {
      /* 末日：展示技能档级 chip */
      if (ahc) ahc.innerHTML = skillChipsHtml(G && G.skillSeq, essenceShortName(G));
      if (skillRow) skillRow.hidden = false;
    }

    ['attr-lvl', 'attr-apt', 'attr-life', 'attr-combat'].forEach(function (id) { fitAttrVal($(id)); });

    /* 斗破专属字段 */
    var dpCards = $('attr-doupo-cards');
    var firesRow = $('attr-fires-row');
    var skillsRow = $('attr-skills-row');
    if (theme.id === 'doupo') {
      /* 炼药品阶 */
      var alEl = $('attr-alchemist');
      if (alEl) {
        var grades = theme.terms.alchemistGrades;
        alEl.textContent = (grades && grades[G.alchemist || 0]) || '未入品';
      }
      /* 精神力 */
      var soEl = $('attr-soul');
      if (soEl) {
        var realms = theme.terms.soulRealms;
        soEl.textContent = (realms && realms[G.soulRealm || 0]) || '凡境';
      }
      /* 异火（排行）：靠左，获得顺序从左到右，按排行着色 */
      var fiEl = $('attr-fires');
      if (fiEl) {
        if (G.fires && G.fires.length) {
          var fhtml = '';
          for (var fi = 0; fi < G.fires.length; fi++) {
            var f = G.fires[fi];
            var rnk = f.rank != null ? f.rank : '?';
            if (fi > 0) fhtml += ' · ';
            fhtml += fireHtml(f.name || f, rnk);
          }
          fiEl.innerHTML = fhtml;
        } else { fiEl.textContent = '无'; }
      }
      /* 斗技：靠左，获得顺序从左到右，按阶别着色 */
      var skEl = $('attr-skills-name');
      if (skEl) {
        if (G.skillNames && G.skillNames.length) {
          var shtml = '';
          for (var si = 0; si < G.skillNames.length; si++) {
            if (si > 0) shtml += ' ';
            shtml += skillTierHtml(G.skillNames[si].name, G.skillNames[si].rank);
          }
          skEl.innerHTML = shtml;
        } else { skEl.textContent = '无'; }
      }
      if (dpCards) dpCards.hidden = false;
      if (firesRow) firesRow.hidden = false;
      if (skillsRow) skillsRow.hidden = false;
    } else if (theme.id === 'wanmei') {
      /* 完美主题：只显示功法行（复用斗技行容器），隐藏炼药/异火卡片 */
      if (dpCards) dpCards.hidden = true;
      if (firesRow) firesRow.hidden = true;
      /* 功法行：靠左，获得顺序从左到右，按品阶着色 */
      var wmSkEl = $('attr-skills-name');
      if (wmSkEl) {
        if (G.skillNames && G.skillNames.length) {
          var wmhtml = '';
          for (var wi = 0; wi < G.skillNames.length; wi++) {
            if (wi > 0) wmhtml += ' ';
            wmhtml += skillTierHtml(G.skillNames[wi].name, G.skillNames[wi].rank);
          }
          wmSkEl.innerHTML = wmhtml;
        } else { wmSkEl.textContent = '无'; }
      }
      /* 修改标签为"功法" */
      var wmLabel = skillsRow && skillsRow.querySelector('.skill-label');
      if (wmLabel) wmLabel.textContent = '宝术';
      if (skillsRow) skillsRow.hidden = false;
    } else {
      if (dpCards) dpCards.hidden = true;
      if (firesRow) firesRow.hidden = true;
      if (skillsRow) skillsRow.hidden = true;
    }

    /* 斗罗魂骨展示（始终显示标题，有数据时展示内容） */
    var boneRow = $('attr-bone-row');
    var boneChips = $('attr-bone-chips');
    if (theme.id === 'douluo') {
      if (boneRow) boneRow.hidden = false;
      if (boneChips && G && G.soulBones && G.soulBones.length) {
        var bhtml = '';
        for (var bii = 0; bii < G.soulBones.length; bii++) {
          var sb = G.soulBones[bii];
          var bc = TIER_COLORS[sb.tier] || '#fbbf24';
          if (bii > 0) bhtml += ' ';
          bhtml += '<span style="color:' + bc + '">' + esc(sb.beast) + esc(sb.part) + '（' + esc(sb.skill) + '）</span>';
        }
        boneChips.innerHTML = bhtml;
      } else if (boneChips) {
        boneChips.innerHTML = '<span style="color:#666">暂无</span>';
      }
    } else {
      if (boneRow) boneRow.hidden = true;
    }

    /* 飞升后展示帝名/神位/仙帝名 */
    var emEl = $('attr-emperor'), emRow = $('attr-emperor-row');
    if (emEl) {
      var title = G.emperorName ? ('👑 帝名：' + G.emperorName) :
                  G.godName ? ('👑 神位：' + G.godName) :
                  G.immortalName ? ('👑 仙帝名：' + G.immortalName) : '';
      if (title && G.ascended) { emEl.textContent = title; emEl.hidden = false; if (emRow) emRow.hidden = false; }
      else { emEl.hidden = true; if (emRow) emRow.hidden = true; }
    }
  }
  function fitAttrVal(el) {
    if (!el || !document.body || typeof window.getComputedStyle !== 'function') return;
    var card = el.parentElement;
    var avail = card ? (card.clientWidth || card.offsetWidth) : (el.clientWidth || el.offsetWidth);
    if (card) { var cs0 = window.getComputedStyle(card); avail -= parseFloat(cs0.paddingLeft || 0) + parseFloat(cs0.paddingRight || 0); }
    if (!avail || avail <= 0) return;
    var tmp = document.createElement('span');
    tmp.style.cssText = 'position:fixed;left:-9999px;top:0;white-space:nowrap;visibility:hidden;pointer-events:none;';
    var cs = window.getComputedStyle(el);
    tmp.style.fontFamily = cs.fontFamily;
    tmp.style.fontWeight = cs.fontWeight;
    tmp.textContent = el.textContent || '';
    document.body.appendChild(tmp);
    var fs = 26;
    tmp.style.fontSize = fs + 'px';
    while (tmp.offsetWidth > avail && fs > 11) { fs -= 0.5; tmp.style.fontSize = fs + 'px'; }
    try { document.body.removeChild(tmp); } catch (e) {}
    el.style.fontSize = fs + 'px';
  }
  /* 技能档级 → 展示文案/色块 class（D/C/B/A/S 跨主题通用） */
  var SKILL_DISP = {
    'D': { d: 'D', c: 'ten' }, 'C': { d: 'C', c: 'bai' }, 'B': { d: 'B', c: 'qian' },
    'A': { d: 'A', c: 'wan' }, 'S': { d: 'S', c: 'combat100k' }
  };
  function essenceShortName(rec) {
    var n = rec && (rec.essenceName || (rec.essence && rec.essence.length && rec.essence[0].name));
    if (!n) return null;
    var s = String(n);
    if (s.indexOf('·') >= 0) { s = s.split('·').pop(); }
    else if (s.indexOf('信物') >= 0) { s = s.split('信物')[0]; }
    return s || null;
  }
  function skillChipsHtml(seq, essenceShort) {
    var s = '';
    if (seq && seq.length) {
      for (var i = 0; i < seq.length; i++) {
        var it = SKILL_DISP[seq[i]] || { d: seq[i] || '?', c: 'ten' };
        s += '<span class="skill-chip hc-' + it.c + '">' + it.d + '</span>';
      }
    }
    if (essenceShort) s += '<span class="skill-chip hc-essence">' + esc(essenceShort) + '</span>';
    return s;
  }
  function renderLog(logs) {
    var box = $('log-box');
    var frag = document.createDocumentFragment();
    for (var i = 0; i < logs.length; i++) {
      var d = document.createElement('div');
      d.className = 'log-item' + (logs[i].cls ? ' ' + logs[i].cls : '');
      d.textContent = logs[i].text;
      frag.appendChild(d);
    }
    box.insertBefore(frag, box.firstChild);
  }

  /* ---------- 暂停 ---------- */
  function pauseGame() {
    if (!G || G.dead || G.ascended) return;
    stopPlay();
    $('pause-info').textContent = theme.terms.ability + ' ' + G.ability + ' · ' + G.age + ' ' + theme.terms.ageUnit + ' · ' + theme.terms.level + ' ' + G.lvl + ' 级';
    $('pause-mask').hidden = false;
  }
  function resumeGame() { if (!G) return; hideMask(); ensureAudio(); startPlay(); }
  function exitGame() { stopPlay(); hideMask(); G = null; show('home'); }

  /* ---------- 结算 ---------- */
  function finishGame(reason) {
    if (!G) return;
    stopPlay(); hideMask();
    pendingLogs = [];
    settleReason = reason;

    var rC = insertLocal('local_combat', G.combat);
    var rA = insertLocal('local_life', G.lifespan);
    var rL = insertLocal('local_lvl', G.lvl);

    /* 全服排行榜提交（异步，不阻塞结算） */
    (function () {
      var pname = getPlayerName();
      var nameInput = $('settle-name');
      var hint = $('settle-rank-hint');
      if (nameInput) {
        nameInput.value = pname;
        nameInput.onchange = function () {
          setPlayerName(this.value);
          // 重新提交所有三个榜单
          var n = getPlayerName() || '匿名';
          var boards2 = [['combat', G.combat], ['life', G.lifespan], ['lvl', G.lvl]];
          for (var k = 0; k < boards2.length; k++) {
            apiSubmit(theme.id, boards2[k][0], n, boards2[k][1], function () {});
          }
        };
      }
      if (hint) hint.textContent = '';
      var boards = [
        ['combat', G.combat],
        ['life', G.lifespan],
        ['lvl', G.lvl]
      ];
      var submitCount = 0;
      for (var bi = 0; bi < boards.length; bi++) {
        (function (b, s) {
          apiSubmit(theme.id, b, pname || '匿名', s, function (err, res) {
            submitCount++;
            if (submitCount === 1 && hint && res && res.ok) {
              hint.textContent = '已上传 · 全服第' + res.rank + '名';
            }
          });
        })(boards[bi][0], boards[bi][1]);
      }
    })();

    if (G.ascended) saveAscendTotal(loadAscendTotal() + 1);

    var expGain = G.ascended ? theme.ASCEND_EXP : Math.round(G.lvl * (reason === 'pause' ? theme.EXP_PER_LVL_EARLY : theme.EXP_PER_LVL));
    addExp(expGain);

    if (reason !== 'pause') guardAdd(guardGainFor(reason, G));

    var t = $('settle-title');
    if (reason === 'god') { t.textContent = theme.terms.settleGodTitle; t.className = 'settle-title god'; blip(880, 0.4, 'triangle', 0.14); }
    else if (reason === 'dead') {
      if (G.ascendMode === 'fail') { t.textContent = theme.terms.settleFailTitle; blip(120, 0.4, 'sawtooth', 0.14); }
      else { t.textContent = theme.terms.settleDeadTitle; blip(160, 0.4, 'sawtooth', 0.12); }
      t.className = 'settle-title';
    }
    else { t.textContent = theme.terms.settlePauseTitle; t.className = 'settle-title'; blip(400, 0.2, 'triangle', 0.1); }

    $('settle-ability').innerHTML = theme.terms.ability + ' <b>' + esc(G.ability) + '</b> · ' + theme.terms.abilityTalent + ' ' + theme.tierName(G.innate) + ' ';
    $('settle-lvl').textContent = G.lvl + '级（' + theme.titleOf(G.lvl) + '）';
    $('settle-combat').textContent = fmt(G.combat);
    $('settle-age').textContent = G.age + ' ' + theme.terms.ageUnit;
    var ageLb = $('settle-age-label'); if (ageLb) ageLb.textContent = G.ascended ? theme.terms.settleAgeLabelAscend : theme.terms.settleAgeLabelDead;

    var gd = $('settle-god');
    if (G.ascended) { var _gn = G._godName || G.emperorName || G.godName || G.immortalName || ""; gd.textContent = _gn ? _gn : theme.terms.settleGodDesc; gd.hidden = false; }
    else gd.hidden = true;

    $('settle-exp').textContent = '+' + expGain;
    var shc = $('settle-skill-chips');
    if (shc) {
      if (theme.id === 'douluo' && G.soulRings && G.soulRings.length) {
        /* 斗罗：结算页显示魂环 */
        var rrh = '';
        for (var rri = 0; rri < G.soulRings.length; rri++) {
          if (rri > 0) rrh += ' ';
          rrh += soulRingHtml(G.soulRings[rri]);
        }
        shc.innerHTML = rrh;
        var skl = $('settle-skill');
        if (skl) { var sll = skl.querySelector('.skill-label'); if (sll) sll.textContent = '魂环'; }
      } else if (theme.id === 'doupo' && G.skillNames && G.skillNames.length) {
        /* 斗破：结算页显示斗技+异火 */
        var dsh = '';
        for (var dsi = 0; dsi < G.skillNames.length; dsi++) {
          if (dsi > 0) dsh += ' ';
          dsh += skillTierHtml(G.skillNames[dsi].name, G.skillNames[dsi].rank);
        }
        shc.innerHTML = dsh;
        /* 异火单独展示 */
        var sf = $('settle-fire');
        var sfc = $('settle-fire-chips');
        if (sf && sfc) {
          if (G.fires && G.fires.length) {
            var fsh = '';
            for (var fi = 0; fi < G.fires.length; fi++) {
              if (fi > 0) fsh += ' ';
              var ff = G.fires[fi];
              fsh += fireHtml(ff.name || ff, ff.rank != null ? ff.rank : '?');
            }
            sfc.innerHTML = fsh;
            sf.hidden = false;
          } else { sf.hidden = true; }
        }
        var skl2 = $('settle-skill');
        if (skl2) { var sll2 = skl2.querySelector('.skill-label'); if (sll2) sll2.textContent = '斗技'; }
      } else if (theme.id === 'wanmei' && G.skillNames && G.skillNames.length) {
        /* 完美：结算页显示功法 */
        var wsh = '';
        for (var wsi = 0; wsi < G.skillNames.length; wsi++) {
          if (wsi > 0) wsh += ' ';
          wsh += skillTierHtml(G.skillNames[wsi].name, G.skillNames[wsi].rank);
        }
        shc.innerHTML = wsh;
        var skl3 = $('settle-skill');
        if (skl3) { var sll3 = skl3.querySelector('.skill-label'); if (sll3) sll3.textContent = '宝术'; }
      } else {
        shc.innerHTML = skillChipsHtml(G && G.skillSeq, essenceShortName(G));
      }
    }
    var sgRow = $('settle-guard-row'), sgp = $('settle-guard');
    if (sgRow) sgRow.hidden = reason === 'pause';
    if (sgp) sgp.textContent = reason === 'pause' ? '--' : '+' + guardGainFor(reason, G);
    checkAch();

    var es = $('settle-essence');
    if (G.essence && G.essence.length) {
      var names = [];
      for (var i = 0; i < G.essence.length; i++) names.push('『' + G.essence[i].name + '』');
      es.textContent = theme.terms.essence + '：' + names.join(' ');
      if (G.refineFail) {
        es.textContent += theme.terms.refineFailHint ? theme.terms.refineFailHint(G.ascended) : '';
        es.className = 'settle-essence warn';
      }
      es.hidden = false;
    } else { es.hidden = true; }

    /* 天赐词条显示 */
    var st = $('settle-talents');
    if (st) {
      if (G.talents && G.talents.length) {
        st.textContent = '✨ 天赐词条：' + G.talents.map(function(t){return t.name}).join('·');
        st.hidden = false;
      } else { st.hidden = true; }
    }

    /* 斗罗魂骨展示（结算页） */
    var stb = $('settle-bone');
    if (stb) {
      if (G.soulBones && G.soulBones.length) {
        var sbStrs = [];
        for (var sbi = 0; sbi < G.soulBones.length; sbi++) {
          var sbb = G.soulBones[sbi];
          sbStrs.push(sbb.beast + sbb.part + '（' + sbb.skill + '）');
        }
        var boneChips = sbStrs.join(' ');
        stb.querySelector('#settle-bone-chips').innerHTML = boneChips;
        stb.hidden = false;
      } else { stb.hidden = true; }
    }

    /* 多路径成帝/成神/成仙：帝名/神位名/仙帝名 */
    var sg = $('settle-god');
    if (sg) {
      var godTitle = G.emperorName ? ('👑 帝名：' + G.emperorName) :
                     G.godName ? ('👑 神位：' + G.godName) :
                     G.immortalName ? ('👑 仙帝名：' + G.immortalName) : '';
      if (godTitle && G.ascended) {
        sg.textContent = godTitle;
        sg.hidden = false;
      } else { sg.hidden = true; }
    }

    recordHighlight(reason);
    show('settle');
  }

  /* ---------- 排行榜 ---------- */
  var curBoard = 'combat';
  function openRank() { curBoard = 'combat'; setRankUI(); show('rank'); loadRank(); }
  function makeTab(parent, active, label, cb) {
    var b = document.createElement('button');
    b.className = 'tab' + (active ? ' active' : '');
    b.textContent = label;
    b.addEventListener('click', function () { cb(); });
    parent.appendChild(b);
  }
  function setRankUI() {
    var board = $('rank-board'); board.innerHTML = '';
    [['combat', theme.terms.combat], ['age', theme.terms.lifespan], ['lvl', theme.terms.level]].forEach(function (p) {
      makeTab(board, curBoard === p[0], p[1], function () { curBoard = p[0]; setRankUI(); loadRank(); blip(500, 0.06, 'triangle', 0.08); });
    });
  }
  function loadRank() { loadGlobalRank(); }
  function loadGlobalRank() {
    var note = $('rank-note'), body = $('rank-body');
    var b = LOCAL_BOARDS[curBoard];
    note.textContent = '加载中…';
    body.innerHTML = '<div class="lb-tip">正在获取全服排行…</div>';
    apiRank(theme.id, curBoard, 50, function (err, res) {
      if (err || !res || !res.ok) {
        // 服务器不可用，降级到本地排行
        loadLocalRank();
        return;
      }
      var list = res.list || [];
      var myRank = res.myRank;
      var myScore = res.myScore;
      var total = res.total;
      if (!list.length) {
        note.textContent = '暂无成绩 · 快去玩一局吧';
        body.innerHTML = '<div class="lb-tip">暂无全服成绩</div>';
        return;
      }
      var myScoreTxt = myScore != null ? (curBoard === 'lvl' ? myScore + '级' : fmt(myScore)) : '--';
      note.textContent = '全服共 ' + total + ' 人 · 我的排名：' + (myRank > 0 ? '第 ' + myRank + ' 名 (' + myScoreTxt + ')' : '未上榜');
      var h = '';
      var myPid = getPid();
      for (var i = 0; i < list.length; i++) {
        var it = list[i], rk = it.rank || (i + 1);
        var cls = 'lb-rank' + (rk <= 3 ? ' top r' + rk : '');
        var scoreTxt = fmt(it.score);
        if (curBoard === 'lvl') scoreTxt = it.score + '级';
        var isMe = it.name === (getPlayerName() || '匿名');
        h += '<div class="lb-row' + (isMe ? ' me' : '') + '"><span class="' + cls + '">' + rk + '</span>' +
          '<span class="lb-user"><span class="lb-name">' + esc(it.name || '匿名') + '</span></span>' +
          '<span class="lb-time">' + fmtTime(it.ts) + '</span>' +
          '<span class="lb-score">' + scoreTxt + '</span></div>';
      }
      body.innerHTML = h;
    });
  }
  function loadLocalRank() {
    var note = $('rank-note'), body = $('rank-body');
    var b = LOCAL_BOARDS[curBoard];
    var list = loadLocalList(b.kn);
    if (!list.length) { note.textContent = '暂无成绩 · 快去玩一局吧'; body.innerHTML = '<div class="lb-tip">暂无成绩</div>'; return; }
    var best = 0, bi = 0, i;
    for (i = 0; i < list.length; i++) if (list[i].score > best) { best = list[i].score; bi = i; }
    note.textContent = '我的最佳：' + fmt(best) + ' · 第 ' + (bi + 1) + ' 名（本地）';
    var h = '';
    for (i = 0; i < list.length; i++) {
      var it = list[i], rk = i + 1;
      var cls = 'lb-rank' + (rk <= 3 ? ' top r' + rk : '');
      var scoreTxt = fmt(it.score);
      if (curBoard === 'lvl') scoreTxt = it.score + '级';
      h += '<div class="lb-row' + (i === bi ? ' me' : '') + '"><span class="' + cls + '">' + rk + '</span>' +
        '<span class="lb-user"><span class="lb-name">我的成绩</span></span>' +
        '<span class="lb-time">' + fmtTime(it.ts) + '</span>' +
        '<span class="lb-score">' + scoreTxt + '</span></div>';
    }
    body.innerHTML = h;
  }

  /* ---------- 保底积分 ---------- */
  var guard = { pts: 0, ts: 0 };
  function guardGainFor(reason, g) {
    if (reason === 'pause') return 0;
    var innate = g.innate || 10;
    var low = innate <= 1 ? 5 : (innate === 2 ? 4 : (innate === 3 ? 3 : (innate === 4 ? 2 : 1)));
    var tier = g.ascended ? 30 : (g.lvl >= 99 ? 10 : (g.lvl >= 95 ? 8 : (g.lvl >= 91 ? 5 : (g.lvl >= 81 ? 3 : 0))));
    return low + tier;
  }
  function loadGuard() {
    try {
      var o = JSON.parse(localStorage.getItem(key('guard')) || 'null');
      if (o && typeof o === 'object' && typeof o.pts === 'number') {
        guard = { pts: Math.max(0, Math.min(100, Math.floor(o.pts) || 0)), ts: o.ts || 0 };
      } else { guard = { pts: 0, ts: 0 }; }
    } catch (e) { guard = { pts: 0, ts: 0 }; }
  }
  function saveGuard() { try { localStorage.setItem(key('guard'), JSON.stringify(guard)); } catch (e) {} }
  function renderGuardUI() {
    var btn = $('btn-guard'); if (btn) btn.classList.toggle('on', guard.pts >= 100);
    var tip = $('guard-tip');
    if (tip) tip.textContent = guard.pts >= 100 ? '下一次必定觉醒 ' + theme.tierName(10) + ' ' + theme.terms.ability : '保底积分 ' + guard.pts + '/100';
    var mp = $('guard-mask-pts'); if (mp) mp.textContent = guard.pts;
  }
  function guardAdd(gain) {
    if (!gain || gain <= 0) return;
    var np = Math.min(100, guard.pts + gain);
    if (np === guard.pts) return;
    guard.pts = np; guard.ts = Date.now();
    saveGuard(); renderGuardUI();
  }
  function guardClear() { guard.pts = 0; guard.ts = Date.now(); saveGuard(); renderGuardUI(); }
  function openGuardMask() {
    blip(500, 0.06, 'triangle', 0.08);
    var mp = $('guard-mask-pts'); if (mp) mp.textContent = guard.pts;
    var mt = $('guard-mask-title'); if (mt) mt.textContent = theme.terms.guardMaskTitle;
    var grt = $('guard-row-talent'); if (grt) grt.textContent = theme.terms.guardTalentRow;
    var grl = $('guard-row-level'); if (grl) grl.textContent = theme.terms.guardLevelRow;
    var gmh = $('guard-mask-hint'); if (gmh) gmh.innerHTML = theme.terms.guardHint;
    $('guard-mask').hidden = false;
  }
  function closeGuardMask() { $('guard-mask').hidden = true; }

  /* ---------- 成就系统 ---------- */
  var ach = {};
  function achBonus() {
    var sum = 0, i;
    for (i = 0; i < theme.ACHIEVEMENTS.length; i++) if (ach[theme.ACHIEVEMENTS[i].id]) sum += theme.ACHIEVEMENTS[i].bonus;
    return Math.round(sum * 100) / 100;
  }
  function loadAchLocal() {
    try { var o = JSON.parse(localStorage.getItem(key('ach')) || '{}'); ach = (o && typeof o === 'object') ? o : {}; } catch (e) { ach = {}; }
  }
  function saveAchLocal() { try { localStorage.setItem(key('ach'), JSON.stringify(ach)); } catch (e) {} }
  function markAch(id) {
    if (ach[id]) return;
    ach[id] = true; saveAchLocal();
    var nm = id;
    for (var i = 0; i < theme.ACHIEVEMENTS.length; i++) if (theme.ACHIEVEMENTS[i].id === id) { nm = theme.ACHIEVEMENTS[i].name; break; }
    showAchToast(nm);
    applyAch();
  }
  var achToastQueue = [], achToastBusy = false;
  function showAchToast(name) { achToastQueue.push(name); if (!achToastBusy) achToastNext(); }
  function achToastNext() {
    if (!achToastQueue.length) { achToastBusy = false; return; }
    achToastBusy = true;
    var name = achToastQueue.shift();
    var el = $('ach-toast');
    if (el) {
      el.textContent = '⭐ 成就达成：' + name;
      el.hidden = false;
      el.classList.remove('show');
      void el.offsetWidth;
      el.classList.add('show');
    }
    setTimeout(function () {
      var el2 = $('ach-toast');
      if (el2) { el2.classList.remove('show'); setTimeout(function () { el2.hidden = true; }, 300); }
      achToastBusy = false;
      achToastNext();
    }, 2200);
  }
  function achMerge(localAch, remoteAch) {
    if (!remoteAch || typeof remoteAch !== 'object') return localAch;
    for (var k in remoteAch) if (remoteAch[k] && !localAch[k]) localAch[k] = true;
    return localAch;
  }
  function applyAch() {
    engine.setAchBonus(achBonus());
    var tip = $('ach-tip'); if (tip) tip.textContent = '成就加成：' + achBonus() + '%';
    var total = $('ach-total'); if (total) total.textContent = '成就加成：+' + achBonus() + '%';
    renderAchList();
  }
  function checkAch() {
    if (!G) return;
    if (G.innate === 10) markAch('innate10');
    if (G.lvl >= 71) markAch('lvl71');
    if (G.lvl >= 81) markAch('lvl81');
    if (G.lvl >= 91) markAch('feng91');
    if (G.lvl >= 95) markAch('lvl95');
    if (G.lvl >= 99) markAch('lvl99');
    if (G.combat >= 100000) markAch('combat100k');
    if (G.combat >= 300000) markAch('combat300k');
    if (G.combat >= 1000000) markAch('million');
    if (G.essence && G.essence.length) markAch('essence');
    if (G.ascended) {
      markAch('god');
      if (G.ascendMode === 'forced') markAch('forced');
      if (G.ascendMode === 'origin') markAch('origin');
    }
    if (G.gotMutation) markAch('mutation');
    if (G.gotTwin) markAch('twin');
    /* 主题专属成就判定钩子 */
    if (theme.hooks && theme.hooks.customAchieveCheck) theme.hooks.customAchieveCheck(G, markAch, theme);
    checkAchFromRank();
  }
  function markGodCount(n) {
    if (n >= 3) markAch('god3');
    if (n >= 10) markAch('god10');
    if (n >= 30) markAch('god30');
    if (n >= 50) markAch('god50');
    if (n >= 100) markAch('god100');
  }
  function checkAchFromRank() { markGodCount(loadAscendTotal()); }
  function renderAchList() {
    var box = $('ach-list'); if (!box) return;
    box.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < theme.ACHIEVEMENTS.length; i++) {
      var a = theme.ACHIEVEMENTS[i], done = !!ach[a.id];
      var d = document.createElement('div');
      d.className = 'ach-item ' + (done ? 'done' : 'todo');
      var nm = document.createElement('span'); nm.className = 'ach-name'; nm.textContent = a.name;
      var b = document.createElement('span'); b.className = 'ach-bonus'; b.textContent = (done ? '✓ 已达成' : '未达成') + ' +' + a.bonus + '%';
      d.appendChild(nm); d.appendChild(b);
      frag.appendChild(d);
    }
    box.appendChild(frag);
  }
  function openAch() { blip(500, 0.06, 'triangle', 0.08); applyAch(); show('ach'); }
  function closeAch() { show('home'); }

  /* ---------- 回顾人生 ---------- */
  function openReview() {
    var box = $('review-log'); box.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < fullLog.length; i++) {
      var d = document.createElement('div');
      d.className = 'rv-' + (fullLog[i].cls || 'year');
      d.textContent = fullLog[i].text;
      frag.appendChild(d);
    }
    box.appendChild(frag);
    $('review-mask').hidden = false;
  }
  function closeReview() { $('review-mask').hidden = true; }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    $('btn-start').addEventListener('click', startGame);
    $('btn-talent-confirm').addEventListener('click', function () { blip(660, 0.08, 'triangle', 0.1); confirmTalents(); });
    $('btn-talent-refresh').addEventListener('click', function () { talentRefresh(); });

    $('btn-rank').addEventListener('click', function () { blip(500, 0.06, 'triangle', 0.08); openRank(); });
    $('btn-close-rank').addEventListener('click', function () { show('home'); });
    $('btn-ach').addEventListener('click', openAch);
    $('btn-close-ach').addEventListener('click', function () { blip(400, 0.06, 'triangle', 0.08); closeAch(); });
    $('btn-guard').addEventListener('click', openGuardMask);
    $('btn-guard-close').addEventListener('click', function () { blip(400, 0.06, 'triangle', 0.08); closeGuardMask(); });
    $('btn-pause').addEventListener('click', function () { blip(400, 0.06, 'triangle', 0.08); pauseGame(); });
    $('btn-pause-resume').addEventListener('click', function () { blip(600, 0.06, 'triangle', 0.08); resumeGame(); });
    $('btn-pause-settle').addEventListener('click', function () { blip(500, 0.08, 'triangle', 0.1); finishGame('pause'); });
    $('btn-pause-exit').addEventListener('click', function () { exitGame(); });
    $('btn-settle-again').addEventListener('click', startGame);
    $('btn-settle-review').addEventListener('click', function () { blip(500, 0.06, 'triangle', 0.08); openReview(); });
    $('btn-review-close').addEventListener('click', function () { blip(400, 0.06, 'triangle', 0.08); closeReview(); });
    $('btn-settle-home').addEventListener('click', function () { show('home'); });
    /* 合集首页返回按钮 */
    var btnGridHome = $('btn-grid-home');
    if (btnGridHome) btnGridHome.addEventListener('click', function () { blip(500, 0.06, 'triangle', 0.08); show('grid'); });
    /* 主题开始页返回合集按钮 */
    var btnHomeBack = $('btn-home-back');
    if (btnHomeBack) btnHomeBack.addEventListener('click', function () { blip(400, 0.06, 'triangle', 0.08); show('grid'); });
    $('home-sound').addEventListener('change', function () { SOUND = this.checked; saveSound(); syncSoundUI(); });
    $('home-manual').addEventListener('change', function () { MANUAL = this.checked; saveManual(); syncManualUI(); });
    $('log-box').addEventListener('click', function () {
      if (!MANUAL || !G || G.dead || G.ascended || timer) return;
      blip(400, 0.04, 'triangle', 0.06);
      if (pendingLogs.length) { renderLog(pendingLogs); pendingLogs = []; renderAttrs(); }
      tick();
    });
    $('speed-range').addEventListener('input', setSpeed);
    $('speed-range').addEventListener('change', setSpeed);
    $('btn-skip').addEventListener('click', function () { blip(600, 0.08, 'triangle', 0.1); skipAhead(); });
    $('btn-settings').addEventListener('click', function () { blip(500, 0.06, 'triangle', 0.08); openSettings('home'); });
    $('btn-about').addEventListener('click', function () { blip(500, 0.06, 'triangle', 0.08); show('about'); });
    $('btn-close-settings').addEventListener('click', function () { blip(400, 0.06, 'triangle', 0.08); closeSettings(); });
    $('btn-close-about').addEventListener('click', function () { blip(400, 0.06, 'triangle', 0.08); show('home'); });
    $('btn-pause-settings').addEventListener('click', function () { blip(500, 0.06, 'triangle', 0.08); openSettings('pause'); });
    $('btn-highlight').addEventListener('click', function () { blip(500, 0.06, 'triangle', 0.08); openHL(); });
    $('btn-close-highlight').addEventListener('click', function () { blip(400, 0.06, 'triangle', 0.08); show('home'); });
    $('btn-hl-close').addEventListener('click', function () { blip(400, 0.06, 'triangle', 0.08); closeHLReview(); });
    $('btn-hl-copy').addEventListener('click', function () { blip(500, 0.06, 'triangle', 0.08); copyHl(); });
    $('btn-hl-img').addEventListener('click', function () { blip(500, 0.06, 'triangle', 0.08); hlImgExport(); });
    $('btn-hl-img-close').addEventListener('click', function () { blip(400, 0.06, 'triangle', 0.08); hlCloseImg(); });
    $('btn-hl-img-dl').addEventListener('click', function () { blip(500, 0.06, 'triangle', 0.08); hlDownload(hlCurDataUrl); });
    var hlImg = $('hl-img');
    if (hlImg) hlImg.addEventListener('dblclick', function () { blip(500, 0.06, 'triangle', 0.08); hlDownload(hlCurDataUrl); });
  }

  /* ---------- 启动 ---------- */
  loadSound();
  loadSpeed();
  loadManual();
  loadPlayer();
  loadAchLocal();
  loadGuard();
  engine.setAchBonus(achBonus());
  document.title = theme.terms.simulatorName;
  refreshHome();
  renderThemeHome();
  bindEvents();
  syncManualUI();
  show('grid');   /* 首屏：模拟器合集网格 */
  renderHomeCount();
  try { window.addEventListener('resize', function () { fitHomeBtns(); }); } catch (e) {}

  var HLAPI = {
    listAddNear: hlAddNear, listAddTop: hlAddTop, listAddGod: hlAddGod,
    buildClipText: hlClipText,
    badgeCls: hlBadgeCls, resultLabel: hlResultLabel,
    achMerge: achMerge,
    guardGain: guardGainFor,
    highlights: hlHighlights,
    coreText: hlCoreText, coreOf: hlCoreOf, trimKind: hlTrimKind
  };
  try { window.HL = HLAPI; } catch (e) {}
})();