import { allPlayers, defaultFinances, lineupForRoster, type Career } from './model'
import { clubs } from './realData'
import { worldOf } from './world'
import { emptyEmployment, reviewEmployment, validEmploymentTerms, type EmploymentDeal, type EmploymentState, type EmploymentTerms } from './employment'
import type { PlayerCareer } from '../player/playerModel'
import { advanceDirectorCycle, coachCandidates, createDirectorCareer, directorPayroll, type DirectorCareer } from '../director/directorModel'

export type MarketCareer = (Career | PlayerCareer | DirectorCareer) & { employment?: EmploymentState }
export function employmentOf(career: MarketCareer) { return career.employment ?? emptyEmployment() }
export function refreshEmployment<T extends MarketCareer>(career: T): T {
  const season = career.mode === 'coach' ? career.seasonNumber ?? 1 : career.season
  const progress = career.mode === 'coach' ? career.day ?? 1 : career.mode === 'player' ? career.round : career.cycle
  const interval = career.mode === 'director' ? 3 : 6
  if (!progress || progress % interval !== 0) return career
  const stamp = `${season}:${progress}`, state = employmentOf(career)
  if (state.lastInterest === stamp) return career
  const destinations = clubs.filter(club => club.id !== career.clubId)
  const destination = destinations[(season + progress + career.name.length) % destinations.length].id
  const next = openEmployment(career, 'self', destination)
  return { ...next, employment: { ...employmentOf(next), lastInterest: stamp } }
}
export function ownEmployment(career: MarketCareer): EmploymentTerms {
  return employmentOf(career).contracts.self ?? { fee: 0, wage: career.mode === 'player' ? career.contract.wage : career.mode === 'director' ? 90 : 150, seasons: career.mode === 'player' ? career.contract.seasons : 2, releaseClause: career.mode === 'player' ? career.contract.wage * 60 : career.mode === 'director' ? 900 : 1800 }
}
export type Professional = { id: string; name: string; kind: EmploymentDeal['kind']; clubId: string; terms: EmploymentTerms }
export function marketProfessionals(career: MarketCareer): Professional[] {
  const state = employmentOf(career)
  if (career.mode === 'player') return []
  const roster = career.mode === 'coach' ? career.roster ?? [] : career.squad
  const players: Professional[] = allPlayers.filter(player => player.clubId || state.locations[player.id]).map(player => {
    const clubId = career.mode === 'coach' ? worldOf(career).playerClubs[player.id] ?? player.clubId! : state.locations[player.id] ?? (roster.includes(player.id) ? career.clubId : player.clubId!)
    return { id: player.id, name: player.name, kind: 'player', clubId, terms: state.contracts[player.id] ?? { fee: player.value, wage: player.wage, seasons: 3, releaseClause: Math.round(player.value * 1.6) } }
  })
  const coaches: Professional[] = career.mode === 'director' ? coachCandidates.map((coach, index) => ({ id: coach.id, name: coach.name, kind: 'coach', clubId: state.locations[coach.id] ?? (career.coach.id === coach.id ? career.clubId : clubs.filter(club => club.id !== career.clubId)[index].id), terms: state.contracts[coach.id] ?? { fee: coach.salary * 2, wage: coach.salary, seasons: 2, releaseClause: coach.salary * 6 } })) : []
  return [...players, ...coaches]
}
export function openEmployment<T extends MarketCareer>(career: T, subjectId: string, to: string): T {
  if (!clubs.some(club => club.id === to)) return career
  const state = employmentOf(career)
  if (state.deals.some(deal => deal.subjectId === subjectId && !['signed', 'withdrawn'].includes(deal.status))) return career
  const subject: Professional | undefined = subjectId === 'self' ? { id: 'self', name: career.name, kind: career.mode === 'coach' ? 'coach' : career.mode, clubId: career.clubId, terms: ownEmployment(career) } : marketProfessionals(career).find(person => person.id === subjectId)
  if (!subject || subject.clubId === to || (subjectId !== 'self' && subject.clubId !== career.clubId && to !== career.clubId)) return career
  const asking = { ...subject.terms, fee: subjectId === 'self' ? subject.terms.releaseClause : subject.terms.fee, wage: Math.round(subject.terms.wage * 1.1) }
  const deal: EmploymentDeal = { id: `employment-${state.sequence + 1}`, subjectId, name: subject.name, kind: subject.kind, from: subject.clubId, to, currentClause: subject.terms.releaseClause, asking, terms: { ...asking }, status: 'draft', round: 0, note: 'Conversa aberta. Valores em R$ mil; salários mensais. Negocie a compensação e os termos pessoais.' }
  return { ...career, employment: { ...state, sequence: state.sequence + 1, deals: [...state.deals, deal] } }
}
export function offerEmployment<T extends MarketCareer>(career: T, id: string, terms: EmploymentTerms): T {
  const state = employmentOf(career)
  return { ...career, employment: { ...state, deals: state.deals.map(deal => deal.id === id ? reviewEmployment(deal, terms) : deal) } }
}
export function withdrawEmployment<T extends MarketCareer>(career: T, id: string): T {
  const state = employmentOf(career)
  return { ...career, employment: { ...state, deals: state.deals.map(deal => deal.id === id && deal.status !== 'signed' ? { ...deal, status: 'withdrawn', note: 'Conversa encerrada.' } : deal) } }
}
function cupAtClub<T extends { cup?: Career['cup'] }>(career: T, clubId: string) {
  if (!career.cup) return undefined
  return { ...career.cup, eliminated: career.cup.champion ? career.cup.champion !== clubId : !career.cup.ties.some(tie => tie.home === clubId || tie.away === clubId) }
}
export function signEmployment<T extends MarketCareer>(career: T, id: string): T {
  const state = employmentOf(career), deal = state.deals.find(item => item.id === id)
  if (!deal || deal.status !== 'accepted' || !validEmploymentTerms(deal.terms)) return career
  const refuse = (note: string): T => ({ ...career, employment: { ...state, deals: state.deals.map(item => item.id === id ? { ...item, note } : item) } })
  if (career.mode === 'coach' && career.match) return refuse('Avance o calendário após a partida antes de assinar. O jogo atual precisa ser arquivado.')
  const subject = deal.subjectId === 'self' ? { clubId: career.clubId } : marketProfessionals(career).find(item => item.id === deal.subjectId)
  if (!subject || subject.clubId !== deal.from) return refuse('O vínculo mudou. Abra uma nova negociação.')
  let next: MarketCareer = career
  if (deal.subjectId === 'self') {
    if (deal.to === career.clubId) return career
    if (deal.terms.fee > defaultFinances[deal.to].budget) return refuse('O clube de destino não consegue pagar esta compensação.')
    if (career.mode === 'player') next = { ...career, clubId: deal.to, contract: { clubId: deal.to, seasons: deal.terms.seasons, wage: deal.terms.wage }, cup: cupAtClub(career, deal.to)!, trust: 42, trainingCompleted: false }
    if (career.mode === 'director') {
      let destination = career.clubProjects?.[deal.to] ?? createDirectorCareer(career.name, deal.to)
      if (destination.season !== career.season) destination = { ...destination, season: career.season, cycle: 0, points: 0, seasonComplete: false }
      while (destination.cycle < career.cycle && destination.boardConfidence > 10) destination = advanceDirectorCycle(destination)
      const { clubProjects, employment: oldEmployment, ...origin } = career as DirectorCareer
      void oldEmployment
      next = { ...destination, reputation: career.reputation, seasons: career.seasons, budget: destination.budget - deal.terms.fee, clubProjects: { ...clubProjects, [career.clubId]: origin } }
    }
    if (career.mode === 'coach') {
      const world = worldOf(career), roster = allPlayers.filter(player => world.playerClubs[player.id] === deal.to).map(player => player.id)
      if (roster.length < 16 || !roster.some(id => allPlayers.find(player => player.id === id)?.position === 'GOL')) return refuse('O elenco de destino precisa estar regularizado antes da contratação.')
      next = { ...career, history: career.history?.map(item => ({ ...item, clubId: item.clubId ?? career.clubId })), clubId: deal.to, roster, lineup: lineupForRoster(roster, deal.to), contracts: Object.fromEntries(roster.map(id => { const player = allPlayers.find(item => item.id === id)!; return [id, { seasons: 2, wage: player.wage, value: player.value }] })), finances: { ...defaultFinances[deal.to], budget: defaultFinances[deal.to].budget - deal.terms.fee }, cup: cupAtClub(career, deal.to), board: undefined, transferDesk: undefined, lastManagerMove: { season: career.seasonNumber ?? 1, fromClubId: career.clubId, toClubId: deal.to }, world: { ...world, managerOffers: [] } }
    }
  } else if (career.mode === 'director' && deal.kind === 'coach') {
    const coach = coachCandidates.find(item => item.id === deal.subjectId)!
    const compensation = state.contracts[career.coach.id]?.releaseClause ?? career.coach.salary * 6
    const cost = compensation + deal.terms.fee
    if (career.budget < cost || directorPayroll(career) - career.coach.salary + deal.terms.wage > career.wageLimit) return refuse('Saldo ou folha insuficiente, incluindo a rescisão do técnico atual.')
    next = { ...career, coach: { ...coach, salary: deal.terms.wage }, coachConfidence: 65, budget: career.budget - cost, expenses: career.expenses + cost }
  } else if (deal.kind === 'player' && career.mode !== 'player') {
    const incoming = deal.to === career.clubId, roster = career.mode === 'coach' ? career.roster ?? [] : career.squad
    const player = allPlayers.find(item => item.id === deal.subjectId)!
    const budget = career.mode === 'coach' ? career.finances?.budget ?? defaultFinances[career.clubId].budget : career.budget
    const limit = career.mode === 'coach' ? career.finances?.wageLimit ?? defaultFinances[career.clubId].wageLimit : career.wageLimit
    const payroll = roster.reduce((sum, id) => sum + (career.mode === 'coach' ? career.contracts?.[id]?.wage ?? allPlayers.find(item => item.id === id)?.wage ?? 0 : state.contracts[id]?.wage ?? allPlayers.find(item => item.id === id)?.wage ?? 0), 0) + (career.mode === 'director' ? career.coach.salary : 0)
    if (incoming && (roster.length >= 23 || budget < deal.terms.fee || payroll + deal.terms.wage > limit)) return refuse('Orçamento, folha ou tamanho do elenco impedem a assinatura.')
    if (!incoming && (roster.length <= 16 || (career.mode === 'coach' && career.lineup?.includes(player.id)) || (player.position === 'GOL' && roster.filter(id => allPlayers.find(item => item.id === id)?.position === 'GOL').length <= 1))) return refuse('Mantenha 16 atletas, um goleiro e retire o jogador da escalação antes de vender.')
    const squad = incoming ? [...roster, player.id] : roster.filter(id => id !== player.id), balance = budget + (incoming ? -deal.terms.fee : deal.terms.fee)
    if (career.mode === 'director') next = { ...career, squad, budget: balance, expenses: career.expenses + (incoming ? deal.terms.fee : 0), revenue: career.revenue + (incoming ? 0 : deal.terms.fee) }
    else {
      const world = worldOf(career), contracts = { ...career.contracts }
      if (incoming) contracts[player.id] = { seasons: deal.terms.seasons, wage: deal.terms.wage, value: player.value }; else delete contracts[player.id]
      next = { ...career, roster: squad, contracts, finances: { budget: balance, wageLimit: limit }, world: { ...world, playerClubs: { ...world.playerClubs, [player.id]: deal.to }, transfers: [...world.transfers, { season: career.seasonNumber ?? 1, playerId: player.id, fromClubId: deal.from, toClubId: deal.to, amount: deal.terms.fee }] } }
    }
  } else return career
  return { ...next, employment: { ...state, contracts: { ...state.contracts, [deal.subjectId]: deal.terms }, locations: { ...state.locations, [deal.subjectId]: deal.to }, deals: state.deals.map(item => item.id === id ? { ...item, status: 'signed', note: 'Contrato assinado. Mudança registrada imediatamente.' } : item) } } as T
}
