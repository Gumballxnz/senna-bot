import path from 'path'
import fs from 'fs'
import axios from 'axios'
import { pipeline } from 'stream/promises'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const tmpDir = path.join(process.cwd(), 'tmp')
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

let COBALT_APIS = [
    'https://nuko-c.meowing.de',
    'https://cobalt.omega.wolfy.love',
    'https://subito-c.meowing.de',
    'https://melon.clxxped.lol',
    'https://api-cobalt.eversiege.network',
    'https://api.qwkuns.me',
    'https://kitty.tame.gg'
]

async function refreshCobaltApis() {
    try {
        const res = await axios.get('https://cobalt.directory/api/working?type=api', { timeout: 5000 })
        const list = res.data?.data?.youtube
        if (Array.isArray(list) && list.length > 0) {
            COBALT_APIS = list
            console.log(`[YouTube Downloader] Updated Cobalt APIs list: ${COBALT_APIS.length} active instances.`)
        }
    } catch (e) {
        console.warn(`[YouTube Downloader] Failed to fetch dynamic Cobalt instances:`, e.message)
    }
}
refreshCobaltApis().catch(console.error)
setInterval(() => refreshCobaltApis().catch(console.error), 30 * 60 * 1000)

/**
 * Downloads a YouTube video or audio with Cobalt API primary resolver and yt-dlp fallback
 * @param {string} url - The YouTube URL
 * @param {string} type - 'audio' or 'video'
 * @returns {Promise<{filePath: string, title: string, size: number}>}
 */
export async function downloadYT(url, type = 'video') {
    const filename = `yt_${Date.now()}`
    const ext = type === 'audio' ? 'mp3' : 'mp4'
    const filePath = path.join(tmpDir, `${filename}.${ext}`)
    const rawPath = path.join(tmpDir, `${filename}_raw.tmp`)

    // Phase 1: Cobalt API - Primary resolver (prevents VPS IP bans) - Parallelized for maximum speed
    let resolvedData = null
    try {
        console.log(`[YouTube Downloader] Phase 1: Resolving URL in parallel via Cobalt APIs...`)
        const promises = COBALT_APIS.map(async (api) => {
            try {
                const response = await axios.post(api, {
                    url: url,
                    videoQuality: '720',
                    audioFormat: 'mp3',
                    downloadMode: type === 'audio' ? 'audio' : 'auto'
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 8000
                })
                const data = response.data
                if (data && (data.status === 'tunnel' || data.status === 'redirect') && data.url) {
                    return { data, api }
                }
                throw new Error(`Status não suportado: ${data?.status}`)
            } catch (err) {
                throw new Error(`API ${api} falhou: ${err.message}`)
            }
        })
        resolvedData = await Promise.any(promises)
    } catch (err) {
        console.warn(`[YouTube Downloader] Todas as APIs Cobalt falharam na resolução.`)
    }

    if (resolvedData) {
        const { data, api } = resolvedData
        try {
            console.log(`[YouTube Downloader] Resolvido com sucesso via ${api}. Baixando arquivo...`)
            // Download the physical file to VPS disk
            const writer = fs.createWriteStream(filePath)
            const streamResponse = await axios({
                method: 'get',
                url: data.url,
                responseType: 'stream',
                timeout: 120000
            })

            await pipeline(streamResponse.data, writer)

            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath)
                console.log(`[YouTube Downloader] Cobalt file downloaded size: ${stats.size} bytes`)
                if (stats.size > 100) {
                    const cleanTitle = (data.filename || filename).replace(/[^\w\s\-\.]/gi, '')
                    return {
                        filePath,
                        title: cleanTitle,
                        size: stats.size
                    }
                } else {
                    console.warn(`[YouTube Downloader] Cobalt file size is too small: ${stats.size} bytes`)
                }
            } else {
                console.warn(`[YouTube Downloader] Cobalt file does not exist after pipeline`)
            }
        } catch (err) {
            console.error(`[YouTube Downloader] Download do arquivo resolvido pela Cobalt falhou:`, err)
        }
    }

    // Phase 2: Local yt-dlp (Fallback)
    try {
        console.log(`[YouTube Downloader] Phase 2: Falling back to local yt-dlp...`)
        // Get title first
        let title = 'video'
        try {
            const { stdout } = await execAsync(
                `yt-dlp --no-warnings --print title "${url}"`,
                { timeout: 15000 }
            )
            title = stdout.trim() || title
        } catch (e) {}

        let cmd

        if (type === 'audio') {
            // Download audio and convert to MP3 128k
            cmd = `yt-dlp -f "ba[ext=m4a]/ba/b" --extract-audio --audio-format mp3 --audio-quality 128k --no-playlist --no-warnings -o "${filePath}" "${url}"`
        } else {
            // Download video (max 720p to stay within WhatsApp limits)
            cmd = `yt-dlp -f "bv*[height<=720][ext=mp4]+ba[ext=m4a]/bv*[height<=720]+ba/b[height<=720]/b" --merge-output-format mp4 --no-playlist --no-warnings -o "${filePath}" "${url}"`
        }

        await execAsync(cmd, { timeout: 120000 })

        // Find actual file in case format ext was appended
        let actualFile = filePath
        if (!fs.existsSync(filePath)) {
            const possibleFiles = fs.readdirSync(tmpDir).filter(f => f.startsWith(filename))
            if (possibleFiles.length > 0) {
                actualFile = path.join(tmpDir, possibleFiles[0])
                if (actualFile !== filePath) {
                    fs.renameSync(actualFile, filePath)
                    actualFile = filePath
                }
            }
        }

        if (!fs.existsSync(actualFile)) {
            throw new Error('yt-dlp did not produce output file.')
        }

        const stats = fs.statSync(actualFile)
        const cleanTitle = (title || filename).replace(/[^\w\s\-\.]/gi, '')

        return {
            filePath: actualFile,
            title: cleanTitle,
            size: stats.size
        }
    } catch (e) {
        console.error(`[YouTube Downloader] Phase 2 (yt-dlp) error:`, e)
        // Cleanup on error
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
        const partials = fs.readdirSync(tmpDir).filter(f => f.startsWith(filename))
        partials.forEach(f => {
            try { fs.unlinkSync(path.join(tmpDir, f)) } catch (_) {}
        })
        throw new Error('Bloqueio do YouTube ou API offline. Tente novamente mais tarde.')
    }
}

