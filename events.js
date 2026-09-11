/* ============================================================
 * 末日模拟器 · 随机事件（独立文件，创作者可自由扩展）
 *
 * 如何添加新事件：在 EVENTS 数组末尾 push 一个对象，字段：
 *   id    事件唯一标识（字符串）
 *   name  事件名（展示用，如 '搜刮物资'）
 *   tier  稀有度：1普通 / 2中级 / 3稀有 / 4传说（决定奖励档次与日志颜色）
 *   weight 触发权重（越大越常出现；当前按 1普通=6 / 2中级=0.7 / 3稀有=0.2 / 4传说=0.08）
 *   minAge/maxAge 年龄上下限（玩家年龄不在该区间则该事件不参与抽取，默认 minAge=0 / maxAge=10000）
 *   cond  触发条件函数 cond(g) -> bool，null 表示无条件
 *   ok    条件达成奖励 ok(g, U) -> 返回结果文本字符串（无返回则无事发生）
 *   fail  条件未达成惩罚 fail(g, U) -> 返回结果文本字符串
 *
 * U 是引擎注入的工具对象，提供：
 *   U.rand(a,b) / U.irand(a,b) / U.round(x)
 *   U.combatGain(aptitude,newLvl) 突破加战力  U.lifespanGain(newLvl) 突破加寿命
 *   U.gainLevels(g,n) 事件直接加等级（满级后每级+10000战力）
 *   U.evCombat(g, minPct, maxPct, floor) 事件战力增益 = 当前战力×比例（保底 floor）
 *   U.breakChance(aptitude,lvl) 突破概率  U.DATA 数据常量（含 tierName 天赋档字母）
 *
 * 奖励与 tier 匹配：普通事件小收益，稀有/传说事件才有大奖励与天赋提升。
 * 数组按 tier 从高到低排序（传说→稀有→中级→普通），便于阅读与维护。
 * ============================================================ */
