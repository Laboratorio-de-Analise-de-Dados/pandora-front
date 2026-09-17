import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material"
import { useLocation, useNavigate } from "react-router-dom"
import {
	MdHome as HomeIcon,
	MdBiotech as ExperimentsIcon,
	MdGroups as OrgsIcon,
	MdPerson as ProfileIcon,
} from "react-icons/md"
import { useAuth } from "../../providers/AuthContext"

const ITEMS = [
	{ label: "Home", path: "/", icon: <HomeIcon /> },
	{ label: "Experimentos", path: "/experiments", icon: <ExperimentsIcon /> },
	{ label: "Grupos", path: "/organizations", icon: <OrgsIcon /> },
	{ label: "Perfil", path: "/profile", icon: <ProfileIcon /> },
]

/**
 * Navegação principal no mobile (FE-26): barra fixa no rodapé, só em `xs`
 * e para usuário logado. Escondida no workspace do experimento — lá os
 * painéis laterais e o sheet de stats já ocupam as bordas.
 */
export default function BottomNav() {
	const { user } = useAuth()
	const location = useLocation()
	const navigate = useNavigate()

	// Workspace do experimento tem navegação própria (árvore/plot/stats).
	const inWorkspace = /^\/experiments\/\d+/.test(location.pathname)
	if (!user || inWorkspace) return null

	const current = ITEMS.findIndex((item) =>
		item.path === "/"
			? location.pathname === "/"
			: location.pathname.startsWith(item.path),
	)

	return (
		<Paper
			sx={{
				position: "fixed",
				bottom: 0,
				left: 0,
				right: 0,
				zIndex: 30,
				display: { xs: "block", md: "none" },
				borderTop: "1px solid",
				borderColor: "divider",
				pb: "env(safe-area-inset-bottom)",
			}}
			elevation={8}
		>
			<BottomNavigation
				value={current === -1 ? false : current}
				onChange={(_, index: number) => navigate(ITEMS[index].path)}
				sx={{ bgcolor: "background.paper" }}
			>
				{ITEMS.map((item) => (
					<BottomNavigationAction
						key={item.path}
						label={item.label}
						icon={item.icon}
						sx={{ minWidth: 0 }}
					/>
				))}
			</BottomNavigation>
		</Paper>
	)
}
