import { allPlayers, clubs, defaultFinances, defaultWorld, lineupForRoster, type Career } from './model'
import { standings, boardTarget } from './league'
import { youthPlayers } from './youthData'
import type { Contract, SeasonArchive, WorldState } from './types'
import { defaultTactics } from './tactics'

export function worldOf(career: Career): WorldState { return career.world ?? defaultWorld(career.seasonNumber ?? 1, career.clubId) }
export function ageOf(career: Career, playerId: string) { return worldOf(career).playerAges[playerId] ?? allPlayers.find(player => player.id === playerId)?.age ?? 18 }
export function clubOf(career: Career, playerId: string) { return worldOf(career).playerClubs[playerId] }
export function clubSquad(career: Career, clubId: string) { const world = worldOf(career); return allPlayers.filter(player => world.playerClubs[player.id] === clubId) }

function contractFor(playerId: string): Contract {
  const player = allPlayers.find(candidate => candidate.id === playerId)!
  return { seasons: 2, wage: player.wage, value: player.value }
}

function nextProspects(world: WorldState, season: number, clubId: string) {
  const unavailable = new Set([...Object.keys(world.playerClubs), ...world.retirements.map(item => item.playerId)])
  const start = (season * 5 + clubs.findIndex(club => club.id === clubId) * 7) % youthPlayers.length
  return Array.from({ length: youthPlayers.length }, (_, index) => youthPlayers[(start + index) % youthPlayers.length].id).filter(id => !unavailable.has(id)).slice(0, 3)
}

export function advanceWorld(career: Career, archive: SeasonArchive): Career {
  const season = career.seasonNumber ?? archive.number + 1
  const previous = worldOf(career)
  const playerAges = Object.fromEntries(allPlayers.map(player => [player.id, Math.min(50, (previous.playerAges[player.id] ?? player.age) + 1)]))
  const playerClubs = { ...previous.playerClubs }
  const newRetirements = allPlayers.filter(player => playerClubs[player.id] && (playerAges[player.id] >= 40 || playerAges[player.id] >= 37 && (allPlayers.indexOf(player) + season) % 3 === 0)).map(player => ({ season, playerId: player.id, clubId: playerClubs[player.id], age: playerAges[player.id] }))
  newRetirements.forEach(item => { delete playerClubs[item.playerId] })
  const transfers = [...previous.transfers]
  const cpuClubs = clubs.filter(club => club.id !== career.clubId)
  const sourceSquads = Object.fromEntries(cpuClubs.map(club => [club.id, allPlayers.filter(player => playerClubs[player.id] === club.id && playerAges[player.id] < 36)]))
  cpuClubs.forEach((club, index) => {
    const target = cpuClubs[(index + 1) % cpuClubs.length]
    const candidates = sourceSquads[club.id]
    const player = candidates[(season + index) % candidates.length]
    if (!player || target.id === club.id) return
    playerClubs[player.id] = target.id
    transfers.push({ season, playerId: player.id, fromClubId: club.id, toClubId: target.id, amount: Math.round(player.value * (.7 + (index % 4) * .05)) })
  })
  const table = standings(archive.results)
  const rank = table.findIndex(row => row.id === archive.clubId) + 1
  const managerOffers = clubs.filter(club => club.id !== career.clubId && boardTarget(club.id) <= Math.max(8, rank + 3)).sort((a, b) => boardTarget(a.id) - boardTarget(b.id) || a.name.localeCompare(b.name, 'pt-BR')).slice((season - 1) % 3, (season - 1) % 3 + 3).map(club => club.id)
  let roster = (career.roster ?? []).filter(id => !newRetirements.some(item => item.playerId === id))
  const retirements = [...previous.retirements, ...newRetirements].slice(-200)
  let world: WorldState = { playerClubs, playerAges, transfers: transfers.slice(-300), retirements, managerOffers, prospects: [] }
  const unavailable = new Set([...Object.keys(world.playerClubs), ...world.retirements.map(item => item.playerId)])
  const emergency = youthPlayers.filter(player => !unavailable.has(player.id)).sort((a, b) => Number(b.position === 'GOL') - Number(a.position === 'GOL')).map(player => player.id)
  if (!roster.some(id => allPlayers.find(player => player.id === id)?.position === 'GOL')) {
    const keeper = emergency.find(id => allPlayers.find(player => player.id === id)?.position === 'GOL')
    if (keeper) { roster.push(keeper); world.playerClubs[keeper] = career.clubId; emergency.splice(emergency.indexOf(keeper), 1) }
  }
  while (roster.length < 16 && emergency.length) { const id = emergency.shift()!; roster.push(id); world.playerClubs[id] = career.clubId }
  world = { ...world, prospects: nextProspects(world, season, career.clubId) }
  const contracts = Object.fromEntries(roster.map(id => [id, career.contracts?.[id] ? { ...career.contracts[id], seasons: Math.max(1, career.contracts[id].seasons - 1) } : { ...contractFor(id), seasons: 3 }]))
  return { ...career, dataVersion: 4, roster, lineup: lineupForRoster(roster, career.clubId), contracts, world, availability: Object.fromEntries(roster.map(id => [id, { injuredMatches: 0, suspensionMatches: 0, yellowCards: 0 }])), preparation: { energy: Object.fromEntries(roster.map(id => [id, 100])), skill: 0, fitness: 0, cohesion: 0, sessions: [] } }
}

