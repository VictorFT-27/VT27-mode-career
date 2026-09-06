import { defaultBoard, type Career } from './model'
import { financesOf, wageUsed } from './transfers'
import type { BoardState, LeagueResult } from './types'

export function boardOf(career: Career): BoardState { return career.board ?? defaultBoard() }
export function isDismissed(career: Career) { return boardOf(career).status === 'dismissed' }
export function boardStatus(confidence: number): BoardState['status'] { return confidence <= 20 ? 'dismissed' : confidence < 45 ? 'pressure' : confidence < 65 ? 'stable' : 'secure' }
export function reviewRound(career: Career, own: LeagueResult, rank: number, target: number): Career {
  const board = boardOf(career)
  if (board.lastRound >= own.round || board.status === 'dismissed') return career
  const won = own.home === career.clubId ? own.homeGoals > own.awayGoals : own.awayGoals > own.homeGoals
  const drew = own.homeGoals === own.awayGoals
  const result = won ? 'win' as const : drew ? 'draw' as const : 'loss' as const
  let delta = won ? 8 : drew ? 2 : -10
  const reasons = [won ? 'vitória' : drew ? 'empate' : 'derrota']
  if (rank <= target) { delta += 3; reasons.push('time dentro da meta') } else { delta -= 4; reasons.push('posição abaixo da meta') }
  const finances = financesOf(career)
  const wageRatio = wageUsed(career) / finances.wageLimit
  if (wageRatio > .95) { delta -= 3; reasons.push('folha salarial no limite') }
  else if (wageRatio < .8 && finances.budget >= 3000) { delta += 1; reasons.push('finanças controladas') }
  if (own.round === 6 && rank > target) { delta -= 8; reasons.push('objetivo final não alcançado') }
  const confidence = Math.max(0, Math.min(100, board.confidence + delta))
  const review = { round: own.round, delta, confidence, rank, result, reason: reasons.join(' · ') }
  return { ...career, board: { confidence, lastRound: own.round, status: boardStatus(confidence), history: [...board.history, review] } }
}
