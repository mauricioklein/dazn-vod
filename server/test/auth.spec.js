"use strict"

const { expect } = require("chai")
const redisMock = require("./redis-mock")
const Auth = require("../src/auth")

describe("Auth", () => {
  const redisConn = redisMock.createClient()
  const auth = new Auth(redisConn)

  const keyName = "activeConnections"

  afterEach(() => redisConn.flushall())

  describe("#activeConnectionsFor", () => {
    const username = "john"

    describe("with user not yet in Redis", () => {
      it("returns 0 active connections", () => {
        auth.activeConnectionsFor(username, (_, value) => {
          expect(value).to.equal(0)
        })
      })
    })

    describe("with user already in Redis", () => {
      beforeEach(() => { redisConn.hincrby(keyName, username, 2) })

      it("returns 2 active connections", () => {
        auth.activeConnectionsFor(username, (_, value) => {
          expect(value).to.equal(2)
        })
      })
    })
  })

  describe("#incrementConnectionsFor", () => {
    const username = "john"

    describe("with user not yet in Redis", () => {
      it("returns 1 active connection", () => {
        auth.incrementConnectionsFor(username)

        redisConn.hget(keyName, username, (_, value) => {
          expect(value).to.equal(1)
        })
      })
    })

    describe("with user already in Redis", () => {
      beforeEach(() => { redisConn.hincrby(keyName, username, 2) })

      it("returns 3 active connections", () => {
        auth.incrementConnectionsFor(username)

        redisConn.hget(keyName, username, (_, value) => {
          expect(value).to.equal(3)
        })
      })
    })
  })

  describe("#decrementConnectionsFor", () => {
    const username = "john"

    beforeEach(() => { redisConn.hincrby(keyName, username, 2) })

    it("returns 1 active connection", () => {
      auth.decrementConnectionsFor(username)

      redisConn.hget(keyName, username, (_, value) => {
        expect(value).to.equal(1)
      })
    })
  })

  describe("#allConnections", () => {
    it("returns the active connections for all users", (done) => {
      redisConn.hincrby(keyName, "peter", 1)
      redisConn.hincrby(keyName, "john", 2)
      redisConn.hincrby(keyName, "paul", 3)

      auth.allConnections((_, histogram) => {
        expect(histogram).to.deep.equal({
          peter: 1,
          john: 2,
          paul: 3
        })

        done()
      })
    })
  })
})
