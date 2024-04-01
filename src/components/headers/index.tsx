import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const Header = () => {
  return (
    <AppBar position="static" style={{ backgroundColor: '#001f36' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#fbffcd' }}>
          Citosharp
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
