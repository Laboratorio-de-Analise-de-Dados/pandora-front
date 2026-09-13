import {
	Box,
	IconButton,
	Tab,
	Tabs,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material"
import type { SxProps } from "@mui/material/styles"
import type { ReactElement, ReactNode } from "react"
import { MdClose as CloseIcon } from "react-icons/md"
import CollapsiblePanel from "./CollapsiblePanel"

export interface SidePanelTab {
	id: string
	label: string
	icon?: ReactElement
	content: ReactNode
}

interface ExperimentSidePanelProps {
	side?: "left" | "right"
	isMobile: boolean
	open: boolean
	activeTab: string
	tabs: SidePanelTab[]
	onOpen: () => void
	onClose: () => void
	onTabChange: (tabId: string) => void
	/** No mobile, deixa o fundo do drawer semitransparente (ex.: durante ajuste de config). */
	transparent?: boolean
}

/**
 * Painel lateral com abas para a página de experimento.
 *
 * - Desktop: coluna fixa à esquerda (ou direita) com abas no topo.
 * - Mobile: drawer vindo da lateral com abas e botões flutuantes de gatilho.
 *
 * As três abas (Gates, Config, Estatísticas) usam a mesma base (`CollapsiblePanel`);
 * só o conteúdo muda.
 */
export default function ExperimentSidePanel({
	side = "left",
	isMobile,
	open,
	activeTab,
	tabs,
	onOpen,
	onClose,
	onTabChange,
	transparent,
}: ExperimentSidePanelProps) {
	const theme = useTheme()
	const active = tabs.find((t) => t.id === activeTab) ?? tabs[0]

	const tabBar = (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				borderBottom: `1px solid ${theme.palette.divider}`,
			}}
		>
			<Tabs
				value={activeTab}
				onChange={(_, value) => onTabChange(value as string)}
				variant="scrollable"
				scrollButtons="auto"
				sx={{ flex: 1, minHeight: 48 }}
			>
				{tabs.map((tab) => (
					<Tab
						key={tab.id}
						value={tab.id}
						icon={tab.icon}
						iconPosition="start"
						label={
							<Typography variant="caption" fontWeight={600}>
								{tab.label}
							</Typography>
						}
						sx={{ minHeight: 48, textTransform: "none" }}
					/>
				))}
			</Tabs>
			<IconButton onClick={onClose} size="small" sx={{ mr: 0.5 }}>
				<CloseIcon size="1.1rem" />
			</IconButton>
		</Box>
	)

	const panelContent = (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				overflow: "hidden",
			}}
		>
			{tabBar}
			<Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
				{active?.content}
			</Box>
		</Box>
	)

	const paperSx: SxProps | undefined = transparent
		? {
				bgcolor: "rgba(255, 255, 255, 0.25)",
				boxShadow: "none",
			}
		: undefined

	return (
		<>
			{/* Gatilhos customizados quando fechado */}
			{!open && (
				<Box
					sx={{
						position: "absolute",
						top: 8,
						[side]: 8,
						zIndex: 21,
						display: "flex",
						flexDirection: isMobile ? "row" : "column",
						gap: 0.5,
					}}
				>
					{tabs.map((tab) => (
						<Tooltip key={tab.id} title={tab.label} placement="right">
							<Box
								role="button"
								onClick={() => {
									onTabChange(tab.id)
									onOpen()
								}}
								sx={(theme) => ({
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: 32,
									height: 32,
									borderRadius: 1,
									cursor: "pointer",
									bgcolor: theme.palette.background.paper,
									color: theme.palette.text.secondary,
									border: `1px solid ${theme.palette.divider}`,
									boxShadow: theme.shadows[2],
									"&:hover": {
										bgcolor: theme.palette.action.hover,
										color: theme.palette.primary.main,
									},
								})}
							>
								{tab.icon ?? (
									<Typography variant="caption" fontWeight="bold">
										{tab.label.charAt(0).toUpperCase()}
									</Typography>
								)}
							</Box>
						</Tooltip>
					))}
				</Box>
			)}

			<CollapsiblePanel
				side={side}
				open={open}
				isMobile={isMobile}
				onOpen={onOpen}
				onClose={onClose}
				label={active?.label ?? ""}
				icon={active?.icon ?? null}
				desktopWidth={320}
				desktopMinWidth={280}
				contentPadding={0}
				hideTrigger
				paperSx={paperSx}
			>
				{panelContent}
			</CollapsiblePanel>
		</>
	)
}
