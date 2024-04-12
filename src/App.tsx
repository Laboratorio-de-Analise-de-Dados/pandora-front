

import Header from './components/headers'
import Footer from './components/footer';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './globalStyle';
import { Box } from '@mui/material';
import Routes from "./router";
import {ToastContainer} from 'react-toastify'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ToastContainer
        
      />
      <CssBaseline/>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header/>
        <Routes/>
        <Footer/>
      </Box>
    </ThemeProvider>
  );
}

export default App;
