import express from "express";
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import userRouter from "./routes/usersRouters.js";
import { StatusCode } from "express-status-code";
import artistRouter from "./routes/artistsRouters.js";
import albumRouter from "./routes/albumsRouters.js";
import songRouter from "./routes/songsRouters.js";
import playlistRouter from "./routes/playlistsRouters.js";

configDotenv();

mongoose.connect(process.env.MONGO_URL).then(() => {
	console.log("Database connected successfully");
}).catch((err) => {
	console.log(err);
})

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

app.use('/api/users', userRouter);
app.use('/api/artists', artistRouter);
app.use('/api/albums', albumRouter);
app.use('/api/songs', songRouter);
app.use('/api/playlists', playlistRouter);

app.use((req, res, next) => {
	const error = new Error('Not Found');
	error.status = StatusCode.NotFound;
	next(error);
})

app.use((err, req, res, next) => {
	res.status(err.status || StatusCode.InternalServerError).json({
		message: err.message || 'Internal Server Error',
		status: "error",
	})
})

app.listen(process.env.PORT, () => {
	console.log("server is running at http://localhost:" + `${PORT}`);
})
