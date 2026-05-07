import fs from 'fs'
import path from 'path'
import https from 'https'

const VIDEO_DIR = './video_archive'
const OUTPUT_FILE = './quartz/static/video_playlist.json'

function getYouTubeId(url) {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/|shorts\/)([^?&]+)/)
  return match ? match[1] : null
}

async function fetchDuration(id) {
  return new Promise((resolve) => {
    https.get(`https://www.youtube.com/watch?v=${id}`, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        // Look for approxDurationMs in the page source
        const match = data.match(/"approxDurationMs":"(\d+)"/)
        if (match) {
          resolve(Math.floor(parseInt(match[1]) / 1000))
        } else {
          resolve(300) // Default to 5 mins if scraping fails
        }
      })
    }).on('error', () => resolve(300))
  })
}

async function generatePlaylist() {
  console.log('--- CYBERNATI™ STATION MANAGER ---')
  console.log('Scanning video archive...')
  
  if (!fs.existsSync(VIDEO_DIR)) {
    console.error(`Directory ${VIDEO_DIR} not found.`)
    return
  }

  const files = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.md'))
  const playlist = []

  for (const file of files) {
    const content = fs.readFileSync(path.join(VIDEO_DIR, file), 'utf-8')
    const sourceMatch = content.match(/source:\s*(https?:\/\/[^\n]+)/)
    
    if (sourceMatch) {
      const url = sourceMatch[1].trim()
      const id = getYouTubeId(url)
      if (id) {
        process.stdout.write(`Fetching metadata for ${id}... `)
        const duration = await fetchDuration(id)
        playlist.push({ id, duration, title: file.replace('.md', '') })
        console.log(`[${duration}s]`)
      }
    }
  }

  const outputDir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Final structure includes our 3 local interstitials
  const data = {
    schedule: playlist,
    interstitials: [
      '/static/interstitials/int-01.mp4',
      '/static/interstitials/int-02.mp4',
      '/static/interstitials/int-03.mp4'
    ]
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2))
  console.log(`\nBroadcast Schedule Updated: ${OUTPUT_FILE}`)
}

generatePlaylist()
