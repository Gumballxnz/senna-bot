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
        let dl_url = null
        let title = 'video'

        // [ALTA DEFINIÇÃO] Tentar buscar especificamente 720p primeiro via Vreden
        try {
            let vr = await fetch(`https://api.vreden.web.id/api/ytvideo?url=${encodeURIComponent(url)}`).then(v=>v.json()).catch(()=>null)
            dl_url = vr?.result?.links?.['720p']?.download || vr?.result?.links?.['480p']?.download
            if (vr?.result?.title) title = vr.result.title
        } catch(e) {}

        if (!dl_url) {
            // [ESTABILIDADE] Motor original fg-senna (Tier 2 agora) - Forçando 720p
            let res = type === 'audio' ? await fg.yta(url).catch(() => null) : await fg.ytv(url, '720p').catch(() => null)
            dl_url = res?.dl_url || res?.result || res?.data?.dl_url
            title = res?.title || title
        }

        if (!dl_url) {
            // Fallback 1: Ruhend API
            let rh = await fetch(`https://api.ruhend.best/api/download/ytmp4?url=${encodeURIComponent(url)}`).then(v=>v.json()).catch(()=>null)
            dl_url = rh?.result?.url || rh?.url
        }

        if (!dl_url) {
            // Fallback 2: Lolibot API
            let lb = await fetch(`https://api.lolihunter.com.br/api/ytmp4v2?url=${encodeURIComponent(url)}`).then(v=>v.json()).catch(()=>null)
            dl_url = lb?.result?.link || lb?.result?.url
        }

        if (!dl_url) {
            // Fallback 3: Ryzendesu
            let rz = await fetch(`https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`).then(v=>v.json()).catch(()=>null)
            dl_url = rz?.result?.url || rz?.url || rz?.data?.url
        }

        if (!dl_url) throw new Error('O YouTube aplicou um bloqueio de Copyright absoluto neste vídeo. Tente usar uma URL diferente ou aguarde.')

        // Download com Stream Direto e Headers de Performance
        let dl = await fetch(dl_url, { 
            compress: true,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Connection': 'keep-alive'
            }
        })
        if (!dl.ok) throw new Error(`Falha no download da API: HTTP ${dl.status}`)
        
        const fileStream = fs.createWriteStream(filePath)
        await pipeline(dl.body, fileStream)
        
        if (!fs.existsSync(filePath)) throw new Error('Download concluído mas arquivo não encontrado no servidor.')
        let stats = fs.statSync(filePath)
        if (stats.size < 1024) throw new Error('Arquivo baixado é muito pequeno ou corrompido.')

        // Limpar o título para o WhatsApp
        let cleanTitle = (title || filename).replace(/[^\w\s\-\.]/gi, '')

        return {
            filePath,
            title: cleanTitle,
            size: stats.size
        }
    } catch (e) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        console.error('ERRO CRÍTICO NO YT-HELPER:', e)
        throw e
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
