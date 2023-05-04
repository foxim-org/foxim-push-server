const MQTT_MONGO_URL = process.env.MQTT_MONGO_URL
const PERSISTENCE_TTL = process.env.PERSISTENCE_TTL || 600
const MQTT_PORT = parseInt(process.env.PORT) + 1
const BROKER_ID = process.env.BROKER_ID

const aedesMiddlewareOptions = {
  url: MQTT_MONGO_URL,
  ttl: {
    packets: PERSISTENCE_TTL,
    subscriptions: PERSISTENCE_TTL,
  },
}

const mq = require('mqemitter-mongodb')(aedesMiddlewareOptions)
const persistence = require('aedes-persistence-mongodb')(aedesMiddlewareOptions)
const aedes = require('aedes')({ mq, persistence, id: BROKER_ID || 'fox'  })
const { createServer } = require('aedes-server-factory')

const mongo = require('../mongo')

const registerPreConnect = require('./pre-connect.js')
const registerAuthenticate = require('./authenticate')
const registerPublish = require('./publish')
const registerSubscribe = require('./subscribe')
const registerForward = require('./forward')
const registerEvents = require('./events')

registerPreConnect({ aedes, mongo })
registerAuthenticate({ aedes, mongo })
registerPublish({ aedes, mongo })
registerSubscribe({ aedes, mongo })
registerForward({ aedes, mongo })
registerEvents({ aedes, mongo })

const mqttServer = createServer(aedes, {
  ws: true,
  trustProxy: true
})

module.exports = new Promise(function (resolve) {
  const server = mqttServer.listen(MQTT_PORT, function () {
    console.log('mqtt server is listening on port ', MQTT_PORT)
    resolve(server)
  })
})
