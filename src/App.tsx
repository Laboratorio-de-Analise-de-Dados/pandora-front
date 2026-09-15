import Header from "./components/header"
import Footer from "./components/footer"
import BottomNav from "./components/BottomNav"
import SideRail from "./components/SideRail"
import CssBaseline from "@mui/material/CssBaseline"
import { ThemeModeProvider } from "./providers/ThemeContext"
import { Box } from "@mui/material"
import AppRoutes from "./router"
import { ToastContainer } from "react-toastify"

function App() {
	return (
		<ThemeModeProvider>
			<ToastContainer position="bottom-right" />
			<CssBaseline />
			<Box
				sx={{
					display: "flex",
					// FE-26: rail de ícones à esquerda no desktop; no mobile a
					// coluna é única e a navegação é a bottom nav.
					flexDirection: { xs: "column", md: "row" },
					minHeight: "100vh",
				}}
			>
				<SideRail />
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						minWidth: 0,
						minHeight: "100vh",
						justifyContent: "space-between",
						// Respiro para a bottom nav fixa no mobile (FE-26).
						pb: { xs: 8, md: 0 },
					}}
				>
					<Header />
					<AppRoutes />
					<Footer />
					<BottomNav />
				</Box>
			</Box>
		</ThemeModeProvider>
	)
}

export default App
