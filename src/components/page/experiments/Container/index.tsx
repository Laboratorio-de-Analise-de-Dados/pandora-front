import { Experiment } from "../../../../types"
import ExperimentCard from "../Card"
import NewExperimentCard from "../NewExperiment"
import { ExperimentContainer } from "./style"

interface ContainerProps {
	experiments: Experiment[]
	onChanged?: () => void
}
export default function ExperimentsContainer({
	experiments,
	onChanged,
}: ContainerProps) {
	return (
		<ExperimentContainer>
			<NewExperimentCard />
			{experiments.map((experiment) => {
				return (
					<ExperimentCard
						key={experiment.id}
						experiment={experiment}
						onChanged={onChanged}
					/>
				)
			})}
		</ExperimentContainer>
	)
}
