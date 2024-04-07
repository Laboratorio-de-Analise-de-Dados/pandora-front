import { Box } from "@mui/material";
import { ReactNode } from "react";

interface LayoutPropsInterface {
  children:ReactNode
}

export default function Layout({children}:LayoutPropsInterface){
  return(
    <Box sx={{ flex: 1, padding: '1rem' }}>
      {children}
    </Box>
  )


}