import { Box, Drawer, Tooltip, Typography } from "@mui/material"
import type { Theme } from "@mui/material/styles"
import type { ReactNode } from "react"

export interface CollapsiblePanelProps {
	/** Borda em que o painel vive no desktop (e lado da aba quando recolhido). */
	side: "left" | "right"
	open: boolean
	isMobile: boolean
	onOpen: () => void
	onClose: () => void
	/** Rótulo da aba/marca-página quando recolhido. */
	label: string
	/** Ícone da aba/marca-página. */
	icon: ReactNode
	/** Largura do painel aberto no desktop. */
	desktopWidth: number | string
	desktopMinWidth?: number
	/** Borda de onde o drawer sobe no mobile. Default = `side`. */
	mobileAnchor?: "left" | "right" | "bottom"
	/** Padding interno (o conteúdo que já se auto-espaça usa 0). */
	contentPadding?: number | string
	children: ReactNode
}

/**
 * Painel lateral colapsável reutilizável: no desktop abre como coluna e recolhe
 * numa aba (marca-página) grudada na borda; no mobile vira um Drawer overlay.
 * Árvore (esquerda) e estatísticas (direita) compartilham o mesmo componente,
 * mudando só o conteúdo.
 */
export default function CollapsiblePanel({
	side,
	open,
	isMobile,
	onOpen,
	onClose,
	label,
	icon,
	desktopWidth,
	desktopMinWidth,
	mobileAnchor,
	contentPadding = 0,
	children,
}: CollapsiblePanelProps) {
	if (isMobile) {
		const anchor = mobileAnchor ?? side
		return (
			<Drawer
				anchor={anchor}
				open={open}
				onClose={onClose}
				slotProps={{
					paper: {
						sx: (theme: Theme) =>
							anchor === "bottom"
								? {
										height: "80vh",
										borderTopLeftRadius: 16,
										borderTopRightRadius: 16,
										bgcolor: theme.palette.background.default,
										overflowY: "auto",
									}
								: {
										width: "80%",
										maxWidth: 340,
										p: contentPadding,
										bgcolor: theme.palette.background.default,
										display: "flex",
										flexDirection: "column",
										minHeight: 0,
										overflowY: "auto",
									},
					},
				}}
			>
				{children}
			</Drawer>
		)
	}

	if (open) {
		return (
			<Box
				sx={(theme: Theme) => ({
					width: desktopWidth,
					minWidth: desktopMinWidth,
					height: "100vh",
					[side === "left" ? "borderRight" : "borderLeft"]:
						`1px solid ${theme.palette.divider}`,
					bgcolor: theme.palette.background.default,
					overflowY: "auto",
					display: "flex",
					flexDirection: "column",
					minHeight: 0,
					p: contentPadding,
				})}
			>
				{children}
			</Box>
		)
	}

	return (
		<Box
			sx={{
				width: 32,
				minWidth: 32,
				height: "100vh",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: side === "left" ? "flex-start" : "flex-end",
			}}
		>
			<Tooltip
				title={`Mostrar ${label}`}
				placement={side === "left" ? "right" : "left"}
			>
				<Box
					role="button"
					onClick={onOpen}
					sx={(theme: Theme) => ({
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 0.5,
						py: 1.5,
						px: 0.5,
						cursor: "pointer",
						bgcolor: theme.palette.background.paper,
						color: theme.palette.text.secondary,
						border: `1px solid ${theme.palette.divider}`,
						boxShadow: theme.shadows[2],
						...(side === "left"
							? {
									borderLeft: "none",
									borderTopRightRadius: 8,
									borderBottomRightRadius: 8,
								}
							: {
									borderRight: "none",
									borderTopLeftRadius: 8,
									borderBottomLeftRadius: 8,
								}),
						"&:hover": {
							bgcolor: theme.palette.action.hover,
							color: theme.palette.primary.main,
						},
					})}
				>
					{icon}
					<Typography
						sx={{
							writingMode: "vertical-rl",
							fontSize: "0.65rem",
							fontWeight: 600,
							letterSpacing: "0.05em",
						}}
					>
						{label}
					</Typography>
				</Box>
			</Tooltip>
		</Box>
	)
}
