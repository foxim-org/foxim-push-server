const {
  PORT,
  MQTT_SECRET_CLIENT_ID
} = process.env

const { nanoid } = require('nanoid')
const mqtt = require('mqtt')

const brokerPort = parseInt(PORT) + 1

const brokerUrl = `ws://localhost:${brokerPort.toString()}`
const clientId = `${MQTT_SECRET_CLIENT_ID}-${nanoid()}`

const mqttClient = mqtt.connect(brokerUrl, {
  clientId
})

mqttClient.on('connect', function (packet) {
  console.log(clientId, 'connected')
})

function getInternalMqttClient () {
  return mqttClient
}

module.exports = {
  getInternalMqttClient,
}
