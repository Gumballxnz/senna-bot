import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let handler = async (m, { conn, args }) => {
    try {
        const jidList = buildJidList(conn, m.sender)
        console.log(`[STATUS] Enviando para ${jidList.length} JIDs`)

        if (args[0] === 'texto') {
            await conn.sendMessage(
                'status@broadcast',
                { text: '🤖 Teste de Status - Bot Online ✅' },
                {
                    statusJidList: jidList,
                    broadcast: true
                }
            )
            return m.reply(
                `✅ *Status de texto enviado!*\n👥 Para ${jidList.length} contacto(s)\n\n` +
                instrucoes(conn)
            )
        }

        let media = null
        let type  = 'video'

        if (m.quoted) {
            const qMsg = m.quoted.message || {}
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
            } else {
                return m.reply('❎ Responda a um *vídeo* ou *imagem* ou use `.postarstatus texto`.')
            }
        } else {

            const videoPath = path.join(__dirname, '../a.mp4')
            if (!fs.existsSync(videoPath)) {
                return m.reply(
                    '❎ *a.mp4* não encontrado na raiz.\n\n' +
                    'Responda a um vídeo/imagem ou use `.postarstatus texto`.'
                )
            }
            m.reply('⏳ Enviando vídeo padrão (a.mp4)...')
            media = { video: fs.readFileSync(videoPath), mimetype: 'video/mp4' }
            type = 'video'
        }

        if (!media) return m.reply('❎ Falha ao processar mídia.')

        const result = await conn.sendMessage(
            'status@broadcast',
            { ...media, caption: '' },
            {
                statusJidList: jidList,
                broadcast: true
            }
        )

        console.log('[STATUS] Resultado:', JSON.stringify(result, null, 2))

        if (result && result.key && result.key.id) {
            console.log(`[STATUS] Sucesso! ID: ${result.key.id}`)
        } else {
            console.warn('[STATUS] O envio retornou um objeto inesperado:', result)
        }

        m.reply(
            `✅ *Status de ${type === 'video' ? 'vídeo' : 'imagem'} enviado!*\n` +
            `👥 Para: *${jidList.length}* contacto(s)\n\n` +
            instrucoes(conn)
        )

    } catch (error) {
        console.error('[POSTARSTATUS]', error)
        m.reply(`❎ *Erro ao postar status:* \`${error.message || error}\``)
    }
}

function buildJidList(conn, sender) {

    const contacts = Object.keys(conn.chats || {})
        .filter(jid => jid && jid.endsWith('@s.whatsapp.net'))

    const list = [...new Set([sender, ...contacts])]
        .filter(jid => jid !== 'status@broadcast')

    return list.length > 0 ? list : [sender]
}

function instrucoes(conn) {
    const botNum = (conn.user?.id || conn.user?.jid || '').split(':')[0].split('@')[0]
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
