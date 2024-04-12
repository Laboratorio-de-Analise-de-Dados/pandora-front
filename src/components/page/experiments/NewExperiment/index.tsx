import { Box, Tooltip } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';


export default function NewExperimentCard(){
  return(
    <Tooltip title='New Experiment'>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '10rem',
        border: '0.2rem dotted #001f36',
        padding: '1rem',
        borderRadius: '15px',
        hover:{
          color: '#79ae92',
          borderColor: '#79ae92',
          cursor:'pointer'
        }
      }}>
        <AddIcon/>
      </Box>

    </Tooltip>
  )
}