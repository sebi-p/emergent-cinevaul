FROM node:20-alpine

WORKDIR /app

# Copy package.json only (yarn.lock will be generated)
COPY package.json ./

# Install dependencies
RUN yarn install --network-timeout 100000

# Copy all source files
COPY . .

# Replace craco config with local version (removes Emergent-specific plugins)
RUN cp craco.config.local.js craco.config.js

# Set environment variables
ENV REACT_APP_BACKEND_URL=http://localhost:8001
ENV DISABLE_ESLINT_PLUGIN=true
ENV SKIP_PREFLIGHT_CHECK=true

EXPOSE 3000

CMD ["yarn", "start"]
