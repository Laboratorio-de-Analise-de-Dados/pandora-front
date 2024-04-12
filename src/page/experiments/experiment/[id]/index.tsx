import { useHistory, useParams } from "react-router-dom"
import CytometryApi from "../../../../API"
import { useCallback, useEffect, useState } from "react"
import { Experiment, ExperimentFiles } from "../../../../types"
import { toast } from "react-toastify"
import { DataGrid, GridCallbackDetails, GridColDef, GridEventListener, GridRowParams, MuiEvent  } from "@mui/x-data-grid"
import { Box, Typography } from "@mui/material"
interface Params {
  id: string;
}

export default function ExperimentPage (){
  const param = useParams<Params>()
  const [experiment, setExperiment] = useState<Experiment>()
  const [experimentFiles, setExperimentFiles] = useState<ExperimentFiles[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const router = useHistory()
  const getExperimentData = useCallback(async (id:string)=>{
    setLoading(true)
    try {
      const experiment = await CytometryApi.get(`/experiment/${id}`)
      setExperiment(experiment.data)
      
    } catch (error:any) {
      toast.error(error.message, {position:'bottom-right'} )
    } finally {
      setLoading(false)
    }
    try {
      const experimentFiles = await CytometryApi.get(`/experiment/list/data/${id}`)
      setExperimentFiles(experimentFiles.data)
    } catch (error:any) {
      toast.error(error.message, {position:'bottom-right'} )
    } finally {
      setLoading(false)
    }
  }, [])

  const columns: GridColDef[] = [
    {field:'id', headerName:'id'},
    {field:'file_name', headerName: 'file name', width:500}
  ]

  useEffect(()=>{
      getExperimentData(param.id)
  }, [param.id, getExperimentData])

  const handleRowClick: GridEventListener<'rowClick'> = (
    params:GridRowParams, 
    event: MuiEvent, 
    details: GridCallbackDetails
  ) => {
    router.push(`/experiment/${param.id}/file/${params.row.id}`)
    console.log(`File "${params.row.id}" clicked`);
  };



  return(
    <Box sx={{display:'flex', flexDirection:'column', gap:'2rem', justifyContent:'space-around', padding:'2rem', height:'80vh'}}>
      <Box>
        <Typography>{experiment?.title}</Typography>
      </Box>
      <Box sx={{ height:'70%'}}>
        <DataGrid columns={columns} rows={experimentFiles} loading={loading} onRowClick={handleRowClick} ></DataGrid>
      </Box>
    </Box>
  )
}