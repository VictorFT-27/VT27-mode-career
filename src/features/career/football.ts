import { overall } from './progression'
import { leagueFixture } from './league'
import { cupFixture } from './cup'
import { energy, preparation } from './season'
import { allClubs, allPlayers, clubs, defaultRosterFor, lineupForRoster, validLineup, type Career } from './model'
import { positions, type Formation, type Match, leagueRounds } from './types'
import { tacticalBonus, tacticsOf } from './tactics'
import { unavailable } from './availability'
export function player(id: string) { return allPlayers.find(p => p.id === id)! }
export function lineupOf(career: Career) { const roster = career.roster ?? defaultRosterFor(career.clubId); return validLineup(career.lineup) && career.lineup.every(id => roster.includes(id)) ? career.lineup : lineupForRoster(roster, career.clubId) }
export function fit(id: string, position: string) {
  const actual = player(id).position
  if (actual === position) return 1
  if ([['LD', 'MD', 'PD'], ['LE', 'ME', 'PE'], ['VOL', 'MC'], ['ATA', 'PD', 'PE']].some(group => group.includes(actual) && group.includes(position))) return .96
  return .86
}
export function strength(lineup: string[], formation: Formation, career?: Career) {
  const prep = career ? preparation(career) : undefined
  const technicalBonus = prep ? (prep.skill - 50) / 10 : 0
  const collectiveBonus = prep ? ((prep.cohesion - 50) + ((prep.sharpness ?? 50) - 50) + ((prep.morale ?? 60) - 60)) / 18 : 0
  return Math.round(lineup.reduce((sum, id, i) => sum + ((career ? overall(career, id) : player(id).rating) + technicalBonus) * fit(id, positions[formation][i]) * (career ? .7 + .3 * energy(career, id) / 100 : 1), 0) / 11 + collectiveBonus + (career ? tacticalBonus(tacticsOf(career), formation) : 0))
}
export function autoLineup(career: Career, formation = career.formation) {
  const available = rosterOfIds(career).filter(id => !unavailable(career, id))
  const chosen: string[] = []
  for (const slot of positions[formation]) {
    const options = available.filter(id => !chosen.includes(id) && (slot === 'GOL') === (player(id).position === 'GOL')).sort((a, b) => overall(career, b) * fit(b, slot) * energy(career, b) - overall(career, a) * fit(a, slot) * energy(career, a))
    if (!options[0]) return lineupOf(career)
    chosen.push(options[0])
  }
  return validLineup(chosen) ? chosen : lineupOf(career)
}
function rosterOfIds(career: Career) { return career.roster ?? defaultRosterFor(career.clubId) }
export function swap(lineup: string[], slot: number, id: string): string[] {
  if (!Number.isInteger(slot) || slot < 0 || slot > 10 || !allPlayers.some(p => p.id === id)) return lineup
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
  const cup = cupFixture(career)
  const fixture = cup ?? leagueFixture(career)
  const opponents = clubs.filter(c => c.id !== career.clubId)
  const opponent = fixture ? allClubs.find(c => c.id === fixture.opponent)! : opponents[Math.floor(((career.day ?? 1) - 1) / 3) % opponents.length]
  const homeChance = Math.max(.3, Math.min(.7, .5 + (power - 70) / 100))
  const events = Array.from({ length: 9 }, (_, index) => {
    const sideRoll = random()
    const goalRoll = random()
    const playerRoll = random()
    const assistRoll = random()
    const side = sideRoll < homeChance ? 'home' as const : 'away' as const
    const goal = goalRoll < .3
    const id = lineup[1 + Math.min(9, Math.floor(playerRoll * 10))]
    const assistId = lineup[1 + Math.min(9, Math.floor(assistRoll * 10))]
    const actor = side === 'home' ? player(id).name : opponent.name
    return { minute: (index + 1) * 10, side, goal, text: goal ? `Gol! ${actor} aproveita a oportunidade e marca.` : `${actor} cria uma chance, mas a jogada termina sem gol.`, sideRoll, goalRoll, playerRoll, assistRoll, ...(side === 'home' ? { playerId: id, ...(goal && assistId !== id ? { assistPlayerId: assistId } : {}) } : {}) }
  })
  const home = events.filter(e => e.side === 'home' && e.goal).length
  const away = events.filter(e => e.side === 'away' && e.goal).length
  const ratings = lineup.map(id => ({ playerId: id, value: Math.round(Math.max(1, Math.min(10, 6 + random() * 1.2 + (home - away) * .2 + events.filter(e => e.playerId === id && e.goal).length * .7)) * 10) / 10 }))
  const otherResults = !cup && fixture && 'round' in fixture ? leagueRounds[fixture.round - 1].filter(([home, away]) => home !== career.clubId && away !== career.clubId).map(([otherHome, otherAway]) => ({ round: fixture.round, home: otherHome, away: otherAway, homeGoals: Math.floor(random() * 4), awayGoals: Math.floor(random() * 4) })) : undefined
  return { ...(otherResults ? { otherResults } : {}), opponent: opponent.id, startingLineup: [...lineup], lineup: [...lineup], formation: career.formation, tactics: { ...tacticsOf(career) }, strength: power, events, ratings, cursor: 0, mentality: 'balanced', substitutions: [], disciplineRolls: Array.from({ length: 6 }, () => random()) }
}

