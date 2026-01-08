FROM node:18-bullseye-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  pkg-config \
  libcairo2 \
  libcairo2-dev \
  libpango-1.0-0 \
  libpango1.0-dev \
  libjpeg62-turbo \
  libjpeg62-turbo-dev \
  libgif7 \
  libgif-dev \
  librsvg2-2 \
  librsvg2-dev \
  fontconfig \
  fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=80
EXPOSE 80

CMD ["bash", "-lc", "node server.js"]

