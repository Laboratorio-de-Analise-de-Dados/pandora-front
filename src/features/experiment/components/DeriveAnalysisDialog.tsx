import { useState } from "react"
import {
	Alert,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	FormControl,
	FormControlLabel,
	FormHelperText,
	InputLabel,
	List,
	ListItem,
	ListItemText,
	MenuItem,
	Select,
	Typography,
} from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { AppDialog } from "../../../components/AppDialog"
import type { Experiment } from "../../../types"
import { useAuth } from "../../../providers/AuthContext"
import {
	deriveAnalysis,
	fetchExperiments,
} from "../../../services/experimentService"
import type { DeriveAnalysisReport } from "../../../services/experimentService"
import { extractErrorMessage } from "../../../utils/apiError"

interface DeriveAnalysisDialogProps {
	open: boolean
	/** Experimento alvo — recebe a análise derivada. */
	target: Experiment
	onClose: () => void
	onDone: () => void
}

function ReportSection({
	title,
	files,
}: {
	title: string
	files: { id: number; file_name: string; reason?: string }[]
}) {
	if (files.length === 0) return null
	return (
		<Box>
			<Typography variant="caption" fontWeight="bold" color="text.secondary">
				{title}
			</Typography>
			<List dense disablePadding>
				{files.map((f) => (
					<ListItem key={f.id} disableGutters sx={{ py: 0 }}>
						<ListItemText
							primary={f.file_name}
							secondary={f.reason}
							primaryTypographyProps={{ variant: "body2" }}
						/>
					</ListItem>
				))}
			</List>
		</Box>
	)
}

/**
 * FE-28: deriva a estratégia de análise (árvore de gates, subsamples
 * homônimos, compensação) de um experimento origem para o alvo (BE-19,
 * ADR-0021). O backend exige edição nos dois lados — a lista de origens
 * já filtra o que o usuário não pode editar.
 */
export default function DeriveAnalysisDialog({
	open,
	target,
	onClose,
	onDone,
}: DeriveAnalysisDialogProps) {
	const { user } = useAuth()
	const [sourceId, setSourceId] = useState<string>("")
	const [includeSubsamples, setIncludeSubsamples] = useState(true)
	const [includeCompensation, setIncludeCompensation] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [report, setReport] = useState<DeriveAnalysisReport | null>(null)

	const { data: experiments, isLoading } = useQuery({
		queryKey: ["experiments", "derive-sources"],
		queryFn: () => fetchExperiments(),
		enabled: open,
	})

	const sources = (experiments ?? []).filter(
		(e) =>
			e.id !== target.id &&
			e.active !== false &&
			(user?.is_super_admin ||
				e.created_by === user?.id ||
				(e.organization != null &&
					user?.memberships?.some(
						(m) => m.organization.id === e.organization?.id,
					))),
	)

	const handleSubmit = async () => {
		setSaving(true)
		setError(null)
		try {
			const result = await deriveAnalysis(target.id, {
				source_experiment_id: Number(sourceId),
				include_subsamples: includeSubsamples,
				include_compensation: includeCompensation,
			})
			setReport(result)
			onDone()
		} catch (err) {
			setError(
				extractErrorMessage(err) || "Não foi possível derivar a análise.",
			)
		} finally {
			setSaving(false)
		}
	}

	return (
		<AppDialog
			open={open}
			onClose={onClose}
			title={`Derivar análise para "${target.title}"`}
			maxWidth="sm"
			loading={saving}
			actions={
				report ? (
					<Button variant="contained" onClick={onClose}>
						Fechar
					</Button>
				) : undefined
			}
			onConfirm={report ? undefined : handleSubmit}
			confirmLabel="Derivar"
			confirmDisabled={!sourceId || saving}
		>
			<Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
				{report ? (
					<>
						<Alert severity="success">
							{report.matched_files}{" "}
							{report.matched_files === 1
								? "amostra casada"
								: "amostras casadas"}
							, {report.created_gates}{" "}
							{report.created_gates === 1 ? "gate criado" : "gates criados"}
							{report.compensation_applied ? " — compensação aplicada" : ""}
							{report.subsamples_created.length > 0 &&
								` — subsamples criados: ${report.subsamples_created.join(", ")}`}
						</Alert>
						<ReportSection
							title="Puladas (já tinham análise)"
							files={report.skipped_files}
						/>
						<ReportSection
							title="Na origem, sem par neste experimento"
							files={report.unmatched_source_files}
						/>
						<ReportSection
							title="Neste experimento, sem par na origem"
							files={report.unmatched_target_files}
						/>
					</>
				) : (
					<>
						<Typography variant="body2" color="text.secondary">
							Copia a árvore de gates do experimento de origem para as amostras
							que casam por GUID (ou nome do arquivo). Amostras que já têm gates
							são puladas.
						</Typography>
						<FormControl fullWidth size="small">
							<InputLabel id="derive-source-label">
								Experimento de origem
							</InputLabel>
							<Select
								labelId="derive-source-label"
								value={sourceId}
								label="Experimento de origem"
								onChange={(e) => setSourceId(e.target.value)}
								disabled={isLoading}
							>
								{sources.map((e) => (
									<MenuItem key={e.id} value={String(e.id)}>
										{e.title}
										{e.organization?.name
											? ` — ${e.organization.name}`
											: " — Pessoal"}
									</MenuItem>
								))}
							</Select>
							{isLoading && (
								<FormHelperText>
									<CircularProgress size={12} sx={{ mr: 0.5 }} />
									Carregando experimentos…
								</FormHelperText>
							)}
							{!isLoading && sources.length === 0 && (
								<FormHelperText>
									Nenhum outro experimento editável disponível.
								</FormHelperText>
							)}
						</FormControl>
						<Box>
							<FormControlLabel
								control={
									<Checkbox
										checked={includeSubsamples}
										onChange={(e) => setIncludeSubsamples(e.target.checked)}
										size="small"
									/>
								}
								label="Copiar subsamples homônimos"
							/>
							<FormControlLabel
								control={
									<Checkbox
										checked={includeCompensation}
										onChange={(e) => setIncludeCompensation(e.target.checked)}
										size="small"
									/>
								}
								label="Copiar compensação aplicada"
							/>
						</Box>
						{error && <Alert severity="error">{error}</Alert>}
					</>
				)}
			</Box>
		</AppDialog>
	)
}
