"use strict"

const userConnsHash = "activeConnections"

class Auth {
  constructor(conn) {
    this.conn = conn
  }

  activeConnectionsFor(username, callback) {
    this.conn.hget(userConnsHash, username, callback)
  }

  incrementConnectionsFor(username) {
    this.conn.hincrby(userConnsHash, username, 1)
  }

  decrementConnectionsFor(username) {
    this.conn.hincrby(userConnsHash, username, -1)
  }

  allConnections(callback) {
    this.conn.hgetall(userConnsHash, callback)
  }
}

module.exports = Auth
