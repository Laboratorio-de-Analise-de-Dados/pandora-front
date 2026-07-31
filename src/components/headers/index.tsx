import { Box, List, ListItem, AppBar, Toolbar, Typography, IconButton, Tooltip, Button } from "@mui/material"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useThemeMode } from "../../providers/ThemeContext"
import { useAuth } from "../../providers/AuthContext"
import { MdBrightness4, MdBrightness7 } from "react-icons/md"

const Header = () => {
	const { mode, toggleMode } = useThemeMode()
	const { user, logout } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const isProfile = location.pathname === "/profile"

	const handleLogout = () => {
		logout()
		navigate("/login")
	}

	const NAVLINKS = [
		{ id: 1, name: "Home", path: "/" },
		{ id: 2, name: "Groups", path: "/organizations" },
	]

	const providerLabel = user?.auth_provider && user.auth_provider !== "local" ? `(${user.auth_provider})` : ""

	return (
		<AppBar position="static" color="secondary">
			<Toolbar>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						width: "100%",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						<Link to="/" style={{ textDecoration: "none" }}>
							<Typography variant="h6" sx={{ color: "#FFFFFF" }}>
								Pandora
							</Typography>
						</Link>

						<List sx={{ display: "flex" }}>
							{NAVLINKS.map((link) => (
								<ListItem key={link.id} sx={{ width: "auto" }}>
									<Link to={link.path} style={{ textDecoration: "none" }}>
										<Typography sx={{ color: "#FFFFFF" }}>{link.name}</Typography>
									</Link>
								</ListItem>
							))}
						</List>
					</Box>

					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						{user && (
							<Button
								component={Link}
								to="/profile"
								color="inherit"
								sx={{ color: "#FFFFFF", textTransform: "none" }}
								variant={isProfile ? "outlined" : "text"}
							>
								{user.username} {providerLabel}
							</Button>
						)}
						<Tooltip title={`Mudar para modo ${mode === "light" ? "escuro" : "claro"}`}>
							<IconButton onClick={toggleMode} color="inherit">
								{mode === "light" ? <MdBrightness4 /> : <MdBrightness7 />}
							</IconButton>
						</Tooltip>
						{user && (
							<Button color="inherit" onClick={handleLogout}>
								Sair
							</Button>
						)}
					</Box>
				</Box>
			</Toolbar>
		</AppBar>
	)
}

export default Header
