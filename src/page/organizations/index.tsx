import { useEffect, useState } from "react"
import {
	Box,
	Button,
	TextField,
	Typography,
	Paper,
	List,
	ListItem,
	ListItemText,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Tabs,
	Tab,
} from "@mui/material"
import CytometryApi from "../../API"
import InviteModal from "../../components/InviteModal"

interface Member {
	id: number
	user: { id: number; username: string; email: string }
	role: { name: string }
}

interface Organization {
	id: number
	name: string
	org_type: string
	members: Member[]
}

export default function OrganizationsPage() {
	const [organizations, setOrganizations] = useState<Organization[]>([])
	const [tab, setTab] = useState(0)
	const [newOrgName, setNewOrgName] = useState("")
	const [newOrgType, setNewOrgType] = useState("lab")
	const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
	const [inviteOpen, setInviteOpen] = useState(false)

	const loadOrganizations = async () => {
		const res = await CytometryApi.get("/accounts/organizations/")
		setOrganizations(res.data)
	}

	useEffect(() => {
		loadOrganizations()
	}, [])

	const handleCreateOrg = async (e: React.FormEvent) => {
		e.preventDefault()
		await CytometryApi.post("/accounts/organizations/", {
			name: newOrgName,
			org_type: newOrgType,
		})
		setNewOrgName("")
		setTab(0)
		loadOrganizations()
	}

	const openInvite = (org: Organization) => {
		setSelectedOrg(org)
		setInviteOpen(true)
	}

	return (
		<Box sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
			<Typography variant="h4" mb={3}>
				Organizações
			</Typography>

			<Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
				<Tab label="Meus grupos" />
				<Tab label="Criar grupo" />
			</Tabs>

			<Paper sx={{ p: 3, minHeight: 360 }}>
				{tab === 0 && (
					<Box>
						{organizations.map((org) => (
							<Paper key={org.id} sx={{ p: 2, mb: 2 }}>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: { xs: "flex-start", sm: "center" },
										flexDirection: { xs: "column", sm: "row" },
										gap: 1,
									}}
								>
									<Box>
										<Typography variant="subtitle1" fontWeight={500}>
											{org.name}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{org.org_type} — {org.members?.length || 0} membros
										</Typography>
									</Box>
									<Button
										variant="outlined"
										size="small"
										onClick={() => openInvite(org)}
										sx={{ mt: { xs: 1, sm: 0 } }}
									>
										Convidar
									</Button>
								</Box>
								{org.members && org.members.length > 0 && (
									<List dense sx={{ mt: 1 }}>
										{org.members.map((m) => (
											<ListItem key={m.id} divider>
												<ListItemText
													primary={m.user.username}
													secondary={`${m.user.email} — ${m.role.name}`}
												/>
											</ListItem>
										))}
										</List>
									)}
								</Paper>
							))}
						{organizations.length === 0 && (
							<Typography color="text.secondary" mt={2}>
								Nenhuma organização encontrada.
							</Typography>
						)}
					</Box>
				)}

				{tab === 1 && (
					<Box component="form" onSubmit={handleCreateOrg} sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 500 }}>
						<TextField
							label="Nome da organização"
							value={newOrgName}
							onChange={(e) => setNewOrgName(e.target.value)}
							required
						/>
						<FormControl>
							<InputLabel>Tipo</InputLabel>
							<Select value={newOrgType} onChange={(e) => setNewOrgType(e.target.value)} label="Tipo">
								<MenuItem value="lab">Laboratório</MenuItem>
								<MenuItem value="customer">Cliente</MenuItem>
							</Select>
						</FormControl>
						<Button type="submit" variant="contained" sx={{ mt: 1 }}>
							Criar organização
						</Button>
					</Box>
				)}
			</Paper>

			<InviteModal
				open={inviteOpen}
				organizationId={selectedOrg?.id || null}
				organizationName={selectedOrg?.name}
				onClose={() => setInviteOpen(false)}
				onInvited={loadOrganizations}
			/>
		</Box>
	)
}
