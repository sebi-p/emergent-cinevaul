FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies with legacy peer deps to avoid conflicts
RUN yarn install --network-timeout 100000

# Copy all source files
COPY . .

# Set environment variable
ENV REACT_APP_BACKEND_URL=http://localhost:8001
ENV DISABLE_ESLINT_PLUGIN=true
ENV SKIP_PREFLIGHT_CHECK=true

EXPOSE 3000

CMD ["yarn", "start"]
