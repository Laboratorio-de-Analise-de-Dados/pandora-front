import { SelectionProvider } from "./SelectionContext"
import React, { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

const Providers:React.FC<ProvidersProps> = ({children}) =>{
  return(
    <SelectionProvider>
      {children}
    </SelectionProvider>         
  )
}

export default Providers