# VT27 Mode Career

Base inicial do simulador de carreira VT27, construída com React, TypeScript e Vite.
Esta versão exibe somente uma tela de confirmação. Não há regras de jogo,
persistência, autenticação ou serviços externos implementados.

## Desenvolvimento local

Use Node.js 22.12 ou superior (linha 22 recomendada) e npm.

```sh
npm ci
npm run dev
```

Comandos disponíveis:

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
- Para versões de branches de preview, se habilitadas: `npx wrangler versions upload`

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
