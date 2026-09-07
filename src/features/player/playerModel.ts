import { clubs } from '../career/realData'

export type PlayerPosition = 'GOL' | 'ZAG' | 'VOL' | 'MC' | 'PE' | 'ATA'
export type PlayerAttribute = 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical'
export type PlayerTraining = 'physical' | 'finishing' | 'creation' | 'defensive'
export type MatchApproach = 'safe' | 'team' | 'bold'
export type PlayerStats = { appearances: number; starts: number; minutes: number; goals: number; assists: number; ratingTotal: number; motm: number }
export type PlayerMatch = { season: number; round: number; clubId: string; opponentId: string; role: 'starter' | 'bench' | 'out'; minutes: number; goals: number; assists: number; rating: number; teamGoals: number; opponentGoals: number; approach: MatchApproach }
export type PlayerOffer = { clubId: string; seasons: number; wage: number; role: string }
export type PlayerSeason = { season: number; clubId: string; overall: number; stats: PlayerStats }
export type PlayerCareer = { version: 1; mode: 'player'; name: string; clubId: string; position: PlayerPosition; shirtNumber: number; age: number; season: number; round: number; attributes: Record<PlayerAttribute, number>; bonus: number; experience: number; skillPoints: number; energy: number; sharpness: number; trust: number; trainingCompleted: boolean; contract: { clubId: string; seasons: number; wage: number }; stats: PlayerStats; allTime: PlayerStats; matches: PlayerMatch[]; seasons: PlayerSeason[]; offers: PlayerOffer[]; seasonComplete: boolean }

