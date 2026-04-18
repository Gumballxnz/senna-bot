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

    let success = false
    try {
        await execAsync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${args[0]}"`, { timeout: 120000 })
        if (fs.existsSync(rawPath)) {
            await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`, { timeout: 180000 })
            if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
            if (fs.existsSync(finalPath)) {
                await conn.sendFile(m.chat, finalPath, 'fb.mp4', `✅ *Facebook (HD)*`, m, null, { asDocument: false })
                fs.unlinkSync(finalPath)
                success = true
            }
        }
    } catch (ee) {
        console.error('yt-dlp bloqueado no Facebook, ativando fallback tríplice')
    }

    if (!success) {
        let url = null;
        const fetch = (await import('node-fetch')).default;
        
        // Camada 1: Siputzx
        let sp = await fetch(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(args[0])}`).then(v => v.json()).catch(() => null);
        url = sp?.data?.url || sp?.data?.hd || sp?.data?.sd;

        if (!url) {
            // Camada 2: Ryzendesu
            let rz = await fetch(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(args[0])}`).then(v => v.json()).catch(() => null);
            url = rz?.url || rz?.data?.url || rz?.result?.url_hd || rz?.result?.url_sd;
        }

        if (!url) {
            import fg from 'fg-senna'
            let fgRes = await fg.fbdl(args[0]).catch(() => null);
            url = fgRes?.HD || fgRes?.SD;
        }

        if (!url) throw new Error('Links e APIs bloqueadas.');

        const filePath = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`)
        let dl = await fetch(url)
        if (!dl.ok) throw new Error('Falha HTTP da API')
        const { pipeline } = await import('stream/promises')
        await pipeline(dl.body, fs.createWriteStream(filePath))

        await conn.sendFile(m.chat, filePath, 'fb.mp4', `✅ *Facebook (API)*`, m, null, { asDocument: false })
        try { fs.unlinkSync(filePath) } catch(e) {}
    }
    m.react('✅')
  } catch (error) {
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
