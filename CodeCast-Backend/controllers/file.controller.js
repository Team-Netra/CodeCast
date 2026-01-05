import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { File } from "../models/fileModel.js"
import { Room } from "../models/roomModel.js"
import mongoose from "mongoose";

const saveFileContents = asyncHandler(async(req, res) => {
    const { fileId, contents } = req.body;
    if (!fileId){
        throw new ApiError(400, "File ID is required");
    } 

    if (contents === undefined || contents === null) {
        throw new ApiError(400, "Contents are required");
    }
    
    if (!mongoose.Types.ObjectId.isValid(fileId)){
        throw new ApiError(400, "Invalid file ID format");
    }

    //Finding file, room and admins from fileid
    const file = await File.findById(fileId).populate({
        path: 'room',
        populate: {path: 'admins'}
    });
    
    if (!file){
        throw new ApiError(404, "File not found :(");
    }

    if (!file.room){
        throw new ApiError(404, "Room not found :(");
    }

    //Check if the user is admin
    const isAdmin = file.room.admins.some(
        admin => admin._id.toString() === req.user._id.toString()
    );

    if (!isAdmin) {
        throw new ApiError(403, "Unauthorized: Only room admins can save files");
    }

    //Update file
    file.contents = contents;
    file.lastSavedBy = req.user._id;
    file.lastSavedAt = new Date();
    await file.save({ validateBeforeSave: false});

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                file: {
                    _id: file._id,
                    filename: file.filename,
                    extension: file.extension,
                    lastSavedAt: file.lastSavedAt,
                    updatedAt: file.updatedAt
                }
            },
            "File saved successfully"
        )
    );
    
});

const getRoomFiles = asyncHandler(async(req, res) => {
    const { roomId } = req.params;
     if (!mongoose.Types.ObjectId.isValid(roomId)) {
        throw new ApiError(400, "Invalid room ID format");
    }

    const room = await Room.findById(roomId)
        .populate('directories', 'filename extension updatedAt lastSavedAt')
        .select('name cc_pin admins participants');

    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    const isMember =
        room.admins.some(admin => admin.toString() === req.user._id.toString()) ||
        room.participants.some(participant => participant.toString() === req.user._id.toString());

    if (!isMember) {
        throw new ApiError(403, "Unauthorized: You are not a member of this room");
    }

    return res.status(200).json(
        new ApiResponse(200, { files: room.directories }, "Files fetched successfully")
    );

});

const getFileContents = asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    console.log("Searching for File ID:", fileId);
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        throw new ApiError(400, "Invalid file ID format");
    }

    const file = await File.findById(fileId).populate({
        path: 'room',
        select: 'admins participants'
    });

    if (!file) {
        throw new ApiError(404, "File not found");
    }

    if (!file.room) {
        throw new ApiError(404, "Room not found for this file");
    }

    // Check membership
    const isMember =
        file.room.admins.some(admin => admin.toString() === req.user._id.toString()) ||
        file.room.participants.some(participant => participant.toString() === req.user._id.toString());

    if (!isMember) {
        throw new ApiError(403, "Unauthorized: You are not a member of this room");
    }

    return res.status(200).json(
        new ApiResponse(200, { file }, "File contents fetched successfully")
    );
});

// Create a new file in a room
// Adding this rn itself cuz if we are having directories we should probbaly have an endpoint for this
const createFile = asyncHandler(async (req, res) => {
    const { roomId, filename, extension, contents = "" } = req.body;

    if (!roomId || !filename || !extension) {
        throw new ApiError(400, "Room ID, filename, and extension are required");
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
        throw new ApiError(400, "Invalid room ID format");
    }

    const room = await Room.findById(roomId);
    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    // Check if user is admin
    const isAdmin = room.admins.some(
        admin => admin.toString() === req.user._id.toString()
    );

    if (!isAdmin) {
        throw new ApiError(403, "Unauthorized: Only room admins can create files");
    }

    // Create the file
    const file = await File.create({
        filename,
        extension,
        contents,
        room: roomId,
        lastSavedBy: req.user._id,
        lastSavedAt: new Date()
    });

    // Add file to room's directories
    room.directories.push(file._id);
    await room.save({ validateBeforeSave: false });

    return res.status(201).json(
        new ApiResponse(201, { file }, "File created successfully")
    );
});

// Delete a file
const deleteFile = asyncHandler(async (req, res) => {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        throw new ApiError(400, "Invalid file ID format");
    }

    const file = await File.findById(fileId).populate('room');

    if (!file) {
        throw new ApiError(404, "File not found");
    }

    // Check if user is admin
    const isAdmin = file.room.admins.some(
        admin => admin.toString() === req.user._id.toString()
    );

    if (!isAdmin) {
        throw new ApiError(403, "Unauthorized: Only room admins can delete files");
    }

    // Remove from room's directories
    await Room.findByIdAndUpdate(
        file.room._id,
        { $pull: { directories: fileId } }
    );
    // Delete the file
    await File.findByIdAndDelete(fileId);

    return res.status(200).json(
        new ApiResponse(200, {}, "File deleted successfully")
    );
});

export { 
    saveFileContents, 
    getRoomFiles, 
    getFileContents, 
    createFile,
    deleteFile 
};
