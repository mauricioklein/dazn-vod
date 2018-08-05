"use strict"

const { expect } = require("chai")
const redisMock = require("./redis-mock")
const Storage = require("../src/storage")

describe("Storage", () => {
  const redisConn = redisMock.createClient()
  const storage = new Storage(redisConn)

  const keyName = "activeConnections"

  afterEach(() => redisConn.flushall())

  describe("#activeConnectionsFor", () => {
    const username = "john"

    describe("with user not yet in Redis", () => {
      it("returns 0 active connections", () => {
        storage.activeConnectionsFor(username, (_, value) => {
          expect(value).to.equal(0)
        })
      })
    })

    describe("with user already in Redis", () => {
      beforeEach(() => { redisConn.hincrby(keyName, username, 2) })

      it("returns 2 active connections", () => {
        storage.activeConnectionsFor(username, (_, value) => {
          expect(value).to.equal(2)
        })
      })
    })
  })

  describe("#incrementConnectionsFor", () => {
    const username = "john"

    describe("with user not yet in Redis", () => {
      it("returns 1 active connection", () => {
        storage.incrementConnectionsFor(username)

        redisConn.hget(keyName, username, (_, value) => {
          expect(value).to.equal(1)
        })
      })
    })

    describe("with user already in Redis", () => {
      beforeEach(() => { redisConn.hincrby(keyName, username, 2) })

      it("returns 3 active connections", () => {
        storage.incrementConnectionsFor(username)

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
      storage.decrementConnectionsFor(username)

      redisConn.hget(keyName, username, (_, value) => {
        expect(value).to.equal(1)
      })
    })
  })
})
