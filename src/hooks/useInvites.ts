import { useEffect, useState, useCallback } from "react"
import { fetchPendingInvites, acceptInvite, declineInvite, Invite } from "../services/inviteService"

interface UseInvitesResult {
	invites: Invite[]
	loading: boolean
	accept: (invite: Invite) => Promise<void>
	decline: (invite: Invite) => Promise<void>
	refresh: () => Promise<void>
}

export const useInvites = (enabled: boolean): UseInvitesResult => {
	const [invites, setInvites] = useState<Invite[]>([])
	const [loading, setLoading] = useState(false)

	const refresh = useCallback(async () => {
		if (!enabled) return
		setLoading(true)
		try {
			const data = await fetchPendingInvites()
			setInvites(data)
		} catch {
			setInvites([])
		} finally {
			setLoading(false)
		}
	}, [enabled])

	useEffect(() => {
		refresh()
	}, [refresh])

	const accept = useCallback(async (invite: Invite) => {
		await acceptInvite(invite.token)
		setInvites((prev) => prev.filter((i) => i.id !== invite.id))
	}, [])

	const decline = useCallback(async (invite: Invite) => {
		await declineInvite(invite.token)
		setInvites((prev) => prev.filter((i) => i.id !== invite.id))
	}, [])

	return { invites, loading, accept, decline, refresh }
}
