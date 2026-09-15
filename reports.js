/* ============================================================
 * 模拟器合集 · 每日反馈分析报告
 * 由自动化运维任务每日生成，按日期倒序排列。
 * 用户可在首页「📋 更新日志」→「📊 分析报告」Tab 中查看。
 *
 * 格式：{ date: 'YYYY-MM-DD', summary: '简要摘要', stats: {suggestion:N,bug:N,praise:N,other:N}, bugs: [...], suggestions: [...], fixes: [...], tests: '...' }
 * ============================================================ */
window.REPORTS = [
  {
    date: '2026-09-15',
    summary: '系统上线首日，共收到测试反馈，修复帝名/神位名显示bug，新增意见反馈和更新日志模块',
    stats: { suggestion: 0, bug: 2, praise: 0, other: 0 },
    themes: { doomsday: 0, douluo: 1, doupo: 1, wanmei: 0 },
    bugs: [
      { severity: 'P1', theme: 'doupo', desc: '斗帝名显示为"斗帝"而非根据生平生成的独特帝名', status: '已修复', commit: '55fdefd' },
      { severity: 'P1', theme: 'douluo', desc: '神位名显示为"神祈"而非根据武魂生成的独特神位名', status: '已修复', commit: '55fdefd' }
    ],
    suggestions: [],
    fixes: [
      '斗破苍穹：新增 generateName 函数，根据异火/功法/战力/天赋智能生成帝名',
      '斗罗大陆：新增 generateName 复用 generateGodName，自创神位自动加入神位池供后续玩家继承'
    ],
    tests: '未执行（系统上线首日）'
  }
];
