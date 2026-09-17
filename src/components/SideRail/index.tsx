import { Box, IconButton, Tooltip } from "@mui/material"
import { useLocation, useNavigate } from "react-router-dom"
import {
	MdHome as HomeIcon,
	MdBiotech as ExperimentsIcon,
	MdGroups as OrgsIcon,
	MdPerson as ProfileIcon,
} from "react-icons/md"
import { useAuth } from "../../providers/AuthContext"

const ITEMS = [
	{ label: "Home", path: "/", icon: <HomeIcon size={20} /> },
	{
		label: "Experimentos",
		path: "/experiments",
		icon: <ExperimentsIcon size={20} />,
	},
	{ label: "Grupos", path: "/organizations", icon: <OrgsIcon size={20} /> },
	{ label: "Perfil", path: "/profile", icon: <ProfileIcon size={20} /> },
]

/**
 * Rail de navegação vertical (FE-26): coluna fina de ícones na borda
 * esquerda, só no desktop — no mobile a navegação é a bottom nav.
 * Item ativo ganha o indicador verde à esquerda, como no mockup.
 */
export default function SideRail() {
	const { user } = useAuth()
	const location = useLocation()
	const navigate = useNavigate()

	if (!user) return null

	const isActive = (path: string) =>
		path === "/"
			? location.pathname === "/"
			: location.pathname.startsWith(path)

	return (
		<Box
			component="nav"
			sx={(theme) => ({
				display: { xs: "none", md: "flex" },
				flexDirection: "column",
				alignItems: "center",
				gap: 0.5,
				width: 56,
				flexShrink: 0,
				position: "sticky",
				top: 0,
				height: "100vh",
				py: 1.5,
				bgcolor:
					theme.palette.mode === "dark"
						? theme.palette.background.default
						: theme.palette.background.paper,
				borderRight: `1px solid ${theme.palette.divider}`,
				zIndex: 30,
			})}
		>
			{ITEMS.map((item) => {
				const active = isActive(item.path)
				return (
					<Tooltip key={item.path} title={item.label} placement="right">
						<Box
							sx={(theme) => ({
								position: "relative",
								display: "flex",
								borderRadius: 2,
								"&:hover": { bgcolor: theme.palette.action.hover },
								// Indicador verde do item ativo (FE-26).
								"&::before": active
									? {
											content: '""',
											position: "absolute",
											left: -8,
											top: 6,
											bottom: 6,
											width: 3,
											borderRadius: 2,
											bgcolor: theme.palette.primary.main,
										}
									: undefined,
							})}
						>
							<IconButton
								onClick={() => navigate(item.path)}
								sx={{
									color: active ? "primary.main" : "text.secondary",
								}}
							>
								{item.icon}
							</IconButton>
						</Box>
					</Tooltip>
				)
			})}
		</Box>
	)
}
