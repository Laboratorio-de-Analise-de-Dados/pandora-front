import React from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

const Footer = () => {
	return (
		<Box
			component="footer"
			color="secondary"
			sx={{
				py: 2,
				mt: "auto",
				textAlign: "center",
			}}
		>
			<Typography variant="body2">
				Desenvolvido pelo Datalab - Instituto Carlos Chagas, Fiocruz Paraná
			</Typography>
		</Box>
	)
}

export default Footer
