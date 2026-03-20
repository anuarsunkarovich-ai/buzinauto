FROM node:20.18.1 AS dependencies
WORKDIR /opt/apt
COPY package.json ./
COPY package-lock.json ./
RUN npm install

FROM node:20.18.1 AS builder
WORKDIR /opt/apt

# Build arguments for environment variables
ARG NODE_ENV=development
ARG JAPAN_AUCTION_BASE_URL=https://auctions.aleado.ru
ARG JAPAN_AUCTION_USER_LOGIN=demo_user
ARG JAPAN_AUCTION_IMAGE_BASE_URL=https://auctions.aleado.ru/images
ARG NRG_CATALOG_BASE_URL=https://api.nrg-catalog.com
ARG NRG_CATALOG_LOGIN=demo_user
ARG NRG_CATALOG_PASSWORD=demo_pass
ARG EXCHANGE_RATE_BASE_URL=https://api.exchangerate.com
ARG EXCHANGE_RATE_API_KEY=demo_key
ARG QUEUE_REDIS_HOST=redis
ARG QUEUE_REDIS_PORT=6379
ARG QUEUE_REDIS_USE_TLS=false
ARG DATABASE_URI=mongodb://mongodb:27017/buzinavto

# Create .env file for build
RUN echo "NODE_ENV=${NODE_ENV}" > .env && \
    echo "JAPAN_AUCTION_BASE_URL=${JAPAN_AUCTION_BASE_URL}" >> .env && \
    echo "JAPAN_AUCTION_USER_LOGIN=${JAPAN_AUCTION_USER_LOGIN}" >> .env && \
    echo "JAPAN_AUCTION_IMAGE_BASE_URL=${JAPAN_AUCTION_IMAGE_BASE_URL}" >> .env && \
    echo "NRG_CATALOG_BASE_URL=${NRG_CATALOG_BASE_URL}" >> .env && \
    echo "NRG_CATALOG_LOGIN=${NRG_CATALOG_LOGIN}" >> .env && \
    echo "NRG_CATALOG_PASSWORD=${NRG_CATALOG_PASSWORD}" >> .env && \
    echo "EXCHANGE_RATE_BASE_URL=${EXCHANGE_RATE_BASE_URL}" >> .env && \
    echo "EXCHANGE_RATE_API_KEY=${EXCHANGE_RATE_API_KEY}" >> .env && \
    echo "QUEUE_REDIS_HOST=${QUEUE_REDIS_HOST}" >> .env && \
    echo "QUEUE_REDIS_PORT=${QUEUE_REDIS_PORT}" >> .env && \
    echo "QUEUE_REDIS_USE_TLS=${QUEUE_REDIS_USE_TLS}" >> .env && \
    echo "DATABASE_URI=${DATABASE_URI}" >> .env && \
    echo "GLOBAL_PREFIX=/api" >> .env && \
    echo "LOGGER_ENABLED_PINO=true" >> .env && \
    echo "SWAGGER_API_URL=docs" >> .env && \
    echo "SWAGGER_ENABLED=true" >> .env && \
    echo "RATE_LIMIT_ENABLED=true" >> .env && \
    echo "RATE_LIMIT_APP_TTL=3" >> .env && \
    echo "RATE_LIMIT_APP_LIMIT=3" >> .env

COPY . .
COPY --from=dependencies /opt/apt/node_modules ./node_modules
RUN npm run build

FROM node:20.18.1 AS runner
WORKDIR /opt/apt

# Установка Google Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/apt/tsconfig.json ./tsconfig.json
COPY --from=builder /opt/apt/tsconfig-paths-bootstrap.js ./tsconfig-paths-bootstrap.js
COPY --from=builder /opt/apt/package.json ./package.json
COPY --from=builder /opt/apt/package-lock.json ./package-lock.json
COPY --from=builder /opt/apt/dist ./dist
COPY --from=builder /opt/apt/node_modules ./node_modules

# Указываем Puppeteer, где искать Chrome
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

ENV PORT 3336
EXPOSE 3336
CMD ["npm", "start"]
