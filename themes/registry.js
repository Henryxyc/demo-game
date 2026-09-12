/* ============================================================
 * 妯℃嫙鍣ㄥ悎闆?路 涓婚娉ㄥ唽琛?
 * 鍚勪富棰樺寘锛坉oomsday/douluo/doupo/wanmei锛夐€氳繃鍏ㄥ眬 THEMES 瀵硅薄娉ㄥ唽鑷韩锛?
 * 鏈枃浠舵彁渚?listThemes()/getTheme(id)/榛樿涓婚绛夋煡璇㈡帴鍙ｏ紝渚?game.js 浣跨敤銆?
 * 鍔犺浇椤哄簭锛氬悇涓婚鍖?鈫?registry.js 鈫?sim.js 鈫?game.js
 * ============================================================ */
(function (root) {
  var THEMES = root.THEMES = root.THEMES || {};

  /* 榛樿涓婚 id锛堥娆¤繘鍏?鏃犻€夋嫨鏃朵娇鐢級 */
  var DEFAULT_ID = 'doomsday';

  /* 褰撳墠閫変腑鐨勪富棰?id锛堟寔涔呭寲鍦?localStorage: 'sim_collection_current'锛?*/
  var KEY_CURRENT = 'sim_collection_current';
  var _currentId = null;

  function loadCurrentId() {
    try {
      var id = localStorage.getItem(KEY_CURRENT);
      if (id && THEMES[id]) _currentId = id;
    } catch (e) {}
    if (!_currentId) _currentId = DEFAULT_ID;
    return _currentId;
  }
  function saveCurrentId(id) {
    _currentId = id;
    try { localStorage.setItem(KEY_CURRENT, id); } catch (e) {}
  }
  function getCurrentId() {
    if (!_currentId) return loadCurrentId();
    return _currentId;
  }

  /* 鍒楀嚭鎵€鏈変富棰樺厓鏁版嵁锛堝崱鐗囩綉鏍肩敤锛屼笉鍚畬鏁存暟鎹級 */
  function listThemes() {
    var out = [], k;
    var order = ['doomsday', 'douluo', 'doupo', 'wanmei'];   /* 鍚堥泦棣栭〉灞曠ず椤哄簭 */
    for (var i = 0; i < order.length; i++) {
      var t = THEMES[order[i]];
      if (t) out.push({
        id: t.id,
        name: t.name,
        subtitle: t.subtitle,
        desc: t.desc,
        accent: t.accent,
        icon: t.icon,
        tags: t.tags
      });
    }
    /* 鍏滃簳锛氳ˉ鍏ㄦ湭鍦?order 涓殑涓婚 */
    for (k in THEMES) {
      if (order.indexOf(k) < 0) out.push({
        id: THEMES[k].id, name: THEMES[k].name, subtitle: THEMES[k].subtitle,
        desc: THEMES[k].desc, accent: THEMES[k].accent, icon: THEMES[k].icon, tags: THEMES[k].tags
      });
    }
    return out;
  }

  /* 鑾峰彇瀹屾暣涓婚瀵硅薄 */
  function getTheme(id) {
    if (!id) id = getCurrentId();
    return THEMES[id] || THEMES[DEFAULT_ID];
  }
  /* 鑾峰彇褰撳墠涓婚锛堝畬鏁村璞★級 */
  function getCurrent() { return getTheme(getCurrentId()); }
  /* 鍒囨崲褰撳墠涓婚 */
  function setCurrent(id) {
    if (!THEMES[id]) return null;
    saveCurrentId(id);
    return THEMES[id];
  }

  var Registry = {
    DEFAULT_ID: DEFAULT_ID,
    listThemes: listThemes,
    getTheme: getTheme,
    getCurrent: getCurrent,
    getCurrentId: getCurrentId,
    setCurrent: setCurrent,
    has: function (id) { return !!THEMES[id]; }
  };
  root.ThemeRegistry = Registry;
})(typeof self !== 'undefined' ? self : this);
