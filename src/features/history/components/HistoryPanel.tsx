import { useMemo, useState } from "react"
import {
	Box,
	Button,
	CircularProgress,
	Collapse,
	Divider,
	IconButton,
	Tooltip,
	Typography,
} from "@mui/material"
import {
	MdExpandMore as ExpandIcon,
	MdClose as CloseIcon,
	MdEdit as EditIcon,
	MdDeleteOutline as DiscardIcon,
	MdPushPin as PinIcon,
	MdSettingsBackupRestore as RestoreIcon,
	MdVisibility as PreviewIcon,
} from "react-icons/md"
import {
	useCheckpointsQuery,
	useGroupedHistoryQuery,
} from "../hooks/useHistoryData"
import { useHistoryActions } from "../hooks/useHistoryActions"
import type { RestoreTarget } from "../hooks/useHistoryActions"
import type {
	AnalysisCheckpoint,
	AnalysisRevision,
	HistoryConflict,
	RestorePlan,
	RevertPlan,
} from "../../../services/historyService"
import type { ExperimentFiles } from "../../../types"
import {
	checkpointLabel,
	formatSessionLabel,
	formatTime,
} from "../utils/datetime"
import RevisionRow from "./RevisionRow"
import CheckpointDialog from "./CheckpointDialog"
import RestoreDialog from "./RestoreDialog"
import RevertDialog from "./RevertDialog"
import RevisionStatePreview from "./RevisionStatePreview"

interface HistoryPanelProps {
	experimentId: number | undefined
	files: ExperimentFiles[]
	canEdit: boolean
	/**
	 * Recorte por amostra (FE-27): quando setado, a timeline só traz o que
	 * toca o arquivo (ações experiment-wide continuam aparecendo).
	 */
	fileDataId?: number | null
	/** Nome da amostra do recorte — vai para o título do painel. */
	fileName?: string
	onClose: () => void
}

interface CheckpointDialogState {
	mode: "now" | "pin" | "rename"
	revisionId?: number
	checkpointId?: number
	initialMessage?: string
	targetLabel: string
}

/**
 * Painel de histórico e checkpoints (FE-25): timeline em sessões
 * (auto-checkpoints derivados) + marcos fixados + restore/revert com
 * dry-run. Quem só lê o experimento vê a timeline sem os botões de escrita.
 */
