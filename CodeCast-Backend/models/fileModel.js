import mongoose from "mongoose"


const fileSchema = mongoose.Schema(
    {
        extension: {
            type: String,
            required: true,
        },
        filename: {
            type:String,
            required: true,
        },
        contents: {
            type:String,
            default: "", //Starting with empty file
        },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true,
    },
    lastSavedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    lastSavedAt: {
        type: Date,
    }
},
    {timestamps:true}
);

fileSchema.index({room: 1}); //Added index on rooms in ascending for faster lookups

export const File = mongoose.model("File" , fileSchema);
