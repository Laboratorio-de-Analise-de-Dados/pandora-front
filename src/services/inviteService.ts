import CytometryApi from "../API"

export interface Invite {
	id: number
	token: string
	email: string
	organization: { id: number; name: string }
	role: { name: string }
}

export const fetchPendingInvites = async (): Promise<Invite[]> => {
	const res = await CytometryApi.get("/accounts/invites/pending/")
	return res.data
}

export const acceptInvite = async (token: string): Promise<void> => {
	await CytometryApi.post(`/accounts/invites/accept/${token}/`, {})
}

export const declineInvite = async (token: string): Promise<void> => {
	await CytometryApi.post(`/accounts/invites/decline/${token}/`, {})
}
