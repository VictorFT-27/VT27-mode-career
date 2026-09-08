export type EmploymentTerms = { fee: number; wage: number; seasons: number; releaseClause: number }
export type EmploymentDeal = { id: string; subjectId: string; name: string; kind: 'player' | 'coach' | 'director'; from: string; to: string; currentClause: number; terms: EmploymentTerms; asking: EmploymentTerms; status: 'draft' | 'countered' | 'accepted' | 'signed' | 'withdrawn'; round: number; note: string }
export type EmploymentState = { deals: EmploymentDeal[]; contracts: Record<string, EmploymentTerms>; locations: Record<string, string>; sequence: number; lastInterest?: string }
export const emptyEmployment = (): EmploymentState => ({ deals: [], contracts: {}, locations: {}, sequence: 0 })
export const validEmploymentTerms = (terms: EmploymentTerms) => [terms.fee, terms.wage, terms.releaseClause].every(value => Number.isSafeInteger(value) && value >= 0 && value <= 100000000) && terms.wage > 0 && terms.releaseClause > 0 && Number.isInteger(terms.seasons) && terms.seasons >= 1 && terms.seasons <= 5
export function reviewEmployment(deal: EmploymentDeal, terms: EmploymentTerms): EmploymentDeal {
  if (!['draft', 'countered'].includes(deal.status) || !validEmploymentTerms(terms)) return deal
  const released = terms.fee >= deal.currentClause
  const accepted = (released || terms.fee >= deal.asking.fee * .9) && terms.wage >= deal.asking.wage && terms.releaseClause <= deal.asking.releaseClause * 1.5
  return { ...deal, terms, round: deal.round + 1, status: accepted ? 'accepted' : 'countered', note: accepted ? 'Clube e profissional aceitaram. Revise o custo e assine para concluir a mudança.' : 'Contraproposta recebida. Ajuste os termos ou use as condições solicitadas.' }
}
