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
    return DUO_BASE[idx] + mod + '级';
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
  var RING_COLORS = { '白': '#e0e0e0', '黄': '#f5c542', '紫': '#a855f7', '黑': '#555555', '红': '#ef4444' };

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
        return '武魂二次觉醒！先天魂力提升 ' + inc + ' 级，魂力大幅增长，寿元+' + lf;
      },
      fail: function (g, U, log) { return '武魂二次觉醒失败，武魂震荡，略有损伤'; }
    },
    { id: 'duo_twin', weight: 0.08, maxCount: 1, name: '双生武魂觉醒', tier: 4, desc: '隐藏的第二武魂苏醒',
      minAge: 10, maxAge: 60,
      cond: function (g, U) { return g.innate >= 7 && g.lvl >= 30; },
      ok: function (g, U, log) {
        g.lifespan += U.irand(5, 10);
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(3, 5));
        return '双生武魂觉醒！第二武魂苏醒，战力暴增，寿元延长！';
      },
      fail: function (g, U, log) { return '第二武魂未能觉醒，精神力不足'; }
    },
    { id: 'duo_godring', weight: 0.1, maxCount: 1, name: '神赐魂环', tier: 4, desc: '神力降下金色魂环',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 70; },
      ok: function (g, U, log) {
        var lf = U.irand(8, 15); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(4, 7));
        return '神赐魂环降临！金色魂环加持，魂力暴涨，寿元+' + lf;
      },
      fail: function (g, U, log) { return '神赐魂环消散，未能承受神力'; }
    },
    { id: 'dl_godtest', weight: 0.015, maxCount: 1, name: '神考邀请', tier: 4, desc: '神界降下神考邀请',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 75 && !g.godTest; },
      ok: function (g, U, log) {
        g.godTest = true;
        /* 随机分配一个传承神位 */
        var gods = ['海神', '修罗神', '天使之神', '罗刹神', '食神', '九彩神女'];
        g.inheritGod = gods[U.irand(0, gods.length - 1)];
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * 2);
        var lf = U.irand(10, 20); g.lifespan += lf;
        return '神考降临！获得' + g.inheritGod + '传承神考资格，通过九考可继承神位！寿元+' + lf;
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
        return '信仰之力凝结成神格！可自创神位，百级成神！魂力暴涨，寿元+' + lf;
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
        return '猎杀魂兽爆出魂骨！融合后魂力大增';
      },
      fail: function (g, U, log) { return '魂兽未掉落魂骨，仅获魂力微增'; }
    },
    { id: 'duo_herb', weight: 0.2, maxCount: 3, name: '仙草机缘', tier: 3, desc: '发现珍稀仙草',
      minAge: 8, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var lf = U.irand(3, 7); g.lifespan += lf;
        g.combat += U.irand(500, 3000);
        return '采得珍稀仙草！寿元+' + lf + '，魂力增长';
      },
      fail: function (g, U, log) { return '仙草已被采摘，扑了个空'; }
    },
    { id: 'duo_mutation', weight: 0.18, maxCount: 2, name: '武魂良性变异', tier: 3, desc: '武魂发生良性变异',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.innate >= 4 && g.lvl >= 15; },
      ok: function (g, U, log) {
        if (g.innate < 10) { g.innate += 1; g.aptitude = Math.max(g.aptitude, g.innate); }
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1, 2));
        return '武魂良性变异！先天魂力提升 1 级';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '武魂恶性变异！先天魂力未提升，寿元受损';
      }
    },
    { id: 'duo_soulbeast', weight: 0.22, maxCount: 5, name: '万年魂兽来袭', tier: 3, desc: '遭遇万年魂兽',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        g.combat += Math.floor(r * U.rand(1.2, 2.5));
        return '击杀万年魂兽！获得高品质魂环，魂力大增';
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(3, 8);
        return '万年魂兽反噬！重伤逃脱，寿元受损';
      }
    },

    /* ---------- tier 2 中级 ---------- */
    { id: 'duo_train', weight: 0.7, maxCount: 10, name: '宗门历练', tier: 2, desc: '在宗门中刻苦修炼',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var gain = U.evCombat(g, 0.03, 0.10, 200);
        return '宗门历练收获颇丰，魂力+' + gain;
      },
      fail: function (g, U, log) { return '历练途中遭遇瓶颈，收获平平'; }
    },
    { id: 'duo_mediate', weight: 0.7, maxCount: 10, name: '冥想修炼', tier: 2, desc: '静坐冥想吸收天地魂力',
      minAge: 6, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var gain = U.evCombat(g, 0.02, 0.08, 150);
        return '冥想入定，魂力稳步增长+' + gain;
      },
      fail: null
    },
    { id: 'duo_huntring', weight: 0.6, maxCount: 8, name: '猎杀魂兽', tier: 2, desc: '前往星斗大森林猎杀魂兽',
      minAge: 10, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 10; },
      ok: function (g, U, log) {
        var gain = U.evCombat(g, 0.04, 0.12, 300);
        return '成功猎杀魂兽，吸收魂环，魂力+' + gain;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 4);
        return '猎杀失败，被魂兽击伤，寿元受损';
      }
    },
    { id: 'duo_dan', weight: 0.5, maxCount: 5, name: '丹药辅助', tier: 2, desc: '服用修炼丹药',
      minAge: 8, maxAge: 10000, cond: null,
      ok: function (g, U, log) {
        var lf = U.irand(1, 4); g.lifespan += lf;
        g.combat += U.irand(200, 1500);
        return '丹药见效！寿元+' + lf + '，魂力增长';
      },
      fail: function (g, U, log) { return '丹药药力过猛，略有不适'; }
    },
    { id: 'duo_seagod', weight: 0.5, maxCount: 2, name: '海神岛历练', tier: 2, desc: '在海神岛接受海神九考',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 50; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        var lf = U.irand(3, 8); g.lifespan += lf;
        return '海神岛历练，通过海神考验！魂力+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(2, 5);
        return '海神考验失败，魂力反噬，寿元受损';
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
        return '杀戮之都修炼，杀气凝聚！魂力+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '杀戮之都险些陨落，寿元受损';
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
        return '冰火两仪眼修炼，仙药淬体！魂力+' + add + '，寿元+' + lf;
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
        return '史莱克学院修行，魂力+' + add + '，寿元+' + lf;
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
        return '大斗兽场磨练，魂技精进，魂力+' + add;
      },
      fail: function (g, U, log) {
        g.lifespan -= U.irand(1, 3);
        return '大斗兽场受创，寿元受损';
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
        return '星斗大森林猎杀魂兽，魂力+' + add + '，寿元+' + lf;
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
        return '落日森林寻得仙草，魂力+' + add + '，寿元+' + lf;
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
        return '高级魂师大赛夺冠，魂力+' + add;
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
        return '唐门暗器传承！习得佛怒唐莲、暗器百解，魂力+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(3, 6); return '唐门机关反噬，险些陨落，寿元受损'; }
    },
    { id: 'duo_seagod9', weight: 0.1, maxCount: 1, name: '海神九考', tier: 4, desc: '海神岛九考之试炼',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 70 && (!g.godTest || g.inheritGod === '海神'); },
      ok: function (g, U, log) {
        g.godTest = true; g.inheritGod = '海神';
        var lf = U.irand(15, 25); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(4, 7));
        g.combat += add;
        return '通过海神九考！获海神三叉戟认可，魂力+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(5, 10); return '海神九考未通过，神力反噬，寿元大损'; }
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
        return '修罗神传承降临！杀戮之心觉醒，魂力+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(8, 15); return '修罗神力过强，肉身难以承受，寿元大损'; }
    },

    /* ---------- tier 3 稀有 (新增) ---------- */
    { id: 'duo_titan', weight: 0.18, maxCount: 2, name: '泰坦巨猿遭遇', tier: 3, desc: '星斗大森林遇泰坦巨猿',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 35; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        return '击退泰坦巨猿！获得万年魂骨，魂力+' + add;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(3, 7); return '泰坦巨猿之力远超想象，险些丧命，寿元受损'; }
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
        return '幽香绮罗仙品！先天魂力+1，魂力+' + add + '，寿元+' + lf;
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
        return '冰火两仪眼采得仙草！仙药淬体，魂力+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(2, 5); return '仙草药力冲突，反受其害，寿元受损'; }
    },
    { id: 'duo_iceemperor', weight: 0.14, maxCount: 1, name: '极北之地·冰帝', tier: 3, desc: '极北之地遇冰帝',
      minAge: 30, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 45; },
      ok: function (g, U, log) {
        var lf = U.irand(10, 20); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2, 4));
        g.combat += add;
        return '冰帝指点！极寒之力淬体，魂力+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(4, 8); return '极寒侵蚀肉身，险些冻毙，寿元受损'; }
    },
    { id: 'duo_zilan', weight: 0.15, maxCount: 1, name: '海神岛·紫兰花', tier: 3, desc: '海神岛采紫兰花',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40; },
      ok: function (g, U, log) {
        var lf = U.irand(8, 14); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 3));
        g.combat += add;
        return '海神岛采得紫兰花！海神之力加持，魂力+' + add + '，寿元+' + lf;
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
        return '杀神领域觉醒！杀气凝形，魂力+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(4, 8); return '杀气失控，反噬其主，寿元受损'; }
    },
    { id: 'duo_tiandou_coup', weight: 0.12, maxCount: 1, name: '天斗宫变', tier: 3, desc: '天斗帝国宫变事件',
      minAge: 25, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 40; },
      ok: function (g, U, log) {
        var lf = U.irand(5, 10); g.lifespan += lf;
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(2, 3.5));
        g.combat += add;
        return '天斗宫变中建功立业！获皇室赏赐，魂力+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(3, 7); return '卷入宫变漩涡，险些获罪，寿元受损'; }
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
        return '史莱克七怪集训！彼此切磋精进，魂力+' + add + '，寿元+' + lf;
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
        return '索托城大斗兽场连胜！魂力+' + add;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(1, 3); return '斗兽场败北，重伤离场，寿元受损'; }
    },
    { id: 'duo_yuexuan', weight: 0.5, maxCount: 5, name: '月轩冥想', tier: 2, desc: '月轩中静心冥想',
      minAge: 10, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var gain = U.evCombat(g, 0.03, 0.09, 180);
        return '月轩冥想入定，魂力+' + gain;
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
        return '天斗皇家学院进修！名师指点，魂力+' + add;
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
        return '武魂殿大比夺魁！名震大陆，魂力+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) { return '武魂殿大比失利，铩羽而归'; }
    },
    { id: 'duo_longgu', weight: 0.35, maxCount: 2, name: '龙谷探险', tier: 2, desc: '深入龙谷探险',
      minAge: 20, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 30; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1.5, 2.5));
        g.combat += add;
        var lf = U.irand(2, 6); g.lifespan += lf;
        return '龙谷探险得龙血草！魂力+' + add + '，寿元+' + lf;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(2, 5); return '龙谷遇险，重伤逃出，寿元受损'; }
    },
    { id: 'duo_deepforest', weight: 0.45, maxCount: 4, name: '魂兽森林深处', tier: 2, desc: '深入魂兽森林核心区',
      minAge: 18, maxAge: 10000,
      cond: function (g, U) { return g.lvl >= 25; },
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(1, 2));
        g.combat += add;
        return '魂兽森林深处猎得千年魂兽！魂力+' + add;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(2, 5); return '深处魂兽凶猛，狼狈逃出，寿元受损'; }
    },
    { id: 'duo_canalcaravan', weight: 0.5, maxCount: 5, name: '运河商队', tier: 2, desc: '随运河商队历练',
      minAge: 12, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.5, 1.2));
        g.combat += add;
        var lf = U.irand(1, 3); g.lifespan += lf;
        return '随运河商队历练，见闻长进，魂力+' + add + '，寿元+' + lf;
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
        return '阿房宫密室古修传承！魂力+' + add + '，寿元+' + lf;
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
        return '研习唐门绝学，玄天功入门！魂力+' + add;
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
        return '诺丁学院启蒙修习，魂力+' + add + '，寿元+' + lf;
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
        return '圣魂村中静修，魂力+' + add;
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
        return '手工锻造锤炼武魂，魂力+' + add;
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
        return '魂师公会注册成功！获魂师徽章，魂力+' + add;
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
        return '成功吸收魂环！魂技精进，魂力+' + add;
      },
      fail: function (g, U, log) { g.lifespan -= U.irand(1, 2); return '魂环吸收失败，反噬受伤，寿元受损'; }
    },
    { id: 'duo_wuhunworship', weight: 0.7, maxCount: 3, name: '武魂殿礼拜', tier: 1, desc: '在武魂殿礼拜祈祷',
      minAge: 6, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.2, 0.5));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        return '武魂殿礼拜，神恩加持，魂力+' + add + '，寿元+' + lf;
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
        return '天斗城巡游，见闻增长，魂力+' + add;
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
        return '魂兽森林外围猎得低阶魂兽，魂力+' + add;
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
        return '星罗城比武夺魁！魂力+' + add;
      },
      fail: function (g, U, log) { return '星罗城比武失利，铩羽而归'; }
    },
    { id: 'duo_sunsetouter', weight: 0.85, maxCount: 4, name: '落日森林外围', tier: 1, desc: '落日森林外围采药',
      minAge: 8, maxAge: 10000,
      cond: null,
      ok: function (g, U, log) {
        var r = U.combatGain(g.aptitude, g.lvl);
        var add = Math.floor(r * U.rand(0.3, 0.6));
        g.combat += add;
        var lf = U.irand(1, 2); g.lifespan += lf;
        return '落日森林外围采得凡品仙草，魂力+' + add + '，寿元+' + lf;
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
    refineSuccess: function (age) { return '第' + age + '岁，寿元将尽，成功融合魂骨，晋升为神祇！'; },
    refineFail: function (age, boost) { return '第' + age + '岁，魂骨融合失败，但武魂有所提升，魂力+' + boost; },
    forcedAscend: function (age) { return '第' + age + '岁，寿元将尽，强行成神，成为神祇！'; },
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
    { id:'dl_t14', name:'海神传承', rarity:'gold', desc:'天赋+2，魂力+30%，开局获得神考邀请(海神)', apply:function(g){ g.innate = Math.min(10, g.innate + 2); g.aptitude = Math.max(g.aptitude, g.innate); g.combat = Math.floor(g.combat * 1.3); g.godTest = true; g.inheritGod = '海神'; } },
    { id:'dl_t15', name:'神祇眷顾', rarity:'gold', desc:'天赋+1，魂力+50%，寿元+20，开局获得信仰之力', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.combat = Math.floor(g.combat * 1.5); g.lifespan += 20; g.faith = true; } },

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
    { id:'dl_t24', name:'神考资格', rarity:'purple', desc:'魂力+20%，开局获得神考邀请(随机)', apply:function(g){ g.combat = Math.floor(g.combat * 1.2); g.godTest = true; var gods = ['海神','修罗神','天使之神','罗刹神','食神','九彩神女']; g.inheritGod = gods[Math.floor(Math.random() * gods.length)]; } },
    /* gold (1) */
    { id:'dl_t25', name:'修罗神血脉', rarity:'gold', desc:'天赋+2，魂力+40%，寿元+15，开局获得修罗神神考', apply:function(g){ g.innate = Math.min(10, g.innate + 2); g.aptitude = Math.max(g.aptitude, g.innate); g.combat = Math.floor(g.combat * 1.4); g.lifespan += 15; g.godTest = true; g.inheritGod = '修罗神'; } }
  ];

  /* 根据武魂和生平生成自创神位名 */
  function generateGodName(g) {
    var ability = g.ability || '';
    var rings = g.soulRings || [];
    var bones = g.soulBones || [];
    var redRings = 0;
    for (var i = 0; i < rings.length; i++) { if (rings[i].tier === '红') redRings++; }
    /* 根据武魂属性匹配神位 */
    if (ability.indexOf('蓝银') >= 0 || ability.indexOf('植物') >= 0 || ability.indexOf('藤') >= 0) {
      return redRings >= 3 ? '生命女神' : '植物之神';
    }
    if (ability.indexOf('昊天锤') >= 0 || ability.indexOf('锤') >= 0) {
      return redRings >= 3 ? '战神' : '力之神';
    }
    if (ability.indexOf('冰') >= 0 || ability.indexOf('雪') >= 0 || ability.indexOf('霜') >= 0) {
      return redRings >= 3 ? '冰霜女神' : '寒冰之神';
    }
    if (ability.indexOf('火') >= 0 || ability.indexOf('凤凰') >= 0 || ability.indexOf('焰') >= 0) {
      return redRings >= 3 ? '凤凰之神' : '火焰之神';
    }
    if (ability.indexOf('猫') >= 0 || ability.indexOf('虎') >= 0 || ability.indexOf('豹') >= 0) {
      return redRings >= 3 ? '兽神' : '猛兽之神';
    }
    if (ability.indexOf('龙') >= 0) {
      return redRings >= 3 ? '龙神' : '龙之神';
    }
    if (ability.indexOf('蝶') >= 0 || ability.indexOf('花') >= 0) {
      return redRings >= 3 ? '花神' : '花仙之神';
    }
    if (ability.indexOf('龟') >= 0 || ability.indexOf('甲') >= 0) {
      return redRings >= 3 ? '守护神' : '大地之神';
    }
    if (ability.indexOf('鸟') >= 0 || ability.indexOf('鹰') >= 0 || ability.indexOf('鹏') >= 0) {
      return redRings >= 3 ? '天空之神' : '疾风之神';
    }
    if (ability.indexOf('毒') >= 0 || ability.indexOf('蛇') >= 0) {
      return redRings >= 3 ? '毒神' : '毒素之神';
    }
    if (ability.indexOf('精神') >= 0 || ability.indexOf('眼') >= 0) {
      return redRings >= 3 ? '心灵之神' : '智慧之神';
    }
    /* 通用 fallback：根据魂环/魂骨数量赋予称号 */
    if (bones.length >= 4) return '守护之神';
    if (redRings >= 2) return '至高之神';
    if (g.age < 60) return '天才之神';
    return '自然之神';
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

    initialState: {},

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
        g.soulRings.push({ name: beast.name, year: beast.year, skill: skill, tier: tierName });
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
      /* ★ 斗罗多路径成神：神考继承 / 信仰自创 */
      tryAscendPath: function (g, log, U, helpers) {
        if ((g.pathAttempts || 0) >= 2) return false;   /* 主题路径最多尝试 2 次 */
        /* 路径1：神考继承 - 需获得神考邀请 + 修为≥90，成功率8%（递减） */
        if (g.godTest && g.lvl >= 90) {
          g.pathAttempts = (g.pathAttempts || 0) + 1;
          var rate1 = 0.06 - (g.pathAttempts - 1) * 0.012;
          if (Math.random() < rate1) {
            g.ascendMode = 'godTest';
            log.push({ cls: 'god', text: '第' + g.age + '岁，通过' + g.inheritGod + '九考！继承神位，飞升神界！' });
            g.ascended = true; g.lvl = 100;
            g.combat = helpers.godCombat(g.combat, 8); g.lifespan = 99999;
            g.godName = g.inheritGod;
            return true;
          }
          log.push({ cls: 'ev3', text: '第' + g.age + '岁，' + g.inheritGod + '神考未通过，明年再试！' });
          return false;
        }
        /* 路径2：信仰自创 - 需信仰之力 + 修为≥95，成功率6%（递减） */
        if (g.faith && g.lvl >= 95) {
          g.pathAttempts = (g.pathAttempts || 0) + 1;
          var rate2 = 0.04 - (g.pathAttempts - 1) * 0.01;
          if (Math.random() < rate2) {
            g.ascendMode = 'selfGod';
            log.push({ cls: 'god', text: '第' + g.age + '岁，信仰之力推举突破百级！自创神位，成就初代神！' });
            g.ascended = true; g.lvl = 100;
            g.combat = helpers.godCombat(g.combat, 10); g.lifespan = 99999;
            g.godName = generateGodName(g);
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
