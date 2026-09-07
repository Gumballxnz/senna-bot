import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  if (!args[0]) throw `✳️ Insira um Link do Facebook\n\n📌 Exemplo :\n*${usedPrefix + command}* https://fb.watch/d7nB8-L-gR/`
  m.react('⏳')

  const TEMP_DIR = path.join(process.cwd(), 'tmp')
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
  const rawPath = path.join(TEMP_DIR, `fb_raw_${Date.now()}.mp4`)
  const finalPath = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`)

  try {
    await execAsync(`yt-dlp -f "b[vcodec^=avc]/b[vcodec^=h264]/hd/sd/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best" --merge-output-format mp4 -o "${rawPath}" "${args[0]}"`, { timeout: 120000 })
    if (fs.existsSync(rawPath)) {
        let codec = 'h264'
        try {
            const { stdout } = await execAsync(`ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${rawPath}"`)
            if (stdout) codec = stdout.trim()
        } catch(e){}
        
        let ffmpegCmd = codec === 'h264' 
            ? `ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`
            : `ffmpeg -i "${rawPath}" -c:v libx264 -preset fast -crf 28 -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`

        await execAsync(ffmpegCmd, { timeout: 180000 })
        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
        if (fs.existsSync(finalPath)) {
            await conn.sendFile(m.chat, finalPath, 'fb.mp4', `✅ *Facebook (HD)*`, m, null, { asDocument: false })
            fs.unlinkSync(finalPath)
            m.react('✅')
            return
        }
    }
    throw new Error('Não foi possível baixar o Facebook.')
  } catch (error) {
    if (fs.existsSync(rawPath)) try { fs.unlinkSync(rawPath) } catch(_) {}
    if (fs.existsSync(finalPath)) try { fs.unlinkSync(finalPath) } catch(_) {}
    console.error('Facebook DL Error:', error.message)
    m.react('❌')
    m.reply("❎ Erro ao baixar Facebook \n\nVerifique se o link é público...")
  }
}
handler.help = ['facebook'].map(v => v + ' <url>')
handler.tags = ['dl']
handler.command = /^((facebook|fb)(downloder|dl)?)$/i
handler.diamond = true

export default handler
