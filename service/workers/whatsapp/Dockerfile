FROM node:20-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  libnss3 \
  libxss1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libgbm1 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libu2f-udev \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

CMD ["npm", "run", "dev"]
