FROM node:22.14.0-alpine AS production

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

COPY . .

ENV NODE_ENV=production PORT=5000
EXPOSE 5000

USER node
CMD ["node", "server.js"]
