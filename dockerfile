# Use an official Node.js runtime as a parent image
FROM node:22-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the application source code
COPY ./src ./src
COPY ./shared ./shared

# Define the command to run the worker
CMD [ "npm", "run", "start" ]
