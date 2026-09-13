# Pandora Front

Front-end do Projeto Pandora — uma plataforma para visualizacao e analise de dados de citometria de fluxo e celulas unicas. Permite gerenciar experimentos, realizar gating hierarquico, e gerar relatorios estatisticos de populacoes.

Construido com [React](https://react.dev/) 18, [TypeScript](https://www.typescriptlang.org/), [MUI](https://mui.com/) 7, [Plotly.js](https://plotly.com/javascript/), [TanStack Query](https://tanstack.com/query) 5 e empacotado com [Vite](https://vitejs.dev/).

---

## Requisitos

- **Node.js** 22+ (recomendado 26 — imagem `node:26-slim` no Docker)
- **pnpm** 12+
- **Backend** [pandora-backend](https://github.com/Laboratorio-de-Analise-de-Dados/pandora-backend) rodando (para API)

## Setup Rapido

```bash
# 1. Clone o repositorio
git clone https://github.com/Laboratorio-de-Analise-de-Dados/pandora-front.git
cd pandora-front

# 2. Instale as dependencias
pnpm install

# 3. Configure as variaveis de ambiente
cp .env.example .env
# Edite .env e preencha VITE_API_URL com a URL do backend
```

### Variaveis de Ambiente

| Variavel       | Descricao                  | Exemplo                 |
| -------------- | -------------------------- | ----------------------- |
| `VITE_API_URL` | URL base da API do Pandora | `http://localhost:8085` |

> Variaveis expostas ao cliente precisam do prefixo `VITE_`.

## Scripts

| Comando                 | Descricao                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm dev`              | Servidor de desenvolvimento em [http://localhost:3000](http://localhost:3000) com hot reload |
| `pnpm build`            | Build de producao na pasta `build/`                                                          |
| `pnpm preview`          | Servidor local para visualizar o build de producao                                           |
| `pnpm typecheck`        | Verificacao de tipos (`tsc --noEmit`)                                                        |
| `pnpm test`             | Roda testes com [Vitest](https://vitest.dev/)                                                |
| `pnpm test:watch`       | Testes em modo interativo                                                                    |
| `pnpm dev:docker:build` | Dev com Docker (build + up)                                                                  |
| `pnpm dev:docker`       | Dev com Docker (up)                                                                          |

## Docker

### Desenvolvimento (hot reload)

```bash
pnpm dev:docker:build   # primeira vez
pnpm dev:docker         # vezes seguintes
```

Usa `docker-compose.yml` com volumes montados para hot reload — mesma
convenção do backend: arquivo sem sufixo = ambiente local, `.prod` = produção.

### Producao

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

O compose de prod não builda — faz pull da imagem publicada pelo CI
(`DOCKER_USER`/`IMAGE_TAG` como env). O `Dockerfile` faz build multi-stage:
Node para compilar, Nginx para servir. O container se conecta a rede
`pandora_net` para comunicar com o backend.

---

## Arquitetura

### Visao Geral

O projeto segue uma **arquitetura feature-based** hibrida: logica de dominio e reutilizavel fica em `src/features/`, enquanto componentes de pagina e layout permanecem em `src/components/`.

```
src/
  API/                          # Cliente Axios configurado (CytometryApi)
  components/                   # Componentes de UI e paginas
    Layout/                     #   Layout principal (header + content + footer)
    headers/                    #   Header com navegacao
    footer/                     #   Footer
    plotly/                     #   ScatterPlot — componente principal de visualizacao
    stats_panel/                #   StatsPanel — painel de estatisticas
    parent_tree/                #   ParentTree — arvore hierarquica de arquivos/gates
    apply_gate_dialog/          #   Dialog para aplicar gates entre arquivos
    color_picker/               #   Seletor de cor para gates
    page/
      experiment/[id]/          #   Pagina do experimento (orquestrador principal)
      experiments/              #   Listagem de experimentos (Card, Container, NewExperiment)
  features/                     # Logica de dominio organizada por feature
    experiment/
      context/                  #   ExperimentWorkspaceContext (estado compartilhado)
      hooks/                    #   useExperimentQuery, useExperimentFilesQuery, useFileStatsQuery
    gate/
      utils/                    #   gateTreeHelpers (findGateInTree, collectAllGates, etc.)
    plot/
      components/               #   PlotToolbar, PlotSettings, GateEditDialog
      hooks/                    #   usePlotState, useDensityQuery, useGateDrawing, useGateShapes
      utils/                    #   biex, ticks, sliders, geometry
    stats/
      components/               #   SourceSelector, StatsSummaryCard, StatsTable, ChannelConfigPopover,
                                #   ComparisonPanel, ExportDialog, LabelEditDialog
      utils/                    #   channelHelpers, exportHelpers
  providers/                    # React Contexts globais
    ExperimentContext/          #   Lista de experimentos + upload com chunks
    ThemeContext/                #   Dark/Light mode
    SelectionContext/           #   (legado)
  router/                       # Rotas (React Router v6)
  types/                        # Tipos TypeScript compartilhados
  utils/                        # Utilitarios globais (format.ts)
  constants/                    # Constantes (gateColors)
```

### Fluxo de Dados Principal

```
ExperimentWorkspaceProvider (Context)
  |
  |-- useExperimentQuery(id)        -> experiment
  |-- useExperimentFilesQuery(id)   -> experimentFiles (arvore de gates)
  |-- useFileStatsQuery(source)     -> fileStats
  |-- useState(source)              -> source selecionado
  |
  +-- ExperimentPage
        |-- ParentTree          <- files, onSelect, onDeleteGate, onRenameGate
        |-- ScatterPlot         <- values, source, childGates, loadFile
        +-- StatsPanel          <- source, files, values, fileStats
```

### Conceitos-Chave

| Conceito                 | Descricao                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Gate**                 | Fronteira geometrica (retangulo, poligono, quadrante, intervalo) que isola uma populacao de celulas                         |
| **Gate Hierarchy**       | Gates podem ter filhos, formando uma arvore (ex: Lymphocytes > CD3+ > CD4+)                                                 |
| **Biexponential (biex)** | Transformacao `arcsinh(v / cofactor)` para visualizar dados de alta faixa dinamica incluindo negativos. Cofator padrao: 150 |
| **Density Plot**         | Heatmap mostrando concentracao de eventos via escala de cor                                                                 |
| **FCS**                  | Formato padrao de dados para citometria de fluxo                                                                            |
| **MFI**                  | Mean/Median Fluorescence Intensity — metrica estatistica principal                                                          |
| **%P / %T**              | Porcentagem da populacao pai e porcentagem do total de eventos                                                              |
| **Apply Gate**           | Propagar coordenadas de gate para outros arquivos do experimento                                                            |
| **Source**               | Item selecionado na arvore — pode ser um arquivo (`file`) ou um gate (`gate`)                                               |

### Stack Tecnica

| Camada            | Tecnologia                  | Versao            |
| ----------------- | --------------------------- | ----------------- |
| UI Framework      | React                       | ^18.2.0           |
| Linguagem         | TypeScript                  | ^4.4.2            |
| Component Library | MUI                         | ^7.2.0            |
| Graficos          | Plotly.js + react-plotly.js | ^2.29.1           |
| Data Fetching     | TanStack Query              | ^5                |
| Roteamento        | React Router                | 6.28.0            |
| HTTP Client       | Axios                       | ^1.6.8            |
| Bundler           | Vite                        | ^5.4.11           |
| Testes            | Vitest + Testing Library    | ^2.1.8            |
| Styling           | styled-components + Emotion | ^6.1.8 / ^11.14.0 |

---

## Guia de Contribuicao

### Branches

- `main` — branch principal, protegida
- `devin/*` ou `feature/*` — branches de trabalho
- Sempre crie um PR para mergear na `main`

### Fluxo de Trabalho

1. **Crie uma branch** a partir de `main`:

   ```bash
   git checkout main && git pull
   git checkout -b feature/nome-descritivo
   ```

2. **Desenvolva** seguindo os padroes abaixo

3. **Verifique antes de commitar**:

   ```bash
   pnpm typecheck    # tipos ok?
   pnpm build        # build ok?
   pnpm test         # testes passando?
   ```

4. **Commit com mensagens semanticas**:

   ```
   feat: adiciona filtro por fluorescencia no StatsPanel
   fix: corrige transformacao biex para valores negativos
   refactor: extrai useDensityQuery do ScatterPlot
   docs: atualiza README com guia de arquitetura
   ```

5. **Abra um PR** com:
   - Titulo claro descrevendo a mudanca
   - Descricao explicando **o que** mudou e **por que**
   - Screenshots se houve mudanca visual
   - Referencia a issues relacionadas (se houver)

### Padroes de Codigo

#### Organizacao

- **Logica de dominio** vai em `src/features/<feature>/` (utils, hooks, components)
- **Componentes de pagina/layout** ficam em `src/components/`
- **Tipos compartilhados** ficam em `src/types/`
- Cada modulo exporta via `index.ts` (barrel exports)

#### React

- **Custom hooks** para encapsular estado e side-effects (`use*`)
- **Funcoes puras** em `utils/` para logica de negocio (testavel, reutilizavel)
- **React Query** para data fetching — nao usar `useState` + `useEffect` para chamadas API
- **Context** para estado compartilhado entre componentes irmaos (ex: `ExperimentWorkspaceContext`)
- Componentes devem ser focados (< 300 linhas idealmente). Se crescer, extraia sub-componentes

#### TypeScript

- Evite `any` — use tipos especificos ou `unknown` quando necessario
- Use `interface` para shapes de objetos, `type` para unioes
- Tipos discriminados para coordenadas de gate (`RectGateCoordinates | PolygonGateCoordinates | ...`)

#### Imports

- Imports sempre no topo do arquivo
- Use imports relativos dentro da mesma feature
- Use imports com `../../features/` para cross-feature

#### Commits

- Nao commite arquivos `.env` ou credenciais
- Nao use `git add .` — adicione arquivos especificos
- Nao faca force push na `main`

### Checklist do PR

- [ ] `pnpm typecheck` passa sem erros
- [ ] `pnpm build` compila com sucesso
- [ ] `pnpm test` passa (se testes existem para a area modificada)
- [ ] Sem `any` desnecessarios adicionados
- [ ] Codigo duplicado foi extraido para `utils/` ou `hooks/`
- [ ] Componentes grandes foram decompostos
- [ ] Descricao do PR explica o contexto da mudanca

### Decisoes Arquiteturais

Quando propor mudancas estruturais (nova feature, refactor grande, nova dependencia):

1. **Documente o problema** que a mudanca resolve
2. **Proponha a solucao** com impacto e risco estimados
3. **Implemente incrementalmente** — PRs menores sao mais faceis de revisar
4. **Mantenha retrocompatibilidade** — nao quebre funcionalidade existente
5. **Atualize este README** se a mudanca afeta a arquitetura

#### Escala de Risco para PRs

| Risco | Tipo de Mudanca                               | Exemplo                      |
| ----- | --------------------------------------------- | ---------------------------- |
| Zero  | Extrair funcao pura para utils                | `biex.ts`, `geometry.ts`     |
| Baixo | Extrair hook ou sub-componente                | `usePlotState`, `StatsTable` |
| Medio | Mudar data fetching ou estado compartilhado   | React Query, Context         |
| Alto  | Trocar dependencia core ou reorganizar pastas | React Router, folder moves   |

---

## Licenca

Projeto academico do Laboratorio de Analise de Dados.
