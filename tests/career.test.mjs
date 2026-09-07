import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const directory = await mkdtemp(join(tmpdir(), 'vt27-tests-'))
let model, football, season, league, cup, cupData, world, types, progression, matchEngine, transfers, board, availability, playerModel, directorModel
try {
  for (const name of ['types', 'realData', 'youthData', 'cupData', 'model', 'board', 'league', 'world', 'transfers', 'cup', 'matchEngine', 'availability', 'season', 'progression', 'football']) {
    const source = await readFile(new URL(`../src/features/career/${name}.ts`, import.meta.url), 'utf8')
    const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } })
    await writeFile(join(directory, `${name}.mjs`), outputText.replace(/from '(\.\/\w+)'/g, "from '$1.mjs'"))
  }
  const playerSource = await readFile(new URL('../src/features/player/playerModel.ts', import.meta.url), 'utf8')
  const playerOutput = ts.transpileModule(playerSource, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
  await writeFile(join(directory, 'playerModel.mjs'), playerOutput.replace("from '../career/realData'", "from './realData.mjs'"))
  playerModel = await import(pathToFileURL(join(directory, 'playerModel.mjs')))
  const directorSource = await readFile(new URL('../src/features/director/directorModel.ts', import.meta.url), 'utf8')
  const directorOutput = ts.transpileModule(directorSource, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
  await writeFile(join(directory, 'directorModel.mjs'), directorOutput.replace(/from '\.\.\/career\/(\w+)'/g, "from './$1.mjs'"))
  directorModel = await import(pathToFileURL(join(directory, 'directorModel.mjs')))
  progression = await import(pathToFileURL(join(directory, 'progression.mjs')))
  matchEngine = await import(pathToFileURL(join(directory, 'matchEngine.mjs')))
  transfers = await import(pathToFileURL(join(directory, 'transfers.mjs')))
  board = await import(pathToFileURL(join(directory, 'board.mjs')))
  availability = await import(pathToFileURL(join(directory, 'availability.mjs')))
  league = await import(pathToFileURL(join(directory, 'league.mjs')))
  cup = await import(pathToFileURL(join(directory, 'cup.mjs')))
  cupData = await import(pathToFileURL(join(directory, 'cupData.mjs')))
  world = await import(pathToFileURL(join(directory, 'world.mjs')))
  types = await import(pathToFileURL(join(directory, 'types.mjs')))
  model = await import(pathToFileURL(join(directory, 'model.mjs')))
  season = await import(pathToFileURL(join(directory, 'season.mjs')))
  football = await import(pathToFileURL(join(directory, 'football.mjs')))
} finally { await rm(directory, { recursive: true, force: true }) }
const career = { mode: 'coach', name: 'Victor', clubId: 'flamengo', formation: '4-3-3', dataVersion: 2 }
let saved = null
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => saved, setItem: (_, value) => { saved = value } } })

