import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let handler = async (m, { conn, text, usedPrefix }) => {
    try {
        const jidList = buildJidList(conn, m.sender)

        if (m.quoted) {
            const qMsg = m.quoted.message || {}
            let media = null
            let type = 'video'

            if (qMsg.videoMessage) {
                m.reply('⏳ Fazendo download do vídeo...')
                const buffer = await conn.downloadM(qMsg.videoMessage, 'video')
                media = { video: buffer, mimetype: qMsg.videoMessage.mimetype || 'video/mp4' }
                type = 'video'
            } else if (qMsg.imageMessage) {
                m.reply('⏳ Fazendo download da imagem...')
                const buffer = await conn.downloadM(qMsg.imageMessage, 'image')
                media = { image: buffer, mimetype: qMsg.imageMessage.mimetype || 'image/jpeg' }
                type = 'image'
            } else if (qMsg.extendedTextMessage?.text || qMsg.conversation) {
                const quotedText = qMsg.extendedTextMessage?.text || qMsg.conversation
                await conn.sendMessage('status@broadcast', { text: quotedText }, { statusJidList: jidList, broadcast: true })
                return m.reply(`✅ *Status de texto enviado!*\n📝 *Texto:* ${quotedText}\n👥 Para: *${jidList.length}* contacto(s)\n\n` + instrucoes(conn))
            } else {
                return m.reply(`❎ Responda a uma imagem, vídeo ou use \`${usedPrefix}postarstatus seu texto\`.`)
            }

            if (!media) return m.reply('❎ Falha ao processar mídia.')

            await conn.sendMessage('status@broadcast', { ...media, caption: text || '' }, { statusJidList: jidList, broadcast: true })
            return m.reply(`✅ *Status de ${type === 'video' ? 'vídeo' : 'imagem'} enviado!*\n👥 Para: *${jidList.length}* contacto(s)\n\n` + instrucoes(conn))
        }

        if (text && text.trim().length > 0) {
            await conn.sendMessage('status@broadcast', { text: text.trim() }, { statusJidList: jidList, broadcast: true })
            return m.reply(`✅ *Status de texto enviado!*\n📝 *Texto:* ${text.trim()}\n👥 Para: *${jidList.length}* contacto(s)\n\n` + instrucoes(conn))
        }

        const videoPath = path.join(__dirname, '../a.mp4')
        if (fs.existsSync(videoPath)) {
            m.reply('⏳ Enviando vídeo padrão (a.mp4)...')
            await conn.sendMessage('status@broadcast', { video: fs.readFileSync(videoPath), mimetype: 'video/mp4', caption: '' }, { statusJidList: jidList, broadcast: true })
            return m.reply(`✅ *Status enviado!*\n👥 Para: *${jidList.length}* contacto(s)\n\n` + instrucoes(conn))
        }

        return m.reply(`✳️ *Como usar o comando:*\n\n1️⃣ Para postar texto:\n\`${usedPrefix}postarstatus Seu texto aqui\`\n\n2️⃣ Para postar mídia:\nResponda a uma foto ou vídeo com \`${usedPrefix}postarstatus\``)

    } catch (error) {
        console.error('[POSTARSTATUS]', error)
        m.reply(`❎ *Erro ao postar status:* \`${error.message || error}\``)
    }
}

function buildJidList(conn, sender) {
    const contacts = Object.keys(conn.chats || {}).filter(jid => jid && jid.endsWith('@s.whatsapp.net'))
    const list = [...new Set([sender, ...contacts])].filter(jid => jid !== 'status@broadcast')
    return list.length > 0 ? list : [sender]
}

function instrucoes(conn) {
    return (
        `📱 *Onde ver o status:*\n` +
        `1️⃣ No seu WhatsApp, procure por *Status → Meus status*\n` +
        `───\n` +
        `*Nota:* Para outros verem, eles devem ter o número do bot salvo.`
    )
}

handler.help    = ['postarstatus [texto]']
handler.tags    = ['owner']
handler.command = ['postarstatus', 'ps']
handler.owner   = true

export default handler
