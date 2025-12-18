# Spotify Clone API

Backend REST API for a Spotify-like application.
Handles authentication, users, playlists, and tracks.

# Tech stack

NodeJs
ExpressJs
MongoDB
JWT
Cloudinary

# Features

- User registration and login
- JWT-based authentication
- like/unlike songs
- Follow/Unfollow artists
- Create and manage playlists
- Create and manage Albums
- Add / remove Songs
- Add / remove Artists
- Add / remove Collaboraters in playlists
- Protected routes
- and more

# API Structure

src/
 ├── config/   # Cloudinary configurations
 ├── controllers/        # request handlers
 ├── middlwares/        # Auth & upload handling (Multer)
 ├── models/    	# Database Models
 ├── routes/      # API routes
 └── utils/         # Helpers

# Installation

```bash
git clone https://github.com/RadouaneMfk/Spotify_clone_Api.git
cd Spotify_clone_Api
npm install
```


# Environement Variable (.env)

- create your .env file using this inside (fill the variables with your secrets):

MONGO_URL=
PORT=5000
JWT=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Run the Server

```bash
node src/server.js
```
- The API will be available at http://localhost:5000/api

# API endpoints

### USERS
- POST /users/register
- POST /users/login
- GET /users/profile
- PUT /users/profile
- PUT /users/like-song/:id
- PUT /users/follow-artist/:id
- PUT /users/follow-playlist/:id

### ARTISTS
- POST /artists
- GET /artists
- GET /artists/top
- GET /artists/:id/top-songs
- GET /artists/:id
- PUT /artists/:id
- DELETE /artists/:id

### PLAYLISTS
- GET /playlists
- GET /playlists/:id
- PUT /playlists/:id
- GET /playlists/user/me
- GET /playlists/featured
- POST /playlists/:id/add-songs
- PUT /playlists/:id/remove-songs/:songId
- POST /playlists/:id/add-collaborator
- PUT /playlists/:id/remove-collaborator
- DELETE /playlists/:id

### SONGS
- GET /songs
- POST /songs
- PUT /songs/:id
- DELETE /songs/:id
- GET /songs/top
- GET /songs/new-release
- GET /songs/:id

### ALBUMS
- GET /albums
- GET /albums/:id
- POST /albums
- PUT /albums/:id
- DELETE /albums/:id