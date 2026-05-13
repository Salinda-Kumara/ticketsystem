# Use official Node.js image as the base
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Ensure the start script is executable
RUN chmod +x start.sh

# Expose the API port
EXPOSE 3002

# Run the startup script
CMD ["./start.sh"]
