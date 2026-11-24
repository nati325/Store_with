FROM node:22-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production
ENV UPLOAD_DIR=/data/uploads
VOLUME /data
EXPOSE 3000
# מסנכרן את הסכמה ואז מרים את השרת
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
