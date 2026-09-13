import { useCallback, useEffect, useState } from "react"
import {
	cancelInvite,
	fetchSentInvites,
	resendInvite,
	Invite,
} from "../services/inviteService"

interface UseSentInvitesResult {
	invites: Invite[]
	loading: boolean
	resend: (invite: Invite) => Promise<boolean>
	cancel: (invite: Invite) => Promise<void>
	refresh: () => Promise<void>
}

export const useSentInvites = (enabled: boolean): UseSentInvitesResult => {
	const [invites, setInvites] = useState<Invite[]>([])
	const [loading, setLoading] = useState(false)

	const refresh = useCallback(async () => {
		if (!enabled) return
		setLoading(true)
		try {
			const data = await fetchSentInvites()
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

	const resend = useCallback(
		async (invite: Invite) => {
			const result = await resendInvite(invite.organization.id, invite.id)
			await refresh()
			return result.email_sent
		},
		[refresh],
	)

	const cancel = useCallback(async (invite: Invite) => {
		await cancelInvite(invite.organization.id, invite.id)
		setInvites((prev) => prev.filter((i) => i.id !== invite.id))
	}, [])

	return { invites, loading, resend, cancel, refresh }
}
