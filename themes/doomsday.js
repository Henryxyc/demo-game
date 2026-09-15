/* ============================================================
 * 主题包 · 末日模拟器（doomsday）
 * 封装现有 data.js / ability.js / events.js 内容 + 术语映射 terms
 * 作为其他主题（斗罗/斗破/完美）的结构范本。回归要求：玩法/文案不变。
 * ============================================================
 * terms 设计：
 *   - 标签词：属性卡 / 结算页 / 首页的主题特定词汇
 *   - 模板函数：sim.js 内 rollYear/tryAscend/levelUp/awakenSkill 日志文案
 *   末日主题的模板函数返回值与原硬编码字符串完全一致，保证回归。
 * ============================================================ */
(function (root) {
  var D = root.DATA, W = root.ABILITY, E = root.EVENTS;

  var terms = {
    /* ---------- 标签词 ---------- */
    simulatorName: '末日模拟器',
    ability: '异能',
    abilityTalent: '异能天赋',
    combat: '战力',
    level: '等级',
    lifespan: '寿命',
    skill: '技能',
    skillTier: '技能档',
    essence: '基因源质',
    essenceShort: '源质',
    ascend: '超生命体',
    ascendVerb: '进化为超生命体',
    cultivateVerb: '修炼',
    breakVerb: '突破',
    ageUnit: '岁',
    innateTiers: D.TIER_NAME,            /* ['', 'F','E','D','C','B','A','S','SS','SSS','EX'] */
    peakLv: 99,
    godLevel: 100,

    /* ---------- rollYear / tryAscend 日志模板函数 ---------- */
    /* 每年开篇「第X岁，修炼」 */
    year: function (age) { return '第' + age + '岁，修炼'; },
    /* 突破成功头行 */
    breakSuccess: function (age) { return '第' + age + '岁，修炼，成功突破！'; },
    /* 连破头行 */
    combo: function (age) { return '第' + age + '岁，修炼，连破！'; },
    /* 普通修炼年战力微增 */
    yearCombat: function (age, gain) { return '第' + age + '岁，修炼，战力+' + gain; },
    /* 寿命耗尽自然死亡 */
    death: function (age) { return '第' + age + '岁，寿命耗尽，与世长辞'; },
    /* 寿命将尽时遭遇变故暴毙 */
    deathEvent: function (age) { return '第' + age + '岁，寿命将尽时遭遇变故，不幸暴毙'; },
    /* 基因突变（千万分之一） */
    mutation: function (age) { return '第' + age + '岁，基因突变！天赋跃升至极阶 EX，寿命+50'; },
    /* 进化本源（亿分之一） */
    origin: function (age) { return '第' + age + '岁，获得进化本源，直接进化为超生命体！'; },
    /* 获得基因源质 */
    getEssence: function (age, name, gain) { return '第' + age + '岁，获得基因源质『' + name + '』，战力+' + gain; },
    /* 觉醒技能（peak=达到的级，tierName=技能档名，add=战力加成） */
    awakenSkill: function (peak, tierName, add) { return '修为达到' + peak + '级，觉醒' + tierName + '级技能，战力+' + add; },
    /* 升 1 级（from→to，cg 战力增益，lg 寿命增益，lg=0 时不显示寿命段） */
    levelUp: function (from, to, cg, lg) { return '等级' + from + '→' + to + '级，战力+' + cg + (lg ? '，寿命+' + lg : '') + '！'; },
    /* 满级后每年领悟战力 +10000 */
    peakLevelUp: function () { return '等级抵达巅峰后，有所领悟，战力+10000！'; },
    /* 炼化源质成功，晋升超生命体 */
    refineSuccess: function (age) { return '第' + age + '岁，寿命将尽，成功炼化基因源质，晋升为超生命体！'; },
    /* 炼化失败但基因提升 */
    refineFail: function (age, boost) { return '第' + age + '岁，炼化失败，但基因有所提升，战力+' + boost; },
    /* 寿命将尽，强行进化成功 */
    forcedAscend: function (age) { return '第' + age + '岁，寿命将尽，强行进化，成为超生命体！'; },
    /* 强行进化失败，崩解陨落 */
    forcedFail: function (age) { return '第' + age + '岁，强行进化失败，崩解陨落'; },

    /* ---------- 结算页文案 ---------- */
    settleGodTitle: '✨ 超生命体进化 ✨',
    settleDeadTitle: '💀 与世长辞',
    settleFailTitle: '⚡ 进化失败 · 崩解',
    settlePauseTitle: '⏸ 提前结算',
    settleGodDesc: '✨ 进化完成，蜕变为超生命体 ✨',
    settleAgeLabelAscend: '进化用时',
    settleAgeLabelDead: '存活年数',
    refineFailHint: function (ascended) {
      return ascended ? ' —— 炼化失败，改由强行进化' : ' —— 炼化失败（基因不足），转入强行进化，惜败';
    },

    /* ---------- 首页 / 说明页文案 ---------- */
    homeSub: '——末日求生，看看你能进化为超生命体的那个幸运儿吗？——',
    aboutText: '末日降临，6 岁觉醒，<b>随机抽取</b>异能和寿命，开始修炼，还可能遇到各种变异与机遇，天才也可能早夭，异能天赋 F 级，亦有逆天翻盘的机会~<br>你唯一的目标，就是进化为超生命体——修炼至巅峰（99 级）即可尝试强行进化，更有机会获得 <b>基因源质</b>，炼化源质即可晋升，大幅提升进化概率！<br>每局结束时，将获得经验，提升玩家等级，玩家等级越高，觉醒强大异能几率越大，快来试试看——你，会不会是那个 <b>超生命体</b> 的幸运儿？',

    /* ---------- 高光导出文案 ---------- */
    exportTitle: '末日模拟器',
    exportFooter: '末日模拟器 —— 看看你能成为进化的那个幸运儿吗？',
    exportCardTitle: '末日模拟器 · 高光时刻',
    /* 高光行首行：模拟器名（用于复制文本/海报标题） */
    reviewTitle: '末日模拟器',
    /* 保底弹窗标题 */
    guardMaskTitle: '🎲 保底 · EX 天赋',
    guardTalentRow: '异能天赋：F 档+5 / E 档+4 / D 档+3 / C 档+2 / B 档及以上+1',
    guardLevelRow: '等级（按等级）：81级+3 / 91级+5 / 95级+8 / 99级+10 / 超生命体+30',
    guardHint: '积分满 100 后，下一次开始游戏必定觉醒<b>EX 异能天赋</b>，随后积分清零重新累计。'
  };

  var TALENTS = [
    /* green */
    { id:'dm_t1', name:'生存本能', rarity:'green', desc:'初始战力+50', apply:function(g){ g.combat += 50; } },
    { id:'dm_t2', name:'急救术', rarity:'green', desc:'寿元+5', apply:function(g){ g.lifespan += 5; } },
    { id:'dm_t3', name:'搜刮者', rarity:'green', desc:'战力+10%', apply:function(g){ g.combat = Math.floor(g.combat * 1.1); } },
    { id:'dm_t4', name:'顽强意志', rarity:'green', desc:'寿元+3，战力+20', apply:function(g){ g.lifespan += 3; g.combat += 20; } },
    { id:'dm_t5', name:'敏捷反应', rarity:'green', desc:'初始等级+1', apply:function(g){ g.lvl += 1; } },
    /* blue */
    { id:'dm_t6', name:'变异基因', rarity:'blue', desc:'战力+20%', apply:function(g){ g.combat = Math.floor(g.combat * 1.2); } },
    { id:'dm_t7', name:'长寿基因', rarity:'blue', desc:'寿元+15', apply:function(g){ g.lifespan += 15; } },
    { id:'dm_t8', name:'战斗本能', rarity:'blue', desc:'初始等级+2', apply:function(g){ g.lvl += 2; } },
    { id:'dm_t9', name:'基因优化', rarity:'blue', desc:'战力+200', apply:function(g){ g.combat += 200; } },
    { id:'dm_t10', name:'快速恢复', rarity:'blue', desc:'寿元+10，战力+50', apply:function(g){ g.lifespan += 10; g.combat += 50; } },
    /* purple */
    { id:'dm_t11', name:'基因突破', rarity:'purple', desc:'天赋+1', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); } },
    { id:'dm_t12', name:'进化催化', rarity:'purple', desc:'战力+40%', apply:function(g){ g.combat = Math.floor(g.combat * 1.4); } },
    { id:'dm_t13', name:'生命力', rarity:'purple', desc:'寿元+25', apply:function(g){ g.lifespan += 25; } },
    /* gold */
    { id:'dm_t14', name:'完美基因', rarity:'gold', desc:'天赋+2，进化概率+8%，源质炼化门槛降低', apply:function(g){ g.innate = Math.min(10, g.innate + 2); g.aptitude = Math.max(g.aptitude, g.innate); g.ascendBonus = (g.ascendBonus || 0) + 0.08; g.refineBoost = true; } },
    { id:'dm_t15', name:'超进化血脉', rarity:'gold', desc:'天赋+1，进化概率+10%，寿元+25', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.ascendBonus = (g.ascendBonus || 0) + 0.10; g.lifespan += 25; } },

    /* ====== 扩展词条（末日主题追加） ====== */
    /* green */
    { id:'dm_t16', name:'废墟拾荒者', rarity:'green', desc:'战力+8%', apply:function(g){ g.combat = Math.floor(g.combat * 1.08); } },
    { id:'dm_t17', name:'末日前辈', rarity:'green', desc:'初始等级+1，寿元+3', apply:function(g){ g.lvl += 1; g.lifespan += 3; } },
    { id:'dm_t18', name:'急救专家', rarity:'green', desc:'寿元+8', apply:function(g){ g.lifespan += 8; } },
    { id:'dm_t19', name:'生存专家', rarity:'green', desc:'战力+30，寿元+3', apply:function(g){ g.combat += 30; g.lifespan += 3; } },
    /* blue */
    { id:'dm_t20', name:'辐射变异体', rarity:'blue', desc:'战力+15%，寿元+8', apply:function(g){ g.combat = Math.floor(g.combat * 1.15); g.lifespan += 8; } },
    { id:'dm_t21', name:'进化前兆', rarity:'blue', desc:'战力+15%，初始等级+1', apply:function(g){ g.combat = Math.floor(g.combat * 1.15); g.lvl += 1; } },
    { id:'dm_t22', name:'变异抗体', rarity:'blue', desc:'寿元+12，战力+80', apply:function(g){ g.lifespan += 12; g.combat += 80; } },
    { id:'dm_t23', name:'基因优化2', rarity:'blue', desc:'战力+400', apply:function(g){ g.combat += 400; } },
    /* purple */
    { id:'dm_t24', name:'基因图谱', rarity:'purple', desc:'天赋+1，战力+25%', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.combat = Math.floor(g.combat * 1.25); } },
    /* gold */
    { id:'dm_t25', name:'末日方舟', rarity:'gold', desc:'天赋+1，进化概率+6%，寿元+35', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.ascendBonus = (g.ascendBonus || 0) + 0.06; g.lifespan += 35; } },
    { id:'dm_t26', name:'天选之人', rarity:'gold', desc:'幸运加持，源质概率+25%，进化+7%', apply:function(g){ g.ascendBonus = (g.ascendBonus || 0) + 0.07; g.luckBonus = (g.luckBonus || 0) + 1; g.combat = Math.floor(g.combat * 1.25); } },
    { id:'dm_t27', name:'末日预言', rarity:'gold', desc:'预知未来，每次事件获双倍收益，进化+6%', apply:function(g){ g.ascendBonus = (g.ascendBonus || 0) + 0.06; g.eventBonus = (g.eventBonus || 0) + 1; g.lifespan += 10; } },
    { id:'dm_t28', name:'异能觉醒', rarity:'gold', desc:'异能进化S级，战力+60%，进化+8%', apply:function(g){ g.combat = Math.floor(g.combat * 1.6); g.ascendBonus = (g.ascendBonus || 0) + 0.08; g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); } },
  ];
  /* === tier 4 传说 === */
  var EVENTS = [
    {
      id: 'reawaken', weight: 0.15, maxCount: 2,
      name: '异能二次觉醒', tier: 4,
      desc: '沉寂多年的异能基因突然发生二次觉醒',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) {
        return g.lvl >= Math.min(50, Math.floor(g.age * 0.75)) + U.irand(0, 10);
      },
      ok: function (g, U, log) {
        var lf = U.irand(4, 8); g.lifespan += lf;
        var fullBefore = g.aptitude >= 10;
        var inc = g.innate < 6 ? U.irand(1, 3) : (g.innate <= 8 ? U.irand(1, 2) : (g.innate === 9 ? 1 : 0));
        var up = null;
        if (inc > 0 && g.aptitude < 10) { up = g.aptitude + inc; if (up > 10) up = 10; g.aptitude = up; }
        var lvGain = U.irand(1, 3);
        if (fullBefore) lvGain += 1;
        U.gainLevels(g, lvGain, log);
        return '体内蛰伏的异能基因骤然暴动，沉睡的细胞被逐一点燃——二次觉醒！基因重组的剧痛过后是前所未有的力量涌入，寿元+' + lf + (up ? '，天赋跃升至' + U.DATA.tierName(up) + '！' : '，实力大幅精进！');
      },
      fail: function (g, U) {
        var lf = U.irand(2, 4); g.lifespan -= lf;
        return '觉醒失控！基因链剧烈震荡后断裂重组，身体承受不住这股狂暴的力量，寿元-' + lf + '。';
      }
    },
    {
      id: 'twinawaken', weight: 0.05, maxCount: 1,
      name: '双生异能觉醒', tier: 4,
      desc: '你意外觉醒了自己的双生异能',
      minAge: 6, maxAge: 12,
      cond: function (g) { return g.innate <= 6; },
      ok: function (g, U, log) {
        var n = U.drawHighAbility(g);
        var lf = U.irand(4, 8); g.lifespan += lf;
        U.gainLevels(g, U.irand(1, 3), log);
        return '第二异能在体内苏醒！异能「' + n.ability + '」觉醒，天赋提升至' + U.DATA.tierName(n.innate) + '——双生异能的传说在末世重现，寿元+' + lf + '，实力飞跃！';
      },
      fail: null
    },
    {
      id: 'deadzone', weight: 0.3, maxCount: 1,
      name: '死疫禁区', tier: 4,
      desc: '闯入被变异体盘踞的死疫禁区，浴血搏杀',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) {
        return g.combat > U.testCombat(8, g.age, 20, 15) || g.lvl > U.testLv(8, g.age, 20, 15);
      },
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.1, 0.2, 2000); g.combat += c;
        U.gainLevels(g, U.irand(1, 3), log);
        return '穿越辐射浓雾踏入死疫禁区，变异体的嘶吼此起彼伏——你在尸山血海中杀出重围，掠夺了大量战利品，战力额外+' + c + '，实力大幅跃升！';
      },
      fail: function (g, U) {
        g.dead = true;
        return '禁区深处传来沉重的脚步声，一头从未见过的巨型变异体挡住了所有退路——实力不足，惨死于死疫禁区。';
      }
    },
    {
      id: 'serum', weight: 0.3, maxCount: 1,
      name: '获得进化血清', tier: 4,
      desc: '意外寻得一支高纯度进化血清，可激发潜能',
      minAge: 0, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var lf = U.irand(8, 12); g.lifespan += lf;
        var up = null;
        if (g.aptitude < 10) {
          up = g.aptitude + U.irand(1, 3);
          if (up < 6) up = 6;
          if (up > 10) up = 10;
          g.aptitude = up;
        }
        U.gainLevels(g, U.irand(1, 3), log);
        return '在废墟深处发现一支散发着幽蓝荧光的进化血清，针管上刻着「前文明·基因研究所」——注射瞬间细胞剧烈重组，寿元+' + lf + (up ? '，天赋跃升至' + U.DATA.tierName(up) + '！' : '') + '';
      },
      fail: null
    },
    {
      id: 'marrow', weight: 0.7, maxCount: 2,
      name: '能量灵髓', tier: 4,
      desc: '偶得一瓶能量灵髓，可强化异能回路',
      minAge: 0, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var lf = U.irand(7, 10); g.lifespan += lf;
        var up = null;
        if (g.aptitude < 10) {
          up = g.aptitude + U.irand(1, 2);
          if (up < 5) up = 5;
          if (up > 10) up = 10;
          g.aptitude = up;
        }
        U.gainLevels(g, U.irand(2, 3), log);
        return '发现一瓶晶莹剔透的能量灵髓，入口即化，异能回路被逐一激活——力量在血脉中奔涌，寿元+' + lf + (up ? '，天赋提升至' + U.DATA.tierName(up) + '！' : '，实力有所精进！') + '';
      },
      fail: null
    },
    {
      id: 'subdue', weight: 0.5, maxCount: 5,
      name: '讨伐S级变异体', tier: 4,
      desc: '听闻有一头S级变异体在附近活动，你打算参与讨伐',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 80 || g.combat >= 30000; },
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.1, 0.15, 2000); g.combat += c;
        U.gainLevels(g, U.irand(1, 2), log);
        return '与S级变异体展开殊死搏斗，最终将其击毙——获取了大量稀有资源，战力+' + c + '，实力也得到提升！';
      },
      fail: function (g, U) {
        if (g.lvl < 60 && g.combat < 15000) {
          return '实力不足，远远观察那头S级变异体后明智地放弃了这次讨伐。';
        }
        if (Math.random() < 0.5) {
          var c = U.evCombat(g, 0.025, 0.5, 400); g.combat += c;
          return '讨伐失败，但侥幸逃脱——在绝境中磨砺了战斗本能，战力+' + c + '。';
        } else {
          var lf = U.irand(3, 7); g.lifespan -= lf;
          return '讨伐失败，你受到重创，血肉模糊地爬出战场，寿元-' + lf + '！';
        }
      }
    },
    /* === tier 3 稀有 === */
    {
      id: 'arena', weight: 2, maxCount: 3,
      name: '幸存者竞技赛', tier: 3,
      desc: '参加营地五年一遇的异能者竞技赛',
      minAge: 15, maxAge: 30,
      cond: function (g, U) {
        return g.lvl >= Math.min(40, Math.floor(g.age * 0.75)) + U.irand(0, 10);
      },
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.075, 0.15, 1500); g.combat += c;
        U.gainLevels(g, U.irand(1, 2), log);
        return '竞技场上异能碰撞的光芒照亮了整个营地，你一路过关斩将——战力+' + c + '，实力也有所精进！';
      },
      fail: function (g, U) {
        var lf = U.irand(2, 4); g.lifespan -= lf;
        return '对手的异能远超预期，你被一击重创——伤及根基，寿元-' + lf + '。';
      }
    },
    {
      id: 'ruins', weight: 2, maxCount: 5,
      name: '废墟遗着', tier: 3,
      desc: '潜入废弃研究所，偶遇前文明遗留的强化装置',
      minAge: 0, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.05, 0.1, 1250); g.combat += c;
        var lf = U.irand(2, 6); g.lifespan += lf;
        U.gainLevels(g, U.irand(1, 2), log);
        return '在布满灰尘的实验室深处找到了仍在运转的强化装置——启动后身体被能量包裹，战力+' + c + '，寿元+' + lf + '！';
      },
      fail: null
    },
    {
      id: 'crystal', weight: 1, maxCount: 5,
      name: '获得异能结晶', tier: 3,
      desc: '击杀变异体后意外获得一块异能结晶',
      minAge: 0, maxAge: 10000,
      cond: function (g, U) {
        return g.lvl >= Math.min(35, Math.floor(g.age * 0.75)) + U.irand(0, 10);
      },
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.05, 0.125, 1500); g.combat += c;
        U.gainLevels(g, U.irand(1, 2), log);
        return '变异体倒下的瞬间，一颗散发着微光的结晶从尸体中析出——吸收异能结晶，战力+' + c + '！';
      },
      fail: function (g, U) {
        var lf = U.irand(3, 5); g.lifespan -= lf;
        return '结晶被其他变异者抢走，还把你打成重伤——寿元-' + lf + '！';
      }
    },
    {
      id: 'insight', weight: 1, maxCount: 5,
      name: '异能顿悟', tier: 3,
      desc: '深夜冥想，顿悟异能运用之理',
      minAge: 0, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.05, 0.1, 1000); g.combat += c;
        var lf = U.irand(3, 7); g.lifespan += lf;
        U.gainLevels(g, 1, log);
        return '夜深人静，异能如潮水般在体内奔涌——冥想中豁然开朗，对异能的运用有了全新理解，战力+' + c + '，寿元+' + lf + '！';
      },
      fail: null
    },
    {
      id: 'potion', weight: 1, maxCount: 3,
      name: '强化药剂', tier: 3,
      desc: '寻得一剂可提升天赋档的强化药剂',
      minAge: 0, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        if (g.aptitude <= 6) {
          var up = g.aptitude + U.irand(1, 2);
          if (up > 10) up = 10;
          g.aptitude = up;
          return '注射强化药剂，异能回路被逐一激活——天赋提升至' + U.DATA.tierName(up) + '！';
        }
        U.gainLevels(g, 1, log);
        return '注射强化药剂，可惜天赋已深厚，体内产生了抗体——只感觉修为有所提升。';
      },
      fail: null
    },
    {
      id: 'notes', weight: 1, maxCount: 3,
      name: '异能笔记', tier: 3,
      desc: '拾得一份可提升天赋档的异能者笔记',
      minAge: 0, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        if (g.aptitude <= 8) {
          var up = g.aptitude + 1;
          if (up > 10) up = 10;
          g.aptitude = up;
          return '翻阅泛黄的异能笔记，字里行间藏着前人的毕生感悟——茅塞顿开，天赋提升至' + U.DATA.tierName(up) + '！';
        }
        U.gainLevels(g, 1, log);
        return '翻阅异能笔记，可惜收获甚微——只感觉修为有所精进。';
      },
      fail: null
    },
    /* === tier 2 中级 === */
    {
      id: 'legacy', weight: 5, maxCount: 4,
      name: '前辈遗泽', tier: 2,
      desc: '一位老异能者的遗儿指引你接收传承',
      minAge: 0, maxAge: 10000,
      cond: function (g, U) {
        return g.lvl >= Math.min(25, Math.floor(g.age * 0.75)) + U.irand(0, 10);
      },
      ok: function (g, U, log) {
        if (g.lvl < 99) { U.gainLevels(g, 1, log); return '跟随老异能者的遗儿找到一处隐蔽的传承点，获得了前辈留下的修炼心得——受益良多！'; }
        var c2 = U.evCombat(g, 0.04, 0.08, 750); g.combat += c2;
        return '继承前辈遗泽，体内的异能被进一步激活——战力+' + c2 + '！';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '传承失控！前辈残留的异能反噬，基因链出现裂痕——寿元-' + lf + '。';
      }
    },
    {
      id: 'bandits', weight: 4, maxCount: 4,
      name: '劫掠者袭出', tier: 2,
      desc: '一伙劫掠者盯上了你的物资',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) {
        return g.lvl >= Math.min(40, Math.floor(g.age * 0.75)) + U.irand(0, 10);
      },
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.05, 0.1, 750); g.combat += c;
        return '反杀劫掠者，缴获了他们的全部物资——战力+' + c + '！';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 4); g.lifespan -= lf;
        return '被劫掠者打成重伤，仓皇逃命——寿元-' + lf + '。';
      }
    },
    {
      id: 'warlord', weight: 4, maxCount: 4,
      name: '军阀冲突', tier: 2,
      desc: '两大军阀势力在此交火，你被卷入其中',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) {
        return g.lvl >= Math.min(30, Math.floor(g.age * 0.75)) + U.irand(0, 10);
      },
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.05, 0.1, 750); g.combat += c;
        return '在军阀混战中左右逢源，趁乱夺取了大量物资和情报——战力+' + c + '！';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '被军阀分子重创，寿元-' + lf + '。';
      }
    },
    {
      id: 'swarm', weight: 3, maxCount: 3,
      name: '变异潮来袭', tier: 2,
      desc: '大批变异体如潮水般涌来',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) {
        return g.lvl >= Math.min(25, Math.floor(g.age * 0.75)) + U.irand(0, 10);
      },
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.05, 0.1, 750); g.combat += c;
        return '击退变异潮，战斗中有所领悟——战力+' + c + '！';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '被变异潮吞噬，重伤逃出——寿元-' + lf + '。';
      }
    },
    {
      id: 'combatinsight', weight: 3, maxCount: 4,
      name: '战斗领悟', tier: 2,
      desc: '在生死搏杀中领悟新的战斗技巧',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) {
        return g.lvl >= Math.min(30, Math.floor(g.age * 0.75)) + U.irand(0, 10);
      },
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.05, 0.12, 750); g.combat += c;
        return '生死边缘徘徊的瞬间，战斗本能被彻底唤醒——领悟新的战斗技巧，战力+' + c + '！';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '强行运转异能领悟失败，寿元-' + lf + '。';
      }
    },
    {
      id: 'mission', weight: 4, maxCount: 4,
      name: '秘密任务', tier: 2,
      desc: '被营地选中执行一项危险的秘密任务',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) {
        return g.lvl >= Math.min(30, Math.floor(g.age * 0.75)) + U.irand(0, 10);
      },
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.05, 0.12, 750); g.combat += c;
        U.gainLevels(g, U.irand(0, 1), log);
        return '秘密任务圆满完成，获得了大量奖励——战力+' + c + '！';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '任务中遭遇埋伏，虽然没有生命危险但身受重伤——寿元-' + lf + '。';
      }
    },
    /* === tier 1 普通 === */
    {
      id: 'cull', weight: 8, maxCount: 3,
      name: '清剿变异体', tier: 1,
      desc: '参与营地组织的变异体清剿行动',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.02, 0.06, 250); g.combat += c;
        return '清剿变异体小有收获，战斗技巧更加纯熟——战力+' + c + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 2); g.lifespan -= lf;
        return '差点被变异体撕碎，仓皇逃回——寿元-' + lf + '。';
      }
    },
    {
      id: 'scavenge', weight: 10, maxCount: 3,
      name: '搜刮物资', tier: 1,
      desc: '在废墟中搜刮生存物资',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.015, 0.05, 200);
        var lf = U.irand(1, 3); g.combat += c; g.lifespan += lf;
        return '在废墟深处找到能量补充剂——寿元+' + lf + '，战力+' + c + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 2); g.lifespan -= lf;
        return '被潜伏的变异体偷袭，仓皇而逃——寿元-' + lf + '。';
      }
    },
    {
      id: 'spar', weight: 8, maxCount: 3,
      name: '幸存者切磋', tier: 1,
      desc: '与其他幸存者进行实战切磋',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.015, 0.05, 200); g.combat += c;
        return '切磋获胜，积累了宝贵的实战经验——战力+' + c + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 2); g.lifespan -= lf;
        return '切磋落败受创——寿元-' + lf + '。';
      }
    },
    {
      id: 'epiphany', weight: 8, maxCount: 3,
      name: '略有感悟', tier: 1,
      desc: '日常修炼中略有感悟',
      minAge: 0, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var c = U.evCombat(g, 0.01, 0.03, 150); g.combat += c;
        return '静坐修炼中思绪通达，异能运转更加顺畅——战力+' + c + '。';
      },
      fail: null
    },
    /* --- ev_ events tier 1 --- */
    {
      id: 'ev_shelter', weight: 8, maxCount: 3,
      name: '避难所搜刮', tier: 1,
      desc: '搜刮避难所的物资',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add; var lf = U.irand(1, 3); g.lifespan += lf;
        return '避难所的角落里藏着被遗忘的物资——搜刮收获，战力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    {
      id: 'ev_mutbeast', weight: 9, maxCount: 3,
      name: '搏杀变异兽', tier: 1,
      desc: '遭遇落单的变异兽',
      minAge: 8, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 12; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.3, 0.8));
        g.combat += add;
        return '变异兽的嘶吼在荒野中回荡，你以迅捷的身手将其击杀——战力+' + add + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 2); g.lifespan -= lf;
        return '搏杀中被变异兽的利爪划伤——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_military', weight: 7, maxCount: 3,
      name: '军方救援', tier: 1,
      desc: '得到军方小队的物资援助',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 15; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.3, 0.8));
        g.combat += add; var lf = U.irand(1, 3); g.lifespan += lf;
        return '军方救援队带来了补给物资——获得援助，战力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    {
      id: 'ev_blackmarket', weight: 7, maxCount: 3,
      name: '黑市交易', tier: 1,
      desc: '在黑市交易获得变异材料',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 12; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add; var lf = U.irand(1, 2); g.lifespan += lf;
        return '黑市里弥漫着机油和汗臭的味道，你用积蓄换来了一包变异材料——战力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    {
      id: 'ev_survivor', weight: 8, maxCount: 3,
      name: '幸存者营地', tier: 1,
      desc: '在幸存者营地休整并搜刮物资',
      minAge: 5, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.2, 0.5));
        g.combat += add; var lf = U.irand(1, 3); g.lifespan += lf;
        return '营地的火堆旁围坐着疲惫的幸存者，你在此休整恢复——战力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    /* --- ev_ events tier 4 --- */
    {
      id: 'ev_prophecy', weight: 0.1, maxCount: 1,
      name: '进化预言', tier: 4,
      desc: '传说末日方舟留有进化预言，只有强者能解读',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 70; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(2.0, 3.5));
        g.combat += add; var lf = U.irand(8, 14); g.lifespan += lf;
        U.gainLevels(g, U.irand(1, 3), log);
        return '解读预言的刹那，意识仿佛穿越了时间长河——洞悉进化之理，战力+' + add + '，寿元+' + lf + '，实力大幅精进！';
      },
      fail: function (g, U) {
        var lf = U.irand(4, 8); g.lifespan -= lf;
        return '预言反噬神识——强行窥探禁忌知识的代价是意识海的剧烈震荡，寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_inherit', weight: 0.2, maxCount: 1,
      name: '异能传承', tier: 4,
      desc: '末日前辈的异能传承降临于你',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 60; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(2.5, 4.0));
        g.combat += add; var lf = U.irand(6, 12); g.lifespan += lf;
        var up = null;
        if (g.aptitude < 10) { up = g.aptitude + U.irand(1, 2); if (up > 10) up = 10; g.aptitude = up; }
        U.gainLevels(g, U.irand(1, 3), log);
        return '末日前辈的残影出现在你面前，将毕生异能倾囊相授——接受异能传承' + (up ? '，天赋提升至' + U.DATA.tierName(up) + '！' : '') + '，战力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U) {
        var lf = U.irand(3, 7); g.lifespan -= lf;
        return '传承失控！前辈残留的异能反噬——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_ark', weight: 0.08, maxCount: 1,
      name: '末日方舟', tier: 4,
      desc: '找到传说中的末日方舟',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 65; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(3.0, 5.0));
        g.combat += add; var lf = U.irand(10, 18); g.lifespan += lf;
        var up = null;
        if (g.aptitude < 10) { up = g.aptitude + U.irand(2, 3); if (up > 10) up = 10; g.aptitude = up; }
        U.gainLevels(g, U.irand(2, 4), log);
        return '登上末日方舟，获得前文明传承——战力+' + add + '，寿元+' + lf + (up ? '，天赋提升至' + U.DATA.tierName(up) + '！' : '') + '，实力飞跃！';
      },
      fail: function (g, U) {
        var lf = U.irand(5, 10); g.lifespan -= lf;
        return '方舟防御系统启动，高强度能量将你击退——寿元-' + lf + '。';
      }
    },
    /* --- ev_ events tier 3 --- */
    {
      id: 'ev_serumlab', weight: 2, maxCount: 3,
      name: '血清研究所', tier: 3,
      desc: '深入一处未被洗劫的血清研究所',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 35; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(1.0, 2.0));
        g.combat += add; var lf = U.irand(3, 7); g.lifespan += lf;
        U.gainLevels(g, U.irand(1, 2), log);
        return '在研究所深处找到高纯度进化血清，冰冷的金属容器上还残留着前文明的标志——战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(2, 5); g.lifespan -= lf;
        return '血清注射失败，副作用反噬——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_beastking', weight: 1.5, maxCount: 2,
      name: '变异兽王', tier: 3,
      desc: '遭遇一头传说级的变异兽王',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 50; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(1.2, 2.5));
        g.combat += add; var lf = U.irand(3, 7); g.lifespan += lf;
        U.gainLevels(g, U.irand(1, 2), log);
        return '变异兽王咆哮着扑来，你以命相搏最终将其击毙——提取其基因之力，战力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U) {
        var lf = U.irand(3, 6); g.lifespan -= lf;
        return '被变异兽王重创，几乎丧命——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_secondmut', weight: 2, maxCount: 2,
      name: '二次变异体', tier: 3,
      desc: '遭遇二次变异的怪物',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(1.0, 2.0));
        g.combat += add; var lf = U.irand(2, 6); g.lifespan += lf;
        U.gainLevels(g, U.irand(1, 2), log);
        return '二次变异体的躯体扭曲而可怖，你将其击杀并吸收其变异因子——战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(2, 5); g.lifespan -= lf;
        return '被二次变异体的感染物质侵入，寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_duelist', weight: 2, maxCount: 3,
      name: '异能者对决', tier: 3,
      desc: '与一位强大的异能者展开对决',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 35; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(1.0, 2.0));
        g.combat += add; var lf = U.irand(2, 5); g.lifespan += lf;
        U.gainLevels(g, U.irand(1, 2), log);
        return '异能碰撞的冲击波掀翻了周围的废墟——击败异能者，夺取其异能精粹，战力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U) {
        var lf = U.irand(2, 4); g.lifespan -= lf;
        return '对决落败，被对方的异能击穿防御——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_warlordboss', weight: 1.5, maxCount: 2,
      name: '军阀头目', tier: 3,
      desc: '直面军阀势力的头目',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 50; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(1.2, 2.5));
        g.combat += add; var lf = U.irand(3, 7); g.lifespan += lf;
        U.gainLevels(g, U.irand(1, 2), log);
        return '军阀头目的私人卫队不堪一击——斩杀头目，缴获大量军用物资，战力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U) {
        var lf = U.irand(3, 6); g.lifespan -= lf;
        return '军阀头目的火力远超预期——被重创，寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_genememory', weight: 2, maxCount: 2,
      name: '基因记忆觉醒', tier: 3,
      desc: '沉睡的基因记忆突然觉醒',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(1.0, 2.0));
        g.combat += add; var lf = U.irand(2, 5); g.lifespan += lf;
        var up = null;
        if (g.aptitude < 10) { up = g.aptitude + U.irand(1, 2); if (up > 10) up = 10; g.aptitude = up; }
        U.gainLevels(g, U.irand(1, 2), log);
        return '前世的记忆碎片如洪流般涌入脑海——基因记忆觉醒' + (up ? '，天赋提升至' + U.DATA.tierName(up) + '！' : '') + '，战力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U) {
        var lf = U.irand(2, 5); g.lifespan -= lf;
        return '记忆冲击神识，意识险些崩溃——寿元-' + lf + '。';
      }
    },
    /* --- ev_ events tier 2 --- */
    {
      id: 'ev_generecomb', weight: 3, maxCount: 3,
      name: '基因重组实验', tier: 2,
      desc: '尝试进行基因重组',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 25; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.5, 1.2));
        g.combat += add; var lf = U.irand(1, 4); g.lifespan += lf;
        U.gainLevels(g, U.irand(0, 1), log);
        return '基因重组的实验台上闪过刺眼的蓝光——重组成功，战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '基因重组失败，失败的序列反噬自身——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_mutstorm', weight: 4, maxCount: 3,
      name: '异变风暴', tier: 2,
      desc: '一场异变风暴席卷而来',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 22; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.5, 1.2));
        g.combat += add; var lf = U.irand(1, 3); g.lifespan += lf;
        return '异变风暴中能量四溢，你借势吸收游离的变异能量——战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '被异变风暴中的辐射物质所伤——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_radzone', weight: 3, maxCount: 3,
      name: '辐射区探索', tier: 2,
      desc: '深入辐射区搜寻资源',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 25; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.5, 1.2));
        g.combat += add; var lf = U.irand(1, 3); g.lifespan += lf;
        return '辐射区深处藏着被掩埋的资源——探索收获颇丰，战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '遭受辐射伤害，细胞开始异变——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_evolvmut', weight: 3, maxCount: 3,
      name: '进化因子突变', tier: 2,
      desc: '体内的进化因子发生突变',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 28; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.5, 1.3));
        g.combat += add; var lf = U.irand(1, 4); g.lifespan += lf;
        U.gainLevels(g, U.irand(0, 1), log);
        return '体内的进化因子骤然活跃，基因序列发生良性突变——战力+' + add + '，寿元+' + lf + '，实力精进！';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '突变失控，基因链出现断裂——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_campbuild', weight: 5, maxCount: 4,
      name: '营地建设', tier: 2,
      desc: '参与营地的扩建工程',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.4, 1.0));
        g.combat += add; var lf = U.irand(1, 3); g.lifespan += lf;
        return '在废墟间搬运建材，汗水中磨砺意志——营地建设获得酬劳，战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 2); g.lifespan -= lf;
        return '营地建设中被坍塌的墙体砸伤——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_convoy', weight: 4, maxCount: 3,
      name: '商队护卫', tier: 2,
      desc: '护卫一支穿越荒野的商队',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 22; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.5, 1.1));
        g.combat += add; var lf = U.irand(1, 3); g.lifespan += lf;
        return '商队安全抵达目的地，你获得了丰厚的护卫报酬——战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '商队途中遭遇伏击，护卫运送时受伤——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_refugee', weight: 5, maxCount: 4,
      name: '难民救援', tier: 2,
      desc: '一群难民遭遇变异体围攻，你出手相救',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.4, 1.0));
        g.combat += add; var lf = U.irand(1, 4); g.lifespan += lf;
        return '难民们含泪道谢，纷纷拿出仅有的物资作为回报——救下难民，战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '救援中被变异体偷袭受创——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_campalliance', weight: 4, maxCount: 3,
      name: '营地联盟', tier: 2,
      desc: '多个幸存者营地结成联盟，共抗变异潮',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 25; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.5, 1.2));
        g.combat += add; var lf = U.irand(2, 5); g.lifespan += lf;
        return '多个营地的旗帜在风中交汇——营地联盟共享资源，战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '联盟破裂，内部冲突中受伤——寿元-' + lf + '。';
      }
    },
    /* --- ev_ events tier 1 --- */
    {
      id: 'ev_shelterbuild', weight: 10, maxCount: 3,
      name: '避难所建设', tier: 1,
      desc: '参与地下避难所的扩建工程',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.2, 0.5));
        g.combat += add; var lf = U.irand(1, 3); g.lifespan += lf;
        return '昏暗的地下回荡着锤打声，你参与加固了避难所的外墙——战力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    {
      id: 'ev_survivorcouncil', weight: 8, maxCount: 3,
      name: '幸存者大会', tier: 1,
      desc: '参加幸存者大会，交流生存经验',
      minAge: 10, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.2, 0.5));
        g.combat += add; var lf = U.irand(1, 2); g.lifespan += lf;
        return '围坐在篝火旁，老幸存者们分享着各自的战斗经验——战力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    {
      id: 'ev_warlordbattle', weight: 8, maxCount: 3,
      name: '军阀大战', tier: 1,
      desc: '卷入两方军阀混战',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 15; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add;
        return '硝烟弥漫的战场上你左右逢源——军阀大战中渔翁得利，战力+' + add + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '流弹击中了你——军阀大战中被波及受伤，寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_mutnest', weight: 9, maxCount: 3,
      name: '变异体巢穴', tier: 1,
      desc: '清剿一处变异体巢穴',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 15; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.3, 0.8));
        g.combat += add; var lf = U.irand(1, 2); g.lifespan += lf;
        return '变异体巢穴中到处是黏液和残骸——清剿完毕，战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '巢穴深处有潜伏的强敌——仓皇逃脱，寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_deepdeadzone', weight: 7, maxCount: 3,
      name: '死疫禁区深处', tier: 1,
      desc: '深入死疫禁区外围搜寻物资',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 18; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.3, 0.8));
        g.combat += add; var lf = U.irand(1, 3); g.lifespan += lf;
        return '禁区外围残留着前文明的物资箱——死疫禁区外围收获稀有材料，战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(2, 4); g.lifespan -= lf;
        return '不幸感染了禁区中的病毒——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_undershelter', weight: 10, maxCount: 3,
      name: '地下避难所', tier: 1,
      desc: '在地下避难所中休整并搜刮物资',
      minAge: 5, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.2, 0.5));
        g.combat += add; var lf = U.irand(1, 3); g.lifespan += lf;
        return '地下避难所里弥漫着潮湿的空气——休整补给后精神焕发，战力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    {
      id: 'ev_abandonedlab', weight: 8, maxCount: 3,
      name: '废弃实验室', tier: 1,
      desc: '潜入废弃实验室搜寻研究资料',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 12; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.2, 0.6));
        g.combat += add; var lf = U.irand(1, 2); g.lifespan += lf;
        return '实验室的培养皿早已破碎，但柜中还留有完整的研究资料——战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 2); g.lifespan -= lf;
        return '实验室残余的化学毒气弥漫——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_raddeep', weight: 8, maxCount: 3,
      name: '辐射区深处', tier: 1,
      desc: '深入辐射区深处搜寻高度变异材料',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 15; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.2, 0.6));
        g.combat += add; var lf = U.irand(1, 2); g.lifespan += lf;
        return '辐射区深处的变异材料在幽暗中发出诡异的荧光——收获高级材料，战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 3); g.lifespan -= lf;
        return '辐射过量，身体开始出现异变症状——寿元-' + lf + '。';
      }
    },
    {
      id: 'ev_mutforest', weight: 9, maxCount: 3,
      name: '异变森林', tier: 1,
      desc: '穿越异变森林，猎杀变异生物',
      minAge: 8, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 12; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl); var add = Math.floor(r * U.rand(0.2, 0.6));
        g.combat += add; var lf = U.irand(1, 2); g.lifespan += lf;
        return '异变森林中扭曲的树木间传来窸窣声响——猎杀变异生物，战力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U) {
        var lf = U.irand(1, 2); g.lifespan -= lf;
        return '被潜伏在树丛中的变异体袭击——寿元-' + lf + '。';
      }
    }
  ];



  /* ---------- 变异者称号（titleOf） ---------- */
  function titleOf(lvl) {
    lvl = Math.max(1, Math.min(100, Math.floor(lvl) || 1));
    if (lvl >= 100) return '超生命体·完全体';
    if (lvl >= 99) return '超生命体';
    if (lvl >= 91) return '准超生命体' + (lvl - 90) + '级';
    var idx = Math.floor((lvl - 1) / 10);
    var DM_BASE = ['初阶','中阶','高阶','进阶','超阶','终阶','极阶','究极'];
    var mod = lvl % 10;
    if (mod === 0) mod = 10;
    if (idx >= 8) return '超生命体雏形' + mod + '级';
    return DM_BASE[idx] + '变异者' + mod + '级';
  }

  var theme = {
    id: 'doomsday',
    name: '末日模拟器',
    subtitle: '末日求生 · 异能进化',
    desc: '末日降临，6 岁觉醒异能，修炼至巅峰进化为超生命体。',
    accent: '#d4af37',          /* 主题色：金色 */
    icon: '☄',
    tags: ['末日求生', '异能进化', '文字放置'],
    terms: terms,

    /* ---------- 引擎数据（复用 data/ability/events 全局对象） ---------- */
    ABILITY_POOL: W.ABILITY_POOL,
    INNATE_WEIGHTS: W.INNATE_WEIGHTS,
    BREAK_CHANCE: D.BREAK_CHANCE,
    COMBAT_COEF: D.COMBAT_COEF,
    ESSENCE: D.ESSENCE,
    SKILL_TIER: D.SKILL_TIER,
    ACHIEVEMENTS: D.ACHIEVEMENTS,
    EVENTS: EVENTS,
    GUARD: D.GUARD,
    TALENTS: TALENTS,

    /* ---------- 常量 ---------- */
    LIFE_MIN: D.LIFE_MIN,
    LIFE_MAX: D.LIFE_MAX,
    EVENT_CHANCE: D.EVENT_CHANCE,
    ESSENCE_CHANCE: D.ESSENCE_CHANCE,
    FORCED_BONUS_MIN: D.FORCED_BONUS_MIN,
    FORCED_BONUS_MAX: D.FORCED_BONUS_MAX,
    XIJING_CHANCE: D.XIJING_CHANCE,
    ORIGIN_CHANCE: D.ORIGIN_CHANCE,
    ORIGIN_BONUS: D.ORIGIN_BONUS,
    PLAYER_LV_BASE: D.PLAYER_LV_BASE,
    ASCEND_EXP: D.ASCEND_EXP,
    EXP_PER_LVL: D.EXP_PER_LVL,
    EXP_PER_LVL_EARLY: D.EXP_PER_LVL_EARLY,

    /* ---------- 函数 ---------- */
    titleOf: titleOf,
    tierName: D.tierName,
    selectSkill: D.selectSkill,
    guardInfo: D.guardInfo,

    /* ---------- 主题专属扩展（末日无） ---------- */
    initialState: {},
    hooks: {
      /* onYear(g, log, U): 每年额外逻辑（末日无） */
      /* onAscendCheck(g, log, U): 成神前注入主题加成 */
      onAscendCheck: function (g, log, U) {
        /* 金词条"完美基因"：源质炼化门槛降低20% */
        if (g.refineBoost && g.essence && g.essence.length > 0) {
          g.essence[0].needCombat = Math.floor(g.essence[0].needCombat * 0.8);
        }
      },
      /* forcedChance(combat, U, g): 金词条"超进化血脉"提升强行进化概率 */
      forcedChance: function (combat, U, g) {
        return -1; /* 返回-1表示走默认逻辑（sim.js 内部会读 g.forcedBoost） */
      }
      /* customAchieveCheck(g, ach): 主题专属成就判定（末日无） */
    }
  };

  root.THEMES = root.THEMES || {};
  root.THEMES.doomsday = theme;
})(typeof self !== 'undefined' ? self : this);