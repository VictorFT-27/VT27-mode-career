# Carreiras e mundo compartilhado

- model.ts: clubes e atletas fictícios, carreira e migração de salvamento local.
- types.ts: formações, eventos e registro de partida, sem dependência de React.
- football.ts: escalação, adequação à posição, força e simulação injetável.
- Lineup.tsx: prancheta e trocas antes da partida.
- Friendly.tsx: pré-jogo, lances, placar, notas e avanço para o segundo dia.

coach está ativo. player e director permanecem no catálogo, sem regras próprias.
Eventos referenciam atletas por IDs estáveis. A partida guarda o time e a formação
usados no início, permitindo reaproveitar desempenho e resultados no futuro modo
jogador e na avaliação de elenco do dirigente.

Próximas etapas: treinos, fadiga, calendário e novas partidas; depois progressão
individual (jogador) e economia/negociações (dirigente). Não duplicar o motor de
partidas por modo. Nenhum desses sistemas futuros está implementado agora.
