import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const directory = await mkdtemp(join(tmpdir(), 'vt27-tests-'))
let model, football, season, league, types, progression, matchEngine, transfers
try {
  for (const name of ['types', 'model', 'league', 'matchEngine', 'season', 'transfers', 'progression', 'football']) {
    const source = await readFile(new URL(`../src/features/career/${name}.ts`, import.meta.url), 'utf8')
    const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } })
    await writeFile(join(directory, `${name}.mjs`), outputText.replace(/from '(\.\/\w+)'/g, "from '$1.mjs'"))
  }
  progression = await import(pathToFileURL(join(directory, 'progression.mjs')))
  matchEngine = await import(pathToFileURL(join(directory, 'matchEngine.mjs')))
  transfers = await import(pathToFileURL(join(directory, 'transfers.mjs')))
  league = await import(pathToFileURL(join(directory, 'league.mjs')))
  types = await import(pathToFileURL(join(directory, 'types.mjs')))
  model = await import(pathToFileURL(join(directory, 'model.mjs')))
  season = await import(pathToFileURL(join(directory, 'season.mjs')))
  football = await import(pathToFileURL(join(directory, 'football.mjs')))
} finally { await rm(directory, { recursive: true, force: true }) }
const career = { mode: 'coach', name: 'Victor', clubId: 'aurora', formation: '4-3-3' }
let saved = null
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => saved, setItem: (_, value) => { saved = value } } })

test('lineup has 11 unique starters and 7 reserves; swaps preserve both invariants', () => {
  const initial = football.lineupOf(career)
  assert.equal(model.squad.length, 18)
  const next = football.swap(initial, 9, 'p17')
  assert.equal(next[9], 'p17')
  assert.ok(!next.includes('p10'))
  assert.ok(model.validLineup(next))
  assert.deepEqual(initial, model.defaultLineup)
  const swapped = football.swap(initial, 1, initial[2])
  assert.equal(swapped[1], initial[2]); assert.equal(swapped[2], initial[1])
})
test('keeper rules reject invalid swaps but accept reserve goalkeeper', () => {
  const initial = football.lineupOf(career)
  assert.deepEqual(football.swap(initial, 0, 'p2'), initial)
  assert.deepEqual(football.swap(initial, 1, 'p12'), initial)
  assert.deepEqual(football.swap(initial, -1, 'p12'), initial)
  assert.ok(model.validLineup(football.swap(initial, 0, 'p12')))
})
test('position mismatch reduces strength', () => {
  const initial = football.lineupOf(career)
  assert.ok(football.strength(football.swap(initial, 1, 'p10'), '4-3-3') < football.strength(initial, '4-3-3'))
})
test('simulation creates 90 minutes, valid scorers, fixed ratings and progressive score', () => {
  const match = football.simulate(career, () => .1)
  assert.equal(match.events.length, 9)
  assert.equal(match.events.at(-1).minute, 90)
  assert.deepEqual(football.score(match), { home: 0, away: 0 })
  assert.deepEqual(football.score(match, 3), { home: 3, away: 0 })
  assert.deepEqual(football.score(match, 9), { home: 9, away: 0 })
  assert.ok(match.events.every(e => match.lineup.includes(e.playerId)))
  assert.equal(new Set(match.ratings.map(r => r.playerId)).size, 11)
  assert.ok(match.ratings.every(r => r.value >= 1 && r.value <= 10))
  assert.notEqual(match.opponent, career.clubId)
  for (const formation of ['4-3-3', '4-4-2', '3-5-2']) {
    const result = football.simulate({ ...career, formation }, () => .9)
    assert.deepEqual(football.score(result, 9), { home: 0, away: 0 })
    assert.ok(result.events.every(e => e.side === 'away'))
  }
})
test('v1 career migrates without losing identity and rejects duplicate starters', () => {
  saved = JSON.stringify(career)
  assert.equal(model.loadCareer().name, 'Victor')
  assert.deepEqual(model.loadCareer().lineup, model.defaultLineup)
  assert.equal(model.loadCareer().day, 1)
  assert.deepEqual(model.loadCareer().roster, model.defaultRoster)
  assert.equal(Object.keys(model.loadCareer().contracts).length, 18)
  assert.equal(model.loadCareer().finances.budget, model.defaultFinances.aurora.budget)
  saved = JSON.stringify({ ...career, lineup: Array(11).fill('p1') })
  assert.deepEqual(model.loadCareer().lineup, model.defaultLineup)
})
test('match and cursor survive reload, and reviewing does not reroll result', () => {
  const match = { ...football.simulate(career, () => .1), cursor: 4 }
  assert.equal(model.saveCareer({ ...career, match }), true)
  assert.deepEqual(model.loadCareer().match, match)
  const loaded = model.loadCareer()
  loaded.match.cursor = 9
  model.saveCareer(season.advanceDay(loaded))
  assert.equal(model.loadCareer().day, 2)
  assert.deepEqual(model.loadCareer().history[0].match.events, match.events)
})
test('invalid match progress is discarded without discarding the coach', () => {
  saved = JSON.stringify({ ...career, match: { ...football.simulate(career), cursor: 99 } })
  assert.equal(model.loadCareer().name, 'Victor')
  assert.equal(model.loadCareer().match, undefined)
  saved = '{broken'
  assert.equal(model.loadCareer(), null)
})

