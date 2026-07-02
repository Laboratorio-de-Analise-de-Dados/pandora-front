import { ExperimentComponent } from "./style"
import { Experiment } from "../../../../types"
import { useNavigate } from "react-router-dom"

interface ExperimentCardProps {
	experiment: Experiment
}

export default function ExperimentCard({ experiment }: ExperimentCardProps) {
	const navigate = useNavigate()
	const redirectPage = () => {
		navigate(`/experiments/${experiment.id}`)
	}
	return (
		<ExperimentComponent onClick={redirectPage}>
			<h1>{experiment.title}</h1>
			<div>Type: {experiment.type}</div>
		</ExperimentComponent>
	)
}
