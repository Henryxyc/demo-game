# 《模拟器底层架构重构方案》
## 从线性剧情 → 标签驱动的动态涌现式叙事

---

## 一、核心资产标签化系统 (Tag System)

### 1.1 设计理念

摒弃"战力/等级"单一判定，为每个玩家角色 `g` 维护一个多维标签集合 `g.tags`。
标签是轻量级字符串数组，任何系统（事件、词条、环境）都可以读写。

### 1.2 标签分类体系

```
g.tags = {
  element:    [],   // 元素属性标签：'fire', 'ice', 'lightning', 'wood', 'space'...
  body:       [],   // 体质标签：'twin_soul', 'supreme_bone', 'self_seed'...
  faction:    [],   // 阵营标签：'sect_elder', 'alchemist', 'god_candidate'...
  status:     [],   // 状态标签：'bone_suppression', 'demonic_corruption', 'blessed'...
  memory:     [],   // 记忆标签（因果链）：'betrayed_ally', 'spared_enemy', 'found_relic'...
  world:      [],   // 世界标签（环境）：'beast_tide_month', 'fire_storm', 'frost_age'...
}
```

### 1.3 四大主题标签词库

#### 斗罗大陆
```js
// 元素
'ice_extreme', 'fire_extreme', 'thunder_extreme', 'wind_extreme', 'earth_extreme',
'light', 'dark', 'space', 'time', 'life', 'death',
// 体质
'twin_soul', 'innate_full_soul', 'soul_bone_head', 'soul_bone_trunk',
'soul_bone_larm', 'soul_bone_rarm', 'soul_bone_lleg', 'soul_bone_rleg',
'external_bone', 'divine_bone',
// 阵营
'sect_tang', 'sect_bibi', 'sect_soul_hall', 'god_candidate_sea', 'god_candidate_asiro',
// 状态
'god_test_active', 'faith_power', 'soul_suppressed'
```

#### 斗破苍穹
```js
// 元素
'fire_qinglian', 'fire_guiling', 'fire_yunluo', 'fire_jiuyou', 'fire_haiyan',
'fire_bone_spirit', 'fire_jin_di', 'fire_jinglian', 'fire_dijing', 'fire_xuwu',
// 体质
'fenjue', 'soul_origin', 'soul_origin_ready', 'fire_body', 'alchemy_body',
// 阵营
'sect_yunlan', 'ancient_clan', 'pill_tower', 'black_corner',
// 状态
'guyu_3', 'guyu_5', 'guyu_8', 'fire_count_3', 'fire_count_5', 'fire_count_10'
```

#### 完美世界
```js
// 元素
'fire_paradise', 'ice_paradise', 'thunder_paradise', 'wind_paradise',
'space_rune', 'time_rune', 'death_rune',
// 体质
'supreme_bone', 'self_seed', 'immortal_bone', 'double_bone',
'immortal_seed', 'red_dust_path',
// 阵营
'shi_clan', 'huo_clan', 'stone_country', 'heavenly_deity',
// 状态
'xianqi_1', 'xianqi_3', 'bone_suppression', 'liushen_disciple'
```

#### 末日模拟器
```js
// 元素
'plant_gene', 'space_ability', 'fire_ability', 'ice_ability',
'telekinesis', 'healing', 'dark_ability',
// 体质
'mutant_pure', 'mutant_hybrid', 'evolution_ready',
// 阵营
'settlement_alpha', 'settlement_beta', 'lone_wolf', 'machine_cult',
// 状态
'suspicion_level_1', 'suspicion_level_2', 'radiation_exposed', 'gene_stable'
```

### 1.4 标签自动注入机制

在 `sim.js` 的 `createGame()` 中，扩展 `initialState` 注入逻辑：

