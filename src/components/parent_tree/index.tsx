import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView"
import { TreeItem } from "@mui/x-tree-view/TreeItem"
import {
	MdExpandMore as ExpandMore,
	MdChevronRight as ChevronRight,
} from "react-icons/md"
import { ExperimentFiles, Gate } from "../../types"
import React from "react"

export interface SelectedSource {
	type: "file" | "gate"
	id: number
	name: string
	fileDataId: number
}

// Função recursiva para renderizar os gates e seus sub-gates
const renderGate = (gate: Gate, parentId: string) => {
	const itemId = `gate-${gate.id}-${parentId}`
	return (
		<TreeItem key={itemId} itemId={itemId} label={`🔲${gate.name}`}>
			{gate.children?.map((childGate) => renderGate(childGate, itemId))}
		</TreeItem>
	)
}

// Função para renderizar os arquivos e seus gates
const renderFile = (file: ExperimentFiles) => {
	const fileId = `file-${file.id}`
	return (
		<TreeItem key={fileId} itemId={fileId} label={`📄${file.file_name}`}>
			{file.gates.map((gate) => renderGate(gate, fileId))}
		</TreeItem>
	)
}

// Procura recursivamente um gate (e seu file_data raiz) pela id.
const findGate = (gates: Gate[], id: number): Gate | undefined => {
	for (const gate of gates) {
		if (gate.id === id) return gate
		if (gate.children) {
			const found = findGate(gate.children, id)
			if (found) return found
		}
	}
	return undefined
}

export default function ParentTree({
	files,
	onSelect,
}: {
	files: ExperimentFiles[]
	onSelect: (source: SelectedSource) => void
}) {
	const handleItemClick = (event: React.MouseEvent, itemId: string) => {
		// Paramos a propagação para evitar o evento do pai quando o filho é clicado
		event.stopPropagation()

		const isFile = itemId.startsWith("file-")
		const isGate = itemId.startsWith("gate-")
		const id = parseInt(itemId.split("-")[1])

		if (!isFile && !isGate) return

		if (isFile) {
			const file = files.find((f) => f.id === id)
			onSelect({
				type: "file",
				id,
				name: file?.file_name ?? `Arquivo ${id}`,
				fileDataId: id,
			})
		} else {
			let gate: Gate | undefined
			for (const file of files) {
				gate = findGate(file.gates, id)
				if (gate) break
			}
			onSelect({
				type: "gate",
				id,
				name: gate?.name ?? `Gate ${id}`,
				fileDataId: gate?.file_data ?? id,
			})
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
