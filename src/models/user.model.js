import mongoose, {Schema} from "mongoose";


const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            unique: true,
            required: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,  
        },

    },
    {
        timestamps
    }
);


export const User = mongoose.model("User", userSchema)