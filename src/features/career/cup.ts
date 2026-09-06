import { allClubs, type Career } from './model'
import { createCupState, cupDayInfo, cupPrizes, cupSchedule } from './cupData'
import type { CupResult, CupStage, CupState, CupTie } from './types'

const nextStage: Partial<Record<CupStage, CupStage>> = { 5: 6, 6: 7, 7: 8, 8: 9 }
export function cupOf(career: Career): CupState { return career.cup ?? createCupState(career.seasonNumber ?? 1) }

export function cupFixture(career: Career) {
  if (!career.leagueActive) return undefined
  const info = cupDayInfo(career.day ?? 1)
  const cup = cupOf(career)
  if (!info || info.stage !== cup.stage || cup.eliminated) return undefined
  const tie = cup.ties.find(item => item.home === career.clubId || item.away === career.clubId)
  if (!tie) return undefined
  const home = info.leg === 1 ? tie.home : tie.away
  const away = info.leg === 1 ? tie.away : tie.home
  return { ...info, home, away, opponent: home === career.clubId ? away : home, atHome: home === career.clubId }
}

function goalsFor(result: CupResult, clubId: string) { return result.home === clubId ? result.homeGoals : result.awayGoals }
export function tieWinner(tie: CupTie, results: CupResult[]) {
  const played = results.filter(result => result.stage === tie.stage && [result.home, result.away].includes(tie.home) && [result.home, result.away].includes(tie.away))
  const homeGoals = played.reduce((sum, result) => sum + goalsFor(result, tie.home), 0)
  const awayGoals = played.reduce((sum, result) => sum + goalsFor(result, tie.away), 0)
  if (homeGoals !== awayGoals) return homeGoals > awayGoals ? tie.home : tie.away
  return played.at(-1)?.penaltiesWinner
}

function simulatedResult(tie: CupTie, stage: CupStage, leg: 1 | 2, previous: CupResult[], random: () => number): CupResult {
  const home = leg === 1 ? tie.home : tie.away
  const away = leg === 1 ? tie.away : tie.home
  const result: CupResult = { stage, leg, home, away, homeGoals: Math.floor(random() * 4), awayGoals: Math.floor(random() * 4) }
  const complete = [...previous, result]
  if ((stage === 9 || leg === 2) && !tieWinner(tie, complete)) result.penaltiesWinner = random() < .5 ? home : away
  return result
}

function advanceCup(career: Career, cup: CupState) {
  const winners = cup.ties.map(tie => tieWinner(tie, cup.results)).filter((winner): winner is string => !!winner)
  const userAdvanced = winners.includes(career.clubId)
  const prize = cup.prize + (userAdvanced ? cupPrizes[cup.stage] : 0)
  const finances = career.finances ? { ...career.finances, budget: career.finances.budget + (userAdvanced ? cupPrizes[cup.stage] : 0) } : career.finances
  if (cup.stage === 9) return { ...career, finances, cup: { ...cup, prize, champion: winners[0], eliminated: winners[0] !== career.clubId } }
  const stage = nextStage[cup.stage]!
  const ties: CupTie[] = Array.from({ length: winners.length / 2 }, (_, index) => ({ stage, home: winners[index], away: winners[winners.length - 1 - index] }))
  return { ...career, finances, cup: { ...cup, stage, ties, prize, eliminated: !userAdvanced } }
}

export function commitCupDay(career: Career, random = Math.random): Career {
  if (!career.leagueActive) return career
  const day = career.day ?? 1
  const info = cupDayInfo(day)
  const cup = cupOf(career)
  if (!info || info.stage !== cup.stage || cup.results.some(result => result.stage === info.stage && result.leg === info.leg)) return career.cup ? career : { ...career, cup }
  const userTie = !cup.eliminated ? cup.ties.find(tie => [tie.home, tie.away].includes(career.clubId)) : undefined
  if (userTie && career.match?.cursor !== 9) return career
  const fixture = userTie ? cupFixture({ ...career, cup }) : undefined
  const added = cup.ties.map(tie => {
    if (tie !== userTie || !fixture || !career.match) return simulatedResult(tie, info.stage, info.leg, cup.results, random)
    const ownGoals = career.match.events.filter(event => event.goal && event.side === 'home').length
    const opponentGoals = career.match.events.filter(event => event.goal && event.side === 'away').length
    const result: CupResult = { stage: info.stage, leg: info.leg, home: fixture.home, away: fixture.away, homeGoals: fixture.atHome ? ownGoals : opponentGoals, awayGoals: fixture.atHome ? opponentGoals : ownGoals }
    if ((info.stage === 9 || info.leg === 2) && !tieWinner(tie, [...cup.results, result])) result.penaltiesWinner = (career.match.disciplineRolls?.[5] ?? random()) < .5 ? fixture.home : fixture.away
    return result
  })
  const next = { ...career, cup: { ...cup, results: [...cup.results, ...added] } }
  const finalLeg = info.stage === 9 || info.leg === cupSchedule[info.stage].length
  return finalLeg ? advanceCup(next, next.cup) : next
}

export function cupOpponentName(id: string) { return allClubs.find(club => club.id === id)?.name ?? id }
