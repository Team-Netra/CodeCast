import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import DBConnection from "./Config/dbconnection.js";
import cookieParser from "cookie-parser";
import { createServer } from 'node:http'
import { Server } from "socket.io"
import { verifyJWT } from "./middleware/auth.middleware.js";
import cookie from "cookie"
import { createroom, addusertoroom } from "./controllers/room.controller.js";
import jwt from "jsonwebtoken"

import userRouter from "./routes/user.routes.js";
import roomRouter from "./routes/room.routes.js"
// import { Socket } from "node:dgram";



dotenv.config()

const port = process.env.PORT || 8000;
const app = express();
app.use(cors({
    origin: process.env.FRONTEND_CONNECTION_STRING,
    credentials: true
}))
app.use(cookieParser())
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))

app.use("/users", userRouter)
app.use("/room", roomRouter)

app.get("/", (req, res) => {
    res.send("Server is alive and kicking. Unlike your patience.")
})

const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_CONNECTION_STRING,
        credentials: true,
        methods: ["GET", "POST"],

    }
})
DBConnection()
    .then(() => {
        // app.listen(port, () => {
        //     console.log("Server running on port", port)
        // })
        // io.engine.on("headers", (headers,request)=>{
        //     if(!request.headers.cookie) return
        //     const cookie = parse(request.headers.cookie)
        //     console.log("cookie",cookie)
        // })

        // io.use((socket,next)=>{
        //     console.log(socket.handshake);
        //     next();
        // })

        io.on("connection", (socket) => {
            console.log("user connected", socket.id)
            let rawcookies = {};
            if (socket.handshake.headers['cookie']) {
                rawcookies = cookie.parse(socket.handshake.headers['cookie'])
            }
            // console.log(rawcookies)

            // const accessToken = cookies.accessToken
            // const cookief = socket.handshake.headers.cookie; 
            // const cookies = cookie.parse(socket.handshake.headers.cookie);    

            socket.on('join_room', async (data) => {
                console.log(data)
                try {
                    console.log("hii");
                    const decodedToken = jwt.verify(rawcookies.accessToken, process.env.ACCESS_TOKEN_SECRET)
                    console.log("byee");
                    
                    if (!data.cc_pin) {
                        socket.emit('user_error', { error: "cc_pin is required" })

                    }
                    if (!decodedToken) {
                        socket.emit('user_error', { error: "Unable to verify jwt" })
                    }
                    socket.join(data.cc_pin)
                    // emit and on 111
                    console.log("user joined room", data.cc_pin);
                    socket.emit('user_joined')
                    socket.to(data.cc_pin).emit('code', { code: data.code })
                } catch (error) {
                    console.log(error)
                    socket.emit('user_error', { error: error })
                }
            })
            socket.on('code_message', (data) => {
                console.log("code got", data)
                const usersInRoom = io.sockets.adapter.rooms.get(data.cc_pin);
                console.log("users in room", usersInRoom, "cc_pin", data.cc_pin)
                socket.to(data.cc_pin).emit('code', { code: data.code })
            })
            socket.on('disconnect',()=>{
                console.log("User Disconnected",socket.id)
            })
        })

        server.on("error", (err) => {
            console.log("Error", err)
            throw err
        })
    })
    .catch((err) => {
        console.log("Database Connection failed", err)
    });

//routes
server.listen(port, () => {
    console.log("Server running on port", port)
})





