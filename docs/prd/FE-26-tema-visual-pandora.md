# FE-26 — Refactor visual: tema Pandora (verde/preto/branco, dark-first)

**Repo:** pandora-front · **Tipo:** refactor visual · **Base:** `main`
**Branch sugerida:** `refactor/tema-pandora-dark`
**Status:** em andamento — base implementada em `refactor/tema-pandora-dark`
(tokens, plot, árvore, cards, dialogs, bottom nav); em validação visual local
antes de prod.

Protótipos de referência (gerados por modelo externo a partir do
descritivo de produto):

- [`assets/FE-26-prototipos-tema-verde.jpeg`](assets/FE-26-prototipos-tema-verde.jpeg) — desktop
- [`assets/FE-26-prototipos-mobile.jpeg`](assets/FE-26-prototipos-mobile.jpeg) — mobile

## Contexto

O tema atual (`src/globalStyle.tsx`) usa verde `#2ECC71` com dark
`#121212`/`#1F1F1F` e light `#F4F4F4`. A direção aprovada é uma identidade
**dark-first** de alto contraste — preto quase puro no canvas, verde esmeralda
como cor de marca — cobrindo as 4 telas estratégicas do produto. O refactor é
só visual: nenhuma regra de negócio, rota ou fluxo muda.

## Identidade visual — tokens

### Dark (base principal / workspace)

| Token                         | Valor     | Uso                               |
| ----------------------------- | --------- | --------------------------------- |
| `background.default` (canvas) | `#0D0D0D` | Preto quase puro, menos cansativo |
| `background.paper` (surface)  | `#161616` | Painéis, cards, modais            |
| `divider` / bordas            | `#262626` | Divisores e outlines discretos    |

### Verde (marca e interações)

| Token           | Valor     | Uso                                                           |
| --------------- | --------- | ------------------------------------------------------------- |
| `primary.main`  | `#10B981` | Verde Pandora (emerald) — ações primárias, destaques          |
| `primary` hover | `#059669` | Hover de botões/links primários                               |
| Accent / plot   | `#34D399` | Verde neon — borda de gate ativo, seleção, highlights no plot |

### Tipografia e estrutura

| Token            | Valor     | Uso                                       |
| ---------------- | --------- | ----------------------------------------- |
| `text.primary`   | `#FFFFFF` | Nomes de amostras, dados do plot, headers |
| `text.secondary` | `#A1A1AA` | Metadados, labels, dicas                  |
| `text.disabled`  | `#52525B` | Amostras inativadas, gates não-avaliáveis |

Estados de feedback mantêm semântica: warning (âmbar, legível no escuro) e
erro/conflito (vermelho muted) — usados nos resultados de dry-run.

## Direção visual — moderno e mobile-first

Feedback sobre os protótipos: a paleta agradou, mas a execução ficou
**quadrada demais**. O refactor deve mirar um visual moderno, não um reskin
1:1 dos mockups. Diretrizes:

- **Forma**: `border-radius` generoso — cards/painéis 12–16px, botões e
  inputs 10–12px, chips/tags em formato **pill**. Hoje o tema MUI usa o
  default (4px) com botão em 8px — subir o `shape.borderRadius` do tema e
  revisar overrides.
- **Elevação em vez de borda dura**: painéis e cards se separam do canvas
  por sombra suave + leve diferença de tom (`#161616` sobre `#0D0D0D`), não
  por outline `#262626` em tudo. Bordas só onde separam áreas funcionais.
- **Respiro**: densidade alta só onde o dado manda (plot, tabela MFI).
  Cards, modais e listas com padding mais generoso e hierarquia tipográfica
  clara (título → valor → metadado).
- **Mobile-first de verdade** (ADR-0002): dialogs viram **bottom sheets**
  em `xs`; painéis laterais do workspace viram drawers deslizantes; alvos
  de toque ≥ 44px; ações primárias ao alcance do polegar (botão principal
  no rodapé do sheet, não no topo). No desktop, o mesmo componente rende
  como modal/painel.
- **Microinterações**: hover com elevação sutil nos cards de experimento;
  transições curtas (150–200ms) em abertura de drawer/sheet e troca de
  amostra; nada de animação longa que atrase análise.
- **Amostra ativa na árvore**: em vez de bloco quadrado, indicador
  arredondado (borda esquerda verde + fundo `rgba(16,185,129,~0.12)` com
  cantos arredondados) — padrão "selected pill" moderno.

