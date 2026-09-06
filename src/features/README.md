# Carreiras e mundo compartilhado

- model.ts: clubes e atletas fictícios, carreira e migração de salvamento local.
- types.ts: formações, eventos e registro de partida, sem dependência de React.
- football.ts: escalação, adequação à posição, força e simulação injetável.
- Lineup.tsx: prancheta e trocas antes da partida.
- Friendly.tsx: pré-jogo, lances, placar, notas e conclusão de amistosos.
- season.ts: preparação, energia, desgaste e transições de dias.
- Schedule.tsx: agenda, treinos e histórico de resultados.

coach está ativo. player e director permanecem no catálogo, sem regras próprias.
Eventos referenciam atletas por IDs estáveis. A partida guarda o time e a formação
usados no início, permitindo reaproveitar desempenho e resultados no futuro modo
jogador e na avaliação de elenco do dirigente.

Próximas etapas: competições oficiais e objetivos; depois progressão
individual (jogador) e economia/negociações (dirigente). Não duplicar o motor de
partidas por modo. Nenhum desses sistemas futuros está implementado agora.

## Competição

league.ts mantém calendário consultável, transição para liga, classificação e
registro dos dois resultados de cada rodada. League.tsx apresenta tabela,
confrontos e objetivos da diretoria. Os mesmos atletas e o motor de partidas são
usados na liga e na pré-temporada; nenhum sistema paralelo por modo foi criado.

progression.ts deriva estatísticas dos eventos e notas das partidas oficiais,
aplica evolução permanente e arquiva a temporada. SeasonReview.tsx apresenta o
relatório e a confirmação para iniciar outra temporada. A base individual pode
ser reutilizada futuramente pelo modo jogador, sem duplicar as regras de partida.

matchEngine.ts resolve os próximos lances conforme a postura ativa, controla até
três substituições, calcula minutos disputados e finaliza as notas. O componente
MatchManagement.tsx expõe essas decisões durante a partida com os efeitos
explicados. Lances já revelados permanecem imutáveis.

transfers.ts concentra orçamento, salários, contratos, compras, vendas e
renovações. Market.tsx apresenta a central de negociações. O elenco salvo na
carreira alimenta escalação, treinos, partidas e evolução, permitindo que os
mesmos sistemas financeiros sejam reutilizados no futuro modo dirigente.

board.ts registra uma avaliação única depois de cada rodada oficial, combinando
resultado, posição, meta e situação financeira. BoardPanel.tsx explica cada
variação de confiança e encerra o comando quando o treinador é demitido.

availability.ts resolve cartões e lesões ao fim da partida, controla ausências por
número de jogos e impede atletas indisponíveis de entrar em campo. MedicalPanel.tsx
apresenta o boletim completo do elenco e os riscos disciplinares.
