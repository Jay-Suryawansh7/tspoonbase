FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/
COPY admin/ admin/
COPY pb_migrations/ pb_migrations/
COPY pb_public/ pb_public/

RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache tini

WORKDIR /app

COPY --from=builder /app/dist dist/
COPY --from=builder /app/pb_public pb_public/
COPY --from=builder /app/pb_migrations pb_migrations/
COPY --from=builder /app/node_modules node_modules/
COPY package.json ./

EXPOSE 8090

VOLUME ["/app/pb_data"]

ENV TSPOONBASE_DATA_DIR=/app/pb_data

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/cli.js", "serve", "--port", "8090", "--dir", "/app/pb_data"]
