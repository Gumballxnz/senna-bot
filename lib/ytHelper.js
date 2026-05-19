import path from 'path'
import fs from 'fs'
import fetch from 'node-fetch'
import fg from 'fg-senna'
import { pipeline } from 'stream/promises'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const tmpDir = path.join(process.cwd(), 'tmp')
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

const tiered_apis = [
    'https://api.vreden.web.id/api/ytvideo?url={url}',
    'https://api.lolihunter.com.br/api/ytmp4?url={url}',
    'https://api.agatz.xyz/api/ytmp4?url={url}',
    'https://api.shizuhub.xyz/api/downloader/ytmp4?url={url}'
]

/**
 * Downloads a YouTube video or audio with tiered API fallbacks
 * @param {string} url - The YouTube URL
 * @param {string} type - 'audio' or 'video'
 * @returns {Promise<{filePath: string, title: string, size: number}>}
 */
export async function downloadYT(url, type = 'video') {
    const filename = `yt_${Date.now()}`
    const ext = type === 'audio' ? 'mp3' : 'mp4'
    const filePath = path.join(tmpDir, `${filename}.${ext}`)
    const rawPath = path.join(tmpDir, `${filename}_raw.tmp`)

    try {
        let dl_url = null
        let title = 'video'

        // [CALIDADE HD] Tier 1: APIs Externas
        for (const api of tiered_apis) {
            try {
                const response = await fetch(api.replace('{url}', encodeURIComponent(url)), { timeout: 15000 })
                const data = await response.json()
                dl_url = data.result?.url || data.result?.download?.url || data.data?.url || data.url
                title = data.result?.title || data.data?.title || data.title || title
                if (dl_url) break
            } catch (e) {}
        }

        // [ESTABILIDADE] Tier 2: Motor fg-senna (Forçando alta qualidade)
        if (!dl_url) {
            let res = type === 'audio' ? await fg.yta(url).catch(() => null) : await fg.ytv(url, '720p').catch(() => null)
            dl_url = res?.dl_url || res?.result || res?.data?.dl_url
            title = res?.title || title
        }

        if (!dl_url) throw new Error('Bloqueio de Copyright ou API offline. Tente outro link.')

        // Download direto
        let dl = await fetch(dl_url, { 
            headers: { 
                'User-Agent': 'Mozilla/5.0' 
            }
        })
        if (!dl.ok) throw new Error(`Erro HTTP ${dl.status}`)
        
        const fileStream = fs.createWriteStream(rawPath)
        await pipeline(dl.body, fileStream)
        
        if (!fs.existsSync(rawPath)) throw new Error('Falha no download.')

        // NORMALIZAÇÃO PARA WHATSAPP (Resolução do erro de áudio corrompido)
        if (type === 'audio') {
            try {
                // Converte qualquer WebM/M4A/MP4 para MP3 standard (128k, 44.1kHz)
                await execAsync(`ffmpeg -i "${rawPath}" -vn -ab 128k -ar 44100 -y "${filePath}"`)
                if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
            } catch (ffmpegErr) {
                console.error('FFmpeg falhou, usando bruto:', ffmpegErr)
                fs.renameSync(rawPath, filePath)
            }
        } else {
            // Para vídeo, apenas renomeamos (já garantimos 720p no motor)
            fs.renameSync(rawPath, filePath)
        }

        let stats = fs.statSync(filePath)
        let cleanTitle = (title || filename).replace(/[^\w\s\-\.]/gi, '')

        return {
            filePath,
            title: cleanTitle,
            size: stats.size
        }
    } catch (e) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
        throw e
    }
}

/**
 * Get video info wrapper
 */
export async function getYTInfo(url) {
    try {
        return await fg.yta(url)
    } catch (e) {
        return { title: 'video' }
    }
}
