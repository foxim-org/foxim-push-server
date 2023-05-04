const {
  JWT_SECRET,
  MQTT_SECRET_CLIENT_ID
} = process.env

const { ObjectID } = require('mongodb')
const { createVerifier } = require('fast-jwt')

const verifySync = createVerifier({ key: Buffer.from(JWT_SECRET, 'base64') })

module.exports = function ({ aedes, mongo }) {
  aedes.authenticate = async function (client, username, password, callback) {
    console.log('authenticate', client.id, username, password?.toString())

    // 客户端不能没有 id，id 需要 unique
    if (!client.id) {
      console.log('no client id', client.id)
      return callback('登录验证失败')
    }

    // 内部客户端跳过验证
    if (client.id.startsWith(MQTT_SECRET_CLIENT_ID)) {
      return callback(null, true)
    }

    try {
      if (!username || !password) {
        console.log('authenticate no input', client.id, username, password)
        throw new Error('登录验证失败')
      }

      const token = Buffer.from(password).toString('utf-8')
      const auth = verifySync(token)

      console.log('log auth', auth)

      const user = await mongo.Users.findOne({
        $or: [
          { _id: auth.userId || auth._id || auth.id },
          { _id: new ObjectID(auth.userId || auth._id || auth.id) },
        ]
      })
      
      // const user = await mongo.Users.findOne({ _id: new ObjectID(auth.id) })
      console.log(user)

      if (!user) {
        console.log('authenticate user not found', client.id, username, password)
        throw new Error('登录验证失败')
      }

      mongo.Users.updateOne({ _id: new ObjectID(client.id) }, { $set: { statusText: '在线' } })

      callback(null, true)
    } catch (ex) {
      console.error('authenticate 失败', ex)
      callback(ex)
    }
  }
}
