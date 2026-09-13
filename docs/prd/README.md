# PRDs do front

| PRD                                                | Assunto                                           | Status                                        |
| -------------------------------------------------- | ------------------------------------------------- | --------------------------------------------- |
| [FE-01](FE-01-upload-extensoes.md)                 | Upload limitado a `.fcs`/`.zip`                   | Entregue (#37)                                |
| [FE-02](FE-02-plot-ux.md)                          | Pacote de UX do plot                              | Entregue (#40)                                |
| [FE-03](FE-03-gate-edit-unificado.md)              | Edição unificada de nome/cor com escopo           | Entregue (#41)                                |
| [FE-04](FE-04-gerenciar-arquivos-e-experimento.md) | Desabilitar/reativar amostra e editar experimento | Entregue (#42)                                |
| [FE-05](FE-05-excluir-gates-em-lote.md)            | Exclusão de gates em lote                         | Entregue (#44)                                |
| [FE-06](FE-06-manter-canais-ao-trocar-amostra.md)  | Manter canais ao trocar de amostra                | Entregue (#38)                                |
| [FE-07](FE-07-gate-retangular.md)                  | Gate retangular                                   | Entregue (#45)                                |
| [FE-08](FE-08-relatorio-percentuais.md)            | Percentuais no relatório                          | Entregue (#46)                                |
| [FE-09](FE-09-nomes-gates-unicos.md)               | Identificação de gates (nome + linhagem)          | Entregue (#47, #49)                           |
| [FE-10](FE-10-convites-grupos.md)                  | Convites/grupos                                   | Verificação manual não executada              |
| [FE-11](FE-11-subsamples.md)                       | Subsamples na UI                                  | Na branch `refactor/node-26-upgrade`          |
| [FE-12](FE-12-runtime-node-26.md)                  | Runtime Node 26 + pnpm e deps em faixa            | Entregue na branch `refactor/node-26-upgrade` |
| [FE-13](FE-13-avaliacao-mui-vs-styled.md)          | Avaliação MUI vs styled-components puro           | Avaliação: manter MUI (recomendado)           |
| [FE-14](FE-14-selecao-multipla-e-metadados-fcs.md) | Seleção múltipla e metadados do header FCS        | Na branch `refactor/node-26-upgrade`          |

Fora dos PRDs, já entregues: escopo no reshape + confirmação antes de
sobrescrever (#48), autor do gate no hover da árvore (#49), gestão de
roles/remoção de membros do grupo (#50).

## Pendências conhecidas

- FE-10 é roteiro de verificação manual (precisa de duas contas e ambiente
  rodando); o bug concreto relatado era backend e foi corrigido no PR #75.
- Painel de histórico/rollback da análise depende de
  `pandora-backend/docs/prd/BE-08-historico-rollback.md`.
