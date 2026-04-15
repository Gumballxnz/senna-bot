
import { downloadYT, getYTInfo } from '../lib/ytHelper.js'
import fs from 'fs'

let free = 1000
let prem = 2000

let handler = async (m, { conn, args, usedPrefix, command, isPrems, isOwner }) => {
    if (!args || !args[0]) throw `✳️ Exemplo :\n${usedPrefix + command} https://youtu.be/YzkTFFwxtXI`
    if (!args[0].match(/youtu/gi)) throw `❎ Insira um link do YouTube válido`

    let chat = global.db.data.chats[m.chat]
    m.react(rwait)

    try {
        // Obter informações do vídeo
        let info = await getYTInfo(args[0]).catch(() => ({ title: 'video' }))
        let title = info.title || 'video'
        
        // Baixar usando yt-dlp
        let { filePath, size } = await downloadYT(args[0], 'video')

        if (!fs.existsSync(filePath)) throw new Error('Falha ao baixar o arquivo')

        let limit = isPrems || isOwner ? prem : free
        let isLimit = limit * 1024 * 1024 < size

        if (isLimit) {
            fs.unlinkSync(filePath)
            return m.reply(`❎ *FG YTDL*\n\n▢ *⚖️ Tamanho*: ${(size / (1024 * 1024)).toFixed(2)} MB\n▢ _Supera o limite de download_ *+${limit} MB*`)
        }

        await conn.sendFile(
            m.chat,
            filePath,
            title + '.mp4',
            `≡  *FG YTDL (yt-dlp)*\n\n*📌 Titulo:* ${title}\n*⚖️ Tamanho:* ${(size / (1024 * 1024)).toFixed(2)} MB`.trim(),
            m,
            false,
            { asDocument: chat?.useDocument }
        )

        // Limpar arquivo temporário após o envio
        fs.unlinkSync(filePath)
        m.react(done)

    } catch (e) {
        console.error('[ytmp4] Erro:', e.message || e)
        await m.reply(`❎ Erro ao baixar: ${e.message || 'Falha no processamento'}`)
    }
}

handler.help = ['ytmp4 <link yt>']
handler.tags = ['dl']
handler.command = ['ytmp4', 'fgmp4']
handler.diamond = false

export default handler