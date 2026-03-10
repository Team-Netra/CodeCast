import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, IconButton, Typography, FormControl, Select, MenuItem, CircularProgress, Drawer, List, ListItem, ListItemButton, ListItemText, Divider } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import socket from "../api/socket.js";
import axiosInstance from "../api/axiosInstance.js";
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
  const navigate = useNavigate();
  const [iscreater, setisCreater] = useState(false)
  const { id } = useParams();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState(javascript());
  const [selectedLang, setSelectedLang] = useState("javascript");

  const [currentFileId, setCurrentFileId] = useState(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [files, setFiles] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(true);

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

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setIsLoading(true);
        const roomResponse = await axiosInstance.get(`/room/by-pin/${id}`);
        const room = roomResponse.data.data;
        setRoomData(room);

        if (room.directories && room.directories.length > 0) {
          setFiles(room.directories);
          await loadFile(room.directories[0]._id);
        } else {
          const filesResponse = await axiosInstance.get(`/room/${room._id}/all-files`);
          const fetchedFiles = filesResponse.data.data.files;
          setFiles(fetchedFiles);
          if (fetchedFiles.length > 0) {
            await loadFile(fetchedFiles[0]._id);
          }
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

  const loadFile = async (fileId) => {
    try {
      const response = await axiosInstance.get(`/files/${fileId}`);
      const file = response.data.data.file;
      setCurrentFileId(file._id);
      setCurrentFileName(`${file.filename}.${file.extension}`);
      setCode(file.contents || "");
      
      const lang = getLanguageFromExtension(file.extension);
      setSelectedLang(lang);
      setLanguage(getCodemirrorLang(lang));
      setSaveStatus("");

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
    setLanguage(getCodemirrorLang(lang));
  };

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
      const response = await axiosInstance.patch('/files/save', {
        fileId: currentFileId,
        contents: code
      });
      console.log("File saved:", response.data);
      setSaveStatus("saved");
      setLastSaved(new Date());
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

  useEffect(() => {
    if (!iscreater || !currentFileId) return;
    const autoSaveInterval = setInterval(() => {
      handleSave();
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [code, currentFileId, iscreater]);

  useEffect(() => {
    if (code && saveStatus !== "saving") {
      setSaveStatus("unsaved");
    }
  }, [code]);

  useEffect(() => {
    socket.emit('join_room', { cc_pin: id })
    // socket.on('role', () => {
    //   console.log("User successfully joined the room")
    // })
    socket.on("role", (data) => {
      console.log(data)
      setisCreater(data.isCreator);
    });
    socket.on('user_error', (data) => {
      console.log("User could not join the room", data)
    })
    // setisCreater(localStorage.getItem("creater") === "true")
    console.log("are you the creater?", iscreater)

    return () => {
      socket.off('user_joined');
      socket.off('user_error');
      socket.off('code');
      socket.off("role");
    };
  }, [id])

   useEffect(() => {
      console.log("iscreater changed to:", iscreater)
  }, [iscreater])

  useEffect(() => {
    if (iscreater && currentFileId) {
      console.log("Emitting code msg");
      socket.emit('code_message', { code: code, cc_pin: id, fileId: currentFileId })
    }
  }, [code, iscreater, id, currentFileId])

  useEffect(() => {
    if (!iscreater) {
      const handleCodeUpdate = (data) => {
        console.log(data.code, "before if lol");
        console.log(data.fileId,data, currentFileId)
        console.log(data.fileId === currentFileId)
        if (data.fileId === currentFileId) {
          console.log(data.code, "handling code update")
          setCode(data.code);
        }
      };
      socket.on('code', handleCodeUpdate);
    }
  }, [iscreater, currentFileId]);

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

  if (isLoading) {
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
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      bgcolor: 'black',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Navigation Bar - FIXED ACROSS ENTIRE WIDTH */}
      <Box sx={{ 
        width: '100%',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        bgcolor: 'black',
        borderBottom: '1px solid #333',
        zIndex: 1300,
        position: 'relative'
      }}>
        {/* Left side - Logo and Menu Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ color: 'white' }}
          >
            <MenuIcon />
          </IconButton>
          <img src={logo} alt="Logo" style={{ height: 30 }} />
        </Box>

        {/* Center - Save Status and Current File */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          {currentFileName && (
            <Typography sx={{ color: 'white', fontSize: '14px' }}>
              {currentFileName}
            </Typography>
          )}
          {saveStatus && (
            <Typography sx={{ 
              color: getSaveStatusColor(),
              fontSize: '12px'
            }}>
              {getSaveStatusText()}
            </Typography>
          )}
        </Box>

        {/* Right side - Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {iscreater && (
            <>
              <Typography sx={{ fontSize: '12px', color: '#569cd6', mr: 1 }}>
                Admin
              </Typography>
              <IconButton 
                onClick={handleSave}
                disabled={isSaving || !currentFileId}
                title="Save (Ctrl+S)"
                sx={{ color: isSaving ? "gray" : "white" }}
              >
                {isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveOutlinedIcon />}
              </IconButton>
            </>
          )}
          <IconButton sx={{ color: "white" }}>
            <UploadFileOutlinedIcon />
          </IconButton>
          <IconButton sx={{ color: "white" }}>
            <DownloadOutlinedIcon />
          </IconButton>
          <IconButton sx={{ color: "white" }}>
            <SettingsOutlinedIcon />
          </IconButton>
          <FormControl variant="standard" sx={{ minWidth: 120 }}>
            <Select
              value={selectedLang}
              onChange={handleLanguageChange}
              sx={{ 
                fontSize: '14px', 
                color: "white",
                '.MuiSvgIcon-root': { color: "white" }
              }}
            >
              <MenuItem value="javascript">JavaScript</MenuItem>
              <MenuItem value="python">Python</MenuItem>
              <MenuItem value="cpp">C++</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Content Area with Drawer and Editor */}
      <Box sx={{ 
        display: 'flex',
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* File Explorer Drawer - OVERLAYS INSTEAD OF PUSHING */}
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
              borderRight: '1px solid #333',
              top: '50px',
              height: 'calc(100vh - 50px)',
              position: 'absolute'
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
                        '&:hover': { bgcolor: '#2a2d2e' }
                      },
                      '&:hover': { bgcolor: '#2a2d2e' },
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

        {/* Code Editor - FULL WIDTH BEHIND DRAWER */}
        <Box sx={{ 
          width: '100%',
          height: '100%',
          position: 'relative',
          '& .cm-editor': {
            textAlign: 'left'
          },
          '& .cm-content': {
            textAlign: 'left'
          },
          '& .cm-line': {
            textAlign: 'left'
          }
        }}>
          <CodeMirror
            value={code}
            height="100%"
            width="100%"
            theme={oneDark}
            extensions={[language]}
            onChange={(value) => setCode(value)}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              foldGutter: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default RoomPage;