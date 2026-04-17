
import fg from 'fg-senna'
import { downloadYT } from '../lib/ytHelper.js'
import fs from 'fs'
import fetch from 'node-fetch'

export async function before(m, { conn, isOwner }) {
    if (m.isBaileys || !m.text) return false
    let chat = global.db.data.chats[m.chat]
    if (!chat || !chat.autodl) return false

    const tiktokRegex = /https?:\/\/(www\.|v[mt]\.|vt\.)?tiktok\.com\/[^\s]*/i
    const facebookRegex = /https?:\/\/(www\.|web\.|m\.)?(facebook\.com|fb\.watch)\/[^\s]*/i
    const instagramRegex = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[^\s]*/i
    const mediafireRegex = /https?:\/\/(www\.)?mediafire\.com\/file\/[^\s]*/i
    const megaRegex = /https?:\/\/mega\.nz\/file\/[^\s]*/i
    const youtubeRegex = /https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\/[^\s]*/i

    let text = m.text.trim()
    let found = false

    // TikTok (fg-senna)
    if (tiktokRegex.test(text)) {
        let link = text.match(tiktokRegex)[0]
        found = true
        m.react(rwait)
        try {
            let data = await fg.tiktok(link)
            if (data.result.play) {
                await conn.sendFile(m.chat, data.result.play, 'tiktok.mp4', `✅ *Auto DL: TikTok*`, m, null, fwc)
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
            for (let i of data.result) {
                await conn.sendFile(m.chat, i.url, 'instagram.mp4', `✅ *Auto DL: Instagram*`, m, null, fwc)
            }
            m.react(done)
        } catch (e) {
            console.error('AutoDL Instagram Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar Instagram: ${e.message}`)
        }
    }

    // Facebook (API pura, sem Puppeteer/Chrome)
    if (!found && facebookRegex.test(text)) {
        let link = text.match(facebookRegex)[0]
        found = true
        m.react(rwait)
        try {
            let url = null
            let results = await Promise.allSettled([
                fg.fbdl(link).then(r => r?.HD || r?.SD || r?.videoUrl || null).catch(() => null),
                fetch(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(link)}`).then(v => v.json()).then(j => j?.data?.url || j?.data?.hd || j?.data?.sd || null).catch(() => null)
            ])
            for (let r of results) {
                if (r.status === 'fulfilled' && r.value) { url = r.value; break }
            }
            if (!url) throw new Error('Não foi possível obter o vídeo do Facebook.')
            await conn.sendFile(m.chat, url, 'facebook.mp4', `✅ *Auto DL: Facebook*`, m, null, fwc)
            m.react(done)
        } catch (e) {
            console.error('AutoDL Facebook Error:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar Facebook: ${e.message}`)
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
