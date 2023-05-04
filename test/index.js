const { before, teardown, test, on } = require('tap')
const mqtt = require('mqtt')

require('dotenv').config()
require('../src/global')

const MQTT_PORT = parseInt(process.env.PORT) + 1
const { MQTT_SECRET_CLIENT_ID } = process.env

const httpService = require('../src/http')
const mqttService = require('../src/mqtt')

before(async function (t) {
  return Promise.all([httpService, mqttService])
})

// on('end', console.log)

teardown(async function (t) {
  const [httpServer, mqttServer] = await Promise.all([httpService, mqttService])

  const shutdownHttpServer = new Promise(function (resolve) {
    httpServer.close(function () {
      console.log('httpServer is closed')
      resolve(true)
    })
  })

  const shutdownMqttServer = new Promise(function (resolve) {
    mqttServer.close(function () {
      console.log('httpServer is closed')
      resolve(true)
    })
  })

  return Promise.all([shutdownHttpServer, shutdownMqttServer])
})

// test('test', async function (t) {
//   t.pass('test')
//   t.end()
// })
