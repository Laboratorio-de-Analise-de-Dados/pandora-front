import Header from "./components/headers"
import Footer from "./components/footer"
import CssBaseline from "@mui/material/CssBaseline"
import { ThemeModeProvider } from "./providers/ThemeContext"
import { Box } from "@mui/material"
import Routes from "./router"
import { ToastContainer } from "react-toastify"

function App() {
	return (
		<ThemeModeProvider>
			<ToastContainer />
			<CssBaseline />
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					minHeight: "100vh",
					justifyContent: "space-between",
				}}
			>
				<Header />
				<Routes />
				<Footer />
			</Box>
		</ThemeModeProvider>
	)
}

export default App
