 

import fg from 'fg-senna'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
let handler = async (m, { conn, text, args, usedPrefix, command }) => {
    
        if (!args[0]) throw `📌 Exemplo : ${usedPrefix + command} https://vm.tiktok.com/ZMYG92bUh/`
        if (!args[0].match(/tiktok/gi)) throw `❎ Revisa que el link sea de TikTok`
        m.react(rwait)
      
        try {
        
        let data = await fg.tiktok(args[0])

        if (!data.result.images) {
            let tex = `
┌─⊷ *TIKTOK DL* 
▢ *Nombre:* ${data.result.author.nickname}
▢ *usuario:* ${data.result.author.unique_id}
▢ *Duracion:* ${data.result.duration}
▢ *Likes:* ${data.result.digg_count}
▢ *Vistas:* ${data.result.play_count}
▢ *Desc:* ${data.result.title}
└───────────
`
            const TEMP_DIR = path.join(process.cwd(), 'tmp')
            if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
            const rawPath = path.join(TEMP_DIR, `tt_raw_${Date.now()}.mp4`)
            const finalPath = path.join(TEMP_DIR, `tt_${Date.now()}.mp4`)

            await execAsync(`yt-dlp -f "best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${args[0]}"`, { timeout: 120000 })
            if (!fs.existsSync(rawPath)) throw new Error("Erro yt-dlp")
            await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`, { timeout: 180000 })
            if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)

            await conn.sendFile(m.chat, finalPath, 'tiktok.mp4', tex, m, null, fwc);
            if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath)
            m.react(done)
        } else {
            let cap = `
▢ *Likes:* ${data.result.digg_count}
▢ *Desc:* ${data.result.title}
`
            for (let ttdl of data.result.images) {
                conn.sendMessage(m.chat, { image: { url: ttdl }, caption: cap }, { quoted: m })
            }
            conn.sendFile(m.chat, data.result.play, 'tiktok.mp3', '', m, null, { mimetype: 'audio/mp4' })
            m.react(done)
        }

      } catch (error) {
        m.reply(`❎ Erro`)
    }
   
}

handler.help = ['tiktok']
handler.tags = ['dl']
handler.command = ['tiktok', 'tt', 'tiktokimg', 'tiktokslide']
handler.diamond = true

export default handler
