import { leagueClubIds, type CupStage, type CupState, type CupTie } from './types'

export const externalCupClubs = [
  { id: 'fortaleza', name: 'Fortaleza', initials: 'FOR', city: 'Fortaleza · CE', color: '#3157a4' },
  { id: 'juventude', name: 'Juventude', initials: 'JUV', city: 'Caxias do Sul · RS', color: '#3b9c57' },
  { id: 'ceara', name: 'Ceará', initials: 'CEA', city: 'Fortaleza · CE', color: '#e8e8e8' },
  { id: 'sport', name: 'Sport', initials: 'SPT', city: 'Recife · PE', color: '#d83b3b' },
  { id: 'goias', name: 'Goiás', initials: 'GOI', city: 'Goiânia · GO', color: '#319458' },
  { id: 'vila-nova', name: 'Vila Nova', initials: 'VIL', city: 'Goiânia · GO', color: '#d43b3b' },
  { id: 'crb', name: 'CRB', initials: 'CRB', city: 'Maceió · AL', color: '#db3d3d' },
  { id: 'csa', name: 'CSA', initials: 'CSA', city: 'Maceió · AL', color: '#4386c7' },
  { id: 'athletic', name: 'Athletic Club', initials: 'ATH', city: 'São João del-Rei · MG', color: '#dedede' },
  { id: 'retro', name: 'Retrô', initials: 'RET', city: 'Camaragibe · PE', color: '#e7bd32' },
  { id: 'novorizontino', name: 'Novorizontino', initials: 'NOV', city: 'Novo Horizonte · SP', color: '#e4c63d' },
  { id: 'cuiaba', name: 'Cuiabá', initials: 'CUI', city: 'Cuiabá · MT', color: '#e9c83a' },
] as const

export const cupClubIds = [...leagueClubIds, ...externalCupClubs.map(club => club.id)]
export const cupSchedule: Record<CupStage, number[]> = { 5: [20, 23], 6: [44, 47], 7: [68, 71], 8: [92, 95], 9: [116] }
export const cupDays = Object.values(cupSchedule).flat()
export const cupStageNames: Record<CupStage, string> = { 5: '5ª fase', 6: 'Oitavas de final', 7: 'Quartas de final', 8: 'Semifinal', 9: 'Final' }
export const cupPrizes: Record<CupStage, number> = { 5: 1500, 6: 2500, 7: 4000, 8: 7000, 9: 12000 }

function seededOrder(season: number) {
  const shift = Math.abs(season - 1) % cupClubIds.length
  return [...cupClubIds.slice(shift), ...cupClubIds.slice(0, shift)]
}
export function createCupState(season = 1): CupState {
  const ordered = seededOrder(season)
  const ties: CupTie[] = Array.from({ length: ordered.length / 2 }, (_, index) => ({ stage: 5, home: ordered[index], away: ordered[ordered.length - 1 - index] }))
  return { stage: 5, ties, results: [], eliminated: false, prize: 0 }
}
export function createCupStateForDay(season: number, day: number, clubId: string): CupState {
  if (day > cupSchedule[9][0]) return { stage: 9, ties: [], results: [], eliminated: true, prize: 0 }
  const stage = ([5, 6, 7, 8, 9] as CupStage[]).find(item => day <= cupSchedule[item].at(-1)!) ?? 9
  const size = 2 ** (10 - stage)
  const ordered = seededOrder(season)
  const participants = [clubId, ...ordered.filter(id => id !== clubId)].slice(0, size)
  const ties: CupTie[] = Array.from({ length: size / 2 }, (_, index) => ({ stage, home: participants[index], away: participants[size - 1 - index] }))
  const results = day > cupSchedule[stage][0] && cupSchedule[stage].length === 2 ? ties.map(tie => ({ stage, leg: 1 as const, home: tie.home, away: tie.away, homeGoals: 0, awayGoals: 0 })) : []
  return { stage, ties, results, eliminated: false, prize: 0 }
}
export function cupDayInfo(day: number) {
  for (const stage of [5, 6, 7, 8, 9] as CupStage[]) {
    const index = cupSchedule[stage].indexOf(day)
    if (index >= 0) return { stage, leg: (index + 1) as 1 | 2 }
  }
  return undefined
}
