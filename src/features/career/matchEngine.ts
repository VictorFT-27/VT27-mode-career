import { allPlayers, clubs, type Career } from './model'
import { type Match, type MatchEvent, type Mentality } from './types'

const plans: Record<Mentality, { chance: number; ownGoal: number; rivalGoal: number }> = {
  defensive: { chance: -.06, ownGoal: -.03, rivalGoal: -.1 },
  balanced: { chance: 0, ownGoal: 0, rivalGoal: 0 },
  attacking: { chance: .08, ownGoal: .08, rivalGoal: .05 },
}

export function resolveEvent(match: Match, index: number): MatchEvent {
  const existing = match.events[index]
  if (existing.sideRoll === undefined || existing.goalRoll === undefined || existing.playerRoll === undefined || index < match.cursor) return existing
  const plan = plans[match.mentality ?? 'balanced']
  const homeChance = Math.max(.24, Math.min(.76, .5 + (match.strength - 70) / 100 + plan.chance))
  const side = existing.sideRoll < homeChance ? 'home' as const : 'away' as const
  const goalChance = Math.max(.08, Math.min(.5, .3 + (side === 'home' ? plan.ownGoal : plan.rivalGoal)))
  const goal = existing.goalRoll < goalChance
  const id = match.lineup[1 + Math.min(9, Math.floor(existing.playerRoll * 10))]
  const opponent = clubs.find(club => club.id === match.opponent)!
  const actor = side === 'home' ? allPlayers.find(candidate => candidate.id === id)!.name : opponent.name
  return { ...existing, side, goal, text: goal ? `Gol! ${actor} aproveita a oportunidade e marca.` : `${actor} cria uma chance, mas a jogada termina sem gol.`, ...(side === 'home' ? { playerId: id } : { playerId: undefined }) }
}

export function setMentality(career: Career, mentality: Mentality): Career {
  if (career.board?.status === 'dismissed' || !career.match || career.match.cursor === 9 || !Object.hasOwn(plans, mentality)) return career
  return { ...career, match: { ...career.match, mentality } }
}

export function substitute(career: Career, outId: string, inId: string): Career {
  const match = career.match
  if (career.board?.status === 'dismissed' || !match || match.cursor === 0 || match.cursor === 9 || (match.substitutions?.length ?? 0) >= 3 || !match.lineup.includes(outId) || match.lineup.includes(inId) || match.substitutions?.some(change => change.outId === inId)) return career
  const outIndex = match.lineup.indexOf(outId)
  const incoming = allPlayers.find(candidate => candidate.id === inId)
  if (!incoming || (outIndex === 0) !== (incoming.position === 'GOL')) return career
  const lineup = [...match.lineup]
  lineup[outIndex] = inId
  const substitutions = [...(match.substitutions ?? []), { minute: match.cursor * 10, outId, inId }]
  const ratings = match.ratings.some(rating => rating.playerId === inId) ? match.ratings : [...match.ratings, { playerId: inId, value: 6.5 }]
  return { ...career, match: { ...match, lineup, substitutions, ratings } }
}

export function minutesPlayed(match: Match, playerId: string) {
  const starting = match.startingLineup ?? match.lineup
  const entered = match.substitutions?.find(change => change.inId === playerId)
  const left = match.substitutions?.find(change => change.outId === playerId)
  const start = starting.includes(playerId) ? 0 : entered?.minute ?? 90
  const end = left?.minute ?? 90
  return Math.max(0, end - start)
}

export function finalizeRatings(match: Match): Match {
  if (match.ratingsFinalized) return match
  const home = match.events.filter(event => event.goal && event.side === 'home').length
  const away = match.events.filter(event => event.goal && event.side === 'away').length
  const participants = [...new Set([...(match.startingLineup ?? match.lineup), ...(match.substitutions ?? []).map(change => change.inId)])]
  const ratings = participants.map(id => {
    const initial = match.ratings.find(rating => rating.playerId === id)?.value ?? 6.5
    const goals = match.events.filter(event => event.goal && event.playerId === id).length
    const value = Math.max(1, Math.min(10, initial + goals * .5 + (home - away) * .12 + (minutesPlayed(match, id) / 90 - .5) * .25))
    return { playerId: id, value: Math.round(value * 10) / 10 }
  })
  return { ...match, ratings, ratingsFinalized: true }
}
