import { asyncHandler } from "../utils/asyncHandler.js";
import { apierror } from "../utils/apierror.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Apiresponse } from "../utils/apiresponse.js"


const registerUser = asyncHandler ( async (req , res) => {
   const {username, fullname, email, password}  =  req.body
   
   //checking if all fields are used
   if (
    [fullname, email, username, password].some((field) => field?.trim() == "")
   ) {
    throw new apierror(400,"all fields are required")
   }

// check if email or username already used 
   const existedUser = await User.findOne({
    $or: [{ username },{ email }]
   })

   if (existedUser) {
    throw new apierror(409, "username or email already exist")
   }

   const avataraLocalPath = req.files?.avatar[0]?.path 
   const coverImageLocalPath = req.files?.coverImage[0]?.path

   if(!avatarLocalPath) {
    throw new apierror(400,"avatar file is required")
   }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar) {
    throw new apierror(400,"avatar file is required")
  }

  const user = await User.create({
    fullname,
    avatar: avatra.url,
    coverImage: coverImage?.url || "",
    email, 
    password,
    username: username.toLowerCase()
  })

const createdUser = await  User.findById(user._id).select(
    "-password -refreshToken"
)

if (!createdUser) {
    throw new apierror(500, "problem during registering user")
}

return res.status(201).json(
    new apiresponse(200, createdUser, "User registered successfully")
)

    
})


export { registerUser }