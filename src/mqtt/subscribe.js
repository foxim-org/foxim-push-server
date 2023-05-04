const { MQTT_SECRET_CLIENT_ID } = process.env

module.exports = function ({ aedes, mongo }) {
  aedes.authorizeSubscribe = async function (client, sub, callback) {
    console.log('authorizeSubscribe', client.id, sub)

    // if (process.env.NODE_ENV !== 'production') {
    //   return callback(null, sub)
    // }

    // 内部客户端跳过订阅授权
    if (client.id.startsWith(MQTT_SECRET_CLIENT_ID)) {
      return callback(null, sub)
    }

    try {
      const topicPath = sub.topic.split('/')
      const [topicType, targetId] = topicPath

      const authorizeType = authorizeResolver[topicType]

      if (!authorizeType) {
        throw new Error('无效的订阅')
      }

      sub.qos = sub.qos || 1

      await authorizeType({
        clientId: client.id,
        sub,
        topicPath,
        topicType,
        targetId
      })

      callback(null, sub)
    } catch (ex) {
      console.log('authorizeSubscribe 失败', ex)
      // 拒绝订阅需要返回空，否则客户端会掉
      // https://github.com/moscajs/aedes/blob/main/docs/Aedes.md#handler-authorizesubscribe-client-subscription-callback
      callback(null, null)
    }
  }

  // 允许的话题前缀和对应的授权函数
  const authorizeResolver = {
    private: authorizePrivate, // 私聊
    group: authorizeGroup, // 群聊
    'my-group': authorizeMyGroup,
  }

  // 私聊检查
  async function authorizePrivate ({ clientId, sub, topicPath, topicType, targetId }) {
    if (!targetId) {
      throw new Error('无效的订阅话题')
    }

    if (clientId !== targetId) {
      console.log('订阅私聊失败', clientId, topicPath)
      throw new Error('订阅私聊失败')
    }
  }

  // 群聊检查
  async function authorizeGroup ({ clientId, sub, topicPath, topicType, targetId }) {
    const foundGroupUser = await mongo.GroupUsers.findOne({
      userId: clientId,
      groupId: targetId
    })

    // 是否为群用户
    if (!foundGroupUser) {
      console.log('订阅群聊失败', clientId, topicPath)
      throw new Error('订阅群聊失败')
    }
  }

  // 群聊检查
  async function authorizeMyGroup ({ clientId, sub, topicPath, topicType, targetId }) {
    if (!targetId) {
      throw new Error('订阅 my-group 缺少 clientId')
    }

    if (clientId !== targetId) {
      console.log('订阅 my-group 身份不一致', clientId, topicPath)
      throw new Error('订阅 my-group 身份不一致')
    }
  }
}
