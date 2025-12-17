import { Router } from "express";
import express from "express"
import { isAdmin, protect } from "../middlwares/auth.js";
import { upload } from "../middlwares/upload.js";
import { addCollaborater, addSongsToPlaylist, createPlaylist, deletePlaylist, deleteSongFromPlaylist, getFeaturedPlaylists, getPlaylistById, getPlaylists, getUserPlaylists, removeCollaborator, updatePlaylist } from "../controllers/playlistsController.js";
const playlistRouter = express.Router();


// private routers: admin safi !
playlistRouter.post('/', protect, isAdmin, upload.single("coverImage"), createPlaylist);

//public routers
playlistRouter.get('/user/me', protect, getUserPlaylists);
playlistRouter.get('/featured', getFeaturedPlaylists);
playlistRouter.post('/:id/add-songs', protect, addSongsToPlaylist);
playlistRouter.post('/:id/add-collaborator', protect, addCollaborater);
playlistRouter.put('/:id/remove-songs/:songId', protect, deleteSongFromPlaylist);
playlistRouter.put('/:id/remove-collaborator', protect, removeCollaborator);
playlistRouter.delete('/:id', protect, deletePlaylist);
playlistRouter.get('/', getPlaylists);
playlistRouter.get('/:id', getPlaylistById);
playlistRouter.put('/:id', protect, upload.single("coverImage"), updatePlaylist);

export default playlistRouter;
