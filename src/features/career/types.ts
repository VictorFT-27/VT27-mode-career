export type MatchEvent = { minute: number; side: 'home' | 'away'; goal: boolean; text: string; playerId?: string }
export type Match = { opponent: string; lineup: string[]; formation: string; events: MatchEvent[]; cursor: number; ratings: { playerId: string; value: number }[]; strength: number }
export type Formation = '4-3-3' | '4-4-2' | '3-5-2'
export const positions: Record<Formation, string[]> = {
  '4-3-3': ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'MC', 'MC', 'PD', 'ATA', 'PE'],
  '4-4-2': ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'MD', 'MC', 'MC', 'ME', 'ATA', 'ATA'],
  '3-5-2': ['GOL', 'ZAG', 'ZAG', 'ZAG', 'MD', 'VOL', 'MC', 'MC', 'ME', 'ATA', 'ATA'],
}
export type TrainingKind = 'physical' | 'technical' | 'tactical' | 'recovery'
export type Preparation = { energy: Record<string, number>; skill: number; fitness: number; cohesion: number; sessions: { day: number; kind: TrainingKind }[] }
export const fixtureDays = [1, 4, 7]
