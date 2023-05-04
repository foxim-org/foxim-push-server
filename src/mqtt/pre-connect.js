module.exports = function ({ aedes, mongo }) {
  aedes.preConnect = function (client, packet, callback) {
    console.log('preConnect', client?.conn?.remoteAddress, client?.id)
    callback(null, true)
  }
}
