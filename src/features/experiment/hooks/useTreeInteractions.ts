import { useState } from "react"
import type {
	ExperimentFiles,
	Gate,
	SelectedSource,
	Subsample,
} from "../../../types"
import type { GateScope } from "../../../services/gateService"
import type { TagTarget } from "../../tags/utils/tagTargets"
import { collectAllGates } from "../../gate/utils"
import type {
	ExpandSignal,
	TreeHandlers,
} from "../components/parent-tree/types"

export interface TreeInteractionsParams {
	files: ExperimentFiles[]
	onSelect: (source: SelectedSource) => void
	onDeleteGate?: (gateId: number, gateName: string) => void
	/** Edição completa do gate (nome + cor + escopo, FE-23). */
	onEditGate?: (
		gateId: number,
		payload: { name: string; color: string; scope: GateScope },
	) => Promise<string | null>
	onApplyGate?: (gateId: number, gateName: string) => void
	/** FE-42 — "Sugerir populações" a partir deste gate como pai. */
	onSuggestGate?: (gateId: number) => void
	/** Exclusão em lote dos gates marcados no modo de seleção. */
	onDeleteGates?: (gateIds: number[]) => void
	onDisableFile?: (fileDataIds: number[]) => void
	onEnableFile?: (fileDataIds: number[]) => void
	onCreateSubsample?: (name: string) => Promise<string | null>
	onRenameSubsample?: (
		subsampleId: number,
		name: string,
	) => Promise<string | null>
	onArchiveSubsample?: (subsampleId: number) => void
	onMoveFile?: (fileDataIds: number[], subsampleId: number | null) => void
	/** Marca o subsample como controle de compensação (BE-22). */
	onSetSubsampleControl?: (
		subsampleId: number,
		payload: {
			control_type: "unstained" | "single_stain" | null
			control_channel?: string
		},
	) => Promise<string | null>
	/** Substitui as tags explícitas de uma ou mais amostras (BE-34). */
	onSaveFileTags?: (targets: TagTarget[]) => Promise<string | null>
}

/**
 * Todo o estado de interação do ParentTree: menus ⋮ e de contexto, modo de
 * seleção em lote, alvos dos diálogos (rename/disable/move/metadata/
 * subsample). O componente fica só com a composição; os itens da árvore
 * recebem `handlers` pronto.
 */
