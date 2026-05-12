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

    test("startLoop resyncs player if drift exceeds 3 seconds", () => {
      // Must check getCurrentTime and seekTo when on correct video
      const hasDriftCheck = /const\s+drift\s*=\s*Math\.abs\(self\.player\.getCurrentTime\(\)\s*-\s*off\)/.test(source)
      assert.strictEqual(hasDriftCheck, true, "startLoop must calculate drift between player time and expected offset")

      const hasSeekTo = /if\s*\(\s*drift\s*>\s*3\s*\)\s*self\.player\.seekTo\(off,\s*true\)/.test(source)
      assert.strictEqual(hasSeekTo, true, "startLoop must seekTo correct offset when drift > 3 seconds")
    })

    test("drift resync is gated behind isDesynced check", () => {
      // The update() function must bail out early when desynced
      const hasDesyncGuard = /if\s*\(\s*self\.isDesynced\s*\)\s*return/.test(source)
      assert.strictEqual(hasDesyncGuard, true, "update() must return early when isDesynced is true")

      // seekTo must only appear after the desync guard (inside normal loop path)
      const driftCheckPosition = source.indexOf("self.player.getCurrentTime()")
      const desyncGuardPosition = source.indexOf("if (self.isDesynced) return")
      assert.ok(driftCheckPosition > desyncGuardPosition, "drift check must come after isDesynced guard")
    })

    test("nav listener checks YT readiness before init", () => {
      const hasYTCheck = /if\s*\(\s*document\.getElementById\('player-mount'\)\s*&&\s*window\.YT\s*&&\s*window\.YT\.Player\s*\)/.test(source)
      assert.strictEqual(hasYTCheck, true, "nav listener must check window.YT && window.YT.Player before init")
    })

    test("destroy clears mount element innerHTML", () => {
      const clearsMount = /const\s+mount\s*=\s*document\.getElementById\('player-mount'\)/.test(source) &&
                          /if\s*\(\s*mount\s*\)\s*mount\.innerHTML\s*=\s*''/.test(source)
      assert.strictEqual(clearsMount, true, "destroy() must clear player-mount innerHTML to remove zombie iframes")
    })

    test("init guards against double-calls with isInitializing flag", () => {
      const hasGuard = /if\s*\(\s*this\.isInitializing\s*\)\s*return/.test(source)
      assert.strictEqual(hasGuard, true, "init() must have isInitializing guard to prevent concurrent calls")
    })

    test("init checks YT readiness before proceeding", () => {
      const hasYTCheck = /if\s*\(\s*!mount\s*\|\|\s*!window\.YT\s*\|\|\s*!window\.YT\.Player\s*\)\s*return/.test(source)
      assert.strictEqual(hasYTCheck, true, "init() must check window.YT && window.YT.Player before proceeding")
    })

    test("onReady does NOT call playVideo (rely on autoplay)", () => {
      const hasPlayVideo = /e\.target\.playVideo\(\)/.test(source)
      assert.strictEqual(hasPlayVideo, false, "onReady must NOT call playVideo() — rely on autoplay:1 + mute:1")
    })
  })

  describe("JSX Structure", () => {
    test("header-brand wrapper exists for icon + version", () => {
      const hasBrand = /class="header-brand"/.test(source)
      assert.strictEqual(hasBrand, true, ".header-brand wrapper must exist for icon + version row")
    })

    test("terminal-header uses flex-direction column", () => {
      const hasColumn = /flex-direction:\s*column/.test(source)
      assert.strictEqual(hasColumn, true, ".terminal-header must use flex-direction: column")
    })

    test("mountStandby checks existing video src before recreating", () => {
      const hasExistingCheck = /const\s+existing\s*=\s*mount\.querySelector\('video'\)/.test(source)
      assert.strictEqual(hasExistingCheck, true, "mountStandby must check existing video element")

      const hasSrcGuard = /if\s*\(\s*existing\s*&&\s*existing\.getAttribute\('src'\)\s*===\s*intFile\s*\)\s*return/.test(source)
      assert.strictEqual(hasSrcGuard, true, "mountStandby must return early if same interstitial is already playing")
    })

    test("sync-progress bar exists", () => {
      const hasProgressBar = /id="sync-progress"/.test(source)
      assert.strictEqual(hasProgressBar, true, "sync-progress bar missing")
    })

    test("desync button exists", () => {
      const hasDesyncBtn = /id="desync-btn"/.test(source)
      assert.strictEqual(hasDesyncBtn, true, "desync button missing")
    })

    test("handshake-hint text is removed from JSX", () => {
      const hasHint = /id="handshake-hint"/.test(source)
      assert.strictEqual(hasHint, false, "#handshake-hint element should be removed from JSX")
    })

    test("mute-btn has muted class with blink animation", () => {
      const hasMutedClass = /\.mute-btn\.muted\s*\{/.test(source)
      assert.strictEqual(hasMutedClass, true, ".mute-btn.muted CSS rule missing")

      const hasBlinkAnimation = /animation:\s*blink\s+1s\s+infinite/.test(source)
      assert.strictEqual(hasBlinkAnimation, true, ".mute-btn.muted must have blink animation")
    })

    test("mute toggle toggles muted class on button", () => {
      // Must toggle class in mute button onclick
      const hasToggle = /muteBtn\.classList\.toggle\('muted',\s*self\.isMuted\)/.test(source)
      assert.strictEqual(hasToggle, true, "mute button onclick must toggle 'muted' class")

      // Must also toggle on volume slider change
      const hasSliderToggle = /muteBtn\.classList\.toggle\('muted',\s*self\.isMuted\)/g
      const matches = source.match(hasSliderToggle)
      assert.ok(matches && matches.length >= 2, "volume slider oninput must also toggle 'muted' class")
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
