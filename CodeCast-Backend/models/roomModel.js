import mongoose from "mongoose"
import bcrypt from "bcrypt"



const roomSchema = new mongoose.Schema({
    cc_pin: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    admins: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    directories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File"
        }
    ]
}, {
    timestamps: true,
});

roomSchema.pre("save" ,async function (next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next();
});

roomSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password , this.password)
};

//bcrypt.compare(plainTextPassword, hashedPassword) - this is the right syntax it seems so swapping this.password and password

export const Room = mongoose.model("Room", roomSchema);


