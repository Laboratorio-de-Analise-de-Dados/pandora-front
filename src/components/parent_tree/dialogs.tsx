import {
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material"
import { useEffect, useState } from "react"
import type { ExperimentFiles, Subsample } from "../../types"
import { fetchFileHeaders } from "../../services/experimentService"

/**
 * Cria ou renomeia um subsample. Com `target` é rename (mostra o `source_path`
 * como contexto read-only — é imutável, o rótulo editável é o nome). Erro da
 * API (ex.: nome duplicado) aparece no campo.
 */
export function SubsampleFormDialog({
	open,
	target,
	onSubmit,
	onClose,
}: {
	open: boolean
	/** null = criar; Subsample = renomear */
	target: Subsample | null
	onSubmit: (name: string) => Promise<string | null>
	onClose: () => void
}) {
	const [name, setName] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const editing = target !== null

	useEffect(() => {
		if (open) {
			setName(target?.name ?? "")
			setError(null)
		}
	}, [open, target])

	const handleSubmit = async () => {
		if (!name.trim() || saving) return
		setSaving(true)
		const submitError = await onSubmit(name.trim())
		setSaving(false)
		if (submitError) {
			setError(submitError)
			return
		}
		onClose()
	}

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
			<DialogTitle>
				{editing ? "Renomear subsample" : "Novo subsample"}
			</DialogTitle>
			<DialogContent>
				{editing && target?.source_path && (
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", display: "block", mb: 1 }}
					>
						Veio de <code>{target.source_path}</code> no ZIP
					</Typography>
				)}
				<TextField
					autoFocus
					label="Nome do subsample"
					value={name}
					onChange={(e) => setName(e.target.value)}
					error={!!error}
					helperText={error}
					fullWidth
					sx={{ mt: editing ? 0 : 1 }}
					onKeyDown={(e) => {
						if (e.key === "Enter") void handleSubmit()
					}}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancelar</Button>
				<Button
					onClick={() => void handleSubmit()}
					variant="contained"
					disabled={!name.trim() || saving}
				>
					Salvar
				</Button>
			</DialogActions>
		</Dialog>
	)
}

/**
 * Confirma o arquivamento: inativa o subsample e desvincula as amostras —
 * nada é apagado (BE-07, ADR-0005).
 */
export function ArchiveSubsampleDialog({
	target,
	onConfirm,
	onClose,
}: {
	target: Subsample | null
	onConfirm: (subsampleId: number) => void
	onClose: () => void
}) {
	return (
		<Dialog
			open={!!target}
			onClose={onClose}
			fullWidth
			maxWidth="xs"
			PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
		>
			<DialogTitle>Arquivar subsample</DialogTitle>
			<DialogContent>
				<Typography>
					O subsample <strong>{target?.name}</strong> sai da listagem, mas nada
					é apagado: as {target?.files_count ?? 0} amostras ficam preservadas em
					"Sem subsample" e você pode reativá-lo depois pelo filtro "Mostrar
					desabilitadas".
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancelar</Button>
				<Button
					onClick={() => target && onConfirm(target.id)}
					variant="contained"
				>
					Arquivar
				</Button>
			</DialogActions>
		</Dialog>
	)
}

/**
 * Move uma ou mais amostras para outro subsample — ou para "Sem subsample"
 * (null). Com várias, o valor inicial é o subsample comum entre elas ("" se
 * divergirem).
 */