```js
// sim.js - createGame() 扩展
function createGame(w, opts) {
  var g = { /* 原有字段 */ };

  // ★ 新增：标签系统初始化
  g.tags = { element:[], body:[], faction:[], status:[], memory:[], world:[] };

  // 注入主题初始标签
  var initTags = theme.initTags || {};
  for (var cat in initTags) {
    if (g.tags[cat]) g.tags[cat] = g.tags[cat].concat(initTags[cat]);
  }

  return g;
}

// ★ 标签工具函数（挂载到 U 上供事件调用）
function hasTag(g, tag) {
  for (var cat in g.tags) {
    if (g.tags[cat].indexOf(tag) >= 0) return true;
  }
  return false;
}

function addTag(g, cat, tag) {
  if (g.tags[cat] && g.tags[cat].indexOf(tag) < 0) g.tags[cat].push(tag);
}

function removeTag(g, cat, tag) {
  if (g.tags[cat]) g.tags[cat] = g.tags[cat].filter(function(t){ return t !== tag; });
}

function countTags(g, cat, prefix) {
  var n = 0;
  if (g.tags[cat]) {
    for (var i = 0; i < g.tags[cat].length; i++) {
      if (g.tags[cat][i].indexOf(prefix) === 0) n++;
    }
  }
  return n;
}
```

---

## 二、词条与标签深度联动 (Talent-Tag Synergy)

### 2.1 词条数据结构升级

每个词条从 `{ id, name, rarity, desc, apply }` 升级为：

```js
{
  id: 'dp_t25',
  name: '焚决觉醒',
  rarity: 'gold',
  desc: '开局获得焚决，可收服多种异火',
  // ★ 基础效果（保留兼容）
  apply: function(g) { g.fenjue = true; g.ascendBonus += 0.08; },
  // ★ 新增：隐性标签
  tags: {
    body: ['fenjue'],           // 体质标签
    element: ['fire'],          // 元素亲和
    status: ['fire_user'],      // 状态标签
  },
  // ★ 新增：词条组合触发器
  combos: [
    {
      requires: ['fire_body'],  // 需要玩家已有此标签
      event: 'dp_combo_fenjue_fire_body',  // 触发隐藏事件ID
      desc: '焚决+异火之体 → 解锁隐藏事件'
    }
  ],
  // ★ 新增：负面标签（高风险高回报）
  drawbacks: [
    { tag: 'demonic_corruption', category: 'status', chance: 0.15, desc: '15%概率走火入魔' }
  ]
}
```

### 2.2 词条组合化学反应表

```js
// themes/doupo.js - COMBO_EVENTS
var COMBO_EVENTS = [
  {
    id: 'dp_combo_fenjue_fire_body',
    requires: { talents: ['dp_t25', 'dp_t26'] },  // 焚决觉醒 + 异火之体
    trigger: 'onGameStart',  // 开局即触发
    event: {
      name: '焚决与异火之体的共鸣',
      desc: '焚决与你的异火体质产生共鸣，体内异火之力暴涨！',
      solutions: [
        { type: 'hardcode', cost: { lifespan: 20 }, outcome: { combat: 5000, tags: [['status','fire_surge']] } },
        { type: 'tag_check', tag: 'ice_extreme', cost: {}, outcome: { combat: 8000, desc: '冰属性克制，完美吸收' } },
        { type: 'sacrifice', item: 'soul_bone', cost: {}, outcome: { combat: 15000, tags: [['body','fire_god']] } },
      ]
    }
  },
  {
    id: 'dp_combo_guyu_innate10',
    requires: { talents: ['dp_t28'], innate: 10 },  // 古帝转世 + 天赋10
    trigger: 'onAge', age: 50,
    event: { name: '古帝意志觉醒', /* ... */ }
  }
];
```

### 2.3 词条Debuff绑定

```js
// 斗罗：至尊骨（未觉醒）
{
  id: 'dl_t_bone_unawakened',
  name: '至尊骨（未觉醒）',
  rarity: 'gold',
  desc: '蕴含至高力量，但引来觊觎',
  apply: function(g) { g.innate = Math.min(10, g.innate + 3); g.combat = Math.floor(g.combat * 1.5); },
  tags: { body: ['supreme_bone_unawakened'] },
  drawbacks: [
    { tag: 'bone_suppression', category: 'status', chance: 1.0, desc: '必定触发被追杀事件' },
    { tag: 'pursued_by_enemy', category: 'status', chance: 0.8, desc: '80%概率被敌对势力追杀' }
  ]
}
```

---

## 三、标签驱动的动态事件引擎 (Dynamic Event Engine)

### 3.1 新事件数据结构