test('training applies once per day and cannot run on match days', () => {
  assert.equal(season.train(career, 'technical'), career)
  const base = { ...career, day: 2 }
  const trained = season.train(base, 'technical')
  assert.equal(season.energy(trained, 'p1'), 90)
  assert.equal(trained.preparation.skill, 1)
  assert.equal(season.train(trained, 'tactical'), trained)
  assert.equal(season.advanceDay(base), base)
  assert.equal(season.advanceDay(trained).day, 3)
  assert.equal(season.energy(season.advanceDay(trained), 'p1'), 98)
})
test('fatigue applies only to match starters and only once at full time', () => {
  const base = { ...career, match: football.simulate(career) }
  const ongoing = season.progressMatch(base, 4)
  assert.equal(season.energy(ongoing, 'p1'), 100)
  const done = season.progressMatch(ongoing, 9)
  assert.equal(season.energy(done, 'p1'), 76)
  assert.equal(season.energy(done, 'p12'), 100)
  assert.equal(season.progressMatch(done, 9), done)
  const rested = season.advanceDay(done)
  assert.equal(season.energy(rested, 'p1'), 84)
  assert.equal(rested.history.length, 1)
  assert.equal(rested.match, undefined)
})
test('fitness reduces fatigue, low energy lowers strength and recovery is capped', () => {
  const prep = season.preparation(career)
  const tired = { ...career, day: 2, preparation: { ...prep, energy: Object.fromEntries(model.squad.map(p => [p.id, 50])) } }
  assert.ok(football.strength(model.defaultLineup, '4-3-3', tired) < football.strength(model.defaultLineup, '4-3-3', career))
  const recovered = season.train(tired, 'recovery')
  assert.equal(season.energy(recovered, 'p1'), 70)
  const fit = { ...career, preparation: { ...prep, fitness: 3 }, match: football.simulate(career) }
  assert.equal(season.energy(season.progressMatch(fit, 9), 'p1'), 82)
  assert.equal(season.energy(season.train({ ...career, day: 2 }, 'recovery'), 'p1'), 100)
})
test('seven-day season completes three matches and preserves all results through reloads', () => {
  let current = { ...career, day: 1, seasonVersion: 3 }
  for (let day = 1; day <= 7; day++) {
    assert.equal(current.day, day)
    if (season.isMatchDay(current)) {
      current = { ...current, match: football.simulate(current, () => .4) }
      assert.equal(season.advanceDay(current), current)
      current = season.progressMatch(current, 9)
    } else current = season.train(current, 'recovery')
    current = season.advanceDay(current)
    model.saveCareer(current)
    current = model.loadCareer()
    assert.ok(current)
  }
  assert.equal(current.day, 8)
  assert.deepEqual(current.history.map(h => h.day), [1, 4, 7])
  assert.notEqual(current.history[0].match.opponent, current.history[1].match.opponent)
  assert.equal(season.advanceDay(current), current)
  assert.equal(season.train(current, 'recovery'), current)
})
test('legacy day-two save archives first match and keeps coach identity', () => {
  saved = JSON.stringify({ ...career, day: 2, match: { ...football.simulate(career), cursor: 9 } })
  const loaded = model.loadCareer()
  assert.equal(loaded.day, 2)
  assert.equal(loaded.history.length, 1)
  assert.equal(loaded.match, undefined)
  assert.equal(loaded.name, career.name)
  assert.equal(loaded.seasonVersion, 3)
})

