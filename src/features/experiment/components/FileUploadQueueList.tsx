import {
	Box,
	IconButton,
	LinearProgress,
	Tooltip,
	Typography,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import {
	MdCheckCircle as CheckIcon,
	MdClose as RemoveIcon,
	MdError as ErrorIcon,
	MdOutlineSchedule as PendingIcon,
	MdRefresh as RetryIcon,
} from "react-icons/md"
import type { UploadQueueItem } from "../hooks/useFileUploadQueue"
import { formatFileSize } from "../../../utils/experimentFile"

interface FileUploadQueueListProps {
	/** Arquivos selecionados — alinhado por índice com `items`. */
	files: File[]
	/** Estado da fila (presente depois que o envio começa). */
	items?: UploadQueueItem[]
	running?: boolean
	/** Remoção individual antes do envio (omitido durante/após). */
	onRemove?: (index: number) => void
	/** Re-tentativa individual de item com erro. */
	onRetry?: (index: number) => void
}

const doneSummary = (item: UploadQueueItem): string => {
	const parts: string[] = []
	if (item.added !== undefined && item.added >= 0) {
		parts.push(
			item.added === 1
				? "1 amostra adicionada"
				: `${item.added} amostras adicionadas`,
		)
	}
	if (item.skipped && item.skipped.length > 0) {
		parts.push(`${item.skipped.length} já existia(m)`)
	}
	if (item.nameConflicts && item.nameConflicts.length > 0) {
		parts.push(`${item.nameConflicts.length} conflito(s) de nome`)
	}
	return parts.join(" · ") || "Concluído"
}

/** Lista de arquivos com nome, tamanho e progresso/status individual —
 * usada no dialog de criação e no fluxo "adicionar arquivos" (FE-43). */
export default function FileUploadQueueList({
	files,
	items,
	running = false,
	onRemove,
	onRetry,
}: FileUploadQueueListProps) {
	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
			{files.map((file, index) => {
				const item = items?.[index]
				return (
					<Box
						key={`${file.name}-${index}`}
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							minWidth: 0,
							py: 0.5,
							px: 1,
							borderRadius: 1,
							bgcolor: (theme) =>
								item?.status === "error"
									? alpha(theme.palette.error.main, 0.08)
									: theme.palette.action.hover,
						}}
					>
						{item?.status === "done" && (
							<CheckIcon size={18} color="var(--mui-palette-success-main)" />
						)}
						{item?.status === "error" && (
							<ErrorIcon size={18} color="var(--mui-palette-error-main)" />
						)}
						{item?.status === "queued" && <PendingIcon size={18} />}
						<Box sx={{ minWidth: 0, flexGrow: 1 }}>
							<Typography variant="body2" noWrap>
								{file.name}
							</Typography>
							{item?.status === "uploading" ? (
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
									}}
								>
									<LinearProgress
										variant="determinate"
										value={item.percent}
										sx={{ flexGrow: 1 }}
									/>
									<Typography variant="caption">{item.percent}%</Typography>
								</Box>
							) : item?.status === "error" ? (
								<Typography variant="caption" color="error">
									{item.error}
								</Typography>
							) : (
								<Typography variant="caption" color="text.secondary">
									{formatFileSize(file.size)}
									{item?.status === "done" && ` — ${doneSummary(item)}`}
								</Typography>
							)}
						</Box>
						{item?.status === "error" && onRetry && (
							<Tooltip title="Tentar novamente">
								<IconButton
									size="small"
									onClick={() => onRetry(index)}
									disabled={running}
								>
									<RetryIcon />
								</IconButton>
							</Tooltip>
						)}
						{!item && onRemove && (
							<IconButton
								size="small"
								onClick={() => onRemove(index)}
								disabled={running}
							>
								<RemoveIcon />
							</IconButton>
						)}
					</Box>
				)
			})}
		</Box>
	)
}
