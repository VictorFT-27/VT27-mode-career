import { SeasonReview } from '../features/career/SeasonReview'
import { Market } from '../features/career/Market'
import { BoardPanel } from '../features/career/BoardPanel'
import { MedicalPanel } from '../features/career/MedicalPanel'
import { conditionLabel, unavailable } from '../features/career/availability'
import { boardOf, isDismissed } from '../features/career/board'
import { contractsOf } from '../features/career/transfers'
import { overall } from '../features/career/progression'
import { League } from '../features/career/LeaguePanel'
import { CupPanel } from '../features/career/CupPanel'
import { StatisticsPanel } from '../features/career/StatisticsPanel'
import { Schedule } from '../features/career/Schedule'
import { averageEnergy, energy } from '../features/career/season'
import { Lineup } from '../features/career/Lineup'
import { Friendly } from '../features/career/Friendly'
import { lineupOf } from '../features/career/football'
import { useEffect, useRef, useState } from 'react'
import { clubs, createCareer, loadCareer, modes, rosterOf, saveCareer, type Career, type Club } from '../features/career/model'

type View = 'modes' | 'setup' | 'office'
type Tab = 'overview' | 'squad' | 'tactics' | 'match' | 'schedule' | 'league' | 'cup' | 'statistics' | 'market' | 'medical' | 'board' | 'review'
function Crest({ club }: { club: Club }) { return <span className="crest" style={{ color: club.color, borderColor: club.color }}>{club.initials}</span> }
function Pitch({ formation = '4-3-3' }: { formation?: string }) {
  const rows = formation.split('-').map(Number).reverse()
  return <div className="pitch" aria-label={`Campo com formação ${formation}`}><div className="center-circle" />{[...rows, 1].map((count, row) => <div className="pitch-row" key={row}>{Array.from({ length: count }, (_, i) => <span className="player-dot" key={i}>{row === rows.length ? '1' : rows.slice(0, row).reduce((sum, size) => sum + size, 0) + i + 2}</span>)}</div>)}</div>
}
export default function App() {
  const [career, setCareer] = useState<Career | null>(loadCareer)
  const [view, setView] = useState<View>('modes')
  const [tab, setTab] = useState<Tab>('overview')
  const [name, setName] = useState('')
  const [clubId, setClubId] = useState(clubs[0].id)
  const [notice, setNotice] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [view, tab])
  const club = clubs.find(c => c.id === (view === 'office' ? career?.clubId : clubId)) ?? clubs[0]
  function update(next: Career) {
    setCareer(next)
    if (isDismissed(next)) setTab('board')
    setNotice(saveCareer(next) ? 'Carreira salva neste navegador.' : 'Não foi possível salvar neste navegador. Seu progresso ficará apenas nesta sessão.')
  }
  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => setView('modes')} aria-label="VT27 — início">VT<span>27</span><small>MODE CAREER</small></button><div className="top-meta"><span className="live-dot" /> {career?.leagueActive ? 'TEMPORADA NACIONAL' : 'PRÉ-TEMPORADA'} <span className="edition">EDIÇÃO 13</span></div></header>
    {view === 'modes' && <main className="selection">
      <div className="intro"><p className="eyebrow">SEU JOGO. SUA HISTÓRIA.</p><h1 tabIndex={-1} ref={heading}>O futebol tem muitos caminhos.<br /><em>Qual vai ser o seu?</em></h1><p>Três maneiras de viver o mesmo universo. Escolha de onde começa a sua história.</p></div>
      {career && <button className="resume" onClick={() => { setView('office'); setTab(isDismissed(career) ? 'board' : 'overview') }}><span>{isDismissed(career) ? 'CONSULTAR CARREIRA ENCERRADA' : 'CONTINUAR CARREIRA'} <strong>{career.name} · {clubs.find(c => c.id === career.clubId)?.name}</strong></span><span aria-hidden="true">↗</span></button>}
      <div className="mode-grid">{modes.map(mode => <article key={mode.id} className={`mode-card ${mode.available ? 'available' : ''}`}><div className="card-top"><span className="mode-number">{mode.number}</span><span className={mode.available ? 'badge active' : 'badge'}>{mode.available ? 'DISPONÍVEL · VERSÃO INICIAL' : 'EM DESENVOLVIMENTO'}</span></div><div className={`mode-art ${mode.id}`} aria-hidden="true">{mode.id === 'coach' ? <Pitch /> : <span className="giant-mark">{mode.id === 'player' ? '10' : 'FC'}</span>}</div><p className="eyebrow">{mode.subtitle}</p><h2>{mode.title}</h2><p>{mode.description}</p><button className={mode.available ? 'primary' : 'locked'} disabled={!mode.available} onClick={() => { setView('setup'); setNotice('') }}>{mode.available ? 'Começar como treinador' : 'Disponível em breve'}{mode.available && <span aria-hidden="true">↗</span>}</button></article>)}</div>
      <div className="selection-footer"><span>UM UNIVERSO. TRÊS PERSPECTIVAS.</span><span>Primeira etapa: sua chegada ao clube.</span></div>
    </main>}
    {view === 'setup' && <main className="setup"><button className="text-button" onClick={() => setView('modes')}>← Voltar aos modos</button><p className="eyebrow">CARREIRA DE TREINADOR / 01</p><h1 tabIndex={-1} ref={heading}>O banco de reservas<br /><em>espera por você.</em></h1><p className="muted">Defina seu perfil e escolha onde dar o primeiro passo.</p><form onSubmit={event => { event.preventDefault(); if (!name.trim()) return; update(createCareer(name, clubId)); setTab('overview'); setView('office') }}>
      <label className="name-label" htmlFor="coach-name">Como devemos chamar você?</label><input id="coach-name" required maxLength={40} value={name} onChange={e => setName(e.target.value)} placeholder="Nome do treinador" autoComplete="given-name" pattern=".*\S.*" />
      <fieldset><legend>Escolha seu primeiro clube</legend><p className="muted">Os 20 participantes da Série A 2026, cada um com elenco próprio.</p><div className="club-grid">{clubs.map(item => <label key={item.id} className={`club-option ${clubId === item.id ? 'selected' : ''}`}><div className="club-top"><Crest club={item} /><input type="radio" name="club" value={item.id} checked={clubId === item.id} onChange={() => setClubId(item.id)} /></div><h2>{item.name}</h2><span className="muted">{item.city}</span><p className="club-reputation">{item.reputation}</p><p>{item.description}</p><small>OBJETIVO DA DIRETORIA</small><strong>{item.objective}</strong></label>)}</div></fieldset>
      <div className="form-bottom"><p className="muted">{career ? 'Iniciar substituirá a carreira salva neste navegador.' : 'O progresso é salvo apenas neste navegador.'}</p><button className="primary" type="submit">Assumir o {club.name} <span aria-hidden="true">→</span></button></div></form></main>}
    {view === 'office' && career && <div className="office"><aside className="sidebar"><div className="club-identity"><Crest club={club} /><h2>{club.name}</h2><p>TREINADOR · {career.name}</p></div><nav aria-label="Área do treinador">{([['overview', '◫', 'Visão geral'], ['squad', '☷', 'Elenco'], ['tactics', '⌘', 'Prancheta'], ['match', '▷', 'Partida'], ['schedule', '▦', 'Calendário'], ['league', '◇', 'Brasileirão'], ['cup', '⬡', 'Copa do Brasil'], ['statistics', '▥', 'Estatísticas'], ['market', '$', 'Mercado'], ['medical', '+', 'Departamento'], ['board', '◆', 'Diretoria'], ['review', '↗', 'Temporada']] as const).map(([id, icon, label]) => <button disabled={isDismissed(career) && id !== 'board' && id !== 'statistics'} key={id} className={tab === id ? 'nav-active' : ''} onClick={() => setTab(id)}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav><div className="sidebar-foot"><span className={`badge ${isDismissed(career) ? '' : 'active'}`}>{isDismissed(career) ? 'DEMITIDO' : 'TREINADOR · ' + boardOf(career).confidence}</span><p>Jogador e dirigente<br />chegam nas próximas etapas.</p><button className="text-button" onClick={() => setView('modes')}>← Seleção de carreira</button></div></aside><main className="dashboard"><div className="dashboard-title"><div><p className="eyebrow">CENTRO DE COMANDO / {club.name}</p><h1 tabIndex={-1} ref={heading}>{tab === 'overview' ? `Bem-vindo, ${career.name}.` : tab === 'squad' ? 'Conheça seu elenco.' : tab === 'tactics' ? 'Sua ideia de jogo.' : tab === 'schedule' ? 'Planeje. Prepare. Evolua.' : tab === 'league' ? 'Agora vale pontos.' : tab === 'cup' ? 'O caminho até a taça.' : tab === 'statistics' ? 'Sua história em números.' : tab === 'market' ? 'Planeje o próximo reforço.' : tab === 'medical' ? 'Quem está pronto para jogar?' : tab === 'board' ? 'Seu trabalho está em avaliação.' : tab === 'review' ? 'Sua carreira em evolução.' : 'Dia de jogo.'}</h1></div><span className="badge">{career.leagueActive ? 'TEMPORADA NACIONAL' : 'PRÉ-TEMPORADA'} · T{career.seasonNumber ?? 1} · DIA {String(career.day ?? 1).padStart(2, '0')}</span></div>
      {tab === 'overview' && <><section className="welcome-panel"><div><p className="eyebrow">UM NOVO CAPÍTULO</p><h2>O próximo passo<br />começa no vestiário.</h2><p>A diretoria do {club.name} recebe você para um novo ciclo. Conheça os atletas e escolha sua formação inicial.</p><button className="primary" onClick={() => setTab('squad')}>Conhecer o elenco <span aria-hidden="true">→</span></button></div><div className="welcome-pitch"><Pitch formation={career.formation} /></div></section><div className="stat-grid"><article><p>ATLETAS NO ELENCO</p><strong>{rosterOf(career).length} <small>jogadores</small></strong></article><article><p>FORMAÇÃO ATUAL</p><strong>{career.formation}</strong></article><article><p>ENERGIA DO ELENCO</p><strong>{averageEnergy(career)}%</strong></article></div><div className="lower-grid"><section className="panel"><p className="eyebrow">RECADO DA DIRETORIA</p><h2>Uma identidade para o clube.</h2><p>{club.objective}. Esse é o ponto de partida do seu trabalho no {club.name}.</p><span className="signature">A diretoria</span></section><section className="panel"><p className="eyebrow">SEUS PRIMEIROS PASSOS</p><button className="task-row" onClick={() => setTab('squad')}><span>01</span>Conhecer os jogadores <b>↗</b></button><button className="task-row" onClick={() => setTab('tactics')}><span>02</span>Definir a formação <b>↗</b></button><button className="task-row" onClick={() => setTab('match')}><span>03</span>{career.match ? 'Abrir minha partida' : 'Jogar a próxima partida'} <b>↗</b></button><button className="task-row" onClick={() => setTab('schedule')}><span>04</span>Treinos e calendário <b>↗</b></button><button className="task-row" onClick={() => setTab('market')}><span>05</span>Mercado e contratos <b>↗</b></button><p className="muted">Prepare o time e administre os recursos do clube.</p></section></div></>}
      {tab === 'squad' && <section className="panel"><div className="section-heading"><h2>Elenco atual</h2><span className="muted">{rosterOf(career).length} atletas · contratos ativos</span></div><div className="table-wrap"><table><thead><tr><th scope="col">Jogador</th><th scope="col">Posição</th><th scope="col">Idade</th><th scope="col">Nível</th><th scope="col">Situação</th><th scope="col">Energia</th><th scope="col">Condição</th><th scope="col">Contrato</th></tr></thead><tbody>{rosterOf(career).map((player, i) => <tr className={unavailable(career, player.id) ? 'medical-unavailable' : ''} key={player.name}><td><span className="shirt-number">{i + 1}</span>{player.name}</td><td><span className="position">{player.position}</span></td><td>{player.age}</td><td><strong className="rating">{overall(career, player.id)}</strong></td><td>{lineupOf(career).includes(player.id) ? 'Titular' : 'Reserva'}</td><td><span className={energy(career, player.id) < 75 ? 'energy-low' : 'energy-good'}>{energy(career, player.id)}%</span></td><td>{conditionLabel(career, player.id)}</td><td>{contractsOf(career)[player.id]?.seasons ?? 2} temp.</td></tr>)}</tbody></table></div><button className="secondary" onClick={() => setTab('medical')}>Abrir departamento →</button></section>}
      {tab === 'tactics' && <Lineup career={career} onChange={update} />}
      {tab === 'match' && <Friendly career={career} onChange={update} onLineup={() => setTab('tactics')} onSchedule={() => setTab('schedule')} />}
      {tab === 'schedule' && <Schedule career={career} onChange={update} onMatch={() => setTab('match')} onLeague={() => setTab(career.leagueActive ? 'review' : 'league')} />}
      {tab === 'league' && <League career={career} onChange={update} onSchedule={() => setTab('schedule')} onMatch={() => setTab('match')} onReview={() => setTab('review')} />}
      {tab === 'cup' && <CupPanel career={career} onMatch={() => setTab('match')} onSchedule={() => setTab('schedule')} />}
      {tab === 'statistics' && <StatisticsPanel career={career} />}
      {tab === 'market' && <Market career={career} onChange={update} />}
      {tab === 'medical' && <MedicalPanel career={career} onLineup={() => setTab('tactics')} />}
      {tab === 'board' && <BoardPanel career={career} onExit={() => setView('modes')} />}
      {tab === 'review' && <SeasonReview career={career} onChange={update} onCalendar={() => setTab('schedule')} />}
      <p className="save-notice" role="status">{notice || 'Carreira local · salva neste navegador'}</p><footer className="prototype-note">VERSÃO PESSOAL · Clubes e atletas reais. Níveis, valores e salários são estimativas internas do simulador.</footer>
    </main></div>}
  </div>
}
