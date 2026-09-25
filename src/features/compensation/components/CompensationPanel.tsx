import { useState } from "react"
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemText,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material"
import {
	MdClose as CloseIcon,
	MdEdit as RenameIcon,
	MdTune as EditMatrixIcon,
	MdDeleteOutline as DiscardIcon,
	MdCheck as ApplyIcon,
} from "react-icons/md"
import { toast } from "react-toastify"
import {
	useCompensationActions,
	useCompensationsQuery,
	useEmbeddedCompensationQuery,
} from "../hooks/useCompensation"
import { AppDialog } from "../../../components/AppDialog"
import { useConfirm } from "../../../components/ConfirmDialog"
import ComputeCompensationDialog from "./ComputeCompensationDialog"
import ViewCompensationDialog from "./ViewCompensationDialog"
import { useCompensationEdit } from "../context/CompensationEditContext"
import {
	computeCompensation,
	type CompensationComputePayload,
	type CompensationMatrix,
} from "../../../services/compensationService"
import { extractErrorMessage } from "../../../utils/apiError"
import { formatTime } from "../../history/utils/datetime"

const SOURCE_LABELS: Record<string, string> = {
	fcs_header: "do arquivo",
	computed: "calculada",
	manual: "manual",
}

/** FE-40: proveniência — derivada mostra a origem do ajuste. */
const sourceLabel = (m: CompensationMatrix) =>
	m.derived_from_name
		? `ajustada de ${m.derived_from_name}`
		: (SOURCE_LABELS[m.source] ?? m.source)

interface CompensationPanelProps {
	experimentId: number | undefined
	canEdit: boolean
	onClose?: () => void
	/**
	 * Dentro de uma seção expansível do painel lateral: sem header/X
	 * próprios e altura natural (o painel inteiro é quem rola).
	 */
	embedded?: boolean
}

/**
 * Painel de compensação (FE-27): estado atual, matriz embutida da
 * amostra ("usar do arquivo"), matrizes salvas (aplicar/renomear/
 * descartar) e cálculo a partir dos controles marcados nos subsamples.
 * Quem só lê vê o estado sem os botões de escrita.
 */
