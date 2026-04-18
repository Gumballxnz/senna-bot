import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import fg from 'fg-senna'

const execAsync = promisify(exec)

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) throw `📌 Exemplo :\n*${usedPrefix + command}* https://twitter.com/fernandavasro/status/1569741835555291139?t=ADxk8P3Z3prq8USIZUqXCg&s=19`
    m.react('⏳')
    
    try {
        const TEMP_DIR = path.join(process.cwd(), 'tmp')
        if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
        const rawPath = path.join(TEMP_DIR, `tw_raw_${Date.now()}.mp4`)
        const finalPath = path.join(TEMP_DIR, `tw_${Date.now()}.mp4`)

        let success = false
        
        // Camada 1: yt-dlp directo (melhor qualidade)
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
                    await conn.sendFile(m.chat, finalPath, 'twitter.mp4', `✅ *Twitter/X (HD)*`, m, null, { asDocument: false })
                    fs.unlinkSync(finalPath)
                    success = true
                }
            }
        } catch (ee) {
            console.error('yt-dlp Twitter bloqueado, descendo para camada de APIs...')
        }

        // Camada 2: Siputzx — enviar URL directo ao Baileys (evita bloqueio CDN da Oracle)
        if (!success) {
            const fetch = (await import('node-fetch')).default;
            let descStr = '';
            let directUrl = null;
            
            try {
                let sp = await fetch(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(args[0])}`).then(v => v.json());
                directUrl = sp?.data?.downloadLink || sp?.data?.video || sp?.data?.hd || sp?.data?.sd;
                descStr = sp?.data?.videoDescription || '';
            } catch(e) {}

            if (directUrl) {
                // Enviando a URL directo para o Baileys fazer o download
                // (o WhatsApp baixa pelo próprio servidor, contornando bloqueio do CDN na Oracle)
                let te = descStr ? `\n▢ *Desc:* ${descStr}` : '';
                await conn.sendFile(m.chat, directUrl, 'twitter.mp4', `✅ *Twitter/X*${te}`, m, null, { asDocument: false })
                success = true
            }
        }

        // Camada 3: Ryzendesu — mesma estratégia de URL directo
        if (!success) {
            const fetch = (await import('node-fetch')).default;
            let directUrl = null;
            
            try {
                let rz = await fetch(`https://api.ryzendesu.vip/api/downloader/twitter?url=${encodeURIComponent(args[0])}`).then(v => v.json());
                directUrl = rz?.url || rz?.data?.url || (rz?.data?.media && rz.data.media[0]?.url);
            } catch(e) {}

            if (directUrl) {
                await conn.sendFile(m.chat, directUrl, 'twitter.mp4', `✅ *Twitter/X*`, m, null, { asDocument: false })
                success = true
            }
        }

        // Camada 4: fg-senna local
        if (!success) {
            try {
                let tw = await fg.twitter(args[0])
                let url = tw?.HD || tw?.SD
                if (url) {
                    await conn.sendFile(m.chat, url, 'twitter.mp4', `✅ *Twitter/X*`, m, null, { asDocument: false })
                    success = true
                }
            } catch(e) {}
        }

        if (!success) throw new Error('Todas as APIs do Twitter falharam.')

        m.react('✅')
    } catch (error) {
        console.error('Twitter DL Error:', error.message)
        m.react('❌')
        m.reply("❎ Erro ao baixar Twitter.")
    }
}
handler.help = ['twitter'].map(v => v + ' <url>')
handler.tags = ['dl']
handler.command = ['twitter', 'tw', 'x']
handler.diamond = true

export default handler
