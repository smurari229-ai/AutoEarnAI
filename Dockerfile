FROM node:22-alpine
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend
RUN cd backend && npm install && npx prisma generate && npm run build
RUN cd frontend && npm install && npm run build
EXPOSE 4000
CMD ["node","backend/dist/index.js"]