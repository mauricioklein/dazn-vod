"use strict"

const { expect } = require("chai")
const {
  VideoStorage,
  TestStorage
} = require("../src/storage")

describe("Storage", () => {
  describe("VideoStorage", () => {
    const resolver = new VideoStorage()

    it("resolves the file in the videos/ folder", () => {
      expect(resolver("foo.webm").endsWith("videos/foo.webm")).to.be.true
    })
  })

  describe("TestStorage", () => {
    const resolver = new TestStorage()

    it("resolves the file in the fixtures/ folder", () => {
      expect(resolver("foo.webm").endsWith("fixtures/foo.webm")).to.be.true
    })
  })
})
