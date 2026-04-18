import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  if (!args[0]) throw `✳️ Insira un Link de Facebook\n\n📌 Exemplo :\n*${usedPrefix + command}* https://fb.watch/d7nB8-L-gR/`
  m.react('⏳')

  try {
    const TEMP_DIR = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
    const rawPath = path.join(TEMP_DIR, `fb_raw_${Date.now()}.mp4`)
    const finalPath = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`)

    // Baixa com yt-dlp (assíncrono)
    await execAsync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${args[0]}"`, {
      timeout: 120000
    })

    if (!fs.existsSync(rawPath)) throw new Error('Arquivo não foi baixado.')

    // Copia o stream de vídeo (instantâneo) e transcodifica o áudio + movflags (compatível com WhatsApp)
    await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`, {
      timeout: 180000
    })

    // Limpa o arquivo bruto
    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)

    if (!fs.existsSync(finalPath)) throw new Error('Erro na transcodificação.')

    await conn.sendFile(m.chat, finalPath, 'fb.mp4', `✅ *Facebook DL*`, m, null, { asDocument: false })
    fs.unlinkSync(finalPath)
    m.react('✅')
  } catch (error) {
    console.error('Facebook DL Error:', error.message)
    m.react('❌')
    m.reply("❎ Erro ao baixar Facebook. Verifique se o link é público e tente novamente.")
  }
}
handler.help = ['facebook'].map(v => v + ' <url>')
handler.tags = ['dl']
handler.command = /^((facebook|fb)(downloder|dl)?)$/i
handler.diamond = true

export default handler
