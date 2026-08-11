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
    'https://cobalt.api.scity.gov.mn',
    'https://co.wuk.sh',
    'https://cobalt.tools',
    'https://nuko-c.meowing.de',
    'https://subito-c.meowing.de',
    'https://melon.clxxped.lol',
    'https://api-cobalt.eversiege.network',
    'https://api.qwkuns.me',
    'https://kitty.tame.gg'
]

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

function cleanMediaUrl(rawUrl) {
    if (!rawUrl) return ''
    try {
        let u = new URL(rawUrl.trim())
        if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
            if (u.searchParams.has('v')) {
                const v = u.searchParams.get('v')
                return `https://www.youtube.com/watch?v=${v}`
            } else if (u.hostname.includes('youtu.be')) {
                const id = u.pathname.replace('/', '')
                if (id) return `https://www.youtube.com/watch?v=${id}`
            }
        }
        return rawUrl.trim().split('?')[0] || rawUrl.trim()
    } catch (e) {
        return rawUrl.trim()
    }
}

async function refreshCobaltApis() {
    try {
        const res = await axios.get('https://cobalt.directory/api/working?type=api', {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 7000
        })
        const list = res.data?.data?.youtube || res.data?.data?.general
        if (Array.isArray(list) && list.length > 0) {
            COBALT_APIS = [...new Set([...list, ...COBALT_APIS])]
            console.log(`[YouTube Downloader] Updated Cobalt APIs list: ${COBALT_APIS.length} active instances.`)
        }
    } catch (e) {
        // Fallback to hyper.lol instances endpoint
        try {
            const res2 = await axios.get('https://instances.hyper.lol/instances.json', {
                headers: { 'User-Agent': USER_AGENT },
                timeout: 7000
            })
            if (Array.isArray(res2.data)) {
                const active = res2.data.filter(i => i.api && i.online).map(i => i.api)
                if (active.length > 0) {
                    COBALT_APIS = [...new Set([...active, ...COBALT_APIS])]
                    console.log(`[YouTube Downloader] Updated Cobalt APIs via hyper.lol: ${COBALT_APIS.length} instances.`)
                }
            }
        } catch (_) {}
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
    const targetUrl = cleanMediaUrl(url)

    // Phase 1: fg-senna (Primary free API resolver)
    try {
        const fg = (await import('fg-senna')).default
        console.log(`[YouTube Downloader] Phase 1: Resolving via fg-senna... (${targetUrl})`)
        const fgRes = type === 'audio' ? await fg.yta(targetUrl) : await fg.ytv(targetUrl)
        if (fgRes && fgRes.dl_url) {
            console.log(`[YouTube Downloader] fg-senna resolved: ${fgRes.title} (${fgRes.size}). Baixando stream...`)
            const writer = fs.createWriteStream(filePath)
            const streamResponse = await axios({
                method: 'get',
                url: fgRes.dl_url,
                responseType: 'stream',
                headers: { 'User-Agent': USER_AGENT },
                timeout: 300000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            })
            await pipeline(streamResponse.data, writer)
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath)
                if (stats.size > 100) {
                    const cleanTitle = (fgRes.title || filename).replace(/[^\w\s\-\.]/gi, '')
                    console.log(`[YouTube Downloader] fg-senna download completo: ${cleanTitle} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`)
                    return {
                        filePath,
                        title: cleanTitle,
                        size: stats.size
                    }
                }
            }
        }
    } catch (err) {
        console.warn(`[YouTube Downloader] Phase 1 (fg-senna) falhou:`, err.message)
    }

    // Phase 2: Cobalt API Resolver - Parallelized for speed
    let resolvedData = null
    try {
        console.log(`[YouTube Downloader] Phase 2: Resolving URL in parallel via Cobalt APIs... (${targetUrl})`)
        const payload = type === 'audio' ? {
            url: targetUrl,
            videoQuality: '720',
            downloadMode: 'audio',
            audioFormat: 'mp3'
        } : {
            url: targetUrl,
            videoQuality: '720'
        }

        const promises = COBALT_APIS.map(async (api) => {
            try {
                const response = await axios.post(api, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'User-Agent': USER_AGENT
                    },
                    timeout: 9000
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
                headers: { 'User-Agent': USER_AGENT },
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
        let title = 'video'
        try {
            const { stdout } = await execAsync(
                `yt-dlp --no-warnings --print title "${targetUrl}"`,
                { timeout: 15000 }
            )
            title = stdout.trim() || title
        } catch (e) {}

        let cookiesFlag = ''
        const cookiesPath = path.join(process.cwd(), 'cookies.txt')
        if (fs.existsSync(cookiesPath)) {
            cookiesFlag = `--cookies "${cookiesPath}"`
            console.log(`[YouTube Downloader] Using YouTube cookies from ${cookiesPath}`)
        }

        let cmd
        if (type === 'audio') {
            cmd = `yt-dlp ${cookiesFlag} -f "ba[ext=m4a]/ba/b" --extract-audio --audio-format mp3 --audio-quality 128k --no-playlist --no-warnings -o "${filePath}" "${targetUrl}"`
        } else {
            cmd = `yt-dlp ${cookiesFlag} -f "bv*[height<=720][ext=mp4]+ba[ext=m4a]/bv*[height<=720]+ba/b[height<=720]/b" --merge-output-format mp4 --no-playlist --no-warnings -o "${filePath}" "${targetUrl}"`
        }

        await execAsync(cmd, { timeout: 120000 })

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
    const targetUrl = cleanMediaUrl(url)
    for (const api of COBALT_APIS) {
        try {
            const response = await axios.post(api, {
                url: targetUrl
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': USER_AGENT
                },
                timeout: 8000
            })
            if (response.data && response.data.filename) {
                return { title: response.data.filename }
            }
        } catch (e) {}
    }

    try {
        let cookiesFlag = ''
        const cookiesPath = path.join(process.cwd(), 'cookies.txt')
        if (fs.existsSync(cookiesPath)) cookiesFlag = `--cookies "${cookiesPath}"`

        const { stdout } = await execAsync(
            `yt-dlp ${cookiesFlag} --no-warnings --print "%(title)s" "${targetUrl}"`,
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
    const targetUrl = cleanMediaUrl(url)
    
    for (const api of COBALT_APIS) {
        try {
            console.log(`[Cobalt Downloader] Resolving via ${api}... (${targetUrl})`)
            const response = await axios.post(api, {
                url: targetUrl,
                videoQuality: '720'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': USER_AGENT
                },
                timeout: 9000
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
                    headers: { 'User-Agent': USER_AGENT },
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



