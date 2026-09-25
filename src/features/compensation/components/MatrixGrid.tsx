import MatrixCellsGrid from "./MatrixCellsGrid"
import { formatPercentCell } from "../utils/matrixEdit"

/** Grade N×N read-only da matriz — mesma linguagem visual do editor. */
export default function MatrixGrid({
	channels,
	matrix,
}: {
	channels: string[]
	matrix: number[][]
}) {
	return (
		<MatrixCellsGrid
			channels={channels}
			cells={matrix.map((row) => row.map(formatPercentCell))}
		/>
	)
}
