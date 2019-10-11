# Mist Signer

## Getting Started

---------------

```sh

# mangodb for did
brew install mongodb
mongod --dbpath '~/data/db'

# postgres db for engine
docker-compose up db

# Install dependencies
npm install

# Start development live-reload server
PORT=6666 npm run dev

# Start production server:
PORT=8080 npm start
```

## Docker Support

```sh

# Build your docker
docker build -t mist/api-service .
#            ^      ^           ^
#          tag  tag name      Dockerfile location

# run your docker
docker run -p 8080:8080 mist/api-service
#                 ^            ^
#          bind the port    container tag
#          to your host
#          machine port   

```

