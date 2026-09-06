# Carreiras e próximos modos

O catálogo de modos usa identificadores estáveis: coach, player e director.
Apenas coach pode criar uma carreira nesta versão. Dados de clubes e atletas
são demonstrativos e ficam separados da composição visual em career/model.ts.

## Próximas etapas

- Treinador: escalação individual, treinos, calendário e primeiro amistoso.
- Jogador: perfil, posição, evolução individual e decisões de carreira.
- Dirigente: orçamento, negociações e objetivos do clube.
- Mundo compartilhado: clubes, atletas, calendário e resultados devem ter uma
  única fonte de dados, consumida pelas regras de cada modo.

Ainda não existem motores de simulação nem sistemas econômicos.
A formação é uma preferência salva, sem efeitos em resultados.
O salvamento v1 é local ao navegador/origem; previews diferentes podem ter saves
separados. Uma futura migração para persistência remota deve preservar versões.
