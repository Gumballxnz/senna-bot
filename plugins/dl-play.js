
import yts from 'yt-search'
import { downloadYT } from '../lib/ytHelper.js'
import fs from 'fs'

let confirmation = {}

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
    if (!text) throw `✳️ Exemplo\n${usedPrefix + command} Lil Peep`

    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender;
    let chat = global.db.data.chats[m.chat];

    m.react(rwait)
    let res = await yts(text)
    let vid = res.videos[0]

    if (!vid) {
        m.react('❌')
        throw `❎ Video não encontrado`
    }

    let { title, thumbnail, url, timestamp, views, ago, seconds } = vid

    // --- CÁLCULO DE PESO INSTANTÂNEO ---
    // Áudio 128kbps = Exatos 16KB/s (0.016MB por segundo).
    let audioSize = (seconds * 0.016).toFixed(1)
    // Vídeo 720p/1080p costuma pesar cerca de 8 a 15 MB por minuto, média de ~0.2 MB/s.
    let videoSize = (seconds * 0.20).toFixed(1)

    m.react('🎧')

    let msg = `≡ *FG MUSIC*
┌──────────────
▢ 📌 *Titulo:* ${title}
▢ 📆 *Postado:* ${ago}
▢ ⌚ *Duração:* ${timestamp}
▢ 👀 *Vistas:* ${views.toLocaleString()}
└──────────────

Responda com 1 ou 2:
1 = MP3 (Áudio)  ~ ${audioSize} MB 🎵
2 = MP4 (Vídeo)  ~ ${videoSize} MB 🎬
`

    await conn.sendFile(m.chat, thumbnail, "play.jpg", msg, m)

    confirmation[m.sender] = {
        sender: m.sender,
        to: who,
        url: url, 
        chat: chat, 
        timeout: setTimeout(() => {
            delete confirmation[m.sender];
        }, 60000), // 1 minuto
    };
}

handler.help = ['play']
handler.tags = ['dl']
handler.command = ['play','playvid']

export default handler

handler.before = async m => {
    if (m.isBaileys) return; 
    if (!(m.sender in confirmation)) return; 

    let { sender, timeout, url, chat } = confirmation[m.sender];
    
    if (m.text.trim() === '1') {
        clearTimeout(timeout);
        delete confirmation[m.sender];
        m.react(rwait)
        try {
            let { filePath, title } = await downloadYT(url, 'audio')
            if (fs.existsSync(filePath)) {
                await conn.sendFile(m.chat, filePath, title + '.mp3', '', m, false, { mimetype: 'audio/mpeg', asDocument: chat?.useDocument })
                fs.unlinkSync(filePath)
                m.react(done)
            }
        } catch (e) {
            console.error('[play-audio] Erro:', e)
            m.react('❌')
            m.reply(`❎ Erro ao baixar áudio: ${e.message}`)
        }

    } else if (m.text.trim() === '2') {
        clearTimeout(timeout);
        delete confirmation[m.sender];
        m.react(rwait)
        try {
            let { filePath, title, size } = await downloadYT(url, 'video')
            if (fs.existsSync(filePath)) {
                let user = global.db.data.users[m.sender] || {}
                let isPrems = user.premium
                let isOwner = global.owner.some(([num]) => num === m.sender.split('@')[0])
                let limit = isOwner || isPrems ? 2000 : 1000
                
                let isLimit = limit * 1024 * 1024 < size
                if (isLimit) {
                    fs.unlinkSync(filePath)
                    return m.reply(`❎ Tamanho excedido: ${(size / (1024 * 1024)).toFixed(2)} MB`)
                }
                await conn.sendFile(m.chat, filePath, title + '.mp4', `≡ *FG YTDL*\n\n▢ *📌Titulo* : ${title}`.trim(), m, false, { asDocument: true })
                fs.unlinkSync(filePath)
                m.react(done)
            }
        } catch (e) {
            console.error('[play-video] Erro:', e)
            m.reply(`❎ Erro ao baixar vídeo: ${e.message}`)
        }
    }
}