```js
{
  // === 基础信息 ===
  id: 'dl_beast_ice_dragon',
  name: '遭遇万年冰龙',
  tier: 3,                    // 1-4 稀有度
  weight: 0.3,                // 基础权重
  maxCount: 2,                // 本局最多触发次数
  minAge: 30, maxAge: 10000,  // 年龄范围

  // === 触发条件（AND逻辑） ===
  cond: {
    tags: ['ice_extreme'],     // 需要拥有此标签（可选，空=不限）
    tagsNot: ['fire_body'],    // 不能拥有此标签（可选）
    level: { min: 40 },        // 等级要求
    combat: { min: 5000 },     // 战力要求
    items: ['soul_bone_head'], // 需要拥有某道具（可选）
    envTags: ['frost_age'],    // 需要环境标签（可选）
    custom: function(g, U) { return g.age > 30; }  // 自定义条件
  },

  // === 权重修正（根据标签/环境动态调整） ===
  weightMod: [
    { tag: 'ice_extreme', mod: 1.5 },      // 冰属性：遭遇冰龙概率+50%
    { tag: 'fire_body', mod: 0.3 },         // 火属性：概率降至30%
    { envTag: 'frost_age', mod: 2.0 },      // 极寒环境：概率翻倍
    { tag: 'beast_king', mod: 0.1 },        // 万兽之王：几乎不会遇到
  ],

  // === 多解法系统 ===
  solutions: [
    // 解法A：硬抗（默认，所有玩家可用）
    {
      type: 'hardcode',
      name: '正面迎战',
      desc: '以自身实力硬抗万年冰龙',
      cost: { combatPercent: 0.3 },  // 消耗30%当前战力
      successRate: function(g, U) {
        return Math.min(0.9, g.combat / 50000);  // 战力越高成功率越高
      },
      success: { combat: 8000, lifespan: -5, log: '浴血奋战击退冰龙，战力大增' },
      fail: { lifespan: -30, log: '不敌冰龙，重伤逃遁，寿元大损' }
    },
    // 解法B：标签克制
    {
      type: 'tag_check',
      tag: 'fire_extreme',
      name: '以火克冰',
      desc: '你的极致之冰武魂被冰龙认可',
      cost: {},
      successRate: 0.85,
      success: { combat: 12000, tags: [['memory','spared_ice_dragon']], log: '冰龙被你的冰之力折服，献上魂环' },
      fail: { combat: 2000, log: '冰龙识破伪装，暴怒攻击' }
    },
    // 解法C：献祭/消耗
    {
      type: 'sacrifice',
      item: 'soul_bone_trunk',
      name: '献祭魂骨',
      desc: '将躯干魂骨献祭给冰龙换取和平',
      cost: {},
      successRate: 1.0,  // 必定成功
      success: {
        combat: 25000,
        removeItem: 'soul_bone_trunk',
        tags: [['memory','sacrificed_bone_for_peace'], ['status','ice_dragon_ally']],
        log: '献祭魂骨，冰龙认你为友，赠予万年寒气'
      }
    },
    // 解法D：道具/策略
    {
      type: 'item_check',
      item: 'ice_talisman',
      name: '使用寒冰符',
      desc: '消耗寒冰符令冰龙沉睡',
      cost: { removeItem: 'ice_talisman' },
      successRate: 1.0,
      success: { combat: 5000, log: '寒冰符生效，冰龙陷入沉睡，你安全通过' }
    }
  ],

  // === 因果链：事后打标签 ===
  aftermath: {
    // 选择解法A且失败 → 打上"重伤"标签
    onFail: { tags: [['status', 'wounded']] },
    // 选择解法C → 打上"ice_dragon_ally"标签
    onSacrifice: { tags: [['memory', 'ice_dragon_ally']] }
  }
}
```

### 3.2 事件引擎改造（sim.js rollEvent 升级）

