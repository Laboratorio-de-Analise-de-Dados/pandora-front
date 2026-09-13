# ADR-0001 — Três camadas: serviços, hooks e componentes

- **Status:** Aceito
- **Data:** 2026-08-10 (registrado em 2026-09-13)
- **Contexto do código:** `src/services/`, `src/hooks/`, `src/features/**/hooks/`, `src/components/`

## Contexto

Componentes chamavam `axios`/`CytometryApi` direto e misturavam estado, regra de
negócio (conversão de coordenadas do Plotly, detecção de gate, carry-forward de
canais) e renderização. Cada novo requisito engordava o mesmo arquivo e a mesma
chamada HTTP aparecia com tratamento de erro diferente em dois lugares.

## Decisão

1. **`src/services/`** — só HTTP e tipagens de request/response. Sem estado, sem
   React.
2. **`src/hooks/`** (ou `src/features/<feature>/hooks/`) — estado e regra de
   negócio; chamam serviços, tratam loading/erro e expõem ações simples. Não
   renderizam JSX.
3. **`src/components/`, `src/page/`** — renderização, eventos e navegação;
   delegam aos hooks.

Escopo define o lugar: hook usado por um componente só mora em
`src/components/<Componente>/hooks/` e sobe para a camada compartilhada quando um
segundo componente passa a usá-lo; o mesmo vale para componentes filhos em
`components/<Pai>/components/`.

## Alternativas consideradas

### A) Chamadas de API direto no componente com `useEffect`

Descartada: duplica tratamento de erro/refresh de token e torna a regra de
negócio impossível de testar sem montar a árvore de componentes.

### B) Estado global (Redux/Zustand) para o workspace do experimento

Descartada por ora: o estado é local à página de experimento e já é
compartilhado via `ExperimentWorkspaceContext`. Providers globais ficam só para
auth e tema.

### C) Camada única de "API + estado" (hooks fazendo `axios`)

Descartada: é o que existia de fato e não dá onde colocar a tipagem
compartilhada nem o interceptor; serviço separado é o que permite trocar
transporte sem tocar em hook.

## Consequências

- Mais arquivos por feature; a navegação exige conhecer a convenção.
- Regra de negócio testável isoladamente e componentes pequenos.
- Em revisão, `axios` dentro de componente é motivo de recusa.
