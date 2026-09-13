import type React from "react"
import type {
	ExperimentFiles,
	Gate,
	SelectedSource,
	Subsample,
} from "../../../../types"

/** Callbacks que os itens da árvore disparam — montado por
 * `useTreeInteractions` e repassado de GateTreeItem/FileTreeItem/
 * SubsampleGroupItem. */
export interface TreeHandlers {
	onSelect: (source: SelectedSource) => void
	onDeleteGate?: (gateId: number, gateName: string) => void
	onRenameGate?: (gateId: number, newName: string) => void
	onApplyGate?: (gateId: number, gateName: string) => void
	onDisableFile?: (fileDataIds: number[]) => void
	onEnableFile?: (fileDataIds: number[]) => void
	onMenuOpen: (event: React.MouseEvent, gate: Gate) => void
	onContextMenu: (event: React.MouseEvent, gate: Gate) => void
	onFileMenuOpen: (event: React.MouseEvent, file: ExperimentFiles) => void
	onSubsampleMenuOpen?: (event: React.MouseEvent, subsample: Subsample) => void
	/** Seleção múltipla de amostras (mover em lote); omitido sem onMoveFile. */
	selectedFileIds?: Set<number>
	onToggleFile?: (fileId: number) => void
	onToggleGroup?: (fileIds: number[], checked: boolean) => void
	onFileInfo?: (file: ExperimentFiles) => void
}
