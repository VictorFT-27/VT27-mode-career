import { commitRound } from './league'
import { finalizeRatings, minutesPlayed, resolveEvent } from './matchEngine'
import { rosterOf, type Career } from './model'
import { fixtureDays, leagueDays, type Preparation, type TrainingKind } from './types'
export const sessions: { kind: TrainingKind; name: string; subtitle: string; effect: string }[] = [
  { kind: 'physical', name: 'Físico', subtitle: 'Mais resistência', effect: '−8 de energia. +1 de preparo físico (até 3), reduzindo o desgaste de cada jogo em 2 pontos por nível.' },
  { kind: 'technical', name: 'Técnico', subtitle: 'Qualidade com a bola', effect: '−10 de energia. +1 de nível técnico do elenco (até +3), aplicado à força nas partidas.' },
  { kind: 'tactical', name: 'Tático', subtitle: 'Um time mais conectado', effect: '−5 de energia. +2 de entrosamento (até +6), somados à força coletiva.' },
  { kind: 'recovery', name: 'Recuperação', subtitle: 'Pernas leves de novo', effect: '+20 de energia para todos os atletas, até 100. Não aumenta técnica ou entrosamento.' },
]
export function preparation(career: Career): Preparation { return career.preparation ?? { energy: Object.fromEntries(rosterOf(career).map(p => [p.id, 100])), skill: 0, fitness: 0, cohesion: 0, sessions: [] } }
export function energy(career: Career, id: string) { return preparation(career).energy[id] ?? 100 }
export function averageEnergy(career: Career) { const players = rosterOf(career); return Math.round(players.reduce((sum, p) => sum + energy(career, p.id), 0) / players.length) }
export function isMatchDay(career: Career) { return (career.leagueActive ? [...fixtureDays, ...leagueDays] : fixtureDays).includes(career.day ?? 1) }
export function train(career: Career, kind: TrainingKind): Career {
  const day = career.day ?? 1
  const prep = preparation(career)
  if (career.board?.status === 'dismissed' || day > (career.leagueActive ? 24 : 7) || isMatchDay(career) || career.match || prep.sessions.some(s => s.day === day) || !sessions.some(s => s.kind === kind)) return career
  const delta = { physical: -8, technical: -10, tactical: -5, recovery: 20 }[kind]
  return { ...career, seasonVersion: 3, preparation: { energy: Object.fromEntries(rosterOf(career).map(p => [p.id, Math.max(0, Math.min(100, energy(career, p.id) + delta))])), skill: Math.min(3, prep.skill + (kind === 'technical' ? 1 : 0)), fitness: Math.min(3, prep.fitness + (kind === 'physical' ? 1 : 0)), cohesion: Math.min(6, prep.cohesion + (kind === 'tactical' ? 2 : 0)), sessions: [...prep.sessions, { day, kind }] } }
}
export function advanceDay(career: Career): Career {
  const day = career.day ?? 1
  const prep = preparation(career)
  if (career.board?.status === 'dismissed' || day >= (career.leagueActive ? 25 : 8) || (isMatchDay(career) ? career.match?.cursor !== 9 : !prep.sessions.some(s => s.day === day))) return career
  career = commitRound(career)
  const history = career.match ? [...(career.history ?? []).filter(h => h.day !== day), { day, match: career.match }] : career.history ?? []
  return { ...career, seasonVersion: 3, day: day + 1, history, match: undefined, preparation: { ...prep, energy: Object.fromEntries(rosterOf(career).map(p => [p.id, Math.min(100, energy(career, p.id) + 8)])) } }
}
export function progressMatch(career: Career, cursor: number): Career {
  if (career.board?.status === 'dismissed' || !career.match || career.match.cursor === 9) return career
  const match = career.match
  const next = Math.max(match.cursor, Math.min(9, Math.floor(cursor)))
  if (!Number.isFinite(next)) return career
  const events = match.events.map((event, index) => index >= match.cursor && index < next ? resolveEvent(match, index) : event)
  let resolvedMatch = { ...match, events }
  if (next === 9) resolvedMatch = finalizeRatings(resolvedMatch)
  const prep = preparation(career)
  const fatigue = 24 - prep.fitness * 2
  return commitRound({ ...career, seasonVersion: 3, match: { ...resolvedMatch, cursor: next }, preparation: next === 9 ? { ...prep, energy: Object.fromEntries(rosterOf(career).map(p => [p.id, Math.max(0, energy(career, p.id) - fatigue * minutesPlayed(resolvedMatch, p.id) / 90)])) } : prep })
}
