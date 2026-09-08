import type { EmploymentState } from '../career/employment'
import { clubs } from '../career/realData'
import { commitPlayerFixture, createPlayerCompetition, nextPlayerFixture, playerCupStatus, playerSeasonLength, playerStandings, type PlayerCompetition } from './playerCompetition'

export type PlayerPosition = 'GOL' | 'ZAG' | 'VOL' | 'MC' | 'PE' | 'ATA'
export type PlayerAttribute = 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical'
export type PlayerTraining = 'physical' | 'finishing' | 'creation' | 'defensive' | 'recovery'
export type MatchApproach = 'safe' | 'team' | 'bold'
export type PlayerStats = { appearances: number; starts: number; minutes: number; goals: number; assists: number; ratingTotal: number; motm: number }
export type PlayerObjective = { kind: 'rating' | 'contribution' | 'result' | 'minutes'; title: string; target: number; completed?: boolean }
export type PlayerMoment = { event: number; title: string; text: string; tone: 'positive' | 'neutral' | 'warning' }
export type PlayerDecision = { id: string; title: string; text: string }
export type PlayerDynamics = { morale: number; form: number; injuryMatches: number; suspensionMatches: number; yellowCards: number; objective: PlayerObjective; objectivesCompleted: number; moments: PlayerMoment[]; pendingDecision?: PlayerDecision }
export type PlayerMatchHighlight = { minute: number; title: string; text: string; tone: 'positive' | 'neutral' | 'warning' }
export type PlayerMatch = { season: number; round: number; clubId: string; opponentId: string; competition: 'league' | 'cup'; cupStage?: number; atHome: boolean; role: 'starter' | 'bench' | 'out'; absenceReason?: string; objectiveCompleted: boolean; minutes: number; goals: number; assists: number; rating: number; teamGoals: number; opponentGoals: number; approach: MatchApproach; highlights?: PlayerMatchHighlight[] }
export type PlayerOffer = { clubId: string; seasons: number; wage: number; role: string; status?: 'received' | 'countered' | 'accepted' | 'rejected'; note?: string }
export type PlayerTrainingReport = { round: number; kind: PlayerTraining; focus: string; primary: PlayerAttribute; secondary?: PlayerAttribute; energyDelta: number; sharpnessDelta: number; trustDelta: number; attributeDelta: number; text: string }
export type PlayerSeason = { season: number; clubId: string; overall: number; stats: PlayerStats; leagueRank?: number; leaguePoints?: number; cupResult?: string }
export type PlayerCareer = { employment?: EmploymentState; version: 3; mode: 'player'; name: string; clubId: string; position: PlayerPosition; shirtNumber: number; age: number; season: number; round: number; attributes: Record<PlayerAttribute, number>; bonus: number; experience: number; skillPoints: number; energy: number; sharpness: number; trust: number; trainingCompleted: boolean; trainingReports?: PlayerTrainingReport[]; contract: { clubId: string; seasons: number; wage: number }; stats: PlayerStats; allTime: PlayerStats; matches: PlayerMatch[]; seasons: PlayerSeason[]; offers: PlayerOffer[]; seasonComplete: boolean; dynamics: PlayerDynamics } & PlayerCompetition

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
const clubName = (id: string) => clubs.find(club => club.id === id)?.name ?? 'seu time'
const objectiveFor = (position: PlayerPosition, event: number): PlayerObjective => event % 4 === 0 ? { kind: 'result', title: 'Ajude o time a pontuar', target: 1 } : event % 4 === 1 && !['GOL', 'ZAG'].includes(position) ? { kind: 'contribution', title: 'Marque ou dê uma assistência', target: 1 } : event % 4 === 2 ? { kind: 'rating', title: 'Alcance nota 7,0', target: 7 } : { kind: 'minutes', title: 'Atue por pelo menos 60 minutos', target: 60 }
const defaultDynamics = (position: PlayerPosition): PlayerDynamics => ({ morale: 70, form: 50, injuryMatches: 0, suspensionMatches: 0, yellowCards: 0, objective: objectiveFor(position, 0), objectivesCompleted: 0, moments: [] })
export function playerOverall(career: Pick<PlayerCareer, 'attributes' | 'position' | 'bonus'>) { return clamp(Math.round((Object.keys(career.attributes) as PlayerAttribute[]).reduce((sum, key) => sum + career.attributes[key] * weights[career.position][key], 0)) + career.bonus, 40, 99) }
export function playerRole(career: Pick<PlayerCareer, 'trust' | 'energy'> & { dynamics?: PlayerDynamics }): 'starter' | 'bench' | 'out' { if (career.dynamics?.injuryMatches || career.dynamics?.suspensionMatches) return 'out'; const influence = ((career.dynamics?.form ?? 50) - 50) / 5 + ((career.dynamics?.morale ?? 70) - 70) / 10; return career.trust + influence >= 60 && career.energy >= 50 ? 'starter' : career.trust + influence >= 28 && career.energy >= 30 ? 'bench' : 'out' }
export function averageRating(stats: PlayerStats) { return stats.appearances ? stats.ratingTotal / stats.appearances : 0 }
export function createPlayerCareer(name: string, clubId: string, position: PlayerPosition, shirtNumber: number): PlayerCareer {
  const safeClub = clubs.some(club => club.id === clubId) ? clubId : clubs[0].id
  const safePosition = playerPositions.some(item => item.id === position) ? position : 'ATA'
  return { version: 3, mode: 'player', name: name.trim(), clubId: safeClub, position: safePosition, shirtNumber: clamp(Math.round(shirtNumber), 1, 99), age: 17, season: 1, round: 0, attributes: { ...bases[safePosition] }, bonus: 0, experience: 0, skillPoints: 0, energy: 100, sharpness: 45, trust: 38, trainingCompleted: false, trainingReports: [], contract: { clubId: safeClub, seasons: 3, wage: 28 }, stats: emptyStats(), allTime: emptyStats(), matches: [], seasons: [], offers: [], seasonComplete: false, dynamics: defaultDynamics(safePosition), ...createPlayerCompetition(1) }
}
export function trainPlayer(career: PlayerCareer, kind: PlayerTraining): PlayerCareer {
  if (career.trainingCompleted || career.seasonComplete || career.energy < 20) return career
  const report = (data: PlayerTrainingReport) => [...(career.trainingReports ?? []), data].slice(-12)
  if (kind === 'recovery') return { ...career, energy: clamp(career.energy + 24, 0, 100), sharpness: clamp(career.sharpness - 2, 0, 100), dynamics: { ...career.dynamics, morale: clamp(career.dynamics.morale + 3, 0, 100) }, trainingCompleted: true, trainingReports: report({ round: career.round + 1, kind, focus: 'Recuperação', primary: 'physical', energyDelta: 24, sharpnessDelta: -2, trustDelta: 0, attributeDelta: 0, text: 'Recuperou energia, melhorou a moral e reduziu a carga antes do próximo jogo.' }) }
  const effects: Record<Exclude<PlayerTraining, 'recovery'>, [PlayerAttribute, PlayerAttribute, number]> = { physical: ['pace', 'physical', 17], finishing: ['shooting', 'dribbling', 15], creation: ['passing', 'dribbling', 14], defensive: ['defending', 'physical', 15] }
  const [primary, secondary, cost] = effects[kind]
  const secondaryGain = career.round % 2
  return { ...career, attributes: { ...career.attributes, [primary]: clamp(career.attributes[primary] + 1, 1, 99), [secondary]: clamp(career.attributes[secondary] + secondaryGain, 1, 99) }, energy: clamp(career.energy - cost, 0, 100), sharpness: clamp(career.sharpness + 9, 0, 100), trust: clamp(career.trust + 5, 0, 100), trainingCompleted: true, trainingReports: report({ round: career.round + 1, kind, focus: playerAttributeLabels[primary], primary, secondary, energyDelta: -cost, sharpnessDelta: 9, trustDelta: 5, attributeDelta: 1 + secondaryGain, text: `Ganhou ritmo, confiança e evolução direta em ${playerAttributeLabels[primary].toLowerCase()}.` }) }
}
export function playerMarketValue(career: Pick<PlayerCareer, 'age' | 'stats' | 'position' | 'attributes' | 'bonus' | 'trust'>) {
  const overall = playerOverall(career)
  const positionBonus = ['ATA', 'PE', 'MC'].includes(career.position) ? 1.12 : career.position === 'GOL' ? .92 : 1
  const ageCurve = career.age <= 20 ? 1.25 : career.age <= 24 ? 1.15 : career.age <= 29 ? 1 : career.age <= 33 ? .78 : .55
  const output = 1 + Math.min(.35, (career.stats.goals + career.stats.assists) * .015 + averageRating(career.stats) * .018)
  return Math.max(1800, Math.round((overall - 52) * (overall - 52) * 24 * positionBonus * ageCurve * output / 100) * 100)
}
function makeOffers(career: PlayerCareer, overall: number): PlayerOffer[] {
  const others = clubs.filter(club => club.id !== career.clubId)
  const start = (career.season * 5 + overall + career.stats.goals * 3 + career.stats.assists) % others.length
  const count = overall >= 72 || averageRating(career.stats) >= 7.4 ? 3 : 2
  const baseWage = Math.round(Math.max(45, overall * 1.35 + averageRating(career.stats) * 7 + (career.stats.goals + career.stats.assists) * 2))
  const external = Array.from({ length: count }, (_, index) => others[(start + index * 6) % others.length]).map((club, index) => ({ clubId: club.id, seasons: index === 0 ? 4 : 3, wage: baseWage + index * 18 + (clubs.findIndex(item => item.id === club.id) < 8 ? 18 : 0), role: index === 0 ? 'Disputará titularidade com bônus por metas' : index === 1 ? 'Projeto de crescimento e minutos reais' : 'Contrato de rotação com plano de evolução', status: 'received' as const, note: 'Proposta recebida ao fim da temporada.' }))
  return [{ clubId: career.clubId, seasons: 3, wage: Math.round(baseWage * .92), role: 'Renovação com o clube atual', status: 'received' as const, note: 'Seu clube quer manter você no elenco.' }, ...external].filter((offer, index, offers) => offers.findIndex(item => item.clubId === offer.clubId) === index)
}
export function playPlayerRound(career: PlayerCareer, approach: MatchApproach): PlayerCareer {
  const fixture = nextPlayerFixture(career)
  if (career.seasonComplete || !fixture || career.dynamics.pendingDecision) return career
  const role = playerRole(career)
  const overall = playerOverall(career)
  const seed = career.name.length * 3 + career.season * 17 + career.round * 11 + career.shirtNumber
  const minutes = role === 'starter' ? 90 : role === 'bench' ? 25 + seed % 16 : 0
  const approachBonus = approach === 'bold' ? .45 : approach === 'team' ? .22 : .05
  const energyPenalty = Math.max(0, 65 - career.energy) / 22
  const rating = minutes ? clamp(Math.round((5.7 + (overall - 60) * .045 + career.sharpness * .009 + approachBonus - energyPenalty + (seed % 5) * .13) * 10) / 10, 5, 10) : 0
  const attack = ['PE', 'ATA'].includes(career.position) ? 3 : ['MC', 'VOL'].includes(career.position) ? 2 : 1
  const baseTeamGoals = Math.floor(((seed % 19) / 19) * 3.2 + (overall - 62) / 26 + (fixture.atHome ? .25 : 0))
  const contributionChance = minutes && career.position !== 'GOL' ? attack + (approach === 'bold' ? 1 : approach === 'team' ? .6 : 0) + Math.max(0, rating - 6.7) : 0
  let teamGoals = clamp(baseTeamGoals + Number(contributionChance > 3.2 && seed % 5 === 0), 0, 5)
  let goals = minutes && career.position !== 'GOL' && teamGoals > 0 && seed % 10 < contributionChance ? 1 + Number(teamGoals > 1 && rating >= 9 && seed % 7 === 0) : 0
  goals = clamp(goals, 0, teamGoals)
  let assists = minutes && career.position !== 'GOL' && teamGoals - goals > 0 && (seed + 3) % 10 < (approach === 'team' ? contributionChance + 1.5 : contributionChance) ? 1 : 0
  assists = clamp(assists, 0, Math.max(0, teamGoals - goals))
  const opponentGoals = (seed + 2 + career.round) % 4
  if (goals + assists > teamGoals) teamGoals = goals + assists
  const objectiveCompleted = career.dynamics.objective.kind === 'rating' ? rating >= career.dynamics.objective.target : career.dynamics.objective.kind === 'contribution' ? goals + assists >= career.dynamics.objective.target : career.dynamics.objective.kind === 'result' ? teamGoals >= opponentGoals : minutes >= career.dynamics.objective.target
  const absenceReason = career.dynamics.injuryMatches ? 'Lesionado' : career.dynamics.suspensionMatches ? 'Suspenso' : undefined
  const highlights: PlayerMatchHighlight[] = minutes ? [
    { minute: 12 + seed % 18, title: role === 'starter' ? 'Primeiros movimentos' : 'Aquecimento intenso', text: role === 'starter' ? 'Você entrou no plano inicial e participou da saída de bola.' : 'O banco começou a se mexer cedo, com chance real de entrada.', tone: 'neutral' as const },
    ...(goals ? [{ minute: 35 + seed % 37, title: 'Gol seu', text: `Finalização decisiva para o ${clubName(career.clubId)}.`, tone: 'positive' as const }] : []),
    ...(assists ? [{ minute: 48 + seed % 31, title: 'Assistência confirmada', text: 'Passe certo para um companheiro concluir a jogada em gol.', tone: 'positive' as const }] : []),
    { minute: 75 + seed % 14, title: objectiveCompleted ? 'Meta cumprida' : 'Última pressão', text: objectiveCompleted ? 'A comissão marcou o objetivo individual como concluído.' : 'O jogo terminou pedindo mais impacto no próximo compromisso.', tone: (objectiveCompleted ? 'positive' : 'warning') as PlayerMatchHighlight['tone'] },
  ].sort((a, b) => a.minute - b.minute) : [{ minute: 90, title: absenceReason ?? 'Fora dos planos', text: absenceReason ? 'Você acompanhou a partida sem atuar.' : 'O treinador manteve você fora da lista desta rodada.', tone: 'warning' as const }]
  const match: PlayerMatch = { season: career.season, round: fixture.round, clubId: career.clubId, opponentId: fixture.opponentId, competition: fixture.competition, cupStage: fixture.stage, atHome: fixture.atHome, role, absenceReason, objectiveCompleted, minutes, goals, assists, rating, teamGoals, opponentGoals, approach, highlights }
  const appeared = Number(minutes > 0)
  const stats = { appearances: career.stats.appearances + appeared, starts: career.stats.starts + Number(role === 'starter'), minutes: career.stats.minutes + minutes, goals: career.stats.goals + goals, assists: career.stats.assists + assists, ratingTotal: career.stats.ratingTotal + rating, motm: career.stats.motm + Number(rating >= 8.5) }
  const earnedExperience = minutes ? Math.round(rating * 7 + goals * 18 + assists * 12) : 12
  const totalExperience = career.experience + earnedExperience
  const competition = commitPlayerFixture(career, fixture, teamGoals, opponentGoals)
  const nextRound = career.round + Number(fixture.competition === 'league')
  const complete = nextRound === playerSeasonLength && !!(competition.cup.champion || competition.cup.eliminated)
  const newInjury = minutes > 60 && seed % 29 === 0; const injured = newInjury ? 2 : Math.max(0, career.dynamics.injuryMatches - 1); const booked = minutes > 0 && seed % 7 === 0; const cards = booked ? career.dynamics.yellowCards + 1 : career.dynamics.yellowCards; const suspended = cards >= 3 ? 1 : Math.max(0, career.dynamics.suspensionMatches - 1); const finalCards = cards >= 3 ? 0 : cards
  const moment: PlayerMoment = newInjury ? { event: career.matches.length + 1, title: 'Departamento médico', text: 'Uma lesão muscular exige duas partidas de recuperação.', tone: 'warning' } : objectiveCompleted ? { event: career.matches.length + 1, title: 'Meta cumprida', text: `${career.dynamics.objective.title}. A comissão reconheceu sua atuação.`, tone: 'positive' } : { event: career.matches.length + 1, title: 'Análise pós-jogo', text: rating ? `Nota ${rating.toFixed(1)} e novo plano para o próximo compromisso.` : 'Você não entrou em campo e seguirá disputando espaço.', tone: 'neutral' }
  const pendingDecision = fixture.competition === 'league' && nextRound > 0 && nextRound % 6 === 0 && nextRound < playerSeasonLength ? { id: `s${career.season}r${nextRound}`, title: 'Momento de carreira', text: 'A agenda abriu espaço para uma decisão fora de campo. Escolha onde concentrar sua energia.' } : undefined
  const dynamics: PlayerDynamics = { ...career.dynamics, morale: clamp(career.dynamics.morale + (objectiveCompleted ? 4 : -2) + (teamGoals > opponentGoals ? 2 : teamGoals < opponentGoals ? -2 : 0), 0, 100), form: clamp(Math.round(career.dynamics.form * .7 + (rating || 5.5) * 3), 0, 100), injuryMatches: injured, suspensionMatches: suspended, yellowCards: finalCards, objective: { ...objectiveFor(career.position, career.matches.length + 1) }, objectivesCompleted: career.dynamics.objectivesCompleted + Number(objectiveCompleted), moments: [...career.dynamics.moments, moment].slice(-24), ...(pendingDecision ? { pendingDecision } : {}) }
  const next = { ...career, ...competition, dynamics, round: nextRound, stats, matches: [...career.matches, match].slice(-100), energy: clamp(career.energy - (role === 'starter' ? 28 : role === 'bench' ? 14 : 0) + 24, 0, 100), sharpness: clamp(career.sharpness + (minutes ? 3 : -4), 0, 100), trust: clamp(career.trust + (minutes ? Math.round((rating - 6.3) * 4) + goals * 3 + assists * 2 + Number(objectiveCompleted) * 2 : -3), 0, 100), experience: totalExperience % 100, skillPoints: career.skillPoints + Math.floor(totalExperience / 100), trainingCompleted: false, seasonComplete: complete }
  return complete ? { ...next, offers: makeOffers(next, playerOverall(next)) } : next
}
export function improvePlayer(career: PlayerCareer, attribute: PlayerAttribute): PlayerCareer { if (career.skillPoints < 1 || career.seasonComplete && career.offers.length === 0 || career.attributes[attribute] >= 99) return career; return { ...career, skillPoints: career.skillPoints - 1, attributes: { ...career.attributes, [attribute]: career.attributes[attribute] + 1 } } }
export type PlayerDecisionChoice = 'professional' | 'team' | 'supporters'
export function resolvePlayerDecision(career: PlayerCareer, choice: PlayerDecisionChoice): PlayerCareer {
  if (!career.dynamics.pendingDecision) return career
  const effects = choice === 'professional' ? { morale: 1, trust: 5, energy: 8, title: 'Trabalho individual' } : choice === 'team' ? { morale: 4, trust: 3, energy: 4, title: 'Convívio com o elenco' } : { morale: 7, trust: 1, energy: 2, title: 'Encontro com a torcida' }
  const moment: PlayerMoment = { event: career.matches.length, title: effects.title, text: 'A decisão repercutiu no vestiário e preparou o próximo capítulo.', tone: 'positive' }
  const dynamics = { ...career.dynamics }; delete dynamics.pendingDecision
  return { ...career, energy: clamp(career.energy + effects.energy, 0, 100), trust: clamp(career.trust + effects.trust, 0, 100), dynamics: { ...dynamics, morale: clamp(dynamics.morale + effects.morale, 0, 100), moments: [...dynamics.moments, moment].slice(-24) } }
}
function accumulated(a: PlayerStats, b: PlayerStats): PlayerStats { return { appearances: a.appearances + b.appearances, starts: a.starts + b.starts, minutes: a.minutes + b.minutes, goals: a.goals + b.goals, assists: a.assists + b.assists, ratingTotal: a.ratingTotal + b.ratingTotal, motm: a.motm + b.motm } }
function beginNextSeason(career: PlayerCareer, clubId: string, contract: PlayerCareer['contract']): PlayerCareer {
  const overall = playerOverall(career)
  const table = playerStandings(career.leagueResults); const own = table.find(row => row.id === career.clubId)!
  return { ...career, ...createPlayerCompetition(career.season + 1), clubId, contract, age: career.age + 1, season: career.season + 1, round: 0, energy: 100, sharpness: 50, trust: clubId === career.clubId ? clamp(career.trust, 35, 75) : 42, dynamics: { ...defaultDynamics(career.position), morale: clamp(career.dynamics.morale, 55, 85) }, trainingCompleted: false, stats: emptyStats(), allTime: accumulated(career.allTime, career.stats), seasons: [...career.seasons, { season: career.season, clubId: career.clubId, overall, stats: { ...career.stats }, leagueRank: table.findIndex(row => row.id === career.clubId) + 1, leaguePoints: own.points, cupResult: playerCupStatus(career.cup, career.clubId) }], offers: [], seasonComplete: false }
}
export function acceptPlayerOffer(career: PlayerCareer, clubId: string): PlayerCareer { const offer = career.offers.find(item => item.clubId === clubId); return career.seasonComplete && offer ? beginNextSeason(career, clubId, { clubId, seasons: offer.seasons, wage: offer.wage }) : career }
export function stayUnderContract(career: PlayerCareer): PlayerCareer { return career.seasonComplete && career.contract.seasons > 1 ? beginNextSeason(career, career.clubId, { ...career.contract, seasons: career.contract.seasons - 1 }) : career }
export function rejectPlayerOffer(career: PlayerCareer, clubId: string): PlayerCareer { return { ...career, offers: career.offers.map(offer => offer.clubId === clubId ? { ...offer, status: 'rejected', note: 'Proposta recusada. O clube saiu da mesa por enquanto.' } : offer) } }
export function counterPlayerOffer(career: PlayerCareer, clubId: string, wage: number, seasons: number): PlayerCareer {
  const offer = career.offers.find(item => item.clubId === clubId)
  if (!career.seasonComplete || !offer || offer.status === 'rejected' || !Number.isSafeInteger(wage) || !Number.isInteger(seasons) || seasons < 1 || seasons > 5) return career
  const maxWage = Math.round(offer.wage * (offer.clubId === career.clubId ? 1.18 : 1.28))
  return { ...career, offers: career.offers.map(item => item.clubId === clubId ? wage <= maxWage ? { ...item, wage, seasons, status: 'accepted', note: 'Contraproposta aceita. Agora falta assinar.' } : { ...item, wage: maxWage, seasons, status: 'countered', note: `O clube não chegou nesse valor e respondeu com R$ ${maxWage} mil/mês.` } : item) }
}
export function savePlayerCareer(career: PlayerCareer) { try { localStorage.setItem(storageKey, JSON.stringify(career)); return true } catch { return false } }
function migratePlayerCareer(raw: any): PlayerCareer {
  const overall = playerOverall(raw)
  return { ...raw, ...createPlayerCompetition((raw.season ?? 1) + 1), version: 3, season: (raw.season ?? 1) + 1, age: (raw.age ?? 17) + 1, round: 0, stats: emptyStats(), allTime: accumulated(raw.allTime ?? emptyStats(), raw.stats ?? emptyStats()), seasons: [...(raw.seasons ?? []), { season: raw.season ?? 1, clubId: raw.clubId, overall, stats: raw.stats ?? emptyStats(), cupResult: 'Formato clássico de 12 rodadas' }], dynamics: defaultDynamics(raw.position), trainingReports: [], trainingCompleted: false, seasonComplete: false, offers: [], matches: (raw.matches ?? []).map((match: PlayerMatch) => ({ ...match, competition: 'league', atHome: true, objectiveCompleted: false })) }
}
export function loadPlayerCareer(): PlayerCareer | null {
  try { const raw: any = JSON.parse(localStorage.getItem(storageKey) ?? 'null'); if (!raw || typeof raw !== 'object') return null; const value: PlayerCareer = raw.version === 1 ? migratePlayerCareer(raw) : raw.version === 2 ? { ...raw, version: 3, dynamics: defaultDynamics(raw.position), matches: (raw.matches ?? []).map((match: PlayerMatch) => ({ ...match, objectiveCompleted: false })) } : raw; if (value.version !== 3 || value.mode !== 'player' || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 40 || !clubs.some(club => club.id === value.clubId) || !playerPositions.some(position => position.id === value.position) || !Number.isInteger(value.shirtNumber) || value.shirtNumber < 1 || value.shirtNumber > 99 || !Number.isInteger(value.season) || value.season < 1 || !Number.isInteger(value.round) || value.round < 0 || value.round > playerSeasonLength || !Array.isArray(value.leagueResults) || !value.cup || !Array.isArray(value.teamEvolution) || !value.dynamics) return null; return value } catch { return null }
}
