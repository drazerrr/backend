import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
    playlistName: {
        type: String,
        required: true
    },
    playlistDescription: {
        type: String,
        required: true
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{
    timestamps: true
})



export const Playlist = mongoose.model("Playlist", playlistSchema)