# Documentação do Pandora (front)

- `adr/` — **por que** o front é assim: ADRs de UI/convenção ficam aqui.
- **PRDs e ADRs sensíveis** (auth, segurança, dados de paciente) vivem no
  repo privado [`pandora-docs`](https://github.com/Laboratorio-de-Analise-de-Dados/pandora-docs)
  — clone como repo irmão: `../pandora-docs/prd/` (PRDs `FE-*`),
  `../pandora-docs/adr/front/` (ex.: ADR-0006, refresh de token).

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

| ADR                                                                                    | Decisão                                                                                   | Status   |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| [0001](adr/0001-camadas-services-hooks-componentes.md)                                 | Serviços, hooks e componentes como camadas separadas                                      | Aceito   |
| [0002](adr/0002-mobile-first-com-breakpoints-mui.md)                                   | Mobile-first com breakpoints do MUI                                                       | Aceito   |
| [0003](adr/0003-convites-no-sininho-do-header.md)                                      | Convites pendentes no sino do header                                                      | Aceito   |
| [0004](adr/0004-usuario-decide-o-escopo-e-confirma-sobrescrita.md)                     | UI pergunta o escopo e confirma sobrescrita com `dry_run`                                 | Aceito   |
| [0005](adr/0005-estado-do-plot-persiste-ao-trocar-amostra.md)                          | Seleção de canais persiste ao trocar de amostra/gate                                      | Aceito   |
| [0006](../../pandora-docs/adr/front/0006-cache-de-usuario-e-refresh-no-interceptor.md) | Usuário cacheado com TTL; refresh de token no interceptor (movido p/ pandora-docs)        | Aceito   |
| [0007](adr/0007-node-26-slim.md)                                                       | Node 26-slim nos containers                                                               | Aceito   |
| [0008](adr/0008-engine-de-dominio-desacoplada.md)                                      | Núcleo de domínio desacoplado de React/MUI/HTTP                                           | Aceito   |
| [0009](adr/0009-pnpm-como-package-manager.md)                                          | pnpm como package manager (substitui Yarn 1.x)                                            | Aceito   |
| [0010](adr/0010-orquestracao-de-lote-e-metadados-no-cliente.md)                        | Lote no cliente (allSettled + invalidação única); metadados sob demanda                   | Aceito   |
| [0011](adr/0011-features-como-casa-de-componentes-de-dominio.md)                       | `features/` é a casa de componentes de domínio; `components/` só UI neutra                | Aceito   |
| [0012](adr/0012-limite-de-complexidade-por-arquivo.md)                                 | Um domínio por arquivo: decompor componentes/hooks que cruzam domínios                    | Aceito   |
| [0013](adr/0013-replicacao-de-nome-cor-opt-in.md)                                      | Replicar nome/cor é opt-in; edição completa também pela árvore                            | Aceito   |
| [0014](adr/0014-confirmacao-e-feedback-so-componentes-mui.md)                          | Confirmação via `ConfirmDialog`/MUI; `window.*` proibido; feedback converge para Snackbar | Proposto |
