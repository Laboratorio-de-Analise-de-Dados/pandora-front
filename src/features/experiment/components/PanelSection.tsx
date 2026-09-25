import { Box, Collapse, Typography } from "@mui/material"
import { MdExpandLess, MdExpandMore } from "react-icons/md"
import type { ReactNode } from "react"

interface PanelSectionProps {
	title: string
	icon?: ReactNode
	open: boolean
	onToggle: () => void
	/** Adorno à direita do título, antes do chevron (ex.: indicador de estado). */
	trailing?: ReactNode
	children: ReactNode
}

/**
 * Seção expansível dentro do painel lateral (tipo dropdown): o header
 * clicável expande/colapsa o conteúdo. Estatísticas e Compensação
 * dividem a coluna direita sem overlay sobre o plot.
 */
export default function PanelSection({
	title,
	icon,
	open,
	onToggle,
	trailing,
	children,
}: PanelSectionProps) {
	return (
		<Box sx={{ flexShrink: 0 }}>
			<Box
				role="button"
				onClick={onToggle}
				sx={(theme) => ({
					display: "flex",
					alignItems: "center",
					gap: 0.75,
					px: 1.5,
					py: 1,
					cursor: "pointer",
					userSelect: "none",
					color: theme.palette.text.secondary,
					borderBottom: `1px solid ${theme.palette.divider}`,
					"&:hover": {
						bgcolor: theme.palette.action.hover,
						color: theme.palette.primary.main,
					},
				})}
			>
				{icon}
				<Typography
					variant="caption"
					fontWeight={700}
					sx={{ flex: 1, letterSpacing: "0.06em", textTransform: "uppercase" }}
				>
					{title}
				</Typography>
				{trailing}
				{open ? (
					<MdExpandLess style={{ fontSize: 18 }} />
				) : (
					<MdExpandMore style={{ fontSize: 18 }} />
				)}
			</Box>
			<Collapse in={open}>
				<Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
					{children}
				</Box>
			</Collapse>
		</Box>
	)
}
