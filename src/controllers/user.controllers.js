import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

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


const loginUser = asyncHandler(async (req, res, next) => {
 const {email, username, password} = req.body;
if(!email && !username){
    throw new ApiError(400, "Email or username is required");
}
const user = await User.findOne({
    $or: [{ username }, { email }],
});
if (!user) {
    throw new ApiError(404, "User not found");
}
// validate password'
const isPasswordValid = await user.isPasswordCorrect(password);
if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
}

const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);

const loggedInUser = await User.findById(user._id).select(
  "-password -refreshToken"
);

if (!loggedInUser) {
    throw new ApiError(
      500,
      "Something went wrong while logging in the user"
    );
}

const options = {
httpOnly:true,
  secure: process.env.NODE_ENV === "production",
}
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        )
        })

const logoutUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate()
    (req.user._id,
      {
        $set: {
          refreshToken: "",
        }
      },
    {new:true}
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
    return res
      .status(200)
      .clearcookie("accessToken", options)
      .clearcookie("refreshToken", options)
      .json(
        new ApiResponse(
          200,
          {  },
          "User logged out successfully"
        )
      )
})


const refreshAcessToken = asyncHandler(async (req, res, next) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    try{
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET       
        )
    const user = await User.findById(decodedToken?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    if(incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Invalid refresh token");
    }
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }
    const options = {
        httpOnly:true,
        secure: process.env.NODE_ENV === "production",
    }
    const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefereshTokens(user._id);
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: user, accessToken, refreshToken: newRefreshToken },
                "Access Token refreshed successfully"
            )
        )
})
export { registerUser,loginUser,refreshAcessToken,logoutUser };