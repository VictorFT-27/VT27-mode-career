import { clubs, type Career } from './model'
import { boardTarget, standings, startLeague } from './league'
import { leagueDays, leagueRounds } from './types'

export function League({ career, onChange, onSchedule, onMatch, onReview }: { career: Career; onChange: (c: Career) => void; onSchedule: () => void; onMatch: () => void; onReview: () => void }) {
  const rows = standings(career.leagueResults ?? [])
  const rank = rows.findIndex(row => row.id === career.clubId) + 1
  const target = boardTarget(career.clubId)
  const games = rows.find(row => row.id === career.clubId)!.played
  const finished = games === leagueRounds.length
  const canStart = !career.leagueActive && career.day === 8 && career.history?.filter(item => item.day <= 7).length === 3
  return <section className="league-hub">
    <div className="league-hero"><div><p className="eyebrow">COMPETIÇÃO NACIONAL · TEMPORADA {career.seasonNumber ?? 1}</p><h2>Brasileirão Série A</h2><p>20 clubes. 38 rodadas. Um campeão.</p></div><span className="league-emblem" aria-hidden="true">Ⅰ</span></div>
    {!career.leagueActive ? <section className="panel league-entry">
      <h2>{canStart ? 'A preparação acabou. Agora vale pontos.' : 'O Brasileirão está chegando.'}</h2>
      <p>Leve seu elenco e sua preparação para 38 rodadas. Vitória vale 3 pontos; empate, 1. Complete a pré-temporada para entrar.</p>
      <button className="primary" onClick={() => { if (canStart) onChange(startLeague(career)); onSchedule() }}>{canStart ? 'Entrar no Brasileirão →' : 'Continuar a pré-temporada →'}</button>
    </section> : <div className="league-summary">
      <article><span>SUA POSIÇÃO {games === 0 ? '· PROVISÓRIA' : ''}</span><strong>{rank}º</strong><small>{games} de {leagueRounds.length} partidas</small></article>
      <article><span>OBJETIVO DA DIRETORIA</span><strong>{target === 1 ? 'Ser campeão' : `Top ${target}`}</strong><small>{finished ? rank <= target ? 'Objetivo alcançado' : 'Objetivo não alcançado' : games === 0 ? 'Campanha ainda não iniciada' : rank <= target ? 'Dentro da meta neste momento' : 'Abaixo da meta neste momento'}</small></article>
      <article><span>{finished ? 'CAMPEÃO' : 'PRÓXIMO PASSO'}</span>{finished ? <><strong>{rows[0].name}</strong><small>Competição encerrada · resultados salvos</small><button className="primary" onClick={onReview}>Relatório da temporada →</button></> : <button className="primary" onClick={leagueDays.includes(career.day ?? 1) ? onMatch : onSchedule}>{leagueDays.includes(career.day ?? 1) ? 'Jogar rodada →' : 'Preparar o time →'}</button>}</article>
    </div>}
    <section className="panel league-table">
      <div className="section-heading"><h2>Classificação</h2><span className="muted">{finished ? 'Tabela final' : 'Atualizada ao encerrar cada rodada'}</span></div>
      <div className="table-wrap"><table><caption className="sr-only">Classificação do Brasileirão Série A</caption><thead><tr><th scope="col">Pos.</th><th scope="col">Clube</th><th scope="col">Pts</th><th scope="col">J</th><th scope="col">V</th><th scope="col">E</th><th scope="col">D</th><th scope="col">GP</th><th scope="col">GC</th><th scope="col">SG</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id} className={row.id === career.clubId ? 'your-club' : ''}><td>{index + 1}</td><th scope="row">{row.name}{row.id === career.clubId && <small> · SEU CLUBE</small>}</th><td><strong>{row.points}</strong></td><td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td><td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td>{row.difference > 0 ? '+' : ''}{row.difference}</td></tr>)}</tbody></table></div>
      <p className="muted">Pts: pontos · J: jogos · V/E/D: vitórias, empates e derrotas · GP/GC: gols pró e contra · SG: saldo.</p>
      <details className="rules-explainer"><summary>Como funciona a liga e o desempate?</summary><p>Os 20 clubes se enfrentam em turno e returno. A classificação considera, nesta ordem: pontos, vitórias, saldo de gols e gols marcados. Persistindo igualdade, usamos ordem alfabética nesta versão.</p><p>Os outros nove jogos de cada rodada são simulados e salvos junto com o seu. A tabela só contabiliza a rodada quando sua partida termina. O mando de campo define o calendário, mas ainda não dá bônus na simulação.</p></details>
    </section>
    <section className="rounds-grid">{leagueRounds.map((pairs, index) => <article className="panel round-card" key={index}><div className="section-heading"><h3>Rodada {index + 1}</h3><span className="badge">DIA {leagueDays[index]}</span></div>{pairs.map(([home, away]) => { const result = career.leagueResults?.find(item => item.round === index + 1 && item.home === home); return <div className="fixture-line" key={home}><span>{clubs.find(club => club.id === home)?.name}</span><strong>{result ? `${result.homeGoals} : ${result.awayGoals}` : '×'}</strong><span>{clubs.find(club => club.id === away)?.name}</span></div> })}</article>)}</section>
  </section>
}