```js
function rollEvent(g, log) {
  var E = theme.EVENTS;
  var pool = [], mc = g.maxCount || (g.maxCount = {});

  for (var i = 0; i < E.length; i++) {
    var ev = E[i];

    // 基础过滤（保留原有逻辑）
    var maxN = ev.maxCount != null ? ev.maxCount : 100;
    var left = mc[ev.id] != null ? mc[ev.id] : maxN;
    if (left <= 0) continue;
    if (g.age < (ev.minAge || 0) || g.age > (ev.maxAge || 10000)) continue;

    // ★ 新增：标签条件检查
    if (ev.cond) {
      if (ev.cond.tags) {
        var hasAll = true;
        for (var t = 0; t < ev.cond.tags.length; t++) {
          if (!hasTag(g, ev.cond.tags[t])) { hasAll = false; break; }
        }
        if (!hasAll) continue;
      }
      if (ev.cond.tagsNot) {
        var hasNone = true;
        for (var t = 0; t < ev.cond.tagsNot.length; t++) {
          if (hasTag(g, ev.cond.tagsNot[t])) { hasNone = false; break; }
        }
        if (!hasNone) continue;
      }
      if (ev.cond.custom && !ev.cond.custom(g, U)) continue;
    }

    // ★ 新增：动态权重修正
    var finalWeight = ev.weight || 1;
    if (ev.weightMod) {
      for (var m = 0; m < ev.weightMod.length; m++) {
        var wm = ev.weightMod[m];
        if (wm.tag && hasTag(g, wm.tag)) finalWeight *= wm.mod;
        if (wm.envTag && hasTag(g, 'world_' + wm.envTag)) finalWeight *= wm.mod;
      }
    }

    pool.push({ ev: ev, weight: finalWeight });
  }

  if (!pool.length) return;

  // 加权随机选择
  var total = 0;
  for (var i = 0; i < pool.length; i++) total += pool[i].weight;
  var r = Math.random() * total, acc = 0, chosen = pool[0];
  for (var i = 0; i < pool.length; i++) {
    acc += pool[i].weight;
    if (r < acc) { chosen = pool[i]; break; }
  }

  var ev = chosen.ev;
  mc[ev.id] = (mc[ev.id] != null ? mc[ev.id] : (ev.maxCount || 100)) - 1;

  // ★ 新增：多解法选择
  if (ev.solutions && ev.solutions.length) {
    var sol = selectSolution(g, ev.solutions);
    executeSolution(g, log, ev, sol);
  } else {
    // 兼容旧事件格式
    var text = null;
    if (!ev.cond || (ev.cond.custom ? ev.cond.custom(g, U) : true)) {
      if (ev.ok) text = ev.ok(g, U, log);
    } else {
      if (ev.fail) text = ev.fail(g, U, log);
    }
    if (text) printlog(text);
  }
}

// ★ 选择最优解法（AI自动选择，也可改为UI选择）
function selectSolution(g, solutions) {
  // 按优先级：标签克制 > 道具 > 献祭 > 硬抗
  for (var i = 0; i < solutions.length; i++) {
    var s = solutions[i];
    if (s.type === 'tag_check' && hasTag(g, s.tag)) return s;
    if (s.type === 'item_check' && g.items && g.items.indexOf(s.item) >= 0) return s;
  }
  // 没有克制解法，优先献祭（如果道具充足）
  for (var i = 0; i < solutions.length; i++) {
    if (solutions[i].type === 'sacrifice') return solutions[i];
  }
  // 默认硬抗
  for (var i = 0; i < solutions.length; i++) {
    if (solutions[i].type === 'hardcode') return solutions[i];
  }
  return solutions[0];
}

function executeSolution(g, log, ev, sol) {
  var rate = typeof sol.successRate === 'function' ? sol.successRate(g, U) : sol.successRate;
  var success = Math.random() < rate;

  // 扣除代价
  if (sol.cost) {
    if (sol.cost.combatPercent) g.combat -= Math.floor(g.combat * sol.cost.combatPercent);
    if (sol.cost.lifespan) g.lifespan += sol.cost.lifespan;
    if (sol.cost.removeItem && g.items) {
      g.items = g.items.filter(function(it){ return it !== sol.removeItem; });
    }
  }

  var outcome = success ? sol.success : sol.fail;
  if (!outcome) return;

  // 应用结果
  if (outcome.combat) g.combat += outcome.combat;
  if (outcome.lifespan) g.lifespan += outcome.lifespan;
  if (outcome.removeTag) removeTag(g, outcome.removeTag[0], outcome.removeTag[1]);
  if (outcome.tags) {
    for (var i = 0; i < outcome.tags.length; i++) addTag(g, outcome.tags[i][0], outcome.tags[i][1]);
  }

  printlog((success ? '【成功】' : '【失败】') + ev.name + '：' + outcome.log);
}
```

---

## 四、环境系统与蝴蝶效应 (World Rules & Butterfly Effect)

