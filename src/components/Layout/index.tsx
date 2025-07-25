import { Box } from "@mui/material"
import { ReactNode } from "react"

interface LayoutPropsInterface {
	children: ReactNode
}

export default function Layout({ children }: LayoutPropsInterface) {
	return (
		<Box
			sx={{
				display: "flex",
				flex: 1,
			}}
		>
			{children}
		</Box>
	)
}
