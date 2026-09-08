import { useState } from 'react'
import { allPlayers } from './model'
import { clubs } from './realData'
import { marketProfessionals, type MarketCareer, type Professional } from './professionalMarket'
import { playerStats } from './progression'
import { conditionLabel } from './availability'

const money = (value: number) => `R$ ${value.toLocaleString('pt-BR')} mil`
const clubName = (id: string) => clubs.find(club => club.id === id)?.name ?? 'Sem clube'
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export function PlayerDossier({ career, onNegotiate }: { career: MarketCareer; onNegotiate: (id: string) => void }) {
  const [search, setSearch] = useState(''), [position, setPosition] = useState(''), [club, setClub] = useState(''), [sort, setSort] = useState('rating')
  const [maxCost, setMaxCost] = useState(''), [selected, setSelected] = useState<string[]>([])
  const people = marketProfessionals(career).filter(person => person.kind === 'player')
  const rows = people.flatMap(person => {
    const player = allPlayers.find(p => p.id === person.id)
    return player ? [{ ...player, person, rating: player.rating + (career.mode === 'coach' ? career.playerGrowth?.[player.id] ?? 0 : 0) }] : []
  })
  const filtered = rows.filter(p => normalize(`${p.name} ${clubName(p.person.clubId)}`).includes(normalize(search)) && (!position || p.position === position) && (!club || p.person.clubId === club) && (maxCost === '' || p.person.terms.fee <= Number(maxCost))).sort((a, b) => (sort === 'rating' ? b.rating - a.rating : sort === 'age' ? a.age - b.age : sort === 'wage' ? a.person.terms.wage - b.person.terms.wage : a.person.terms.fee - b.person.terms.fee) || a.name.localeCompare(b.name))
  const chosen = selected.flatMap(id => rows.filter(p => p.id === id))
  const stats = career.mode === 'coach' ? playerStats(career) : []
  function choose(id: string) { setSelected(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 2 ? [...current, id] : current) }
  function card(person: Professional) {
    const p = rows.find(row => row.id === person.id)!, season = stats.find(item => item.id === p.id)
    const owned = person.clubId === career.clubId
    return <article className="dossier-card" key={p.id}><header><div><p className="eyebrow">{p.position} · {clubName(person.clubId)}</p><h3>{p.name}</h3><p>{p.age} anos na base do jogo</p></div><strong className="dossier-rating" aria-label={`Nível ${p.rating}`}>{p.rating}</strong></header><dl><div><dt>Compensação de referência</dt><dd>{money(person.terms.fee)}</dd></div><div><dt>Salário mensal</dt><dd>{money(person.terms.wage)}</dd></div><div><dt>Vínculo registrado</dt><dd>{person.terms.seasons} temporadas</dd></div><div><dt>Multa rescisória</dt><dd>{money(person.terms.releaseClause)}</dd></div><div><dt>Custo do primeiro ano*</dt><dd>{money(person.terms.fee + person.terms.wage * 12)}</dd></div><div><dt>Condição</dt><dd>{career.mode === 'coach' && owned ? conditionLabel(career, p.id) : 'Sem relatório médico'}</dd></div><div><dt>Jogos / gols / assistências</dt><dd>{season ? `${season.appearances} / ${season.goals} / ${season.assists}` : 'Sem dados neste save'}</dd></div><div><dt>Nota média na temporada</dt><dd>{season?.average != null ? season.average.toFixed(2) : 'Sem avaliações'}</dd></div></dl><button className="primary" onClick={() => onNegotiate(p.id)}>{owned ? 'Negociar venda' : 'Negociar contratação'}</button><button className="text-button" onClick={() => choose(p.id)}>Remover da comparação</button></article>
  }
  return <section className="player-dossier"><p className="eyebrow">EDIÇÃO 24 · CENTRAL DE ATLETAS</p><h3>Conheça. Compare. Decida.</h3><p>Abra até duas fichas. Nível e valores são estimativas do jogo; estatísticas representam partidas registradas no seu save.</p><div className="dossier-filters"><label>Nome ou clube<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ex.: Arrascaeta ou Flamengo" /></label><label>Posição<select value={position} onChange={e => setPosition(e.target.value)}><option value="">Todas</option>{[...new Set(rows.map(p => p.position))].sort().map(value => <option key={value}>{value}</option>)}</select></label><label>Clube<select value={club} onChange={e => setClub(e.target.value)}><option value="">Todos</option>{clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Compensação máxima (R$ mil)<input type="number" min="0" value={maxCost} onChange={e => setMaxCost(e.target.value)} placeholder="Sem limite" /></label><label>Ordenar por<select value={sort} onChange={e => setSort(e.target.value)}><option value="rating">Maior nível</option><option value="age">Mais jovens</option><option value="fee">Menor compensação</option><option value="wage">Menor salário</option></select></label></div>
    <p role="status">{filtered.length} atletas encontrados · {chosen.length}/2 fichas abertas</p>
    {chosen.length > 0 && <div className="dossier-comparison">{chosen.map(p => card(p.person))}</div>}
    {chosen.length === 2 && <p className="dossier-verdict">{chosen[0].position !== chosen[1].position ? 'Posições diferentes: avalie a função que falta no elenco antes de comparar níveis. ' : 'Mesma posição: compare nível, salário e custo total para escolher. '}Diferença de nível: {Math.abs(chosen[0].rating - chosen[1].rating)} pontos. Diferença de custo no primeiro ano: {money(Math.abs(chosen[0].person.terms.fee + chosen[0].person.terms.wage * 12 - chosen[1].person.terms.fee - chosen[1].person.terms.wage * 12))}.</p>}
    {chosen.length > 0 && <p>*Compensação de referência + 12 salários atuais. A negociação pode alterar esses valores; multas e outros custos não estão somados. Estatísticas cobrem apenas jogos acompanhados pelo seu clube.</p>}
    {!filtered.length ? <p>Nenhum atleta corresponde aos filtros. <button className="text-button" onClick={() => { setSearch(''); setPosition(''); setClub(''); setMaxCost('') }}>Limpar filtros</button></p> : <div className="table-wrap"><table><caption>Atletas disponíveis para consulta e comparação</caption><thead><tr><th>Atleta</th><th>Posição</th><th>Idade*</th><th>Nível</th><th>Clube</th><th>Compensação</th><th>Ficha</th></tr></thead><tbody>{filtered.map(p => <tr key={p.id} className={selected.includes(p.id) ? 'dossier-selected' : ''}><th scope="row">{p.name}</th><td>{p.position}</td><td>{p.age}</td><td>{p.rating}</td><td>{clubName(p.person.clubId)}</td><td>{money(p.person.terms.fee)}</td><td><button className="table-action" aria-pressed={selected.includes(p.id)} disabled={selected.length === 2 && !selected.includes(p.id)} onClick={() => choose(p.id)}>{selected.includes(p.id) ? 'Remover ficha' : 'Abrir ficha'}</button></td></tr>)}</tbody></table></div>}<p>*Idade cadastrada na base. O simulador ainda não aplica envelhecimento.</p>
  </section>
}
