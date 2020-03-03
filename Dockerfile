FROM node:12.16.1-alpine as builder
RUN apk add  --no-cach git python3 build-base
WORKDIR /app
COPY . /app
RUN yarn
RUN npm run build