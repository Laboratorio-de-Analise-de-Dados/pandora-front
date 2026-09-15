import { createTheme, ThemeOptions } from "@mui/material/styles"

// Identidade visual Pandora (FE-26): dark-first verde/preto/branco.
// A paleta do gato (preto/branco/olhos verdes) vira: canvas quase preto,
// surfaces cinza-escuras separadas por elevação, verde emerald como marca.
const PANDORA = {
	primary: "#10B981", // Verde Pandora (emerald)
	primaryHover: "#059669",
	accent: "#34D399", // Verde neon — seleção, gate ativo, highlights
	canvas: "#0D0D0D",
	surface: "#161616",
	surfaceAlt: "#1A1A1A",
	divider: "#262626",
	textPrimary: "#FFFFFF",
	textSecondary: "#A1A1AA",
	textDisabled: "#52525B",
	warning: "#FBBF24",
	error: "#F87171",
} as const

const getThemeOptions = (mode: "light" | "dark"): ThemeOptions => ({
	palette: {
		mode,
		...(mode === "light"
			? {
					background: {
						default: "#F4F4F4",
						paper: "#FFFFFF",
					},
					primary: {
						main: PANDORA.primary,
						dark: PANDORA.primaryHover,
						contrastText: "#FFFFFF",
					},
					secondary: {
						main: "#2C2C2C",
						contrastText: "#FFFFFF",
					},
					error: {
						main: "#DC2626",
					},
					warning: {
						main: "#D97706",
					},
					text: {
						primary: "#1A1A1A",
						secondary: "#5C5C5C",
					},
					info: {
						main: PANDORA.primaryHover,
					},
					divider: "#E4E4E7",
				}
			: {
					background: {
						default: PANDORA.canvas,
						paper: PANDORA.surface,
					},
					primary: {
						main: PANDORA.primary,
						dark: PANDORA.primaryHover,
						contrastText: "#FFFFFF",
					},
					secondary: {
						// Barra superior/rodapé: canvas escuro, não cinza claro.
						main: PANDORA.canvas,
						contrastText: PANDORA.textPrimary,
					},
					error: {
						main: PANDORA.error,
					},
					warning: {
						main: PANDORA.warning,
					},
					text: {
						primary: PANDORA.textPrimary,
						secondary: PANDORA.textSecondary,
						disabled: PANDORA.textDisabled,
					},
					info: {
						main: PANDORA.accent,
					},
					divider: PANDORA.divider,
				}),
	},
	shape: {
		borderRadius: 12,
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
					borderRadius: 10,
					textTransform: "none",
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: ({ theme }) => ({
					borderRadius: 16,
					backgroundImage: "none",
					// Borda sutil nos dois modos: no light é o que separa o card do
					// fundo; no dark complementa a elevação.
					border: `1px solid ${theme.palette.divider}`,
					transition: "box-shadow 180ms ease, border-color 180ms ease",
					"&:hover": {
						borderColor: "rgba(16, 185, 129, 0.45)",
						boxShadow:
							theme.palette.mode === "dark"
								? "0 8px 24px rgba(0, 0, 0, 0.45)"
								: "0 8px 24px rgba(0, 0, 0, 0.10)",
					},
					...(theme.palette.mode === "dark" && {
						backgroundColor: PANDORA.surface,
					}),
				}),
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundImage: "none",
				},
			},
		},
		MuiDialog: {
			styleOverrides: {
				paper: ({ theme }) => ({
					borderRadius: 16,
					border: `1px solid ${theme.palette.divider}`,
					...(theme.palette.mode === "dark" && {
						backgroundColor: PANDORA.surface,
					}),
				}),
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					borderRadius: 999,
					fontWeight: 600,
				},
			},
		},
		MuiTab: {
			styleOverrides: {
				root: {
					textTransform: "none",
				},
			},
		},
		MuiTooltip: {
			styleOverrides: {
				tooltip: ({ theme }) => ({
					borderRadius: 8,
					...(theme.palette.mode === "dark" && {
						backgroundColor: PANDORA.surfaceAlt,
						border: `1px solid ${PANDORA.divider}`,
						color: PANDORA.textPrimary,
					}),
				}),
			},
		},
		MuiDrawer: {
			styleOverrides: {
				paper: ({ theme }) => ({
					...(theme.palette.mode === "dark" && {
						backgroundColor: PANDORA.surface,
					}),
				}),
			},
		},
	},
})

export const createAppTheme = (mode: "light" | "dark") =>
	createTheme(getThemeOptions(mode))
