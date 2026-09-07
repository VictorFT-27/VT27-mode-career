import { boardTarget } from '../career/league'
import { clubs, financesByClub, playersByClub, type Player } from '../career/realData'
import { youthPlayers } from '../career/youthData'

export type DirectorStructure = 'training' | 'academy' | 'medical' | 'scouting'
export type CoachStyle = 'balanced' | 'attacking' | 'defensive' | 'development'
export type Coach = { id: string; name: string; style: CoachStyle; quality: number; salary: number }
export type DirectorCycle = { season: number; cycle: number; opponentId: string; result: 'win' | 'draw' | 'loss'; goalsFor: number; goalsAgainst: number; income: number; expenses: number; balance: number; rank: number }
export type DirectorSeason = { season: number; clubId: string; rank: number; points: number; balance: number; boardConfidence: number; promoted: number }
export type DirectorCareer = { version: 1; mode: 'director'; name: string; clubId: string; season: number; cycle: number; budget: number; wageLimit: number; reputation: number; supporterMood: number; boardConfidence: number; points: number; coach: Coach; coachConfidence: number; structures: Record<DirectorStructure, number>; squad: string[]; prospects: string[]; market: string[]; promoted: number; revenue: number; expenses: number; cycles: DirectorCycle[]; seasons: DirectorSeason[]; seasonComplete: boolean }

