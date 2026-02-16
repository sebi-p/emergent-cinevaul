FROM node:20-alpine

WORKDIR /app

# Copy package.json first
COPY package.json ./

# Install dependencies
RUN yarn install

# Copy the rest of the application
COPY . .

# Set environment variable
ENV REACT_APP_BACKEND_URL=http://localhost:8001

EXPOSE 3000

CMD ["yarn", "start"]
