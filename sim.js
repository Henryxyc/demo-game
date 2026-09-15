/* ============================================================
 * 模拟器合集 · 引擎核心（纯逻辑，浏览器 + Node 通用，UMD）
 * 逐年修炼 · 突破概率表（连破规则）· 随机事件 · 源质/强行进化超生命体
 *
 * 【多主题架构】createEngine(theme) 接收一个主题包对象，返回绑定该主题的引擎实例。
 * 所有数据（BREAK_CHANCE/ESSENCE/...）与文案（terms.year/breakSuccess/...）均从 theme 读取。
 * 主题包结构见 themes/doomsday.js。事件文案由各主题 EVENTS 自行控制。
 * ============================================================ */
(function (root) {
  /* UMD：浏览器暴露 root.Sim = { createEngine }；Node 导出同对象 */
  var Sim = { createEngine: null };

  function createEngine(theme) {
    if (!theme) throw new Error('createEngine: theme is required');

    function rand(a, b) { return a + Math.random() * (b - a); }
    function irand(a, b) { return Math.floor(rand(a, b + 1)); }
    function round(x) { return Math.round(x); }

    /* ---------- 抽取异能：先按权重抽异能天赋，再从对应组抽 1 个 ----------
     * 玩家等级 lv 奖励：天赋 5-10 级整体概率 +lv×0.1 个百分点（如 lv1：20%→20.1%），
     * 增量按各级原比例分配，其余等级仍按原比例 */
    /* 成就加成（百分点）：各达成成就 bonus 累加，叠加到高阶异能抽取概率 */
    var _achBonus = 0;
    function setAchBonus(pct) { _achBonus = pct || 0; }

    /* 抽取异能：高阶 = 天赋 6-10。玩家等级 lv 奖励：高阶异能整体概率 +lv×0.1 个百分点 */
    function drawAbility(playerLv, forceInnate10) {
      var lv = Math.max(0, playerLv || 0);
      if (forceInnate10) {   /* 保底触发：必定 EX 天赋（天赋10，在其组内随机异能） */
        var g10 = theme.ABILITY_POOL[10];
        return { innate: 10, ability: g10[Math.floor(Math.random() * g10.length)] };
      }
      var base = theme.INNATE_WEIGHTS;
      var s15 = 0, s610 = 0, i;
      for (i = 1; i <= 5; i++) s15 += base[i];
      for (i = 6; i <= 10; i++) s610 += base[i];
      var pOld = s610 / (s15 + s610);
      var pNew = pOld + lv * 0.001 + _achBonus / 100;   /* +玩家等级 与 成就增益 */
      var x610 = (s15 * pNew) / (1 - pNew);       /* 高阶（6-10）新权重合计 */
      var w = base.slice();
      for (i = 6; i <= 10; i++) w[i] = base[i] * (x610 / s610);
      var total = 0; for (i = 1; i <= 10; i++) total += w[i];
      /* 保底档：玩家达到 ≥25/≥75 级时，抽到低于保底档的天赋（如 1/2 档）重抽，给玩家减负 */
      var minInnate = (theme.guardInfo && theme.guardInfo(lv).min) || 1;
      var innate = 1, tries;
      for (tries = 0; tries < 60; tries++) {
        var r2 = Math.random() * total, acc2 = 0, cand = 1;
        for (i = 1; i <= 10; i++) { acc2 += w[i]; if (r2 < acc2) { cand = i; break; } }
        if (cand >= minInnate) { innate = cand; break; }
        innate = cand;   /* 抽到低于保底档：记录后下一轮重抽 */
      }
      if (innate < minInnate) innate = minInnate;   /* 兜底：极端随机也强制至少到保底档 */
      var group = theme.ABILITY_POOL[innate];
      return { innate: innate, ability: group[Math.floor(Math.random() * group.length)] };
    }

    /* ---------- 突破概率表：查 theme.BREAK_CHANCE 二维数组（百分比，可 >100%） ----------
     * 段：1-10 / 11-20 / 21-30 / 31-40 / 41-50 / 51-60 / 61-70 / 71-80 / 81-90 / 91-95 / 96-98 / 99 */
    function breakChance(aptitude, lvl) {
      var seg;
      if (lvl >= 99) seg = 11;
      else if (lvl >= 96) seg = 10;
      else if (lvl >= 91) seg = 9;
      else if (lvl >= 81) seg = 8;
      else if (lvl >= 71) seg = 7;
      else if (lvl >= 61) seg = 6;
      else if (lvl >= 51) seg = 5;
      else if (lvl >= 41) seg = 4;
      else if (lvl >= 31) seg = 3;
      else if (lvl >= 21) seg = 2;
      else if (lvl >= 11) seg = 1;
      else seg = 0;
      return theme.BREAK_CHANCE[aptitude - 1][seg] / 100;
    }

    /* 某年突破判定：若概率 >30% 允许连破（每次概率 /2，直到 ≤30% 停止）
     * 连破每次重新取「该级所在阶级」的基础概率再递减 */
    /* 突破年龄系数：6-12岁×1.2；12-18岁×1.1；18~0.9×寿命×1.0；>0.9×寿命×0.95 */
    function breakAgeCoef(g) {
      if (g.age <= 12) return 1.2;
      if (g.age <= 18) return 1.1;
      if (g.age > g.lifespan * 0.9) return 0.95;
      return 1.0;
    }
    /* 觉醒技能：达到 10/20/..90 级触发，按当前战力取 theme.SKILL_TIER 档位
     * （D~S，各自战力区间 + 加成上下限），战力加成后直接突破到下一阶（+1 级） */
    function awakenSkill(g, log) {
      var tier = theme.selectSkill(g.combat, g.lvl / 10);
      var peak = g.lvl;
      var add = irand(tier.addLo, tier.addHi);
      g.combat += add;
      /* 主题钩子：获取具体斗技名称（如"焰分噬浪尺"），替换日志中的档位名 */
      var skillDisplayName = tier.name;
      if (theme.hooks && theme.hooks.onAwakenSkill) {
        var nm = theme.hooks.onAwakenSkill(g, tier.name, add);
        if (nm) skillDisplayName = nm + '（' + tier.name + '阶）';
      }
      if (log) log.push({ cls: 'skill', text: theme.terms.awakenSkill(peak, skillDisplayName, add) });
      if (!g.skillSeq) g.skillSeq = [];
      g.skillSeq.push(tier.name);   /* 记录本局觉醒的技能档级（D/C/B/A/S，UI 展示） */
      var r = levelUp(g);   /* 觉醒技能后直接突破到下一阶 */
      if (log && r) log.push({ cls: 'brk', text: r.text });
      return maybeAbsorbSecondWuhun(g, log);
    }

    /* 双生武魂：第一武魂完成九环后，第二武魂随高等级突破逐枚吸收魂环。 */
    function maybeAbsorbSecondWuhun(g, log) {
      if (!theme.hooks || !theme.hooks.onSecondWuhunRing) return false;
      var result = theme.hooks.onSecondWuhunRing(g);
      if (!result) return false;
      if (log && result.text) log.push({ cls: result.dead ? 'dead' : 'skill', text: result.text });
      if (result.dead) {
        g.dead = true;
        return true;
      }
      return false;
    }
    function attemptBreak(g) {
      if (g.lvl >= 99) return 0;
      if (g.lvl % 10 === 0) return 0;   /* 10/20/..90 级：由觉醒技能升级，不走正常突破 */
      var coef = breakAgeCoef(g);
      var th = (g.lvl % 10 === 9) ? 0.5 : 1;   /* 关口（9/19/..89）突破概率暂时性 /2 */
      /* 年轻+低天赋加速：普通人（天赋1-3）前半生突破概率提升，贴合原著普通人成长节奏 */
      var youthBonus = 0;
      if (g.aptitude <= 3 && g.age <= 25) {
        youthBonus = Math.max(0, (25 - g.age) * 0.01 * (4 - g.aptitude));  /* 天赋1：最高+9% */
      }
      var base = breakChance(g.aptitude, g.lvl) * coef * th + youthBonus;
      if (base <= 0.25 + 1e-9) {
        /* 基础概率 ≤25%：单次判定，不连破 */
        return Math.random() < base ? 1 : 0;
      }
      /* 基础概率 >25%：连破。每次按「该级所属阶级」的基础概率 ×0.72^(step) 递减（折损28%），≤25% 停 */
      var gained = 0, step = 0;
      while (true) {
        var lvl = g.lvl + gained;
        if (lvl >= 99) break;
        if (lvl % 10 === 0) break;              /* 升到 10/20/..90 级：连破停止，由觉醒技能升级 */
        var b = breakChance(g.aptitude, lvl) * coef * ((lvl % 10 === 9) ? 0.5 : 1);
        if (b <= 0.25 + 1e-9) break;              /* 连破跨入基础 ≤25% 的阶级，停止 */
        var p = b * Math.pow(0.72, step);          /* 第 step 次连破判定（step 从 0 起，折损 28%） */
        if (p <= 0.25 + 1e-9) break;               /* 递减后 ≤25% 停止 */
        if (Math.random() < p) { gained++; step++; }
        else break;
      }
      return gained;
    }

    /* ---------- 突破收益：等级越高、天赋档越高加得越多，且每级随机波动明显（±40%） ---------- */
    function combatGain(aptitude, newLvl) {
      var c = theme.COMBAT_COEF[aptitude];
      if (newLvl >= 90 && newLvl <= 98) return round(c * (newLvl * 0.6 + rand(-newLvl * 0.4, newLvl * 0.4) + 20));
      if (newLvl >= 99) return round(c * (newLvl * 1.2 + rand(-200, 200) + 200));
      return round(c * (newLvl * 0.6 + rand(-newLvl * 0.4, newLvl * 0.4) + 6));
    }
    /* 突破后寿命奖励（按当前寿命比例增长，但上限严格控制避免后期过长） */
    function lifespanGain(newLvl, curLifespan) {
      var cl = curLifespan || 100;
      if (newLvl === 99) return Math.max(150, Math.round(cl * 0.4));
      /* 按当前寿命比例计算增量，硬上限防止后期寿命爆炸 */
      var base;
      if (newLvl >= 96) base = Math.round(cl * 0.025);
      else if (newLvl >= 91) base = Math.round(cl * 0.02);
      else if (newLvl >= 86) base = Math.round(cl * 0.018);
      else if (newLvl >= 76) base = Math.round(cl * 0.015);
      else if (newLvl >= 66) base = Math.round(cl * 0.012);
      else if (newLvl >= 55) base = Math.round(cl * 0.01);
      else if (newLvl >= 41) base = Math.round(cl * 0.008);
      else if (newLvl >= 21) base = Math.round(cl * 0.006);
      else base = Math.round(cl * 0.005);
      /* 硬上限：单次不超过 0.03×寿命，防止指数爆炸 */
      return Math.max(1, Math.min(base, Math.round(cl * 0.03)));
    }

    /* ---------- 随机事件战力增益 helper（按当前战力比例，后期事件才有效果） ----------
     * evCombat(g, minPct, maxPct, floor)：加战力 = 当前战力 × (minPct~maxPct)，保底 floor */
    function evCombat(g, minPct, maxPct, floor) {
      var v = g.combat * rand(minPct, maxPct);
      if (v < (floor || 0)) v = floor || 0;
      return round(v);
    }


    /* 升级方法：升 1 级自动判定战力/寿命增益（combatGain + lifespanGain）；
     * 已满级（99）后不再升等级，改为「等级抵达巅峰后有所领悟，战力 +10000（1级=1w战力）」。
     * 返回 { text, combat, life, peak } */
    function levelUp(g) {
      if (g.lvl >= theme.terms.peakLv) {
        g.combat += 10000;
        return { text: theme.terms.peakLevelUp(), combat: 10000, life: 0, peak: true };
      }
      var nl = g.lvl + 1;
      var cg = combatGain(g.aptitude, nl);
      var lg = lifespanGain(nl, g.lifespan);
      g.lvl = nl; g.combat += cg; g.lifespan += lg;
      return { text: theme.terms.levelUp(nl - 1, nl, cg, lg), combat: cg, life: lg };
    }

    /* 事件连续升级：每升 1 级单独输出一行（与突破连破一致，日志不省略、不合并）；
     * 机缘升到大境界顶（10/20/..90）时同样触发领悟技能直升（与修炼突破一致，不因走机缘而跳过）；
     * 99 级后每级 +10000 战力单独一行。返回累计 { up, combat, life } */
    function gainLevels(g, n, log) {
      var up = 0, ct = 0, life = 0;
      for (var k = 0; k < n; k++) {
        var r = levelUp(g);
        up++; ct += r.combat; life += r.life;
        if (log) log.push({ cls: 'brk', text: r.text });
        if (g.lvl % 10 === 0 && g.lvl < theme.terms.peakLv) {
          if (awakenSkill(g, log)) break;
        } else if (maybeAbsorbSecondWuhun(g, log)) {
          break;
        }
      }
      return { up: up, combat: ct, life: life };
    }

    /* 事件打印：事件内部直接调用 U.printlog('结果文本') 打印「第X岁，遇到事件名，结果文本」，
     * 让事件自行控制打印与升级的相对顺序（先打印机缘，再升级） */
    var _curEv = null;
    function printlog(text) {
      if (!_curEv) return;
      _curEv.printed = true;
      if (_curEv.log) _curEv.log.push({ cls: 'ev' + _curEv.ev.tier, text: (function(){ var _pfx = ['','','']; var _t = _curEv.ev.tier || 2;
        if (_t >= 4) { _pfx = ['✨ ', '⚡ ', '🌟 ']; }
        else if (_t >= 3) { _pfx = ['💫 ', '🔥 ', '⚔️ ']; }
        else if (_t >= 2) { _pfx = ['📖 ', '🎯 ', '🔮 ']; }
        else { _pfx = ['📜 ', '🗺️ ', '🏠 ']; }
        var _i = Math.floor(Math.random() * 3);
        return '第' + _curEv.g.age + '岁，' + _pfx[_i] + _curEv.ev.name + '——' + text;
      })() });
    }

    /* 双生异能觉醒：按天赋 7-10 档异能权重（INNATE_WEIGHTS：7=4 / 8=3 / 9=2 / 10=1）抽取，
     * 替换异能/天赋档，返回新异能信息 */
    function drawHighAbility(g) {
      var wsum = 0, i;
      for (i = 7; i <= 10; i++) wsum += theme.INNATE_WEIGHTS[i];
      var r = Math.random() * wsum, acc = 0, ni = 7;
      for (i = 7; i <= 10; i++) { acc += theme.INNATE_WEIGHTS[i]; if (r < acc) { ni = i; break; } }
      var grp = theme.ABILITY_POOL[ni];
      var nw = grp[Math.floor(Math.random() * grp.length)];
      g.ability = nw; g.innate = ni; g.aptitude = ni;
      g.gotTwin = true;   /* 成就：双生异能 */
      return { innate: ni, ability: nw };
    }

    /* 注入给事件文件（events.js / 各主题 EVENTS）的工具对象，供创作者扩展事件时使用 */
    var U = {
      rand: rand, irand: irand, round: round,
      combatGain: combatGain, lifespanGain: lifespanGain,
      gainLevels: gainLevels, levelUp: levelUp, evCombat: evCombat, breakChance: breakChance,
      drawHighAbility: drawHighAbility,
      choosePath: choosePath,
      setFlag: setFlag,
      printlog: printlog,
      testLv: testLv, testCombat: testCombat,
      DATA: theme     /* 事件访问 U.DATA.tierName 等 → theme.tierName */
    };

    function choosePath(g, alignment, tag, reputation, faction) {
      if (alignment) g.alignment = alignment;
      if (tag) {
        if (!g.pathTags) g.pathTags = [];
        if (g.pathTags.indexOf(tag) < 0) g.pathTags.push(tag);
      }
      if (reputation) g.reputation = (g.reputation || 0) + reputation;
      if (faction) g.faction = faction;
      g.routePower = (g.routePower || 0) + Math.max(0, Math.abs(reputation || 0)) * 0.01;
    }
    function setFlag(g, key, value) {
      if (!g.storyFlags) g.storyFlags = {};
      g.storyFlags[key] = value === undefined ? true : value;
      if (key === 'routeReady') g.routeReady = g.storyFlags[key];
    }

    /* testLv/testCombat 模拟中置 true，跳过会递归调用测试的死疫禁区（deadzone） */
    var _testMode = false;

    /* ---------- 抽 1 个随机事件执行 ----------
     * 先按事件年龄上下限（minAge/maxAge，默认 0/10000）过滤可选池，再从池内按 weight 抽取 */
    function rollEvent(g, log) {
      if (g.pendingEvent) return g.pendingEvent;
      var E = theme.EVENTS;
      var pool = [], i, mc = g.maxCount || (g.maxCount = {});
      for (i = 0; i < E.length; i++) {
        var evi = E[i];
        if (_testMode && evi.id === 'deadzone') continue;   /* 测试模拟中跳过死决之地（避免 test 递归） */
        var maxN = evi.maxCount != null ? evi.maxCount : 100;
        var left = mc[evi.id] != null ? mc[evi.id] : maxN;
        if (left <= 0) continue;                          /* 次数耗尽，不加入候选池 */
        var minA = evi.minAge != null ? evi.minAge : 0;
        var maxA = evi.maxAge != null ? evi.maxAge : 10000;
        if (g.age >= minA && g.age <= maxA) pool.push(evi);
      }
      if (!pool.length) return;
      var total = 0;
      for (i = 0; i < pool.length; i++) total += (pool[i].weight != null ? pool[i].weight : 1);
      var r = Math.random() * total, acc = 0, ev = pool[0];
      for (i = 0; i < pool.length; i++) { acc += (pool[i].weight != null ? pool[i].weight : 1); if (r < acc) { ev = pool[i]; break; } }
      /* 被抽中：剩余次数 -1 */
      var maxN2 = ev.maxCount != null ? ev.maxCount : 100;
      mc[ev.id] = (mc[ev.id] != null ? mc[ev.id] : maxN2) - 1;
      var text = null;
      var prevCur = _curEv;
      _curEv = { ev: ev, g: g, log: log, printed: false };
      if (!ev.cond || ev.cond(g, U)) {
        if (ev.choices && ev.choices.length) {
          var publicChoices = [];
          for (var ci = 0; ci < ev.choices.length; ci++) {
            var choice = ev.choices[ci];
            var available = !choice.condition || choice.condition(g, U);
            publicChoices.push({
              id: choice.id,
              label: choice.label,
              detail: choice.detail || '',
              available: available,
              risk: choice.risk || ''
            });
          }
          var hasChoice = false;
          for (var hi = 0; hi < publicChoices.length; hi++) if (publicChoices[hi].available) { hasChoice = true; break; }
          if (hasChoice) {
            g.pendingEvent = {
              id: ev.id,
              name: ev.name,
              tier: ev.tier || 2,
              desc: ev.desc || '',
              choices: publicChoices
            };
            printlog(ev.desc || '命运在此刻分岔，选择你的道路。');
          } else if (ev.fail) {
            text = ev.fail(g, U, log);
          }
        } else if (ev.ok) text = ev.ok(g, U, log);
      } else {
        if (ev.fail) text = ev.fail(g, U, log);
      }
      /* 事件内部用 U.printlog 打印「遇到事件」；未改用 printlog 的旧事件仍可用 return 文本兜底 */
      if (text && !_curEv.printed) printlog(text);
      _curEv = prevCur;   /* 恢复外层 _curEv：cond 里的 testCombat 模拟局会覆盖/清空 _curEv，不恢复则本事件的 printlog 失效 */
      return g.pendingEvent || null;
    }

    function chooseEvent(g, choiceId, log) {
      if (!g || !g.pendingEvent) return { ok: false, reason: 'no_pending_event', log: log || [] };
      var pending = g.pendingEvent;
      var ev = null, i;
      for (i = 0; i < theme.EVENTS.length; i++) if (theme.EVENTS[i].id === pending.id) { ev = theme.EVENTS[i]; break; }
      if (!ev || !ev.choices) return { ok: false, reason: 'event_not_found', log: log || [] };
      var choice = null;
      for (i = 0; i < ev.choices.length; i++) if (ev.choices[i].id === choiceId) { choice = ev.choices[i]; break; }
      if (!choice || (choice.condition && !choice.condition(g, U))) return { ok: false, reason: 'choice_unavailable', log: log || [] };
      var out = log || [];
      g.pendingEvent = null;
      if (!g.choiceHistory) g.choiceHistory = [];
      g.choiceHistory.push({ event: ev.id, choice: choice.id, age: g.age });
      var prevCur = _curEv;
      _curEv = { ev: ev, g: g, log: out, printed: false };
      var text = choice.apply ? choice.apply(g, U, out) : null;
      if (text && !_curEv.printed) printlog(text);
      _curEv = prevCur;
      return { ok: true, choice: choice.id, log: out, event: ev.id };
    }

    /* ---------- 工具：模拟某天赋档修炼到指定岁数的 top X% 分位数值 ----------
     * testLv(innate, age, n, X) 返回等级；testCombat 返回战力。
     * 模拟 n 次，取排序后第 (100-X)% 分位（X=10 → 前 10% 的数值）。可在事件表中使用。 */
    function testPercentile(innate, age, n, X, key) {
      var vals = [];
      _testMode = true;
      for (var i = 0; i < n; i++) {
        var g = createGame(0);
        g.innate = innate; g.aptitude = innate;
        var g0 = 0;
        while (!g.dead && !g.ascended && g.age < age && g0 < 10000) { g0++; rollYear(g); }
        vals.push(g[key]);
      }
      _testMode = false;
      vals.sort(function (a, b) { return a - b; });
      var p = 1 - X / 100;
      var idx = Math.min(vals.length - 1, Math.max(0, Math.floor(vals.length * p)));
      return vals[idx];
    }
    function testLv(innate, age, n, X) { return testPercentile(innate, age, n, X, 'lvl'); }
    function testCombat(innate, age, n, X) { return testPercentile(innate, age, n, X, 'combat'); }

    /* ---------- 强行进化成功率：看战力，越高越容易 ----------
     * 强行进化与寿命无关（不扣寿命），仅在寿命将尽时一次性尝试，失败即陨落 */
    /* 默认战力阈值：<5w=2%；5w→20w 线性 2%→8%；20w→100w 线性 8%→15%；100w→1000w 线性 15%→20%；≥1000w 封顶 20%。
     * 不设"必过"档——强行进化始终高风险。主题可通过 theme.hooks.forcedChance 覆写。 */
    function forcedChance(combat, g) {
      if (theme.hooks && theme.hooks.forcedChance) {
        var r = theme.hooks.forcedChance(combat, U, g);
        if (r >= 0) return r;   /* 钩子返回>=0 表示自行处理 */
      }
      var base;
      if (combat >= 1000000) base = 0.25;            /* 100w+ 战力：封顶 25% */
      else if (combat < 50000) base = 0.02;          /* <5w：2% */
      else if (combat < 200000) {                   /* 5w→20w：2% → 10% 线性 */
        var t = (combat - 50000) / 150000;
        base = 0.02 + t * (0.10 - 0.02);
      } else if (combat < 1000000) {                /* 20w→100w：10% → 18% 线性 */
        var t2 = (combat - 200000) / 800000;
        base = 0.10 + t2 * (0.18 - 0.10);
      } else {                                       /* 100w→1000w：18% → 25% 线性 */
        var t3 = (combat - 1000000) / 9000000;
        base = 0.18 + t3 * (0.25 - 0.18);
      }
      /* 金词条"超进化血脉"：强行进化概率 ×1.5（上限 30%） */
      if (g && g.forcedBoost) base = Math.min(0.30, base * 1.5);
      return base;
    }

    /* 超生命体战力 = (100w 进化奖励 + 原基础战力) × 战力增幅倍率 rate；
     * rate 为基因源质的战力增幅倍率；无源质（强行进化/进化本源）rate 恒为 1 */
    function godCombat(combat, rate) {
      if (rate == null) rate = 1;
      return round((1000000 + combat) * rate);
    }

    /* ---------- 超生命体判定（99 级且剩余寿命≤10 年时尝试） ----------
     * 主题钩子 onAscendCheck(g, log, U)：在炼化/强行进化前注入主题专属加成（如斗破异火影响炼化门槛/倍率）。
     * 炼化失败时的战力增幅：战力 × 源质倍率 × 达标比例 × 0.1 */
    function refineBoost(combat, rate, needCombat) {
      return round(combat * rate * (combat / needCombat) * 0.1);
    }
    function tryAscend(g, log) {
      /* 主题钩子：注入主题专属加成（如斗破异火提升源质 rate / 降低 needCombat） */
      if (theme.hooks && theme.hooks.onAscendCheck) theme.hooks.onAscendCheck(g, log, U);

      if (theme.hooks && theme.hooks.tryRouteAscend) {
        var routeHandled = theme.hooks.tryRouteAscend(g, log, U, { godCombat: godCombat });
        if (routeHandled) {
          if (!g._godName) {
            g._godName = g.emperorName || g.godName || g.immortalName;
            if (!g._godName && theme.generateName) g._godName = theme.generateName(g);
            if (!g._godName) g._godName = theme.terms.ascend || '';
          }
          return true;
        }
      }

      /* ★ 主题专属突破路径（优先判定，如斗破陀舍古帝传承/本源魂气，斗罗神考/信仰）
       * 钩子返回 true 表示已处理突破（成功或失败），跳过默认 refine/forced 逻辑 */
      if (theme.hooks && theme.hooks.tryAscendPath) {
        var handled = theme.hooks.tryAscendPath(g, log, U, { forcedChance: forcedChance, godCombat: godCombat });
        if (handled) {
          if (!g._godName) {
            g._godName = g.emperorName || g.godName || g.immortalName;
            if (!g._godName && theme.generateName) g._godName = theme.generateName(g);
            if (!g._godName) g._godName = theme.terms.ascend || "";
          }
          return true;
        }
      }

      var es = g.essence.length > 0 ? g.essence[0] : null;   /* 基因源质最多 1 种 */
      var rate = es ? es.rate : 1;                       /* 炼化成功才用源质 rate */
      if (es && (g.refineAttempts || 0) < 2) {           /* 源质炼化最多尝试 2 次 */
        g.refineAttempts = (g.refineAttempts || 0) + 1;
        /* 炼化成功率 = 战力达标比例 × 12%（每尝试递减，首次12%→末次约6%） */
        var combatRatio = Math.min(1, g.combat / es.needCombat);
        var refineSuccessRate = combatRatio * ((0.12 + (g.ascendBonus || 0)) - (g.refineAttempts - 1) * 0.015);
        if (g.combat >= es.needCombat && Math.random() < refineSuccessRate) {
          g.ascendMode = 'refine';
          /* 生成飞升名号 */
          var _lbl = theme.terms.ascend || '神';
          var _nm = g.emperorName || g.godName || g.immortalName;
          if (!_nm && theme.generateName) _nm = theme.generateName(g);
          if (!_nm) _nm = _lbl;
          log.push({ cls: 'god', text: theme.terms.refineSuccess(g.age, _nm) });
          g.ascended = true; g.lvl = theme.terms.godLevel;
          g._godName = _nm;
          g.combat = godCombat(g.combat, rate); g.lifespan = 99999;
          return true;
        }
        g.refineFail = true;   /* 结算页据此提示「炼化失败」；不暴露具体门槛数值 */
        /* 炼化失败：仍以战力×源质倍率×达标比例×0.1 增幅基因 */
        var essenceBoost = refineBoost(g.combat, es.rate, es.needCombat);
        g.combat += essenceBoost;
        log.push({ cls: 'ev3', text: theme.terms.refineFail(g.age, essenceBoost) });
      }
      /* 只有寿命将尽（剩余≤20年）时才尝试强行进化，失败则陨落 */
      var lifeDanger = (g.lifespan - g.age) <= 20;
      if (lifeDanger && Math.random() < forcedChance(g.combat, g)) {
        g.ascendMode = 'forced';
        /* 生成飞升名号 */
        var _lbl2 = theme.terms.ascend || '神';
        var _nm2 = g.emperorName || g.godName || g.immortalName;
        if (!_nm2 && theme.generateName) _nm2 = theme.generateName(g);
        if (!_nm2) _nm2 = _lbl2;
        log.push({ cls: 'god', text: theme.terms.forcedAscend(g.age, _nm2) });
        g.ascended = true; g.lvl = theme.terms.godLevel;
        g._godName = _nm2;
        var dRate = theme.FORCED_BONUS_MIN + Math.random() * (theme.FORCED_BONUS_MAX - theme.FORCED_BONUS_MIN);
        g.combat = godCombat(g.combat, dRate); g.lifespan = 99999;
        return true;
      }
      if (lifeDanger) {
        g.dead = true;
        g.ascendMode = 'fail';
        log.push({ cls: 'dead', text: theme.terms.forcedFail(g.age) });
        return true;
      }
      /* 寿命充裕时源质炼化失败不致死，角色继续修炼等待下次尝试 */
      return false;
    }

    /* 初始战力：觉醒基础（天赋档×1~10）+ 从1级修炼到天赋档级逐级突破累计战力 */
    function initialCombat(innate) {
      var c = irand(innate, innate * 10);
      for (var L = 2; L <= innate; L++) c += combatGain(innate, L);   /* 突破到第 L 级的战力 */
      return c;
    }

    /* ---------- 初始化一局 ---------- */
    function createGame(playerLv, opts) {
      var w = drawAbility(playerLv, !!(opts && opts.force10));   /* 保底积分满 100 → 必定 EX 天赋 */
      var g = {
        innate: w.innate,        /* 天赋档 1-10（F→EX）：固定，不增加 */
        aptitude: w.innate,      /* 天赋档数值：初始 = 天赋档，可被机缘事件提升，上限 10 */
        ability: w.ability,
        lvl: w.innate,            /* 初始等级 = 天赋档（天赋 N 档开局即 N 级） */
        combat: initialCombat(w.innate),
        lifespan: irand(theme.LIFE_MIN + w.innate, theme.LIFE_MAX + w.innate),
        age: 6,
        year: 0,
        essence: [],
        maxCount: {},   /* 各事件本局剩余触发次数 */
        skillSeq: [],    /* 本局领悟的技能档级序列 */
        ascended: false,
        dead: false,
        alignment: 'neutral',
        pathTags: [],
        reputation: 0,
        faction: '独行者',
        routePower: 0,
        storyFlags: {},
        choiceHistory: [],
        pendingEvent: null
      };
      /* 注入主题专属初始状态（如斗破 g.fires） */
      var is = theme.initialState || {}, k;
      for (k in is) g[k] = (typeof is[k] === 'object' && is[k] !== null && is[k].slice ? is[k].slice() : (typeof is[k] === 'object' ? JSON.parse(JSON.stringify(is[k])) : is[k]));
      return g;
    }

    /* ---------- 过一年，返回今年日志条目 ----------
     * 每年固定一条「第X岁，修炼」；突破则替换该行；事件/奇遇/超生命体进化/死亡单独成行 */
    function rollYear(g) {
      var log = [];
      if (g.pendingEvent) return log;
      g.year++;
      g.age++;
      log.push({ cls: 'year', text: theme.terms.yearFor ? theme.terms.yearFor(g) : theme.terms.year(g.age) });

      /* 特殊事件：进化本源（亿分之一）无视条件直接进化为超生命体 */
      if (Math.random() < theme.ORIGIN_CHANCE) {
        log.push({ cls: 'rainbow', text: theme.terms.origin(g.age) });
        g.ascendMode = 'origin';
        g.ascended = true; g.lvl = theme.terms.godLevel;
        var _originLabel = theme.terms.ascend || '超生命体';
        var _originNm = g.emperorName || g.godName || g.immortalName;
        if (!_originNm && theme.generateName) _originNm = theme.generateName(g);
        g._godName = _originNm || _originLabel;
        g.combat = godCombat(g.combat, theme.ORIGIN_BONUS);
        g.lifespan = 99999;
        return log;
      }
      /* 特殊事件：基因突变（千万分之一）天赋提升到满 + 寿命+50 */
      if (Math.random() < theme.XIJING_CHANCE) {
        g.aptitude = 10;
        g.lifespan += 50;
        g.gotMutation = true;   /* 成就：基因突变 */
        log.push({ cls: 'red', text: theme.terms.mutation(g.age) });
      }

      /* 达到 90 级后每年概率获得基因源质：最多获得 1 种，获得后不再获得第二种；
       * 获得源质时战力同步增加 rand(5000, 该源质 needCombat×5%)，并升 rand(1,3) 级（不超过 99 级）；
       * 达到 99 级后获得概率 ×1.25 */
      var peakLv = theme.terms.peakLv;
      if (g.lvl >= 90 && g.essence.length < 1 && Math.random() < (g.lvl >= peakLv ? theme.ESSENCE_CHANCE * 1.25 : theme.ESSENCE_CHANCE)) {
        var got = theme.ESSENCE[Math.floor(Math.random() * theme.ESSENCE.length)];
        g.essence.push(got);
        var essenceGain = irand(5000, Math.round(got.needCombat * 0.05));
        g.combat += essenceGain;
        log.push({ cls: 'red', text: theme.terms.getEssence(g.age, got.name, essenceGain) });
        var ups = Math.min(irand(1, 3), peakLv - g.lvl);
        for (var upi = 0; upi < ups; upi++) {
          var ur = levelUp(g);
          if (ur && ur.text) log.push({ cls: 'brk', text: ur.text });
          if (maybeAbsorbSecondWuhun(g, log)) return log;
        }
      }

      /* 修炼突破 */
      if (g.lvl < peakLv) {
        var gained = attemptBreak(g);
        if (gained > 0) {
          log[0] = { cls: 'brk', text: theme.terms.breakSuccess(g.age) };
          for (var k = 0; k < gained; k++) {
            var r = levelUp(g);
            log.push({ cls: 'brk', text: r.text });
            if (maybeAbsorbSecondWuhun(g, log)) break;
            if (k + 1 < gained && g.lvl < peakLv) log.push({ cls: 'brk', text: theme.terms.combo(g.age) });
            if (g.lvl >= peakLv) break;
          }
        } else if (g.lvl % 10 !== 0) {
          /* 未突破且不在大境界顶：普通修炼战力微增（10/20/..90 由领悟技能处理） */
          var gcv = evCombat(g, 0.0005, 0.001, irand(1, 5));
          g.combat += gcv;
          log[0] = { cls: 'year', text: theme.terms.yearCombat(g.age, gcv) };
        }
        /* 达到 10/20/..90（大境界顶，含初始/突破后）：领悟技能，直接突破到下一阶（+1级） */
        if (g.lvl % 10 === 0 && g.lvl < peakLv && awakenSkill(g, log)) return log;
      }

      if (g.dead) return log;

      /* 达到巅峰等级：立即尝试飞升，失败则游戏结束 */
      if (g.lvl >= peakLv && !g.ascended && theme.ascend) {
        var ascended = tryAscend(g, log);
        if (!ascended && !g.dead) {
          g.ascended = true; g.lvl = theme.terms.godLevel || 100;
          g.combat = godCombat(g.combat, 1.0); g.lifespan = 99999;
          /* 生成飞升名号 */
          var godLabel = theme.terms.ascend || '神';
          if (theme.generateName) { g._godName = theme.generateName(g); }
          else if (g.emperorName) { g._godName = g.emperorName; }
          else if (g.godName) { g._godName = g.godName; }
          else if (g.immortalName) { g._godName = g.immortalName; }
          else { g._godName = godLabel; }
          log.push({ cls: 'god', text: '成功晋入' + godLabel + '阶别，飞升' + godLabel + '，' + (godLabel === '斗帝' ? '帝名' : godLabel === '仙帝' ? '仙帝名' : '神位') + '：' + g._godName + '！' });
        }
        return log;
      }

      /* 90级+ 每年有概率尝试进化；剩余寿命<=20年时必定尝试 */
      if (g.lvl >= 90 && !g.ascended) {
        var tryAscendChance = (g.lifespan - g.age) <= 20 ? 0.15 : 0.015;
        if (Math.random() < tryAscendChance) {
          var ascended = tryAscend(g, log);
          if (ascended) return log;   /* 成功/失败致死 都结束本局 */
        }
      }

      /* 寿命判定放在突破/进化之后：先结算突破（突破会加寿命），寿命将尽那年仍可突破/进化 */
      if (g.age > g.lifespan) {
        g.dead = true;
        log.push({ cls: 'dead', text: theme.terms.death(g.age) });
        return log;
      }

      /* 普通随机事件 */
      if (!g.ascended && Math.random() < theme.EVENT_CHANCE) rollEvent(g, log);

      /* 统计模拟没有用户界面：用第一个可用选项继续推进，确保概率测试不会卡在待决策状态。 */
      if (_testMode && g.pendingEvent) {
        var autoChoice = null;
        for (var aci = 0; aci < g.pendingEvent.choices.length; aci++) {
          if (g.pendingEvent.choices[aci].available) { autoChoice = g.pendingEvent.choices[aci].id; break; }
        }
        if (autoChoice) chooseEvent(g, autoChoice, log);
      }

      /* 有待决策事件时暂停在当前年份，避免自动模式越过玩家选择。 */
      if (g.pendingEvent) return log;

      if (g.dead) return log;

      /* 主题每年额外逻辑钩子（如斗破异火暴动等） */
      if (theme.hooks && theme.hooks.onYear) theme.hooks.onYear(g, log, U);

      if (g.age > g.lifespan) {
        g.dead = true;
        log.push({ cls: 'dead', text: theme.terms.deathEvent(g.age) });
      }
      return log;
    }

    return {
      drawAbility: drawAbility,
      setAchBonus: setAchBonus,
      breakChance: breakChance,
      attemptBreak: attemptBreak,
      combatGain: combatGain,
      lifespanGain: lifespanGain,
      forcedChance: forcedChance,
      refineBoost: refineBoost,
      godCombat: godCombat,
      gainLevels: gainLevels,
      levelUp: levelUp,
      testLv: testLv, testCombat: testCombat,
      initialCombat: initialCombat,
      createGame: createGame,
      rollYear: rollYear,
      tryAscend: tryAscend,
      chooseEvent: chooseEvent,
      EVENTS: theme.EVENTS,
      theme: theme
    };
  }

  Sim.createEngine = createEngine;

  /* UMD 导出 */
  if (typeof module !== 'undefined' && module.exports) module.exports = Sim;
  root.Sim = Sim;
})(typeof self !== 'undefined' ? self : this);
