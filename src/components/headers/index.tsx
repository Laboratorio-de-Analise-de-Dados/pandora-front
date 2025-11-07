import { Box, List, ListItem } from "@mui/material"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import { Link } from "react-router-dom"
import { useThemeMode } from "../../providers/ThemeContext"
import { Button } from "@mui/material"

const Header = () => {
	const NAVLINKS = [{ id: 1, name: "Experiments", path: "/experiments" }]
	const Content = () => {
		const { mode, toggleMode } = useThemeMode()

		return (
			<Box sx={{ p: 2 }}>
				<Button variant="contained" onClick={toggleMode}>
					Mudar para {mode === "light" ? "dark" : "light"} mode
				</Button>
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
