import mongoose from "mongoose";

const songsSchema = new mongoose.Schema({
	title: {
		type: String,
		required: [true, "song title is required"],
		trim: true,
	},
	artist: {
		type: String,
		required: [true, "artist name is required"],
		ref: "Artist",
	},
	releasedDate: {
		type: Date,
		default: Date.now(),
	},
	album : {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Album',
	},
	coverImage: {
		type: String,
		default: "https://images.pexels.com/photos/7804615/pexels-photo-7804615.jpeg",
	},
	audioUrl: {
		type: String,
		required: [true, "audio url is required"],
	},
	duration: {
		type: Number,
		required: [true, "duration of song is required"],
	},
	genre: {
		type: String,
		trim: true,
	},
	likes: {
		type: Number,
		default: 0,
	},
	plays: {
		type: Number,
		default: 0,
	},
	isExplicit: {
		type: Boolean,
		default: false,
	},
	featuredArtists: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Artist",
		}
	]
},
	{
		timestamps: true,
	},
)

const Song = mongoose.model("Song", songsSchema);

export default Song;
