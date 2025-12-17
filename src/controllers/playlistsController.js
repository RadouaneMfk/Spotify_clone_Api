import { StatusCode } from "express-status-code";
import expressAsyncHandler from "express-async-handler";
import Artist from "../models/Artists.js";
import Song from "../models/Songs.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import Playlist from "../models/Playlist.js";
import { Error } from "mongoose";
import User from "../models/Users.js";

export const createPlaylist = expressAsyncHandler(async(req, res) => {
	const {name, description, isPublic} = req.body;

	if (!name || !description)
	{
		res.status(StatusCode.BadRequest);
		throw new Error('name and description are required');
	}
	if (name.length < 3 || name > 50)
	{
		res.status(StatusCode.BadRequest);
		throw new Error('name must be between 3 and 50 characters');
	}
	if (description.length < 10 || description.length > 200)
	{
		res.status(StatusCode.BadRequest);
		throw new Error('description must be between 10 and 200 characters');
	}

	const existingPlaylist = await Playlist.findOne({
		name,
		creator: req.user._id,
	})
	if (existingPlaylist)
		throw new Error('a playlist with this name already exist');
	let coverImageUrl = '';
	if (req.file)
	{
		try {
			const result = await uploadToCloudinary(req.file.path, 'spotify/playlists');
			coverImageUrl = result.secure_url;
		} catch (error) {
			res.status(StatusCode.InternalServerError);
			throw new Error('image uplaod failed');
		}
	}
	const playlist = await Playlist.create({
		name,
		creator: req.user._id,
		description,
		coverImage: coverImageUrl || undefined,
		isPublic: isPublic === 'true',
	})
	return res.status(StatusCode.Created).json(playlist);
});

export const getPlaylists = expressAsyncHandler(async (req, res) => {
	const {search, page = 1 , limit = 10} = req.query;

	const filter = { isPublic: true };
	if (search)
	{
		filter.$or = [
			{name: {$regex: search, $options: 'i'}},
			{description: {$regex: search, $options: 'i'}},
		];
	}

	const count = await Playlist.countDocuments(filter);
	const skip = (parseInt(page - 1) * parseInt(limit));

	const playlists = await Playlist.find(filter).sort({followers: -1})
	.limit(limit).skip(skip).populate("creator", "name profilePicture")
	.populate("collaboraters", "name collaboraters");
	
	return res.status(StatusCode.OK).json({
		playlists,
		page: parseInt(page),
		pages: Math.ceil(count / parseInt(limit)),
		totalPlaylists: count,
	});
})

export const getUserPlaylists = expressAsyncHandler(async (req, res) => {
	const playlists = await Playlist.find({
		$or: [
			{creator: req.user._id},
			{collaboraters: req.user._id},
		]
	}).sort({createdAt: -1}).populate("creator", "name profilePicture")
	.populate("collaboraters", "name profilePicture");

	return res.status(StatusCode.OK).json(playlists);
})

export const getPlaylistById = expressAsyncHandler(async (req, res) => {
	const playlist = await Playlist.findById(req.params.id)
	.populate("creator", "name profilePicture")
	.populate("collaboraters", "name profilePicture");

	if (!playlist)
	{
		res.status(StatusCode.NotFound);
		throw new Error('Playlist not found');
	}
	return res.status(StatusCode.OK).json(playlist);
})

export const updatePlaylist = expressAsyncHandler(async (req, res) => {
	const {name, description, isPublic} = req.body;

	const playlist = await Playlist.findById(req.params.id);
	if (!playlist) {
		res.status(StatusCode.NotFound);
		throw new Error('playlist not found');
	}

	if (
		!playlist.creator.equals(req.user._id) &&
		!playlist.collaboraters.some((collab) => collab.equals(req.user._id))
	) {
		res.status(StatusCode.Unauthorized);
		throw new Error('not authorized to update this playlist');
	}
	playlist.name = name || playlist.name;
	playlist.description = description || playlist.description;
	if (playlist.creator.equals(req.user._id))
	{
		playlist.isPublic = isPublic !== undefined ? isPublic === 'true' : playlist.isPublic;
	}

	if (req.file)
	{
		try {
			const result = await uploadToCloudinary(req.file.path, "spotify/playlists");
			playlist.coverImage = result.secure_url;
		} catch (error) {
			res.status(StatusCode.InternalServerError);
			throw new Error('image uplaod failed');
		}
	}
	const updatedPlaylist = await playlist.save();
	return res.status(StatusCode.OK).json(updatedPlaylist);
})

export const deletePlaylist = expressAsyncHandler(async (req, res) => {
	const playlist = await Playlist.findById(req.params.id);
	if (!playlist)
	{
		res.status(StatusCode.NotFound);
		throw new Error('playlist not found');
	}
	if (!playlist.creator.equals(req.user._id))
	{
		res.status(StatusCode.Forbidden);
		throw new Error('Not allowed to remove this playlist!');
	}
	await playlist.deleteOne();
	return res.status(StatusCode.OK).json({
		message: 'Playlist removed successfully',
	})
})

