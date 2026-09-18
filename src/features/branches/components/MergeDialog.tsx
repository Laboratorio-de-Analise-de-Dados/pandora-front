import { useState } from "react"
import {
	Alert,
	Box,
	CircularProgress,
	Divider,
	FormControlLabel,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Radio,
	RadioGroup,
	Typography,
} from "@mui/material"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import {
	MdAdd as AddIcon,
	MdDelete as DeleteIcon,
	MdEdit as EditIcon,
} from "react-icons/md"
import { AppDialog } from "../../../components/AppDialog"
import { useBranchesQuery } from "../hooks/useBranches"
import { fetchBranchDiff, mergeBranch } from "../../../services/branches"
import type {
	AnalysisBranch,
	BranchDiffConflict,
	MergeResolution,
} from "../../../services/branches"
import { extractErrorMessage } from "../../../utils/apiError"

interface MergeDialogProps {
	open: boolean
	/** Branch de origem (não-main) — sempre mergeia na `base_branch`. */
	branch: AnalysisBranch
	experimentId: number | undefined
	onClose: () => void
	onMerged: () => void
}

const CHANGE_LABEL = {
	create: "Criar",
	update: "Atualizar",
	delete: "Excluir",
} as const

const CHANGE_ICON = {
	create: <AddIcon style={{ fontSize: 16 }} />,
	update: <EditIcon style={{ fontSize: 16 }} />,
	delete: <DeleteIcon style={{ fontSize: 16 }} />,
} as const

const fmt = (v: unknown) =>
	v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)

function ConflictCard({
	conflict,
	targetName,
	sourceName,
	value,
	onChange,
}: {
	conflict: BranchDiffConflict
	targetName: string
	sourceName: string
	value: MergeResolution | undefined
	onChange: (resolution: MergeResolution) => void
}) {
	const isFieldConflict = conflict.type === "modified_both"
	const options: { value: MergeResolution; label: string }[] =
		conflict.type === "deleted_in_target"
			? [
					{ value: "mine", label: `Manter excluído em "${targetName}"` },
					{ value: "theirs", label: `Recriar em "${targetName}"` },
				]
			: conflict.type === "edited_in_target_deleted_in_source"
				? [
						{ value: "mine", label: `Manter a versão de "${targetName}"` },
						{ value: "theirs", label: `Excluir de "${targetName}"` },
					]
				: [
						{ value: "mine", label: `Manter a versão de "${targetName}"` },
						{ value: "theirs", label: `Usar a versão de "${sourceName}"` },
						{ value: "both", label: "Manter as duas (cópia renomeada)" },
					]

	return (
		<Box
			sx={{
				border: "1px solid",
				borderColor: "divider",
				borderRadius: 2,
				p: 1.5,
			}}
		>
			<Typography variant="subtitle2">{conflict.name}</Typography>
			<Typography variant="caption" color="text.secondary">
				{conflict.detail}
			</Typography>
			{isFieldConflict && conflict.fields && (
				<Box sx={{ mt: 1 }}>
					{Object.entries(conflict.fields).map(([field, vals]) => (
						<Box key={field} sx={{ mb: 0.5 }}>
							<Typography variant="caption" fontWeight="bold">
								{field}
							</Typography>
							<Typography
								variant="caption"
								display="block"
								color="text.secondary"
							>
								original: {fmt(vals.base)} · {targetName}: {fmt(vals.target)} ·{" "}
								{sourceName}: {fmt(vals.source)}
							</Typography>
						</Box>
					))}
				</Box>
			)}
			<RadioGroup
				value={value ?? ""}
				onChange={(e) => onChange(e.target.value as MergeResolution)}
			>
				{options.map((o) => (
					<FormControlLabel
						key={o.value}
						value={o.value}
						control={<Radio size="small" />}
						label={<Typography variant="body2">{o.label}</Typography>}
					/>
				))}
			</RadioGroup>
		</Box>
	)
}

/**
 * FE-29: tela de diff/merge da branch na base (BE-23, ADR-0020). Lista
 * `changes` aplicáveis sem decisão e pede resolução por `conflicts`
 * (mine = base, theirs = branch, both = as duas — só em edições nos dois
 * lados). 409 sem resolução completa reabre a lista.
 */
