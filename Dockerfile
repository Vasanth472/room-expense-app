## Multi-stage Dockerfile for building Angular app and running Node server
FROM node:18 AS builder
WORKDIR /app

# Copy project files
COPY package.json package-lock.json* ./
COPY . ./

# Install dependencies (including Angular CLI devDeps) and build the Angular app
RUN npm install --legacy-peer-deps
RUN npm run build --silent

## Runtime image
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy server and built Angular dist from builder
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist/room-expense-app ./dist/room-expense-app

WORKDIR /app/server
RUN npm install --production --legacy-peer-deps

EXPOSE 3000
ENV PORT=3000
CMD ["node", "index.js"]