test('league schedule gives every club six games and balanced home/away fixtures', () => {
  for (const club of model.clubs) {
    const all = types.leagueRounds.flat().filter(pair => pair.includes(club.id))
    assert.equal(all.length, 6)
    assert.equal(all.filter(pair => pair[0] === club.id).length, 3)
    for (const other of model.clubs.filter(c => c.id !== club.id)) assert.equal(all.filter(pair => pair.includes(other.id)).length, 2)
  }
  for (const round of types.leagueRounds) assert.equal(new Set(round.flat()).size, 4)
})
test('league table awards points and resolves draws, wins and goal difference', () => {
  const table = league.standings([{ round: 1, home: 'aurora', away: 'vale', homeGoals: 2, awayGoals: 0 }, { round: 1, home: 'porto', away: 'serra', homeGoals: 1, awayGoals: 1 }])
  assert.equal(table[0].id, 'aurora'); assert.equal(table[0].points, 3)
  assert.equal(table.find(r => r.id === 'porto').points, 1)
  assert.equal(table.find(r => r.id === 'vale').difference, -2)
  assert.equal(table.reduce((s, r) => s + r.goalsFor, 0), table.reduce((s, r) => s + r.goalsAgainst, 0))
})
test('official season preserves six rounds and both fixture results through reloads', () => {
  let current = { ...career, day: 1, seasonVersion: 3 }
  assert.equal(league.startLeague(current), current)
  for (let day = 1; day < 8; day++) {
    current = season.isMatchDay(current) ? season.progressMatch({ ...current, match: football.simulate(current, () => .2) }, 9) : season.train(current, 'recovery')
    current = season.advanceDay(current)
  }
  const previousHistory = structuredClone(current.history)
  current = league.startLeague(current)
  assert.equal(current.leagueActive, true)
  assert.deepEqual(current.history, previousHistory)
  for (let day = 8; day <= 24; day++) {
    assert.equal(current.day, day)
    if (season.isMatchDay(current)) {
      const fixture = league.leagueFixture(current)
      current = { ...current, match: football.simulate(current, () => .2) }
      model.saveCareer(current); current = model.loadCareer()
      assert.equal(current.match.otherResult.round, fixture.round)
      assert.equal((current.leagueResults ?? []).length, (fixture.round - 1) * 2)
      current = season.progressMatch(current, 9)
      assert.equal(current.leagueResults.length, fixture.round * 2)
      assert.deepEqual(league.commitRound(current).leagueResults, current.leagueResults)
      const own = current.leagueResults.find(r => r.round === fixture.round && [r.home, r.away].includes(current.clubId))
      assert.equal(fixture.atHome ? own.homeGoals : own.awayGoals, 9)
    } else current = season.train(current, 'recovery')
    current = season.advanceDay(current)
    model.saveCareer(current); current = model.loadCareer()
    assert.ok(current)
  }
  assert.equal(current.day, 25)
  assert.equal(current.history.length, 9)
  assert.equal(current.leagueResults.length, 12)
  const table = league.standings(current.leagueResults)
  assert.ok(table.every(row => row.played === 6))
  assert.equal(table.find(row => row.id === career.clubId).points, 18)
  assert.equal(season.advanceDay(current), current)
})

