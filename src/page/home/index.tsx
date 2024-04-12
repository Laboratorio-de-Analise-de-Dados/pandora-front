// import { useEffect, useState } from "react";
import { Typography } from '@mui/material';
// import ScatterPlot from "../../components/plotly";
import Layout from '../../components/Layout';
export type EventData ={ 
  id:number
  value:number
}

export default function HomePage(){
  

  return (
    <Layout>
        <Typography sx={{fontSize:'2rem', fontWeight:'bold'}}>
            Welcome to CitoSharp!
        </Typography>    
    </Layout>
  )
}
