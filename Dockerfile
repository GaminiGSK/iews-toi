# Base image
FROM node:20-slim

# No Chromium needed — GDT agent uses lightweight axios HTTP requests (no browser)

# Workspace setup
WORKDIR /app

# Copy package configs
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
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
