import expressAsyncHandler from "express-async-handler";
import { StatusCode } from "express-status-code";
import User from "../models/Users.js";
import { generateToken } from "../utils/generateToken.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import Song from "../models/Songs.js";
import Artist from "../models/Artists.js";
import Playlist from "../models/Playlist.js";

export const registerUser = expressAsyncHandler(async (req, res) => {
	const {name, email, password} = req.body;

	if (!name || !email || !password)
		return res.status(StatusCode.BadRequest).json({
			message: "all fields are required",
	})

	const userExist = await User.findOne({email});
	if (userExist)
		return res.status(StatusCode.BadRequest).json({
			message: "User already exist",
	})

	const user = await User.create({
		name,
		email,
		password,
	});
	if (user)
		res.status(StatusCode.Created).json({
		_id: user._id,
		name: user.name,
		email: user.email,
		isAdmin: user.isAdmin,
		profilePicture: user.profilePicture,
	})
	else
		res.status(StatusCode.BadRequest).json({
			message: "Invalid user data!",
		});
})

export const loginUser = expressAsyncHandler(async (req, res) => {
	const {email, password} = req.body;

	if (!email || !password)
		return res.status(StatusCode.BadGateway).json({
			message: 'all feilds are required!',
	})

	const user = await User.findOne({email});

	if (user && (await user.matchPassword(password)))
	{
		res.status(StatusCode.OK).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			isAdmin: user.isAdmin,
			profilePicture: user.profilePicture,
			token: generateToken(user._id),
		})
	}
	else
		return res.status(StatusCode.Unauthorized).json({
			message: 'Invalid email or password',
	})
})

export const getUserProfile = expressAsyncHandler(async (req, res) => {
	const user = await User.findById(req.user._id).select("-password");
	if (user)
		return res.status(StatusCode.OK).json(user);
	else
		return res.status(StatusCode.NotFound).json({
			message: "User not found",
		})
})

export const updateUserProfile = expressAsyncHandler(async (req, res) => {
	const user = await User.findById(req.user._id);

	if (!user)
		return res.status(StatusCode.NotFound).json({
			message: 'User not found!',
	})
	const {name, email, password} = req.body;
	user.name = name || user.name;
	user.email = email || user.email;
	if (password)
		user.password = password;
	if (req.file)
	{
		try {
			const result = await uploadToCloudinary(req.file.path, "spotify/users");
			user.profilePicture = result.secure_url;
		} catch (error) {
			return res.status(StatusCode.InternalServerError).json({
				message: 'image upload failed!',
			})
		}
	}
	const updatedProfile = await user.save();
	res.status(StatusCode.OK).json({
		_id: updatedProfile._id,
		name: updatedProfile.name,
		email: updatedProfile.email,
		profilePicture: updatedProfile.profilePicture,
		isAdmin: updatedProfile.isAdmin,
	})
})

export const toggleLikeSong = expressAsyncHandler(async (req, res) => {
	const songId = req.params.id;

	const song = await Song.findById(songId);
	if (!song)
	{
		res.status(StatusCode.NotFound);
		throw new Error('song not found');
	}
	const user = await User.findById(req.user._id);
	if (!user)
	{
		res.status(StatusCode.NotFound);
		throw new Error('user not found');
	}
	const likeIndex = user.likedSongs.indexOf(songId);
	if (likeIndex === -1) {
		user.likedSongs.push(songId);
		song.likes++;
	} else {
		user.likedSongs.splice(likeIndex, 1);
		if (song.likes > 0)
			song.likes--;
	}
	await user.save();
	await song.save();
	return res.status(StatusCode.OK).json({
		likedSongs: user.likedSongs,
		message: likeIndex === -1 ? 'song liked' : 'song unliked',
	})
})

export const toggleFollowArtist = expressAsyncHandler(async (req, res) => {
	const artistId = req.params.id;

	const artist = await Artist.findById(artistId);
	const user = await User.findById(req.user._id);
	if (!artist)
	{
		res.status(StatusCode.NotFound);
		throw new Error('Artist not found');
	}
	if (!user)
	{
		res.status(StatusCode.NotFound);
		throw new Error('User not found');
	}
	const followIndex = user.followedArtists.indexOf(artistId);
	if (followIndex === -1)
	{
		user.followedArtists.push(artistId);
		artist.followers++;
	}
	else
	{
		user.followedArtists.splice(followIndex, 1);
		if (artist.followers > 0)
			artist.followers--;
	}
	await Promise.all([user.save(), artist.save()]);
	return res.status(StatusCode.OK).json({
		followedArtists: user.followedArtists,
		message: followIndex === -1 ? 'artist followed' : 'artist unfollowed',
	})
})

export const toggleFollowPlaylist = expressAsyncHandler(async (req, res) => {
	const playlistId = req.params.id;
	const user = await User.findById(req.user._id);
	const playlist = await Playlist.findById(playlistId);

	if (!playlist)
	{
		res.status(StatusCode.NotFound);
		throw new Error('Playlist not found!');
	}
	if (!user)
	{
		res.status(StatusCode.NotFound);
		throw new Error('User not found');
	}
	const playlistIndex = user.followedPlaylists.indexOf(playlistId);
	if (playlistIndex == -1) {
		user.followedPlaylists.push(playlistId);
		playlist.followers++;
	} else {
		user.followedPlaylists.splice(playlistIndex, 1);
		if (playlist.followers > 0)
			playlist.followers--;
	}
	await Promise.all([user.save(), playlist.save()]);
	return res.status(StatusCode.OK).json({
		followedPlaylists: user.followedPlaylists,
		message: playlistIndex === -1 ? 'playlist followed' : 'playlist unfollowed',
	})
})
