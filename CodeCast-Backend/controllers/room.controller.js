import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/userModel.js"
import { Room } from "../models/roomModel.js"
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"


//so basically what do we need
//when a person give the cc-pin we have to check if the room exist
// const createroom = async (cc_pin, password, accessToken, name) => {
//     //for creating a room we have to get the pin and also the unique id and the name of the room which is optional
//     //then see if the room existe if it exists then we have to give an error(but this is highly unlikely but best to take care of it)
//     //then we have to add the room to the database and also in the admin part add the user and also in the user add the room
//     try {
//         const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
//         const user = await User.findById(decodedToken._id).select("-password -refreshToken")
//         if (!user) {
//             throw new Error("User does not exist")
//         }

//         const roomexists = await Room.findOne({ cc_pin })
//         if (roomexists) {
//             throw new Error("Room already exists")
//         }
//         // const user = await User.findOne({ userid })
//         password = password.trim()

//         const newroom = await Room.create({ cc_pin, name, password, admins: [user._id] })
//         console.log(password.length)
//         user.rooms.push(newroom._id)
//         await user.save()

//         return { success: true, roomId: newroom._id }
//     } catch (error) {
//         console.log("Error is creating a room", error)
//         return { success: false, error: error.message }
//     }
// }
// const addusertoroom = async (cc_pin, password, accessToken) => {
//     try {
//         //add the user to the list of participents
//         console.log("addddding user to rooom")
//         console.log(accessToken)
//         const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
//         const user = await User.findById(decodedToken._id).select("-password -refreshToken")
//         if (!user) {
//             throw new error("User does not exist")
//         }

//         const room = await Room.findOne({ cc_pin })
//         if (!room) {
//             throw new Error("Room does not exist")
//         }
//         console.log(password.length)

//         const ispasswordcorrect = await room.isPasswordCorrect(password.trim())
//         if (!ispasswordcorrect) {
//             console.log()
//             console.log()
//             throw new Error("password not correct")
//         }

//          user.rooms.push(room._id)
//         room.participants.push(user._id)
//         await room.save()
//         await user.save()
//         return { success: true, roomId: room._id }
//     } catch (error) {
//         console.log("Error occured during adding user to room", error)
//         return { success: false, error: error.message }
//     }
// }

// export { createroom, addusertoroom }

const createroom = asyncHandler(async (req, res) => {
    //for creating a room we have to get the pin and also the unique id and the name of the room which is optional
    //then see if the room existe if it exists then we have to give an error(but this is highly unlikely but best to take care of it)
    //then we have to add the room to the database and also in the admin part add the user and also in the user add the room
    try {
        //if name is not sent then it will be set to default
        console.log("creating the room")
        let { cc_pin, password, name="defalut" } = req.body
        if(!cc_pin){
            throw new ApiError(400,"cc_pin is required");
        }
        if(!password){
            throw new ApiError(400,"Password is required")
        }
        // const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(req.user._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(404, "User Not found")
        }

        const roomexists = await Room.findOne({ cc_pin })
        if (roomexists) {
            throw new ApiError(409, "Room Already Exists")
        }
        // const user = await User.findOne({ userid })
        password = password.trim()

        const newroom = await Room.create({ cc_pin, name, password, admins: [user._id] })
        // console.log(password.length)
        user.rooms.push(newroom._id)
        await user.save()

        // return { success: true, roomId: newroom._id }

        return res.status(200).json(new ApiResponse(200, {}, "database-successfully created a room"))
    } catch (error) {
        console.log("Error is creating a room", error)
        // return { success: false, error: error.message }
        throw new ApiError(500,"Somethign went wrong when creating the room")
    }
})

const addusertoroom = asyncHandler(async (req,res) => {
    try {
        //add the user to the list of participents
        console.log("addddding user to rooom")
        // console.log(accessToken)
        // const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
        const {cc_pin , password} = req.body;
        if(!cc_pin){
            throw new ApiError(400 , "Cc_pin is required")
        }
        if(!password){
            throw new ApiError(400,"Password is required")
        }
        const user = await User.findById(req.user._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(404,"User not found")
        }

        const room = await Room.findOne({ cc_pin })
        if (!room) {
            throw new ApiError(404,"Room not found")
        }
        // console.log(password.length)

        const ispasswordcorrect = await room.isPasswordCorrect(password.trim())
        if (!ispasswordcorrect) {
            throw new ApiError(402,"Invalid Credentials")
        }

        user.rooms.push(room._id)
        room.participants.push(user._id)
        await room.save()
        await user.save()
        // return { success: true, roomId: room._id }
        return res.status(200).json(new ApiResponse(200,{},"database-User added to room"))
    } catch (error) {
        console.log("Error occured during adding user to room", error)
        // return { success: false, error: error.message }
        throw new ApiError(500,"Something went wrong while adding user to the room")
    }
})

export { createroom, addusertoroom }