const { MongoClient } = require('mongodb')

const {
  MQTT_MONGO_URL
} = process.env

const mongo = new MongoClient(MQTT_MONGO_URL)

mongo.connect()

// use db name from MQTT_MONGO_URL
const db = mongo.db()

mongo.Bots = db.collection('bots')
mongo.Contacts = db.collection('contacts')
mongo.GroupMessages = db.collection('group-messages')
mongo.Groups = db.collection('group')
mongo.GroupUsers = db.collection('groupUsers')
mongo.PrivateMessages = db.collection('private-messages')
mongo.Users = db.collection('User')

module.exports = mongo
