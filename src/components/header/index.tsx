import { useState } from "react"
import {
	Box,
	List,
	ListItem,
	AppBar,
	Toolbar,
	Typography,
	IconButton,
	Tooltip,
	Button,
	Badge,
	Menu,
	MenuItem,
	Divider,
} from "@mui/material"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useThemeMode } from "../../providers/ThemeContext"
import { useAuth } from "../../providers/AuthContext"
import { useInvites } from "../../hooks/useInvites"
import {
	MdBrightness4,
	MdBrightness7,
	MdNotifications as NotificationsIcon,
	MdCheck as CheckIcon,
	MdClose as CloseIcon,
} from "react-icons/md"

const Header = () => {
	const { mode, toggleMode } = useThemeMode()
	const { user, logout, loading, refreshUser } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const isProfile = location.pathname === "/profile"

	const { invites, accept, decline } = useInvites(Boolean(user))
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

	const handleLogout = () => {
		logout()
		navigate("/login")
	}

	const handleAccept = async (invite: any) => {
		try {
			await accept(invite)
			refreshUser()
		} finally {
			setAnchorEl(null)
		}
	}

	const handleDecline = async (invite: any) => {
		try {
			await decline(invite)
		} finally {
			setAnchorEl(null)
		}
	}

	const NAVLINKS = [
		{ id: 1, name: "Home", path: "/" },
		{ id: 2, name: "Experiments", path: "/experiments" },
		{ id: 3, name: "Groups", path: "/organizations" },
	]

	const providerLabel =
		user?.auth_provider && user.auth_provider !== "local"
			? `(${user.auth_provider})`
			: ""

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
						<Link
							to="/"
							style={{
								textDecoration: "none",
								display: "flex",
								alignItems: "center",
								gap: 1,
							}}
						>
							<Box
								component="img"
								src="/pandora-icon.png"
								alt="Pandora"
								sx={{ height: 32, width: 32, borderRadius: "50%" }}
							/>
							<Typography variant="h6" sx={{ color: "#FFFFFF" }}>
								Pandora
							</Typography>
						</Link>

						{!loading && user && (
							<List sx={{ display: { xs: "none", md: "flex" } }}>
								{NAVLINKS.map((link) => (
									<ListItem key={link.id} sx={{ width: "auto" }}>
										<Link to={link.path} style={{ textDecoration: "none" }}>
											<Typography sx={{ color: "#FFFFFF" }}>
												{link.name}
											</Typography>
										</Link>
									</ListItem>
								))}
							</List>
						)}
					</Box>

					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: { xs: 0.5, sm: 2 },
						}}
					>
						{user && (
							<>
								<Tooltip title="Notificações">
									<IconButton
										color="inherit"
										onClick={(e) => setAnchorEl(e.currentTarget)}
									>
										<Badge badgeContent={invites.length} color="error" max={9}>
											<NotificationsIcon />
										</Badge>
									</IconButton>
								</Tooltip>
								<Menu
									anchorEl={anchorEl}
									open={Boolean(anchorEl)}
									onClose={() => setAnchorEl(null)}
									PaperProps={{
										sx: { width: { xs: "90vw", sm: 360 }, maxWidth: 360 },
									}}
								>
									{invites.length === 0 ? (
										<MenuItem disabled>Nenhum convite pendente</MenuItem>
									) : (
										invites.map((invite) => (
											<Box key={invite.id}>
												<MenuItem
													disabled={
														invite.email.toLowerCase() !==
														user.email.toLowerCase()
													}
													sx={{
														display: "flex",
														justifyContent: "space-between",
														alignItems: "flex-start",
														gap: 1,
													}}
												>
													<Box
														sx={{
															display: "flex",
															flexDirection: "column",
															flex: 1,
														}}
													>
														<Typography variant="body2">
															Convite para{" "}
															<strong>{invite.organization.name}</strong>
														</Typography>
														<Typography
															variant="caption"
															color="text.secondary"
														>
															como {invite.role.name}
														</Typography>
														{invite.email.toLowerCase() !==
															user.email.toLowerCase() && (
															<Typography
																variant="caption"
																color="error"
																display="block"
															>
																Você está logado com outro email
															</Typography>
														)}
													</Box>
													{invite.email.toLowerCase() ===
														user.email.toLowerCase() && (
														<Box sx={{ display: "flex", gap: 0.5 }}>
															<Tooltip title="Aceitar">
																<IconButton
																	size="small"
																	color="success"
																	onClick={() => handleAccept(invite)}
																>
																	<CheckIcon />
																</IconButton>
															</Tooltip>
															<Tooltip title="Recusar">
																<IconButton
																	size="small"
																	color="error"
																	onClick={() => handleDecline(invite)}
																>
																	<CloseIcon />
																</IconButton>
															</Tooltip>
														</Box>
													)}
												</MenuItem>
												<Divider />
											</Box>
										))
									)}
								</Menu>
							</>
						)}
						{user && (
							<Button
								component={Link}
								to="/profile"
								color="inherit"
								sx={{
									color: "#FFFFFF",
									textTransform: "none",
									display: { xs: "none", sm: "flex" },
								}}
								variant={isProfile ? "outlined" : "text"}
							>
								{user.username} {providerLabel}
							</Button>
						)}
						<Tooltip
							title={`Mudar para modo ${mode === "light" ? "escuro" : "claro"}`}
						>
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
