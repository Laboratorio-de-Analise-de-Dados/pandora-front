import { useState } from "react"
import Plotly from "plotly.js/dist/plotly"
import { Button, Menu, MenuItem } from "@mui/material"
import { MdOutlineFileDownload } from "react-icons/md"
import type { AnalysisFigure } from "../../../services/figureService"
import { buildFigureCsvRows } from "../utils/figureSeries"
import { downloadFile, exportRows } from "../../stats/utils/exportHelpers"

interface FigureExportButtonProps {
	figure: AnalysisFigure
	graphDiv: HTMLElement | null
}

const safeName = (name: string) =>
	name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "") || "figura"

/**
 * Export da figura: PNG/SVG via `Plotly.toImage` (carimbo de revisão no
 * título já aparece na imagem) e CSV com cabeçalho de proveniência.
 */
const FigureExportButton = ({ figure, graphDiv }: FigureExportButtonProps) => {
	const [anchor, setAnchor] = useState<HTMLElement | null>(null)

	const exportImage = async (format: "png" | "svg") => {
		if (!graphDiv) return
		const dataUrl = await Plotly.toImage(graphDiv, {
			format,
			width: graphDiv.clientWidth || 960,
			height: graphDiv.clientHeight || 540,
		})
		const blob = await (await fetch(dataUrl)).blob()
		downloadFile(blob, `${safeName(figure.name)}.${format}`)
		setAnchor(null)
	}

	const exportCsv = () => {
		const rows = buildFigureCsvRows(
			figure.name,
			figure.result_revision,
			figure.result_cache?.meta?.computed_at,
			figure.spec.metric,
			figure.result_cache?.rows ?? [],
			figure.result_cache?.stats_tests,
		)
		exportRows(rows, `${safeName(figure.name)}.csv`, "csv")
		setAnchor(null)
	}

	return (
		<>
			<Button
				size="small"
				variant="outlined"
				startIcon={<MdOutlineFileDownload />}
				onClick={(e) => setAnchor(e.currentTarget)}
			>
				Exportar
			</Button>
			<Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
				<MenuItem onClick={() => exportImage("png")} disabled={!graphDiv}>
					PNG
				</MenuItem>
				<MenuItem onClick={() => exportImage("svg")} disabled={!graphDiv}>
					SVG
				</MenuItem>
				<MenuItem onClick={exportCsv}>CSV</MenuItem>
			</Menu>
		</>
	)
}

export default FigureExportButton
