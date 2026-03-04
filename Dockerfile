# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# Build args become VITE_ env vars at build time
ARG VITE_SENTRY_DSN
ARG VITE_APP_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_APP_URL=$VITE_APP_URL

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config: handle SPA routing + security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
