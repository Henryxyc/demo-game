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
    6: ['焰分噬浪尺', '大衍玄光尺', '大劈棺·极', '陨星掌', '梵毒斑', '风刹罡斩', '紫晶封印', '九霄罡风', '大须弥锤', '金刚琉璃', '九凤涅槃火', '裂风龙爪'],
    7: ['大天造化术', '五印玄决', '帝印决', '琉璃莲心', '三千雷动', '大须弥锤·大成', '九凤涅槃火·真', '阳春白雪', '五色火凤', '骨翼·骨灵冷火', '九龙雷罡火', '生灵之焱', '海心焰'],
    8: ['帝印决·大成', '大天造化术·大成', '黄泉天怒', '五印玄决·圆满', '大寂灭指', '九幽风炎', '三千焱炎火·炼化', '陨落心炎·炼化', '八荒破灭焱', '九幽金祖火', '红莲业火·真', '空间撕裂'],
    9: ['佛怒火莲', '大寂灭指·大成', '黄泉天怒·大成', '焚决·进化', '青莲地心火·真意', '净莲妖火·初悟', '金帝焚天炎·真意', '生灵之焱·真意', '骨灵冷火·真意', '帝炎·初悟', '虚无吞炎·初悟'],
    10: ['帝炎·真意', '虚无吞炎·真意', '焚决·大成', '大寂灭指·圆满', '黄泉天怒·圆满', '净莲妖火·大成', '斗帝之火', '万物化火', '太虚破', '帝品丹雷·御火', '金帝焚天炎·大成', '八荒破灭焱·真意']
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
    { id: 'fire_13', name: '龟灵地火',   rank: 13, difficulty: 0.38, boost: 10000 },
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
    { name: '地', combatLo: 2500, combatHi: 9999, addLo: 100, addHi: 300, minRing: 3 },
    { name: '天', combatLo: 10000, combatHi: 72499, addLo: 500, addHi: 1500, minRing: 4 },
    { name: '帝', combatLo: 72500, combatHi: Infinity, addLo: 3000, addHi: 10000, minRing: 5 }
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
  var DP_TITLES = ['', '斗之气', '斗者', '斗师', '大斗师', '斗灵', '斗王', '斗皇', '斗宗', '斗尊', '斗帝'];
  function titleOf(lvl) {
    lvl = Math.max(1, Math.min(99, Math.floor(lvl) || 1));
    if (lvl >= 99) return '斗帝';
    if (lvl >= 94) return '斗圣' + (lvl - 93) + '星';
    if (lvl >= 91) return '半圣(' + ['初级','中级','高级'][lvl - 91] + ')';
    var idx = Math.floor((lvl - 1) / 10);
    var DP_BASE = ['斗之气','斗者','斗师','大斗师','斗灵','斗王','斗皇','斗宗','斗尊'];
    var mod = lvl % 10;
    if (mod === 0) return DP_BASE[idx] + '巅峰';
    return DP_BASE[idx] + mod + (idx === 0 ? '段' : '星');
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
        return '获得焚决！拥有收服多种异火的基础，寿元+' + lf + '。吞噬异火可令焚决进化！';
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
        return '获得陀舍古帝玉碎片（' + g.guyu + '/8）！集齐可开启古帝洞府，获得陀舍古帝传承';
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
        return '悟透本源魂气！灵魂力达至巅峰，可自修证道突破斗帝！斗气暴涨，寿元+' + lf;
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
        return '斗气二次觉醒！斗气天赋提升 ' + inc + ' 级，斗气大幅增长，寿元+' + lf;
      },
      fail: function (g, U, log) { return '斗气二次觉醒失败，斗气震荡，略有损伤'; }
    },
    { id: 'dp_dilei', weight: 0.1, maxCount: 1, name: '九色丹雷', tier: 4, desc: '炼丹引来九色丹雷',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 70; },
      ok: function (g, U, log) {
        var lf = U.irand(8, 15); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(4, 7));
        return '九色丹雷降世！淬炼肉身，斗气暴涨，寿元+' + lf;
      },
      fail: function (g, U, log) { return '丹雷消散，未能淬炼'; }
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
        return '炼丹有成！晋升' + grades[g.alchemist] + '炼药师，灵魂力提升，斗气+' + Math.floor(r * 1.5) + '，寿元+' + lf;
      },
      fail: function (g, U, log) { return '炼丹失败，丹炉炸裂，略有损伤'; }
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
          return '灵魂力突破至' + realms[g.soulRealm] + '！炼药水平大增，斗气暴涨';
        }
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1, 2));
        return '灵魂力精进，已至' + realms[g.soulRealm] + '，斗气+' + Math.floor(r * 1.5);
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
        return '斗气良性变异！天赋提升 1 级';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '斗气恶性变异！天赋未提升，寿元受损';
      }
    },
    { id: 'dp_hunting', weight: 0.22, maxCount: 5, name: '猎杀魔兽', tier: 3, desc: '遭遇高阶魔兽',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1.2, 2.5));
        return '击杀高阶魔兽！获得魔核，斗气大增';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(3, 8);
        return '魔兽反噬！重伤逃脱，寿元受损';
      }
    },

    /* ---------- tier 2 中级 ---------- */
    { id: 'dp_train', weight: 0.7, maxCount: 10, name: '刻苦修炼', tier: 2, desc: '在宗门中刻苦修炼斗气',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.03, 0.10, 200); return '刻苦修炼收获颇丰，斗气+' + gain; },
      fail: function (g, U, log) { return '修炼途中遭遇瓶颈，收获平平'; }
    },
    { id: 'dp_mediate', weight: 0.7, maxCount: 10, name: '冥想修炼', tier: 2, desc: '静坐冥想吸收天地斗气',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.02, 0.08, 150); return '冥想入定，斗气稳步增长+' + gain; },
      fail: null
    },
    { id: 'dp_douji', weight: 0.6, maxCount: 8, name: '斗技演练', tier: 2, desc: '演练高阶斗技',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 10; },
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.04, 0.12, 300); return '斗技演练成功，斗气+' + gain; },
      fail: function (g, U, log) { g.lifespan -= U.irand(1, 4); return '斗技反噬，寿元受损'; }
    },
    { id: 'dp_dan', weight: 0.5, maxCount: 5, name: '丹药辅助', tier: 2, desc: '服用修炼丹药',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var lf = U.irand(1, 4); g.lifespan += lf;
        g.combat += U.irand(200, 1500);
        return '丹药见效！寿元+' + lf + '，斗气增长';
      },
      fail: function (g, U, log) { return '丹药药力过猛，略有不适'; }
    },
    { id: 'dp_tianmu', weight: 0.5, maxCount: 2, name: '天墓历练', tier: 2, desc: '进入天墓接受灵魂力洗礼',
      minAge: 40, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 50; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        var lf = U.irand(3, 8); g.lifespan += lf;
        return '天墓历练，灵魂力大增！斗气+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(2, 5);
        return '天墓中遭遇灵魂力反噬，寿元受损';
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
        return '中州游历，斗气+' + add + '，寿元+' + lf;
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
        return '古族祭祖大典，血脉觉醒！斗气+' + add + '，寿元+' + lf;
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
        return '在迦南学院修行，斗气+' + add + '，寿元+' + lf;
      },
      fail: null
    },
    { id: 'dp_mountain', weight: 0.9, maxCount: 5, name: '魔兽山脉历练', tier: 1, desc: '在魔兽山脉中搏杀历练',
      minAge: 10, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 1.0));
        g.combat += add;
        return '魔兽山脉历练，斩杀魔兽，斗气+' + add;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '魔兽山脉遇险，寿元受损';
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
        return '黑角域交易收获颇丰，斗气+' + add + '，寿元+' + lf;
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
        return '云岚宗论道，斗技精进，斗气+' + add;
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
        return '丹塔炼会切磋炼药之术，斗气+' + add + '，寿元+' + lf;
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
        return '开启陀舍古帝洞府！获得古帝本源传承，斗气暴涨+' + add + '，寿元+' + lf;
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
        return '虚无吞炎降临！未能收服，反噬重创，寿元大损';
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
        return '帝炎降世！力量过于强大，未能收服，寿元大损';
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
        return '云岚宗大战胜利！击败云山，斗气+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(4, 10);
        return '云岚宗大战失利，被云山重创，寿元大损';
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
        return '加玛帝国炼药大赛夺魁！炼药师等阶提升，斗气+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) { return '炼药大赛失利，丹方失误'; }
    },
    { id: 'dp_heiyin_auc', weight: 0.2, maxCount: 2, name: '黑印城拍卖会', tier: 3, desc: '在黑印城拍卖会获得珍稀宝物',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 2.8));
        g.combat += add;
        var lf = U.irand(3, 6); g.lifespan += lf;
        return '黑印城拍卖会拍到珍宝，斗气+' + add + '，寿元+' + lf;
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
        return '中州四阁论道胜出！斗气+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(2, 5);
        return '四阁论道落败，受创而归，寿元受损';
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
        return '古族祭天大典！神血洗礼，斗气+' + add + '，寿元+' + lf;
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
        return '探索太虚古龙洞府！获得龙族传承，斗气+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(3, 8);
        return '太虚古龙洞府遇险，古龙残魂反噬，寿元受损';
      }
    },
    { id: 'dp_soul_palace', weight: 0.2, maxCount: 3, name: '魂殿追杀', tier: 3, desc: '魂殿高手追杀，险象环生',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 45; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.8, 3.0));
        g.combat += add;
        return '击退魂殿追杀者！斗气+' + add;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(5, 12);
        return '魂殿追杀者重创了你！寿元大损';
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
        return '迦南学院内院修炼，斗气+' + add + '，寿元+' + lf;
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
        return '黑角域血洗成功！斗气+' + add;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(2, 6);
        return '黑角域血洗失利，反被围攻，寿元受损';
      }
    },
    { id: 'dp_mountain_deep', weight: 0.55, maxCount: 3, name: '魔兽山脉深处', tier: 2, desc: '深入魔兽山脉腹地猎杀高阶魔兽',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.2, 2.2));
        g.combat += add;
        return '魔兽山脉深处猎杀高阶魔兽，斗气+' + add;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(2, 5);
        return '魔兽山脉深处遇险，寿元受损';
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
        return '丹塔炼药大会胜出！炼药师等阶精进，斗气+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) { return '丹塔炼药大会失利，丹炉炸裂'; }
    },
    { id: 'dp_tianmu_train', weight: 0.5, maxCount: 2, name: '天目山修行', tier: 2, desc: '在天目山灵脉之地闭关修行',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 35; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.2, 2.3));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        return '天目山灵脉闭关，斗气+' + add + '，寿元+' + lf;
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
        return '风雷阁历练，领悟风雷之力，斗气+' + add + '，寿元+' + lf;
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
        return '获得星陨阁远古传承！斗气+' + add + '，寿元+' + lf;
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
        return '中州星陨阁修行，斗气+' + add + '，寿元+' + lf;
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
        return '韩家切磋胜出！斗技精进，斗气+' + add;
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
        return '古族藏书阁研读远古功法！斗气+' + add + '，寿元+' + lf;
      },
      fail: null
    },

    /* ---------- tier 1 普通（新增） ---------- */
    { id: 'dp_wutan', weight: 1.0, maxCount: 5, name: '乌坦城历练', tier: 1, desc: '在乌坦城周边历练斗气',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.8));
        g.combat += add;
        return '乌坦城历练，斗气+' + add;
      },
      fail: null
    },
    { id: 'dp_devil_train', weight: 0.9, maxCount: 5, name: '魔鬼训练', tier: 1, desc: '接受魔鬼式斗气训练',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 0.9));
        g.combat += add;
        return '魔鬼训练收获颇丰，斗气+' + add;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 2);
        return '魔鬼训练过劳，寿元略损';
      }
    },
    { id: 'dp_douji_field', weight: 0.85, maxCount: 5, name: '斗技演练场', tier: 1, desc: '在斗技演练场切磋斗技',
      minAge: 8, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 5; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add;
        return '斗技演练场切磋，斗气+' + add;
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
        return '护送青阳镇商队，斗气+' + add + '，寿元+' + lf;
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
        return '加玛圣城游历，斗气+' + add + '，寿元+' + lf;
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
        return '黑岩城学炼药，成为炼药师，斗气+' + add + '，寿元+' + lf;
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
        return '随叶家商队历练，斗气+' + add + '，寿元+' + lf;
      },
      fail: null
    },
    { id: 'dp_zhongzhou_edge', weight: 0.8, maxCount: 4, name: '中州边缘历练', tier: 1, desc: '在中州边缘地带历练',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 25; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 0.9));
        g.combat += add;
        return '中州边缘历练，斗气+' + add;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '中州边缘遇险，寿元受损';
      }
    },
    { id: 'dp_hanfeng', weight: 0.65, maxCount: 2, name: '韩枫旧部', tier: 1, desc: '遭遇韩枫旧部，发生冲突',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.5, 1.0));
        g.combat += add;
        return '击败韩枫旧部！斗气+' + add;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 4);
        return '韩枫旧部反扑，寿元受损';
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
        return '萧家密库获取资源，斗气+' + add + '，寿元+' + lf;
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
    refineSuccess: function (age) { return '第' + age + '岁，寿元将尽，成功炼化异火，晋升为斗帝！'; },
    refineFail: function (age, boost) { return '第' + age + '岁，异火炼化失败，但斗气有所提升，斗气+' + boost; },
    forcedAscend: function (age) { return '第' + age + '岁，寿元将尽，强行成帝，成为斗帝！'; },
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
    /* green */
    { id:'dp_t1', name:'斗气温养', rarity:'green', desc:'初始斗气+50', apply:function(g){ g.combat += 50; } },
    { id:'dp_t2', name:'强体丹', rarity:'green', desc:'寿元+5', apply:function(g){ g.lifespan += 5; } },
    { id:'dp_t3', name:'功法亲和', rarity:'green', desc:'斗气+10%', apply:function(g){ g.combat = Math.floor(g.combat * 1.1); } },
    { id:'dp_t4', name:'药老指点', rarity:'green', desc:'寿元+3，斗气+20', apply:function(g){ g.lifespan += 3; g.combat += 20; } },
    { id:'dp_t5', name:'斗气凝练', rarity:'green', desc:'初始等级+1', apply:function(g){ g.lvl += 1; } },
    /* blue */
    { id:'dp_t6', name:'斗气精通', rarity:'blue', desc:'斗气+20%', apply:function(g){ g.combat = Math.floor(g.combat * 1.2); } },
    { id:'dp_t7', name:'延寿丹', rarity:'blue', desc:'寿元+15', apply:function(g){ g.lifespan += 15; } },
    { id:'dp_t8', name:'血脉觉醒', rarity:'blue', desc:'初始等级+2', apply:function(g){ g.lvl += 2; } },
    { id:'dp_t9', name:'斗气天赋', rarity:'blue', desc:'斗气+200', apply:function(g){ g.combat += 200; } },
    { id:'dp_t10', name:'灵药辅助', rarity:'blue', desc:'寿元+10，斗气+50', apply:function(g){ g.lifespan += 10; g.combat += 50; } },
    /* purple */
    { id:'dp_t11', name:'血脉变异', rarity:'purple', desc:'天赋+1', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); } },
    { id:'dp_t12', name:'斗气暴增', rarity:'purple', desc:'斗气+40%', apply:function(g){ g.combat = Math.floor(g.combat * 1.4); } },
    { id:'dp_t13', name:'六品丹药', rarity:'purple', desc:'寿元+25', apply:function(g){ g.lifespan += 25; } },
    /* gold */
    { id:'dp_t14', name:'帝炎血脉', rarity:'gold', desc:'天赋+2，斗气+30%，开局获得3块陀舍古帝玉', apply:function(g){ g.innate = Math.min(10, g.innate + 2); g.aptitude = Math.max(g.aptitude, g.innate); g.combat = Math.floor(g.combat * 1.3); g.guyu = (g.guyu || 0) + 3; } },
    { id:'dp_t15', name:'斗帝传承', rarity:'gold', desc:'天赋+1，斗气+50%，寿元+20，开局预悟本源魂气', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.combat = Math.floor(g.combat * 1.5); g.lifespan += 20; g.soulOriginReady = true; } },
    /* green（新增） */
    { id:'dp_t16', name:'斗气温养2', rarity:'green', desc:'斗气+5%，寿元+3', apply:function(g){ g.combat = Math.floor(g.combat * 1.05); g.lifespan += 3; } },
    { id:'dp_t17', name:'药老指点2', rarity:'green', desc:'寿元+5，斗气+40', apply:function(g){ g.lifespan += 5; g.combat += 40; } },
    { id:'dp_t18', name:'斗气凝练2', rarity:'green', desc:'等级+1，斗气+5%', apply:function(g){ g.lvl += 1; g.combat = Math.floor(g.combat * 1.05); } },
    { id:'dp_t19', name:'修炼勤奋', rarity:'green', desc:'斗气+15%', apply:function(g){ g.combat = Math.floor(g.combat * 1.15); } },
    /* blue（新增） */
    { id:'dp_t20', name:'斗气共鸣', rarity:'blue', desc:'斗气+15%，寿元+8', apply:function(g){ g.combat = Math.floor(g.combat * 1.15); g.lifespan += 8; } },
    { id:'dp_t21', name:'异火抗性', rarity:'blue', desc:'寿元+5，斗气+10%', apply:function(g){ g.lifespan += 5; g.combat = Math.floor(g.combat * 1.1); } },
    { id:'dp_t22', name:'炼药天赋', rarity:'blue', desc:'斗气+100，寿元+8', apply:function(g){ g.combat += 100; g.lifespan += 8; } },
    { id:'dp_t23', name:'焚决残页', rarity:'blue', desc:'斗气+10%，等级+1', apply:function(g){ g.combat = Math.floor(g.combat * 1.1); g.lvl += 1; } },
    /* purple（新增） */
    { id:'dp_t24', name:'异火亲和', rarity:'purple', desc:'斗气+25%，寿元+15', apply:function(g){ g.combat = Math.floor(g.combat * 1.25); g.lifespan += 15; } },
    /* gold（新增） */
    { id:'dp_t25', name:'帝炎传承', rarity:'gold', desc:'天赋+2，斗气+40%，寿元+30', apply:function(g){ g.innate = Math.min(10, g.innate + 2); g.aptitude = Math.max(g.aptitude, g.innate); g.combat = Math.floor(g.combat * 1.4); g.lifespan += 30; } }
  ];

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
            log.push({ cls: 'ev3', text: '第' + g.age + '岁，异火暴动！斗气淬炼，斗气+' + gain });
          } else {
            var dmg = U.irand(1, 4) * g.fires.length;
            g.lifespan -= dmg;
            log.push({ cls: 'ev4', text: '第' + g.age + '岁，异火暴动反噬！寿元-' + dmg });
          }
        }
      },
      /* ★ 斗破多路径成帝：陀舍古帝传承 / 本源魂气自修 */
      tryAscendPath: function (g, log, U, helpers) {
        /* 根据角色生平生成帝名 */
        function generateEmperorName(g) {
          var fires = g.fires ? g.fires.length : 0;
          var alch = g.alchemist || 0;
          var skills = g.skillNames || [];
          var天阶数 = 0, 地阶数 = 0;
          for (var i = 0; i < skills.length; i++) {
            if (skills[i].rank === '天') 天阶数++;
            if (skills[i].rank === '地') 地阶数++;
          }
          /* 帝名优先级判断 */
          if (g.fenjue && fires >= 10) return '炎帝';              /* 焚决+10异火=萧炎经典路线 */
          if (alch >= 7 && fires >= 5) return '药帝';              /* 炼药宗师+多异火 */
          if (alch >= 8) return '丹帝';                             /* 炼药至尊 */
          if (fires >= 8) return '炎帝';                            /* 大量异火 */
          if (天阶数 >= 3) return '天斗帝';                          /* 多天阶斗技 */
          if (g.ability && g.ability.indexOf('焚决') >= 0) return '焚帝';  /* 修炼焚决 */
          if (fires >= 5 && 地阶数 >= 2) return '火帝';             /* 异火+地阶斗技 */
          if (g.innate >= 9) return '天命斗帝';                      /* 天赋极高 */
          if (g.age < 80) return '少斗帝';                           /* 年轻成帝 */
          if (g.combat >= 500000) return '战帝';                     /* 战力极高 */
          /* 默认 */
          return '斗帝';
        }

        if ((g.pathAttempts || 0) >= 2) return false;   /* 主题路径最多尝试 2 次 */
        /* 路径1：陀舍古帝传承 - 需集齐8块陀舍古帝玉 + 修为≥90，成功率10%（递减） */
        if (g.guyu && g.guyu >= 8 && g.lvl >= 90) {
          g.pathAttempts = (g.pathAttempts || 0) + 1;
          var rate1 = 0.10 - (g.pathAttempts - 1) * 0.02;
          if (Math.random() < rate1) {
            g.ascendMode = 'tuoshe';
            log.push({ cls: 'god', text: '第' + g.age + '岁，集齐陀舍古帝玉，开启古帝洞府！获得陀舍古帝本源传承，突破斗帝！' });
            g.ascended = true; g.lvl = 100;
            g.combat = helpers.godCombat(g.combat, 8); g.lifespan = 99999;
            g.emperorName = generateEmperorName(g);
            return true;
          }
          log.push({ cls: 'ev3', text: '第' + g.age + '岁，古帝洞府传承未能承受，修炼继续！' });
          return false;
        }
        /* 路径2：本源魂气自修 - 需本源魂气 + 修为≥95（有金词条预悟则≥90），成功率8%（递减） */
        var soulOriginLvlReq = g.soulOriginReady ? 90 : 95;
        if (g.soulOrigin && g.lvl >= soulOriginLvlReq) {
          g.pathAttempts = (g.pathAttempts || 0) + 1;
          var rate2 = 0.08 - (g.pathAttempts - 1) * 0.015;
          if (Math.random() < rate2) {
            g.ascendMode = 'selfAscend';
            log.push({ cls: 'god', text: '第' + g.age + '岁，悟透本源魂气，以己身证道！突破斗帝！' });
            g.ascended = true; g.lvl = 100;
            g.combat = helpers.godCombat(g.combat, 6); g.lifespan = 99999;
            g.emperorName = generateEmperorName(g);
            return true;
          }
          log.push({ cls: 'ev3', text: '第' + g.age + '岁，本源魂气证道失败，根基未稳！' });
          return false;
        }
        /* 路径3：持有焚决+多种异火+修为≥99 → 帝炎融合成帝，成功率10%（递减） */
        if (g.fenjue && g.fires && g.fires.length >= 15 && g.lvl >= 99) {
          g.pathAttempts = (g.pathAttempts || 0) + 1;
          var rate3 = 0.10 - (g.pathAttempts - 1) * 0.02;
          if (Math.random() < rate3) {
            g.ascendMode = 'diyan';
            log.push({ cls: 'god', text: '第' + g.age + '岁，焚决大成，融合诸天异火成就帝炎！突破斗帝！' });
            g.ascended = true; g.lvl = 100;
            g.combat = helpers.godCombat(g.combat, 10); g.lifespan = 99999;
            g.emperorName = generateEmperorName(g);
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
