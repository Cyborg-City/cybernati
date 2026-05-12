/**
 * @fileoverview Broadcast Component Structural Tests
 *
 * These tests validate the Broadcast.tsx component file itself.
 * They ensure that the component renders an iframe pointing to player.html.
 *
 * If the embed logic breaks, these tests will fail.
 */

import test, { describe } from "node:test"
import assert from "node:assert"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BROADCAST_PATH = path.join(__dirname, "Broadcast.tsx")

function readBroadcastFile(): string {
  return fs.readFileSync(BROADCAST_PATH, "utf-8")
}

describe("Broadcast.tsx Structural Integrity", () => {
  const source = readBroadcastFile()

  test("component renders an iframe", () => {
    const hasIframe = /<iframe/.test(source)
    assert.strictEqual(hasIframe, true, "Broadcast must render an iframe element")
  })

  test("iframe src points to player.html", () => {
    const hasPlayerHtml = /player\.html/.test(source)
    assert.strictEqual(hasPlayerHtml, true, "iframe src must reference player.html")
  })

  test("iframe has explicit height for layout stability", () => {
    const hasHeight = /height="\d+"/.test(source)
    assert.strictEqual(hasHeight, true, "iframe must have explicit height to prevent layout shift")
  })

  test("iframe has no border", () => {
    const hasNoBorder = /frameborder="0"/.test(source)
    assert.strictEqual(hasNoBorder, true, "iframe must have frameborder=0")
  })

  test("component has embed container CSS", () => {
    const hasContainer = /broadcast-embed-container/.test(source)
    assert.strictEqual(hasContainer, true, "must have .broadcast-embed-container CSS class")
  })

  test("component no longer contains inline player markup", () => {
    // The old component had terminal markup, JS, CSS all inline.
    // Now it should only contain the iframe — no player-mount, no script block.
    const hasPlayerMount = /id="player-mount"/.test(source)
    assert.strictEqual(hasPlayerMount, false, "must NOT contain player-mount div — player lives in player.html")

    const hasScriptBlock = /dangerouslySetInnerHTML/.test(source)
    assert.strictEqual(hasScriptBlock, false, "must NOT contain dangerouslySetInnerHTML — JS lives in player.html")
  })
})

console.log("✅ Broadcast Component Structural Tests Loaded")
