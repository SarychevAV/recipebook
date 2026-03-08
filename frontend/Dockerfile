# ── Stage: dev ─────────────────────────────────────────────────────────────
# src монтируется из docker-compose.yml — Vite HMR подхватывает изменения
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json .
RUN npm ci
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ── Stage: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci --frozen-lockfile
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY . .
RUN npm run build

# ── Stage: prod ─────────────────────────────────────────────────────────────
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
