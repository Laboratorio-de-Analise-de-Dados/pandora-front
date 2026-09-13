import { Experiment } from "../../../../types"
import ExperimentCard from "../Card"
import NewExperimentCard from "../NewExperiment"
import { ExperimentContainer } from "./style"

interface ContainerProps {
	experiments: Experiment[]
}
export default function ExperimentsContainer({ experiments }: ContainerProps) {
	return (
		<ExperimentContainer>
			<NewExperimentCard />
			{experiments.map((experiment) => {
				return <ExperimentCard key={experiment.id} experiment={experiment} />
			})}
		</ExperimentContainer>
	)
}
