import { clubs, type Career, validLeagueResult } from './model'
import { isDismissed, reviewRound } from './board'
import { leagueDays, leagueRounds, type LeagueResult } from './types'
export function leagueFixture(career: Career) {
  if (!career.leagueActive) return undefined
  const index = leagueDays.indexOf(career.day ?? 1)
  if (index < 0) return undefined
  const [home, away] = leagueRounds[index].find(pair => pair.includes(career.clubId))!
  return { round: index + 1, home, away, opponent: home === career.clubId ? away : home, atHome: home === career.clubId }
}
export function startLeague(career: Career): Career {
  if (isDismissed(career) || career.leagueActive || career.day !== 8 || ![1, 4, 7].every(day => career.history?.some(h => h.day === day && h.match.cursor === 9))) return career
  return { ...career, leagueActive: true, leagueResults: [] }
}
export function commitRound(career: Career): Career {
  const fixture = leagueFixture(career)
  if (!fixture || career.match?.cursor !== 9) return career
  const ownGoals = career.match.events.filter(e => e.goal && e.side === 'home').length
  const opponentGoals = career.match.events.filter(e => e.goal && e.side === 'away').length
  const own: LeagueResult = { round: fixture.round, home: fixture.home, away: fixture.away, homeGoals: fixture.atHome ? ownGoals : opponentGoals, awayGoals: fixture.atHome ? opponentGoals : ownGoals }
  const other = career.match.otherResult
  const validOther = validLeagueResult(other) && other.round === fixture.round && other.home !== fixture.home && other.away !== fixture.away
  const results = [own, ...(validOther ? [other] : [])]
  const existing = career.leagueResults ?? []
  const next = { ...career, leagueResults: [...existing.filter(r => r.round !== fixture.round), ...results] }
  const rank = standings(next.leagueResults).findIndex(row => row.id === career.clubId) + 1
  return reviewRound(next, own, rank, boardTarget(career.clubId))
}
export function standings(results: LeagueResult[]) {
  const rows = clubs.map(c => ({ id: c.id, name: c.name, played: 0, points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, difference: 0 }))
  for (const r of results) {
    const home = rows.find(row => row.id === r.home)!
    const away = rows.find(row => row.id === r.away)!
    home.played++; away.played++
    home.goalsFor += r.homeGoals; home.goalsAgainst += r.awayGoals
    away.goalsFor += r.awayGoals; away.goalsAgainst += r.homeGoals
    if (r.homeGoals === r.awayGoals) { home.draws++; away.draws++; home.points++; away.points++ }
    else { const winner = r.homeGoals > r.awayGoals ? home : away; const loser = winner === home ? away : home; winner.points += 3; winner.wins++; loser.losses++ }
  }
  rows.forEach(row => { row.difference = row.goalsFor - row.goalsAgainst })
  return rows.sort((a, b) => b.points - a.points || b.wins - a.wins || b.difference - a.difference || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name, 'pt-BR'))
}
export function boardTarget(id: string) { return id === 'flamengo' ? 1 : id === 'sao-paulo' ? 3 : 2 }
