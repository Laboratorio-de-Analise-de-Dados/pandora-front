# Documentação do Pandora (front)

- `prd/` — o **que** cada entrega faz: escopo, comportamento esperado, arquivos
  tocados e critérios de aceite. Um PRD por MR.
- `adr/` — **por que** o front é assim: cada ADR registra uma decisão, as
  alternativas descartadas e as consequências.

Decisões de produto/domínio (o que o sistema garante: soft delete, identidade da
amostra, escopo de propagação, histórico) ficam em
`pandora-backend/docs/adr/` e são referenciadas por nome aqui — nunca copiadas,
para não divergirem. A numeração dos dois repos é independente.

## Convenções

- Um MR por PRD, base `main`, título `feat(escopo): ...` / `fix(escopo): ...`.
- `yarn typecheck`, `yarn test` e `yarn build` antes de abrir o MR.
- Camadas: serviço → hook → componente (ADR-0001). Componente não chama `axios`.
- Componente novo é mobile-first com breakpoints MUI (ADR-0002).

## Como escrever um ADR

Copie `adr/TEMPLATE.md`, numere na sequência e **não edite ADRs aceitos**: uma
decisão que muda ganha um ADR novo (`Substitui ADR-XXXX`) e o antigo passa a
`Substituído por ADR-YYYY`.

## Índice de ADRs

| ADR                                                                | Decisão                                                                 | Status |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------ |
| [0001](adr/0001-camadas-services-hooks-componentes.md)             | Serviços, hooks e componentes como camadas separadas                    | Aceito |
| [0002](adr/0002-mobile-first-com-breakpoints-mui.md)               | Mobile-first com breakpoints do MUI                                     | Aceito |
| [0003](adr/0003-convites-no-sininho-do-header.md)                  | Convites pendentes no sino do header                                    | Aceito |
| [0004](adr/0004-usuario-decide-o-escopo-e-confirma-sobrescrita.md) | UI pergunta o escopo e confirma sobrescrita com `dry_run`               | Aceito |
| [0005](adr/0005-estado-do-plot-persiste-ao-trocar-amostra.md)      | Seleção de canais persiste ao trocar de amostra/gate                    | Aceito |
| [0006](adr/0006-cache-de-usuario-e-refresh-no-interceptor.md)      | Usuário cacheado com TTL; refresh de token no interceptor               | Aceito |
| [0007](adr/0007-node-26-slim.md)                                   | Node 26-slim nos containers                                             | Aceito |
| [0008](adr/0008-engine-de-dominio-desacoplada.md)                  | Núcleo de domínio desacoplado de React/MUI/HTTP                         | Aceito |
| [0009](adr/0009-pnpm-como-package-manager.md)                      | pnpm como package manager (substitui Yarn 1.x)                          | Aceito |
| [0010](adr/0010-orquestracao-de-lote-e-metadados-no-cliente.md)    | Lote no cliente (allSettled + invalidação única); metadados sob demanda | Aceito |
