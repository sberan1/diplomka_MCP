FROM node:22-alpine AS deps
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# Puppeteer's own bundled Chromium download doesn't work on Alpine (musl);
# use the distro package instead, matching PUPPETEER_EXECUTABLE_PATH above.
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
