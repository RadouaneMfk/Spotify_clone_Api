import expressAsyncHandler from "express-async-handler";
import { StatusCode } from "express-status-code";
import Album from "../models/Albums.js";
import Artist from "../models/Artists.js";
import Song from "../models/Songs.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

export const createArtist = expressAsyncHandler(async(req, res) => {
	if (!req.body)
		return res.status(StatusCode.BadRequest).json({
			message: 'req body is required!',
	})

	const {name, bio, genres} = req.body;

	if (!name || !bio || !genres)
		return res.status(StatusCode.BadRequest).json({
			message: 'name, bio, genres are required!',
	})
	
	const existArtist = await Artist.findOne({name});
	if (existArtist)
	return res.status(StatusCode.BadRequest).json({
			message: 'artist already exist!',
	})

	let imageUrl = "";

	if (req.file)
	{
		const result = await uploadToCloudinary(req.file.path, "spotify/artists");
		imageUrl = result.secure_url;
	}

	const artist = await Artist.create({
		name,
		bio,
		genres,
		isVerified: true,
		image: imageUrl,
	})

	res.status(StatusCode.Created).json(artist);
})

export const getArtists = expressAsyncHandler(async(req, res) => {
	const {genre, search, page = 1, limit = 10} = req.query;

	const filter = {};
	if (genre)
		filter.genres = {$in:[genre]};
	if (search)
	{
		filter.$or = [
			{ name: {$regex: search, $options: 'i'} },
			{ bio: {$regex: search, $options: 'i'} },
		];
	}
	const count = await Artist.countDocuments(filter);

	const skip = (parseInt(page - 1) * parseInt(limit));

	const artist = await Artist.find(filter)
	.sort({followers: -1})
	.limit(parseInt(limit))
	.skip(skip);

	res.status(StatusCode.OK).json({
		artist,
		page: parseInt(page),
		pages: Math.ceil(count / parseInt(limit)),
		totalArtists: count,
	})
})

export const getArtistByID = expressAsyncHandler(async(req, res) => {
	const artist = await Artist.findById(req.params.id);

	if (artist)
	{
		return res.status(StatusCode.OK).json({
			artist,
		})
	}
	else
		return res.status(StatusCode.NotFound).json({
			message: 'artist not found',
		})
})

export const updateArtist = expressAsyncHandler(async(req, res) => {
	const {name, bio, genres, isVerified} = req.body;

	const artist = await Artist.findById(req.params.id);

	if (!artist)
		return res.status(StatusCode.NotFound).json({
			message: 'Artist not found!',
	})

	artist.name = name || artist.name;
	artist.bio = bio || artist.bio;
	artist.genres = genres || artist.genres;
	artist.isVerified = isVerified !== undefined ? isVerified === 'true' : artist.isVerified;

	if (req.file)
	{
		try {
			const result = await uploadToCloudinary(req.file.path, 'spotify/artists');
			artist.image = result.secure_url;
		} catch (error) {
			return res.status(StatusCode.InternalServerError).json({
				message: 'image uplaod failed!',
			})
		}
	}

	const updatedArtist = await artist.save();

	res.status(StatusCode.OK).json(updatedArtist);
})

export const deleteArtist = expressAsyncHandler(async(req, res) => {
	const artist = await Artist.findById(req.params.id);

	if (!artist)
	{
		res.status(StatusCode.NotFound);
		throw new Error('artist not found');
	}

	await Song.deleteMany({id : req.params.id});
	await Album.deleteMany({id : req.params.id});
	await artist.deleteOne();
	return res.status(StatusCode.OK).json({
		message: 'artist deleted successfully',
	})
})

export const getTopArtists = expressAsyncHandler(async(req, res) => {
	const { limit = 10 } = req.query;

	const artists = await Artist.find().sort({followers: -1}).limit(parseInt(limit));

	res.status(StatusCode.OK).json(artists);
})

export const getArtistTopSongs = expressAsyncHandler(async (req, res) => {
	const {limit = 10} = req.query;

	const songs = await Song.find().sort({plays: -1}).limit(parseInt(limit))
	.populate("title", "album coverImage");
	if (songs.length > 0)
		res.status(StatusCode.OK).json(songs);
	else
	{
		res.status(StatusCode.NotFound);
		throw new Error('no songs found for this artist!');
	}
})
