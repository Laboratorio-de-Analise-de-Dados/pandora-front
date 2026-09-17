---
name: ui-conventions
description: Convenções visuais do Pandora — toolbar, selects, popovers e painéis do workspace (tema dark, mobile-first)
---

Convenções de UI do workspace do Pandora, consolidadas a partir de revisões
de design. Aplicar em qualquer controle, popover ou painel novo.

## Controles em barra (toolbar do plot e afins)

- **Tudo `outlined` com `size="small"` e label na borda** — `FormControl` +
  `InputLabel` + `Select` com `label=`, ou `TextField variant="outlined"`.
  Nunca misturar selects de texto pelado (`variant="standard" +
disableUnderline`) com outlined na mesma barra.
- Labels curtos e nomeados: `Modo`, `X`, `Y`, `Gate`, `Escala X/Y`,
  `Limites X/Y`, `Corte`. O label identifica o controle — o valor fica
  dentro da caixa.
- `fontWeight: 600` nos valores; mesma altura visual pra tudo (o `small`
  já uniformiza).
- Gatilhos de popover que não são select de verdade → `TextField`
  `readOnly` outlined + `InputAdornment` com chevron no fim — fica
  idêntico aos selects e abre o popover no click. Não usar `Button
variant="outlined"` (peso visual diferente).

## Popovers / janelinhas

Estrutura canônica — borda por fora, coluna com padding por dentro:

```tsx
<Popover
	slotProps={{
		paper: {
			sx: {
				p: 2, // respiro da caixa
				border: "1px solid",
				borderColor: "divider", // a "bordinha" — sombra sozinha não basta
			},
		},
	}}
>
	<Box
		// padding nos 4 lados — nada colado na borda
		sx={{ display: "flex", flexDirection: "column", gap: 1.5, px: 1.5, py: 1 }}
	>
		<Typography
			variant="caption"
			fontWeight="bold"
			color="text.secondary"
			textAlign="center"
		>
			Título
		</Typography>
		{/* conteúdo */}
	</Box>
</Popover>
```

- **Nada colado nas bordas** — padding lateral E vertical internos; os
  itens ficam visivelmente afastados da borda da caixa.
- Campos pequenos (Min/Max, números) ficam **centrados com largura fixa**
  (~100px), não esticados na largura toda — `justifyContent: "center"`.
- Título do popover centralizado, `caption` + `text.secondary`.

## Sliders em popover

- `size="small"`, thumb ~10–12px, `height: 4`.
- Com `marks`: fonte das etiquetas ~0.55rem e **margem lateral no slider**
  (`mx`) suficiente pras etiquetas das pontas não vazarem da trilha nem
  encostarem na borda da caixa.
- Slider é ajuste grosso; os campos numéricos ficam embaixo pro valor exato.

## Painéis do workspace

- **Desktop**: histórico/compensação são overlays sobre a área central —
  nunca escondem árvore nem stats. Botão de esconder painel lateral só
  existe quando o painel está **fechado** (serve pra reabrir).
- **Mobile**: bottom sheets mutuamente exclusivos (abrir um fecha os
  outros); plot no topo ocupando a largura, controles abaixo, navegação
  de amostra perto do rodapé.
- Workspace ocupa exatamente a viewport — sem scroll de página; footer
  global fica escondido nessa rota. Scroll só dentro de painéis.

## Anti-padrões vistos (não repetir)

- Selects de texto sem caixa misturados com campos outlined na mesma barra
- Popover só com sombra, sem borda, conteúdo colado nas bordas
- Dois ícones/controles duplicados pra mesma ação (ex.: histórico na
  toolbar E no sourceNav — cada contexto tem seu lugar)
- Item selecionado da árvore com borda clara + arredondado — seleção é só
  a faixa de fundo translúcida
- Campos derivados de dados (ex.: canais/`values`) editáveis — exibir como
  chips read-only com helper explicando a origem
