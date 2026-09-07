# Plano de evolução antes da versão final

Este ciclo corrige os pontos encontrados nos testes de uso antes da modernização
visual final. Cada entrega entra na `dev-career`, recebe testes e gera uma prévia
separada no Cloudflare.

## Diagnóstico

### Mercado

O mercado atual usa uma lista fixa de oito atletas. Compra, venda e renovação são
ações imediatas, sem pesquisa, conhecimento parcial, proposta ou contraproposta.
Isso elimina a descoberta de talentos e quase todas as decisões de negociação.

### Troca de clube do treinador

O motor sabe montar o elenco e trocar o `clubId`, mas a interface anuncia sucesso
mesmo quando uma condição interna rejeita a operação. A transição também precisa
ser tratada como uma única operação: clube, elenco, escalação, orçamento, diretoria,
treinos e salvamento devem mudar juntos e a tela precisa levar o treinador ao novo
centro de comando.

### Escalação e tática

A troca atual começa pela seleção de uma posição no campo e exige que o usuário
deduza quem já é titular. Faltam estados visuais claros, filtros, comparação direta,
funções táticas e uma revisão pré-jogo.

### Treinamento

Técnica, físico e entrosamento são bônus globais com limites muito baixos. Depois de
poucos treinos, o sistema deixa de oferecer progressão relevante durante uma liga de
38 rodadas.

## Ordem de implementação

### Edição 17 — Troca de clube e nova central de escalação

1. Fazer a aceitação de proposta retornar sucesso ou motivo de bloqueio.
2. Aplicar a mudança de clube de forma atômica e salvar imediatamente.
3. Redirecionar para a visão geral do novo clube e mostrar um cartão de apresentação.
4. Preservar temporadas, conquistas e estatísticas do treinador.
5. Criar teste de aceitação, recarregamento do navegador e permanência no novo clube.
6. Redesenhar a escalação com estados visuais para titular, reserva, indisponível e
   selecionado.
7. Adicionar filtros por posição, comparação lado a lado, troca direta e escalação
   automática.
8. Exibir alertas de goleiro, posição incompatível, energia baixa, lesão e suspensão.
9. Criar revisão pré-jogo com onze inicial, banco, força, energia e pendências.
10. Ampliar a tática com pressão, linha defensiva, largura, ritmo e instruções por
    função, sempre explicando o efeito de cada escolha.

**Concluído quando:** a troca de clube sobrevive ao recarregamento e qualquer jogador
consegue entender em poucos segundos quem é titular, quem está no banco e por que uma
escalação é válida ou inválida.

### Edição 18 — Centro de treinamento para a temporada inteira

1. Substituir os bônus `3/3` e `6/6` por condição contínua de 0 a 100.
2. Separar ritmo, preparo físico, entrosamento, moral e carga de trabalho.
3. Fazer os efeitos crescerem e caírem gradualmente, evitando bônus permanentes.
4. Criar microciclos semanais: recuperação, físico, técnica, tática e coletivo.
5. Permitir foco por setor e foco individual em atletas selecionados.
6. Relacionar carga alta com fadiga e risco de lesão.
7. Relacionar descanso com recuperação e possível perda de ritmo.
8. Exibir previsão do efeito antes da confirmação e relatório depois do treino.
9. Adaptar o calendário às 38 rodadas e à Copa do Brasil.
10. Migrar saves atuais sem apagar energia, calendário ou progresso.

**Concluído quando:** sempre existe uma decisão útil de treino durante toda a temporada
e nenhuma barra chega cedo a um limite permanente.

### Edição 19 — Rede de observação e busca de atletas

1. Abrir para pesquisa todos os atletas ativos do universo, respeitando clube atual,
   idade e aposentadoria.
2. Adicionar busca por nome e filtros de posição, idade, nível, valor, salário, clube
   e situação contratual.
3. Criar lista de favoritos e comparação de até três atletas.
4. Contratar olheiros com qualidade, especialidade, salário e área de atuação.
5. Criar missões por posição, faixa etária, região e perfil.
6. Fazer relatórios levarem ciclos para serem concluídos.
7. Esconder parte dos dados antes da observação e revelar nível, potencial, valor e
   adequação tática conforme o conhecimento aumenta.
8. Fazer a qualidade do olheiro reduzir incerteza e melhorar recomendações.
9. Integrar jovens da base e jogadores transferidos pelo computador.
10. Compartilhar a mesma base de mercado entre treinador e dirigente.

**Concluído quando:** o usuário consegue procurar qualquer atleta, descobrir novos
nomes por meio dos olheiros, favoritar e comparar opções antes de negociar.

### Edição 20 — Negociação completa de transferências e contratos

1. Criar estados de negociação: sondagem, proposta, análise, contraproposta,
   aceita, rejeitada, termos pessoais e conclusão.
2. Permitir compra definitiva e empréstimo.
3. No empréstimo, oferecer duração, divisão salarial, taxa e opção de compra.
4. Na compra, permitir valor inicial, parcelas, bônus por desempenho e percentual de
   venda futura.
5. Nos termos pessoais, negociar salário, duração, luvas e papel no elenco.
6. Fazer clube e agente avaliarem valor, necessidade do elenco, contrato, idade,
   interesse do atleta e reputação do projeto.
7. Permitir contrapropor, aceitar, rejeitar ou encerrar a conversa.
8. Nas saídas, colocar atleta à venda ou para empréstimo e receber propostas de mais
   de um clube.
9. Permitir comparar propostas, negociar valores e só concluir após confirmação.
10. Registrar todas as etapas e transferências no histórico do mundo.
11. Respeitar orçamento, folha, limite do elenco, janela e partidas em andamento.
12. Integrar o sistema ao Modo Dirigente e aos contratos do Modo Jogador.

**Concluído quando:** nenhuma contratação ou venda importante acontece com um único
clique e todas as condições financeiras aparecem antes da assinatura.

## Regras técnicas comuns

- Atualizar o formato do save com migração automática e sem perder carreiras atuais.
- Usar um único motor de mercado para treinador, jogador, dirigente e clubes da CPU.
- Separar decisões da interface para permitir testes determinísticos.
- Confirmar ações financeiras e mudanças de clube antes da conclusão.
- Mostrar o motivo exato de toda ação bloqueada.
- Manter controles utilizáveis por teclado, celular e tela grande.
- Criar testes de regressão para cada erro relatado e para cada fluxo financeiro.

## Sequência até a conclusão

1. Edição 17: troca de clube, escalação e táticas.
2. Edição 18: treinamento de longo prazo.
3. Edição 19: busca, olheiros e descoberta de talentos.
4. Edição 20: negociação, empréstimos e contratos.
5. Edição final: identidade visual, tutorial, acessibilidade, sincronização de save,
   proteção do acesso pessoal, equilíbrio geral e bateria final de testes.
