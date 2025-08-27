# 1. Set the base image
# Use an official Node.js runtime as a parent image.
# Version 22 is specified, and the '-slim' variant is used because it
# contains the minimal packages needed to run Node.js, making your image smaller.
FROM node:22-slim

# 2. Set the working directory inside the container
# This is where your application code will live.
WORKDIR /usr/src/app

# 3. Copy dependency definition files
# Copy package.json and package-lock.json (if available).
# The '*' is a wildcard that matches both files.
COPY package*.json ./

# 4. Install dependencies
# This runs 'npm install' inside the container. It will install all the
# dependencies listed in your package.json file. This step is done before
# copying your source code to take advantage of Docker's layer caching.
# The dependencies layer will only be rebuilt if your package files change.
RUN npm install

# 5. Copy application source code
# Copy all the files from your local project directory into the container's
# working directory (/usr/src/app). The '.' refers to the current directory.
COPY . .

# 6. Expose the port
# This line informs Docker that the container listens on the specified network port
# at runtime. For Google Cloud Run, this is good practice for health checks,
# even for a background worker.
EXPOSE 8080

# 7. Define the command to run the application
# This is the command that will be executed when the container starts.
# It runs your worker script using Node.js.
CMD [ "node", "src/worker.js" ]
