
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

    let text = m.text.trim()

    // Flag para evitar conflitos se houver múltiplos links
    let found = false

    // Verificar TikTok
    if (tiktokRegex.test(text)) {
        let link = text.match(tiktokRegex)[0]
        found = true
        await m.react('⏳')
        try {
            let res = await fetch(global.API('fgmods', '/api/downloader/tiktok', { url: link }, 'apikey'))
            let json = await res.json()
            if (json.status) {
                await conn.sendFile(m.chat, json.result.video.noWatermark, 'tiktok.mp4', `✅ *TikTok detectado*`, m)
                await m.react('✅')
            } else {
                console.log('AutoDL TikTok Fail:', json.msg || 'Status false')
            }
        } catch (e) {
            console.error('AutoDL TikTok Error:', e)
        }
    }

    // Verificar Instagram
    if (!found && instagramRegex.test(text)) {
        let link = text.match(instagramRegex)[0]
        found = true
        await m.react('⏳')
        try {
            let res = await fetch(global.API('fgmods', '/api/downloader/igdl', { url: link }, 'apikey'))
            let json = await res.json()
            if (json.status) {
                for (let i of json.result) {
                    await conn.sendFile(m.chat, i.url, 'instagram.mp4', `✅ *Instagram detectado*`, m)
                }
                await m.react('✅')
            }
        } catch (e) {
            console.error('AutoDL Instagram Error:', e)
        }
    }

    // Verificar Facebook
    if (!found && facebookRegex.test(text)) {
        let link = text.match(facebookRegex)[0]
        found = true
        await m.react('⏳')
        try {
            let res = await fetch(global.API('fgmods', '/api/downloader/fbdl', { url: link }, 'apikey'))
            let json = await res.json()
            if (json.status) {
                let vid = json.result.hd || json.result.sd
                await conn.sendFile(m.chat, vid, 'facebook.mp4', `✅ *Facebook detectado*`, m)
                await m.react('✅')
            }
        } catch (e) {
            console.error('AutoDL Facebook Error:', e)
        }
    }

    // Verificar Mediafire
    if (!found && mediafireRegex.test(text)) {
        let link = text.match(mediafireRegex)[0]
        found = true
        await m.react('⏳')
        try {
            let res = await fetch(global.API('fgmods', '/api/downloader/mediafire', { url: link }, 'apikey'))
            let json = await res.json()
            if (json.status) {
                let { url: downloadUrl, filename, ext, filesizeH } = json.result
                if (parseInt(filesizeH) > 200 && filesizeH.includes('MB') && !isOwner) return m.reply('✳️ Arquivo muito grande para autodownload (Máx 200MB).')
                await conn.sendFile(m.chat, downloadUrl, filename, `✅ *Mediafire detectado*\n▢ *Nome:* ${filename}`, m, null, { asDocument: true })
                await m.react('✅')
            }
        } catch (e) {
            console.error('AutoDL Mediafire Error:', e)
        }
    }

    // Verificar MEGA
    if (!found && megaRegex.test(text)) {
        let link = text.match(megaRegex)[0]
        found = true
        await m.react('⏳')
        try {
            let res = await fetch(global.API('fgmods', '/api/downloader/mega', { url: link }, 'apikey'))
            let json = await res.json()
            if (json.status) {
                let { download: downloadUrl, filename } = json.result
                await conn.sendFile(m.chat, downloadUrl, filename, `✅ *MEGA detectado*`, m, null, { asDocument: true })
                await m.react('✅')
            }
        } catch (e) {
            console.error('AutoDL MEGA Error:', e)
        }
    }

    // Verificar YouTube (Vídeo)
    if (!found && youtubeRegex.test(text)) {
        let link = text.match(youtubeRegex)[0]
        found = true
        await m.react('⏳')
        try {
            let res = await fetch(global.API('fgmods', '/api/downloader/ytmp4', { url: link }, 'apikey'))
            let json = await res.json()
            if (json.status) {
                let { dl_url, title, size } = json.result
                if (parseInt(size) > 100 && !isOwner) return m.reply('✳️ Vídeo muito grande para autodownload.')
                await conn.sendFile(m.chat, dl_url, title + '.mp4', `✅ *YouTube detectado*`, m)
                await m.react('✅')
            }
        } catch (e) {
            console.error('AutoDL YT Error:', e)
        }
    }

    return found
}
