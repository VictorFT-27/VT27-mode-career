import { allPlayers, defaultContracts, defaultFinances, defaultLineup, defaultRoster, rosterOf, type Career } from './model'
import type { Contract } from './types'

export function contractsOf(career: Career): Record<string, Contract> { return career.contracts ?? defaultContracts() }
export function financesOf(career: Career) { return career.finances ?? defaultFinances[career.clubId] }
export function wageUsed(career: Career) { const contracts = contractsOf(career); return rosterOf(career).reduce((sum, player) => sum + (contracts[player.id]?.wage ?? player.wage), 0) }
export function buyPlayer(career: Career, playerId: string): Career {
  const player = allPlayers.find(candidate => candidate.id === playerId)
  const roster = career.roster ?? defaultRoster
  const finances = financesOf(career)
  if (!player || roster.includes(playerId) || roster.length >= 23 || finances.budget < player.value || wageUsed(career) + player.wage > finances.wageLimit || (career.match && career.match.cursor < 9)) return career
  return { ...career, roster: [...roster, playerId], contracts: { ...contractsOf(career), [playerId]: { seasons: 3, wage: player.wage, value: player.value } }, finances: { ...finances, budget: finances.budget - player.value }, transfers: [...(career.transfers ?? []), { season: career.seasonNumber ?? 1, playerId, kind: 'buy', amount: player.value }], preparation: { ...(career.preparation ?? { skill: 0, fitness: 0, cohesion: 0, sessions: [], energy: {} }), energy: { ...(career.preparation?.energy ?? {}), [playerId]: 100 } } }
}
export function sellPlayer(career: Career, playerId: string): Career {
  const roster = career.roster ?? defaultRoster
  const contract = contractsOf(career)[playerId]
  if (!contract || !roster.includes(playerId) || roster.length <= 16 || (career.lineup ?? defaultLineup).includes(playerId) || (career.match && career.match.cursor < 9)) return career
  const amount = Math.round(contract.value * .85)
  const contracts = { ...contractsOf(career) }; delete contracts[playerId]
  return { ...career, roster: roster.filter(id => id !== playerId), contracts, finances: { ...financesOf(career), budget: financesOf(career).budget + amount }, transfers: [...(career.transfers ?? []), { season: career.seasonNumber ?? 1, playerId, kind: 'sell', amount }] }
}
export function renewContract(career: Career, playerId: string): Career {
  const contract = contractsOf(career)[playerId]
  const finances = financesOf(career)
  if (!contract || contract.seasons > 1 || finances.budget < Math.round(contract.value * .1) || (career.match && career.match.cursor < 9)) return career
  const amount = Math.round(contract.value * .1)
  return { ...career, contracts: { ...contractsOf(career), [playerId]: { ...contract, seasons: 3 } }, finances: { ...finances, budget: finances.budget - amount }, transfers: [...(career.transfers ?? []), { season: career.seasonNumber ?? 1, playerId, kind: 'renew', amount }] }
}
