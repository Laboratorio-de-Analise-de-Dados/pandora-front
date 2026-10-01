import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Box, Button, CircularProgress, Typography } from "@mui/material"
import { MdOutlineArrowBack } from "react-icons/md"
import { toast } from "react-toastify"
import Layout from "../../../components/Layout"
import { useConfirm } from "../../../components/ConfirmDialog"
import { useAuth } from "../../../providers/AuthContext"
import {
	useExperimentFilesQuery,
	useExperimentQuery,
	useSubsamplesQuery,
} from "../../../features/experiment/hooks/useExperimentData"
import {
	useFigureMockDeps,
	useFigureMutations,
	useFigureQuery,
	useFiguresQuery,
} from "../../../features/analysis/hooks/useFigures"
import FigureGallery from "../../../features/analysis/components/FigureGallery"
import FigureEditor from "../../../features/analysis/components/FigureEditor"
import { extractErrorMessage } from "../../../utils/apiError"

/**
 * FE-36 — página de análise do experimento (`/experiments/:id/analysis`):
 * galeria de figuras persistidas + viewer/editor (spec por figura, recompute
 * manual, export com procedência). Até o BE-33 existir, o service cai no
 * mock local que computa de verdade a partir das stats.
 */
const AnalysisPage = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const experimentId = Number(id)
	const { user } = useAuth()
	const confirm = useConfirm()

	const { data: experiment } = useExperimentQuery(id ?? "")
	const { data: files = [] } = useExperimentFilesQuery(id ?? "")
	const { data: subsamples = [] } = useSubsamplesQuery(id ?? "")
	const mockDeps = useFigureMockDeps(experimentId)

	const canEdit = Boolean(
		experiment &&
		user &&
		(user.is_super_admin ||
			experiment.created_by === user.id ||
			user.memberships.some(
				(m) => m.organization.id === experiment.organization?.id,
			)),
	)

	const figures = useFiguresQuery(experimentId || undefined)
	const [selectedId, setSelectedId] = useState<number | null>(null)
	const [drafting, setDrafting] = useState(false)
	const selected = useFigureQuery(selectedId ?? undefined, mockDeps)
	const { remove } = useFigureMutations(experimentId, mockDeps)

	const handleDelete = async (figureId: number) => {
		if (!(await confirm({ title: "Arquivar figura?" }))) return
		try {
			await remove.mutateAsync(figureId)
			if (selectedId === figureId) setSelectedId(null)
		} catch (e) {
			toast.error(extractErrorMessage(e))
		}
	}

	return (
		<Layout>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					height: "calc(100dvh - 48px)",
					overflow: "hidden",
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						px: { xs: 1, md: 2 },
						py: 1,
						borderBottom: 1,
						borderColor: "divider",
						flexShrink: 0,
					}}
				>
					<Button
						size="small"
						startIcon={<MdOutlineArrowBack />}
						onClick={() => navigate(`/experiments/${id}`)}
					>
						Workspace
					</Button>
					<Typography variant="subtitle1" noWrap sx={{ ml: 1 }}>
						Análise — {experiment?.title ?? ""}
					</Typography>
				</Box>

				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", md: "row" },
						flex: 1,
						minHeight: 0,
					}}
				>
					<Box
						sx={{
							width: { xs: "100%", md: 300 },
							maxHeight: { xs: "40%", md: "none" },
							borderRight: { md: 1 },
							borderBottom: { xs: 1, md: 0 },
							borderColor: "divider",
							flexShrink: 0,
							overflow: "hidden",
						}}
					>
						{figures.isLoading ? (
							<Box sx={{ display: "grid", placeItems: "center", p: 4 }}>
								<CircularProgress size={24} />
							</Box>
						) : (
							<FigureGallery
								figures={figures.data ?? []}
								selectedId={selectedId}
								onSelect={(fid) => {
									setSelectedId(fid)
									setDrafting(false)
								}}
								onCreate={() => {
									setDrafting(true)
									setSelectedId(null)
								}}
								onDelete={handleDelete}
								canEdit={canEdit}
							/>
						)}
					</Box>

					<Box sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
						{drafting || selected.data ? (
							<FigureEditor
								key={drafting ? "new" : (selected.data?.id ?? "new")}
								experimentId={experimentId}
								figure={drafting ? null : (selected.data ?? null)}
								files={files}
								subsamples={subsamples}
								channels={experiment?.values ?? []}
								canEdit={canEdit}
								mockDeps={mockDeps}
								onSaved={(f) => {
									setDrafting(false)
									setSelectedId(f.id)
								}}
								onCancelNew={() => setDrafting(false)}
							/>
						) : selected.isLoading ? (
							<Box sx={{ display: "grid", placeItems: "center", p: 6 }}>
								<CircularProgress size={28} />
							</Box>
						) : (
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ m: "auto", p: 4, display: "block", textAlign: "center" }}
							>
								Selecione uma figura na galeria ou crie uma nova.
							</Typography>
						)}
					</Box>
				</Box>
			</Box>
		</Layout>
	)
}

export default AnalysisPage
