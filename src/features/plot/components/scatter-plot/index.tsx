import {
	Alert,
	Box,
	Button,
	CircularProgress,
	LinearProgress,
	Typography,
	useMediaQuery,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Plot from "react-plotly.js"
import { Gate, Scale } from "../../../../types"
import type { GateScope } from "../../../../services/gateService"
import { getGateColor } from "../../../../constants/gateColors"

import { usePlotContext } from "../../context/PlotStateContext"
import { useExperimentWorkspace } from "../../../experiment/context/ExperimentWorkspaceContext"
import { useCompensationEdit } from "../../../compensation/context/CompensationEditContext"
import { useCompensationPreview } from "../../../compensation/hooks/useCompensationPreview"
import { useDebouncedValue } from "../../hooks/useDebouncedValue"
import { useDensityQuery } from "../../hooks/useDensityQuery"
import { useGateDrawing } from "../../hooks/useGateDrawing"
import { useGateShapes } from "../../hooks/useGateShapes"
import { useGateMutations } from "../../hooks/useGateMutations"
import { useReshapeScope } from "../../hooks/useReshapeScope"
import { useConfirm } from "../../../../components/ConfirmDialog"
import { getCopyFamilyIds } from "../../../gate/utils"

import { COFACTOR } from "../../utils/biex"
import { buildTicks } from "../../utils/ticks"
import {
	buildPlotData,
	hasPlotData,
	SCATTER_COLOR,
} from "../../utils/plotTraces"
import { scatterGatePointColors } from "../../utils/scatterGateColors"
import { findQuadrantFamily } from "../../utils/gateHitTest"
import {
	buildGateHoverTraces,
	buildGateLabelTraces,
} from "../../utils/gateHoverTraces"
import { buildAxisRange } from "../../utils/plotAxes"
import { extractErrorMessage } from "../../../../utils/apiError"

import type { PlotMode } from "../../hooks/usePlotState"
import { usePlotCoordinates } from "./hooks/usePlotCoordinates"
import { useGateHitTest } from "./hooks/useGateHitTest"
import { useGateShapeEditing } from "./hooks/useGateShapeEditing"

import GateEditDialog from "../../../gate/components/gate-edit-dialog"
import ReshapeScopeDialog from "./components/ReshapeScopeDialog"
import { PlotSettingsPanel } from "./components/PlotSettingsPanel"
import PlotToolbar from "./components/PlotToolbar"
import GateContextMenu from "./components/GateContextMenu"
import PolygonEditOverlay from "./components/PolygonEditOverlay"

// Espera o usuário parar de mexer nos limites antes de repedir o gráfico ao
// backend (evita uma request por evento de slider).
const RANGE_REFETCH_DEBOUNCE_MS = 700

interface ScatterPlotProps {
	values: string[]
	sourceType: "file" | "gate"
	sourceId: number
	fileDataId: number
	parentId?: number
	parentName?: string
	siblingGateNames?: string[]
	childGates?: Gate[]
}

// Fundo do plot: cinza bem claro — lê como "branco" como nos softwares
// de citometria, mas sem o brilho que cansa a vista no dark mode.
const PLOT_BG = "#e5e5e5"

const ScatterPlot: React.FC<ScatterPlotProps> = ({
	values,
	sourceType,
	sourceId,
	fileDataId,
	parentId,
	parentName,
	siblingGateNames = [],
	childGates = [],
}) => {
	const plotState = usePlotContext()

	const {
		xAxis,
		yAxis,
		plotMode,
		tool,
		xScale,
		yScale,
		cutoff,
		xMin,
		xMax,
		yMin,
		yMax,
		handleSelectX,
		handleSelectY,
		setTool,
		setXScale,
		setYScale,
		setCutoff,
		setXMin,
		setXMax,
		setYMin,
		setYMax,
		setPlotMode,
	} = plotState

	const { invalidateExperiment, experimentFiles, subsamples, experimentId } =
		useExperimentWorkspace()

	// FE-41 — modo edição de compensação: o plot vira a prévia da matriz
	// em edição (rascunho, nada persistido). A query de densidade normal
	// desliga e a prévia alimenta os dados; gates ficam somente-leitura.
	const { editing: compEditing, matrix: compPreviewMatrix } =
		useCompensationEdit()
	const previewActive = compEditing != null

	// Nome do subsample da amostra atual — habilita o escopo "subsample" nos
	// diálogos (só existe quando a amostra está agrupada, BE-07).
	const currentSubsampleName = useMemo(() => {
		const file = experimentFiles.find((f) => f.id === fileDataId)
		if (file?.subsample == null) return undefined
		return subsamples.find((s) => s.id === file.subsample)?.name
	}, [experimentFiles, fileDataId, subsamples])

	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down("md"))
	const [settingsOpen, setSettingsOpen] = useState(false)

	// Gate edit dialog state
	const [selectedGate, setSelectedGate] = useState<Gate | null>(null)
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [editGateName, setEditGateName] = useState("")
	const [editGateColor, setEditGateColor] = useState("#0078FF")
	const [editGateScope, setEditGateScope] = useState<GateScope>("file")
	const [editGateError, setEditGateError] = useState<string | null>(null)
	const [savingGate, setSavingGate] = useState(false)
	// Context menu state
	const [contextMenu, setContextMenu] = useState<{
		mouseX: number
		mouseY: number
		gate: Gate
		gateIndex: number
	} | null>(null)
	// Reshape mode
	const [reshapingGateId, setReshapingGateId] = useState<number | null>(null)
	const settingsAvailable = tool !== "edit" && reshapingGateId === null
	// Polygon vertex editing state
	const [editingPolyGate, setEditingPolyGate] = useState<{
		gate: Gate
		swapped: boolean
	} | null>(null)
	const [editingVertices, setEditingVertices] = useState<[number, number][]>([])
	const editingVerticesRef = useRef<[number, number][]>([])
	editingVerticesRef.current = editingVertices
	const plotContainerRef = useRef<HTMLDivElement>(null)
	const { dataToPixel, pixelToData } = usePlotCoordinates(plotContainerRef)

	// O range vira janela de visualização imediata (layout do Plotly, usando
	// xMin/xMax "ao vivo") e, com debounce, também vira parâmetro da query: ao
	// parar de mexer, o backend recalcula o gráfico já enquadrado no range (para
	// todos os modos), inclusive empilhando na borda os pontos fora do limite.
	const dXMin = useDebouncedValue(xMin, RANGE_REFETCH_DEBOUNCE_MS)
	const dXMax = useDebouncedValue(xMax, RANGE_REFETCH_DEBOUNCE_MS)
	const dYMin = useDebouncedValue(yMin, RANGE_REFETCH_DEBOUNCE_MS)
	const dYMax = useDebouncedValue(yMax, RANGE_REFETCH_DEBOUNCE_MS)
	const density = useDensityQuery({
		sourceType,
		sourceId,
		xAxis,
		yAxis,
		plotMode,
		xScale,
		yScale,
		cutoff,
		xMin: dXMin,
		xMax: dXMax,
		yMin: dYMin,
		yMax: dYMax,
		enabled: !previewActive,
	})
	// Prévia ad-hoc (BE-36): a matriz-rascunho aplicada à amostra atual —
	// mesmos modo/eixos/escalas/ranges do plot. Debounce de ~400ms.
	const preview = useCompensationPreview({
		experimentId: Number(experimentId),
		channels: compEditing?.channels ?? [],
		matrix: compPreviewMatrix,
		fileId: fileDataId,
		xAxis,
		yAxis,
		enabled: previewActive,
		plotMode,
		xScale,
		yScale,
		cutoff,
		xMin: dXMin,
		xMax: dXMax,
		yMin: dYMin,
		yMax: dYMax,
	})
	const { data, isLoading, isFetching, isError, error } = previewActive
		? preview
		: density
	const refetch = density.refetch

	// BE-18: erro de canal ausente vem com `missing_channels` no payload — vira
	// aviso explicável; o resto segue como erro genérico com o detail real.
	const densityError = useMemo(() => {
		if (!isError) return null
		const resp = (
			error as {
				response?: {
					data?: { detail?: string; missing_channels?: string[] }
				}
			}
		)?.response?.data
		return {
			message: extractErrorMessage(error),
			missingChannels: resp?.missing_channels ?? [],
		}
	}, [isError, error])

	const loadFile = useCallback(() => {
		refetch()
		invalidateExperiment()
	}, [refetch, invalidateExperiment])

	const { patchCoordinates, deleteGate, deleteGates, saveGateNameColor } =
		useGateMutations(loadFile)
	const confirm = useConfirm()

	const familySizeOf = useCallback(
		(gateId: number) => getCopyFamilyIds(experimentFiles, gateId).length,
		[experimentFiles],
	)
	const {
		pending: pendingReshape,
		requestPatch,
		confirm: confirmReshape,
		cancel: cancelReshape,
	} = useReshapeScope(patchCoordinates, familySizeOf, loadFile)

	const effXScale: Scale = data?.x_scale ?? xScale
	const effYScale: Scale = data?.y_scale ?? yScale
	const effCof = data?.cofactor ?? COFACTOR

	// Remonta o Plot depois de criar um gate por seleção: o Plotly mantém o
	// outline da última box select, que ficava sobreposto ao gate recém-criado.
	const [drawRevision, setDrawRevision] = useState(0)
	const clearSelectionOutline = useCallback(
		() => setDrawRevision((n) => n + 1),
		[],
	)

	const { handleSelectedArea, handleQuadrantClick } = useGateDrawing({
		fileDataId,
		parentId,
		parentName,
		xAxis,
		yAxis,
		effXScale,
		effYScale,
		effCof,
		tool,
		plotMode,
		xScale,
		yScale,
		xMin,
		xMax,
		yMin,
		yMax,
		cutoff,
		siblingGateNames,
		loadFile,
		setTool,
		plotConfig: {
			xAxis,
			yAxis,
			xScale,
			yScale,
			xMin,
			xMax,
			yMin,
			yMax,
			cutoff,
			plotMode,
		},
		onGateDrawn: clearSelectionOutline,
	})

	const gateShapes = useGateShapes({
		childGates,
		xAxis,
		yAxis,
		effXScale,
		effYScale,
		plotMode: plotMode,
	})
	const { findGateAtPoint, findGateAtDataPoint } = useGateHitTest({
		plotContainerRef,
		gateShapes,
		childGates,
		effXScale,
		effYScale,
	})
	const { editableShapes, handleRelayout, savePolygonVertices } =
		useGateShapeEditing({
			gateShapes,
			editingPolyGate,
			tool,
			reshapingGateId,
			effXScale,
			effYScale,
			patchCoordinates: requestPatch,
		})

	// --- Gate click/context menu handlers ---
	// (gates são read-only durante a prévia de compensação — handlers
	// guardados por `previewActive` mais abaixo)
	const handleGateClick = (gate: Gate) => {
		if (previewActive) return
		setSelectedGate(gate)
		setEditGateName(gate.name)
		const idx = childGates.findIndex((g) => g.id === gate.id)
		setEditGateColor(getGateColor(gate.color, idx < 0 ? 0 : idx))
		setEditGateScope("file")
		setEditGateError(null)
		setEditDialogOpen(true)
	}

	const handleContextMenu = (event: React.MouseEvent) => {
		if (previewActive) return
		const hit = findGateAtPoint(event.clientX, event.clientY)
		if (hit) {
			event.preventDefault()
			setContextMenu({
				mouseX: event.clientX,
				mouseY: event.clientY,
				gate: hit.gate,
				gateIndex: hit.gateIndex,
			})
		}
	}

	const handleContextMenuClose = () => setContextMenu(null)

	const handleContextMenuEdit = () => {
		if (!contextMenu) return
		setSelectedGate(contextMenu.gate)
		setEditGateName(contextMenu.gate.name)
		setEditGateColor(
			getGateColor(contextMenu.gate.color, contextMenu.gateIndex),
		)
		setEditGateScope("file")
		setEditGateError(null)
		setEditDialogOpen(true)
		setContextMenu(null)
	}

	const handleContextMenuDelete = async () => {
		if (!contextMenu) return
		const gate = contextMenu.gate
		setContextMenu(null)

		// Quadrantes são criados como conjunto de 4 dividindo a mesma cruz —
		// excluir um só quebraria o conjunto, então apagam-se juntos.
		if (gate.gate_coordinates?.type === "quadrant") {
			const family = findQuadrantFamily(childGates, gate)
			const names = family.map((g) => g.name).join(", ")
			const ok = await confirm({
				title: `Excluir o conjunto de quadrantes?`,
				description: `O gate "${gate.name}" faz parte de um conjunto de ${family.length} quadrantes ligados à mesma cruz. Todos serão excluídos juntos: ${names}.`,
				confirmLabel: "Excluir todos",
				severity: "danger",
			})
			if (ok) await deleteGates(family)
			return
		}

		await deleteGate(gate)
	}

	const handleContextMenuReshape = () => {
		if (!contextMenu) return
		const gate = contextMenu.gate
		const gc = gate.gate_coordinates
		const gateType = gc.type ?? "rectangle"
		setContextMenu(null)

		if (gateType === "polygon" && "vertices" in gc) {
			const gateShape = gateShapes.find((s) => s._gateData?.id === gate.id)
			const swapped = gateShape?._swapped ?? false
			setEditingPolyGate({ gate, swapped })
			setEditingVertices(gc.vertices as [number, number][])
			setReshapingGateId(gate.id)
		} else {
			setReshapingGateId(gate.id)
		}
	}

	const handleExitReshape = () => {
		setReshapingGateId(null)
		setEditingPolyGate(null)
		setEditingVertices([])
	}

	const handleSaveGate = async () => {
		if (!selectedGate || !editGateName.trim()) {
			setEditGateError("Nome do gate não pode estar vazio")
			return
		}
		setSavingGate(true)
		const error = await saveGateNameColor(
			selectedGate.id,
			editGateName,
			editGateColor,
			editGateScope,
		)
		setSavingGate(false)
		if (error) {
			setEditGateError(error)
			return
		}
		setEditDialogOpen(false)
		setSelectedGate(null)
	}

	// Build Plotly trace data
	// O gráfico é sempre claro (mesmo no dark mode): legibilidade de
	// densidade/scatter segue o padrão dos softwares de citometria.
	// "Color gating": eventos dentro de gates visíveis ganham a cor deles.
	const pointColors = scatterGatePointColors(
		data?.x,
		data?.y,
		childGates,
		xAxis,
		yAxis,
		effXScale,
		effYScale,
		SCATTER_COLOR.light,
	)
	const plotData = buildPlotData(
		plotMode,
		data,
		"light",
		pointColors ?? undefined,
	)
	const hasData = hasPlotData(plotMode, data)

	// Traces transparentes só para hover: passar o mouse sobre a área de um
	// gate mostra um tooltip com as estatísticas dele (count/%pai/%total).
	// Desligado nas ferramentas quad/edit — nelas o clique usa
	// event.points[0] e um trace de fill poderia virar o ponto clicado.
	const histogramMaxY = data?.counts?.length
		? Math.max(...data.counts) * 1.05
		: 1
	const gateHoverTraces = useMemo(
		() =>
			tool === "quad" || tool === "edit" || reshapingGateId !== null
				? []
				: buildGateHoverTraces(gateShapes, histogramMaxY),
		[gateShapes, histogramMaxY, tool, reshapingGateId],
	)

	// Axis ranges and ticks
	const xAxisRange = buildAxisRange(xMin, xMax, effXScale, effCof)
	const yAxisRange = buildAxisRange(yMin, yMax, effYScale, effCof)
	const xTicks = buildTicks(xAxisRange, effXScale, effCof)
	const yTicks = buildTicks(yAxisRange, effYScale, effCof)

	// Labels de "nome (% do pai)" como text traces para todos os tipos de
	// gate — o label de shape do Plotly não respeita font.color em paths.
	const gateLabelTraces = buildGateLabelTraces(
		gateShapes,
		xAxisRange,
		yAxisRange,
	)

	// Na prévia de compensação o plot é só visualização — pan livre,
	// sem seleção de gate.
	const dragmode: "select" | "lasso" | "pan" | false = previewActive
		? "pan"
		: tool === "edit" || reshapingGateId !== null
			? "pan"
			: tool === "quad"
				? false
				: tool === "poly"
					? "lasso"
					: "select"

	// Plot click handler
	const handlePlotClickWrapper = async (event: Plotly.PlotMouseEvent) => {
		if (previewActive) return
		if (tool === "quad" && plotMode !== "histogram") {
			await handleQuadrantClick(event)
			return
		}
		if (tool === "edit" && event?.points?.[0]) {
			const clickPt = event.points[0]
			const clickDataX = clickPt.x as number
			const clickDataY = clickPt.y as number
			const hit = findGateAtDataPoint(
				clickDataX,
				clickDataY,
				(gate) => gate.gate_coordinates.type === "polygon",
			)
			if (hit && hit.gate.gate_coordinates.type === "polygon") {
				setEditingPolyGate({ gate: hit.gate, swapped: hit.swapped })
				setEditingVertices(hit.gate.gate_coordinates.vertices)
				return
			}
			if (editingPolyGate) {
				setEditingPolyGate(null)
				setEditingVertices([])
			}
			return
		}
	}

	// Deactivate polygon editing when switching tools
	useEffect(() => {
		if (tool !== "edit" && reshapingGateId === null) {
			setEditingPolyGate(null)
			setEditingVertices([])
		}
	}, [tool, reshapingGateId])

	// Escape key exits reshape mode
	useEffect(() => {
		if (reshapingGateId === null) return
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleExitReshape()
		}
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [reshapingGateId])

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "0.75rem",
				width: "100%",
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "0.75rem",
					width: "100%",
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						width: "100%",
					}}
				>
					{/* Coluna do plot: barra de controle + gráfico centrados
					    (FE-26 — organização do mockup). */}
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: "0.5rem",
							minWidth: 0,
							flexShrink: 1,
							width: "100%",
						}}
					>
						{/* Barra de controle: modo + eixos + tipo de gate +
							    escalas/limites + settings e histórico (FE-26).
							    No desktop fica acima do plot; no mobile vai para
							    a metade inferior da tela (abaixo do gráfico). */}
						<Box
							sx={{
								order: { xs: 3, md: 1 },
								width: "100%",
								display: "flex",
								justifyContent: "center",
							}}
						>
							<PlotToolbar
								values={values}
								plotMode={plotMode}
								onPlotModeChange={setPlotMode}
								xAxis={xAxis}
								yAxis={yAxis}
								onSelectX={handleSelectX}
								onSelectY={handleSelectY}
								tool={tool}
								onToolChange={setTool}
								xScale={xScale}
								yScale={yScale}
								onXScaleChange={setXScale}
								onYScaleChange={setYScale}
								xMin={xMin}
								xMax={xMax}
								yMin={yMin}
								yMax={yMax}
								cutoff={cutoff}
								onCutoffChange={setCutoff}
								onXMinChange={setXMin}
								onXMaxChange={setXMax}
								onYMinChange={setYMin}
								onYMaxChange={setYMax}
								controlsEnabled={settingsAvailable}
								gateToolsEnabled={!previewActive}
								settingsOpen={settingsOpen}
								onToggleSettings={() => setSettingsOpen((prev) => !prev)}
							/>
						</Box>
						{data && (
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ order: 2 }}
							>
								{/* Contexto da visualização: raiz do arquivo vs. dentro
								    de um gate — sem isso nada distingue os dois na tela. */}
								{sourceType === "gate"
									? `Gate ${parentName ? `"${parentName}"` : "selecionado"}`
									: "Amostra inteira"}
								{` · ${data.total_events.toLocaleString()} eventos`}
								{plotMode === "scatter" && data.sampled_events
									? ` · exibindo ${data.sampled_events.toLocaleString()}`
									: plotMode === "histogram"
										? " · histograma (100% dos dados)"
										: " · heatmap (100% dos dados)"}
								{previewActive ? " · prévia não salva" : ""}
							</Typography>
						)}
						<Box
							ref={plotContainerRef}
							onContextMenu={handleContextMenu}
							sx={(theme) => ({
								// Mobile: o plot ocupa a metade superior da tela
								// (quase full-width, limitado pela altura); desktop
								// mantém o poço centrado no canvas (FE-26).
								order: { xs: 1, md: 3 },
								width: {
									xs: "min(96vw, 52vh)",
									md: "min(70vh, 560px)",
								},
								maxWidth: "100%",
								aspectRatio: "1 / 1",
								flexShrink: 1,
								minWidth: 0,
								position: "relative",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								// Separa o plot do canvas (FE-26): superfície com
								// borda suave + raio — "poço" escuro no dark. Em
								// prévia de compensação a borda vira âmbar (FE-41).
								bgcolor: "background.paper",
								border: previewActive
									? `2px solid ${theme.palette.warning.main}`
									: `1px solid ${theme.palette.divider}`,
								borderRadius: 3,
								boxShadow: theme.shadows[2],
								overflow: "hidden",
							})}
						>
							{/* Chip flutuante de modo edição: o que se vê é a prévia da
							    matriz-rascunho — nada foi persistido. Sobrevoa o plot sem
							    ocupar espaço nem bloquear pan/zoom (pointerEvents none). */}
							{previewActive && (
								<Box
									sx={(theme) => ({
										position: "absolute",
										top: 8,
										left: "50%",
										transform: "translateX(-50%)",
										zIndex: 24,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										px: 1.5,
										py: 0.5,
										maxWidth: "calc(100% - 24px)",
										borderRadius: 999,
										bgcolor: "warning.main",
										color: theme.palette.getContrastText(
											theme.palette.warning.main,
										),
										boxShadow: theme.shadows[3],
										pointerEvents: "none",
									})}
								>
									<Typography variant="caption" fontWeight={700} noWrap>
										Editando compensação
										{compEditing?.base
											? ` "${compEditing.base.name}"`
											: " (nova matriz)"}{" "}
										— prévia não salva
									</Typography>
								</Box>
							)}
							{isError && !data ? (
								<Alert
									severity={
										densityError?.missingChannels.length ? "warning" : "error"
									}
									sx={{ maxWidth: 480 }}
								>
									{densityError?.message ?? "Erro ao carregar dados."}
								</Alert>
							) : hasData ? (
								<Plot
									key={
										tool === "edit" || reshapingGateId !== null
											? "edit-mode"
											: `draw-mode-${drawRevision}`
									}
									data={[...plotData, ...gateHoverTraces, ...gateLabelTraces]}
									useResizeHandler
									style={{ width: "100%", height: "100%" }}
									config={
										tool === "edit" || reshapingGateId !== null
											? {
													scrollZoom: false,
													displayModeBar: false,
													edits: {
														shapePosition: true,
														annotationPosition: false,
														annotationTail: false,
														annotationText: false,
														axisTitleText: false,
														colorbarPosition: false,
														colorbarTitleText: false,
														legendPosition: false,
														legendText: false,
														titleText: false,
													},
												}
											: { scrollZoom: false, displayModeBar: false }
									}
									layout={{
										dragmode,
										shapes: editableShapes as Plotly.Layout["shapes"],
										...(plotMode === "histogram"
											? { selectdirection: "h" as const }
											: {}),
										xaxis: {
											title: {
												text: `${xAxis}${effXScale === "biex" ? " (biex)" : ""}`,
											},
											...(xTicks
												? {
														tickmode: "array" as const,
														tickvals: xTicks.tickvals,
														ticktext: xTicks.ticktext,
													}
												: {}),
											range: xAxisRange,
											autorange: false,
											fixedrange: true,
											// Moldura completa: linha do eixo espelhada
											// no lado oposto (padrão citometria).
											showline: true,
											mirror: true,
											linewidth: 1,
											gridcolor: "rgba(0,0,0,0.2)",
											linecolor: "rgba(0,0,0,0.5)",
											zerolinecolor: "rgba(0,0,0,0.5)",
										},
										yaxis: {
											title: {
												text:
													plotMode === "histogram"
														? "Contagem"
														: `${yAxis}${effYScale === "biex" ? " (biex)" : ""}`,
											},
											...(plotMode !== "histogram" && yTicks
												? {
														tickmode: "array" as const,
														tickvals: yTicks.tickvals,
														ticktext: yTicks.ticktext,
													}
												: {}),
											...(plotMode !== "histogram"
												? { range: yAxisRange, autorange: false }
												: {}),
											fixedrange: true,
											showline: true,
											mirror: true,
											linewidth: 1,
											gridcolor: "rgba(0,0,0,0.2)",
											linecolor: "rgba(0,0,0,0.5)",
											zerolinecolor: "rgba(0,0,0,0.5)",
										},
										autosize: true,
										hovermode: "closest",
										hoverlabel: {
											bgcolor: "#ffffff",
											bordercolor: "rgba(0,0,0,0.15)",
											font: {
												color: "rgba(0,0,0,0.87)",
												size: 12,
											},
										},
										margin: { l: 60, r: 30, t: 30, b: 60 },
										// Plot sempre claro (mesmo no dark) — padrão
										// dos softwares de citometria. Off-white
										// reduz o brilho no dark mode.
										plot_bgcolor: PLOT_BG,
										paper_bgcolor: PLOT_BG,
										font: { color: "rgba(0,0,0,0.78)" },
										bargap: 0,
									}}
									onSelected={
										previewActive
											? undefined
											: (handleSelectedArea as (
													event: Readonly<Plotly.PlotSelectionEvent>,
												) => void)
									}
									onClick={handlePlotClickWrapper}
									onRelayout={
										handleRelayout as unknown as (
											event: Readonly<Plotly.PlotRelayoutEvent>,
										) => void
									}
								/>
							) : isLoading ? null : (
								<Typography>
									{data && data.total_events === 0
										? "O gate não contém eventos nesta amostra."
										: "Sem dados para os eixos selecionados."}
								</Typography>
							)}
							{isLoading && !hasData && (
								<Box
									sx={{
										position: "absolute",
										inset: 0,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										zIndex: 20,
									}}
								>
									<CircularProgress />
								</Box>
							)}
							{(isLoading || isFetching) && (
								<LinearProgress
									sx={{
										position: "absolute",
										top: 0,
										left: 0,
										right: 0,
										height: 3,
										zIndex: 26,
										borderTopLeftRadius: 4,
										borderTopRightRadius: 4,
									}}
								/>
							)}
							{(tool === "edit" || reshapingGateId !== null) &&
								editingPolyGate && (
									<PolygonEditOverlay
										editingPolyGate={editingPolyGate}
										vertices={editingVertices}
										verticesRef={editingVerticesRef}
										effXScale={effXScale}
										effYScale={effYScale}
										containerRef={plotContainerRef}
										dataToPixel={dataToPixel}
										pixelToData={pixelToData}
										onVerticesChange={setEditingVertices}
										onCommit={savePolygonVertices}
									/>
								)}
							{reshapingGateId !== null && (
								<Box
									sx={{
										position: "absolute",
										top: 12,
										right: 12,
										zIndex: 30,
									}}
								>
									<Button
										variant="contained"
										size="small"
										onClick={handleExitReshape}
									>
										Concluir
									</Button>
								</Box>
							)}
							{/* Configurações do plot: card overlay no canto do
								    gráfico, translúcido durante o ajuste das
								    escalas — mesma dinâmica no desktop e mobile. */}
							{settingsAvailable && (
								<PlotSettingsPanel
									open={settingsOpen}
									onClose={() => setSettingsOpen(false)}
									plotMode={plotMode}
									xScale={xScale}
									yScale={yScale}
									cutoff={cutoff}
									xMin={xMin}
									xMax={xMax}
									yMin={yMin}
									yMax={yMax}
									onXScaleChange={setXScale}
									onYScaleChange={setYScale}
									onCutoffChange={setCutoff}
									onXMinChange={setXMin}
									onXMaxChange={setXMax}
									onYMinChange={setYMin}
									onYMaxChange={setYMax}
									onPlotModeChange={setPlotMode}
								/>
							)}
						</Box>
					</Box>
				</Box>
			</Box>

			<GateEditDialog
				open={editDialogOpen}
				gate={selectedGate}
				name={editGateName}
				color={editGateColor}
				scope={editGateScope}
				familySize={selectedGate ? familySizeOf(selectedGate.id) : 0}
				subsampleName={currentSubsampleName}
				error={editGateError}
				saving={savingGate}
				onNameChange={setEditGateName}
				onColorChange={setEditGateColor}
				onScopeChange={setEditGateScope}
				onSave={handleSaveGate}
				onClose={() => setEditDialogOpen(false)}
			/>

			<ReshapeScopeDialog
				open={pendingReshape !== null}
				gateName={
					childGates.find((g) => g.id === pendingReshape?.gateId)?.name ?? ""
				}
				familySize={pendingReshape?.familySize ?? 0}
				subsampleName={currentSubsampleName}
				onConfirm={confirmReshape}
				onCancel={cancelReshape}
			/>

			<GateContextMenu
				anchorPosition={
					contextMenu
						? { top: contextMenu.mouseY, left: contextMenu.mouseX }
						: null
				}
				onClose={handleContextMenuClose}
				onReshape={handleContextMenuReshape}
				onEdit={handleContextMenuEdit}
				onDelete={handleContextMenuDelete}
				deleteLabel={
					contextMenu?.gate.gate_coordinates?.type === "quadrant"
						? "Excluir quadrantes"
						: "Excluir"
				}
			/>
		</Box>
	)
}

export default ScatterPlot
