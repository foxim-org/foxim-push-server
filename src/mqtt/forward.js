const mem = require('../mem')

module.exports = function ({ aedes }) {
  aedes.authorizeForward = function (client, packet) {
    console.log('authorizeForward', packet)

    const payload = JSON.parse(packet.payload.toString())
    const userId = client.id

    if (packet.topic.startsWith('private')) {
      if (packet.topic.endsWith('read')) {
        console.log('private read goes here', packet.topic, client.id, payload.userId, payload.contactId)
        console.log(mem.get(payload.userId + payload.contactId), mem.get(payload.contactId + payload.userId))
        mem.set(payload.userId + payload.contactId, 0)
        packet.payload = JSON.stringify({ ...payload, msgCount: 0, newCount: 0 })
        console.log('after read', packet.payload.toString(), mem.get(payload.contactId + client.id))
        return packet
      }

      const id = payload.contactId + payload.userId

      if (!mem.get(id)) {
        mem.set(id, 0)
      }

      mem.set(id, mem.get(id) + 1)

      packet.payload = JSON.stringify({ ...payload, msgCount: mem.get(id), newCount: mem.get(id) })
      console.log('after change count', packet.payload.toString())
    } else if (packet.topic.startsWith('my-group')) {
      const id = payload.groupId + client.id

      console.log('before inc count', payload.groupId, payload.userId, client.id)

      if (!mem.get(id)) {
        mem.set(id, 0)
      }

      mem.set(id, mem.get(id) + 1)

      packet.payload = JSON.stringify({ ...payload, msgCount: mem.get(id), newCount: mem.get(id) })
      console.log('after change count', packet.payload.toString())
    } else if (packet.topic.startsWith('group')) {
        console.log('group before forward', packet.topic, client.id, payload.userId, payload.groupId)
      if (packet.topic.endsWith('read')) {
        console.log('group read goes here', packet.topic, client.id, payload.userId, payload.groupId)
        console.log(mem.get(payload.userId + payload.groupId), mem.get(payload.groupId + payload.userId))
        mem.set(payload.groupId + payload.userId, 0)
        packet.payload = JSON.stringify({ ...payload, msgCount: 0, newCount: 0 })
        console.log('after read', packet.payload.toString(), mem.get(payload.groupId + client.id))
        return packet
      }
    }

    console.log('after change all', packet.payload.toString())

    return packet
  }
}
