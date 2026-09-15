/* ============================================================
 * 主题包 · 斗罗大陆模拟器（douluo）
 * 修炼体系：武魂觉醒(6岁) → 魂士→魂师→大魂师→魂尊→魂宗→魂王→魂帝→魂圣→魂斗罗→封号斗罗→神祇
 * 先天魂力 1-10 级（F~EX），魂环（白黄紫黑红金），魂骨，双生武魂
 * 数据自包含，引擎平衡数值与末日主题一致，保证可玩性
 * ============================================================ */
(function (root) {

  /* ---------- 常量 & 平衡数值（与引擎逻辑匹配） ---------- */
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
  var TIER_NAME = ['', '2级', '4级', '6级', '8级', '10级', '12级', '14级', '16级', '18级', '20级(满)'];

  /* ---------- 武魂池（按先天魂力 1-10 分档） ---------- */
  var ABILITY_POOL = {
    1: ['蓝银草', '锄头', '农具', '柳条鞭', '木盾', '石锤', '草绳', '铁钉', '木弓', '竹笛', '陶碗'],
    2: ['疾风狼', '铁背熊', '青藤蛇', '烈焰鹰', '寒冰蛙', '岩甲龟', '风刃燕', '毒针蜂', '水灵鱼', '雷光鼠', '荆棘兔'],
    3: ['幽冥灵猫', '火焰领主', '玄武龟', '月刃', '妖狐', '天青藤', '彩虹龙', '糖豆', '鬼藤', '龙纹棍', '锻造锤', '刀魂'],
    4: ['邪眸白虎', '幽冥白虎', '火凤凰', '蓝电霸王龙', '七宝琉璃塔', '九心海棠', '碧磷蛇皇', '猫鹰', '大力金刚熊', '冰凤凰', '烈焰狮王', '破魂枪'],
    5: ['昊天锤', '蓝银皇', '噬魂蛛皇', '七杀剑', '骨龙', '盘龙棍', '黄金鳄王', '破魂枪·觉醒', '烈焰狮王·真', '金乌', '邪火凤凰', '天青牛蟒'],
    6: ['六翼天使', '海神三叉戟', '蓝银皇·真', '昊天锤·真', '邪火凤凰·觉醒', '冰碧蝎', '冰天雪女', '暗金恐爪熊', '火焰领主·真', '雷霆龙', '九宝琉璃塔', '九尾妖狐'],
    7: ['十首烈阳蛇', '深海魔鲸王', '千钧蚁皇', '泰坦巨猿', '人面魔蛛皇', '地穴魔蛛皇', '暗魔邪神虎', '冰帝', '雪帝', '海神·雏形', '修罗神·雏形', '天使神·雏形', '九头蝙蝠王'],
    8: ['蓝银皇·究极', '昊天锤·究极', '六翼天使·真身', '海神·真身', '冰碧蝎皇', '九宝琉璃塔·真', '深海魔鲸王·真', '暗金恐爪熊·真', '泰坦巨猿·真', '九尾天狐', '修罗神·觉醒', '天使神·觉醒'],
    9: ['蓝银皇·神级', '昊天锤·神级', '海神·神赐', '修罗神·神赐', '天使神·神赐', '六翼天使·神级', '冰帝·神级', '雪帝·神级', '九宝琉璃塔·神级', '真·天使神', '真·海神', '真·修罗神', '深渊魔鲸·神级'],
    10: ['海神·真身', '修罗神·真身', '天使神·真身', '蓝银皇·成神', '昊天锤·成神', '创世神·武魂', '命运之神', '万物之灵', '混沌之主', '诸天武魂', '永生武魂', '时空之主', '命运改写', '虚实剥离']
  };

  var INNATE_WEIGHTS = [0, 33.0, 25.0, 11.0, 9.0, 7.0, 5.0, 4.0, 3.0, 2.0, 1.0];

  /* ---------- 魂骨（基因源质等价物，6 种 + 2 特殊 = 8） ---------- */
  var ESSENCE = [
    { id: 'sb_head',  name: '魂骨·头部·精神凝聚', needCombat: 80000, rate: 1.24 },
    { id: 'sb_trunk', name: '魂骨·躯干·生命之核', needCombat: 90000, rate: 1.33 },
    { id: 'sb_larm',  name: '魂骨·左臂·撕裂之爪', needCombat: 100000, rate: 1.42 },
    { id: 'sb_rarm',  name: '魂骨·右臂·碎裂之拳', needCombat: 110000, rate: 1.51 },
    { id: 'sb_lleg',  name: '魂骨·左腿·疾风之翼', needCombat: 120000, rate: 1.6 },
    { id: 'sb_rleg',  name: '魂骨·右腿·大地之足', needCombat: 130000, rate: 1.69 },
    { id: 'sb_ext',   name: '外附魂骨·八蛛矛',     needCombat: 140000, rate: 1.82 },
    { id: 'sb_god',   name: '神赐魂骨·神之传承',   needCombat: 150000, rate: 2.05 }
  ];

  /* ---------- 魂环技能档（与末日 SKILL_TIER 同构，名称改为魂环色） ---------- */
  var SKILL_TIER = [
    { name: '白', combatLo: 0, combatHi: 299, addLo: 10, addHi: 20 },
    { name: '黄', combatLo: 300, combatHi: 2499, addLo: 30, addHi: 60 },
    { name: '紫', combatLo: 2500, combatHi: 9999, addLo: 100, addHi: 300, minRing: 3 },
    { name: '黑', combatLo: 10000, combatHi: 72499, addLo: 500, addHi: 1500, minRing: 4 },
    { name: '红', combatLo: 72500, combatHi: Infinity, addLo: 3000, addHi: 10000, minRing: 5 }
  ];
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

  /* ---------- 魂师称号（titleOf） ---------- */
  var DUO_TITLES = ['', '魂士', '魂师', '大魂师', '魂尊', '魂宗', '魂王', '魂帝', '魂圣', '魂斗罗', '封号斗罗'];
  function titleOf(lvl) {
    lvl = Math.max(1, Math.min(100, Math.floor(lvl) || 1));
    if (lvl >= 100) return '神官';
    if (lvl >= 99) return '极限斗罗';
    if (lvl >= 95) return '超级斗罗' + (lvl - 94) + '级';
    if (lvl >= 91) return '封号斗罗' + (lvl - 90) + '级';
    var idx = Math.floor((lvl - 1) / 10);
    var DUO_BASE = ['魂士','魂师','大魂师','魂尊','魂宗','魂王','魂帝','魂圣','魂斗罗'];
    var mod = lvl % 10;
    if (mod === 0) return DUO_BASE[idx] + '巅峰';
    return DUO_BASE[idx];
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
    { id: 'innate10', name: '先天满魂力', bonus: 0.1 },
    { id: 'twin',   name: '双生武魂',   bonus: 0.1 },
    { id: 'lvl71', name: '魂圣之力',  bonus: 0.1 },
    { id: 'lvl81', name: '魂斗罗之力', bonus: 0.1 },
    { id: 'feng91', name: '封号斗罗',  bonus: 0.1 },
    { id: 'lvl95', name: '超级斗罗',  bonus: 0.1 },
    { id: 'lvl99', name: '巅峰斗罗',  bonus: 0.2 },
    { id: 'combat100k', name: '十万魂力',  bonus: 0.1 },
    { id: 'combat300k', name: '三十万魂力', bonus: 0.2 },
    { id: 'million', name: '百万魂力',  bonus: 0.3 },
    { id: 'essence', name: '魂骨融合',  bonus: 0.1 },
    { id: 'god',   name: '成就神祇',  bonus: 0.2 },
    { id: 'forced', name: '强行成神',  bonus: 0.3 },
    { id: 'god3',  name: '三次成神',  bonus: 0.3 },
    { id: 'god10', name: '十次成神',  bonus: 0.4 },
    { id: 'god30', name: '三十次成神', bonus: 0.5 },
    { id: 'god50', name: '五十次成神', bonus: 0.8 },
    { id: 'god100', name: '百次成神',  bonus: 1 },
    { id: 'mutation', name: '武魂变异',  bonus: 1 },
    { id: 'origin', name: '神赐魂环',  bonus: 1.5 }
  ];

  /* ---------- 魂兽池（按魂环等级分组，每种魂兽多种魂技随机选一） ----------
   * skills: 数组，觉醒时随机选一个；bone: 魂骨部位（可选），千年以上有概率掉落 */
  var SOUL_BEASTS = {
    '白': [ // 十年魂环
      { name: '风铃鸟', year: '十年', skills: ['音波干扰', '疾风步', '羽翼扇击'] },
      { name: '蛮牛', year: '十年', skills: ['蛮力冲撞', '铁角突刺', '厚皮防御'] },
      { name: '毒蛇', year: '十年', skills: ['毒牙噬咬', '蛇缠绕', '毒雾喷射'] },
      { name: '野猪', year: '十年', skills: ['铁甲防御', '野蛮冲撞', '獠牙撕裂'] },
      { name: '烈火鸡', year: '十年', skills: ['火星飞射', '火焰喷吐', '烈焰爪'] },
      { name: '草蛇', year: '十年', skills: ['缠绕束缚', '草叶飞刃', '隐匿潜行'] },
      { name: '石龟', year: '十年', skills: ['坚壳护体', '龟壳冲撞', '石化皮肤'] },
      { name: '铁甲蝎', year: '十年', skills: ['毒尾刺', '铁钳夹击', '蝎毒侵蚀'] },
      { name: '幽冥狼', year: '十年', skills: ['暗影突袭', '狼嚎增幅', '利爪撕裂'] },
      { name: '碧眼蛙', year: '十年', skills: ['水弹射击', '长舌缠绕', '蛙皮护体'] },
      { name: '岩石蜥蜴', year: '十年', skills: ['岩石铠甲', '舌头弹射', '变色隐匿'] },
      { name: '铁喙鹰', year: '十年', skills: ['俯冲击啄', '鹰眼锐视', '羽翼风暴'] }
    ],
    '黄': [ // 百年魂环
      { name: '曼陀罗蛇', year: '四百年', skills: ['缠绕', '毒液喷射', '绞杀'] },
      { name: '鬼藤', year: '六百年', skills: ['寄生', '藤蔓缠绕', '吸取生命'] },
      { name: '烈焰蝎', year: '七百年', skills: ['烈焰尾刺', '蝎火喷射', '毒焰侵蚀'] },
      { name: '冰蛛', year: '五百年', skills: ['冰丝缠绕', '寒冰吐息', '冰甲护体'] },
      { name: '噬人蚁群', year: '八百年', skills: ['蚁群吞噬', '酸液喷射', '蚁巢防御'] },
      { name: '铁甲熊', year: '六百年', skills: ['熊力拍击', '铁甲冲撞', '狂暴怒吼'] },
      { name: '风铃鸟·百', year: '五百年', skills: ['音波穿透', '疾风斩', '风暴之翼'] },
      { name: '蛮牛·百', year: '三百年', skills: ['狂暴冲撞', '铁角风暴', '大地震颤'] },
      { name: '幽冥狼·百', year: '四百年', skills: ['暗影撕裂', '狼群召唤', '暗夜潜行'] },
      { name: '碧眼蛇王', year: '五百年', skills: ['毒牙连击', '蛇皮硬化', '毒雾弥漫'] },
      { name: '岩石巨蜥', year: '七百年', skills: ['岩石弹射', '巨尾横扫', '石化凝视'] },
      { name: '烈焰鸟', year: '六百年', skills: ['火焰俯冲', '烈焰羽翼', '火雨倾泻'] },
      { name: '铁背龟', year: '八百年', skills: ['铁壳防御', '龟息回春', '水柱冲击'] },
      { name: '邪眼猫', year: '四百年', skills: ['魅惑凝视', '利爪连击', '暗影步'] }
    ],
    '紫': [ // 千年魂环（千年以上可概率掉落魂骨）
      { name: '幽冥灵猫', year: '两千年', skills: ['幽冥斩', '暗影分身', '灵魂撕裂'] },
      { name: '火焰领主', year: '三千年', skills: ['火焰领域能', '焚天烈焰', '火元素亲和'] },
      { name: '玄武龟', year: '两千年', skills: ['玄武护盾', '水岩双重', '龟壳反弹'] },
      { name: '妖狐', year: '一千五百年', skills: ['魅惑幻术', '狐火燃烧', '幻影分身'] },
      { name: '人面魔蛛', year: '两千年', skills: ['蛛网束缚', '毒牙噬咬', '八蛛矛刺'] },
      { name: '碧磷蛇皇', year: '三千年', skills: ['碧磷毒雾', '蛇皇缠绕', '毒液暴雨'] },
      { name: '冰凤凰', year: '四千年', skills: ['冰凤之息', '寒冰领域', '凤凰涅槃'] },
      { name: '邪眸白虎', year: '三千年', skills: ['白虎烈光波', '白虎金刚变', '虎啸山林'] },
      { name: '烈焰狮王', year: '两千五百年', skills: ['狮王怒吼', '烈焰扑击', '狮鬃火焰'] },
      { name: '泰坦巨猿·幼', year: '五千年', skills: ['巨力拳', '岩石投掷', '大地震击'] },
      { name: '紫晶翼狮', year: '两千年', skills: ['紫晶射线', '翼刃风暴', '晶化防御'] },
      { name: '九幽雀', year: '两千五百年', skills: ['九幽冥火', '黑炎俯冲', '雀翎飞射'] },
      { name: '雷光鼠王', year: '一千八百年', skills: ['雷电链', '闪电突袭', '电磁护盾'] },
      { name: '冰甲鳄', year: '三千五百年', skills: ['冰甲护体', '鳄尾横扫', '寒冰吐息'] },
      { name: '幽冥虎', year: '三千年', skills: ['暗影突袭', '虎啸震慑', '幽冥利爪'] }
    ],
    '黑': [ // 万年魂环（万年魂兽大概率掉落魂骨）
      { name: '泰坦巨猿', year: '九万年', skills: ['泰坦之锤', '大地之力', '巨猿真身'] },
      { name: '人面魔蛛皇', year: '五万年', skills: ['绚烂之爆', '毒皇领域', '蛛皇铠甲'] },
      { name: '地穴蛛皇', year: '万年', skills: ['蓝银囚笼', '地穴陷阱', '蛛丝铠甲'] },
      { name: '暗魔邪神虎', year: '六万年', skills: ['邪神破', '暗魔邪雷怒', '时空逆转'] },
      { name: '冰碧蝎', year: '四万年', skills: ['冰碧帝皇蝎', '极寒领域', '冰皇之怒'] },
      { name: '千钧蚁皇', year: '九万年', skills: ['千钧壁垒', '大地蚁皇斩', '蚁皇真身'] },
      { name: '重甲虫王', year: '七万年', skills: ['定力之魄', '铁壁冲撞', '甲壳反弹'] },
      { name: '魔瞑鹿', year: '六万年', skills: ['旋风狂舞', '鹿角冲撞', '冥界幻境'] },
      { name: '碧磷蛇皇·万年', year: '三万年', skills: ['万毒噬心', '蛇皇缠绕', '碧磷毒域'] },
      { name: '噬魂蛛皇', year: '两万年', skills: ['噬魂', '精神冲击', '灵魂撕裂'] },
      { name: '九头蝙蝠王', year: '五万年', skills: ['蝙蝠音波', '嗜血撕咬', '暗夜笼罩'] },
      { name: '邪魔虎鲸', year: '八万年', skills: ['虎鲸邪魔斧', '深海领域', '鲸吞天地'] },
      { name: '雷龙', year: '四万年', skills: ['雷霆万钧', '龙息雷电', '雷电领域'] },
      { name: '暗金恐爪熊', year: '六万年', skills: ['恐爪撕裂', '暗金铠甲', '熊力暴增'] },
      { name: '冰碧帝皇蝎·万年', year: '两万年', skills: ['冰帝之怒', '极寒领域', '冰碧真身'] }
    ],
    '红': [ // 十万年魂环（十万年魂兽必定掉落魂骨）
      { name: '天青牛蟒', year: '二十万年', skills: ['天青龙之灭', '天青寂灭雷霆', '牛蟒真身'] },
      { name: '泰坦巨猿·十万年', year: '十万年', skills: ['大地之力', '泰坦真身', '乾坤一掷'] },
      { name: '柔骨兔', year: '十万年', skills: ['虚无', '暴杀八段摔', '无敌金身'] },
      { name: '深海魔鲸王', year: '百万年', skills: ['修罗结界', '魔鲸领域', '深海狂潮'] },
      { name: '邪魔虎鲸王', year: '十万年', skills: ['虎鲸邪魔斧', '虎鲸真身', '邪魔领域'] },
      { name: '冰天雪女', year: '十万年', skills: ['冰雪降临', '绝对零度', '雪女真身'] },
      { name: '烈焰麒麟', year: '十万年', skills: ['麒麟圣火', '烈焰领域', '麒麟真身'] },
      { name: '紫煌灭天龙', year: '二十万年', skills: ['灭天龙息', '紫煌领域', '龙族真身'] },
      { name: '深渊魔鲸', year: '三十万年', skills: ['深渊吞噬', '魔鲸咆哮', '深海领域'] },
      { name: '碧姬', year: '十万年', skills: ['生命之光', '翡翠治愈', '森林领域'] }
    ]
  };
  /* 魂环颜色映射 */
  var RING_COLORS = { '白': '#e0e0e0', '黄': '#f5c542', '紫': '#a855f7', '黑': '#62a8e6', '红': '#ef4444' };

  /* ---------- 魂骨池（按部位分组，每种含来源魂兽、魂骨技） ----------
   * part: 部位名（头骨/躯干骨/左臂骨/右臂骨/左腿骨/右腿骨）
   * beast: 来源魂兽; skill: 魂骨技能; tier: 品质（紫/黑/红） */
  var SOUL_BONE_POOL = {
    '头骨': [
      { beast: '精神凝聚之智慧头骨', skill: '紫极神光·精神冲击', tier: '黑' },
      { beast: '圣幻魔猿', skill: '幻境空间·精神干扰', tier: '黑' },
      { beast: '三眼魔狐', skill: '魅惑凝视·精神控制', tier: '紫' },
      { beast: '碧眼金鹏', skill: '鹰眼锐视·精神探测', tier: '紫' },
      { beast: '天梦冰蚕', skill: '灵魂冲击·精神领域', tier: '红' },
      { beast: '冰碧帝皇蝎', skill: '冰帝之眼·极寒凝视', tier: '黑' },
      { beast: '邪眼暴君', skill: '精神毁灭·灵魂压制', tier: '红' },
      { beast: '紫晶狮王', skill: '紫晶射线·精神穿刺', tier: '紫' }
    ],
    '躯干骨': [
      { beast: '深海魔鲸王', skill: '海纳百川·魂力无尽', tier: '红' },
      { beast: '泰坦巨猿', skill: '不屈意志·躯体强化', tier: '黑' },
      { beast: '铁甲暴龙', skill: '龙鳞护体·物理免疫', tier: '黑' },
      { beast: '玄武龟', skill: '玄武护盾·绝对防御', tier: '紫' },
      { beast: '碧磷蛇皇', skill: '毒鳞甲·反伤毒素', tier: '紫' },
      { beast: '火焰麒麟', skill: '麒麟圣火·火焰护体', tier: '黑' },
      { beast: '千钧蚁皇', skill: '蚁皇铠甲·坚不可摧', tier: '黑' }
    ],
    '左臂骨': [
      { beast: '泰坦巨猿', skill: '泰坦苍穹破·重力泥沼', tier: '红' },
      { beast: '柔骨兔', skill: '瞬移·无敌金身', tier: '红' },
      { beast: '暗金恐爪熊', skill: '恐爪撕裂·暗金之力', tier: '黑' },
      { beast: '九头蝙蝠王', skill: '嗜血撕咬·蝙蝠音波', tier: '黑' },
      { beast: '铁臂螳螂', skill: '螳螂双斩·铁臂之力', tier: '紫' },
      { beast: '烈焰狮王', skill: '狮王之爪·烈焰扑击', tier: '紫' }
    ],
    '右臂骨': [
      { beast: '天青牛蟒', skill: '天青迟钝神爪·天青寂灭雷霆', tier: '红' },
      { beast: '白目魔虎王', skill: '虎啸苍穹·白虎右臂击', tier: '黑' },
      { beast: '碧磷蛇皇', skill: '毒蛇缠绕·毒液侵蚀', tier: '紫' },
      { beast: '火焰领主', skill: '火焰右臂·焚天烈焰', tier: '紫' },
      { beast: '雷霆龙', skill: '雷电右臂·雷霆万钧', tier: '黑' },
      { beast: '冰碧蝎', skill: '冰碧右臂·极寒之力', tier: '黑' }
    ],
    '左腿骨': [
      { beast: '邪魔虎鲸王', skill: '虎鲸邪魔斧·虎鲸碎牙斩', tier: '红' },
      { beast: '急速前行之追风', skill: '飞驰破气斩·极速突进', tier: '黑' },
      { beast: '暴风狂人狼', skill: '嗜血狂化·飓风右腿', tier: '黑' },
      { beast: '鬼藤蛛皇', skill: '蛛丝缠绕·毒素侵蚀', tier: '紫' },
      { beast: '幽冥灵猫', skill: '幽冥闪步·暗影突袭', tier: '紫' },
      { beast: '冰甲鳄', skill: '冰甲护体·鳄尾横扫', tier: '紫' }
    ],
    '右腿骨': [
      { beast: '蓝银皇', skill: '飞行·野火烧不尽春风吹又生', tier: '红' },
      { beast: '泰坦巨猿', skill: '大地之力·重力控制', tier: '黑' },
      { beast: '碧眼金雕', skill: '金雕之翼·高空飞行', tier: '紫' },
      { beast: '岩石巨蜥', skill: '岩石护腿·大地震颤', tier: '紫' },
      { beast: '冰凤凰', skill: '冰凤之翼·寒冰飞行', tier: '黑' },
      { beast: '紫晶翼狮', skill: '紫晶之翼·空中突袭', tier: '黑' }
    ]
  };

  /* ============================================================
   * 随机事件（斗罗主题：猎杀魂兽/魂骨掉落/武魂变异/仙草机缘等）
   * 结构与 events.js 一致：id/name/tier/weight/minAge/maxAge/cond/ok/fail
   * ============================================================ */
  var EVENTS = [
    /* ---------- tier 4 传说 ---------- */
    { id: 'duo_reawaken', weight: 0.15, maxCount: 2, name: '武魂二次觉醒', tier: 4, desc: '沉寂的武魂发生二次觉醒',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= Math.min(50, Math.floor(g.age * 0.75)) + U.irand(0, 10); },
      ok: function (g, U, log) {
        var lf = U.irand(4, 8); g.lifespan += lf;
        var inc = g.innate < 6 ? U.irand(1, 3) : (g.innate <= 8 ? U.irand(1, 2) : (g.innate === 9 ? 1 : 0));
        if (inc) { g.innate = Math.min(10, g.innate + inc); g.aptitude = Math.max(g.aptitude, g.innate); }
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1.5, 2.5));
        return '沉寂多年的武魂在战斗中骤然轰鸣，血脉深处传来远古的回响——二次觉醒！先天魂力提升' + inc + '级，体内魂力如江河决堤般暴涨，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { return '武魂在二次觉醒的边缘剧烈震荡，最终归于沉寂，精神力反噬留下暗伤，需静养数月方能恢复。'; }
    },
    { id: 'duo_twin', weight: 0.08, maxCount: 1, name: '双生武魂觉醒', tier: 4, desc: '隐藏的第二武魂苏醒',
      minAge: 10, maxAge: 60,
      cond: function (g, U) { return g.innate >= 7 && g.lvl >= 30; },
      ok: function (g, U, log) {
        g.dualWuhun = true;
        g.gotTwin = true;
        g.maxRings = 18;
        g.secondWuhunRings = g.secondWuhunRings || 0;
        g.lifespan += U.irand(5, 10);
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(3, 5));
        return '如同唐三觉醒蓝银皇与昊天锤的双生武魂传说，隐藏的第二武魂终于苏醒！两道武魂光辉交相辉映，战力暴增，寿元大幅延长！';
      },
      fail: function (g, U, log) { return '第二武魂在觉醒边缘挣扎，精神力终究不够充沛，未能突破那最后一层桎梏，武魂之力消散于无形。'; }
    },
    { id: 'duo_godring', weight: 0.1, maxCount: 1, name: '神赐魂环', tier: 4, desc: '神力降下金色魂环',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 70; },
      ok: function (g, U, log) {
        var lf = U.irand(8, 15); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(4, 7));
        return '苍穹裂开一道金色神光，神赐魂环自天际降临！金色魂环悬浮于头顶，蕴含的神力如潮水般涌入经脉，魂力暴涨，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { return '金色魂环缓缓升起，神力却如烈焰灼烧经脉——肉身终究无法承受如此浩瀚的神力，魂环化作光点消散于天际，只留下阵阵灼痛。'; }
    },
    { id: 'dl_godtest', weight: 0.015, maxCount: 1, name: '神考邀请', tier: 4, desc: '神界降下神考邀请',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 75 && !g.godTest; },
      ok: function (g, U, log) {
        g.godTest = true;
        /* 随机分配一个传承神位（包含玩家自创的神位） */
        var gods = theme.getGodPool();
        g.inheritGod = gods[U.irand(0, gods.length - 1)];
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * 2);
        var lf = U.irand(10, 20); g.lifespan += lf;
        return '神界的大门向你敞开！' + g.inheritGod + '降下九考召唤，金色神谕悬浮面前——通过九重试炼即可继承神位，寿元+' + lf + '。命运的齿轮开始转动……';
      },
      fail: null
    },
    { id: 'dl_faith', weight: 0.01, maxCount: 1, name: '信仰之力', tier: 4, desc: '收集众生信仰之力',
      minAge: 40, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 85 && !g.faith; },
      ok: function (g, U, log) {
        g.faith = true;
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * 3);
        var lf = U.irand(15, 25); g.lifespan += lf;
        return '亿万信徒的信仰之力汇聚成河，在你体内凝结成璀璨神格！自古以来只有初代神能做到的事——自创神位，百级成神！魂力暴涨，寿元+' + lf + '！';
      },
      fail: null
    },

    /* ---------- tier 3 稀有 ---------- */
    { id: 'duo_bone', weight: 0.2, maxCount: 3, name: '魂骨掉落', tier: 3, desc: '猎杀魂兽爆出魂骨',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1.5, 3));
        return '魂兽倒下的瞬间，一道璀璨光芒从其体内迸射而出——竟是万年魂骨！骨骼碎片化为流光融入你的身体，力量如潮水般涌来，魂力大增！';
      },
      fail: function (g, U, log) { return '魂兽轰然倒地，魂环缓缓升起，却没有魂骨的光芒——这头魂兽的骨骼品质终究不够，仅获得些许魂力感悟。'; }
    },
    { id: 'duo_herb', weight: 0.2, maxCount: 3, name: '仙草机缘', tier: 3, desc: '发现珍稀仙草',
      minAge: 8, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var lf = U.irand(3, 7); g.lifespan += lf;
        g.combat += U.irand(500, 3000);
        return '幽谷深处，一株通体散发柔光的仙草静静生长——正是传说中的珍稀仙品！服下后药力游走全身，经脉中的杂质被逐一清除，寿元+' + lf + '，魂力增长。';
      },
      fail: function (g, U, log) { return '你循着地图上的标记赶到仙草生长之处，却只见一片残根——仙草早已被他人捷足先登，只留下淡淡的药香。'; }
    },
    { id: 'duo_mutation', weight: 0.18, maxCount: 2, name: '武魂良性变异', tier: 3, desc: '武魂发生良性变异',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.innate >= 4 && g.lvl >= 15; },
      ok: function (g, U, log) {
        if (g.innate < 10) { g.innate += 1; g.aptitude = Math.max(g.aptitude, g.innate); }
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1, 2));
        return '修炼中武魂突然发生异变——蓝银草化为金色藤蔓，铁锤燃起赤焰！良性变异使先天魂力突破瓶颈，提升1级！';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '武魂在变异中失控，黑色的腐蚀纹路从手臂蔓延至全身——恶性变异！先天魂力未能提升，经脉受损，寿元受损。';
      }
    },
    { id: 'duo_soulbeast', weight: 0.22, maxCount: 5, name: '万年魂兽来袭', tier: 3, desc: '遭遇万年魂兽',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1.2, 2.5));
        return '万年魂兽从密林深处咆哮而出，大地震颤！你拼尽全力与其搏斗，终于将其斩杀——黑色魂环缓缓落下，蕴含的万年修为涌入体内，魂力大增！';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(3, 8);
        return '万年魂兽的一掌拍碎了你的防御，你被震飞数十丈，五脏六腑移位——拼着重伤勉强逃出一命，寿元大损。';
      }
    },

    /* ---------- tier 2 中级 ---------- */
    { id: 'duo_train', weight: 0.7, maxCount: 10, name: '宗门历练', tier: 2, desc: '在宗门中刻苦修炼',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var gain = U.evCombat(g, 0.03, 0.10, 200);
        return '宗门长老的指导下，你日夜苦修战技与魂力运转——从基础拳法到魂技释放，每一招每一式都在实战中打磨纯熟，魂力+' + gain + '。';
      },
      fail: function (g, U, log) { return '修炼数日后，你陷入了瓶颈——无论怎样尝试，魂力都像撞上了一堵无形的墙，进展缓慢。长老摇头道：时机未到，切勿急躁。'; }
    },
    { id: 'duo_mediate', weight: 0.7, maxCount: 10, name: '冥想修炼', tier: 2, desc: '静坐冥想吸收天地魂力',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var gain = U.evCombat(g, 0.02, 0.08, 150);
        return '盘膝而坐，意识沉入丹田——你感受到天地间的魂力如涓涓细流汇入体内，经脉中每一个魂力节点都在缓缓壮大，魂力稳步增长+' + gain + '。';
      },
      fail: null
    },
    { id: 'duo_huntring', weight: 0.6, maxCount: 8, name: '猎杀魂兽', tier: 2, desc: '前往星斗大森林猎杀魂兽',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 10; },
      ok: function (g, U, log) {
        var gain = U.evCombat(g, 0.04, 0.12, 300);
        return '星斗大森林的瘴气中，你锁定了一头千年魂兽——经过数个时辰的缠斗，你找到破绽将其斩杀！魂环化为光环套在你身上，魂力+' + gain + '。';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 4);
        return '你低估了魂兽的实力——它在濒死前爆发的魂力冲击波将你掀翻在地，你拖着伤重的身体狼狈逃出森林，寿元受损。';
      }
    },
    { id: 'duo_dan', weight: 0.5, maxCount: 5, name: '丹药辅助', tier: 2, desc: '服用修炼丹药',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var lf = U.irand(1, 4); g.lifespan += lf;
        g.combat += U.irand(200, 1500);
        return '丹药入口即化，温热的药力沿着经脉扩散至四肢百骸——杂质被排出体外，经脉更加通透，寿元+' + lf + '，魂力增长。';
      },
      fail: function (g, U, log) { return '丹药的药力远超你的身体所能承受，经脉中传来阵阵灼痛——你不得不运功压制药力，数日后才勉强恢复，略有不适。'; }
    },
    { id: 'duo_seagod', weight: 0.5, maxCount: 2, name: '海神岛历练', tier: 2, desc: '在海神岛接受海神九考',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 50; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        var lf = U.irand(3, 8); g.lifespan += lf;
        return '海神岛的潮汐中蕴含着上古神力，你以肉身对抗巨浪、穿越珊瑚迷阵——海神的考验如约通过，你感受到海神之力的认可，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(2, 5);
        return '海神岛的第七重潮汐如同一堵百丈高墙迎面拍下，你的魂力防御瞬间崩碎——被巨浪拍飞至礁石之上，海神之力的反噬令你经脉俱损，寿元受损。';
      }
    },
    { id: 'duo_slaughter', weight: 0.4, maxCount: 2, name: '杀戮之都', tier: 2, desc: '在杀戮之都中磨练杀气',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.0, 2.5));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        return '杀戮之都的角斗场中尸骨累累，你与对手以命相搏——在生死之间磨练出的杀气如同实质的利刃，魂力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '杀戮之都的地下城暗藏杀机，你被三名魂斗罗级杀手围攻——拼死杀出一条血路，却已身中剧毒，险些陨落，寿元受损。';
      }
    },
    { id: 'duo_icefire', weight: 0.3, maxCount: 1, name: '冰火两仪眼', tier: 2, desc: '在冰火两仪眼修炼',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2, 4));
        g.combat += add;
        var lf = U.irand(5, 10); g.lifespan += lf;
        return '冰火两仪眼中，你同时引导冰火之力淬炼肉身——极寒与极热在体内交融碰撞，如同在阴阳之间行走，每一步都在重塑你的经脉与骨骼，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: null
    },

    /* ---------- tier 1 普通 ---------- */
    { id: 'duo_shrek', weight: 1.0, maxCount: 3, name: '史莱克学院', tier: 1, desc: '在史莱克学院学习魂力修炼',
      minAge: 6, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.8));
        g.combat += add;
        var lf = U.irand(1, 3); g.lifespan += lf;
        return '史莱克学院的校训「不敢惹事是庸才」刻在石碑上——在大师的指导下你的修炼突飞猛进，魂力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    { id: 'duo_arena', weight: 0.9, maxCount: 5, name: '大斗兽场', tier: 1, desc: '在大斗兽场中磨练魂技',
      minAge: 10, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 1.0));
        g.combat += add;
        return '大斗兽场的铁笼中回荡着嘶吼——你在实战中将魂技运用得越来越娴熟，出手速度与精准度都有了质的提升，魂力+' + add + '。';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '大斗兽场的对手比预想中强得多——你的魂技被看穿，一记重击将你打趴在地，你被迫认输，带着满身伤痕黯然离场，寿元受损。';
      }
    },
    { id: 'duo_xingdou', weight: 0.8, maxCount: 5, name: '星斗大森林', tier: 1, desc: '在星斗大森林中猎杀魂兽',
      minAge: 10, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.5, 1.2));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        return '星斗大森林的古木参天，你追踪一头千年的鬼藤蛛——在林间展开追逐后将其猎杀，魂环浮现，魂力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    { id: 'duo_sunset', weight: 0.7, maxCount: 3, name: '落日森林', tier: 1, desc: '在落日森林中寻找仙草',
      minAge: 8, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add;
        var lf = U.irand(1, 3); g.lifespan += lf;
        return '落日森林的晚霞映红了整片林海——你在一处幽谷中发现了一株珍稀草药，采摘后药力入体，魂力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    { id: 'duo_tournament', weight: 0.5, maxCount: 2, name: '高级魂师大赛', tier: 1, desc: '参加高级魂师大赛',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.6));
        g.combat += add;
        return '高级魂师大赛的赛场座无虚席——你与队友配合默契，在决赛中以一套华丽的连招锁定了胜局，夺冠之后对武魂的理解更深一层，魂力+' + add + '。';
      },
      fail: null
    },

    /* ---------- tier 4 传说 (新增) ---------- */
    { id: 'duo_tangmen', weight: 0.12, maxCount: 1, name: '唐门暗器传承', tier: 4, desc: '唐门遗迹中获暗器真传',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 50; },
      ok: function (g, U, log) {
        var lf = U.irand(10, 20); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(3, 6));
        g.combat += add;
        return '唐门遗迹深处的暗器秘典缓缓展开，佛怒唐莲的制作图谱映入眼帘——这件足以毁天灭地的终极暗器终于重见天日！暗器百解尽收心中，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(3, 6); return '唐门上古机关轰然启动，无数淬毒暗器从四面射来！你拼死突围，终究被数枚暗器击中——唐门机关反噬，险些陨落。'; }
    },
    { id: 'duo_seagod9', weight: 0.1, maxCount: 1, name: '海神九考', tier: 4, desc: '海神岛九考之试炼',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 75 && !g.godTest; },
      ok: function (g, U, log) {
        g.godTest = true; g.inheritGod = '海神';
        var lf = U.irand(15, 25); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(4, 7));
        g.combat += add;
        return '九重试炼，九死一生！你终于站在海神殿的最高处，海神三叉戟破水而出，金色光芒笼罩全身——海神九考全数通过！三叉戟化为魂环融入体内，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(5, 10); return '第七考的巨浪将你拍入海底，海神之光无情地灼烧灵魂——神力反噬如万千刀刃切割经脉，你呕出一口鲜血被冲上沙滩，寿元大损。'; }
    },
    { id: 'duo_xiuluo', weight: 0.08, maxCount: 1, name: '修罗神传承', tier: 4, desc: '修罗神力降临',
      minAge: 40, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 80 && !g.godTest; },
      ok: function (g, U, log) {
        g.godTest = true; g.inheritGod = '修罗神';
        var lf = U.irand(20, 30); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(5, 8));
        g.combat += add;
        return '血红色的修罗神力自九天倾泻而下，杀戮之心在胸腔中猛然跳动——你感受到无穷无尽的杀伐之意！修罗神传承降临，万剑臣服，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(8, 15); return '修罗神力如岩浆灌顶，你的皮肤龟裂出血，骨骼在神力的碾压下发出碎裂之声——肉身终究承受不住这极致的杀伐之气，寿元大损。'; }
    },
    { id: 'duo_tianshi', weight: 0.08, maxCount: 1, name: '天使神传承', tier: 4, desc: '六翼天使降临',
      minAge: 35, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 75 && !g.godTest; },
      ok: function (g, U, log) {
        g.godTest = true; g.inheritGod = '天使之神';
        var lf = U.irand(15, 25); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(4, 7));
        g.combat += add;
        return '六翼展开，圣光普照天地！天使之神降下神谁，纯洁的光明之力浸润着你的灵魂——六翼在背后缩放又展开，如同神的叔叔！天使传承领受，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(5, 12); return '天使之力如同火焰舞舞，纯洁的光明之力对你的肉身造成巨大的烧伤——六翼裂开，金色的血液风喷四散，寿元大损。'; }
    },
    { id: 'duo_jiutou', weight: 0.08, maxCount: 1, name: '罗刹神传承', tier: 4, desc: '罗刹神力降临',
      minAge: 40, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 78 && !g.godTest; },
      ok: function (g, U, log) {
        g.godTest = true; g.inheritGod = '罗刹神';
        var lf = U.irand(15, 25); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(4, 7));
        g.combat += add;
        return '网罗天罗地，全能之神降世！罗刹神力蔓延不绝，你的身体在神力浸润下形开口共鸣，全能之力在体内爆发——罗刹神传承，全能开启！魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(5, 12); return '罗刹神力如同万刃刀刃刨过身体，你的经脉在神力的碾压下红肉横飞——全能力量反噬，寿元大损。'; }
    },
    { id: 'duo_shishen', weight: 0.08, maxCount: 1, name: '食神传承', tier: 4, desc: '食神降临',
      minAge: 35, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 73 && !g.godTest; },
      ok: function (g, U, log) {
        g.godTest = true; g.inheritGod = '食神';
        var lf = U.irand(15, 25); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(4, 7));
        g.combat += add;
        return '美味归乎一点，却能造化万物！食神降临，无数美食在空中凝聚，香气四溢——你品尝到了世间枀致美味，身体在美味中获得无穷力量！食神传承，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(5, 10); return '美食的力量太过强大，你的身体无法承受——美味在体内爆炸，经脉逆流，寿元大损。'; }
    },

    /* ---------- tier 3 稀有 (新增) ---------- */
    { id: 'duo_titan', weight: 0.18, maxCount: 2, name: '泰坦巨猿遭遇', tier: 3, desc: '星斗大森林遇泰坦巨猿',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 35; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        return '大地在颤抖，泰坦巨猿从天斗大森林深处现身——十丈高的身躯如同一座移动的山岳！你以巧破力，击退巨猿的同时获得其掉落的万年魂骨，魂力+' + add + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(3, 7); return '泰坦巨猿的重拳如同陨石坠落，大地被砸出数丈深坑——你的防御在它面前形同虚设，仓皇逃出后已是满身疮痍，寿元受损。'; }
    },
    { id: 'duo_youxiang', weight: 0.16, maxCount: 2, name: '幽香绮罗仙品', tier: 3, desc: '落日森林遇幽香绮罗仙品',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var lf = U.irand(8, 15); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1, 2));
        g.combat += add;
        if (g.innate < 10) { g.innate += 1; g.aptitude = Math.max(g.aptitude, g.innate); }
        return '一株散发着紫色幽香的仙草在月光下摇曳——幽香绮罗仙品！它能解百毒、洗髓伐骨，服下后先天魂力突破瓶颈+1，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: null
    },
    { id: 'duo_binghuo_herb', weight: 0.15, maxCount: 1, name: '冰火两仪眼·仙草', tier: 3, desc: '冰火两仪眼采集仙草',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40; },
      ok: function (g, U, log) {
        var lf = U.irand(10, 18); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2, 3.5));
        g.combat += add;
        return '在冰火两仪眼的极热与极寒交汇之处，一株吸收了天地精华的仙草傲然绽放——左半金红、右半冰蓝！服下后仙药之力淬炼肉身，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(2, 5); return '仙草的冰火两股药力在体内剧烈冲突，左半身结冰、右半身燃烧！你咬牙压制了半个时辰才勉强稳住，但经脉已受重创，寿元受损。'; }
    },
    { id: 'duo_iceemperor', weight: 0.14, maxCount: 1, name: '极北之地·冰帝', tier: 3, desc: '极北之地遇冰帝',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 45; },
      ok: function (g, U, log) {
        var lf = U.irand(10, 20); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2, 4));
        g.combat += add;
        return '极北之地的万年冰原上，冰碧帝皇蝎的庞大身影浮现——冰帝！它审视你片刻后释放出极寒之力，那足以冻裂空间的冰冷淬炼了你的每一寸经脉，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(4, 8); return '极北之地的寒潮如利刃般刺入骨髓，你来不及闪避便被冻在了冰原之上——冰霜侵蚀肉身，险些冻毙，被路人救出时四肢已失去知觉，寿元受损。'; }
    },
    { id: 'duo_zilan', weight: 0.15, maxCount: 1, name: '海神岛·紫兰花', tier: 3, desc: '海神岛采紫兰花',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40; },
      ok: function (g, U, log) {
        var lf = U.irand(8, 14); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        return '海神岛的紫兰花只在月圆之夜绽放，花瓣上流转着海神的祝福——你趁夜色潜入采摘成功，海神之力加持全身，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: null
    },
    { id: 'duo_shashen', weight: 0.13, maxCount: 1, name: '杀神领域', tier: 3, desc: '杀戮之都觉醒杀神领域',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 50; },
      ok: function (g, U, log) {
        var lf = U.irand(5, 12); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2.5, 4));
        g.combat += add;
        return '杀戮之都的血色天空下，你踏过一千具尸体走到了尽头——杀神领域觉醒！血红色的杀气在周身凝结成实质，所有敌人在这领域中战力骤降，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(4, 8); return '杀气如同脱缰的猛兽反噬其主，你的眼前浮现出无数死在你手下的亡魂——心魔入侵，杀气失控，你被迫退出杀戮之都，寿元受损。'; }
    },
    { id: 'duo_tiandou_coup', weight: 0.12, maxCount: 1, name: '天斗宫变', tier: 3, desc: '天斗帝国宫变事件',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40; },
      ok: function (g, U, log) {
        var lf = U.irand(5, 10); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2, 3.5));
        g.combat += add;
        return '天斗皇宫内火光冲天，叛军与禁卫军混战之际，你挺身而出力挽狂澜——宫变平定后，皇帝亲自赏赐，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(3, 7); return '天斗宫变中你被叛军裹挟，虽未参与叛乱，但嫌疑难洗——在天牢中被关押数月才获释放，身心俱疲，寿元受损。'; }
    },

    /* ---------- tier 2 中级 (新增) ---------- */
    { id: 'duo_shrek7', weight: 0.5, maxCount: 2, name: '史莱克七怪集训', tier: 2, desc: '与史莱克七怪共同集训',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1, 2));
        g.combat += add;
        var lf = U.irand(2, 5); g.lifespan += lf;
        return '史莱克七怪齐聚训练场——戴沐白的白虎烈光波、朱竹清的幽冥斩、奥斯卡的食神之力……在与伙伴们的切磋中，你的武魂与魂技不断精进，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: null
    },
    { id: 'duo_suotuo', weight: 0.45, maxCount: 3, name: '索托城大斗兽场', tier: 2, desc: '索托城大斗兽场挑战',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 15; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.8, 1.8));
        g.combat += add;
        return '索托城大斗兽场的欢呼声震耳欲聋——你在擂台上以华丽的魂技连续击败三名对手，连胜的荣耀令全场沸腾，魂力+' + add + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(1, 3); return '大斗兽场的对手竟是一名魂王级别的老将——你的魂技被轻易化解，一记重击将你轰出擂台，观众的欢呼变成了嘘声，你重伤离场，寿元受损。'; }
    },
    { id: 'duo_yuexuan', weight: 0.5, maxCount: 5, name: '月轩冥想', tier: 2, desc: '月轩中静心冥想',
      minAge: 10, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var gain = U.evCombat(g, 0.03, 0.09, 180);
        return '月轩的丝竹声中，你缓缓进入冥想——这里的环境能让人心如止水，魂力在寂静中缓慢而坚定地增长，魂力+' + gain + '。';
      },
      fail: null
    },
    { id: 'duo_tiandou_academy', weight: 0.5, maxCount: 3, name: '天斗皇家学院', tier: 2, desc: '天斗皇家学院进修',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 15; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.8, 1.5));
        g.combat += add;
        return '天斗皇家学院的演武场上，你跟随帝国最顶尖的魂师学习——名师的指点让你对魂力的运用有了全新的理解，魂力+' + add + '。';
      },
      fail: null
    },
    { id: 'duo_wuhun_big', weight: 0.4, maxCount: 2, name: '武魂殿大比', tier: 2, desc: '武魂殿举办的全大陆魂师大比',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 25; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.2, 2.2));
        g.combat += add;
        var lf = U.irand(1, 4); g.lifespan += lf;
        return '武魂殿大比的决赛场上，比比东亲自主持——你以压倒性的实力碾压对手，武魂殿大比夺魁，名震大陆！魂力+' + add + '，寿元+' + lf + '。';
      },
      fail: function (g, U, log) { return '武魂殿大比上，你被对手的领域技完全压制——苦战三回合后败下阵来，台下武魂殿弟子的嘲笑声令你刻骨铭心，铩羽而归。'; }
    },
    { id: 'duo_longgu', weight: 0.35, maxCount: 2, name: '龙谷探险', tier: 2, desc: '深入龙谷探险',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 2.5));
        g.combat += add;
        var lf = U.irand(2, 6); g.lifespan += lf;
        return '龙谷中弥漫着远古龙族的气息，你在崖壁间找到了一株浸透龙血的灵草——龙血草入体，全身血脉沸腾翻涌，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(2, 5); return '龙谷深处一头沉睡的龙族后裔被你惊醒，它的怒吼震碎了半个山谷——你被气浪掀飞撞上岩壁，重伤逃出，寿元受损。'; }
    },
    { id: 'duo_deepforest', weight: 0.45, maxCount: 4, name: '魂兽森林深处', tier: 2, desc: '深入魂兽森林核心区',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 25; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1, 2));
        g.combat += add;
        return '穿过层层瘴气与荆棘，你深入星斗大森林的核心区域——与一头千年凤尾鸡冠蛇缠斗半个时辰，终于将其猎杀，魂力+' + add + '！';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(2, 5); return '森林深处的黑暗中，一双血红的巨眼锁定了你——那是一头万年魂兽！你甚至来不及看清它的模样便已负伤，拼死逃出，寿元受损。'; }
    },
    { id: 'duo_canalcaravan', weight: 0.5, maxCount: 5, name: '运河商队', tier: 2, desc: '随运河商队历练',
      minAge: 12, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.5, 1.2));
        g.combat += add;
        var lf = U.irand(1, 3); g.lifespan += lf;
        return '跟随运河商队南下，一路上你见识了各地魂师的修炼方法与战斗技巧——在与商队护卫的交流中获益匪浅，见闻长进，魂力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    { id: 'duo_efang', weight: 0.3, maxCount: 1, name: '阿房宫密室', tier: 2, desc: '阿房宫密室中发现古修遗迹',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        var lf = U.irand(3, 7); g.lifespan += lf;
        return '阿房宫废墟之下的密室尘封千年，你在石壁上发现了上古魂师的修炼心得——字字珠玑，句句点破修炼瓶颈，魂力+' + add + '，寿元+' + lf + '！';
      },
      fail: null
    },
    { id: 'duo_tangmen_jue', weight: 0.35, maxCount: 2, name: '唐门绝学', tier: 2, desc: '研习唐门绝学',
      minAge: 15, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 20; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1, 2));
        g.combat += add;
        return '唐门秘典中的玄天功心法晦涩难懂，你参悟七七四十九天终于入门——内力运转路线与魂力完美融合，魂力+' + add + '！';
      },
      fail: null
    },

    /* ---------- tier 1 普通 (新增) ---------- */
    { id: 'duo_nuoding', weight: 1.0, maxCount: 3, name: '诺丁学院', tier: 1, desc: '在诺丁学院启蒙',
      minAge: 6, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.7));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        return '诺丁学院虽然简陋，却是你踏入魂师世界的第一步——在老师的教导下，你学会了最基础的魂力运转方式，魂力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    { id: 'duo_shenghun', weight: 0.9, maxCount: 3, name: '圣魂村', tier: 1, desc: '圣魂村中生活修炼',
      minAge: 6, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.2, 0.5));
        g.combat += add;
        return '圣魂村的老槐树下，你每日吐纳修炼——虽然这里没有名师指点，但山野之间的天地魂力纯净平和，修炼反而别有心得，魂力+' + add + '。';
      },
      fail: null
    },
    { id: 'duo_forge', weight: 0.85, maxCount: 5, name: '手工锻造', tier: 1, desc: '手工锻造锤炼武魂',
      minAge: 8, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.6));
        g.combat += add;
        return '炉火映红了你的面庞，铁锤在手中翻飞——每一锤都蕴含着对武魂的感悟，锻造不仅是锤炼金属，更是锤炼意志，魂力+' + add + '。';
      },
      fail: null
    },
    { id: 'duo_hunterguild', weight: 0.8, maxCount: 1, name: '魂师公会注册', tier: 1, desc: '注册成为正式魂师',
      minAge: 6, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 10; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.5, 1));
        g.combat += add;
        return '魂师公会的大厅中，你在登记册上写下自己的名字——一枚闪亮的魂师徽章挂在胸前，从此你便是官方认证的正式魂师了，魂力+' + add + '。';
      },
      fail: null
    },
    { id: 'duo_ringabsorb', weight: 0.85, maxCount: 5, name: '魂环吸收', tier: 1, desc: '吸收猎得魂兽的魂环',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 10; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 0.9));
        g.combat += add;
        return '你盘膝而坐，引导魂环之力缓缓融入经脉——古老的魂兽之力与你的武魂产生共鸣，新魂技觉醒，魂力+' + add + '。';
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(1, 2); return '魂环的力量过于霸道，你试图强行吸收却引发了反噬——魂力逆冲经脉，你呕出一口鲜血，被迫中断吸收，寿元受损。'; }
    },
    { id: 'duo_wuhunworship', weight: 0.7, maxCount: 3, name: '武魂殿礼拜', tier: 1, desc: '在武魂殿礼拜祈祷',
      minAge: 6, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.2, 0.5));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        return '武魂殿的金色穹顶下，你闭目祈祷——供奉的武魂神像似乎回应了你的虔诚，一缕温暖的神恩洒落，魂力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    },
    { id: 'duo_tiandoutour', weight: 0.8, maxCount: 3, name: '天斗城巡游', tier: 1, desc: '天斗城中巡游历练',
      minAge: 10, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.6));
        g.combat += add;
        return '天斗城的街巷间人来人往，你混迹于街头武者的切磋场中——观摩各路魂师的招式后若有所悟，见闻增长，魂力+' + add + '。';
      },
      fail: null
    },
    { id: 'duo_outerforest', weight: 0.9, maxCount: 5, name: '魂兽森林外围', tier: 1, desc: '在魂兽森林外围狩猎',
      minAge: 10, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 0.8));
        g.combat += add;
        return '魂兽森林外围，一头十年期的风铃鹿正在觅食——你用一个简单的魂技将其拿下，简单但扎实的猎杀让你的战斗经验更上一层，魂力+' + add + '。';
      },
      fail: null
    },
    { id: 'duo_xingluomatch', weight: 0.75, maxCount: 2, name: '星罗城比武', tier: 1, desc: '星罗城参加比武大会',
      minAge: 12, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 15; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.4, 0.9));
        g.combat += add;
        return '星罗城的比武台上人声鼎沸——你在擂台上以凌厉的攻势一路过关斩将，最终以一记决定性魂技锁定胜局，魂力+' + add + '！';
      },
      fail: function (g, U, log) { return '星罗城的比武对手出人意料地强大——你的魂技被轻描淡写地化解，三招之内便被击落擂台，在众人的议论声中黯然离去。'; }
    },
    { id: 'duo_sunsetouter', weight: 0.85, maxCount: 4, name: '落日森林外围', tier: 1, desc: '落日森林外围采药',
      minAge: 8, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.6));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        return '落日森林外围的一处溪流边，你发现了一株品相普通的灵草——虽非顶级仙品，但聊胜于无，服下后魂力+' + add + '，寿元+' + lf + '。';
      },
      fail: null
    }
  ];

  /* ============================================================
   * 术语映射 terms（所有 sim.js / game.js 文案通过 terms 动态获取）
   * ============================================================ */
  var terms = {
    simulatorName: '斗罗大陆模拟器',
    ability: '武魂',
    abilityTalent: '先天魂力',
    combat: '魂力',
    level: '魂力等级',
    lifespan: '寿元',
    skill: '魂技',
    skillTier: '魂环',
    essence: '魂骨',
    essenceShort: '魂骨',
    ascend: '神祇',
    ascendVerb: '成神',
    cultivateVerb: '修炼',
    breakVerb: '突破',
    ageUnit: '岁',
    innateTiers: TIER_NAME,
    peakLv: 99,
    godLevel: 100,

    year: function (age) { return '第' + age + '岁，修炼'; },
    breakSuccess: function (age) { return '第' + age + '岁，修炼，成功突破！'; },
    combo: function (age) { return '第' + age + '岁，修炼，连破！'; },
    yearCombat: function (age, gain) { return '第' + age + '岁，修炼，魂力+' + gain; },
    death: function (age) { return '第' + age + '岁，寿元耗尽，与世长辞'; },
    deathEvent: function (age) { return '第' + age + '岁，寿元将尽时遭遇变故，不幸陨落'; },
    mutation: function (age) { return '第' + age + '岁，武魂变异！先天魂力跃升至极阶 EX，寿元+50'; },
    origin: function (age) { return '第' + age + '岁，获得神赐魂环，直接成神！'; },
    getEssence: function (age, name, gain) { return '第' + age + '岁，获得魂骨『' + name + '』，魂力+' + gain; },
    awakenSkill: function (peak, tierName, add) { return '修为达到' + peak + '级，觉醒' + tierName + '色魂环魂技，魂力+' + add; },
    levelUp: function (from, to, cg, lg) { return '等级' + from + '→' + to + '级，魂力+' + cg + (lg ? '，寿元+' + lg : '') + '！'; },
    peakLevelUp: function () { return '等级抵达巅峰后，有所领悟，魂力+10000！'; },
    refineSuccess: function (age, name) { return '第' + age + '岁，寿元将尽，成功领悟神力，蜕变为神祇，神位：' + (name || '神祇') + '！'; },
    refineFail: function (age, boost) { return '第' + age + '岁，魂骨融合失败，但武魂有所提升，魂力+' + boost; },
    forcedAscend: function (age, name) { return '第' + age + '岁，寿元将尽，强行突破，蜕变为神祇，神位：' + (name || '神祇') + '！'; },
    forcedFail: function (age) { return '第' + age + '岁，强行成神失败，魂飞魄散'; },

    settleGodTitle: '✨ 神祇降临 ✨',
    settleDeadTitle: '💀 寿终正寝',
    settleFailTitle: '⚡ 成神失败 · 魂飞魄散',
    settlePauseTitle: '⏸ 提前结算',
    settleGodDesc: '✨ 成功突破神级，蜕变为神祇 ✨',
    settleAgeLabelAscend: '成神用时',
    settleAgeLabelDead: '存活年数',
    refineFailHint: function (ascended) {
      return ascended ? ' —— 魂骨融合失败，改由强行成神' : ' —— 魂骨融合失败（魂力不足），转入强行成神，惜败';
    },

    homeSub: '——武魂觉醒，看看你能成为封号斗罗乃至神祇的那个天骄吗？——',
    aboutText: '斗罗大陆，六岁武魂觉醒，<b>随机抽取</b>武魂和先天魂力，开始修炼之路，还可能遇到各种机缘与变异，天才也可能早夭，先天魂力 F 级，亦有逆天翻盘的机会~<br>你唯一的目标，就是成神——修炼至巅峰（99 级）即可尝试强行成神，更有机会获得 <b>魂骨</b>，融合魂骨即可晋升神祇，大幅提升成神概率！<br>每局结束时，将获得经验，提升玩家等级，玩家等级越高，觉醒强大武魂几率越大，快来试试看——你，会不会是那个 <b>神祇</b> 的天骄？',

    exportTitle: '斗罗大陆模拟器',
    exportFooter: '斗罗大陆模拟器 —— 看看你能成为神祇的那个天骄吗？',
    exportCardTitle: '斗罗大陆 · 高光时刻',
    reviewTitle: '斗罗大陆模拟器',
    guardMaskTitle: '🎲 保底 · 20级 先天魂力',
    guardTalentRow: '先天魂力：2级+5 / 4级+4 / 6级+3 / 8级+2 / 10级及以上+1',
    guardLevelRow: '等级（按等级）：81级+3 / 91级+5 / 95级+8 / 99级+10 / 神祇+30',
    guardHint: '积分满 100 后，下一次开始游戏必定觉醒<b>20级(满) 先天魂力</b>，随后积分清零重新累计。'
  };

  var TALENTS = [
    /* green */
    { id:'dl_t1', name:'魂力温养', rarity:'green', desc:'初始魂力+50', apply:function(g){ g.combat += 50; } },
    { id:'dl_t2', name:'强健体魄', rarity:'green', desc:'寿元+5', apply:function(g){ g.lifespan += 5; } },
    { id:'dl_t3', name:'武魂亲和', rarity:'green', desc:'魂力+10%', apply:function(g){ g.combat = Math.floor(g.combat * 1.1); } },
    { id:'dl_t4', name:'修炼勤奋', rarity:'green', desc:'寿元+3，魂力+20', apply:function(g){ g.lifespan += 3; g.combat += 20; } },
    { id:'dl_t5', name:'先天滋养', rarity:'green', desc:'初始等级+1', apply:function(g){ g.lvl += 1; } },
    /* blue */
    { id:'dl_t6', name:'魂力精通', rarity:'blue', desc:'魂力+20%', apply:function(g){ g.combat = Math.floor(g.combat * 1.2); } },
    { id:'dl_t7', name:'长生不老', rarity:'blue', desc:'寿元+15', apply:function(g){ g.lifespan += 15; } },
    { id:'dl_t8', name:'先天魂力觉醒', rarity:'blue', desc:'初始等级+2', apply:function(g){ g.lvl += 2; } },
    { id:'dl_t9', name:'魂师天赋', rarity:'blue', desc:'魂力+200', apply:function(g){ g.combat += 200; } },
    { id:'dl_t10', name:'仙草滋养', rarity:'blue', desc:'寿元+10，魂力+50', apply:function(g){ g.lifespan += 10; g.combat += 50; } },
    /* purple */
    { id:'dl_t11', name:'先天满魂力', rarity:'purple', desc:'天赋+1', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); } },
    { id:'dl_t12', name:'魂力暴增', rarity:'purple', desc:'魂力+40%', apply:function(g){ g.combat = Math.floor(g.combat * 1.4); } },
    { id:'dl_t13', name:'万年魂环', rarity:'purple', desc:'寿元+25', apply:function(g){ g.lifespan += 25; } },
    /* gold */
    { id:'dl_t14', name:'海神传承', rarity:'gold', desc:'天赋+2，成神概率+8%，开局获海神九考资格', apply:function(g){ g.innate = Math.min(10, g.innate + 2); g.aptitude = Math.max(g.aptitude, g.innate); g.ascendBonus = (g.ascendBonus || 0) + 0.08; g.godTest = true; g.inheritGod = '海神'; } },
    { id:'dl_t15', name:'神祇眷顾', rarity:'gold', desc:'天赋+1，成神概率+10%，开局获信仰之力', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.ascendBonus = (g.ascendBonus || 0) + 0.10; g.faith = true; } },

    /* ---------- 新增词条 dl_t16..dl_t25（含多属性组合） ---------- */
    /* green (4) */
    { id:'dl_t16', name:'武魂温养2', rarity:'green', desc:'魂力+30，寿元+3', apply:function(g){ g.combat += 30; g.lifespan += 3; } },
    { id:'dl_t17', name:'魂师勤奋', rarity:'green', desc:'等级+1，魂力+30', apply:function(g){ g.lvl += 1; g.combat += 30; } },
    { id:'dl_t18', name:'魂力护体', rarity:'green', desc:'寿元+8，魂力+30', apply:function(g){ g.lifespan += 8; g.combat += 30; } },
    { id:'dl_t19', name:'先天滋养2', rarity:'green', desc:'等级+1，寿元+4', apply:function(g){ g.lvl += 1; g.lifespan += 4; } },
    /* blue (4) */
    { id:'dl_t20', name:'武魂共鸣', rarity:'blue', desc:'魂力+15%，寿元+8', apply:function(g){ g.combat = Math.floor(g.combat * 1.15); g.lifespan += 8; } },
    { id:'dl_t21', name:'魂力爆发', rarity:'blue', desc:'魂力+25%，等级+1', apply:function(g){ g.combat = Math.floor(g.combat * 1.25); g.lvl += 1; } },
    { id:'dl_t22', name:'魂环加护', rarity:'blue', desc:'魂力+100，寿元+10', apply:function(g){ g.combat += 100; g.lifespan += 10; } },
    { id:'dl_t23', name:'仙草淬体', rarity:'blue', desc:'寿元+12，魂力+80', apply:function(g){ g.lifespan += 12; g.combat += 80; } },
    /* purple (1) */
    { id:'dl_t24', name:'神考资格', rarity:'purple', desc:'魂力+20%，开局获得神考邀请(随机)', apply:function(g){ g.combat = Math.floor(g.combat * 1.2); g.godTest = true; var gods = theme.getGodPool(); g.inheritGod = gods[Math.floor(Math.random() * gods.length)]; } },
    /* gold (1) */
    { id:'dl_t25', name:'修罗神血脉', rarity:'gold', desc:'天赋+2，魂力+40%，寿元+15，开局获得修罗神神考', apply:function(g){ g.innate = Math.min(10, g.innate + 2); g.aptitude = Math.max(g.aptitude, g.innate); g.combat = Math.floor(g.combat * 1.4); g.lifespan += 15; g.godTest = true; g.inheritGod = '修罗神'; } },
    { id:'dl_t26', name:'天赐神力', rarity:'gold', desc:'幸运加持，魂环品质提升，成神+6%', apply:function(g){ g.ascendBonus = (g.ascendBonus || 0) + 0.06; g.luckBonus = (g.luckBonus || 0) + 1; g.combat = Math.floor(g.combat * 1.3); } },
    { id:'dl_t27', name:'命运之轮', rarity:'gold', desc:'每次突破概率+10%，成神+5%', apply:function(g){ g.ascendBonus = (g.ascendBonus || 0) + 0.05; g.breakBonus = (g.breakBonus || 0) + 0.10; g.lifespan += 15; } },
    { id:'dl_t28', name:'武魂真身', rarity:'gold', desc:'开局武魂进化真身，魂力+50%，成神+7%', apply:function(g){ g.combat = Math.floor(g.combat * 1.5); g.ascendBonus = (g.ascendBonus || 0) + 0.07; g.lifespan += 10; } },
    { id:'dl_t29', name:'双生武魂', rarity:'gold', desc:'天赋双生武魂，第一武魂先修九环，第二武魂后期逐环吸收，天赋+1，成神+8%', apply:function(g){ g.dualWuhun = true; g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.ascendBonus = (g.ascendBonus || 0) + 0.08; g.maxRings = 18; g.secondWuhunRings = 0; } },
  ];

  /* 根据武魂和生平生成自创神位名 */
  function generateGodName(g) {
    var ability = g.ability || "";
    var rings = g.soulRings || [];
    var bones = g.soulBones || [];
    var redRings = 0, totalRings = rings.length;
    for (var i = 0; i < rings.length; i++) { if (rings[i].tier === "红") redRings++; }
    var boneCount = bones.length;
    var dualWuhun = g.dualWuhun || false;
    var talent = g.innate || 1;
    /* ====== 根据武魂+生平综合生成神位名 ====== */
    /* 蓝银草/植物系 */
    if (ability.indexOf("蓝银") >= 0 || ability.indexOf("植物") >= 0 || ability.indexOf("藤") >= 0) {
      if (redRings >= 4) return "蓝银真神";
      if (redRings >= 2) return "永恒之森";
      if (boneCount >= 3) return "草木之神";
      return "生命女神";
    }
    /* 昊天锤/锤系 */
    if (ability.indexOf("昊天锤") >= 0 || ability.indexOf("锤") >= 0) {
      if (redRings >= 4) return "碎星之神";
      if (boneCount >= 4) return "天锤战神";
      if (redRings >= 2) return "力之神";
      return "弗力古神";
    }
    /* 冰系 */
    if (ability.indexOf("冰") >= 0 || ability.indexOf("雪") >= 0 || ability.indexOf("霜") >= 0) {
      if (redRings >= 4) return "极寒天神";
      if (redRings >= 2) return "永冻之主";
      return "冰霜女神";
    }
    /* 火系/凤凰 */
    if (ability.indexOf("火") >= 0 || ability.indexOf("凤凰") >= 0 || ability.indexOf("焰") >= 0) {
      if (redRings >= 4) return "涅槃天凤";
      if (redRings >= 2) return "焚天之神";
      return "火焰之神";
    }
    /* 龙系 */
    if (ability.indexOf("龙") >= 0) {
      if (redRings >= 4) return "万龙之主";
      if (redRings >= 2) return "龙神";
      return "龙之神";
    }
    /* 猫/虎/豹 */
    if (ability.indexOf("猫") >= 0 || ability.indexOf("虎") >= 0 || ability.indexOf("豹") >= 0) {
      if (redRings >= 3) return "灹兽天神";
      return "兽神";
    }
    /* 蝶/花 */
    if (ability.indexOf("蝶") >= 0 || ability.indexOf("花") >= 0) {
      if (redRings >= 3) return "花神";
      return "灵花之神";
    }
    /* 龟/甲/防御 */
    if (ability.indexOf("龟") >= 0 || ability.indexOf("甲") >= 0) {
      return "守护之神";
    }
    /* 鸟/鹰/鹏 */
    if (ability.indexOf("鸟") >= 0 || ability.indexOf("鹰") >= 0 || ability.indexOf("鹏") >= 0) {
      if (redRings >= 3) return "天空之神";
      return "疾风之神";
    }
    /* 毒/蛇 */
    if (ability.indexOf("毒") >= 0 || ability.indexOf("蛇") >= 0) {
      return "毒神";
    }
    /* 精神/眼 */
    if (ability.indexOf("精神") >= 0 || ability.indexOf("眼") >= 0) {
      return "心灵之神";
    }
    /* ====== 通用fallback：根据综合实力赋予称号 ====== */
    var strongGods = ["万界之主","太初古神","命运主宰","混沌古神","豪迅天神","天机古神","永恒古神","警罗天神"];
    if (dualWuhun && redRings >= 3) return strongGods[0];
    if (redRings >= 4) return strongGods[Math.floor(Math.random() * 2)];
    if (boneCount >= 5) return strongGods[2];
    if (redRings >= 2) return strongGods[Math.floor(Math.random() * strongGods.length)];
    if (talent >= 8) return strongGods[4];
    if (g.age < 60) return "天才之神";
    return strongGods[Math.floor(Math.random() * strongGods.length)];
  }

  /* 生成神考当前阶段的事件文案，供九考流程统一读取。 */
  function godTestEventText(g, testNum, godName) {
    var tests = [
      ['武魂觉醒试炼', ['武魂共鸣，神力认可了你的根基。'], ['武魂光芒黯淡，神力暂未认可你的资质。']],
      ['魂力淬炼试炼', ['魂力在经脉中奔涌，你稳住了神力冲击。'], ['神力冲击撕裂经脉，你只能暂退调息。']],
      ['魂兽猎杀试炼', ['你击败守关魂兽，取得了关键魂环。'], ['守关魂兽撕裂防线，你带伤逃出试炼场。']],
      ['意志幻境试炼', ['你看破幻境，守住了本心。'], ['幻境动摇了你的心神，试炼被迫中止。']],
      ['海域穿越试炼', ['你顶住怒潮，穿过了神力封锁的海域。'], ['怒潮将你卷回岸边，神考进度受到影响。']],
      ['神威承受试炼', ['你以魂力化解神威，肉身与精神同步突破。'], ['神威压垮了你的防线，魂力根基受到震荡。']],
      ['杀戮考验试炼', ['你在杀戮中保持清醒，没有被力量吞噬。'], ['杀意侵蚀心神，你的魂力被神力削弱。']],
      ['信念抉择试炼', ['你坚持自己的道路，神位传承向你敞开。'], ['你的信念出现动摇，神位传承暂时沉寂。']],
      ['终极神位试炼', ['你承受住最后的神力灌注，神格开始凝聚。'], ['最后的神威撕裂了你的防线，神魂随之崩解。']]
    ];
    var current = tests[Math.max(0, Math.min(tests.length - 1, testNum - 1))];
    var successTexts = {}, failTexts = {};
    for (var i = 0; i < tests.length; i++) {
      successTexts[i + 1] = tests[i][1];
      failTexts[i + 1] = tests[i][2];
    }
    return {
      base: '第' + g.age + '岁，' + godName + current[0],
      successTexts: successTexts,
      failTexts: failTexts
    };
  }
