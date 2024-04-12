import { Box } from "@mui/material"
import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import CytometryApi from "../../../../../../API"
import { Experiment, FileData } from "../../../../../../types"
import ScatterPlot from "../../../../../plotly"
interface Params {
  id: string;
  fid: string
}

export default function FilePage (){
  const param = useParams<Params>()
  const [experiment, setExperiment] = useState<Experiment>()
  const [fileData, setFileData] = useState<FileData>()
  const [loading, setLoading] = useState<boolean>(false)
  
  const getExperimentData = useCallback(async (id:string)=>{
    setLoading(true)
    try {
      const experiment = await CytometryApi.get(`/experiment/${id}`)
      setExperiment(experiment.data)
      
    } catch (error:any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
    try {
      const fileData = await CytometryApi.get(`/experiment/file/${param.fid}/list?x_axis=SSC-A&y_axis=FSC-A`)
      setFileData(fileData.data)
    } catch (error:any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [param.fid])

  useEffect(()=>{
      if(!fileData)getExperimentData(param.id)
      console.log('data_set: ',fileData?.data_set)
  }, [param.id, getExperimentData,fileData])

 

  return(
    <Box sx={{display:'flex', flexDirection:'column', gap:'2rem', justifyContent:'space-around', padding:'2rem', height:'80vh'}}>
      <Box>
        {fileData?.data_set && <ScatterPlot data={fileData.data_set} xAxisSelector='fsc_a' yAxisSelector='ssc_a' loading={loading} />}
      </Box>
    </Box>
  )
}