test('lineup has 11 unique starters and 7 reserves; swaps preserve both invariants', () => {
  const initial = football.lineupOf(career)
  assert.equal(model.squad.length, 18)
  const next = football.swap(initial, 9, 'fla17')
  assert.equal(next[9], 'fla17')
  assert.ok(!next.includes('fla10'))
  assert.ok(model.validLineup(next))
  assert.deepEqual(initial, model.defaultLineup)
  const swapped = football.swap(initial, 1, initial[2])
  assert.equal(swapped[1], initial[2]); assert.equal(swapped[2], initial[1])
})
test('each real club starts with its own 18-player squad and valid lineup', () => {
  assert.equal(model.clubs.length, 20)
  assert.deepEqual(model.clubs.slice(0, 4).map(club => club.name), ['Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo'])
  const rosters = model.clubs.map(club => model.createCareer('Victor', club.id))
  for (const created of rosters) {
    assert.equal(created.roster.length, 18)
    assert.equal(created.lineup.length, 11)
    assert.ok(model.validLineup(created.lineup))
    assert.ok(model.rosterOf(created).every(player => player.clubId === created.clubId))
  }
  assert.equal(new Set(rosters.flatMap(created => created.roster)).size, 360)
})
test('keeper rules reject invalid swaps but accept reserve goalkeeper', () => {
  const initial = football.lineupOf(career)
  assert.deepEqual(football.swap(initial, 0, 'fla2'), initial)
  assert.deepEqual(football.swap(initial, 1, 'fla12'), initial)
  assert.deepEqual(football.swap(initial, -1, 'fla12'), initial)
  assert.ok(model.validLineup(football.swap(initial, 0, 'fla12')))
})
test('position mismatch reduces strength', () => {
  const initial = football.lineupOf(career)
  assert.ok(football.strength(football.swap(initial, 1, 'fla10'), '4-3-3') < football.strength(initial, '4-3-3'))
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
test('career loads club-specific defaults and rejects duplicate starters', () => {
  saved = JSON.stringify(career)
  assert.equal(model.loadCareer().name, 'Victor')
  assert.deepEqual(model.loadCareer().lineup, model.defaultLineup)
  assert.equal(model.loadCareer().day, 1)
  assert.deepEqual(model.loadCareer().roster, model.defaultRoster)
  assert.equal(Object.keys(model.loadCareer().contracts).length, 18)
  assert.equal(model.loadCareer().finances.budget, model.defaultFinances.flamengo.budget)
  assert.deepEqual(model.loadCareer().board, model.defaultBoard())
  assert.equal(Object.keys(model.loadCareer().availability).length, 18)
  assert.ok(Object.values(model.loadCareer().availability).every(state => state.injuredMatches === 0 && state.suspensionMatches === 0 && state.yellowCards === 0))
  saved = JSON.stringify({ ...career, lineup: Array(11).fill('fla1') })
  assert.deepEqual(model.loadCareer().lineup, model.defaultLineup)
})
test('fictional career migrates to its real club without losing progress', () => {
  saved = JSON.stringify({ ...career, clubId: 'aurora', roster: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16', 'p17', 'p18'], lineup: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11'], playerGrowth: { p1: 2 } })
  const loaded = model.loadCareer()
  assert.equal(loaded.clubId, 'flamengo')
  assert.equal(loaded.roster[0], 'fla1')
  assert.equal(loaded.lineup[10], 'fla11')
  assert.equal(loaded.playerGrowth.fla1, 2)
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
  assert.equal(season.energy(trained, 'fla1'), 90)
  assert.equal(trained.preparation.skill, 1)
  assert.equal(season.train(trained, 'tactical'), trained)
  assert.equal(season.advanceDay(base), base)
  assert.equal(season.advanceDay(trained).day, 3)
  assert.equal(season.energy(season.advanceDay(trained), 'fla1'), 98)
})
test('fatigue applies only to match starters and only once at full time', () => {
  const base = { ...career, match: football.simulate(career) }
  const ongoing = season.progressMatch(base, 4)
  assert.equal(season.energy(ongoing, 'fla1'), 100)
  const done = season.progressMatch(ongoing, 9)
  assert.equal(season.energy(done, 'fla1'), 76)
  assert.equal(season.energy(done, 'fla12'), 100)
  assert.equal(season.progressMatch(done, 9), done)
  const rested = season.advanceDay(done)
  assert.equal(season.energy(rested, 'fla1'), 84)
  assert.equal(rested.history.length, 1)
  assert.equal(rested.match, undefined)
})
test('fitness reduces fatigue, low energy lowers strength and recovery is capped', () => {
  const prep = season.preparation(career)
  const tired = { ...career, day: 2, preparation: { ...prep, energy: Object.fromEntries(model.squad.map(p => [p.id, 50])) } }
  assert.ok(football.strength(model.defaultLineup, '4-3-3', tired) < football.strength(model.defaultLineup, '4-3-3', career))
  const recovered = season.train(tired, 'recovery')
  assert.equal(season.energy(recovered, 'fla1'), 70)
  const fit = { ...career, preparation: { ...prep, fitness: 3 }, match: football.simulate(career) }
  assert.equal(season.energy(season.progressMatch(fit, 9), 'fla1'), 82)
  assert.equal(season.energy(season.train({ ...career, day: 2 }, 'recovery'), 'fla1'), 100)
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

test('league schedule gives every club 38 games and balanced home/away fixtures', () => {
  for (const club of model.clubs) {
    const all = types.leagueRounds.flat().filter(pair => pair.includes(club.id))
    assert.equal(all.length, 38)
    assert.equal(all.filter(pair => pair[0] === club.id).length, 19)
    for (const other of model.clubs.filter(c => c.id !== club.id)) assert.equal(all.filter(pair => pair.includes(other.id)).length, 2)
  }
  for (const round of types.leagueRounds) assert.equal(new Set(round.flat()).size, 20)
})
test('league table awards points and resolves draws, wins and goal difference', () => {
  const table = league.standings([{ round: 1, home: 'flamengo', away: 'sao-paulo', homeGoals: 2, awayGoals: 0 }, { round: 1, home: 'palmeiras', away: 'corinthians', homeGoals: 1, awayGoals: 1 }])
  assert.equal(table[0].id, 'flamengo'); assert.equal(table[0].points, 3)
  assert.equal(table.find(r => r.id === 'palmeiras').points, 1)
  assert.equal(table.find(r => r.id === 'sao-paulo').difference, -2)
  assert.equal(table.reduce((s, r) => s + r.goalsFor, 0), table.reduce((s, r) => s + r.goalsAgainst, 0))
})
test('national cup starts with 32 real clubs and advances over two legs', () => {
  let current = { ...career, day: 20, leagueActive: true, cup: cupData.createCupState(1), finances: { budget: 22000, wageLimit: 1350 } }
  assert.equal(current.cup.ties.length, 16)
  assert.equal(new Set(current.cup.ties.flatMap(tie => [tie.home, tie.away])).size, 32)
  assert.ok(cup.cupFixture(current))
  current = season.progressMatch({ ...current, match: football.simulate(current, () => .2) }, 9)
  assert.equal(current.cup.stage, 5)
  assert.equal(current.cup.results.length, 16)
  current = season.advanceDay(current)
  current = { ...current, day: 23, match: undefined }
  current = season.progressMatch({ ...current, match: football.simulate(current, () => .2) }, 9)
  assert.equal(current.cup.stage, 6)
  assert.equal(current.cup.ties.length, 8)
  assert.equal(current.cup.prize, 1500)
  assert.equal(current.finances.budget, 23500)
})

test('a running save can join the next available cup stage', () => {
  const migrated = cupData.createCupStateForDay(1, 50, career.clubId)
  assert.equal(migrated.stage, 7)
  assert.equal(migrated.ties.length, 4)
  assert.ok(migrated.ties.some(tie => [tie.home, tie.away].includes(career.clubId)))
})
test('official season preserves 38 rounds and all fixture results through reloads', () => {
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
  for (let day = 8; day < types.leagueEndDay; day++) {
    assert.equal(current.day, day)
    if (season.isMatchDay(current)) {
      const fixture = league.leagueFixture(current)
      current = { ...current, match: football.simulate(current, () => .2) }
      model.saveCareer(current); current = model.loadCareer()
      if (fixture) {
        assert.equal(current.match.otherResults.length, 9)
        assert.ok(current.match.otherResults.every(result => result.round === fixture.round))
        assert.equal((current.leagueResults ?? []).length, (fixture.round - 1) * 10)
      } else assert.equal(current.match.otherResults, undefined)
      current = season.progressMatch(current, 9)
      if (fixture) {
        assert.equal(current.leagueResults.length, fixture.round * 10)
        assert.deepEqual(league.commitRound(current).leagueResults, current.leagueResults)
        const own = current.leagueResults.find(r => r.round === fixture.round && [r.home, r.away].includes(current.clubId))
        assert.equal(fixture.atHome ? own.homeGoals : own.awayGoals, 9)
      }
    } else current = season.train(current, 'recovery')
    current = season.advanceDay(current)
    model.saveCareer(current); current = model.loadCareer()
    assert.ok(current)
  }
  assert.equal(current.day, types.leagueEndDay)
  assert.equal(current.history.length, 50)
  assert.equal(current.leagueResults.length, 380)
  const table = league.standings(current.leagueResults)
  assert.ok(table.every(row => row.played === 38))
  assert.equal(table.find(row => row.id === career.clubId).points, 114)
  assert.equal(season.advanceDay(current), current)
})

function finishSeason(input) {
  let current = input
  for (let day = current.day ?? 1; day < types.leagueEndDay; day++) {
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
  assert.equal(progression.playerStats(current).find(p => p.id === 'fla1').appearances, 1)
  current.history.push({ day: 9, match: current.match })
  assert.equal(progression.playerStats(current).find(p => p.id === 'fla1').appearances, 1)
  assert.equal(progression.playerStats(current).reduce((sum, p) => sum + p.goals, 0), 9)
})
test('growth requires three official games, respects rating threshold and permanent cap', () => {
  const match = { ...football.simulate(career), cursor: 9 }
  const history = [9, 12, 15].map(day => ({ day, match: { ...match, ratings: match.ratings.map(r => ({ ...r, value: 7.5 })) } }))
  const current = { ...career, history }
  assert.equal(progression.playerStats(current).find(p => p.id === 'fla1').gain, 2)
  assert.equal(progression.playerStats({ ...current, history: history.slice(0, 2) }).find(p => p.id === 'fla1').gain, 0)
  assert.equal(progression.playerStats({ ...current, playerGrowth: { fla1: 9 } }).find(p => p.id === 'fla1').gain, 1)
  assert.equal(progression.playerStats({ ...current, playerGrowth: { fla1: 10 } }).find(p => p.id === 'fla1').gain, 0)
  assert.equal(progression.playerStats(current).find(p => p.id === 'fla12').gain, 0)
  const baseline = football.strength(model.defaultLineup, '4-3-3', career)
  assert.ok(football.strength(model.defaultLineup, '4-3-3', { ...career, playerGrowth: Object.fromEntries(model.defaultLineup.map(id => [id, 2])) }) > baseline)
})
test('renewal is gated, archives the season deeply and resets only temporary preparation', () => {
  assert.equal(progression.renewSeason(career), career)
  const complete = finishSeason({ ...career, day: 1, seasonNumber: 1 })
  assert.ok(progression.canRenew(complete))
  assert.equal(progression.renewSeason({ ...complete, day: types.leagueEndDay - 1 }).day, types.leagueEndDay - 1)
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
  assert.deepEqual(board.boardOf(renewed), model.defaultBoard())
  assert.ok(Object.values(renewed.preparation.energy).every(n => n === 100))
  assert.deepEqual(renewed.archives[0].results, complete.leagueResults)
  assert.deepEqual(complete, before)
  assert.notEqual(renewed.archives[0].matches, complete.history)
  assert.equal(progression.renewSeason(renewed), renewed)
  model.saveCareer(renewed)
  const loaded = model.loadCareer()
  assert.equal(loaded.seasonNumber, 2)
  assert.equal(loaded.archives[0].matches.length, 50)
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
test('saves default to first season and corrupt archives do not discard the coach', () => {
  saved = JSON.stringify({ ...career, archives: [null, { number: 1 }], playerGrowth: { fla1: 99, fla2: -10 } })
  const loaded = model.loadCareer()
  assert.equal(loaded.name, career.name)
  assert.equal(loaded.seasonNumber, 1)
  assert.deepEqual(loaded.archives, [])
  assert.equal(loaded.playerGrowth.fla1, 10)
  assert.equal(loaded.playerGrowth.fla2, 0)
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
  const unchanged = matchEngine.substitute(current, 'fla1', 'fla13')
  assert.equal(unchanged, current)
  current = matchEngine.substitute(current, 'fla10', 'fla17')
  assert.equal(current.match.lineup.includes('fla17'), true)
  assert.equal(current.match.lineup.includes('fla10'), false)
  assert.equal(current.match.ratings.length, 12)
  assert.equal(matchEngine.substitute(current, 'fla17', 'fla10'), current)
  current.match.events[1] = { ...current.match.events[1], sideRoll: 0, goalRoll: 0, playerRoll: .85 }
  current = season.progressMatch(current, 2)
  assert.equal(current.match.events[1].playerId, 'fla17')
  current = matchEngine.substitute(current, 'fla9', 'fla16')
  current = matchEngine.substitute(current, 'fla8', 'fla15')
  assert.equal(current.match.substitutions.length, 3)
  assert.equal(matchEngine.substitute(current, 'fla7', 'fla14'), current)
  assert.equal(new Set(current.match.lineup).size, 11)
})

test('fatigue and appearances follow proportional minutes for substitutes', () => {
  let current = { ...career, day: 9, leagueActive: true, match: { ...football.simulate({ ...career, day: 9, leagueActive: true }, () => .2), cursor: 4 } }
  current = matchEngine.substitute(current, 'fla10', 'fla17')
  assert.equal(matchEngine.minutesPlayed(current.match, 'fla10'), 40)
  assert.equal(matchEngine.minutesPlayed(current.match, 'fla17'), 50)
  current = season.progressMatch(current, 9)
  assert.ok(season.energy(current, 'fla10') > season.energy(current, 'fla17'))
  assert.ok(season.energy(current, 'fla10') < 100)
  assert.equal(current.match.ratings.length, 12)
  assert.equal(current.match.ratingsFinalized, true)
  const stats = progression.playerStats(current)
  assert.equal(stats.find(player => player.id === 'fla10').appearances, 1)
  assert.equal(stats.find(player => player.id === 'fla17').appearances, 1)
})

test('market purchase changes budget, wage bill, roster and persists through reload', () => {
  const base = { ...career, roster: [...model.defaultRoster], contracts: model.defaultContracts(), finances: { budget: 50000, wageLimit: 5000 } }
  const wages = transfers.wageUsed(base)
  const target = model.marketPlayers[0]
  const bought = transfers.buyPlayer(base, target.id)
  assert.notEqual(bought, base)
  assert.equal(bought.roster.length, 19)
  assert.ok(bought.roster.includes(target.id))
  assert.equal(bought.finances.budget, 34000)
  assert.equal(transfers.wageUsed(bought), wages + model.marketPlayers[0].wage)
  assert.equal(bought.contracts[target.id].seasons, 3)
  assert.equal(season.energy(bought, target.id), 100)
  model.saveCareer(bought)
  const loaded = model.loadCareer()
  assert.ok(loaded.roster.includes(target.id))
  assert.equal(loaded.finances.budget, 34000)
  assert.equal(loaded.transfers.at(-1).kind, 'buy')
  assert.equal(world.clubOf(loaded, target.id), loaded.clubId)
})

test('persistent world ages players, moves CPU squads, creates offers and promotes youth', () => {
  const created = model.createCareer('Victor', 'flamengo')
  assert.equal(Object.keys(created.world.playerClubs).length, 360)
  assert.equal(created.world.prospects.length, 3)
  const prospect = created.world.prospects[0]
  const promoted = world.promoteProspect(created, prospect)
  assert.ok(promoted.roster.includes(prospect))
  assert.equal(world.clubOf(promoted, prospect), promoted.clubId)
  assert.equal(promoted.contracts[prospect].seasons, 3)
  const renewed = progression.renewSeason(finishSeason({ ...promoted, day: 1 }))
  assert.equal(world.ageOf(renewed, 'fla1'), world.ageOf(promoted, 'fla1') + 1)
  assert.equal(renewed.world.transfers.filter(item => item.season === 2).length, 19)
  assert.equal(new Set(renewed.world.transfers.filter(item => item.season === 2).map(item => item.playerId)).size, 19)
  assert.equal(renewed.world.managerOffers.length, 3)
  assert.equal(renewed.world.prospects.length, 3)
  assert.ok(renewed.world.retirements.length > 0)
  const destination = renewed.world.managerOffers[0]
  const switched = world.acceptManagerOffer(renewed, destination)
  assert.equal(switched.clubId, destination)
  assert.ok(switched.roster.length >= 16)
  assert.ok(model.validLineup(switched.lineup))
  assert.deepEqual(switched.world.managerOffers, [])
  model.saveCareer(switched)
  const loaded = model.loadCareer()
  assert.equal(loaded.clubId, destination)
  assert.equal(loaded.world.transfers.length, switched.world.transfers.length)
})

test('market respects squad, budget, wage and live-match safeguards', () => {
  const base = { ...career, roster: [...model.defaultRoster], contracts: model.defaultContracts(), finances: { budget: 100000, wageLimit: 5000 }, lineup: [...model.defaultLineup] }
  let reduced = transfers.sellPlayer(base, 'fla12')
  reduced = transfers.sellPlayer(reduced, 'fla13')
  assert.equal(reduced.roster.length, 16)
  assert.equal(transfers.sellPlayer(reduced, 'fla14'), reduced)
  assert.equal(transfers.sellPlayer(base, 'fla1'), base)
  assert.equal(transfers.sellPlayer({ ...base, lineup: undefined }, 'fla1').roster.length, 18)
  assert.equal(transfers.buyPlayer({ ...base, finances: { budget: 1, wageLimit: 5000 } }, model.marketPlayers[0].id).roster.length, 18)
  assert.equal(transfers.buyPlayer({ ...base, finances: { budget: 100000, wageLimit: transfers.wageUsed(base) } }, model.marketPlayers[0].id).roster.length, 18)
  let full = base
  for (const player of model.marketPlayers.slice(0, 5)) full = transfers.buyPlayer(full, player.id)
  assert.equal(full.roster.length, 23)
  assert.equal(transfers.buyPlayer(full, model.marketPlayers[5].id), full)
  const playing = { ...base, match: football.simulate(base, () => .2) }
  assert.equal(transfers.buyPlayer(playing, model.marketPlayers[0].id), playing)
})

test('sales return 85 percent and expiring contracts can be renewed', () => {
  const base = { ...career, roster: [...model.defaultRoster], contracts: model.defaultContracts(), finances: { budget: 22000, wageLimit: 1350 }, lineup: [...model.defaultLineup] }
  const value = base.contracts.fla12.value
  const sold = transfers.sellPlayer(base, 'fla12')
  assert.equal(sold.finances.budget, 22000 + Math.round(value * .85))
  assert.ok(!sold.roster.includes('fla12'))
  const expiring = { ...base, contracts: { ...base.contracts, fla12: { ...base.contracts.fla12, seasons: 1 } } }
  const renewed = transfers.renewContract(expiring, 'fla12')
  assert.equal(renewed.contracts.fla12.seasons, 3)
  assert.equal(renewed.finances.budget, 22000 - Math.round(value * .1))
  assert.equal(transfers.renewContract(renewed, 'fla12'), renewed)
})

test('board rewards results, target position and controlled finances once per round', () => {
  const base = { ...career, finances: { budget: 22000, wageLimit: 5000 }, contracts: model.defaultContracts(), roster: [...model.defaultRoster] }
  const result = { round: 1, home: 'flamengo', away: 'sao-paulo', homeGoals: 2, awayGoals: 0 }
  const reviewed = board.reviewRound(base, result, 1, 2)
  assert.equal(reviewed.board.confidence, 82)
  assert.equal(reviewed.board.status, 'secure')
  assert.equal(reviewed.board.history.length, 1)
  assert.equal(reviewed.board.history[0].delta, 12)
  assert.equal(board.reviewRound(reviewed, result, 1, 2), reviewed)
})

test('repeated poor results create pressure and can dismiss the manager', () => {
  let current = { ...career, finances: { budget: 22000, wageLimit: 5000 }, contracts: model.defaultContracts(), roster: [...model.defaultRoster] }
  for (let round = 1; round <= 4; round++) current = board.reviewRound(current, { round, home: 'flamengo', away: 'sao-paulo', homeGoals: 0, awayGoals: 2 }, 4, 2)
  assert.equal(current.board.confidence, 18)
  assert.equal(current.board.status, 'dismissed')
  assert.equal(current.board.history.length, 4)
  assert.equal(season.train({ ...current, day: 2 }, 'recovery').board.status, 'dismissed')
  assert.equal(transfers.buyPlayer(current, model.marketPlayers[0].id), current)
  assert.equal(progression.canRenew({ ...current, day: types.leagueEndDay, leagueActive: true }), false)
})

test('league final whistle records one board meeting alongside the round', () => {
  let current = { ...career, day: 9, leagueActive: true, finances: { budget: 22000, wageLimit: 1350 }, contracts: model.defaultContracts(), roster: [...model.defaultRoster] }
  current = { ...current, match: football.simulate(current, () => .2) }
  current = season.progressMatch(current, 9)
  assert.equal(current.board.lastRound, 1)
  assert.equal(current.board.history.length, 1)
  const recommitted = league.commitRound(current)
  assert.equal(recommitted.board.history.length, 1)
  model.saveCareer(recommitted)
  assert.equal(model.loadCareer().board.history.length, 1)
})

test('post-match discipline creates cards and a two-game injury exactly once', () => {
  const match = { ...football.simulate(career, () => .5), cursor: 9, disciplineRolls: [0, .1, 0, .2, 0, .3] }
  const settled = availability.settleAvailability({ ...career, match })
  assert.deepEqual(settled.match.yellowCards, ['fla2', 'fla3'])
  assert.deepEqual(settled.match.injury, { playerId: 'fla4', matches: 2 })
  assert.equal(settled.availability.fla2.yellowCards, 1)
  assert.equal(settled.availability.fla3.yellowCards, 1)
  assert.equal(settled.availability.fla4.injuredMatches, 2)
  assert.equal(availability.unavailableLineup({ ...settled, lineup: [...model.defaultLineup] }).includes('fla4'), true)
  assert.equal(availability.settleAvailability(settled), settled)
})

test('third yellow causes suspension and absences count down after later matches', () => {
  const initialAvailability = Object.fromEntries(model.squad.map(player => [player.id, { injuredMatches: player.id === 'fla4' ? 2 : 0, suspensionMatches: 0, yellowCards: player.id === 'fla2' ? 2 : 0 }]))
  const firstMatch = { ...football.simulate(career, () => .5), cursor: 9, disciplineRolls: [0, .1, 1, .2, 1, .3] }
  let current = availability.settleAvailability({ ...career, availability: initialAvailability, match: firstMatch })
  assert.equal(current.availability.fla2.yellowCards, 0)
  assert.equal(current.availability.fla2.suspensionMatches, 1)
  assert.equal(current.availability.fla4.injuredMatches, 1)
  const cleanMatch = { ...football.simulate(career, () => .5), cursor: 9, disciplineRolls: [1, .1, 1, .2, 1, .3] }
  current = availability.settleAvailability({ ...current, match: cleanMatch })
  assert.equal(current.availability.fla2.suspensionMatches, 0)
  assert.equal(current.availability.fla4.injuredMatches, 0)
})

test('new signings start available and season renewal clears medical status', () => {
  const base = { ...career, roster: [...model.defaultRoster], contracts: model.defaultContracts(), finances: { budget: 50000, wageLimit: 5000 }, availability: { fla1: { injuredMatches: 1, suspensionMatches: 0, yellowCards: 2 } } }
  const target = model.marketPlayers[0]
  const bought = transfers.buyPlayer(base, target.id)
  assert.deepEqual(bought.availability[target.id], { injuredMatches: 0, suspensionMatches: 0, yellowCards: 0 })
  const complete = finishSeason({ ...bought, day: 1, seasonNumber: 1 })
  const renewed = progression.renewSeason(complete)
  assert.ok(Object.values(renewed.availability).every(state => state.injuredMatches === 0 && state.suspensionMatches === 0 && state.yellowCards === 0))
})

test('player career creates a custom prospect and preserves the coach save separately', () => {
  const player = playerModel.createPlayerCareer('Victor', 'santos', 'ATA', 27)
  assert.equal(player.mode, 'player')
  assert.equal(player.age, 17)
  assert.equal(player.clubId, 'santos')
  assert.equal(player.shirtNumber, 27)
  assert.equal(playerModel.playerRole(player), 'bench')
  assert.ok(playerModel.playerOverall(player) >= 60)
  assert.ok(playerModel.savePlayerCareer(player))
  assert.equal(playerModel.loadPlayerCareer().name, 'Victor')
})

test('individual training is limited to one session per round and develops attributes', () => {
  const player = playerModel.createPlayerCareer('Victor', 'santos', 'PE', 11)
  const trained = playerModel.trainPlayer(player, 'finishing')
  assert.equal(trained.attributes.shooting, player.attributes.shooting + 1)
  assert.ok(trained.energy < player.energy)
  assert.ok(trained.trust > player.trust)
  assert.equal(trained.trainingCompleted, true)
  assert.deepEqual(playerModel.trainPlayer(trained, 'physical'), trained)
})

test('twelve player rounds award experience, unlock offers and carry history into a transfer', () => {
  let player = playerModel.createPlayerCareer('Victor', 'santos', 'ATA', 9)
  let started = false
  for (let round = 0; round < 12; round++) {
    player = playerModel.trainPlayer(player, round % 2 ? 'physical' : 'finishing')
    player = playerModel.playPlayerRound(player, round % 3 === 0 ? 'bold' : 'team')
    started ||= player.matches.at(-1).role === 'starter'
  }
  assert.equal(player.round, 12)
  assert.equal(player.seasonComplete, true)
  assert.equal(player.matches.length, 12)
  assert.ok(started)
  assert.ok(player.stats.appearances >= 10)
  assert.ok(player.offers.length >= 3)
  assert.ok(player.skillPoints > 0)
  const improved = playerModel.improvePlayer(player, 'shooting')
  assert.equal(improved.attributes.shooting, player.attributes.shooting + 1)
  const external = improved.offers.find(offer => offer.clubId !== improved.clubId)
  const transferred = playerModel.acceptPlayerOffer(improved, external.clubId)
  assert.equal(transferred.season, 2)
  assert.equal(transferred.round, 0)
  assert.equal(transferred.clubId, external.clubId)
  assert.equal(transferred.seasons.length, 1)
  assert.equal(transferred.allTime.appearances, player.stats.appearances)
  assert.equal(transferred.stats.appearances, 0)
})

test('a player can remain under contract without accepting a new offer', () => {
  let player = playerModel.createPlayerCareer('Victor', 'flamengo', 'MC', 10)
  for (let round = 0; round < 12; round++) player = playerModel.playPlayerRound(player, 'safe')
  const next = playerModel.stayUnderContract(player)
  assert.equal(next.clubId, 'flamengo')
  assert.equal(next.season, 2)
  assert.equal(next.contract.seasons, 2)
  assert.equal(next.seasonComplete, false)
})

test('director career starts with official squad, club finances and independent save', () => {
  const director = directorModel.createDirectorCareer('Victor', 'palmeiras')
  assert.equal(director.mode, 'director')
  assert.equal(director.clubId, 'palmeiras')
  assert.equal(director.squad.length, 18)
  assert.equal(directorModel.directorSquad(director).every(player => player.clubId === 'palmeiras'), true)
  assert.ok(director.budget > 0)
  assert.equal(director.prospects.length, 3)
  assert.ok(directorModel.saveDirectorCareer(director))
  assert.equal(directorModel.loadDirectorCareer().name, 'Victor')
})

test('director can hire a coach, improve structure and promote a prospect within budget', () => {
  const director = directorModel.createDirectorCareer('Victor', 'flamengo')
  const hired = directorModel.hireCoach(director, 'c2')
  assert.equal(hired.coach.id, 'c2')
  assert.ok(hired.budget < director.budget)
  const upgraded = directorModel.upgradeStructure(hired, 'academy')
  assert.equal(upgraded.structures.academy, 2)
  const promoted = directorModel.promoteDirectorProspect(upgraded, upgraded.prospects[0])
  assert.equal(promoted.squad.length, 19)
  assert.equal(promoted.promoted, 1)
  assert.equal(promoted.prospects.length, 2)
})

test('director market enforces squad rules and records transfers in the budget', () => {
  const director = directorModel.createDirectorCareer('Victor', 'flamengo')
  const target = directorModel.directorPlayer(director.market[0])
  const bought = directorModel.buyDirectorPlayer(director, target.id)
  assert.equal(bought.squad.includes(target.id), true)
  assert.equal(bought.budget, director.budget - target.value)
  const sold = directorModel.sellDirectorPlayer(bought, target.id)
  assert.equal(sold.squad.includes(target.id), false)
  assert.equal(sold.budget, bought.budget + Math.round(target.value * .82))
})

test('ten executive cycles close a season and preserve the multi-year project', () => {
  let director = directorModel.createDirectorCareer('Victor', 'bahia')
  for (let cycle = 0; cycle < 10; cycle++) director = directorModel.advanceDirectorCycle(director)
  assert.equal(director.cycle, 10)
  assert.equal(director.seasonComplete, true)
  assert.equal(director.cycles.length, 10)
  assert.ok(director.revenue > 0)
  assert.ok(director.expenses > 0)
  const next = directorModel.renewDirectorSeason(director)
  assert.equal(next.season, 2)
  assert.equal(next.cycle, 0)
  assert.equal(next.seasons.length, 1)
  assert.equal(next.structures.training, director.structures.training)
  assert.equal(next.squad.length, director.squad.length)
  assert.equal(next.prospects.length, 3)
})
