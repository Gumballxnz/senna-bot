
import yts from 'yt-search'
import { downloadYT } from '../lib/ytHelper.js'
import fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

    // --- PREDIÇÃO DE PESO REFINADA (Instantânea) ---
    // Áudio 128kbps ~ 1MB por minuto (0.016MB/s)
    let audioSize = (seconds * 0.016).toFixed(1)
    // Vídeo 720p ~ 6MB por minuto (0.1 MB/s) - Mais realista para Youtube Mobile
    let videoSize = (seconds * 0.1).toFixed(1)

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
        title: title, // Salva o nome real
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
            let resDL = await downloadYT(url, 'audio')
            let fileName = (resDL.title === 'audio_video' || resDL.title.includes('yt_')) ? (confirmation[m.sender]?.title || resDL.title) : resDL.title
            if (fs.existsSync(resDL.filePath)) {
                await conn.sendFile(m.chat, resDL.filePath, fileName + '.mp3', '', m, false, { mimetype: 'audio/mpeg', asDocument: chat?.useDocument })
                try {
                    if (fs.existsSync(resDL.filePath)) fs.unlinkSync(resDL.filePath)
                } catch(e) { console.error('Erro silencioso ao apagar audio:', e) }
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
            let resDL = await downloadYT(url, 'video')
            let fileName = (resDL.title === 'audio_video' || resDL.title.includes('yt_')) ? (confirmation[m.sender]?.title || resDL.title || 'video') : resDL.title
            if (fs.existsSync(resDL.filePath)) {
                let user = global.db.data.users[m.sender] || {}
                let isPrems = user.premium
                let isOwner = global.owner.some(([num]) => num === m.sender.split('@')[0])
                let limit = isOwner || isPrems ? 2000 : 1000
                
                let isLimit = limit * 1024 * 1024 < resDL.size
                if (isLimit) {
                    fs.unlinkSync(resDL.filePath)
                    return m.reply(`❎ Tamanho excedido: ${(resDL.size / (1024 * 1024)).toFixed(2)} MB`)
                }
                await conn.sendFile(m.chat, resDL.filePath, fileName + '.mp4', `≡ *FG YTDL*\n\n▢ *📌Titulo* : ${fileName}`.trim(), m, false, { asDocument: true })
                try {
                    if (fs.existsSync(resDL.filePath)) fs.unlinkSync(resDL.filePath)
                } catch(e) {}
                m.react(done)
            }
        } catch (e) {
            console.error('[play-video] Erro:', e)
            m.reply(`❎ Erro ao baixar vídeo: ${e.message}`)
        }
    }
}