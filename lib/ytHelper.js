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

        // Pega o título do vídeo de forma ultra-rápida (só metadado)
        let title = 'audio_video'
        try {
            const { stdout } = await execAsync(`yt-dlp -O "%(title)s" "${url}"`, { timeout: 15000 })
            if (stdout) title = stdout.trim()
        } catch(err) {}

        if (type === 'audio') {
            // Qualidade nativa do yt-dlp e conv rápido mp3
            await execAsync(`yt-dlp -f "bestaudio" -x --audio-format mp3 --audio-quality 128k -o "${filePath}" "${url}"`, { timeout: 120000 })
        } else {
            // Qualidade máxima para WhatsApp copiando codec nativo
            const rawPath = path.join(TEMP_DIR, `yt_raw_${Date.now()}.mp4`)
            await execAsync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${url}"`, { timeout: 120000 })
            if (fs.existsSync(rawPath)) {
                await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${filePath}"`, { timeout: 180000 })
                fs.unlinkSync(rawPath)
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