### 4.1 环境标签生成

```js
// sim.js - 每年生成环境标签
function rollEnvironment(g) {
  // 清除去年环境标签
  g.tags.world = [];

  // 基础环境（每个主题不同）
  var envPool = theme.ENV_POOL || [];
  var envCount = U.irand(0, 2);  // 每年0-2个环境标签

  for (var i = 0; i < envCount; i++) {
    var env = envPool[Math.floor(Math.random() * envPool.length)];
    if (g.tags.world.indexOf(env.tag) < 0) {
      g.tags.world.push(env.tag);
    }
  }
}

// themes/doupo.js - 环境池
var ENV_POOL = [
  { tag: 'fire_storm', name: '异火暴动', desc: '天地间火元素暴动' },
  { tag: 'beast_tide', name: '兽潮月', desc: '魔兽大规模迁徙' },
  { tag: 'frost_age', name: '极寒之地', desc: '气温骤降' },
  { tag: 'pill_festival', name: '丹会期间', desc: '炼药师云集' },
  { tag: 'ancient_relic_open', name: '远古遗迹开启', desc: '空间裂缝出现' },
];
```

### 4.2 因果链系统

```js
// 标签作为因果链的载体
// A事件选择 → 打标签 → B事件检测标签 → 触发连锁

// 示例：斗罗 - 吸收魂兽血液 → 走火入魔链
{
  id: 'dl_absorb_beast_blood',
  name: '吸收高阶魂兽血液',
  solutions: [
    {
      type: 'hardcode',
      name: '强行吸收',
      success: {
        combat: 20000,
        tags: [['status', 'beast_blood_absorbed']],  // 因果标签
        log: '魂兽血液融入体内，力量暴涨！'
      }
    }
  ]
}

// 后续事件检测此标签：
{
  id: 'dl_demonic_corruption',
  name: '走火入魔',
  cond: { tags: ['beast_blood_absorbed'] },  // ★ 因果检测
  weightMod: [
    { tag: 'beast_blood_absorbed', mod: 3.0 },  // 有此标签：概率×3
  ],
  solutions: [
    { type: 'tag_check', tag: 'ice_extreme', name: '以冰镇压', successRate: 0.9, /* ... */ },
    { type: 'sacrifice', item: 'soul_bone_head', name: '献祭魂骨镇压', successRate: 1.0, /* ... */ },
    { type: 'hardcode', name: '硬抗', successRate: 0.3, /* ... */ }
  ]
}
```

### 4.3 NPC动态逻辑

```js
// NPC系统（简化版，挂载到主题）
var NPC_POOL = [
  {
    id: 'npc_alchemist_old',
    name: '神秘炼药老者',
    faction: 'pill_tower',
    needs: ['alchemy'],  // 需要玩家有炼药师标签
   好感度: 0,
    events: [
      {
        trigger: 'meet',  // 相遇时
        cond: { tags: ['alchemist'] },
        result: { 好感度: +10, giveItem: 'rare_pill_recipe' }
      },
      {
        trigger: 'request',  // 请求帮助时
        cond: { 好感度: { min: 30 } },
        result: { giveItem: 'soul_origin_talisman' }
      }
    ]
  }
];
```

---

## 五、四大主题实战案例

### 5.1 斗罗大陆：遭遇万年冰龙

