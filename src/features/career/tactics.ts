import type { Formation, TacticalPlan } from './types'

export const defaultTactics: TacticalPlan = { pressure: 'balanced', defensiveLine: 'balanced', width: 'balanced', tempo: 'balanced', focus: 'balanced' }
export function validTactics(value: unknown): value is TacticalPlan {
  if (!value || typeof value !== 'object') return false
  const plan = value as TacticalPlan
  return ['low', 'balanced', 'high'].includes(plan.pressure) && ['low', 'balanced', 'high'].includes(plan.defensiveLine) && ['narrow', 'balanced', 'wide'].includes(plan.width) && ['patient', 'balanced', 'fast'].includes(plan.tempo) && ['center', 'balanced', 'flanks'].includes(plan.focus)
}
export function tacticsOf(career: { tactics?: TacticalPlan }) { return validTactics(career.tactics) ? career.tactics : defaultTactics }
export function tacticalBonus(plan: TacticalPlan, formation: Formation) {
  let bonus = 0
  if (plan.width === 'wide' && formation === '4-3-3') bonus += 2
  if (plan.width === 'narrow' && formation !== '4-3-3') bonus += 1
  if (plan.focus === 'flanks' && plan.width === 'wide') bonus += 1
  if (plan.focus === 'center' && plan.width === 'narrow') bonus += 1
  if (plan.pressure === 'high') bonus += 1
  if (plan.tempo === 'fast') bonus += 1
  if (plan.defensiveLine === 'high' && plan.pressure === 'low') bonus -= 2
  if (plan.defensiveLine === 'low' && plan.pressure === 'high') bonus -= 1
  return bonus
}
export function tacticalFatigue(plan: TacticalPlan) { return (plan.pressure === 'high' ? 4 : plan.pressure === 'low' ? -2 : 0) + (plan.tempo === 'fast' ? 3 : plan.tempo === 'patient' ? -1 : 0) }
export function tacticalRisk(plan: TacticalPlan) { return (plan.defensiveLine === 'high' ? .04 : plan.defensiveLine === 'low' ? -.04 : 0) + (plan.tempo === 'fast' ? .03 : plan.tempo === 'patient' ? -.02 : 0) }

