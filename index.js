require('dotenv').config()
require('./src/global')

;(async function () {
  const httpService = require('./src/http')
  const mqttService = require('./src/mqtt')
  await Promise.all([httpService, mqttService])
})()
