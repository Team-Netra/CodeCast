import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, IconButton, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import socket from "../api/socket.js"; // your existing socket instance
import axios from 'axios';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import logo from "../assets/logo.svg"

const RoomPage = () => {
  const [iscreater, setisCreater] = useState(false)
  const { id } = useParams(); // Get the room ID from URL
  const [code, setCode] = useState(""); // Store the code
  const [language, setLanguage] = useState(javascript()); // Default to JavaScript
  const [selectedLang, setSelectedLang] = useState("javascript"); // Track selected language

  // Below are the new states I added for file management (whichever poor soul is resolving merge conflicts rn)
  const [currentFileId, setCurrentFileId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "saved" | "unsaved" | "saving"
  const [lastSaved, setLastSaved] = useState(null);

  const handleLanguageChange = (event) => {
    const lang = event.target.value;
    setSelectedLang(lang);
    setLanguage(
      lang === "javascript" ? javascript() :
        lang === "python" ? python() :
          cpp() // Used for both C and C++
    );
  };

  //Save function (Added for file storage)
  // Save function
  const handleSave = async () => {
    if (!currentFileId) {
      alert("No file selected to save");
      return;
    }

    if (!iscreater) {
      alert("Only the room admin can save files");
      return;
    }

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const response = await axios.patch(
        '/api/v1/files/save',
        {
          fileId: currentFileId,
          contents: code
        },
        {
          withCredentials: true
        }
      );
      console.log("File saved:", response.data);
      setSaveStatus("saved");
      setLastSaved(new Date());

      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus(""), 2000);

    } catch (error) {
      console.error("Error saving file:", error);
      setSaveStatus("error");
      alert(error.response?.data?.message || "Failed to save file");
      
      setTimeout(() => setSaveStatus(""), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!iscreater || !currentFileId) return;

    const autoSaveInterval = setInterval(() => {
      handleSave();
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [code, currentFileId, iscreater]);

  // Mark as unsaved when code changes
  useEffect(() => {
    if (code && saveStatus !== "saving") {
      setSaveStatus("unsaved");
    }
  }, [code]);

  useEffect(() => {
    socket.emit('join_room', { cc_pin: id })
    socket.on('user_joined', () => {
      console.log("User successfully joined the room")
    })
    socket.on('user_error', (data) => {
      console.log("User could not join the room", data)
    })
    setisCreater(localStorage.getItem("creater") === "true")
    console.log("are you the creater?", iscreater)

    // TODO: Load initial file here
    // fetchRoomFiles() or loadDefaultFile()
  }, [])

  useEffect(() => {
    //if the user is the creater then only send the message
    // console.log("is still the creater but am i sending the message i need to?",iscreater)
    if (iscreater) {
      // console.log("message sent")
      socket.emit('code_message', { code: code, cc_pin: id })
    }
  }, [code])

  useEffect(() => {
    if (!iscreater) {
      // console.log("reciveingggg code,hi")
      socket.on('code', (data) => {
        setCode(data.code)
        // console.log("code recived", data)
      })
    }
  }, [socket])

  // return (
  //   <Box sx={{
  //     position: "fixed", // Fix the page in place
  //     top: 0,
  //     left: 0,
  //     width: "100vw", // Full viewport width
  //     height: "100vh", // Full viewport height
  //     display: "flex", bgcolor: "black", color: "white"
  //   }}>

  //     <CodeMirror
  //       value={code}
  //       height="100vh"
  //       width="80vw"
  //       theme="dark"
  //       extensions={[language]}
  //       onChange={(value) => setCode(value)}
  //     />
  //   </Box>

  // );

  // Save status indicator
  const getSaveStatusColor = () => {
    switch(saveStatus) {
      case "saved": return "lightgreen";
      case "unsaved": return "orange";
      case "saving": return "yellow";
      case "error": return "red";
      default: return "white";
    }
  };

  const getSaveStatusText = () => {
    switch(saveStatus) {
      case "saved": return "Saved";
      case "unsaved": return "Unsaved changes";
      case "saving": return "Saving...";
      case "error": return "Save failed";
      default: return "";
    }
  };

  return (<Box sx={{ top: "0", left: "0", position: "fixed", width: "100vw", height: "100vh", display: "flex", flexDirection: "column", bgcolor: "black" }}>
    <Box sx={{ top: "0", left: "0", display: "flex", padding: 1, justifyContent: "space-between", alignItems: "center", height: "4vh" }}>
      <Box sx={{ p: 1, mt: 1 }}>
        <img src={logo} alt="Logo" style={{ height: 30 }} />
      </Box>
      {/* Save Status Indicator */}
      {saveStatus && (
        <Typography 
          sx={{ 
            position: "absolute", 
            left: "50%", 
            transform: "translateX(-50%)",
            color: getSaveStatusColor(),
            fontSize: "14px"
          }}
        >
          {getSaveStatusText()}
        </Typography>
      )}
      {/* Save Button - Only visible for admin */}
      {iscreater && (
          <IconButton 
            onClick={handleSave}
            disabled={isSaving || !currentFileId}
            sx={{ 
              position: "absolute", 
              right: 225, 
              color: isSaving ? "gray" : "white", 
              transform: "scale(1.1)" 
            }}
          >
            {isSaving ? <CircularProgress size={24} color="inherit" /> : <SaveOutlinedIcon />}
          </IconButton>
      )}

      <IconButton sx={{ position: "absolute", right: 120, color: "white", transform: "scale(1)" }}>
        <SettingsOutlinedIcon />
      </IconButton>
      <IconButton sx={{ position: "absolute", right: 155, color: "white", transform: "scale(1.1)" }}>
        <DownloadOutlinedIcon />
      </IconButton>
      <IconButton sx={{ position: "absolute", right: 190, color: "white", transform: "scale(1.1)" }}>
        <UploadFileOutlinedIcon />
      </IconButton>

      <FormControl variant="standard" sx={{ display: "flex", right: 0, padding: 1, Width: "100vw" }}>
        <Select
          value={selectedLang}
          onChange={handleLanguageChange}
          label="Language"
          sx={{ fontSize: '15px', color: "white", borderColor: "white", ".MuiSvgIcon-root": { color: "white" } }}
        >
          <MenuItem value="javascript">JavaScript</MenuItem>
          <MenuItem value="python">Python</MenuItem>
          <MenuItem value="cpp">C++</MenuItem>
        </Select>
      </FormControl>
    </Box>
    <Box sx={{ width: "100%", height: "4vh" }}>

    </Box>

    <Box sx={{ width: "100%", height: "100%", textAlign: "left" }}>
      <CodeMirror
        value={code}
        height="100%"
        width="100%"
        theme={oneDark}
        extensions={[language]}
        onChange={(value) => setCode(value)}
        className="left-align-editor"
      />
    </Box>
  </Box>)
};

export default RoomPage;
