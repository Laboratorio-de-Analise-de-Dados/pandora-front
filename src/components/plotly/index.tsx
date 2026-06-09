import { MdCropFree as CropFreeSharpIcon } from "react-icons/md"
import { MdGridOn as HeatmapIcon } from "react-icons/md"
import { MdScatterPlot as DotPlotIcon } from "react-icons/md"
import { MdRefresh as RefreshIcon } from "react-icons/md"
import { MdPentagon as PolygonIcon } from "react-icons/md"

import {
	Box,
	Divider,
	Select,
	Slider,
	Button,
	CircularProgress,
	MenuItem,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
	SelectChangeEvent,
} from "@mui/material"
import React, { useState } from "react"
import Plot from "react-plotly.js"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import CytometryApi from "../../API"
import { DensityResponse, GateCoordinates, NewGate, Scale } from "../../types"

type PlotMode = "heatmap" | "scatter"
type GateTool = "rect" | "poly"

const COFACTOR = 150

// arcsinh (biex) e seu inverso, para converter entre espaço cru e exibido.
const toRaw = (v: number, scale: Scale, cof: number): number =>
	scale === "biex" ? Math.sinh(v) * cof : v

const biex = (v: number, cof: number): number => Math.asinh(v / cof)

// FSC/SSC/Time são lineares; demais canais usam biex por padrão (igual ao back).
const defaultScale = (param: string): Scale => {
	const p = param.toLowerCase()
	return p.startsWith("fsc") || p.startsWith("ssc") || p === "time"
		? "linear"
		: "biex"
}

const NICE_RAW = [-100000, -10000, -1000, 0, 1000, 10000, 100000, 1000000]

const SUPERSCRIPTS: Record<string, string> = {
	"0": "\u2070",
	"1": "\u00B9",
	"2": "\u00B2",
	"3": "\u00B3",
	"4": "\u2074",
	"5": "\u2075",
	"6": "\u2076",
	"7": "\u2077",
	"8": "\u2078",
	"9": "\u2079",
}

const toSuperscript = (s: string): string =>
	s
		.split("")
		.map((c) => SUPERSCRIPTS[c] ?? c)
		.join("")

const fmtTick = (raw: number): string => {
	if (raw === 0) return "0"
	const abs = Math.abs(raw)
	const exp = Math.round(Math.log10(abs))
	if (10 ** exp === abs) {
		const sign = raw < 0 ? "-" : ""
		return `${sign}10${toSuperscript(String(exp))}`
	}
	return String(raw)
}

// Em biex, gera ticks em unidades reais posicionados no espaço transformado.
const buildTicks = (
	edges: number[] | undefined,
	scale: Scale,
	cof: number,
): { tickvals: number[]; ticktext: string[] } | undefined => {
	if (scale !== "biex" || !edges || edges.length < 2) return undefined
	const min = edges[0]
	const max = edges[edges.length - 1]
	const tickvals: number[] = []
	const ticktext: string[] = []
	for (const raw of NICE_RAW) {
		const t = biex(raw, cof)
		if (t >= min && t <= max) {
			tickvals.push(t)
			ticktext.push(fmtTick(raw))
		}
	}
	return tickvals.length ? { tickvals, ticktext } : undefined
}

// --- helpers para range sliders ---
const rawToSlider = (raw: number, scale: Scale): number =>
	scale === "biex" ? biex(raw, COFACTOR) : raw

const sliderToRaw = (val: number, scale: Scale): number =>
	scale === "biex" ? Math.round(Math.sinh(val) * COFACTOR) : Math.round(val)

const BIEX_SLIDER_MIN = biex(-100000, COFACTOR)
const BIEX_SLIDER_MAX = biex(1000000, COFACTOR)
const LINEAR_SLIDER_MAX = 262144

const BIEX_SLIDER_MARKS = NICE_RAW.map((raw) => ({
	value: biex(raw, COFACTOR),
	label: fmtTick(raw),
}))

