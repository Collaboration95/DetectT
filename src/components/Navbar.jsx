import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { Link as RouterLink } from "react-router-dom";

const Navbar = () => {

  const generateTimestampLink = () => {
    const sessionid = Math.floor(Date.now() / 1000); // Generate UNIX timestamp
    return `/shopifyRedirect/${sessionid}`;
  };
  return (
    <AppBar
      position="static"
      color="default"
      elevation={1}
      sx={{
        width: "fit-content",
        margin: "20px auto", // Center the AppBar
        borderRadius: "10px", // Set the desired border radius
        height: "fit-content", // Set the height to fit its content
      }}
    >
      <Toolbar>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button component={RouterLink} to="/" color="inherit">
            Home
          </Button>
          <Button component={RouterLink} to="/prototype" color="inherit">
            Prototype
          </Button>
          <Button component={RouterLink} to={generateTimestampLink()} color="inherit">
            TriggerWorkflow
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
