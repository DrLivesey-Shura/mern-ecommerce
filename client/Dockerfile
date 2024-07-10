FROM node:22-alpine AS build

WORKDIR /client

COPY . .

RUN yarn

ENV REACT_APP_API_URL=localhost

EXPOSE 5173

CMD ["npm", "run", "dev"]