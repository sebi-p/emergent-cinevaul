FROM node:18-alpine

WORKDIR /app

# Copy package.json first
COPY package.json ./

# Install dependencies (this will generate yarn.lock)
RUN yarn install

# Copy the rest of the application
COPY . .

# Set environment variable for production
ENV REACT_APP_BACKEND_URL=http://localhost:8001

EXPOSE 3000

CMD ["yarn", "start"]
