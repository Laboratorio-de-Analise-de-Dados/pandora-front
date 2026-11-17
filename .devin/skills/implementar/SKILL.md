---
name: implementar
description: Implementar uma tarefa do board neste repo — TDD com Vitest, regra de dependência (components→hooks→services), dialogs/AppDialog e Trello atualizado
argument-hint: "<PRD/card: ex. FE-47>"
allowed-tools:
  - read
  - edit
  - grep
  - glob
  - exec
  - mcp_call_tool
  - mcp_list_tools
---

# Implementar — pandora-front (TDD + regras de arquitetura)

Implementação guiada por spec. O `AGENTS.md` é a referência operacional —
esta skill é o checklist de execução por cima dele. Convenções visuais
na skill `/ui-conventions`.

## 1. Contexto antes de codar (não pule)

- **`.scratch/tasks-<slug>.md` primeiro**: o plano de implementação
  (tasks ordenadas, testes, notas de execução) mora local e gitignored
  neste repo — leia-o em vez de abrir o card no MCP. Se não existir,
  ele deveria ter sido gerado pelo `/to-tickets`: peça o PRD e derive.
- **PRD → ADRs**: o card/PRD (`pandora-docs/prd/FE-XX-*.md`) linka ADRs
  (`docs/adr/` local, sensíveis em `pandora-docs/adr/front/`). Contrato
  de API do par BE-YY: ler o PRD do irmão antes de fixar tipos em
  `src/types/`.
- **`docs/TRACKER.md`**: frente ativa na mesma área = conflito —
  alinhe ou pegue outra. Registre sua linha no mesmo commit.
- **Branch**: `git checkout main && git pull` → `git checkout -b
feat|fix|refactor/<slug>`. Nunca mudança solta na `main`.
- **Card → 🔨 Em andamento** ao assumir (`/trello-board`).

## 2. TDD — ciclo obrigatório

1. **Lógica nova vira função pura testável primeiro**: escreva
   `foo.test.ts` (Vitest + jsdom, ao lado do código) com o caso de
   aceite que falha — utils de `src/features/*/utils/` e `src/utils/`
   são o alvo natural.
2. Rode e veja falhar: `pnpm test`.
3. Implemente até verde; refatore com teste passando.
4. A suite é pequena de propósito — lógica nova sem teste é regressão
   futura; bug reportado vira teste que reproduz + fix, nunca só patch.
5. Interação de componente (click, menu, dialog) que muda comportamento
   → teste de componente; estilo puro não precisa.

## 3. Security/architecture gates — checar antes de abrir PR

- [ ] Regra de dependência (ADR-0001/0008): núcleo (`types/`, `utils/`,
      `features/*/utils/`) **nunca** importa react/mui/axios/plotly;
      HTTP só em `src/services/` via `src/API`; hooks são a única
      camada que conhece React.
- [ ] Data fetching **só** TanStack Query — nunca `useState` +
      `useEffect` para API.
- [ ] Dialogs são componentes nossos (ADR-0014): `useConfirm()` /
      `AppDialog` — nunca `window.confirm/alert/prompt`, nunca `Dialog`
      MUI cru; ao tocar um existente, migrar.
- [ ] Mobile-first (ADR-0002): layout de `xs` pra cima, sem largura
      fixa que estoure em tela pequena.
- [ ] Datas no fuso do browser — `new Date(iso)` + `toLocale*`, nunca
      `timeZone` fixo nem string UTC crua.
- [ ] TS strict: sem `any` gratuito; `interface` para shapes, `type`
      para uniões discriminadas.
- [ ] Sem `.env`/credencial commitada; sem dependência nova sem
      necessidade clara (propor antes).
- [ ] Estilo: tabs, sem ponto-e-vírgula, aspas duplas (`.prettierrc`).

## 4. Verificação local (portão antes de concluir)

```bash
pnpm typecheck   # tsc --noEmit — sem erros
pnpm test        # vitest — verde
pnpm build       # se a mudança afetar imports/config/build
```

## 5. Fechamento — .scratch/ marca o dia a dia, Trello só os marcos

- Marque as tasks feitas no `.scratch/tasks-<slug>.md` local (o arquivo
  é seu caderno de execução — MCP não precisa ser chamado a cada task).
- **Marcos Trello** (única vez que o MCP entra): assumir → 🔨 Em
  andamento; PR aberto → comentário com o link + ✅ nos critérios
  verificados do checklist "Acceptance Criteria"; merge na `main` →
  📦 Entregue + comentário (branch/PR); release publicada + deploy ok →
  🚀 Em produção.
- Bug/dívida achada no caminho → card novo no Backlog — Front, capa
  rosa, com referência ao PRD/PR.
