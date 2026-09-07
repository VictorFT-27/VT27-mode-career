import { allPlayers, clubs, defaultContracts, defaultFinances, defaultLineupFor, defaultRosterFor, rosterOf, type Career } from './model'
import type { Contract } from './types'
import { clubOf, worldOf } from './world'

export function contractsOf(career: Career): Record<string, Contract> { return career.contracts ?? defaultContracts(career.clubId) }
export function financesOf(career: Career) { return career.finances ?? defaultFinances[career.clubId] }
export function wageUsed(career: Career) { const contracts = contractsOf(career); return rosterOf(career).reduce((sum, player) => sum + (contracts[player.id]?.wage ?? player.wage), 0) }
export function buyPlayer(career: Career, playerId: string): Career {
  const player = allPlayers.find(candidate => candidate.id === playerId)
  const roster = career.roster ?? defaultRosterFor(career.clubId)
  const finances = financesOf(career)
  const fromClubId = clubOf(career, playerId)
  if (career.board?.status === 'dismissed' || !player || !fromClubId || roster.includes(playerId) || roster.length >= 23 || finances.budget < player.value || wageUsed(career) + player.wage > finances.wageLimit || (career.match && career.match.cursor < 9)) return career
  const world = worldOf(career)
  return { ...career, roster: [...roster, playerId], contracts: { ...contractsOf(career), [playerId]: { seasons: 3, wage: player.wage, value: player.value } }, finances: { ...finances, budget: finances.budget - player.value }, transfers: [...(career.transfers ?? []), { season: career.seasonNumber ?? 1, playerId, kind: 'buy', amount: player.value }], world: { ...world, playerClubs: { ...world.playerClubs, [playerId]: career.clubId }, transfers: fromClubId && fromClubId !== career.clubId ? [...world.transfers, { season: career.seasonNumber ?? 1, playerId, fromClubId, toClubId: career.clubId, amount: player.value }].slice(-300) : world.transfers }, availability: { ...(career.availability ?? {}), [playerId]: { injuredMatches: 0, suspensionMatches: 0, yellowCards: 0 } }, preparation: { ...(career.preparation ?? { skill: 0, fitness: 0, cohesion: 0, sessions: [], energy: {} }), energy: { ...(career.preparation?.energy ?? {}), [playerId]: 100 } } }
}
export function sellPlayer(career: Career, playerId: string): Career {
  const roster = career.roster ?? defaultRosterFor(career.clubId)
  const contract = contractsOf(career)[playerId]
  if (career.board?.status === 'dismissed' || !contract || !roster.includes(playerId) || roster.length <= 16 || (career.lineup ?? defaultLineupFor(career.clubId)).includes(playerId) || (career.match && career.match.cursor < 9)) return career
  const amount = Math.round(contract.value * .85)
  const contracts = { ...contractsOf(career) }; delete contracts[playerId]
  const availability = { ...(career.availability ?? {}) }; delete availability[playerId]
  const world = worldOf(career)
  const current = clubs.findIndex(club => club.id === career.clubId)
  const destination = clubs[(current + (career.seasonNumber ?? 1) + 1) % clubs.length].id
  return { ...career, roster: roster.filter(id => id !== playerId), contracts, availability, finances: { ...financesOf(career), budget: financesOf(career).budget + amount }, transfers: [...(career.transfers ?? []), { season: career.seasonNumber ?? 1, playerId, kind: 'sell', amount }], world: { ...world, playerClubs: { ...world.playerClubs, [playerId]: destination }, transfers: [...world.transfers, { season: career.seasonNumber ?? 1, playerId, fromClubId: career.clubId, toClubId: destination, amount }].slice(-300) } }
}
export function renewContract(career: Career, playerId: string): Career {
  const contract = contractsOf(career)[playerId]
  const finances = financesOf(career)
  if (career.board?.status === 'dismissed' || !contract || contract.seasons > 1 || finances.budget < Math.round(contract.value * .1) || (career.match && career.match.cursor < 9)) return career
  const amount = Math.round(contract.value * .1)
  return { ...career, contracts: { ...contractsOf(career), [playerId]: { ...contract, seasons: 3 } }, finances: { ...finances, budget: finances.budget - amount }, transfers: [...(career.transfers ?? []), { season: career.seasonNumber ?? 1, playerId, kind: 'renew', amount }] }
}
