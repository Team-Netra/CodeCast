import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"
async function DBConnection  (){
    try {
        let connection = await mongoose.connect(`${process.env.CONNECTION_STRING}/${DB_NAME}`)
        console.log("Database connected sucessfully")
    } catch (error) {
        console.log("MONGODB connection error" , error);
        throw error
    }
}
export default DBConnection