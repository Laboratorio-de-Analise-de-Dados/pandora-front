import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	Radio,
	RadioGroup,
	Typography,
} from "@mui/material"
import { useEffect, useMemo, useRef, useState } from "react"
import { ExperimentFiles, Subsample } from "../../../../types"
import { useApplyGatePreview } from "../../hooks/useApplyGatePreview"
import FileSelectList from "../file-select-list"
import DryRunSummary from "./components/DryRunSummary"

type ApplyScope = "subsample" | "experiment" | "custom"

interface ApplyGateDialogProps {
	open: boolean
	gateName: string
	gateId: number
	files: ExperimentFiles[]
	subsamples?: Subsample[]
	sourceFileDataId: number
	onClose: () => void
	onApply: (
		targetFileDataIds: number[],
		recursive: boolean,
		onConflict: "replace" | "rename",
	) => void
	loading?: boolean
}

export default function ApplyGateDialog({
	open,
	gateName,
	gateId,
	files,
	subsamples = [],
	sourceFileDataId,
	onClose,
	onApply,
	loading,
}: ApplyGateDialogProps) {
	const [scope, setScope] = useState<ApplyScope>("experiment")
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
	const [recursive, setRecursive] = useState(true)

	const sourceFile = files.find((f) => f.id === sourceFileDataId)
	const sourceSubsampleId = sourceFile?.subsample ?? null
	const sourceSubsample = useMemo(
		() => subsamples.find((s) => s.id === sourceSubsampleId) ?? null,
		[subsamples, sourceSubsampleId],
	)
	const subsampleFiles = useMemo(
		() =>
			sourceSubsampleId === null
				? []
				: files.filter(
						(f) =>
							f.subsample === sourceSubsampleId && f.id !== sourceFileDataId,
					),
		[files, sourceSubsampleId, sourceFileDataId],
	)
	const targetFiles = useMemo(
		() => files.filter((f) => f.id !== sourceFileDataId),
		[files, sourceFileDataId],
	)

	const preview = useApplyGatePreview()
	const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	const schedulePreview = (ids: Set<number>, isRecursive: boolean) => {
		if (previewTimer.current) clearTimeout(previewTimer.current)
		if (ids.size === 0) {
			preview.reset()
			return
		}
		previewTimer.current = setTimeout(() => {
			preview.mutate({
				gateId,
				targetFileDataIds: Array.from(ids),
				recursive: isRecursive,
			})
		}, 300)
	}

	useEffect(() => {
		return () => {
			if (previewTimer.current) clearTimeout(previewTimer.current)
		}
	}, [])

	useEffect(() => {
		if (!open) return
		const initialScope: ApplyScope =
			sourceSubsampleId !== null ? "subsample" : "experiment"
		const initialIds =
			initialScope === "subsample"
				? new Set(subsampleFiles.map((f) => f.id))
				: new Set(targetFiles.map((f) => f.id))
		setScope(initialScope)
		setSelectedIds(initialIds)
		setRecursive(true)
		preview.reset()
		schedulePreview(initialIds, true)
		// Recria a seleção a cada abertura/gate — mesma ideia do DeleteGateDialog.
	}, [open, gateId])

	const applyScope = (nextScope: ApplyScope) => {
		setScope(nextScope)
		const ids =
			nextScope === "custom"
				? selectedIds
				: new Set(
						(nextScope === "subsample" ? subsampleFiles : targetFiles).map(
							(f) => f.id,
						),
					)
		setSelectedIds(ids)
		schedulePreview(ids, recursive)
	}

	const handleToggle = (fileId: number) => {
		setScope("custom")
		const next = new Set(selectedIds)
		if (next.has(fileId)) next.delete(fileId)
		else next.add(fileId)
		setSelectedIds(next)
		schedulePreview(next, recursive)
	}

	const handleSelectAll = () => {
		const next =
			selectedIds.size === targetFiles.length
				? new Set<number>()
				: new Set(targetFiles.map((f) => f.id))
		setSelectedIds(next)
		schedulePreview(next, recursive)
	}

	const handleRecursive = (checked: boolean) => {
		setRecursive(checked)
		schedulePreview(selectedIds, checked)
	}

	const hasConflicts = (preview.data?.conflicts.length ?? 0) > 0

	const handleApply = (onConflict: "replace" | "rename") => {
		onApply(Array.from(selectedIds), recursive, onConflict)
	}

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			sx={{
				"& .MuiDialog-container": {
					alignItems: { xs: "flex-end", sm: "center" },
				},
			}}
			PaperProps={{
				sx: {
					maxHeight: "90vh",
					overflowY: "auto",
					width: { xs: "100%", sm: undefined },
					m: { xs: 0, sm: undefined },
					borderRadius: { xs: "20px 20px 0 0", sm: undefined },
				},
			}}
		>
			<DialogTitle>Aplicar gate “{gateName}” em outras amostras</DialogTitle>
			<DialogContent>
				<Typography variant="body2" sx={{ mb: 1.5 }}>
					As cópias acompanham o original em nome, cor e exclusão até que o
					desenho seja alterado só em uma amostra.
				</Typography>

				<Typography
					variant="caption"
					sx={{
						display: "block",
						color: "text.secondary",
						textTransform: "uppercase",
						letterSpacing: 0.5,
						mb: 0.5,
					}}
				>
					1. Selecione o escopo
				</Typography>
				<FormControl>
					<RadioGroup
						value={scope}
						onChange={(e) => applyScope(e.target.value as ApplyScope)}
					>
						{sourceSubsampleId !== null && (
							<FormControlLabel
								value="subsample"
								control={<Radio size="small" />}
								label={
									<Typography variant="body2">
										Nas amostras deste subsample
										{sourceSubsample
											? ` (${sourceSubsample.name} — ${subsampleFiles.length} amostras)`
											: ""}
									</Typography>
								}
							/>
						)}
						<FormControlLabel
							value="experiment"
							control={<Radio size="small" />}
							label={
								<Typography variant="body2">
									Todas as amostras do experimento ({targetFiles.length})
								</Typography>
							}
						/>
						<FormControlLabel
							value="custom"
							control={<Radio size="small" />}
							label={
								<Typography variant="body2">
									Escolher amostras manualmente
								</Typography>
							}
						/>
					</RadioGroup>
				</FormControl>

				{scope === "custom" && (
					<FileSelectList
						files={targetFiles}
						selectedIds={selectedIds}
						onToggle={handleToggle}
						onSelectAll={handleSelectAll}
						emptyLabel="Nenhuma outra amostra no experimento"
					/>
				)}

				<FormControlLabel
					control={
						<Checkbox
							checked={recursive}
							onChange={(e) => handleRecursive(e.target.checked)}
							size="small"
						/>
					}
					label={<Typography variant="body2">Incluir sub-gates</Typography>}
					sx={{ display: "block" }}
				/>

				{selectedIds.size > 0 && (
					<DryRunSummary
						preview={preview.data}
						targetCount={selectedIds.size}
						loading={preview.isPending}
					/>
				)}
			</DialogContent>
			<DialogActions
				sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, p: 2 }}
			>
				<Button onClick={onClose} fullWidth disabled={loading}>
					Cancelar
				</Button>
				{hasConflicts && (
					<Button
						onClick={() => handleApply("rename")}
						fullWidth
						disabled={loading || selectedIds.size === 0}
					>
						Manter os dois
					</Button>
				)}
				<Button
					onClick={() => handleApply(hasConflicts ? "replace" : "rename")}
					variant="contained"
					color={hasConflicts ? "error" : "primary"}
					fullWidth
					disabled={selectedIds.size === 0 || loading}
				>
					{loading
						? "Aplicando..."
						: hasConflicts
							? "Sobrescrever e Aplicar"
							: `Aplicar (${selectedIds.size} amostra${selectedIds.size !== 1 ? "s" : ""})`}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
