# PRDs do front

| PRD                                                   | Assunto                                               | Status                                        |
| ----------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| [FE-01](FE-01-upload-extensoes.md)                    | Upload limitado a `.fcs`/`.zip`                       | Entregue (#37)                                |
| [FE-02](FE-02-plot-ux.md)                             | Pacote de UX do plot                                  | Entregue (#40)                                |
| [FE-03](FE-03-gate-edit-unificado.md)                 | Edição unificada de nome/cor com escopo               | Entregue (#41)                                |
| [FE-04](FE-04-gerenciar-arquivos-e-experimento.md)    | Desabilitar/reativar amostra e editar experimento     | Entregue (#42)                                |
| [FE-05](FE-05-excluir-gates-em-lote.md)               | Exclusão de gates em lote                             | Entregue (#44)                                |
| [FE-06](FE-06-manter-canais-ao-trocar-amostra.md)     | Manter canais ao trocar de amostra                    | Entregue (#38)                                |
| [FE-07](FE-07-gate-retangular.md)                     | Gate retangular                                       | Entregue (#45)                                |
| [FE-08](FE-08-relatorio-percentuais.md)               | Percentuais no relatório                              | Entregue (#46)                                |
| [FE-09](FE-09-nomes-gates-unicos.md)                  | Identificação de gates (nome + linhagem)              | Entregue (#47, #49)                           |
| [FE-10](FE-10-convites-grupos.md)                     | Convites/grupos                                       | Verificação manual não executada              |
| [FE-11](FE-11-subsamples.md)                          | Subsamples na UI                                      | Na branch `refactor/node-26-upgrade`          |
| [FE-12](FE-12-runtime-node-26.md)                     | Runtime Node 26 + pnpm e deps em faixa                | Entregue na branch `refactor/node-26-upgrade` |
| [FE-13](FE-13-avaliacao-mui-vs-styled.md)             | Avaliação MUI vs styled-components puro               | Avaliação: manter MUI (recomendado)           |
| [FE-14](FE-14-selecao-multipla-e-metadados-fcs.md)    | Seleção múltipla e metadados do header FCS            | Na branch `refactor/node-26-upgrade`          |
| [FE-15](FE-15-copiar-mover-experimento.md)            | Copiar/mover experimento entre contextos              | Implementado (depende do merge do BE-11)      |
| [FE-16](FE-16-aviso-upload-duplicado.md)              | Aviso de arquivo duplicado no upload                  | Implementado (depende do merge do BE-12)      |
| [FE-17](FE-17-camada-http-completa-e-utilitarios.md)  | Camada HTTP completa + utilitários compartilhados     | Implementado em `refactor/http-layer`         |
| [FE-18](FE-18-decompor-parent-tree.md)                | Decompor o ParentTree em componentes por nó           | Implementado em `refactor/parent-tree`        |
| [FE-19](FE-19-dividir-use-experiment-page-actions.md) | Dividir useExperimentPageActions por domínio          | Implementado em `refactor/experiment-actions` |
| [FE-20](FE-20-reorganizar-pages-e-features.md)        | Reorganizar page/ vs components/ e concluir features/ | Implementado em `refactor/dir-layout`         |
| [FE-21](FE-21-desativar-reativar-experimento.md)      | Desativar/reativar experimentos na listagem           | Implementado em `feat/experiment-restore`     |
| [FE-22](FE-22-density-erro-canais.md)                 | Erro real e pré-checagem de canais no plot            | Não iniciado (depende do BE-18)               |
| [FE-23](FE-23-editar-gate-pela-arvore.md)             | Editar gate (nome/cor/escopo) a partir da árvore      | Não iniciado (depende do ADR-0013)            |
| [FE-24](FE-24-detalhes-edicao-experimento-card.md)    | Detalhes e edição do experimento no card              | Não iniciado                                  |

Fora dos PRDs, já entregues: escopo no reshape + confirmação antes de
sobrescrever (#48), autor do gate no hover da árvore (#49), gestão de
roles/remoção de membros do grupo (#50).

## Pendências conhecidas

- FE-10 é roteiro de verificação manual (precisa de duas contas e ambiente
  rodando); o bug concreto relatado era backend e foi corrigido no PR #75.
- Painel de histórico/rollback da análise depende de
  `pandora-backend/docs/prd/BE-08-historico-rollback.md`.
