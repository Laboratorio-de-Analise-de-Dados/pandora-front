import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
	Box,
	Button,
	Card,
	CardContent,
	Skeleton,
	Typography,
} from "@mui/material"
import {
	MdAdd as AddIcon,
	MdOutlineBiotech as ExperimentIcon,
	MdOutlineGroup as MembersIcon,
} from "react-icons/md"
import Layout from "../../components/Layout"
import { fetchOrganizations } from "../../services/organizationService"
import { fetchExperiments } from "../../services/experimentService"
import { fetchGroupedHistory } from "../../services/historyService"
import { formatRelativeTime } from "../../features/history/utils/datetime"
import { orgTypeLabel, pluralPt } from "../../utils/organization"
import type { Experiment } from "../../types/ExperimentTypes"

interface ContextCardProps {
	section: string
	title: string
	subtitle: string
	metrics: { icon: ReactNode; text: string }[]
	actionLabel: string
	onAction: () => void
}

function ContextCard({
	section,
	title,
	subtitle,
	metrics,
	actionLabel,
	onAction,
}: ContextCardProps) {
	return (
		<Card sx={{ display: "flex", flexDirection: "column" }}>
			<CardContent
				sx={{
					p: 3,
					flex: 1,
					display: "flex",
					flexDirection: "column",
					gap: 1,
					"&:last-child": { pb: 3 },
				}}
			>
				<Typography variant="caption" fontWeight="bold" color="text.secondary">
					{section}
				</Typography>
				<Typography variant="h6">{title}</Typography>
				<Typography variant="body2" color="text.secondary">
					{subtitle}
				</Typography>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 0.75,
						mt: "auto",
						pt: 2,
					}}
				>
					{metrics.map((m) => (
						<Box
							key={m.text}
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								color: "text.secondary",
							}}
						>
							{m.icon}
							<Typography variant="body2" color="text.secondary">
								{m.text}
							</Typography>
						</Box>
					))}
				</Box>
			</CardContent>
			<Box sx={{ p: 2, pt: 0 }}>
				<Button variant="contained" fullWidth onClick={onAction}>
					{actionLabel}
				</Button>
			</Box>
		</Card>
	)
}

export default function HomePage() {
	const navigate = useNavigate()

	const { data: organizations = [], isLoading: orgsLoading } = useQuery({
		queryKey: ["organizations"],
		queryFn: fetchOrganizations,
	})
	const { data: experiments = [], isLoading: expsLoading } = useQuery({
		queryKey: ["experiments"],
		queryFn: () => fetchExperiments(),
	})
	const loading = orgsLoading || expsLoading

	// Sem `updated_at` no serializer, o maior id é a melhor proxy do
	// experimento mais recente — o feed mostra o histórico dele.
	const latestExperiment = experiments.reduce<Experiment | null>(
		(acc, e) => (acc === null || e.id > acc.id ? e : acc),
		null,
	)
	const { data: history } = useQuery({
		queryKey: ["history", "latest", latestExperiment?.id],
		queryFn: () => fetchGroupedHistory(latestExperiment!.id),
		enabled: latestExperiment !== null,
	})
	const recentActivity = (history?.sessions ?? [])
		.flatMap((s) => s.revisions)
		.sort(
			(a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
		)
		.slice(0, 4)

	const activeCount = (orgId: number | null) =>
		experiments.filter((e) =>
			orgId === null ? !e.organization : e.organization?.id === orgId,
		).length

	return (
		<Layout>
			<Box
				sx={{
					p: { xs: 2, sm: 3, md: 4 },
					maxWidth: { xs: "100%", xl: 1400 },
					mx: "auto",
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", sm: "row" },
						alignItems: { sm: "center" },
						justifyContent: "space-between",
						gap: 2,
						mb: 3,
					}}
				>
					<Typography variant="h4">Meus laboratórios</Typography>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={() => navigate("/organizations?tab=create")}
						sx={{ whiteSpace: "nowrap", alignSelf: { sm: "center" } }}
					>
						Criar Laboratório
					</Button>
				</Box>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: {
							xs: "1fr",
							sm: "repeat(2, 1fr)",
							lg: "repeat(3, 1fr)",
						},
						gap: 3,
					}}
				>
					{loading ? (
						<>
							<Skeleton variant="rounded" height={220} />
							<Skeleton variant="rounded" height={220} />
						</>
					) : (
						<>
							<ContextCard
								section="PROJETOS PESSOAIS"
								title="Experimentos Pessoais"
								subtitle="Experimentos sem grupo"
								metrics={[
									{
										icon: <ExperimentIcon size={18} />,
										text: pluralPt(
											activeCount(null),
											"experimento ativo",
											"experimentos ativos",
										),
									},
								]}
								actionLabel="Ver experimentos"
								onAction={() => navigate("/experiments?orgId=0")}
							/>
							{organizations.map((org) => (
								<ContextCard
									key={org.id}
									section="ORGANIZAÇÕES & LABORATÓRIOS"
									title={org.name}
									subtitle={`${orgTypeLabel[org.org_type] ?? org.org_type} • ${pluralPt(org.members?.length ?? 0, "membro", "membros")}`}
									metrics={[
										{
											icon: <ExperimentIcon size={18} />,
											text: pluralPt(
												activeCount(org.id),
												"experimento ativo",
												"experimentos ativos",
											),
										},
										{
											icon: <MembersIcon size={18} />,
											text: pluralPt(
												org.members?.length ?? 0,
												"membro vinculado",
												"membros vinculados",
											),
										},
									]}
									actionLabel="Acessar workspace"
									onAction={() => navigate(`/experiments?orgId=${org.id}`)}
								/>
							))}
						</>
					)}
				</Box>

				{recentActivity.length > 0 && latestExperiment && (
					<Card sx={{ mt: 4 }}>
						<CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
							<Typography
								variant="caption"
								fontWeight="bold"
								color="text.secondary"
							>
								ATIVIDADE RECENTE — {latestExperiment.title}
							</Typography>
							<Box
								sx={{
									mt: 0.5,
									display: "flex",
									flexDirection: "column",
								}}
							>
								{recentActivity.map((rev) => (
									<Box
										key={rev.id}
										onClick={() =>
											navigate(`/experiments/${latestExperiment.id}`)
										}
										sx={{
											display: "flex",
											alignItems: "baseline",
											gap: 1.5,
											py: 1.25,
											borderBottom: "1px solid",
											borderColor: "divider",
											cursor: "pointer",
											"&:last-child": { borderBottom: "none" },
											"&:hover": {
												"& .activity-text": {
													color: "primary.main",
												},
											},
										}}
									>
										<Box
											sx={{
												width: 7,
												height: 7,
												borderRadius: "50%",
												bgcolor: "primary.main",
												flexShrink: 0,
												alignSelf: "center",
											}}
										/>
										<Typography
											className="activity-text"
											variant="body2"
											sx={{ flex: 1, transition: "color 150ms ease" }}
										>
											{rev.author ?? "Alguém"} {rev.summary}
										</Typography>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ whiteSpace: "nowrap" }}
										>
											{formatRelativeTime(rev.created_at)}
										</Typography>
									</Box>
								))}
							</Box>
						</CardContent>
					</Card>
				)}
			</Box>
		</Layout>
	)
}
