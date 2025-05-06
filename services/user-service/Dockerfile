FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the service code
COPY . .

# Expose the service port
EXPOSE ${SERVICE_PORT}

# Start the service
CMD ["node", "server.js"]