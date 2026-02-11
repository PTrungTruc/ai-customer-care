# Sử dụng Node.js bản nhẹ
FROM node:18-alpine

# Tạo thư mục làm việc
WORKDIR /app

# 👇 THÊM DÒNG NÀY ĐỂ CÀI OPENSSL CHO ALPINE 👇
RUN apk add --no-cache openssl libc6-compat

# Copy file cấu hình
COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt thư viện
RUN npm install

# Copy toàn bộ code
COPY . .

# Tạo Prisma Client
RUN npx prisma generate

# Mở cổng 3000
EXPOSE 3000

CMD ["npm", "run", "dev"]