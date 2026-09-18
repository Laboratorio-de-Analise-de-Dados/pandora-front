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
import TagChip from "./TagChip"

/**
 * Picker de tags da amostra (BE-34/FE-34): edita o conjunto explícito
 * (PUT substitui tudo). Controle é seleção única — o backend valida a
 * exclusividade e o erro aparece aqui. Tags herdadas do subsample são
 * somente leitura; uma explícita de controle as substitui na leitura.
 */
export default function FileTagsDialog({
	file,
	onSubmit,
	onClose,
}: {
	file: ExperimentFiles | null
	onSubmit: (fileDataId: number, tagIds: number[]) => Promise<string | null>
	onClose: () => void
}) {
	const queryClient = useQueryClient()
	const [selected, setSelected] = useState<Set<number>>(new Set())
	const [newName, setNewName] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [creating, setCreating] = useState(false)

	const { data: vocabulary = [], isLoading } = useQuery({
		queryKey: ["tags"],
		queryFn: fetchTags,
		enabled: !!file,
	})

	useEffect(() => {
		setSelected(new Set((file?.tags ?? []).map((t) => t.id)))
		setNewName("")
		setError(null)
	}, [file])

	const controls = vocabulary.filter((t) => t.category === "control")
	const general = vocabulary.filter((t) => t.category === "general")
	const inherited = file?.inherited_tags ?? []
	const suggested = vocabulary.filter(
		(t) =>
			t.system_key !== null &&
			(file?.suggested_tags ?? []).includes(t.system_key) &&
			!selected.has(t.id),
	)

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
		if (!file || saving) return
		setSaving(true)
		const submitError = await onSubmit(file.id, [...selected])
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
			open={!!file}
			title="Tags da amostra"
			onClose={onClose}
			onConfirm={() => void handleSubmit()}
			confirmLabel="Salvar"
			loading={saving}
		>
			<Typography
				variant="body2"
				color="text.secondary"
				sx={{ mb: 1.5 }}
				noWrap
			>
				{file?.file_name}
			</Typography>
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
