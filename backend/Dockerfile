# The WalkIt API. Build from the backend folder: docker build -t walkit-api .
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Dependencies first, so they are cached between code changes
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY src ./src
COPY scripts ./scripts

# Don't run as root
USER node

EXPOSE 4000
# Node handles SIGTERM itself (graceful shutdown in src/server.js)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-4000}/api/health" > /dev/null || exit 1

CMD ["node", "src/server.js"]
