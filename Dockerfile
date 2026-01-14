# Base image
FROM node:18-bullseye-slim

# Workspace setup
WORKDIR /app

# Copy package configs
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies (Root)
# If using npm workspaces, this would be easier, but we'll do manual install
RUN cd client && npm install
RUN cd server && npm install

# Copy Source
COPY . .

# Build Frontend
WORKDIR /app/client
RUN npm run build

# Start Server
WORKDIR /app/server
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["npm", "start"]
