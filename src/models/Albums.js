import mongoose from "mongoose";

const albumsSchema = new mongoose.Schema({
	title: {
		type: String,
		required: [true, "album title is required"],
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
	coverImage: {
		type: String,
		default: "https://images.pexels.com/photos/7804615/pexels-photo-7804615.jpeg",
	},
	genre: {
		type: String,
		trim: true,
	},
	likes: {
		type: Number,
		default: 0,
	},
	description: {
		type: String,
		trim: true,
	},
	isExplicit: {
		type: Boolean,
		default: false,
	},
	Songs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Song",
		}
	],
},
	{
		timestamps: true,
	},
)

const Album = mongoose.model("Album", albumsSchema);

export default Album;
