import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const directory = await mkdtemp(join(tmpdir(), 'vt27-tests-'))
let model, football
try {
  for (const name of ['types', 'model', 'football']) {
    const source = await readFile(new URL(`../src/features/career/${name}.ts`, import.meta.url), 'utf8')
    const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } })
    await writeFile(join(directory, `${name}.mjs`), outputText.replace(/from '(\.\/\w+)'/g, "from '$1.mjs'"))
  }
  model = await import(pathToFileURL(join(directory, 'model.mjs')))
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
  loaded.match.cursor = 9; loaded.day = 2
  model.saveCareer(loaded)
  assert.equal(model.loadCareer().day, 2)
  assert.deepEqual(model.loadCareer().match.events, match.events)
})
test('invalid match progress is discarded without discarding the coach', () => {
  saved = JSON.stringify({ ...career, match: { ...football.simulate(career), cursor: 99 } })
  assert.equal(model.loadCareer().name, 'Victor')
  assert.equal(model.loadCareer().match, undefined)
  saved = '{broken'
  assert.equal(model.loadCareer(), null)
})
