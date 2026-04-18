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
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execAsync = promisify(exec)

        let title = 'audio_video'
        try {
            const { stdout } = await execAsync(`yt-dlp -O "%(title)s" "${url}"`, { timeout: 15000 })
            if (stdout) title = stdout.trim()
        } catch(err) {}

        let useFallback = false;
        try {
            if (type === 'audio') {
                await execAsync(`yt-dlp -f "bestaudio" -x --audio-format mp3 --audio-quality 128k -o "${filePath}" "${url}"`, { timeout: 120000 })
            } else {
                const rawPath = path.join(TEMP_DIR, `yt_raw_${Date.now()}.mp4`)
                await execAsync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${url}"`, { timeout: 120000 })
                if (fs.existsSync(rawPath)) {
                    await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${filePath}"`, { timeout: 180000 })
                    fs.unlinkSync(rawPath)
                }
            }
        } catch (ytError) {
            console.error("YT-DLP falhou (possível bloqueio anti-bot do Youtube). Acionando API Fallback...")
            useFallback = true;
        }

        if (useFallback) {
            let res = type === 'audio' ? await fg.yta(url).catch(() => null) : await fg.ytv(url).catch(() => null)
            let dl_url = res?.dl_url
            if (!dl_url) {
                let rz = await fetch(`https://api.ryzendesu.vip/api/downloader/${type === 'audio' ? 'ytmp3' : 'ytmp4'}?url=${encodeURIComponent(url)}`).then(v=>v.json()).catch(()=>null)
                dl_url = rz?.url || rz?.data?.url
            }
            if (!dl_url) throw new Error('Links de download bloqueados nas extensões primárias e secundárias.')

            let dl = await fetch(dl_url)
            await pipeline(dl.body, fs.createWriteStream(filePath))
            
            if (type === 'audio') {
                const finalPath = filePath.replace('.mp3', '_fixed.mp3')
                await new Promise((resolve) => {
                    exec(`ffmpeg -i "${filePath}" -b:a 128k -map a -f mp3 "${finalPath}" -y`, (err) => {
                        if (!err && fs.existsSync(finalPath)) {
                            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
                            fs.renameSync(finalPath, filePath)
                        }
                        resolve()
                    })
                })
            }
        }

        let stats = fs.statSync(filePath)

        return {
            filePath,
            title: title || filename,
            size: stats.size
        }
    } catch (e) {
        throw new Error(`DL failed: ${e.message}`)
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
