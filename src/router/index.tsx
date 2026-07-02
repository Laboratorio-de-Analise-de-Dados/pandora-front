import { Route, Routes } from "react-router-dom"
import HomePage from "../page/home"
import ExperimentsPage from "../page/experiments"
import ExperimentPage from "../components/page/experiment/[id]"

const AppRoutes = () => {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/experiments" element={<ExperimentsPage />} />
			<Route path="/experiments/:id" element={<ExperimentPage />} />
		</Routes>
	)
}

export default AppRoutes
