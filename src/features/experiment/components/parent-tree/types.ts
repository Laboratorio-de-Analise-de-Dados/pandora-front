import type React from "react"
import type {
	ExperimentFiles,
	Gate,
	SelectedSource,
	Subsample,
} from "../../../../types"
import type { GateScope } from "../../../../services/gateService"

/** Payload da edição completa do gate (nome + cor + escopo, FE-23). */
export interface GateEditPayload {
	name: string
	color: string
	scope: GateScope
}

/** Callbacks que os itens da árvore disparam — montado por
 * `useTreeInteractions` e repassado de GateTreeItem/FileTreeItem/
 * SubsampleGroupItem. */
export interface TreeHandlers {
	onSelect: (source: SelectedSource) => void
	onDeleteGate?: (gateId: number, gateName: string) => void
	/** Salva nome/cor/escopo; devolve mensagem de erro ou null no sucesso. */
	onEditGate?: (
		gateId: number,
		payload: GateEditPayload,
	) => Promise<string | null>
	onApplyGate?: (gateId: number, gateName: string) => void
	onDisableFile?: (fileDataIds: number[]) => void
	onEnableFile?: (fileDataIds: number[]) => void
	onMenuOpen: (event: React.MouseEvent, gate: Gate) => void
	onContextMenu: (event: React.MouseEvent, gate: Gate) => void
	onFileMenuOpen: (event: React.MouseEvent, file: ExperimentFiles) => void
	onSubsampleMenuOpen?: (event: React.MouseEvent, subsample: Subsample) => void
	/** Fonte atualmente carregada no plot — destaca o nó correspondente. */
	selectedSource?: SelectedSource | null
	/** Seleção múltipla de amostras (mover em lote); omitido sem onMoveFile. */
	selectedFileIds?: Set<number>
	onToggleFile?: (fileId: number) => void
	onToggleGroup?: (fileIds: number[], checked: boolean) => void
	onFileInfo?: (file: ExperimentFiles) => void
}
