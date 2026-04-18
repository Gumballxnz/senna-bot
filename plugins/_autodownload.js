
import fg from 'fg-senna'
import { downloadYT } from '../lib/ytHelper.js'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function before(m, { conn, isOwner }) {
    if (m.isBaileys || m.fromMe || !m.text) return false
    let chat = global.db.data.chats[m.chat]
    if (!chat || !chat.autodl) return false

    let text = m.text.trim()

    // Se a mensagem começa com um prefixo de comando, ignorar AutoDL
    // Isso evita o download duplo quando alguém usa .tiktok, .fb, etc.
    if (global.prefix.test(text)) return false

    const tiktokRegex = /https?:\/\/(www\.|v[mt]\.|vt\.)?tiktok\.com\/[^\s]*/i
    const facebookRegex = /https?:\/\/(www\.|web\.|m\.)?(facebook\.com|fb\.watch)\/[^\s]*/i
    const instagramRegex = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[^\s]*/i
    const mediafireRegex = /https?:\/\/(www\.)?mediafire\.com\/file\/[^\s]*/i
    const megaRegex = /https?:\/\/mega\.nz\/file\/[^\s]*/i
    const youtubeRegex = /https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\/[^\s]*/i

    let found = false

    // TikTok (fg-senna)
    if (tiktokRegex.test(text)) {
        let link = text.match(tiktokRegex)[0]
        found = true
        m.react(rwait)
        try {
            let data = await fg.tiktok(link)
            if (data && data.result && data.result.images) {
                // É um Carrossel de Imagens! Usar a API.
                for (let img of data.result.images) {
                    await conn.sendFile(m.chat, img, 'tiktok.png', '', m, null, fwc)
                }
                m.react(done)
            } else {
                // É um VÍDEO! Ligar o motor yt-dlp (Qualidade Maxima H264 Cópia)
                const TEMP_DIR = path.join(process.cwd(), 'tmp')
                if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
                const rawPath = path.join(TEMP_DIR, `tk_raw_${Date.now()}.mp4`)
                const finalPath = path.join(TEMP_DIR, `tk_${Date.now()}.mp4`)
                
                let success = false
                try {
                    await execAsync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${link}"`, { timeout: 120000 })
                    if (fs.existsSync(rawPath)) {
                        await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`, { timeout: 180000 })
                        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
                        if (fs.existsSync(finalPath)) {
                            await conn.sendFile(m.chat, finalPath, 'tiktok.mp4', `✅ *Auto DL: TikTok (HD)*`, m, null, fwc)
                            fs.unlinkSync(finalPath)
                            success = true
                        }
                    }
                } catch (ee) {
                    console.error('yt-dlp TikTok failed, falling back to API URL')
                }

                if (!success && data.result.play) {
                    await conn.sendFile(m.chat, data.result.play, 'tiktok.mp4', `✅ *Auto DL: TikTok*`, m, null, fwc)
                }
                m.react(done)
            }
        } catch (e) {
            console.error('AutoDL TikTok Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar TikTok: ${e.message}`)
        }
    }

    // Instagram (fg-senna)
    if (!found && instagramRegex.test(text)) {
        let link = text.match(instagramRegex)[0]
        found = true
        m.react(rwait)
        try {
            let data = await fg.igdl(link)
            if (data.result && data.result.length > 1) {
                // É um Carrossel/Galeria do Insta! Usar a API para as fotos em série.
                for (let i of data.result) {
                    await conn.sendFile(m.chat, i.url, 'instagram.mp4', `✅ *Auto DL: Instagram*`, m, null, fwc)
                }
                m.react(done)
            } else {
                // É um único POST (Video ou Foto). Ligar o motor yt-dlp!
                const TEMP_DIR = path.join(process.cwd(), 'tmp')
                if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
                const rawPath = path.join(TEMP_DIR, `ig_raw_${Date.now()}.mp4`)
                const finalPath = path.join(TEMP_DIR, `ig_${Date.now()}.mp4`)
                
                let success = false
                try {
                    await execAsync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${link}"`, { timeout: 120000 })
                    if (fs.existsSync(rawPath)) {
                        await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`, { timeout: 180000 })
                        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
                        if (fs.existsSync(finalPath)) {
                            await conn.sendFile(m.chat, finalPath, 'ig.mp4', `✅ *Auto DL: Instagram (HD)*`, m, null, fwc)
                            fs.unlinkSync(finalPath)
                            success = true
                        }
                    }
                } catch (ee) {
                    console.error('yt-dlp Instagram failed, falling back to API URL')
                }

                if (!success) {
                    let url = data.dl_url || (data.result && data.result[0]?.url)
                    if (url) await conn.sendFile(m.chat, url, 'ig.mp4', `✅ *Auto DL: Instagram*`, m, null, fwc)
                    else throw new Error('Não foi possível obter a URL de download.')
                }
                m.react(done)
            }
        } catch (e) {
            console.error('AutoDL Instagram Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar Instagram: ${e.message}`)
        }
    }

    // Facebook (Híbrido)
    if (!found && facebookRegex.test(text)) {
        let link = text.match(facebookRegex)[0]
        found = true
        m.react(rwait)
        try {
            const TEMP_DIR = path.join(process.cwd(), 'tmp')
            if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
            const rawPath = path.join(TEMP_DIR, `fb_raw_${Date.now()}.mp4`)
            const finalPath = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`)

            let success = false
            try {
                await execAsync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${link}"`, { timeout: 120000 })
                if (fs.existsSync(rawPath)) {
                    await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`, { timeout: 180000 })
                    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
                    if (fs.existsSync(finalPath)) {
                        await conn.sendFile(m.chat, finalPath, 'fb.mp4', `✅ *Auto DL: Facebook (HD)*`, m, null, fwc)
                        fs.unlinkSync(finalPath)
                        success = true
                    }
                }
            } catch (ee) {
                console.error('yt-dlp bloqueado no Facebook AutoDL, ativando fallback tríplice')
            }

            if (!success) {
                let url = null;
                const fetch = (await import('node-fetch')).default;
                
                let sp = await fetch(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(link)}`).then(v => v.json()).catch(() => null);
                url = sp?.data?.url || sp?.data?.hd || sp?.data?.sd;

                if (!url) {
                    let rz = await fetch(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(link)}`).then(v => v.json()).catch(() => null);
                    url = rz?.url || rz?.data?.url || rz?.result?.url_hd || rz?.result?.url_sd;
                }

                if (!url) {
                    let fgRes = await fg.fbdl(link).catch(() => null);
                    url = fgRes?.HD || fgRes?.SD;
                }

                if (!url) throw new Error('Links e APIs bloqueadas.');

                const rawFilePath = path.join(TEMP_DIR, `fb_raw_${Date.now()}.mp4`)
                const finalFilePath = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`)
                
                let dl = await fetch(url)
                if (!dl.ok) throw new Error('Falha HTTP da API')
                const { pipeline } = await import('stream/promises')
                await pipeline(dl.body, fs.createWriteStream(rawFilePath))

                if (fs.existsSync(rawFilePath)) {
                    await execAsync(`ffmpeg -i "${rawFilePath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalFilePath}"`, { timeout: 180000 })
                    if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath)
                }
        
                if (!fs.existsSync(finalFilePath)) throw new Error('Erro na conversão FFmpeg da API.')

                await conn.sendFile(m.chat, finalFilePath, 'fb.mp4', `✅ *Auto DL: Facebook (API)*`, m, null, fwc)
                try { fs.unlinkSync(finalFilePath) } catch(e) {}
            }
            m.react(done)
        } catch (e) {
            console.error('AutoDL Facebook Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar Facebook: Verifique se o link é público.`)
        }
    }

    // Mediafire (fg-senna)
    if (!found && mediafireRegex.test(text)) {
        let link = text.match(mediafireRegex)[0]
        found = true
        m.react(rwait)
        try {
            let data = await fg.mediafire(link)
            if (data.url) {
                let size = parseInt(data.size)
                if (size > 1024 && data.size.includes('MB') && !isOwner) return m.reply('✳️ Arquivo muito grande para AutoDL (Max 1GB). Use o comando .mediafire para limites de até 3GB.')
                await conn.sendFile(m.chat, data.url, data.filename, `✅ *Auto DL: Mediafire*`, m, null, { asDocument: true })
                m.react(done)
            }
        } catch (e) {
            console.error('AutoDL Mediafire Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar Mediafire: ${e.message}`)
        }
    }

    // MEGA (fg-senna)
    if (!found && megaRegex.test(text)) {
        let link = text.match(megaRegex)[0]
        found = true
        m.react(rwait)
        try {
            let data = await fg.mega(link)
            if (data.download) {
                await conn.sendFile(m.chat, data.download, data.filename, `✅ *Auto DL: MEGA*`, m, null, { asDocument: true })
                m.react(done)
            }
        } catch (e) {
            console.error('AutoDL MEGA Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar MEGA: ${e.message}`)
        }
    }

    // YouTube (ytHelper + yt-dlp)
    if (!found && youtubeRegex.test(text)) {
        let link = text.match(youtubeRegex)[0]
        found = true
        m.react(rwait)
        try {
            let { filePath, size } = await downloadYT(link, 'video')
            if (fs.existsSync(filePath)) {
                if (size > 1024 * 1024 * 1024 && !isOwner) {
                    fs.unlinkSync(filePath)
                    return m.reply('✳️ Vídeo muito grande para AutoDL (Max 1GB). Use o comando manual para links maiores.')
                }
                await conn.sendFile(m.chat, filePath, 'video.mp4', `✅ *Auto DL: YouTube*`, m)
                fs.unlinkSync(filePath)
                m.react(done)
            }
        } catch (e) {
            console.error('AutoDL YouTube Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar YouTube: ${e.message}`)
        }
    }

    return found
}
