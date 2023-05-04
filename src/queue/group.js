const { Queue, Worker, QueueEvents } = require('bullmq')
const { ObjectID } = require('mongodb')

const mongo = require('../mongo')
const { redisConfig } = require('../redis')
const { getInternalMqttClient } = require('../mqtt-client')

const JOB_NAME = 'GROUP'

const groupQueue = new Queue(JOB_NAME, redisConfig)

const groupQueueEvents = new QueueEvents(JOB_NAME, redisConfig)

const groupWorker = new Worker(JOB_NAME, async function (job) {
  // nothing to do here for now
  return true
}, redisConfig)

groupWorker.on('completed', function (job) {
  console.log('on worker completed', job.name, job.data)
  groupWorkerResolver[job.name](job)
})

const groupWorkerResolver = {
  'group-forward': function (job) {
    console.log('group-forward start', job.name, job.data)

    // better use objectid for all foreign keys
    const $targetIds = job.data.targetIds.map((groupId) => new ObjectID(groupId))

    const groups = mongo.Groups.find({ _id: { $in: $targetIds } }).forEach(function (group) {
      const groupId = group._id.toString()

      // should never reach here
      if (job.data.groupId === groupId) {
        console.log('重复跳过')
        return
      }

      const payload = {
        ...job.data,
        groupId,
        displayName: group.name,
        groupName: group.name,
      }

      getInternalMqttClient().publish(`group/${groupId}`, JSON.stringify(payload), { qos: 1 }, function () {
        console.log('group-forward sent', `group/${groupId}`, JSON.stringify(payload))
      })
    })
  },
}

module.exports = {
  groupQueue,
}
