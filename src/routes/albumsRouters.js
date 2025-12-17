import { createAlbum, deleteAlbum, getAlbumById, getAlbums, updateAlbum } from "../controllers/albumsController.js";
import { Router } from "express";
import express from "express"
import { isAdmin, protect } from "../middlwares/auth.js";
import { upload } from "../middlwares/upload.js";


const albumRouter = express.Router();

//public routes
albumRouter.get('/', getAlbums);
albumRouter.get('/:id', getAlbumById);


//private routes: admin safi!
albumRouter.post('/', protect, isAdmin, upload.single('coverImage'), createAlbum);
albumRouter.put('/:id', protect, isAdmin, upload.single('coverImage'), updateAlbum);
albumRouter.delete('/:id', protect, isAdmin, deleteAlbum);

export default albumRouter;