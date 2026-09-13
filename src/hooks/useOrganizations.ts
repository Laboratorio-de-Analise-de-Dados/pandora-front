import { useCallback, useEffect, useState } from "react"
import {
	createOrganization,
	fetchOrganizations,
	removeMember,
	updateMemberRole,
	Organization,
	RoleName,
} from "../services/organizationService"

interface UseOrganizationsResult {
	organizations: Organization[]
	loading: boolean
	refresh: () => Promise<void>
	create: (name: string, orgType: string) => Promise<void>
	changeRole: (
		organizationId: number,
		membershipId: number,
		role: RoleName,
	) => Promise<void>
	remove: (organizationId: number, membershipId: number) => Promise<void>
}

export const useOrganizations = (): UseOrganizationsResult => {
	const [organizations, setOrganizations] = useState<Organization[]>([])
	const [loading, setLoading] = useState(true)

	const refresh = useCallback(async () => {
		setLoading(true)
		try {
			setOrganizations(await fetchOrganizations())
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		refresh()
	}, [refresh])

	const create = useCallback(
		async (name: string, orgType: string) => {
			await createOrganization(name, orgType)
			await refresh()
		},
		[refresh],
	)

	const changeRole = useCallback(
		async (organizationId: number, membershipId: number, role: RoleName) => {
			await updateMemberRole(organizationId, membershipId, role)
			await refresh()
		},
		[refresh],
	)

	const remove = useCallback(
		async (organizationId: number, membershipId: number) => {
			await removeMember(organizationId, membershipId)
			await refresh()
		},
		[refresh],
	)

	return { organizations, loading, refresh, create, changeRole, remove }
}
