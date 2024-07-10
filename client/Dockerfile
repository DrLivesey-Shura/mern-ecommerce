FROM node:22-alpine AS build

WORKDIR /client

COPY package.json .

RUN yarn

COPY . .

ENV REACT_APP_API_URL=localhost

EXPOSE 9999

CMD ["yarn", "dev"]