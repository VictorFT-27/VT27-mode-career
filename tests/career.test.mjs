import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const directory = await mkdtemp(join(tmpdir(), 'vt27-tests-'))
let model, football, season, league, types
try {
  for (const name of ['types', 'model', 'league', 'season', 'football']) {
    const source = await readFile(new URL(`../src/features/career/${name}.ts`, import.meta.url), 'utf8')
    const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } })
    await writeFile(join(directory, `${name}.mjs`), outputText.replace(/from '(\.\/\w+)'/g, "from '$1.mjs'"))
  }
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
