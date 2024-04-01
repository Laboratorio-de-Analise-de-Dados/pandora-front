// import { useEffect, useState } from "react";
import { Box } from '@mui/material';
import fcsData from '../../assets/FCS-1707477508554.json';
import ScatterPlot from "../../components/plotly";
export type EventData ={ 
  id:number
  value:number
}

export default function HomePage(){
   

    const data = fcsData.values.map(data=>({id: data.id, x: data.fsc_a, y:data.ssc_a}))
    return (
      <Box sx={{ flex: 1, padding: '1rem' }}>
        <Box sx={{padding:'1rem'}}>
          <ScatterPlot data={data} maxItems={10000} chunkSize={1000} xAxisSelector='fsc_a' yAxisSelector='ssc_a' />
        </Box>
      </Box>
    )
}
