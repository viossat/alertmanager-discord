FROM node:11-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install --production

COPY . ./

ENTRYPOINT ["node", "index.js"]
