# AGENTS.md

Guia operacional para agentes de IA neste repositório. Para contexto de domínio,
arquitetura detalhada e convenções de contribuição, consulte o `README.md`.

## Projeto

Front-end do Projeto Pandora — visualização e análise de citometria de fluxo.
React 18 + TypeScript (strict) + Vite + MUI 7 + Plotly + TanStack Query 5.

## Comandos

| Tarefa                | Comando                            |
| --------------------- | ---------------------------------- |
| Instalar dependências | `pnpm install`                     |
| Dev server            | `pnpm dev` → http://localhost:3000 |
| Typecheck             | `pnpm typecheck` (`tsc --noEmit`)  |
| Testes                | `pnpm test` (Vitest + jsdom)       |
| Build                 | `pnpm build` → saída em `build/`   |
| Dev com Docker        | `pnpm dev:docker`                  |

- Gerenciador de pacotes: **pnpm 12** (`packageManager` no package.json).
  Fonte de verdade é o `pnpm-lock.yaml` — não use `npm` nem `yarn`.
- Backend esperado em `http://localhost:8085`; configurar `VITE_API_URL` no `.env`
  (ver `.env.example`).

## Verificação obrigatória antes de concluir uma tarefa

O CI (`/.github/workflows/ci.yml`) **não** roda typecheck nem testes — ele só
builda e publica a imagem Docker. A verificação é responsabilidade local:

1. `pnpm typecheck` — sem erros
2. `pnpm test` — testes passando (existem poucos; adicione se criar lógica nova)
3. `pnpm build` — se a mudança afetar imports, config ou build

Pre-commit (husky): `lint-staged` aplica `prettier --write` nos arquivos
staged + `pnpm typecheck`; `commit-msg` valida conventional commits
(commitlint). Não há eslint configurado — `.prettierrc` é a referência de
estilo.

## Estilo de código

Definido pelo `.prettierrc` e observado no código existente:

- **Tabs** para indentação (`useTabs: true`, `tabWidth: 2`)
- **Sem ponto-e-vírgula** (`semi: false`)
- **Aspas duplas**, `arrowParens: "always"`, `bracketSpacing: true`
- TypeScript strict: evite `any`; prefira tipos específicos ou `unknown`
- `interface` para shapes de objeto; `type` para uniões discriminadas

## Convenções de organização

- Lógica de domínio em `src/features/<feature>/` (`hooks/`, `utils/`, `components/`)
- Páginas e layout em `src/components/` e `src/page/`
- Tipos compartilhados em `src/types/`; utilitários globais em `src/utils/`
- Barrel exports: cada módulo expõe via `index.ts`
- Data fetching **sempre** via TanStack Query — nunca `useState` + `useEffect` para API
- Funções puras em `utils/` (testáveis); estado/side-effects em custom hooks
- Testes colocados ao lado do código: `foo.ts` → `foo.test.ts`

## Regra de dependência (ADR-0001, ADR-0008)

Dependência unidirecional: `components → hooks → services + núcleo`.

- **Núcleo** (`src/types/`, `src/utils/`, `src/features/*/utils/`): TS puro.
  **Proibido** importar `react`, `@mui/*`, `axios`, `plotly*` ou libs de UI —
  exceção apenas para `import type` de tipos de dados.
- **`src/services/`**: único lugar que fala HTTP (via `src/API`). Sem React.
- **Hooks/contexts**: única camada que conhece React; adaptam o núcleo.
- **Components/pages**: só renderização; nunca `axios` nem lógica de domínio
  duplicada.

Antes de codar em área de decisão arquitetural, consulte `docs/adr/` (índice em
`docs/README.md`).

## Peculiaridades (leia antes de mexer)

- `@mui/styled-engine` é **aliased** para `@mui/styled-engine-sc` em dois lugares:
  `vite.config.ts` (resolve.alias) e `tsconfig.path.json` (paths). Mudanças em
  styling do MUI precisam manter ambos consistentes.
- Build sai em `build/` (não `dist/`); dev e preview usam porta **3000**.
- Cliente HTTP centralizado em `src/API/` (Axios, `CytometryApi`).
- `tsconfig.tsbuildinfo` é gerado (incremental) — não edite.

## Git

- `main` é protegida — trabalhe em `feature/*` ou `devin/*`, nunca commit direto
- Commits semânticos em PT-BR: `feat: ...`, `fix: ...`, `refactor: ...`, `docs: ...`
- Push para `main` dispara build + deploy da imagem Docker no CI — trate como produção
- Adicione arquivos específicos ao commit; **não** use `git add .`

## Não faça

- Não commite `.env` ou credenciais
- Não adicione dependências sem necessidade clara — se for o caso, proponha antes
- Não faça force-push na `main` nem altere histórico
- Não introduza `useEffect` para data fetching, `any` gratuito ou componentes
  acima de ~300 linhas sem extrair sub-componentes
