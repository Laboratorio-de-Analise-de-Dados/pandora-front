import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Card, CardContent, Typography } from "@mui/material"
import Layout from "../../components/Layout"
import CytometryApi from "../../API"

interface Organization {
	id: number
	name: string
	org_type: string
}

export default function HomePage() {
	const navigate = useNavigate()
	const [organizations, setOrganizations] = useState<Organization[]>([])

	useEffect(() => {
		CytometryApi.get("/accounts/organizations/")
			.then((res) => setOrganizations(res.data))
			.catch(() => setOrganizations([]))
	}, [])

	const personalLab = { id: 0, name: "Meus experimentos pessoais", org_type: "pessoal" }
	const labs = [personalLab, ...organizations]

	return (
		<Layout>
			<Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
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
