import { boardOf } from './board'
import { boardTarget, standings } from './league'
import { clubs, type Career } from './model'
import { financesOf, wageUsed } from './transfers'

const labels = { secure: 'Prestígio alto', stable: 'Trabalho estável', pressure: 'Sob pressão', dismissed: 'Demitido' }
export function BoardPanel({ career, onExit }: { career: Career; onExit: () => void }) {
  const board = boardOf(career)
  const target = boardTarget(career.clubId)
  const table = standings(career.leagueResults ?? [])
  const rank = table.findIndex(row => row.id === career.clubId) + 1
  const own = table.find(row => row.id === career.clubId)!
  const finances = financesOf(career)
  const wages = wageUsed(career)
  return <div className={`board-center board-${board.status}`}>
    <section className="board-hero"><div><p className="eyebrow">SALA DA DIRETORIA</p><h2>{board.status === 'dismissed' ? 'Fim de ciclo.' : 'Resultados constroem confiança.'}</h2><p>{board.status === 'dismissed' ? `A diretoria do ${clubs.find(club => club.id === career.clubId)?.name} encerrou seu trabalho.` : 'O clube acompanha desempenho esportivo, objetivo da temporada e responsabilidade financeira.'}</p></div><div className="confidence-ring" style={{ '--confidence': `${board.confidence * 3.6}deg` } as React.CSSProperties}><strong>{board.confidence}</strong><span>CONFIANÇA</span></div></section>
    {board.status === 'dismissed' && <section className="dismissal-panel panel"><p className="eyebrow">COMUNICADO OFICIAL</p><h2>Você foi desligado do cargo.</h2><p>A confiança chegou à faixa crítica após as avaliações da liga. Sua carreira permanece salva para consulta, com resultados e movimentações registrados.</p><button className="primary" onClick={onExit}>Voltar aos modos de carreira →</button></section>}
    <div className="board-summary"><article><span>SITUAÇÃO DO TREINADOR</span><strong>{labels[board.status]}</strong><small>{board.status === 'pressure' ? 'Uma reação rápida é necessária.' : board.status === 'dismissed' ? 'O comando do time foi encerrado.' : 'A diretoria mantém apoio ao projeto.'}</small></article><article><span>OBJETIVO NA LIGA</span><strong>{target === 1 ? 'Ser campeão' : `Terminar no top ${target}`}</strong><small>{own.played ? `${rank}º lugar após ${own.played} de 6 jogos` : 'A liga ainda não começou'}</small></article><article><span>CONTROLE FINANCEIRO</span><strong>{Math.round(wages / finances.wageLimit * 100)}% da folha</strong><small>Orçamento atual: R$ {(finances.budget / 1000).toFixed(1).replace('.', ',')} mi</small></article></div>
    <section className="panel confidence-panel"><div className="section-heading"><div><p className="eyebrow">AVALIAÇÃO ATUAL</p><h2>Confiança da diretoria</h2></div><strong className="confidence-score">{board.confidence}/100</strong></div><div className="confidence-track"><span style={{ width: `${board.confidence}%` }} /></div><div className="confidence-scale"><span>0 · Demissão</span><span>21 · Pressão</span><span>45 · Estável</span><span>65 · Prestígio</span></div></section>
    <section className="panel"><div className="section-heading"><div><p className="eyebrow">REUNIÕES PÓS-RODADA</p><h2>Histórico de avaliações</h2></div><span className="muted">{board.history.length} de 6 rodadas avaliadas</span></div>{!board.history.length ? <p className="muted">A primeira avaliação será registrada ao terminar sua primeira partida da Liga VT27.</p> : <div className="board-history">{[...board.history].reverse().map(review => <article key={review.round}><span className={review.delta >= 0 ? 'review-positive' : 'review-negative'}>{review.delta >= 0 ? '+' : ''}{review.delta}</span><div><strong>Rodada {review.round} · {review.result === 'win' ? 'Vitória' : review.result === 'draw' ? 'Empate' : 'Derrota'} · {review.rank}º lugar</strong><p>{review.reason}</p></div><b>{review.confidence}</b></article>)}</div>}</section>
    <details className="rules-explainer"><summary>Como a confiança é calculada?</summary><p>Uma vitória começa com +8 pontos, empate com +2 e derrota com −10. Estar dentro da meta soma +3; ficar abaixo tira 4. Finanças controladas podem somar 1 ponto, enquanto usar mais de 95% da folha tira 3. Na última rodada, não alcançar o objetivo tira mais 8. A confiança fica entre 0 e 100 e a demissão acontece ao chegar a 20 ou menos.</p><p>Cada rodada é avaliada uma única vez. Amistosos e treinos não alteram diretamente a confiança nesta versão.</p></details>
  </div>
}
