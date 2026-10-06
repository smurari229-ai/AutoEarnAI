FROM node:22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install
COPY backend ./
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=backend-build /app/backend /app/backend
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh","-c","cd /app/backend && npx prisma migrate deploy && node dist/index.js"]