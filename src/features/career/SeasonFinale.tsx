import { useState } from 'react'
import { clubs } from './realData'
import { boardTarget, standings } from './league'
import { canRenew, playerStats } from './progression'
import { playerStandings } from '../player/playerCompetition'
import { averageRating, playerOverall } from '../player/playerModel'
import { estimatedRank } from '../director/directorModel'
import type { MarketCareer } from './professionalMarket'
import { cupStageNames } from './cupData'

type Goal = { label: string; value: number; target: number; met: boolean; detail: string }
const money = (v: number) => `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
export function SeasonFinale({ career }: { career: MarketCareer }) {
  const [page, setPage] = useState<'highlights' | 'objectives'>('highlights')
  const club = clubs.find(c => c.id === career.clubId) ?? clubs[0]
  const season = career.mode === 'coach' ? career.seasonNumber ?? 1 : career.season
  const complete = career.mode === 'coach' ? canRenew(career) : career.seasonComplete
  const rows = career.mode === 'director' ? [] : career.mode === 'player' ? playerStandings(career.leagueResults) : standings(career.leagueResults ?? [])
  const own = rows.find(r => r.id === career.clubId)
  const rank = career.mode === 'director' ? estimatedRank(career) : rows.findIndex(r => r.id === career.clubId) + 1
  const played = career.mode === 'director' ? career.cycle : own?.played ?? 0
  const target = boardTarget(career.clubId)
  const cup = career.mode === 'director' ? undefined : career.cup
  const champion = complete && career.mode !== 'director' && rank === 1
  const cupChampion = cup?.champion === career.clubId
  const goals: Goal[] = [{ label: career.mode === 'director' ? 'Meta esportiva projetada' : 'Meta do clube na liga', value: played ? Math.max(0, 21 - rank) : 0, target: 21 - target, met: played > 0 && rank <= target, detail: `${played ? rank + 'º' : 'Sem jogos'} · meta: ${target === 1 ? 'título' : 'top ' + target}` }]
  let highlights: { label: string; value: string; detail: string }[] = []
  if (career.mode === 'player') {
    goals.push({ label: 'Conquistar espaço', value: career.trust, target: 60, met: career.trust >= 60, detail: `${career.trust}/60 de confiança` }, { label: 'Participar de 25 jogos', value: career.stats.appearances, target: 25, met: career.stats.appearances >= 25, detail: `${career.stats.appearances}/25 jogos` }, { label: 'Participar de 5 gols', value: career.stats.goals + career.stats.assists, target: 5, met: career.stats.goals + career.stats.assists >= 5, detail: `${career.stats.goals} gols + ${career.stats.assists} assistências` })
    const previous = career.seasons.at(-1)?.overall
    highlights = [{ label: 'PROTAGONISMO', value: String(career.stats.goals + career.stats.assists), detail: 'participações em gols' }, { label: 'SUAS ATUAÇÕES', value: career.stats.appearances ? averageRating(career.stats).toFixed(1) : '—', detail: `${career.stats.minutes} minutos · ${career.stats.motm} vezes melhor em campo` }, { label: 'NÍVEL GERAL', value: String(playerOverall(career)), detail: previous == null ? 'Primeira temporada: referência inicial do histórico' : `${playerOverall(career) - previous >= 0 ? '+' : ''}${playerOverall(career) - previous} desde o último encerramento` }]
  } else if (career.mode === 'director') {
    goals.push({ label: 'Equilíbrio financeiro', value: career.budget >= 0 ? 1 : 0, target: 1, met: career.budget >= 0, detail: `Saldo: ${money(career.budget)}` }, { label: 'Abrir espaço para a base', value: career.promoted, target: 1, met: career.promoted > 0, detail: `${career.promoted} jovens promovidos` })
    highlights = [{ label: 'RECEITAS', value: money(career.revenue), detail: `Despesas: ${money(career.expenses)}` }, { label: 'CONSELHO', value: `${career.boardConfidence}/100`, detail: career.boardConfidence <= 10 ? 'Gestão encerrada pelo conselho' : 'Confiança no seu projeto' }, { label: 'TORCIDA', value: `${career.supporterMood}%`, detail: `${career.promoted} jovens ganharam uma oportunidade` }]
  } else {
    const stats = playerStats(career), scorer = [...stats].filter(p => p.goals > 0).sort((a,b) => b.goals-a.goals)[0]
    highlights = [{ label: 'DESTAQUE EM GOLS', value: scorer?.name ?? 'Sem registro', detail: scorer ? `${scorer.goals} gols nos jogos oficiais acompanhados` : 'Dispute partidas para construir sua história' }, { label: 'EVOLUÇÃO PREVISTA', value: String(stats.filter(p => p.gain > 0).length), detail: 'atletas com ganho ao iniciar a próxima temporada' }, { label: 'CAMPANHA', value: `${own?.points ?? 0} pts`, detail: `${own?.wins ?? 0} vitórias · ${own?.draws ?? 0} empates · ${own?.losses ?? 0} derrotas` }]
  }
  const achieved = goals.filter(g => g.met).length
  return <section className="season-finale" aria-label={`Retrospectiva da temporada ${season}`}>
    <div className="finale-hero"><div className="finale-pitch" aria-hidden="true"><i /><b /></div><div className="finale-copy"><p className="eyebrow">{complete ? 'APITO FINAL' : 'SUA TEMPORADA, ATÉ AQUI'} · TEMPORADA {season}</p><h2>{champion ? 'O topo tem a sua marca.' : cupChampion ? 'Uma campanha para levantar a taça.' : complete ? 'Cada jogo deixou uma história.' : 'Seu legado está em jogo.'}</h2><p>{club.name} · {career.name}</p><span className="finale-status">{complete ? 'Temporada encerrada' : 'Balanço parcial'} · {career.mode === 'director' ? `${played}/10 ciclos` : `${played}/38 rodadas`}</span></div><div className="finale-rank"><span>{career.mode === 'director' ? 'PROJEÇÃO ESPORTIVA' : 'CLASSIFICAÇÃO NA LIGA'}</span><strong>{played ? rank + 'º' : '—'}</strong><small>{champion ? 'CAMPEÃO NACIONAL' : complete ? 'Resultado da campanha' : 'Posição atual'}</small></div></div>
    <div className="finale-ribbon"><span>{champion ? '★ Liga conquistada' : career.mode === 'director' ? 'Gestão em dez ciclos executivos' : `${own?.points ?? 0} pontos na liga`}</span>{cup && <span>{cupChampion ? '★ Copa conquistada' : cup.eliminated ? 'Participação na Copa encerrada' : cup.champion ? 'Copa encerrada' : `Copa · ${cupStageNames[cup.stage]}`}</span>}<span>{achieved}/{goals.length} metas {complete ? 'alcançadas' : 'em nível de conclusão'}</span></div>
    <div className="finale-switch" role="group" aria-label="Conteúdo da retrospectiva"><button aria-pressed={page === 'highlights'} onClick={() => setPage('highlights')}>Destaques da campanha</button><button aria-pressed={page === 'objectives'} onClick={() => setPage('objectives')}>Objetivos e conquistas</button></div>
    {page === 'highlights' ? <div className="finale-highlights">{highlights.map((h,i) => <article key={h.label}><span className="finale-index" aria-hidden="true">0{i+1}</span><p className="eyebrow">{h.label}</p><strong>{h.value}</strong><p>{h.detail}</p></article>)}</div> : <div className="finale-goals">{goals.map(g => <article key={g.label}><div><h3>{g.label}</h3><span>{complete ? g.met ? '✓ Alcançada' : 'Não alcançada' : g.met ? 'Meta atingida até aqui' : 'Em andamento'}</span></div><progress max={g.target} value={Math.min(g.target, Math.max(0,g.value))} aria-label={g.label} /><p>{g.detail}</p></article>)}</div>}
    <p className="finale-footnote">{complete ? 'Revise sua campanha antes de iniciar a próxima temporada. A transição arquiva os resultados e preserva sua carreira.' : 'Este é um balanço parcial. As metas serão avaliadas no encerramento.'} {career.mode === 'director' ? 'A posição é uma projeção do modo dirigente, não uma tabela de 38 rodadas.' : 'Dados do clube atual; números pessoais podem incluir passagens por outros clubes.'}</p>
  </section>
}
