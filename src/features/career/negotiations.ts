import { allPlayers, clubs, defaultLineupFor, type Career } from './model'
import type { DealType, Negotiation, NegotiationTerms, TransferDesk } from './types'
import { clubOf, worldOf } from './world'
import { contractsOf, financesOf, wageUsed } from './transfers'
import { knowledgeOf } from './scouting'

export function deskOf(career: Career): TransferDesk { return career.transferDesk ?? { negotiations: [], listed: [] } }
export function defaultTerms(career: Career, playerId: string, kind: DealType): NegotiationTerms {
  const player = allPlayers.find(item => item.id === playerId)!; const value = contractsOf(career)[playerId]?.value ?? player.value
  return kind === 'loan' ? { fee: Math.round(value * .08), installments: 1, performanceBonus: 0, sellOnPercent: 0, loanSeasons: 1, wageShare: 60, purchaseOption: value } : { fee: kind === 'sale' ? Math.round(value * .85) : Math.round(value * .9), installments: 1, performanceBonus: 0, sellOnPercent: 0, wage: player.wage, contractSeasons: 3, signingBonus: Math.round(player.value * .05), squadRole: 'rotation' }
}
export function startNegotiation(career: Career, playerId: string, kind: DealType, terms = defaultTerms(career, playerId, kind)): Career {
  const player = allPlayers.find(item => item.id === playerId); const desk = deskOf(career); const outgoing = kind === 'sale' || desk.listed.some(item => item.playerId === playerId && item.kind === 'loan'); const from = outgoing ? career.clubId : clubOf(career, playerId)
  if (!player || !from || (!outgoing && (from === career.clubId || knowledgeOf(career, playerId) < 3)) || (career.match && career.match.cursor < 9) || desk.negotiations.some(item => item.playerId === playerId && !['completed', 'rejected', 'withdrawn'].includes(item.status))) return career
  const targetClub = outgoing ? clubs[(clubs.findIndex(item => item.id === career.clubId) + player.id.length) % clubs.length].id : career.clubId
  const negotiation: Negotiation = { id: `${career.seasonNumber ?? 1}-${career.day ?? 1}-${playerId}-${kind}`, playerId, kind, fromClubId: from, toClubId: targetClub, status: 'draft', round: 0, terms, note: 'Condições preparadas. Revise antes de enviar.', season: career.seasonNumber ?? 1 }
  return { ...career, dataVersion: 7, transferDesk: { ...desk, negotiations: [...desk.negotiations, negotiation].slice(-30) } }
}
function update(career: Career, id: string, change: (deal: Negotiation) => Negotiation) { const desk = deskOf(career); return { ...career, transferDesk: { ...desk, negotiations: desk.negotiations.map(deal => deal.id === id ? change(deal) : deal) } } }
export function changeTerms(career: Career, id: string, terms: NegotiationTerms) { return update(career, id, deal => deal.status === 'draft' || deal.status === 'countered' || deal.status === 'personal-terms' ? { ...deal, terms } : deal) }
export function submitClubOffer(career: Career, id: string): Career {
  return update(career, id, deal => {
    if (!['draft', 'countered'].includes(deal.status)) return deal
    const player = allPlayers.find(item => item.id === deal.playerId)!; const base = contractsOf(career)[deal.playerId]?.value ?? player.value
    const packageValue = deal.terms.fee + deal.terms.performanceBonus * .55 + base * deal.terms.sellOnPercent / 100 * .25
    if (deal.kind === 'sale') return { ...deal, status: 'club-accepted', round: deal.round + 1, note: `${clubs.find(item => item.id === deal.toClubId)?.name} formalizou a oferta.` }
    const acceptable = deal.kind === 'loan' ? deal.terms.fee >= base * .06 && (deal.terms.wageShare ?? 0) >= 50 : packageValue >= base * .92
    if (acceptable) return { ...deal, status: 'club-accepted', round: deal.round + 1, note: 'O clube aceitou a estrutura. Agora negocie com o atleta.' }
    if (deal.round >= 2 || packageValue < base * .55) return { ...deal, status: 'rejected', round: deal.round + 1, note: 'O clube encerrou as conversas após considerar a proposta insuficiente.' }
    const counterTerms = { ...deal.terms, fee: Math.round(base * (deal.kind === 'loan' ? .1 : 1.03)), wageShare: deal.kind === 'loan' ? 70 : deal.terms.wageShare }
    return { ...deal, status: 'countered', round: deal.round + 1, counterTerms, note: `Contraproposta recebida: taxa de ${counterTerms.fee}.` }
  })
}
export function acceptCounter(career: Career, id: string) { return update(career, id, deal => deal.status === 'countered' && deal.counterTerms ? { ...deal, terms: deal.counterTerms, status: 'club-accepted', note: 'Contraproposta aceita. Avance aos termos pessoais.' } : deal) }
export function openPersonalTerms(career: Career, id: string) { return update(career, id, deal => deal.status === 'club-accepted' ? { ...deal, status: 'personal-terms', note: deal.kind === 'sale' ? 'Oferta pronta para a decisão final.' : 'Negocie salário, duração e papel no elenco.' } : deal) }
export function withdrawNegotiation(career: Career, id: string) { return update(career, id, deal => ['completed', 'rejected'].includes(deal.status) ? deal : { ...deal, status: 'withdrawn', note: 'Conversa encerrada pelo clube.' }) }
export function completeNegotiation(career: Career, id: string): Career {
  const deal = deskOf(career).negotiations.find(item => item.id === id); if (!deal || deal.status !== 'personal-terms') return career
  const player = allPlayers.find(item => item.id === deal.playerId)!; const roster = career.roster ?? []; const finances = financesOf(career); const total = deal.terms.fee + (deal.terms.signingBonus ?? 0)
  const outgoing = deal.fromClubId === career.clubId
  if (!outgoing && (roster.length >= 23 || finances.budget < total || wageUsed(career) + (deal.terms.wage ?? player.wage) > finances.wageLimit || (deal.terms.wage ?? 0) < player.wage * .85)) return update(career, id, item => ({ ...item, note: 'Os termos pessoais ou limites financeiros ainda não permitem a assinatura.' }))
  if (outgoing) {
    if (roster.length <= 16 || (career.lineup ?? defaultLineupFor(career.clubId)).includes(player.id)) return update(career, id, item => ({ ...item, note: 'Coloque o atleta no banco e mantenha pelo menos 16 jogadores.' }))
    const contracts = { ...contractsOf(career) }; delete contracts[player.id]; const availability = { ...(career.availability ?? {}) }; delete availability[player.id]
    const world = worldOf(career); const next = { ...career, roster: roster.filter(id => id !== player.id), contracts, availability, finances: { ...finances, budget: finances.budget + deal.terms.fee }, transfers: [...(career.transfers ?? []), { season: deal.season, playerId: player.id, kind: 'sell' as const, amount: deal.terms.fee }], world: { ...world, playerClubs: { ...world.playerClubs, [player.id]: deal.toClubId }, transfers: [...world.transfers, { season: deal.season, playerId: player.id, fromClubId: career.clubId, toClubId: deal.toClubId, amount: deal.terms.fee }].slice(-300) } }
    return update(next, id, item => ({ ...item, status: 'completed', note: deal.kind === 'loan' ? 'Empréstimo de saída concluído e registrado.' : 'Venda concluída e registrada no mundo.' }))
  }
  const world = worldOf(career); const contracts = { ...contractsOf(career), [player.id]: { seasons: deal.terms.contractSeasons ?? deal.terms.loanSeasons ?? 1, wage: deal.terms.wage ?? player.wage, value: deal.terms.purchaseOption ?? player.value } }
  const next = { ...career, roster: [...roster, player.id], contracts, finances: { ...finances, budget: finances.budget - total }, transfers: [...(career.transfers ?? []), { season: deal.season, playerId: player.id, kind: 'buy' as const, amount: deal.terms.fee }], world: { ...world, playerClubs: { ...world.playerClubs, [player.id]: career.clubId }, transfers: [...world.transfers, { season: deal.season, playerId: player.id, fromClubId: deal.fromClubId, toClubId: career.clubId, amount: deal.terms.fee }].slice(-300) }, availability: { ...(career.availability ?? {}), [player.id]: { injuredMatches: 0, suspensionMatches: 0, yellowCards: 0 } } }
  return update(next, id, item => ({ ...item, status: 'completed', note: deal.kind === 'loan' ? 'Empréstimo concluído.' : 'Contratação concluída.' }))
}
export function listPlayer(career: Career, playerId: string, kind: 'sale' | 'loan') { const desk = deskOf(career); if (!(career.roster ?? []).includes(playerId)) return career; return { ...career, transferDesk: { ...desk, listed: [...desk.listed.filter(item => item.playerId !== playerId), { playerId, kind }] } } }
export function generateListedOffers(career: Career) { let next = career; for (const listed of deskOf(career).listed) if (!deskOf(next).negotiations.some(deal => deal.playerId === listed.playerId && !['rejected', 'withdrawn'].includes(deal.status))) next = startNegotiation(next, listed.playerId, listed.kind); return next }