export function promoteProspect(career: Career, playerId: string): Career {
  const world = worldOf(career)
  const roster = career.roster ?? []
  const player = youthPlayers.find(candidate => candidate.id === playerId)
  if (!player || !world.prospects.includes(playerId) || roster.length >= 23 || career.board?.status === 'dismissed' || (career.match && career.match.cursor < 9)) return career
  return { ...career, roster: [...roster, playerId], contracts: { ...(career.contracts ?? {}), [playerId]: { seasons: 3, wage: player.wage, value: player.value } }, world: { ...world, prospects: world.prospects.filter(id => id !== playerId), playerClubs: { ...world.playerClubs, [playerId]: career.clubId } }, availability: { ...(career.availability ?? {}), [playerId]: { injuredMatches: 0, suspensionMatches: 0, yellowCards: 0 } }, preparation: { ...(career.preparation ?? { skill: 0, fitness: 0, cohesion: 0, sessions: [], energy: {} }), energy: { ...(career.preparation?.energy ?? {}), [playerId]: 100 } } }
}

export function acceptManagerOffer(career: Career, clubId: string): Career {
  const previous = worldOf(career)
  const world = { ...previous, playerClubs: { ...previous.playerClubs } }
  if (managerOfferBlockReason(career, clubId)) return career
  let roster = clubSquad(career, clubId).map(player => player.id)
  const assigned = new Set([...Object.keys(world.playerClubs), ...world.retirements.map(item => item.playerId)])
  const availableYouth = youthPlayers.filter(player => !assigned.has(player.id)).sort((a, b) => Number(b.position === 'GOL') - Number(a.position === 'GOL')).map(player => player.id)
  if (!roster.some(id => allPlayers.find(player => player.id === id)?.position === 'GOL')) { const keeper = availableYouth.find(id => allPlayers.find(player => player.id === id)?.position === 'GOL'); if (keeper) { roster.push(keeper); world.playerClubs[keeper] = clubId; availableYouth.splice(availableYouth.indexOf(keeper), 1) } }
  while (roster.length < 16 && availableYouth.length) { const id = availableYouth.shift()!; roster.push(id); world.playerClubs[id] = clubId }
  roster = roster.slice(0, 23)
  return { ...career, clubId, formation: '4-3-3', tactics: { ...defaultTactics }, roster, lineup: lineupForRoster(roster, clubId), contracts: Object.fromEntries(roster.map(id => [id, contractFor(id)])), finances: { ...defaultFinances[clubId] }, board: undefined, availability: Object.fromEntries(roster.map(id => [id, { injuredMatches: 0, suspensionMatches: 0, yellowCards: 0 }])), world: { ...world, managerOffers: [], prospects: nextProspects(world, career.seasonNumber ?? 1, clubId) }, preparation: { energy: Object.fromEntries(roster.map(id => [id, 100])), skill: 0, fitness: 0, cohesion: 0, sessions: [] }, lastManagerMove: { season: career.seasonNumber ?? 1, fromClubId: career.clubId, toClubId: clubId } }
}
export function managerOfferBlockReason(career: Career, clubId: string) {
  if (!clubs.some(club => club.id === clubId)) return 'O clube desta proposta não está disponível.'
  if (career.leagueActive || (career.day ?? 1) > 8) return 'A mudança de clube só pode ser concluída durante a pré-temporada.'
  if (!worldOf(career).managerOffers.includes(clubId)) return 'Esta proposta não está mais disponível.'
  return ''
}

