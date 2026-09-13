import CytometryApi from "../API"

export interface AuthProvidersConfig {
	google: boolean
	microsoft: boolean
}

export interface LoginResponse {
	access: string
	refresh: string
	[key: string]: unknown
}

export const loginUser = async (
	username: string,
	password: string,
): Promise<LoginResponse> => {
	const res = await CytometryApi.post("/accounts/login/", {
		username,
		password,
	})
	return res.data
}

export const fetchCurrentUser = async <T = unknown>(): Promise<T> => {
	const res = await CytometryApi.get("/accounts/users/me/")
	return res.data
}

export interface RegisterPayload {
	username: string
	email: string
	password: string
	invite_token?: string
}

export const registerUser = async (payload: RegisterPayload): Promise<void> => {
	await CytometryApi.post("/accounts/register/", payload)
}

export const requestPasswordReset = async (email: string): Promise<void> => {
	await CytometryApi.post("/accounts/password-reset/", { email })
}

export const confirmPasswordReset = async (
	token: string,
	newPassword: string,
): Promise<void> => {
	await CytometryApi.post("/accounts/password-reset/confirm/", {
		token,
		new_password: newPassword,
	})
}

export const fetchAuthProviders = async (): Promise<AuthProvidersConfig> => {
	const res = await CytometryApi.get("/accounts/auth/providers/")
	return res.data
}
