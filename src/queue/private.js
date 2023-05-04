const { Queue, Worker, QueueEvents } = require('bullmq')
const { ObjectID } = require('mongodb')

const mongo = require('../mongo')
const { redisConfig } = require('../redis')
const { getInternalMqttClient } = require('../mqtt-client')

const JOB_NAME = 'PRIVATE'

const privateQueue = new Queue(JOB_NAME, redisConfig)

const privateQueueEvents = new QueueEvents(JOB_NAME, redisConfig)

const privateWorker = new Worker(JOB_NAME, async function (job) {
  try {
    const payload = job.data

    if (job.name === 'private-read') {
      // mark read
    }

    return true
  } catch (ex) {
    console.log('worker failed', job.name, job.data, ex)
    return true
  }
}, redisConfig)

privateWorker.on('completed', function (job) {
  console.log('worker completed', job.name, job.data)
  const payload = job.data

  if (job.name === 'private-read') {
    return
  }

  privateWorkerResolver[job.name](job)
})

const privateWorkerResolver = {

}

module.exports = {
  privateQueue,
}