export default function MergeDialog({
	open,
	branch,
	experimentId,
	onClose,
	onMerged,
}: MergeDialogProps) {
	const queryClient = useQueryClient()
	const [resolutions, setResolutions] = useState<
		Record<string, MergeResolution>
	>({})
	const [merging, setMerging] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const diff = useQuery({
		queryKey: ["branch-diff", branch.id],
		queryFn: () => fetchBranchDiff(branch.id),
		enabled: open,
	})
	const { data: branches } = useBranchesQuery(experimentId)

	// Nome de exibição: a main aparece como "Principal" para quem não
	// conhece o vocabulário interno.
	const displayName = (id: number, name: string) =>
		branches?.find((b) => b.id === id)?.is_main ? "Principal" : name

	const conflicts = diff.data?.conflicts ?? []
	const changes = diff.data?.changes ?? []
	const unresolved = conflicts.filter((c) => !resolutions[c.key])
	const empty = diff.data && changes.length === 0 && conflicts.length === 0

	const handleMerge = async () => {
		setMerging(true)
		setError(null)
		try {
			const result = await mergeBranch(branch.id, resolutions)
			toast.success(
				`Linha "${branch.name}" juntada — ${result.applied.length} mudança(s) aplicadas.`,
			)
			queryClient.invalidateQueries({
				queryKey: ["experiment-files", String(experimentId)],
			})
			queryClient.invalidateQueries({ queryKey: ["history", experimentId] })
			queryClient.invalidateQueries({ queryKey: ["branches", experimentId] })
			onMerged()
		} catch (err) {
			setError(extractErrorMessage(err) || "Não foi possível juntar as linhas.")
			diff.refetch()
		} finally {
			setMerging(false)
		}
	}

	return (
		<AppDialog
			open={open}
			onClose={onClose}
			title={`Juntar "${branch.name}" na linha de origem`}
			maxWidth="sm"
			loading={merging}
			onConfirm={diff.data && !empty ? handleMerge : undefined}
			confirmLabel="Juntar"
			confirmDisabled={diff.isLoading || unresolved.length > 0 || merging}
		>
			<Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
				{diff.isLoading && (
					<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
						<CircularProgress size={28} />
					</Box>
				)}
				{diff.isError && (
					<Alert severity="error">
						{extractErrorMessage(diff.error) ||
							"Não foi possível carregar a comparação."}
					</Alert>
				)}
				{empty && (
					<Alert severity="info">
						Nenhuma diferença entre "{branch.name}" e a linha de origem — nada a
						juntar.
					</Alert>
				)}
				{diff.data && !empty && (
					<>
						{changes.length > 0 && (
							<Box>
								<Typography
									variant="caption"
									fontWeight="bold"
									color="text.secondary"
								>
									Mudanças que serão aplicadas ({changes.length})
								</Typography>
								<List dense disablePadding>
									{changes.map((c, i) => (
										<ListItem key={i} disableGutters sx={{ py: 0 }}>
											<ListItemIcon sx={{ minWidth: 26 }}>
												{CHANGE_ICON[c.type]}
											</ListItemIcon>
											<ListItemText
												primary={c.name}
												secondary={`${CHANGE_LABEL[c.type]} em "${displayName(diff.data.target.id, diff.data.target.name)}"${c.file_name ? ` · ${c.file_name}` : ""}`}
												primaryTypographyProps={{ variant: "body2" }}
											/>
										</ListItem>
									))}
								</List>
							</Box>
						)}
						{conflicts.length > 0 && (
							<>
								<Divider />
								<Typography
									variant="caption"
									fontWeight="bold"
									color="text.secondary"
								>
									Diferenças para decidir ({unresolved.length} pendentes)
								</Typography>
								{conflicts.map((c) => (
									<ConflictCard
										key={c.key}
										conflict={c}
										targetName={displayName(
											diff.data.target.id,
											diff.data.target.name,
										)}
										sourceName={displayName(
											diff.data.source.id,
											diff.data.source.name,
										)}
										value={resolutions[c.key]}
										onChange={(r) =>
											setResolutions((prev) => ({
												...prev,
												[c.key]: r,
											}))
										}
									/>
								))}
							</>
						)}
					</>
				)}
				{error && <Alert severity="error">{error}</Alert>}
			</Box>
		</AppDialog>
	)
}
