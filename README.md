# YouTube Watch Party – Backend

This is the Node.js + Express backend for the YouTube Watch Party application. It handles real-time communication between participants using Socket.IO, manages rooms, roles, and video synchronization.

# Live Backend URL

Backend (Render): https://watch-party-kad7.onrender.com

# Features

Room-based model: Create and join rooms with unique Room IDs

Real-time playback synchronization: Play, Pause, Seek, Change Video

Role-based access:

HOST – Full control (play/pause, seek, change video, assign roles, remove participants)

MODERATOR – Limited control (play/pause, seek, change video)

PARTICIPANT – Watch-only

Automatic host reassignment if the host disconnects

Popup notification for removed participants

Real-time chat inside rooms

In-memory room storage (lightweight, no DB required for MVP)

# Tech Stack

Node.js – Backend runtime

Express – HTTP server and static file serving

Socket.IO – Real-time bidirectional communication

CORS – Cross-origin requests handling

YouTube IFrame API – Used indirectly via frontend

# Setup & Installation

1.Clone the repository:

git clone <your-repo-url>
cd watch-party/backend

2.Install dependencies:

npm install

3.Run locally:

node server.js

# WebSocket Events
| Event              | Direction       | Payload                               | Description                                      |
| ------------------ | --------------- | ------------------------------------- | ------------------------------------------------ |
| `join_room`        | Client → Server | `{ roomId, username }`                | Join or create a room; assigns HOST if creator   |
| `play`             | Client → Server | `{ roomId, currentTime }`             | Start video; HOST or MODERATOR only              |
| `pause`            | Client → Server | `{ roomId, currentTime }`             | Pause video; HOST or MODERATOR only              |
| `seek`             | Client → Server | `{ roomId, time }`                    | Seek video; HOST or MODERATOR only               |
| `change_video`     | Client → Server | `{ roomId, videoId }`                 | Change video; HOST or MODERATOR only             |
| `remove_user`      | Client → Server | `{ roomId, userId }`                  | Remove participant; HOST only                    |
| `make_host`        | Client → Server | `{ roomId, userId }`                  | Transfer host; HOST only                         |
| `assign_moderator` | Client → Server | `{ roomId, userId }`                  | Assign moderator role; HOST only                 |
| `chat_message`     | Client → Server | `{ roomId, username, message }`       | Broadcast chat message to room                   |
| `sync_state`       | Server → Client | `{ videoId, currentTime, isPlaying }` | Sends current video state to new participant     |
| `room_update`      | Server → Client | `{ room }`                            | Sends updated room and roles to all participants |
| `removed_by_host`  | Server → Client | `{}`                                  | Notifies a participant that they were removed    |


# Folder Structure
server/
├── server.js           # Main server + WebSocket logic

├── package.json        # Dependencies and scripts

├── package-lock.json

└── README.md

# Deployment on Render

Create a Node.js Web Service on Render

Connect your GitHub repository

Set build & start commands:

# Build command (optional, if no build step)
# Start command:
node server.js

Environment variables: Not required for MVP


# Notes

Rooms are in-memory; restarting the server will reset all rooms

Only HOST and MODERATOR can control playback

Automatic host reassignment ensures rooms stay active

Frontend should handle moderator buttons and participant removal popups
