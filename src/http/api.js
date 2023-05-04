module.exports = function ({ apiRouter, mongo, getInternalMqttClient }) {
  apiRouter.post('/publish', function (req, res) {
    const { topic, payload, options } = req.body
    getInternalMqttClient().publish(topic, JSON.stringify(payload), options || { qos: 1 })
    res.sendStatus(200)
  })

  apiRouter.get('/health-check', function (req, res) {
    res.sendStatus(200)
  })

  apiRouter.get('/dev-message', function (req, res) {
    getInternalMqttClient().publish('$dev', JSON.stringify({ text: `this is a dev message` }), { qos: 1 })
    res.sendStatus(200)
  })

  apiRouter.post('/dev-message', function (req, res) {
    getInternalMqttClient().publish('$dev', JSON.stringify(req.body), { qos: 1 })
    res.sendStatus(200)
  })

  return apiRouter
}
