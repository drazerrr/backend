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
    console.log(query)
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: {

        }, // initialize sort object
      };
    
      // Build match stage for filtering based on query and userId
      const match = {};
      if (query) {
        match.$text = { $search: query }; // text search for title and description
        match.$isPublished = true; // filter by
      }
      if (userId) {
        match.owner = new mongoose.Types.ObjectId(userId); // filter by owner if provided
      }
      
      // Build sort stage based on sortBy and sortType
      if (sortBy && sortType) {
        options.sort[sortBy] = sortType === 'asc' ? 1 : -1; // ascending or descending
      }
      
      console.log(match)
      // Use Video.aggregatePaginate to fetch videos with pagination and sorting
      try {
        const videos = await Video.aggregatePaginate(
          [
            { $match: match }, // filter stage
          ],
          options
        );
    
        res.status(200)
        .json(
            new ApiResponse(
              200,
              videos,
              "Videos fetched successfully"
            )
        );
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching videos" });
      }
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
    if(!videoId) {
      throw new ApiError(400, "Video id is required")
    }
    if(!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if(!video) {
      throw new ApiError(404, "Video not found")
    }
    
    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description} = req.body
    if([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    if(video.owner.toString()!== req.user?._id.toString()) {
      throw new ApiError(401, "You are not authorized to update this video")
    };

    const thumbnail = req.file?.path
    if(thumbnail) {
        const thumbnailUpload = await uploadOnCloudinary(thumbnail)
        if(!thumbnailUpload) {
            throw new ApiError(400, "Something went wrong while uploading thumbnail")
        }
        video.thumbnail = thumbnailUpload.url
    }
    video.title = title
    video.description = description
    await video.save()
    return res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    )



})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }
    if(video.owner.toString()!== req.user?._id.toString()) {
        throw new ApiError(401, "You are not authorized to delete this video")
    }
    try {
        await Comment.deleteMany({ video: videoId })
        await Likes.deleteMany({ video: videoId })
       const deletedVideo =  await Video.findByIdAndDelete(videoId)
       return res.status(200).json(
            new ApiResponse(200, deletedVideo, "Video deleted successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while deleting video")
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }
    if(video.owner.toString()!== req.user?._id.toString()) {
        throw new ApiError(401, "You are not authorized to update this video")
    }
    video.isPublished =!video.isPublished
    await video.save()
    return res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}