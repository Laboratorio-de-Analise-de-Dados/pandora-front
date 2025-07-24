import { createTheme, ThemeOptions } from "@mui/material/styles"

// Cores da Pandora: preta e branca com olhos verdes
const getThemeOptions = (mode: "light" | "dark"): ThemeOptions => ({
	palette: {
		mode,
		...(mode === "light"
			? {
					background: {
						default: "#F4F4F4", // branco suave
						paper: "#FFFFFF",
					},
					primary: {
						main: "#2ECC71", // verde esmeralda (olhos)
						contrastText: "#FFFFFF",
					},
					secondary: {
						main: "#2C2C2C", // preto/cinza escuro (pelagem)
						contrastText: "#FFFFFF",
					},
					error: {
						main: "#E74C3C",
					},
					text: {
						primary: "#1A1A1A",
						secondary: "#5C5C5C",
					},
					info: {
						main: "#27AE60", // tom de verde complementar
					},
			  }
			: {
					background: {
						default: "#121212", // dark black
						paper: "#1F1F1F",
					},
					primary: {
						main: "#2ECC71",
						contrastText: "#FFFFFF",
					},
					secondary: {
						main: "#EAEAEA", // branco (invertido no dark)
						contrastText: "#121212",
					},
					error: {
						main: "#FF6B6B",
					},
					text: {
						primary: "#EEEEEE",
						secondary: "#A0A0A0",
					},
					info: {
						main: "#58D68D",
					},
			  }),
	},
	typography: {
		fontFamily: "Inter, Roboto, Helvetica Neue, sans-serif",
		fontWeightRegular: 400,
		fontWeightMedium: 600,
		fontWeightBold: 700,
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					textTransform: "none",
				},
			},
		},
	},
})

export const createAppTheme = (mode: "light" | "dark") =>
	createTheme(getThemeOptions(mode))
