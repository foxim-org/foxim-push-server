const { Queue, Worker, QueueEvents } = require('bullmq')
const { ObjectID } = require('mongodb')

const mongo = require('../mongo')
const { redisConfig } = require('../redis')
const { getInternalMqttClient } = require('../mqtt-client')

const JOB_NAME = 'MY-GROUP'

const myGroupQueue = new Queue(JOB_NAME, redisConfig)

const groupQueueEvents = new QueueEvents(JOB_NAME, redisConfig)

const groupWorker = new Worker(JOB_NAME, async function (job) {
  const payload = job.data
  const userIds = await mongo.GroupUsers.distinct('userId', { groupId: payload.groupId })

  console.log('worker found userIds that should send to', userIds)
  payload.__ignore = true

  for (const userId of userIds) {
    // if (userId === payload.__clientId) continue

    getInternalMqttClient().publish(`my-group/${userId}`, JSON.stringify(payload), { qos: 1 }, function () {
      console.log('send-to-group-users', `my-group/${userId}`, JSON.stringify(payload))
    })
  }

  return true
}, redisConfig)

groupWorker.on('completed', function (job) {
  console.log('on worker completed', job.name, job.data)
})

module.exports = {
  myGroupQueue,
}
