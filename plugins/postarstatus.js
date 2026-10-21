let handler = async (m, { conn, text, usedPrefix }) => {
    try {
        const jidList = buildJidList(conn, m.sender)

        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || q.mediaType || ''
        let isVideo = /video/i.test(mime) || q.mtype === 'videoMessage'
        let isImage = /image/i.test(mime) || q.mtype === 'imageMessage'

        if (isVideo || isImage) {
            m.react('⏳')
            let buffer = await q.download?.().catch(() => null)
            if (!buffer) {
                const mtype = q.mediaType || q.mtype
                if (q.mediaMessage && mtype) {
                    buffer = await conn.downloadM?.(q.mediaMessage[mtype], mtype.replace(/message/i, '')).catch(() => null)
                }
            }

            if (!buffer) {
                m.react('❌')
                return m.reply('❎ Não foi possível baixar a mídia selecionada. Tente novamente.')
            }

            const mediaPayload = isVideo
                ? { video: buffer, mimetype: mime || 'video/mp4', caption: text || '' }
                : { image: buffer, mimetype: mime || 'image/jpeg', caption: text || '' }

            await conn.sendMessage('status@broadcast', mediaPayload, { statusJidList: jidList, broadcast: true })
            m.react('✅')
            return m.reply(
                `✅ *Status de ${isVideo ? 'vídeo' : 'imagem'} enviado!*\n` +
                `👥 Para: *${jidList.length}* contacto(s)\n\n` +
                instrucoes(conn)
            )
        }

        if (text && text.trim().length > 0) {
            m.react('⏳')
            await conn.sendMessage('status@broadcast', { text: text.trim() }, { statusJidList: jidList, broadcast: true })
            m.react('✅')
            return m.reply(
                `✅ *Status de texto enviado!*\n📝 *Texto:* ${text.trim()}\n👥 Para: *${jidList.length}* contacto(s)\n\n` +
                instrucoes(conn)
            )
        }

        return m.reply(
            `✳️ *Como usar o comando:*\n\n` +
            `1️⃣ *Postar Texto:*\n\`${usedPrefix}postarstatus Seu texto aqui\`\n\n` +
            `2️⃣ *Postar Imagem ou Vídeo:*\nEnvie ou responda a uma foto/vídeo com:\n\`${usedPrefix}postarstatus [legenda opcional]\``
        )

    } catch (error) {
        console.error('[POSTARSTATUS]', error)
        m.react('❌')
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
