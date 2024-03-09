import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {comment} = req.body
    if(comment?.trim() === "") {
        throw new ApiError(400, "Comment text is required")
    }
    const user = await User.findById(req.user?._id);
    if(!user) {
        throw new ApiError(404, "User not found")
    }
    const newComment = await Comment.create({
        comment,
        video: new mongoose.Types.ObjectId(videoId),
        owner: user._id
    })

    if(!newComment) {
        throw new ApiError(400, "Something went wrong while creating comment")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            newComment,
            "Comment created Successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {comment} = req.body
    if(comment?.trim() === "") {
        throw new ApiError(400, "Comment text is required")
    }

    const commentToUpdate = await Comment.findById(commentId)
    if(!commentToUpdate) {
        throw new ApiError(404, "Comment not found")
    }
    if(req.user?._id.toString()!== commentToUpdate.owner.toString()) {
        throw new ApiError(401, "You are not authorized to update this comment")
    }
    commentToUpdate.comment = comment
    const updatedComment = await commentToUpdate.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedComment,
            "Comment updated Successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    const commentToDelete = await Comment.findById(commentId)
    if(!commentToDelete) {
        throw new ApiError(404, "Comment not found")
    }
    if(req.user?._id.toString()!== commentToDelete.owner.toString()) {
        throw new ApiError(401, "You are not authorized to delete this comment")
    }

    await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Comment deleted Successfully"
        )
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }