// import { useEffect, useState } from "react";
import { Box, Button, IconButton, Typography } from '@mui/material';
import fcsData from '../../assets/FCS-1707477508554.json';
// import ScatterPlot from "../../components/plotly";
import Layout from '../../components/Layout';
import { Add } from '@mui/icons-material';
export type EventData ={ 
  id:number
  value:number
}

export default function HomePage(){
   

    const data = fcsData.values.map(data=>({id: data.id, x: data.fsc_a, y:data.ssc_a}))
    return (
      <Layout>
          <Typography sx={{fontSize:'2rem', fontWeight:'bold'}}>
              Welcome to CitoSharp!
          </Typography>


          <Box>
            <Typography sx={{fontSize:'1.5rem'}}>
              Please make your choice:
            </Typography>
            <Box>
              <IconButton><Add/></IconButton>
              <IconButton></IconButton>
            </Box>
          </Box>

          {/* <ScatterPlot data={data} maxItems={10000} chunkSize={1000} xAxisSelector='fsc_a' yAxisSelector='ssc_a' /> */}
      
      </Layout>
    )
}
