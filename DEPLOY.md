# Deployment Guide

This project is a full-stack Angular (+ Node/Express + MongoDB) app. This file describes simple ways to deploy it.

Required environment variables
- `MONGODB_URI` - MongoDB connection string (e.g., from Atlas)
- `PORT` - optional, defaults to `3000`

Option A — Docker (recommended, portable)
1. Build the image locally:
```powershell
docker build -t room-expense-app:latest .
```
2. Run the container (map port and pass env var):
```powershell
docker run -e MONGODB_URI="your_mongo_uri" -p 3000:3000 room-expense-app:latest
```

Option B — Render / Heroku (Git-based)
- Render: create a new Web Service, select "Docker" and point to this repo. Set `MONGODB_URI` in the environment settings. Render will build using the `Dockerfile`.
- Heroku (container):
  1. Authenticate: `heroku container:login`
  2. Build & push: `heroku container:push web -a <your-app-name>`
  3. Release: `heroku container:release web -a <your-app-name>`
  4. Configure `MONGODB_URI` via `heroku config:set MONGODB_URI="..."`

Option C — VPS (e.g., DigitalOcean droplet)
1. Build the project on the server or build locally and copy files.
2. Run `npm install` in `server/` and ensure `dist/room-expense-app` exists (from `npm run build`).
3. Use a process manager (e.g., `pm2`) to run `node server/index.js` and configure Nginx as a reverse proxy if needed.

Local testing
1. From repo root, build Angular and start server locally (dev):
```powershell
npm install
npm run build
cd server
npm install
node index.js
```
2. Visit `http://localhost:3000` and API endpoints at `http://localhost:3000/api/...`.

Notes
- The `Dockerfile` uses a multi-stage build so Angular will be built in the image and served by the Node server.
- For cloud deployments, ensure `MONGODB_URI` points to a production-ready MongoDB (Atlas or managed DB).
