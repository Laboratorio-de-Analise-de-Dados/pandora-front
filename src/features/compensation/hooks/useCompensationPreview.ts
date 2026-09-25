import { useMemo } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
	previewCompensation,
	type CompensationPreviewParams,
	type CompensationPreviewPayload,
	type CompensationPreviewResponse,
} from "../../../services/compensationService"
import { useDebouncedValue } from "../../plot/hooks/useDebouncedValue"
import { COFACTOR } from "../../plot/utils/biex"
import type { Scale } from "../../../types"
import type { PlotMode } from "../../plot/hooks/usePlotState"

export const PREVIEW_DEBOUNCE_MS = 400

interface UseCompensationPreviewParams {
	experimentId: number
	channels: string[]
	/** Matriz em edição (frações); null = grade inválida, não dispara. */
	matrix: number[][] | null
	/** Amostra selecionada no workspace (mesma fonte do plot principal). */
	fileId: number | undefined
	/** Fonte = gate: densidade da prévia filtrada àquela população. */
	gate?: number
	/** Populações comparadas no channel_stats (MFI por gate). */
	statsGates?: number[]
	xAxis: string
	yAxis: string
	/** Toggle do usuário && modo edição — desligado nem monta request. */
	enabled: boolean
	/** Params de render — espelham o density do plot principal (FE-41). */
	plotMode: PlotMode
	xScale: Scale
	yScale: Scale
	cutoff: number
	xMin?: string
	xMax?: string
	yMin?: string
	yMax?: string
}

/**
 * FE-41 + BE-36 — prévia ad-hoc da matriz em edição: o endpoint aplica
 * a matriz-rascunho na amostra sem persistir nada. Debounce ~400ms pra
 * não disparar a cada tecla; grade inválida ou modo desligado não
 * consultam nada. `keepPreviousData` mantém o plot anterior enquanto o
 * novo carrega — a edição nunca trava.
 */
export function useCompensationPreview({
	experimentId,
	channels,
	matrix,
	fileId,
	gate,
	statsGates,
	xAxis,
	yAxis,
	enabled,
	plotMode,
	xScale,
	yScale,
	cutoff,
	xMin,
	xMax,
	yMin,
	yMax,
}: UseCompensationPreviewParams) {
	const payload = useMemo<CompensationPreviewPayload | null>(() => {
		if (matrix == null || fileId == null || !xAxis || !yAxis) return null
		// Mesmos params do fetchDensity: a prévia é o mesmo gráfico com a
		// matriz-rascunho no lugar da compensação aplicada.
		const params: CompensationPreviewParams = {
			mode: plotMode,
			...(plotMode === "heatmap"
				? { bins: 200, cutoff }
				: plotMode === "histogram"
					? { bins: 256 }
					: { sample: 5000 }),
			xscale: xScale,
			yscale: yScale,
			cofactor: COFACTOR,
			...(xMin ? { xmin: xMin } : {}),
			...(xMax ? { xmax: xMax } : {}),
			...(yMin ? { ymin: yMin } : {}),
			...(yMax ? { ymax: yMax } : {}),
		}
		return {
			channels,
			matrix,
			file: fileId,
			x_axis: xAxis,
			y_axis: yAxis,
			...(gate != null ? { gate } : {}),
			...(statsGates?.length ? { gates: statsGates } : {}),
			params,
		}
	}, [
		channels,
		matrix,
		fileId,
		gate,
		statsGates,
		xAxis,
		yAxis,
		plotMode,
		xScale,
		yScale,
		cutoff,
		xMin,
		xMax,
		yMin,
		yMax,
	])
	const debounced = useDebouncedValue(payload, PREVIEW_DEBOUNCE_MS)

	return useQuery<CompensationPreviewResponse>({
		queryKey: ["compensation-preview", experimentId, debounced],
		queryFn: () =>
			previewCompensation(
				experimentId,
				debounced as CompensationPreviewPayload,
			),
		enabled: enabled && debounced != null,
		placeholderData: keepPreviousData,
	})
}
