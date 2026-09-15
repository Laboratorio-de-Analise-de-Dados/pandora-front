import Header from "./components/header"
import Footer from "./components/footer"
import BottomNav from "./components/BottomNav"
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
					flexDirection: "column",
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
		</ThemeModeProvider>
	)
}

export default App
