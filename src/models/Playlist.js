import mongoose from "mongoose";

const playlistsSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "playlist name is required"],
		trim: true,
	},
	description: {
		type: String,
		trim: true,
	},
	releasedDate: {
		type: Date,
		default: Date.now(),
	},
	coverImage: {
		type: String,
		default: "https://images.pexels.com/photos/7804615/pexels-photo-7804615.jpeg",
	},
	followers: {
		type: Number,
		default: 0,
	},
	isPublic: {
		type: Boolean,
		default: false,
	},
	Songs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Song",
		}
	],
	creator: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	collaboraters: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		}
	],
},
	{
		timestamps: true,
	},
)

const Playlist = mongoose.model("Playlist", playlistsSchema);

export default Playlist;
