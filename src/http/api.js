const { AccessToken } = require('livekit-server-sdk')

const { LIVEKIT_KEY, LIVEKIT_SECRET } = process.env

module.exports = function ({ apiRouter, mongo, getInternalMqttClient }) {
  apiRouter.post('/publish', function (req, res) {
    const { topic, payload, options } = req.body
    getInternalMqttClient().publish(topic, JSON.stringify(payload), options || { qos: 1 })
    res.sendStatus(200)
  })

  apiRouter.post('/grant-livekit-token', function (req, res) {
    const {
      identity,
      room,
    } = req.body

    const at = new AccessToken(LIVEKIT_KEY, LIVEKIT_SECRET, {
      identity,
    })

    at.addGrant({
      room,
      roomCreate: true,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    })

    const token = at.toJwt()

    res.json({ token })
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
