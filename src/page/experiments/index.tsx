import {
	Box,
	Typography,
	Button,
	Checkbox,
	FormControl,
	FormControlLabel,
	InputAdornment,
	InputLabel,
	MenuItem,
	Select,
	TextField,
} from "@mui/material"
import { MdAdd as AddIcon, MdSearch as SearchIcon } from "react-icons/md"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import Layout from "../../components/Layout"
import { useExperimentsContext } from "../../providers/ExperimentContext"
import { useAuth } from "../../providers/AuthContext"
import ExperimentsContainer from "./Container"
import { filterExperiments } from "./filterExperiments"
import NewExperimentDialog from "../../features/experiment/components/NewExperimentDialog"

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
	const [search, setSearch] = useState("")
	const [newOpen, setNewOpen] = useState(false)
	const orgIdParam = searchParams.get("orgId")
	const orgId = orgIdParam ? parseInt(orgIdParam, 10) : null

	useEffect(() => {
		listExperiments(showInactive)
	}, [listExperiments, showInactive])

	const filteredExperiments = useMemo(
		() => filterExperiments(experiments, orgId, search),
		[experiments, orgId, search],
	)

	const org = user?.memberships?.find(
		(m) => m.organization.id === orgId,
	)?.organization
	const title =
		orgId === 0
			? "Meus experimentos pessoais"
			: org
				? `Experimentos — ${org.name}`
				: "Experimentos"

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
							sx={{ minWidth: { xs: "100%", sm: 220 } }}
							size="small"
						>
							<InputLabel>Laboratório</InputLabel>
							<Select
								value={orgId === null ? "" : String(orgId)}
								onChange={(e) => handleOrgChange(e.target.value)}
								label="Laboratório"
							>
								<MenuItem value="">Todos os Laboratórios</MenuItem>
								{orgOptions.map((o) => (
									<MenuItem key={o.id} value={o.id}>
										{o.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<Button
							variant="contained"
							size="small"
							startIcon={<AddIcon />}
							onClick={() => setNewOpen(true)}
							sx={{ whiteSpace: "nowrap" }}
						>
							Novo Experimento
						</Button>
					</Box>
				</Box>

				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", sm: "row" },
						alignItems: { sm: "center" },
						justifyContent: "space-between",
						gap: 2,
						mb: 2,
					}}
				>
					<TextField
						size="small"
						label="Buscar"
						placeholder="por nome do experimento…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						sx={{ flex: 1, maxWidth: { sm: 420 } }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon />
								</InputAdornment>
							),
						}}
					/>
					<FormControlLabel
						control={
							<Checkbox
								size="small"
								checked={showInactive}
								onChange={(e) => setShowInactive(e.target.checked)}
							/>
						}
						label={
							<Typography variant="body2" color="text.secondary">
								Mostrar inativados
							</Typography>
						}
					/>
				</Box>

				<Box>
					<ExperimentsContainer
						experiments={filteredExperiments}
						onChanged={() => listExperiments(showInactive)}
					/>
				</Box>
			</Box>
			<NewExperimentDialog open={newOpen} onClose={() => setNewOpen(false)} />
		</Layout>
	)
}
