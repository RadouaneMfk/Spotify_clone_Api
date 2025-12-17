import mongoose from "mongoose";

const artistsSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Artist name is required"],
		trim: true,
	},
	bio: {
		type: String,
		trim: true,
	},
	image: {
		type: String,
		default: "https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg",
	},
	genres: [
		{
			type: String,
			ref: "Song",
		}
	],
	Songs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Song",
		}
	],
	Albums: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Album",
		}
	],
	followers : {
		type: Number,
		default: 0,
	},
	isVerified: {
		type: Boolean,
		default: false,
	},
},
	{
		timestamps: true,
	},
)

const Artist = mongoose.model("Artist", artistsSchema);

export default Artist;