/**
 * Get video info wrapper using Cobalt or yt-dlp fallback
 */
export async function getYTInfo(url) {
    for (const api of COBALT_APIS) {
        try {
            const response = await axios.post(api, {
                url: url,
                downloadMode: 'auto'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 8000
            })
            if (response.data && response.data.filename) {
                return { title: response.data.filename }
            }
        } catch (e) {}
    }

    // Fallback to yt-dlp
    try {
        const { stdout } = await execAsync(
            `yt-dlp --no-warnings --print "%(title)s" "${url}"`,
            { timeout: 15000 }
        )
        return { title: stdout.trim() || 'video' }
    } catch (e) {
        return { title: 'video' }
    }
}

/**
 * Resolves a generic URL using Cobalt APIs and downloads it to VPS disk
 * Supports Instagram, TikTok, YouTube, etc.
 * @param {string} url - The media URL
 * @returns {Promise<{filePath: string, title: string, size: number} | {isPicker: boolean, items: string[]} | null>}
 */
export async function downloadCobalt(url) {
    const filename = `cobalt_${Date.now()}`
    
    for (const api of COBALT_APIS) {
        try {
            console.log(`[Cobalt Downloader] Resolving via ${api}...`)
            const response = await axios.post(api, {
                url: url,
                videoQuality: '720',
                downloadMode: 'auto'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 8000
            })

            const data = response.data
            if (data && (data.status === 'tunnel' || data.status === 'redirect') && data.url) {
                console.log(`[Cobalt Downloader] Successfully resolved: ${data.filename || 'media'}`)
                
                const finalFilename = data.filename || `media_${Date.now()}.mp4`
                const finalExt = path.extname(finalFilename) || '.mp4'
                const finalPath = path.join(tmpDir, `${filename}${finalExt}`)
                
                const writer = fs.createWriteStream(finalPath)
                const streamResponse = await axios({
                    method: 'get',
                    url: data.url,
                    responseType: 'stream',
                    timeout: 120000
                })

                await pipeline(streamResponse.data, writer)

                if (fs.existsSync(finalPath)) {
                    const stats = fs.statSync(finalPath)
                    if (stats.size > 100) {
                        const cleanTitle = finalFilename.replace(/[^\w\s\-\.]/gi, '')
                        return {
                            filePath: finalPath,
                            title: cleanTitle,
                            size: stats.size
                        }
                    }
                }
            } else if (data && data.status === 'picker' && data.picker && data.picker.length > 0) {
                console.log(`[Cobalt Downloader] Picker resolved with ${data.picker.length} items`)
                return {
                    isPicker: true,
                    items: data.picker.map(item => item.url)
                }
            }
        } catch (err) {
            console.warn(`[Cobalt Downloader] API ${api} failed: ${err.message}`)
        }
    }
    return null
}


