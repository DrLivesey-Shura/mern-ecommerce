const { createClient } = require("redis");
require("dotenv").config();

let redisClient;

(async () => {
  redisClient = createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });

  redisClient.on("error", (err) => console.error("Redis Client Error", err));

  await redisClient.connect();
})();

module.exports = redisClient;