```js
{
  id: 'dl_beast_ice_dragon',
  name: '遭遇万年冰龙',
  tier: 3, weight: 0.3, maxCount: 2, minAge: 30,
  cond: { level: { min: 40 } },
  weightMod: [
    { tag: 'ice_extreme', mod: 1.8 },   // 冰属性更容易遇到冰龙
    { tag: 'fire_extreme', mod: 0.2 },  // 火属性几乎不会遇到
    { envTag: 'frost_age', mod: 2.5 },  // 极寒环境概率大增
  ],
  solutions: [
    {
      type: 'tag_check', tag: 'ice_extreme',
      name: '以冰共鸣', desc: '你的极致之冰与冰龙产生共鸣',
      cost: {}, successRate: 0.9,
      success: { combat: 15000, tags: [['memory','ice_dragon_ally'],['body','ice_dragon_blood']],
                 log: '冰龙认可你的冰之力，赠予龙血，魂力暴涨！' },
      fail: { lifespan: -10, log: '共鸣失败，冰龙暴怒' }
    },
    {
      type: 'sacrifice', item: 'soul_bone_trunk',
      name: '献祭魂骨', desc: '将躯干魂骨献给冰龙',
      cost: {}, successRate: 1.0,
      success: { combat: 30000, removeItem: 'soul_bone_trunk',
                 tags: [['memory','sacrificed_bone'],['status','ice_dragon_debt']],
                 log: '献祭魂骨，冰龙大悦，赠予万年寒气！' }
    },
    {
      type: 'hardcode',
      name: '正面迎战', desc: '以自身实力硬抗',
      cost: { combatPercent: 0.4 }, successRate: function(g){ return Math.min(0.7, g.combat/80000); },
      success: { combat: 10000, log: '浴血奋战击退冰龙' },
      fail: { lifespan: -40, tags: [['status','wounded']], log: '不敌冰龙，重伤逃遁' }
    }
  ],
  aftermath: {
    onFail: { tags: [['status','wounded']] }  // 失败后：重伤标签影响后续事件
  }
}
```

**蝴蝶效应演示**：
- 选择解法C（献祭魂骨）→ 获得 `ice_dragon_debt` 标签 → 50岁触发隐藏事件"冰龙报恩"，赠予神级魂骨
- 选择解法A（硬抗）失败 → 获得 `wounded` 标签 → 下一年触发"被敌对宗门偷袭"事件
- 选择解法B（冰共鸣）成功 → 获得 `ice_dragon_blood` 标签 → 解锁"极致之冰进化"事件线

### 5.2 斗破苍穹：探索远古遗迹

```js
{
  id: 'dp_ancient_relic',
  name: '远古遗迹探索',
  tier: 3, weight: 0.25, maxCount: 3, minAge: 25,
  cond: { level: { min: 30 } },
  weightMod: [
    { envTag: 'ancient_relic_open', mod: 3.0 },  // 遗迹开启环境：概率×3
    { tag: 'alchemist', mod: 1.5 },              // 炼药师：更容易发现遗迹
  ],
  solutions: [
    {
      type: 'tag_check', tag: 'fire',
      name: '异火焚阵', desc: '用异火焚毁遗迹封印阵法',
      cost: {}, successRate: 0.85,
      success: { combat: 18000, addItem: 'ancient_pill_recipe',
                 tags: [['memory','destroyed_relic_seal']],
                 log: '异火焚毁封印，发现上古炼药秘籍！' },
      fail: { lifespan: -15, log: '阵法反噬，受伤退出' }
    },
    {
      type: 'tag_check', tag: 'alchemist',
      name: '炼药解封', desc: '以炼药术解开遗迹禁制',
      cost: {}, successRate: 0.75,
      success: { combat: 12000, addItem: 'soul_origin_herb',
                 tags: [['npc_ally','relic_guardian']],
                 log: '炼药术解开禁制，遗迹守护者现身，赠予本源灵药' },
      fail: { log: '禁制未能解开' }
    },
    {
      type: 'hardcode',
      name: '强行闯入', desc: '以战力硬闯',
      cost: { combatPercent: 0.5 }, successRate: function(g){ return Math.min(0.6, g.combat/60000); },
      success: { combat: 8000, log: '强行闯入，获得少量资源' },
      fail: { lifespan: -25, tags: [['status','relic_curse']], log: '触发遗迹诅咒，寿元大损' }
    }
  ]
}
```

### 5.3 完美世界：敌对天才截杀

