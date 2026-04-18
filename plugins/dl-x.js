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
        const fetch = (await import('node-fetch')).default;

        let success = false
        
        // Camada 1: yt-dlp directo
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

        // Extrair ID do tweet para a VX Twitter API
        let tweetIdMatch = args[0].match(/\/status\/(\d+)/);
        let directUrl = null;
        let descStr = '';
        const fetch = (await import('node-fetch')).default;

        // Camada 1: VX Twitter API (Native Discord Embed proxy - 100% Rate Limit Free)
        if (!success && tweetIdMatch) {
            try {
                let id = tweetIdMatch[1];
                let vx = await fetch(`https://api.vxtwitter.com/Twitter/status/${id}`).then(v => v.json());
                
                if (vx && vx.media_extended && vx.media_extended.length > 0) {
                    // Pega o primeiro media que for video
                    let videoMedia = vx.media_extended.find(m => m.type === 'video');
                    if (videoMedia) directUrl = videoMedia.url;
                    descStr = vx.text || '';
                } else if (vx && vx.mediaURLs && vx.mediaURLs.length > 0) {
                    directUrl = vx.mediaURLs[0];
                    descStr = vx.text || '';
                }
                
                if (directUrl) {
                    let te = descStr ? `\n▢ *Desc:* ${descStr}` : '';
                    await conn.sendFile(m.chat, directUrl, 'twitter.mp4', `✅ *Twitter/X*${te}`, m, null, { asDocument: false })
                    success = true
                }
            } catch(e) {
                console.error('[Twitter Debug] vxTwitter falhou:', e.message)
            }
        }

        // Camada 2: fxTwitter API (Fallback do Fallback)
        if (!success && tweetIdMatch) {
            try {
                let id = tweetIdMatch[1];
                let fx = await fetch(`https://api.fxtwitter.com/Twitter/status/${id}`).then(v => v.json());
                
                let videoMedia = fx?.tweet?.media?.video;
                if (videoMedia && videoMedia.url) { directUrl = videoMedia.url; }
                descStr = fx?.tweet?.text || '';

                if (directUrl) {
                    let te = descStr ? `\n▢ *Desc:* ${descStr}` : '';
                    await conn.sendFile(m.chat, directUrl, 'twitter.mp4', `✅ *Twitter/X*${te}`, m, null, { asDocument: false })
                    success = true
                }
            } catch(e) {
                console.error('[Twitter Debug] fxTwitter falhou:', e.message)
            }
        }

        if (!success) throw new Error('Falha global nas engrenagens de bypass do Twitter.')

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
