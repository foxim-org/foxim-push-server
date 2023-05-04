require('dotenv').config()

const redisConfig = {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
  }
}

console.log(redisConfig)

exports.redisConfig = redisConfig
