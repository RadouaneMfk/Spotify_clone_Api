import mongoose from "mongoose";
import bcrypt from "bcrypt";

const usersSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "name is required"],
		trim: true,
	},
	email: {
		type: String,
		required: [true, "email is required"],
		trim: true,
	},
	password: {
		type: String,
		required: [true, "password is required"],
		minlength: [true, "password must be atleast 6 characters"],
	},
	profilePicture: {
		type: String,
		default: "https://images.pexels.com/photos/8294554/pexels-photo-8294554.jpeg",
	},
	isAdmin: {
		type: Boolean,
		default: false,
	},
	likedSongs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Song",
		}
	],
	likedAlbums: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Album",
		}
	],
	followedArtists: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Artist",
		}
	],
	followedPlaylists: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Playlist",
		}
	],
},
	{
		timestamps: true,
	},
)

usersSchema.methods.matchPassword = async function(enteredPass) {
	return await bcrypt.compare(enteredPass, this.password);
}

usersSchema.pre('save', async function (next) {
	if (!this.isModified("password"))
		return next();
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
})

const User = mongoose.model("User", usersSchema);

export default User;