/* ---------- 主题对象 ---------- */
  var theme = {
    id: 'douluo',
    name: '斗罗大陆模拟器',
    subtitle: '武魂觉醒 · 魂环魂骨',
    desc: '六岁武魂觉醒，修炼魂力，猎杀魂兽，融合魂骨，成神之路。',
    accent: '#4a9eff',
    icon: '⚔',
    tags: ['武魂觉醒', '魂环魂骨', '修仙养成'],
    terms: terms,

    ABILITY_POOL: ABILITY_POOL,
    INNATE_WEIGHTS: INNATE_WEIGHTS,
    BREAK_CHANCE: BREAK_CHANCE,
    COMBAT_COEF: COMBAT_COEF,
    ESSENCE: ESSENCE,
    SKILL_TIER: SKILL_TIER,
    SOUL_BEASTS: SOUL_BEASTS,
    SOUL_BONE_POOL: SOUL_BONE_POOL,
    RING_COLORS: RING_COLORS,
    ACHIEVEMENTS: ACHIEVEMENTS,
    EVENTS: EVENTS,
    GUARD: GUARD,
    TALENTS: TALENTS,

    LIFE_MIN: 90, LIFE_MAX: 160,
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
    generateName: generateGodName,

    /* 自创神位池（localStorage 持久化，新创神位自动加入） */
    GOD_POOL_KEY: 'dl_custom_gods',
    getCustomGods: function () {
      try { var a = JSON.parse(localStorage.getItem('dl_custom_gods') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
    },
    addCustomGod: function (name) {
      try {
        var list = this.getCustomGods();
        if (list.indexOf(name) < 0) { list.push(name); localStorage.setItem('dl_custom_gods', JSON.stringify(list.slice(0, 50))); }
      } catch (e) {}
    },
    getGodPool: function () {
      var base = ['海神', '修罗神', '天使之神', '罗刹神', '食神', '九彩神女'];
      var custom = this.getCustomGods();
      return base.concat(custom);
    },

    hooks: {
      /* 觉醒魂环时从魂兽池随机抽取，随机选一魂技，千年以上概率掉落魂骨 */
      onAwakenSkill: function (g, tierName, add) {
        var pool = SOUL_BEASTS[tierName] || SOUL_BEASTS['白'];
        var beast = pool[Math.floor(Math.random() * pool.length)];
        if (!g.soulRings) g.soulRings = [];
        /* 去重：避免同局重复魂兽 */
        var exists = false;
        for (var i = 0; i < g.soulRings.length; i++) { if (g.soulRings[i].name === beast.name) { exists = true; break; } }
        if (exists) { beast = pool[Math.floor(Math.random() * pool.length)]; }
        /* 随机选一个魂技 */
        var skills = beast.skills || ['未知魂技'];
        var skill = skills[Math.floor(Math.random() * skills.length)];
        var maxR = g.maxRings || 9;
        if (g.soulRings.length < maxR) {
          g.soulRings.push({ name: beast.name, year: beast.year, skill: skill, tier: tierName, wuhun: 1 });
        }
        var desc = beast.name + '（' + beast.year + '，' + skill + '）';
        /* 魂骨掉落判定：千年以上有概率，十万年必定掉落 */
        var boneDrop = false;
        if (tierName === '红') { boneDrop = true; }       /* 十万年必定掉落 */
        else if (tierName === '黑') { boneDrop = Math.random() < 0.5; }  /* 万年50% */
        else if (tierName === '紫') { boneDrop = Math.random() < 0.15; }  /* 千年15% */
        if (boneDrop) {
          if (!g.soulBones) g.soulBones = [];
          /* 从魂骨池中找一个未拥有的部位 */
          var allParts = ['头骨', '躯干骨', '左臂骨', '右臂骨', '左腿骨', '右腿骨'];
          var ownedParts = {};
          for (var bi = 0; bi < g.soulBones.length; bi++) ownedParts[g.soulBones[bi].part] = true;
          var freeParts = [];
          for (var pi = 0; pi < allParts.length; pi++) { if (!ownedParts[allParts[pi]]) freeParts.push(allParts[pi]); }
          if (freeParts.length) {
            var part = freeParts[Math.floor(Math.random() * freeParts.length)];
            var candidates = SOUL_BONE_POOL[part];
            if (candidates && candidates.length) {
              var bone = candidates[Math.floor(Math.random() * candidates.length)];
              g.soulBones.push({ part: part, beast: bone.beast, skill: bone.skill, tier: bone.tier });
              desc += ' ★魂骨掉落：' + bone.beast + part + '（' + bone.skill + '）';
            }
          }
        }
        return desc;
      },
      /* 第二武魂：第一武魂九环后，从91级开始逐级吸收第二套魂环。战力不足时有爆体风险。 */
      onSecondWuhunRing: function (g) {
        if (!g.dualWuhun || g.lvl < 91 || g.lvl > 99) return null;
        if ((g.soulRings || []).length < 9) return null;
        if (g.secondWuhunLastLevel === g.lvl || (g.secondWuhunRings || 0) >= 9) return null;

        g.secondWuhunLastLevel = g.lvl;
        var ringNo = (g.secondWuhunRings || 0) + 1;
        var requiredCombat = 15000 + ringNo * 8000;
        var deficit = Math.max(0, 1 - g.combat / requiredCombat);
        var burstChance = Math.min(0.80, deficit * 0.75 + (deficit > 0 ? 0.05 : 0));
        if (Math.random() < burstChance) {
          g.deathReason = 'ringBurst';
          return {
            dead: true,
            text: '第' + g.age + '岁，第二武魂强行吸收第' + ringNo + '枚魂环，魂力反噬冲垮肉身——爆体而亡！'
          };
        }

        var tier = selectSkill(g.combat, Math.max(ringNo, 3));
        /* ★ 第二武魂第一魂环保底万年（黑级）以上，还原著设定 */
        if (ringNo === 1 && tier.name !== '黑' && tier.name !== '红') {
          tier = { name: '黑', combatLo: 10000, combatHi: 72499, addLo: 500, addHi: 1500 };
        }
        var before = (g.soulRings || []).length;
        var desc = theme.hooks.onAwakenSkill(g, tier.name, tier.addLo);
        if (g.soulRings.length > before) {
          g.soulRings[g.soulRings.length - 1].wuhun = 2;
          g.soulRings[g.soulRings.length - 1].ringNo = ringNo;
          g.secondWuhunRings = ringNo;
        }
        return { text: '第' + g.age + '岁，第二武魂吸收第' + ringNo + '枚魂环：' + desc };
      },
      /* ★ 斗罗多路径成神：神考继承 / 信仰自创 */
      tryAscendPath: function (g, log, U, helpers) {
        if ((g.pathAttempts || 0) >= 2) return false;   /* 主题路径最多尝试 2 次 */
        /* 路径1：神考九考系统 */
        if (g.godTest && g.lvl >= 90) {
          if (!g.godTestProgress) g.godTestProgress = 0;
          if (g.godTestProgress >= 9) return false; // 已通过全部神考
          var testNum = g.godTestProgress + 1;
          var godName = g.inheritGod || '神';
          var evt = godTestEventText(g, testNum, godName);
          var successRate = testNum <= 3 ? 0.7 : testNum <= 6 ? 0.5 : testNum <= 8 ? 0.35 : 0.2;
          successRate += (g.ascendBonus || 0);
          if (Math.random() < successRate) {
            g.godTestProgress = testNum;
            var sTxt = evt.successTexts[testNum];
            var sMsg = sTxt[Math.floor(Math.random() * sTxt.length)];
            log.push({ cls: testNum === 9 ? 'god' : 'ev1', text: evt.base + '——' + sMsg + '第' + testNum + '考通过！' + (testNum < 9 ? '神考进度：' + testNum + '/9' : '') });
            if (testNum === 9) {
              g.ascendMode = 'godTest';
              g.godName = godName;
              log.push({ cls: 'god', text: '第' + g.age + '岁，通过' + godName + '九考！继承神位，飞升神界！神位：' + g.godName + '！' });
              g.ascended = true; g.lvl = 100;
              g.combat = helpers.godCombat(g.combat, 8); g.lifespan = 99999;
              return true;
            }
            return false;
          }
          /* 失败惩罚 */
          var fTxt = evt.failTexts[testNum];
          var fMsg = fTxt[Math.floor(Math.random() * fTxt.length)];
          log.push({ cls: 'ev3', text: evt.base + '——' + fMsg });
          if (testNum === 9) {
            g.dead = true; g.ascendMode = 'fail';
            log.push({ cls: 'dead', text: '第九考失败，神力反噬，灵魂彻底碎裂——再无轮回！' });
            return true;
          }
          var penalty = testNum <= 3 ? U.irand(3, 8) : testNum <= 6 ? U.irand(8, 15) : U.irand(15, 25);
          g.lifespan -= penalty;
          if (testNum >= 7) { g.combat = Math.floor(g.combat * 0.8); }
          return false;
        }
        /* 路径2：信仰自创 - 需信仰之力 + 修为≥95，成功率6%（递减） */
        if (g.faith && g.lvl >= 95) {
          g.pathAttempts = (g.pathAttempts || 0) + 1;
          var rate2 = (0.04 + (g.ascendBonus || 0)) - (g.pathAttempts - 1) * 0.01;
          if (Math.random() < rate2) {
            g.ascendMode = 'selfGod';
            g.godName = generateGodName(g);
            /* 自创神位加入神位池，后续玩家可继承 */
            if (theme.addCustomGod) theme.addCustomGod(g.godName);
            log.push({ cls: 'god', text: '第' + g.age + '岁，信仰之力推举突破百级！自创神位，成就初代神！神位：' + g.godName + '！' });
            g.ascended = true; g.lvl = 100;
            g.combat = helpers.godCombat(g.combat, 10); g.lifespan = 99999;
            return true;
          }
          log.push({ cls: 'ev3', text: '第' + g.age + '岁，信仰之力不足，自创神位失败！' });
          return false;
        }
        return false;
      }
    }
  };

  root.THEMES = root.THEMES || {};
  root.THEMES.douluo = theme;
})(typeof self !== 'undefined' ? self : this);
