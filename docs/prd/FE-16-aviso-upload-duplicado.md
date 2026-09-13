# FE-16 — Aviso de arquivo duplicado no upload

**Repo:** pandora-front · **Tipo:** feature · **Base:** `refactor/node-26-upgrade`
**Status:** não iniciado — bloqueado no
[BE-12](../../../pandora-backend/docs/prd/BE-12-dedup-no-upload.md).

## Problema

Subir um arquivo que já existe no servidor hoje envia o ZIP inteiro de novo —
tempo e storage desperdiçados. Com `sha256` no `FileModel` (BE-10/12), o front
pode conferir antes de subir e oferecer reuso instantâneo.

## Escopo

### 1. Hash local antes do upload

- No fluxo de `NewExperiment`, calcular `sha256` do arquivo via Web Crypto
  (`crypto.subtle.digest`) antes de chamar `init/`.
- `checkHash(sha256)` → `POST /experiment/check-hash/`.

### 2. Diálogo de duplicata

- `exists: true` → diálogo "Este arquivo já foi enviado":
  - mostra `file_name` e, se a API trouxer, quando/por quem
  - opções: **Reutilizar** (cria experimento sem upload — instantâneo) ou
    **Subir mesmo assim** (fluxo normal)
- `exists: false` → segue o fluxo atual sem interromper.

### 3. Aviso pós-upload

- Se o `complete/` responder `reused: true` (fallback de quem não checou),
  toast "Arquivo reutilizado — já existia no servidor".

## Arquivos a tocar

- `src/components/page/experiments/NewExperiment/` — hook do hash + diálogo
- `src/services/experimentService.ts` — `checkFileHash`, campo `reused`
- `src/features/experiment/utils/` — helper `sha256File(file)` puro/testável

## Critérios de aceite

- [ ] Arquivo já existente oferece reuso antes de subir um byte.
- [ ] Reuso cria experimento funcional apontando pro blob existente.
- [ ] Hash falhando (browser sem Web Crypto) não bloqueia o upload — segue
      o fluxo antigo.
- [ ] `reused: true` vindo do `complete/` vira aviso visível.

## Fora de escopo

- Dedup de `.fcs` dentro do ZIP (chave é o blob; interno usa `guid` — BE-10).
- UI de "onde já existe este arquivo" (listar experimentos que o usam).
