import JWT from "jsonwebtoken";

export const generateToken = (id) => {
	return JWT.sign({id}, process.env.JWT, {
		expiresIn: "10d",
	})
}
