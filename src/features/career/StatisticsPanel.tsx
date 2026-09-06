import { allClubs, allPlayers, type Career } from './model'
import { standings } from './league'

function finishedMatches(career: Career) {
  const archived = (career.archives ?? []).flatMap(season => season.matches.map(item => ({ ...item, season: season.number })))
  const current = (career.history ?? []).map(item => ({ ...item, season: career.seasonNumber ?? 1 }))
  if (career.match?.cursor === 9 && !current.some(item => item.day === career.day)) current.push({ day: career.day ?? 1, match: career.match, season: career.seasonNumber ?? 1 })
  return [...archived, ...current]
}

function careerStatistics(career: Career) {
  const matches = finishedMatches(career)
  const official = matches.filter(item => item.day > 7)
  const scoreOf = (item: typeof matches[number]) => ({ own: item.match.events.filter(event => event.goal && event.side === 'home').length, rival: item.match.events.filter(event => event.goal && event.side === 'away').length })
  const wins = matches.filter(item => { const score = scoreOf(item); return score.own > score.rival }).length
  const goals = matches.reduce((sum, item) => sum + scoreOf(item).own, 0)
  const conceded = matches.reduce((sum, item) => sum + scoreOf(item).rival, 0)
  const players = allPlayers.map(player => {
    const appearances = official.filter(item => item.match.ratings.some(rating => rating.playerId === player.id))
    const ratings = appearances.flatMap(item => item.match.ratings.filter(rating => rating.playerId === player.id).map(rating => rating.value))
    return { id: player.id, name: player.name, position: player.position, appearances: appearances.length, goals: official.reduce((sum, item) => sum + item.match.events.filter(event => event.goal && event.side === 'home' && event.playerId === player.id).length, 0), assists: official.reduce((sum, item) => sum + item.match.events.filter(event => event.goal && event.side === 'home' && event.assistPlayerId === player.id).length, 0), average: ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : null }
  }).filter(player => player.appearances || player.goals || player.assists).sort((a, b) => b.goals - a.goals || b.assists - a.assists || (b.average ?? 0) - (a.average ?? 0))
  const biggest = matches.filter(item => { const score = scoreOf(item); return score.own > score.rival }).reduce<typeof matches[number] | undefined>((best, item) => { const score = scoreOf(item); const previous = best ? scoreOf(best) : undefined; return !best || score.own - score.rival > previous!.own - previous!.rival || score.own - score.rival === previous!.own - previous!.rival && score.own > previous!.own ? item : best }, undefined)
  const leagueTitles = (career.archives ?? []).filter(season => standings(season.results)[0]?.id === career.clubId).length
  const cupTitles = [...(career.archives ?? []).map(season => season.cup), career.cup].filter(cup => cup?.champion === career.clubId).length
  const recent = matches.slice(-5)
  const unbeatenFive = recent.length === 5 && recent.every(item => { const score = scoreOf(item); return score.own >= score.rival })
  const achievements = [
    { name: 'Primeiros 90 minutos', detail: 'Concluir a primeira partida', unlocked: matches.length >= 1 },
    { name: 'Primeira vitória', detail: 'Vencer uma partida', unlocked: wins >= 1 },
    { name: 'Sequência invicta', detail: 'Ficar cinco jogos sem perder', unlocked: unbeatenFive },
    { name: 'Ataque em alta', detail: 'Marcar 25 gols na carreira', unlocked: goals >= 25 },
    { name: 'Rei do Brasil', detail: 'Conquistar o Brasileirão', unlocked: leagueTitles >= 1 },
    { name: 'Mata-mata perfeito', detail: 'Conquistar a Copa do Brasil', unlocked: cupTitles >= 1 },
  ]
  return { matches, official, wins, goals, conceded, players, biggest, leagueTitles, cupTitles, achievements, scoreOf }
}

