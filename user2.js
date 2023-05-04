require('dotenv').config()

const MQTT_PORT = parseInt(process.env.PORT) + 1
const { MQTT_SECRET_CLIENT_ID } = process.env

const { nanoid } = require('nanoid')
const mqtt = require('mqtt')

const clientId = `${MQTT_SECRET_CLIENT_ID}-${nanoid()}`

const mqttClient = mqtt.connect(`ws://localhost:${MQTT_PORT}`, {
  clientId,
  clean: false,
})

mqttClient.on('connect', onMqttClientConnected)

mqttClient.on('message', function (topic, payload) {
  console.log(topic, payload.toString())
})

function onMqttClientConnected () {
  console.log('mqtt client is connected')
  mqttClient.subscribe(`private/user2`, { qos: 1 })
}
