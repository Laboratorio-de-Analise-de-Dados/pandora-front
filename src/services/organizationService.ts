import CytometryApi from "../API"

export type RoleName = "org_admin" | "member"

export interface Member {
	id: number
	user: { id: number; username: string; email: string }
	role: { id?: number; name: string }
	status?: string
}

export interface Organization {
	id: number
	name: string
	org_type: string
	members: Member[]
}

export const fetchOrganizations = async (): Promise<Organization[]> => {
	const res = await CytometryApi.get("/accounts/organizations/")
	return res.data
}

export const createOrganization = async (name: string, orgType: string): Promise<Organization> => {
	const res = await CytometryApi.post("/accounts/organizations/", {
		name,
		org_type: orgType,
	})
	return res.data
}

export const updateMemberRole = async (
	organizationId: number,
	membershipId: number,
	role: RoleName,
): Promise<Member> => {
	const res = await CytometryApi.patch(
		`/accounts/organizations/${organizationId}/memberships/${membershipId}/`,
		{ role },
	)
	return res.data
}

export const removeMember = async (organizationId: number, membershipId: number): Promise<void> => {
	await CytometryApi.delete(
		`/accounts/organizations/${organizationId}/memberships/${membershipId}/`,
	)
}
