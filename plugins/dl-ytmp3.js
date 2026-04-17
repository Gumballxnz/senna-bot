
import { downloadYT, getYTInfo } from '../lib/ytHelper.js'
import fs from 'fs'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args || !args[0]) throw `✳️ Exemplo :\n${usedPrefix + command} https://youtu.be/YzkTFFwxtXI`
    if (!args[0].match(/youtu/gi)) throw `❎ Insira um link do YouTube válido`

    let chat = global.db.data.chats[m.chat]
    m.react(rwait)

    try {
        // Obter informações do vídeo primeiro (opcional, para pegar o título real)
        let info = await getYTInfo(args[0]).catch(() => ({ title: 'audio' }))
        let title = info.title || 'audio'

        // Baixar usando yt-dlp
        let { filePath } = await downloadYT(args[0], 'audio')

        if (!fs.existsSync(filePath)) throw new Error('Falha ao baixar o arquivo')

        await conn.sendFile(
            m.chat,
            filePath,
            title + '.mp3',
            '',
            m,
            false,
            { mimetype: 'audio/mpeg', asDocument: chat?.useDocument }
        )

        // Limpar arquivo temporário após o envio
        fs.unlinkSync(filePath)
        m.react(done)

    } catch (e) {
        console.error('[ytmp3] Erro:', e.message || e)
        await m.reply(`❎ Erro ao baixar: ${e.message || 'Falha no processamento'}`)
    }
}

handler.help = ['ytmp3 <url>']
handler.tags = ['dl']
handler.command = ['ytmp3', 'fgmp3']
handler.diamond = false

export default handler