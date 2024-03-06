import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const video = req.files?.videoFile[0]?.path
    const thumbnail = req.files?.thumbnail[0]?.path
    if(!video ||!thumbnail) {
        throw new ApiError(400, "Video and thumbnail are required")
    }

    
    const videoUpload = await uploadOnCloudinary(video)
    const thumbnailUpload = await uploadOnCloudinary(thumbnail)
    if(!videoUpload ||!thumbnailUpload) {
        throw new ApiError(400, "Something went wrong while uploading video and thumbnail")
    }   
    console.log("videoUrl: ", videoUpload);
    console.log("thumbnailUrl: ", thumbnailUpload.url);
    
    const user = await User.findById(req.user?._id)
    if(!user) {
        throw new ApiError(404, "User not found")
    }
    const newVideo = await Video.create({
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        title,
        description,
        duration: videoUpload.duration,
        owner: user._id

    });
    if(!newVideo) {
        throw new ApiError(500, "Something went wrong while creating video")
    }

    return res.status(200).json(
        new ApiResponse(200, newVideo, "Video published successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}