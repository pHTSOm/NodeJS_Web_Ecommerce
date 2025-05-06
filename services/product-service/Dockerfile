FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the service port
EXPOSE ${SERVICE_PORT}

# Start the service in development mode
CMD ["npm", "run", "dev"]