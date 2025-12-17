import expressAsyncHandler from "express-async-handler"
import jwt from "jsonwebtoken"
import User from "../models/Users.js";
import { StatusCode } from "express-status-code";

export const protect = expressAsyncHandler(async (req, res, next) => {
	let token;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
		{
			try {
				token = req.headers.authorization.split(" ")[1];
				const decoded = jwt.verify(token, process.env.JWT);
				req.user = await User.findById(decoded.id).select("-password");
				next();
			} catch (error) {
				console.log(error);
				res.status(StatusCode.Unauthorized).json({
					message: 'Not authorized',
				})
			}
		}
	else
		return res.status(StatusCode.BadRequest).json({
			message: "authorization required!",
		})
})

export const isAdmin = expressAsyncHandler(async (req, res, next) => {
	if (req.user && req.user.isAdmin)
		next();
	else
		return res.status(StatusCode.Unauthorized).json({
			message: 'not authorized as an admin!',
	})
})
