import {
	Box,
	Chip,
	IconButton,
	List,
	ListItemButton,
	ListItemText,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material"
import {
	MdAdd,
	MdOutlineDelete,
	MdOutlineStackedBarChart,
	MdOutlineScatterPlot,
	MdOutlineShowChart,
} from "react-icons/md"
import type {
	AnalysisFigureListItem,
	FigureChartType,
} from "../../../services/figureService"

const CHART_ICONS: Record<FigureChartType, React.ReactNode> = {
	stats_bar: <MdOutlineStackedBarChart />,
	stats_strip: <MdOutlineScatterPlot />,
	distribution: <MdOutlineShowChart />,
}

export const CHART_TYPE_LABELS: Record<FigureChartType, string> = {
	stats_bar: "Barras",
	stats_strip: "Strip plot",
	distribution: "Distribuição",
}

interface FigureGalleryProps {
	figures: AnalysisFigureListItem[]
	selectedId: number | null
	onSelect: (id: number) => void
	onCreate: () => void
	onDelete: (id: number) => void
	canEdit: boolean
}

/** Galeria de figuras persistidas do experimento (FE-36). */
const FigureGallery = ({
	figures,
	selectedId,
	onSelect,
	onCreate,
	onDelete,
	canEdit,
}: FigureGalleryProps) => (
	<Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="space-between"
			sx={{ px: 2, py: 1 }}
		>
			<Typography variant="subtitle2">Figuras</Typography>
			{canEdit && (
				<Tooltip title="Nova figura">
					<IconButton size="small" onClick={onCreate}>
						<MdAdd />
					</IconButton>
				</Tooltip>
			)}
		</Stack>
		{figures.length === 0 ? (
			<Typography
				variant="body2"
				color="text.secondary"
				sx={{ px: 2, py: 3, textAlign: "center" }}
			>
				Nenhuma figura ainda.
				{canEdit
					? " Crie a primeira para comparar populações entre grupos."
					: ""}
			</Typography>
		) : (
			<List dense sx={{ overflowY: "auto", flex: 1 }}>
				{figures.map((f) => (
					<ListItemButton
						key={f.id}
						selected={f.id === selectedId}
						onClick={() => onSelect(f.id)}
					>
						<Box sx={{ mr: 1, display: "flex", color: "text.secondary" }}>
							{CHART_ICONS[f.chart_type]}
						</Box>
						<ListItemText
							primary={f.name}
							secondary={`${CHART_TYPE_LABELS[f.chart_type]} · ${
								f.created_by_name ?? "—"
							} · ${new Date(f.updated_at).toLocaleString()}`}
							primaryTypographyProps={{ variant: "body2", noWrap: true }}
							secondaryTypographyProps={{ variant: "caption", noWrap: true }}
						/>
						<Stack direction="row" spacing={0.5} alignItems="center">
							{f.is_stale && (
								<Tooltip title="Dados de entrada mudaram — recompute para atualizar">
									<Chip label="desatualizada" size="small" color="warning" />
								</Tooltip>
							)}
							{f.published && (
								<Chip
									label="publicada"
									size="small"
									color="info"
									variant="outlined"
								/>
							)}
							{canEdit && (
								<Tooltip title="Arquivar figura">
									<IconButton
										size="small"
										onClick={(e) => {
											e.stopPropagation()
											onDelete(f.id)
										}}
									>
										<MdOutlineDelete style={{ fontSize: 16 }} />
									</IconButton>
								</Tooltip>
							)}
						</Stack>
					</ListItemButton>
				))}
			</List>
		)}
	</Box>
)

export default FigureGallery
