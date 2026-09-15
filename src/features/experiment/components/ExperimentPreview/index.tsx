import { useTheme } from "@mui/material/styles"
import { useEffect, useRef } from "react"
import { densityToRgb } from "../../../../utils/densityRamp"
import { useExperimentPreview } from "../../hooks/useExperimentPreview"

interface ExperimentPreviewProps {
	experimentId: number
	/** Só busca quando a listagem marcou `preview_available` (BE-21). */
	enabled: boolean
}

/**
 * Thumbnail do card de experimento: histograma 2D de baixa resolução pintado
 * num <canvas> com a mesma rampa de densidade do plot principal. Some
 * silenciosamente quando o back não tem preview pronto.
 */
export default function ExperimentPreview({
	experimentId,
	enabled,
}: ExperimentPreviewProps) {
	const mode = useTheme().palette.mode
	const { data } = useExperimentPreview(experimentId, enabled)
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		const histogram = data?.histogram
		if (!canvas || !histogram?.length) return

		const rows = histogram.length
		const cols = histogram[0]?.length ?? 0
		if (cols === 0) return

		canvas.width = cols
		canvas.height = rows
		const ctx = canvas.getContext("2d")
		if (!ctx) return

		let max = 0
		for (const row of histogram)
			for (const v of row) if (v != null && v > max) max = v
		if (max === 0) return

		const image = ctx.createImageData(cols, rows)
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				const v = histogram[y][x]
				if (v == null) continue
				// y_edges crescem "de baixo pra cima" no plot; no canvas a linha
				// 0 é o topo, então a linha y vai para rows-1-y.
				const offset = ((rows - 1 - y) * cols + x) * 4
				const [r, g, b] = densityToRgb(v / max, mode)
				image.data[offset] = r
				image.data[offset + 1] = g
				image.data[offset + 2] = b
				image.data[offset + 3] = 255
			}
		}
		ctx.putImageData(image, 0, 0)
	}, [data, mode])

	if (!data?.histogram?.length) return null

	return (
		<canvas
			ref={canvasRef}
			aria-label={`Prévia de densidade ${data.x_label} × ${data.y_label}`}
			style={{
				display: "block",
				width: "100%",
				aspectRatio: "16 / 9",
				borderRadius: 12,
				marginBottom: "0.6rem",
			}}
		/>
	)
}
