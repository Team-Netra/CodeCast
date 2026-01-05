import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, IconButton, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import socket from "../api/socket.js"; // your existing socket instance
// import axios from 'axios';
import axiosInstance from "../api/axiosInstance.js"; // Use the new instance
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import logo from "../assets/logo.svg"

const DRAWER_WIDTH = 240;

const RoomPage = () => {
  const [iscreater, setisCreater] = useState(false)
  const { id } = useParams(); // Get the room ID from URL - THIS IS CCPIN
  const [code, setCode] = useState(""); // Store the code
  const [language, setLanguage] = useState(javascript()); // Default to JavaScript
  const [selectedLang, setSelectedLang] = useState("javascript"); // Track selected language

  // Below are the new states I added for file management (whichever poor soul is resolving merge conflicts rn)
  const [currentFileId, setCurrentFileId] = useState(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [files, setFiles] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "saved" | "unsaved" | "saving"
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Turns out we can use CodeMirror library to add language related syntax, I'm adding it for a few languages

  // Language map based on file extension
  const getLanguageFromExtension = (extension) => {
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'javascript',
      'tsx': 'javascript',
      'py': 'python',
      'cpp': 'cpp',
      'c': 'cpp',
      'h': 'cpp',
      'hpp': 'cpp'
    };
    return langMap[extension] || 'javascript';
  };

  const getCodemirrorLang = (langString) => {
    switch(langString) {
      case 'javascript': return javascript();
      case 'python': return python();
      case 'cpp': return cpp();
      default: return javascript();
    }
  };

  // Fetch room files on mount
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setIsLoading(true);
        
        // Get the room data by cc_pin
        const roomResponse = await axiosInstance.get(`/api/v1/rooms/by-pin/${id}`);
        
        const roomId = roomResponse.data.data._id;
        setRoomData(roomResponse.data.data);
        
        // Fetch files for this room
        const filesResponse = await axiosInstance.get(`/api/v1/files/room/${roomId}`);
        
        const fetchedFiles = filesResponse.data.data.files;
        setFiles(fetchedFiles);
        // Load the first file by default
        if (fetchedFiles.length > 0) {
          await loadFile(fetchedFiles[0]._id);
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
        if (error.response?.status === 403) {
          alert("You are not a member of this room");
          navigate('/home');
        } else if (error.response?.status === 404) {
          alert("Room not found");
          navigate('/home');
        } else {
          alert("Failed to load room files");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomData();
  }, [id, navigate]);

  // Load a specific file
  const loadFile = async (fileId) => {
    try {
      const response = await axiosInstance.get(`/api/v1/files/${fileId}`);
      
      const file = response.data.data.file;
      setCurrentFileId(file._id);
      setCurrentFileName(`${file.filename}.${file.extension}`);
      setCode(file.contents || "");
      
      // Set language based on file extension
      const lang = getLanguageFromExtension(file.extension);
      setSelectedLang(lang);
      setLanguage(getCodemirrorLang(lang));
      
      setSaveStatus("");

      // Emit file change to socket (for future sync features)
      socket.emit('file_changed', { 
        cc_pin: id, 
        fileId: file._id 
      });
      
    } catch (error) {
      console.error("Error loading file:", error);
      alert("Failed to load file");
    }
  };

  const handleLanguageChange = (event) => {
    const lang = event.target.value;
    setSelectedLang(lang);
    setLanguage(
      getCodemirrorLang(lang) //replaced with CodeMirror logic written above
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

  // Adding Ctrl+S or Cmd+S shortcut as well cuz why not
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFileId, code, iscreater]);

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

     return () => {
      socket.off('user_joined');
      socket.off('user_error');
      socket.off('code');
    };

  }, [id])

  useEffect(() => {
    //if the user is the creater then only send the message
    // console.log("is still the creater but am i sending the message i need to?",iscreater)
    if (iscreater && currentFileId) { //Added currentFileId check
      // console.log("message sent")
      socket.emit('code_message', { code: code, cc_pin: id, fileId: currentFileId })
    }
  }, [code, iscreater, id, currentFileId])

  useEffect(() => {
    if (!iscreater) {
      // console.log("reciveingggg code,hi")
      // Adding how to determine currentFileId (the file being updated)
      const handleCodeUpdate = (data) => {
        // Only update if it's for the current file
        if (data.fileId === currentFileId) {
          setCode(data.code);
        }
      };

      socket.on('code', handleCodeUpdate);
    }
  }, [iscreater, currentFileId]);

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

  if (isLoading){ //Loading screen for smoother ui
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        bgcolor: 'black',
        color: 'white'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: 'white', mb: 2 }} />
          <Typography>Loading room...</Typography>
        </Box>
      </Box>
    );
  }



  return (
    <Box sx={{ 
      display: 'flex',
      height: '100vh',
      bgcolor: 'black',
      overflow: 'hidden'
    }}>
      {/* File Explorer Drawer */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#1e1e1e',
            color: 'white',
            borderRight: '1px solid #333'
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderOpenIcon sx={{ color: '#569cd6' }} />
          <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold' }}>
            FILES
          </Typography>
        </Box>
        <Divider sx={{ bgcolor: '#333' }} />
        <List sx={{ pt: 0 }}>
          {files.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center', color: '#858585' }}>
              <Typography sx={{ fontSize: '12px' }}>No files found</Typography>
            </Box>
          ) : (
            files.map((file) => (
              <ListItem key={file._id} disablePadding>
                <ListItemButton
                  selected={currentFileId === file._id}
                  onClick={() => loadFile(file._id)}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: '#37373d',
                      '&:hover': {
                        bgcolor: '#2a2d2e',
                      }
                    },
                    '&:hover': {
                      bgcolor: '#2a2d2e',
                    },
                    py: 0.5
                  }}
                >
                  <InsertDriveFileIcon 
                    sx={{ 
                      mr: 1, 
                      fontSize: '18px',
                      color: currentFileId === file._id ? '#569cd6' : '#858585'
                    }} 
                  />
                  <ListItemText 
                    primary={`${file.filename}.${file.extension}`}
                    primaryTypographyProps={{
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Drawer>
    
    <Box sx={{ top: "0", left: "0", position: "fixed", width: "100vw", height: "100vh", display: "flex", flexDirection: "column", bgcolor: "black" }}>
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
      {iscreater && (
              <Typography sx={{ fontSize: '12px', color: '#569cd6' }}>
                Admin
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}></Box>
      
      {/* Save Button - Only visible for admin */}
      {iscreater && (
          <IconButton 
            onClick={handleSave}
            disabled={isSaving || !currentFileId}
            title="Save (Ctrl+S)"
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
