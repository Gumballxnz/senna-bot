import path from 'path'
import fs from 'fs'
import fetch from 'node-fetch'
import fg from 'fg-senna'
import { pipeline } from 'stream/promises'

const TEMP_DIR = path.join(process.cwd(), 'tmp')
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

/**
 * Download from YouTube using fg-senna bypass
 * @param {string} url YouTube URL
 * @param {string} type 'audio' or 'video'
 * @returns {Promise<{filePath: string, title: string, size: number}>}
 */
export async function downloadYT(url, type = 'audio') {
    const filename = `yt_${Date.now()}.${type === 'audio' ? 'mp3' : 'mp4'}`
    const filePath = path.join(TEMP_DIR, filename)

    try {
        let res = type === 'audio' ? await fg.yta(url).catch(() => null) : await fg.ytv(url).catch(() => null)
        let dl_url = res?.dl_url

        if (!dl_url) {
            let rz = await fetch(`https://api.ryzendesu.vip/api/downloader/${type === 'audio' ? 'ytmp3' : 'ytmp4'}?url=${encodeURIComponent(url)}`).then(v=>v.json()).catch(()=>null)
            dl_url = rz?.url || rz?.data?.url
        }

        if (!dl_url) throw new Error('Link não gerado pela API oculta.')

        let dl = await fetch(dl_url)
        await pipeline(dl.body, fs.createWriteStream(filePath))
        
        let stats = fs.statSync(filePath)

        return {
            filePath,
            title: res.title || filename,
            size: stats.size
        }
    } catch (e) {
        throw new Error(`fg-senna DL failed: ${e.message}`)
    }
}

/**
 * Get video info
 */
export async function getYTInfo(url) {
    try {
        let res = await fg.yta(url)
        return res
    } catch (e) {
        return { title: 'video' }
    }
}
