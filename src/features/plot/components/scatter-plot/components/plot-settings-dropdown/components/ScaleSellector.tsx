import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography
} from "@mui/material"
import { ScaleSelectorProps } from "../types"
export const ScaleSelector: React.FC<ScaleSelectorProps> = ({
	xScale,
	yScale,
	plotMode,
	onXScaleChange,
	onYScaleChange,
}) => (
	<Box sx={{ mb: 2 }}>
		<Typography
			variant="caption"
			fontWeight="bold"
			color="text.secondary"
			sx={{ mb: 1, display: "block" }}
		>
			Escala
		</Typography>
		<FormControlLabel
			control={
				<Checkbox
					checked={xScale === "biex"}
					onChange={(e) => onXScaleChange(e.target.checked ? "biex" : "linear")}
					size="small"
				/>
			}
			label={<Typography variant="caption">X Biex</Typography>}
		/>
		{plotMode !== "histogram" && (
			<FormControlLabel
				control={
					<Checkbox
						checked={yScale === "biex"}
						onChange={(e) =>
							onYScaleChange(e.target.checked ? "biex" : "linear")
						}
						size="small"
					/>
				}
				label={<Typography variant="caption">Y Biex</Typography>}
			/>
		)}
	</Box>
)