export default function CompensationPanel({
	experimentId,
	canEdit,
	onClose,
	embedded = false,
}: CompensationPanelProps) {
	const matrices = useCompensationsQuery(experimentId)
	const embeddedMatrix = useEmbeddedCompensationQuery(experimentId)
	const {
		fromHeaderMutation,
		invalidateAll,
		applyMutation,
		removeMutation,
		renameMutation,
		discardMutation,
	} = useCompensationActions(experimentId)

	const confirm = useConfirm()
	// FE-41: "Editar"/"Nova matriz" ligam o modo de edição do workspace —
	// a grade mora nesta seção e o plot central vira a prévia ao vivo.
	const { startEditing } = useCompensationEdit()
	const [viewEmbedded, setViewEmbedded] = useState(false)
	const [computeOpen, setComputeOpen] = useState(false)
	/** Matriz salva aberta no visualizador (read-only + botão Editar). */
	const [viewTarget, setViewTarget] = useState<CompensationMatrix | null>(null)
	const [renameTarget, setRenameTarget] = useState<CompensationMatrix | null>(
		null,
	)
	const [renameValue, setRenameValue] = useState("")

	const applied = (matrices.data ?? []).find((m) => m.is_applied)
	const busy =
		fromHeaderMutation.isPending ||
		applyMutation.isPending ||
		removeMutation.isPending

	/** FE-39: submit do modal — erro volta pra exibir inline no dialog. */
	const handleComputeSubmit = async (
		payload: CompensationComputePayload,
	): Promise<string | null> => {
		if (!experimentId) return "Experimento não carregado."
		try {
			const matrix = await computeCompensation(experimentId, payload)
			toast.success(`Matriz "${matrix.name}" calculada dos controles.`)
			invalidateAll()
			return null
		} catch (error) {
			return extractErrorMessage(error)
		}
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				minHeight: 0,
				...(embedded ? {} : { height: "100%" }),
			}}
		>
			{!embedded && (
				<>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							px: 2,
							py: 1.5,
							gap: 1,
						}}
					>
						<Typography variant="h6" sx={{ flex: 1 }}>
							Compensação
						</Typography>
						{onClose && (
							<IconButton onClick={onClose} size="small">
								<CloseIcon />
							</IconButton>
						)}
					</Box>
					<Divider />
				</>
			)}

			<Box
				sx={{
					flex: 1,
					minHeight: 0,
					p: 2,
					...(embedded ? {} : { overflowY: "auto" }),
				}}
			>
				{/* Estado atual */}
				<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
					{applied ? (
						<>
							<Chip
								label={`Aplicada: ${applied.name}`}
								color="primary"
								size="small"
							/>
							{canEdit && (
								<Button
									size="small"
									onClick={() => removeMutation.mutate()}
									disabled={busy}
								>
									Remover
								</Button>
							)}
						</>
					) : (
						<Typography variant="body2" color="text.secondary">
							Nenhuma compensação aplicada — dados crus.
						</Typography>
					)}
				</Box>

				{/* Matriz embutida nos headers da amostra */}
				{embeddedMatrix.data && (
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ mb: 0.5 }}>
							<strong>{embeddedMatrix.data.channels.length} canais</strong> —
							matriz encontrada nos headers do arquivo (amostra #
							{embeddedMatrix.data.file_data_id}).
						</Typography>
						<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
							<Button
								size="small"
								variant="outlined"
								onClick={() => setViewEmbedded(true)}
							>
								Ver matriz
							</Button>
							{canEdit && (
								<>
									<Button
										size="small"
										variant="outlined"
										disabled={busy}
										onClick={() => fromHeaderMutation.mutate({})}
									>
										Usar do arquivo
									</Button>
									<Button
										size="small"
										variant="contained"
										disabled={busy}
										onClick={() => fromHeaderMutation.mutate({ apply: true })}
									>
										Usar e aplicar
									</Button>
								</>
							)}
						</Box>
					</Box>
				)}

				{/* Calcular dos controles + criar manual (FE-40) */}
				{canEdit && (
					<Box sx={{ mb: 2 }}>
						<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
							<Button
								size="small"
								variant="outlined"
								disabled={busy}
								onClick={() => setComputeOpen(true)}
							>
								Calcular a partir dos controles
							</Button>
							<Button
								size="small"
								variant="outlined"
								disabled={busy}
								onClick={() => startEditing(null)}
							>
								Nova matriz
							</Button>
						</Box>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ display: "block", mt: 0.5 }}
						>
							Escolha as amostras de controle de cada canal direto na lista —
							subsamples já marcados vêm preenchidos. Ou monte a grade na mão
							com "Nova matriz".
						</Typography>
					</Box>
				)}

				<Divider sx={{ my: 1.5 }} />
				<Typography variant="overline" color="text.secondary">
					Matrizes salvas
				</Typography>
				{matrices.isLoading && (
					<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
						<CircularProgress size={24} />
					</Box>
				)}
				{!matrices.isLoading && (matrices.data ?? []).length === 0 && (
					<Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
						Nenhuma matriz salva ainda.
					</Typography>
				)}
				<List dense disablePadding>
					{(matrices.data ?? []).map((m) => (
						<ListItem
							key={m.id}
							disableGutters
							secondaryAction={
								<Box sx={{ display: "flex" }}>
									{canEdit && !m.is_applied && (
										<Tooltip title="Aplicar esta matriz">
											<IconButton
												size="small"
												color="primary"
												disabled={busy}
												onClick={() => applyMutation.mutate(m.id)}
											>
												<ApplyIcon fontSize="small" />
											</IconButton>
										</Tooltip>
									)}
									<Tooltip
										title={
											canEdit ? "Ver matriz / ajustar valores" : "Ver matriz"
										}
									>
										<IconButton
											size="small"
											disabled={busy}
											onClick={() => setViewTarget(m)}
										>
											<EditMatrixIcon fontSize="small" />
										</IconButton>
									</Tooltip>
									{canEdit && (
										<>
											<Tooltip title="Renomear">
												<IconButton
													size="small"
													onClick={() => {
														setRenameTarget(m)
														setRenameValue(m.name)
													}}
												>
													<RenameIcon fontSize="small" />
												</IconButton>
											</Tooltip>
											<Tooltip title="Descartar">
												<IconButton
													size="small"
													onClick={() => {
														void confirm({
															title: "Descartar matriz",
															description: (
																<>
																	<strong>{m.name}</strong> sai da lista (soft
																	delete).
																	{m.is_applied &&
																		" Como está aplicada, a compensação é removida junto — tudo fica registrado no histórico."}
																</>
															),
															confirmLabel: "Descartar",
															severity: "danger",
														}).then((ok) => {
															if (ok) discardMutation.mutate(m.id)
														})
													}}
												>
													<DiscardIcon fontSize="small" />
												</IconButton>
											</Tooltip>
										</>
									)}
								</Box>
							}
						>
							<ListItemText
								primary={
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.5,
										}}
									>
										<Typography variant="body2" noWrap>
											{m.name}
										</Typography>
										{m.is_applied && (
											<Chip
												label="aplicada"
												size="small"
												color="primary"
												sx={{ height: 18, fontSize: "0.6rem" }}
											/>
										)}
										{m.derived_from != null && (
											<Chip
												label="ajustada"
												size="small"
												variant="outlined"
												sx={{ height: 18, fontSize: "0.6rem" }}
											/>
										)}
									</Box>
								}
								secondary={`${sourceLabel(m)} · ${m.channels.length} canais · ${m.created_by_name ?? "—"} · ${formatTime(m.created_at)}`}
							/>
						</ListItem>
					))}
				</List>
			</Box>

			{experimentId && (
				<ComputeCompensationDialog
					experimentId={experimentId}
					open={computeOpen}
					onClose={() => setComputeOpen(false)}
					onSubmit={handleComputeSubmit}
				/>
			)}

			{/* Ver matriz salva — "Editar" troca esta seção pelo editor e
			    liga a prévia no plot (modo edição do workspace, FE-41). */}
			{viewTarget && (
				<ViewCompensationDialog
					open
					title={viewTarget.name}
					channels={viewTarget.channels}
					matrix={viewTarget.matrix}
					onClose={() => setViewTarget(null)}
					onEdit={
						canEdit
							? () => {
									setViewTarget(null)
									startEditing(viewTarget)
								}
							: undefined
					}
				/>
			)}

			{/* Matriz embutida: ver sem editar (não é salva — "Usar do
				arquivo" cria a persistida). */}
			{embeddedMatrix.data && (
				<ViewCompensationDialog
					open={viewEmbedded}
					title={`Matriz do arquivo (amostra #${embeddedMatrix.data.file_data_id})`}
					channels={embeddedMatrix.data.channels}
					matrix={embeddedMatrix.data.matrix}
					onClose={() => setViewEmbedded(false)}
				/>
			)}

			{/* Renomear */}
			<AppDialog
				open={renameTarget != null}
				title="Renomear matriz"
				onClose={() => setRenameTarget(null)}
				onConfirm={() => {
					if (!renameTarget) return
					renameMutation.mutate(
						{ matrixId: renameTarget.id, name: renameValue.trim() },
						{ onSuccess: () => setRenameTarget(null) },
					)
				}}
				confirmLabel="Salvar"
				confirmDisabled={!renameValue.trim()}
				loading={renameMutation.isPending}
			>
				<TextField
					autoFocus
					fullWidth
					size="small"
					label="Nome"
					value={renameValue}
					onChange={(e) => setRenameValue(e.target.value)}
					sx={{ mt: 1 }}
				/>
			</AppDialog>
		</Box>
	)
}
