import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import https from 'https'

const BASE_FILE = 'video_archive/channel-0000.base'
const OUTPUT_FILE = './quartz/static/video_playlist.json'

// Helper to run Obsidian CLI commands
function obsidian(cmd) {
  try {
    return execSync(`obsidian ${cmd}`, { encoding: 'utf-8' }).trim()
  } catch (e) {
    console.error(`Obsidian CLI Error: ${e.message}`)
    return null
  }
}

function getYouTubeId(url) {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/|shorts\/|watch\?v=)([^?&]+)/)
  return match ? match[1] : null
}

async function scrapeDuration(id) {
  return new Promise((resolve) => {
    https.get(`https://www.youtube.com/watch?v=${id}`, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        const match = data.match(/"approxDurationMs":"(\d+)"/)
        if (match) {
          resolve(Math.floor(parseInt(match[1]) / 1000))
        } else {
          resolve(300)
        }
      })
    }).on('error', () => resolve(300))
  })
}

async function generatePlaylist() {
  console.log('--- CYBERNATI™ STATION MANAGER (SYNC_MODE) ---')
  
  // 1. Query the Base (Implicitly respects the visual sort order)
  console.log(`Pulling visual order from: ${BASE_FILE}...`)
  const queryResult = obsidian(`base:query path="${BASE_FILE}" view="Table" format=json`)
  if (!queryResult) {
    console.error("Critical Failure: Could not query the Base.")
    return
  }
  
  const filesData = JSON.parse(queryResult)
  const playlist = []

  for (const item of filesData) {
    const filePath = item.path
    const fileName = item["file name"]
    const sourceUrl = item.source
    
    if (!sourceUrl) continue
    const id = getYouTubeId(sourceUrl)
    if (!id) continue

    process.stdout.write(`Processing: ${fileName.substring(0, 40)}... `)

    // 2. Duration Logic
    let duration = item.duration ? parseInt(item.duration) : null
    if (!duration || duration === 0) {
      process.stdout.write(`(Scraping) `)
      duration = await scrapeDuration(id)
      obsidian(`property:set name=duration value=${duration} path="${filePath}" type=number`)
    }

    // 3. Process related notes (Clean [[ ]] and | aliases at the source)
    let related = []
    if (item.related) {
      const rawRelated = typeof item.related === 'string' 
        ? item.related.split(',').map(s => s.trim()) 
        : (Array.isArray(item.related) ? item.related : [])

      related = rawRelated.map(link => {
        return link.replace(/[\[\]]/g, '').split('|')[0].trim()
      })
    }


    playlist.push({ id, duration, title: fileName, related })
    console.log(`[OK]`)
  }

  const data = {
    schedule: playlist,
    interstitials: [
      '/static/interstitials/int-01.mp4',
      '/static/interstitials/int-02.mp4',
      '/static/interstitials/int-03.mp4'
    ]
  }

  // 4. Atomic Force-Write
  try {
    const outputDir = path.dirname(OUTPUT_FILE)
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
    
    // Explicitly delete if exists to bypass locks/caching
    if (fs.existsSync(OUTPUT_FILE)) fs.unlinkSync(OUTPUT_FILE)
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error(`File System Error: ${e.message}`)
    return
  }

  console.log(`\n==============================================`)
  console.log(`📡 BROADCAST TERMINAL: SYNCHRONIZATION COMPLETE`)
  console.log(`==============================================`)
  console.log(`Active Signal: ${playlist[0]?.title || 'NONE'}`)
  console.log(`Total Loop: ${playlist.length} signals`)
  console.log(`==============================================\n`)
}

generatePlaylist()
