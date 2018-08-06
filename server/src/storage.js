"use strict"

function VideoStorage() {
  return (filename) => (
    `${__dirname}/../../videos/${filename}`
  )
}

function TestStorage() {
  return (filename) => (
    `${__dirname}/../test/fixtures/${filename}`
  )
}

module.exports = {
  VideoStorage: VideoStorage,
  TestStorage: TestStorage
}
