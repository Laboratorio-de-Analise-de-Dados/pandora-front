import type { Theme } from "@mui/material/styles"

declare module "styled-components" {
	interface DefaultTheme extends Theme {}
}
