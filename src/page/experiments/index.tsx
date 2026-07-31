import { Box, Typography, Button } from "@mui/material"
import { useEffect, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import Layout from "../../components/Layout"
import { useExperimentsContext } from "../../providers/ExperimentContext"
import { useAuth } from "../../providers/AuthContext"
import ExperimentsContainer from "../../components/page/experiments/Container"

export type EventData = {
	id: number
	value: number
}

export default function ExperimentsPage() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const { user } = useAuth()
	const { experiments, listExperiments } = useExperimentsContext()
	const orgIdParam = searchParams.get("orgId")
	const orgId = orgIdParam ? parseInt(orgIdParam, 10) : null

	useEffect(() => {
		listExperiments()
	}, [listExperiments])

	const filteredExperiments = useMemo(() => {
		if (orgId === null) return experiments
		if (orgId === 0) return experiments.filter((e) => !e.organization)
		return experiments.filter((e) => e.organization?.id === orgId)
	}, [experiments, orgId])

	const org = user?.memberships?.find((m) => m.organization.id === orgId)?.organization
	const title = orgId === 0 ? "Meus experimentos pessoais" : org ? `Experiments — ${org.name}` : "Experiments"

	return (
		<Layout>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					padding: "1rem",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
					<Typography sx={{ fontSize: "2rem", fontWeight: "bold" }}>
						{title}
					</Typography>
					<Button variant="outlined" onClick={() => navigate("/")}>
						Voltar para home
					</Button>
				</Box>

				<Box>
					<Typography sx={{ fontSize: "1.5rem" }}>
						Chose one experiment:
					</Typography>
					<Box>
						<ExperimentsContainer experiments={filteredExperiments} />
					</Box>
				</Box>
			</Box>
		</Layout>
	)
}
