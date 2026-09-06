import { allPlayers, rosterOf, validLeagueResult, type Career } from './model'
import { contractsOf } from './transfers'
import { leagueDays, type SeasonArchive } from './types'
export function overall(career: Career, id: string) { return allPlayers.find(p => p.id === id)!.rating + (career.playerGrowth?.[id] ?? 0) }
export function playerStats(career: Career) {
  const matches = [...(career.history ?? []).filter(h => leagueDays.includes(h.day))]
  if (career.match?.cursor === 9 && leagueDays.includes(career.day ?? 1) && !matches.some(h => h.day === career.day)) matches.push({ day: career.day!, match: career.match })
  return rosterOf(career).map(p => {
    const played = matches.filter(h => h.match.ratings.some(r => r.playerId === p.id))
    const notes = played.flatMap(h => h.match.ratings.filter(r => r.playerId === p.id).map(r => r.value))
    const average = notes.length ? notes.reduce((sum, n) => sum + Math.round(n * 10), 0) / (notes.length * 10) : null
    const growth = career.playerGrowth?.[p.id] ?? 0
    const gain = Math.min(10 - growth, played.length >= 3 ? average !== null && average >= 7.5 ? 2 : 1 : 0)
    return { ...p, rating: overall(career, p.id), appearances: played.length, goals: played.reduce((sum, h) => sum + h.match.events.filter(e => e.goal && e.side === 'home' && e.playerId === p.id).length, 0), average, growth, gain }
  })
}
export function canRenew(career: Career) {
  const results = career.leagueResults ?? []
  return career.board?.status !== 'dismissed' && career.day === 25 && career.leagueActive === true && results.length === 12 && results.every(validLeagueResult) && new Set(results.map(r => r.round + ':' + r.home)).size === 12 && [1, 4, 7, ...leagueDays].every(day => career.history?.some(h => h.day === day && h.match.cursor === 9))
}
export function renewSeason(career: Career): Career {
  if (!canRenew(career)) return career
  const number = career.seasonNumber ?? 1
  if (career.archives?.some(a => a.number === number)) return career
  const stats = playerStats(career)
  const archive: SeasonArchive = { number, clubId: career.clubId, results: structuredClone(career.leagueResults!), matches: structuredClone(career.history!), gains: Object.fromEntries(stats.map(p => [p.id, p.gain])) }
  const gains = Object.fromEntries(stats.map(p => [p.id, p.growth + p.gain]))
  return { ...career, seasonNumber: number + 1, archives: [...(career.archives ?? []), archive], playerGrowth: Object.fromEntries(allPlayers.map(player => [player.id, gains[player.id] ?? career.playerGrowth?.[player.id] ?? 0])), contracts: Object.fromEntries(Object.entries(contractsOf(career)).map(([id, contract]) => [id, { ...contract, seasons: Math.max(1, contract.seasons - 1) }])), board: undefined, availability: Object.fromEntries(rosterOf(career).map(player => [player.id, { injuredMatches: 0, suspensionMatches: 0, yellowCards: 0 }])), day: 1, match: undefined, history: [], leagueActive: false, leagueResults: [], preparation: { energy: Object.fromEntries(rosterOf(career).map(p => [p.id, 100])), skill: 0, fitness: 0, cohesion: 0, sessions: [] } }
}
