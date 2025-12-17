import { StatusCode } from "express-status-code";
import expressAsyncHandler from "express-async-handler";
import Album from "../models/Albums.js";
import Artist from "../models/Artists.js";
import Song from "../models/Songs.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

export const createAlbum = expressAsyncHandler(async (req, res) => {
	if (!Object.keys(req.body).length)
	{
		res.status(StatusCode.BadRequest);
		throw new Error('req body is required!');
	}

	const {title, artistId, releasedDate, genre, description, coverImage, isExplicit} = req.body;

	if (!title || !artistId || !genre || !description)
	{
		res.status(StatusCode.BadRequest);
		throw new Error('title, artistId, genre and description are required!');
	}

	if (title.length < 3 || title.length > 50)
	{
		res.status(StatusCode.BadRequest);
		throw new Error('title must be between 3 and 50 characters!');
	}
	if (description.length < 10 || description.length > 200)
	{
		res.status(StatusCode.BadRequest);
		throw new Error('description must be between 10 and 200 characters!');
	}

	const artist = await Artist.findById(artistId);

	if (!artist) 
	{
		res.status(StatusCode.NotFound);
		throw new Error('Artist not found!');
	}

	const albumExist = await Album.findOne({title});

	if (albumExist)
	{
		res.status(StatusCode.Conflict);
		throw new Error('album already exist!');
	}

	let coverImageUrl = "";
	if (req.file)
	{
		try {
			const result = await uploadToCloudinary(req.file.path, 'spotify/albums');
			coverImageUrl = result.secure_url;
		} catch (error) {
			res.status(StatusCode.InternalServerError);
			throw new Error('upload failed!');
		}
	}

	const album = await Album.create({
		title,
		artist: artist._id,
		description: description,
		releasedDate: releasedDate ? new Date(releasedDate) : Date.now(),
		genre: genre,
		coverImage: coverImageUrl,
		isExplicit: isExplicit === 'true',
	})
	artist.Albums.push(album._id);
	await artist.save();
	return res.status(StatusCode.Created).json(album);
})

export const getAlbums = expressAsyncHandler(async (req, res) => {
	const {genre, artist, search,  page = 1, limit = 10} = req.query;

	const filter = {};

	if (genre)
		filter.genre = genre;
	if (artist)
		filter.artist = artist;
	if (search)
	{
		filter.$or = [
			{title: {$regex: search, $options: 'i'}},
			{genre: {$regex: search, $options: 'i'}},
			{description: {$regex: search, $options: 'i'}},
		];
	}
	const count = await Album.countDocuments(filter);
	const skip = (parseInt(page - 1) * parseInt(limit));

	const albums = await Album.find(filter)
	.sort({releasedDate: -1}).limit(parseInt(limit))
	.skip(skip).populate("artist", "name image");

	res.status(StatusCode.OK).json({
		albums,
		page: parseInt(page),
		pages: Math.ceil(count / parseInt(limit)),
		totalAlbums: count,
	})
})

export const getAlbumById = expressAsyncHandler(async (req, res) => {
	const album = await Album.findById(req.params.id).populate("artist", "name image");

	if (album)
		res.status(StatusCode.OK).json(album);
	else {
		res.status(StatusCode.NotFound);
		throw new Error('Artist not found!');
	}
})

export const updateAlbum = expressAsyncHandler(async (req, res) => {
	const {title, releasedDate, genre, description, isExplicit} = req.body;

	const album = await Album.findById(req.params.id);

	if (!album)
	{
		res.status(StatusCode.NotFound);
		throw new Error('Album not found!');
	}

	album.title = title || album.title;
	album.releasedDate = releasedDate || album.releasedDate;
	album.genre = genre || album.genre;
	album.description = description || album.description;
	album.isExplicit = isExplicit !== undefined ? isExplicit === 'true' : album.isExplicit;

	if (req.file)
	{
		try {
			const result = await uploadToCloudinary(req.file.path, "spotify/albums");
			album.coverImage = result.secure_url;
		} catch (error) {
			res.status(StatusCode.InternalServerError);
			throw new Error('image upload failed!');
		}
	}

	const updatedAlbum = await album.save();
	res.status(StatusCode.OK).json(updatedAlbum);
})

export const deleteAlbum = expressAsyncHandler(async (req, res) => {
	const album = await Album.findById(req.params.id);

	if (!album)
	{
		res.status(StatusCode.NotFound);
		throw new Error('Album not found');
	}

	await Artist.updateOne(
		{_id: album.artist},
		{$pull: {Albums: album._id}},
	);

	await Song.updateMany(
		{album: album._id},
		{$unset: {album: 1}},
	);

	await album.deleteOne();
	return res.status(StatusCode.OK).json({
		message: 'Album deleted successfully',
	})
})
