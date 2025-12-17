import express from "express";
import {registerUser, loginUser, getUserProfile, updateUserProfile, toggleLikeSong, toggleFollowArtist, toggleFollowPlaylist} from "../controllers/usersController.js";
import { protect } from "../middlwares/auth.js";
import { upload } from "../middlwares/upload.js";

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/profile', protect, getUserProfile);
userRouter.put('/profile', protect, upload.single("profilePicture"), updateUserProfile);
userRouter.put('/like-song/:id', protect, toggleLikeSong);
userRouter.put('/follow-artist/:id', protect, toggleFollowArtist);
userRouter.put('/follow-playlist/:id', protect, toggleFollowPlaylist);

export default userRouter;
