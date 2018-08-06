"use strict"

class RedisMock {
  static createClient() {
    return new RedisMock()
  }

  constructor() {
    this.keys = {}
  }

  hget(hash, key, callback) {
    let val = 0

    if(hash == null || key == null) {
      return callback(new Error("storage and/or key is invalid"), null)
    }

    if(this.keys[hash] && this.keys[hash][key]) {
      val = this.keys[hash][key]
    }

    callback(null, val)
  }

  hgetall(hash, callback) {
    if(this.keys[hash] === undefined) {
      return callback(null, {})
    }

    return callback(null, this.keys[hash])
  }

  hincrby(hash, key, inc) {
    if(this.keys[hash] === undefined) {
      this.keys[hash] = {}
    }

    if(this.keys[hash][key] === undefined) {
      this.keys[hash][key] = 0
    }

    this.keys[hash][key] += inc
  }

  flushall() {
    this.keys = {}
  }
}

module.exports = RedisMock
