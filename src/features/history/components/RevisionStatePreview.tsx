import { useMemo } from "react"
import {
	Box,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	Typography,
} from "@mui/material"
import { MdClose as CloseIcon } from "react-icons/md"
import { useRevisionStateQuery } from "../hooks/useHistoryData"
import type { GateStateSnapshot } from "../../../services/historyService"
import type { ExperimentFiles } from "../../../types"

interface RevisionStatePreviewProps {
	revisionId: number | null
	targetLabel: string
	files: ExperimentFiles[]
	onClose: () => void
}

/** Monta a árvore (indentação por parent_id) a partir da lista plana. */
function buildRows(gates: GateStateSnapshot[]) {
	const byParent = new Map<number | null, GateStateSnapshot[]>()
	for (const g of gates) {
		const key = g.parent_id ?? null
		byParent.set(key, [...(byParent.get(key) ?? []), g])
	}
	const rows: { gate: GateStateSnapshot; depth: number }[] = []
	const visit = (parentId: number | null, depth: number) => {
		for (const g of byParent.get(parentId) ?? []) {
			rows.push({ gate: g, depth })
			visit(g.id, depth + 1)
		}
	}
	visit(null, 0)
	// Órfãos (pai fora do snapshot) — mostra no nível raiz para não sumir.
	const shown = new Set(rows.map((r) => r.gate.id))
	for (const g of gates) {
		if (!shown.has(g.id)) rows.push({ gate: g, depth: 0 })
	}
	return rows
}

/**
 * Modo preview (FE-25): árvore de gates como era na revisão — read-only,
 * servido por `GET /analytics/history/<rev>/state/` (BE-20). Não plota
 * geometria (diff visual é evolução futura); mostra nomes, cores e
 * hierarquia por amostra.
 */
export default function RevisionStatePreview({
	revisionId,
	targetLabel,
	files,
	onClose,
}: RevisionStatePreviewProps) {
	const { data, isLoading } = useRevisionStateQuery(revisionId)
	const fileNameById = useMemo(
		() => new Map(files.map((f) => [f.id, f.file_name])),
		[files],
	)

	return (
		<Dialog
			open={revisionId != null}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { maxHeight: "85vh" } }}
		>
			<DialogTitle sx={{ pr: 6 }}>
				Estado em {targetLabel}
				<IconButton
					onClick={onClose}
					sx={{ position: "absolute", top: 8, right: 8 }}
				>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent dividers>
				<Typography variant="caption" color="text.secondary">
					Visualização histórica — somente leitura.
				</Typography>
				{isLoading && (
					<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
						<CircularProgress size={28} />
					</Box>
				)}
				{data && (
					<Box sx={{ mt: 1 }}>
						{Object.keys(data.files).length === 0 && (
							<Typography variant="body2" color="text.secondary">
								Nenhum gate existia neste ponto.
							</Typography>
						)}
						{Object.entries(data.files).map(([fileId, gates]) => (
							<Box key={fileId} sx={{ mb: 2 }}>
								<Typography variant="subtitle2" fontWeight="bold">
									{fileNameById.get(Number(fileId)) ?? `Amostra ${fileId}`}
								</Typography>
								{gates.length === 0 ? (
									<Typography variant="body2" color="text.secondary">
										Sem gates.
									</Typography>
								) : (
									buildRows(gates).map(({ gate, depth }) => (
										<Box
											key={gate.id}
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 1,
												pl: 1 + depth * 2.5,
												py: 0.25,
											}}
										>
											<Box
												sx={{
													width: 10,
													height: 10,
													borderRadius: "50%",
													bgcolor: gate.color ?? "action.disabled",
													flexShrink: 0,
												}}
											/>
											<Typography variant="body2">{gate.name}</Typography>
										</Box>
									))
								)}
							</Box>
						))}
					</Box>
				)}
			</DialogContent>
		</Dialog>
	)
}
