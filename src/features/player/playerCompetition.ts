import { clubs } from '../career/realData'
import { createCupState, cupStageNames } from '../career/cupData'
import { leagueRounds, type CupResult, type CupStage, type CupState, type CupTie, type LeagueResult } from '../career/types'

export type TeamSnapshot = { event: number; rank: number; points: number; form: number; scored: number; conceded: number }
export type PlayerCompetition = { leagueResults: LeagueResult[]; cup: CupState; teamEvolution: TeamSnapshot[] }
export type PlayerFixture = { competition: 'league' | 'cup'; round: number; opponentId: string; atHome: boolean; stage?: CupStage; leg?: 1 | 2 }
type Seed = { name: string; season: number; clubId: string; round: number }

const gates: Record<CupStage, number[]> = { 5: [4, 5], 6: [12, 13], 7: [20, 21], 8: [28, 29], 9: [36] }
const hash = (text: string) => [...text].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 17)
const roll = (career: Seed, key: string) => (hash(`${career.name}:${career.season}:${key}`) % 1000) / 1000

export function createPlayerCompetition(season: number): PlayerCompetition { return { leagueResults: [], cup: createCupState(season), teamEvolution: [] } }

export function playerStandings(results: LeagueResult[]) {
  const rows = clubs.map(c => ({ id: c.id, name: c.name, played: 0, points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, difference: 0 }))
  for (const result of results) {
    const home = rows.find(row => row.id === result.home)!; const away = rows.find(row => row.id === result.away)!
    home.played++; away.played++; home.goalsFor += result.homeGoals; home.goalsAgainst += result.awayGoals; away.goalsFor += result.awayGoals; away.goalsAgainst += result.homeGoals
    if (result.homeGoals === result.awayGoals) { home.draws++; away.draws++; home.points++; away.points++ } else { const winner = result.homeGoals > result.awayGoals ? home : away; const loser = winner === home ? away : home; winner.points += 3; winner.wins++; loser.losses++ }
  }
  rows.forEach(row => { row.difference = row.goalsFor - row.goalsAgainst })
  return rows.sort((a, b) => b.points - a.points || b.wins - a.wins || b.difference - a.difference || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name, 'pt-BR'))
}

export function nextPlayerFixture(career: Seed & PlayerCompetition): PlayerFixture | undefined {
  const cup = career.cup; const stageResults = cup.results.filter(result => result.stage === cup.stage); const playedLegs = stageResults.length / Math.max(1, cup.ties.length); const stageGates = gates[cup.stage]
  if (!cup.eliminated && !cup.champion && playedLegs < stageGates.length && career.round >= stageGates[Math.floor(playedLegs)]) {
    const tie = cup.ties.find(item => [item.home, item.away].includes(career.clubId)); if (tie) { const leg = (playedLegs + 1) as 1 | 2; const home = leg === 1 ? tie.home : tie.away; const away = leg === 1 ? tie.away : tie.home; return { competition: 'cup', round: career.round, opponentId: home === career.clubId ? away : home, atHome: home === career.clubId, stage: cup.stage, leg } }
  }
  if (career.round >= leagueRounds.length) return undefined
  const [home, away] = leagueRounds[career.round].find(pair => pair.includes(career.clubId))!
  return { competition: 'league', round: career.round + 1, opponentId: home === career.clubId ? away : home, atHome: home === career.clubId }
}

function score(career: Seed, home: string, away: string, key: string): [number, number] { const homeBonus = clubs.findIndex(c => c.id === home) < 10 ? .35 : 0; const awayBonus = clubs.findIndex(c => c.id === away) < 10 ? .25 : 0; return [Math.floor(roll(career, key + home) * 3.8 + homeBonus), Math.floor(roll(career, key + away) * 3.6 + awayBonus)] }
function tieWinner(tie: CupTie, results: CupResult[]) { const played = results.filter(result => result.stage === tie.stage && [result.home, result.away].includes(tie.home) && [result.home, result.away].includes(tie.away)); const total = (id: string) => played.reduce((sum, result) => sum + (result.home === id ? result.homeGoals : result.awayGoals), 0); return total(tie.home) === total(tie.away) ? played.at(-1)?.penaltiesWinner : total(tie.home) > total(tie.away) ? tie.home : tie.away }

