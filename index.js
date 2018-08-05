"use strict"

const express = require("express")
const http = require("http")

const Redis = require("redis")

const app = express()
const server = http.Server(app)

const Storage = require("./server/src/storage")
const Socket = require("./server/src/socket")

const redisUrl = process.env.REDIS_URL || "127.0.0.1"
const redisPort = process.env.REDIS_PORT || "6379"
const port = process.env.PORT || 3000

// create storage
const redisConn = Redis.createClient({ host: redisUrl, port: redisPort })
const storage = new Storage(redisConn)

new Socket(server, storage)

// serve static files on /public folder
app.use(express.static("public"))

// healthz route
app.get("/healthz", (_, res) => {
  res.json({ status: "OK" })
})

// route to histogram of active connections
app.get("/histogram", (_, res) => {
  storage.histogram((_, data) => {
    res.json(data)
  })
})

server.listen(port, () => {
  console.log("Listening on port 3000...")
})
