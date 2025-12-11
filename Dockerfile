# Backend Dockerfile для Stonerose API
FROM node:18-alpine

# Устанавливаем curl для health checks
RUN apk add --no-cache curl

WORKDIR /app

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production && npm cache clean --force

# Копируем исходный код
COPY src/ ./src/
COPY .env.production ./.env

# Создаем папки
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs /app

# Переключаемся на непривилегированного пользователя
USER nodejs

# Открываем порт
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Запускаем приложение
CMD ["npm", "start"]