import { useState } from "react"
import {
	CircularProgress,
	FormControl,
	IconButton,
	InputLabel,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Select,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material"
import {
	MdAccountTree as BranchIcon,
	MdAdd as AddIcon,
	MdArchive as ArchiveIcon,
	MdCallMerge as MergeIcon,
	MdEdit as RenameIcon,
	MdMoreVert as MoreIcon,
} from "react-icons/md"
import { AppDialog } from "../../../components/AppDialog"
import { useConfirm } from "../../../components/ConfirmDialog"
import {
	useBranchActions,
	useBranchesQuery,
	sortBranches,
} from "../hooks/useBranches"
import type { AnalysisBranch } from "../../../services/branches"
import MergeDialog from "./MergeDialog"

interface BranchSelectorProps {
	experimentId: number | undefined
	/** Branch ativa (`?branch=`); `null` = main. */
	branchId: number | null
	onChange: (id: number | null) => void
	canEdit: boolean
}

type NameDialogState =
	{ mode: "create" } | { mode: "rename"; branch: AnalysisBranch } | null

/**
 * FE-29: seletor da linha de análise ativa no workspace. Trocar refaz as
 * queries da árvore/histórico com `?branch=<id>`; ações de gerenciamento
 * (nova/renomear/arquivar/mergear) ficam no menu ao lado — desabilitadas
 * na `main` e para quem não pode editar.
 */
export default function BranchSelector({
	experimentId,
	branchId,
	onChange,
	canEdit,
}: BranchSelectorProps) {
	const confirm = useConfirm()
	const { data: branches, isLoading } = useBranchesQuery(experimentId)
	const { create, rename, archive } = useBranchActions(experimentId)

	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
	const [nameDialog, setNameDialog] = useState<NameDialogState>(null)
	const [nameValue, setNameValue] = useState("")
	const [savingName, setSavingName] = useState(false)
	const [mergeOpen, setMergeOpen] = useState(false)

	const sorted = sortBranches(branches ?? [])
	const main = sorted.find((b) => b.is_main)
	const current = sorted.find((b) => b.id === branchId) ?? main ?? undefined
	const isMain = current?.is_main ?? true

	const handleSelect = (value: string) => {
		const id = Number(value)
		onChange(id === main?.id ? null : id)
	}

	const openNameDialog = (state: NonNullable<NameDialogState>) => {
		setMenuAnchor(null)
		setNameValue(state.mode === "rename" ? state.branch.name : "")
		setNameDialog(state)
	}

	const handleSaveName = async () => {
		const name = nameValue.trim()
		if (!name) return
		setSavingName(true)
		try {
			if (nameDialog?.mode === "rename") {
				if (await rename(nameDialog.branch.id, name)) setNameDialog(null)
			} else {
				const created = await create(name, current?.id ?? null)
				if (created) {
					setNameDialog(null)
					onChange(created.id)
				}
			}
		} finally {
			setSavingName(false)
		}
	}

	const handleArchive = async () => {
		setMenuAnchor(null)
		if (!current || current.is_main) return
		const ok = await confirm({
			title: `Arquivar a linha "${current.name}"?`,
			description:
				"A linha sai do seletor e deixa de receber edições. O histórico dela permanece.",
			confirmLabel: "Arquivar",
			severity: "danger",
		})
		if (ok && (await archive(current.id))) onChange(null)
	}

	if (isLoading || sorted.length === 0) return null

	return (
		<>
			<Tooltip
				title="Linhas de análise são versões independentes da árvore de gates — crie uma para testar uma proposta ou colaborar sem alterar a Principal."
				placement="bottom-start"
			>
				<FormControl size="small" sx={{ minWidth: 130 }}>
					<InputLabel id="branch-select-label">Linha de análise</InputLabel>
					<Select
						labelId="branch-select-label"
						value={String(current?.id ?? "")}
						label="Linha de análise"
						onChange={(e) => handleSelect(e.target.value)}
					>
						{sorted.map((b) => (
							<MenuItem key={b.id} value={String(b.id)}>
								<ListItemIcon sx={{ minWidth: 26 }}>
									<BranchIcon style={{ fontSize: 15 }} />
								</ListItemIcon>
								<ListItemText
									primary={b.is_main ? "Principal" : b.name}
									secondary={`${b.gates_count} gates`}
								/>
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Tooltip>
			{canEdit && (
				<Tooltip title="Gerenciar linhas de análise">
					<IconButton
						size="small"
						onClick={(e) => setMenuAnchor(e.currentTarget)}
					>
						<MoreIcon />
					</IconButton>
				</Tooltip>
			)}
			<Menu
				anchorEl={menuAnchor}
				open={menuAnchor != null}
				onClose={() => setMenuAnchor(null)}
			>
				<MenuItem onClick={() => openNameDialog({ mode: "create" })}>
					<ListItemIcon>
						<AddIcon style={{ fontSize: 18 }} />
					</ListItemIcon>
					<ListItemText>
						Nova linha a partir de "
						{current?.is_main ? "Principal" : current?.name}"
					</ListItemText>
				</MenuItem>
				<MenuItem
					disabled={isMain}
					onClick={() =>
						current && openNameDialog({ mode: "rename", branch: current })
					}
				>
					<ListItemIcon>
						<RenameIcon style={{ fontSize: 18 }} />
					</ListItemIcon>
					<ListItemText>Renomear "{current?.name}"</ListItemText>
				</MenuItem>
				<MenuItem
					disabled={isMain}
					onClick={() => {
						setMenuAnchor(null)
						setMergeOpen(true)
					}}
				>
					<ListItemIcon>
						<MergeIcon style={{ fontSize: 18 }} />
					</ListItemIcon>
					<ListItemText>Comparar e juntar na origem</ListItemText>
				</MenuItem>
				<MenuItem disabled={isMain} onClick={handleArchive}>
					<ListItemIcon>
						<ArchiveIcon style={{ fontSize: 18 }} />
					</ListItemIcon>
					<ListItemText>Arquivar "{current?.name}"</ListItemText>
				</MenuItem>
			</Menu>

			<AppDialog
				open={nameDialog != null}
				onClose={() => setNameDialog(null)}
				title={
					nameDialog?.mode === "rename"
						? `Renomear "${nameDialog.branch.name}"`
						: `Nova linha a partir de "${current?.is_main ? "Principal" : current?.name}"`
				}
				onConfirm={handleSaveName}
				confirmLabel={nameDialog?.mode === "rename" ? "Renomear" : "Criar"}
				confirmDisabled={!nameValue.trim()}
				loading={savingName}
			>
				<TextField
					label="Nome da linha"
					placeholder="ex.: revisão do orientador"
					value={nameValue}
					onChange={(e) => setNameValue(e.target.value)}
					fullWidth
					size="small"
					autoFocus
					sx={{ mt: 1 }}
					inputProps={{ maxLength: 50 }}
				/>
				{nameDialog?.mode === "create" && (
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ mt: 1, display: "block" }}
					>
						A árvore de gates atual é copiada para a nova linha — edições lá não
						alteram esta.
					</Typography>
				)}
			</AppDialog>

			{mergeOpen && current && (
				<MergeDialog
					open
					branch={current}
					experimentId={experimentId}
					onClose={() => setMergeOpen(false)}
					onMerged={() => {
						setMergeOpen(false)
						onChange(null)
					}}
				/>
			)}
		</>
	)
}
