import { RichTreeView, TreeViewItemId } from "@mui/x-tree-view"
import { ExpandMore, ChevronRight } from "@mui/icons-material"
import { ExperimentFiles, FileData, Gate } from "../../types"
import React from "react"
import CytometryApi from "../../API"
import { toast } from "react-toastify"

type Item = {
	id: string
	label: string
	children?: Item[]
}

const convertGateToTreeItem = (gate: Gate): Item => ({
	id: `gate${Math.random() * (458 - 189) + 189}-${gate.id.toString()}`,
	label: `🔲 ${gate.name}`,
	children: gate.children?.map(convertGateToTreeItem),
})

const convertFilesToTreeItems = (files: ExperimentFiles[]): Item[] => {
	return files.map((file) => ({
		id: `file${Math.random() * (458 - 189) + 189}-${file.id.toString()}`,
		label: `📄 ${file.file_name}`,
		children: file.gates.map(convertGateToTreeItem),
	}))
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
	const items = convertFilesToTreeItems(files)
	const ItemsIds = items.map((item) => item.id)
	const handleRowClick = async (
		event: React.MouseEvent,
		itemId: TreeViewItemId
	) => {
		loadFile(true)
		const isFile = itemId.toString().startsWith("file")
		const isGate = itemId.toString().startsWith("gate")
		const id = parseInt(itemId.toString().split("-")[1])
		if (isFile) {
			try {
				const fileData = await CytometryApi.get(
					`/experiment/file/${id}/list?limit=10000`
				)
				fileDataSet(fileData.data)
			} catch (error: any) {
				toast.error(error.message)
			} finally {
				loadFile(false)
			}
		}
		if (isGate) {
			try {
				const gate = await CytometryApi.get(
					`/analytics/gate/${id}/list?limit=10000`
				)
				gateSet(id)
				fileDataSet(gate.data)
			} catch (error: any) {
				toast.error(error.message)
			} finally {
				loadFile(false)
			}
		}
	}

	return (
		<RichTreeView
			items={items}
			onItemClick={handleRowClick}
			defaultExpandedItems={ItemsIds}
			slots={{
				expandIcon: ChevronRight,
				collapseIcon: ExpandMore,
			}}
			sx={(theme) => ({
				flexGrow: 1,
				overflowY: "auto",
				color: theme.palette.text.primary,
			})}
		/>
	)
}