export function useTreeInteractions({
	files,
	onSelect,
	onDeleteGate,
	onEditGate,
	onApplyGate,
	onSuggestGate,
	onDeleteGates,
	onDisableFile,
	onEnableFile,
	onCreateSubsample,
	onRenameSubsample,
	onArchiveSubsample,
	onMoveFile,
	onSetSubsampleControl,
	onSaveFileTags,
}: TreeInteractionsParams) {
	// Edição completa do gate pela árvore — mesmo diálogo do gráfico (FE-23).
	const [editTarget, setEditTarget] = useState<Gate | null>(null)
	const [editName, setEditName] = useState("")
	const [editColor, setEditColor] = useState("#0078FF")
	const [editScope, setEditScope] = useState<GateScope>("file")
	const [editError, setEditError] = useState<string | null>(null)
	const [editSaving, setEditSaving] = useState(false)

	// Hamburger menu state
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
	const [menuGate, setMenuGate] = useState<Gate | null>(null)

	// Context menu state (right-click)
	const [contextMenu, setContextMenu] = useState<{
		x: number
		y: number
	} | null>(null)
	const [contextGate, setContextGate] = useState<Gate | null>(null)

	// Menu e confirmação por amostra (desabilitar / reativar / mover)
	const [fileMenuAnchor, setFileMenuAnchor] = useState<null | HTMLElement>(null)
	const [menuFile, setMenuFile] = useState<ExperimentFiles | null>(null)
	const [disableTargets, setDisableTargets] = useState<ExperimentFiles[]>([])
	// Seleção em lote: select liga o modo; as ações (mover/desabilitar/reativar)
	// aparecem como chips com a contagem de selecionadas.
	const [selectionMode, setSelectionMode] = useState(false)
	const [selectedFileIds, setSelectedFileIds] = useState<Set<number>>(new Set())
	const [selectedGateIds, setSelectedGateIds] = useState<Set<number>>(new Set())
	const [bulkDeleteTargets, setBulkDeleteTargets] = useState<Gate[]>([])
	const [moveTargets, setMoveTargets] = useState<ExperimentFiles[]>([])
	const [metadataTarget, setMetadataTarget] = useState<ExperimentFiles | null>(
		null,
	)

	// Subsample: menu ⋮ do grupo + diálogo de criar/renomear + arquivar
	const [subsampleMenuAnchor, setSubsampleMenuAnchor] =
		useState<null | HTMLElement>(null)
	const [menuSubsample, setMenuSubsample] = useState<Subsample | null>(null)
	const [subsampleFormOpen, setSubsampleFormOpen] = useState(false)
	const [subsampleFormTarget, setSubsampleFormTarget] =
		useState<Subsample | null>(null)
	const [archiveTarget, setArchiveTarget] = useState<Subsample | null>(null)
	const [controlTarget, setControlTarget] = useState<Subsample | null>(null)
	const [tagTargets, setTagTargets] = useState<ExperimentFiles[]>([])
	const [expandSignal, setExpandSignal] = useState<ExpandSignal | undefined>()

	const handleFileMenuOpen = (
		event: React.MouseEvent,
		file: ExperimentFiles,
	) => {
		event.stopPropagation()
		setFileMenuAnchor(event.currentTarget as HTMLElement)
		setMenuFile(file)
	}

	const closeFileMenu = () => {
		setFileMenuAnchor(null)
		setMenuFile(null)
	}

	const handleToggleFile = (fileId: number) => {
		setSelectedFileIds((prev) => {
			const next = new Set(prev)
			if (next.has(fileId)) next.delete(fileId)
			else next.add(fileId)
			return next
		})
	}

	const handleToggleGroup = (fileIds: number[], checked: boolean) => {
		setSelectedFileIds((prev) => {
			const next = new Set(prev)
			fileIds.forEach((id) => (checked ? next.add(id) : next.delete(id)))
			return next
		})
	}

	const handleToggleGate = (gateId: number) => {
		setSelectedGateIds((prev) => {
			const next = new Set(prev)
			if (next.has(gateId)) next.delete(gateId)
			else next.add(gateId)
			return next
		})
	}

	const selectedFiles = files.filter((f) => selectedFileIds.has(f.id))
	// Mover vale para qualquer amostra; desabilitar só as ativas, reativar só
	// as inativas (visíveis só com "Mostrar desabilitadas" ligado).
	const activeSelected = selectedFiles.filter((f) => f.active !== false)
	const inactiveSelected = selectedFiles.filter((f) => f.active === false)

	const fileBulk = !!(onMoveFile || onDisableFile || onEnableFile)
	const canBulk = fileBulk || !!onDeleteGates

	const toggleSelectionMode = () => {
		setSelectionMode((v) => !v)
		setSelectedFileIds(new Set())
		setSelectedGateIds(new Set())
	}

	const closeSubsampleMenu = () => {
		setSubsampleMenuAnchor(null)
		setMenuSubsample(null)
	}

	const handleSubsampleFormSubmit = async (name: string) => {
		if (subsampleFormTarget && onRenameSubsample) {
			return onRenameSubsample(subsampleFormTarget.id, name)
		}
		if (onCreateSubsample) return onCreateSubsample(name)
		return "Ação indisponível"
	}

	const closeMenu = () => {
		setMenuAnchor(null)
		setMenuGate(null)
	}

	const closeContextMenu = () => {
		setContextMenu(null)
		setContextGate(null)
	}

	const openEdit = (gate: Gate) => {
		setEditTarget(gate)
		setEditName(gate.name)
		setEditColor(gate.color ?? "#0078FF")
		setEditScope("file")
		setEditError(null)
	}

	const handlers: TreeHandlers = {
		onSelect,
		onDeleteGate,
		onEditGate,
		onApplyGate,
		onDisableFile,
		onEnableFile,
		onMenuOpen: (event: React.MouseEvent, gate: Gate) => {
			event.stopPropagation()
			setMenuAnchor(event.currentTarget as HTMLElement)
			setMenuGate(gate)
		},
		onContextMenu: (event: React.MouseEvent, gate: Gate) => {
			event.preventDefault()
			event.stopPropagation()
			setContextMenu({ x: event.clientX, y: event.clientY })
			setContextGate(gate)
		},
		onFileMenuOpen: handleFileMenuOpen,
		onSubsampleMenuOpen:
			onRenameSubsample || onArchiveSubsample || onSetSubsampleControl
				? (event: React.MouseEvent, subsample: Subsample) => {
						event.stopPropagation()
						setSubsampleMenuAnchor(event.currentTarget as HTMLElement)
						setMenuSubsample(subsample)
					}
				: undefined,
		selectedFileIds,
		onToggleFile: fileBulk && selectionMode ? handleToggleFile : undefined,
		onToggleGroup: fileBulk && selectionMode ? handleToggleGroup : undefined,
		selectedGateIds,
		onToggleGate: onDeleteGates && selectionMode ? handleToggleGate : undefined,
		onFileInfo: setMetadataTarget,
		expandSignal,
	}

	return {
		handlers,
		expansion: {
			expandAll: () =>
				setExpandSignal((s) => ({ seq: (s?.seq ?? 0) + 1, expanded: true })),
			collapseAll: () =>
				setExpandSignal((s) => ({ seq: (s?.seq ?? 0) + 1, expanded: false })),
		},
		selection: {
			canBulk,
			mode: selectionMode,
			count: selectedFileIds.size,
			gateCount: selectedGateIds.size,
			activeCount: activeSelected.length,
			inactiveCount: inactiveSelected.length,
			toggleMode: toggleSelectionMode,
			moveSelected: () => {
				if (selectedFiles.length > 0) setMoveTargets(selectedFiles)
			},
			disableSelected: () => {
				if (activeSelected.length > 0) setDisableTargets(activeSelected)
			},
			enableSelected: () => {
				if (inactiveSelected.length > 0 && onEnableFile)
					onEnableFile(inactiveSelected.map((f) => f.id))
			},
			tagSelected: () => {
				if (activeSelected.length > 0) setTagTargets(activeSelected)
			},
			deleteSelectedGates: () => {
				const gates = files
					.flatMap((f) => collectAllGates(f.gates))
					.filter((g) => selectedGateIds.has(g.id))
				if (gates.length > 0) setBulkDeleteTargets(gates)
			},
		},
		gateMenu: {
			anchor: menuAnchor,
			gate: menuGate,
			close: closeMenu,
			apply: () => {
				if (menuGate && onApplyGate) onApplyGate(menuGate.id, menuGate.name)
				closeMenu()
			},
			suggest: () => {
				if (menuGate && onSuggestGate) onSuggestGate(menuGate.id)
				closeMenu()
			},
			edit: () => {
				if (menuGate) openEdit(menuGate)
				closeMenu()
			},
			remove: () => {
				if (menuGate && onDeleteGate) onDeleteGate(menuGate.id, menuGate.name)
				closeMenu()
			},
		},
		gateContextMenu: {
			position: contextMenu,
			gate: contextGate,
			close: closeContextMenu,
			apply: () => {
				if (contextGate && onApplyGate)
					onApplyGate(contextGate.id, contextGate.name)
				closeContextMenu()
			},
			suggest: () => {
				if (contextGate && onSuggestGate) onSuggestGate(contextGate.id)
				closeContextMenu()
			},
			edit: () => {
				if (contextGate) openEdit(contextGate)
				closeContextMenu()
			},
			remove: () => {
				if (contextGate && onDeleteGate)
					onDeleteGate(contextGate.id, contextGate.name)
				closeContextMenu()
			},
		},
		fileMenu: {
			anchor: fileMenuAnchor,
			file: menuFile,
			close: closeFileMenu,
			move: () => {
				if (menuFile) setMoveTargets([menuFile])
				closeFileMenu()
			},
			disable: () => {
				if (menuFile) setDisableTargets([menuFile])
				closeFileMenu()
			},
			enable: () => {
				if (menuFile && onEnableFile) onEnableFile([menuFile.id])
				closeFileMenu()
			},
			tags: () => {
				if (menuFile) setTagTargets([menuFile])
				closeFileMenu()
			},
		},
		subsampleMenu: {
			anchor: subsampleMenuAnchor,
			subsample: menuSubsample,
			close: closeSubsampleMenu,
			rename: () => {
				if (menuSubsample) {
					setSubsampleFormTarget(menuSubsample)
					setSubsampleFormOpen(true)
				}
				closeSubsampleMenu()
			},
			archive: () => {
				if (menuSubsample) setArchiveTarget(menuSubsample)
				closeSubsampleMenu()
			},
			control: () => {
				if (menuSubsample) setControlTarget(menuSubsample)
				closeSubsampleMenu()
			},
		},
		editDialog: {
			gate: editTarget,
			name: editName,
			color: editColor,
			scope: editScope,
			error: editError,
			saving: editSaving,
			setName: setEditName,
			setColor: setEditColor,
			setScope: setEditScope,
			confirm: async () => {
				if (!editTarget || !onEditGate || !editName.trim()) return
				setEditSaving(true)
				const error = await onEditGate(editTarget.id, {
					name: editName.trim(),
					color: editColor,
					scope: editScope,
				})
				setEditSaving(false)
				// Conflito de nome/erro mantém o diálogo aberto com a mensagem.
				if (error) {
					setEditError(error)
					return
				}
				setEditTarget(null)
			},
			close: () => {
				setEditTarget(null)
				setEditError(null)
			},
		},
		disableDialog: {
			targets: disableTargets,
			confirm: () => {
				if (disableTargets.length > 0 && onDisableFile)
					onDisableFile(disableTargets.map((f) => f.id))
				setDisableTargets([])
				setSelectedFileIds(new Set())
			},
			close: () => setDisableTargets([]),
		},
		moveDialog: {
			targets: moveTargets,
			confirm: (fileDataIds: number[], subsampleId: number | null) => {
				onMoveFile?.(fileDataIds, subsampleId)
				setMoveTargets([])
				setSelectedFileIds(new Set())
			},
			close: () => setMoveTargets([]),
		},
		bulkDeleteDialog: {
			targets: bulkDeleteTargets,
			confirm: () => {
				if (bulkDeleteTargets.length > 0 && onDeleteGates)
					onDeleteGates(bulkDeleteTargets.map((g) => g.id))
				setBulkDeleteTargets([])
				setSelectedGateIds(new Set())
			},
			close: () => setBulkDeleteTargets([]),
		},
		metadataDialog: {
			file: metadataTarget,
			close: () => setMetadataTarget(null),
		},
		subsampleForm: {
			open: subsampleFormOpen,
			target: subsampleFormTarget,
			submit: handleSubsampleFormSubmit,
			close: () => setSubsampleFormOpen(false),
			openNew: () => {
				setSubsampleFormTarget(null)
				setSubsampleFormOpen(true)
			},
		},
		archiveDialog: {
			target: archiveTarget,
			confirm: (id: number) => {
				onArchiveSubsample?.(id)
				setArchiveTarget(null)
			},
			close: () => setArchiveTarget(null),
		},
		controlDialog: {
			target: controlTarget,
			submit: onSetSubsampleControl
				? (payload: {
						control_type: "unstained" | "single_stain" | null
						control_channel?: string
					}) => onSetSubsampleControl(controlTarget?.id ?? 0, payload)
				: undefined,
			close: () => setControlTarget(null),
		},
		tagDialog: {
			targets: tagTargets,
			submit: onSaveFileTags,
			open: (file: ExperimentFiles) => setTagTargets([file]),
			close: () => {
				setTagTargets([])
				setSelectedFileIds(new Set())
			},
		},
	}
}
