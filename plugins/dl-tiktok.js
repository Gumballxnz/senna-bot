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
        let success = false

        // Motor 1: fg-senna (API Direta e Rápida)
        let data = null
        try {
            data = await fg.tiktok(args[0])
        } catch (e) {
            console.error('TikTok fg.tiktok failed:', e.message)
        }

        if (data && data.result) {
            if (!data.result.images) {
                let texInfo = `
┌─⊷ *TIKTOK DL* 
▢ *Nombre:* ${data.result.author.nickname}
▢ *usuario:* ${data.result.author.unique_id}
▢ *Duracion:* ${data.result.duration}
▢ *Likes:* ${data.result.digg_count}
▢ *Vistas:* ${data.result.play_count}
▢ *Desc:* ${data.result.title}
└───────────
`
                if (data.result.play) {
                    await conn.sendFile(m.chat, data.result.play, 'tiktok.mp4', texInfo, m, null, fwc);
                    success = true
                }
            } else {
                let cap = `
▢ *Likes:* ${data.result.digg_count}
▢ *Desc:* ${data.result.title}
`
                for (let ttdl of data.result.images) {
                    conn.sendMessage(m.chat, { image: { url: ttdl }, caption: cap }, { quoted: m })
                }
                conn.sendFile(m.chat, data.result.play, 'tiktok.mp3', '', m, null, { mimetype: 'audio/mp4' })
                success = true
            }
        }

        // Motor 3: yt-dlp local (Fallback de alta qualidade)
        if (!success) {
            const TEMP_DIR = path.join(process.cwd(), 'tmp')
            if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
            const rawPath = path.join(TEMP_DIR, `tt_raw_${Date.now()}.mp4`)
            const finalPath = path.join(TEMP_DIR, `tt_${Date.now()}.mp4`)

            try {
                await execAsync(`yt-dlp -f "best[ext=mp4]/best" --merge-output-format mp4 -o "${rawPath}" "${args[0]}"`, { timeout: 120000 })
                if (fs.existsSync(rawPath)) {
                    await execAsync(`ffmpeg -i "${rawPath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart -y "${finalPath}"`, { timeout: 180000 })
                    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
                    if (fs.existsSync(finalPath)) {
                        await conn.sendFile(m.chat, finalPath, 'tiktok.mp4', `✅ *TikTok (HD)*`, m, null, fwc);
                        fs.unlinkSync(finalPath)
                        success = true
                    }
                }
            } catch (ee) {
                console.error('yt-dlp TikTok manual failed')
                if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
                if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath)
            }
        }

        if (success) {
            m.react(done)
        } else {
            m.react('❌')
            m.reply(`❎ Erro ao baixar TikTok`)
        }

    } catch (error) {
        m.react('❌')
        m.reply(`❎ Erro ao processar TikTok`)
    }
}

handler.help = ['tiktok']
handler.tags = ['dl']
handler.command = ['tiktok', 'tt', 'tiktokimg', 'tiktokslide']
handler.diamond = true

export default handler
