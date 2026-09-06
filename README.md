# VT27 Mode Career

Base inicial do simulador de carreira VT27, construída com React, TypeScript e Vite.
Primeiras telas: seleção de modos, criação de treinador, escolha de clube, painel,
elenco de 18 atletas, escalação interativa e primeiro amistoso simulado. Carreira salva apenas neste navegador.
Jogador e dirigente estão planejados. A simulação é simplificada; ainda não há autenticação; a Liga VT27 é a primeira competição oficial fictícia.

## Desenvolvimento local

Use Node.js 22.12 ou superior (linha 22 recomendada) e npm.

```sh
npm ci
npm run dev
```

Comandos disponíveis:

- `npm test`: valida escalação, simulação e migração/retomada de saves.
- `npm run lint`: verifica o código com Oxlint.
- `npm run typecheck`: verifica os tipos TypeScript.
- `npm run build`: verifica os tipos e gera a versão de produção em `dist/`.
- `npm run preview`: serve o build localmente.
- `npm run deploy`: gera o build e publica no Cloudflare Workers; exige autenticação.

## Estrutura

```text
src/
  app/       Composição e configuração da aplicação
  pages/     Telas da aplicação
  features/  Futuras funcionalidades, organizadas por domínio
  shared/    Componentes, tipos e utilitários compartilhados
  styles/    Estilos globais
  main.tsx   Entrada do React
public/      Arquivos estáticos
```

Crie módulos conforme as funcionalidades forem desenvolvidas. As pastas de domínio
estão reservadas, sem implementação antecipada de regras do simulador.

## Cloudflare

O repositório deve ser conectado ao projeto no painel do Cloudflare.
Use a raiz do repositório como diretório de trabalho e Node.js 22.

### Pages

- Branch de produção: `main`
- Framework: Vite
- Build command: `npm run build`
- Build output directory: `dist`

O Pages reconhece esta aplicação como SPA por não haver um `404.html` na saída.
Não use o comando de deploy do Workers no fluxo de Pages.

### Workers com arquivos estáticos

- Branch de produção: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Para versões de branches de preview, se habilitadas: `npm run build && npx wrangler versions upload`

O arquivo `wrangler.jsonc` define o nome `vt27-mode-career`, os arquivos em `dist`
e o fallback de navegação para a SPA. Se o Worker no painel tiver outro nome,
ajuste-o para corresponder à configuração. Não há Worker de backend nesta etapa.

Após receber este primeiro commit, volte ao build que falhou no Cloudflare e clique
em **Retry build**. Confira se o build usa o commit atual da `main`.

Documentação:
- https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/
- https://developers.cloudflare.com/workers/static-assets/

## Fluxo de trabalho

- `main`: base estável, usada em produção.
- `dev-career`: desenvolvimento e validação antes da integração à `main`.

A branch `dev-career` começa no mesmo commit inicial de `main`.
Use pull requests para integrar as próximas alterações. O workflow de CI executa
lint e build em pushes e pull requests dessas branches. Configure previews no
Cloudflare para validar mudanças antes de publicá-las em produção.

## Configuração e segredos

Nenhuma variável de ambiente é necessária nesta versão. Nunca versione tokens ou
credenciais. Variáveis com prefixo `VITE_` ficam públicas no código do navegador.

## Primeira experiência jogável

1. Crie ou continue uma carreira de treinador.
2. Em Prancheta, escolha a formação, clique em uma posição e selecione o atleta.
   São 11 titulares e 7 reservas. Goleiros só podem ocupar o gol.
3. Abra Amistoso, revise o time e inicie a partida.
4. Avance os nove lances ou veja o resultado final. Resultado e progresso ficam
   salvos no início e a cada avanço, impedindo novo sorteio ao recarregar.
5. Confira as notas e avance ao dia 02. Abra Calendário para escolher a preparação.
6. Complete os sete dias, com amistosos nos dias 1, 4 e 7 e quatro dias de treino.
   Os resultados arquivados permanecem disponíveis para consulta.

A força considera nível e adequação à posição. O motor cria nove oportunidades,
com posse da chance ponderada pela força e conversão de 30%. É uma simulação
inicial, não um modelo realista de futebol. Não existem substituições durante a
partida. O esquema e os titulares ficam congelados no registro desse amistoso.

Saves anteriores recebem automaticamente titulares e dia inicial. O armazenamento
continua local à origem do navegador: outro endereço de preview pode ter outro
save. Não há sincronização entre dispositivos.

## Preparação e calendário (edição 03)

- Sete dias de pré-temporada; conclusão no dia 8, sem avanço infinito.
- Uma atividade por dia livre: físico, técnico, tático ou recuperação.
- Energia individual de 0 a 100; ganho noturno de 8 ao avançar.
- Físico: energia -8, resistência +1 (máximo 3).
- Técnico: energia -10, nível efetivo +1 (máximo +3).
- Tático: energia -5, força coletiva +2 (máximo +6).
- Recuperação: energia +20, limitada a 100.
- No apito final, só titulares perdem 24 de energia, menos 2 por nível físico.
- A energia multiplica a força individual por 0,7 + 0,3 × energia/100.
- Calendário impede pular jogo pendente ou avançar sem atividade no dia livre.
- Saves anteriores são normalizados na leitura. Um amistoso já encerrado no dia 2
  é arquivado como dia 1; não aplicamos desgaste retroativo a partidas antigas.

Testes cobrem a semana completa com reload diário, migração, limites de energia,
treino único, bloqueio de avanço e aplicação única de desgaste no fim da partida.

## Liga VT27 (edição 04)

Após a pré-temporada, abra Liga VT27 e escolha Entrar na Liga. O dia 8 é de
preparação. São quatro clubes (incluindo Atlético do Vale), seis rodadas de ida e
volta nos dias 9, 12, 15, 18, 21 e 24. A temporada termina no dia 25.

- Vitória: 3 pontos; empate: 1 ponto.
- Desempate: pontos, vitórias, saldo, gols marcados e ordem alfabética.
- Cada rodada tem dois jogos. O jogo dos outros clubes é gerado no início da sua
  partida, persistido com ela e contabilizado apenas no apito final.
- Os eventos usam home como referência ao time do usuário; a tabela converte
  corretamente esses gols para mandante/visitante conforme o calendário.
- Mando de campo ainda não altera força ou probabilidade de vitória.
- Objetivos: Porto Azul campeão; Aurora e Vale no top 2; União da Serra no top 3.
- A avaliação da diretoria é informativa; ainda não há demissão, economia,
  rebaixamento ou renovação automática de temporada.
- O elenco, energia, preparação e histórico de amistosos são preservados.

Testes adicionais validam calendário equilibrado, pontuação, registro único da
rodada e a temporada completa até o dia 25 com recargas de save em cada dia.
