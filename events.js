/* ============================================================
 * 鏈棩妯℃嫙鍣? 路 闅忔満浜嬩欢锛堢嫭绔嬫枃浠讹紝鍒涗綔鑰呭彲鑷敱鎵╁睍锛?
 *
 * 濡備綍娣诲姞鏂颁簨浠讹細鍦? EVENTS 鏁扮粍鏈熬 push 涓?涓璞★紝瀛楁锛?
 *   id    浜嬩欢鍞竴鏍囪瘑锛堝瓧绗︿覆锛?
 *   name  浜嬩欢鍚嶏紙灞曠ず鐢紝濡? '鎼滃埉鐗╄祫'锛?
 *   tier  绋?鏈夊害锛?1鏅?? / 2涓骇 / 3绋?鏈? / 4浼犺锛堝喅瀹氬鍔辨。娆′笌鏃ュ織棰滆壊锛?
 *   weight 瑙﹀彂鏉冮噸锛堣秺澶ц秺甯稿嚭鐜帮紱褰撳墠鎸? 1鏅??=6 / 2涓骇=0.7 / 3绋?鏈?=0.2 / 4浼犺=0.08锛?
 *   minAge/maxAge 骞撮緞涓婁笅闄愶紙鐜╁骞撮緞涓嶅湪璇ュ尯闂村垯璇ヤ簨浠朵笉鍙備笌鎶藉彇锛岄粯璁? minAge=0 / maxAge=10000锛?
 *   cond  瑙﹀彂鏉′欢鍑芥暟 cond(g) -> bool锛宯ull 琛ㄧず鏃犳潯浠?
 *   ok    鏉′欢杈炬垚濂栧姳 ok(g, U) -> 杩斿洖缁撴灉鏂囨湰瀛楃涓诧紙鏃犺繑鍥炲垯鏃犱簨鍙戠敓锛?
 *   fail  鏉′欢鏈揪鎴愭儵缃? fail(g, U) -> 杩斿洖缁撴灉鏂囨湰瀛楃涓?
 *
 * U 鏄紩鎿庢敞鍏ョ殑宸ュ叿瀵硅薄锛屾彁渚涳細
 *   U.rand(a,b) / U.irand(a,b) / U.round(x)
 *   U.combatGain(aptitude,newLvl) 绐佺牬鍔犳垬鍔?  U.lifespanGain(newLvl) 绐佺牬鍔犲鍛?
 *   U.gainLevels(g,n) 浜嬩欢鐩存帴鍔犵瓑绾э紙婊＄骇鍚庢瘡绾?+10000鎴樺姏锛?
 *   U.evCombat(g, minPct, maxPct, floor) 浜嬩欢鎴樺姏澧炵泭 = 褰撳墠鎴樺姏脳姣斾緥锛堜繚搴? floor锛?
 *   U.breakChance(aptitude,lvl) 绐佺牬姒傜巼  U.DATA 鏁版嵁甯搁噺锛堝惈 tierName 澶╄祴妗ｅ瓧姣嶏級
 *
 * 濂栧姳涓? tier 鍖归厤锛氭櫘閫氫簨浠跺皬鏀剁泭锛岀█鏈?/浼犺浜嬩欢鎵嶆湁澶у鍔变笌澶╄祴鎻愬崌銆?
 * 鏁扮粍鎸? tier 浠庨珮鍒颁綆鎺掑簭锛堜紶璇粹啋绋?鏈夆啋涓骇鈫掓櫘閫氾級锛屼究浜庨槄璇讳笌缁存姢銆?
 * ============================================================ */
