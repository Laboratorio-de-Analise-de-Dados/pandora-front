// ThemeContext.tsx
import React, { createContext, useMemo, useState, useContext } from "react"
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles"
import { ThemeProvider as StyledProvider } from "styled-components"
import { CssBaseline } from "@mui/material"
import { createAppTheme } from "../../globalStyle"

type ThemeMode = "light" | "dark"

interface ThemeContextProps {
	mode: ThemeMode
	toggleMode: () => void
}

const ThemeModeContext = createContext<ThemeContextProps | undefined>(undefined)

export const useThemeMode = () => {
	const ctx = useContext(ThemeModeContext)
	if (!ctx) throw new Error("useThemeMode must be used inside ThemeProvider")
	return ctx
}

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [mode, setMode] = useState<ThemeMode>("light")

	const toggleMode = () => {
		setMode((prev) => (prev === "light" ? "dark" : "light"))
	}

	const theme = useMemo(() => createAppTheme(mode), [mode])

	return (
		<ThemeModeContext.Provider value={{ mode, toggleMode }}>
			<MuiThemeProvider theme={theme}>
				<StyledProvider theme={theme}>
					<CssBaseline />
					{children}
				</StyledProvider>
			</MuiThemeProvider>
		</ThemeModeContext.Provider>
	)
}
