/* ============================================================
 * 主题包 · 斗破苍穹模拟器（doupo）
 * 修炼体系：斗之气→斗者→斗师→大斗师→斗灵→斗王→斗皇→斗宗→斗尊→斗帝
 * 斗气天赋 1-10（F~EX），斗技（天地玄黄），异火收服系统，焚决
 *
 * 【异火收服系统】
 *   g.fires = []  收服的异火列表（事件层）
 *   g.fenjue = false  是否拥有焚决
 *   - 无焚决者收服第 2 种异火 → 爆体而亡（g.dead = true）
 *   - 有焚决者可收服多种，但排行越高难度越大，失败亦有爆体风险
 *   g.essence = []  90级后获得的异火（引擎层，用于炼化成帝）
 * ============================================================ */
(function (root) {

  /* ---------- 常量 & 平衡数值 ---------- */
  var COMBAT_COEF = [0, 1.0, 1.5, 2.2, 3.2, 4.5, 6.3, 8.8, 12, 16, 22];
  var BREAK_CHANCE = [
    [40,  22,  10,  5,   2.5, 1.5, 1.5, 1.5, 1.5, 2,   1.5, 1.5],
    [60,  35,  16,  7,   3.5, 2,   1.5, 1.5, 1.5, 2.5, 2,   1.5],
    [80,  50,  26,  12,  6,   3,   2,   2,   2,   3,   2.5, 2],
    [100, 72,  45,  24,  12,  6,   3,   2.5, 2.5, 3.5, 2.5, 2],
    [120, 95,  68,  42,  22,  11,  5.5, 4,   3.5, 4.5, 3.5, 2.5],
    [140, 115, 92,  65,  38,  20,  10,  7,   5,   6,   4.5, 3.5],
    [165, 135, 108, 85,  55,  32,  16,  10,  6,   7,   5,   3.5],
    [200, 165, 132, 108, 75,  48,  25,  13,  7,   8,   6,   4.5],
    [250, 205, 170, 140, 110, 75,  40,  20,  10,  11,  8,   5.5],
    [310, 265, 220, 180, 145, 105, 55,  32,  15,  12,  9,   6.5]
  ];
  var TIER_NAME = ['', '黄阶下品', '黄阶中品', '黄阶上品', '人阶下品', '人阶中品', '人阶上品', '地阶下品', '地阶中品', '地阶上品', '天阶'];

  /* ---------- 功法池（按斗气天赋 1-10 分档） ---------- */
  var ABILITY_POOL = {
    1: ['基础锻体', '蛮力决', '铁骨功', '风行步', '夜视术', '听风术', '弹跳功', '硬甲术', '自愈功', '臂力功', '格斗术'],
    2: ['控火诀', '凝冰功', '雷引术', '念力移物', '隔空取物', '磁力功', '水元功', '风刃术', '土盾功', '藤缠功', '金钟罩'],
    3: ['烈焰掌', '寒霜功', '雷霆决', '念动力', '引力功', '石化功', '水罩术', '风翼功', '木元功', '磁暴功', '感知术', '骨坚功'],
    4: ['火莲诀', '冰锥连击', '连锁雷', '念力壁', '摄物功', '岩拳术', '水龙卷', '暴风击', '荆棘墙', '钢臂功', '声波功', '活化术'],
    5: ['八极崩', '大劈棺', '紫云翼', '风雷翅', '紫幽雁', '火恐爪', '金狼啸', '土御阵', '水御盾', '风紧缚', '木王甲', '玄重尺'],
    6: ['焰分噬浪尺', '大衍玄光尺', '大劈棺·极', '陨星掌', '梵毒斑', '风刹罡斩', '紫晶封印', '九霄罡风', '大须弥锤', '金刚琉璃', '烈火焚天', '裂风龙爪'],
    7: ['大天造化术', '五印玄决', '帝印决', '琉璃莲心', '三千雷动', '大须弥锤·大成', '烈火焚天·大成', '阳春白雪', '五色火凤', '冰魂寒骨掌', '九龙雷罡', '万物归元', '海心掌'],
    8: ['帝印决·大成', '大天造化术·大成', '黄泉天怒', '五印玄决·圆满', '大寂灭指', '九幽冥风', '三千焱炎·炼化', '陨落心炎·炼化', '八荒破灭', '九幽金祖', '红莲业火·真意', '空间撕裂'],
    9: ['佛怒火莲', '大寂灭指·大成', '黄泉天怒·大成', '焚决·进化', '青莲地心·真意', '净莲妖火·初悟', '金帝焚天·真意', '生灵之焱·真意', '骨灵冷火·真意', '帝印决·初悟', '大天造化·初悟'],
    10: ['帝印决·真意', '大天造化·真意', '焚决·大成', '大寂灭指·圆满', '黄泉天怒·圆满', '净莲妖火·大成', '斗帝之火', '万物化火', '太虚破', '帝品丹雷·御火', '金帝焚天·大成', '八荒破灭·真意']
  };

  var INNATE_WEIGHTS = [0, 33.0, 25.0, 11.0, 9.0, 7.0, 5.0, 4.0, 3.0, 2.0, 1.0];

  /* ---------- 异火排行榜（用于事件层收服，23 种，原著完整榜单） ----------
   * rank: 排名（1=最强）；difficulty: 收服难度（0-1，越高越难）；boost: 收服后战力加成
   * 低 rank（强火）difficulty 高、boost 大；高 rank（弱火）difficulty 低、boost 小 */
  var FIRES = [
    { id: 'fire_1',  name: '帝炎',       rank: 1,  difficulty: 0.98, boost: 100000 },
    { id: 'fire_2',  name: '虚无吞炎',   rank: 2,  difficulty: 0.95, boost: 80000 },
    { id: 'fire_3',  name: '净莲妖火',   rank: 3,  difficulty: 0.92, boost: 65000 },
    { id: 'fire_4',  name: '金帝焚天炎', rank: 4,  difficulty: 0.88, boost: 55000 },
    { id: 'fire_5',  name: '生灵之焱',   rank: 5,  difficulty: 0.82, boost: 45000 },
    { id: 'fire_6',  name: '八荒破灭焱', rank: 6,  difficulty: 0.78, boost: 38000 },
    { id: 'fire_7',  name: '九幽金祖火', rank: 7,  difficulty: 0.72, boost: 32000 },
    { id: 'fire_8',  name: '红莲业火',   rank: 8,  difficulty: 0.65, boost: 28000 },
    { id: 'fire_9',  name: '三千焱炎火', rank: 9,  difficulty: 0.58, boost: 24000 },
    { id: 'fire_10', name: '九幽风炎',   rank: 10, difficulty: 0.52, boost: 20000 },
    { id: 'fire_11', name: '骨灵冷火',   rank: 11, difficulty: 0.46, boost: 16000 },
    { id: 'fire_12', name: '九龙雷罡火', rank: 12, difficulty: 0.42, boost: 13000 },
    { id: 'fire_13', name: '归灵地火',   rank: 13, difficulty: 0.38, boost: 10000 },
    { id: 'fire_14', name: '陨落心炎',   rank: 14, difficulty: 0.34, boost: 8000 },
    { id: 'fire_15', name: '海心焰',     rank: 15, difficulty: 0.30, boost: 6000 },
    { id: 'fire_16', name: '火云水炎',   rank: 16, difficulty: 0.26, boost: 4500 },
    { id: 'fire_17', name: '火山石焰',   rank: 17, difficulty: 0.22, boost: 3500 },
    { id: 'fire_18', name: '风怒龙炎',   rank: 18, difficulty: 0.18, boost: 2500 },
    { id: 'fire_19', name: '青莲地心火', rank: 19, difficulty: 0.12, boost: 1500 },
    { id: 'fire_20', name: '幽冥毒火',   rank: 20, difficulty: 0.10, boost: 1000 },
    { id: 'fire_21', name: '阴阳双炎',   rank: 21, difficulty: 0.08, boost: 700 },
    { id: 'fire_22', name: '万兽灵火',   rank: 22, difficulty: 0.06, boost: 500 },
    { id: 'fire_23', name: '玄黄炎',     rank: 23, difficulty: 0.04, boost: 300 }
  ];

  /* ---------- 顶级异火（基因源质等价物，用于90级后炼化成帝，8 种） ---------- */
  var ESSENCE = [
    { id: 'ef_19', name: '异火·青莲地心火', needCombat: 80000, rate: 1.24 },
    { id: 'ef_14', name: '异火·陨落心炎',   needCombat: 90000, rate: 1.33 },
    { id: 'ef_11', name: '异火·骨灵冷火',   needCombat: 100000, rate: 1.42 },
    { id: 'ef_9',  name: '异火·三千焱炎火', needCombat: 110000, rate: 1.51 },
    { id: 'ef_5',  name: '异火·生灵之焱',   needCombat: 120000, rate: 1.6 },
    { id: 'ef_4',  name: '异火·金帝焚天炎', needCombat: 130000, rate: 1.69 },
    { id: 'ef_3',  name: '异火·净莲妖火',   needCombat: 140000, rate: 1.82 },
    { id: 'ef_1',  name: '异火·帝炎',       needCombat: 150000, rate: 2.05 }
  ];

  /* ---------- 斗技技能档（黄/玄/地/天/帝） ---------- */
  var SKILL_TIER = [
    { name: '黄', combatLo: 0, combatHi: 299, addLo: 10, addHi: 20 },
    { name: '玄', combatLo: 300, combatHi: 2499, addLo: 30, addHi: 60 },
    { name: '地', combatLo: 2500, combatHi: 9999, addLo: 100, addHi: 300 },
    { name: '天', combatLo: 10000, combatHi: 72499, addLo: 500, addHi: 1500 },
    { name: '帝', combatLo: 72500, combatHi: Infinity, addLo: 3000, addHi: 10000 }
  ];

  /* ---------- 斗技名称池（按档位分组，取自原著） ---------- */
  var SKILL_NAMES = {
    '黄': ['劈石腿','碎石掌','劈山掌','裂爪击','重肘击','踏裂脚','地裂掌','铁山拳','风翔步','疾风刺','卸力水镜','水曼陀罗','狮山裂'],
    '玄': ['吸掌','吹火掌','浪重叠','风推式','凝冰镜','鹰之翼','爆步','狮虎碎金吟','八极崩','草木归元','木之硬化','血杀刀法','炼火焚','电光银盾','千风罡','紫雷诀','狂狮吟','天羽指','弄焰诀','飞絮身法','影血闪','缠蛇手','狂狮怒罡','浮光幻魅','黑水界','叠浪枪法'],
    '地': ['焰分噬浪尺','三千雷动','六合游身尺','帝印决','五轮离火法','三千雷幻身','天冥修罗手','大地罡炎','凤翔杀','燕返击','紫云翼','血变秘法','兽化诀','噬生秘法','火蝠功','焚山拳','千焰剑罡','风卷诀','大裂劈棺爪','血菩提'],
    '天': ['大天造化掌','金刚琉璃身','黄泉指','黄泉掌','黄泉天怒','大寂灭指','佛怒火莲','炎之帝身','炎玄爆','异火恒古尺','火环爆','天火三玄变','龙蛇身法','太玄诀','暗影功','九重凤火诀','玄机铠','惊蛰雷法','森罗大星手','化血大法','幻魂身法','血邪功','三兽蛮荒诀','万花冰镜','魂手印','奔雷鉴','碎星刀','古圣宝鉴'],
    '帝': ['帝炎·真意','虚无吞炎·真意','焚决·大成','净莲妖火·大成','斗帝之火','万物化火','太虚破','帝品丹雷·御火','金帝焚天炎·大成','八荒破灭焱·真意']
  };
  function selectSkill(combat, ring) {
    var i, best = null;
    for (i = 0; i < SKILL_TIER.length; i++) {
      var t = SKILL_TIER[i];
      if (ring != null && (t.minRing || 1) > ring) continue;
      if (combat <= t.combatHi) return t;
      best = t;
    }
    return best || SKILL_TIER[SKILL_TIER.length - 1];
  }

  /* ---------- 斗气称号 ---------- */
  var DP_TITLES = ['', '斗之气', '斗者', '斗师', '大斗师', '斗灵', '斗王', '斗皇', '斗宗', '斗尊', '9星斗圣巅峰'];
  function titleOf(lvl) {
    lvl = Math.max(1, Math.min(100, Math.floor(lvl) || 1));
    if (lvl >= 100) return '斗帝';
    if (lvl >= 99) return '9星斗圣巅峰';
    if (lvl >= 94) return (lvl - 93) + '星斗圣';
    if (lvl >= 91) return '半圣(' + ['初级','中级','高级'][lvl - 91] + ')';
    var idx = Math.floor((lvl - 1) / 10);
    var DP_BASE = ['斗之气','斗者','斗师','大斗师','斗灵','斗王','斗皇','斗宗','斗尊'];
    var mod = lvl % 10;
    if (mod === 0) return DP_BASE[idx] + '巅峰';
    return mod + (idx === 0 ? '段' : '星') + DP_BASE[idx];
  }
  function tierName(n) {
    n = Math.max(1, Math.min(10, Math.floor(n) || 1));
    return TIER_NAME[n];
  }

  /* ---------- 保底 ---------- */
  var GUARD = [
    { lv: 25, min: 2, label: '2级（≥25级）' },
    { lv: 75, min: 3, label: '3级（≥75级）' }
  ];
  function guardInfo(lv) {
    var min = 1, label = '1级（默认）', i;
    for (i = 0; i < GUARD.length; i++) {
      if ((lv || 0) >= GUARD[i].lv) { min = GUARD[i].min; label = GUARD[i].label; }
    }
    return { min: min, label: label };
  }

  /* ---------- 成就 ---------- */
  var ACHIEVEMENTS = [
    { id: 'innate10', name: '极阶天赋',   bonus: 0.1 },
    { id: 'twin',   name: '双生异火',     bonus: 0.1 },
    { id: 'lvl71', name: '斗宗之力',     bonus: 0.1 },
    { id: 'lvl81', name: '斗尊之力',     bonus: 0.1 },
    { id: 'feng91', name: '半圣之力',    bonus: 0.1 },
    { id: 'lvl95', name: '斗圣之力',     bonus: 0.1 },
    { id: 'lvl99', name: '斗帝巅峰',     bonus: 0.2 },
    { id: 'combat100k', name: '十万斗气',   bonus: 0.1 },
    { id: 'combat300k', name: '三十万斗气', bonus: 0.2 },
    { id: 'million', name: '百万斗气',   bonus: 0.3 },
    { id: 'essence', name: '异火炼化',   bonus: 0.1 },
    { id: 'god',   name: '成就斗帝',     bonus: 0.2 },
    { id: 'forced', name: '强行成帝',    bonus: 0.3 },
    { id: 'god3',  name: '三次成帝',     bonus: 0.3 },
    { id: 'god10', name: '十次成帝',     bonus: 0.4 },
    { id: 'god30', name: '三十次成帝',   bonus: 0.5 },
    { id: 'god50', name: '五十次成帝',   bonus: 0.8 },
    { id: 'god100', name: '百次成帝',    bonus: 1 },
    { id: 'mutation', name: '斗气变异',   bonus: 1 },
    { id: 'origin', name: '帝炎降临',    bonus: 1.5 }
  ];

  /* ============================================================
   * 异火收服核心逻辑（供事件调用）
   * attemptFire(g, fire, U, log) → 返回结果文本
   *   成功：g.fires.push(fire), g.combat += boost
   *   失败：根据是否焚决判定爆体
   * ============================================================ */
  function hasFire(g, fireId) {
    if (!g.fires) return false;
    for (var i = 0; i < g.fires.length; i++) { if (g.fires[i].id === fireId) return true; }
    return false;
  }
  function attemptFire(g, fire, U, log) {
    /* 已拥有该异火 */
    if (hasFire(g, fire.id)) return '该异火已被收服，无法重复收服';

    var fires = g.fires || (g.fires = []);
    var fenjue = g.fenjue || false;

    /* 无焚决者尝试收服第 2 种异火 → 爆体而亡 */
    if (!fenjue && fires.length >= 1) {
      g.dead = true;
      g.lifespan = g.age;
      return '实力不济，强行收服第二种异火『' + fire.name + '』，体内异火失控，爆体而亡！';
    }

    /* 收服成功率：基础 0.5 - 异火难度 + 焚决加成 0.3 + 战力因素
     * 战力因素：每 10 万斗气 +5%（上限 20%） */
    var base = 0.5 - fire.difficulty * 0.5;
    if (fenjue) base += 0.3;
    var combatFactor = Math.min(0.2, (g.combat || 0) / 100000 * 0.05);
    base += combatFactor;
    base += (g.fireBonus || 0);   /* 金词条：异火亲和加成 */
    base = Math.max(0.05, Math.min(0.95, base));

    if (Math.random() < base) {
      /* 收服成功 */
      fires.push({ id: fire.id, name: fire.name, rank: fire.rank });
      g.combat += fire.boost;
      return '成功收服异火『' + fire.name + '』！斗气+' + fire.boost + '（排行第' + fire.rank + '）';
    } else {
      /* 收服失败 */
      if (fenjue) {
        /* 有焚决：失败有概率爆体（难度越高风险越大） */
        var deathRisk = fire.difficulty * 0.4;
        if (Math.random() < deathRisk) {
          g.dead = true;
          g.lifespan = g.age;
          return '收服异火『' + fire.name + '』失败！虽有焚决护体，异火仍失控，爆体而亡！';
        } else {
          var dmg = U.irand(3, 8);
          g.lifespan -= dmg;
          return '收服异火『' + fire.name + '』失败！焚决勉强压制，寿元-' + dmg;
        }
      } else {
        /* 无焚决收服第 1 种异火失败：不会爆体，但受损 */
        var dmg2 = U.irand(2, 6);
        g.lifespan -= dmg2;
        return '收服异火『' + fire.name + '』失败！异火反噬，寿元-' + dmg2;
      }
    }
  }

  /* ============================================================
   * 随机事件（斗破主题：异火现世/收服、焚决、炼药、丹雷等）
   * ============================================================ */
  var EVENTS = [
    /* ---------- tier 4 传说 ---------- */
    { id: 'dp_fenjue', weight: 0.08, maxCount: 1, name: '焚决现世', tier: 4, desc: '远古洞府中寻得焚决残卷',
      minAge: 15, maxAge: 70,
      cond: function (g, U) { return !g.fenjue && g.lvl >= 30; },
      ok: function (g, U, log) {
        g.fenjue = true;
        var lf = U.irand(5, 10); g.lifespan += lf;
        var msgs = ['焚决残卷在远古洞府深处闪烁微光，指尖触及的刹那，古老符文化作烈焰没入体内——你获得了焚决！寿元+' + lf,'沉睡万年的焚决残卷感应到你的斗气，主动飞来，磅礴的功法信息涌入脑海——焚决到手！寿元+' + lf,'药老叹息道：焚决，终于等到有缘人了。古老的功法在体内扎根，焚决现世！寿元+' + lf];
        return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_guyu', weight: 0.04, maxCount: 8, name: '陀舍古帝玉碎片', tier: 4, desc: '获得一块陀舍古帝玉碎片',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40 && (!g.guyu || g.guyu < 8); },
      ok: function (g, U, log) {
        if (!g.guyu) g.guyu = 0;
        g.guyu++;
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(0.5, 1.5));
        var msgs = ['一枚通体碧绿的玉片悬浮于空中，散发出令人心悸的远古气息——陀舍古帝玉碎片（' + g.guyu + '/8），大地微微颤抖','指尖触碰玉片的瞬间，虚空中浮现古帝虚影，转瞬即逝——你获得了陀舍古帝玉碎片（' + g.guyu + '/8）','玉片入手，一股温润而磅礴的力量沿着经脉游走，仿佛远古帝王在低语——陀舍古帝玉碎片（' + g.guyu + '/8）'];
        return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_soulorigin', weight: 0.02, maxCount: 1, name: '本源魂气', tier: 4, desc: '悟透本源魂气',
      minAge: 50, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 80 && g.alchemist && g.alchemist >= 5 && !g.soulOrigin; },
      ok: function (g, U, log) {
        g.soulOrigin = true;
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * 3);
        var lf = U.irand(10, 20); g.lifespan += lf;
        var msgs = ['灵魂深处传来远古的钟鸣，本源魂气如潮水般涌来，灵魂力在刹那间达到前所未有的巅峰！斗气暴涨，寿元+' + lf,'闭目冥想间，识海中浮现出远古斗帝的身影，本源魂气与之共鸣——你的灵魂力蜕变至巅峰！寿元+' + lf,'药老的声音在脑海中回荡：本源魂气，唯有真正悟透生死之人方可触及。灵魂力登临绝顶！寿元+' + lf];
        return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_reawaken', weight: 0.15, maxCount: 2, name: '斗气二次觉醒', tier: 4, desc: '沉寂的斗气发生二次觉醒',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= Math.min(50, Math.floor(g.age * 0.75)) + U.irand(0, 10); },
      ok: function (g, U, log) {
        var lf = U.irand(4, 8); g.lifespan += lf;
        var inc = g.innate < 6 ? U.irand(1, 3) : (g.innate <= 8 ? U.irand(1, 2) : (g.innate === 9 ? 1 : 0));
        if (inc) { g.innate = Math.min(10, g.innate + inc); g.aptitude = Math.max(g.aptitude, g.innate); }
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1.5, 2.5));
        var msgs = ['体内沉睡的斗气猛然苏醒，如岩浆般在经脉中奔涌，丹田中斗气漩涡加速旋转——二次觉醒！天赋提升 ' + inc + ' 级，寿元+' + lf,'夜半时分，斗气自体内爆涌而出，周身斗气光芒大盛，天地元气疯狂涌入——觉醒之光！天赋提升 ' + inc + ' 级，寿元+' + lf,'药老惊叹道：二次觉醒！这是万中无一的天赋蜕变！斗气在体内发生了质变，天赋提升 ' + inc + ' 级，寿元+' + lf];
        return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) { var msgs = ['觉醒之光刚亮便骤然熄灭，斗气在经脉中逆流反噬，五脏六腑隐隐作痛','强行冲击觉醒瓶颈，识海剧烈震荡，鲜血从七窍渗出，功亏一篑','药老沉声道：时机未到，强行觉醒只会伤及根基。斗气震荡不已，略有损伤']; return msgs[Math.floor(Math.random()*msgs.length)]; }
    },
    { id: 'dp_dilei', weight: 0.1, maxCount: 1, name: '九色丹雷', tier: 4, desc: '炼丹引来九色丹雷',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 70; },
      ok: function (g, U, log) {
        var lf = U.irand(8, 15); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(4, 7));
        var msgs = ['九色丹雷撕裂苍穹，紫金雷龙俯冲而下，肉身在雷光中淬炼至极——天地为之震动！寿元+' + lf,'九道不同颜色的雷霆交织成网，轰然落下，每一击都在重塑肉身筋骨——丹雷洗礼，寿元+' + lf,'仰望天际，九色丹雷如瀑布倾泻，雷光照亮了方圆百里的夜空，肉身在毁灭与重生间蜕变！寿元+' + lf];
        return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) { var msgs = ['丹雷凝聚至最后一刻却突然消散，天空恢复平静，仿佛什么都没发生','九色丹雷呼啸而来，却在半空中自行湮灭，仅留下空气中淡淡的焦糊味','丹雷散去，天际残留的雷光如流星般消逝——你与丹雷擦肩而过']; return msgs[Math.floor(Math.random()*msgs.length)]; }
    },

    /* ---------- tier 3 稀有 ---------- */
    { id: 'dp_fire_appear', weight: 0.25, maxCount: 5, name: '异火现世', tier: 3, desc: '天地间异火降临',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) {
        /* 有焚决或未收服过异火时才触发（避免无焚决者重复触发必死事件） */
        return g.lvl >= 20 && (g.fenjue || (g.fires && g.fires.length === 0) || (!g.fires));
      },
      ok: function (g, U, log) {
        /* 随机抽取异火：低 rank 权重低（稀有），高 rank 权重高（常见） */
        var pool = FIRES;
        var total = 0;
        for (var i = 0; i < pool.length; i++) total += (20 - pool[i].rank);
        var r = Math.random() * total, acc = 0, fire = pool[0];
        for (var j = 0; j < pool.length; j++) { acc += (20 - pool[j].rank); if (r < acc) { fire = pool[j]; break; } }
        if (hasFire(g, fire.id)) return '感应到异火气息，但该异火已被你收服';
        return attemptFire(g, fire, U, log);
      },
      fail: null
    },
    { id: 'dp_alchemy', weight: 0.22, maxCount: 5, name: '炼丹修炼', tier: 3, desc: '修炼炼药之术，灵魂力提升',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 15; },
      ok: function (g, U, log) {
        /* 炼药师等级：根据斗气等级判定品阶 */
        if (!g.alchemist) g.alchemist = 0;
        var grade = g.lvl < 30 ? 1 : (g.lvl < 50 ? 2 : (g.lvl < 70 ? 3 : (g.lvl < 85 ? 4 : (g.lvl < 95 ? 5 : 6))));
        var grades = ['', '一品', '二品', '三品', '四品', '五品', '六品', '七品', '八品', '九品'];
        if (grade > g.alchemist) g.alchemist = grade;
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1.2, 2.8));
        var lf = U.irand(2, 6); g.lifespan += lf;
        var msgs = ['丹炉中火焰翻涌，药材在高温中缓缓融化、融合，最终凝成一枚散发幽光的丹药——炼制' + grades[g.alchemist] + '丹药成功！灵魂力大增，斗气+' + Math.floor(r * 1.5) + '，寿元+' + lf,'药老在旁指点，你精准把控火候，丹炉中传来清脆的成丹之声——' + grades[g.alchemist] + '丹药炼成！灵魂力升华，斗气+' + Math.floor(r * 1.5) + '，寿元+' + lf,'炼药室中烟雾缭绕，你的精神力在控制火焰的过程中不断锤炼，最终丹药成型，品质远超预期——' + grades[g.alchemist] + '炼药师！斗气+' + Math.floor(r * 1.5) + '，寿元+' + lf];
        return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) { var msgs = ['火候失控，丹炉猛然炸裂，滚烫的药液溅出，灼伤了手臂','精神力不支，丹炉中的药材化为灰烬，你被反震之力震得后退数步','关键时刻分心，丹炉内灵气紊乱，轰然爆开——炼药失败，所幸伤势不重']; return msgs[Math.floor(Math.random()*msgs.length)]; }
    },
    { id: 'dp_soulpower', weight: 0.18, maxCount: 3, name: '灵魂力突破', tier: 3, desc: '灵魂力达到天境',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40 && g.alchemist && g.alchemist >= 3; },
      ok: function (g, U, log) {
        if (!g.soulRealm) g.soulRealm = 0;
        /* 灵魂力境界：1灵境→2天境→3天境大圆满 */
        var nextRealm = g.lvl >= 80 ? 3 : (g.lvl >= 60 ? 2 : 1);
        var realms = ['', '灵境', '天境', '天境大圆满'];
        if (nextRealm > g.soulRealm) {
          g.soulRealm = nextRealm;
          var r = U.combatGain(g.aptitude, g.lvl);
          g.combat += Math.floor(r * U.rand(2, 4));
          var msgs = ['灵魂力在识海中掀起惊天巨浪，突破屏障的瞬间，感知范围扩大十倍——' + realms[g.soulRealm] + '成就！炼药水平飞升，斗气暴涨','闭目凝神，灵魂力如利剑般刺穿桎梏，世界在感知中变得无比清晰——突破' + realms[g.soulRealm] + '！炼药造诣突飞猛进','药老欣慰笑道：' + realms[g.soulRealm] + '，你的灵魂力天赋远超我的预期。炼药之路更进一步'];
        return msgs[Math.floor(Math.random()*msgs.length)];
        }
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1, 2));
        var msgs = ['灵魂力在反复锤炼中愈发精纯，已稳居' + realms[g.soulRealm] + '，斗气+' + Math.floor(r * 1.5),'识海中的灵魂之力缓缓流转，' + realms[g.soulRealm] + '的境界愈发深厚，斗气+' + Math.floor(r * 1.5),'每日炼药都在无形中锤炼灵魂，' + realms[g.soulRealm] + '根基愈发扎实，斗气+' + Math.floor(r * 1.5)];
        return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_mutation', weight: 0.18, maxCount: 2, name: '斗气良性变异', tier: 3, desc: '斗气发生良性变异',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.innate >= 4 && g.lvl >= 15; },
      ok: function (g, U, log) {
        if (g.innate < 10) { g.innate += 1; g.aptitude = Math.max(g.aptitude, g.innate); }
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1, 2));
        var msgs = ['经脉中传来奇异的震颤，斗气在体内发生蜕变，原本浑浊的斗气变得纯净而炽热——良性变异！天赋提升 1 级','修炼中忽然感觉丹田中斗气质变，一股全新的力量在血脉中流淌，仿佛脱胎换骨——变异成功！天赋提升 1 级','周身斗气忽然发出淡淡光芒，药老低声道：良性变异，这是天赋跃升的征兆。天赋提升 1 级'];
        return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        var msgs = ['斗气在经脉中剧烈冲突，黑色的杂质涌入丹田——恶性变异！天赋未能提升，体内灵力紊乱，寿元受损','变异的力量失控，斗气化作狂暴的旋涡撕扯经脉，你痛苦倒地——恶性变异，寿元受损','药老面色凝重：变异失败了，斗气中混入了杂质，短时间内不可再尝试。恶性变异，寿元受损'];
        return msgs[Math.floor(Math.random()*msgs.length)];
      }
    },
    { id: 'dp_hunting', weight: 0.22, maxCount: 5, name: '猎杀魔兽', tier: 3, desc: '遭遇高阶魔兽',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1.2, 2.5));
        var msgs = ['与高阶魔兽鏖战数百回合，最终以斗技将其斩杀，魔核散发出诱人光芒——收获巨大，斗气大增','魔兽山脉深处传来震天怒吼，你与一头远古魔兽展开生死搏杀，最终将其猎杀——魔核到手，斗气飞涨','药老指导你利用异火之力克制魔兽弱点，一番苦战后终于将其击杀——高阶魔核入手，斗气暴涨'];
        return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(3, 8);
        var msgs = ['魔兽的利爪撕裂了你的防御，鲜血喷涌而出——你勉强施展身法逃脱，重伤难愈，寿元受损','远古魔兽的威压让你动弹不得，一击将你轰飞百米——你拖着重伤之躯狼狈逃走，寿元受损','药老急切喊道：快撤！这不是你能对付的！魔兽的攻击擦身而过，虽侥幸逃脱却身负重伤，寿元受损'];
        return msgs[Math.floor(Math.random()*msgs.length)];
      }
    },

    /* ---------- tier 2 中级 ---------- */
    { id: 'dp_train', weight: 0.7, maxCount: 4, name: '刻苦修炼', tier: 2, desc: '在宗门中刻苦修炼斗气',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.03, 0.10, 200); var msgs = ['闭关苦修三月，经脉中斗气如江河奔涌，斗气+' + gain,'日夜不辍修炼，丹田中斗气凝聚如实质，斗气+' + gain,'在天地元气充沛之处静修，斗气突飞猛进，斗气+' + gain,'药老指点修炼要诀，你的斗气修为精进神速，斗气+' + gain,'与同门切磋后领悟瓶颈所在，突破后斗气精进，斗气+' + gain]; return msgs[Math.floor(Math.random()*msgs.length)]; }, 
      fail: function (g, U, log) { var msgs = ['修炼途中遭遇瓶颈，斗气运转凝滞，收获寥寥','心浮气躁难以入定，经脉中斗气紊乱，此番修炼收效甚微','急于求成反而适得其反，斗气在经脉中忽强忽弱，难以精进']; return msgs[Math.floor(Math.random()*msgs.length)]; }
    },
    { id: 'dp_mediate', weight: 0.7, maxCount: 4, name: '冥想修炼', tier: 2, desc: '静坐冥想吸收天地斗气',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.02, 0.08, 150); var msgs = ['盘膝而坐，神识内观，天地斗气缓缓汇入丹田，斗气稳步增长+' + gain,'入定冥想，感知到天地间游离的元气如丝线般缠绕周身，斗气+' + gain,'心境空明，斗气自然而然地凝聚壮大，斗气稳步提升+' + gain,'在山巅静坐冥想，清晨第一缕阳光洒下时，斗气已然精进，斗气+' + gain]; return msgs[Math.floor(Math.random()*msgs.length)]; }, 
      fail: null
    },
    { id: 'dp_douji', weight: 0.6, maxCount: 4, name: '斗技演练', tier: 2, desc: '演练高阶斗技',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 10; },
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.04, 0.12, 300); var msgs = ['反复演练高阶斗技，招式愈发纯熟，斗气在实战中磨砺精进，斗气+' + gain,'与药老拆解斗技精髓，领悟了新的发力技巧，斗气暴涨，斗气+' + gain,'在演武场中挥洒自如，斗技的威力比从前强了数倍，斗气+' + gain,'一遍又一遍地演练，终于将斗技融入本能，斗气+' + gain]; return msgs[Math.floor(Math.random()*msgs.length)]; }, 
      fail: function (g, U, log) { g.lifespan -= U.irand(1, 4); var msgs = ['强行施展尚未掌握的斗技，经脉中传来撕裂般的剧痛——斗技反噬，寿元受损','运转斗技时气息逆行，一口鲜血喷出，反噬之力冲击五脏六腑，寿元受损','药老厉声喝止：收手！你的身体承受不住这股力量！斗技反噬，寿元受损']; return msgs[Math.floor(Math.random()*msgs.length)]; }
    },
    { id: 'dp_dan', weight: 0.5, maxCount: 4, name: '丹药辅助', tier: 2, desc: '服用修炼丹药',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var lf = U.irand(1, 4); g.lifespan += lf;
        g.combat += U.irand(200, 1500);
        var msgs = ['服用丹药后，温热的药力在体内扩散，全身经脉微微发烫——丹药见效！寿元+' + lf,'丹药入口即化，精纯的药力沿着经脉游走，疲惫一扫而空——寿元+' + lf,'一枚灵丹下肚，药效缓缓释放，你感觉斗气在悄然壮大——寿元+' + lf]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) { var msgs = ['丹药药力在体内暴走，经脉承受不住如此猛烈的冲击，你痛苦地蜷缩在地','药力过猛导致气血逆行，面色潮红，头晕目眩，好一阵才缓过劲来','丹药的效力远超预期，你浑身经脉像被烈火灼烧，好不容易才将多余药力逼出']; return msgs[Math.floor(Math.random()*msgs.length)]; }
    },
    { id: 'dp_tianmu', weight: 0.5, maxCount: 2, name: '天墓历练', tier: 2, desc: '进入天墓接受灵魂力洗礼',
      minAge: 40, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 50; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        var lf = U.irand(3, 8); g.lifespan += lf;
        var msgs = ['踏入天墓深处，远古灵魂力量如洪流般涌来，在你的识海中刻下深邃的印记——灵魂力大增！斗气+' + add + '，寿元+' + lf,'天墓中远古强者的残念与你的灵魂产生了奇妙共鸣，一股磅礴的灵魂力注入体内——斗气+' + add + '，寿元+' + lf,'天墓深处的修炼室中，灵魂力在时间法则的加持下飞速成长，你仿佛经历了百年的锤炼——斗气+' + add + '，寿元+' + lf]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(2, 5);
        var msgs = ['天墓深处的灵魂风暴突然袭来，你的识海被猛烈冲击，精神力几近崩溃，寿元受损','远古残念侵入识海，你拼尽全力才将其驱逐，但灵魂力已受重创，寿元受损','天墓中的灵魂试炼超出了你的承受极限，识海出现裂痕，你不得不提前退出，寿元受损']; return msgs[Math.floor(Math.random()*msgs.length)];
      }
    },
    { id: 'dp_zhongzhou', weight: 0.6, maxCount: 3, name: '中州游历', tier: 2, desc: '在中州各派历练斗气',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.0, 2.5));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        var msgs = ['游历中州各大宗门，见识了无数奇功异法，眼界大开，斗气在见闻中精进——斗气+' + add + '，寿元+' + lf,'在中州的古战场遗迹中发现前人遗留的修炼心得，结合自身感悟，斗气精进——斗气+' + add + '，寿元+' + lf,'走访丹塔、魂殿等势力，与各派高手交流切磋，斗气修为日渐精深——斗气+' + add + '，寿元+' + lf]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_guzu', weight: 0.4, maxCount: 1, name: '古族祭祖', tier: 2, desc: '参加古族祭祖大典',
      minAge: 50, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 60; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2, 4));
        g.combat += add;
        var lf = U.irand(5, 10); g.lifespan += lf;
        var msgs = ['古族祭祖大典上，远古血脉之力从先祖灵位中涌出，灌注入你的体内——血脉觉醒，气势冲天！斗气+' + add + '，寿元+' + lf,'祭坛上远古符文亮起，古族先祖的虚影浮现，目光中满是期许——血脉共鸣，天赋大增！斗气+' + add + '，寿元+' + lf,'你跪于祭坛前，血脉中沉睡的力量被唤醒，如潮水般涌遍全身——古族血脉觉醒！斗气+' + add + '，寿元+' + lf]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },

    /* ---------- tier 1 普通 ---------- */
    { id: 'dp_jianan', weight: 1.0, maxCount: 3, name: '迦南学院历练', tier: 1, desc: '在迦南学院学习炼药与斗气',
      minAge: 12, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.8));
        g.combat += add;
        var lf = U.irand(1, 3); g.lifespan += lf;
        var msgs = ['在迦南学院的内院修炼，与学友切磋炼药与斗技，修为稳步提升——斗气+' + add + '，寿元+' + lf,'迦南学院的天焚炼气塔中修炼数日，塔内异火残留的气息助你突破——斗气+' + add + '，寿元+' + lf,'在学院藏书阁研读功法典籍，与药尘前辈的传承产生共鸣——斗气+' + add + '，寿元+' + lf]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_mountain', weight: 0.9, maxCount: 3, name: '魔兽山脉历练', tier: 1, desc: '在魔兽山脉中搏杀历练',
      minAge: 10, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 1.0));
        g.combat += add;
        var msgs = ['魔兽山脉深处，你与一头三阶魔兽狭路相逢，一番激战后将其斩杀——收获颇丰，斗气+' + add,'在魔兽山脉的密林中追踪猎物，伏击成功猎杀数头低阶魔兽——斗气在实战中精进，斗气+' + add,'深入魔兽山脉腹地，与同门配合猎杀高阶魔兽，战后分享魔核——斗气+' + add,'在山脉溪谷边修炼时遭遇魔兽袭击，反将其击杀，以战养战——斗气+' + add]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        var msgs = ['魔兽山脉中突然出现一头远超预期的高阶魔兽，你被打得措手不及——重伤逃离，寿元受损','山中遭遇毒雾弥漫的区域，斗气被腐蚀，你艰难地闯出重围——寿元受损','与魔兽搏斗时失足坠入深谷，虽捡回一条命，但伤势不轻——寿元受损']; return msgs[Math.floor(Math.random()*msgs.length)];
      }
    },
    { id: 'dp_heijiao', weight: 0.7, maxCount: 3, name: '黑角域交易', tier: 1, desc: '在黑角域交换修炼资源',
      minAge: 15, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.5, 1.2));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        var msgs = ['黑角域的地下市场鱼龙混杂，你凭借眼力淘到了珍贵的修炼材料——收获颇丰，斗气+' + add + '，寿元+' + lf,'在黑角域的拍卖会上以低价拍下一枚稀有魔核，转手炼化后斗气大增——斗气+' + add + '，寿元+' + lf,'黑角域的暗巷中，你与一位神秘商人交易，以物易物换到了珍稀丹药——斗气+' + add + '，寿元+' + lf]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_yunlan', weight: 0.6, maxCount: 2, name: '云岚宗论道', tier: 1, desc: '与云岚宗弟子切磋斗技',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 5; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add;
        var msgs = ['云岚宗的论道大会上，你与各派弟子激烈辩论功法心得，收获良多——斗技精进，斗气+' + add,'与云岚宗的精英弟子切磋斗技，在实战中领悟了新的技巧——斗技精进，斗气+' + add,'云岚宗的修炼场上，你与对手斗得旗鼓相当，战后领悟了自身不足——斗技精进，斗气+' + add]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_danta', weight: 0.5, maxCount: 2, name: '丹塔炼会', tier: 1, desc: '参加丹塔炼药大会',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.6));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        var msgs = ['丹塔炼药大会上，你沉着应对，在众多炼药师中脱颖而出——炼药之术精进，斗气+' + add + '，寿元+' + lf,'丹塔的考核中，你精准掌控火候，炼出的丹药品质获得评审认可——斗气+' + add + '，寿元+' + lf,'与丹塔的炼药高手同台竞技，在压力下突破了自身的极限——斗气+' + add + '，寿元+' + lf]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },

    /* ---------- tier 4 传说（新增） ---------- */
    { id: 'dp_tuoshe_gov', weight: 0.03, maxCount: 1, name: '陀舍古帝洞府', tier: 4, desc: '集齐古帝玉，开启陀舍古帝洞府传承',
      minAge: 50, maxAge: 10000,
      cond: function (g, U) { return g.guyu && g.guyu >= 8 && g.lvl >= 80 && !g.tuosheInherit; },
      ok: function (g, U, log) {
        g.tuosheInherit = true;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(5, 8));
        g.combat += add;
        var lf = U.irand(15, 30); g.lifespan += lf;
        var msgs = [
          '八块古帝玉共鸣，陀舍古帝洞府轰然开启！你踏入其中，远古斗帝的本源传承涌入识海——斗气暴涨+' + add + '，寿元+' + lf,
          '陀舍古帝洞府中，你见到了古帝残影，他将毕生修为化作金光灌入你体内——斗气暴涨+' + add + '，寿元+' + lf,
          '洞府深处的古帝传承大阵被激活，无数远古功法在你脑海中浮现——陀舍古帝传承到手！斗气暴涨+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_xuwu', weight: 0.02, maxCount: 1, name: '虚无吞炎降临', tier: 4, desc: '虚无吞炎现世，天地色变',
      minAge: 60, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 70 && g.fenjue && !hasFire(g, 'fire_2'); },
      ok: function (g, U, log) {
        var fire = FIRES[1]; /* fire_2 虚无吞炎 */
        return attemptFire(g, fire, U, log);
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(5, 12);
        var fails = [
          '虚无吞炎降临，你以焚决之力试图镇压，奈何此火凶戾至极——反噬之力将你震飞百丈，重伤呕血',
          '虚无吞炎撕裂虚空而来，吞噬万物之力令人绝望，你拼死抵抗仍被其灼伤——仓皇遁走疗伤',
          '虚无吞炎在你面前凝聚成人形，冷笑间释放毁灭之力，你连退数里才勉强脱身——险些陨落'
        ]; return fails[Math.floor(Math.random()*fails.length)];
      }
    },
    { id: 'dp_diyan', weight: 0.01, maxCount: 1, name: '帝炎降世', tier: 4, desc: '传说中的帝炎降临斗气大陆',
      minAge: 80, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 90 && g.fenjue && !hasFire(g, 'fire_1'); },
      ok: function (g, U, log) {
        var fire = FIRES[0]; /* fire_1 帝炎 */
        return attemptFire(g, fire, U, log);
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(8, 20);
        var fails = [
          '帝炎降临，万火臣服！你拼尽全力试图触碰那团金色火焰，却被其散发的帝威震得七窍流血——不得不退',
          '帝炎降世，天地为之变色！你运转焚决全力抵抗帝炎的威压，经脉寸寸断裂——重伤遁逃',
          '帝炎的光芒照亮了半个斗气大陆，你试图靠近却被帝威压得双膝跪地，灵魂都在颤抖——收服失败'
        ]; return fails[Math.floor(Math.random()*fails.length)];
      }
    },

    /* ---------- tier 3 稀有（新增） ---------- */
    { id: 'dp_yunlan_war', weight: 0.15, maxCount: 1, name: '云岚宗大战', tier: 3, desc: '与云岚宗展开惊世大战',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 35; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2.0, 3.5));
        g.combat += add;
        var lf = U.irand(3, 7); g.lifespan += lf;
        var msgs = [
          '云岚宗之战，你以焚决之力硬撼云山，最终一掌将其击落山崖——云岚宗覆灭！斗气+' + add + '，寿元+' + lf,
          '与云山大战三百回合，你体内的异火骤然暴动，焚决自行运转将其重伤！云岚宗归降，斗气+' + add + '，寿元+' + lf,
          '你孤身闯入云岚宗大殿，云山使出全部底牌仍不敌你的异火之力——加玛帝国再无阻碍！斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(4, 10);
        var fails = [
          '云山隐藏的实力远超预期，你被一掌击飞数百丈，重伤吐血——不得不退走疗伤',
          '战斗中你旧伤复发，异火失控反噬，云山趁机重创于你，仓皇逃遁',
          '云岚宗护山大阵发动，你陷入重围，拼尽全力才杀出一条血路'
        ]; return fails[Math.floor(Math.random()*fails.length)];
      }
    },
    { id: 'dp_jiama_alch', weight: 0.18, maxCount: 2, name: '加玛帝国炼药大赛', tier: 3, desc: '参加加玛帝国皇家炼药大赛',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 25 && g.alchemist && g.alchemist >= 2; },
      ok: function (g, U, log) {
        if (!g.alchemist) g.alchemist = 0;
        if (g.alchemist < 4) g.alchemist = Math.min(4, g.alchemist + 1);
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 2.5));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        var msgs = [
          '加玛帝国炼药大赛上，你以一炉完美丹药震惊全场，法码亲自为你加冕——炼药师等阶提升，斗气+' + add + '，寿元+' + lf,
          '决赛中你精准操控异火，丹药成形时引来丹云异象，评委们惊叹不已——炼药师等阶提升，斗气+' + add + '，寿元+' + lf,
          '你以远超同阶的炼药之术碾压群雄，纳兰家主亲自邀请你成为客卿——炼药师等阶提升，斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) { var fails = [
          '你在决赛中火候失控，丹炉炸裂，碎片四溅——名次旁落',
          '炼药途中杂念丛生，丹药品质大跌，评审摇头叹息',
          '关键时刻药材配比出错，炼出的丹药纹路尽失——遗憾落败'
        ]; return fails[Math.floor(Math.random()*fails.length)]; }
    },
    { id: 'dp_heiyin_auc', weight: 0.2, maxCount: 2, name: '黑印城拍卖会', tier: 3, desc: '在黑印城拍卖会获得珍稀宝物',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 2.8));
        g.combat += add;
        var lf = U.irand(3, 6); g.lifespan += lf;
        var msgs = [
          '黑印城拍卖会上，你以高价拍下一枚远古丹药，服用后斗气暴涨——斗气+' + add + '，寿元+' + lf,
          '拍卖会暗中有人抬价，你以雷霆手段震慑对手，最终以合理价格拿下压轴珍品——斗气+' + add + '，寿元+' + lf,
          '你在黑印城拍卖会的密室拍卖中发现了一件被遗忘的古物，其中蕴含的力量令你震惊——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_zhongzhou_4', weight: 0.15, maxCount: 2, name: '中州四阁论道', tier: 3, desc: '中州四阁论道大会，与各派高手切磋',
      minAge: 35, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 50; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2.0, 3.2));
        g.combat += add;
        var lf = U.irand(3, 7); g.lifespan += lf;
        var msgs = [
          '中州四阁论道大会，你以深不可测的斗气修为折服四方高手，被推为本届魁首——斗气+' + add + '，寿元+' + lf,
          '论道交锋中你引经据典，将功法理论与实战经验融会贯通，四阁长老齐声喝彩——斗气+' + add + '，寿元+' + lf,
          '你在四阁论道中展露出跨越境界的感悟，连药老都赞叹你对斗气的理解已登堂入室——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(2, 5);
        var fails = [
          '论道交锋中对方以诡异的魂力攻击扰乱你的心神，你吐血败退——寿元受损',
          '四阁高手联手以秘术围攻你一人，你寡不敌众，身受重伤跌落论道台——寿元受损',
          '论道时你心浮气躁，斗气运转出岔，被对手趁虚而入——败退回府疗伤'
        ]; return fails[Math.floor(Math.random()*fails.length)];
      }
    },
    { id: 'dp_guzu_sky', weight: 0.15, maxCount: 1, name: '古族祭天', tier: 3, desc: '参加古族祭天大典，受神血洗礼',
      minAge: 40, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 55; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2.5, 4.0));
        g.combat += add;
        var lf = U.irand(5, 12); g.lifespan += lf;
        var msgs = [
          '古族祭天大典上，神血从天而降灌入你体内，古族血脉在体内沸腾——神血洗礼，斗气+' + add + '，寿元+' + lf,
          '祭天仪式中你被选为神血承载者，远古血脉的力量在体内觉醒——古族神血洗礼，斗气+' + add + '，寿元+' + lf,
          '你跪于祭坛之上，古族先祖的英灵降下神血洗礼，全身经脉焕然一新——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_taixu_dragon', weight: 0.12, maxCount: 1, name: '太虚古龙洞府', tier: 3, desc: '探索太虚古龙一族的洞府遗迹',
      minAge: 45, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 60; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2.5, 4.5));
        g.combat += add;
        var lf = U.irand(4, 10); g.lifespan += lf;
        var msgs = [
          '太虚古龙洞府深处，你触发了龙族禁制，古龙残魂将毕生修为灌入你体内——获得龙族传承，斗气+' + add + '，寿元+' + lf,
          '你在洞府中发现了太虚古龙蜕下的龙骨，以斗气共鸣激发其中封印的力量——龙族传承觉醒，斗气+' + add + '，寿元+' + lf,
          '洞府深处的龙族祭坛亮起金光，太虚古龙一族的传承功法烙印在你的识海之中——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(3, 8);
        var fails = [
          '太虚古龙残魂突然暴起攻击，你以焚决抵挡仍被龙威震伤——仓皇逃出洞府',
          '洞府中的龙族禁制被触发，万道龙息将你困在其中，你拼死突围方才脱险——寿元受损',
          '你触碰了龙族禁忌，古龙残魂化作金色巨龙向你扑来——你被龙爪击飞，重伤遁走'
        ]; return fails[Math.floor(Math.random()*fails.length)];
      }
    },
    { id: 'dp_soul_palace', weight: 0.2, maxCount: 3, name: '魂殿追杀', tier: 3, desc: '魂殿高手追杀，险象环生',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 45; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.8, 3.0));
        g.combat += add;
        var msgs = [
          '魂殿黑袍使者拦住去路，你以异火之力焚尽其魂术，将其斩于剑下——击退魂殿追杀！斗气+' + add,
          '魂殿三位斗皇联手围杀你一人，你施展斗技连破三重封锁，反杀一人后扬长而去——斗气+' + add,
          '魂殿追杀者以灵魂攻击偷袭，你以焚决护体将其反噬，对方惨叫着化为灰烬——斗气+' + add
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(5, 12);
        var fails = [
          '魂殿斗尊亲自出手，一击震碎你的护体斗气，你重伤倒地——拼尽最后的力量才逃出生天',
          '魂殿追杀者的灵魂攻击直击识海，你意识模糊间被重创，若非同伴救援早已陨落——寿元大损',
          '魂殿三名杀手以锁魂阵困住你，你以自爆一缕灵魂为代价才破阵逃出——伤势极重'
        ]; return fails[Math.floor(Math.random()*fails.length)];
      }
    },

    /* ---------- tier 2 中级（新增） ---------- */
    { id: 'dp_jianan_inner', weight: 0.5, maxCount: 3, name: '迦南学院内院', tier: 2, desc: '进入迦南学院内院修炼',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.0, 2.0));
        g.combat += add;
        var lf = U.irand(2, 4); g.lifespan += lf;
        var msgs = [
          '迦南学院内院的天焚炼气塔中，你吸收陨落心炎残余的热量修炼，修为突飞猛进——斗气+' + add + '，寿元+' + lf,
          '你在内院与学员切磋，以战代修，在实战中领悟了斗气运用的新层次——斗气+' + add + '，寿元+' + lf,
          '内院深处的修炼密室中，你沉下心来打磨根基，斗气质量有了质的飞跃——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_heijiao_massacre', weight: 0.45, maxCount: 2, name: '黑角域血洗', tier: 2, desc: '血洗黑角域各方势力',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 35; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 2.5));
        g.combat += add;
        var msgs = [
          '你在黑角域一路横推，以雷霆手段扫荡各方势力，血气冲天——黑角域为之颤抖！斗气+' + add,
          '黑角域群雄聚战，你以一敌百，焚决之力将对手尽数击败，威震黑角域——斗气+' + add,
          '你以铁血手腕清洗了黑角域的暗杀组织，无数亡命之徒倒在你的斗技之下——斗气+' + add
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(2, 6);
        var fails = [
          '黑角域各方势力联合围杀你一人，你以焚决之力杀出重围，但身负重伤——寿元受损',
          '你在黑角域遭遇埋伏，数十名亡命之徒以毒术围攻，你中毒后勉强脱身——寿元受损',
          '黑角域的暗杀组织派出了超越你实力的杀手，你被打得节节败退，仓皇逃走——寿元受损'
        ]; return fails[Math.floor(Math.random()*fails.length)];
      }
    },
    { id: 'dp_mountain_deep', weight: 0.55, maxCount: 3, name: '魔兽山脉深处', tier: 2, desc: '深入魔兽山脉腹地猎杀高阶魔兽',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.2, 2.2));
        g.combat += add;
        var msgs = [
          '你在魔兽山脉深处遭遇一头八阶魔兽，以异火将其逼入绝境后斩杀——猎杀成功，斗气+' + add,
          '深入魔兽山脉猎杀高阶魔兽，你以斗技配合异火之力将一头高阶魔兽击杀——斗气+' + add,
          '魔兽山脉中你与高阶魔兽激战三日三夜，最终将其击杀——收获丰厚，斗气+' + add
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(2, 5);
        var fails = [
          '你在魔兽山脉深处遭遇一头超越你实力的高阶魔兽，被一掌拍飞，重伤逃遁——寿元受损',
          '猎杀魔兽时你中了剧毒的陷阱，高阶魔兽趁机偷袭，你拼死才逃出魔兽山脉——寿元受损',
          '你与高阶魔兽苦战数日，异火耗尽仍不敌，被迫以禁术逃脱——身负重伤'
        ]; return fails[Math.floor(Math.random()*fails.length)];
      }
    },
    { id: 'dp_danta_grand', weight: 0.4, maxCount: 2, name: '丹塔炼药大会', tier: 2, desc: '参加丹塔主办的炼药大会',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40 && g.alchemist && g.alchemist >= 3; },
      ok: function (g, U, log) {
        if (g.alchemist && g.alchemist < 5) g.alchemist = Math.min(5, g.alchemist + 1);
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.2, 2.0));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        var msgs = [
          '丹塔炼药大会上，你以超凡的火候控制炼出九转丹药，药尘亲自赐下奖励——炼药师等阶精进，斗气+' + add + '，寿元+' + lf,
          '你在丹塔大会中展现出远超品阶的炼药手法，连丹塔大长老都为之动容——炼药师等阶精进，斗气+' + add + '，寿元+' + lf,
          '丹塔大会决赛中你以异火为引，炼出了品质超越极限的丹药，引来天地异象——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) { var fails = [
          '你在丹塔大会中火候失控，丹炉炸裂，碎片纷飞——名次旁落',
          '炼药途中你精神不集中导致丹药品质骤降，丹塔评委纷纷摇头',
          '关键时刻你体内的异火突然暴动，丹炉中的药液化为灰烬——遗憾落败'
        ]; return fails[Math.floor(Math.random()*fails.length)]; }
    },
    { id: 'dp_tianmu_train', weight: 0.5, maxCount: 2, name: '天目山修行', tier: 2, desc: '在天目山灵脉之地闭关修行',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 35; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.2, 2.3));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        var msgs = [
          '天目山灵脉中天地元气浓郁至极，你盘膝闭关，斗气在体内不断凝练升华——斗气+' + add + '，寿元+' + lf,
          '你在天目山灵脉深处发现了一处远古洞府遗迹，其中残留的功法残卷令你受益匪浅——斗气+' + add + '，寿元+' + lf,
          '天目山灵脉的灵气如潮水般涌入你的丹田，斗气品质发生了蜕变——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_fenglei', weight: 0.5, maxCount: 3, name: '风雷阁历练', tier: 2, desc: '在中州风雷阁修行风雷之力',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.0, 2.0));
        g.combat += add;
        var lf = U.irand(2, 4); g.lifespan += lf;
        var msgs = [
          '风雷阁中你以肉身承受风雷洗礼，领悟了风雷交融的奥义——风雷之力觉醒，斗气+' + add + '，寿元+' + lf,
          '你在风雷阁的雷池中历练，万道雷霆劈身而过，你的肉身与斗气同时蜕变——斗气+' + add + '，寿元+' + lf,
          '风雷阁的长老以秘术引导你感受天地风雷，你豁然开朗——领悟了风雷之力的真谛，斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 4);
        return '风雷阁历练被风雷反噬，寿元受损';
      }
    },
    { id: 'dp_xingyue_inh', weight: 0.35, maxCount: 1, name: '星陨阁传承', tier: 2, desc: '获得星陨阁远古传承',
      minAge: 40, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 55; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2.0, 3.0));
        g.combat += add;
        var lf = U.irand(4, 8); g.lifespan += lf;
        var msgs = [
          '星陨阁的传承塔中，你触碰到一颗陨石之心，远古传承灌入识海——获得星陨阁传承，斗气+' + add + '，寿元+' + lf,
          '你在星陨阁的秘境中找到了远古先贤留下的传承玉简，其中记载的功法博大精深——斗气+' + add + '，寿元+' + lf,
          '星陨阁的传承大阵被你的斗气激活，无数星辰之力汇聚于你一身——远古传承觉醒，斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_zhongzhou_xing', weight: 0.45, maxCount: 2, name: '中州星陨阁', tier: 2, desc: '在中州星陨阁修行斗气',
      minAge: 35, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 45; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.2, 2.2));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        var msgs = [
          '在中州星陨阁修行期间，你日夜苦修不辍，斗气修为稳步提升——斗气+' + add + '，寿元+' + lf,
          '星陨阁中你以星辰之力淬炼斗气，你的实力在不知不觉中有了质的飞跃——斗气+' + add + '，寿元+' + lf,
          '你在星陨阁的修炼场中与同门切磋，在实战中不断完善自己的功法——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_hanjia', weight: 0.55, maxCount: 3, name: '韩家切磋', tier: 2, desc: '与中州韩家高手切磋斗技',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 35; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.0, 1.8));
        g.combat += add;
        var msgs = [
          '韩家举办的斗技切磋会上，你以精妙的斗技连败数名高手，韩家家主亲自设宴款待——斗技精进，斗气+' + add,
          '你在韩家与弟子切磋斗技，一招佛怒火莲震慑全场，无人敢再上前——斗技精进，斗气+' + add,
          '韩家的年轻高手向你发起挑战，你以三招将其击败，技惊四座——斗技精进，斗气+' + add
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '韩家切磋落败，受轻伤，寿元略损';
      }
    },
    { id: 'dp_guzu_lib', weight: 0.4, maxCount: 1, name: '古族藏书阁', tier: 2, desc: '进入古族藏书阁研读远古功法',
      minAge: 35, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 50; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.8, 2.8));
        g.combat += add;
        var lf = U.irand(3, 6); g.lifespan += lf;
        var msgs = [
          '你在古族藏书阁中研读远古功法残卷，其中蕴含的斗气运用之道令你豁然开朗——斗气+' + add + '，寿元+' + lf,
          '藏书阁深处的禁地中，你找到了一部失传已久的远古功法，修炼后斗气暴涨——斗气+' + add + '，寿元+' + lf,
          '古族长老破例让你进入藏书阁最高层，你从中领悟了远古斗帝的修炼心法——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },

    /* ---------- tier 1 普通（新增） ---------- */
    { id: 'dp_wutan', weight: 1.0, maxCount: 3, name: '乌坦城历练', tier: 1, desc: '在乌坦城周边历练斗气',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.8));
        g.combat += add;
        var msgs = [
          '乌坦城中你偶遇一位隐世高人，指点你修炼中的瓶颈——斗气+' + add,
          '在乌坦城的历练中你走遍大街小巷，感悟人间百态，心境提升带动斗气精进——斗气+' + add,
          '乌坦城外你与盗匪交手，在实战中磨炼了斗技的运用——斗气+' + add
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_devil_train', weight: 0.9, maxCount: 3, name: '魔鬼训练', tier: 1, desc: '接受魔鬼式斗气训练',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 0.9));
        g.combat += add;
        var msgs = [
          '你以近乎自残的方式进行魔鬼训练，在极限突破中斗气突飞猛进——斗气+' + add,
          '连续数月不眠不休的魔鬼训练，你的身体与斗气都经历了脱胎换骨——斗气+' + add,
          '魔鬼训练中你不断挑战自身极限，每一次突破都让斗气更加凝练——斗气+' + add
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 2);
        return '魔鬼训练过劳，寿元略损';
      }
    },
    { id: 'dp_douji_field', weight: 0.85, maxCount: 3, name: '斗技演练场', tier: 1, desc: '在斗技演练场切磋斗技',
      minAge: 8, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 5; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add;
        var msgs = [
          '你在斗技演练场与各路高手过招，以战代修，斗技与斗气同步提升——斗气+' + add,
          '演练场中你与强者交手数十招，从每一次攻防中领悟斗气运用的新技巧——斗气+' + add,
          '斗技演练场上你展现出超越等级的实力，连场管事都对你另眼相看——斗气+' + add
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_qingyang', weight: 0.8, maxCount: 3, name: '青阳镇商队', tier: 1, desc: '护送青阳镇商队，获得报酬',
      minAge: 10, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 0.9));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        var msgs = [
          '你护送青阳镇商队穿越魔兽山脉，途中击退数波盗匪——商队平安到达，斗气+' + add + '，寿元+' + lf,
          '护送商队途中你与一头高阶魔兽搏斗，以斗技将其击退，保护了商队安全——斗气+' + add + '，寿元+' + lf,
          '青阳镇商队在你的护卫下穿越了黑角域最危险的路段，沿途的历练让你收获颇丰——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_jiama_saint', weight: 0.75, maxCount: 3, name: '加玛圣城游历', tier: 1, desc: '在加玛帝国圣城游历修炼',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 10; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 0.8));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        var msgs = [
          '你在加玛圣城游历时偶入一家丹药铺，店主以极低价格出售了一枚珍稀丹药——斗气+' + add + '，寿元+' + lf,
          '加玛圣城中你参加了一场地下斗技场，连胜三场后获得了丰厚的修炼资源——斗气+' + add + '，寿元+' + lf,
          '你在加玛圣城的拍卖行中发现了一本远古功法残卷，修炼后受益匪浅——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_heiyan_alch', weight: 0.7, maxCount: 3, name: '黑岩城炼药', tier: 1, desc: '在黑岩城学习炼药之术',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 12; },
      ok: function (g, U, log) {
        if (!g.alchemist) g.alchemist = 1;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        var msgs = [
          '你在黑岩城跟随一位炼药大师学习，终于掌握了炼药的基本功法——成为炼药师，斗气+' + add + '，寿元+' + lf,
          '黑岩城的炼药工坊中，你第一次成功炼出了一品丹药，正式踏入炼药师的行列——斗气+' + add + '，寿元+' + lf,
          '你在黑岩城的炼药考核中表现出色，被授予炼药师资格——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_yejia', weight: 0.7, maxCount: 3, name: '叶家商队', tier: 1, desc: '随叶家商队行走历练',
      minAge: 12, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        var msgs = [
          '你随叶家商队行走四方，沿途见识了各地的斗技流派，眼界大开——斗气+' + add + '，寿元+' + lf,
          '叶家商队在途经一处远古遗迹时遭遇危险，你出手化解危机——斗气+' + add + '，寿元+' + lf,
          '随叶家商队历练期间，你在行商途中以修炼代替休息，效率极高——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    },
    { id: 'dp_zhongzhou_edge', weight: 0.8, maxCount: 3, name: '中州边缘历练', tier: 1, desc: '在中州边缘地带历练',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 25; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 0.9));
        g.combat += add;
        var msgs = [
          '你在中州边缘地带游历，以实战磨炼自身实力——斗气+' + add,
          '中州边缘的一处修炼圣地中，你吸收天地元气，斗气有了明显提升——斗气+' + add,
          '你在中州边缘与各族高手交手，每一次战斗都让你对斗气的理解更深一层——斗气+' + add
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        var fails = [
          '中州边缘的一位高手以暗器偷袭，你躲闪不及受了重伤——寿元受损',
          '你在中州边缘的密林中遭遇毒瘴，异火也被侵蚀，你不得不闭关解毒——寿元受损',
          '中州边缘的修士以阵法困住你，你拼尽全力破阵后才发现已受了内伤——寿元受损'
        ]; return fails[Math.floor(Math.random()*fails.length)];
      }
    },
    { id: 'dp_hanfeng', weight: 0.65, maxCount: 2, name: '韩枫旧部', tier: 1, desc: '遭遇韩枫旧部，发生冲突',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.5, 1.0));
        g.combat += add;
        var msgs = [
          '韩枫旧部数人拦路，你以焚决之力将他们尽数击溃——击败韩枫旧部！斗气+' + add,
          '你遭遇韩枫旧部的围杀，以斗技连破三人后将其首领斩于剑下——斗气+' + add,
          '韩枫旧部试图以毒术暗算你，你以异火焚尽毒物后反杀——斗气+' + add
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 4);
        var fails = [
          '韩枫旧部以毒术偷袭你，你中毒后被围攻，拼死突围——寿元受损',
          '韩枫旧部中隐藏着一位斗皇级强者，你被其重创后仓皇逃走——寿元受损',
          '你中了韩枫旧部的圈套，被多人联手攻击，身负重伤方才脱身——寿元受损'
        ]; return fails[Math.floor(Math.random()*fails.length)];
      }
    },
    { id: 'dp_xiaojia_lib', weight: 0.7, maxCount: 1, name: '萧家密库', tier: 1, desc: '进入萧家密库获取修炼资源',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 8; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.5, 1.0));
        g.combat += add;
        var lf = U.irand(1, 3); g.lifespan += lf;
        var msgs = [
          '你进入萧家密库，发现了大量珍稀丹药和功法秘籍——资源入账，斗气+' + add + '，寿元+' + lf,
          '萧家密库深处藏有远古先祖留下的修炼资源，你以血脉共鸣将其激活——斗气+' + add + '，寿元+' + lf,
          '你在萧家密库中找到了一枚记载焚决奥义的玉简，修炼后收获巨大——斗气+' + add + '，寿元+' + lf
        ]; return msgs[Math.floor(Math.random()*msgs.length)];
      },
      fail: null
    }
  ];

  /* ============================================================
   * 术语映射 terms
   * ============================================================ */
  var terms = {
    simulatorName: '斗破苍穹模拟器',
    ability: '功法',
    abilityTalent: '血脉之力',
    combat: '斗气',
    level: '斗气等级',
    lifespan: '寿元',
    skill: '斗技',
    skillTier: '斗技阶',
    essence: '异火',
    essenceShort: '异火',
    ascend: '斗帝',
    ascendVerb: '成帝',
    cultivateVerb: '修炼',
    breakVerb: '突破',
    ageUnit: '岁',
    innateTiers: TIER_NAME,
    peakLv: 99,
    godLevel: 100,

    year: function (age) { return '第' + age + '岁，修炼'; },
    breakSuccess: function (age) { return '第' + age + '岁，修炼，成功突破！'; },
    combo: function (age) { return '第' + age + '岁，修炼，连破！'; },
    yearCombat: function (age, gain) { return '第' + age + '岁，修炼，斗气+' + gain; },
    death: function (age) { return '第' + age + '岁，寿元耗尽，与世长辞'; },
    deathEvent: function (age) { return '第' + age + '岁，寿元将尽时遭遇变故，不幸陨落'; },
    mutation: function (age) { return '第' + age + '岁，斗气变异！天赋跃升至极阶 EX，寿元+50'; },
    origin: function (age) { return '第' + age + '岁，帝炎降临，直接成帝！'; },
    getEssence: function (age, name, gain) { return '第' + age + '岁，获得异火『' + name + '』，斗气+' + gain; },
    awakenSkill: function (peak, tierName, add) { return '修为达到' + peak + '级，领悟' + tierName + '阶斗技，斗气+' + add; },
    levelUp: function (from, to, cg, lg) { return '等级' + from + '→' + to + '级，斗气+' + cg + (lg ? '，寿元+' + lg : '') + '！'; },
    peakLevelUp: function () { return '等级抵达巅峰后，有所领悟，斗气+10000！'; },
    refineSuccess: function (age, name) { return '第' + age + '岁，寿元将尽，成功炼化异火，成功晋入斗帝阶别，飞升成帝，帝名：' + (name || '斗帝') + '！'; },
    refineFail: function (age, boost) { return '第' + age + '岁，异火炼化失败，但斗气有所提升，斗气+' + boost; },
    forcedAscend: function (age, name) { return '第' + age + '岁，寿元将尽，强行突破，成功晋入斗帝阶别，飞升成帝，帝名：' + (name || '斗帝') + '！'; },
    forcedFail: function (age) { return '第' + age + '岁，强行成帝失败，斗气崩解陨落'; },

    settleGodTitle: '✨ 斗帝降临 ✨',
    settleDeadTitle: '💀 寿终正寝',
    settleFailTitle: '⚡ 成帝失败 · 崩解',
    settlePauseTitle: '⏸ 提前结算',
    settleGodDesc: '✨ 成功突破帝级，蜕变为斗帝 ✨',
    settleAgeLabelAscend: '成帝用时',
    settleAgeLabelDead: '存活年数',
    refineFailHint: function (ascended) {
      return ascended ? ' —— 异火炼化失败，改由强行成帝' : ' —— 异火炼化失败（斗气不足），转入强行成帝，惜败';
    },

    homeSub: '——斗气修炼，看看你能成为斗帝的那个天命之子吗？——',
    aboutText: '斗破苍穹，斗气大陆，六岁觉醒斗气天赋，<b>随机抽取</b>功法和寿元，开始修炼之路，还可能遇到各种机缘与变异，天赋 F 级，亦有逆天翻盘的机会~<br>你唯一的目标，就是成帝——修炼至巅峰（99 级）即可尝试强行成帝，更有机会获得 <b>异火</b>，炼化异火即可晋升斗帝，大幅提升成帝概率！<br>有焚决者可收服多种异火，无焚决者收服两种即爆体而亡！每局结束时获得经验提升玩家等级，等级越高觉醒强大功法几率越大，快来试试——你，会不会是那个 <b>斗帝</b> 的天命之子？',

    exportTitle: '斗破苍穹模拟器',
    exportFooter: '斗破苍穹模拟器 —— 看看你能成为斗帝的那个天命之子吗？',
    exportCardTitle: '斗破苍穹 · 高光时刻',
    reviewTitle: '斗破苍穹模拟器',
    guardMaskTitle: '🎲 保底 · 天阶 血脉之力',
    guardTalentRow: '血脉品阶：黄阶下品+5 / 黄阶中品+4 / 黄阶上品+3 / 人阶下品+2 / 人阶中品及以上+1',
    guardLevelRow: '等级（按等级）：81级+3 / 91级+5 / 95级+8 / 99级+10 / 斗帝+30',
    guardHint: '积分满 100 后，下一次开始游戏必定觉醒<b>天阶 血脉</b>，随后积分清零重新累计。',
    alchemistGrades: ['', '一品', '二品', '三品', '四品', '五品', '六品', '七品', '八品', '九品'],
    soulRealms: ['', '灵境', '天境', '天境大圆满']
  };

  var TALENTS = [
    /* ====== 绿词条：小幅增益 ====== */
    { id:'dp_t1', name:'斗气温养', rarity:'green', desc:'初始斗气+80', apply:function(g){ g.combat += 80; } },
    { id:'dp_t2', name:'强体丹', rarity:'green', desc:'寿元+8', apply:function(g){ g.lifespan += 8; } },
    { id:'dp_t3', name:'功法亲和', rarity:'green', desc:'斗气+12%', apply:function(g){ g.combat = Math.floor(g.combat * 1.12); } },
    { id:'dp_t4', name:'药老指点', rarity:'green', desc:'寿元+5，斗气+30', apply:function(g){ g.lifespan += 5; g.combat += 30; } },
    { id:'dp_t5', name:'斗气凝练', rarity:'green', desc:'初始等级+1', apply:function(g){ g.lvl += 1; } },
    { id:'dp_t16', name:'勤修苦练', rarity:'green', desc:'斗气+8%，寿元+5', apply:function(g){ g.combat = Math.floor(g.combat * 1.08); g.lifespan += 5; } },
    { id:'dp_t17', name:'根基扎实', rarity:'green', desc:'等级+1，斗气+5%', apply:function(g){ g.lvl += 1; g.combat = Math.floor(g.combat * 1.05); } },

    /* ====== 蓝词条：中等增益 + 小特殊效果 ====== */
    { id:'dp_t6', name:'斗气精通', rarity:'blue', desc:'斗气+25%', apply:function(g){ g.combat = Math.floor(g.combat * 1.25); } },
    { id:'dp_t7', name:'延寿灵丹', rarity:'blue', desc:'寿元+20', apply:function(g){ g.lifespan += 20; } },
    { id:'dp_t8', name:'血脉觉醒', rarity:'blue', desc:'初始等级+3', apply:function(g){ g.lvl += 3; } },
    { id:'dp_t9', name:'斗气天赋', rarity:'blue', desc:'斗气+300，寿元+10', apply:function(g){ g.combat += 300; g.lifespan += 10; } },
    { id:'dp_t10', name:'灵药辅助', rarity:'blue', desc:'寿元+12，斗气+15%', apply:function(g){ g.lifespan += 12; g.combat = Math.floor(g.combat * 1.15); } },
    { id:'dp_t20', name:'异火感应', rarity:'blue', desc:'异火收服概率+8%', apply:function(g){ g.fireBonus = (g.fireBonus || 0) + 0.08; } },
    { id:'dp_t21', name:'焚决残页', rarity:'blue', desc:'斗气+15%，等级+1', apply:function(g){ g.combat = Math.floor(g.combat * 1.15); g.lvl += 1; } },

    /* ====== 紫词条：显著增益 + 机制加成 ====== */
    { id:'dp_t11', name:'血脉变异', rarity:'purple', desc:'天赋+1，斗气+20%', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.combat = Math.floor(g.combat * 1.2); } },
    { id:'dp_t12', name:'斗气暴增', rarity:'purple', desc:'斗气+50%，寿元+15', apply:function(g){ g.combat = Math.floor(g.combat * 1.5); g.lifespan += 15; } },
    { id:'dp_t13', name:'六品丹药', rarity:'purple', desc:'寿元+30，斗气+25%', apply:function(g){ g.lifespan += 30; g.combat = Math.floor(g.combat * 1.25); } },
    { id:'dp_t24', name:'异火亲和', rarity:'purple', desc:'异火收服概率+15%，斗气+20%', apply:function(g){ g.fireBonus = (g.fireBonus || 0) + 0.15; g.combat = Math.floor(g.combat * 1.2); } },

    /* ====== 金词条：改变命运，大幅提升飞升概率 ====== */
    { id:'dp_t14', name:'帝炎血脉', rarity:'gold', desc:'天赋+2，成帝概率+5%，开局获3块陀舍古帝玉', apply:function(g){ g.innate = Math.min(10, g.innate + 2); g.aptitude = Math.max(g.aptitude, g.innate); g.ascendBonus = (g.ascendBonus || 0) + 0.05; g.guyu = (g.guyu || 0) + 3; } },
    { id:'dp_t15', name:'斗帝传承', rarity:'gold', desc:'天赋+1，成帝概率+5%，开局预悟本源魂气', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.ascendBonus = (g.ascendBonus || 0) + 0.05; g.soulOriginReady = true; } },
    { id:'dp_t25', name:'焚决觉醒', rarity:'gold', desc:'开局获得焚决，可收服多种异火，成帝概率+8%', apply:function(g){ g.fenjue = true; g.ascendBonus = (g.ascendBonus || 0) + 0.08; g.lifespan += 15; } },
    { id:'dp_t26', name:'异火之体', rarity:'gold', desc:'异火收服概率+25%，斗气+30%，成帝概率+3%', apply:function(g){ g.fireBonus = (g.fireBonus || 0) + 0.25; g.combat = Math.floor(g.combat * 1.3); g.ascendBonus = (g.ascendBonus || 0) + 0.03; } },
    { id:'dp_t27', name:'药帝传人', rarity:'gold', desc:'开局炼药六品，成帝概率+6%，寿元+25', apply:function(g){ g.alchemist = 6; g.ascendBonus = (g.ascendBonus || 0) + 0.06; g.lifespan += 25; } },
    { id:'dp_t28', name:'古帝转世', rarity:'gold', desc:'天赋+2，开局获5块陀舍古帝玉，成帝概率+10%', apply:function(g){ g.innate = Math.min(10, g.innate + 2); g.aptitude = Math.max(g.aptitude, g.innate); g.guyu = (g.guyu || 0) + 5; g.ascendBonus = (g.ascendBonus || 0) + 0.10; } },
    { id:'dp_t29', name:'天命之子', rarity:'gold', desc:'幸运加持，异火收服+15%，成帝+5%', apply:function(g){ g.fireBonus = (g.fireBonus || 0) + 0.15; g.ascendBonus = (g.ascendBonus || 0) + 0.05; g.luckBonus = (g.luckBonus || 0) + 1; } },
    { id:'dp_t30', name:'药老附体', rarity:'gold', desc:'开局炼药八品，成帝概率+8%，寿元+20', apply:function(g){ g.alchemist = 8; g.ascendBonus = (g.ascendBonus || 0) + 0.08; g.lifespan += 20; } },
    { id:'dp_t31', name:'异火天降', rarity:'gold', desc:'开局随机获得一种异火，成帝+5%', apply:function(g){ var fires = typeof FIRES!=='undefined'?FIRES:[]; if(fires.length){ var f=fires[Math.floor(Math.random()*fires.length)]; if(!g.fires)g.fires=[]; g.fires.push({id:f.id,name:f.name,rank:f.rank}); g.combat+=f.boost; } g.ascendBonus = (g.ascendBonus || 0) + 0.05; } },
  ];

  /* ============================================================
   * 智能帝名生成（根据角色生平、功法、异火等特征综合生成）
   * ============================================================ */
  function generateName(g) {
    var fires = g.fires ? g.fires.length : 0;
    var alch = g.alchemist || 0;
    var skills = g.skillNames || [];
    var tianCount = 0, diCount = 0;
    for (var i = 0; i < skills.length; i++) {
      if (skills[i].rank === '天') tianCount++;
      if (skills[i].rank === '地') diCount++;
    }
    var combat = g.combat || 0;
    var innate = g.innate || 1;
    var ability = g.ability || '';
    var hasFenjue = g.fenjue || (ability.indexOf('焚决') >= 0);
    var age = g.age || 100;
    var lvl = g.lvl || 99;

    /* ====== 根据角色特征智能选择帝名 ====== */
    /* 经典路线：焚决+异火大成 */
    if (hasFenjue && fires >= 10) return '炎帝';
    if (hasFenjue && fires >= 6) return '吞噬古帝';
    if (fires >= 10) return '万火之帝';
    if (fires >= 8) return '焚天古帝';
    /* 炼药系 */
    if (alch >= 8 && fires >= 3) return '药帝';
    if (alch >= 8) return '丹道至尊';
    if (alch >= 7 && fires >= 5) return '丹帝';
    if (alch >= 6) return '炼药古帝';
    /* 战力系 */
    if (combat >= 800000 && tianCount >= 4) return '破天古帝';
    if (combat >= 500000) return '武帝';
    if (combat >= 300000) return '斗战古帝';
    if (tianCount >= 5) return '天机古帝';
    if (tianCount >= 3) return '天斗帝';
    /* 异火系 */
    if (fires >= 5 && diCount >= 2) return '火帝';
    if (fires >= 5) return '炎天古帝';
    if (fires >= 3) return '焚天帝';
    /* 功法特征 */
    if (ability.indexOf('帝印') >= 0) return '帝印古帝';
    if (ability.indexOf('大天造化') >= 0) return '造化古帝';
    if (ability.indexOf('黄泉') >= 0) return '黄泉古帝';
    if (ability.indexOf('佛怒') >= 0) return '佛怒古帝';
    if (ability.indexOf('三千雷') >= 0) return '雷霆古帝';
    if (ability.indexOf('净莲') >= 0) return '净莲古帝';
    /* 特殊路线 */
    if (hasFenjue) return '焚决古帝';
    if (innate >= 9 && fires >= 3) return '天命古帝';
    if (innate >= 9) return '天命斗帝';
    if (age < 80 && fires >= 2) return '少幽古帝';
    if (age < 80) return '少斗帝';
    /* 通用fallback：根据综合实力赋名 */
    var strongNames = ['太初古帝','混沌古帝','永恒古帝','豪迅古帝','万象古帝','星辰古帝','虚空古帝','破灭古帝'];
    if (combat >= 200000) return strongNames[Math.floor(Math.random() * 3)];
    if (innate >= 7) return strongNames[3 + Math.floor(Math.random() * 3)];
    return strongNames[Math.floor(Math.random() * strongNames.length)];
  }

  /* ---------- 主题对象 ---------- */
  var theme = {
    id: 'doupo',
    name: '斗破苍穹模拟器',
    subtitle: '异火收服 · 斗气成帝',
    desc: '斗气大陆，觉醒斗气天赋，收服异火，修炼焚决，成帝之路。',
    accent: '#ff6b35',
    icon: '🔥',
    tags: ['异火收服', '斗气成帝', '修仙养成'],
    terms: terms,

    ABILITY_POOL: ABILITY_POOL,
    INNATE_WEIGHTS: INNATE_WEIGHTS,
    BREAK_CHANCE: BREAK_CHANCE,
    COMBAT_COEF: COMBAT_COEF,
    ESSENCE: ESSENCE,
    SKILL_TIER: SKILL_TIER,
    SKILL_NAMES: SKILL_NAMES,
    ACHIEVEMENTS: ACHIEVEMENTS,
    EVENTS: EVENTS,
    GUARD: GUARD,
    FIRES: FIRES,         /* 异火排行榜（事件层收服用） */
    TALENTS: TALENTS,

    LIFE_MIN: 75, LIFE_MAX: 160,
    EVENT_CHANCE: 0.40,
    ESSENCE_CHANCE: 0.008,
    FORCED_BONUS_MIN: 1.15,
    FORCED_BONUS_MAX: 1.45,
    XIJING_CHANCE: 1e-7,
    ORIGIN_CHANCE: 1e-8,
    ORIGIN_BONUS: 2,
    PLAYER_LV_BASE: 50,
    ASCEND_EXP: 1000,
    EXP_PER_LVL: 0.5,
    EXP_PER_LVL_EARLY: 0.1,

    titleOf: titleOf,
    tierName: tierName,
    selectSkill: selectSkill,
    guardInfo: guardInfo,
    generateName: generateName,

    /* 异火收服系统：初始状态含 fires 和 fenjue */
    initialState: { fires: [], fenjue: false, alchemist: 0, soulRealm: 0 },

    hooks: {
      /* 觉醒斗技时，从对应档位池随机抽一个斗技名称，存入 g.skillNames */
      onAwakenSkill: function (g, tierName, add) {
        var pool = SKILL_NAMES[tierName] || SKILL_NAMES['黄'];
        var name = pool[Math.floor(Math.random() * pool.length)];
        if (!g.skillNames) g.skillNames = [];
        /* 避免同局重复获得同一斗技 */
        var exists = false;
        for (var i = 0; i < g.skillNames.length; i++) { if (g.skillNames[i].name === name) { exists = true; break; } }
        if (!exists) g.skillNames.push({ name: name, rank: tierName });
        return name;
      },
      /* 每年额外逻辑：持有异火时有概率异火暴动（增益或损伤） */
      onYear: function (g, log, U) {
        if (!g.fires || g.fires.length === 0) return;
        /* 持有异火越多，暴动概率越高 */
        var chance = 0.003 * g.fires.length;
        if (Math.random() < chance) {
          /* 异火暴动：50% 增益 50% 损伤 */
          if (Math.random() < 0.5) {
            var gain = U.irand(500, 3000) * g.fires.length;
            g.combat += gain;
            var fireNames = g.fires.map(function(f){return f.name}).join('、');
            var evGainMsgs = [
              '第' + g.age + '岁，异火暴动！' + fireNames + '交相辉映，斗气暴涨——斗气+' + gain,
              '第' + g.age + '岁，异火暴动！数种异火在丹田中剧烈碰撞，产生意想不到的淬炼效果——斗气+' + gain,
              '第' + g.age + '岁，异火暴动！异火之力贯穿全身经脉，你咬牙承受住灼烧后斗气精进——斗气+' + gain
            ];
            log.push({ cls: 'ev3', text: evGainMsgs[Math.floor(Math.random()*evGainMsgs.length)] });
          } else {
            var dmg = U.irand(1, 4) * g.fires.length;
            g.lifespan -= dmg;
            var firstFire = g.fires[0] ? g.fires[0].name : '异火';
            var evDmgMsgs = [
              '第' + g.age + '岁，异火暴动反噬！体内异火互相排斥，你的五脏六腑被灼烧——寿元-' + dmg,
              '第' + g.age + '岁，异火暴动反噬！' + firstFire + '突然暴走，你全力压制仍被其灼伤——寿元-' + dmg,
              '第' + g.age + '岁，异火暴动反噬！异火之力在经脉中横冲直撞，你被迫以焚决强行镇压——寿元-' + dmg
            ];
            log.push({ cls: 'ev4', text: evDmgMsgs[Math.floor(Math.random()*evDmgMsgs.length)] });
          }
        }
      },
      /* ★ 斗破多路径成帝：陀舍古帝传承 / 本源魂气自修 */
      tryAscendPath: function (g, log, U, helpers) {
        if ((g.pathAttempts || 0) >= 2) return false;   /* 主题路径最多尝试 2 次 */
        /* 路径1：陀舍古帝传承 - 需集齐8块陀舍古帝玉 + 修为≥90，成功率10%（递减） */
        if (g.guyu && g.guyu >= 8 && g.lvl >= 90) {
          g.pathAttempts = (g.pathAttempts || 0) + 1;
          var rate1 = (0.10 + (g.ascendBonus || 0)) - (g.pathAttempts - 1) * 0.02;
          if (Math.random() < rate1) {
            g.ascendMode = 'tuoshe';
            g.emperorName = generateName(g);
            log.push({ cls: 'god', text: '第' + g.age + '岁，集齐陀舍古帝玉，开启古帝洞府！获得陀舍古帝本源传承，成功晋入斗帝阶别，飞升成帝，帝名：' + g.emperorName + '！' });
            g.ascended = true; g.lvl = 100;
            g.combat = helpers.godCombat(g.combat, 8); g.lifespan = 99999;
            return true;
          }
          log.push({ cls: 'ev3', text: '第' + g.age + '岁，古帝洞府传承未能承受，修炼继续！' });
          return false;
        }
        /* 路径2：本源魂气自修 - 需本源魂气 + 修为≥95（有金词条预悟则≥90），成功率8%（递减） */
        var soulOriginLvlReq = g.soulOriginReady ? 90 : 95;
        if (g.soulOrigin && g.lvl >= soulOriginLvlReq) {
          g.pathAttempts = (g.pathAttempts || 0) + 1;
          var rate2 = (0.08 + (g.ascendBonus || 0)) - (g.pathAttempts - 1) * 0.015;
          if (Math.random() < rate2) {
            g.ascendMode = 'selfAscend';
            g.emperorName = generateName(g);
            log.push({ cls: 'god', text: '第' + g.age + '岁，悟透本源魂气，以己身证道！成功晋入斗帝阶别，飞升成帝，帝名：' + g.emperorName + '！' });
            g.ascended = true; g.lvl = 100;
            g.combat = helpers.godCombat(g.combat, 6); g.lifespan = 99999;
            return true;
          }
          log.push({ cls: 'ev3', text: '第' + g.age + '岁，本源魂气证道失败，根基未稳！' });
          return false;
        }
        /* 路径3：持有焚决+多种异火+修为≥99 → 帝炎融合成帝，成功率10%（递减） */
        if (g.fenjue && g.fires && g.fires.length >= 15 && g.lvl >= 99) {
          g.pathAttempts = (g.pathAttempts || 0) + 1;
          var rate3 = (0.10 + (g.ascendBonus || 0)) - (g.pathAttempts - 1) * 0.02;
          if (Math.random() < rate3) {
            g.ascendMode = 'diyan';
            g.emperorName = generateName(g);
            log.push({ cls: 'god', text: '第' + g.age + '岁，焚决大成，融合诸天异火成就帝炎！成功晋入斗帝阶别，飞升成帝，帝名：' + g.emperorName + '！' });
            g.ascended = true; g.lvl = 100;
            g.combat = helpers.godCombat(g.combat, 10); g.lifespan = 99999;
            return true;
          }
          log.push({ cls: 'ev3', text: '第' + g.age + '岁，帝炎融合失败，异火反噬！' });
          g.lifespan -= 5;
          return false;
        }
        return false;
      }
    }
  };

  root.THEMES = root.THEMES || {};
  root.THEMES.doupo = theme;
})(typeof self !== 'undefined' ? self : this);
