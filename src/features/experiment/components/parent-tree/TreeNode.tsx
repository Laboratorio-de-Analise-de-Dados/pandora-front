import { Box } from "@mui/material"
import {
	MdChevronRight as ChevronRight,
	MdExpandMore as ExpandMore,
} from "react-icons/md"
import { ReactNode, useState } from "react"

/**
 * Nó colapsável da árvore (subsample → amostra → gate). Substitui
 * SimpleTreeView/TreeItem do @mui/x-tree-view: clique na linha expande e
 * seleciona; o nó sem filhos não mostra ícone.
 */
export default function TreeNode({
	label,
	children,
	depth = 0,
	onSelect,
	defaultExpanded = true,
	inactive = false,
	selected = false,
}: {
	label: ReactNode
	children?: ReactNode
	depth?: number
	/** Seleção do nó (plot). Nós agrupadores não recebem onSelect. */
	onSelect?: () => void
	defaultExpanded?: boolean
	/** Amostra desabilitada: esmaecida em cinza (text.disabled do tema). */
	inactive?: boolean
	/** Fonte carregada no plot: faixa verde translúcida full-width (FE-26). */
	selected?: boolean
}) {
	const [expanded, setExpanded] = useState(defaultExpanded)
	const expandable = Boolean(children)

	const activate = () => {
		if (expandable) setExpanded((v) => !v)
		onSelect?.()
	}

	return (
		<Box role="treeitem" aria-expanded={expandable ? expanded : undefined}>
			<Box
				onClick={activate}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault()
						activate()
					}
				}}
				tabIndex={0}
				sx={(theme) => ({
					display: "flex",
					alignItems: "center",
					pl: 0.5 + depth * 2,
					pr: 0.5,
					py: 0.25,
					cursor: "pointer",
					userSelect: "none",
					...(selected && {
						backgroundColor: "rgba(16, 185, 129, 0.12)",
						color: theme.palette.text.primary,
					}),
					...(inactive && {
						color: theme.palette.text.disabled,
						backgroundColor: theme.palette.action.disabledBackground,
					}),
					"&:hover": {
						backgroundColor: inactive
							? theme.palette.action.disabledBackground
							: selected
								? "rgba(16, 185, 129, 0.18)"
								: "action.hover",
					},
					"&:focus-visible": {
						outline: "2px solid",
						outlineColor: "primary.main",
					},
				})}
			>
				<Box
					sx={{
						width: 18,
						height: 18,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0,
						color: "text.secondary",
					}}
				>
					{expandable &&
						(expanded ? (
							<ExpandMore style={{ fontSize: 18 }} />
						) : (
							<ChevronRight style={{ fontSize: 18 }} />
						))}
				</Box>
				<Box sx={{ flex: 1, minWidth: 0 }}>{label}</Box>
			</Box>
			{expandable && expanded && <Box role="group">{children}</Box>}
		</Box>
	)
}