export default function HistoryPanel({
	experimentId,
	files,
	canEdit,
	fileDataId,
	fileName,
	onClose,
}: HistoryPanelProps) {
	const history = useGroupedHistoryQuery(experimentId, fileDataId ?? undefined)
	const checkpoints = useCheckpointsQuery(experimentId)
	const {
		pinMutation,
		renameMutation,
		discardMutation,
		previewRestore,
		confirmRestore,
		previewRevert,
		confirmRevert,
	} = useHistoryActions()

	const sessions = useMemo(
		() => history.data?.pages.flatMap((p) => p.sessions) ?? [],
		[history.data],
	)
	const summaryByRevision = useMemo(() => {
		const map = new Map<number, string>()
		for (const s of sessions)
			for (const r of s.revisions) map.set(r.id, r.summary)
		return map
	}, [sessions])
	const checkpointByRevision = useMemo(() => {
		const map = new Map<number, AnalysisCheckpoint>()
		for (const cp of checkpoints.data ?? [])
			if (cp.revision != null) map.set(cp.revision, cp)
		return map
	}, [checkpoints.data])
	// Modo experimento: cada linha diz qual amostra tocou (file_data da
	// revisão). No recorte por arquivo o rótulo é redundante — omitido.
	const fileNameById = useMemo(() => {
		const map = new Map<number, string>()
		for (const f of files) map.set(f.id, f.file_name)
		return map
	}, [files])

	// Sessão aberta por padrão: só a mais recente. As demais abrem/fecham
	// por toggle explícito — `toggledOpen` e `toggledClosed` se sobrepõem
	// ao default.
	const [toggledOpen, setToggledOpen] = useState<Set<number>>(new Set())
	const [toggledClosed, setToggledClosed] = useState<Set<number>>(new Set())
	const isSessionOpen = (index: number, endId: number) =>
		toggledClosed.has(endId) ? false : index === 0 || toggledOpen.has(endId)
	const toggleSession = (index: number, endId: number) => {
		if (isSessionOpen(index, endId)) {
			setToggledClosed((prev) => new Set(prev).add(endId))
			setToggledOpen((prev) => {
				const next = new Set(prev)
				next.delete(endId)
				return next
			})
		} else {
			setToggledOpen((prev) => new Set(prev).add(endId))
			setToggledClosed((prev) => {
				const next = new Set(prev)
				next.delete(endId)
				return next
			})
		}
	}

	// ---- Estado dos diálogos ----
	const [checkpointDialog, setCheckpointDialog] =
		useState<CheckpointDialogState | null>(null)
	const [restore, setRestore] = useState<{
		target: RestoreTarget
		plan: RestorePlan | null
		conflicts: HistoryConflict[]
		loading: boolean
	} | null>(null)
	const [revert, setRevert] = useState<{
		revision: AnalysisRevision
		plan: RevertPlan | null
		conflicts: HistoryConflict[]
		loading: boolean
	} | null>(null)
	const [preview, setPreview] = useState<{
		revisionId: number
		label: string
	} | null>(null)

	const openRestore = async (target: RestoreTarget) => {
		setRestore({ target, plan: null, conflicts: [], loading: true })
		const plan = await previewRestore(target)
		if (!plan) {
			setRestore(null)
			return
		}
		setRestore({
			target,
			plan,
			conflicts: plan.conflicts,
			loading: false,
		})
	}

	const handleConfirmRestore = async (force: boolean) => {
		if (!restore) return
		setRestore({ ...restore, loading: true })
		const result = await confirmRestore(restore.target, force)
		if (result === null) {
			setRestore(null)
			return
		}
		if (result.conflicts) {
			setRestore({
				...restore,
				plan: restore.plan,
				conflicts: result.conflicts as HistoryConflict[],
				loading: false,
			})
			return
		}
		setRestore(null)
	}

	const openRevert = async (revision: AnalysisRevision) => {
		setRevert({ revision, plan: null, conflicts: [], loading: true })
		const plan = await previewRevert(revision.id)
		if (!plan) {
			setRevert(null)
			return
		}
		setRevert({ revision, plan, conflicts: plan.conflicts, loading: false })
	}

	const handleConfirmRevert = async () => {
		if (!revert) return
		setRevert({ ...revert, loading: true })
		const result = await confirmRevert(revert.revision.id)
		if (result?.conflicts) {
			setRevert({
				...revert,
				conflicts: result.conflicts as HistoryConflict[],
				loading: false,
			})
			return
		}
		setRevert(null)
	}

	const handleCheckpointConfirm = (message: string) => {
		if (!checkpointDialog) return
		if (checkpointDialog.mode === "rename" && checkpointDialog.checkpointId) {
			renameMutation.mutate({
				checkpointId: checkpointDialog.checkpointId,
				message,
			})
		} else {
			pinMutation.mutate({
				message: message || undefined,
				...(checkpointDialog.mode === "pin"
					? { revision_id: checkpointDialog.revisionId }
					: {}),
			})
		}
		setCheckpointDialog(null)
	}

	const checkpointTarget = (cp: AnalysisCheckpoint): RestoreTarget => ({
		revisionId: cp.revision,
		checkpointId: cp.id,
		label: checkpointLabel(cp.message, cp.created_at),
	})

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				minHeight: 0,
			}}
		>
			{/* Cabeçalho */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					px: 2,
					py: 1.5,
					gap: 1,
				}}
			>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography variant="h6" noWrap>
						{fileDataId && fileName
							? `Histórico — ${fileName}`
							: "Histórico do experimento"}
					</Typography>
					{fileDataId != null && (
						<Typography variant="caption" color="text.secondary">
							Só o que toca esta amostra (ações do experimento incluídas)
						</Typography>
					)}
				</Box>
				<IconButton onClick={onClose} size="small">
					<CloseIcon />
				</IconButton>
			</Box>
			{canEdit && (
				<Box sx={{ px: 2, pb: 1 }}>
					<Button
						variant="contained"
						size="small"
						fullWidth
						startIcon={<PinIcon />}
						disabled={pinMutation.isPending}
						onClick={() =>
							setCheckpointDialog({
								mode: "now",
								targetLabel: "o estado atual",
							})
						}
					>
						Salvar ponto
					</Button>
				</Box>
			)}
			<Divider />

			<Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
				{/* Marcos fixados */}
				{(checkpoints.data ?? []).length > 0 && (
					<Box sx={{ px: 1.5, py: 1 }}>
						<Typography variant="overline" color="text.secondary">
							Pontos salvos
						</Typography>
						{(checkpoints.data ?? []).map((cp) => (
							<Box
								key={cp.id}
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.5,
									py: 0.5,
								}}
							>
								<PinIcon style={{ flexShrink: 0, opacity: 0.7 }} />
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Typography variant="body2" noWrap>
										{checkpointLabel(cp.message, cp.created_at)}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{cp.created_by_name ? `por ${cp.created_by_name} · ` : ""}
										{formatTime(cp.created_at)}
									</Typography>
								</Box>
								{cp.revision != null && (
									<Tooltip title="Visualizar estado">
										<IconButton
											size="small"
											onClick={() =>
												setPreview({
													revisionId: cp.revision as number,
													label: checkpointLabel(cp.message, cp.created_at),
												})
											}
										>
											<PreviewIcon fontSize="small" />
										</IconButton>
									</Tooltip>
								)}
								{canEdit && (
									<>
										<Tooltip title="Renomear">
											<IconButton
												size="small"
												onClick={() =>
													setCheckpointDialog({
														mode: "rename",
														checkpointId: cp.id,
														initialMessage: cp.message,
														targetLabel: "o ponto fixado",
													})
												}
											>
												<EditIcon fontSize="small" />
											</IconButton>
										</Tooltip>
										<Tooltip title="Descartar checkpoint">
											<IconButton
												size="small"
												onClick={() => discardMutation.mutate(cp.id)}
											>
												<DiscardIcon fontSize="small" />
											</IconButton>
										</Tooltip>
										<Tooltip title="Restaurar até este ponto">
											<IconButton
												size="small"
												color="primary"
												onClick={() => openRestore(checkpointTarget(cp))}
											>
												<RestoreIcon fontSize="small" />
											</IconButton>
										</Tooltip>
									</>
								)}
							</Box>
						))}
						<Divider sx={{ mt: 1 }} />
					</Box>
				)}

				{/* Timeline em sessões */}
				{history.isLoading && (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							py: 4,
						}}
					>
						<CircularProgress size={28} />
					</Box>
				)}
				{!history.isLoading && sessions.length === 0 && (
					<Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
						Nenhuma alteração registrada ainda.
					</Typography>
				)}
				{sessions.map((session, index) => {
					const open = isSessionOpen(index, session.end_revision_id)
					return (
						<Box key={session.end_revision_id}>
							<Box
								role="button"
								onClick={() => toggleSession(index, session.end_revision_id)}
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.5,
									px: 1.5,
									py: 1,
									cursor: "pointer",
									"&:hover": {
										bgcolor: "action.hover",
									},
								}}
							>
								<ExpandIcon
									style={{
										transform: open ? "rotate(180deg)" : "none",
										transition: "transform 0.15s",
									}}
								/>
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Typography variant="body2" fontWeight={600}>
										{formatSessionLabel(session.started_at, session.ended_at)}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{session.count} alteraç
										{session.count === 1 ? "ão" : "ões"}
									</Typography>
								</Box>
								{canEdit && (
									<Tooltip title="Restaurar até o fim desta sessão">
										<IconButton
											size="small"
											onClick={(e) => {
												e.stopPropagation()
												void openRestore({
													revisionId: session.end_revision_id,
													label: `a sessão de ${formatSessionLabel(session.started_at, session.ended_at)}`,
												})
											}}
										>
											<RestoreIcon fontSize="small" />
										</IconButton>
									</Tooltip>
								)}
							</Box>
							<Collapse in={open}>
								<Box sx={{ pb: 0.5 }}>
									{session.revisions.map((rev) => (
										<RevisionRow
											key={rev.id}
											revision={rev}
											fileLabel={
												fileDataId == null && rev.file_data != null
													? (fileNameById.get(rev.file_data) ??
														`amostra #${rev.file_data}`)
													: undefined
											}
											checkpoint={
												session.end_revision_id === rev.id
													? (session.checkpoint ??
														checkpointByRevision.get(rev.id))
													: checkpointByRevision.get(rev.id)
											}
											canEdit={canEdit}
											onPin={(revisionId) =>
												setCheckpointDialog({
													mode: "pin",
													revisionId,
													targetLabel: `a revisão #${revisionId}`,
												})
											}
											onRevert={(r) => void openRevert(r)}
											onRestoreHere={(r) =>
												void openRestore({
													revisionId: r.id,
													label: `a revisão #${r.id}`,
												})
											}
											onPreview={(r) =>
												setPreview({
													revisionId: r.id,
													label: `a revisão #${r.id}`,
												})
											}
										/>
									))}
								</Box>
							</Collapse>
							<Divider />
						</Box>
					)
				})}
				{history.hasNextPage && (
					<Box sx={{ p: 1.5, textAlign: "center" }}>
						<Button
							size="small"
							onClick={() => history.fetchNextPage()}
							disabled={history.isFetchingNextPage}
						>
							{history.isFetchingNextPage
								? "Carregando…"
								: "Carregar mais antigas"}
						</Button>
					</Box>
				)}
			</Box>

			{/* Diálogos */}
			<CheckpointDialog
				open={checkpointDialog != null}
				initialMessage={checkpointDialog?.initialMessage}
				targetLabel={checkpointDialog?.targetLabel ?? ""}
				saving={pinMutation.isPending || renameMutation.isPending}
				onClose={() => setCheckpointDialog(null)}
				onConfirm={handleCheckpointConfirm}
			/>
			<RestoreDialog
				open={restore != null}
				targetLabel={restore?.target.label ?? ""}
				plan={restore?.plan ?? null}
				conflicts={restore?.conflicts ?? []}
				loading={restore?.loading ?? false}
				summaryByRevision={summaryByRevision}
				onConfirm={(force) => void handleConfirmRestore(force)}
				onClose={() => setRestore(null)}
			/>
			<RevertDialog
				open={revert != null}
				revisionSummary={revert?.revision.summary ?? ""}
				plan={revert?.plan ?? null}
				conflicts={revert?.conflicts ?? []}
				loading={revert?.loading ?? false}
				onConfirm={() => void handleConfirmRevert()}
				onClose={() => setRevert(null)}
			/>
			<RevisionStatePreview
				revisionId={preview?.revisionId ?? null}
				targetLabel={preview?.label ?? ""}
				files={files}
				onClose={() => setPreview(null)}
			/>
		</Box>
	)
}
