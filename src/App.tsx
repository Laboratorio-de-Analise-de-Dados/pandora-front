
import HomePage from './page/home';
import Header from './components/headers'
import Footer from './components/footer';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './globalStyle';
import { Box } from '@mui/material';
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header/>
        <HomePage/>
        <Footer/>
      </Box>
    </ThemeProvider>
  );
}

export default App;