(function (root) {
	var EVENTS = [

		/* ---------- tier 4 传说 ---------- */
		{
			id: 'reawaken',
			weight: 0.15,
			maxCount: 2,
			name: '异能二次觉醒',
			tier: 4,
			desc: '沉寂多年的异能基因突然发生二次觉醒',
			minAge: 12,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(50, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U, log) {
					var lf = U.irand(4, 8);
					g.lifespan += lf;
					/* 天赋提升前已是满档（10）则额外固定多升一级 */
					var fullBefore = g.aptitude >= 10;
					/* 天赋提升按原始档：<6 +1~3；6-8 +1~2；9 +1；10 不提升 */
					var inc = g.innate < 6 ? U.irand(1, 3) : (g.innate <= 8 ? U.irand(1, 2) : (g.innate === 9 ? 1 : 0));
					var up = null;
					if (inc > 0 && g.aptitude < 10) {
						up = g.aptitude + inc;
						if (up > 10) up = 10;
						g.aptitude = up;
					}
					var lvGain = U.irand(1, 3);
					if (fullBefore) lvGain += 1;
					U.printlog('异能二次觉醒，寿命+' + lf + (up ? '，天赋提升至 ' + U.DATA.tierName(up) + '！' : '') + ',实力也大幅精进');
					U.gainLevels(g, lvGain, log);
				},
			fail:
				function (g, U) {
					var lf = U.irand(2, 4);
					g.lifespan -= lf;
					U.printlog('觉醒失控，基因反噬，寿命 -' + lf);
				}
		},
		{
			id: 'twinawaken',
			weight: 0.05,
			maxCount: 1,
			name: '双生异能觉醒',
			tier: 4,
			desc: '你意外觉醒了自己的双生异能',
			minAge: 6,
			maxAge: 12,
			cond:
				function (g) {
					return g.innate <= 6;   /* 仅天赋档 ≤6 可触发；>6 不触发 */
				},
			ok:
				function (g, U, log) {
					var n = U.drawHighAbility(g);   /* 从天赋7-10异能组抽取并替换异能/天赋档 */
					var lf = U.irand(4, 8);
					g.lifespan += lf;
					U.printlog('觉醒双生异能『' + n.ability + '』！天赋提升至 ' + U.DATA.tierName(n.innate) + '，寿命+' + lf + '，实力也大幅精进');
					U.gainLevels(g, U.irand(1, 3), log);
				},
			fail: null   /* 不会失败：天赋>6 不触发，≤6 必成功 */
		},
		{
			id: 'deadzone',
			weight: 0.3,
			maxCount: 1,
			name: '死疫禁区',
			tier: 4,
			desc: '闯入被变异体盘踞的死疫禁区，浴血搏杀',
			minAge: 30,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.combat > U.testCombat(8, g.age, 20, 15) || g.lvl > U.testLv(8, g.age, 20, 15);
				},
			ok:
				function (g, U, log) {
					var c = U.evCombat(g, 0.1, 0.2, 2000);
					g.combat += c;
					U.printlog('在死疫禁区杀出重围，战力额外+' + c + ',实力也大幅提升');
					U.gainLevels(g, U.irand(1, 3), log);
				},
			fail:
				function (g, U) {
					g.dead = true;
					U.printlog('实力不足，惨死于死疫禁区');
				}
		},
		{
			id: 'serum',
			weight: 0.3,
			maxCount: 1,
			name: '获得进化血清',
			tier: 4,
			desc: '意外寻得一支高纯度进化血清，可激发潜能',
			minAge: 0,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U, log) {
					var lf = U.irand(8, 12);
					g.lifespan += lf;
					var up = null;
					if (g.aptitude < 10) {
						up = g.aptitude + U.irand(1, 3);
						if(up < 6){
							up = 6;
						}
						if (up > 10) up = 10;
						g.aptitude = up;
					}
					U.printlog('注射进化血清，细胞重组，寿命+' + lf + (up ? '，天赋提升至 ' + U.DATA.tierName(up) + '！' : ''));
					U.gainLevels(g, U.irand(1, 3), log);
				},
			fail: null
		},
		{
			id: 'marrow',
			weight: 0.7,
			maxCount: 2,
			name: '能量灵髓',
			tier: 4,
			desc: '偶得一罐能量灵髓，可强化异能回路',
			minAge: 0,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U, log) {
					var lf = U.irand(7, 10);
					g.lifespan += lf;
					var up = null;
					if (g.aptitude < 10) {
						up = g.aptitude + U.irand(1, 2);
						if(up < 5){
							up = 5;
						}
						if (up > 10) up = 10;
						g.aptitude = up;
					}
					U.printlog('吸收能量灵髓，寿命+' + lf + (up ? '，天赋提升至 ' + U.DATA.tierName(up) + '！' : '') + '实力也有所精进');
					U.gainLevels(g, U.irand(2, 3), log);
				},
			fail: null
		},
		{
			id: 'subdue',
			weight: 0.5,
			maxCount: 5,
			name: '讨伐S级变异体',
			tier: 4,
			desc: '听说有一头S级变异体在附近活动，你打算参与对其的清剿',
			minAge: 30,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= 80 || g.combat >= 30000;
				},
			ok:
				function (g, U, log) {
					var c = U.evCombat(g, 0.1, 0.15, 2000);
					g.combat += c;
					U.printlog('你击杀了S级变异体，获得了大量资源，战力+' + c + '，实力也得到提升');
					U.gainLevels(g, U.irand(1, 2), log);
				},
			fail:
				function (g, U) {
					if (g.lvl < 60 && g.combat < 15000) {
						U.printlog('实力不足，你放弃了这次清剿');
						return;
					}
					/* 50% 侥幸逃跑、有所领悟；否则受重创扣寿命 */
					if (Math.random() < 0.5) {
						var c = U.evCombat(g, 0.025, 0.5, 400);
						g.combat += c;
						U.printlog('清剿失败，但侥幸逃脱，没有受伤，还有所领悟，战力+' + c);
					} else {
						var lf = U.irand(3, 7);
						g.lifespan -= lf;
						U.printlog('清剿失败，你受到重创，寿命 -' + lf);
					}
				}
		},
		/* ---------- tier 3 稀有 ---------- */
		{
			id: 'arena',
			weight: 2,
			maxCount: 3,
			name: '幸存者竞技赛',
			tier: 3,
			desc: '参加营地五年一遇的异能者竞技赛',
			minAge: 15,
			maxAge: 30,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(40, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U, log) {
					var c = U.evCombat(g, 0.075, 0.15, 1500);
					g.combat += c;
					U.printlog('竞技夺魁，战力+' + c + ',实力也有所精进');
					U.gainLevels(g, U.irand(1, 2), log);
				},
			fail:
				function (g, U) {
					var lf = U.irand(2, 4);
					g.lifespan -= lf;
					U.printlog('竞技受挫重伤，寿命 -' + lf);
				}
		},
		{
			id: 'ruins',
			weight: 2,
			maxCount: 5,
			name: '废墟遗址',
			tier: 3,
			desc: '潜入废弃研究所，偶遇前文明遗留的强化装置',
			minAge: 0,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U, log) {
					var c = U.evCombat(g, 0.05, 0.1, 1250);
					g.combat += c;
					var lf = U.irand(2, 6);
					g.lifespan += lf;
					U.printlog('激活强化装置，战力+' + c + '，寿命+' + lf);
					U.gainLevels(g, U.irand(1, 2), log);
				},
			fail: null
		},
		{
			id: 'crystal',
			weight: 1,
			maxCount: 5,
			name: '获得异能结晶',
			tier: 3,
			desc: '击杀变异体后意外获得一块异能结晶',
			minAge: 0,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(35, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U, log) {
					var c = U.evCombat(g, 0.05, 0.125, 1500);
					g.combat += c;
					U.printlog('吸收珍贵异能结晶，战力+' + c);
					U.gainLevels(g, U.irand(1, 2), log);
				},
			fail:
				function (g, U) {
					var lf = U.irand(3, 5);
					g.lifespan -= lf;
					U.printlog('结晶被军阀抢走，还把你打成重伤，寿命 -' + lf);
				}
		},
		{
			id: 'insight',
			weight: 1,
			maxCount: 5,
			name: '异能顿悟',
			tier: 3,
			desc: '深夜冥想，顿悟异能运用之理',
			minAge: 0,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U, log) {
					var c = U.evCombat(g, 0.05, 0.1, 1000);
					g.combat += c;
					var lf = U.irand(3, 7);
					g.lifespan += lf;
					U.printlog('冥想顿悟，战力+' + c + '，寿命+' + lf);
					U.gainLevels(g, 1, log);
				},
			fail: null
		},
		{
			id: 'potion',
			weight: 1,
			maxCount: 3,
			name: '强化药剂',
			tier: 3,
			desc: '寻得一剂可提升天赋档的强化药剂',
			minAge: 0,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U, log) {
					if (g.aptitude <= 6) {
						var up = g.aptitude + U.irand(1, 2);
						if (up > 10) up = 10;
						g.aptitude = up;
						U.printlog('注射强化药剂，天赋提升至 ' + U.DATA.tierName(up) + '！');
						return;
					}
					U.printlog('注射强化药剂，可惜天赋深厚无益，只感修为有所提升');
					U.gainLevels(g, 1, log);
				},
			fail: null
		},
		{
			id: 'notes',
			weight: 1,
			maxCount: 3,
			name: '异能笔记',
			tier: 3,
			desc: '拾得一份可提升天赋档的异能者笔记',
			minAge: 0,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U, log) {
					if (g.aptitude <= 8) {
						var up = g.aptitude + 1;
						if (up > 10) up = 10;
						g.aptitude = up;
						U.printlog('研读异能笔记，茅塞顿开，天赋提升至 ' + U.DATA.tierName(up) + '！');
						return;
					}
					U.printlog('研读异能笔记，可惜收获甚微，只感修为有所精进');
					U.gainLevels(g, 1, log);
				},
			fail: null
		},

		/* ---------- tier 2 中级 ---------- */
		{
			id: 'legacy',
			weight: 5,
			maxCount: 5,
			name: '前辈遗泽',
			tier: 2,
			desc: '一位老异能者的遗愿指引你接收传承',
			minAge: 0,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(25, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U, log) {
					if (g.lvl < 99) {
						U.printlog('继承前辈遗泽，获益良多');
						U.gainLevels(g, 1, log);
						return;
					}
					var c2 = U.evCombat(g, 0.04, 0.08, 750);
					g.combat += c2;
					U.printlog('继承前辈遗泽，战力+' + c2);
				},
			fail:
				function (g, U) {
					var lf = U.irand(2, 4);
					g.lifespan -= lf;
					U.printlog('传承失控，异能反噬，寿命 -' + lf);
				}
		},
		{
			id: 'bandits',
			weight: 5,
			maxCount: 10,
			name: '劫掠者袭击',
			tier: 2,
			desc: '遭遇一大群劫掠者袭击',
			minAge: 12,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(40, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U) {
					var c = U.evCombat(g, 0.03, 0.06, 500);
					g.combat += c;
					U.printlog('反杀劫掠者，端了他们的仓库，战力+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(1, 3);
					g.lifespan -= lf;
					U.printlog('被劫掠者打成重伤，寿命 -' + lf);
				}
		},
		{
			id: 'warlord',
			weight: 5,
			maxCount: 5,
			name: '军阀冲突',
			tier: 2,
			desc: '军阀势力飞扬跋扈，与你发生冲突，你惨遭追杀',
			minAge: 12,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(30, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U) {
					var c = U.evCombat(g, 0.025, 0.05, 500);
					g.combat += c;
					U.printlog('反杀军阀分子，夺得大量物资和档案，战力+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(3, 5);
					g.lifespan -= lf;
					U.printlog('被军阀分子重创，寿命 -' + lf);
				}
		},
		{
			id: 'swarm',
			weight: 5,
			maxCount: 10,
			name: '变异潮来袭',
			tier: 2,
			desc: '变异体大潮席卷营地',
			minAge: 0,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(25, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U) {
					var c = U.evCombat(g, 0.02, 0.045, 350);
					g.combat += c;
					U.printlog('击退变异潮，战斗中有所领悟，战力+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(3, 6);
					g.lifespan -= lf;
					U.printlog('被变异潮吞没，重伤，寿命 -' + lf);
				}
		},
		{
			id: 'combatinsight',
			weight: 5,
			maxCount: 50,
			name: '领悟异能运用',
			tier: 2,
			desc: '生死磨砺，一朝领悟更强的异能运用',
			minAge: 0,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(30, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U) {
					var c = U.evCombat(g, 0.015, 0.03, 250);
					g.combat += c;
					U.printlog('领悟异能运用，战力+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(2, 4);
					g.lifespan -= lf;
					U.printlog('强行运转异能反噬自身，寿命 -' + lf);
				}
		},
		{
			id: 'mission',
			weight: 5,
			maxCount: 5,
			name: '秘密任务',
			tier: 2,
			desc: '有异能者邀请你参加一场秘密任务',
			minAge: 0,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(30, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U, log) {
					var c = U.evCombat(g, 0.01, 0.02, 200);
					g.combat += c;
					U.printlog('被选中参加秘密任务，获得大量奖励，战力+' + c);
					if (g.lvl < 50 && Math.random() < 0.5) {
						U.printlog('任务中，你遇到额外机缘，大有收益');
						U.gainLevels(g, 1, log);
					}
				},
			fail:
				function (g, U) {
					var c = U.evCombat(g, 0.003, 0.005, 50);
					g.combat += c;
					U.printlog('对方没有看上你，但念你有潜力，指点了几句，战力+' + c);
				}
		},

		/* ---------- tier 1 普通 ---------- */
		{
			id: 'cull',
			weight: 20,
			maxCount: 100,
			name: '清剿变异体',
			tier: 1,
			desc: '清剿游荡的变异体',
			minAge: 30,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(25, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U) {
					var c = U.evCombat(g, 0.005, 0.01, 150);
					g.combat += c;
					U.printlog('搏杀变异体，战力+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(2, 4);
					g.lifespan -= lf;
					U.printlog('险些被变异体撕碎，寿命 -' + lf);
				}
		},
		{
			id: 'scavenge',
			weight: 10,
			maxCount: 20,
			name: '搜刮物资',
			tier: 1,
			desc: '深入废墟搜刮物资，偶遇游荡变异体',
			minAge: 20,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(15, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U) {
					var c = U.evCombat(g, 0.003, 0.006, 50);
					g.combat += c;
					var lf = U.irand(1, 2);
					g.lifespan += lf;
					U.printlog('搜得能量补充剂，寿命+' + lf + '，战力+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(1, 3);
					g.lifespan -= lf;
					U.printlog('被变异体所伤，仓皇而逃，寿命 -' + lf);
				}
		},
		{
			id: 'spar',
			weight: 20,
			maxCount: 100,
			name: '幸存者切磋',
			tier: 1,
			desc: '与同龄幸存者切磋较量',
			minAge: 12,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(10, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U) {
					var c = U.evCombat(g, 0.004, 0.007, 75);
					g.combat += c;
					U.printlog('切磋获胜，战力+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(1, 2);
					g.lifespan -= lf;
					U.printlog('切磋落败受创，寿命 -' + lf);
				}
		},
		{
			id: 'epiphany',
			weight: 20,
			maxCount: 100,
			name: '略有感悟',
			tier: 1,
			desc: '修炼异能中，略有感悟',
			minAge: 0,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U) {
					var c = U.evCombat(g, 0.003, 0.005, 50);
					g.combat += c;
					U.printlog('战力+' + c);
				},
			fail: null
		},
		{
			id: 'ev_shelter',
			weight: 1.0,
			maxCount: 3,
			name: '避难所搜刮',
			tier: 1,
			desc: '在废弃避难所中搜刮物资',
			minAge: 5,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U) {
					var r = U.combatGain(g.aptitude, g.lvl);
					var add = Math.floor(r * U.rand(0.3, 0.8));
					g.combat += add;
					var lf = U.irand(1, 3); g.lifespan += lf;
					return '避难所搜刮收获，战力+' + add + '，寿元+' + lf;
				},
			fail: null
		},
		{
			id: 'ev_mutbeast',
			weight: 0.9,
			maxCount: 5,
			name: '变异兽搏杀',
			tier: 1,
			desc: '遭遇变异兽搏杀',
			minAge: 8,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U) {
					var r = U.combatGain(g.aptitude, g.lvl);
					var add = Math.floor(r * U.rand(0.4, 1.0));
					g.combat += add;
					return '搏杀变异兽，战力+' + add;
				},
			fail:
				function (g, U) {
					g.lifespan -= U.irand(1, 3);
					return '变异兽搏杀受创，寿元受损';
				}
		},
		{
			id: 'ev_military',
			weight: 0.7,
			maxCount: 3,
			name: '军方救援',
			tier: 1,
			desc: '军方救援队到来',
			minAge: 5,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U) {
					var r = U.combatGain(g.aptitude, g.lvl);
					var add = Math.floor(r * U.rand(0.5, 1.2));
					g.combat += add;
					var lf = U.irand(1, 2); g.lifespan += lf;
					return '军方救援队支援，获得物资，战力+' + add + '，寿元+' + lf;
				},
			fail: null
		},
		{
			id: 'ev_blackmarket',
			weight: 0.6,
			maxCount: 3,
			name: '黑市交易',
			tier: 1,
			desc: '在黑市交换变异材料',
			minAge: 12,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U) {
					var r = U.combatGain(g.aptitude, g.lvl);
					var add = Math.floor(r * U.rand(0.3, 0.7));
					g.combat += add;
					var lf = U.irand(1, 2); g.lifespan += lf;
					return '黑市交易获得变异材料，战力+' + add + '，寿元+' + lf;
				},
			fail: null
		},
		{
			id: 'ev_survivor',
			weight: 0.8,
			maxCount: 3,
			name: '幸存者营地',
			tier: 1,
			desc: '在幸存者营地中休整',
			minAge: 5,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U) {
					var r = U.combatGain(g.aptitude, g.lvl);
					var add = Math.floor(r * U.rand(0.3, 0.6));
					g.combat += add;
					var lf = U.irand(2, 4); g.lifespan += lf;
					return '幸存者营地休整，恢复状态，战力+' + add + '，寿元+' + lf;
				},
			fail: null
		},

		/* ====== 扩展事件（末日主题追加） ====== */

		/* ---------- tier 4 传说 ---------- */
		{
			id: 'ev_prophecy',
			weight: 0.1,
			maxCount: 1,
			name: '进化预言',
			tier: 4,
			desc: '传说末日方舟留有进化预言，只有强者能解读',
			minAge: 30,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 70; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(2.0, 3.5));
				g.combat += add;
				var lf = U.irand(8, 14); g.lifespan += lf;
				U.gainLevels(g, U.irand(1, 3), log);
				return '解读进化预言，洞悉进化之理，战力+' + add + '，寿元+' + lf + '，实力大幅精进';
			},
			fail: function (g, U) {
				var lf = U.irand(4, 8); g.lifespan -= lf;
				return '预言反噬神识，寿元-' + lf;
			}
		},
		{
			id: 'ev_inherit',
			weight: 0.2,
			maxCount: 1,
			name: '异能传承',
			tier: 4,
			desc: '末日前辈的异能传承降临于你',
			minAge: 20,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 50; },
			ok: function (g, U, log) {
				var up = null;
				if (g.aptitude < 10) {
					up = g.aptitude + U.irand(1, 2);
					if (up > 10) up = 10;
					g.aptitude = up;
				}
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(1.5, 2.5));
				g.combat += add;
				var lf = U.irand(6, 10); g.lifespan += lf;
				U.gainLevels(g, U.irand(1, 2), log);
				return '承接异能传承' + (up ? '，天赋提升至 ' + U.DATA.tierName(up) + '！' : '') + '，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(3, 6); g.lifespan -= lf;
				return '传承失控，寿元-' + lf;
			}
		},
		{
			id: 'ev_ark',
			weight: 0.08,
			maxCount: 1,
			name: '末日方舟',
			tier: 4,
			desc: '传说中末日方舟的入口在你面前开启',
			minAge: 40,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 85 || g.combat >= 50000; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(3.0, 5.0));
				g.combat += add;
				var lf = U.irand(10, 18); g.lifespan += lf;
				U.gainLevels(g, U.irand(2, 4), log);
				return '登上末日方舟，获得前文明传承，战力+' + add + '，寿元+' + lf + '，实力飞跃';
			},
			fail: function (g, U) {
				g.dead = true;
				return '实力不足，被方舟结界吞噬，不幸陨落';
			}
		},

		/* ---------- tier 3 稀有 ---------- */
		{
			id: 'ev_serumlab',
			weight: 0.8,
			maxCount: 2,
			name: '血清研究所',
			tier: 3,
			desc: '潜入末日血清研究所，搜寻进化血清',
			minAge: 15,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 35; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(1.0, 2.0));
				g.combat += add;
				var lf = U.irand(4, 8); g.lifespan += lf;
				U.gainLevels(g, U.irand(1, 2), log);
				return '获得高纯度进化血清，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(3, 6); g.lifespan -= lf;
				return '血清注射失败，副作用反噬，寿元-' + lf;
			}
		},
		{
			id: 'ev_beastking',
			weight: 0.7,
			maxCount: 2,
			name: '变异兽王',
			tier: 3,
			desc: '一头变异兽王在附近出没，你决定挑战它',
			minAge: 20,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 40; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(1.2, 2.2));
				g.combat += add;
				var lf = U.irand(3, 7); g.lifespan += lf;
				U.gainLevels(g, 1, log);
				return '击杀变异兽王，汲取其基因之力，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(4, 8); g.lifespan -= lf;
				return '被变异兽王重创，寿元-' + lf;
			}
		},
		{
			id: 'ev_secondmut',
			weight: 0.6,
			maxCount: 2,
			name: '二次变异体',
			tier: 3,
			desc: '遭遇罕见的二次变异体，它体内蕴含进化因子',
			minAge: 18,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 38; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(1.0, 1.8));
				g.combat += add;
				var lf = U.irand(3, 6); g.lifespan += lf;
				U.gainLevels(g, 1, log);
				return '击杀二次变异体，吸收其变异因子，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(3, 7); g.lifespan -= lf;
				return '被二次变异体感染，寿元-' + lf;
			}
		},
		{
			id: 'ev_duelist',
			weight: 1.0,
			maxCount: 3,
			name: '异能者对决',
			tier: 3,
			desc: '一位异能者向你发起生死对决',
			minAge: 15,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 35; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.8, 1.6));
				g.combat += add;
				var lf = U.irand(2, 5); g.lifespan += lf;
				U.gainLevels(g, 1, log);
				return '击败异能者，夺取其异能精粹，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(3, 6); g.lifespan -= lf;
				return '对决落败，寿元-' + lf;
			}
		},
		{
			id: 'ev_warlordboss',
			weight: 0.9,
			maxCount: 2,
			name: '军阀头目',
			tier: 3,
			desc: '军阀头目率队来袭，你决定正面迎战',
			minAge: 18,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 38; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(1.0, 1.8));
				g.combat += add;
				var lf = U.irand(2, 6); g.lifespan += lf;
				U.gainLevels(g, U.irand(1, 2), log);
				return '斩杀军阀头目，缴获大量军用物资，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(4, 8); g.lifespan -= lf;
				return '被军阀头目重创，寿元-' + lf;
			}
		},
		{
			id: 'ev_genememory',
			weight: 0.8,
			maxCount: 2,
			name: '基因记忆觉醒',
			tier: 3,
			desc: '体内沉睡的前文明基因记忆开始觉醒',
			minAge: 16,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 36; },
			ok: function (g, U, log) {
				var up = null;
				if (g.aptitude < 10) {
					up = g.aptitude + 1;
					g.aptitude = up;
				}
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.8, 1.5));
				g.combat += add;
				var lf = U.irand(3, 7); g.lifespan += lf;
				U.gainLevels(g, 1, log);
				return '基因记忆觉醒' + (up ? '，天赋提升至 ' + U.DATA.tierName(up) + '！' : '') + '，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(2, 5); g.lifespan -= lf;
				return '记忆冲击神识，寿元-' + lf;
			}
		},

		/* ---------- tier 2 中级 ---------- */
		{
			id: 'ev_generecomb',
			weight: 3,
			maxCount: 3,
			name: '基因重组实验',
			tier: 2,
			desc: '发现前文明遗留的基因重组装置',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 25; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.5, 1.2));
				g.combat += add;
				var lf = U.irand(2, 5); g.lifespan += lf;
				U.gainLevels(g, 1, log);
				return '基因重组成功，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(2, 4); g.lifespan -= lf;
				return '基因重组失败，反噬自身，寿元-' + lf;
			}
		},
		{
			id: 'ev_mutstorm',
			weight: 4,
			maxCount: 5,
			name: '异变风暴',
			tier: 2,
			desc: '异变风暴席卷而来，蕴含变异能量',
			minAge: 10,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 22; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.4, 1.0));
				g.combat += add;
				var lf = U.irand(1, 4); g.lifespan += lf;
				return '在异变风暴中吸收能量，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(2, 5); g.lifespan -= lf;
				return '被异变风暴所伤，寿元-' + lf;
			}
		},
		{
			id: 'ev_radzone',
			weight: 4,
			maxCount: 5,
			name: '辐射区探索',
			tier: 2,
			desc: '潜入辐射区搜寻变异材料',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 25; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.5, 1.0));
				g.combat += add;
				var lf = U.irand(1, 3); g.lifespan += lf;
				return '辐射区探索收获颇丰，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(2, 4); g.lifespan -= lf;
				return '遭受辐射伤害，寿元-' + lf;
			}
		},
		{
			id: 'ev_evolvmut',
			weight: 3,
			maxCount: 3,
			name: '进化因子突变',
			tier: 2,
			desc: '体内进化因子发生良性突变',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 28; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.5, 1.1));
				g.combat += add;
				var lf = U.irand(2, 4); g.lifespan += lf;
				U.gainLevels(g, 1, log);
				return '进化因子突变，战力+' + add + '，寿元+' + lf + '，实力精进';
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '突变失控，寿元-' + lf;
			}
		},
		{
			id: 'ev_campbuild',
			weight: 5,
			maxCount: 5,
			name: '营地建设',
			tier: 2,
			desc: '协助幸存者营地建设防御工事',
			minAge: 10,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 20; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.3, 0.8));
				g.combat += add;
				var lf = U.irand(2, 5); g.lifespan += lf;
				return '营地建设获得酬谢，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '营地建设中受伤，寿元-' + lf;
			}
		},
		{
			id: 'ev_convoy',
			weight: 5,
			maxCount: 5,
			name: '商队护送',
			tier: 2,
			desc: '护送商队穿越危险区域',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 22; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.4, 0.9));
				g.combat += add;
				var lf = U.irand(1, 4); g.lifespan += lf;
				return '商队护送成功，获得丰厚报酬，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(2, 4); g.lifespan -= lf;
				return '商队遇袭，仓皇护送受伤，寿元-' + lf;
			}
		},
		{
			id: 'ev_refugee',
			weight: 5,
			maxCount: 5,
			name: '难民救援',
			tier: 2,
			desc: '一群难民遭遇变异体围攻，你出手相救',
			minAge: 10,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 20; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.3, 0.7));
				g.combat += add;
				var lf = U.irand(1, 4); g.lifespan += lf;
				return '救下难民，获得感恩回馈，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '救援中受创，寿元-' + lf;
			}
		},
		{
			id: 'ev_campalliance',
			weight: 4,
			maxCount: 3,
			name: '营地联盟',
			tier: 2,
			desc: '多个幸存者营地结成联盟，共抗变异潮',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 25; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.4, 0.9));
				g.combat += add;
				var lf = U.irand(2, 5); g.lifespan += lf;
				return '营地联盟共享资源，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '联盟破裂，冲突中受伤，寿元-' + lf;
			}
		},

		/* ---------- tier 1 普通 ---------- */
		{
			id: 'ev_shelterbuild',
			weight: 10,
			maxCount: 10,
			name: '避难所建设',
			tier: 1,
			desc: '参与地下避难所的扩建工程',
			minAge: 8,
			maxAge: 10000,
			cond: null,
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.3, 0.7));
				g.combat += add;
				var lf = U.irand(1, 3); g.lifespan += lf;
				return '参与避难所建设获得酬劳，战力+' + add + '，寿元+' + lf;
			},
			fail: null
		},
		{
			id: 'ev_survivorcouncil',
			weight: 8,
			maxCount: 5,
			name: '幸存者大会',
			tier: 1,
			desc: '参加幸存者大会，交流生存经验',
			minAge: 10,
			maxAge: 10000,
			cond: null,
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.2, 0.5));
				g.combat += add;
				var lf = U.irand(1, 2); g.lifespan += lf;
				return '幸存者大会交流心得，战力+' + add + '，寿元+' + lf;
			},
			fail: null
		},
		{
			id: 'ev_warlordbattle',
			weight: 8,
			maxCount: 5,
			name: '军阀大战',
			tier: 1,
			desc: '卷入两方军阀混战',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 15; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.4, 0.8));
				g.combat += add;
				return '军阀大战中渔翁得利，战力+' + add;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '军阀大战中被波及受伤，寿元-' + lf;
			}
		},
		{
			id: 'ev_mutnest',
			weight: 9,
			maxCount: 5,
			name: '变异体巢穴',
			tier: 1,
			desc: '清剿一处变异体巢穴',
			minAge: 10,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 15; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.4, 0.9));
				g.combat += add;
				var lf = U.irand(1, 2); g.lifespan += lf;
				return '清剿变异体巢穴，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '巢穴中有强敌，仓皇撤退，寿元-' + lf;
			}
		},
		{
			id: 'ev_deepdeadzone',
			weight: 7,
			maxCount: 3,
			name: '死疫禁区深处',
			tier: 1,
			desc: '深入死疫禁区外围搜寻物资',
			minAge: 15,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 18; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.5, 1.0));
				g.combat += add;
				var lf = U.irand(1, 3); g.lifespan += lf;
				return '死疫禁区外围收获稀有材料，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(2, 4); g.lifespan -= lf;
				return '死疫禁区感染疫毒，寿元-' + lf;
			}
		},
		{
			id: 'ev_undershelter',
			weight: 10,
			maxCount: 10,
			name: '地下避难所',
			tier: 1,
			desc: '在地下避难所中休整并搜寻物资',
			minAge: 5,
			maxAge: 10000,
			cond: null,
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.3, 0.6));
				g.combat += add;
				var lf = U.irand(1, 3); g.lifespan += lf;
				return '地下避难所休整补给，战力+' + add + '，寿元+' + lf;
			},
			fail: null
		},
		{
			id: 'ev_abandonedlab',
			weight: 8,
			maxCount: 5,
			name: '废弃实验室',
			tier: 1,
			desc: '潜入废弃实验室搜刮研究资料',
			minAge: 10,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 12; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.3, 0.7));
				g.combat += add;
				var lf = U.irand(1, 2); g.lifespan += lf;
				return '实验室搜得研究资料，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 2); g.lifespan -= lf;
				return '实验室残余毒气伤身，寿元-' + lf;
			}
		},
		{
			id: 'ev_raddeep',
			weight: 8,
			maxCount: 5,
			name: '辐射区深处',
			tier: 1,
			desc: '深入辐射区深处搜寻高纯度变异材料',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 15; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.4, 0.8));
				g.combat += add;
				var lf = U.irand(1, 2); g.lifespan += lf;
				return '辐射区深处收获高纯材料，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '辐射过量为患，寿元-' + lf;
			}
		},
		{
			id: 'ev_mutforest',
			weight: 9,
			maxCount: 5,
			name: '异变森林',
			tier: 1,
			desc: '穿越异变森林，猎杀变异生物',
			minAge: 8,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 12; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.3, 0.7));
				g.combat += add;
				var lf = U.irand(1, 2); g.lifespan += lf;
				return '异变森林猎杀变异生物，战力+' + add + '，寿元+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 2); g.lifespan -= lf;
				return '异变森林遇险受伤，寿元-' + lf;
			}
		}
	];

	if (typeof module !== 'undefined' && module.exports) module.exports = EVENTS;
	root.EVENTS = EVENTS;
})(typeof self !== 'undefined' ? self : this);
