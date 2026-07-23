import React from "react"
import { Box, Button, Menu, MenuItem, TextField, Typography } from "@mui/material"
import {
	MdKeyboardArrowDown as ArrowDownIcon,
	MdChevronRight as ChevronIcon,
} from "react-icons/md"
import type { ExperimentFiles } from "../../../types"
import type { SelectedSource } from "../../../components/parent_tree"
import { buildSelectableItems } from "../../stats/utils/selectable"

interface SourceDropdownProps {
	files: ExperimentFiles[]
	source: SelectedSource | undefined
	onSelect: (source: SelectedSource) => void
}

/**
 * Seletor compacto de arquivo/população exibido no cabeçalho do plot. Serve
 * como alternativa à árvore lateral (útil em telas pequenas / mobile), abrindo
 * um menu com todos os arquivos e gates a partir do nome do arquivo atual.
 */
const SourceDropdown: React.FC<SourceDropdownProps> = ({
	files,
	source,
	onSelect,
}) => {
	const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
	const [search, setSearch] = React.useState("")

	const items = React.useMemo(() => buildSelectableItems(files), [files])

	const filtered = React.useMemo(() => {
		const q = search.trim().toLowerCase()
		if (!q) return items
		return items.filter(
			(item) =>
				item.name.toLowerCase().includes(q) ||
				item.path.toLowerCase().includes(q),
		)
	}, [items, search])

	const close = () => {
		setAnchorEl(null)
		setSearch("")
	}

	return (
		<>
			<Button
				size="small"
				variant="text"
				color="inherit"
				onClick={(e) => setAnchorEl(e.currentTarget)}
				endIcon={<ArrowDownIcon />}
				sx={{
					textTransform: "none",
					maxWidth: { xs: 180, sm: 320 },
					minWidth: 0,
				}}
			>
				<Typography variant="body2" noWrap sx={{ maxWidth: "100%" }}>
					{source?.name ?? "Selecionar..."}
				</Typography>
			</Button>
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={close}
				slotProps={{
					paper: { sx: { maxHeight: 380, maxWidth: 360, minWidth: 240 } },
				}}
			>
				<Box sx={{ px: 1.5, pb: 0.5 }} onKeyDown={(e) => e.stopPropagation()}>
					<TextField
						size="small"
						placeholder="Buscar arquivo ou gate..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						sx={{
							"& .MuiInputBase-input": { fontSize: "0.8rem", py: 0.5 },
						}}
						fullWidth
						autoFocus
					/>
				</Box>
				{filtered.map((item) => {
					const isSelected =
						source?.type === item.type && source?.id === item.id
					return (
						<MenuItem
							key={`${item.type}-${item.id}`}
							selected={isSelected}
							onClick={() => {
								onSelect({
									type: item.type,
									id: item.id,
									name: item.name,
									fileDataId: item.fileDataId,
								})
								close()
							}}
							sx={{ py: 0.5, pl: 1.5 + item.depth * 2, minHeight: 0 }}
						>
							<Typography variant="caption" sx={{ fontSize: "0.8rem" }} noWrap>
								{item.depth > 0 && (
									<ChevronIcon
										style={{
											fontSize: 12,
											verticalAlign: "middle",
											marginRight: 2,
											opacity: 0.5,
										}}
									/>
								)}
								{item.type === "file" ? "📄 " : "🔲 "}
								{item.name}
							</Typography>
						</MenuItem>
					)
				})}
				{filtered.length === 0 && (
					<MenuItem disabled>
						<Typography variant="caption" color="text.secondary">
							Nenhum item encontrado
						</Typography>
					</MenuItem>
				)}
			</Menu>
		</>
	)
}

export default SourceDropdown
