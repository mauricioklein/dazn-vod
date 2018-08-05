"use strict"

const socketIO = require("socket.io")
const ss = require("socket.io-stream")
const auth = require("socketio-auth")
const fs = require("fs")
const Log = require("log"),
      log = new Log("info")

const pathFor = (file) => (
  `${__dirname}/../../videos/${file}`
)

const socket = function(server, storage) {
  const io = socketIO(server)

  io.on("connection", (socket) => {
    ss(socket).on("stream", (stream, file="small.webm") => {
      log.info(`Streaming video "${file}" for user "${socket.client.username}"`)
      fs.createReadStream(pathFor(file)).pipe(stream)
    })
  })

  auth(io, {
    authenticate: (socket, data, callback) => {
      storage.activeConnectionsFor(data.username, (err, result) => {
        if(err) {
          log.error(`Error retrieving active connections for "${data.username}": `, err)
          callback(new Error("An internal error happened"))
          return
        }

        const activeConnections = parseInt(result)

        if(activeConnections >= 3) {
          log.info(`Connection for "${data.username}" denied: too many connections (${activeConnections})`)
          callback(new Error("Max simultaneous connections reached"))
        } else {
          callback(null, true)
        }
      })
    },
    postAuthenticate: (socket, data) => {
      log.info(`User "${data.username}" connected`)

      storage.incrementConnectionsFor(data.username)
      socket.client.username = data.username
    },
    disconnect: (socket) => {
      const { username } = socket.client

      // authentication failed: no client associated
      if(!username) { return }

      log.info(`User "${username}" disconnected`)

      storage.decrementConnectionsFor(username)
    }
  })

  return io
}

module.exports = socket
