"use strict"

const socketIO = require("socket.io")
const ss = require("socket.io-stream")
const auth = require("socketio-auth")
const fs = require("fs")

const socket = function(server, userAuth, storageResolver, log) {
  const io = socketIO(server)

  io.on("connection", (socket) => {
    ss(socket).on("stream", (stream, file="small.webm") => {
      log.info(`Streaming video "${file}" for user "${socket.client.username}"`)
      fs.createReadStream(storageResolver(file)).pipe(stream)
    })
  })

  auth(io, {
    authenticate: (socket, data, callback) => {
      userAuth.activeConnectionsFor(data.username, (err, result) => {
        if(err) {
          log.error(`Failed to retrieve active connections for "${data.username}": `, err.message)
          return callback(new Error("Failed to fetch user's active connections"), null)
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

      userAuth.incrementConnectionsFor(data.username)
      socket.client.username = data.username
    },
    disconnect: (socket) => {
      const { username } = socket.client

      // authentication failed: no client associated
      if(!username) { return }

      log.info(`User "${username}" disconnected`)

      userAuth.decrementConnectionsFor(username)
    }
  })

  return io
}

module.exports = socket
