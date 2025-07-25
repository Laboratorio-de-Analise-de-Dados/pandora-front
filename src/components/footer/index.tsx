import React from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

const Footer = () => {
	return (
		<Box
			component="footer"
			color="secondary"
			sx={{
				display: "flex",
				alignItems: "center",
				textAlign: "center",
				justifyContent: "center",
				padding: "1rem",
			}}
		>
			<Typography variant="body2">
				Desenvolvido pelo Datalab - Instituto Carlos Chagas, Fiocruz Paraná
			</Typography>
		</Box>
	)
}

export default Footer
