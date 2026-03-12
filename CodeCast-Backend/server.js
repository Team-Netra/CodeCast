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
import { User } from "./models/userModel.js";
import userRouter from "./routes/user.routes.js";
// import roomRouter from "./routes/room.routes.js";
import fileRouter from "./routes/file.routes.js";
import roomRouter from "./routes/room.routes.js"
import { ApiError } from "./utils/ApiError.js";
import { Room } from "./models/roomModel.js";
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
app.use("/files", fileRouter);

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
io.use(async (socket, next) => {
    try {
        const cookieheader = socket.handshake.headers.cookie;
        if (!cookieheader) {
            throw new ApiError(401, "Unauthorized request")
        }
        const cookies = cookie.parse(cookieheader);
        const token = cookies.accessToken;

        if (!token) {
            throw new ApiError(401, "Access token missing");
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        socket.user = user;
        next()
    } catch (err) {
        const socketError = new Error(err.message);
        socketError.data = {
            statusCode: err.statusCode || 500,
            errors: err.errors || []
        };

        next(socketError);
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
            console.log("user connected", socket.id, socket.user)
            // let rawcookies = {};
            // if (socket.handshake.headers['cookie']) {
            //     rawcookies = cookie.parse(socket.handshake.headers['cookie'])
            // }
            // console.log(rawcookies)

            // const accessToken = cookies.accessToken
            // const cookief = socket.handshake.headers.cookie; 
            // const cookies = cookie.parse(socket.handshake.headers.cookie);    

            socket.on('join_room', async (data) => {
                console.log(data)
                try {
                    // console.log("hii");
                    // const decodedToken = jwt.verify(rawcookies.accessToken, process.env.ACCESS_TOKEN_SECRET)
                    // console.log("byee");

                    //here we need to check if the 
                    // cc_pin room exists 
                    // then if the userid is in the the rooms list of members if not then they cannot do a direct socket connection
                    if (!data?.cc_pin) {
                        throw new ApiError(400, "cc_pin is required");
                    }
                    // if (!decodedToken) {
                    //     socket.emit('user_error', { error: "Unable to verify jwt" })
                    // }
                    const room = await Room.findOne({ cc_pin: data.cc_pin })
                    if (!room) {
                        throw new ApiError(404, "Room not found")
                    }
                    const isAdmin = room.admins.some(
                        adminId => adminId.equals(socket.user._id)
                    );
                    const isparticipant = room.participants.some(
                        partiID => partiID.equals(socket.user._id)
                    )
                    if (!isparticipant && !isAdmin) {
                        throw new ApiError(402, "User not part of the room")
                    }
                    console.log(isAdmin,isparticipant)

                    socket.join(data.cc_pin)
                    // console.log("user joined")
                    // emit and on 111
                    console.log("user joined room", data.cc_pin);
                    // socket.emit('user_joined')
                    socket.emit("role", { isCreator: isAdmin })
                    //todo emit the stored code to the new user 
                    // socket.to(data.cc_pin).emit('code', { code: data.code })
                } catch (err) {
                    socket.emit('user_error', {
                        error: err.message || "Internal Server error",
                        message: err.message || "Internal Server error",
                        statusCode: err.statusCode || 500
                    })
                }
            })
            socket.on('code_message', async (data) => {
                //we need to check if the user is the admin in the room so now we have the cc_pin we can do a query to get the room details and see if the userid we got is the admin is yes then we can continue otherwise we need to error is out 
                try {
                    if (!data?.cc_pin || typeof data.code !== "string") {
                        throw new ApiError(400, "Invalid payload");
                    }
                    const room = await Room.findOne({ cc_pin: data.cc_pin })
                    if (!room) {
                        throw new ApiError(404, "Room not found")
                    }
                    // console.log(room);
                    const isAdmin = room.admins.some(
                        adminId => adminId.equals(socket.user._id)
                    );
                    if (isAdmin) {
                        console.log("code got", data)//!!!
                        const usersInRoom = io.sockets.adapter.rooms.get(data.cc_pin);
                        console.log("users in room", usersInRoom, "cc_pin", data.cc_pin)
                        socket.to(data.cc_pin).emit('code', { code: data.code, fileId: data.fileId })
                    } else {
                        console.log("not the creator")
                        throw new ApiError(401, "User is not the creator")
                    }
                } catch (err) {
                    socket.emit('user_error', {
                        error: err.message || "Internal Server error",
                        message: err.message || "Internal Server error",
                        statusCode: err.statusCode || 500
                    })
                }
            })
            socket.on('disconnect', () => {
                console.log("User Disconnected", socket.id)
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





