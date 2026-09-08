# VT27 Mode Career

Versão 1.0 do simulador de carreira com três modos jogáveis: treinador, jogador e
dirigente. O projeto inclui competições nacionais, mercado completo, olheiros,
treinamento contínuo, mundo persistente, tutorial, backup e proteção local por PIN.

O histórico completo das entregas está em [ROADMAP.md](ROADMAP.md).

## Modo dirigente (edição 16)

O terceiro modo de carreira transforma o clube em um projeto de longo prazo. Cada
carreira usa um save próprio e começa com o elenco, orçamento, folha e metas da equipe
escolhida.

- Contratação e avaliação de treinadores com perfis, qualidade e salários diferentes.
- Dez ciclos executivos por temporada, com resultados, receitas e despesas automáticas.
- Metas esportivas, financeiras e de formação avaliadas pelo conselho.
- Mercado com atletas reais, limite de elenco, orçamento e controle da folha.
- Quatro estruturas evolutivas: treinamento, base, departamento médico e observação.
- Promoção de jovens e efeito da academia na qualidade dos atletas formados.
- Relatório anual e continuidade plurianual de elenco, estrutura, treinador e saldo.

## Modo jogador (edição 15)

O segundo modo de carreira já pode ser jogado sem apagar o progresso do treinador.
Você cria uma promessa de 17 anos, escolhe posição, camisa e clube formador e disputa
temporadas diretas de 12 rodadas.

- Quatro tipos de treino individual desenvolvem atributos, ritmo e confiança.
- A escalação reage ao desempenho: fora da lista, banco de reservas ou titular.
- Cada rodada oferece uma decisão de postura com efeitos em nota, gols e assistências.
- Experiência gera pontos livres para personalizar seis atributos do atleta.
- Estatísticas e temporadas ficam guardadas na linha do tempo da carreira.
- Ao fim da temporada, é possível renovar, cumprir o vínculo ou aceitar transferência.

## Temporada nacional, história e mundo persistente (edição 14)

O pacote nacional traz os 20 participantes da Série A 2026, cada um com 18 atletas
vinculados ao próprio clube: são 360 jogadores na base inicial. O mercado também
usa atletas desses elencos. Níveis, valores e salários são estimativas internas
criadas para o equilíbrio do simulador e não representam dados oficiais.

- Uma nova carreira recebe automaticamente o elenco do clube escolhido.
- Saves antigos mantêm treinador, clube, elenco, contratos e evolução. Uma liga curta
  que esteja em andamento recomeça na pré-temporada para entrar no novo calendário.
- O Brasileirão usa turno e returno, com 38 rodadas e dez partidas por rodada.
- A Copa do Brasil reúne os 20 clubes da Série A e 12 classificados reais de outras
  divisões. Há ida e volta da 5ª fase até a semifinal, pênaltis em empate agregado e
  final em jogo único.
- Avançar na copa rende premiações ao orçamento. O chaveamento muda a cada temporada.
- A área Estatísticas registra gols, assistências, notas, recordes, títulos e conquistas
  ao longo de toda a carreira.
- Uma carreira antiga entra na próxima fase disponível da Copa sem perder o progresso.
- Na troca de temporada, os clubes controlados pelo jogo negociam atletas entre si.
- Idades avançam, veteranos se aposentam e as mudanças permanecem no save.
- Três jovens gerados pela base podem ser promovidos ao profissional por temporada.
- O desempenho libera propostas de outros clubes; trocar de equipe preserva todo o
  histórico, as conquistas e as temporadas anteriores do treinador.

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
histórico das reuniões realizadas depois de cada rodada do Brasileirão.

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
Carreira salva apenas neste navegador. Jogador e dirigente estão planejados. A
simulação continua em evolução e ainda não há autenticação ou sincronização entre
dispositivos.

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
6. Complete os sete dias, inicie a temporada nacional e acompanhe Brasileirão e
   Copa do Brasil pelo calendário.
7. Abra Estatísticas para acompanhar artilharia, assistências, recordes e conquistas.

A força considera nível e adequação à posição. O motor cria nove oportunidades,
com posse da chance ponderada pela força e conversão de 30%. É uma simulação
inicial, ainda distante de um modelo completo do futebol real.

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

## Brasileirão Série A (edição 11)

Após a pré-temporada, abra Brasileirão e escolha entrar na competição. O dia 8 é de
preparação. São 20 clubes, 38 rodadas de turno e returno e avaliação final no dia 121.

- Vitória: 3 pontos; empate: 1 ponto.
- Desempate: pontos, vitórias, saldo, gols marcados e ordem alfabética.
- Cada rodada tem dez jogos. Os outros nove resultados são gerados no início da sua
  partida, persistidos com ela e contabilizados apenas no apito final.
- Os eventos usam home como referência ao time do usuário; a tabela converte
  corretamente esses gols para mandante/visitante conforme o calendário.
- Mando de campo ainda não altera força ou probabilidade de vitória.
- As metas variam entre disputar o título, buscar vagas na parte alta e permanecer
  na Série A. Resultados, posição e finanças alteram a confiança da diretoria.
- O elenco, energia, preparação e histórico de amistosos são preservados.

Testes adicionais validam calendário equilibrado, pontuação, registro único da
rodada e a temporada completa até o dia 121 com recargas de save em cada dia.

## Continuidade da carreira (edição 05)

A área Temporada apresenta pontos, avaliação da diretoria, jogos oficiais, gols,
notas médias e evolução prevista para cada atleta. Após a 38ª rodada, avance ao
dia 121 para confirmar a próxima temporada.

- Pelo menos 3 titularidades na liga: +1 de nível individual.
- Com média de notas >= 7,50: +2, em vez de +1.
- Teto de evolução acumulada: +10 por atleta. Sem ganho por amistosos.
- Os ganhos só são aplicados na transição, uma vez por temporada.
- Nível individual permanente entra no cálculo de força e aparece no elenco e
  na prancheta. Bônus coletivo de treino técnico continua separado.
- Nova temporada preserva treinador, clube, formação, escalação e evolução.
- Energia volta a 100; calendário, preparação e tabela recomeçam no dia 1.
- O arquivo guarda tabela, partidas, notas e ganhos de cada temporada concluída.
- Formato da liga e clubes continuam iguais; envelhecimento e aposentadoria ainda
  não são simulados.

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

## Edição 23 — mercado de profissionais

- Treinador: abra **Mercado** e escolha **Minha carreira** para negociar uma mudança de clube durante a temporada.
- Jogador: abra **Contrato** para consultar propostas periódicas ou escolher um destino e abrir uma conversa.
- Dirigente: abra **Negociações** para contratar atletas/técnicos, vender atletas ou negociar seu próprio cargo.
- Edite compensação, salário mensal, duração e multa do novo contrato. Envie a proposta, revise a contraproposta e assine em uma etapa separada.
- Cobrir a multa atual resolve a compensação ao clube; os termos pessoais ainda precisam ser aceitos.
- Contratar um treinador inclui a rescisão do atual. Compras respeitam orçamento, folha e tamanho do elenco.
- As partidas antigas guardam o clube representado. Mudanças do modo jogador preservam rodadas, tabela e números pessoais; projetos do dirigente são guardados ao sair.
- Os três modos compartilham as regras de negociação, mas continuam com saves independentes. Valores são estimativas do simulador.
- As Edições 21 e 22 incluem a Liga de 38 rodadas, Copa, Vestiário, metas, moral, forma, recuperação e decisões da carreira de jogador.

Verificação: 62 testes automatizados e compilação de produção. Próximas entregas: Edição 24 (fichas e comparação) e Edição 25 (encerramento ilustrado).
