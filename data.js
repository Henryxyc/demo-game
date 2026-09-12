/* ============================================================
 * 鏈棩妯℃嫙鍣? 路 鏁版嵁鏂囦欢锛堢函鏁版嵁锛岄?昏緫鍦? sim.js锛?
 * 寮傝兘瑙? ability.js 路 闅忔満浜嬩欢瑙? events.js 路 鍩哄洜婧愯川 路 甯搁噺
 * ============================================================ */
(function (root) {
  /* 澶╄祴妗ｇ郴鏁帮細涓嬫爣 = 寮傝兘澶╄祴妗ｃ?傛。浣嶈秺楂樻瘡绾у姞鎴樺姏瓒婂 */
  var COMBAT_COEF = [0, 1.0, 1.5, 2.2, 3.2, 4.5, 6.3, 8.8, 12, 16, 22];

  /* 绐佺牬姒傜巼琛紙鐧惧垎姣旓紝鍙? >100%锛氬 120% 琛ㄧず涓?骞村彲绐佺牬姒傜巼 >1锛?
   * 琛? = 寮傝兘澶╄祴 1-10锛涘垪 = 绛夌骇娈碉細1-10 / 11-20 / 21-30 / 31-40 / 41-50 / 51-60 / 61-70 / 71-80 / 81-90 / 91-95 / 96-98 / 99 */
  var BREAK_CHANCE = [
    [40,  22,  10,  5,   2.5, 1.5, 1.5, 1.5, 1.5, 2,   1.5, 1.5],  /* 澶╄祴1(F) */
    [60,  35,  16,  7,   3.5, 2,   1.5, 1.5, 1.5, 2.5, 2,   1.5],  /* 澶╄祴2(E) */
    [80,  50,  26,  12,  6,   3,   2,   2,   2,   3,   2.5, 2],    /* 澶╄祴3(D) */
    [100, 72,  45,  24,  12,  6,   3,   2.5, 2.5, 3.5, 2.5, 2],  /* 澶╄祴4(C) */
    [120, 95,  68,  42,  22,  11,  5.5, 4,   3.5, 4.5, 3.5, 2.5],  /* 澶╄祴5(B) */
    [140, 115, 92,  65,  38,  20,  10,  7,   5,   6,   4.5, 3.5],  /* 澶╄祴6(A) */
    [165, 135, 108, 85,  55,  32,  16,  10,  6,   7,   5,   3.5],  /* 澶╄祴7(S) */
    [200, 165, 132, 108, 75,  48,  25,  13,  7,   8,   6,   4.5],  /* 澶╄祴8(SS) */
    [250, 205, 170, 140, 110, 75,  40,  20,  10,  11,  8,   5.5],  /* 澶╄祴9(SSS) */
    [310, 265, 220, 180, 145, 105, 55,  32,  15,  12,  9,   6.5]   /* 澶╄祴10(EX) */
  ];

  /* 鍩哄洜婧愯川锛?10 绉嶏級锛氳揪鍒? 90 绾у悗姣忓勾鎸? ESSENCE_CHANCE 鑾峰緱锛屾渶澶? 1 绉?
   * 鎴樺姏闇?姹傝鍒扮害 P95锛堚増28w-45w锛夛紝璁╃害 5% 鏈夋簮璐ㄧ帺瀹剁偧鍖栬揪鏍囷紱涓嶈揪鏍囧彲寮鸿杩涘寲銆?
   * rate 鎴樺姏澧炲箙鍊嶇巼锛氱偧鍖栨檵鍗囨垬鍔? = (100w 杩涘寲濂栧姳 + 鍘熷熀纭?鎴樺姏) 脳 rate锛?
   * 鏃犳簮璐紙寮鸿杩涘寲/杩涘寲鏈簮锛塺ate 鎭掍负 1 */
  var ESSENCE = [
    { id: 'essence1',   name: '鍩哄洜婧愯川路璧ゆ儏涔嬪績', needCombat: 80000, rate: 1.24 },
    { id: 'essence2',  name: '鍩哄洜婧愯川路閿嬮攼涔嬮噾',   needCombat: 90000, rate: 1.33 },
    { id: 'essence3',  name: '鍩哄洜婧愯川路鐢熸満涔嬫湪', needCombat: 100000, rate: 1.42 },
    { id: 'essence4',   name: '鍩哄洜婧愯川路鏃犲灎涔嬫笂',   needCombat: 110000, rate: 1.51 },
    { id: 'essence5',  name: '鍩哄洜婧愯川路涓嶇伃涔嬬劙',   needCombat: 120000, rate: 1.6 },
    { id: 'essence6',  name: '鍩哄洜婧愯川路鍘氬湡涔嬫牳', needCombat: 130000, rate: 1.69 },
    { id: 'essence7',   name: '鍩哄洜婧愯川路鍙岀敓涔嬫丁', needCombat: 410000, rate: 1.78 },
    { id: 'essence8',   name: '鍩哄洜婧愯川路鏄熸笂涔嬫灑', needCombat: 140000, rate: 1.87 },
    { id: 'essence9',  name: '鍩哄洜婧愯川路鍛借疆涔嬪鸡', needCombat: 435000, rate: 1.96 },
    { id: 'essence10',   name: '鍩哄洜婧愯川路澶垵涔嬪厜', needCombat: 150000, rate: 2.05 }
  ];

  /* 鎶?鑳芥。浣嶏細姣? 10 绾э紙10/20/..90绾э級瑙夐啋涓?涓妧鑳斤紝鎸夊綋鍓嶆垬鍔涜閱掑搴旀。绾ф妧鑳姐??
   * 瀛楁璇存槑锛歯ame = 鎶?鑳芥。绾э紙D/C/B/A/S锛夛紱combatLo-combatHi = 璇ユ。鎴樺姏鍖洪棿锛堥棴鍖洪棿锛夛紱
   * addLo-addHi = 瑙夐啋璇ユ。鎶?鑳界殑鎴樺姏鍔犳垚鍖洪棿锛堝惈涓ょ锛岄殢鏈烘暣鏁帮級锛沵inRing = 璇ユ。鑷冲皯绗嚑娆¤閱掓墠瑙ｉ攣
   * 锛堢 1/2 娆¤閱掓渶楂? C 绾э細B=绗?3娆¤捣銆丄=绗?4娆¤捣銆丼=绗?5娆¤捣锛屾湭濉涓? 1锛夈??
   * 鈿? 璇锋寜鎴樺姏浠庡皬鍒板ぇ鎺掑垪涓斿悇妗ｅ尯闂磋繛缁紙涓婁竴妗? combatHi+1 = 涓嬩竴妗? combatLo锛? */
  var SKILL_TIER = [
    { name: 'D',   combatLo: 0,        combatHi: 299,       addLo: 10,     addHi: 20 },
    { name: 'C',   combatLo: 300,      combatHi: 2499,      addLo: 30,    addHi: 60 },
    { name: 'B',   combatLo: 2500,     combatHi: 9999,      addLo: 100,   addHi: 300,   minRing: 3 },
    { name: 'A',   combatLo: 10000,    combatHi: 72499,     addLo: 500,   addHi: 1500,  minRing: 4 },
    { name: 'S',   combatLo: 72500,    combatHi: Infinity,  addLo: 3000,  addHi: 10000,  minRing: 5 }
  ];

  /* 鎸夋垬鍔涢?夋妧鑳芥。浣嶏細ring = 绗嚑娆¤閱掞紙1 璧凤紝缂虹渷涓嶉檺鍒惰閱掑簭锛夈?備緷娆″彇婊¤冻銆屾垬鍔? 鈮? combatHi
   * 涓? 瑙夐啋搴? 鈮? minRing銆嶇殑鏈?楂樻。锛涜嫢鎴樺姏宸茶秴杩囧綋鍓嶅彲瑙ｉ攣妗ｇ殑涓婇檺锛屽垯鍙栧彲瑙ｉ攣鐨勬渶楂樻。 */
  function selectSkill(combat, ring) {
    var i, best = null;
    for (i = 0; i < SKILL_TIER.length; i++) {
      var t = SKILL_TIER[i];
      if (ring != null && (t.minRing || 1) > ring) continue;   /* 瑙夐啋搴忔湭杈捐В閿佹潯浠讹紝璺宠繃 */
      if (combat <= t.combatHi) return t;
      best = t;   /* 璁板綍褰撳墠鍙В閿佹渶楂樻。锛屼緵鎴樺姏瓒呬笂闄愭椂鍏滃簳 */
    }
    return best || SKILL_TIER[SKILL_TIER.length - 1];
  }

  /* 寮傝兘鑰呯瓑绾хО鍙凤細1-100 姣? 10 绾т竴闃讹紙涓?闃垛?﹀崄闃讹級锛屽 92鈫掑崄闃跺紓鑳借?咃紱100=鍗侀樁寮傝兘鑰咃紙瓒呯敓鍛戒綋锛? */
  var CN_ORD = ['', '涓?', '浜?', '涓?', '鍥?', '浜?', '鍏?', '涓?', '鍏?', '涔?', '鍗?'];
  function titleOf(lvl) {
    lvl = Math.max(1, Math.min(100, Math.floor(lvl) || 1));
    var jie = Math.min(10, Math.ceil(lvl / 10));
    return CN_ORD[jie] + '闃跺紓鑳借??';
  }
  /* 寮傝兘澶╄祴妗? 1-10 鈫? F/E/D/C/B/A/S/SS/SSS/EX锛圲I 灞曠ず鐢級 */
  var TIER_NAME = ['', 'F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'EX'];
  function tierName(n) {
    n = Math.max(1, Math.min(10, Math.floor(n) || 1));
    return TIER_NAME[n];
  }

  /* 鎴愬氨绯荤粺锛?19 涓級锛氳揪鎴愬悗鎸? bonus 绱姞楂橀樁寮傝兘锛堝ぉ璧?6-10锛夋娊鍙栨鐜囥??
   * id 鍞竴鏍囪瘑锛堝師鏈? id 淇濈暀锛孠-V 鐘舵?佷笉涓級锛沶ame 鎴愬氨鍚嶏紱bonus 楂橀樁寮傝兘鍔犳垚锛堢櫨鍒嗙偣锛夈??
   * 鍒ゅ畾渚濊禆 game.js锛歩nnate10 鎶藉紓鑳芥椂 / 绛夌骇路鎴樺姏路婧愯川路杩涘寲路寮鸿杩涘寲路杩涘寲鏈簮路鍩哄洜绐佸彉 缁撶畻鏃? /
   * god3路god10路god30路god50路god100 璇昏繘鍖栨帓琛屾锛堝惈鏈湴鍏滃簳锛? */
  var ACHIEVEMENTS = [
    { id: 'innate10', name: 'EX 澶╄祴',    bonus: 0.1 },
    { id: 'twin',   name: '鍙岀敓寮傝兘',   bonus: 0.1 },
    { id: 'lvl71', name: '杈惧埌71绾?',  bonus: 0.1 },
    { id: 'lvl81',   name: '杈惧埌81绾?',  bonus: 0.1 },
    { id: 'feng91',   name: '杈惧埌91绾?',  bonus: 0.1 },
    { id: 'lvl95',   name: '杈惧埌95绾?',  bonus: 0.1 },
    { id: 'lvl99',    name: '杈惧埌99绾?',  bonus: 0.2 },
    { id: 'combat100k',   name: '鍗佷竾鎴樺姏',   bonus: 0.1 },
    { id: 'combat300k', name: '涓夊崄涓囨垬鍔?', bonus: 0.2 },
    { id: 'million',  name: '鐧句竾鎴樺姏',   bonus: 0.3 },
    { id: 'essence',    name: '鍩哄洜婧愯川',   bonus: 0.1 },
    { id: 'god',      name: '鎴愬氨瓒呯敓鍛戒綋', bonus: 0.2 },
    { id: 'forced',    name: '瓒呯敓鍛戒綋',   bonus: 0.3 },
    { id: 'god3',     name: '涓夋杩涘寲',   bonus: 0.3 },
    { id: 'god10',    name: '鍗佹杩涘寲',   bonus: 0.4 },
    { id: 'god30',    name: '涓夊崄娆¤繘鍖?', bonus: 0.5 },
    { id: 'god50',    name: '浜斿崄娆¤繘鍖?', bonus: 0.8 },
    { id: 'god100',   name: '鐧炬杩涘寲',   bonus: 1 },
    { id: 'mutation',   name: '鍩哄洜绐佸彉',   bonus: 1 },
    { id: 'origin', name: '杩涘寲鏈簮',   bonus: 1.5 }
  ];

  /* 鎶藉紓鑳戒繚搴曟。锛氱帺瀹惰揪鍒版煇绛夌骇鍚庯紝鎶藉埌浣庝簬璇ユ。鐨勫紓鑳藉ぉ璧嬩細閲嶆娊锛堢粰鐜╁鍑忚礋锛夈??
   * 1绾?=榛樿鏃犱繚搴曪紙鍙兘鍑哄ぉ璧? F锛夛紱2绾э紙鈮?25绾э級璧蜂笉鍑哄ぉ璧? F锛?3绾э紙鈮?75绾э級璧蜂笉鍑哄ぉ璧? F/E */
  var GUARD = [
    { lv: 25, min: 2, label: '2绾э紙鈮?25绾э級' },
    { lv: 75, min: 3, label: '3绾э紙鈮?75绾э級' }
  ];
  function guardInfo(lv) {
    var min = 1, label = '1绾э紙榛樿锛?', i;
    for (i = 0; i < GUARD.length; i++) {
      if ((lv || 0) >= GUARD[i].lv) { min = GUARD[i].min; label = GUARD[i].label; }
    }
    return { min: min, label: label };
  }

  /* ---------- 甯搁噺 ---------- */
  var DATA = {
    COMBAT_COEF: COMBAT_COEF,
    BREAK_CHANCE: BREAK_CHANCE,
    ESSENCE: ESSENCE,
    SKILL_TIER: SKILL_TIER,
    ACHIEVEMENTS: ACHIEVEMENTS,
    titleOf: titleOf,
    tierName: tierName,
    TIER_NAME: TIER_NAME,
    selectSkill: selectSkill,
    GUARD: GUARD,
    guardInfo: guardInfo,
    /* 鍩虹瀵垮懡锛氫互寮傝兘澶╄祴 X 璁★紝瀹為檯瀵垮懡鍖洪棿 = (LIFE_MIN+X, LIFE_MAX+X) */
    LIFE_MIN: 75, LIFE_MAX: 125,
    /* 浜嬩欢锛氭暣浣撴瘡骞磋Е鍙戞鐜? */
    EVENT_CHANCE: 0.40,
    /* 鍩哄洜婧愯川锛氳揪鍒? 90 绾у悗姣忓勾姒傜巼 */
    ESSENCE_CHANCE: 0.008,
    /* 寮鸿杩涘寲鎴愬姛鐜囷紙鏃犳簮璐? / 鎴樺姏涓嶈冻鏃讹級 */
    FORCED_CHANCE: 1 / 1000,
    /* 寮鸿杩涘寲瓒呯敓鍛戒綋鎴樺姏鍊嶇巼锛堟棤婧愯川鏃讹級锛氶殢鏈? 1.15~1.45 鍊嶅姞鎸侊紙鍩哄洜婧愯川鎵嶄韩鍙? rate锛? */
    FORCED_BONUS_MIN: 1.15,
    FORCED_BONUS_MAX: 1.45,
    /* 鐗规畩浜嬩欢姒傜巼 */
    XIJING_CHANCE: 1e-7,     /* 鍩哄洜绐佸彉锛氬崈涓囧垎涔嬩竴锛堝ぉ璧嬫弧绾? + 瀵垮懡+50锛? */
    ORIGIN_CHANCE: 1e-8,   /* 杩涘寲鏈簮锛氫嚎鍒嗕箣涓? */
    ORIGIN_BONUS: 2,       /* 杩涘寲鏈簮路瓒呯敓鍛戒綋鎴樺姏鍊嶇巼锛?2 鍊? */
    /* 鐜╁绛夌骇缁忛獙锛氬崌鍒扮 n 绾ч渶 50脳n 缁忛獙锛堢疮璁? = 25脳n脳(n+1)锛? */
    PLAYER_LV_BASE: 50,
    /* 杩涘寲鐩存帴鑾峰緱缁忛獙 / 鏅?氱粨绠? = 绛夌骇脳0.5 / 鎻愬墠缁撶畻 = 绛夌骇脳0.1 */
    ASCEND_EXP: 1000,
    EXP_PER_LVL: 0.5,
    EXP_PER_LVL_EARLY: 0.1
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  root.DATA = DATA;
})(typeof self !== 'undefined' ? self : this);