(function (root) {
	var EVENTS = [

		/* ---------- tier 4 浼犺 ---------- */
		{
			id: 'reawaken',
			weight: 0.15,
			maxCount: 2,
			name: '寮傝兘浜屾瑙夐啋',
			tier: 4,
			desc: '娌夊瘋澶氬勾鐨勫紓鑳藉熀鍥犵獊鐒跺彂鐢熶簩娆¤閱?',
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
					/* 澶╄祴鎻愬崌鍓嶅凡鏄弧妗ｏ紙10锛夊垯棰濆鍥哄畾澶氬崌涓?绾? */
					var fullBefore = g.aptitude >= 10;
					/* 澶╄祴鎻愬崌鎸夊師濮嬫。锛?<6 +1~3锛?6-8 +1~2锛?9 +1锛?10 涓嶆彁鍗? */
					var inc = g.innate < 6 ? U.irand(1, 3) : (g.innate <= 8 ? U.irand(1, 2) : (g.innate === 9 ? 1 : 0));
					var up = null;
					if (inc > 0 && g.aptitude < 10) {
						up = g.aptitude + inc;
						if (up > 10) up = 10;
						g.aptitude = up;
					}
					var lvGain = U.irand(1, 3);
					if (fullBefore) lvGain += 1;
					U.printlog('寮傝兘浜屾瑙夐啋锛屽鍛?+' + lf + (up ? '锛屽ぉ璧嬫彁鍗囪嚦 ' + U.DATA.tierName(up) + '锛?' : '') + ',瀹炲姏涔熷ぇ骞呯簿杩?');
					U.gainLevels(g, lvGain, log);
				},
			fail:
				function (g, U) {
					var lf = U.irand(2, 4);
					g.lifespan -= lf;
					U.printlog('瑙夐啋澶辨帶锛屽熀鍥犲弽鍣紝瀵垮懡 -' + lf);
				}
		},
		{
			id: 'twinawaken',
			weight: 0.05,
			maxCount: 1,
			name: '鍙岀敓寮傝兘瑙夐啋',
			tier: 4,
			desc: '浣犳剰澶栬閱掍簡鑷繁鐨勫弻鐢熷紓鑳?',
			minAge: 6,
			maxAge: 12,
			cond:
				function (g) {
					return g.innate <= 6;   /* 浠呭ぉ璧嬫。 鈮?6 鍙Е鍙戯紱>6 涓嶈Е鍙? */
				},
			ok:
				function (g, U, log) {
					var n = U.drawHighAbility(g);   /* 浠庡ぉ璧?7-10寮傝兘缁勬娊鍙栧苟鏇挎崲寮傝兘/澶╄祴妗? */
					var lf = U.irand(4, 8);
					g.lifespan += lf;
					U.printlog('瑙夐啋鍙岀敓寮傝兘銆?' + n.ability + '銆忥紒澶╄祴鎻愬崌鑷? ' + U.DATA.tierName(n.innate) + '锛屽鍛?+' + lf + '锛屽疄鍔涗篃澶у箙绮捐繘');
					U.gainLevels(g, U.irand(1, 3), log);
				},
			fail: null   /* 涓嶄細澶辫触锛氬ぉ璧?>6 涓嶈Е鍙戯紝鈮?6 蹇呮垚鍔? */
		},
		{
			id: 'deadzone',
			weight: 0.3,
			maxCount: 1,
			name: '姝荤柅绂佸尯',
			tier: 4,
			desc: '闂叆琚彉寮備綋鐩樿笧鐨勬鐤鍖猴紝娴磋鎼忔潃',
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
					U.printlog('鍦ㄦ鐤鍖烘潃鍑洪噸鍥达紝鎴樺姏棰濆+' + c + ',瀹炲姏涔熷ぇ骞呮彁鍗?');
					U.gainLevels(g, U.irand(1, 3), log);
				},
			fail:
				function (g, U) {
					g.dead = true;
					U.printlog('瀹炲姏涓嶈冻锛屾儴姝讳簬姝荤柅绂佸尯');
				}
		},
		{
			id: 'serum',
			weight: 0.3,
			maxCount: 1,
			name: '鑾峰緱杩涘寲琛?娓?',
			tier: 4,
			desc: '鎰忓瀵诲緱涓?鏀珮绾害杩涘寲琛?娓咃紝鍙縺鍙戞綔鑳?',
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
					U.printlog('娉ㄥ皠杩涘寲琛?娓咃紝缁嗚優閲嶇粍锛屽鍛?+' + lf + (up ? '锛屽ぉ璧嬫彁鍗囪嚦 ' + U.DATA.tierName(up) + '锛?' : ''));
					U.gainLevels(g, U.irand(1, 3), log);
				},
			fail: null
		},
		{
			id: 'marrow',
			weight: 0.7,
			maxCount: 2,
			name: '鑳介噺鐏甸珦',
			tier: 4,
			desc: '鍋跺緱涓?缃愯兘閲忕伒楂擄紝鍙己鍖栧紓鑳藉洖璺?',
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
					U.printlog('鍚告敹鑳介噺鐏甸珦锛屽鍛?+' + lf + (up ? '锛屽ぉ璧嬫彁鍗囪嚦 ' + U.DATA.tierName(up) + '锛?' : '') + '瀹炲姏涔熸湁鎵?绮捐繘');
					U.gainLevels(g, U.irand(2, 3), log);
				},
			fail: null
		},
		{
			id: 'subdue',
			weight: 0.5,
			maxCount: 5,
			name: '璁ㄤ紣S绾у彉寮備綋',
			tier: 4,
			desc: '鍚鏈変竴澶碨绾у彉寮備綋鍦ㄩ檮杩戞椿鍔紝浣犳墦绠楀弬涓庡鍏剁殑娓呭壙',
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
					U.printlog('浣犲嚮鏉?浜哠绾у彉寮備綋锛岃幏寰椾簡澶ч噺璧勬簮锛屾垬鍔?+' + c + '锛屽疄鍔涗篃寰楀埌鎻愬崌');
					U.gainLevels(g, U.irand(1, 2), log);
				},
			fail:
				function (g, U) {
					if (g.lvl < 60 && g.combat < 15000) {
						U.printlog('瀹炲姏涓嶈冻锛屼綘鏀惧純浜嗚繖娆℃竻鍓?');
						return;
					}
					/* 50% 渚ュ垢閫冭窇銆佹湁鎵?棰嗘偀锛涘惁鍒欏彈閲嶅垱鎵ｅ鍛? */
					if (Math.random() < 0.5) {
						var c = U.evCombat(g, 0.025, 0.5, 400);
						g.combat += c;
						U.printlog('娓呭壙澶辫触锛屼絾渚ュ垢閫冭劚锛屾病鏈夊彈浼わ紝杩樻湁鎵?棰嗘偀锛屾垬鍔?+' + c);
					} else {
						var lf = U.irand(3, 7);
						g.lifespan -= lf;
						U.printlog('娓呭壙澶辫触锛屼綘鍙楀埌閲嶅垱锛屽鍛? -' + lf);
					}
				}
		},
		/* ---------- tier 3 绋?鏈? ---------- */
		{
			id: 'arena',
			weight: 2,
			maxCount: 3,
			name: '骞稿瓨鑰呯珵鎶?璧?',
			tier: 3,
			desc: '鍙傚姞钀ュ湴浜斿勾涓?閬囩殑寮傝兘鑰呯珵鎶?璧?',
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
					U.printlog('绔炴妧澶洪瓉锛屾垬鍔?+' + c + ',瀹炲姏涔熸湁鎵?绮捐繘');
					U.gainLevels(g, U.irand(1, 2), log);
				},
			fail:
				function (g, U) {
					var lf = U.irand(2, 4);
					g.lifespan -= lf;
					U.printlog('绔炴妧鍙楁尗閲嶄激锛屽鍛? -' + lf);
				}
		},
		{
			id: 'ruins',
			weight: 2,
			maxCount: 5,
			name: '搴熷閬楀潃',
			tier: 3,
			desc: '娼滃叆搴熷純鐮旂┒鎵?锛屽伓閬囧墠鏂囨槑閬楃暀鐨勫己鍖栬缃?',
			minAge: 0,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U, log) {
					var c = U.evCombat(g, 0.05, 0.1, 1250);
					g.combat += c;
					var lf = U.irand(2, 6);
					g.lifespan += lf;
					U.printlog('婵?娲诲己鍖栬缃紝鎴樺姏+' + c + '锛屽鍛?+' + lf);
					U.gainLevels(g, U.irand(1, 2), log);
				},
			fail: null
		},
		{
			id: 'crystal',
			weight: 1,
			maxCount: 5,
			name: '鑾峰緱寮傝兘缁撴櫠',
			tier: 3,
			desc: '鍑绘潃鍙樺紓浣撳悗鎰忓鑾峰緱涓?鍧楀紓鑳界粨鏅?',
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
					U.printlog('鍚告敹鐝嶈吹寮傝兘缁撴櫠锛屾垬鍔?+' + c);
					U.gainLevels(g, U.irand(1, 2), log);
				},
			fail:
				function (g, U) {
					var lf = U.irand(3, 5);
					g.lifespan -= lf;
					U.printlog('缁撴櫠琚啗闃?鎶㈣蛋锛岃繕鎶婁綘鎵撴垚閲嶄激锛屽鍛? -' + lf);
				}
		},
		{
			id: 'insight',
			weight: 1,
			maxCount: 5,
			name: '寮傝兘椤挎偀',
			tier: 3,
			desc: '娣卞鍐ユ兂锛岄】鎮熷紓鑳借繍鐢ㄤ箣鐞?',
			minAge: 0,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U, log) {
					var c = U.evCombat(g, 0.05, 0.1, 1000);
					g.combat += c;
					var lf = U.irand(3, 7);
					g.lifespan += lf;
					U.printlog('鍐ユ兂椤挎偀锛屾垬鍔?+' + c + '锛屽鍛?+' + lf);
					U.gainLevels(g, 1, log);
				},
			fail: null
		},
		{
			id: 'potion',
			weight: 1,
			maxCount: 3,
			name: '寮哄寲鑽墏',
			tier: 3,
			desc: '瀵诲緱涓?鍓傚彲鎻愬崌澶╄祴妗ｇ殑寮哄寲鑽墏',
			minAge: 0,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U, log) {
					if (g.aptitude <= 6) {
						var up = g.aptitude + U.irand(1, 2);
						if (up > 10) up = 10;
						g.aptitude = up;
						U.printlog('娉ㄥ皠寮哄寲鑽墏锛屽ぉ璧嬫彁鍗囪嚦 ' + U.DATA.tierName(up) + '锛?');
						return;
					}
					U.printlog('娉ㄥ皠寮哄寲鑽墏锛屽彲鎯滃ぉ璧嬫繁鍘氭棤鐩婏紝鍙劅淇负鏈夋墍鎻愬崌');
					U.gainLevels(g, 1, log);
				},
			fail: null
		},
		{
			id: 'notes',
			weight: 1,
			maxCount: 3,
			name: '寮傝兘绗旇',
			tier: 3,
			desc: '鎷惧緱涓?浠藉彲鎻愬崌澶╄祴妗ｇ殑寮傝兘鑰呯瑪璁?',
			minAge: 0,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U, log) {
					if (g.aptitude <= 8) {
						var up = g.aptitude + 1;
						if (up > 10) up = 10;
						g.aptitude = up;
						U.printlog('鐮旇寮傝兘绗旇锛岃寘濉為】寮?锛屽ぉ璧嬫彁鍗囪嚦 ' + U.DATA.tierName(up) + '锛?');
						return;
					}
					U.printlog('鐮旇寮傝兘绗旇锛屽彲鎯滄敹鑾风敋寰紝鍙劅淇负鏈夋墍绮捐繘');
					U.gainLevels(g, 1, log);
				},
			fail: null
		},

		/* ---------- tier 2 涓骇 ---------- */
		{
			id: 'legacy',
			weight: 5,
			maxCount: 5,
			name: '鍓嶈緢閬楁辰',
			tier: 2,
			desc: '涓?浣嶈?佸紓鑳借?呯殑閬楁効鎸囧紩浣犳帴鏀朵紶鎵?',
			minAge: 0,
			maxAge: 10000,
			cond:
				function (g, U) {
					return g.lvl >= Math.min(25, Math.floor(g.age * 0.75)) + U.irand(0, 10);
				},
			ok:
				function (g, U, log) {
					if (g.lvl < 99) {
						U.printlog('缁ф壙鍓嶈緢閬楁辰锛岃幏鐩婅壇澶?');
						U.gainLevels(g, 1, log);
						return;
					}
					var c2 = U.evCombat(g, 0.04, 0.08, 750);
					g.combat += c2;
					U.printlog('缁ф壙鍓嶈緢閬楁辰锛屾垬鍔?+' + c2);
				},
			fail:
				function (g, U) {
					var lf = U.irand(2, 4);
					g.lifespan -= lf;
					U.printlog('浼犳壙澶辨帶锛屽紓鑳藉弽鍣紝瀵垮懡 -' + lf);
				}
		},
		{
			id: 'bandits',
			weight: 5,
			maxCount: 10,
			name: '鍔帬鑰呰鍑?',
			tier: 2,
			desc: '閬亣涓?澶х兢鍔帬鑰呰鍑?',
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
					U.printlog('鍙嶆潃鍔帬鑰咃紝绔簡浠栦滑鐨勪粨搴擄紝鎴樺姏+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(1, 3);
					g.lifespan -= lf;
					U.printlog('琚姭鎺犺?呮墦鎴愰噸浼わ紝瀵垮懡 -' + lf);
				}
		},
		{
			id: 'warlord',
			weight: 5,
			maxCount: 5,
			name: '鍐涢榾鍐茬獊',
			tier: 2,
			desc: '鍐涢榾鍔垮姏椋炴壃璺嬫増锛屼笌浣犲彂鐢熷啿绐侊紝浣犳儴閬拷鏉?',
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
					U.printlog('鍙嶆潃鍐涢榾鍒嗗瓙锛屽ず寰楀ぇ閲忕墿璧勫拰妗ｆ锛屾垬鍔?+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(3, 5);
					g.lifespan -= lf;
					U.printlog('琚啗闃?鍒嗗瓙閲嶅垱锛屽鍛? -' + lf);
				}
		},
		{
			id: 'swarm',
			weight: 5,
			maxCount: 10,
			name: '鍙樺紓娼潵琚?',
			tier: 2,
			desc: '鍙樺紓浣撳ぇ娼腑鍗疯惀鍦?',
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
					U.printlog('鍑婚??鍙樺紓娼紝鎴樻枟涓湁鎵?棰嗘偀锛屾垬鍔?+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(3, 6);
					g.lifespan -= lf;
					U.printlog('琚彉寮傛疆鍚炴病锛岄噸浼わ紝瀵垮懡 -' + lf);
				}
		},
		{
			id: 'combatinsight',
			weight: 5,
			maxCount: 50,
			name: '棰嗘偀寮傝兘杩愮敤',
			tier: 2,
			desc: '鐢熸纾ㄧ牶锛屼竴鏈濋鎮熸洿寮虹殑寮傝兘杩愮敤',
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
					U.printlog('棰嗘偀寮傝兘杩愮敤锛屾垬鍔?+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(2, 4);
					g.lifespan -= lf;
					U.printlog('寮鸿杩愯浆寮傝兘鍙嶅櫖鑷韩锛屽鍛? -' + lf);
				}
		},
		{
			id: 'mission',
			weight: 5,
			maxCount: 5,
			name: '绉樺瘑浠诲姟',
			tier: 2,
			desc: '鏈夊紓鑳借?呴個璇蜂綘鍙傚姞涓?鍦虹瀵嗕换鍔?',
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
					U.printlog('琚?変腑鍙傚姞绉樺瘑浠诲姟锛岃幏寰楀ぇ閲忓鍔憋紝鎴樺姏+' + c);
					if (g.lvl < 50 && Math.random() < 0.5) {
						U.printlog('浠诲姟涓紝浣犻亣鍒伴澶栨満缂橈紝澶ф湁鏀剁泭');
						U.gainLevels(g, 1, log);
					}
				},
			fail:
				function (g, U) {
					var c = U.evCombat(g, 0.003, 0.005, 50);
					g.combat += c;
					U.printlog('瀵规柟娌℃湁鐪嬩笂浣狅紝浣嗗康浣犳湁娼滃姏锛屾寚鐐逛簡鍑犲彞锛屾垬鍔?+' + c);
				}
		},

		/* ---------- tier 1 鏅?? ---------- */
		{
			id: 'cull',
			weight: 20,
			maxCount: 100,
			name: '娓呭壙鍙樺紓浣?',
			tier: 1,
			desc: '娓呭壙娓歌崱鐨勫彉寮備綋',
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
					U.printlog('鎼忔潃鍙樺紓浣擄紝鎴樺姏+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(2, 4);
					g.lifespan -= lf;
					U.printlog('闄╀簺琚彉寮備綋鎾曠锛屽鍛? -' + lf);
				}
		},
		{
			id: 'scavenge',
			weight: 10,
			maxCount: 20,
			name: '鎼滃埉鐗╄祫',
			tier: 1,
			desc: '娣卞叆搴熷鎼滃埉鐗╄祫锛屽伓閬囨父鑽″彉寮備綋',
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
					U.printlog('鎼滃緱鑳介噺琛ュ厖鍓傦紝瀵垮懡+' + lf + '锛屾垬鍔?+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(1, 3);
					g.lifespan -= lf;
					U.printlog('琚彉寮備綋鎵?浼わ紝浠撶殗鑰岄?冿紝瀵垮懡 -' + lf);
				}
		},
		{
			id: 'spar',
			weight: 20,
			maxCount: 100,
			name: '骞稿瓨鑰呭垏纾?',
			tier: 1,
			desc: '涓庡悓榫勫垢瀛樿?呭垏纾嬭緝閲?',
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
					U.printlog('鍒囩鑾疯儨锛屾垬鍔?+' + c);
				},
			fail:
				function (g, U) {
					var lf = U.irand(1, 2);
					g.lifespan -= lf;
					U.printlog('鍒囩钀借触鍙楀垱锛屽鍛? -' + lf);
				}
		},
		{
			id: 'epiphany',
			weight: 20,
			maxCount: 100,
			name: '鐣ユ湁鎰熸偀',
			tier: 1,
			desc: '淇偧寮傝兘涓紝鐣ユ湁鎰熸偀',
			minAge: 0,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U) {
					var c = U.evCombat(g, 0.003, 0.005, 50);
					g.combat += c;
					U.printlog('鎴樺姏+' + c);
				},
			fail: null
		},
		{
			id: 'ev_shelter',
			weight: 1.0,
			maxCount: 3,
			name: '閬块毦鎵?鎼滃埉',
			tier: 1,
			desc: '鍦ㄥ簾寮冮伩闅炬墍涓悳鍒墿璧?',
			minAge: 5,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U) {
					var r = U.combatGain(g.aptitude, g.lvl);
					var add = Math.floor(r * U.rand(0.3, 0.8));
					g.combat += add;
					var lf = U.irand(1, 3); g.lifespan += lf;
					return '閬块毦鎵?鎼滃埉鏀惰幏锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
				},
			fail: null
		},
		{
			id: 'ev_mutbeast',
			weight: 0.9,
			maxCount: 5,
			name: '鍙樺紓鍏芥悘鏉?',
			tier: 1,
			desc: '閬亣鍙樺紓鍏芥悘鏉?',
			minAge: 8,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U) {
					var r = U.combatGain(g.aptitude, g.lvl);
					var add = Math.floor(r * U.rand(0.4, 1.0));
					g.combat += add;
					return '鎼忔潃鍙樺紓鍏斤紝鎴樺姏+' + add;
				},
			fail:
				function (g, U) {
					g.lifespan -= U.irand(1, 3);
					return '鍙樺紓鍏芥悘鏉?鍙楀垱锛屽鍏冨彈鎹?';
				}
		},
		{
			id: 'ev_military',
			weight: 0.7,
			maxCount: 3,
			name: '鍐涙柟鏁戞彺',
			tier: 1,
			desc: '鍐涙柟鏁戞彺闃熷埌鏉?',
			minAge: 5,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U) {
					var r = U.combatGain(g.aptitude, g.lvl);
					var add = Math.floor(r * U.rand(0.5, 1.2));
					g.combat += add;
					var lf = U.irand(1, 2); g.lifespan += lf;
					return '鍐涙柟鏁戞彺闃熸敮鎻达紝鑾峰緱鐗╄祫锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
				},
			fail: null
		},
		{
			id: 'ev_blackmarket',
			weight: 0.6,
			maxCount: 3,
			name: '榛戝競浜ゆ槗',
			tier: 1,
			desc: '鍦ㄩ粦甯備氦鎹㈠彉寮傛潗鏂?',
			minAge: 12,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U) {
					var r = U.combatGain(g.aptitude, g.lvl);
					var add = Math.floor(r * U.rand(0.3, 0.7));
					g.combat += add;
					var lf = U.irand(1, 2); g.lifespan += lf;
					return '榛戝競浜ゆ槗鑾峰緱鍙樺紓鏉愭枡锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
				},
			fail: null
		},
		{
			id: 'ev_survivor',
			weight: 0.8,
			maxCount: 3,
			name: '骞稿瓨鑰呰惀鍦?',
			tier: 1,
			desc: '鍦ㄥ垢瀛樿?呰惀鍦颁腑浼戞暣',
			minAge: 5,
			maxAge: 10000,
			cond: null,
			ok:
				function (g, U) {
					var r = U.combatGain(g.aptitude, g.lvl);
					var add = Math.floor(r * U.rand(0.3, 0.6));
					g.combat += add;
					var lf = U.irand(2, 4); g.lifespan += lf;
					return '骞稿瓨鑰呰惀鍦颁紤鏁达紝鎭㈠鐘舵?侊紝鎴樺姏+' + add + '锛屽鍏?+' + lf;
				},
			fail: null
		},

		/* ====== 鎵╁睍浜嬩欢锛堟湯鏃ヤ富棰樿拷鍔狅級 ====== */

		/* ---------- tier 4 浼犺 ---------- */
		{
			id: 'ev_prophecy',
			weight: 0.1,
			maxCount: 1,
			name: '杩涘寲棰勮█',
			tier: 4,
			desc: '浼犺鏈棩鏂硅垷鐣欐湁杩涘寲棰勮█锛屽彧鏈夊己鑰呰兘瑙ｈ',
			minAge: 30,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 70; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(2.0, 3.5));
				g.combat += add;
				var lf = U.irand(8, 14); g.lifespan += lf;
				U.gainLevels(g, U.irand(1, 3), log);
				return '瑙ｈ杩涘寲棰勮█锛屾礊鎮夎繘鍖栦箣鐞嗭紝鎴樺姏+' + add + '锛屽鍏?+' + lf + '锛屽疄鍔涘ぇ骞呯簿杩?';
			},
			fail: function (g, U) {
				var lf = U.irand(4, 8); g.lifespan -= lf;
				return '棰勮█鍙嶅櫖绁炶瘑锛屽鍏?-' + lf;
			}
		},
		{
			id: 'ev_inherit',
			weight: 0.2,
			maxCount: 1,
			name: '寮傝兘浼犳壙',
			tier: 4,
			desc: '鏈棩鍓嶈緢鐨勫紓鑳戒紶鎵块檷涓翠簬浣?',
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
				return '鎵挎帴寮傝兘浼犳壙' + (up ? '锛屽ぉ璧嬫彁鍗囪嚦 ' + U.DATA.tierName(up) + '锛?' : '') + '锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(3, 6); g.lifespan -= lf;
				return '浼犳壙澶辨帶锛屽鍏?-' + lf;
			}
		},
		{
			id: 'ev_ark',
			weight: 0.08,
			maxCount: 1,
			name: '鏈棩鏂硅垷',
			tier: 4,
			desc: '浼犺涓湯鏃ユ柟鑸熺殑鍏ュ彛鍦ㄤ綘闈㈠墠寮?鍚?',
			minAge: 40,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 85 || g.combat >= 50000; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(3.0, 5.0));
				g.combat += add;
				var lf = U.irand(10, 18); g.lifespan += lf;
				U.gainLevels(g, U.irand(2, 4), log);
				return '鐧讳笂鏈棩鏂硅垷锛岃幏寰楀墠鏂囨槑浼犳壙锛屾垬鍔?+' + add + '锛屽鍏?+' + lf + '锛屽疄鍔涢璺?';
			},
			fail: function (g, U) {
				g.dead = true;
				return '瀹炲姏涓嶈冻锛岃鏂硅垷缁撶晫鍚炲櫖锛屼笉骞搁櫒钀?';
			}
		},

		/* ---------- tier 3 绋?鏈? ---------- */
		{
			id: 'ev_serumlab',
			weight: 0.8,
			maxCount: 2,
			name: '琛?娓呯爺绌舵墍',
			tier: 3,
			desc: '娼滃叆鏈棩琛?娓呯爺绌舵墍锛屾悳瀵昏繘鍖栬娓?',
			minAge: 15,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 35; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(1.0, 2.0));
				g.combat += add;
				var lf = U.irand(4, 8); g.lifespan += lf;
				U.gainLevels(g, U.irand(1, 2), log);
				return '鑾峰緱楂樼函搴﹁繘鍖栬娓咃紝鎴樺姏+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(3, 6); g.lifespan -= lf;
				return '琛?娓呮敞灏勫け璐ワ紝鍓綔鐢ㄥ弽鍣紝瀵垮厓-' + lf;
			}
		},
		{
			id: 'ev_beastking',
			weight: 0.7,
			maxCount: 2,
			name: '鍙樺紓鍏界帇',
			tier: 3,
			desc: '涓?澶村彉寮傚吔鐜嬪湪闄勮繎鍑烘病锛屼綘鍐冲畾鎸戞垬瀹?',
			minAge: 20,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 40; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(1.2, 2.2));
				g.combat += add;
				var lf = U.irand(3, 7); g.lifespan += lf;
				U.gainLevels(g, 1, log);
				return '鍑绘潃鍙樺紓鍏界帇锛屾辈鍙栧叾鍩哄洜涔嬪姏锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(4, 8); g.lifespan -= lf;
				return '琚彉寮傚吔鐜嬮噸鍒涳紝瀵垮厓-' + lf;
			}
		},
		{
			id: 'ev_secondmut',
			weight: 0.6,
			maxCount: 2,
			name: '浜屾鍙樺紓浣?',
			tier: 3,
			desc: '閬亣缃曡鐨勪簩娆″彉寮備綋锛屽畠浣撳唴钑村惈杩涘寲鍥犲瓙',
			minAge: 18,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 38; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(1.0, 1.8));
				g.combat += add;
				var lf = U.irand(3, 6); g.lifespan += lf;
				U.gainLevels(g, 1, log);
				return '鍑绘潃浜屾鍙樺紓浣擄紝鍚告敹鍏跺彉寮傚洜瀛愶紝鎴樺姏+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(3, 7); g.lifespan -= lf;
				return '琚簩娆″彉寮備綋鎰熸煋锛屽鍏?-' + lf;
			}
		},
		{
			id: 'ev_duelist',
			weight: 1.0,
			maxCount: 3,
			name: '寮傝兘鑰呭鍐?',
			tier: 3,
			desc: '涓?浣嶅紓鑳借?呭悜浣犲彂璧风敓姝诲鍐?',
			minAge: 15,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 35; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.8, 1.6));
				g.combat += add;
				var lf = U.irand(2, 5); g.lifespan += lf;
				U.gainLevels(g, 1, log);
				return '鍑昏触寮傝兘鑰咃紝澶哄彇鍏跺紓鑳界簿绮癸紝鎴樺姏+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(3, 6); g.lifespan -= lf;
				return '瀵瑰喅钀借触锛屽鍏?-' + lf;
			}
		},
		{
			id: 'ev_warlordboss',
			weight: 0.9,
			maxCount: 2,
			name: '鍐涢榾澶寸洰',
			tier: 3,
			desc: '鍐涢榾澶寸洰鐜囬槦鏉ヨ锛屼綘鍐冲畾姝ｉ潰杩庢垬',
			minAge: 18,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 38; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(1.0, 1.8));
				g.combat += add;
				var lf = U.irand(2, 6); g.lifespan += lf;
				U.gainLevels(g, U.irand(1, 2), log);
				return '鏂╂潃鍐涢榾澶寸洰锛岀即鑾峰ぇ閲忓啗鐢ㄧ墿璧勶紝鎴樺姏+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(4, 8); g.lifespan -= lf;
				return '琚啗闃?澶寸洰閲嶅垱锛屽鍏?-' + lf;
			}
		},
		{
			id: 'ev_genememory',
			weight: 0.8,
			maxCount: 2,
			name: '鍩哄洜璁板繂瑙夐啋',
			tier: 3,
			desc: '浣撳唴娌夌潯鐨勫墠鏂囨槑鍩哄洜璁板繂寮?濮嬭閱?',
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
				return '鍩哄洜璁板繂瑙夐啋' + (up ? '锛屽ぉ璧嬫彁鍗囪嚦 ' + U.DATA.tierName(up) + '锛?' : '') + '锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(2, 5); g.lifespan -= lf;
				return '璁板繂鍐插嚮绁炶瘑锛屽鍏?-' + lf;
			}
		},

		/* ---------- tier 2 涓骇 ---------- */
		{
			id: 'ev_generecomb',
			weight: 3,
			maxCount: 3,
			name: '鍩哄洜閲嶇粍瀹為獙',
			tier: 2,
			desc: '鍙戠幇鍓嶆枃鏄庨仐鐣欑殑鍩哄洜閲嶇粍瑁呯疆',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 25; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.5, 1.2));
				g.combat += add;
				var lf = U.irand(2, 5); g.lifespan += lf;
				U.gainLevels(g, 1, log);
				return '鍩哄洜閲嶇粍鎴愬姛锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(2, 4); g.lifespan -= lf;
				return '鍩哄洜閲嶇粍澶辫触锛屽弽鍣嚜韬紝瀵垮厓-' + lf;
			}
		},
		{
			id: 'ev_mutstorm',
			weight: 4,
			maxCount: 5,
			name: '寮傚彉椋庢毚',
			tier: 2,
			desc: '寮傚彉椋庢毚甯嵎鑰屾潵锛岃暣鍚彉寮傝兘閲?',
			minAge: 10,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 22; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.4, 1.0));
				g.combat += add;
				var lf = U.irand(1, 4); g.lifespan += lf;
				return '鍦ㄥ紓鍙橀鏆翠腑鍚告敹鑳介噺锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(2, 5); g.lifespan -= lf;
				return '琚紓鍙橀鏆存墍浼わ紝瀵垮厓-' + lf;
			}
		},
		{
			id: 'ev_radzone',
			weight: 4,
			maxCount: 5,
			name: '杈愬皠鍖烘帰绱?',
			tier: 2,
			desc: '娼滃叆杈愬皠鍖烘悳瀵诲彉寮傛潗鏂?',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 25; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.5, 1.0));
				g.combat += add;
				var lf = U.irand(1, 3); g.lifespan += lf;
				return '杈愬皠鍖烘帰绱㈡敹鑾烽涓帮紝鎴樺姏+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(2, 4); g.lifespan -= lf;
				return '閬彈杈愬皠浼ゅ锛屽鍏?-' + lf;
			}
		},
		{
			id: 'ev_evolvmut',
			weight: 3,
			maxCount: 3,
			name: '杩涘寲鍥犲瓙绐佸彉',
			tier: 2,
			desc: '浣撳唴杩涘寲鍥犲瓙鍙戠敓鑹?х獊鍙?',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 28; },
			ok: function (g, U, log) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.5, 1.1));
				g.combat += add;
				var lf = U.irand(2, 4); g.lifespan += lf;
				U.gainLevels(g, 1, log);
				return '杩涘寲鍥犲瓙绐佸彉锛屾垬鍔?+' + add + '锛屽鍏?+' + lf + '锛屽疄鍔涚簿杩?';
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '绐佸彉澶辨帶锛屽鍏?-' + lf;
			}
		},
		{
			id: 'ev_campbuild',
			weight: 5,
			maxCount: 5,
			name: '钀ュ湴寤鸿',
			tier: 2,
			desc: '鍗忓姪骞稿瓨鑰呰惀鍦板缓璁鹃槻寰″伐浜?',
			minAge: 10,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 20; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.3, 0.8));
				g.combat += add;
				var lf = U.irand(2, 5); g.lifespan += lf;
				return '钀ュ湴寤鸿鑾峰緱閰阿锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '钀ュ湴寤鸿涓彈浼わ紝瀵垮厓-' + lf;
			}
		},
		{
			id: 'ev_convoy',
			weight: 5,
			maxCount: 5,
			name: '鍟嗛槦鎶ら??',
			tier: 2,
			desc: '鎶ら?佸晢闃熺┛瓒婂嵄闄╁尯鍩?',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 22; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.4, 0.9));
				g.combat += add;
				var lf = U.irand(1, 4); g.lifespan += lf;
				return '鍟嗛槦鎶ら?佹垚鍔燂紝鑾峰緱涓板帤鎶ラ叕锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(2, 4); g.lifespan -= lf;
				return '鍟嗛槦閬囪锛屼粨鐨囨姢閫佸彈浼わ紝瀵垮厓-' + lf;
			}
		},
		{
			id: 'ev_refugee',
			weight: 5,
			maxCount: 5,
			name: '闅炬皯鏁戞彺',
			tier: 2,
			desc: '涓?缇ら毦姘戦伃閬囧彉寮備綋鍥存敾锛屼綘鍑烘墜鐩告晳',
			minAge: 10,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 20; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.3, 0.7));
				g.combat += add;
				var lf = U.irand(1, 4); g.lifespan += lf;
				return '鏁戜笅闅炬皯锛岃幏寰楁劅鎭╁洖棣堬紝鎴樺姏+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '鏁戞彺涓彈鍒涳紝瀵垮厓-' + lf;
			}
		},
		{
			id: 'ev_campalliance',
			weight: 4,
			maxCount: 3,
			name: '钀ュ湴鑱旂洘',
			tier: 2,
			desc: '澶氫釜骞稿瓨鑰呰惀鍦扮粨鎴愯仈鐩燂紝鍏辨姉鍙樺紓娼?',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 25; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.4, 0.9));
				g.combat += add;
				var lf = U.irand(2, 5); g.lifespan += lf;
				return '钀ュ湴鑱旂洘鍏变韩璧勬簮锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '鑱旂洘鐮磋锛屽啿绐佷腑鍙椾激锛屽鍏?-' + lf;
			}
		},

		/* ---------- tier 1 鏅?? ---------- */
		{
			id: 'ev_shelterbuild',
			weight: 10,
			maxCount: 10,
			name: '閬块毦鎵?寤鸿',
			tier: 1,
			desc: '鍙備笌鍦颁笅閬块毦鎵?鐨勬墿寤哄伐绋?',
			minAge: 8,
			maxAge: 10000,
			cond: null,
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.3, 0.7));
				g.combat += add;
				var lf = U.irand(1, 3); g.lifespan += lf;
				return '鍙備笌閬块毦鎵?寤鸿鑾峰緱閰姵锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
			},
			fail: null
		},
		{
			id: 'ev_survivorcouncil',
			weight: 8,
			maxCount: 5,
			name: '骞稿瓨鑰呭ぇ浼?',
			tier: 1,
			desc: '鍙傚姞骞稿瓨鑰呭ぇ浼氾紝浜ゆ祦鐢熷瓨缁忛獙',
			minAge: 10,
			maxAge: 10000,
			cond: null,
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.2, 0.5));
				g.combat += add;
				var lf = U.irand(1, 2); g.lifespan += lf;
				return '骞稿瓨鑰呭ぇ浼氫氦娴佸績寰楋紝鎴樺姏+' + add + '锛屽鍏?+' + lf;
			},
			fail: null
		},
		{
			id: 'ev_warlordbattle',
			weight: 8,
			maxCount: 5,
			name: '鍐涢榾澶ф垬',
			tier: 1,
			desc: '鍗峰叆涓ゆ柟鍐涢榾娣锋垬',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 15; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.4, 0.8));
				g.combat += add;
				return '鍐涢榾澶ф垬涓笖缈佸緱鍒╋紝鎴樺姏+' + add;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '鍐涢榾澶ф垬涓娉㈠強鍙椾激锛屽鍏?-' + lf;
			}
		},
		{
			id: 'ev_mutnest',
			weight: 9,
			maxCount: 5,
			name: '鍙樺紓浣撳发绌?',
			tier: 1,
			desc: '娓呭壙涓?澶勫彉寮備綋宸㈢┐',
			minAge: 10,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 15; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.4, 0.9));
				g.combat += add;
				var lf = U.irand(1, 2); g.lifespan += lf;
				return '娓呭壙鍙樺紓浣撳发绌达紝鎴樺姏+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '宸㈢┐涓湁寮烘晫锛屼粨鐨囨挙閫?锛屽鍏?-' + lf;
			}
		},
		{
			id: 'ev_deepdeadzone',
			weight: 7,
			maxCount: 3,
			name: '姝荤柅绂佸尯娣卞',
			tier: 1,
			desc: '娣卞叆姝荤柅绂佸尯澶栧洿鎼滃鐗╄祫',
			minAge: 15,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 18; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.5, 1.0));
				g.combat += add;
				var lf = U.irand(1, 3); g.lifespan += lf;
				return '姝荤柅绂佸尯澶栧洿鏀惰幏绋?鏈夋潗鏂欙紝鎴樺姏+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(2, 4); g.lifespan -= lf;
				return '姝荤柅绂佸尯鎰熸煋鐤瘨锛屽鍏?-' + lf;
			}
		},
		{
			id: 'ev_undershelter',
			weight: 10,
			maxCount: 10,
			name: '鍦颁笅閬块毦鎵?',
			tier: 1,
			desc: '鍦ㄥ湴涓嬮伩闅炬墍涓紤鏁村苟鎼滃鐗╄祫',
			minAge: 5,
			maxAge: 10000,
			cond: null,
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.3, 0.6));
				g.combat += add;
				var lf = U.irand(1, 3); g.lifespan += lf;
				return '鍦颁笅閬块毦鎵?浼戞暣琛ョ粰锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
			},
			fail: null
		},
		{
			id: 'ev_abandonedlab',
			weight: 8,
			maxCount: 5,
			name: '搴熷純瀹為獙瀹?',
			tier: 1,
			desc: '娼滃叆搴熷純瀹為獙瀹ゆ悳鍒爺绌惰祫鏂?',
			minAge: 10,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 12; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.3, 0.7));
				g.combat += add;
				var lf = U.irand(1, 2); g.lifespan += lf;
				return '瀹為獙瀹ゆ悳寰楃爺绌惰祫鏂欙紝鎴樺姏+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 2); g.lifespan -= lf;
				return '瀹為獙瀹ゆ畫浣欐瘨姘斾激韬紝瀵垮厓-' + lf;
			}
		},
		{
			id: 'ev_raddeep',
			weight: 8,
			maxCount: 5,
			name: '杈愬皠鍖烘繁澶?',
			tier: 1,
			desc: '娣卞叆杈愬皠鍖烘繁澶勬悳瀵婚珮绾害鍙樺紓鏉愭枡',
			minAge: 12,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 15; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.4, 0.8));
				g.combat += add;
				var lf = U.irand(1, 2); g.lifespan += lf;
				return '杈愬皠鍖烘繁澶勬敹鑾烽珮绾潗鏂欙紝鎴樺姏+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 3); g.lifespan -= lf;
				return '杈愬皠杩囬噺涓烘偅锛屽鍏?-' + lf;
			}
		},
		{
			id: 'ev_mutforest',
			weight: 9,
			maxCount: 5,
			name: '寮傚彉妫灄',
			tier: 1,
			desc: '绌胯秺寮傚彉妫灄锛岀寧鏉?鍙樺紓鐢熺墿',
			minAge: 8,
			maxAge: 10000,
			cond: function (g, U) { return g.lvl >= 12; },
			ok: function (g, U) {
				var r = U.combatGain(g.aptitude, g.lvl);
				var add = Math.floor(r * U.rand(0.3, 0.7));
				g.combat += add;
				var lf = U.irand(1, 2); g.lifespan += lf;
				return '寮傚彉妫灄鐚庢潃鍙樺紓鐢熺墿锛屾垬鍔?+' + add + '锛屽鍏?+' + lf;
			},
			fail: function (g, U) {
				var lf = U.irand(1, 2); g.lifespan -= lf;
				return '寮傚彉妫灄閬囬櫓鍙椾激锛屽鍏?-' + lf;
			}
		}
	];

	if (typeof module !== 'undefined' && module.exports) module.exports = EVENTS;
	root.EVENTS = EVENTS;
})(typeof self !== 'undefined' ? self : this);
