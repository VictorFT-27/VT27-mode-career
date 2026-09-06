import { defaultLineup, rosterOf, type Career } from './model'
import type { Match, PlayerAvailability } from './types'

const healthy = (): PlayerAvailability => ({ injuredMatches: 0, suspensionMatches: 0, yellowCards: 0 })
export function availabilityOf(career: Career) { return Object.fromEntries(rosterOf(career).map(player => [player.id, career.availability?.[player.id] ?? healthy()])) }
export function conditionOf(career: Career, playerId: string) { return career.availability?.[playerId] ?? healthy() }
export function unavailable(career: Career, playerId: string) { const state = conditionOf(career, playerId); return state.injuredMatches > 0 || state.suspensionMatches > 0 }
export function unavailableLineup(career: Career) { return (career.lineup ?? defaultLineup).filter(id => unavailable(career, id)) }
export function conditionLabel(career: Career, playerId: string) { const state = conditionOf(career, playerId); return state.injuredMatches ? `Lesionado · ${state.injuredMatches} ${state.injuredMatches === 1 ? 'jogo' : 'jogos'}` : state.suspensionMatches ? 'Suspenso · 1 jogo' : state.yellowCards ? `${state.yellowCards}/3 cartões` : 'Disponível' }
export function resolveDiscipline(match: Match): Match {
  if (match.disciplineFinalized) return match
  const rolls = match.disciplineRolls
  if (!rolls) return { ...match, yellowCards: [], disciplineFinalized: true }
  const participants = match.ratings.map(rating => rating.playerId)
  const pick = (roll: number) => participants[Math.min(participants.length - 1, Math.floor(roll * participants.length))]
  const yellowCards = [...new Set([...(rolls[0] < .42 ? [pick(rolls[1])] : []), ...(rolls[2] < .22 ? [pick(rolls[3])] : [])])]
  const injury = rolls[4] < .18 ? { playerId: pick(rolls[5]), matches: rolls[4] < .06 ? 2 : 1 } : undefined
  return { ...match, yellowCards, ...(injury ? { injury } : {}), disciplineFinalized: true }
}
export function settleAvailability(career: Career): Career {
  if (!career.match || career.match.cursor !== 9 || career.match.disciplineFinalized) return career
  const match = resolveDiscipline(career.match)
  const availability = availabilityOf(career)
  for (const player of rosterOf(career)) availability[player.id] = { ...availability[player.id], injuredMatches: Math.max(0, availability[player.id].injuredMatches - 1), suspensionMatches: Math.max(0, availability[player.id].suspensionMatches - 1) }
  for (const id of match.yellowCards ?? []) { const cards = availability[id].yellowCards + 1; availability[id] = { ...availability[id], yellowCards: cards >= 3 ? 0 : cards, suspensionMatches: cards >= 3 ? 1 : availability[id].suspensionMatches } }
  if (match.injury) availability[match.injury.playerId] = { ...availability[match.injury.playerId], injuredMatches: match.injury.matches }
  return { ...career, match, availability }
}
