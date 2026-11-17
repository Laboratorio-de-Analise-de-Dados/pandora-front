import React from "react"
import { Box, Chip, IconButton, Tooltip } from "@mui/material"
import { MdClose as CloseIcon } from "react-icons/md"
import type { ChannelMeta, Gate, PlotViewConfig } from "../../../../types"
import { PlotStateProvider } from "../../context/PlotStateContext"
import ScatterPlot from "../scatter-plot"

interface GateDrilldownPanelProps {
	/** Gate-filho cuja população o painel mostra. */
	gate: Gate
	/** Nome do gate-pai — linhagem "pai → filho" do cabeçalho. */
	parentName?: string
	values: string[]
	fileDataId: number
	/** Config herdada do plot-pai (duplo clique carrega a config viva). */
	initialConfig?: Partial<PlotViewConfig>
	channelMeta?: ChannelMeta[]
	onPersist: (
		sourceType: "file" | "gate",
		sourceId: number,
		config: PlotViewConfig,
	) => void
	onConfigChange?: (config: PlotViewConfig) => void
	onPropagateGate?: (gate: Gate) => void
	onSaveChannelLabel?: (channel: string, label: string | null) => Promise<void>
	onClose: () => void
}

/**
 * FE-52: painel lateral "dentro do gate" — scatter-plot completo sobre a
 * densidade do gate-filho, ao lado do plot atual (não modal). Fechar não
 * remove o gate da árvore — ele já nasceu persistido.
 */
const GateDrilldownPanel: React.FC<GateDrilldownPanelProps> = ({
	gate,
	parentName,
	values,
	fileDataId,
	initialConfig,
	channelMeta,
	onPersist,
	onConfigChange,
	onPropagateGate,
	onSaveChannelLabel,
	onClose,
}) => (
	<Box
		sx={{
			display: "flex",
			flexDirection: "column",
			gap: 0.5,
			maxWidth: "100%",
			flexShrink: 0,
		}}
	>
		<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
			<Chip
				size="small"
				variant="outlined"
				label={
					parentName
						? `${parentName} → ${gate.name}`
						: `População de ${gate.name}`
				}
				sx={{ fontWeight: 600 }}
			/>
			<Box sx={{ flex: 1 }} />
			<Tooltip title="Fechar painel (o gate permanece na árvore)">
				<IconButton size="small" onClick={onClose} aria-label="Fechar">
					<CloseIcon style={{ fontSize: 16 }} />
				</IconButton>
			</Tooltip>
		</Box>
		<PlotStateProvider
			key={gate.id}
			sourceType="gate"
			sourceId={gate.id}
			initialConfig={initialConfig}
			channelMeta={channelMeta}
			onPersist={onPersist}
			onConfigChange={onConfigChange}
		>
			<ScatterPlot
				values={values}
				sourceType="gate"
				sourceId={gate.id}
				fileDataId={fileDataId}
				parentId={gate.id}
				parentName={gate.name}
				childGates={gate.children ?? []}
				siblingGateNames={(gate.children ?? []).map((g) => g.name)}
				onPropagateGate={onPropagateGate}
				onSaveChannelLabel={onSaveChannelLabel}
			/>
		</PlotStateProvider>
	</Box>
)

export default GateDrilldownPanel
