import {
	Alert,
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
import React, { useEffect, useMemo, useState } from "react"
import { ExperimentFiles, Gate, Subsample } from "../../../../types"
import {
	collectAllGates,
	findGateByPathNames,
	getGatePathNames,
} from "../../utils"
import type { GateScope } from "../../../../services/gateService"
import FileSelectList from "../file-select-list"

export interface DeleteGateTarget {
	id: number
	name: string
	fileDataId: number
}

export interface DeleteGateOptions {
	scope: GateScope
	targetFileDataIds: number[]
	recursive: boolean
	includeSource: boolean
}

interface DeleteGateDialogProps {
	open: boolean
	target: DeleteGateTarget
	files: ExperimentFiles[]
	subsamples?: Subsample[]
	error: string | null
	loading?: boolean
	onClose: () => void
	onConfirm: (options: DeleteGateOptions) => void
}

/** Quantos gates a exclusão atinge dentro de uma amostra. */
const countGates = (gate: Gate | undefined, recursive: boolean): number => {
	if (!gate) return 0
	return recursive ? collectAllGates([gate]).length : 1
}

export default function DeleteGateDialog({
	open,
	target,
	files,
	subsamples = [],
	error,
	loading,
	onClose,
	onConfirm,
}: DeleteGateDialogProps) {
	const [scope, setScope] = useState<GateScope>("file")
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
	const [recursive, setRecursive] = useState(true)
	const [includeSource, setIncludeSource] = useState(false)

	const sourceFile = files.find((f) => f.id === target.fileDataId)
	const sourceSubsampleId = sourceFile?.subsample ?? null
	const sourceSubsample = useMemo(
		() => subsamples.find((s) => s.id === sourceSubsampleId) ?? null,
		[subsamples, sourceSubsampleId],
	)
	// Amostras ativas do mesmo subsample da amostra alvo (BE-07).
	const subsampleFiles = useMemo(
		() =>
			sourceSubsampleId === null
				? []
				: files.filter(
						(f) =>
							f.subsample === sourceSubsampleId &&
							f.active !== false &&
							f.id !== target.fileDataId,
					),
		[files, sourceSubsampleId, target.fileDataId],
	)
	const pathNames = useMemo(
		() => getGatePathNames(sourceFile?.gates ?? [], target.id) ?? [target.name],
		[sourceFile, target.id, target.name],
	)

	// Amostras desabilitadas (BE-01) não entram como alvo.
	const targetFiles = useMemo(
		() => files.filter((f) => f.active !== false && f.id !== target.fileDataId),
		[files, target.fileDataId],
	)

	useEffect(() => {
		if (!open) return
		setScope("file")
		setSelectedIds(new Set(targetFiles.map((f) => f.id)))
		setRecursive(true)
		setIncludeSource(false)
	}, [open, target.id])

	const handleToggle = (fileId: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (next.has(fileId)) next.delete(fileId)
			else next.add(fileId)
			return next
		})
	}

	const handleSelectAll = () => {
		setSelectedIds(
			selectedIds.size === targetFiles.length
				? new Set()
				: new Set(targetFiles.map((f) => f.id)),
		)
	}

	const sourceGate = findGateByPathNames(sourceFile?.gates ?? [], pathNames)
	const sourceCount = countGates(sourceGate, recursive)

	const affected = useMemo(() => {
		if (scope === "file") return { gates: sourceCount, files: 1 }
		const scopedFiles = scope === "subsample" ? subsampleFiles : targetFiles
		let gates = includeSource ? sourceCount : 0
		let filesTouched = includeSource ? 1 : 0
		for (const file of scopedFiles) {
			if (scope === "experiment" && !selectedIds.has(file.id)) continue
			const count = countGates(
				findGateByPathNames(file.gates, pathNames),
				recursive,
			)
			if (count > 0) {
				gates += count
				filesTouched += 1
			}
		}
		return { gates, files: filesTouched }
	}, [
		scope,
		sourceCount,
		includeSource,
		targetFiles,
		subsampleFiles,
		selectedIds,
		pathNames,
		recursive,
	])

	const handleConfirm = () => {
		onConfirm({
			scope,
			targetFileDataIds: scope === "experiment" ? Array.from(selectedIds) : [],
			recursive,
			includeSource,
		})
	}

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
		>
			<DialogTitle>Excluir gate</DialogTitle>
			<DialogContent>
				{error && (
					<Alert severity="error" sx={{ mb: 1 }}>
						{error}
					</Alert>
				)}
				<Typography variant="body2" sx={{ mb: 1 }}>
					Excluir <strong>{target.name}</strong>. Esta ação não pode ser
					desfeita.
				</Typography>

				<FormControl>
					<RadioGroup
						value={scope}
						onChange={(e) => setScope(e.target.value as GateScope)}
					>
						<FormControlLabel
							value="file"
							control={<Radio size="small" />}
							label={
								<Typography variant="body2">
									Apenas nesta amostra
									{sourceFile ? ` (${sourceFile.file_name})` : ""}
								</Typography>
							}
						/>
						{sourceSubsampleId !== null && (
							<FormControlLabel
								value="subsample"
								control={<Radio size="small" />}
								label={
									<Typography variant="body2">
										Nas amostras deste subsample
										{sourceSubsample ? ` (${sourceSubsample.name})` : ""}
									</Typography>
								}
							/>
						)}
						<FormControlLabel
							value="experiment"
							control={<Radio size="small" />}
							label={
								<Typography variant="body2">
									Em todas as amostras do experimento
								</Typography>
							}
						/>
					</RadioGroup>
				</FormControl>

				<FormControlLabel
					control={
						<Checkbox
							checked={recursive}
							onChange={(e) => setRecursive(e.target.checked)}
							size="small"
						/>
					}
					label={<Typography variant="body2">Incluir sub-gates</Typography>}
					sx={{ display: "block" }}
				/>

				{(scope === "subsample" || scope === "experiment") && (
					<FormControlLabel
						control={
							<Checkbox
								checked={includeSource}
								onChange={(e) => setIncludeSource(e.target.checked)}
								size="small"
							/>
						}
						label={
							<Typography variant="body2">
								Excluir também nesta amostra
							</Typography>
						}
						sx={{ display: "block", mb: 1 }}
					/>
				)}

				{scope === "subsample" && (
					<Typography
						variant="caption"
						sx={{ display: "block", color: "text.secondary", mt: 0.5 }}
					>
						Atinge as {subsampleFiles.length + (includeSource ? 1 : 0)}{" "}
						amostra(s) ativas do subsample.
					</Typography>
				)}

				{scope === "experiment" && (
					<FileSelectList
						files={targetFiles}
						selectedIds={selectedIds}
						onToggle={handleToggle}
						onSelectAll={handleSelectAll}
					/>
				)}

				<Typography variant="body2" sx={{ mt: 1.5, fontWeight: "bold" }}>
					{affected.gates} gate{affected.gates !== 1 ? "s" : ""} em{" "}
					{affected.files} amostra{affected.files !== 1 ? "s" : ""} serão
					apagados.
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancelar</Button>
				<Button
					onClick={handleConfirm}
					color="error"
					variant="contained"
					disabled={loading || affected.gates === 0}
				>
					{loading ? "Excluindo..." : "Excluir"}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
