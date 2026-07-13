import {
	Box,
	Divider,
	Fade,
	IconButton,
	Paper,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material"
import React, { useState } from "react"
import {
	MdExpandMore as ExpandMoreIcon,
	MdClose as CloseIcon,
	MdSettings as SettingsIcon,
} from "react-icons/md"
import { PlotSettingsDropdownProps } from "./types"
import { ScaleSelector, AxisRangeSelector } from "./components"

export const PlotSettingsDropdown: React.FC<PlotSettingsDropdownProps> = ({
	plotMode,
	xScale,
	yScale,
	cutoff,
	xMin,
	xMax,
	yMin,
	yMax,
	onXScaleChange,
	onYScaleChange,
	onCutoffChange,
	onXMinChange,
	onXMaxChange,
	onYMinChange,
	onYMaxChange,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [isAdjusting, setIsAdjusting] = useState(false)

	return (
		<Box sx={{ position: "relative", width: "100%" }}>
			<Tooltip title={isOpen ? "Fechar configurações" : "Abrir configurações"}>
				<IconButton
					onClick={() => setIsOpen(!isOpen)}
					size="small"
					sx={{
						position: "absolute",
						top: 8,
						right: 8,
						zIndex: 10,
						backgroundColor: "rgba(255, 255, 255, 0.6)",
						backdropFilter: "blur(2px)",
						border: "1px solid",
						borderColor: "divider",
						"&:hover": {
							backgroundColor: "rgba(255, 255, 255, 0.9)",
							boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
						},
					}}
				>
					<SettingsIcon fontSize="small" />
				</IconButton>
			</Tooltip>

			<Fade in={isOpen} timeout={200}>
				<Paper
					sx={{
						position: "absolute",
						top: 50,
						left: "calc(80%)",
						zIndex: 30,
						width: 280,
						maxHeight: "30vh",
						overflowY: "auto",
						padding: 1.5,
						borderRadius: 8,
						backdropFilter: "blur(6px)",
						boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
						border: "1px solid",
						borderColor: "divider",
					}}
					style={{ opacity: isAdjusting ? 0.3 : 1 }}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mb: 2,
						}}
					>
						<Typography variant="subtitle2" fontWeight="bold">
							Configurações do Gráfico
						</Typography>
						<IconButton size="small" onClick={() => setIsOpen(false)}>
							<CloseIcon style={{ fontSize: "18px" }} />
						</IconButton>
					</Box>

					<ScaleSelector
						plotMode={plotMode}
						xScale={xScale}
						yScale={yScale}
						onXScaleChange={onXScaleChange}
						onYScaleChange={onYScaleChange}
					/>

					<Divider sx={{ my: 2 }} />

					<AxisRangeSelector
						label="Eixo X"
						scale={xScale}
						min={xMin}
						max={xMax}
						onMinChange={onXMinChange}
						onMaxChange={onXMaxChange}
						setIsAdjusting={setIsAdjusting}
					/>

					{plotMode !== "histogram" && (
						<>
							<Divider sx={{ my: 2 }} />
							<AxisRangeSelector
								label="Eixo Y"
								scale={yScale}
								min={yMin}
								max={yMax}
								onMinChange={onYMinChange}
								onMaxChange={onYMaxChange}
								setIsAdjusting={setIsAdjusting}
							/>
						</>
					)}

					{plotMode === "heatmap" && (
						<>
							<Divider sx={{ my: 2 }} />
							<Box>
								<Typography
									variant="caption"
									fontWeight="bold"
									color="text.secondary"
									sx={{ mb: 1, display: "block" }}
								>
									Densidade
								</Typography>
								<TextField
									label="Cutoff"
									type="number"
									size="small"
									value={cutoff}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										onCutoffChange(Math.max(0, Number(e.target.value) || 0))
									}
									inputProps={{ min: 0, step: 1 }}
									fullWidth
									helperText="Bins com contagem ≤ cutoff ficam transparentes"
									sx={{
										flex: 1,
										"& .MuiInputBase-input": {
											fontSize: "0.75rem",
											padding: "4px 8px",
										},
										"& .MuiInputLabel-root": { fontSize: "0.7rem" },
									}}
								/>
							</Box>
						</>
					)}
				</Paper>
			</Fade>
		</Box>
	)
}

export default PlotSettingsDropdown
