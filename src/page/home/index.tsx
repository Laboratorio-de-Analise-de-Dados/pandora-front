import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Card, CardContent, Typography, Alert } from "@mui/material"
import Layout from "../../components/Layout"
import CytometryApi from "../../API"

interface Organization {
	id: number
	name: string
	org_type: string
}

interface Invite {
	id: number
	token: string
	email: string
	organization: { id: number; name: string }
	role: { name: string }
}

export default function HomePage() {
	const navigate = useNavigate()
	const [organizations, setOrganizations] = useState<Organization[]>([])
	const [pendingInvites, setPendingInvites] = useState<Invite[]>([])
	const [accepted, setAccepted] = useState<Record<string, string>>({})

	const loadData = () => {
		CytometryApi.get("/accounts/organizations/")
			.then((res) => setOrganizations(res.data))
			.catch(() => setOrganizations([]))

		CytometryApi.get("/accounts/invites/pending/")
			.then((res) => setPendingInvites(res.data))
			.catch(() => setPendingInvites([]))
	}

	useEffect(() => {
		loadData()
	}, [])

	const handleAccept = async (invite: Invite) => {
		try {
			await CytometryApi.post(`/accounts/invites/accept/${invite.token}/`, {})
			setAccepted((prev) => ({ ...prev, [invite.token]: "accepted" }))
			loadData()
		} catch (err: any) {
			const msg = err.response?.data?.detail || err.response?.data?.email || "Erro ao aceitar convite."
			setAccepted((prev) => ({ ...prev, [invite.token]: msg }))
		}
	}

	const personalLab = { id: 0, name: "Meus experimentos pessoais", org_type: "pessoal" }
	const labs = [personalLab, ...organizations]

	return (
		<Layout>
			<Box sx={{ p: 4 }}>
				{pendingInvites.length > 0 && (
					<Box mb={4}>
						<Typography variant="h5" mb={2}>
							Convites pendentes
						</Typography>
						<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
							{pendingInvites.map((invite) => (
								<Alert
									key={invite.id}
									severity={accepted[invite.token] === "accepted" ? "success" : "info"}
									action={
										accepted[invite.token] ? undefined : (
											<Button
												color="inherit"
												size="small"
												onClick={() => handleAccept(invite)}
											>
												Aceitar
											</Button>
										)
									}
								>
									{accepted[invite.token] === "accepted" ? (
										"Convite aceito!"
									) : accepted[invite.token] ? (
										accepted[invite.token]
									) : (
										<>
											Você foi convidado para <strong>{invite.organization.name}</strong> como{" "}
											<strong>{invite.role.name}</strong>.
										</>
									)}
								</Alert>
							))}
						</Box>
					</Box>
				)}

				<Typography variant="h4" mb={3}>
					Meus laboratórios
				</Typography>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
						gap: 3,
					}}
				>
					{labs.map((lab) => (
						<Card key={lab.id} sx={{ display: "flex", flexDirection: "column" }}>
							<CardContent sx={{ flex: 1 }}>
								<Typography variant="h6" gutterBottom>
									{lab.name}
								</Typography>
								<Typography variant="body2" color="text.secondary" mb={2}>
									{lab.org_type === "pessoal" ? "Experimentos sem grupo" : lab.org_type}
								</Typography>
							</CardContent>
							<Box sx={{ p: 2, pt: 0 }}>
								<Button
									variant="contained"
									fullWidth
									onClick={() => navigate(`/experiments?orgId=${lab.id}`)}
								>
									Ver experimentos
								</Button>
							</Box>
						</Card>
					))}
				</Box>
			</Box>
		</Layout>
	)
}
