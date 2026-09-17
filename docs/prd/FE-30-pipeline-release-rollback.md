# FE-30 — Pipeline de release por tag com rollback (front)

**Repo:** pandora-front · **Tipo:** infra/CI-CD · **Base:** `main`
**Branch:** `ci/release-pipeline`
**Status:** implementado · **ADR cruzado:** `pandora-backend/docs/adr/0022-pipeline-de-release-com-rollback.md`

## Contexto

O workflow anterior disparava build+deploy a cada push na `main`, sempre
sobrescrevendo `latest` — sem noção de versão liberada, sem health check
(deploy "passava" com o container quebrado) e sem caminho de rollback
além de editar `IMAGE_TAG` na mão no servidor.

O backend definiu o modelo no ADR-0022: release por tag, deploy com
portão manual, health check e rollback automático da versão anterior.
Este PRD aplica o mesmo modelo ao front — **sem** o passo de migrations
(o front não tem banco; o risco de rollback é só incompatibilidade de
contrato com a API).

## O que muda

- **`ci.yml`** passa a rodar `pnpm typecheck` + `pnpm test` em push/PR
  para `main` — antes o CI só buildava a imagem.
- **`release.yml`** dispara ao **publicar uma GitHub Release** na UI
  (Releases → Draft new release → "Create new tag `v*`" → "Generate
  release notes" → Publish): a tag é criada no publish — tag avulsa via
  `git tag` não deploya. As notas são geradas das PRs mergeadas no range,
  categorizadas por `.github/release.yml`. O workflow builda
  `pandora-front:vX.Y.Z`, deploya após aprovação do environment
  `production`, espera o nginx responder 200 e, se falhar, redeploya a
  tag anterior gravada em `/opt/pandora/frontend/.deployed_version`.
  `latest` só é publicado no Docker Hub depois do deploy saudável.
- **`rollback.yml`**: `workflow_dispatch` recebendo uma tag → redeploya.
  Cobre "deploy passou mas a UI veio errada".

## Regra de versão

Front e back versionam **independente** (tags `v*` em cada repo). Quando
a mudança quebra contrato (endpoint novo/alterado), a release do back vai
antes — coordenação manual registrada na descrição da release.

## Critérios de aceite

- [x] `ci.yml` verde em PR para `main` (typecheck + test).
- [x] Release publicada gera imagem `vX.Y.Z` no Hub; `latest` imóvel até deploy ok.
- [x] Deploy falho (nginx não responde) reverte para `.deployed_version`.
- [x] `rollback.yml` restaura tag arbitrária com portão de produção.

## Fora de escopo

- Canary/blue-green (servidor roda um container; ADR-0022, alternativa C).
- Rollback automático entre front e back acoplados — se o back reverter,
  o front só volta se alguém disparar `rollback.yml` lá.
