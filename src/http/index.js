const HTTP_PORT = process.env.PORT

// core
const fs = require('fs')

// utils
const YAML = require('yaml')

// express
const express = require('express')
const bodyParser = require('body-parser')
const swaggerUi = require('swagger-ui-express')

const mongo = require('../mongo')
const api = require('./api')
const { getInternalMqttClient } = require('../mqtt-client')

const httpServer = express()
const apiRouter = express.Router()
const docs = YAML.parse(fs.readFileSync('./swagger.yml', 'utf8'))

httpServer.use(bodyParser.json())
httpServer.use('/docs', swaggerUi.serve, swaggerUi.setup(docs))
httpServer.use(`/api/v1`, api({ apiRouter, mongo, getInternalMqttClient }))

module.exports = new Promise(function (resolve) {
  const server = httpServer.listen(HTTP_PORT, function () {
    console.log('http server is listening on port ', HTTP_PORT)
    resolve(server)
  })
})
