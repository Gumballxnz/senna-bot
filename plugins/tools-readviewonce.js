
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

let handler = async (m, { conn }) => {
    let q = m.quoted ? m.quoted : m
    try {
        let viewOnceMsg = q.msg?.message?.imageMessage || 
                          q.msg?.message?.videoMessage || 
                          q.message?.imageMessage || 
                          q.message?.videoMessage || 
                          (q.msg && (q.msg.imageMessage || q.msg.videoMessage))
        
        let target = viewOnceMsg || q.msg || q
        let mime = target.mimetype || q.mimetype || q.mediaType || ''
        let media = null

        try {
            if (target.mediaKey) {
                const type = /image/g.test(mime) ? 'image' : /video/g.test(mime) ? 'video' : 'audio'
                const stream = await downloadContentFromMessage(target, type)
                let buffer = Buffer.from([])
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk])
                }
                media = buffer
            }
        } catch(e){}

        if (!media) media = await conn.downloadMediaMessage(target).catch(() => null) || await q.download?.().catch(() => null)
        if (!media) throw new Error('Não foi possível baixar o arquivo de visualização única.')

        let caption = q.text || target.caption || ''
        await conn.sendFile(m.chat, media, null, caption, m, null, fwc)
    } catch (e) {
        m.reply('✳️ Responda a uma mensagem de visualização única (View Once).')
    }
}
handler.help = ['readvo']
handler.tags = ['tools']
handler.command = ['readviewonce', 'read', 'ver', 'readvo', 'rvo'] 

export default handler