export const playerPositions: { id: PlayerPosition; title: string; description: string }[] = [
  { id: 'GOL', title: 'Goleiro', description: 'Reflexo, segurança e liderança da última linha.' },
  { id: 'ZAG', title: 'Zagueiro', description: 'Leitura defensiva, força e domínio pelo alto.' },
  { id: 'VOL', title: 'Volante', description: 'Proteção, intensidade e primeiro passe.' },
  { id: 'MC', title: 'Meio-campista', description: 'Visão de jogo, controle e criação.' },
  { id: 'PE', title: 'Ponta', description: 'Velocidade, drible e agressividade pelos lados.' },
  { id: 'ATA', title: 'Atacante', description: 'Movimentação, presença de área e finalização.' },
]
export const playerAttributeLabels: Record<PlayerAttribute, string> = { pace: 'Velocidade', shooting: 'Finalização', passing: 'Passe', dribbling: 'Drible', defending: 'Defesa', physical: 'Físico' }
const emptyStats = (): PlayerStats => ({ appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, ratingTotal: 0, motm: 0 })
const bases: Record<PlayerPosition, Record<PlayerAttribute, number>> = {
  GOL: { pace: 48, shooting: 35, passing: 58, dribbling: 48, defending: 68, physical: 63 },
  ZAG: { pace: 59, shooting: 42, passing: 56, dribbling: 51, defending: 68, physical: 67 },
  VOL: { pace: 61, shooting: 52, passing: 64, dribbling: 59, defending: 65, physical: 65 },
  MC: { pace: 62, shooting: 57, passing: 68, dribbling: 66, defending: 52, physical: 57 },
  PE: { pace: 70, shooting: 60, passing: 61, dribbling: 69, defending: 38, physical: 53 },
  ATA: { pace: 65, shooting: 69, passing: 54, dribbling: 63, defending: 35, physical: 64 },
}
const weights: Record<PlayerPosition, Record<PlayerAttribute, number>> = {
  GOL: { pace: .05, shooting: .02, passing: .13, dribbling: .05, defending: .48, physical: .27 },
  ZAG: { pace: .12, shooting: .03, passing: .1, dribbling: .05, defending: .42, physical: .28 },
  VOL: { pace: .1, shooting: .07, passing: .22, dribbling: .12, defending: .27, physical: .22 },
  MC: { pace: .1, shooting: .12, passing: .3, dribbling: .25, defending: .08, physical: .15 },
  PE: { pace: .25, shooting: .2, passing: .16, dribbling: .27, defending: .02, physical: .1 },
  ATA: { pace: .17, shooting: .36, passing: .09, dribbling: .18, defending: .02, physical: .18 },
}
const storageKey = 'vt27.player.v1'
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
export function playerOverall(career: Pick<PlayerCareer, 'attributes' | 'position' | 'bonus'>) { return clamp(Math.round((Object.keys(career.attributes) as PlayerAttribute[]).reduce((sum, key) => sum + career.attributes[key] * weights[career.position][key], 0)) + career.bonus, 40, 99) }
export function playerRole(career: Pick<PlayerCareer, 'trust' | 'energy'>): 'starter' | 'bench' | 'out' { return career.trust >= 60 && career.energy >= 50 ? 'starter' : career.trust >= 28 && career.energy >= 30 ? 'bench' : 'out' }
export function averageRating(stats: PlayerStats) { return stats.appearances ? stats.ratingTotal / stats.appearances : 0 }
export function createPlayerCareer(name: string, clubId: string, position: PlayerPosition, shirtNumber: number): PlayerCareer {
  const safeClub = clubs.some(club => club.id === clubId) ? clubId : clubs[0].id
  const safePosition = playerPositions.some(item => item.id === position) ? position : 'ATA'
  return { version: 1, mode: 'player', name: name.trim(), clubId: safeClub, position: safePosition, shirtNumber: clamp(Math.round(shirtNumber), 1, 99), age: 17, season: 1, round: 0, attributes: { ...bases[safePosition] }, bonus: 0, experience: 0, skillPoints: 0, energy: 100, sharpness: 45, trust: 38, trainingCompleted: false, contract: { clubId: safeClub, seasons: 3, wage: 28 }, stats: emptyStats(), allTime: emptyStats(), matches: [], seasons: [], offers: [], seasonComplete: false }
}
export function trainPlayer(career: PlayerCareer, kind: PlayerTraining): PlayerCareer {
  if (career.trainingCompleted || career.seasonComplete || career.energy < 20) return career
  const effects: Record<PlayerTraining, [PlayerAttribute, PlayerAttribute, number]> = { physical: ['pace', 'physical', 17], finishing: ['shooting', 'dribbling', 15], creation: ['passing', 'dribbling', 14], defensive: ['defending', 'physical', 15] }
  const [primary, secondary, cost] = effects[kind]
  return { ...career, attributes: { ...career.attributes, [primary]: clamp(career.attributes[primary] + 1, 1, 99), [secondary]: clamp(career.attributes[secondary] + (career.round % 2), 1, 99) }, energy: clamp(career.energy - cost, 0, 100), sharpness: clamp(career.sharpness + 9, 0, 100), trust: clamp(career.trust + 5, 0, 100), trainingCompleted: true }
}
function opponentFor(career: PlayerCareer) { const opponents = clubs.filter(club => club.id !== career.clubId); return opponents[(career.round * 7 + career.season * 3 + career.name.length) % opponents.length] }
function makeOffers(career: PlayerCareer, overall: number): PlayerOffer[] {
  const others = clubs.filter(club => club.id !== career.clubId)
  const start = (career.season * 5 + overall + career.stats.goals * 3 + career.stats.assists) % others.length
  const count = overall >= 72 || averageRating(career.stats) >= 7.4 ? 3 : 2
  const external = Array.from({ length: count }, (_, index) => others[(start + index * 6) % others.length]).map((club, index) => ({ clubId: club.id, seasons: 3, wage: Math.round(35 + overall * .8 + index * 8), role: index === 0 ? 'Disputará a titularidade' : 'Projeto de longo prazo' }))
  return [{ clubId: career.clubId, seasons: 3, wage: Math.round(32 + overall * .72), role: 'Renovação com o clube atual' }, ...external].filter((offer, index, offers) => offers.findIndex(item => item.clubId === offer.clubId) === index)
}
export function playPlayerRound(career: PlayerCareer, approach: MatchApproach): PlayerCareer {
  if (career.seasonComplete || career.round >= 12) return career
  const role = playerRole(career)
  const overall = playerOverall(career)
  const seed = career.name.length * 3 + career.season * 17 + career.round * 11 + career.shirtNumber
  const minutes = role === 'starter' ? 90 : role === 'bench' ? 25 + seed % 16 : 0
  const approachBonus = approach === 'bold' ? .45 : approach === 'team' ? .22 : .05
  const energyPenalty = Math.max(0, 65 - career.energy) / 22
  const rating = minutes ? clamp(Math.round((5.7 + (overall - 60) * .045 + career.sharpness * .009 + approachBonus - energyPenalty + (seed % 5) * .13) * 10) / 10, 5, 10) : 0
  const attack = ['PE', 'ATA'].includes(career.position) ? 3 : ['MC', 'VOL'].includes(career.position) ? 2 : 1
  const goals = minutes && career.position !== 'GOL' && seed % 8 < attack + (approach === 'bold' ? 1 : 0) ? 1 + Number(rating >= 9 && seed % 3 === 0) : 0
  const assists = minutes && career.position !== 'GOL' && (seed + 3) % 9 < (approach === 'team' ? 4 : 2) ? 1 : 0
  const opponent = opponentFor(career)
  const teamGoals = clamp((seed + overall + goals * 2 + assists) % 4, goals, 5)
  const opponentGoals = (seed + 2 + career.round) % 4
  const match: PlayerMatch = { season: career.season, round: career.round + 1, clubId: career.clubId, opponentId: opponent.id, role, minutes, goals, assists, rating, teamGoals, opponentGoals, approach }
  const appeared = Number(minutes > 0)
  const stats = { appearances: career.stats.appearances + appeared, starts: career.stats.starts + Number(role === 'starter'), minutes: career.stats.minutes + minutes, goals: career.stats.goals + goals, assists: career.stats.assists + assists, ratingTotal: career.stats.ratingTotal + rating, motm: career.stats.motm + Number(rating >= 8.5) }
  const earnedExperience = minutes ? Math.round(rating * 7 + goals * 18 + assists * 12) : 12
  const totalExperience = career.experience + earnedExperience
  const nextRound = career.round + 1
  const complete = nextRound === 12
  const next = { ...career, round: nextRound, stats, matches: [...career.matches, match].slice(-60), energy: clamp(career.energy - (role === 'starter' ? 28 : role === 'bench' ? 14 : 0) + 24, 0, 100), sharpness: clamp(career.sharpness + (minutes ? 3 : -4), 0, 100), trust: clamp(career.trust + (minutes ? Math.round((rating - 6.3) * 4) + goals * 3 + assists * 2 : -3), 0, 100), experience: totalExperience % 100, skillPoints: career.skillPoints + Math.floor(totalExperience / 100), trainingCompleted: false, seasonComplete: complete }
  return complete ? { ...next, offers: makeOffers(next, playerOverall(next)) } : next
}
export function improvePlayer(career: PlayerCareer, attribute: PlayerAttribute): PlayerCareer { if (career.skillPoints < 1 || career.seasonComplete && career.offers.length === 0 || career.attributes[attribute] >= 99) return career; return { ...career, skillPoints: career.skillPoints - 1, attributes: { ...career.attributes, [attribute]: career.attributes[attribute] + 1 } } }
function accumulated(a: PlayerStats, b: PlayerStats): PlayerStats { return { appearances: a.appearances + b.appearances, starts: a.starts + b.starts, minutes: a.minutes + b.minutes, goals: a.goals + b.goals, assists: a.assists + b.assists, ratingTotal: a.ratingTotal + b.ratingTotal, motm: a.motm + b.motm } }
function beginNextSeason(career: PlayerCareer, clubId: string, contract: PlayerCareer['contract']): PlayerCareer {
  const overall = playerOverall(career)
  return { ...career, clubId, contract, age: career.age + 1, season: career.season + 1, round: 0, energy: 100, sharpness: 50, trust: clubId === career.clubId ? clamp(career.trust, 35, 75) : 42, trainingCompleted: false, stats: emptyStats(), allTime: accumulated(career.allTime, career.stats), seasons: [...career.seasons, { season: career.season, clubId: career.clubId, overall, stats: { ...career.stats } }], offers: [], seasonComplete: false }
}
export function acceptPlayerOffer(career: PlayerCareer, clubId: string): PlayerCareer { const offer = career.offers.find(item => item.clubId === clubId); return career.seasonComplete && offer ? beginNextSeason(career, clubId, { clubId, seasons: offer.seasons, wage: offer.wage }) : career }
export function stayUnderContract(career: PlayerCareer): PlayerCareer { return career.seasonComplete && career.contract.seasons > 1 ? beginNextSeason(career, career.clubId, { ...career.contract, seasons: career.contract.seasons - 1 }) : career }
export function savePlayerCareer(career: PlayerCareer) { try { localStorage.setItem(storageKey, JSON.stringify(career)); return true } catch { return false } }
export function loadPlayerCareer(): PlayerCareer | null {
  try { const raw: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null'); if (!raw || typeof raw !== 'object') return null; const value = raw as PlayerCareer; if (value.version !== 1 || value.mode !== 'player' || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 40 || !clubs.some(club => club.id === value.clubId) || !playerPositions.some(position => position.id === value.position) || !Number.isInteger(value.shirtNumber) || value.shirtNumber < 1 || value.shirtNumber > 99 || !Number.isInteger(value.season) || value.season < 1 || !Number.isInteger(value.round) || value.round < 0 || value.round > 12) return null; return value } catch { return null }
}
