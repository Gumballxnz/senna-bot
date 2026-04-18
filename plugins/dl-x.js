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

        if (!success) {
            let url = null;
            let descStr = '';
            const fetch = (await import('node-fetch')).default;
            
            // Camada 1: Siputzx
            let sp = await fetch(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(args[0])}`).then(v => v.json()).catch(() => null);
            url = sp?.data?.downloadLink || sp?.data?.video || sp?.data?.hd || sp?.data?.sd;
            descStr = sp?.data?.videoDescription || '';

            if (!url) {
                // Camada 2: Ryzendesu
                let rz = await fetch(`https://api.ryzendesu.vip/api/downloader/twitter?url=${encodeURIComponent(args[0])}`).then(v => v.json()).catch(() => null);
                url = rz?.url || rz?.data?.url || (rz?.data?.media && rz.data.media[0]?.url);
            }

            if (!url) {
                // Camada 3: fg-senna local
                let tw = await fg.twitter(args[0]).catch(() => null)
                url = tw?.HD || tw?.SD
                descStr = tw?.desc || ''
            }

            if (!url) throw new Error('Falha HTTP da API Twitter');

            let dl = await fetch(url)
            if (!dl.ok) throw new Error('Falha de status no fetch')
            const { pipeline } = await import('stream/promises')
            await pipeline(dl.body, fs.createWriteStream(rawPath))

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
            }
    
            if (!fs.existsSync(finalPath)) throw new Error('Erro na conversão FFmpeg API Twitter')

            let te = descStr ? `\n▢ *Desc:* ${descStr}` : '';
            await conn.sendFile(m.chat, finalPath, 'twitter.mp4', `✅ *Twitter/X (API)*${te}`, m, null, { asDocument: false })
            try { fs.unlinkSync(finalPath) } catch(e) {}
        }
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
