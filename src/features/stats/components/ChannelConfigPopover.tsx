import React, { useState } from "react"
import {
	Box,
	Checkbox,
	Chip,
	FormControlLabel,
	Popover,
	TextField,
	Typography,
} from "@mui/material"

type MetricColumn = "mean_mfi" | "median_mfi" | "std_dev" | "cv"

interface MetricDef {
	key: MetricColumn
	label: string
}

interface ChannelConfigPopoverProps {
	anchorEl: HTMLElement | null
	onClose: () => void
	allChannels: string[]
	selectedChannels: Set<string> | null
	visibleMetrics: Set<MetricColumn>
	metricColumns: MetricDef[]
	channelLabel: (ch: string) => string
	onToggleChannel: (ch: string) => void
	onToggleMetric: (m: MetricColumn) => void
	onSelectAll: () => void
	onSelectFluorescence: () => void
	onClearAll: () => void
}

const ChannelConfigPopover: React.FC<ChannelConfigPopoverProps> = ({
	anchorEl,
	onClose,
	allChannels,
	selectedChannels,
	visibleMetrics,
	metricColumns,
	channelLabel,
	onToggleChannel,
	onToggleMetric,
	onSelectAll,
	onSelectFluorescence,
	onClearAll,
}) => {
	const [search, setSearch] = useState("")

	const handleClose = () => {
		setSearch("")
		onClose()
	}

	return (
		<Popover
			open={Boolean(anchorEl)}
			anchorEl={anchorEl}
			onClose={handleClose}
			anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
			slotProps={{ paper: { sx: { width: 280, maxHeight: 420, p: 1.5 } } }}
		>
			<Typography
				variant="caption"
				fontWeight="bold"
				sx={{ mb: 0.5, display: "block" }}
			>
				Parâmetros
			</Typography>
			<TextField
				size="small"
				placeholder="Buscar canal..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				sx={{
					mb: 0.5,
					"& .MuiInputBase-input": { fontSize: "0.75rem", py: 0.5 },
				}}
				fullWidth
				autoFocus
			/>
			<Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
				<Chip
					label="Todos"
					size="small"
					variant="outlined"
					onClick={onSelectAll}
					sx={{ fontSize: "0.6rem", height: 20 }}
				/>
				<Chip
					label="Fluoresc."
					size="small"
					variant="outlined"
					onClick={onSelectFluorescence}
					sx={{ fontSize: "0.6rem", height: 20 }}
				/>
				<Chip
					label="Limpar"
					size="small"
					variant="outlined"
					onClick={onClearAll}
					sx={{ fontSize: "0.6rem", height: 20 }}
				/>
			</Box>
			<Box sx={{ maxHeight: 220, overflow: "auto" }}>
				{allChannels
					.filter((ch) => {
						if (!search.trim()) return true
						const q = search.toLowerCase()
						return (
							ch.toLowerCase().includes(q) ||
							channelLabel(ch).toLowerCase().includes(q)
						)
					})
					.map((ch) => (
						<FormControlLabel
							key={ch}
							control={
								<Checkbox
									size="small"
									checked={selectedChannels?.has(ch) ?? true}
									onChange={() => onToggleChannel(ch)}
									sx={{ p: 0.25 }}
								/>
							}
							label={
								<Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
									{channelLabel(ch)}
								</Typography>
							}
							sx={{ display: "block", m: 0, height: 26 }}
						/>
					))}
			</Box>
			<Box
				sx={{
					borderTop: "1px solid",
					borderColor: "divider",
					pt: 0.5,
					mt: 0.5,
				}}
			>
				<Typography
					variant="caption"
					fontWeight="bold"
					sx={{ mb: 0.25, display: "block" }}
				>
					Colunas
				</Typography>
				{metricColumns.map((m) => (
					<FormControlLabel
						key={m.key}
						control={
							<Checkbox
								size="small"
								checked={visibleMetrics.has(m.key)}
								onChange={() => onToggleMetric(m.key)}
								sx={{ p: 0.25 }}
							/>
						}
						label={
							<Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
								{m.label}
							</Typography>
						}
						sx={{ display: "block", m: 0, height: 26 }}
					/>
				))}
			</Box>
		</Popover>
	)
}

export default ChannelConfigPopover
