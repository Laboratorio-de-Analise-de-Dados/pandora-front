import React, { createContext, useContext, useEffect, useState } from "react"
import CytometryApi from "../../API"

export interface Membership {
	id: number
	organization: { id: number; name: string }
	role: string
}

export interface AuthUser {
	id: number
	username: string
	email: string
	is_super_admin: boolean
	auth_provider: string
	memberships: Membership[]
}

interface AuthContextProps {
	user: AuthUser | null
	loading: boolean
	isAuthenticated: boolean
	login: (username: string, password: string) => Promise<void>
	logout: () => void
	storeToken: (access: string, refresh: string, userData: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export const useAuth = () => {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
	return ctx
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [loading, setLoading] = useState(true)

	const loadUser = async () => {
		const token = localStorage.getItem("access_token")
		if (!token) {
			setLoading(false)
			return
		}
		try {
			const res = await CytometryApi.get("/accounts/users/me/")
			setUser(res.data)
		} catch {
			localStorage.removeItem("access_token")
			localStorage.removeItem("refresh_token")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadUser()
	}, [])

	const login = async (username: string, password: string) => {
		const res = await CytometryApi.post("/accounts/login/", { username, password })
		localStorage.setItem("access_token", res.data.access)
		localStorage.setItem("refresh_token", res.data.refresh)
		setUser(res.data as AuthUser)
	}

	const storeToken = (access: string, refresh: string, userData: Partial<AuthUser>) => {
		localStorage.setItem("access_token", access)
		localStorage.setItem("refresh_token", refresh)
		setUser(userData as AuthUser)
	}

	const logout = () => {
		localStorage.removeItem("access_token")
		localStorage.removeItem("refresh_token")
		setUser(null)
	}

	return (
		<AuthContext.Provider value={{ user, loading, isAuthenticated: Boolean(user), login, logout, storeToken }}>
			{children}
		</AuthContext.Provider>
	)
}
