import {
	Box,
	Typography,
	Button,
	FormControl,
	FormControlLabel,
	InputLabel,
	MenuItem,
	Select,
	Switch,
} from "@mui/material"
import { useEffect, useMemo, useState } from "react"
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
	const [showInactive, setShowInactive] = useState(false)
	const orgIdParam = searchParams.get("orgId")
	const orgId = orgIdParam ? parseInt(orgIdParam, 10) : null

	useEffect(() => {
		listExperiments(showInactive)
	}, [listExperiments, showInactive])

	const filteredExperiments = useMemo(() => {
		if (orgId === null) return experiments
		if (orgId === 0) return experiments.filter((e) => !e.organization)
		return experiments.filter(
			(e) => e.organization && e.organization.id === orgId,
		)
	}, [experiments, orgId])

	const org = user?.memberships?.find(
		(m) => m.organization.id === orgId,
	)?.organization
	const title =
		orgId === 0
			? "Meus experimentos pessoais"
			: org
				? `Experiments — ${org.name}`
				: "Experiments"

	const handleOrgChange = (value: string) => {
		const params = new URLSearchParams(searchParams)
		if (value === "") {
			params.delete("orgId")
		} else {
			params.set("orgId", value)
		}
		navigate(
			{ pathname: "/experiments", search: params.toString() },
			{ replace: true },
		)
	}

	const orgOptions = [
		{ id: "0", name: "Pessoal (sem lab)" },
		...(user?.memberships?.map((m) => ({
			id: String(m.organization.id),
			name: m.organization.name,
		})) || []),
	]

	return (
		<Layout>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					padding: { xs: "1rem", sm: "1.5rem", md: "2rem" },
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", md: "row" },
						alignItems: { xs: "stretch", md: "center" },
						justifyContent: "space-between",
						gap: { xs: 2, md: 2 },
						mb: { xs: 2, md: 3 },
					}}
				>
					<Typography
						sx={{ fontSize: { xs: "1.5rem", md: "2rem" }, fontWeight: "bold" }}
					>
						{title}
					</Typography>
					<Box
						sx={{
							display: "flex",
							flexDirection: { xs: "column", sm: "row" },
							alignItems: { sm: "center" },
							gap: 2,
						}}
					>
						<FormControl
							sx={{ minWidth: { xs: "100%", sm: 220 }, flex: 1 }}
							size="small"
						>
							<InputLabel id="org-select-label">Ver experimentos de</InputLabel>
							<Select
								labelId="org-select-label"
								value={orgId === null ? "" : String(orgId)}
								label="Ver experimentos de"
								onChange={(e) => handleOrgChange(e.target.value)}
							>
								<MenuItem value="">
									<em>Todos</em>
								</MenuItem>
								{orgOptions.map((o) => (
									<MenuItem key={o.id} value={o.id}>
										{o.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={showInactive}
									onChange={(e) => setShowInactive(e.target.checked)}
								/>
							}
							label="Mostrar desativados"
							sx={{ whiteSpace: "nowrap" }}
						/>
						<Button
							variant="outlined"
							size="small"
							onClick={() => navigate("/")}
							sx={{ whiteSpace: "nowrap" }}
						>
							Voltar para home
						</Button>
					</Box>
				</Box>

				<Box>
					<Typography sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" }, mb: 1 }}>
						Escolha um experimento:
					</Typography>
					<Box>
						<ExperimentsContainer
							experiments={filteredExperiments}
							onChanged={() => listExperiments(showInactive)}
						/>
					</Box>
				</Box>
			</Box>
		</Layout>
	)
}
