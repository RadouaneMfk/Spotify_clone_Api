import cloudinary from "../config/cloudinary.js"
import fs from "fs"

export const uploadToCloudinary = async(filePath, folder) => {
	try {
		const result = await cloudinary.uploader.upload(filePath, {
			folder,
			resource_type: "auto",
		})
		fs.unlinkSync(filePath);
		return result;
	} catch (error) {
		if (fs.existsSync(filePath))
			fs.unlinkSync(filePath);
		throw new Error(`failed to upload to cloudinary: ${error.message}`);
	}
}
