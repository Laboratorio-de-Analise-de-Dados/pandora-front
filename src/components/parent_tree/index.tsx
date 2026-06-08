import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView"
import { TreeItem } from "@mui/x-tree-view/TreeItem"
import {
	MdExpandMore as ExpandMore,
	MdChevronRight as ChevronRight,
} from "react-icons/md"
import { ExperimentFiles, FileData, Gate } from "../../types"
import React from "react"
import CytometryApi from "../../API"
import { toast } from "react-toastify"

// Função recursiva para renderizar os gates e seus sub-gates
const renderGate = (gate: Gate, parentId: string) => {
	const itemId = `gate-${gate.id}-${parentId}`
	return (
		<TreeItem key={itemId} itemId={itemId} label={`🔲 ${gate.name}`}>
			{gate.children?.map((childGate) => renderGate(childGate, itemId))}
		</TreeItem>
	)
}

// Função para renderizar os arquivos e seus gates
const renderFile = (file: ExperimentFiles) => {
	const fileId = `file-${file.id}`
	return (
		<TreeItem key={fileId} itemId={fileId} label={`📄 ${file.file_name}`}>
			{file.gates.map((gate) => renderGate(gate, fileId))}
		</TreeItem>
	)
}

export default function ParentTree({
	files,
	loadFile,
	fileDataSet,
	gateSet,
}: {
	files: ExperimentFiles[]
	loadFile: (arg: boolean) => void
	fileDataSet: (fileData: FileData) => void
	gateSet: (gate: number) => void
}) {
	// Lógica de carregamento de dados unificada e segura
	const handleItemClick = async (event: React.MouseEvent, itemId: string) => {
		// Paramos a propagação para evitar o evento do pai quando o filho é clicado
		event.stopPropagation()

		// Centralizamos a verificação aqui
		const isFile = itemId.startsWith("file-")
		const isGate = itemId.startsWith("gate-")
		const id = parseInt(itemId.split("-")[1])

		if (!isFile && !isGate) {
			// Item não é um arquivo nem um gate, então não fazemos nada.
			return
		}

		loadFile(true)
		try {
			if (isFile) {
				const fileData = await CytometryApi.get(
					`/experiment/file/${id}/list?limit=10000`,
				)
				fileDataSet(fileData.data)
			} else if (isGate) {
				const gate = await CytometryApi.get(
					`/analytics/gate/${id}/list?limit=10000`,
				)
				gateSet(id)
				fileDataSet(gate.data)
			}
		} catch (error: any) {
			toast.error(error.message)
		} finally {
			loadFile(false)
		}
	}

	return (
		<SimpleTreeView
			slots={{
				expandIcon: ChevronRight,
				collapseIcon: ExpandMore,
			}}
			onItemClick={handleItemClick}
			sx={(theme) => ({
				flexGrow: 1,
				overflowY: "auto",
				color: theme.palette.text.primary,
			})}
		>
			{files.map((file) => renderFile(file))}
		</SimpleTreeView>
	)
}
