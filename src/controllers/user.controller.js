import { asyncHandler } from "../utils/asyncHandler.js";
import { Apiresponse } from "../utils/apiresponse.js"
import { apierror } from "../utils/apierror.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

import {User} from "../models/user.model.js"

import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessAndRefreshToken = async (userId) => {

  try {
    const user = await User.findById(userId )
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})

    return {accessToken , refreshToken}
    
  } catch (error) {
    throw new apierror(500, "problem during tokens")
  }
}


const registerUser = asyncHandler ( async (req , res) => {

  const {username, fullname, email, password}  =  req.body
   
   if (
    [fullname, email, username, password].some((field) => field?.trim() == "")
   ) {
    throw new apierror(400,"all fields are required")
   }

   const existedUser = await User.findOne({
    $or: [{ username },{ email }]
   })

   if (existedUser) {
    throw new apierror(409, "username or email already exist")
   }

  const avatarLocalPath = req.files?.avatar?.[0]?.path
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path

   if(!avatarLocalPath) {
    throw new apierror(400,"avatar file is required")
   }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar) {
    throw new apierror(400,"avatar upload failed")
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email, 
    password,
    username
  })

const createdUser = await  User.findById(user._id).select(
    "-password -refreshToken"
)

if (!createdUser) {
    throw new apierror(500, "problem during registering user")
}

return res.status(201).json(
    new Apiresponse(200, createdUser, "User registered successfully")
)

    
})

const loginUser = asyncHandler( async (req, res) => {

  const {username,email, password} = req.body

  if (!username && !email ) {
    throw new apierror(400, "username or email is required")
  }
  
  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new apierror(404, "user doesnt exist in our db")
  }

  const isPasswordValid = await user.isPasswordCorrect (password)
    if (!isPasswordValid) {
    throw new apierror(401, "incorrect password")
    }

const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

const loggedInUser = await User.findById(user._id)
.select("-password -refreshToken")

const options = {
  httpOnly : true,
  secure : false
}

return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken , options)
.json (
  new Apiresponse(
    200,
    {
      user : loggedInUser, accessToken,
      refreshToken 
    },
    "user logged in successfully"
  )
)
})


const logOutUser = asyncHandler (async (req,res) => {

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined
        }
      },{
        new: true
      }
    )
    const options = {
      httpOnly: true,
      secure : false
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new Apiresponse(200, {}, "user logged out"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new apierror(401, "unauthorized request")
  }

try {
  const decodedToken =  jwt.verify (
      incomRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    ) 
  
    const user = await User.findById(decodedToken?._id)
  
    if (!user) {
      throw new apierror(401, "invalid refersh token")
    }
  
    if (incomRefreshToken !== user?.refreshToken) {
      throw new apierror(401, "refresh token expired ")
    }
  
  
    const options = {
      httpOnly: true,
      secure : true
    }
  
    const {accessToken , newRefreshToken } = await generateAccessAndRefreshToken(user._id)
  
    return res 
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken , options)
    .json(
      new Apiresponse (200, {accessToken, refershToken: newRefreshToken}, 
        "accesstoken refershed"
      )
    )
} 
catch (error) {
  throw new apierror(401, error?.message || "invalid refersh token ")
  
}

})

const changeCurrentPassword = asyncHandler(async(req, res)=> {
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new apierror(400, "invalid old password")
  }
  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json (new Apiresponse(200, {}, "password changed succesfully"))


  
})

const getCurrentUser = asyncHandler(async(req, res) => {
  return res
  .status(200)
  .json(200, req.user, "current user fetched")
})

const updateUserDetails = asyncHandler(async(req, res)=> {

  const {fullname, email} =req.body 

  if (!fullname || !email) {
    throw new apierror(400, "both fields required")
  }

  const user = await User.findByIdAndDelete(
    req.user?._id,
    {
       $set: {
        fullname : fullname,
        email : email
       }
    },
    {new : true}
  ).select("-password")

  return res 
  .status(200)
  .json(new Apiresponse(200, user, "user updated with new details"))
})

const updateAvatar = asyncHandler(async(req, res)=> {

  const avatarLocalPath = req.file?.path 

  if (!avatarLocalPath) {
    throw new apierror(400, "avatar image is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new apierror(400, "error while uploading")
  }

 const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url
      }
    }, 
    {new:true}
  ).select("-password")

     return res
    .status(200)
    .json( new Apiresponse(200, user , "avatar image updated successfully"))
})

const updateCover = asyncHandler(async(req, res)=> {

  const coverLocalPath = req.file?.path 

  if (!coverLocalPath) {
    throw new apierror(400, "cover image is missing")
  }

  const coverImage = await uploadOnCloudinary(coverLocalPath)

  if (!coverImage.url) {
    throw new apierror(400, "error while uploading")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage.url
      }
    }, 
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json( new Apiresponse(200, user , "cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req,res) => {

  const {username} = req.params

  if (!username?.trim()) {
    throw new apierror(400, "username is missing")
  }

 const channel =  await User.aggregate([
  {
    $match: {
      username: username?.toLowerCase()
    }
  },
  {
    $lookup: {
      from:"subscriptions",
      localField:"_id",
      foreignField:"channel",
      as:"subscribers"
    }
  },
  {
    $lookup:{
      from:"subsciptions",
      localField:"_id",
      foreignField:"subscriber",
      as: "sunscribedTo"
    }
  },
  {
    $addFields:{
      subscribersCount:{
        $size:"$subscribers"
      },
      channelSubscribedToCount:{
        $size: "subscribedTo"
        },
        isSubscribed:{
          $cond: {
            if : {$in:[req.user?._id,"$subscribers.subscriber"]},
            then : true,
            else :false
          }
        }
     }
   },
   {
    $project: {
      fullname:1,
      username:1,
      subscribersCount:1,
      channelSubscribedToCount:1,
      isSubscribed:1,
      avatar:1,
      coverImage:1,
      email:1
    }
   }
 ])
 if (!channel?.length) {
  throw new apierror("channel doesnt exist")
 }

 return res
 .status(200)
 .json(
  new Apiresponse(200, channel[0],"user channel fetched succesfully")
 )
})

const watchHistory = asyncHandler(async(req,res) => {

  const user  = await User.aggregate([

    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullname:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])
  return res
  .status(200)
  .json(
    new Apiresponse(200, user[0].watchHistory,"watch history fetched")
  )
})






export { 

  registerUser, loginUser , logOutUser, 
  refreshAccessToken, 
  changeCurrentPassword, 
  getCurrentUser,
  updateUserDetails, updateAvatar, updateCover, 
  getUserChannelProfile ,
  watchHistory

 }