function finishSeason(input) {
  let current = input
  for (let day = current.day ?? 1; day <= 24; day++) {
    if (day === 8) current = league.startLeague(current)
    current = season.isMatchDay(current) ? season.progressMatch({ ...current, match: football.simulate(current, () => .2) }, 9) : season.train(current, 'recovery')
    current = season.advanceDay(current)
  }
  return current
}
test('individual stats exclude friendlies and unfinished matches and include final whistle once', () => {
  const match = football.simulate(career, () => .2)
  let current = { ...career, day: 9, leagueActive: true, history: [{ day: 1, match: { ...match, cursor: 9 } }], match: { ...match, cursor: 8 } }
  assert.ok(progression.playerStats(current).every(p => p.appearances === 0))
  current.match.cursor = 9
  assert.equal(progression.playerStats(current).find(p => p.id === 'p1').appearances, 1)
  current.history.push({ day: 9, match: current.match })
  assert.equal(progression.playerStats(current).find(p => p.id === 'p1').appearances, 1)
  assert.equal(progression.playerStats(current).reduce((sum, p) => sum + p.goals, 0), 9)
})
test('growth requires three official games, respects rating threshold and permanent cap', () => {
  const match = { ...football.simulate(career), cursor: 9 }
  const history = [9, 12, 15].map(day => ({ day, match: { ...match, ratings: match.ratings.map(r => ({ ...r, value: 7.5 })) } }))
  const current = { ...career, history }
  assert.equal(progression.playerStats(current).find(p => p.id === 'p1').gain, 2)
  assert.equal(progression.playerStats({ ...current, history: history.slice(0, 2) }).find(p => p.id === 'p1').gain, 0)
  assert.equal(progression.playerStats({ ...current, playerGrowth: { p1: 9 } }).find(p => p.id === 'p1').gain, 1)
  assert.equal(progression.playerStats({ ...current, playerGrowth: { p1: 10 } }).find(p => p.id === 'p1').gain, 0)
  assert.equal(progression.playerStats(current).find(p => p.id === 'p12').gain, 0)
  const baseline = football.strength(model.defaultLineup, '4-3-3', career)
  assert.ok(football.strength(model.defaultLineup, '4-3-3', { ...career, playerGrowth: Object.fromEntries(model.defaultLineup.map(id => [id, 2])) }) > baseline)
})
test('renewal is gated, archives the season deeply and resets only temporary preparation', () => {
  assert.equal(progression.renewSeason(career), career)
  const complete = finishSeason({ ...career, day: 1, seasonNumber: 1 })
  assert.ok(progression.canRenew(complete))
  assert.equal(progression.renewSeason({ ...complete, day: 24 }).day, 24)
  const before = structuredClone(complete)
  const renewed = progression.renewSeason(complete)
  assert.equal(renewed.seasonNumber, 2)
  assert.equal(renewed.day, 1)
  assert.equal(renewed.name, career.name)
  assert.equal(renewed.clubId, career.clubId)
  assert.equal(renewed.leagueActive, false)
  assert.deepEqual(renewed.history, [])
  assert.equal(renewed.preparation.skill, 0)
  assert.equal(renewed.preparation.cohesion, 0)
  assert.ok(Object.values(renewed.preparation.energy).every(n => n === 100))
  assert.deepEqual(renewed.archives[0].results, complete.leagueResults)
  assert.deepEqual(complete, before)
  assert.notEqual(renewed.archives[0].matches, complete.history)
  assert.equal(progression.renewSeason(renewed), renewed)
  model.saveCareer(renewed)
  const loaded = model.loadCareer()
  assert.equal(loaded.seasonNumber, 2)
  assert.equal(loaded.archives[0].matches.length, 9)
  assert.deepEqual(loaded.playerGrowth, renewed.playerGrowth)
})
test('two full seasons can be renewed without overwriting archived fixtures', () => {
  let current = progression.renewSeason(finishSeason({ ...career, day: 1, seasonNumber: 1 }))
  const first = structuredClone(current.archives[0])
  current = progression.renewSeason(finishSeason(current))
  model.saveCareer(current); current = model.loadCareer()
  assert.equal(current.seasonNumber, 3)
  assert.deepEqual(current.archives.map(a => a.number), [1, 2])
  assert.deepEqual(current.archives[0], first)
  assert.ok(Object.values(current.playerGrowth).every(n => n >= 0 && n <= 10))
})
test('legacy saves default to first season and corrupt archives do not discard the coach', () => {
  saved = JSON.stringify({ ...career, archives: [null, { number: 1 }], playerGrowth: { p1: 99, p2: -10 } })
  const loaded = model.loadCareer()
  assert.equal(loaded.name, career.name)
  assert.equal(loaded.seasonNumber, 1)
  assert.deepEqual(loaded.archives, [])
  assert.equal(loaded.playerGrowth.p1, 10)
  assert.equal(loaded.playerGrowth.p2, 0)
})

