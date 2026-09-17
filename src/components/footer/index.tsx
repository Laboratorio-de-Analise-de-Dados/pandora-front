import React from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { useLocation } from "react-router-dom"

const Footer = () => {
	const location = useLocation()
	// O workspace do experimento ocupa exatamente 100dvh − header; um
	// footer embaixo criaria scroll de página e deixaria o rodapé
	// aparecer "vazando" abaixo da tela (mesma regra do BottomNav).
	if (/^\/experiments\/\d+/.test(location.pathname)) return null

	return (
		<Box
			component="footer"
			sx={{
				color: "text.secondary",
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
