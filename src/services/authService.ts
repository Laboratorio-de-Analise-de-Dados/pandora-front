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

export type SocialProvider = "google" | "microsoft"

export interface SocialAccount {
	id: number
	provider: SocialProvider
	email: string
	linked_at: string
}

export const fetchSocialAccounts = async (): Promise<SocialAccount[]> => {
	const res = await CytometryApi.get("/accounts/users/me/social-accounts/")
	return res.data
}

export const startProviderLink = async (
	provider: SocialProvider,
): Promise<string> => {
	const res = await CytometryApi.get(`/accounts/auth/${provider}/link/`)
	return res.data.authorize_url
}

export interface UnlinkPayload {
	email?: string
	password?: string
	request_password_reset?: boolean
}

export const unlinkSocialAccount = async (
	id: number,
	payload: UnlinkPayload = {},
): Promise<void> => {
	await CytometryApi.post(`/accounts/social-accounts/${id}/unlink/`, payload)
}

export interface ConfirmLinkResponse extends LoginResponse {
	user_id: number
	username: string
	email: string
}

export const confirmProviderLink = async (
	provider: SocialProvider,
	token: string,
): Promise<ConfirmLinkResponse> => {
	const res = await CytometryApi.post(
		`/accounts/auth/${provider}/confirm-link/`,
		{ token },
	)
	return res.data
}

export const confirmMerge = async (token: string): Promise<void> => {
	await CytometryApi.post("/accounts/merge/confirm/", { token })
}