test('mentality changes only future events and produces the documented risk tradeoff', () => {
  const base = football.simulate(career, () => .5)
  base.events[0] = { ...base.events[0], sideRoll: .45, goalRoll: .25, playerRoll: .2 }
  base.events[1] = { ...base.events[1], sideRoll: .55, goalRoll: .35, playerRoll: .2 }
  let attacking = matchEngine.setMentality({ ...career, match: structuredClone(base) }, 'attacking')
  attacking = season.progressMatch(attacking, 1)
  assert.equal(attacking.match.events[0].side, 'home')
  assert.equal(attacking.match.events[0].goal, true)
  const revealed = structuredClone(attacking.match.events[0])
  attacking = matchEngine.setMentality(attacking, 'defensive')
  attacking = season.progressMatch(attacking, 2)
  assert.deepEqual(attacking.match.events[0], revealed)
  assert.equal(attacking.match.events[1].side, 'away')
  assert.equal(attacking.match.events[1].goal, false)
})

test('three legal substitutions update future scorers and reject invalid changes', () => {
  let current = { ...career, match: { ...football.simulate(career, () => .2), cursor: 1 } }
  const unchanged = matchEngine.substitute(current, 'p1', 'p13')
  assert.equal(unchanged, current)
  current = matchEngine.substitute(current, 'p10', 'p17')
  assert.equal(current.match.lineup.includes('p17'), true)
  assert.equal(current.match.lineup.includes('p10'), false)
  assert.equal(current.match.ratings.length, 12)
  assert.equal(matchEngine.substitute(current, 'p17', 'p10'), current)
  current.match.events[1] = { ...current.match.events[1], sideRoll: 0, goalRoll: 0, playerRoll: .85 }
  current = season.progressMatch(current, 2)
  assert.equal(current.match.events[1].playerId, 'p17')
  current = matchEngine.substitute(current, 'p9', 'p16')
  current = matchEngine.substitute(current, 'p8', 'p15')
  assert.equal(current.match.substitutions.length, 3)
  assert.equal(matchEngine.substitute(current, 'p7', 'p14'), current)
  assert.equal(new Set(current.match.lineup).size, 11)
})

