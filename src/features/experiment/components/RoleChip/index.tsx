import { Chip } from "@mui/material"

const ROLE_LABELS: Record<string, string> = {
	owner: "Dono",
	dono: "Dono",
	org_admin: "Admin",
	admin: "Admin",
	editor: "Editor",
	viewer: "Visualizador",
}

interface RoleChipProps {
	/** `my_role` da listagem (BE-21): slug do papel do usuário logado. */
	role: string
}

/** Chip do papel do usuário no experimento ("Dono", "Editor"...). */
export default function RoleChip({ role }: RoleChipProps) {
	const key = role.toLowerCase()
	const isOwner = key === "owner" || key === "dono"
	return (
		<Chip
			label={ROLE_LABELS[key] ?? role}
			size="small"
			variant="outlined"
			color={isOwner ? "primary" : "default"}
			sx={{
				height: 20,
				fontSize: "0.65rem",
				fontWeight: 600,
				textTransform: "uppercase",
				letterSpacing: "0.04em",
			}}
		/>
	)
}
