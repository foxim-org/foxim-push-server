const { MQTT_SECRET_CLIENT_ID } = process.env

const { ObjectID } = require('mongodb')

module.exports = function ({ aedes, mongo }) {
  // 验证用户是否可以发布消息
  aedes.authorizePublish = async function (client, packet, callback) {
    console.log('authorizePublish', client.id, packet.topic)

    // 内部客户端跳过发布授权
    if (client.id.startsWith(MQTT_SECRET_CLIENT_ID)) {
      return callback(null)
    }

    try {
      const payload = JSON.parse(packet.payload.toString())
      const [topicType, targetId] = packet.topic.split('/')

      const authorizeType = authorizeResolver[topicType]

      if (!authorizeType) {
        throw new Error('无效的发布')
      }

      // throw if error
      await authorizeType({ clientId: client.id, targetId })

      callback(null)
      console.log('authorized publication', client.id, packet.topic)
    } catch (ex) {
      // callback(new Error('验证失败'))
      callback(null)
      console.error('authorizePublish 失败', client.id, packet.topic, ex)
    }
  }

  const authorizeResolver = {
    private: authorizePrivate,
    group: authorizeGroup,
  }

  // 私聊检查
  async function authorizePrivate ({ clientId, targetId }) {
    const foundContact = await mongo.Contacts.findOne({
      userId: clientId,
      contactId: targetId
    })

    if (!foundContact) {
      console.log('发布私聊消息失败', clientId, targetId)
      throw new Error('发布私聊消息失败')
    }
  }

  // 群聊检查
  async function authorizeGroup ({ clientId, targetId }) {
    const foundGroupUser = await mongo.GroupUsers.findOne({
      userId: clientId,
      groupId: targetId
    })

    // 是否为群用户
    if (!foundGroupUser) {
      console.log('发布群聊消息失败', clientId, targetId)
      throw new Error('发布群聊消息失败')
    }
  }
}
