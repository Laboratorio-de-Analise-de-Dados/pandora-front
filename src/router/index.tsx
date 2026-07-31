import { Route, Routes } from "react-router-dom"
import HomePage from "../page/home"
import ExperimentsPage from "../page/experiments"
import ExperimentPage from "../components/page/experiment/[id]"
import ProfilePage from "../page/profile"
import LoginPage from "../page/login"
import RegisterPage from "../page/register"
import ForgotPasswordPage from "../page/forgot-password"
import ResetPasswordPage from "../page/reset-password"
import AuthCallbackPage from "../page/auth-callback"
import InvitePage from "../page/invite"
import OrganizationsPage from "../page/organizations"
import { ProtectedRoute } from "../components/ProtectedRoute"

const AppRoutes = () => {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route path="/forgot-password" element={<ForgotPasswordPage />} />
			<Route path="/reset-password" element={<ResetPasswordPage />} />
			<Route path="/auth/callback" element={<AuthCallbackPage />} />
			<Route path="/invite/:token" element={<InvitePage />} />
			<Route
				path="/"
				element={
					<ProtectedRoute>
						<HomePage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/experiments"
				element={
					<ProtectedRoute>
						<ExperimentsPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/experiments/:id"
				element={
					<ProtectedRoute>
						<ExperimentPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/organizations"
				element={
					<ProtectedRoute>
						<OrganizationsPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/profile"
				element={
					<ProtectedRoute>
						<ProfilePage />
					</ProtectedRoute>
				}
			/>
		</Routes>
	)
}

export default AppRoutes
