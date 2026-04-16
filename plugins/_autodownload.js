
import fetch from 'node-fetch'

export async function before(m, { conn, isAdmin, isOwner }) {
    if (m.isBaileys || !m.text) return false
    let chat = global.db.data.chats[m.chat]
    if (!chat || !chat.autodl) return false

    // Regex para identificar os links suportados
    const tiktokRegex = /https?:\/\/(www\.|v[mt]\.|vt\.)?tiktok\.com\/[^\s]*/i
    const facebookRegex = /https?:\/\/(www\.|web\.|m\.)?(facebook\.com|fb\.watch)\/[^\s]*/i
    const instagramRegex = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[^\s]*/i
    const mediafireRegex = /https?:\/\/(www\.)?mediafire\.com\/file\/[^\s]*/i
    const megaRegex = /https?:\/\/mega\.nz\/file\/[^\s]*/i
    const youtubeRegex = /https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\/[^\s]*/i
    const twitterRegex = /https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\s]*/i

    let text = m.text.trim()

    // Verificar TikTok
    if (tiktokRegex.test(text)) {
        let link = text.match(tiktokRegex)[0]
        await m.react('⏳')
        try {
            let res = await fetch(global.API('fgmods', '/api/downloader/tiktok', { url: link }, 'apikey'))
            let json = await res.json()
            if (json.status) {
                await conn.sendFile(m.chat, json.result.video.noWatermark, 'tiktok.mp4', `*Auto Downloader: TikTok*`, m)
                await m.react('✅')
            }
        } catch (e) {
            console.error('AutoDL TikTok Error:', e)
        }
        return true
    }

    // Verificar Instagram
    if (instagramRegex.test(text)) {
        let link = text.match(instagramRegex)[0]
        await m.react('⏳')
        try {
            let res = await fetch(global.API('fgmods', '/api/downloader/igdl', { url: link }, 'apikey'))
            let json = await res.json()
            if (json.status) {
                for (let i of json.result) {
                    await conn.sendFile(m.chat, i.url, 'instagram.mp4', `*Auto Downloader: Instagram*`, m)
                }
                await m.react('✅')
            }
        } catch (e) {
            console.error('AutoDL Instagram Error:', e)
        }
        return true
    }

    // Verificar Facebook
    if (facebookRegex.test(text)) {
        let link = text.match(facebookRegex)[0]
        await m.react('⏳')
        try {
            let res = await fetch(global.API('fgmods', '/api/downloader/fbdl', { url: link }, 'apikey'))
            let json = await res.json()
            if (json.status) {
                let vid = json.result.hd || json.result.sd
                await conn.sendFile(m.chat, vid, 'facebook.mp4', `*Auto Downloader: Facebook*`, m)
                await m.react('✅')
            }
        } catch (e) {
            console.error('AutoDL Facebook Error:', e)
        }
        return true
    }

    // Verificar Mediafire
    if (mediafireRegex.test(text)) {
        let link = text.match(mediafireRegex)[0]
        await m.react('⏳')
        try {
            let res = await fetch(global.API('fgmods', '/api/downloader/mediafire', { url: link }, 'apikey'))
            let json = await res.json()
            if (json.status) {
                let { url: downloadUrl, filename, ext, filesizeH } = json.result
                if (parseInt(filesizeH) > 200 && filesizeH.includes('MB') && !isOwner) return m.reply('✳️ Arquivo muito grande para autodownload (Máx 200MB). Use o comando .mediafire manualmente.')
                await conn.sendFile(m.chat, downloadUrl, filename, `*Auto DL: Mediafire*`, m, null, { asDocument: true })
                await m.react('✅')
            }
        } catch (e) {
            console.error('AutoDL Mediafire Error:', e)
        }
        return true
    }

    // Verificar MEGA
    if (megaRegex.test(text)) {
        let link = text.match(megaRegex)[0]
        await m.react('⏳')
        try {
            let res = await fetch(global.API('fgmods', '/api/downloader/mega', { url: link }, 'apikey'))
            let json = await res.json()
            if (json.status) {
                let { download: downloadUrl, filename, size } = json.result
                await conn.sendFile(m.chat, downloadUrl, filename, `*Auto DL: MEGA*`, m, null, { asDocument: true })
                await m.react('✅')
            }
        } catch (e) {
            console.error('AutoDL MEGA Error:', e)
        }
        return true
    }

    return false
}
