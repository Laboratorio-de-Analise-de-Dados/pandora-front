import React, { createContext, useContext, FC, ReactNode, useState, useEffect } from 'react';
import CytometryApi from '../../API';

interface ExperimentContextProps {
  experiments: any[];
  ListExperiments: () => void
}

const ExperimentContext = createContext<ExperimentContextProps | undefined>(undefined);

export const useExperimentsContext = (): ExperimentContextProps => {
  const context = useContext(ExperimentContext);
  if (!context) {
    throw new Error('useExperimentsContext must be used within a SelectionProvider');
  }
  return context;
};

interface ExperimentProviderProps {
  children: ReactNode;
}

export const ExperimentProvider: FC<ExperimentProviderProps> = ({ children }) => {
  const [experiments, setExperiments] = useState<any[]>([]);

  async function ListExperiments () {
    const experiments = await CytometryApi.get('/experiment/list')
    setExperiments([...experiments.data])
  }

  useEffect(()=>{
    ListExperiments()
  },[])


  return (
    <ExperimentContext.Provider value={{ experiments, ListExperiments }}>
      {children}
    </ExperimentContext.Provider>
  );
};
