import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { List, ListItem, Box } from '@mui/material';
import { Link } from 'react-router-dom'

const Header = () => {
  const NAVLINKS = [
    {id:1, name:'Experiments', path:'/experiments'}
  ]

  return (
    <AppBar position="static" style={{ backgroundColor: '#001f36' }}>
      <Toolbar>
        <Box sx={{display:'flex', justifyContent:'space-around', gap:'2rem', alignItems:'center'}}>
          <Link to='/'>
            <Typography variant="h6" component="div" sx={{  color: '#fbffcd', textDecoration:'none' }}>
              Citosharp
            </Typography>
          </Link>

          <List>
            {NAVLINKS.map((link)=>{
              return(
                <ListItem key={link.id}>
                  <Link to={link.path}>
                    <Typography sx={{ color:'#fbffcd', textDecoration:'none'}}>
                      {link.name}
                    </Typography>
                  </Link>
                </ListItem>
              )
            })}
          </List>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