```js
{
  id: 'wm_ambush_genius',
  name: '敌对天才截杀',
  tier: 3, weight: 0.3, maxCount: 2, minAge: 20,
  cond: { level: { min: 30 } },
  weightMod: [
    { tag: 'supreme_bone', mod: 2.0 },     // 至尊骨：更容易被截杀
    { tag: 'huo_clan', mod: 0.5 },          // 火国：截杀概率低
  ],
  solutions: [
    {
      type: 'tag_check', tag: 'supreme_bone',
      name: '至尊骨反杀', desc: '至尊骨觉醒，反杀截杀者',
      cost: {}, successRate: 0.8,
      success: { combat: 25000,
                 tags: [['status','supreme_bone_awakened'],['memory','killed_rival_genius']],
                 log: '至尊骨觉醒！一击反杀，震惊全场！' },
      fail: { lifespan: -20, log: '至尊骨觉醒失败' }
    },
    {
      type: 'tag_check', tag: 'space_rune',
      name: '空间逃遁', desc: '利用空间符文传送逃离',
      cost: {}, successRate: 0.95,
      success: { tags: [['memory','fled_from_ambush'],['status','noticed_by_big_shot']],
                 log: '空间符文启动，传送逃离！但空间波动引来大能注意...' },
      fail: { log: '空间符文被封锁' }
    },
    {
      type: 'hardcode',
      name: '正面迎战', desc: '以实力硬抗',
      cost: { combatPercent: 0.4 }, successRate: function(g){ return Math.min(0.6, g.combat/50000); },
      success: { combat: 15000, log: '苦战击退截杀者' },
      fail: { lifespan: -30, tags: [['status','wounded']], log: '不敌，重伤逃遁' }
    }
  ],
  aftermath: {
    // 选择空间逃遁 → "被大能注意到" → 后续触发"大能收徒"事件
    onSpecial: { condition: 'space_rune', tags: [['status','noticed_by_big_shot']] }
  }
}
```

### 5.4 末日：避难所危机

```js
{
  id: 'dm_shelter_crisis',
  name: '避难所资源危机',
  tier: 2, weight: 0.4, maxCount: 3, minAge: 10,
  cond: {},
  weightMod: [
    { envTag: 'famine', mod: 2.0 },         // 饥荒环境：概率×2
    { tag: 'suspicion_level_2', mod: 1.5 }, // 被怀疑：更容易触发
  ],
  solutions: [
    {
      type: 'tag_check', tag: 'plant_gene',
      name: '植物伪装', desc: '用植物异能伪装成补给',
      cost: {}, successRate: 0.9,
      success: { tags: [['status','shelter_hero']],
                 log: '植物异能变出食物，化解危机，成为避难所英雄！' },
      fail: { tags: [['status','suspicion_level_2']], log: '伪装被识破，被怀疑是异类' }
    },
    {
      type: 'tag_check', tag: 'space_ability',
      name: '空间转移', desc: '用空间异能从外部搬运物资',
      cost: {}, successRate: 0.85,
      success: { tags: [['status','shelter_hero']],
                 log: '空间异能转移大量物资，众人感激' },
      fail: { tags: [['status','suspicion_level_2']], log: '空间波动被监测到，被怀疑' }
    },
    {
      type: 'hardcode',
      name: '硬扛', desc: '带领众人搜刮废墟',
      cost: { lifespan: -10 }, successRate: 0.5,
      success: { tags: [['status','shelter_hero']], log: '搜刮成功，勉强渡过危机' },
      fail: { tags: [['status','suspicion_level_2'],['status','starving']],
              log: '搜刮失败，有人饿死，你被推上审判台' }
    }
  ],
  aftermath: {
    // 被怀疑标签 → 后续触发"被驱逐"事件链
    onFail: { tags: [['status','suspicion_level_2']] }
  }
}
```

---

## 六、技术落地路径

### 6.1 改造优先级

| 阶段 | 改造内容 | 影响文件 | 工作量 |
|------|----------|----------|--------|
| P0 | g.tags 系统 + hasTag/addTag 工具函数 | sim.js | 小 |
| P1 | 词条数据结构升级（tags/combos/drawbacks） | themes/*.js | 中 |
| P2 | 事件引擎改造（cond.tags + weightMod + solutions） | sim.js + themes/*.js | 大 |
| P3 | 环境标签系统 | sim.js + themes/*.js | 中 |
| P4 | 因果链（aftermath标签传递） | sim.js | 小 |
| P5 | NPC系统 | themes/*.js | 中 |

### 6.2 向后兼容

- 旧格式事件（`cond: function`, `ok/fail`）**完全保留**，新引擎优先检查 `ev.solutions`，没有则走旧逻辑
- 旧格式词条（只有 `apply`）**完全保留**，新引擎检查 `ev.tags`，没有则跳过标签注入
- `g.tags` 初始为空对象，不影响旧数据

### 6.3 性能考量

- 标签存储为字符串数组，查询复杂度 O(n)，n 通常 < 20，无性能问题
- 环境标签每年重新生成，不累积
- `weightMod` 在事件池筛选时一次性计算，不影响主循环
