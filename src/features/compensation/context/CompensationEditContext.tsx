import React, {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react"
import type {
	CompensationChannelStats,
	CompensationMatrix,
} from "../../../services/compensationService"
import { useExperimentWorkspace } from "../../experiment/context/ExperimentWorkspaceContext"
import { fluorescentChannels } from "../utils/controlAssignments"
import {
	changedCellKeys,
	formatPercentCell,
	identityMatrix,
	invalidCellKeys,
	parsePercentGrid,
} from "../utils/matrixEdit"

/**
 * Estado do "modo edição de compensação" (FE-41 redesenhado): a
 * matriz-rascunho vive aqui — a seção Compensação do painel edita as
 * células e o plot central lê `matrix` pra renderizar a prévia.
 * Nada persiste até `Criar`/`Criar e aplicar`.
 */
interface CompensationEditing {
	/** Matriz de origem do ajuste; null = criação do zero. */
	base: CompensationMatrix | null
	name: string
	channels: string[]
	/** Grade em % como string (o que o usuário digita). */
	cells: string[][]
}

interface CompensationEditValue {
	editing: CompensationEditing | null
	/**
	 * Grade parseada em frações, pronta pro preview. Com célula inválida
	 * mantém a última versão válida — o gráfico não apaga nem dispara
	 * request nova enquanto o usuário termina de digitar.
	 */
	matrix: number[][] | null
	invalid: ReadonlySet<string>
	changed: ReadonlySet<string>
	/** Populações (gates) comparadas na tabela de MFI da prévia. */
	statsGates: number[]
	setStatsGates: (ids: number[]) => void
	/**
	 * `channel_stats` da última resposta da prévia — o plot publica aqui
	 * porque a query vive nele (precisa dos eixos/escalas) e o editor
	 * renderiza a tabela de MFI a partir deste valor.
	 */
	previewStats: CompensationChannelStats | null
	setPreviewStats: (stats: CompensationChannelStats | null) => void
	startEditing: (base: CompensationMatrix | null) => void
	cancelEditing: () => void
	setName: (name: string) => void
	setChannels: (channels: string[]) => void
	setCell: (i: number, j: number, raw: string) => void
}

const CompensationEditContext = createContext<
	CompensationEditValue | undefined
>(undefined)

export function useCompensationEdit(): CompensationEditValue {
	const ctx = useContext(CompensationEditContext)
	if (!ctx) {
		throw new Error(
			"useCompensationEdit must be used within CompensationEditProvider",
		)
	}
	return ctx
}

export function CompensationEditProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const { values } = useExperimentWorkspace()
	const [editing, setEditing] = useState<CompensationEditing | null>(null)
	const [statsGates, setStatsGates] = useState<number[]>([])
	const [previewStats, setPreviewStats] =
		useState<CompensationChannelStats | null>(null)

	const startEditing = useCallback(
		(base: CompensationMatrix | null) => {
			// Toda sessão de edição começa limpa — populações escolhidas são
			// do arquivo daquela sessão e stats velhos não vazam entre elas.
			setStatsGates([])
			setPreviewStats(null)
			if (base) {
				setEditing({
					base,
					name: `${base.name} (ajustada)`,
					channels: base.channels,
					cells: base.matrix.map((row) => row.map(formatPercentCell)),
				})
				return
			}
			// Criação do zero: todos os canais fluorescentes + identidade.
			const channels = fluorescentChannels(values)
			setEditing({
				base: null,
				name: "",
				channels,
				cells: identityMatrix(channels.length).map((row) =>
					row.map(formatPercentCell),
				),
			})
		},
		[values],
	)

	const cancelEditing = useCallback(() => {
		setEditing(null)
		setStatsGates([])
		setPreviewStats(null)
	}, [])
	const setName = useCallback(
		(name: string) => setEditing((prev) => (prev ? { ...prev, name } : prev)),
		[],
	)
	const setChannels = useCallback(
		(channels: string[]) =>
			setEditing((prev) =>
				prev
					? {
							...prev,
							channels,
							cells: identityMatrix(channels.length).map((row) =>
								row.map(formatPercentCell),
							),
						}
					: prev,
			),
		[],
	)
	const setCell = useCallback(
		(i: number, j: number, raw: string) =>
			setEditing((prev) =>
				prev
					? {
							...prev,
							cells: prev.cells.map((row, ri) =>
								ri === i ? row.map((v, rj) => (rj === j ? raw : v)) : row,
							),
						}
					: prev,
			),
		[],
	)

	const parsed = useMemo(
		() =>
			editing && editing.cells.length
				? (parsePercentGrid(editing.cells) as number[][])
				: null,
		[editing],
	)
	const invalid = useMemo(
		() => (editing ? invalidCellKeys(editing.cells) : new Set<string>()),
		[editing],
	)
	// Última grade válida: célula a meio de digitar ("0." por ex.) não
	// quebra a prévia — congela na versão válida anterior.
	const lastValidRef = useRef<number[][] | null>(null)
	const matrix = useMemo(() => {
		if (!editing) {
			lastValidRef.current = null
			return null
		}
		if (invalid.size === 0 && parsed) lastValidRef.current = parsed
		return lastValidRef.current
	}, [editing, invalid, parsed])
	const changed = useMemo(
		() =>
			editing?.base
				? changedCellKeys(editing.base.matrix, parsed ?? [])
				: new Set<string>(),
		[editing, parsed],
	)

	const value = useMemo<CompensationEditValue>(
		() => ({
			editing,
			matrix,
			invalid,
			changed,
			statsGates,
			setStatsGates,
			previewStats,
			setPreviewStats,
			startEditing,
			cancelEditing,
			setName,
			setChannels,
			setCell,
		}),
		[
			editing,
			matrix,
			invalid,
			changed,
			statsGates,
			previewStats,
			startEditing,
			cancelEditing,
			setName,
			setChannels,
			setCell,
		],
	)

	return (
		<CompensationEditContext.Provider value={value}>
			{children}
		</CompensationEditContext.Provider>
	)
}
