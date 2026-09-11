/* ============================================================
 * 模拟器合集 · 主题注册表
 * 各主题包（doomsday/douluo/doupo/wanmei）通过全局 THEMES 对象注册自身，
 * 本文件提供 listThemes()/getTheme(id)/默认主题等查询接口，供 game.js 使用。
 * 加载顺序：各主题包 → registry.js → sim.js → game.js
 * ============================================================ */
(function (root) {
  var THEMES = root.THEMES = root.THEMES || {};

  /* 默认主题 id（首次进入/无选择时使用） */
  var DEFAULT_ID = 'doomsday';

  /* 当前选中的主题 id（持久化在 localStorage: 'sim_collection_current'） */
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

  /* 列出所有主题元数据（卡片网格用，不含完整数据） */
  function listThemes() {
    var out = [], k;
    var order = ['doomsday', 'douluo', 'doupo', 'wanmei'];   /* 合集首页展示顺序 */
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
    /* 兜底：补全未在 order 中的主题 */
    for (k in THEMES) {
      if (order.indexOf(k) < 0) out.push({
        id: THEMES[k].id, name: THEMES[k].name, subtitle: THEMES[k].subtitle,
        desc: THEMES[k].desc, accent: THEMES[k].accent, icon: THEMES[k].icon, tags: THEMES[k].tags
      });
    }
    return out;
  }

  /* 获取完整主题对象 */
  function getTheme(id) {
    if (!id) id = getCurrentId();
    return THEMES[id] || THEMES[DEFAULT_ID];
  }
  /* 获取当前主题（完整对象） */
  function getCurrent() { return getTheme(getCurrentId()); }
  /* 切换当前主题 */
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
