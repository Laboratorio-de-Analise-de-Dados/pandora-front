import { Box, Typography } from "@mui/material"
import { useEffect } from "react"
import Layout from "../../components/Layout"
import { useExperimentsContext } from "../../providers/ExperimentContext"
import ExperimentsContainer from "../../components/page/experiments/Container"

export type EventData = {
	id: number
	value: number
}

export default function ExperimentsPage() {
	const { experiments, listExperiments } = useExperimentsContext()
	useEffect(() => {
		listExperiments()
	}, [listExperiments])

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
				<Typography sx={{ fontSize: "2rem", fontWeight: "bold" }}>
					Experiments:
				</Typography>

				<Box>
					<Typography sx={{ fontSize: "1.5rem" }}>
						Chose one experiment:
					</Typography>
					<Box>
						<ExperimentsContainer experiments={experiments} />
					</Box>
				</Box>
			</Box>
		</Layout>
	)
}