test('fatigue and appearances follow proportional minutes for substitutes', () => {
  let current = { ...career, day: 9, leagueActive: true, match: { ...football.simulate({ ...career, day: 9, leagueActive: true }, () => .2), cursor: 4 } }
  current = matchEngine.substitute(current, 'p10', 'p17')
  assert.equal(matchEngine.minutesPlayed(current.match, 'p10'), 40)
  assert.equal(matchEngine.minutesPlayed(current.match, 'p17'), 50)
  current = season.progressMatch(current, 9)
  assert.ok(season.energy(current, 'p10') > season.energy(current, 'p17'))
  assert.ok(season.energy(current, 'p10') < 100)
  assert.equal(current.match.ratings.length, 12)
  assert.equal(current.match.ratingsFinalized, true)
  const stats = progression.playerStats(current)
  assert.equal(stats.find(player => player.id === 'p10').appearances, 1)
  assert.equal(stats.find(player => player.id === 'p17').appearances, 1)
})

test('market purchase changes budget, wage bill, roster and persists through reload', () => {
  const base = { ...career, roster: [...model.defaultRoster], contracts: model.defaultContracts(), finances: { budget: 22000, wageLimit: 1350 } }
  const wages = transfers.wageUsed(base)
  const bought = transfers.buyPlayer(base, 'm1')
  assert.notEqual(bought, base)
  assert.equal(bought.roster.length, 19)
  assert.ok(bought.roster.includes('m1'))
  assert.equal(bought.finances.budget, 14800)
  assert.equal(transfers.wageUsed(bought), wages + model.marketPlayers[0].wage)
  assert.equal(bought.contracts.m1.seasons, 3)
  assert.equal(season.energy(bought, 'm1'), 100)
  model.saveCareer(bought)
  const loaded = model.loadCareer()
  assert.ok(loaded.roster.includes('m1'))
  assert.equal(loaded.finances.budget, 14800)
  assert.equal(loaded.transfers.at(-1).kind, 'buy')
})

test('market respects squad, budget, wage and live-match safeguards', () => {
  const base = { ...career, roster: [...model.defaultRoster], contracts: model.defaultContracts(), finances: { budget: 100000, wageLimit: 5000 }, lineup: [...model.defaultLineup] }
  let reduced = transfers.sellPlayer(base, 'p12')
  reduced = transfers.sellPlayer(reduced, 'p13')
  assert.equal(reduced.roster.length, 16)
  assert.equal(transfers.sellPlayer(reduced, 'p14'), reduced)
  assert.equal(transfers.sellPlayer(base, 'p1'), base)
  assert.equal(transfers.sellPlayer({ ...base, lineup: undefined }, 'p1').roster.length, 18)
  assert.equal(transfers.buyPlayer({ ...base, finances: { budget: 1, wageLimit: 5000 } }, 'm1').roster.length, 18)
  assert.equal(transfers.buyPlayer({ ...base, finances: { budget: 100000, wageLimit: transfers.wageUsed(base) } }, 'm1').roster.length, 18)
  let full = base
  for (const player of model.marketPlayers.slice(0, 5)) full = transfers.buyPlayer(full, player.id)
  assert.equal(full.roster.length, 23)
  assert.equal(transfers.buyPlayer(full, 'm6'), full)
  const playing = { ...base, match: football.simulate(base, () => .2) }
  assert.equal(transfers.buyPlayer(playing, 'm1'), playing)
})

test('sales return 85 percent and expiring contracts can be renewed', () => {
  const base = { ...career, roster: [...model.defaultRoster], contracts: model.defaultContracts(), finances: { budget: 22000, wageLimit: 1350 }, lineup: [...model.defaultLineup] }
  const value = base.contracts.p12.value
  const sold = transfers.sellPlayer(base, 'p12')
  assert.equal(sold.finances.budget, 22000 + Math.round(value * .85))
  assert.ok(!sold.roster.includes('p12'))
  const expiring = { ...base, contracts: { ...base.contracts, p12: { ...base.contracts.p12, seasons: 1 } } }
  const renewed = transfers.renewContract(expiring, 'p12')
  assert.equal(renewed.contracts.p12.seasons, 3)
  assert.equal(renewed.finances.budget, 22000 - Math.round(value * .1))
  assert.equal(transfers.renewContract(renewed, 'p12'), renewed)
})
