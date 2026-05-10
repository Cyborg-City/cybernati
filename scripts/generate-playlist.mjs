import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import https from 'https'

const BASE_FILE = 'video_archive/channel-0000.base'
const OUTPUT_FILE = './quartz/static/video_playlist.json'
const GAP_DURATION = 30 // 30s standby between videos

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
  console.log('--- CYBERNATI™ STATION MANAGER (TIMELINE_MODE) ---')
  
  const queryResult = obsidian(`base:query path="${BASE_FILE}" view="Table" format=json`)
  if (!queryResult) return
  
  const filesData = JSON.parse(queryResult)
  const schedule = []
  let totalTime = 0

  for (const item of filesData) {
    const filePath = item.path
    const fileName = item["file name"]
    const id = getYouTubeId(item.source || '')
    if (!id) continue

    process.stdout.write(`Mapping: ${fileName.substring(0, 30)}... `)

    let duration = item.duration ? parseInt(item.duration) : null
    if (!duration || duration === 0) {
      process.stdout.write(`(Scraping) `)
      duration = await scrapeDuration(id)
      obsidian(`property:set name=duration value=${duration} path="${filePath}" type=number`)
    }

    let related = []
    if (item.related) {
      const rawRelated = typeof item.related === 'string' ? item.related.split(',') : (Array.isArray(item.related) ? item.related : [])
      related = rawRelated.map(link => {
        const clean = link.replace(/[\[\]]/g, '').split('|')[0].trim()
        return { name: clean, slug: clean.replace(/ /g, '-') } // Simplified fallback, refined in finalization
      })
    }

    // CALCULATE TIMELINE POSITIONS
    const startTime = totalTime
    const endTime = startTime + duration
    
    schedule.push({
      id,
      title: fileName,
      duration,
      start: startTime,
      end: endTime,
      related
    })

    totalTime = endTime + GAP_DURATION
    console.log(`[${startTime}s - ${endTime}s]`)
  }

  const data = {
    totalLoopDuration: totalTime,
    schedule,
    interstitials: [
      '/static/interstitials/int-01.mp4',
      '/static/interstitials/int-02.mp4',
      '/static/interstitials/int-03.mp4'
    ]
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2))
  console.log(`\n==============================================`)
  console.log(`📡 TIMELINE SYNCED: ${totalTime}s Loop`)
  console.log(`==============================================\n`)
}

generatePlaylist()
