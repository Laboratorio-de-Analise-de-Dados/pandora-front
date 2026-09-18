import { useState } from "react"
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Collapse,
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
	MdDeleteOutline as DiscardIcon,
	MdCheck as ApplyIcon,
	MdExpandMore as ExpandIcon,
} from "react-icons/md"
import {
	useCompensationActions,
	useCompensationsQuery,
	useEmbeddedCompensationQuery,
} from "../hooks/useCompensation"
import { AppDialog } from "../../../components/AppDialog"
import { useConfirm } from "../../../components/ConfirmDialog"
import type { CompensationMatrix } from "../../../services/compensationService"
import { formatTime } from "../../history/utils/datetime"

const SOURCE_LABELS: Record<string, string> = {
	fcs_header: "do arquivo",
	computed: "calculada",
	manual: "manual",
}

/** Grade N×N da matriz — legível até ~12 canais; além disso vira scroll. */
function MatrixGrid({
	channels,
	matrix,
}: {
	channels: string[]
	matrix: number[][]
}) {
	return (
		<Box
			component="div"
			sx={(theme) => ({
				overflowX: "auto",
				fontSize: "0.65rem",
				fontFamily: "monospace",
				border: 1,
				borderColor: "divider",
				borderRadius: 1,
				p: 0.5,
				bgcolor: theme.palette.action.hover,
			})}
		>
			<table style={{ borderCollapse: "collapse" }}>
				<thead>
					<tr>
						<th />
						{channels.map((c) => (
							<th
								key={c}
								style={{
									padding: "1px 4px",
									writingMode: "vertical-rl",
									fontWeight: 600,
									textAlign: "left",
								}}
							>
								{c}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{matrix.map((row, i) => (
						<tr key={channels[i] ?? i}>
							<td style={{ fontWeight: 600, paddingRight: 4 }}>
								{channels[i]}
							</td>
							{row.map((v, j) => (
								<td
									key={j}
									style={{
										textAlign: "right",
										padding: "0 4px",
										fontWeight: i === j ? 700 : 400,
									}}
								>
									{(v * 100).toFixed(1)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			<Typography variant="caption" color="text.secondary">
				Valores em % — linha = canal detector, coluna = fluorócromo.
			</Typography>
		</Box>
	)
}

interface CompensationPanelProps {
	experimentId: number | undefined
	canEdit: boolean
	onClose: () => void
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
}: CompensationPanelProps) {
	const matrices = useCompensationsQuery(experimentId)
	const embedded = useEmbeddedCompensationQuery(experimentId)
	const {
		fromHeaderMutation,
		computeMutation,
		applyMutation,
		removeMutation,
		renameMutation,
		discardMutation,
	} = useCompensationActions(experimentId)

	const confirm = useConfirm()
	const [showEmbeddedMatrix, setShowEmbeddedMatrix] = useState(false)
	const [previewMatrix, setPreviewMatrix] = useState<number | null>(null)
	const [renameTarget, setRenameTarget] = useState<CompensationMatrix | null>(
		null,
	)
	const [renameValue, setRenameValue] = useState("")

	const applied = (matrices.data ?? []).find((m) => m.is_applied)
	const busy =
		fromHeaderMutation.isPending ||
		computeMutation.isPending ||
		applyMutation.isPending ||
		removeMutation.isPending

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				minHeight: 0,
			}}
		>
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
				<IconButton onClick={onClose} size="small">
					<CloseIcon />
				</IconButton>
			</Box>
			<Divider />

			<Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, p: 2 }}>
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
				{embedded.data && (
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ mb: 0.5 }}>
							<strong>{embedded.data.channels.length} canais</strong> — matriz
							encontrada nos headers do arquivo (amostra #
							{embedded.data.file_data_id}).
						</Typography>
						<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
							<Button
								size="small"
								variant="outlined"
								onClick={() => setShowEmbeddedMatrix((v) => !v)}
								endIcon={
									<ExpandIcon
										style={{
											transform: showEmbeddedMatrix ? "rotate(180deg)" : "none",
										}}
									/>
								}
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
						<Collapse in={showEmbeddedMatrix}>
							<Box sx={{ mt: 1 }}>
								<MatrixGrid
									channels={embedded.data.channels}
									matrix={embedded.data.matrix}
								/>
							</Box>
						</Collapse>
					</Box>
				)}

				{/* Calcular dos controles */}
				{canEdit && (
					<Box sx={{ mb: 2 }}>
						<Button
							size="small"
							variant="outlined"
							disabled={busy}
							onClick={() => computeMutation.mutate({})}
						>
							Calcular a partir dos controles
						</Button>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ display: "block", mt: 0.5 }}
						>
							Usa os subsamples marcados como controle negativo e single-stain
							(menu ⋮ do subsample).
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
						<Box key={m.id}>
							<ListItem
								disableGutters
								secondaryAction={
									canEdit ? (
										<Box sx={{ display: "flex" }}>
											{!m.is_applied && (
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
										</Box>
									) : undefined
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
										</Box>
									}
									secondary={`${SOURCE_LABELS[m.source] ?? m.source} · ${m.channels.length} canais · ${m.created_by_name ?? "—"} · ${formatTime(m.created_at)}`}
								/>
							</ListItem>
							<Box sx={{ pl: 1, pb: 0.5 }}>
								<Button
									size="small"
									sx={{ textTransform: "none", fontSize: "0.7rem", p: 0 }}
									onClick={() =>
										setPreviewMatrix(previewMatrix === m.id ? null : m.id)
									}
								>
									{previewMatrix === m.id ? "ocultar" : "ver matriz"}
								</Button>
								<Collapse in={previewMatrix === m.id}>
									<MatrixGrid channels={m.channels} matrix={m.matrix} />
								</Collapse>
							</Box>
						</Box>
					))}
				</List>
			</Box>

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
