import CytometryApi from "../API"

export interface Invite {
	id: number
	token: string
	email: string
	organization: { id: number; name: string }
	role: { id?: number; name: string }
	status?: string
	created_at?: string
	expires_at?: string
}

export const fetchInvite = async (token: string): Promise<Invite> => {
	const res = await CytometryApi.get(`/accounts/invites/${token}/`)
	return res.data
}

export const createInvite = async (
	organizationId: number,
	email: string,
	role: string,
): Promise<{ email_sent: boolean }> => {
	const res = await CytometryApi.post(
		`/accounts/organizations/${organizationId}/invites/`,
		{ email, role },
	)
	return res.data
}

export const fetchPendingInvites = async (): Promise<Invite[]> => {
	const res = await CytometryApi.get("/accounts/invites/pending/")
	return res.data
}

export const fetchOrganizationPendingInvites = async (
	organizationId: number,
	status = "pending",
): Promise<Invite[]> => {
	const res = await CytometryApi.get(
		`/accounts/organizations/${organizationId}/invites/`,
		{
			params: { status },
		},
	)
	return res.data
}

export const fetchSentInvites = async (): Promise<Invite[]> => {
	const res = await CytometryApi.get("/accounts/users/me/invites/sent/")
	return res.data
}

export const acceptInvite = async (token: string): Promise<void> => {
	await CytometryApi.post(`/accounts/invites/accept/${token}/`, {})
}

export const declineInvite = async (token: string): Promise<void> => {
	await CytometryApi.post(`/accounts/invites/decline/${token}/`, {})
}

export const resendInvite = async (
	organizationId: number,
	inviteId: number,
): Promise<{ email_sent: boolean }> => {
	const res = await CytometryApi.post(
		`/accounts/organizations/${organizationId}/invites/${inviteId}/resend/`,
	)
	return res.data
}

export const cancelInvite = async (
	organizationId: number,
	inviteId: number,
): Promise<void> => {
	await CytometryApi.delete(
		`/accounts/organizations/${organizationId}/invites/${inviteId}/`,
	)
}
