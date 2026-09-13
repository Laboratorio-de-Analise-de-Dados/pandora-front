# FE-16 — Adicionar arquivos ao experimento e dedup por escopo

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Status:** implementado na branch `feat/copy-move-dedup` — backend no
[BE-12](../../../pandora-backend/docs/prd/BE-12-dedup-no-upload.md).

## Problema

O cliente entende que está sempre "adicionando arquivos de citometria" a um
experimento — não só na criação. E a deduplicação que importa é "este
arquivo já está **neste** experimento?", não uma otimização global de
storage (descartada no BE-12).

## Escopo

### 1. "Adicionar arquivos" dentro do experimento

- Botão de upload (ícone) na página do experimento, ao lado de editar/
  excluir, visível pra quem pode editar.
- Aceita `.zip` ou `.fcs`; o fluxo é o mesmo chunked upload
  (`files/init → files/upload-chunk → files/complete`), reutilizando o
  progresso do provider — o servidor aglutina `.fcs` em ZIP.
- Ao concluir: toast com `added` amostras novas e `skipped` amostras
  ignoradas por já existirem; a árvore invalida e refaz o fetch.

### 2. Aviso de duplicata escopado ao experimento

- Antes de subir, hash local (`sha256File`, Web Crypto) +
  `checkFileHash(sha256, experimentId)` → `POST /experiment/check-hash/`.
- `exists: true` → `window.confirm` "já está neste experimento — enviar
  mesmo assim?" (o servidor ignora duplicatas de qualquer forma).
- Hash falhando não bloqueia: upload segue, dedup vira server-side.

### 3. Download organizado por subsample

- Ícone de download na página do experimento → `GET /experiment/<id>/download`
  → `<title>.zip` reconstruído com `subsample.name/arquivo.fcs`.

## Arquivos a tocar

- `src/providers/ExperimentContext/index.tsx` — `addExperimentFile`
  (chunks compartilhados com a criação via `sendAllChunks`)
- `src/services/experimentService.ts` — `initExperimentFileUpload`,
  `uploadExperimentFileChunk`, `completeExperimentFileUpload`,
  `checkFileHash(sha, experimentId?)`, `downloadExperiment`
- `src/features/experiment/hooks/useExperimentPageActions.ts` —
  `handleAddFile`, `handleDownload`
- `src/components/page/experiment/[id]/index.tsx` — ícones upload/download
- `src/components/page/experiments/NewExperiment/` — diálogo de reuse
  cross-experiment **removido** (dedup é por experimento agora)

## Critérios de aceite

- [x] Experimento recebe ZIP ou `.fcs` depois de criado, via ação interna.
- [x] Duplicata no mesmo experimento avisa antes de subir; servidor pula e
      reporta `skipped` no toast.
- [x] Mesmo arquivo em outro experimento nunca é bloqueado.
- [x] Download sai organizado pelos subsamples atuais.

## Fora de escopo

- Reuso/dedup de blob cross-experiment — descartado (BE-12); copiar
  experimento (FE-15) é o único compartilhamento.
- Seleção múltipla de arquivos num único gesto (hoje é um por upload).