function playCup(career: Seed & PlayerCompetition, fixture: PlayerFixture, ownGoals: number, opponentGoals: number) {
  const cup = career.cup
  const added = cup.ties.map((tie, index): CupResult => { const home = fixture.leg === 1 ? tie.home : tie.away; const away = fixture.leg === 1 ? tie.away : tie.home; const resultScore = [home, away].includes(career.clubId) ? (fixture.atHome ? [ownGoals, opponentGoals] : [opponentGoals, ownGoals]) : score(career, home, away, `cup:${cup.stage}:${fixture.leg}:${index}`); const result: CupResult = { stage: cup.stage, leg: fixture.leg!, home, away, homeGoals: resultScore[0], awayGoals: resultScore[1] }; if ((cup.stage === 9 || fixture.leg === 2) && !tieWinner(tie, [...cup.results, result])) result.penaltiesWinner = roll(career, `pens:${cup.stage}:${index}`) < .5 ? home : away; return result })
  const results = [...cup.results, ...added]
  if (cup.stage !== 9 && fixture.leg === 1) return { ...cup, results }
  const winners = cup.ties.map(tie => tieWinner(tie, results)).filter((id): id is string => !!id)
  if (cup.stage === 9) return { ...cup, results, champion: winners[0], eliminated: winners[0] !== career.clubId }
  const next = ({ 5: 6, 6: 7, 7: 8, 8: 9 } as const)[cup.stage as 5 | 6 | 7 | 8]; const ties = Array.from({ length: winners.length / 2 }, (_, index): CupTie => ({ stage: next, home: winners[index], away: winners[winners.length - 1 - index] }))
  return { ...cup, stage: next, ties, results, eliminated: !winners.includes(career.clubId) }
}

export function commitPlayerFixture(career: Seed & PlayerCompetition, fixture: PlayerFixture, ownGoals: number, opponentGoals: number): PlayerCompetition {
  let leagueResults = career.leagueResults; let cup = career.cup
  if (fixture.competition === 'league') leagueResults = [...leagueResults, ...leagueRounds[fixture.round - 1].map(([home, away]) => { const resultScore = [home, away].includes(career.clubId) ? (fixture.atHome ? [ownGoals, opponentGoals] : [opponentGoals, ownGoals]) : score(career, home, away, `league:${fixture.round}:`); return { round: fixture.round, home, away, homeGoals: resultScore[0], awayGoals: resultScore[1] } })]
  else cup = playCup(career, fixture, ownGoals, opponentGoals)
  // Keep the tournament alive after elimination so a new club inherits its actual stage.
  while (cup.eliminated && !cup.champion && cup.ties.length) {
    const playedLegs = cup.results.filter(result => result.stage === cup.stage).length / cup.ties.length
    const due = gates[cup.stage][playedLegs]
    if (due === undefined || fixture.round < due) break
    cup = playCup({ ...career, cup }, { competition: 'cup', round: fixture.round, stage: cup.stage, leg: (playedLegs + 1) as 1 | 2, atHome: true, opponentId: '' }, 0, 0)
  }
  const table = playerStandings(leagueResults), own = table.find(row => row.id === career.clubId)!, rank = table.findIndex(row => row.id === career.clubId) + 1
  return { leagueResults, cup, teamEvolution: [...career.teamEvolution, { event: career.teamEvolution.length + 1, rank, points: own.points, form: ownGoals > opponentGoals ? 3 : ownGoals === opponentGoals ? 1 : 0, scored: own.goalsFor, conceded: own.goalsAgainst }].slice(-60) }
}

export function playerCupStatus(cup: CupState, clubId: string) { if (cup.champion) return cup.champion === clubId ? 'Campeão da Copa' : `Campeão: ${clubs.find(club => club.id === cup.champion)?.name}`; return cup.eliminated ? 'Eliminado da Copa' : cupStageNames[cup.stage] }
export const playerSeasonLength = leagueRounds.length
