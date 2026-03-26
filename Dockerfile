# Base image
FROM node:20-slim

# Install Chromium + system deps for Puppeteer headless browser
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

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
