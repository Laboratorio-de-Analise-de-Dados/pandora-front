import React, { createContext, useContext, useEffect, useState } from "react"
import CytometryApi from "../../API"
import { Organization } from "../../types"

export interface Membership {
	id: number
	organization: Organization
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

interface CachedUser {
	user: AuthUser
	cachedAt: number
}

interface AuthContextProps {
	user: AuthUser | null
	loading: boolean
	isAuthenticated: boolean
	login: (username: string, password: string) => Promise<void>
	logout: () => void
	storeToken: (
		access: string,
		refresh: string,
		userData: Partial<AuthUser>,
	) => void
	refreshUser: () => Promise<void>
}

const CACHE_KEY = "pandora_user"
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export const useAuth = () => {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
	return ctx
}

const getCachedUser = (): AuthUser | null => {
	try {
		const raw = localStorage.getItem(CACHE_KEY)
		if (!raw) return null
		const parsed: CachedUser = JSON.parse(raw)
		if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
			localStorage.removeItem(CACHE_KEY)
			return null
		}
		return parsed.user
	} catch {
		localStorage.removeItem(CACHE_KEY)
		return null
	}
}

const setCachedUser = (user: AuthUser | null) => {
	if (!user) {
		localStorage.removeItem(CACHE_KEY)
		return
	}
	localStorage.setItem(
		CACHE_KEY,
		JSON.stringify({ user, cachedAt: Date.now() }),
	)
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<AuthUser | null>(getCachedUser)
	const [loading, setLoading] = useState(true)

	const refreshUser = async () => {
		const token = localStorage.getItem("access_token")
		if (!token) {
			setUser(null)
			setLoading(false)
			return
		}
		try {
			const res = await CytometryApi.get("/accounts/users/me/")
			setUser(res.data)
			setCachedUser(res.data)
		} catch {
			localStorage.removeItem("access_token")
			localStorage.removeItem("refresh_token")
			setUser(null)
			setCachedUser(null)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user) {
			// carrega do cache imediatamente, depois atualiza em background
			setLoading(false)
			refreshUser()
		} else {
			refreshUser()
		}
	}, [])

	const login = async (username: string, password: string) => {
		const res = await CytometryApi.post("/accounts/login/", {
			username,
			password,
		})
		localStorage.setItem("access_token", res.data.access)
		localStorage.setItem("refresh_token", res.data.refresh)
		const userData = res.data as AuthUser
		setUser(userData)
		setCachedUser(userData)
	}

	const storeToken = (
		access: string,
		refresh: string,
		userData: Partial<AuthUser>,
	) => {
		localStorage.setItem("access_token", access)
		localStorage.setItem("refresh_token", refresh)
		const full = userData as AuthUser
		setUser(full)
		setCachedUser(full)
	}

	const logout = () => {
		localStorage.removeItem("access_token")
		localStorage.removeItem("refresh_token")
		setCachedUser(null)
		setUser(null)
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				isAuthenticated: Boolean(user),
				login,
				logout,
				storeToken,
				refreshUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}
