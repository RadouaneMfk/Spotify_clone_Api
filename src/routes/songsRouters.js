import express from "express";
import { isAdmin, protect } from "../middlwares/auth.js";
import { upload } from "../middlwares/upload.js";
import { createSong, deleteSong, getAllSongs, getNewRealeses, getSongById, getTopSongs, updateSong } from "../controllers/songsController.js";

const songsUpload = upload.fields([
	{name: 'audio', maxCount: 1},
	{name: 'cover', maxCount: 1},
])
const songRouter = express.Router();

//private routers
songRouter.post('/', protect, isAdmin, songsUpload, createSong);
songRouter.put('/:id', protect, isAdmin, songsUpload, updateSong);
songRouter.delete('/:id', protect, isAdmin, deleteSong);

//public routers
songRouter.get('/top', getTopSongs);
songRouter.get('/new-release', getNewRealeses);
songRouter.get('/', getAllSongs);
songRouter.get('/:id', getSongById);

export default songRouter;
