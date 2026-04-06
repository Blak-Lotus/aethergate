FROM node:20-alpine
WORKDIR /app

COPY package*.json ./

# Install build tools for better-sqlite3
RUN apk add --no-cache python3 make g++ gcc

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build CSS as root
RUN npm run build:css

# Fix permissions for the node user (important!)
RUN mkdir -p data public/css && chown -R node:node .

# Run as non-root
USER node
EXPOSE 3000
CMD ["node", "server.js"]