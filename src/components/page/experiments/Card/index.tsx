import { ExperimentComponent } from "./style"
import { Experiment } from "../../../../types"
import { useHistory } from "react-router-dom"

interface ExperimentCardProps {
	experiment: Experiment
}

export default function ExperimentCard({ experiment }: ExperimentCardProps) {
	const router = useHistory()
	const redirectPage = () => {
		router.push(`/experiments/${experiment.id}`)
	}
	return (
		<ExperimentComponent onClick={redirectPage}>
			<h1>{experiment.title}</h1>
			<div>Type: {experiment.type}</div>
		</ExperimentComponent>
	)
}
