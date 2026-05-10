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
  console.log('--- CYBERNATI™ STATION MANAGER (PATH_RESOLVE_MODE) ---')
  
  // 1. Pre-fetch all vault files for precise lookup
  console.log("Indexing vault for path resolution...")
  const allFilesRaw = obsidian(`files total`) // Get all files
  const vaultIndex = obsidian(`files`).split('\n').map(p => p.trim()).filter(p => p.endsWith('.md'))

  // 2. Query the Base
  console.log(`Pulling visual order from: ${BASE_FILE}...`)
  const queryResult = obsidian(`base:query path="${BASE_FILE}" view="Table" format=json`)
  if (!queryResult) return
  
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

    // Duration Logic
    let duration = item.duration ? parseInt(item.duration) : null
    if (!duration || duration === 0) {
      process.stdout.write(`(Scraping) `)
      duration = await scrapeDuration(id)
      obsidian(`property:set name=duration value=${duration} path="${filePath}" type=number`)
    }

    // Related Notes Resolution
    let related = []
    if (item.related) {
      const rawRelated = typeof item.related === 'string' 
        ? item.related.split(',').map(s => s.trim()) 
        : (Array.isArray(item.related) ? item.related : [])

      for (const link of rawRelated) {
        const cleanName = link.replace(/[\[\]]/g, '').split('|')[0].trim()
        
        // Find exact match in our pre-fetched index
        const actualPath = vaultIndex.find(p => {
            const nameOnly = p.split('/').pop().replace('.md', '')
            return nameOnly === cleanName
        })

        if (actualPath) {
          // Quartz Slug: Remove 'content/' prefix, remove '.md', handle spaces
          const slug = actualPath.replace(/^content\//, '').replace(/\.md$/, '').replace(/ /g, '-')
          related.push({ name: cleanName, slug })
        } else {
          // Fallback to simple name
          related.push({ name: cleanName, slug: cleanName.replace(/ /g, '-') })
        }
      }
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

  try {
    if (fs.existsSync(OUTPUT_FILE)) fs.unlinkSync(OUTPUT_FILE)
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error(`File System Error: ${e.message}`)
    return
  }

  console.log(`\n==============================================`)
  console.log(`📡 BROADCAST TERMINAL: SYNCHRONIZATION COMPLETE`)
  console.log(`==============================================`)
  console.log(`Total Loop: ${playlist.length} signals`)
  console.log(`==============================================\n`)
}

generatePlaylist()
