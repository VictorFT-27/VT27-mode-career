# VT27 Mode Career

O escopo completo e a ordem das próximas entregas estão em [ROADMAP.md](ROADMAP.md).

## Futebol brasileiro real (edição 10)

O primeiro pacote de dados reais traz Flamengo, Palmeiras, Corinthians e São Paulo,
cada um com 18 atletas vinculados ao próprio clube. O mercado também passa a usar
nomes reais. Níveis, valores e salários são estimativas internas criadas para o
equilíbrio do simulador e não representam dados oficiais.

- Uma nova carreira recebe automaticamente o elenco do clube escolhido.
- Saves do antigo universo fictício são convertidos para os clubes e atletas reais,
  preservando treinador, calendário, evolução e histórico sempre que válido.
- A Liga VT27 mantém o formato atual de quatro clubes e seis rodadas nesta etapa.
- Os demais clubes brasileiros serão adicionados em novos pacotes de dados sem
  misturar a base de jogadores com as regras do jogo.

## Mercado e contratos (edição 07)

A área Mercado transforma o elenco em parte persistente da carreira. Cada clube
começa com orçamento e limite salarial próprios. O treinador pode contratar entre
oito atletas observados, vender reservas e acompanhar contratos e movimentações.

- O elenco aceita de 16 a 23 atletas.
- Uma contratação desconta o valor integral e adiciona o salário à folha.
- Uma venda rende 85% do valor estimado; titulares precisam ir ao banco primeiro.
- Contratos novos duram três temporadas.
- Ao iniciar outra temporada, todos os contratos perdem um ano.
- Um contrato com uma temporada restante pode ser renovado por três temporadas,
  usando 10% do valor estimado como custo.
- Negociações ficam bloqueadas durante partidas em andamento.

Valores e salários são estimativas do simulador. Esta é a base econômica inicial;
receitas, propostas de outros clubes e negociação de valores entram em etapas posteriores.

## Diretoria e confiança (edição 08)

A sala da Diretoria apresenta uma meta mensurável, confiança de 0 a 100 e o
histórico das reuniões realizadas depois de cada rodada da Liga VT27.

- Vitória começa com +8, empate com +2 e derrota com −10.
- Estar dentro da meta soma +3; ficar abaixo dela tira 4.
- Finanças controladas podem somar 1; usar mais de 95% da folha tira 3.
- Não alcançar a meta na última rodada tira mais 8.
- De 65 a 100, o treinador tem prestígio; de 45 a 64, estabilidade; de 21 a 44,
  trabalha sob pressão; com 20 ou menos, é demitido.
- Uma rodada é avaliada somente uma vez, mesmo após salvar e recarregar.
- Uma demissão encerra as ações daquela carreira e preserva o histórico para
  consulta.

## Departamento médico e disciplinar (edição 09)

Partidas agora podem gerar cartões e lesões persistentes. A área Departamento
mostra a condição completa do elenco e ajuda o treinador a preparar substitutos.

- Cada jogo pode registrar até dois cartões amarelos.
- O terceiro amarelo gera suspensão automática de uma partida e zera a contagem.
- Existe 18% de chance básica de uma lesão ao final da partida.
- Uma lesão afasta o atleta por uma ou duas partidas.
- Atletas lesionados ou suspensos não podem começar nem entrar durante o jogo.
- A partida fica bloqueada enquanto houver um indisponível entre os titulares.
- Cada partida concluída reduz uma partida das ausências anteriores.
- Contratações chegam disponíveis; uma nova temporada zera o boletim médico e
  disciplinar.

Base inicial do simulador de carreira VT27, construída com React, TypeScript e Vite.
Primeiras telas: seleção de modos, criação de treinador, escolha de clube, painel,
elenco de 18 atletas, escalação interativa e primeiro amistoso simulado. Carreira salva apenas neste navegador.
Jogador e dirigente estão planejados. A simulação é simplificada; ainda não há autenticação; a Liga VT27 é a primeira competição do protótipo.

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
preparação. São quatro clubes reais, seis rodadas de ida e
volta nos dias 9, 12, 15, 18, 21 e 24. A temporada chega à avaliação final no dia 25.

- Vitória: 3 pontos; empate: 1 ponto.
- Desempate: pontos, vitórias, saldo, gols marcados e ordem alfabética.
- Cada rodada tem dois jogos. O jogo dos outros clubes é gerado no início da sua
  partida, persistido com ela e contabilizado apenas no apito final.
- Os eventos usam home como referência ao time do usuário; a tabela converte
  corretamente esses gols para mandante/visitante conforme o calendário.
- Mando de campo ainda não altera força ou probabilidade de vitória.
- Objetivos: Flamengo campeão; Palmeiras e Corinthians no top 2; São Paulo no top 3.
- A avaliação da diretoria é informativa; ainda não há demissão, economia,
  rebaixamento ou renovação automática de temporada.
- O elenco, energia, preparação e histórico de amistosos são preservados.

Testes adicionais validam calendário equilibrado, pontuação, registro único da
rodada e a temporada completa até o dia 25 com recargas de save em cada dia.

## Continuidade da carreira (edição 05)

A área Temporada apresenta pontos, avaliação da diretoria, jogos oficiais, gols,
notas médias e evolução prevista para cada atleta. Após a sexta rodada, avance ao
dia 25 para confirmar a próxima temporada.

- Pelo menos 3 titularidades na liga: +1 de nível individual.
- Com média de notas >= 7,50: +2, em vez de +1.
- Teto de evolução acumulada: +10 por atleta. Sem ganho por amistosos.
- Os ganhos só são aplicados na transição, uma vez por temporada.
- Nível individual permanente entra no cálculo de força e aparece no elenco e
  na prancheta. Bônus coletivo de treino técnico continua separado.
- Nova temporada preserva treinador, clube, formação, escalação e evolução.
- Energia volta a 100; calendário, preparação e tabela recomeçam no dia 1.
- O arquivo guarda tabela, partidas, notas e ganhos de cada temporada concluída.
- Formato da liga e clubes continuam iguais; idades, transferências, aposentadoria
  e demissão ainda não são simulados.

Saves anteriores assumem temporada 1 e evolução zero. O formato continua usando a
mesma chave local. Testes incluem duas temporadas completas, preservação do
arquivo, bloqueio de transição antecipada e limites de evolução.

## Comando durante a partida (edição 06)

- Posturas defensiva, equilibrada e ofensiva afetam somente os próximos lances.
- Até três substituições depois do primeiro lance e antes do apito final.
- Goleiros só podem trocar com goleiros; um atleta substituído não retorna.
- O próximo possível autor de uma jogada é escolhido entre quem está em campo.
- Energia e notas consideram os minutos disputados por titulares e reservas.
- Lances revelados permanecem imutáveis ao trocar a postura.
- Partidas antigas continuam válidas com postura equilibrada e sem substituições.
