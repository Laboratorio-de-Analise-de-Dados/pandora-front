import { Box, List, ListItem } from "@mui/material"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import { Link } from "react-router-dom"
import { useThemeMode } from "../../providers/ThemeContext"
import { IconButton, Tooltip } from "@mui/material"
import { Brightness4, Brightness7 } from "@mui/icons-material"

const Header = () => {
	const NAVLINKS = [{ id: 1, name: "Experiments", path: "/experiments" }]
	const Content = () => {
		const { mode, toggleMode } = useThemeMode()

		return (
			<Box sx={{ p: 2 }}>
				<Tooltip
					title={`Mudar para modo ${mode === "light" ? "escuro" : "claro"}`}
				>
					<IconButton onClick={toggleMode} color="inherit">
						{mode === "light" ? <Brightness4 /> : <Brightness7 />}
					</IconButton>
				</Tooltip>
			</Box>
		)
	}
	return (
		<AppBar position="static" color="secondary">
			<Toolbar>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						width: "70%",
					}}
				>
					<Link to="/">
						<Typography
							variant="h6"
							component="div"
							sx={{ color: "text", textDecoration: "none" }}
						></Typography>
					</Link>

					<List>
						{NAVLINKS.map((link) => {
							return (
								<ListItem key={link.id}>
									<Link to={link.path}>
										<Typography
											sx={{ color: "#FFFFFF", textDecoration: "none" }}
										>
											{link.name}
										</Typography>
									</Link>
								</ListItem>
							)
						})}
					</List>
					<Content />
				</Box>
			</Toolbar>
		</AppBar>
	)
}

export default Header
