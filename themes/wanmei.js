/* ============================================================
 * 主题包 · 完美世界模拟器（wanmei）
 * 修炼体系：搬血→洞天→化灵→铭纹→列阵→尊者→神火→真一→天神→至尊→真仙→仙王→仙帝
 * 骨文天赋 1-10（F~EX），宝术，至尊骨/仙种，以身为种，仙气
 * 数据自包含，引擎平衡数值与末日主题一致，保证可玩性
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
  var TIER_NAME = ['', '凡骨', '灵骨', '真骨', '宝骨', '王骨', '皇骨', '尊骨', '圣骨', '神骨', '仙骨'];

  /* ---------- 宝术池（按骨文天赋 1-10 分档） ---------- */
  var ABILITY_POOL = {
    1: ['蛮力', '铁皮', '夜视', '听风', '嗅踪', '弹跳', '疾跑', '硬甲', '自愈', '臂力', '格斗本能'],
    2: ['缩地', '御风', '凝冰', '控火', '土遁', '水罩', '藤缠', '风刃', '雷光', '磁引', '木生'],
    3: ['裂空爪', '寒霜域', '雷霆击', '念力术', '引力波', '石甲', '水盾', '风翼', '木灵', '磁暴', '感知', '骨坚'],
    4: ['火莲', '冰锥阵', '连锁雷', '念力壁', '摄物', '岩拳', '水龙卷', '暴风击', '荆棘墙', '钢臂', '声波', '活化'],
    5: ['神隐术', '雷劫液', '补天浴', '引仙光', '太初土', '玉指术', '玄武印', '天击术', '龙甲术', '麒麟步', '缩地术', '土遁术'],
    6: ['草字剑诀', '飞仙之力', '鲲鹏宝术', '翻天印', '截天指', '大罗剑胎', '缩地成寸', '飞天遁地', '乾坤袋', '九叶剑草', '涅槃再生', '青月焰'],
    7: ['六道轮回', '飞仙之力·真', '鲲鹏术·大成', '截天指·大成', '大荒芜经', '太古龙象诀', '乾坤袋·真', '涅槃再生·真', '太乙分光', '上苍之手·初悟', '九叶剑草·真', '玄武印·真'],
    8: ['六道轮回·圆满', '鲲鹏·真身', '飞仙·真身', '大荒芜经·大成', '太初古矿', '不灭经', '太虚天刀', '太古龙象·真身', '混沌青莲', '先天圣骨', '截天指·真', '翻天印·真'],
    9: ['以身为种·初悟', '六道·轮回', '大荒芜经·圆满', '先天圣骨·真身', '鲲鹏·神级', '太初古矿·真', '大罗剑胎·真身', '混沌青莲·真身', '不灭经·大成', '太虚天刀·真', '草字剑诀·真意'],
    10: ['以身为种·大成', '仙帝术·太初', '混沌青莲·圆满', '真龙角', '不死药·真身', '时空长河·真身', '诸天万界·本源', '鲲鹏·圆满', '六道·圆满', '飞仙·圆满', '仙帝本源']
  };

  var INNATE_WEIGHTS = [0, 33.0, 25.0, 11.0, 9.0, 7.0, 5.0, 4.0, 3.0, 2.0, 1.0];

  /* ---------- 仙种/至尊骨（基因源质等价物，8 种） ---------- */
  var ESSENCE = [
    { id: 'wm_bone1', name: '仙种·轮回之骨', needCombat: 80000, rate: 1.24 },
    { id: 'wm_bone2', name: '仙种·飞仙之骨', needCombat: 90000, rate: 1.33 },
    { id: 'wm_bone3', name: '仙种·破灭之骨', needCombat: 100000, rate: 1.42 },
    { id: 'wm_bone4', name: '仙种·无量之骨', needCombat: 110000, rate: 1.51 },
    { id: 'wm_bone5', name: '仙种·不灭之骨', needCombat: 120000, rate: 1.6 },
    { id: 'wm_bone6', name: '仙种·厚土之骨', needCombat: 130000, rate: 1.69 },
    { id: 'wm_bone7', name: '仙种·双生之骨', needCombat: 140000, rate: 1.82 },
    { id: 'wm_bone8', name: '仙种·太初之骨', needCombat: 150000, rate: 2.05 }
  ];

  /* ---------- 骨文技能档 ---------- */
  var SKILL_TIER = [
    { name: '凡', combatLo: 0, combatHi: 299, addLo: 10, addHi: 20 },
    { name: '灵', combatLo: 300, combatHi: 2499, addLo: 30, addHi: 60 },
    { name: '真', combatLo: 2500, combatHi: 9999, addLo: 100, addHi: 300, minRing: 3 },
    { name: '神', combatLo: 10000, combatHi: 72499, addLo: 500, addHi: 1500, minRing: 4 },
    { name: '仙', combatLo: 72500, combatHi: Infinity, addLo: 3000, addHi: 10000, minRing: 5 }
  ];

  /* ---------- 功法/宝术名称池（按品阶分组，取自原著） ----------
   * 品阶映射：凡=凡俗宝术；灵=灵阶宝术；真=真阶宝术；神=神阶宝术；仙=仙阶/十凶宝术 */
  var SKILL_NAMES = {
    '凡': ['蛮力','铁皮','夜视','听风','嗅踪','弹跳','疾跑','硬甲','自愈','臂力','格斗本能','金蛇腿','缩地成寸','土遁术'],
    '灵': ['雷天雀宝术','狻猊宝术','太古朱雀四击','朱厌宝术','金璇波纹功','金蛇腿','水曼陀罗','裂空爪','寒霜域','雷霆击','念力术','引力波','石甲','风翼','木灵','磁暴','感知','骨坚'],
    '真': ['神隐术','雷劫液','补天浴','引仙光','太初土','玉指术','玄武印','天击术','龙甲术','麒麟步','草字剑诀·残篇','飞仙之力','鲲鹏宝术·残篇','翻天印','截天指','大罗剑胎','九叶剑草','涅槃再生','青月焰'],
    '神': ['六道轮回','飞仙之力·真','鲲鹏术·大成','截天指·大成','大荒芜经','太古龙象诀','乾坤袋·真','涅槃再生·真','太乙分光','上苍之手·初悟','九叶剑草·真','玄武印·真','雷帝宝术','真凰宝术','天角蚁宝术','蛄族宝术','麒麟宝术','打神石宝术','不灭经·上篇','原始真解·中卷','八九天功·伪篇'],
    '仙': ['以身为种·初悟','六道·轮回','大荒芜经·圆满','先天圣骨·真身','鲲鹏·神级','太初古矿·真','大罗剑胎·真身','混沌青莲·真身','不灭经·大成','太虚天刀·真','草字剑诀·真意','草字剑诀','平乱诀','鲲鹏宝术','真龙宝术','真凰宝术·真身','天角蚁宝术·真','他化自在大法','八九天功','六道轮回天功','上苍之手','轮回','第三至尊术','以身为种·大成','仙帝术·太初','混沌青莲·圆满','真龙角','不死药·真身','时空长河·真身','诸天万界·本源','鲲鹏·圆满','六道·圆满','飞仙·圆满','仙帝本源']
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

  /* ---------- 境界称号 ---------- */
  var WM_TITLES = ['', '搬血', '洞天', '化灵', '铭纹', '列阵', '尊者', '神火', '真一', '天神', '至尊'];
  function titleOf(lvl) {
    lvl = Math.max(1, Math.min(99, Math.floor(lvl) || 1));
    if (lvl >= 99) return '仙帝境';
    if (lvl >= 98) return '仙王境';
    if (lvl >= 97) return '至尊境';
    if (lvl >= 95) return '遁一境';
    if (lvl >= 93) return '斩我境';
    if (lvl >= 91) return '虚道境';
    var idx = Math.floor((lvl - 1) / 10);
    var WM_BASE = ['搬血','洞天','化灵','铭纹','列阵','尊者','神火','真一','天神'];
    var mod = lvl % 10;
    if (mod === 0) return WM_BASE[idx] + '境·巅峰';
    return WM_BASE[idx] + '境·' + mod + '阶';
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
    { id: 'innate10', name: '极阶天赋', bonus: 0.1 },
    { id: 'twin',   name: '双生至尊骨', bonus: 0.1 },
    { id: 'lvl71', name: '天神之力',  bonus: 0.1 },
    { id: 'lvl81', name: '虚道之力',  bonus: 0.1 },
    { id: 'feng91', name: '斩我明道',  bonus: 0.1 },
    { id: 'lvl95', name: '遁一之境',  bonus: 0.1 },
    { id: 'lvl99', name: '至尊巅峰',  bonus: 0.2 },
    { id: 'combat100k', name: '十万神力',  bonus: 0.1 },
    { id: 'combat300k', name: '三十万神力', bonus: 0.2 },
    { id: 'million', name: '百万神力',  bonus: 0.3 },
    { id: 'essence', name: '仙种融合',  bonus: 0.1 },
    { id: 'god',   name: '成就仙帝',  bonus: 0.2 },
    { id: 'forced', name: '强行成仙',  bonus: 0.3 },
    { id: 'god3',  name: '三次成仙',  bonus: 0.3 },
    { id: 'god10', name: '十次成仙',  bonus: 0.4 },
    { id: 'god30', name: '三十次成仙', bonus: 0.5 },
    { id: 'god50', name: '五十次成仙', bonus: 0.8 },
    { id: 'god100', name: '百次成仙',  bonus: 1 },
    { id: 'mutation', name: '骨文变异',  bonus: 1 },
    { id: 'origin', name: '仙气降临',  bonus: 1.5 }
  ];

  /* ============================================================
   * 随机事件（完美世界主题：大荒猎兽/虚神界/百断山/鲲鹏巢/以身为种等）
   * ============================================================ */
  var EVENTS = [
    /* ---------- tier 4 传说 ---------- */
    { id: 'wm_reawaken', weight: 0.15, maxCount: 2, name: '宝术二次觉醒', tier: 4, desc: '沉寂的骨文发生二次觉醒',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= Math.min(50, Math.floor(g.age * 0.75)) + U.irand(0, 10); },
      ok: function (g, U, log) {
        var lf = U.irand(4, 8); g.lifespan += lf;
        var inc = g.innate < 6 ? U.irand(1, 3) : (g.innate <= 8 ? U.irand(1, 2) : (g.innate === 9 ? 1 : 0));
        if (inc) { g.innate = Math.min(10, g.innate + inc); g.aptitude = Math.max(g.aptitude, g.innate); }
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1.5, 2.5));
        return '骨文深处传来远古共鸣，宝术二次觉醒！铭纹在骨骼间流转不息，天赋跃升 ' + inc + ' 级，寿元+' + lf;
      },
      fail: function (g, U, log) { return '骨文纹路剧烈震颤，觉醒之力冲破禁制——觉醒失败，根基受损'; }
    },
    { id: 'wm_selfseed', weight: 0.02, maxCount: 1, name: '以身为种', tier: 4, desc: '开辟以身为种之路',
      minAge: 15, maxAge: 70,
      cond: function (g, U) { return g.innate >= 7 && g.lvl >= 40 && !g.selfSeed; },
      ok: function (g, U, log) {
        g.selfSeed = true;
        g.lifespan += U.irand(5, 12);
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(3, 5));
        return '体内轰鸣如天地开辟，唯一的洞天在丹田中成形——以身为种大成！不假外物，唯我独尊，寿元+' + U.irand(5, 12);
      },
      fail: function (g, U, log) { return '体内洞天未成便崩塌，经脉逆乱，根基动摇'; }
    },
    { id: 'wm_xianqi', weight: 0.1, maxCount: 1, name: '仙气降临', tier: 4, desc: '修出三道仙气',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 70; },
      ok: function (g, U, log) {
        g.xianQi = true;
        var lf = U.irand(8, 15); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(4, 7));
        return '天穹裂开一道仙光，三道仙气如龙蛇盘旋而下，没入你的百骸——从此超脱凡尘，寿元+' + lf;
      },
      fail: function (g, U, log) { return '仙气在指尖化为泡影，你未能将其凝于骨文之中'; }
    },
    { id: 'wm_reddust', weight: 0.04, maxCount: 1, name: '红尘仙路', tier: 4, desc: '红尘中逆活九世',
      minAge: 60, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 85 && !g.redDust; },
      ok: function (g, U, log) {
        g.redDust = true;
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * 4);
        var lf = U.irand(20, 40); g.lifespan += lf;
        return '红尘九世轮回，每一世的悲欢离合都化为道韵——红尘仙路已开，仙帝之门就在眼前，寿元+' + lf;
      },
      fail: null
    },

    /* ---------- tier 3 稀有 ---------- */
    { id: 'wm_bone', weight: 0.2, maxCount: 3, name: '至尊骨现世', tier: 3, desc: '获得至尊骨传承',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1.5, 3));
        return '至尊骨从天而降，与你的骨骼共鸣——上古至尊的传承融入血脉';
      },
      fail: function (g, U, log) { return '至尊骨的排斥力太强，仅勉强吸收了残余力量'; }
    },
    { id: 'wm_kunpeng', weight: 0.18, maxCount: 2, name: '鲲鹏宝术', tier: 3, desc: '领悟鲲鹏宝术',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.innate >= 5 && g.lvl >= 15; },
      ok: function (g, U, log) {
        if (g.innate < 10) { g.innate += 1; g.aptitude = Math.max(g.aptitude, g.innate); }
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1, 2));
        return '鲲鹏展翅九万里，一念之间你窥见了天地法则——鲲鹏宝术大成';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '鲲鹏之力太过浩瀚，你的骨文不堪重负，寿元受损';
      }
    },
    { id: 'wm_beast', weight: 0.22, maxCount: 5, name: '大荒猎兽', tier: 3, desc: '在大荒中搏杀凶兽',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1.2, 2.5));
        return '你在大荒深处与凶兽血战三天三夜，最终将其斩杀——从它体内取出的骨文散发着远古气息';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(3, 8);
        return '凶兽的利爪撕裂了你的防御，你重伤跌落山崖，寿元受损';
      }
    },
    { id: 'wm_secret', weight: 0.2, maxCount: 3, name: '秘境探索', tier: 3, desc: '进入远古秘境',
      minAge: 10, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var lf = U.irand(3, 7); g.lifespan += lf;
        g.combat += U.irand(500, 3000);
        return '秘境深处的禁制缓缓开启，你踏入了一片被遗忘的天地——寿元+' + lf;
      },
      fail: function (g, U, log) { return '秘境中的阵法将你弹出，什么也没留下'; }
    },

    /* ---------- tier 2 中级 ---------- */
    { id: 'wm_train', weight: 0.7, maxCount: 10, name: '大荒历练', tier: 2, desc: '在大荒中刻苦修炼',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.03, 0.10, 200); return '大荒的风沙与猛兽磨砺了你的意志，历练归来气质焕然一新'; },
      fail: function (g, U, log) { return '大荒的历练枯燥而漫长，瓶颈迟迟未能突破'; }
    },
    { id: 'wm_mediate', weight: 0.7, maxCount: 10, name: '参悟骨文', tier: 2, desc: '静坐参悟天地骨文',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.02, 0.08, 150); return '盘膝入定七日，骨文在体内自行运转，修为水到渠成'; },
      fail: null
    },
    { id: 'wm_xsv', weight: 0.6, maxCount: 8, name: '虚神界历练', tier: 2, desc: '进入虚神界修炼',
      minAge: 8, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 10; },
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.04, 0.12, 300); return '虚神界中强者如林，你以战养战在激战中领悟了新的骨文奥义'; },
      fail: function (g, U, log) { g.lifespan -= U.irand(1, 4); return '虚神界中遇到实力远超你的对手，重伤退出，寿元受损'; }
    },
    { id: 'wm_herb', weight: 0.5, maxCount: 5, name: '灵药辅助', tier: 2, desc: '服用大荒灵药',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var lf = U.irand(1, 4); g.lifespan += lf;
        g.combat += U.irand(200, 1500);
        return '大荒深处的灵药化作暖流灌入四肢百骸，寿元+' + lf;
      },
      fail: function (g, U, log) { return '灵药药力太猛，你的身体一时难以承受'; }
    },
    { id: 'wm_xiangu', weight: 0.5, maxCount: 2, name: '仙古时代历练', tier: 2, desc: '进入仙古时代遗迹',
      minAge: 40, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 50; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        var lf = U.irand(3, 8); g.lifespan += lf;
        return '仙古遗迹中的壁画记载着失落的修炼法门，你日夜参悟渐触上古真意，寿元+' + lf;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(2, 5);
        return '仙古遗迹中的封印松动，溢出的杀机令你猝不及防，寿元受损';
      }
    },
    { id: 'wm_taichu', weight: 0.4, maxCount: 1, name: '太初古矿', tier: 2, desc: '探索太初古矿',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.0, 2.5));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        return '太初古矿中星光流转，你在矿脉深处找到了一缕太初精华，寿元+' + lf;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '太初古矿中的矿兽伏击了你，寿元受损';
      }
    },
    { id: 'wm_shengren', weight: 0.3, maxCount: 1, name: '圣人战场', tier: 2, desc: '在远古圣人战场中感悟',
      minAge: 50, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 60; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2, 4));
        g.combat += add;
        var lf = U.irand(5, 10); g.lifespan += lf;
        return '圣人战场残余道韵萦绕身边，你在硝烟中悟出了圣人千年前的一式，寿元+' + lf;
      },
      fail: null
    },

    /* ---------- tier 1 普通 ---------- */
    { id: 'wm_stonevillage', weight: 1.0, maxCount: 3, name: '石村修行', tier: 1, desc: '在石村中修炼骨文',
      minAge: 3, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.8));
        g.combat += add;
        var lf = U.irand(1, 3); g.lifespan += lf;
        return '石村村民围坐篝火讲述先人故事，你在故事中参悟了骨文的一角，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_butian', weight: 0.9, maxCount: 3, name: '补天阁历练', tier: 1, desc: '在补天阁中修行',
      minAge: 8, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 1.0));
        g.combat += add;
        return '补天阁演武场上与同门师兄弟对练百招，宝术日渐纯熟';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '补天阁修行严苛异常，操之过急反而伤了根基';
      }
    },
    { id: 'wm_hundred', weight: 0.8, maxCount: 3, name: '百断山搏杀', tier: 1, desc: '在百断山中搏杀凶兽',
      minAge: 10, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.5, 1.2));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        return '百断山中猛兽出没，你以拳对爪在生死搏杀中磨砺出铁血意志，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_diguan', weight: 0.7, maxCount: 2, name: '帝关驻守', tier: 1, desc: '在帝关抵御异域入侵',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add;
        var lf = U.irand(1, 3); g.lifespan += lf;
        return '帝关城墙在你身后，你以血肉之躯挡住异域第一波攻势——守护了大荒也磨砺了自己，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_xuanshen', weight: 0.6, maxCount: 3, name: '虚神界历练', tier: 1, desc: '进入虚神界参悟骨文',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 10; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.6));
        g.combat += add;
        return '虚神界中的星光化为骨文刻入识海，你对修炼有了新的理解';
      },
      fail: null
    },

    /* ---------- [新增] tier 4 传说 ---------- */
    { id: 'wm_xianguhe', weight: 0.06, maxCount: 1, name: '仙古时代传承', tier: 4, desc: '获得仙古时代的远古传承',
      minAge: 50, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 60; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(5, 8));
        g.combat += add;
        var lf = U.irand(10, 20); g.lifespan += lf;
        if (g.innate < 10 && U.irand(1, 100) <= 30) { g.innate += 1; g.aptitude = Math.max(g.aptitude, g.innate); }
        return '仙古大能的残念从遗迹深处苏醒，目光穿越亿万年凝视着你——传承已授，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(5, 10); return '仙古大能的意志太过浩瀚，你的神魂几近崩溃，寿元受损'; }
    },
    { id: 'wm_kunblood', weight: 0.05, maxCount: 1, name: '鲲鹏真血', tier: 4, desc: '获得鲲鹏真血传承',
      minAge: 40, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 55 && g.innate >= 6; },
      ok: function (g, U, log) {
        if (g.innate < 10) { g.innate += 1; g.aptitude = Math.max(g.aptitude, g.innate); }
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(4, 7));
        g.combat += add;
        var lf = U.irand(8, 15); g.lifespan += lf;
        return '鲲鹏真血破体而入，化作滔天巨浪冲刷每一寸骨文——血脉蜕变，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(3, 8); return '鲲鹏真血在体内狂暴翻涌，真血之力难以驯服，寿元受损'; }
    },
    { id: 'wm_dibing', weight: 0.04, maxCount: 1, name: '帝兵现世', tier: 4, desc: '远古帝兵出世',
      minAge: 55, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 65; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(6, 10));
        g.combat += add;
        var lf = U.irand(15, 25); g.lifespan += lf;
        return '远古帝兵破土而出，万丈光芒中向你低鸣——帝兵认主，从此握有灭世之力，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(8, 15); return '帝兵的威压如同一座大山压下，骨骼寸寸碎裂——你承受不住这远古之力，寿元大损'; }
    },

    /* ---------- [新增] tier 3 稀有 ---------- */
    { id: 'wm_baiduan', weight: 0.18, maxCount: 2, name: '百断山至尊骨', tier: 3, desc: '在百断山寻得至尊骨',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 25; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        var lf = U.irand(3, 7); g.lifespan += lf;
        return '百断山的绝壁之上，一块散发金光的至尊骨嵌在岩缝中——你攀上绝顶将其摘下，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(2, 5); return '百断山深处的凶兽发现了你，一场恶战后你伤痕累累地撤退，寿元受损'; }
    },
    { id: 'wm_xushengu', weight: 0.16, maxCount: 2, name: '虚神界·仙古遗迹', tier: 3, desc: '虚神界深处仙古遗迹',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 35; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2, 4));
        g.combat += add;
        var lf = U.irand(4, 9); g.lifespan += lf;
        return '虚神界的迷雾散开，仙古遗迹的轮廓浮现——你踏过残垣断壁，拾起了上古大能的传承，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(3, 6); return '遗迹中的守护阵法激活，你在逃亡中被仙古之力灼伤，寿元受损'; }
    },
    { id: 'wm_sangshu', weight: 0.25, maxCount: 5, name: '桑树村修行', tier: 3, desc: '在桑树村中静修',
      minAge: 8, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.8, 1.5));
        g.combat += add;
        var lf = U.irand(2, 4); g.lifespan += lf;
        return '火桑树下静坐三日，枝叶间流淌的古老气息浸润了你的骨文，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_dhnest', weight: 0.2, maxCount: 3, name: '大荒凶兽巢穴', tier: 3, desc: '深入大荒凶兽巢穴',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        return '你在凶兽巢穴中穿行避开层层陷阱——最终在最深处找到了远古遗落的骨文材料，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(3, 8); return '巢穴深处的凶兽王突然苏醒，你拼尽全力才逃出生天，寿元受损'; }
    },
    { id: 'wm_taichudeep', weight: 0.12, maxCount: 1, name: '太初古矿深处', tier: 3, desc: '探索太初古矿最深处',
      minAge: 35, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 50; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2.5, 4.5));
        g.combat += add;
        var lf = U.irand(5, 10); g.lifespan += lf;
        return '太初古矿最深处，原始混沌之气化为液态——你沐浴其中，太初精华洗涤肉身，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(3, 7); return '太初古矿深处的混沌之力暴走，你险些被吞噬，寿元受损'; }
    },
    { id: 'wm_kunnest', weight: 0.1, maxCount: 1, name: '鲲鹏巢', tier: 3, desc: '寻得远古鲲鹏巢穴',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 45 && g.innate >= 5; },
      ok: function (g, U, log) {
        if (g.innate < 10) { g.innate += 1; g.aptitude = Math.max(g.aptitude, g.innate); }
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2, 3.5));
        g.combat += add;
        var lf = U.irand(5, 10); g.lifespan += lf;
        return '传说中的鲲鹏巢穴中，残留真血化作一道光注入你的骨骼——天赋蜕变，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(4, 9); return '鲲鹏巢外的远古阵法突然运转，雷霆万钧之力将你震飞，寿元受损'; }
    },
    { id: 'wm_xianjia', weight: 0.14, maxCount: 2, name: '仙家洞府', tier: 3, desc: '发现远古仙家洞府',
      minAge: 28, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2, 4));
        g.combat += add;
        var lf = U.irand(5, 12); g.lifespan += lf;
        return '石壁上的仙文亮起金光，洞府大门缓缓开启——仙家万载积累尽归你手，寿元+' + lf;
      },
      fail: null
    },

    /* ---------- [新增] tier 2 中级 ---------- */
    { id: 'wm_shicungo', weight: 0.65, maxCount: 8, name: '石村·骨文修行', tier: 2, desc: '在石村中参悟骨文',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.03, 0.10, 250); var lf = U.irand(1, 3); g.lifespan += lf; return '你在石村老柳树下观摩先人留下的骨文，一笔一画皆有深意，寿元+' + lf; },
      fail: null
    },
    { id: 'wm_butiansk', weight: 0.6, maxCount: 5, name: '补天阁·宝术传授', tier: 2, desc: '补天阁传授宝术',
      minAge: 8, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 5; },
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.04, 0.12, 300); var lf = U.irand(1, 3); g.lifespan += lf; return '补天阁长老亲自传授宝术精要，你反复演练至月上中天，寿元+' + lf; },
      fail: null
    },
    { id: 'wm_yaodu', weight: 0.55, maxCount: 3, name: '药都·炼丹', tier: 2, desc: '在药都炼制丹药',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 15; },
      ok: function (g, U, log) {
        var lf = U.irand(3, 6); g.lifespan += lf;
        var add = U.irand(300, 1500); g.combat += add;
        return '丹炉中药火由青转金，一枚散发异香的灵丹出炉——寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(1, 3); return '丹炉炸裂，药火反噬灼伤经脉，寿元受损'; }
    },
    { id: 'wm_shenmiao', weight: 0.5, maxCount: 2, name: '神庙洗礼', tier: 2, desc: '在远古神庙中接受洗礼',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.0, 2.0));
        g.combat += add;
        var lf = U.irand(3, 7); g.lifespan += lf;
        return '远古神庙降下金色光柱，洗礼之力洗去体内杂质，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_diguanbt', weight: 0.55, maxCount: 3, name: '帝关血战', tier: 2, desc: '在帝关血战异域',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 25; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.2, 2.5));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        return '帝关之上异域大军压境——你在城墙上以血肉筑起防线，每一次交锋都让你更强，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(3, 7); return '帝关之战中被异域强者重伤，被同伴拖下城墙，寿元受损'; }
    },
    { id: 'wm_xianguwar', weight: 0.5, maxCount: 2, name: '仙古战场', tier: 2, desc: '进入仙古战场遗迹',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 35; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        var lf = U.irand(3, 7); g.lifespan += lf;
        return '仙古战场上残留的剑意与拳印仍在共鸣，你在其中感悟着仙人的战斗意志，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(3, 7); return '仙古战场残余杀气暴走，你被卷入其中受伤不轻，寿元受损'; }
    },
    { id: 'wm_xuanxiao', weight: 0.5, maxCount: 3, name: '玄霄秘境', tier: 2, desc: '探索玄霄秘境',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 25; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.0, 2.5));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        return '玄霄秘境中霞光万道，你循着一缕仙韵找到了隐藏的修炼洞天，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_zifu', weight: 0.6, maxCount: 5, name: '紫府修行', tier: 2, desc: '在紫府中静修',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.04, 0.13, 280); var lf = U.irand(2, 4); g.lifespan += lf; return '紫府之中灵气浓郁如水，修为在不知不觉中稳步攀升，寿元+' + lf; },
      fail: null
    },
    { id: 'wm_wanguo', weight: 0.55, maxCount: 3, name: '万国书院', tier: 2, desc: '在万国书院中学习',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 15; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.8, 1.8));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        return '万国书院汇聚着大荒各族天才，你与他们切磋交流受益匪浅，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_shenshan', weight: 0.5, maxCount: 2, name: '神山拜谒', tier: 2, desc: '拜谒远古神山',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.2, 2.5));
        g.combat += add;
        var lf = U.irand(3, 8); g.lifespan += lf;
        return '神山巍峨入云，山巅灵气如瀑布倾泻——你跪拜山前获得神山认可，寿元+' + lf;
      },
      fail: null
    },

    /* ---------- [新增] tier 1 普通 ---------- */
    { id: 'wm_luoxing', weight: 0.9, maxCount: 5, name: '落星村', tier: 1, desc: '在落星村中修行',
      minAge: 5, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        return '落星村因天外陨石得名，村中灵气因陨石格外浓厚，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_dhouter', weight: 1.0, maxCount: 8, name: '大荒外围', tier: 1, desc: '在大荒外围历练',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) { var gain = U.evCombat(g, 0.02, 0.08, 150); var lf = U.irand(1, 2); g.lifespan += lf; return '大荒外围虽不及深处凶险，但每一寸土地都暗藏玄机，寿元+' + lf; },
      fail: null
    },
    { id: 'wm_qingyang', weight: 0.9, maxCount: 5, name: '青阳镇', tier: 1, desc: '在青阳镇中历练',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.6));
        g.combat += add;
        var lf = U.irand(1, 3); g.lifespan += lf;
        return '青阳镇集市上你偶遇游方修士指点迷津，几句真言让你茅塞顿开，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_zhenshan', weight: 0.85, maxCount: 5, name: '鎇山狩猎', tier: 1, desc: '在鎇山中狩猎',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 0.8));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        return '鎇山密林中的狩猎让你学会了观察猎物的微小动作，这种本能融入了战斗，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_lingyao', weight: 0.8, maxCount: 5, name: '灵药采集', tier: 1, desc: '采集大荒灵药',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var lf = U.irand(1, 3); g.lifespan += lf;
        var add = U.irand(100, 800); g.combat += add;
        return '你在大荒深处找到了一株百年灵药，小心翼翼地采下，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_shicunpang', weight: 0.9, maxCount: 5, name: '石村旁山', tier: 1, desc: '在石村旁山中历练',
      minAge: 5, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.2, 0.5));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        return '石村旁的山脉清泉流淌，你沿溪水攀岩而上在高处远眺时忽有所悟，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_butianout', weight: 0.85, maxCount: 5, name: '补天阁外院', tier: 1, desc: '在补天阁外院修行',
      minAge: 7, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.6));
        g.combat += add;
        return '补天阁外院藏书阁中你翻阅了大量基础功法，为日后修炼打下根基';
      },
      fail: null
    },
    { id: 'wm_xushenout', weight: 0.8, maxCount: 5, name: '虚神界外围', tier: 1, desc: '在虚神界外围参悟',
      minAge: 8, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 5; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.6));
        g.combat += add;
        return '虚神界外围空间波动频繁，你借此感悟了空间之力的皮毛';
      },
      fail: null
    },
    { id: 'wm_qingluan', weight: 0.8, maxCount: 3, name: '青鸾家族', tier: 1, desc: '青鸾家族传承',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 0.9));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        return '青鸾家族长老见你骨骼惊奇赐下族中秘传——你铭记这份恩情，寿元+' + lf;
      },
      fail: null
    },
    { id: 'wm_wangyue', weight: 0.8, maxCount: 3, name: '望月楼', tier: 1, desc: '在望月楼中参悟',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        return '望月楼高耸入云，你在楼顶仰望星空月光洒落在骨文上泛起微光，寿元+' + lf;
      },
      fail: null
    }
  ];

  /* ============================================================
   * 术语映射 terms
   * ============================================================ */
  var terms = {
    simulatorName: '完美世界模拟器',
    ability: '宝术',
    abilityTalent: '骨文品阶',
    combat: '神力',
    level: '境界',
    lifespan: '寿元',
    skill: '宝术',
    skillTier: '骨文',
    essence: '仙种',
    essenceShort: '仙种',
    ascend: '仙帝',
    ascendVerb: '成仙',
    cultivateVerb: '修炼',
    breakVerb: '突破',
    ageUnit: '岁',
    innateTiers: TIER_NAME,
    peakLv: 99,
    godLevel: 100,

    year: function (age) { return '第' + age + '岁，修炼'; },
    breakSuccess: function (age) { return '第' + age + '岁，修炼，成功突破！'; },
    combo: function (age) { return '第' + age + '岁，修炼，连破！'; },
    yearCombat: function (age, gain) { return '第' + age + '岁，修炼，神力+' + gain; },
    death: function (age) { return '第' + age + '岁，寿元耗尽，与世长辞'; },
    deathEvent: function (age) { return '第' + age + '岁，寿元将尽时遭遇变故，不幸陨落'; },
    mutation: function (age) { return '第' + age + '岁，骨文变异！天赋跃升至极阶 EX，寿元+50'; },
    origin: function (age) { return '第' + age + '岁，仙气降临，直接成仙！'; },
    getEssence: function (age, name, gain) { return '第' + age + '岁，获得仙种『' + name + '』，神力+' + gain; },
    awakenSkill: function (peak, tierName, add) { return '修为达到' + peak + '级，参悟' + tierName + '级骨文宝术，神力+' + add; },
    levelUp: function (from, to, cg, lg) { return '境界' + from + '→' + to + '级，神力+' + cg + (lg ? '，寿元+' + lg : '') + '！'; },
    peakLevelUp: function () { return '境界抵达巅峰后，有所领悟，神力+10000！'; },
    refineSuccess: function (age, name) { return '第' + age + '岁，寿元将尽，成功证道，蜕变为仙帝，仙帝名：' + (name || '仙帝') + '！'; },
    refineFail: function (age, boost) { return '第' + age + '岁，仙种融合失败，但骨文有所提升，神力+' + boost; },
    forcedAscend: function (age, name) { return '第' + age + '岁，寿元将尽，强行突破，蜕变为仙帝，仙帝名：' + (name || '仙帝') + '！'; },
    forcedFail: function (age) { return '第' + age + '岁，强行成仙失败，身死道消'; },

    settleGodTitle: '✨ 仙帝降世 ✨',
    settleDeadTitle: '💀 身死道消',
    settleFailTitle: '⚡ 成仙失败 · 道消',
    settlePauseTitle: '⏸ 提前结算',
    settleGodDesc: '✨ 成功突破仙级，蜕变为仙帝 ✨',
    settleAgeLabelAscend: '成仙用时',
    settleAgeLabelDead: '存活年数',
    refineFailHint: function (ascended) {
      return ascended ? ' —— 仙种融合失败，改由强行成仙' : ' —— 仙种融合失败（神力不足），转入强行成仙，惜败';
    },

    homeSub: '——大荒修炼，看看你能成为仙帝的那个绝世天骄吗？——',
    aboutText: '完美世界，大荒万族林立，六岁觉醒骨文天赋，<b>随机抽取</b>宝术和寿元，开始修炼之路，还可能遇到各种机缘与变异，天赋 F 级，亦有逆天翻盘的机会~<br>你唯一的目标，就是成仙——修炼至巅峰（99 级）即可尝试强行成仙，更有机会获得 <b>仙种</b>，融合仙种即可晋升仙帝，大幅提升成仙概率！<br>每局结束时，将获得经验，提升玩家等级，玩家等级越高，觉醒强大宝术几率越大，快来试试看——你，会不会是那个 <b>仙帝</b> 的绝世天骄？',

    exportTitle: '完美世界模拟器',
    exportFooter: '完美世界模拟器 —— 看看你能成为仙帝的那个天骄吗？',
    exportCardTitle: '完美世界 · 高光时刻',
    reviewTitle: '完美世界模拟器',
    guardMaskTitle: '🎲 保底 · 仙骨 骨文品阶',
    guardTalentRow: '骨文品阶：凡骨+5 / 灵骨+4 / 真骨+3 / 宝骨+2 / 王骨及以上+1',
    guardLevelRow: '等级（按等级）：81级+3 / 91级+5 / 95级+8 / 99级+10 / 仙帝+30',
    guardHint: '积分满 100 后，下一次开始游戏必定觉醒<b>仙骨 骨文品阶</b>，随后积分清零重新累计。'
  };

  var TALENTS = [
    /* green */
    { id:'wm_t1', name:'神力温养', rarity:'green', desc:'初始神力+50', apply:function(g){ g.combat += 50; } },
    { id:'wm_t2', name:'强健体魄', rarity:'green', desc:'寿元+5', apply:function(g){ g.lifespan += 5; } },
    { id:'wm_t3', name:'宝术亲和', rarity:'green', desc:'神力+10%', apply:function(g){ g.combat = Math.floor(g.combat * 1.1); } },
    { id:'wm_t4', name:'修炼勤奋', rarity:'green', desc:'寿元+3，神力+20', apply:function(g){ g.lifespan += 3; g.combat += 20; } },
    { id:'wm_t5', name:'骨文凝练', rarity:'green', desc:'初始等级+1', apply:function(g){ g.lvl += 1; } },
    /* blue */
    { id:'wm_t6', name:'神力精通', rarity:'blue', desc:'神力+20%', apply:function(g){ g.combat = Math.floor(g.combat * 1.2); } },
    { id:'wm_t7', name:'长生不老', rarity:'blue', desc:'寿元+15', apply:function(g){ g.lifespan += 15; } },
    { id:'wm_t8', name:'骨文觉醒', rarity:'blue', desc:'初始等级+2', apply:function(g){ g.lvl += 2; } },
    { id:'wm_t9', name:'天赋初显', rarity:'blue', desc:'神力+200', apply:function(g){ g.combat += 200; } },
    { id:'wm_t10', name:'灵药滋养', rarity:'blue', desc:'寿元+10，神力+50', apply:function(g){ g.lifespan += 10; g.combat += 50; } },
    /* purple */
    { id:'wm_t11', name:'骨文变异', rarity:'purple', desc:'天赋+1', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); } },
    { id:'wm_t12', name:'神力暴增', rarity:'purple', desc:'神力+40%', apply:function(g){ g.combat = Math.floor(g.combat * 1.4); } },
    { id:'wm_t13', name:'仙草滋养', rarity:'purple', desc:'寿元+25', apply:function(g){ g.lifespan += 25; } },
    /* gold */
    { id:'wm_t14', name:'仙骨传承', rarity:'gold', desc:'天赋+2，成仙概率+8%，开局获得以身为种', apply:function(g){ g.innate = Math.min(10, g.innate + 2); g.aptitude = Math.max(g.aptitude, g.innate); g.ascendBonus = (g.ascendBonus || 0) + 0.08; g.selfSeed = true; } },
    { id:'wm_t15', name:'仙帝血脉', rarity:'gold', desc:'天赋+1，成仙概率+10%，开局获得三道仙气', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.ascendBonus = (g.ascendBonus || 0) + 0.10; g.xianQi = true; } },
    /* [新增] green */
    { id:'wm_t16', name:'神力温养2', rarity:'green', desc:'神力+100', apply:function(g){ g.combat += 100; } },
    { id:'wm_t17', name:'石村前辈', rarity:'green', desc:'神力+10%，寿元+5', apply:function(g){ g.combat = Math.floor(g.combat * 1.1); g.lifespan += 5; } },
    { id:'wm_t18', name:'骨文护体', rarity:'green', desc:'神力+30，寿元+3', apply:function(g){ g.combat += 30; g.lifespan += 3; } },
    { id:'wm_t19', name:'大荒滋养', rarity:'green', desc:'寿元+8，神力+15', apply:function(g){ g.lifespan += 8; g.combat += 15; } },
    /* [新增] blue */
    { id:'wm_t20', name:'骨文共鸣', rarity:'blue', desc:'神力+15%，寿元+8', apply:function(g){ g.combat = Math.floor(g.combat * 1.15); g.lifespan += 8; } },
    { id:'wm_t21', name:'仙气护身', rarity:'blue', desc:'神力+25%，寿元+12', apply:function(g){ g.combat = Math.floor(g.combat * 1.25); g.lifespan += 12; } },
    { id:'wm_t22', name:'至尊骨加护', rarity:'blue', desc:'神力+200，等级+1', apply:function(g){ g.combat += 200; g.lvl += 1; } },
    { id:'wm_t23', name:'灵药淬体', rarity:'blue', desc:'寿元+15，神力+100', apply:function(g){ g.lifespan += 15; g.combat += 100; } },
    /* [新增] purple */
    { id:'wm_t24', name:'仙种亲和', rarity:'purple', desc:'神力+30%，寿元+20，仙种融合率提升', apply:function(g){ g.combat = Math.floor(g.combat * 1.3); g.lifespan += 20; g.essenceAffinity = (g.essenceAffinity || 0) + 1; } },
    /* [新增] gold */
    { id:'wm_t25', name:'仙帝传承', rarity:'gold', desc:'天赋+1，成仙概率+12%，开局以身为种+仙气', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.ascendBonus = (g.ascendBonus || 0) + 0.12; g.selfSeed = true; g.xianQi = true; } },
    { id:'wm_t26', name:'天命所归', rarity:'gold', desc:'幸运加持，仙种概率+20%，成仙+6%', apply:function(g){ g.ascendBonus = (g.ascendBonus || 0) + 0.06; g.luckBonus = (g.luckBonus || 0) + 1; g.combat = Math.floor(g.combat * 1.2); } },
    { id:'wm_t27', name:'柳神庇佑', rarity:'gold', desc:'开局获柳神指点，宝术品阶+2，成仙+8%', apply:function(g){ g.ascendBonus = (g.ascendBonus || 0) + 0.08; g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.lifespan += 20; } },
    { id:'wm_t28', name:'荒之血脉', rarity:'gold', desc:'开局觉醒荒血脉，神力+40%，成仙+7%', apply:function(g){ g.combat = Math.floor(g.combat * 1.4); g.ascendBonus = (g.ascendBonus || 0) + 0.07; g.lifespan += 15; } },
  ];

  /* ---------- 主题对象 ---------- */
  /* 根据角色生平生成仙帝名 */
  function generateImmortalName(g) {
    var ability = g.ability || '';
    var highLvl = g.lvl >= 90;


    /* 根据功法/武魂属性匹配 */
    if (g.selfSeed) {
      /* 以身为种路线：最高称号 */
      return g.innate >= 8 ? '荒天帝' : (g.innate >= 5 ? '不朽仙帝' : '凡尘仙帝');
    }
    if (g.redDust) {
      /* 红尘仙路线 */
      return g.innate >= 8 ? '红尘仙帝' : (g.innate >= 5 ? '红尘真仙' : '红尘散仙');
    }
    /* 根据功法属性 */
    if (ability.indexOf('冰') >= 0 || ability.indexOf('雪') >= 0) {
      return highLvl ? '冰霜仙帝' : '寒冰仙人';
    }
    if (ability.indexOf('火') >= 0 || ability.indexOf('炎') >= 0) {
      return highLvl ? '炎帝' : '火灵仙人';
    }
    if (ability.indexOf('雷') >= 0) {
      return highLvl ? '雷帝' : '雷霆仙人';
    }
    if (ability.indexOf('风') >= 0) {
      return highLvl ? '风帝' : '疾风仙人';
    }
    if (ability.indexOf('石') >= 0 || ability.indexOf('土') >= 0 || ability.indexOf('岩') >= 0) {
      return highLvl ? '石帝' : '磐石仙人';
    }
    if (ability.indexOf('金') >= 0 || ability.indexOf('铁') >= 0) {
      return highLvl ? '金刚仙帝' : '金身仙人';
    }
    if (ability.indexOf('木') >= 0 || ability.indexOf('藤') >= 0 || ability.indexOf('花') >= 0) {
      return highLvl ? '木灵仙帝' : '草木仙人';
    }
    /* 通用 fallback */
    if (g.innate >= 9) return '天命仙帝';
    if (g.innate >= 7) return '盖世仙帝';
    if (g.innate >= 5) return '不朽仙帝';
    if (g.age < 80) return '少年仙帝';
    return '凡尘仙帝';
  }
  var theme = {
    id: 'wanmei',
    name: '完美世界模拟器',
    subtitle: '大荒修炼 · 仙种成帝',
    desc: '大荒万族，骨文觉醒，修炼宝术，融合仙种，成仙之路。',
    accent: '#9b6bff',
    icon: '✦',
    tags: ['大荒修炼', '仙种仙帝', '修仙养成'],
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
    TALENTS: TALENTS,

    LIFE_MIN: 90, LIFE_MAX: 170,
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

    initialState: {},
    hooks: {
      /* 觉醒宝术时，从对应品阶池随机抽一个功法名称，存入 g.skillNames */
      onAwakenSkill: function (g, tierName, add) {
        var pool = SKILL_NAMES[tierName] || SKILL_NAMES['凡'];
        var name = pool[Math.floor(Math.random() * pool.length)];
        if (!g.skillNames) g.skillNames = [];
        var exists = false;
        for (var i = 0; i < g.skillNames.length; i++) { if (g.skillNames[i].name === name) { exists = true; break; } }
        if (!exists) g.skillNames.push({ name: name, rank: tierName });
        return name;
      },
      /* ★ 完美多路径成仙：以身为种 / 红尘仙 */
      tryAscendPath: function (g, log, U, helpers) {
        if ((g.pathAttempts || 0) >= 2) return false;   /* 主题路径最多尝试 2 次 */
        /* 路径1：以身为种 - 需以身为种 + 三道仙气 + 修为≥90，成功率7%（递减） */
        if (g.selfSeed && g.xianQi && g.lvl >= 90) {
          g.pathAttempts = (g.pathAttempts || 0) + 1;
          var rate1 = (0.07 + (g.ascendBonus || 0)) - (g.pathAttempts - 1) * 0.012;
          if (Math.random() < rate1) {
            g.ascendMode = 'selfSeed';
            g.immortalName = generateImmortalName(g);
            log.push({ cls: 'god', text: '第' + g.age + '岁，以身为种大成！开创遮天修炼体系，证道仙帝！仙帝名：' + g.immortalName + '！' });
            g.ascended = true; g.lvl = 100;
            g.combat = helpers.godCombat(g.combat, 10); g.lifespan = 99999;
            return true;
          }
          log.push({ cls: 'ev3', text: '第' + g.age + '岁，以身为种证道失败，根基未稳！' });
          return false;
        }
        /* 路径2：红尘仙 - 需红尘仙路 + 修为≥95，成功率6%（递减） */
        if (g.redDust && g.lvl >= 95) {
          g.pathAttempts = (g.pathAttempts || 0) + 1;
          var rate2 = (0.06 + (g.ascendBonus || 0)) - (g.pathAttempts - 1) * 0.012;
          if (Math.random() < rate2) {
            g.ascendMode = 'redDust';
            g.immortalName = generateImmortalName(g);
            log.push({ cls: 'god', text: '第' + g.age + '岁，红尘九世回归！红尘成仙，证道仙帝！仙帝名：' + g.immortalName + '！' });
            g.ascended = true; g.lvl = 100;
            g.combat = helpers.godCombat(g.combat, 8); g.lifespan = 99999;
            return true;
          }
          log.push({ cls: 'ev3', text: '第' + g.age + '岁，红尘九世未满，证道失败！' });
          return false;
        }
        return false;
      }
    }
  };

  root.THEMES = root.THEMES || {};
  root.THEMES.wanmei = theme;
})(typeof self !== 'undefined' ? self : this);