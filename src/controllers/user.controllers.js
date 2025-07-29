import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

    const registerUser = asyncHandler(async (req, res, next) => {
    const {fullName, email, username, password} = req.body;

    // if(fullName?.trim() === ""){
    //     throw new ApiError(400, "Full Name is required");
    // }
    if(
        [fullName, username, email, password].some((field)=> field?.trim() === "")
    ){
        throw new ApiError(400, "Email is required");
    }
    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User with email or username already exists");
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;//localpath from multer
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
      throw new ApiError(400, "Avatar file is required");
    }

    try {
        const user = await User.create({
          fullName,
          avatar: avatar.url,
          coverImage: coverImage?.url || "",
          email,
          password,
          username: username.toLowerCase(),
        });
    
        const createdUser = await User.findById(user._id).select(
          "-password -refreshToken"
        );
    
        if (!createdUser) {
          throw new ApiError(
            500,
            "Something went wrong while registering the user"
          );
        }
    
        return res
          .status(201)
          .json(new ApiResponse(200, createdUser, "User registered Successfully"));
    } catch (error) {
        console.log("user creation failed")
        if(avatar){
            await deleteFromCloudinary(avatar.public_id);
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id);
        }
        throw new ApiError(500, "Something went wrong while registering the user and images were deleted", error);
    }
    })

export { registerUser };