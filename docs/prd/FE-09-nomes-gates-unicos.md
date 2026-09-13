# FE-09 — Nomes de gates identificáveis (seleção em grupo)

**Repo:** pandora-front (possivelmente + backend) · **Item do doc:** 16 · **Tipo:** bug · **Base:** `main`
**Branch sugerida:** `fix/gate-name-identity`
**Status:** Nomes hierárquicos no PR #47; agrupamento por linhagem e caminho completo no PR #49. Decisões em `pandora-backend/docs/adr/0007` (nomes hierárquicos) e `0003` (linhagem).

## Situação

O nome é gerado em `src/features/plot/hooks/useGateDrawing.ts`:

```ts
const getNextGateName = (existingNames) => { let n = 1; while (existingNames.has(`P${n}`)) n++; return `P${n}` }
```

com `existingNames` = **irmãos** (`siblingGateNames`) + criados localmente. O banco reforça a mesma regra:

```python
UniqueConstraint(fields=["name", "parent"], name="unique_gate_name_per_parent")
UniqueConstraint(fields=["name", "file_data"], condition=Q(parent__isnull=True), name="unique_gate_name_root_level")
```

Ou seja: nome é único **por nível dentro de um arquivo** — como no FlowJo. Logo, `P1` existe em toda amostra, e ramos diferentes da mesma amostra também podem ter `P1`. É esperado pelo modelo, mas quebra a seleção em grupo do relatório, que aparentemente identifica gates por nome.

## Status: aguardando o relato do orientador

Antes de codar, precisamos do caso concreto: **onde** a seleção em grupo falhou (relatório? painel de comparação? export?) e o que era esperado. O nome repetido entre amostras é o comportamento do FlowJo e está reforçado por constraint no banco, então mudar a geração de nome é a última opção.

## Escopo (proposta, a confirmar)

Corrigir a **identificação** em vez do nome:

1. Nas listas selecionáveis (`src/features/stats/utils/selectable.ts`, `StatsTable`, `ComparisonPanel`) usar como chave o `gate.id` (ou `fileDataId + caminho de nomes`), nunca o nome.
2. Exibir o gate com contexto: `Amostra › P1 › P2` em vez de `P2` sozinho. Já existe `getGatePathNames` em `src/features/gate/utils` — reaproveitar.
3. Onde a seleção é "em grupo" (mesmo gate em várias amostras), agrupar pelo **caminho de nomes**, que é o identificador estável entre amostras usado no `goToAdjacentFile`/`findGateByPathNames`.
4. Se depois da correção ainda houver ambiguidade real (duplicidade dentro do mesmo nível), aí sim considerar mudar a geração de nome — e nesse caso o contador precisa ser por experimento, o que exige um MR de backend (a constraint é por parent/arquivo).

## Critérios de aceite

- [ ] Selecionar `P1` da amostra A no relatório não seleciona/soma o `P1` da amostra B por acidente.
- [ ] A lista mostra o caminho completo do gate, permitindo distinguir homônimos.
- [ ] Seleção "em grupo" por caminho de nomes continua funcionando entre amostras.
- [ ] Nenhuma mudança de nome de gates já existentes.
