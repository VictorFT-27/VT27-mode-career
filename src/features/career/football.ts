import { overall } from './progression'
import { leagueFixture } from './league'
import { energy, preparation } from './season'
import { clubs, defaultLineup, squad, validLineup, type Career } from './model'
import { positions, type Formation, type Match, leagueRounds } from './types'
export function player(id: string) { return squad.find(p => p.id === id)! }
export function lineupOf(career: Career) { return validLineup(career.lineup) ? career.lineup : [...defaultLineup] }
export function fit(id: string, position: string) {
  const actual = player(id).position
  if (actual === position) return 1
  if ([['LD', 'MD', 'PD'], ['LE', 'ME', 'PE'], ['VOL', 'MC'], ['ATA', 'PD', 'PE']].some(group => group.includes(actual) && group.includes(position))) return .96
  return .86
}
export function strength(lineup: string[], formation: Formation, career?: Career) {
  return Math.round(lineup.reduce((sum, id, i) => sum + ((career ? overall(career, id) : player(id).rating) + (career ? preparation(career).skill : 0)) * fit(id, positions[formation][i]) * (career ? .7 + .3 * energy(career, id) / 100 : 1), 0) / 11 + (career ? preparation(career).cohesion : 0))
}
export function swap(lineup: string[], slot: number, id: string): string[] {
  if (!Number.isInteger(slot) || slot < 0 || slot > 10 || !squad.some(p => p.id === id)) return lineup
  const next = [...lineup]
  const previousSlot = next.indexOf(id)
  if (previousSlot >= 0) next[previousSlot] = next[slot]
  next[slot] = id
  return validLineup(next) ? next : lineup
}
export function score(match: Match, cursor = match.cursor) {
  const events = match.events.slice(0, cursor)
  return { home: events.filter(e => e.goal && e.side === 'home').length, away: events.filter(e => e.goal && e.side === 'away').length }
}
export function simulate(career: Career, random = Math.random): Match {
  const lineup = lineupOf(career)
  const power = strength(lineup, career.formation, career)
  const fixture = leagueFixture(career)
  const opponents = clubs.slice(0, 3).filter(c => c.id !== career.clubId)
  const opponent = fixture ? clubs.find(c => c.id === fixture.opponent)! : opponents[Math.floor(((career.day ?? 1) - 1) / 3) % opponents.length]
  const homeChance = Math.max(.3, Math.min(.7, .5 + (power - 70) / 100))
  const events = Array.from({ length: 9 }, (_, index) => {
    const sideRoll = random()
    const goalRoll = random()
    const playerRoll = random()
    const side = sideRoll < homeChance ? 'home' as const : 'away' as const
    const goal = goalRoll < .3
    const id = lineup[1 + Math.min(9, Math.floor(playerRoll * 10))]
    const actor = side === 'home' ? player(id).name : opponent.name
    return { minute: (index + 1) * 10, side, goal, text: goal ? `Gol! ${actor} aproveita a oportunidade e marca.` : `${actor} cria uma chance, mas a jogada termina sem gol.`, sideRoll, goalRoll, playerRoll, ...(side === 'home' ? { playerId: id } : {}) }
  })
  const home = events.filter(e => e.side === 'home' && e.goal).length
  const away = events.filter(e => e.side === 'away' && e.goal).length
  const ratings = lineup.map(id => ({ playerId: id, value: Math.round(Math.max(1, Math.min(10, 6 + random() * 1.2 + (home - away) * .2 + events.filter(e => e.playerId === id && e.goal).length * .7)) * 10) / 10 }))
  const pair = fixture ? leagueRounds[fixture.round - 1].find(([home, away]) => home !== career.clubId && away !== career.clubId) : undefined
  const otherResult = pair && fixture ? { round: fixture.round, home: pair[0], away: pair[1], homeGoals: Math.floor(random() * 4), awayGoals: Math.floor(random() * 4) } : undefined
  return { ...(otherResult ? { otherResult } : {}), opponent: opponent.id, startingLineup: [...lineup], lineup: [...lineup], formation: career.formation, strength: power, events, ratings, cursor: 0, mentality: 'balanced', substitutions: [] }
}
