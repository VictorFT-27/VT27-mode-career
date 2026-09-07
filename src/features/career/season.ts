import { commitRound } from './league'
import { settleAvailability } from './availability'
import { finalizeRatings, minutesPlayed, resolveEvent } from './matchEngine'
import { rosterOf, type Career } from './model'
import { fixtureDays, leagueDays, leagueEndDay, type Preparation, type TrainingIntensity, type TrainingKind, type TrainingSector } from './types'
import { commitCupDay, cupFixture } from './cup'
import { tacticalFatigue, tacticsOf } from './tactics'

export const sessions: { kind: TrainingKind; name: string; subtitle: string; effect: string }[] = [
  { kind: 'recovery', name: 'Recuperação', subtitle: 'Reduzir carga', effect: 'Recupera energia, reduz carga e preserva o elenco.' },
  { kind: 'physical', name: 'Físico', subtitle: 'Mais resistência', effect: 'Eleva preparo físico e carga de trabalho.' },
  { kind: 'technical', name: 'Técnico', subtitle: 'Qualidade com a bola', effect: 'Aumenta ritmo e qualidade técnica do setor escolhido.' },
  { kind: 'tactical', name: 'Tático', subtitle: 'Organização do plano', effect: 'Melhora entrosamento e compreensão da estratégia.' },
  { kind: 'collective', name: 'Coletivo', subtitle: 'Competição interna', effect: 'Eleva ritmo e moral, com desgaste maior.' },
]
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
const defaults = { skill: 50, fitness: 55, cohesion: 50, sharpness: 50, morale: 60, workload: 25 }
export function preparation(career: Career): Preparation {
  const raw = career.preparation
  const legacy = raw && raw.sharpness === undefined
  return { energy: Object.fromEntries(rosterOf(career).map(p => [p.id, raw?.energy[p.id] ?? 100])), skill: clamp(legacy ? 50 + (raw?.skill ?? 0) * 6 : raw?.skill ?? defaults.skill), fitness: clamp(legacy ? 55 + (raw?.fitness ?? 0) * 6 : raw?.fitness ?? defaults.fitness), cohesion: clamp(legacy ? 50 + (raw?.cohesion ?? 0) * 4 : raw?.cohesion ?? defaults.cohesion), sharpness: clamp(raw?.sharpness ?? defaults.sharpness), morale: clamp(raw?.morale ?? defaults.morale), workload: clamp(raw?.workload ?? defaults.workload), sessions: raw?.sessions ?? [] }
}
export function energy(career: Career, id: string) { return preparation(career).energy[id] ?? 100 }
export function averageEnergy(career: Career) { const players = rosterOf(career); return Math.round(players.reduce((sum, p) => sum + energy(career, p.id), 0) / players.length) }
export function isMatchDay(career: Career) { return (career.leagueActive ? [...fixtureDays, ...leagueDays] : fixtureDays).includes(career.day ?? 1) || !!cupFixture(career) }
const intensityScale = { light: .65, normal: 1, high: 1.45 }
const sectorPositions: Record<TrainingSector, string[]> = { all: [], defense: ['GOL', 'LD', 'ZAG', 'LE'], midfield: ['VOL', 'MC', 'MD', 'ME'], attack: ['PD', 'PE', 'ATA'] }
export function trainingPreview(career: Career, kind: TrainingKind, intensity: TrainingIntensity = 'normal', sector: TrainingSector = 'all', playerId?: string) {
  const scale = intensityScale[intensity]
  const targeted = rosterOf(career).filter(p => (!playerId || p.id === playerId) && (sector === 'all' || sectorPositions[sector].includes(p.position)))
  const energyDelta = Math.round(({ recovery: 20, physical: -8, technical: -7, tactical: -5, collective: -11 }[kind]) * scale)
  const workloadDelta = Math.round(({ recovery: -22, physical: 14, technical: 9, tactical: 7, collective: 16 }[kind]) * scale)
  const changes = { skill: kind === 'technical' ? Math.round(5 * scale) : 0, fitness: kind === 'physical' ? Math.round(5 * scale) : 0, cohesion: kind === 'tactical' ? Math.round(6 * scale) : kind === 'collective' ? Math.round(3 * scale) : 0, sharpness: kind === 'technical' || kind === 'collective' ? Math.round(6 * scale) : kind === 'recovery' ? -2 : 0, morale: kind === 'collective' ? Math.round(5 * scale) : kind === 'recovery' ? 2 : 0 }
  const projectedLoad = (preparation(career).workload ?? 0) + workloadDelta
  return { targeted, energyDelta, workloadDelta, changes, risk: kind !== 'recovery' && projectedLoad >= 80 ? 'alto' : projectedLoad >= 60 ? 'moderado' : 'baixo' }
}
export function train(career: Career, kind: TrainingKind, intensity: TrainingIntensity = 'normal', sector: TrainingSector = 'all', playerId?: string): Career {
  const day = career.day ?? 1; const prep = preparation(career)
  if (career.board?.status === 'dismissed' || day >= (career.leagueActive ? leagueEndDay : 8) || isMatchDay(career) || career.match || prep.sessions.some(s => s.day === day) || !sessions.some(s => s.kind === kind)) return career
  const preview = trainingPreview(career, kind, intensity, sector, playerId); if (!preview.targeted.length) return career
  const targetIds = new Set(preview.targeted.map(p => p.id))
  const energyMap = Object.fromEntries(rosterOf(career).map(p => [p.id, clamp(energy(career, p.id) + (targetIds.has(p.id) ? preview.energyDelta : kind === 'recovery' ? Math.round(preview.energyDelta / 2) : 0))]))
  const nextWorkload = clamp((prep.workload ?? defaults.workload) + preview.workloadDelta)
  let availability = career.availability; let injuryReport = ''
  if (preview.risk === 'alto' && intensity === 'high') { const exposed = preview.targeted.slice().sort((a, b) => energyMap[a.id] - energyMap[b.id])[0]; if (exposed && energyMap[exposed.id] < 45) { availability = { ...(career.availability ?? {}), [exposed.id]: { injuredMatches: 1, suspensionMatches: career.availability?.[exposed.id]?.suspensionMatches ?? 0, yellowCards: career.availability?.[exposed.id]?.yellowCards ?? 0 } }; injuryReport = ` Atenção: ${exposed.name} sofreu sobrecarga e ficará fora por um jogo.` } }
  const report = `${sessions.find(s => s.kind === kind)!.name}: ${preview.targeted.length} atleta(s), energia ${preview.energyDelta >= 0 ? '+' : ''}${preview.energyDelta}, carga ${preview.workloadDelta >= 0 ? '+' : ''}${preview.workloadDelta}.${injuryReport}`
  return { ...career, dataVersion: 5, seasonVersion: 4, availability, preparation: { energy: energyMap, skill: clamp(prep.skill + preview.changes.skill), fitness: clamp(prep.fitness + preview.changes.fitness), cohesion: clamp(prep.cohesion + preview.changes.cohesion), sharpness: clamp((prep.sharpness ?? 50) + preview.changes.sharpness), morale: clamp((prep.morale ?? 60) + preview.changes.morale), workload: nextWorkload, sessions: [...prep.sessions, { day, kind, intensity, sector, playerId, report }] } }
}
export function advanceDay(career: Career): Career {
  const day = career.day ?? 1; const prep = preparation(career); const completedMatch = career.match?.cursor === 9
  if (career.board?.status === 'dismissed' || day >= (career.leagueActive ? leagueEndDay : 8) || (career.match || isMatchDay(career) ? !completedMatch : !prep.sessions.some(s => s.day === day))) return career
  career = commitRound(career); career = commitCupDay(career)
  const history = career.match ? [...(career.history ?? []).filter(h => h.day !== day), { day, match: career.match }] : career.history ?? []
  return { ...career, seasonVersion: 4, day: day + 1, history, match: undefined, preparation: { ...prep, energy: Object.fromEntries(rosterOf(career).map(p => [p.id, Math.min(100, energy(career, p.id) + 8)])), skill: clamp(prep.skill - 1), fitness: clamp(prep.fitness - 1), cohesion: clamp(prep.cohesion - 1), sharpness: clamp((prep.sharpness ?? 50) - (completedMatch ? 0 : 1)), morale: clamp((prep.morale ?? 60) - (completedMatch ? 0 : 1)), workload: clamp((prep.workload ?? 25) - 8) } }
}
export function progressMatch(career: Career, cursor: number): Career {
  if (career.board?.status === 'dismissed' || !career.match || career.match.cursor === 9) return career
  const match = career.match; const next = Math.max(match.cursor, Math.min(9, Math.floor(cursor))); if (!Number.isFinite(next)) return career
  const events = match.events.map((event, index) => index >= match.cursor && index < next ? resolveEvent(match, index) : event)
  let resolvedMatch = { ...match, events }; if (next === 9) resolvedMatch = finalizeRatings(resolvedMatch)
  const prep = preparation(career); const fatigue = 25 - (prep.fitness - 50) / 10 + tacticalFatigue(tacticsOf(career))
  const progressed = { ...career, seasonVersion: 4, match: { ...resolvedMatch, cursor: next }, preparation: next === 9 ? { ...prep, energy: Object.fromEntries(rosterOf(career).map(p => [p.id, Math.max(0, energy(career, p.id) - fatigue * minutesPlayed(resolvedMatch, p.id) / 90)])), workload: clamp((prep.workload ?? 25) + 12), sharpness: clamp((prep.sharpness ?? 50) + 3), morale: clamp((prep.morale ?? 60) + 1) } : prep }
  return commitCupDay(commitRound(next === 9 ? settleAvailability(progressed) : progressed))
}

