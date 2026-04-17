import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  if (!args[0]) throw `✳️ Insira un Link de Facebook\n\n📌 Exemplo :\n*${usedPrefix + command}* https://fb.watch/d7nB8-L-gR/`
  m.react('⏳')

  try {
    const TEMP_DIR = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
    const filePath = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`)

    // Usa yt-dlp direto (não precisa de Chrome/Puppeteer)
    execSync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${filePath}" "${args[0]}"`, {
      timeout: 120000 // 2 minutos de timeout
    })

    if (!fs.existsSync(filePath)) throw new Error('Arquivo não foi baixado.')

    await conn.sendFile(m.chat, filePath, 'fb.mp4', `✅ *Facebook DL*`, m, null, { asDocument: false })
    fs.unlinkSync(filePath)
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
