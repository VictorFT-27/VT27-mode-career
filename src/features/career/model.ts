import { type Match, type Formation, type Preparation, positions, fixtureDays, leagueDays, leagueRounds, type LeagueResult } from './types'
export type CareerMode = 'coach' | 'player' | 'director'
export type Club = { id: string; name: string; initials: string; city: string; color: string; reputation: string; objective: string; description: string }
export type Career = { mode: 'coach'; name: string; clubId: string; formation: Formation; lineup?: string[]; day?: number; match?: Match; seasonVersion?: number; preparation?: Preparation; history?: { day: number; match: Match }[]; leagueActive?: boolean; leagueResults?: LeagueResult[] }
export const modes: { id: CareerMode; title: string; subtitle: string; number: string; description: string; available: boolean }[] = [
  { id: 'coach', title: 'Treinador', subtitle: 'À beira do campo', number: '01', description: 'Dê identidade ao time. Escolha seu clube, organize o elenco e prepare sua estratégia.', available: true },
  { id: 'player', title: 'Jogador', subtitle: 'Dentro das quatro linhas', number: '02', description: 'Construa sua trajetória em campo. Treinos, evolução e escolhas que definem uma carreira.', available: false },
  { id: 'director', title: 'Dirigente', subtitle: 'Nos bastidores do clube', number: '03', description: 'Pense além da próxima partida. Mercado, estrutura e planejamento para o futuro do clube.', available: false },
]
export const clubs: Club[] = [
  { id: 'aurora', name: 'Aurora FC', initials: 'AFC', city: 'Belo Horizonte · MG', color: '#b7ec57', reputation: 'Projeto em ascensão', objective: 'Construir uma equipe competitiva', description: 'Um elenco jovem e espaço para colocar suas ideias em prática.' },
  { id: 'porto', name: 'Porto Azul', initials: 'PA', city: 'Santos · SP', color: '#68c3ff', reputation: 'Tradição e cobrança', objective: 'Brigar pelas primeiras posições', description: 'Um clube ambicioso que espera um treinador à altura da sua história.' },
  { id: 'serra', name: 'União da Serra', initials: 'US', city: 'Caxias do Sul · RS', color: '#f4af77', reputation: 'Desafio de reconstrução', objective: 'Desenvolver o elenco', description: 'Uma torcida próxima e a oportunidade de iniciar um novo ciclo.' },
  { id: 'vale', name: 'Atlético do Vale', initials: 'ADV', city: 'Curitiba · PR', color: '#d89bf9', reputation: 'Ambição regional', objective: 'Terminar entre os dois primeiros', description: 'Um novo rival na disputa por espaço no futebol nacional.' },
]
const initialPlayers = [
  { name: 'Rafael Costa', position: 'GOL', age: 28, rating: 72 },
  { name: 'Caio Mendes', position: 'LD', age: 23, rating: 68 },
  { name: 'Lucas Rocha', position: 'ZAG', age: 29, rating: 73 },
  { name: 'Bruno Alves', position: 'ZAG', age: 25, rating: 70 },
  { name: 'Pedro Lima', position: 'LE', age: 21, rating: 69 },
  { name: 'André Santos', position: 'VOL', age: 27, rating: 72 },
  { name: 'Diego Martins', position: 'MC', age: 24, rating: 71 },
  { name: 'Gabriel Reis', position: 'MC', age: 22, rating: 74 },
  { name: 'João Vitor', position: 'PD', age: 20, rating: 70 },
  { name: 'Matheus Silva', position: 'ATA', age: 26, rating: 75 },
  { name: 'Felipe Nunes', position: 'PE', age: 23, rating: 71 },
]
export const squad = [...initialPlayers,
  { name: 'Henrique Melo', position: 'GOL', age: 22, rating: 67 },
  { name: 'Davi Teixeira', position: 'ZAG', age: 24, rating: 69 },
  { name: 'Arthur Dias', position: 'LD', age: 20, rating: 66 },
  { name: 'Vinícius Gomes', position: 'VOL', age: 26, rating: 70 },
  { name: 'Samuel Moraes', position: 'MC', age: 21, rating: 68 },
  { name: 'Eduardo Freitas', position: 'ATA', age: 24, rating: 72 },
  { name: 'Leonardo Castro', position: 'PE', age: 19, rating: 67 },
].map((player, i) => ({ ...player, id: `p${i + 1}` }))
export const defaultLineup = squad.slice(0, 11).map(player => player.id)
export function validLineup(value: unknown): value is string[] {
  return Array.isArray(value) && value.length === 11 && new Set(value).size === 11 && value.every(id => squad.some(p => p.id === id)) && squad.find(p => p.id === value[0])?.position === 'GOL' && value.slice(1).every(id => squad.find(p => p.id === id)?.position !== 'GOL')
}
export function validLeagueResult(value: unknown): value is LeagueResult {
  if (!value || typeof value !== 'object') return false
  const r = value as LeagueResult
  return Number.isInteger(r.round) && r.round >= 1 && r.round <= 6 && leagueRounds[r.round - 1].some(([home, away]) => home === r.home && away === r.away) && [r.homeGoals, r.awayGoals].every(n => Number.isInteger(n) && n >= 0 && n <= 9)
}
function validMatch(value: unknown): value is Match {
  if (!value || typeof value !== 'object') return false
  const m = value as Match
  return clubs.some(c => c.id === m.opponent) && validLineup(m.lineup) && Object.hasOwn(positions, m.formation) && Number.isFinite(m.strength) && m.strength >= 0 && m.strength <= 100 && Number.isInteger(m.cursor) && m.cursor >= 0 && m.cursor <= 9 && Array.isArray(m.events) && m.events.length === 9 && m.events.every((e, i) => e && e.minute === (i + 1) * 10 && ['home', 'away'].includes(e.side) && typeof e.goal === 'boolean' && typeof e.text === 'string' && e.text.length < 250 && (e.playerId === undefined || m.lineup.includes(e.playerId))) && Array.isArray(m.ratings) && m.ratings.length === 11 && m.ratings.every(r => r && typeof r === 'object') && new Set(m.ratings.map(r => r.playerId)).size === 11 && m.ratings.every(r => m.lineup.includes(r.playerId) && Number.isFinite(r.value) && r.value >= 1 && r.value <= 10)
}
const key = 'vt27.career.v1'
export function loadCareer(): Career | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!value || typeof value !== 'object') return null
    const c = value as Partial<Career>
    if (!(c.mode === 'coach' && typeof c.name === 'string' && c.name.trim().length > 0 && c.name.length <= 40 && clubs.some(club => club.id === c.clubId) && ['4-3-3', '4-4-2', '3-5-2'].includes(c.formation ?? '') )) return null
    const career = c as Career
    let match = validMatch(c.match) && c.match.opponent !== c.clubId ? c.match : undefined
    const active = c.leagueActive === true
    const calendar = active ? [...fixtureDays, ...leagueDays] : fixtureDays
    let day = Number.isInteger(c.day) && c.day! >= 1 && c.day! <= (active ? 25 : 8) ? c.day! : 1
    let history = Array.isArray(c.history) ? c.history.filter(h => h && calendar.includes(h.day) && h.day < day && validMatch(h.match) && h.match.cursor === 9 && h.match.opponent !== c.clubId).filter((h, i, all) => all.findIndex(item => item.day === h.day) === i) : []
    if (c.seasonVersion !== 3 && day === 2 && match?.cursor === 9) { history = [{ day: 1, match }]; match = undefined }
    if (!calendar.includes(day)) match = undefined
    // Recover incomplete calendar saves at their first missing fixture.
    const missing = calendar.find(d => d < day && !history.some(h => h.day === d))
    if (missing !== undefined) { day = missing; match = undefined; history = history.filter(h => h.day < day) }
    const bounded = (n: unknown, max: number) => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0
    const prep = c.preparation
    const energy = Object.fromEntries(squad.map(p => [p.id, typeof prep?.energy?.[p.id] === 'number' ? bounded(prep.energy[p.id], 100) : 100]))
    const sessions = Array.isArray(prep?.sessions) ? prep.sessions.filter(s => s && (Number.isInteger(s.day) && s.day >= 2 && s.day <= 23 && !calendar.includes(s.day)) && s.day <= day && ['physical', 'technical', 'tactical', 'recovery'].includes(s.kind)).filter((s, i, all) => all.findIndex(item => item.day === s.day) === i) : []
    return { ...career, seasonVersion: 3, lineup: validLineup(c.lineup) ? c.lineup : [...defaultLineup], day, match, history, leagueActive: active, leagueResults: active && Array.isArray(c.leagueResults) ? c.leagueResults.filter(r => validLeagueResult(r) && (leagueDays[r.round - 1] < day || (leagueDays[r.round - 1] === day && match?.cursor === 9))).filter((r, i, all) => all.findIndex(item => item.round === r.round && item.home === r.home) === i) : [], preparation: { energy, skill: bounded(prep?.skill, 3), fitness: bounded(prep?.fitness, 3), cohesion: bounded(prep?.cohesion, 6), sessions } }
  } catch { return null }
}
export function saveCareer(career: Career): boolean {
  try { localStorage.setItem(key, JSON.stringify(career)); return true } catch { return false }
}