### Padrões mobile do protótipo (assets/FE-26-prototipos-mobile.jpeg)

O mockup mobile introduz padrões que valem registrar como requisito:

- **Bottom navigation** em `xs`: barra fixa no rodapé com os destinos
  globais (Experimentos, workspace/Gating, Timeline*, Organizações,
  Settings/Perfil). Ícone + label, destino ativo em verde.
  *"Timeline" antecipa o painel de histórico (FE-25) — no refactor pode
  entrar só o slot, com o item oculto ou desabilitado até o FE-25 existir.
- **Workspace mobile**: plot ocupa o topo; a árvore vira **bottom sheet**
  arrastável (não drawer lateral); "Propagar Gate" é botão primário
  **full-width fixado no rodapé** do sheet/tela, ao alcance do polegar.
- **Dialogs como bottom sheet**: Apply Gate rende como sheet com escopo em
  radios grandes, caixa de dry-run e ações empilhadas no rodapé
  (confirmar por último, full-width).
- **Card de experimento com thumbnail do plot**: miniatura da densidade no
  card (ver decisão aberta — backend não gera thumbnail hoje).
- **Progresso inline**: `processing` mostra barra de progresso dentro do
  card, não só chip com %.

Os mockups em `assets/` seguem como referência de **estrutura e paleta**,
não de forma — a execução final deve suavizar o que eles mostram.

## Escopo — as 4 telas

### 1. Workspace do experimento (`/experiments/:id`) — core

- **Header da tela compacto**: navegação entre amostras (`<`/`>` + dropdown),
  breadcrumb central `Subsample / Amostra / Gate`, e ação em destaque
  **"Propagar Gate"** em verde `#10B981` (hoje a propagação é acionada por
  gate na árvore — o botão de topo é adição visual a confirmar na
  implementação).
- **Painel esquerdo (árvore)**: fundo `#161616`; amostra ativa com borda
  esquerda verde + nome branco; campo "buscar amostras" (novo — decidir se
  entra neste refactor ou fica como follow-up); seleção múltipla mantém a
  mecânica atual, podendo virar barra flutuante "N selecionadas → Mover".
- **Plot central**: fundo preto com grade `#262626`; heatmap com gradiente
  alto-contraste para fundo escuro (avaliar colorscale — hoje `Jet`); borda
  do gate **ativo** em `#34D399`; ferramentas de gate e selects de canal/
  modo/escala sobre fundo escuro (hoje `GateToolToggle` tem fundo
  `rgba(255,255,255,0.85)` hardcoded — precisa seguir o tema).
- **Painel direito (stats)**: cards de métricas (Count, %P, %T) com valores
  grandes em branco; tabela MFI compacta com linhas alternadas
  `#161616`/`#1A1A1A`; botão "Exportar CSV/XLSX" secundário (borda + texto
  verde).

### 2. Dialog de propagação (Apply Gate) — regra de ouro

- Modal `#161616` com borda `#262626`.
- **Escopo em radio buttons espaçados**: "Apenas nesta amostra" / "Neste
  subsample (N amostras)" / "Todas (N amostras)" — selecionado em verde.
- **Caixa de dry-run** em `#0D0D0D` com badges: pronto (verde), aviso de
  canal ausente → gate não-avaliável (âmbar), conflito de nome/linhagem
  (vermelho).
- Checkbox opt-in "replicar cor/estilo para a linhagem" (já é regra de
  produto — ADR-0013 front).
- Botão confirmar: verde; **vermelho/alerta quando houver conflito a
  sobrescrever** — o ato destrutivo fica visualmente consciente.

### 3. Lista de experimentos (`/experiments`)

- Header: título branco, filtro por laboratório, **"Novo Experimento"** verde
  no canto direito; toggle "mostrar inativados" em verde.
- Cards `#161616` com hover de elevação + borda verde discreta.
- **Chips de status**: `done` verde translúcido; `processing` com spinner
  verde + porcentagem; `inactivated` cinza opaco com card inteiro em
  opacidade reduzida.

### 4. Organizações e convites (`/organizations`)

- **Tabs**: aba ativa com underline verde + texto branco; badge numérico
  verde em "Convites Recebidos".
