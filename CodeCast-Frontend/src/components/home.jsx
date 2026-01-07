import React, { useState } from "react";
import { Box, Typography, IconButton, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, InputAdornment, Fade } from "@mui/material";

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; 
import Visibility from '@mui/icons-material/Visibility';       
import VisibilityOff from '@mui/icons-material/VisibilityOff'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import socket from "../api/socket.js"
import logo from "../assets/logo.svg"
import useApi from "../hooks/useApi.js";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  const [openPopup, setOpenPopup] = useState(false);
  const [openPop, setOpenPop] = useState(false);
  const [roomUrl, setRoomUrl] = useState("");
  const [cc_pin, setcc_pin] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  
  const [copySuccess, setCopySuccess] = useState(false);

  const api = useApi();

  const handleOpenCreate = () => {
    setcc_pin(""); 
    setPassword("");
    setRoomUrl("");
    setShowPassword(false);
    setCopySuccess(false);
    generateRoomUrl(); 
    setOpenPopup(true);
  };

  const handleOpenJoin = () => {
    setcc_pin(""); 
    setPassword("");
    setShowPassword(false);
    setOpenPop(true);
  };

  const generateRoomUrl = () => {
    const roomId = Math.random().toString(36).slice(2, 10);
    setcc_pin(roomId) // Generate unique room ID
    const url = `${window.location.origin}/room/${roomId}`; // Construct the full URL
    setRoomUrl(url);
  };

  const handleCopyDetails = () => {
    // 1. Define the professional message
    const message = `Join my CodeCast Room for a live collaborative coding session!

Room Details:
CC Pin: ${cc_pin}
Password: ${password || "(No password set)"}
Link: ${roomUrl}

Click the link to join and collaborate in real time.`;

    navigator.clipboard.writeText(message);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const joinroom = () => {

    if (!socket) {
      console.log("socket is not connected");
      return;
    }
    if (!cc_pin) {
      console.log("cc_pin does not exists");
      return;
    }
    if (!password) {
      console.log("Password is not set");
      return;
    }

    api
      .post('/room/addUserToRoom', { cc_pin, password })
      .then((res) => {
        console.log(res);
        if (res.status == 200 || res.status == 201) {
          setPassword("");
          setcc_pin("")
          console.log("Room credentials coorect, the user can navigate")
          const url = `${window.location.origin}/room/${cc_pin}`; // Construct the full URL
          setRoomUrl(url);
          // localStorage.setItem("creater", false)

          setOpenPopup(false);
          if (url) {
            // console.log("hiii")
            window.open(url, "_blank");
          }
        }
      })
      .catch((error) => {
        console.log(error)

      })
  }

  const createroom = () => {
    console.log(socket)
    if (!socket) {
      console.log("socket is not connected");
      return;
    }
    if (!cc_pin) {
      console.log("cc_pin does not exists");
      return;
    }
    if (!password) {
      console.log("Password is not set");
      return;
    }
    // We save the pin in a temporary variable before sending the request. 
    // This ensures that even if the state clears instantly, our URL generation uses the correct ID.
    const currentPin = cc_pin;

    api.post('/room/create-room', {
      cc_pin, password
    }).then((res) => {
      console.log(res);
      if (res.status == 200 || res.status == 201) {
        const confirmedPin = res.data.data.cc_pin
  
        console.log("Room successfully created, the user can navigate");
        const url = `${window.location.origin}/room/${currentPin}`;

        setPassword("");
        setcc_pin("");
        setRoomUrl(url);
        setOpenPopup(false);
        localStorage.setItem("creater", true)

        if (url) {
          console.log("hiii")
          // window.open(url, "_blank");
          navigate(`/room/${confirmedPin}`);
        }

      }
    })
      .catch((error) => {
        console.log(error);
      });
  }

  const darkInputStyle = {
    "& .MuiInputBase-input": {
      color: "white",
      paddingLeft: "15px",
      fontSize: "1.1rem",
      "&.Mui-disabled": {
        WebkitTextFillColor: "white", 
        color: "white",
        opacity: 1
      }
     },
    "& .MuiInputLabel-root": { color: "#aaa"},
    "& .MuiInputLabel-root.Mui-focused": { color: "#d500f9" }, // Purple focus
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "#444" },
      "&:hover fieldset": { borderColor: "white" },
      "&.Mui-focused fieldset": { borderColor: "#d500f9" }, // Purple border
      backgroundColor: "rgba(255, 255, 255, 0.05)", // Slight background for input box
      height: "40px",
      width: "400px"
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#121212", // Standard Dark Mode background
        color: "white",
        overflow: "hidden", //Prevent scrolling
        margin: 0,
        padding: 0
      }}
    >
      {/* --- HEADER SECTION --- */}
      <Box
        sx={{
          flexShrink: 0,
          height: "65px",
          background: "#1e1e1e", // Slightly lighter for contrast
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between", // Pushes items to edges
          padding: "0 20px", // Breathing room
          boxSizing: "border-box", // Prevents scrollbars from padding
          borderBottom: "1px solid #191919ff"
        }}
      >
        <img src={logo} alt="CodeCast" style={{ height: 45 }} />

        {/* Right side icons */}
        <Box>
           <IconButton sx={{ color: "white", marginRight: 1 }}>
             <SettingsIcon sx={{ fontSize: 32 }} />
           </IconButton>
           <IconButton sx={{ color: "white" }}>
             <AccountCircleIcon sx={{ fontSize: 32 }} />
           </IconButton>
        </Box>
      </Box>

      {/* --- MAIN CONTENT --- */}
      <Box 
        sx={{ 
          flex: 1,            // Takes up all remaining space
          overflowY: "auto",  // Allows scrolling only in this area
          p: 4,               // Padding around content
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start", // Aligns button to Left
          gap: 5,              // Gap between Button and Grid
          paddingLeft: "32px"
        }}
      >
        {/* JOIN BUTTON */}
        <Button
          onClick={handleOpenJoin}
          variant="contained"
          sx={{
            background: "linear-gradient(45deg, #A50EB2 70%)", 
            borderRadius: "50px",
            padding: "12px 40px",
            fontWeight: "bold",
            textTransform: "none",
            fontSize: "1.2rem",
            boxShadow: "0 4px 15px rgba(213, 0, 249, 0.4)"
          }}
        >
          Join Room
        </Button>

        {/* --- ROOMS GRID CONTAINER --- */}
        {/* This container will hold Create Room + All Future Rooms in a row */}
        <Box 
          sx={{
            display: "flex",
            flexWrap: "wrap", 
            gap: 4,           // Space between cards
            width: "100%"
          }}
        >
            {/* DASHED CREATE CARD */}
            <Box
              onClick={handleOpenCreate}
              sx={{
                width: "200px",      
                height: "200px",     
                border: "3px dashed #3a3a3a",
                borderRadius: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: "transparent",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "#ce93d8",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  transform: "translateY(-5px)" 
                }
              }}
            >
              <AddIcon sx={{ fontSize: 50, color: "white", mb: 1 }} />
              <Typography variant="h6" color="gray">Create Room</Typography>
            </Box>
        </Box>
      </Box>

      {/* --- CREATE ROOM MODAL --- */}
      <Dialog 
        open={openPopup} 
        onClose={() => setOpenPopup(false)}
        slotProps={{
          paper: {
            sx: { 
              backgroundColor: "#222", 
              color: "white", 
              width: "450px", 
              border: "1px solid #444", 
              borderRadius: "12px" 
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.2rem", paddingBottom: 0 }}>CREATE NEW ROOM</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          
          {/* 1. CC PIN INPUT */}
          <Typography variant="body2" sx={{ color: "#aaa", mb: 0.5, mt: 2 }}>
            CC Pin
          </Typography>
          <TextField 
            fullWidth 
            variant="outlined" 
            value={cc_pin} 
            disabled 
            sx={darkInputStyle}
          />

          {/* 2. PASSWORD INPUT */}
          <Typography variant="body2" sx={{ color: "#aaa", mb: 0.5, mt: 2 }}>
            Set Password
          </Typography>
          <TextField 
            variant="outlined" 
            fullWidth 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            sx={darkInputStyle} 
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: "#aaa" }}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />

          {/* 3. LINK INPUT */}
          <Typography variant="body2" sx={{ color: "#aaa", mb: 0.5, mt: 2 }}>
            Link
          </Typography>
          <TextField 
            fullWidth 
            variant="outlined" 
            value={roomUrl} 
            disabled 
            sx={darkInputStyle}
          />

        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2, alignItems: "center" }}>
          <Button onClick={() => setOpenPopup(false)} sx={{ color: "#aaa", fontWeight: "bold", marginRight: "auto" }}>
            CANCEL
          </Button>
          <Box sx={{ position: "relative", mr: 2 }}>
            <IconButton 
              onClick={handleCopyDetails} 
              sx={{ 
                color: copySuccess ? "#ce93d8" : "#ce93d8", 
                border: "1px solid #444",
                borderRadius: "8px",
                padding: "8px"
              }}
              title="Copy Room Details"
            >
              {copySuccess ? <CheckCircleIcon /> : <ContentCopyIcon />}
            </IconButton>
            
            {/* "Copied" Tooltip that fades in/out */}
            <Fade in={copySuccess}>
              <Typography variant="caption" sx={{ color: "#ce93d8", position: "absolute", top: -25, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
                Copied!
              </Typography>
            </Fade>
          </Box>
          <Button 
            onClick={createroom} 
            variant="contained" 
            sx={{ 
              bgcolor: "#d500f9", 
              fontWeight: "bold", 
              padding: "8px 25px", 
              "&:hover": { bgcolor: "#aa00c7" } 
            }}
          >
            CREATE
          </Button>
        </DialogActions>
      </Dialog>


      {/* --- JOIN ROOM MODAL --- */}
      <Dialog 
        open={openPop} 
        onClose={() => setOpenPop(false)}
        slotProps={{
          paper: {
            sx: { backgroundColor: "#222", color: "white", width: "450px",height: "330px", border: "1px solid #444", borderRadius: "12px" }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.2rem", paddingBottom: 0 }}>JOIN ROOM</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          
          <Typography variant="body2" sx={{ color: "#aaa", mb: 0.5, mt: 2 }}>Enter CC Pin</Typography>
          <TextField 
            fullWidth variant="outlined" 
            placeholder=" "
            value={cc_pin} onChange={(e) => setcc_pin(e.target.value)} 
            sx={darkInputStyle}
            
          />

          <Typography variant="body2" sx={{ color: "#aaa", mb: 0.5, mt: 2 }}>Enter Password</Typography>
          <TextField 
            fullWidth variant="outlined" 
            placeholder=" "
            type={showPassword ? "text" : "password"} 
            value={password} onChange={(e) => setPassword(e.target.value)} 
            sx={darkInputStyle}
            slotProps={{ input: { endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: "#aaa" }}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) } }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setOpenPop(false)} sx={{ color: "#aaa", fontWeight: "bold", marginRight: 1 }}>
            CANCEL
          </Button>
          <Button 
            onClick={joinroom} 
            variant="contained" 
            sx={{ 
              bgcolor: "#d500f9", 
              fontWeight: "bold", 
              padding: "8px 25px",
              "&:hover": { bgcolor: "#aa00c7" }
            }}
          >
            JOIN
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomePage;