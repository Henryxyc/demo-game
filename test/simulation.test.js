const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = { console, Math, Date, setTimeout, clearTimeout };
context.self = context;
context.window = context;
vm.createContext(context);
[
  'data.js', 'ability.js', 'events.js',
  'themes/doomsday.js', 'themes/douluo.js', 'themes/doupo.js', 'themes/wanmei.js',
  'branch-events.js', 'sim.js'
].forEach((file) => vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file }));

assert.deepStrictEqual(Object.keys(context.THEMES).sort(), ['doomsday', 'douluo', 'doupo', 'wanmei']);
for (const id of Object.keys(context.THEMES)) {
  const theme = context.THEMES[id];
  assert(theme.EVENT_CHANCE >= 0.48, `${id}: branch event chance was not installed`);
  assert(theme.EVENTS.some((event) => event.choices && event.choices.length >= 3), `${id}: no multi-choice event`);
  assert(theme.ACHIEVEMENTS.some((achievement) => achievement.id === 'route_evil'), `${id}: route achievement missing`);

  const engine = context.Sim.createEngine(theme);
  const game = engine.createGame(0);
  const faction = theme.EVENTS.find((event) => event.id === `route_${id}_faction`);
  assert(faction, `${id}: faction event missing`);
  game.age = 30;
  game.lvl = 40;
  game.pendingEvent = {
    id: faction.id,
    name: faction.name,
    tier: faction.tier,
    desc: faction.desc,
    choices: faction.choices.map((choice) => ({ id: choice.id, label: choice.label, available: true }))
  };
  const result = engine.chooseEvent(game, 'dark', []);
  assert(result.ok, `${id}: evil choice could not be selected`);
  assert.strictEqual(game.alignment, 'evil', `${id}: evil route did not persist`);
  assert(game.choiceHistory.length === 1, `${id}: choice history was not recorded`);
  const ascension = theme.EVENTS.find((event) => event.id === `route_${id}_ascension`);
  game.age = 88;
  game.lvl = 90;
  game.pendingEvent = {
    id: ascension.id,
    name: ascension.name,
    tier: ascension.tier,
    desc: ascension.desc,
    choices: ascension.choices.map((choice) => ({ id: choice.id, label: choice.label, available: true }))
  };
  assert(engine.chooseEvent(game, 'usurp', []).ok, `${id}: ascension route choice failed`);
  assert.strictEqual(game.routeReady, 'usurp', `${id}: routeReady shortcut was not synchronized`);

  let games = 0;
  let resolvedEvents = 0;
  for (let run = 0; run < 30; run++) {
    const g = engine.createGame(0);
    let guard = 0;
    while (!g.dead && !g.ascended && g.age < 180 && guard++ < 600) {
      engine.rollYear(g);
      if (g.pendingEvent) {
        resolvedEvents++;
        const choice = g.pendingEvent.choices.find((item) => item.available);
        assert(choice, `${id}: pending event had no available choice`);
        const picked = engine.chooseEvent(g, choice.id, []);
        assert(picked.ok, `${id}: pending choice failed during simulation`);
      }
    }
    assert(guard < 600, `${id}: simulation stalled at age ${g.age}`);
    games++;
  }
  assert(games === 30);
  assert(resolvedEvents > 0, `${id}: no branch event appeared in 30 simulated games`);

  const finish = engine.createGame(0);
  finish.age = 90;
  finish.lvl = 99;
  finish.combat = 100000;
  finish.alignment = 'evil';
  finish.routeReady = 'usurp';
  finish.routePower = 1;
  finish.lifespan = 150;
  const savedRandom = context.Math.random;
  context.Math.random = () => 0;
  const finished = engine.tryAscend(finish, []);
  context.Math.random = savedRandom;
  assert(finished && finish.ascended && finish.ascendMode === 'route', `${id}: route clear did not complete`);
}

const douluo = context.THEMES.douluo;
const douluoEngine = context.Sim.createEngine(douluo);
const dual = douluoEngine.createGame(0);
dual.dualWuhun = true;
dual.maxRings = 18;
dual.combat = 1000000;
dual.soulRings = new Array(9).fill({ wuhun: 1 });
dual.lvl = 90;
for (let ring = 1; ring <= 9; ring++) {
  dual.lvl = 90 + ring;
  const outcome = douluo.hooks.onSecondWuhunRing(dual);
  assert(outcome && !outcome.dead, `dual wuhun ring ${ring} unexpectedly failed`);
}
assert.strictEqual(dual.soulRings.length, 18, 'dual wuhun did not reach 18 total rings');
assert.strictEqual(dual.soulRings.filter((ring) => ring.wuhun === 1).length, 9);
assert.strictEqual(dual.soulRings.filter((ring) => ring.wuhun === 2).length, 9);

const burst = douluoEngine.createGame(0);
burst.dualWuhun = true;
burst.maxRings = 18;
burst.combat = 1;
burst.soulRings = new Array(9).fill({ wuhun: 1 });
burst.lvl = 91;
const originalRandom = context.Math.random;
context.Math.random = () => 0;
const burstResult = douluo.hooks.onSecondWuhunRing(burst);
context.Math.random = originalRandom;
assert(burstResult && burstResult.dead, 'low combat second wuhun absorption should be able to burst');

let burstCount = 0;
for (let trial = 0; trial < 1000; trial++) {
  const candidate = douluoEngine.createGame(0);
  candidate.dualWuhun = true;
  candidate.maxRings = 18;
  candidate.combat = 1;
  candidate.soulRings = new Array(9).fill({ wuhun: 1 });
  candidate.lvl = 91;
  if (douluo.hooks.onSecondWuhunRing(candidate).dead) burstCount++;
}
const burstRate = burstCount / 1000;
assert(burstRate > 0.7 && burstRate < 0.9, `burst probability out of expected range: ${burstRate}`);

console.log(`simulation tests passed: ${Object.keys(context.THEMES).length} themes, ${gamesForReport(context.THEMES)} themes inspected`);

function gamesForReport(themes) { return Object.keys(themes).length; }
