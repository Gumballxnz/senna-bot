
import fg from 'fg-senna'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  if (!args[0]) throw `✳️ Insira un Link de Instagram`
  m.react(rwait)

  try {
    let data = await fg.igdl(args[0])
    if (data.result && data.result.length > 1) {
        // Galeria de imagens/videos, usar API
        for (let i of data.result) {
            await conn.sendFile(m.chat, i.url, 'instagram.mp4', `✅ Resultado`, m, null, fwc)
        }
        m.react(done)
    } else {
        // Video ou foto unica
        const TEMP_DIR = path.join(process.cwd(), 'tmp')
        if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
        const rawPath = path.join(TEMP_DIR, `ig_raw_${Date.now()}.mp4`)
        const finalPath = path.join(TEMP_DIR, `ig_${Date.now()}.mp4`)

        await execAsync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${args[0]}"`, { timeout: 120000 })
        if (!fs.existsSync(rawPath)) throw new Error("Erro yt-dlp")
        await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`, { timeout: 180000 })
        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)

        await conn.sendFile(m.chat, finalPath, 'ig.mp4', `✅ *Instagram (HD)*`, m, null, fwc)
        if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath)
        m.react(done)
    }
  } catch (error) {
    m.reply("error tente de novo mais tarde") 
  }
}
handler.help = ['instagram'].map(v => v + ' <url>')
handler.tags = ['dl']
handler.command = ['igdl', "instagramdl", "instagram"]
handler.diamond = true

export default handler