export const coachCandidates: Coach[] = [
  { id: 'c1', name: 'Alexandre Torres', style: 'balanced', quality: 74, salary: 260 },
  { id: 'c2', name: 'Renato Fonseca', style: 'attacking', quality: 77, salary: 320 },
  { id: 'c3', name: 'Marcelo Nogueira', style: 'defensive', quality: 72, salary: 220 },
  { id: 'c4', name: 'Tiago Menezes', style: 'development', quality: 70, salary: 180 },
]
export const structureLabels: Record<DirectorStructure, { title: string; description: string }> = {
  training: { title: 'Centro de treinamento', description: 'Aumenta o rendimento do elenco em campo.' },
  academy: { title: 'Categorias de base', description: 'Melhora a qualidade das novas promessas.' },
  medical: { title: 'Departamento médico', description: 'Reduz desgaste e despesas emergenciais.' },
  scouting: { title: 'Rede de observação', description: 'Amplia as oportunidades no mercado.' },
}
const storageKey = 'vt27.director.v1'
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const allRealPlayers = Object.values(playersByClub).flat()
export function directorPlayer(id: string): Player | undefined { return [...allRealPlayers, ...youthPlayers].find(player => player.id === id) }
export function directorSquad(career: DirectorCareer) { return career.squad.map(directorPlayer).filter((player): player is Player => !!player) }
export function directorRating(career: DirectorCareer, playerId: string) { const player = directorPlayer(playerId); return player ? Math.min(99, player.rating + (playerId.startsWith('base') && career.squad.includes(playerId) ? Math.floor((career.structures.academy - 1) / 2) : 0)) : 0 }
export function directorPayroll(career: DirectorCareer) { return directorSquad(career).reduce((sum, player) => sum + player.wage, 0) + career.coach.salary }
export function squadAverage(career: DirectorCareer) { return career.squad.length ? Math.round(career.squad.reduce((sum, id) => sum + directorRating(career, id), 0) / career.squad.length) : 0 }
export function estimatedRank(career: Pick<DirectorCareer, 'points' | 'reputation'>) { return clamp(20 - Math.floor(career.points * .62 + career.reputation / 22), 1, 20) }
function selections(season: number, clubId: string, source: Player[], count: number) { const start = (season * 7 + clubs.findIndex(club => club.id === clubId) * 11) % source.length; return Array.from({ length: source.length }, (_, index) => source[(start + index * 5) % source.length]).filter((player, index, items) => items.findIndex(item => item.id === player.id) === index).slice(0, count).map(player => player.id) }
function prospectsFor(season: number, clubId: string) { return selections(season, clubId, youthPlayers, 3) }
function marketFor(season: number, clubId: string, scouting: number) { return selections(season, clubId, allRealPlayers.filter(player => player.clubId !== clubId), 5 + scouting) }
export function createDirectorCareer(name: string, clubId: string): DirectorCareer {
  const safeClub = clubs.some(club => club.id === clubId) ? clubId : clubs[0].id
  const finance = financesByClub[safeClub as keyof typeof financesByClub]
  const structures = { training: 1, academy: 1, medical: 1, scouting: 1 }
  return { version: 1, mode: 'director', name: name.trim(), clubId: safeClub, season: 1, cycle: 0, budget: finance.budget, wageLimit: finance.wageLimit, reputation: clamp(82 - boardTarget(safeClub) * 2, 42, 82), supporterMood: 65, boardConfidence: 70, points: 0, coach: { ...coachCandidates[0] }, coachConfidence: 65, structures, squad: playersByClub[safeClub].map(player => player.id), prospects: prospectsFor(1, safeClub), market: marketFor(1, safeClub, 1), promoted: 0, revenue: 0, expenses: 0, cycles: [], seasons: [], seasonComplete: false }
}
export function hireCoach(career: DirectorCareer, coachId: string): DirectorCareer {
  const coach = coachCandidates.find(item => item.id === coachId)
  const fee = coach ? coach.salary * 2 : 0
  if (!coach || career.seasonComplete || career.coach.id === coachId || career.budget < fee) return career
  return { ...career, coach: { ...coach }, coachConfidence: 65, budget: career.budget - fee, expenses: career.expenses + fee }
}
export function structureCost(career: DirectorCareer, structure: DirectorStructure) { return career.structures[structure] * 1800 + (structure === 'academy' || structure === 'training' ? 700 : 0) }
export function upgradeStructure(career: DirectorCareer, structure: DirectorStructure): DirectorCareer {
  const level = career.structures[structure]
  const cost = structureCost(career, structure)
  if (career.seasonComplete || level >= 5 || career.budget < cost) return career
  const structures = { ...career.structures, [structure]: level + 1 }
  return { ...career, structures, budget: career.budget - cost, expenses: career.expenses + cost, market: structure === 'scouting' ? marketFor(career.season, career.clubId, level + 1) : career.market }
}
export function promoteDirectorProspect(career: DirectorCareer, playerId: string): DirectorCareer {
  const player = youthPlayers.find(item => item.id === playerId)
  if (!player || career.seasonComplete || !career.prospects.includes(playerId) || career.squad.length >= 24 || career.budget < 300) return career
  return { ...career, squad: [...career.squad, playerId], prospects: career.prospects.filter(id => id !== playerId), promoted: career.promoted + 1, budget: career.budget - 300, expenses: career.expenses + 300 }
}
export function buyDirectorPlayer(career: DirectorCareer, playerId: string): DirectorCareer {
  const player = allRealPlayers.find(item => item.id === playerId)
  if (!player || career.seasonComplete || !career.market.includes(playerId) || career.squad.includes(playerId) || career.squad.length >= 24 || career.budget < player.value || directorPayroll(career) + player.wage > career.wageLimit) return career
  return { ...career, squad: [...career.squad, playerId], market: career.market.filter(id => id !== playerId), budget: career.budget - player.value, expenses: career.expenses + player.value }
}
export function sellDirectorPlayer(career: DirectorCareer, playerId: string): DirectorCareer {
  const player = directorPlayer(playerId)
  if (!player || career.seasonComplete || !career.squad.includes(playerId) || career.squad.length <= 16) return career
  const amount = Math.round(player.value * .82)
  return { ...career, squad: career.squad.filter(id => id !== playerId), budget: career.budget + amount, revenue: career.revenue + amount }
}
export function advanceDirectorCycle(career: DirectorCareer): DirectorCareer {
  if (career.seasonComplete || career.cycle >= 10 || career.boardConfidence <= 10) return career
  const opponentList = clubs.filter(club => club.id !== career.clubId)
  const opponent = opponentList[(career.cycle * 7 + career.season * 3 + career.name.length) % opponentList.length]
  const styleBonus = career.coach.style === 'development' ? career.promoted * 1.5 : career.coach.style === 'balanced' ? 1 : .5
  const strength = squadAverage(career) + career.coach.quality * .12 + career.structures.training * 1.3 + career.coachConfidence * .035 + styleBonus
  const seed = career.season * 19 + career.cycle * 13 + career.name.length + career.coach.quality
  const result = strength + seed % 9 >= 91 ? 'win' as const : strength + seed % 9 >= 86 ? 'draw' as const : 'loss' as const
  const baseGoalsFor = result === 'win' ? 2 + seed % 2 : result === 'draw' ? 1 + seed % 2 : seed % 2
  const goalsFor = clamp(baseGoalsFor + Number(career.coach.style === 'attacking' && result !== 'loss'), 0, 5)
  const goalsAgainst = result === 'win' ? seed % 2 : result === 'draw' ? goalsFor : clamp(2 + seed % 2 - Number(career.coach.style === 'defensive'), goalsFor + 1, 5)
  const points = career.points + (result === 'win' ? 3 : result === 'draw' ? 1 : 0)
  const income = 3100 + career.reputation * 38 + career.structures.scouting * 180 + (result === 'win' ? 1400 : result === 'draw' ? 650 : 250)
  const payroll = directorPayroll(career)
  const operating = payroll + 700 + Object.values(career.structures).reduce((sum, level) => sum + level * 90, 0) - career.structures.medical * 70
  const budget = career.budget + income - operating
  const rank = estimatedRank({ points, reputation: career.reputation })
  const target = boardTarget(career.clubId)
  const boardDelta = (rank <= target ? 4 : -3) + (budget >= 0 ? 1 : -6) + (career.promoted ? 1 : 0)
  const boardConfidence = clamp(career.boardConfidence + boardDelta, 0, 100)
  const coachConfidence = clamp(career.coachConfidence + (result === 'win' ? 6 : result === 'draw' ? 1 : -7), 0, 100)
  const supporterMood = clamp(career.supporterMood + (result === 'win' ? 7 : result === 'draw' ? 1 : -6), 0, 100)
  const reputation = clamp(career.reputation + (rank <= target ? 1 : 0), 30, 100)
  const cycle = career.cycle + 1
  const record: DirectorCycle = { season: career.season, cycle, opponentId: opponent.id, result, goalsFor, goalsAgainst, income, expenses: operating, balance: budget, rank }
  return { ...career, cycle, points, budget, revenue: career.revenue + income, expenses: career.expenses + operating, boardConfidence, coachConfidence, supporterMood, reputation, cycles: [...career.cycles, record].slice(-50), seasonComplete: cycle === 10 }
}
export function renewDirectorSeason(career: DirectorCareer): DirectorCareer {
  if (!career.seasonComplete) return career
  const summary: DirectorSeason = { season: career.season, clubId: career.clubId, rank: estimatedRank(career), points: career.points, balance: career.budget, boardConfidence: career.boardConfidence, promoted: career.promoted }
  const nextSeason = career.season + 1
  const sponsor = 4500 + career.reputation * 55
  return { ...career, season: nextSeason, cycle: 0, budget: career.budget + sponsor, points: 0, supporterMood: clamp(career.supporterMood + 5, 0, 100), boardConfidence: clamp(career.boardConfidence + 4, 0, 100), coachConfidence: clamp(career.coachConfidence + 5, 0, 100), prospects: prospectsFor(nextSeason, career.clubId), market: marketFor(nextSeason, career.clubId, career.structures.scouting), promoted: 0, revenue: 0, expenses: 0, seasons: [...career.seasons, summary], seasonComplete: false }
}
export function saveDirectorCareer(career: DirectorCareer) { try { localStorage.setItem(storageKey, JSON.stringify(career)); return true } catch { return false } }
export function loadDirectorCareer(): DirectorCareer | null {
  try { const raw: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null'); if (!raw || typeof raw !== 'object') return null; const value = raw as DirectorCareer; if (value.version !== 1 || value.mode !== 'director' || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 40 || !clubs.some(club => club.id === value.clubId) || !Number.isInteger(value.season) || value.season < 1 || !Number.isInteger(value.cycle) || value.cycle < 0 || value.cycle > 10 || !Array.isArray(value.squad) || value.squad.length < 16 || value.squad.length > 24) return null; return value } catch { return null }
}