export const addSongsToPlaylist = expressAsyncHandler(async (req, res) => {
	const {songsIds} = req.body;

	const playlist = await Playlist.findById(req.params.id);
	if (!playlist)
	{
		res.status(StatusCode.NotFound);
		throw new Error('Playlist not found');
	}
	if (!songsIds || !Array.isArray(songsIds))
	{
		res.status(StatusCode.BadRequest);
		throw new Error('songs Ids are required!');
	}

	if (!playlist.creator.equals(req.user._id) && 
		!playlist.collaboraters.some((collab) => collab.equals(req.user._id)))
		{
			res.status(StatusCode.Forbidden);
			throw new Error('not allowed to modify this playlist!');
		}
	for (const songId of songsIds)
	{
		const song = await Song.findById(songId);
		if (!song)
			continue ;
		if (playlist.Songs.includes(songId))
			continue ;
		playlist.Songs.push(songId);
	}
	await playlist.save();
	return res.status(StatusCode.OK).json(playlist);
})

export const deleteSongFromPlaylist = expressAsyncHandler(async (req, res) => {
	const song = await Song.findById(req.params.songId);
	const playlist = await Playlist.findById(req.params.id);

	if (!song)
	{
		res.status(StatusCode.NotFound);
		throw new Error('song not found!');
	}
	if (!playlist)
	{
		res.status(StatusCode.NotFound);
		throw new Error('playlist not found!');
	}
	if (!playlist.creator.equals(req.user._id) && 
		!playlist.collaboraters.some((collab) => collab.equals(req.user._id))
	) {
		res.status(StatusCode.Forbidden);
		throw new Error('not allowed to modify this playlist!');
	}
	if (!playlist.Songs.includes(req.params.songId))
	{
		res.status(StatusCode.BadRequest);
		throw new Error('song is not in the playlist!');
	}
	playlist.Songs = playlist.Songs.filter((id) => (id.toString()) !== req.params.songId);
	await playlist.save();
	return res.status(StatusCode.OK).json(playlist);
})

export const addCollaborater = expressAsyncHandler(async (req, res) => {
	const {collabIds} = req.body;

	if (!collabIds || !Array.isArray(collabIds))
	{
		res.status(StatusCode.BadRequest);
		throw new Error('collaboraters ids are required');
	}
	const playlist = await Playlist.findById(req.params.id);
	if (!playlist)
	{
		res.status(StatusCode.NotFound);
		throw new Error('playlist not found!');
	}
	if (!playlist.creator.equals(req.user._id)) {
		res.status(StatusCode.Forbidden);
		throw new Error('only creator can add collaborators!');
	}
	for (const collabId of collabIds)
	{
		const collab = await User.findById(collabId);
		if (!collab)
			continue ;
		if (playlist.collaboraters.includes(collabId))
			continue ;
		playlist.collaboraters.push(collabId);
	}
	await playlist.save();
	return res.status(StatusCode.OK).json({
		playlist,
		message: 'Collaborater added',
	});
})

export const removeCollaborator = expressAsyncHandler(async (req, res) => {
	const {userId} = req.body;

	const user = await User.findById(userId);
	const playlist = await Playlist.findById(req.params.id);
	if (!user)
	{
		res.status(StatusCode.NotFound);
		throw new Error('User not found!');
	}
	if (!playlist)
	{
		res.status(StatusCode.NotFound);
		throw new Error('Playlist not found!');
	}
	if (!playlist.creator.equals(req.user._id))
	{
		res.status(StatusCode.Forbidden);
		throw new Error('only creator can remove collaborators');
	}
	if (!playlist.collaboraters.includes(userId))
	{
		res.status(StatusCode.BadRequest);
		throw new Error('User is not a collaborator');
	}
	playlist.collaboraters = playlist.collaboraters.filter((id) => (id.toString()) !== userId);
	await playlist.save();
	res.status(StatusCode.OK).json({
		playlist,
		message: 'Collaborater removed',
	});
})

export const getFeaturedPlaylists = expressAsyncHandler(async (req, res) => {
	const { limit = 10 , page = 1} = req.query;
	
	const skip = parseInt(page - 1) * parseInt(limit);
	const count = await Playlist.countDocuments({isPublic: true});
	const playlist = await Playlist.find({isPublic: true}).limit(parseInt(limit))
	.populate("creator", "name profilePicture").sort({followers: -1}).skip(skip);
	
	res.status(StatusCode.OK).json({
		playlist,
		page: parseInt(page),
		pages: Math.ceil(parseInt(count) / parseInt(limit)),
	})
})
