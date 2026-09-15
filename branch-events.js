/* Open-world route events shared by all four themes.  The rules live here so
 * each theme gets the same decision contract while keeping its own fiction. */
(function (root) {
  var THEMES = root.THEMES || {};
  var COPY = {
    doomsday: {
      order: '幸存者联盟', dark: '掠夺者血盟', wild: '禁区流浪者',
      legacy: '旧时代进化遗产', crisis: '死疫禁区的分岔路',
      righteous: '庇护城之主', evil: '灾厄吞噬者', rogue: '虚空行者'
    },
    douluo: {
      order: '正道宗门', dark: '邪魂师血盟', wild: '星斗流浪者',
      legacy: '远古魂兽遗藏', crisis: '神考前的魂兽潮',
      righteous: '光明之神', evil: '罗刹魔神', rogue: '万兽之神'
    },
    doupo: {
      order: '中州名门', dark: '黑角域血契', wild: '独行炼药师',
      legacy: '古帝洞府残篇', crisis: '虚空裂缝的选择',
      righteous: '守序斗帝', evil: '吞天邪帝', rogue: '无相古帝'
    },
    wanmei: {
      order: '石国道统', dark: '黑暗古地', wild: '九天十地散修',
      legacy: '仙古遗种传承', crisis: '黑暗动乱的关口',
      righteous: '苍生仙帝', evil: '黑暗仙帝', rogue: '逍遥仙帝'
    }
  };

  function addAchievement(theme, id, name, bonus) {
    for (var i = 0; i < theme.ACHIEVEMENTS.length; i++) {
      if (theme.ACHIEVEMENTS[i].id === id) return;
    }
    theme.ACHIEVEMENTS.push({ id: id, name: name, bonus: bonus });
  }

  function install(theme) {
    if (!theme || !theme.EVENTS || theme._branchEventsInstalled) return;
    theme._branchEventsInstalled = true;
    var c = COPY[theme.id] || COPY.doomsday;
    var prefix = 'route_' + theme.id + '_';

    var originalYear = theme.terms.year;
    var lateStories = {
      neutral: [
        '你在瓶颈中重新审视自己的根基，发现真正的敌人并不在眼前。',
        '你走遍旧日战场，试图从前人的失败中找出破局的一线生机。',
        '你在古籍中发现一段被遗忘的修炼法门，尝试融合进自己的体系。',
        '你独自闭关参悟天地法则，隐约触摸到了更高层次的门槛。',
        '你在一场意外中救下一位濒死的散修，从他的遗物中获得关键线索。',
        '你感应到远方传来古老的召唤，似乎有什么东西在等待你去发现。',
        '你在修炼中陷入短暂的走火入魔，险些毁掉多年根基，幸而及时醒悟。',
        '你与一位隐世强者切磋百招，虽败犹荣，对武道的理解更进一步。',
        '你在一处远古遗迹中发现前人留下的修炼笔记，字字珠玑令你茅塞顿开。',
        '你决定暂时放下修炼，游历四方，在红尘中打磨心境。'
      ],
      righteous: [
        '你在守护与责任之间寻找答案，身后的人让这条路不再只是修炼。',
        '你主持一场跨势力谈判，短暂的和平换来了难得的悟道时刻。',
        '你带领弟子们抵御外敌入侵，守护了整座城池的安宁。',
        '你在灾年开仓放粮，百姓的感激化作纯净的信仰之力涌入体内。',
        '你与志同道合的伙伴结成同盟，共同抵御黑暗势力的侵蚀。',
        '你在守护百姓的过程中领悟了「仁者无敌」的真谛，修为突飞猛进。',
        '你化解了一场宗门内乱，以德服人赢得了各方势力的尊重。',
        '你在战场上身先士卒，以一人之力击退了敌方先锋部队。',
        '你建立了一座学院，培养新一代魂师，传承正义的火种。',
        '你在绝境中为了保护同伴爆发出超越极限的力量，突破了修炼瓶颈。'
      ],
      evil: [
        '你在禁忌力量的回响中听见敌人的名字，下一次突破将以代价换取。',
        '黑暗势力向你献上新的筹码，你必须决定自己还愿意失去什么。',
        '你吞噬了一位强者的残魂，禁忌之力在体内疯狂增长。',
        '你在暗处布局多年，终于将一个强大的敌人逼入绝境。',
        '你以鲜血为引，强行催动禁忌功法，修为暴涨但身体开始出现异变。',
        '你收服了一头远古凶兽作为战力，它的暴戾之气让你变得更强也更危险。',
        '你在一场暗杀中活了下来，从此变得更加冷酷无情。',
        '你发现了一个被封印的远古秘境，其中蕴含着足以颠覆格局的力量。',
        '你以雷霆手段清洗了内部的叛徒，从此无人敢挑战你的权威。',
        '你在禁忌祭坛前献祭了一部分灵魂，换取了短暂但恐怖的爆发力。'
      ],
      rogue: [
        '你穿过无人记录的边境，异域法则在体内留下了一道新的可能。',
        '你拒绝所有既定答案，在未知道路上发现了比境界更重要的自由。',
        '你在一座废弃的神殿中发现了一种全新的修炼体系，与你所知截然不同。',
        '你独自深入禁区探险，带回了一件足以改变战局的远古宝物。',
        '你遇到了一位来自异域的旅者，从他口中听到了另一个世界的故事。',
        '你在一场混战中浑水摸鱼，趁乱夺取了珍贵的修炼资源。',
        '你创造了一套独属于自己的功法，虽然粗糙但潜力无穷。',
        '你在荒野中与一头神秘巨兽对峙，最终以智取胜获得其认可。',
        '你游走于各大势力之间，利用信息差为自己谋取最大利益。',
        '你在一次濒死体验中看到了世界的底层法则，从此修炼不再拘泥于传统。'
      ]
    };
    theme.terms.yearFor = function (g) {
      if (!g || g.lvl < 70) return originalYear(g ? g.age : 0);
      var route = lateStories[g.alignment] || lateStories.neutral;
      var idx = Math.floor(Math.random() * route.length);
      return '第' + g.age + (theme.terms.ageUnit || '岁') + '，' + route[idx];
    };

    addAchievement(theme, 'route_righteous', '守序传承', 0.15);
    addAchievement(theme, 'route_evil', '邪道称尊', 0.15);
    addAchievement(theme, 'route_rogue', '独断万古', 0.15);
    addAchievement(theme, 'route_ascend', '异路成' + (theme.terms.ascend || '神'), 0.25);
    addAchievement(theme, 'choice_master', '命运抉择', 0.1);

    var events = [
      {
        id: prefix + 'faction', weight: 7, maxCount: 2, name: '命运的邀约', tier: 2,
        desc: '三股势力同时向你伸出手：加入他们，或把自己的命运握在手中。',
        minAge: 10, maxAge: 65,
        cond: function (g) { return g.lvl >= 12; },
        choices: [
          { id: 'order', label: '加入' + c.order, detail: '获得稳定资源，声望提升，成长更稳。',
            apply: function (g, U) {
              U.choosePath(g, 'righteous', 'sanctuary', 15, c.order);
              g.lifespan += U.irand(3, 7); U.gainLevels(g, U.irand(1, 2));
              return '你接受' + c.order + '的庇护，以守护众生为誓，根基与声望同步增长。';
            } },
          { id: 'dark', label: '签下' + c.dark, detail: '高风险高收益，可能更快突破，但会损耗寿元。', risk: '邪力反噬概率上升',
            apply: function (g, U) {
              U.choosePath(g, 'evil', 'blood_oath', -10, c.dark);
              g.corruption = (g.corruption || 0) + 1; g.lifespan -= U.irand(2, 6);
              g.combat += U.evCombat(g, 0.08, 0.18, 20); U.gainLevels(g, 1);
              return '你以血为契换来禁忌力量，修为陡增，却也在体内埋下了反噬的种子。';
            } },
          { id: 'wild', label: '成为' + c.wild, detail: '不受势力约束，事件更随机，保留最多可能性。',
            apply: function (g, U) {
              U.choosePath(g, 'rogue', 'wanderer', 0, c.wild);
              g.luckBonus = (g.luckBonus || 0) + 1; g.lifespan += 2;
              return '你拒绝了所有旗帜，独自踏上未知道路。世界从此向你开放，也更加危险。';
            } }
        ]
      },
      {
        id: prefix + 'legacy', weight: 5, maxCount: 2, name: c.legacy, tier: 3,
        desc: '遗迹深处的力量可以改变你的道路，但每一份力量都要求代价。',
        minAge: 22, maxAge: 10000,
        cond: function (g) { return g.lvl >= 35; },
        choices: [
          { id: 'study', label: '完整研习传承', detail: '稳定提升实力，并强化当前阵营。',
            apply: function (g, U) {
              U.setFlag(g, 'legacyStudied');
              if (g.alignment === 'neutral') U.choosePath(g, 'righteous', 'scholar', 5, c.order);
              g.lifespan += U.irand(5, 10); U.gainLevels(g, U.irand(1, 3));
              return '你耐心拆解遗迹传承，将危险力量化为自己的根基。';
            } },
          { id: 'devour', label: '吞噬核心力量', detail: '立即获得大量战力，失败可能重伤甚至死亡。', risk: '12% 反噬概率',
            apply: function (g, U) {
              U.choosePath(g, 'evil', 'devourer', -12, c.dark);
              if (Math.random() < 0.12) { g.dead = true; g.deathReason = 'legacyBacklash'; return '你强行吞噬核心，禁忌力量在体内失控，肉身被反噬崩解。'; }
              g.corruption = (g.corruption || 0) + 2; g.combat += U.evCombat(g, 0.35, 0.75, 500);
              U.gainLevels(g, U.irand(1, 3));
              return '你将遗迹核心一口吞下，力量暴涨，连天地规则都开始畏惧你的气息。';
            } },
          { id: 'release', label: '放走守护者', detail: '放弃眼前暴利，换取长期机缘与隐藏声望。',
            apply: function (g, U) {
              U.choosePath(g, 'rogue', 'guardian', 20, c.wild); U.setFlag(g, 'savedGuardian');
              g.lifespan += U.irand(10, 18); g.routePower = (g.routePower || 0) + 0.12;
              return '你没有夺走遗迹的心脏。守护者消失前留下坐标，未来仍有一条未被看见的路。';
            } }
        ]
      },
      {
        id: prefix + 'bottleneck', weight: 4, maxCount: 2, name: c.crisis, tier: 3,
        desc: '修炼停在关键瓶颈。继续闭关未必有用，真正的突破来自你如何面对世界。',
        minAge: 48, maxAge: 10000,
        cond: function (g) { return g.lvl >= 70; },
        choices: [
          { id: 'protect', label: '守住身后的人', detail: '获得稳定成长与守序声望。',
            apply: function (g, U) {
              U.choosePath(g, 'righteous', 'guardian', 25, c.order); g.lifespan += U.irand(8, 15);
              g.combat += U.evCombat(g, 0.12, 0.25, 1000); U.gainLevels(g, 1);
              return '你没有把瓶颈交给漫长闭关，而是在守护中悟出新的力量。';
            } },
          { id: 'slaughter', label: '以强敌血祭瓶颈', detail: '最快的成长路线，代价是声望与寿元。', risk: '15% 走火入魔',
            apply: function (g, U) {
              U.choosePath(g, 'evil', 'slaughter', -25, c.dark);
              if (Math.random() < 0.15) { g.dead = true; g.deathReason = 'cultivationDeviation'; return '你以杀意冲击瓶颈，反被无边心魔吞没。'; }
              g.corruption = (g.corruption || 0) + 2; g.lifespan -= U.irand(5, 12);
              g.combat += U.evCombat(g, 0.45, 0.9, 3000); U.gainLevels(g, U.irand(1, 3));
              return '你以强敌之血叩开瓶颈，力量来得迅猛而冰冷，连旧日盟友也开始畏惧你。';
            } },
          { id: 'void', label: '踏入未知裂隙', detail: '随机获得稀有收益，也可能错过现有路线。', risk: '结果完全随机',
            apply: function (g, U) {
              U.choosePath(g, 'rogue', 'voidwalker', 0, c.wild);
              if (Math.random() < 0.55) { g.combat += U.evCombat(g, 0.25, 0.6, 2000); U.gainLevels(g, 2); return '裂隙尽头不是虚无，而是一片无人知晓的道场。你带着异界法则归来。'; }
              g.lifespan -= U.irand(3, 9); g.luckBonus = (g.luckBonus || 0) + 2;
              return '裂隙将你抛回现实，虽然遍体鳞伤，但你看见了未来某个可能的自己。';
            } }
        ]
      },
      {
        id: prefix + 'ascension', weight: 8, maxCount: 1, name: '成' + (theme.terms.ascend || '神') + '前的抉择', tier: 4,
        desc: '巅峰之门已经出现。你要继承旧秩序、吞噬旧秩序，还是拒绝所有既定答案？',
        minAge: 65, maxAge: 10000,
        cond: function (g) { return g.lvl >= 88 && !g.routeReady; },
        choices: [
          { id: 'inherit', label: '继承正统传承', detail: '成' + (theme.terms.ascend || '神') + '时获得更稳定的成功率。',
            apply: function (g, U) { U.choosePath(g, 'righteous', 'sanctuary', 30, c.order); U.setFlag(g, 'routeReady', 'inherit'); g.ascendBonus = (g.ascendBonus || 0) + 0.08; return '你接受正统传承，准备以守护之名冲击最后的境界。'; } },
          { id: 'usurp', label: '夺取禁忌王座', detail: '成' + (theme.terms.ascend || '神') + '更快，但会承担更高反噬风险。', risk: '成' + (theme.terms.ascend || '神') + '失败会损耗寿元',
            apply: function (g, U) { U.choosePath(g, 'evil', 'blood_oath', -30, c.dark); U.setFlag(g, 'routeReady', 'usurp'); g.ascendBonus = (g.ascendBonus || 0) + 0.12; g.corruption = (g.corruption || 0) + 2; return '你撕碎王座原主的神格，将禁忌王冠戴在自己头上。'; } },
          { id: 'rewrite', label: '拒绝既定神路', detail: '开启独立路线，收益和结局更不可预测。',
            apply: function (g, U) { U.choosePath(g, 'rogue', 'voidwalker', 10, c.wild); U.setFlag(g, 'routeReady', 'rewrite'); g.ascendBonus = (g.ascendBonus || 0) + 0.05; g.routePower = (g.routePower || 0) + 0.2; return '你拒绝成为任何人的继承者，决定让自己的选择写下新的世界规则。'; } }
        ]
      }
    ];
    theme.EVENTS = theme.EVENTS.concat(events);
    theme.EVENT_CHANCE = Math.max(theme.EVENT_CHANCE || 0, 0.48);

    var hooks = theme.hooks || (theme.hooks = {});
    hooks.tryRouteAscend = function (g, log, U, helpers) {
      if (!g.routeReady || g.lvl < 90 || g.alignment === 'neutral') return false;
      if (g.lvl < 99 && Math.random() > 0.035) return false;
      var chance = 0.12 + (g.ascendBonus || 0) + Math.min(0.1, (g.routePower || 0) * 0.1);
      if (g.alignment === 'righteous') chance += 0.05;
      if (g.alignment === 'evil') chance += 0.08;
      if (Math.random() >= Math.min(0.65, chance)) {
        g.lifespan -= g.alignment === 'evil' ? 4 : 2;
        log.push({ cls: 'ev3', text: '第' + g.age + '岁，' + (g.alignment === 'evil' ? '禁忌力量反噬' : '独立神路震荡') + '，成境尝试暂未成功。' });
        return false;
      }
      var title = g.alignment === 'evil' ? c.evil : (g.alignment === 'righteous' ? c.righteous : c.rogue);
      g.ascended = true; g.lvl = theme.terms.godLevel || 100; g.ascendMode = 'route';
      g.routeName = title; g.godName = title; g._godName = title; g.lifespan = 99999;
      g.combat = helpers.godCombat(g.combat, g.alignment === 'evil' ? 7 : 5);
      log.push({ cls: 'god', text: '第' + g.age + '岁，你选择的道路抵达终点：' + title + '！不依附单一正邪答案，属于你的' + (theme.terms.ascend || '成神') + '传奇由此诞生。' });
      return true;
    };
  }

  for (var id in THEMES) install(THEMES[id]);
  root.BranchEvents = { install: install };
})(typeof self !== 'undefined' ? self : this);
