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
    { id:'dm_t14', name:'完美基因', rarity:'gold', desc:'天赋+2，战力+30%，源质炼化门槛降低', apply:function(g){ g.innate = Math.min(10, g.innate + 2); g.aptitude = Math.max(g.aptitude, g.innate); g.combat = Math.floor(g.combat * 1.3); g.refineBoost = true; } },
    { id:'dm_t15', name:'超进化血脉', rarity:'gold', desc:'天赋+1，战力+50%，寿元+20，强行进化概率提升', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.combat = Math.floor(g.combat * 1.5); g.lifespan += 20; g.forcedBoost = true; } },

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
    { id:'dm_t25', name:'末日方舟', rarity:'gold', desc:'天赋+1，战力+40%，寿元+30', apply:function(g){ g.innate = Math.min(10, g.innate + 1); g.aptitude = Math.max(g.aptitude, g.innate); g.combat = Math.floor(g.combat * 1.4); g.lifespan += 30; } }
  ];

  /* ---------- 变异者称号（titleOf） ---------- */
  function titleOf(lvl) {
    lvl = Math.max(1, Math.min(99, Math.floor(lvl) || 1));
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
    EVENTS: E,
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
