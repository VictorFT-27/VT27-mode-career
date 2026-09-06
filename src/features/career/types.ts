export type Mentality = 'defensive' | 'balanced' | 'attacking'
export type MatchEvent = { minute: number; side: 'home' | 'away'; goal: boolean; text: string; playerId?: string; sideRoll?: number; goalRoll?: number; playerRoll?: number }
export type Substitution = { minute: number; outId: string; inId: string }
export type Match = { opponent: string; lineup: string[]; startingLineup?: string[]; formation: string; events: MatchEvent[]; cursor: number; ratings: { playerId: string; value: number }[]; strength: number; otherResult?: LeagueResult; mentality?: Mentality; substitutions?: Substitution[]; ratingsFinalized?: boolean; disciplineRolls?: number[]; yellowCards?: string[]; injury?: { playerId: string; matches: number }; disciplineFinalized?: boolean }
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
export const leagueRounds = [
  [['flamengo', 'sao-paulo'], ['palmeiras', 'corinthians']],
  [['corinthians', 'flamengo'], ['sao-paulo', 'palmeiras']],
  [['flamengo', 'palmeiras'], ['corinthians', 'sao-paulo']],
  [['sao-paulo', 'flamengo'], ['corinthians', 'palmeiras']],
  [['flamengo', 'corinthians'], ['palmeiras', 'sao-paulo']],
  [['palmeiras', 'flamengo'], ['sao-paulo', 'corinthians']],
]
export const leagueDays = [9, 12, 15, 18, 21, 24]
export type SeasonArchive = { number: number; clubId: string; results: LeagueResult[]; matches: { day: number; match: Match }[]; gains: Record<string, number> }
export type Contract = { seasons: number; wage: number; value: number }
export type Finances = { budget: number; wageLimit: number }
export type TransferRecord = { season: number; playerId: string; kind: 'buy' | 'sell' | 'renew'; amount: number }
export type BoardStatus = 'secure' | 'stable' | 'pressure' | 'dismissed'
export type BoardReview = { round: number; delta: number; confidence: number; rank: number; result: 'win' | 'draw' | 'loss'; reason: string }
export type BoardState = { confidence: number; lastRound: number; status: BoardStatus; history: BoardReview[] }
export type PlayerAvailability = { injuredMatches: number; suspensionMatches: number; yellowCards: number }
