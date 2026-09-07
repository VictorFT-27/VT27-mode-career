import { allPlayers, clubs, type Career } from './model'
import type { Scout, ScoutingState } from './types'
import { ageOf, clubOf } from './world'

export const scoutMarket: Scout[] = [
  { id: 'scout-br-1', name: 'Carlos Nogueira', quality: 62, specialty: 'Jovens', region: 'Brasil', wage: 35 },
  { id: 'scout-br-2', name: 'Renato Lima', quality: 74, specialty: 'Defensores', region: 'Brasil', wage: 55 },
  { id: 'scout-sa-1', name: 'Martín Acosta', quality: 82, specialty: 'Técnica', region: 'América do Sul', wage: 80 },
  { id: 'scout-eu-1', name: 'Tiago Valente', quality: 90, specialty: 'Elite', region: 'Mundo', wage: 120 },
]
export function scoutingOf(career: Career): ScoutingState {
  const raw = career.scouting
  const activeIds = new Set(allPlayers.map(player => player.id))
  return { hired: (raw?.hired ?? []).filter(scout => scoutMarket.some(item => item.id === scout.id)).slice(0, 3), missions: (raw?.missions ?? []).filter(mission => scoutMarket.some(scout => scout.id === mission.scoutId)).slice(-12), favorites: (raw?.favorites ?? []).filter(id => activeIds.has(id)).slice(0, 50), compared: (raw?.compared ?? []).filter(id => activeIds.has(id)).slice(0, 3) }
}
export function hireScout(career: Career, scoutId: string): Career {
  const scouting = scoutingOf(career); const scout = scoutMarket.find(item => item.id === scoutId)
  if (!scout || scouting.hired.some(item => item.id === scoutId) || scouting.hired.length >= 3 || career.board?.status === 'dismissed') return career
  return { ...career, dataVersion: 6, scouting: { ...scouting, hired: [...scouting.hired, scout] } }
}
export function assignMission(career: Career, scoutId: string, position: string, maxAge: number, region: string): Career {
  const scouting = scoutingOf(career); if (!scouting.hired.some(scout => scout.id === scoutId)) return career
  const mission = { id: `${career.seasonNumber ?? 1}-${career.day ?? 1}-${scoutId}`, scoutId, position, maxAge, region, startedDay: career.day ?? 1, season: career.seasonNumber ?? 1 }
  return { ...career, dataVersion: 6, scouting: { ...scouting, missions: [...scouting.missions.filter(item => item.scoutId !== scoutId), mission].slice(-12) } }
}
export function toggleFavorite(career: Career, playerId: string): Career { const scouting = scoutingOf(career); const favorites = scouting.favorites.includes(playerId) ? scouting.favorites.filter(id => id !== playerId) : [...scouting.favorites, playerId].slice(-50); return { ...career, scouting: { ...scouting, favorites } } }
export function toggleCompared(career: Career, playerId: string): Career { const scouting = scoutingOf(career); const compared = scouting.compared.includes(playerId) ? scouting.compared.filter(id => id !== playerId) : scouting.compared.length < 3 ? [...scouting.compared, playerId] : [...scouting.compared.slice(1), playerId]; return { ...career, scouting: { ...scouting, compared } } }
export function knowledgeOf(career: Career, playerId: string) {
  if ((career.roster ?? []).includes(playerId)) return 3
  const player = allPlayers.find(item => item.id === playerId); if (!player || !clubOf(career, playerId)) return 0
  const currentClub = clubs.find(club => club.id === clubOf(career, playerId))
  const applicable = scoutingOf(career).missions.filter(mission => mission.season === (career.seasonNumber ?? 1) && (mission.position === 'all' || mission.position === player.position) && ageOf(career, playerId) <= mission.maxAge && (mission.region === 'Mundo' || mission.region === 'Brasil' || currentClub))
  if (!applicable.length) return 0
  return Math.max(...applicable.map(mission => { const scout = scoutingOf(career).hired.find(item => item.id === mission.scoutId); const cycles = Math.max(0, Math.floor(((career.day ?? 1) - mission.startedDay) / 2)); return Math.min(3, cycles + (scout && scout.quality >= 85 ? 1 : 0)) }))
}
export function potentialOf(career: Career, playerId: string) { const player = allPlayers.find(item => item.id === playerId)!; const age = ageOf(career, playerId); return Math.min(94, player.rating + Math.max(0, Math.round((25 - age) / 2))) }

