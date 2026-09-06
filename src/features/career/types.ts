export type Mentality = 'defensive' | 'balanced' | 'attacking'
export type MatchEvent = { minute: number; side: 'home' | 'away'; goal: boolean; text: string; playerId?: string; sideRoll?: number; goalRoll?: number; playerRoll?: number }
export type Substitution = { minute: number; outId: string; inId: string }
export type Match = { opponent: string; lineup: string[]; startingLineup?: string[]; formation: string; events: MatchEvent[]; cursor: number; ratings: { playerId: string; value: number }[]; strength: number; otherResult?: LeagueResult; otherResults?: LeagueResult[]; mentality?: Mentality; substitutions?: Substitution[]; ratingsFinalized?: boolean; disciplineRolls?: number[]; yellowCards?: string[]; injury?: { playerId: string; matches: number }; disciplineFinalized?: boolean }
export type Formation = '4-3-3' | '4-4-2' | '3-5-2'
export const positions: Record<Formation, string[]> = {
  '4-3-3': ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'MC', 'MC', 'PD', 'ATA', 'PE'],
  '4-4-2': ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'MD', 'MC', 'MC', 'ME', 'ATA', 'ATA'],
  '3-5-2': ['GOL', 'ZAG', 'ZAG', 'ZAG', 'MD', 'VOL', 'MC', 'MC', 'ME', 'ATA', 'ATA'],
}
export type TrainingKind = 'physical' | 'technical' | 'tactical' | 'recovery'
export type Preparation = { energy: Record<string, number>; skill: number; fitness: number; cohesion: number; sessions: { day: number; kind: TrainingKind }[] }
export const fixtureDays = [1, 4, 7]
export type LeagueResult = { round: number; home: string; away: string; homeGoals: number; awayGoals: number }
export const leagueClubIds = ['flamengo', 'palmeiras', 'santos', 'vasco', 'botafogo', 'fluminense', 'cruzeiro', 'atletico-mg', 'gremio', 'internacional', 'bahia', 'vitoria', 'athletico-pr', 'coritiba', 'red-bull-bragantino', 'mirassol', 'remo', 'chapecoense', 'corinthians', 'sao-paulo']
function roundRobin(ids: string[]): [string, string][][] {
  const rotation = [...ids]
  const firstTurn: [string, string][][] = []
  for (let round = 0; round < ids.length - 1; round++) {
    const pairs: [string, string][] = []
    for (let index = 0; index < ids.length / 2; index++) {
      const pair: [string, string] = [rotation[index], rotation[ids.length - 1 - index]]
      pairs.push(round % 2 ? [pair[1], pair[0]] : pair)
    }
    firstTurn.push(pairs)
    rotation.splice(1, 0, rotation.pop()!)
  }
  return [...firstTurn, ...firstTurn.map(pairs => pairs.map(([home, away]) => [away, home] as [string, string]))]
}
export const leagueRounds = roundRobin(leagueClubIds)
export const leagueDays = Array.from({ length: leagueRounds.length }, (_, index) => 9 + index * 3)
export const leagueEndDay = leagueDays[leagueDays.length - 1] + 1
export const leagueResultCount = leagueRounds.length * leagueRounds[0].length
export type SeasonArchive = { number: number; clubId: string; results: LeagueResult[]; matches: { day: number; match: Match }[]; gains: Record<string, number> }
export type Contract = { seasons: number; wage: number; value: number }
export type Finances = { budget: number; wageLimit: number }
export type TransferRecord = { season: number; playerId: string; kind: 'buy' | 'sell' | 'renew'; amount: number }
export type BoardStatus = 'secure' | 'stable' | 'pressure' | 'dismissed'
export type BoardReview = { round: number; delta: number; confidence: number; rank: number; result: 'win' | 'draw' | 'loss'; reason: string }
export type BoardState = { confidence: number; lastRound: number; status: BoardStatus; history: BoardReview[] }
export type PlayerAvailability = { injuredMatches: number; suspensionMatches: number; yellowCards: number }
