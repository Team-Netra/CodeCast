import { io } from "socket.io-client"
const socket = io.connect(import.meta.env.VITE_BACKEND_URL, {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5
})
socket.on("connect",()=>{
    console.log("Socket connected");
})
socket.on("connect_error",(err)=>{
    console.log("Socket connection error");
    console.log("Message: ",err.message);
    console.log("satuscode ",err.data?.statusCode);
    //TODO : we need to setup protected routes and when this happens they need be reddirected to login page
})
export default socket 
