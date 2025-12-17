import multer from "multer";
import path from "path"

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads");
	},
	filename: function (req, file, cb) {
		cb(
			null,
			`${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
		);
	}
})

const fileFilter = (req, file, cb) => {
	if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/wav')
		cb(null, true);
	else if (file.mimetype === 'image/jpeg' ||
			 file.mimetype === 'image/jpg' ||
			 file.mimetype === 'image/png')
			{
				cb(null, true);
			}
	else
	{
		cb(new Error('Unsupported file format! only images and audio files allowed!'),
			false);
	}
}

export const upload = multer({
	storage: storage,
	limits: {fieldSize: 10 * 1024 * 1024},
	fileFilter,
})
