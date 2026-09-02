# 1. Node.js version 18-ai eduthukom
FROM node:18

# 2. App-ku oru work directory create panrom
WORKDIR /app

# 3. Package.json-a copy panni packages-ai install panrom
COPY package*.json ./
RUN npm install

# 4. Matha ella backend files mattum public folder-aiyum copy panrom
COPY . .

# 5. Render/Google Cloud use panra port (Default 5000)
EXPOSE 5000

# 6. Server-ai start panra command
CMD ["npm", "start"]