import { useState } from 'react'
import { squad, type Career } from './model'
import { fit, lineupOf, player, strength, swap } from './football'
import { positions, type Formation } from './types'
export function Lineup({ career, onChange }: { career: Career; onChange: (career: Career) => void }) {
  const [selected, setSelected] = useState(0)
  const ids = lineupOf(career)
  const locked = !!career.match && career.match.cursor < career.match.events.length
  const slots = positions[career.formation]
  const current = player(ids[selected])
  const sizes = [1, ...career.formation.split('-').map(Number)]
  let offset = 0
  const rows = sizes.map(size => { const start = offset; offset += size; return Array.from({ length: size }, (_, i) => start + i) }).reverse()
  return <section className="lineup-workspace">
    <div className="lineup-toolbar"><div><p className="eyebrow">PLANO DE JOGO</p><h2>Seu time, sua identidade.</h2><p className="muted">Escolha uma posição no campo e depois o atleta que vai ocupá-la.</p></div><div className="team-power"><strong>{strength(ids, career.formation)}</strong><span>FORÇA DO TIME</span></div></div>
    {locked && <p className="info-banner">O amistoso está em andamento. A escalação poderá ser alterada após o apito final.</p>}
    <div className="lineup-layout"><div><fieldset className="formation-pills" disabled={locked}><legend>Formação</legend>{(Object.keys(positions) as Formation[]).map(value => <label className={value === career.formation ? 'chosen' : ''} key={value}><input type="radio" name="formation" checked={career.formation === value} onChange={() => onChange({ ...career, formation: value })} />{value}</label>)}</fieldset><div className="interactive-pitch"><div className="pitch-half" />{rows.map((row, i) => <div className="lineup-row" key={i}>{row.map(slot => { const p = player(ids[slot]); return <button aria-pressed={selected === slot} aria-label={`${slots[slot]}: ${p.name}. ${fit(p.id, slots[slot]) < 1 ? 'Fora da posição natural.' : 'Posição natural.'} Selecionar para trocar.`} className={`pitch-athlete ${selected === slot ? 'selected-athlete' : ''}`} key={slot} onClick={() => setSelected(slot)}><span className="jersey">{p.rating}</span><strong>{p.name.split(' ').at(-1)}</strong><small>{slots[slot]} {fit(p.id, slots[slot]) < 1 && <span title="Fora da posição natural">· !</span>}</small></button> })}</div>)}</div><p className="pitch-help">! Fora da posição natural · Pode reduzir a força do time.</p></div>
    <section className="bench-panel"><p className="eyebrow">POSIÇÃO SELECIONADA · {slots[selected]}</p><h2>{current.name}</h2><p className="muted">{current.position} de origem · nível {current.rating}</p><p className="swap-help">Selecione um reserva para entrar. Escolher outro titular troca os dois de posição.</p><div className="candidate-list">{squad.filter(p => selected === 0 ? p.position === 'GOL' : p.position !== 'GOL').map(p => <button disabled={locked || ids[selected] === p.id} key={p.id} className={ids.includes(p.id) ? 'candidate starter' : 'candidate'} onClick={() => onChange({ ...career, lineup: swap(ids, selected, p.id) })}><span className="candidate-position">{p.position}</span><span><strong>{p.name}</strong><small>{ids[selected] === p.id ? 'Nesta posição' : ids.includes(p.id) ? 'Titular · trocar posição' : 'Reserva · colocar em campo'}</small></span><b>{p.rating}</b></button>)}</div><p className="muted">Goleiros só ocupam o gol. Os demais atletas podem ser improvisados.</p></section></div>
    <details className="rules-explainer"><summary>Como a escalação influencia o amistoso?</summary><p>A força é a média dos níveis dos titulares, ajustada à posição. A posição natural usa 100% do nível; posições próximas, 96%; outras posições, 86%. Uma equipe mais forte tem mais chances de criar oportunidades, mas não tem vitória garantida. Não existe uma formação que vença sempre.</p></details>
  </section>
}
