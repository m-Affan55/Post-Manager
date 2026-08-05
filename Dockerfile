# 1. Use an official Node.js image
FROM node:22-alpine

# 2. Set the working directory in the container
WORKDIR /app

# 3. Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# 4. Copy the rest of your frontend code
COPY . .

# 5. Document the port Vite uses
EXPOSE 5173

# 6. Run Vite. The --host flag is REQUIRED in Docker so it binds to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host"]
