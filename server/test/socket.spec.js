"use strict"

const { expect } = require("chai")
const redisMock = require("./redis-mock")
const Auth = require("../src/auth")
const Socket = require("../src/socket")
const { TestStorage } = require("../src/storage")

const socketIO = require("socket.io-client")
const ss = require("socket.io-stream")

const startServer = (auth) => {
  const app = require("express")()
  const server = require("http").Server(app)
  const storageResolver = new TestStorage()

  // Initiates the Socket.io server
  Socket(server, auth, storageResolver)

  server.listen(3000)

  return server
}

describe("Socket", () => {
  const redisConn = redisMock.createClient()
  const auth = new Auth(redisConn)

  let server

  beforeEach(() => { server = startServer(auth) })
  afterEach(() => {
    server.close()
    redisConn.flushall()
  })

  describe("#authentication", () => {
    describe("with first authentication for user", () => {
      let client = socketIO("http://localhost:3000")

      afterEach(() => client.disconnect())

      it("authenticates successfully", (done) => {
        client.emit("authentication", { username: "john" })
        client.on("authenticated", () => { done() })
        client.on("unauthorized", () => { done(new Error("Unexpected unauthorized received")) })
      })
    })

    describe("with excessive number of connections", () => {
      const client = socketIO("http://localhost:3000")

      beforeEach(() => { redisConn.hincrby("activeConnections", "john", 5) })
      afterEach(() => { client.disconnect() })

      it("is disconnected due too many open connections", (done) => {
        client.emit("authentication", { username: "john" })
        client.on("authenticated", () => { done(new Error("Unexpected authenticated received")) })
        client.on("unauthorized", (error) => {
          expect(error.message).to.equal("Max simultaneous connections reached")
          done()
        })
      })
    })

    describe("with invalid username", () => {
      const client = socketIO("http://localhost:3000")

      afterEach(() => { client.disconnect() })

      it("refuses authentication and returns an error", (done) => {
        client.emit("authentication", { username: null })
        client.on("authenticated", () => { done(new Error("Unexpected authenticated received")) })
        client.on("unauthorized", (error) => {
          expect(error.message).to.equal("Failed to fetch user's active connections")
          done()
        })
      })
    })
  })

  describe("#stream", () => {
    let client = socketIO("http://localhost:3000")
    let stream = ss.createStream()

    afterEach(() => { client.disconnect() })

    it("streams the file", (done) => {
      client.on("authenticated", () => {
        stream.on("data", (data) => {
          expect(String(data)).to.equal("Hello World!\n")
          done()
        })

        ss(client).emit("stream", stream, "test.txt")
      })

      client.emit("authentication", { username: "john" })
    })
  })
})
