import { type Match, type Formation, type Preparation, positions, fixtureDays, leagueDays, leagueRounds, leagueEndDay, leagueResultCount, type LeagueResult, type SeasonArchive, type Contract, type Finances, type TransferRecord, type BoardState, type PlayerAvailability, type CupState, type CupResult } from './types'
import { clubs as realClubs, financesByClub, marketPlayers, playersByClub, type Player } from './realData'
import { createCupStateForDay, cupClubIds, cupDays, externalCupClubs } from './cupData'
export type CareerMode = 'coach' | 'player' | 'director'
export type Club = { id: string; name: string; initials: string; city: string; color: string; reputation: string; objective: string; description: string }
export type Career = { mode: 'coach'; name: string; clubId: string; formation: Formation; lineup?: string[]; roster?: string[]; contracts?: Record<string, Contract>; finances?: Finances; transfers?: TransferRecord[]; board?: BoardState; availability?: Record<string, PlayerAvailability>; day?: number; match?: Match; seasonVersion?: number; dataVersion?: number; preparation?: Preparation; history?: { day: number; match: Match }[]; leagueActive?: boolean; leagueResults?: LeagueResult[]; cup?: CupState; seasonNumber?: number; playerGrowth?: Record<string, number>; archives?: SeasonArchive[] }
export const modes: { id: CareerMode; title: string; subtitle: string; number: string; description: string; available: boolean }[] = [
  { id: 'coach', title: 'Treinador', subtitle: 'À beira do campo', number: '01', description: 'Dê identidade ao time. Escolha seu clube, organize o elenco e prepare sua estratégia.', available: true },
  { id: 'player', title: 'Jogador', subtitle: 'Dentro das quatro linhas', number: '02', description: 'Construa sua trajetória em campo. Treinos, evolução e escolhas que definem uma carreira.', available: false },
  { id: 'director', title: 'Dirigente', subtitle: 'Nos bastidores do clube', number: '03', description: 'Pense além da próxima partida. Mercado, estrutura e planejamento para o futuro do clube.', available: false },
]
export const clubs: Club[] = [...realClubs]
export const allClubs = [...clubs, ...externalCupClubs]
export const squad = playersByClub.flamengo
export { marketPlayers }
export const allPlayers: Player[] = Object.values(playersByClub).flat()
export function defaultRosterFor(clubId: string) { return (playersByClub[clubId] ?? squad).map(player => player.id) }
export function defaultLineupFor(clubId: string) { return defaultRosterFor(clubId).slice(0, 11) }
export const defaultLineup = defaultLineupFor('flamengo')
export const defaultRoster = defaultRosterFor('flamengo')
export const defaultFinances: Record<string, Finances> = financesByClub
export function defaultBoard(): BoardState { return { confidence: 70, lastRound: 0, status: 'secure', history: [] } }
export function defaultContracts(clubId = 'flamengo'): Record<string, Contract> { return Object.fromEntries((playersByClub[clubId] ?? squad).map(player => [player.id, { seasons: 2, wage: player.wage, value: player.value }])) }
export function rosterOf(career: Pick<Career, 'roster' | 'clubId'>) { return allPlayers.filter(player => (career.roster ?? defaultRosterFor(career.clubId)).includes(player.id)) }
export function lineupForRoster(roster: string[], clubId = 'flamengo') { const keeper = roster.find(id => allPlayers.find(player => player.id === id)?.position === 'GOL'); const field = roster.filter(id => allPlayers.find(player => player.id === id)?.position !== 'GOL').slice(0, 10); return keeper && field.length === 10 ? [keeper, ...field] : defaultLineupFor(clubId) }
export function createCareer(name: string, clubId: string): Career {
  const safeClubId = clubs.some(club => club.id === clubId) ? clubId : clubs[0].id
  const roster = defaultRosterFor(safeClubId)
  return { mode: 'coach', name: name.trim(), clubId: safeClubId, formation: '4-3-3', dataVersion: 3, roster, lineup: defaultLineupFor(safeClubId), contracts: defaultContracts(safeClubId), finances: { ...defaultFinances[safeClubId] } }
}
export function validLineup(value: unknown): value is string[] {
  return Array.isArray(value) && value.length === 11 && new Set(value).size === 11 && value.every(id => allPlayers.some(p => p.id === id)) && allPlayers.find(p => p.id === value[0])?.position === 'GOL' && value.slice(1).every(id => allPlayers.find(p => p.id === id)?.position !== 'GOL')
}
export function validLeagueResult(value: unknown): value is LeagueResult {
  if (!value || typeof value !== 'object') return false
  const r = value as LeagueResult
  return Number.isInteger(r.round) && r.round >= 1 && r.round <= leagueRounds.length && leagueRounds[r.round - 1].some(([home, away]) => home === r.home && away === r.away) && [r.homeGoals, r.awayGoals].every(n => Number.isInteger(n) && n >= 0 && n <= 9)
}
function validMatch(value: unknown): value is Match {
  if (!value || typeof value !== 'object') return false
  const m = value as Match
  const starting = m.startingLineup === undefined || validLineup(m.startingLineup)
  const substitutions = m.substitutions === undefined || (Array.isArray(m.substitutions) && m.substitutions.length <= 3 && m.substitutions.every(s => s && Number.isInteger(s.minute) && s.minute >= 0 && s.minute <= 80 && allPlayers.some(p => p.id === s.outId) && allPlayers.some(p => p.id === s.inId) && s.outId !== s.inId))
  const participants = new Set([...(m.startingLineup ?? m.lineup), ...(m.substitutions ?? []).map(s => s.inId)])
  const discipline = (m.disciplineRolls === undefined || (Array.isArray(m.disciplineRolls) && m.disciplineRolls.length === 6 && m.disciplineRolls.every(n => typeof n === 'number' && n >= 0 && n <= 1))) && (m.yellowCards === undefined || (Array.isArray(m.yellowCards) && m.yellowCards.length <= 2 && new Set(m.yellowCards).size === m.yellowCards.length && m.yellowCards.every(id => participants.has(id)))) && (m.injury === undefined || (participants.has(m.injury.playerId) && Number.isInteger(m.injury.matches) && m.injury.matches >= 1 && m.injury.matches <= 2)) && (m.disciplineFinalized === undefined || typeof m.disciplineFinalized === 'boolean')
  const otherResults = m.otherResults === undefined || (Array.isArray(m.otherResults) && m.otherResults.length <= leagueRounds[0].length - 1 && m.otherResults.every(validLeagueResult) && new Set(m.otherResults.map(result => `${result.round}:${result.home}`)).size === m.otherResults.length)
  return allClubs.some(c => c.id === m.opponent) && validLineup(m.lineup) && starting && substitutions && discipline && otherResults && (m.otherResult === undefined || validLeagueResult(m.otherResult)) && (m.mentality === undefined || ['defensive', 'balanced', 'attacking'].includes(m.mentality)) && (m.ratingsFinalized === undefined || typeof m.ratingsFinalized === 'boolean') && Object.hasOwn(positions, m.formation) && Number.isFinite(m.strength) && m.strength >= 0 && m.strength <= 100 && Number.isInteger(m.cursor) && m.cursor >= 0 && m.cursor <= 9 && Array.isArray(m.events) && m.events.length === 9 && m.events.every((e, i) => e && e.minute === (i + 1) * 10 && ['home', 'away'].includes(e.side) && typeof e.goal === 'boolean' && typeof e.text === 'string' && e.text.length < 250 && (e.playerId === undefined || participants.has(e.playerId)) && (e.assistPlayerId === undefined || participants.has(e.assistPlayerId)) && [e.sideRoll, e.goalRoll, e.playerRoll, e.assistRoll].every(n => n === undefined || (typeof n === 'number' && n >= 0 && n <= 1))) && Array.isArray(m.ratings) && m.ratings.length >= 11 && m.ratings.length <= 14 && m.ratings.every(r => r && typeof r === 'object') && new Set(m.ratings.map(r => r.playerId)).size === m.ratings.length && m.ratings.every(r => participants.has(r.playerId) && Number.isFinite(r.value) && r.value >= 1 && r.value <= 10)
}
function validCupResult(value: unknown): value is CupResult { if (!value || typeof value !== 'object') return false; const result = value as CupResult; return [5, 6, 7, 8, 9].includes(result.stage) && [1, 2].includes(result.leg) && cupClubIds.includes(result.home) && cupClubIds.includes(result.away) && result.home !== result.away && [result.homeGoals, result.awayGoals].every(goal => Number.isInteger(goal) && goal >= 0 && goal <= 9) && (result.penaltiesWinner === undefined || [result.home, result.away].includes(result.penaltiesWinner)) }
function validCup(value: unknown): value is CupState { if (!value || typeof value !== 'object') return false; const cup = value as CupState; return [5, 6, 7, 8, 9].includes(cup.stage) && typeof cup.eliminated === 'boolean' && Number.isInteger(cup.prize) && cup.prize >= 0 && cup.prize <= 27000 && Array.isArray(cup.ties) && cup.ties.length <= 16 && cup.ties.every(tie => tie && tie.stage === cup.stage && cupClubIds.includes(tie.home) && cupClubIds.includes(tie.away) && tie.home !== tie.away) && Array.isArray(cup.results) && cup.results.length <= 61 && cup.results.every(validCupResult) && (cup.champion === undefined || cupClubIds.includes(cup.champion)) }
function validArchive(value: unknown): value is SeasonArchive {
  if (!value || typeof value !== 'object') return false
  const a = value as SeasonArchive
  return Number.isSafeInteger(a.number) && a.number >= 1 && clubs.some(c => c.id === a.clubId) && Array.isArray(a.results) && a.results.length === leagueResultCount && a.results.every(validLeagueResult) && new Set(a.results.map(r => r.round + ':' + r.home)).size === leagueResultCount && Array.isArray(a.matches) && a.matches.length >= fixtureDays.length + leagueDays.length && a.matches.length <= fixtureDays.length + leagueDays.length + cupDays.length && a.matches.every(h => h && [...fixtureDays, ...leagueDays, ...cupDays].includes(h.day) && validMatch(h.match) && h.match.cursor === 9 && h.match.opponent !== a.clubId) && new Set(a.matches.map(h => h.day)).size === a.matches.length && (a.cup === undefined || validCup(a.cup)) && !!a.gains && typeof a.gains === 'object' && Object.keys(a.gains).length >= 11 && Object.entries(a.gains).every(([id, gain]) => allPlayers.some(p => p.id === id) && Number.isInteger(gain) && gain >= 0 && gain <= 2)
}
const key = 'vt27.career.v1'
const legacyClubs: Record<string, string> = { aurora: 'flamengo', porto: 'palmeiras', serra: 'corinthians', vale: 'sao-paulo' }
function migrateLegacy(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const previousClub = (value as { clubId?: unknown }).clubId
  if (typeof previousClub !== 'string' || !legacyClubs[previousClub]) return value
  const clubId = legacyClubs[previousClub]
  const roster = defaultRosterFor(clubId)
  const replacements: Record<string, string> = { ...legacyClubs }
  roster.forEach((id, index) => { replacements[`p${index + 1}`] = id })
  marketPlayers.forEach((marketPlayer, index) => { replacements[`m${index + 1}`] = marketPlayer.id })
  const map = (item: unknown): unknown => {
    if (typeof item === 'string') return replacements[item] ?? item
    if (Array.isArray(item)) return item.map(map)
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([entryKey, entryValue]) => [replacements[entryKey] ?? entryKey, map(entryValue)]))
    return item
  }
  return map(value)
}
export function loadCareer(): Career | null {
  try {
    let value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    value = migrateLegacy(value)
    if (!value || typeof value !== 'object') return null
    const c = value as Partial<Career>
    if (!(c.mode === 'coach' && typeof c.name === 'string' && c.name.trim().length > 0 && c.name.length <= 40 && clubs.some(club => club.id === c.clubId) && ['4-3-3', '4-4-2', '3-5-2'].includes(c.formation ?? '') )) return null
    const career = c as Career
    const upgradedCompetition = (c.dataVersion ?? 0) < 2 && c.leagueActive === true
    let match = !upgradedCompetition && validMatch(c.match) && c.match.opponent !== c.clubId ? c.match : undefined
    const active = !upgradedCompetition && c.leagueActive === true
    const requiredCalendar = active ? [...fixtureDays, ...leagueDays] : fixtureDays
    const calendar = active ? [...requiredCalendar, ...cupDays] : fixtureDays
    let day = !upgradedCompetition && Number.isInteger(c.day) && c.day! >= 1 && c.day! <= (active ? leagueEndDay : 8) ? c.day! : 1
    let history = !upgradedCompetition && Array.isArray(c.history) ? c.history.filter(h => h && calendar.includes(h.day) && h.day < day && validMatch(h.match) && h.match.cursor === 9 && h.match.opponent !== c.clubId).filter((h, i, all) => all.findIndex(item => item.day === h.day) === i) : []
    if (c.seasonVersion !== 3 && day === 2 && match?.cursor === 9) { history = [{ day: 1, match }]; match = undefined }
    if (!calendar.includes(day)) match = undefined
    // Recover incomplete calendar saves at their first missing fixture.
    const missing = requiredCalendar.find(d => d < day && !history.some(h => h.day === d))
    if (missing !== undefined) { day = missing; match = undefined; history = history.filter(h => h.day < day) }
    const bounded = (n: unknown, max: number) => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0
    const archives = Array.isArray(c.archives) ? c.archives.filter(validArchive).filter((a, i, all) => all.findIndex(item => item.number === a.number) === i).sort((a, b) => a.number - b.number) : []
    const seasonNumber = Math.max(1, Number.isSafeInteger(c.seasonNumber) && c.seasonNumber! > 0 ? c.seasonNumber! : 1, ...archives.map(a => a.number + 1))
    const clubRoster = defaultRosterFor(career.clubId)
    const roster = Array.isArray(c.roster) ? c.roster.filter((id, i, ids) => typeof id === 'string' && allPlayers.some(p => p.id === id) && ids.indexOf(id) === i) : clubRoster
    const safeRoster = roster.length >= 16 && roster.length <= 23 && roster.some(id => allPlayers.find(p => p.id === id)?.position === 'GOL') ? roster : clubRoster
    const contracts = Object.fromEntries(safeRoster.map(id => { const player = allPlayers.find(p => p.id === id)!; const raw = c.contracts?.[id]; return [id, { seasons: Number.isInteger(raw?.seasons) && raw!.seasons >= 1 && raw!.seasons <= 5 ? raw!.seasons : 2, wage: Number.isFinite(raw?.wage) && raw!.wage > 0 ? Math.round(raw!.wage) : player.wage, value: Number.isFinite(raw?.value) && raw!.value > 0 ? Math.round(raw!.value) : player.value }] }))
    const baseFinance = defaultFinances[career.clubId]
    const finances = { budget: typeof c.finances?.budget === 'number' && Number.isFinite(c.finances.budget) ? Math.round(bounded(c.finances.budget, 100000)) : baseFinance.budget, wageLimit: typeof c.finances?.wageLimit === 'number' && Number.isFinite(c.finances.wageLimit) ? Math.max(500, Math.round(bounded(c.finances.wageLimit, 5000))) : baseFinance.wageLimit }
    const transfers = Array.isArray(c.transfers) ? c.transfers.filter(t => t && Number.isInteger(t.season) && t.season >= 1 && allPlayers.some(p => p.id === t.playerId) && ['buy', 'sell', 'renew'].includes(t.kind) && Number.isFinite(t.amount) && t.amount >= 0).slice(-100) : []
    const rawBoard = c.board
    const boardHistory = Array.isArray(rawBoard?.history) ? rawBoard.history.filter(review => review && Number.isInteger(review.round) && review.round >= 1 && review.round <= leagueRounds.length && Number.isInteger(review.delta) && review.delta >= -30 && review.delta <= 20 && Number.isInteger(review.confidence) && review.confidence >= 0 && review.confidence <= 100 && Number.isInteger(review.rank) && review.rank >= 1 && review.rank <= clubs.length && ['win', 'draw', 'loss'].includes(review.result) && typeof review.reason === 'string' && review.reason.length <= 180).filter((review, index, reviews) => reviews.findIndex(item => item.round === review.round) === index).sort((a, b) => a.round - b.round) : []
    const board: BoardState = !upgradedCompetition && rawBoard && Number.isInteger(rawBoard.confidence) && rawBoard.confidence >= 0 && rawBoard.confidence <= 100 && Number.isInteger(rawBoard.lastRound) && rawBoard.lastRound >= 0 && rawBoard.lastRound <= leagueRounds.length && ['secure', 'stable', 'pressure', 'dismissed'].includes(rawBoard.status) ? { confidence: rawBoard.confidence, lastRound: rawBoard.lastRound, status: rawBoard.status, history: boardHistory.filter(review => review.round <= rawBoard.lastRound) } : defaultBoard()
    const availability = Object.fromEntries(safeRoster.map(id => { const raw = c.availability?.[id]; return [id, { injuredMatches: Number.isInteger(raw?.injuredMatches) && raw!.injuredMatches >= 0 && raw!.injuredMatches <= 2 ? raw!.injuredMatches : 0, suspensionMatches: Number.isInteger(raw?.suspensionMatches) && raw!.suspensionMatches >= 0 && raw!.suspensionMatches <= 1 ? raw!.suspensionMatches : 0, yellowCards: Number.isInteger(raw?.yellowCards) && raw!.yellowCards >= 0 && raw!.yellowCards <= 2 ? raw!.yellowCards : 0 }] }))
    const playerGrowth = Object.fromEntries(allPlayers.map(p => [p.id, Math.floor(bounded(c.playerGrowth?.[p.id], 10))]))
    const prep = c.preparation
    const energy = Object.fromEntries(safeRoster.map(id => [id, typeof prep?.energy?.[id] === 'number' ? bounded(prep.energy[id], 100) : 100]))
    const sessions = Array.isArray(prep?.sessions) ? prep.sessions.filter(s => s && (Number.isInteger(s.day) && s.day >= 2 && s.day < leagueEndDay && !calendar.includes(s.day)) && s.day <= day && ['physical', 'technical', 'tactical', 'recovery'].includes(s.kind)).filter((s, i, all) => all.findIndex(item => item.day === s.day) === i) : []
    const lineup = validLineup(c.lineup) && c.lineup.every(id => safeRoster.includes(id)) ? c.lineup : lineupForRoster(safeRoster, career.clubId)
    const cup = active ? validCup(c.cup) ? c.cup : createCupStateForDay(seasonNumber, day, career.clubId) : undefined
    return { ...career, dataVersion: 3, roster: safeRoster, contracts, finances, transfers, board, availability, seasonNumber, playerGrowth, archives, seasonVersion: 3, lineup, day, match, history, leagueActive: active, leagueResults: active && Array.isArray(c.leagueResults) ? c.leagueResults.filter(r => validLeagueResult(r) && (leagueDays[r.round - 1] < day || (leagueDays[r.round - 1] === day && match?.cursor === 9))).filter((r, i, all) => all.findIndex(item => item.round === r.round && item.home === r.home) === i) : [], cup, preparation: { energy, skill: bounded(prep?.skill, 3), fitness: bounded(prep?.fitness, 3), cohesion: bounded(prep?.cohesion, 6), sessions } }
  } catch { return null }
}
export function saveCareer(career: Career): boolean {
  try { localStorage.setItem(key, JSON.stringify(career)); return true } catch { return false }
}