export function MoveFileDialog({
	files,
	subsamples,
	onConfirm,
	onClose,
}: {
	files: ExperimentFiles[]
	subsamples: Subsample[]
	onConfirm: (fileDataIds: number[], subsampleId: number | null) => void
	onClose: () => void
}) {
	const [selected, setSelected] = useState<string>("")
	const single = files.length === 1 ? files[0] : null

	useEffect(() => {
		if (files.length === 0) return
		const first = files[0].subsample ?? null
		const same = files.every((f) => (f.subsample ?? null) === first)
		setSelected(same && first !== null ? String(first) : "")
	}, [files])

	const active = subsamples.filter((s) => s.active)

	return (
		<Dialog open={files.length > 0} onClose={onClose} fullWidth maxWidth="xs">
			<DialogTitle>
				{files.length > 1 ? `Mover ${files.length} amostras` : "Mover amostra"}
			</DialogTitle>
			<DialogContent>
				<Typography variant="body2" sx={{ mb: 1.5 }}>
					Mover{" "}
					<strong>
						{single
							? single.file_name
							: `${files.length} amostras selecionadas`}
					</strong>{" "}
					para:
				</Typography>
				<FormControl fullWidth size="small">
					<InputLabel>Subsample</InputLabel>
					<Select
						value={selected}
						label="Subsample"
						onChange={(e) => setSelected(e.target.value)}
					>
						<MenuItem value="">
							<em>Sem subsample</em>
						</MenuItem>
						{active.map((s) => (
							<MenuItem key={s.id} value={String(s.id)}>
								{s.name} ({s.files_count}{" "}
								{s.files_count === 1 ? "amostra" : "amostras"})
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancelar</Button>
				<Button
					onClick={() =>
						onConfirm(
							files.map((f) => f.id),
							selected === "" ? null : Number(selected),
						)
					}
					variant="contained"
				>
					Mover
				</Button>
			</DialogActions>
		</Dialog>
	)
}

// Keywords que sobem pro cabeçalho do diálogo (info de primeira vista).
// Chaves como o backend persiste: readfcs.view() → minúsculas, sem "$".
const SUMMARY_LABELS: Record<string, string> = {
	date: "Data do experimento",
	cyt: "Citômetro",
}

// Keywords FCS úteis na tabela — o resto fica na lista completa.
const HEADER_LABELS: Record<string, string> = {
	btim: "Início da aquisição",
	etim: "Fim da aquisição",
	cytnum: "Nº de série do equipamento",
	op: "Operador",
	inst: "Instituição",
	src: "Espécime/amostra",
	"experiment name": "Experimento",
	"tube name": "Tubo",
	"plate name": "Placa",
	"plate id": "ID da placa",
	"well id": "Poço (well)",
	"export time": "Exportado em",
	"export user name": "Exportado por",
	fil: "Arquivo original",
	tot: "Total de eventos",
	par: "Parâmetros",
}

const headerValue = (v: unknown): string =>
	typeof v === "object" && v !== null ? JSON.stringify(v) : String(v ?? "")

const MetadataTable = ({
	head,
	rows,
	monoKey,
}: {
	head: [string, string]
	rows: [string, unknown][]
	monoKey?: boolean
}) => (
	<TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
		<Table size="small">
			<TableHead>
				<TableRow>
					<TableCell sx={{ fontWeight: 600, width: "40%" }}>
						{head[0]}
					</TableCell>
					<TableCell sx={{ fontWeight: 600 }}>{head[1]}</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{rows.map(([key, value]) => (
					<TableRow key={key} hover>
						<TableCell
							sx={{
								color: "text.secondary",
								fontFamily: monoKey ? "monospace" : undefined,
								fontSize: monoKey ? "0.75rem" : undefined,
								verticalAlign: "top",
							}}
						>
							{key}
						</TableCell>
						<TableCell sx={{ wordBreak: "break-word" }}>
							{headerValue(value)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	</TableContainer>
)

/**
 * Metadados do header FCS da amostra (`GET /experiment/file/<id>/headers`).
 * Busca só ao abrir; amostras inativas também têm header legível.
 */
export function FileMetadataDialog({
	file,
	onClose,
}: {
	file: ExperimentFiles | null
	onClose: () => void
}) {
	const [headers, setHeaders] = useState<Record<string, unknown> | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [showAll, setShowAll] = useState(false)

	useEffect(() => {
		if (!file) {
			setHeaders(null)
			setError(null)
			setShowAll(false)
			return
		}
		let cancelled = false
		fetchFileHeaders(file.id)
			.then((res) => {
				if (!cancelled) setHeaders(res.headers)
			})
			.catch(() => {
				if (!cancelled) setError("Não foi possível carregar os metadados.")
			})
		return () => {
			cancelled = true
		}
	}, [file])

	const summary = headers
		? Object.entries(SUMMARY_LABELS)
				.filter(([key]) => headers[key] !== undefined && headers[key] !== "")
				.map(([key, label]) => ({
					key,
					label,
					value: headerValue(headers[key]),
				}))
		: []
	const curated: [string, unknown][] = headers
		? Object.entries(HEADER_LABELS)
				.filter(([key]) => headers[key] !== undefined && headers[key] !== "")
				.map(([key, label]) => [label, headers[key]])
		: []
	const rest = headers
		? Object.entries(headers).filter(
				([key]) => !(key in HEADER_LABELS) && !(key in SUMMARY_LABELS),
			)
		: []

	return (
		<Dialog open={!!file} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle sx={{ pb: 1 }}>
				Metadados do arquivo
				<Box
					sx={{
						display: "flex",
						flexWrap: "wrap",
						alignItems: "center",
						gap: 0.75,
						mt: 0.5,
					}}
				>
					<Typography variant="body2" color="text.secondary" noWrap>
						{file?.file_name}
					</Typography>
					{summary.map(({ key, label, value }) => (
						<Chip
							key={key}
							size="small"
							variant="outlined"
							label={`${label}: ${value}`}
						/>
					))}
				</Box>
			</DialogTitle>
			<DialogContent>
				{error && (
					<Typography variant="body2" color="error">
						{error}
					</Typography>
				)}
				{!headers && !error && (
					<Typography variant="body2" color="text.secondary">
						Carregando…
					</Typography>
				)}
				{headers && (
					<>
						<Typography
							variant="overline"
							sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
						>
							Informações principais
						</Typography>
						{curated.length > 0 ? (
							<MetadataTable head={["Campo", "Valor"]} rows={curated} />
						) : (
							<Typography variant="body2" color="text.secondary">
								O header não traz campos conhecidos — veja a lista completa.
							</Typography>
						)}
						{rest.length > 0 && (
							<>
								<Button
									size="small"
									onClick={() => setShowAll((v) => !v)}
									sx={{ mt: 1.5, mb: 0.5, textTransform: "none" }}
								>
									{showAll
										? "Ocultar campos brutos"
										: `Ver todos os campos (${rest.length})`}
								</Button>
								{showAll && (
									<MetadataTable
										head={["Keyword", "Valor"]}
										rows={rest}
										monoKey
									/>
								)}
							</>
						)}
					</>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Fechar</Button>
			</DialogActions>
		</Dialog>
	)
}
