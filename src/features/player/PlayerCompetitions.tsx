import { clubs } from '../career/realData'
import { cupStageNames, externalCupClubs } from '../career/cupData'
import { playerCupStatus, playerSeasonLength, playerStandings } from './playerCompetition'
import type { PlayerCareer } from './playerModel'

const allClubs = [...clubs, ...externalCupClubs]
const clubName = (id: string) => allClubs.find(club => club.id === id)?.name ?? 'Clube'
const cupResultText = (career: PlayerCareer, stage: number) => {
  const played = career.cup.results.filter(result => result.stage === stage)
  if (!played.length) return 'Aguardando'
  const own = played.filter(result => [result.home, result.away].includes(career.clubId))
  if (!own.length) return 'Sem participação'
  const goalsFor = own.reduce((sum, result) => sum + (result.home === career.clubId ? result.homeGoals : result.awayGoals), 0)
  const goalsAgainst = own.reduce((sum, result) => sum + (result.home === career.clubId ? result.awayGoals : result.homeGoals), 0)
  return `${goalsFor} x ${goalsAgainst} no agregado`
}

export function PlayerCompetitions({ career }: { career: PlayerCareer }) {
  const table = playerStandings(career.leagueResults)
  const own = table.find(row => row.id === career.clubId)!
  const rank = table.findIndex(row => row.id === career.clubId) + 1
  const cupMatches = career.matches.filter(match => match.competition === 'cup')
  const leagueMatches = career.matches.filter(match => match.competition === 'league')
  const lastEvolution = career.teamEvolution.at(-1)
  const stages = [5, 6, 7, 8, 9]
  return <section className="player-competitions">
    <div className="player-competition-hero"><div><p className="eyebrow">TEMPORADA DO JOGADOR</p><h2>{clubName(career.clubId)} em foco</h2><p>Você acompanha liga, Copa e evolução coletiva pelo mesmo painel. A linha marcada é sempre o seu clube atual.</p></div><strong>{rank}º</strong></div>
    <div className="league-summary"><article><span>BRASILEIRÃO</span><strong>{career.round ? `${rank}º lugar` : 'A começar'}</strong><small>{own.points} pontos · {career.round}/{playerSeasonLength} jogos · saldo {own.difference}</small></article><article><span>COPA NACIONAL</span><strong>{playerCupStatus(career.cup, career.clubId)}</strong><small>{cupMatches.length} partidas · fase atual: {cupStageNames[career.cup.stage]}</small></article><article><span>EVOLUÇÃO DO TIME</span><strong>{own.goalsFor} GP · {own.goalsAgainst} GC</strong><small>{own.wins} vitórias · {own.draws} empates · {own.losses} derrotas</small></article></div>
    <section className="panel player-table-panel"><div className="section-heading"><div><p className="eyebrow">CLASSIFICAÇÃO AO VIVO</p><h2>Brasileirão · Temporada {career.season}</h2></div><span className="muted">Seu clube aparece com faixa e selo.</span></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>PTS</th></tr></thead><tbody>{table.map((row, index) => <tr className={row.id === career.clubId ? 'current-club-row player-own-row' : ''} key={row.id}><td>{index + 1}</td><th>{row.name}{row.id === career.clubId && <small> Seu time</small>}</th><td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td><td>{row.difference}</td><td><strong>{row.points}</strong></td></tr>)}</tbody></table></div></section>
    <section className="panel player-cup-map"><div className="section-heading"><div><p className="eyebrow">CAMINHO DA COPA</p><h2>Fases e situação</h2></div><span className="muted">{playerCupStatus(career.cup, career.clubId)}</span></div><div className="cup-stage-tabs">{stages.map(stage => <article className={`cup-stage ${career.cup.stage === stage ? 'current' : ''}`} key={stage}><small>{stage === 9 ? 'Final' : `Fase ${stage - 4}`}</small><strong>{cupStageNames[stage as keyof typeof cupStageNames]}</strong><span>{cupResultText(career, stage)}</span></article>)}</div></section>
    <div className="lower-grid"><section className="panel"><div className="section-heading"><div><p className="eyebrow">TRAJETÓRIA COLETIVA</p><h2>Últimos compromissos</h2></div><span className="muted">Liga e Copa reunidas.</span></div><div className="world-feed">{career.matches.length ? career.matches.slice(-8).reverse().map((match, index) => <article key={`${match.season}-${match.competition}-${match.round}-${index}`}><span>{match.competition === 'cup' ? 'COPA' : `R${match.round}`}</span><div><strong>{clubName(match.clubId)} {match.teamGoals} x {match.opponentGoals} {clubName(match.opponentId)}</strong><small>{match.atHome ? 'Em casa' : 'Fora'} · {match.minutes ? `Nota ${match.rating.toFixed(1)} · ${match.goals}G ${match.assists}A` : 'Não relacionado'}</small></div><b>{match.teamGoals > match.opponentGoals ? 'VITÓRIA' : match.teamGoals === match.opponentGoals ? 'EMPATE' : 'DERROTA'}</b></article>) : <p className="muted">A temporada ainda não teve jogos oficiais.</p>}</div></section>
      <section className="panel team-evolution-card"><div className="section-heading"><div><p className="eyebrow">FORMA DA EQUIPE</p><h2>Impacto na temporada</h2></div><span className="muted">{lastEvolution ? `Evento ${lastEvolution.event}` : 'Pré-temporada'}</span></div><div className="season-stats"><article><span>PONTOS</span><strong>{own.points}</strong></article><article><span>POSIÇÃO</span><strong>{rank}º</strong></article><article><span>JOGOS DA LIGA</span><strong>{leagueMatches.length}</strong></article></div><div className="team-form-strip">{career.teamEvolution.slice(-10).map(item => <span className={item.form === 3 ? 'win' : item.form === 1 ? 'draw' : 'loss'} key={item.event} title={`Evento ${item.event}`} />)}</div></section></div>
  </section>
}