- **Tabela de membros**: linhas `#161616` intercaladas; papel como chip
  (Dono verde / Editor cinza claro / Viewer cinza escuro); ações por ícone
  discreto; "+ Convidar Membro" em verde.

## Arquivos a tocar

- `src/globalStyle.tsx` — tokens da paleta dark (e decisão sobre o light, ver
  abaixo).
- `src/features/plot/utils/plotTraces.ts` — colorscale do heatmap e cor de
  marker do scatter para fundo escuro.
- `src/features/plot/components/scatter-plot/` — fundo do chart, grade,
  cores de eixo/ticks, `GateToolToggle` (fundo hardcoded claro hoje).
- `src/constants/gateColors.ts` — avaliar harmonia da paleta de cores de
  gate com o tema novo (cores vivas sobre preto).
- `src/features/experiment/components/parent-tree/` — cores de seleção,
  amostra ativa, inativados.
- `src/features/stats/components/` — cards de métricas e tabela.
- `src/features/gate/components/apply-gate-dialog/` + `delete-gate-dialog/` —
  radio de escopo, caixa de dry-run, botão destrutivo consciente.
- `src/page/experiments/` (Card, Container) — chips de status e hover.
- `src/page/organizations/` — tabs, tabela de membros, chips de papel.
- `src/components/header/` — sino de convites e toggle de tema no dark novo.

## Decisões (fechadas na implementação de `refactor/tema-pandora-dark`)

- **Tema light**: mantido e derivado da identidade — primary `#10B981`,
  bordas `#E4E4E7`, plot com rampa clara invertida. Borda sutil existe nos
  dois modos (no light é o que separa superfície do fundo).
- **Cor do gate vs. marca**: `#34D399` é cor de **seleção/foco/edição**;
  gates confirmados mantêm `gate.color`/`GATE_PALETTE` própria.
- **"Propagar Gate" no header**: entrou — botão verde quando um gate está
  selecionado (desktop) e full-width no rodapé do sheet da árvore (mobile).
  "Buscar amostras" ficou como follow-up.
- **Colorscale do heatmap**: rampa preto→emerald→neon no dark e
  claro→emerald-escuro no light (`plotTraces.ts`).
- **Navegação**: desktop ganhou rail de ícones à esquerda (`SideRail`) +
  topbar fina; mobile mantém bottom nav (`BottomNav`), escondida no
  workspace.

## Dependências de backend (BE-21)

Os pontos do mockup que dependem de dados que a API não expõe foram
registrados em `pandora-backend/docs/prd/BE-21-metadados-visuais-listagem.md`:

- **Thumbnail do plot no card** → `GET /experiment/<id>/preview/`
  (histograma 2D baixa resolução, reusa `utils/density`).
- **Chip "Dono"** → `my_role` na listagem.
- **"Processando (45%)"** → `progress` derivado de
  `received_chunks/total_chunks` (upload); processing é síncrono, fica sem
  percentual por ora.

O front já tipa esses campos como opcionais em
`src/types/ExperimentTypes.ts` — os cards renderizam sem eles até o BE-21
existir.

## Critérios de aceite

- [ ] Tokens acima aplicados no tema dark; nenhuma cor de marca antiga
      (`#2ECC71`) remanescente em telas do escopo.
- [ ] As 4 telas correspondem aos protótipos de referência em estrutura e
      cor, no desktop e em `xs` (mobile-first, ADR-0002) — com a forma
      moderna da seção anterior (raios, sombras, bottom sheets), não o
      visual quadrado do mockup.
- [ ] Plot legível no fundo escuro: heatmap com contraste, grade `#262626`,
      gate ativo destacado.
- [ ] Dry-run no dialog de propagação mostra pronto/aviso/conflito com os
      badges definidos; conflito muda o botão de confirmação para estado
      destrutivo consciente.
- [ ] Estados inativados/não-avaliáveis usam `text.disabled` `#52525B`.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm build` limpos.
- [ ] Validação visual **local** aprovada antes de qualquer deploy (spec do
      dono: "vamos ver localmente, depois pensamos em prod").

## Fora de escopo

- Mudanças de fluxo/regra de negócio (escopo, dry-run, hierarquia já existem).
- Novas features funcionais (histórico/checkpoints FE-25, workspaces BE-19).
- Redesign de páginas fora das 4 (login, home, perfil seguem com o tema
  global aplicado, sem tratamento dedicado neste MR).
- Backend — nenhum endpoint muda.
