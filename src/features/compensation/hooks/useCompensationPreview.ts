import { useMemo } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
	previewCompensation,
	type CompensationPreviewPayload,
} from "../../../services/compensationService"
import { useDebouncedValue } from "../../plot/hooks/useDebouncedValue"
import { COFACTOR, defaultScale } from "../../plot/utils/biex"
import type { DensityResponse, Scale } from "../../../types"

export const PREVIEW_DEBOUNCE_MS = 400
const PREVIEW_BINS = 120

interface UseCompensationPreviewParams {
	experimentId: number
	channels: string[]
	/** Matriz em edição (frações); null = grade inválida, não dispara. */
	matrix: number[][] | null
	/** Amostra selecionada no workspace (mesma fonte do plot principal). */
	fileId: number | undefined
	xAxis: string
	yAxis: string
	/** Toggle do usuário && modo edição — desligado nem monta request. */
	enabled: boolean
	/**
	 * Params de render a espelhar do plot principal (modo workspace):
	 * escalas/cutoff/bins atuais. Default = preview compacto do dialog.
	 */
	bins?: number
	xScale?: Scale
	yScale?: Scale
	cutoff?: number
}

/**
 * FE-41 — preview ad-hoc da matriz em edição (BE-36, hoje stub).
 * Debounce ~400ms pra não disparar a cada tecla; grade inválida, eixo
 * vazio ou toggle desligado não consultam nada. `keepPreviousData`
 * mantém o plot anterior enquanto o novo carrega — a edição nunca trava.
 */
export function useCompensationPreview({
	experimentId,
	channels,
	matrix,
	fileId,
	xAxis,
	yAxis,
	enabled,
	bins,
	xScale,
	yScale,
	cutoff,
}: UseCompensationPreviewParams) {
	const payload = useMemo<CompensationPreviewPayload | null>(
		() =>
			matrix == null || fileId == null || !xAxis || !yAxis
				? null
				: {
						channels,
						matrix,
						file: fileId,
						x_axis: xAxis,
						y_axis: yAxis,
						params: {
							mode: "heatmap",
							bins: bins ?? PREVIEW_BINS,
							cutoff: cutoff ?? 0,
							xscale: xScale ?? defaultScale(xAxis),
							yscale: yScale ?? defaultScale(yAxis),
							cofactor: COFACTOR,
						},
					},
		[channels, matrix, fileId, xAxis, yAxis, bins, xScale, yScale, cutoff],
	)
	const debounced = useDebouncedValue(payload, PREVIEW_DEBOUNCE_MS)

	return useQuery<DensityResponse>({
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
