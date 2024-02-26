import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import { upload } from '../middlewares/multer.middleware.js'


const createAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findOne({userId})
        const refreshToken = await user.generateRefreshToken();
        const accessToken = await user.generateAccessToken();

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false});

        return {refreshToken, accessToken}
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while creating tokens")
    }
}



const registerUser = asyncHandler(async (req, res) => {
   //get detail of user from frontend
   //validation - not empty
   // check if user already exists: username, email
   // check for images, check for avatar
   //upload them to cloudinary, avatar
   // create user object - create entry in db
   // remove password and refresh token field from response
   // check for user creation
   // return response


   const {fullName, email, password, username} = req.body
   //console.log("fullName: ", fullName);

   if(
    [fullName, email, password, username].some((field) => field?.trim() === "")
   ){
    throw new ApiError(400, "All fields are required")
   }

   const existedUser = await User.findOne({
    $or: [{email}, {username}]
   })

   if(existedUser) {
    throw new ApiError(409, "User with email or username already exists")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path
   
   let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

   if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is requried")
   }

   const avatar =  await uploadOnCloudinary(avatarLocalPath)  
   //console.log(avatar)  
   const coverImage =  await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar) {
    throw new ApiError(400, "Avatar file is required")
   }

   const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password
   })

   const createdUser = await User.findById(user._id).select("-password -refreshToken")

   if(!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
   }

   return res.status(201).json(
    new ApiResponse(200, createdUser, "User created successfully")
   )

})

const loginUser = asyncHandler(async (req, res) => {
    // req body => get username or email from user and password
    // check username or email and password is available
    // find the user
    // if password incorrect return invalid credentials
    // create new access token and refresh token
    //send  cookies

    const {email, username, password} = req.body;

    if(!email || !username) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or:[{email}, {username}]
        
    })

    if(!user) {
        throw new ApiError(404, "user doesn't exists")
    };

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user Credentials")
    }

    const {accessToken, refreshToken} = createAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
        )  
    )

})

const logoutUser = asyncHandler(async(req, res) => {

    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined 
        }
    })

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200,
            {},
            "user logout")
    )

})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)
        
        if(!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, refreshToken} = await createAccessAndRefreshToken(user._id);

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken,
                refreshToken},
                "AccessToken refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, "Invalid refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {currentPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)
    const isPasswordValid = await user.isPasswordCorrect(currentPassword);
    if(!isPasswordValid) {
        throw new ApiError(400, "Invalid current password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})
    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body;

    if(!fullName || !email) {
        throw new ApiError(400, "fullName or email is required")
    }

    const user = await User.findByIdAndUpdate(req.user._id, 
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User details updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url) {
        throw new ApiError(500, "Something went wrong while uploading the avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    )
    return res.status(200).json(
        new ApiResponse(200, user, "Avatar updated successfully")
    ).select("-password -refreshToken")
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath) {
        throw new ApiError(400, "CoverImage file is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url) {
        throw new ApiError(500, "Something went wrong while uploading the coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    )
    return res.status(200).json(
        new ApiResponse(200, user, "coverImage updated successfully")
    ).select("-password -refreshToken")
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params

    if(!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.trim().toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [
                                req.user?._id,
                                "$subscribers.subscriber"
                            ]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404, "Channel not found")
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], "Channel fetched successfully")
    )
})

export {registerUser,
loginUser,
logoutUser,
refreshAccessToken,
changeCurrentPassword,
getCurrentUser,
updateAccountDetails,
updateUserAvatar,
updateUserCoverImage,
getUserChannelProfile}