/**
 * @fileoverview Broadcast Component Structural Tests
 *
 * These tests validate the Broadcast.tsx component file itself.
 * They ensure that CSS color changes don't accidentally corrupt
 * the embedded JavaScript logic inside dangerouslySetInnerHTML.
 *
 * If a CSS edit breaks the player, these tests will fail.
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

  describe("CSS Color Requirements", () => {
    test("terminal-version is white (#fff)", () => {
      // Must use #fff, not #0f0 or any other color
      const match = source.match(/\.terminal-version\s*\{[^}]*color:\s*(#[0-9a-fA-F]+)/)
      assert.ok(match, "terminal-version CSS rule with color property not found")
      assert.strictEqual(match[1].toLowerCase(), "#fff", `terminal-version color is ${match[1]}, expected #fff`)
    })

    test("footer-section label is white (#fff)", () => {
      const match = source.match(/\.footer-section\s+\.label\s*\{[^}]*color:\s*(#[0-9a-fA-F]+)/)
      assert.ok(match, "footer-section .label CSS rule with color property not found")
      assert.strictEqual(match[1].toLowerCase(), "#fff", `footer-section .label color is ${match[1]}, expected #fff`)
    })

    test("vault-link text is white (#fff)", () => {
      const match = source.match(/\.vault-link\s*\{[^}]*color:\s*(#[0-9a-fA-F]+)/)
      assert.ok(match, "vault-link CSS rule with color property not found")
      assert.strictEqual(match[1].toLowerCase(), "#fff", `vault-link color is ${match[1]}, expected #fff`)
    })

    test("desync-action-btn text is white (#fff)", () => {
      const match = source.match(/\.desync-action-btn\s*\{[^}]*color:\s*(#[0-9a-fA-F]+)/)
      assert.ok(match, "desync-action-btn CSS rule with color property not found")
      assert.strictEqual(match[1].toLowerCase(), "#fff", `desync-action-btn color is ${match[1]}, expected #fff`)
    })

    test("embed-btn CSS class is removed (using desync-action-btn instead)", () => {
      const hasEmbedBtnClass = /\.embed-btn\s*\{/.test(source)
      assert.strictEqual(hasEmbedBtnClass, false, ".embed-btn CSS class should not exist — use .desync-action-btn for embed trigger")
    })
  })

  describe("JavaScript Logic Integrity", () => {
    test("mountVideo does NOT have buggy early-return on currentVideoId", () => {
      // The old buggy code was:
      //   if (!mount || this.currentVideoId === prog.id) return;
      // The fixed code checks player state instead.
      const scriptMatch = source.match(/mountVideo:[^}]*\{[\s\S]*?\n                    \}/)
      assert.ok(scriptMatch, "mountVideo function not found in script block")

      const mountVideoBody = scriptMatch[0]

      // Must NOT have the old buggy pattern
      const hasBuggyPattern = /this\.currentVideoId\s*===\s*prog\.id.*return/.test(mountVideoBody)
      assert.strictEqual(hasBuggyPattern, false, "mountVideo still has buggy early-return: 'this.currentVideoId === prog.id' — this prevents video reloads when the player hasn't actually loaded")

      // Must have the fixed pattern: check player.getPlayerState()
      const hasFixedPattern = /getPlayerState\(\)/.test(mountVideoBody)
      assert.strictEqual(hasFixedPattern, true, "mountVideo missing fixed pattern: getPlayerState() check")
    })

    test("mountVideo destroys existing player before creating new one", () => {
      const scriptMatch = source.match(/mountVideo:[^}]*\{[\s\S]*?\n                    \}/)
      assert.ok(scriptMatch, "mountVideo function not found")

      const mountVideoBody = scriptMatch[0]

      // Must destroy existing player
      const hasDestroy = /this\.player\s*&&\s*this\.player\.destroy/.test(mountVideoBody)
      assert.strictEqual(hasDestroy, true, "mountVideo should destroy existing player before creating new one")
    })

    test("desync button clears both timers on toggle", () => {
      const scriptMatch = source.match(/desyncBtn\.onclick\s*=\s*\(\)[\s\S]*?\n                        \};/)
      assert.ok(scriptMatch, "desyncBtn onclick handler not found")

      const handlerBody = scriptMatch[0]

      // Must clear desyncTimer
      const clearsDesync = /clearInterval\(self\.desyncTimer\)/.test(handlerBody)
      assert.strictEqual(clearsDesync, true, "desync button must clear desyncTimer")

      // Must clear updateTimer
      const clearsUpdate = /clearInterval\(self\.updateTimer\)/.test(handlerBody)
      assert.strictEqual(clearsUpdate, true, "desync button must clear updateTimer")

      // Must reset player state
      const resetsPlayer = /self\.player\s*=\s*null/.test(handlerBody)
      assert.strictEqual(resetsPlayer, true, "desync button must reset player to null")
    })

    test("startLoop only calls mountVideo when video ID changes", () => {
      const scriptMatch = source.match(/startLoop:[^}]*\{[\s\S]*?\n                    \}/)
      assert.ok(scriptMatch, "startLoop function not found")

      const loopBody = scriptMatch[0]

      // Must have the ID comparison guard
      const hasIdCheck = /self\.currentVideoId\s*!==\s*active\.id/.test(loopBody)
      assert.strictEqual(hasIdCheck, true, "startLoop should only mount when currentVideoId !== active.id")
    })

    test("nav listener always destroys before init", () => {
      // Must destroy first, then use requestAnimationFrame for init
      const hasDestroyFirst = /window\.CyberPlayer\.destroy\(\)/.test(source)
      assert.strictEqual(hasDestroyFirst, true, "nav listener must destroy() before anything else")

      const hasRAF = /requestAnimationFrame/.test(source)
      assert.strictEqual(hasRAF, true, "nav listener must use requestAnimationFrame before init")

      // Must NOT have the old buggy pattern
      const hasOldPattern = /if\s*\(\s*document\.getElementById\('player-mount'\)\s*\)\s*window\.CyberPlayer\.init\(\)/.test(source)
      assert.strictEqual(hasOldPattern, false, "nav listener must NOT init directly — must use RAF after destroy")
    })
  })

  describe("JSX Structure", () => {
    test("player-mount div exists with correct ID", () => {
      const hasPlayerMount = /id="player-mount"/.test(source)
      assert.strictEqual(hasPlayerMount, true, "player-mount div missing")
    })

    test("sync-progress bar exists", () => {
      const hasProgressBar = /id="sync-progress"/.test(source)
      assert.strictEqual(hasProgressBar, true, "sync-progress bar missing")
    })

    test("desync button exists", () => {
      const hasDesyncBtn = /id="desync-btn"/.test(source)
      assert.strictEqual(hasDesyncBtn, true, "desync button missing")
    })

    test("program-info status text is removed from JSX", () => {
      const hasProgramInfo = /id="program-info"/.test(source)
      assert.strictEqual(hasProgramInfo, false, "#program-info element should be removed from JSX")
    })

    test("embed-trigger uses desync-action-btn class", () => {
      const hasEmbedTrigger = /id="embed-trigger"/.test(source)
      assert.strictEqual(hasEmbedTrigger, true, "embed-trigger button missing")

      const usesCorrectClass = /id="embed-trigger"[^>]*class="desync-action-btn"/.test(source)
      assert.strictEqual(usesCorrectClass, true, "embed-trigger must use desync-action-btn class")
    })
  })
})

console.log("✅ Broadcast Component Structural Tests Loaded")
