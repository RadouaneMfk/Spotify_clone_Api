import express from "express";
import { isAdmin, protect } from "../middlwares/auth.js";
import { upload } from "../middlwares/upload.js";
import { createArtist, deleteArtist, getArtistByID, getArtistTopSongs, getArtists, getTopArtists, updateArtist } from "../controllers/artistsController.js";

const artistRouter = express.Router();

artistRouter.post('/', protect, isAdmin, upload.single("image"), createArtist);
artistRouter.get('/', getArtists);
artistRouter.get('/top', getTopArtists);

artistRouter.get('/:id/top-songs', getArtistTopSongs);
artistRouter.get('/:id', getArtistByID);
artistRouter.put('/:id', protect, isAdmin, upload.single("image"), updateArtist);
artistRouter.delete('/:id', protect, isAdmin, deleteArtist);

export default artistRouter;
