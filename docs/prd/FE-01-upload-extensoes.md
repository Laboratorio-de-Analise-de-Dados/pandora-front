# FE-01 — Limitar e informar as extensões aceitas no upload

**Repo:** pandora-front · **Item do doc:** 2 · **Tipo:** bug/UX · **Base:** `main`
**Branch sugerida:** `fix/upload-extension-feedback` · **Depende de:** BE-05 (mensagens/validação no init)
**Status:** Entregue no PR #37.

## Problema

Em `src/components/page/experiments/NewExperiment/index.tsx:193`:

```tsx
<input type="file" onChange={handleFileChange} hidden />
```

Sem `accept`, sem validação de extensão e sem texto na UI dizendo o que é aceito. O usuário só descobre o erro depois de subir o arquivo (ou nem descobre, porque o erro do backend é genérico).

## Escopo

- `accept=".fcs,.zip"` no input.
- Validação no `handleFileChange`: se a extensão não estiver em `[".fcs", ".zip"]`, não selecionar o arquivo e mostrar toast (`react-toastify`, já usado no projeto): `Apenas arquivos .fcs ou .zip são aceitos.`
- Texto de apoio permanente no modal, abaixo do botão de seleção: `Formatos aceitos: .fcs ou .zip`.
- Exibir o erro do backend (`detail`) quando o `init/`/`complete/` falhar, em vez de mensagem genérica.
- Manter o modal responsivo (`maxHeight: "90vh"`, `overflowY: "auto"`).

## Estrutura

Seguindo a separação de camadas do repo: a checagem de extensão vira util puro em `src/utils/` (ex.: `isAcceptedExperimentFile(name: string)`), consumida pelo handler do componente ou pelo hook de upload. Nada de regra de negócio inline no JSX.

## Arquivos a tocar

- `src/components/page/experiments/NewExperiment/index.tsx`
- `src/utils/` (novo util + teste)

## Critérios de aceite

- [ ] O seletor de arquivos do sistema só oferece `.fcs`/`.zip` por padrão.
- [ ] Selecionar um `.csv` (via "todos os arquivos") → toast de erro e nenhum arquivo selecionado no modal.
- [ ] Texto de formatos aceitos visível antes de escolher o arquivo.
- [ ] Erro devolvido pelo backend aparece na tela com a mensagem do `detail`.
- [ ] Modal continua usável em viewport `xs`.
