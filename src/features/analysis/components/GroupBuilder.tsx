import {
	Box,
	Button,
	Checkbox,
	Chip,
	FormControlLabel,
	FormGroup,
	IconButton,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material"
import { MdAdd, MdOutlineClose, MdOutlineSplitscreen } from "react-icons/md"
import type { ExperimentFiles, Subsample } from "../../../types"
import type { FigureGroup } from "../../../services/figureService"
import { groupsFromSubsamples } from "../utils/figureGroups"

interface GroupBuilderProps {
	groups: FigureGroup[]
	files: ExperimentFiles[]
	subsamples: Subsample[]
	onChange: (groups: FigureGroup[]) => void
	disabled?: boolean
}

/**
 * Editor de grupos da figura: renomear, adicionar, dividir e mover amostras
 * entre grupos por checkbox. Amostras sem grupo ficam fora da figura.
 */
const GroupBuilder = ({
	groups,
	files,
	subsamples,
	onChange,
	disabled,
}: GroupBuilderProps) => {
	const activeFiles = files.filter((f) => f.active !== false)
	const grouped = new Set(groups.flatMap((g) => g.file_data_ids))
	const unassigned = activeFiles.filter((f) => !grouped.has(f.id))

	const fileName = (id: number) =>
		files.find((f) => f.id === id)?.file_name ?? `#${id}`

	const moveFile = (fileId: number, to: number | null) => {
		onChange(
			groups.map((g, i) => ({
				...g,
				file_data_ids:
					i === to
						? [...new Set([...g.file_data_ids, fileId])]
						: g.file_data_ids.filter((id) => id !== fileId),
			})),
		)
	}

	const toggleInGroup = (fileId: number, groupIndex: number, on: boolean) => {
		moveFile(fileId, on ? groupIndex : null)
	}

	const splitGroup = (index: number) => {
		const group = groups[index]
		const half = Math.ceil(group.file_data_ids.length / 2)
		const next = [...groups]
		next[index] = {
			...group,
			file_data_ids: group.file_data_ids.slice(0, half),
		}
		next.splice(index + 1, 0, {
			name: `${group.name} (2)`,
			file_data_ids: group.file_data_ids.slice(half),
		})
		onChange(next)
	}

	return (
		<Box>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				sx={{ mb: 1 }}
			>
				<Typography variant="subtitle2">Grupos</Typography>
				<Stack direction="row" spacing={1}>
					{subsamples.length > 0 && (
						<Button
							size="small"
							variant="outlined"
							disabled={disabled}
							onClick={() => onChange(groupsFromSubsamples(files, subsamples))}
						>
							Agrupar por subsample
						</Button>
					)}
					<Button
						size="small"
						variant="outlined"
						startIcon={<MdAdd />}
						disabled={disabled}
						onClick={() =>
							onChange([
								...groups,
								{ name: `Grupo ${groups.length + 1}`, file_data_ids: [] },
							])
						}
					>
						Novo grupo
					</Button>
				</Stack>
			</Stack>

			{groups.length === 0 && (
				<Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
					Defina grupos de amostras — ou use o preset por subsample.
				</Typography>
			)}

			<Stack spacing={1.5}>
				{groups.map((group, gi) => (
					<Box
						key={gi}
						sx={{
							border: 1,
							borderColor: "divider",
							borderRadius: 1,
							p: 1,
						}}
					>
						<Stack direction="row" spacing={1} alignItems="center">
							<TextField
								size="small"
								value={group.name}
								disabled={disabled}
								onChange={(e) =>
									onChange(
										groups.map((g, i) =>
											i === gi ? { ...g, name: e.target.value } : g,
										),
									)
								}
								sx={{ flex: 1 }}
								inputProps={{ "aria-label": "nome do grupo" }}
							/>
							<Tooltip title="Dividir grupo em dois">
								<span>
									<IconButton
										size="small"
										disabled={disabled || group.file_data_ids.length < 2}
										onClick={() => splitGroup(gi)}
									>
										<MdOutlineSplitscreen />
									</IconButton>
								</span>
							</Tooltip>
							<Tooltip title="Remover grupo (amostras ficam fora da figura)">
								<span>
									<IconButton
										size="small"
										disabled={disabled}
										onClick={() => onChange(groups.filter((_, i) => i !== gi))}
									>
										<MdOutlineClose />
									</IconButton>
								</span>
							</Tooltip>
						</Stack>
						<FormGroup row sx={{ mt: 0.5 }}>
							{activeFiles.map((f) => (
								<FormControlLabel
									key={f.id}
									sx={{ mr: 2 }}
									control={
										<Checkbox
											size="small"
											disabled={disabled}
											checked={group.file_data_ids.includes(f.id)}
											onChange={(e) =>
												toggleInGroup(f.id, gi, e.target.checked)
											}
										/>
									}
									label={
										<Typography variant="caption" noWrap>
											{f.file_name}
										</Typography>
									}
								/>
							))}
						</FormGroup>
					</Box>
				))}
			</Stack>

			{unassigned.length > 0 && (
				<Box sx={{ mt: 1 }}>
					<Typography variant="caption" color="text.secondary">
						Fora de grupos (não entram na figura):
					</Typography>
					<Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
						{unassigned.map((f) => (
							<Chip
								key={f.id}
								size="small"
								variant="outlined"
								label={fileName(f.id)}
							/>
						))}
					</Stack>
				</Box>
			)}
		</Box>
	)
}

export default GroupBuilder
