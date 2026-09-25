---
name: ui-conventions
description: Visão de UX e convenções visuais do Pandora — princípios para citometristas, toolbar, selects, popovers e painéis do workspace (tema dark, mobile-first)
---

Convenções de UI do workspace do Pandora, consolidadas a partir de revisões
de design. Aplicar em qualquer controle, popover ou painel novo.

## Princípios de experiência (visão do produto)

O Pandora serve citometristas, não desenvolvedores. A meta é que a análise
pareça agradável e segura — não uma ferramenta que intimida. Toda feature
nova deve passar por este filtro antes das convenções táticas abaixo:

1. **Falar a língua do laboratório, nunca a da ferramenta.** Texto visível
   usa vocabulário de citometria ("linha de análise", "geometria",
   "controle", "poço") — nunca jargão técnico ("branch", "merge", "diff",
   chave crua como `gate_coordinates`). O termo técnico pode viver no
   código e na API; na interface vira domínio.
2. **Nada parece irreversível.** Ação que altera ou remove dados tem
   confirmação explicando a consequência em frase simples — e, sempre que
   possível, um desfazer visível (histórico/reversão é feature de UX, não
   só auditoria). Quem sabe que pode desfazer explora sem medo.
3. **Sugerir em vez de perguntar.** Defaults sensatos e pré-preenchimento
   por heurística (ex.: sugestão de controle por nome de arquivo/poço).
   Formulário em branco é último recurso — a pessoa revisa uma proposta,
   não preenche um cadastro.
4. **Revelação progressiva.** A tela mostra o essencial para a decisão
   atual; detalhe avançado fica a um clique (popover, tooltip, seção
   secundária). Valor técnico vira resumo legível: coordenadas de gate →
   "polígono em SSC-A × FSC-A", nunca JSON.
5. **Erro explica, não acusa.** Mensagem de erro diz o que aconteceu e o
   que o usuário pode fazer — nunca stacktrace, código HTTP cru ou
   "falha" seca. Sucesso confirma em frase de domínio.
6. **O visual ensina.** Cor e forma carregam significado consistente
   (estado de compensação, tipo de controle, seleção). Tooltip contextual
   explica o conceito no ponto de uso — antes de o usuário precisar de
   manual.
7. **Um lugar para cada coisa.** Cada ação mora num contexto só; o mesmo
   controle duplicado em dois lugares confunde (ver anti-padrões).

## Layout de páginas (desktop)

- **Conteúdo ancorado no topo-esquerdo em largura total** — a `Box` raiz da
  página precisa de `flex: 1`: ela é flex-item do `Layout` (row) e sem
  isso encolhe para a largura do conteúdo, deixando a página "concentrada
  no canto". Não usar `mx: "auto"` centralizado.
- `maxWidth` só quando a leitura pede (ex.: perfil com 2 cards → 1200px);
  listas/tabelas ocupam a largura toda (tela de Experimentos é a
  referência).
- Entre abas de uma mesma página, manter `minHeight` na área de conteúdo
  (~360px) para não "encolher e puxar" ao trocar — e `scrollbar-gutter:
stable` global já reserva o espaço da barra de rolagem.

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

- **Painel direito = casa da análise**: Estatísticas, Compensação e
  Histórico vivem como seções expansíveis (`PanelSection`) no
  `CollapsiblePanel` da direita — em área fixa do layout, nunca como
  overlay sobre o plot. Cada seção abre/fecha como dropdown; as três
  podem ficar abertas juntas (o painel rola). Painéis embutidos usam o
  modo `embedded` (sem header/scroll próprios — a seção é o header e o
  painel controla a rolagem).
- **Desktop**: sem triggers de compensação/histórico na página — o
  painel é a entrada única (o ícone flutuante do `CollapsiblePanel`
  reabre quando fechado).
- **Mobile**: o painel direito abre como **drawer lateral** (da direita
  pra esquerda) com as mesmas seções; a árvore segue bottom sheet da
  esquerda. Drawers mutuamente exclusivos (abrir um fecha os outros);
  plot no topo, controles abaixo, navegação de amostra perto do rodapé.
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