export function StatisticsPanel({ career }: { career: Career }) {
  const stats = careerStatistics(career)
  const biggestScore = stats.biggest ? stats.scoreOf(stats.biggest) : undefined
  const bestFinish = (career.archives ?? []).reduce<number | undefined>((best, season) => { const position = standings(season.results).findIndex(row => row.id === season.clubId) + 1; return best === undefined || position < best ? position : best }, undefined)
  return <section className="statistics-hub"><div className="stats-hero"><div><p className="eyebrow">MEMÓRIA DA CARREIRA</p><h2>Números que contam sua história.</h2><p>Partidas, protagonistas, recordes e conquistas acompanham você temporada após temporada.</p></div><strong>{stats.matches.length}<small> JOGOS</small></strong></div>
    <div className="season-stats career-numbers"><article><span>VITÓRIAS</span><strong>{stats.wins}</strong></article><article><span>GOLS MARCADOS</span><strong>{stats.goals}</strong></article><article><span>GOLS SOFRIDOS</span><strong>{stats.conceded}</strong></article><article><span>TÍTULOS</span><strong>{stats.leagueTitles + stats.cupTitles}</strong></article></div>
    <div className="stats-layout"><section className="panel"><div className="section-heading"><h2>Artilharia e assistências</h2><span className="muted">Jogos oficiais da carreira</span></div>{!stats.players.length ? <p className="muted">Os números individuais começam no primeiro jogo oficial.</p> : <div className="table-wrap"><table><thead><tr><th>Atleta</th><th>J</th><th>G</th><th>A</th><th>Nota</th></tr></thead><tbody>{stats.players.slice(0, 12).map((player, index) => <tr key={player.id}><th><span className="ranking-number">{index + 1}</span>{player.name}<small className="stat-position">{player.position}</small></th><td>{player.appearances}</td><td><strong>{player.goals}</strong></td><td>{player.assists}</td><td>{player.average === null ? '—' : player.average.toFixed(2)}</td></tr>)}</tbody></table></div>}</section>
      <section className="panel record-panel"><p className="eyebrow">LIVRO DE RECORDES</p><div className="record-list"><div><span>Maior vitória</span><strong>{stats.biggest && biggestScore ? `${biggestScore.own} × ${biggestScore.rival}` : '—'}</strong><small>{stats.biggest ? `T${stats.biggest.season} · contra ${allClubs.find(club => club.id === stats.biggest!.match.opponent)?.name}` : 'Aguardando partida'}</small></div><div><span>Melhor posição na liga</span><strong>{bestFinish ? `${bestFinish}º` : '—'}</strong><small>{bestFinish === 1 ? 'Campeão brasileiro' : 'Temporadas encerradas'}</small></div><div><span>Títulos nacionais</span><strong>{stats.leagueTitles} liga · {stats.cupTitles} copa</strong><small>Taças conquistadas na carreira</small></div><div><span>Jogos oficiais</span><strong>{stats.official.length}</strong><small>Brasileirão e Copa do Brasil</small></div></div></section></div>
    <section className="panel"><div className="section-heading"><h2>Sala de conquistas</h2><span className="muted">{stats.achievements.filter(item => item.unlocked).length}/{stats.achievements.length} desbloqueadas</span></div><div className="achievement-grid">{stats.achievements.map((item, index) => <article className={item.unlocked ? 'achievement unlocked' : 'achievement'} key={item.name}><span aria-hidden="true">{item.unlocked ? '◆' : '◇'}</span><div><small>CONQUISTA {String(index + 1).padStart(2, '0')}</small><h3>{item.name}</h3><p>{item.detail}</p></div></article>)}</div></section>
    <details className="rules-explainer"><summary>O que entra nas estatísticas?</summary><p>Artilharia, assistências e notas contam apenas Brasileirão e Copa do Brasil. Os recordes gerais também consideram amistosos. O histórico permanece salvo quando uma nova temporada começa.</p></details>
  </section>
}
