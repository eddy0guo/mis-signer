FROM node:12.16.1-alpine as builder
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN apk add  --no-cach git python3 build-base
WORKDIR /build
COPY package*.json ./
COPY yarn.lock ./
RUN npm set registry https://registry.npm.taobao.org/ && yarn

COPY . .
RUN npm run build

FROM node:12.16.1-alpine
WORKDIR /app
COPY --from=builder /build /app
