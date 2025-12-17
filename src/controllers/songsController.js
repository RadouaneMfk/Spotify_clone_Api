import expressAsyncHandler from "express-async-handler";
import { StatusCode } from "express-status-code";
import Album from "../models/Albums.js";
import Artist from "../models/Artists.js";
import Song from "../models/Songs.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { Error } from "mongoose";

export const createSong = expressAsyncHandler(async (req, res) => {
	const {
		title,
		artistId,
		albumId,
		duration,
		genre,
		lyrics,
		isExplicit,
		featuredArtists,
	} = req.body;

	const artist = await Artist.findById(artistId);
	if (!artist) {
		res.status(StatusCode.NotFound);
		throw new Error('Artist not found');
	}

	if (albumId)
	{
		const album = await Album.findById(albumId);
		if (!album)
		{
			res.status(StatusCode.NotFound);
			throw new Error('Album not found');
		}
	}
	if (!req.files || !req.files.audio)
	{
		res.status(StatusCode.BadRequest);
		throw new Error('audio file is required');
	}
	let audioResult = "";
	try {
		audioResult = await uploadToCloudinary(req.files.audio[0].path, 'spotify/songs');
	} catch (error) {
		res.status(StatusCode.InternalServerError);
		throw new Error('audio upload failed');
	}
	let coverImageUrl = "";
	if (req.files && req.files.cover)
	{
		try {
			const imageResult = await uploadToCloudinary
				(req.files.cover[0].path, "spotify/covers");
			coverImageUrl = imageResult.secure_url;
		} catch (error) {
			res.status(StatusCode.InternalServerError);
			throw new Error('image upload failed');
		}
	}

	const song = await Song.create({
		title,
		artist: artistId,
		album: albumId || null,
		duration,
		genre,
		audioUrl: audioResult.secure_url,
		coverImage: coverImageUrl,
		lyrics,
		isExplicit: isExplicit === 'true',
		featuredArtists: featuredArtists ? JSON.parse(featuredArtists) : [],
	});

	artist.Songs.push(song._id);
	await artist.save();
	if (albumId)
	{
		const album = await Album.findById(albumId);
		album.Songs.push(song._id);
		await album.save();
	}
	return res.status(StatusCode.Created).json(song);
})

export const getAllSongs = expressAsyncHandler(async (req, res) => {
	const {genre, artist, search,  page = 1, limit = 10} = req.query;

	const filter = {};

	if (genre)
		filter.genre = genre.toLocaleLowerCase();
	if (artist)
		filter.artist = artist.toLocaleLowerCase();
	if (search)
	{
		filter.$or = [
			{title: {$regex: search, $options: 'i'}},
			{genre: {$regex: search, $options: 'i'}},
		];
	}
	const count = await Song.countDocuments(filter);
	const skip = (parseInt(page - 1) * parseInt(limit));

	const songs = await Song.find(filter)
	.sort({releasedDate: -1}).limit(parseInt(limit))
	.skip(skip).populate("artist", "name image").populate("album", "title coverImage")
	.populate("featuredArtists", "name");

	res.status(StatusCode.OK).json({
		songs,
		page: parseInt(page),
		pages: Math.ceil(count / parseInt(limit)),
		totalSongs: count,
	})
})

export const getSongById = expressAsyncHandler(async (req, res) => {
	const song = await Song.findById(req.params.id).populate("artist", "name image")
	.populate("album", "title coverImage").populate("featuredArtists", "name");

	if (song) {
		song.plays++;
		await song.save();
		return res.status(StatusCode.OK).json(song);
	} else {
		res.status(StatusCode.NotFound);
		throw new Error('song not found');
	}
})

export const updateSong = expressAsyncHandler(async (req, res) => {
	const {
		title,
		artistId,
		albumId,
		duration,
		genre,
		lyrics,
		isExplicit,
		featuredArtists,
	} = req.body;
	
	const song = await Song.findById(req.params.id);
	if (!song) {
		res.status(StatusCode.NotFound);
		throw new Error('song not found');
	}
	song.title = title || song.title;
	song.artist = artistId || song.artist;
	song.album = albumId || song.album;
	song.duration = duration || song.duration;
	song.genre = genre || song.genre;
	song.lyrics = lyrics || song.lyrics;
	song.isExplicit = isExplicit !== undefined ? isExplicit === 'true' : song.isExplicit;
	song.featuredArtists = featuredArtists ? JSON.parse(featuredArtists) : song.featuredArtists;

	if (req.files && req.files.cover) {
		try {
			const imageResult = await uploadToCloudinary(req.files.cover[0].path, "spotify/covers");
			song.coverImage = imageResult.secure_url;
		} catch (error) {
			res.status(StatusCode.InternalServerError);
			throw new Error('image upload failed');
		}
	}
	if (req.files && req.files.audio) {
		try {
			const audioResult = await uploadToCloudinary(req.files.audio[0].path, "spotify/songs");
			song.audioUrl = audioResult.secure_url;
		} catch (error) {
			res.status(StatusCode.InternalServerError);
			throw new Error('audio upload failed');
		}
	}

	const updatedSong = await song.save();
	return res.status(StatusCode.OK).json(updatedSong);
})

export const deleteSong = expressAsyncHandler(async (req, res) => {
	const song = await Song.findById(req.params.id);
	if (!song)
	{
		res.status(StatusCode.NotFound);
		throw new Error('song not found');
	}
	await Artist.updateOne({_id: song.artist}, { $pull : {Songs: song._id}});
	if (song.album)
		await Album.updateOne({_id: song.album} , {$pull : {Songs: song._id}});
	await song.deleteOne();
	return res.status(StatusCode.OK).json({
		message: 'song removed',
	})
})

export const getTopSongs = expressAsyncHandler(async(req, res) => {
	const {limit = 10, page = 1} = req.query;

	const skip = (parseInt(page - 1) * parseInt(limit));
	const count = await Song.countDocuments();
	const songs = await Song.find().sort({plays: -1}).limit(limit).skip(skip)
	.populate("artist", "name image").populate("album", "title coverImage");

	return res.status(StatusCode.OK).json({
		songs,
		page: parseInt(page),
		pages: Math.ceil(parseInt(count) / parseInt(limit)),
	}
	);
})

export const getNewRealeses = expressAsyncHandler(async(req, res) => {
	const {limit = 10, page = 1} = req.query;

	const skip = (parseInt(page - 1) * parseInt(limit));
	const count = await Song.countDocuments();
	const songs = await Song.find().sort({createdAt: -1}).limit(limit).skip(skip)
	.populate("artist", "name image").populate("album", "title coverImage");

	return res.status(StatusCode.OK).json({
		songs,
		page: parseInt(page),
		pages: Math.ceil(parseInt(count) / parseInt(limit)),
	}
	);
})
