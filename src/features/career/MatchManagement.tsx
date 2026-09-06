import { useState } from 'react'
import { rosterOf, type Career } from './model'
import { setMentality, substitute } from './matchEngine'
import { type Mentality } from './types'
import { unavailable } from './availability'

const mentalities: { id: Mentality; name: string; summary: string }[] = [
  { id: 'defensive', name: 'Defensiva', summary: 'Protege mais o gol, criando menos oportunidades.' },
  { id: 'balanced', name: 'Equilibrada', summary: 'Mantém os riscos e as chances no nível normal.' },
  { id: 'attacking', name: 'Ofensiva', summary: 'Cria mais e finaliza melhor, deixando espaços atrás.' },
]

export function MatchManagement({ career, onChange }: { career: Career; onChange: (career: Career) => void }) {
  const match = career.match!
  const squad = rosterOf(career)
  const [outId, setOutId] = useState(match.lineup.find(id => squad.find(player => player.id === id)?.position !== 'GOL') ?? match.lineup[0])
  const outgoing = squad.find(player => player.id === outId)
  const candidates = squad.filter(player => !unavailable(career, player.id) && !match.lineup.includes(player.id) && !match.substitutions?.some(change => change.outId === player.id) && (outgoing?.position === 'GOL') === (player.position === 'GOL'))
  const [inId, setInId] = useState('')
  const available = candidates.some(player => player.id === inId) ? inId : candidates[0]?.id ?? ''
  const used = match.substitutions?.length ?? 0

  return <section className="match-management panel">
    <div className="management-title"><div><p className="eyebrow">ÁREA TÉCNICA</p><h2>Comande a partida.</h2></div><span className="badge">{3 - used} SUBSTITUIÇÕES</span></div>
    <div className="mentality-grid" role="group" aria-label="Postura do time">{mentalities.map(item => <button key={item.id} aria-pressed={(match.mentality ?? 'balanced') === item.id} className={(match.mentality ?? 'balanced') === item.id ? 'mentality-active' : ''} onClick={() => onChange(setMentality(career, item.id))}><strong>{item.name}</strong><span>{item.summary}</span></button>)}</div>
    <p className="management-note">A postura escolhida afeta apenas os próximos lances. Os acontecimentos já vistos não mudam.</p>
    <div className="substitution-box"><div><label htmlFor="player-out">Sai</label><select id="player-out" value={outId} disabled={match.cursor === 0 || used >= 3} onChange={event => { setOutId(event.target.value); setInId('') }}>{match.lineup.map(id => { const player = squad.find(candidate => candidate.id === id)!; return <option value={id} key={id}>{player.position} · {player.name}</option> })}</select></div><span aria-hidden="true">⇄</span><div><label htmlFor="player-in">Entra</label><select id="player-in" value={available} disabled={match.cursor === 0 || used >= 3 || !available} onChange={event => setInId(event.target.value)}>{candidates.map(player => <option value={player.id} key={player.id}>{player.position} · {player.name}</option>)}</select></div><button className="secondary" disabled={match.cursor === 0 || used >= 3 || !available} onClick={() => { onChange(substitute(career, outId, available)); setOutId(match.lineup.find(id => id !== outId && squad.find(player => player.id === id)?.position !== 'GOL') ?? match.lineup[0]); setInId('') }}>Confirmar troca</button></div>
    {match.cursor === 0 && <p className="management-note">As substituições ficam disponíveis após o primeiro lance.</p>}
    {!!used && <div className="substitution-history"><strong>Trocas realizadas</strong>{match.substitutions!.map(change => <p key={change.minute + change.outId}><time>{change.minute}′</time> {squad.find(player => player.id === change.outId)?.name} → {squad.find(player => player.id === change.inId)?.name}</p>)}</div>}
    <details className="rules-explainer"><summary>O que cada postura muda?</summary><p>Defensiva reduz em 6 pontos percentuais sua participação nos próximos lances e em 3 a conversão das suas chances, enquanto reduz em 10 a conversão rival. Ofensiva acrescenta 8 pontos à participação e à conversão do seu time, mas também acrescenta 5 à conversão rival. Equilibrada mantém os valores normais. Você pode mudar a qualquer momento antes do apito final.</p><p>Cada atleta que entra passa a disputar os próximos lances. O desgaste de energia é proporcional aos minutos jogados. São permitidas três substituições, sem retorno do atleta que saiu.</p></details>
  </section>
}
