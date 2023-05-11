const { ObjectID } = require('mongodb')

const { groupQueue } = require('../queue/group')
const { myGroupQueue } = require('../queue/my-group')

const mem = require('../mem')

module.exports = function ({ aedes, mongo }) {
  aedes.on('clientDisconnect', async function (client) {
    // 系统事件，不需要处理
    if (!client) return

    console.log('clientDisconnect', client.id)
    mongo.Users.updateOne({ _id: new ObjectID(client.id) }, { $set: { statusText: '离线' } })
  })

  // 用户发布验证成功后触发
  aedes.on('publish', async function (packet, client) {
    // 系统事件，不需要处理
    if (!client) return

    // don't know why can't trigger forward
    if (packet.topic.startsWith('group') && packet.topic.endsWith('read')) {
      const payload = JSON.parse(packet.payload.toString())
      mem.set(payload.groupId + client.id, 0)
    }

    try {
      const clientId = client.id
      const topic = packet.topic
      const payload = JSON.parse(packet.payload.toString())

      const [topicType, targetId, targetAction] = topic.split('/')

      // fix convert?
      payload.createdAt = new Date(payload.createdAt)

      console.log('on publish before resolver', clientId, topic, payload, topicType, targetId, targetAction)
      topicTypeResolver[topicType]({ clientId, topic, payload, topicType, targetId, targetAction })
    } catch (ex) {
      console.log('on publish failed with', ex)
    }
  })

  const topicTypeResolver = {
    private: privateResolver, // 决定如何处理私聊消息
    group: groupResolver, // 决定如何处理群聊消息
    'my-group': myGroupResolver, // 决定如何处理群聊消息
  }

  async function privateResolver ({ clientId, topic, payload, topicType, targetId, targetAction }) {
    // 已读
    if (targetAction === 'read') {
      mongo.Contacts.updateOne({ userId: targetId, contactId: clientId }, { $set: { msgCount: 0, newCount: 0 } })

      return
    }

    // 撤回
    if (targetAction === 'unsend' || targetAction === 'recall') {
      console.log('删除', {id: payload.id,
        userId: clientId,})
      const msg = await mongo.PrivateMessages.deleteOne({
        id: payload.id,
        //userId: clientId,
      })

      return
    }

    // 没有特殊情况正常保存消息历史记录
    const message = {
      ...payload,
      _id: new ObjectID(),
      userId: clientId,
      contactId: targetId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // legacy-save
    if (payload.type === 'agree') {
      message.userId = payload.userId
    }

    delete message.groupName
    delete message.groupId

    mongo.PrivateMessages.insertOne(message)

    mongo.Contacts.updateOne({ userId: targetId, contactId: message.userId || clientId }, { $inc: { msgCount: 1 } })

    mongo.Contacts.updateMany({
      $or: [{ userId: message.userId || clientId, contactId: targetId }, { userId: targetId, contactId: message.userId || clientId }]
    }, {
      $set: {
        recentAt: new Date(),
        lastText: payload.text,
        lastDisplayName: payload.displayName
      }
    })
  }

  async function groupResolver ({ clientId, topic, payload, topicType, targetId, targetAction }) {
    if (payload.__ignore) return

    if (targetAction === 'read') {
      mongo.Groups.updateOne({ userId: clientId, groupId: targetId }, { $set: { msgCount: 0, newCount: 0 } })

      return
    }

    // 撤回
    // 同时撤回转发群？
    if (targetAction === 'unsend' || targetAction === 'recall') {
      mongo.GroupMessages.deleteOne({ id: payload.id, userId: clientId })
      return
    }

    if (payload.$type !== 'FORWARD') {
      // 转发条件
      const forwardGroups = {
        _id: new ObjectID(targetId),
        'autoForward.forward': true,
        'autoForward.sourceIds': clientId,
        'autoForward.targetIdsToGroup': { $exists: true, $not: { $size: 0 } },
      }

      mongo.Bots.findOne(forwardGroups).then(function (group) {
        if (!group) return

        const { contactId, ...restPayload } = payload

        if (group?.autoForward?.targetIdsToGroup?.length) {
          groupQueue.add('group-forward', {
            ...restPayload,
            $type: 'FORWARD',
            targetIds: group.autoForward.targetIdsToGroup, // 目标群
          }, {
            delay: group?.delayed || 0, // 转发延迟设置
          })
        }
      })
    }

    // add new group sender here
    myGroupQueue.add('send-to-group-users', {
      ...payload,
      $type: 'GROUP-MESSAGE',
      groupId: targetId,
      __clientId: clientId,
    })

    // 没有特殊情况正常保存消息历史记录
    const message = {
      ...payload,
      _id: new ObjectID(),
      userId: clientId,
      groupId: targetId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    delete message.contactId

    mongo.GroupMessages.insertOne(message)

    mongo.Groups.updateMany({ groupId: targetId }, { inc: { msgCount: 1, newCount: 1 } })

    // 更新群组排序
    mongo.Groups.updateOne({
      _id: new ObjectID(targetId),
    }, {
      $set: {
        recentAt: new Date(),
        lastText: payload.text,
        lastDisplayName: payload.displayName
      }
    })
  }

  async function myGroupResolver ({ clientId, topic, payload, topicType, targetId, targetAction }) {
    console.log('nothing to do here')
  }
}
