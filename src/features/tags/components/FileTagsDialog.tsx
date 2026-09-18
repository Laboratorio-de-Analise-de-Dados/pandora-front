import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	TextField,
	Typography,
} from "@mui/material"
import { MdAdd as AddIcon } from "react-icons/md"
import { AppDialog } from "../../../components/AppDialog"
import { createTag, fetchTags } from "../../../services/tagService"
import { extractErrorMessage } from "../../../utils/apiError"
import type { ExperimentFiles, SampleTag } from "../../../types"
import { commonTagIds, computeTagTargets } from "../utils/tagTargets"
import type { TagTarget } from "../utils/tagTargets"
import TagChip from "./TagChip"

/**
 * Picker de tags de amostra (BE-34/FE-34). Com uma amostra edita o
 * conjunto explícito inteiro (PUT substitui tudo); em lote aplica delta —
 * marcar adiciona em todas, desmarcar remove das que têm, e tags que só
 * algumas amostras têm são preservadas. Controle é seleção única (o
 * backend valida e o erro aparece aqui). Herdadas são somente leitura.
 */
export default function FileTagsDialog({
	files,
	onSubmit,
	onClose,
}: {
	files: ExperimentFiles[]
	onSubmit: (targets: TagTarget[]) => Promise<string | null>
	onClose: () => void
}) {
	const queryClient = useQueryClient()
	const [selected, setSelected] = useState<Set<number>>(new Set())
	const [newName, setNewName] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [creating, setCreating] = useState(false)

	const open = files.length > 0
	const single = files.length === 1 ? files[0] : null

	const { data: vocabulary = [], isLoading } = useQuery({
		queryKey: ["tags"],
		queryFn: fetchTags,
		enabled: open,
	})

	useEffect(() => {
		// Uma amostra: começa do conjunto dela. Lote: começa da interseção.
		setSelected(
			single ? new Set(single.tags?.map((t) => t.id)) : commonTagIds(files),
		)
		setNewName("")
		setError(null)
	}, [files, single])

	const controls = vocabulary.filter((t) => t.category === "control")
	const general = vocabulary.filter((t) => t.category === "general")
	const inherited = single?.inherited_tags ?? []
	const suggested = single
		? vocabulary.filter(
				(t) =>
					t.system_key !== null &&
					(single.suggested_tags ?? []).includes(t.system_key) &&
					!selected.has(t.id),
			)
		: []

	const toggle = (tag: SampleTag) => {
		setError(null)
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(tag.id)) {
				next.delete(tag.id)
			} else {
				// Controle é exclusivo: marcar um desmarca os demais.
				if (tag.category === "control") {
					controls.forEach((c) => next.delete(c.id))
				}
				next.add(tag.id)
			}
			return next
		})
	}

	const handleCreate = async () => {
		const name = newName.trim()
		if (!name || creating) return
		setCreating(true)
		setError(null)
		try {
			const tag = await createTag({ name })
			setSelected((prev) => new Set(prev).add(tag.id))
			setNewName("")
			await queryClient.invalidateQueries({ queryKey: ["tags"] })
		} catch (e) {
			setError(extractErrorMessage(e))
		} finally {
			setCreating(false)
		}
	}

	const handleSubmit = async () => {
		if (!open || saving) return
		setSaving(true)
		const submitError = await onSubmit(computeTagTargets(files, selected))
		setSaving(false)
		if (submitError) {
			setError(submitError)
			return
		}
		onClose()
	}

	const tagButton = (tag: SampleTag) => {
		const active = selected.has(tag.id)
		return (
			<Chip
				key={tag.id}
				label={tag.name}
				size="small"
				variant={active ? "filled" : "outlined"}
				onClick={() => toggle(tag)}
				sx={{
					fontSize: "0.75rem",
					borderColor: tag.color,
					...(active
						? { bgcolor: tag.color, color: "#fff" }
						: { color: tag.color }),
				}}
			/>
		)
	}

	return (
		<AppDialog
			open={open}
			title={single ? "Tags da amostra" : `Tags de ${files.length} amostras`}
			onClose={onClose}
			onConfirm={() => void handleSubmit()}
			confirmLabel="Salvar"
			loading={saving}
		>
			{single ? (
				<Typography
					variant="body2"
					color="text.secondary"
					sx={{ mb: 1.5 }}
					noWrap
				>
					{single.file_name}
				</Typography>
			) : (
				<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
					Marcar adiciona a tag em todas; desmarcar remove das que têm. Tags que
					só algumas amostras têm são mantidas.
				</Typography>
			)}
			{isLoading ? (
				<CircularProgress size={20} />
			) : (
				<>
					<Typography
						variant="overline"
						sx={{ color: "text.secondary", display: "block" }}
					>
						Tipo de controle
					</Typography>
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
						{controls.map(tagButton)}
					</Box>
					<Typography
						variant="overline"
						sx={{ color: "text.secondary", display: "block" }}
					>
						Contexto
					</Typography>
					<Box
						sx={{
							display: "flex",
							flexWrap: "wrap",
							gap: 0.75,
							alignItems: "center",
							mb: 1.5,
						}}
					>
						{general.map(tagButton)}
						<TextField
							size="small"
							placeholder="Nova tag…"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") void handleCreate()
							}}
							sx={{ width: 140 }}
						/>
						<Button
							size="small"
							startIcon={<AddIcon />}
							onClick={() => void handleCreate()}
							disabled={!newName.trim() || creating}
							sx={{ textTransform: "none" }}
						>
							Criar
						</Button>
					</Box>
					{suggested.length > 0 && (
						<>
							<Typography
								variant="overline"
								sx={{ color: "text.secondary", display: "block" }}
							>
								Sugeridas pelo nome do arquivo
							</Typography>
							<Box
								sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}
							>
								{suggested.map((tag) => (
									<Chip
										key={tag.id}
										icon={<AddIcon />}
										label={tag.name}
										size="small"
										variant="outlined"
										onClick={() => toggle(tag)}
										sx={{
											fontSize: "0.75rem",
											borderStyle: "dashed",
											borderColor: tag.color,
											color: tag.color,
										}}
									/>
								))}
							</Box>
						</>
					)}
					{inherited.length > 0 && (
						<>
							<Typography
								variant="overline"
								sx={{ color: "text.secondary", display: "block" }}
							>
								Herdadas do subsample
							</Typography>
							<Box
								sx={{
									display: "flex",
									flexWrap: "wrap",
									gap: 0.75,
									alignItems: "center",
								}}
							>
								{inherited.map((tag) => (
									<TagChip key={tag.id} tag={tag} inherited />
								))}
								<Typography variant="caption" color="text.secondary">
									uma tag de controle explícita substitui a herdada
								</Typography>
							</Box>
						</>
					)}
					{error && (
						<Typography
							variant="caption"
							color="error"
							sx={{ mt: 1, display: "block" }}
						>
							{error}
						</Typography>
					)}
				</>
			)}
		</AppDialog>
	)
}
