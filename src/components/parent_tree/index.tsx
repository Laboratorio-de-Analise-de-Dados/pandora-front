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
	id: gate.id.toString(),
	label: `🔲 ${gate.name}`,
	children: gate.children?.map(convertGateToTreeItem),
})

const convertFilesToTreeItems = (files: ExperimentFiles[]): Item[] => {
	return files.map((file) => ({
		id: file.id.toString(),
		label: `📄 ${file.file_name}`,
		children: file.gates.map(convertGateToTreeItem),
	}))
}

export default function ParentTree({
	files,
	loadFile,
	fileDataSet,
}: {
	files: ExperimentFiles[]
	loadFile: (arg: boolean) => void
	fileDataSet: (fileData: FileData) => void
}) {
	const items = convertFilesToTreeItems(files)
	const handleRowClick = async (
		_: React.MouseEvent,
		itemId: TreeViewItemId
	) => {
		loadFile(true)
		try {
			const fileData = await CytometryApi.get(
				`/experiment/file/${itemId}/list?limit=10000`
			)
			fileDataSet(fileData.data)
		} catch (error: any) {
			toast.error(error.message)
		} finally {
			loadFile(false)
		}
	}
	return (
		<RichTreeView
			items={items}
			onItemClick={handleRowClick}
			defaultExpandedItems={files.map((f) => f.id.toString())}
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