const LINEAR_SLIDER_MARKS = [0, 65000, 130000, 200000, 262144].map((v) => ({
	value: v,
	label: v === 0 ? "0" : `${Math.round(v / 1000)}k`,
}))

interface ScatterPlotProps {
	values: string[]
	sourceType: "file" | "gate"
	sourceId: number
	fileDataId: number
	parentId?: number
	loadFile: () => void
}

// Converte as bordas (n+1) do histograma em centros (n) para o eixo do heatmap.
const edgesToCenters = (edges?: number[]): number[] => {
	if (!edges || edges.length < 2) return []
	const centers: number[] = []
	for (let i = 0; i < edges.length - 1; i++) {
		centers.push((edges[i] + edges[i + 1]) / 2)
	}
	return centers
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
	values,
	sourceType,
	sourceId,
	fileDataId,
	parentId,
	loadFile,
}) => {
	const [y_axix_selector, set_y_axis_selector] = useState("SSC-A")
	const [x_axix_selector, set_x_axis_selector] = useState("FSC-A")
	const [plotMode, setPlotMode] = useState<PlotMode>("scatter")
	const [tool, setTool] = useState<GateTool>("rect")
	const [xScale, setXScale] = useState<Scale>(defaultScale("FSC-A"))
	const [yScale, setYScale] = useState<Scale>(defaultScale("SSC-A"))
	// Cutoff de densidade: bins com contagem <= cutoff somem (transparentes).
	const [cutoff, setCutoff] = useState(0)
	const [xMin, setXMin] = useState("")
	const [xMax, setXMax] = useState("")
	const [yMin, setYMin] = useState("")
	const [yMax, setYMax] = useState("")
	const [selectedSquareName, setSelectedSquareName] = useState("")
	// Coordenadas do gate já convertidas para espaço CRU (linear), prontas p/ salvar.
	const [pendingGate, setPendingGate] = useState<GateCoordinates | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	const queryClient = useQueryClient()

	// Plano D: pede ao back para regenerar o cache (Parquet/Redis) a partir do
	// .fcs original + gates. Ao concluir, descarta o cache local de density.
	const recompute = useMutation({
		mutationFn: async () => {
			await CytometryApi.post(`/experiment/file/${fileDataId}/recompute`)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["density"] })
		},
	})

	// Busca os dados agregados no backend (cacheados pelo React Query enquanto
	// o experimento está aberto). O cálculo pesado fica 100% no back.
	const { data, isLoading, isFetching, isError } = useQuery<DensityResponse>({
		queryKey: [
			"density",
			sourceType,
			sourceId,
			x_axix_selector,
			y_axix_selector,
			plotMode,
			xScale,
			yScale,
			cutoff,
			xMin,
			xMax,
			yMin,
			yMax,
		],
		queryFn: async () => {
			const base =
				sourceType === "file"
					? `/experiment/file/${sourceId}`
					: `/analytics/gate/${sourceId}`
			const params =
				plotMode === "heatmap"
					? `mode=heatmap&bins=200&cutoff=${cutoff}`
					: "mode=scatter&sample=5000"
			const scaleParams = `xscale=${xScale}&yscale=${yScale}&cofactor=${COFACTOR}`
			const rangeParams = [
				xMin ? `xmin=${xMin}` : "",
				xMax ? `xmax=${xMax}` : "",
				yMin ? `ymin=${yMin}` : "",
				yMax ? `ymax=${yMax}` : "",
			]
				.filter(Boolean)
				.join("&")
			const qs = [params, scaleParams, rangeParams]
				.filter(Boolean)
				.join("&")
			const res = await CytometryApi.get<DensityResponse>(
				`${base}/density?x=${encodeURIComponent(
					x_axix_selector,
				)}&y=${encodeURIComponent(y_axix_selector)}&${qs}`,
			)
			return res.data
		},
	})

	const handleSelectX = (e: SelectChangeEvent<string>) => {
		if (e.target) {
			set_x_axis_selector(e.target.value)
			setXScale(defaultScale(e.target.value))
		}
	}
	const handleSelectY = (e: SelectChangeEvent<string>) => {
		if (e.target) {
			set_y_axis_selector(e.target.value)
			setYScale(defaultScale(e.target.value))
		}
	}

	const handlePlotMode = (_: React.MouseEvent, mode: PlotMode | null) => {
		if (mode) setPlotMode(mode)
	}

	// Escalas efetivamente usadas no desenho atual (eco do back, com fallback).
	const effXScale: Scale = data?.x_scale ?? xScale
	const effYScale: Scale = data?.y_scale ?? yScale
	const effCof = data?.cofactor ?? COFACTOR

	// Recebe seleção do Plotly (box=retângulo, lasso=polígono) e converte os
	// vértices do espaço EXIBIDO (biex) de volta para CRU antes de guardar.
	const handleSelectedArea = async (event: any) => {
		if (!event) return

		if (tool === "poly" && event.lassoPoints) {
			const lx: number[] = event.lassoPoints.x || []
			const ly: number[] = event.lassoPoints.y || []
			if (lx.length < 3) return
			const vertices = lx.map(
				(vx, i) =>
					[
						toRaw(vx, effXScale, effCof),
						toRaw(ly[i], effYScale, effCof),
					] as [number, number],
			)
			setPendingGate({
				type: "polygon",
				x_axis: x_axix_selector,
				y_axis: y_axix_selector,
				vertices,
			})
			setTool("rect")
			setIsDialogOpen(true)
			return
		}

		if (tool === "rect" && event.range) {
			const { x, y } = event.range
			const xs = [toRaw(x[0], effXScale, effCof), toRaw(x[1], effXScale, effCof)]
			const ys = [toRaw(y[0], effYScale, effCof), toRaw(y[1], effYScale, effCof)]
			setPendingGate({
				type: "rectangle",
				startX: Math.min(...xs),
				endX: Math.max(...xs),
				startY: Math.min(...ys),
				endY: Math.max(...ys),
			})
			setTool("rect")
			setIsDialogOpen(true)
		}
	}

	const handleDialogClose = () => {
		setIsDialogOpen(false)
	}

	const handleSquareNameChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		setSelectedSquareName(event.target.value)
	}

	const handleSquareNameSubmit = async () => {
		if (selectedSquareName && pendingGate) {
			const newSelection: NewGate = {
				file_data: fileDataId,
				name: selectedSquareName,
				parent: parentId,
				gate_coordinates: pendingGate,
				dashboard: {
					name: `${x_axix_selector} X ${y_axix_selector}`,
					dashboard_config: {
						x_axis_label: x_axix_selector,
						y_axis_label: y_axix_selector,
					},
					file_data: fileDataId,
				},
			}

			await CytometryApi.post("analytics/gate", newSelection)
			setPendingGate(null)
			setSelectedSquareName("")
			handleDialogClose()
			loadFile()
		}
	}

	// Monta os traces do Plotly conforme o modo selecionado.
	const plotData: any[] =
		plotMode === "heatmap"
			? [
					{
						type: "heatmap",
						z: data?.histogram ?? [],
						x: edgesToCenters(data?.x_edges),
						y: edgesToCenters(data?.y_edges),
						colorscale: "Jet",
						showscale: true,
					},
			  ]
			: [
					{
						type: "scattergl",
						mode: "markers",
						x: data?.x ?? [],
						y: data?.y ?? [],
						marker: { color: "black", size: 2 },
					},
			  ]

	const hasData =
		plotMode === "heatmap"
			? !!data?.histogram?.length
			: !!data?.x?.length

	// Em biex, mapeia os ticks de volta para unidades reais (10², 10³, ...).
	const xRange =
		plotMode === "heatmap"
			? data?.x_edges
			: data?.x && data.x.length
			? [Math.min(...data.x), Math.max(...data.x)]
			: undefined
	const yRange =
		plotMode === "heatmap"
			? data?.y_edges
			: data?.y && data.y.length
			? [Math.min(...data.y), Math.max(...data.y)]
			: undefined
	// Fixa o range dos eixos com base nos seletores (se definidos).
	const xAxisRange =
		xMin !== "" && xMax !== ""
			? effXScale === "biex"
				? [biex(parseFloat(xMin), effCof), biex(parseFloat(xMax), effCof)]
				: [parseFloat(xMin), parseFloat(xMax)]
			: undefined
	const yAxisRange =
		yMin !== "" && yMax !== ""
			? effYScale === "biex"
				? [biex(parseFloat(yMin), effCof), biex(parseFloat(yMax), effCof)]
				: [parseFloat(yMin), parseFloat(yMax)]
			: undefined

	// Ticks: quando o seletor de range está definido, usa o range do seletor
	// para gerar ticks (não o range dos dados retornados).
	const xTickSource = xAxisRange ?? xRange
	const yTickSource = yAxisRange ?? yRange
	const xTicks = buildTicks(xTickSource, effXScale, effCof)
	const yTicks = buildTicks(yTickSource, effYScale, effCof)

	const dragmode: "select" | "lasso" =
		tool === "poly" ? "lasso" : "select"

	return (
		<Box sx={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
			{/* Centro: toolbar + gráfico */}
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "0.75rem",
				}}
			>
				<Box
					sx={{
						width: "fit-content",
						display: "flex",
						alignItems: "center",
						gap: "1rem",
					}}
				>
					<Typography variant="subtitle1">Ferramentas:</Typography>
					<ToggleButtonGroup
						value={tool}
						exclusive
						onChange={(_, v: GateTool | null) => v && setTool(v)}
					>
						<ToggleButton value="rect" size="small" title="Gate retangular">
							<CropFreeSharpIcon />
						</ToggleButton>
						<ToggleButton
							value="poly"
							size="small"
							title="Gate poligonal (laço)"
						>
							<PolygonIcon />
						</ToggleButton>
					</ToggleButtonGroup>
					<ToggleButtonGroup
						value={plotMode}
						exclusive
						onChange={handlePlotMode}
					>
						<ToggleButton
							value="heatmap"
							size="small"
							title="Heatmap (densidade)"
						>
							<HeatmapIcon />
						</ToggleButton>
						<ToggleButton
							value="scatter"
							size="small"
							title="Dot plot (amostra)"
						>
							<DotPlotIcon />
						</ToggleButton>
					</ToggleButtonGroup>
					<Button
						size="small"
						variant="outlined"
						startIcon={
							recompute.isPending ? (
								<CircularProgress size={16} />
							) : (
								<RefreshIcon />
							)
						}
						disabled={recompute.isPending}
						onClick={() => recompute.mutate()}
						title="Reprocessar a partir do .fcs original + gates"
					>
						Reprocessar
					</Button>
				</Box>

				{data && (
					<Typography variant="caption" color="text.secondary">
						{data.total_events.toLocaleString()} eventos
						{plotMode === "scatter" && data.sampled_events
							? ` · amostra de ${data.sampled_events.toLocaleString()}`
							: " · heatmap (100% dos dados)"}
					</Typography>
				)}

				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: "1rem",
						}}
					>
						<Select
							onChange={handleSelectY}
							value={y_axix_selector}
							sx={{ transform: "rotate(-90deg)" }}
						>
							{values.map((value, index) => (
								<MenuItem key={index} value={value}>
									{value}
								</MenuItem>
							))}
						</Select>
						<Box
							sx={{
								width: 500,
								height: 500,
								position: "relative",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{isError && !data ? (
								<Typography color="error">
									Erro ao carregar dados.
								</Typography>
							) : hasData ? (
								<Plot
									data={plotData}
									config={{ scrollZoom: false, displayModeBar: false }}
									layout={{
										dragmode,
										xaxis: {
											title: `${x_axix_selector}${
												effXScale === "biex" ? " (biex)" : ""
											}`,
											...(xTicks
												? {
														tickmode: "array" as const,
														tickvals: xTicks.tickvals,
														ticktext: xTicks.ticktext,
												  }
												: {}),
											...(xAxisRange ? { range: xAxisRange } : {}),
											fixedrange: true,
										},
										yaxis: {
											title: `${y_axix_selector}${
												effYScale === "biex" ? " (biex)" : ""
											}`,
											...(yTicks
												? {
														tickmode: "array" as const,
														tickvals: yTicks.tickvals,
														ticktext: yTicks.ticktext,
												  }
												: {}),
											...(yAxisRange ? { range: yAxisRange } : {}),
											fixedrange: true,
										},
										width: 500,
										height: 500,
										plot_bgcolor: "#FFFFFF",
										paper_bgcolor: "#FFFFFF",
									}}
									onSelected={handleSelectedArea}
								/>
							) : isLoading ? null : (
								<Typography>
									Sem dados para os eixos selecionados.
								</Typography>
							)}
							{(isLoading || isFetching) && (
								<Box
									sx={{
										position: "absolute",
										inset: 0,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: "rgba(255,255,255,0.6)",
										zIndex: 10,
									}}
								>
									<CircularProgress />
								</Box>
							)}
						</Box>
					</Box>
					<Select value={x_axix_selector} onChange={handleSelectX}>
						{values.map((value, index) => (
							<MenuItem key={index} value={value}>
								{value}
							</MenuItem>
						))}
					</Select>
				</Box>
			</Box>

			{/* Direita: painel de configurações */}
			<Box
				sx={{
					width: 220,
					flexShrink: 0,
					borderLeft: "1px solid",
					borderColor: "divider",
					pl: "1rem",
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
					overflowY: "auto",
					maxHeight: 600,
				}}
			>
				<Typography variant="subtitle2" fontWeight="bold">
					Configurações
				</Typography>

				<Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
					<Typography variant="caption" color="text.secondary">
						Escala
					</Typography>
					<ToggleButtonGroup
						value={xScale}
						exclusive
						onChange={(_, v: Scale | null) => v && setXScale(v)}
						size="small"
						fullWidth
					>
						<ToggleButton value="linear" title="Eixo X linear">
							X lin
						</ToggleButton>
						<ToggleButton value="biex" title="Eixo X biex">
							X biex
						</ToggleButton>
					</ToggleButtonGroup>
					<ToggleButtonGroup
						value={yScale}
						exclusive
						onChange={(_, v: Scale | null) => v && setYScale(v)}
						size="small"
						fullWidth
					>
						<ToggleButton value="linear" title="Eixo Y linear">
							Y lin
						</ToggleButton>
						<ToggleButton value="biex" title="Eixo Y biex">
							Y biex
						</ToggleButton>
					</ToggleButtonGroup>
				</Box>

				<Divider />

				<Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
					<Typography variant="caption" color="text.secondary">
						Eixo X
					</Typography>
					<Slider
						value={[
							xMin !== ""
								? rawToSlider(Number(xMin), xScale)
								: xScale === "biex"
									? BIEX_SLIDER_MIN
									: 0,
							xMax !== ""
								? rawToSlider(Number(xMax), xScale)
								: xScale === "biex"
									? BIEX_SLIDER_MAX
									: LINEAR_SLIDER_MAX,
						]}
						onChange={(_, val) => {
							const [lo, hi] = val as number[]
							setXMin(String(sliderToRaw(lo, xScale)))
							setXMax(String(sliderToRaw(hi, xScale)))
						}}
						min={xScale === "biex" ? BIEX_SLIDER_MIN : 0}
						max={xScale === "biex" ? BIEX_SLIDER_MAX : LINEAR_SLIDER_MAX}
						step={xScale === "biex" ? 0.01 : 500}
						marks={xScale === "biex" ? BIEX_SLIDER_MARKS : LINEAR_SLIDER_MARKS}
						valueLabelDisplay="auto"
						valueLabelFormat={(v) => {
							const raw = sliderToRaw(v, xScale)
							return raw === 0 ? "0" : raw.toLocaleString()
						}}
						size="small"
						sx={{
							"& .MuiSlider-markLabel": { fontSize: "0.55rem" },
							mb: 1,
						}}
					/>
					<Box sx={{ display: "flex", gap: "0.5rem" }}>
						<TextField
							label="Min"
							type="number"
							size="small"
							value={xMin}
							onChange={(e) => setXMin(e.target.value)}
							sx={{ flex: 1 }}
						/>
						<TextField
							label="Max"
							type="number"
							size="small"
							value={xMax}
							onChange={(e) => setXMax(e.target.value)}
							sx={{ flex: 1 }}
						/>
					</Box>
				</Box>

				<Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
					<Typography variant="caption" color="text.secondary">
						Eixo Y
					</Typography>
					<Slider
						value={[
							yMin !== ""
								? rawToSlider(Number(yMin), yScale)
								: yScale === "biex"
									? BIEX_SLIDER_MIN
									: 0,
							yMax !== ""
								? rawToSlider(Number(yMax), yScale)
								: yScale === "biex"
									? BIEX_SLIDER_MAX
									: LINEAR_SLIDER_MAX,
						]}
						onChange={(_, val) => {
							const [lo, hi] = val as number[]
							setYMin(String(sliderToRaw(lo, yScale)))
							setYMax(String(sliderToRaw(hi, yScale)))
						}}
						min={yScale === "biex" ? BIEX_SLIDER_MIN : 0}
						max={yScale === "biex" ? BIEX_SLIDER_MAX : LINEAR_SLIDER_MAX}
						step={yScale === "biex" ? 0.01 : 500}
						marks={yScale === "biex" ? BIEX_SLIDER_MARKS : LINEAR_SLIDER_MARKS}
						valueLabelDisplay="auto"
						valueLabelFormat={(v) => {
							const raw = sliderToRaw(v, yScale)
							return raw === 0 ? "0" : raw.toLocaleString()
						}}
						size="small"
						sx={{
							"& .MuiSlider-markLabel": { fontSize: "0.55rem" },
							mb: 1,
						}}
					/>
					<Box sx={{ display: "flex", gap: "0.5rem" }}>
						<TextField
							label="Min"
							type="number"
							size="small"
							value={yMin}
							onChange={(e) => setYMin(e.target.value)}
							sx={{ flex: 1 }}
						/>
						<TextField
							label="Max"
							type="number"
							size="small"
							value={yMax}
							onChange={(e) => setYMax(e.target.value)}
							sx={{ flex: 1 }}
						/>
					</Box>
				</Box>

				{plotMode === "heatmap" && (
					<>
						<Divider />
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: "0.5rem",
							}}
						>
							<Typography variant="caption" color="text.secondary">
								Densidade
							</Typography>
							<TextField
								label="Cutoff"
								type="number"
								size="small"
								value={cutoff}
								onChange={(e) =>
									setCutoff(Math.max(0, Number(e.target.value) || 0))
								}
								inputProps={{ min: 0, step: 1 }}
								fullWidth
								title="Bins com contagem <= cutoff ficam transparentes"
							/>
						</Box>
					</>
				)}
			</Box>

			<Dialog open={isDialogOpen} onClose={handleDialogClose}>
				<DialogTitle>Inserir Nome da Seleção</DialogTitle>
				<DialogContent>
					<TextField
						label="Nome da Seleção"
						value={selectedSquareName}
						onChange={handleSquareNameChange}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleSquareNameSubmit}>Salvar</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}

export default ScatterPlot
